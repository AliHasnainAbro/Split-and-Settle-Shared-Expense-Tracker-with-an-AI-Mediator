import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabaseClient";
import { computeBalances } from "@/lib/balances";

const SYSTEM_PROMPT = `You are Sam, the mediator inside an app called Split & Settle that
helps roommates and friend groups track shared expenses fairly.

You will be given:
- the group's name
- each member's name, how much they've paid in total, their fair equal share,
  and their current balance (positive = the group owes them, negative = they owe the group)
- a recent log of individual expenses (description, amount, who paid)

Write a short message (under 130 words) that the group could actually copy and
send in their chat. It should:
1. Open with one friendly line, using first names, that states plainly who
   currently owes whom and how much (the biggest debtor to the biggest creditor
   is usually the clearest way to phrase it).
2. Add exactly one observation about the pattern in the expense log if there is
   a real one worth noting (for example, one person consistently covering a
   specific recurring cost). Only include this if it is actually true from the
   data — never invent a pattern.
3. End with one concrete, low-friction suggestion for closing the gap (e.g. a
   bank transfer amount, or "cover the next grocery run instead").

Rules:
- Never guilt-trip, scold, or use words like "unfair," "again," or "always" in
  an accusing way. Stay warm and neutral, like a considerate friend, not an
  accountant or a parent.
- Use exact numbers from the data given. Never estimate or round in a way that
  changes the amount owed.
- If every balance is within 0.01 of zero, congratulate the group on being
  settled up and skip the rest of the structure.
- Output plain text only. No markdown, no headers, no bullet points, no emoji.
- Keep it grounded only in the data provided. Do not assume facts you were not
  given (e.g. do not guess why someone hasn't paid).`;

export async function POST(req) {
  try {
    const { groupId } = await req.json();
    if (!groupId) {
      return Response.json({ error: "Missing groupId." }, { status: 400 });
    }

    const [{ data: group }, { data: members }, { data: expenses }] =
      await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).single(),
        supabase.from("members").select("*").eq("group_id", groupId),
        supabase
          .from("expenses")
          .select("*")
          .eq("group_id", groupId)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

    if (!group) {
      return Response.json({ error: "Group not found." }, { status: 404 });
    }

    const balances = computeBalances(members || [], expenses || []);
    const memberNameById = Object.fromEntries(
      (members || []).map((m) => [m.id, m.name])
    );

    const balanceSummary = balances
      .map(
        (b) =>
          `${b.name}: paid ${b.paid}, fair share ${b.fairShare}, balance ${b.balance}`
      )
      .join("\n");

    const expenseSummary = (expenses || [])
      .map(
        (e) =>
          `- ${e.description}: ${e.amount} paid by ${
            memberNameById[e.paid_by] || "unknown"
          }`
      )
      .join("\n");

    const userContent = `Group: ${group.name}

Balances:
${balanceSummary || "No members yet."}

Recent expenses:
${expenseSummary || "No expenses logged yet."}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const message = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return Response.json({ message });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "The mediator ran into a problem. Please try again." },
      { status: 500 }
    );
  }
}

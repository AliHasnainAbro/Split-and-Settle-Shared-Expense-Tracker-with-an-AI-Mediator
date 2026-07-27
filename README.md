# Split & Settle

A shared-expense tracker for roommates and friend groups — with an AI mediator that writes the awkward "hey, you owe me money" message for you.

## a. The problem

Anyone who has shared a flat, a hostel room, or a trip with friends knows the pattern: someone covers the wifi, someone else buys groceries, a third person pays the electricity bill — and within a few weeks nobody actually remembers who owes whom. Worse, the person who's owed money usually has to be the one to bring it up, which is awkward and can strain the friendship.

**Split & Settle** solves this for small groups (roommates, hostel-mates, trip buddies) by:
1. Giving the group one shared, no-login group page (just a 6-character code) to log every shared expense.
2. Automatically calculating who has overpaid and who owes what, assuming an equal split.
3. Using an AI mediator to turn that math into a short, fair, non-confrontational message that someone can literally copy and paste into the group chat — so no one has to be "that person" who brings up money.

## b. Live URL

**<a href="[https://split-and-settle-expense-tracker.vercel.app/]" target="_blank" rel="noopener noreferrer">Split and Settle</a>**

## c. Features

- **Create a group** in one step — just a group name and your own name.
- **Join a group** from any device using its 6-character code (no account needed, like a shared link).
- **Add members** to a group at any time.
- **Log expenses** — description, amount, and who paid.
- **Live balance sheet** — shows each member's total paid, fair equal share, and running balance (owed / owes / settled).
- **Expense log** — a running, timestamped list of everything logged, and who paid for it.
- **AI Mediator** — one click generates a short, ready-to-send settlement message based on the group's actual numbers (see below).

## d. The AI feature

**What it does:** the "Ask the mediator" button sends the group's current balances and recent expense log to Claude, which writes a short (under 130 words), plain-text message that:
1. States clearly who currently owes whom, and how much, using first names.
2. Notes one real pattern in the spending, if one genuinely exists (e.g. one person consistently covering the same recurring bill) — it's instructed never to invent a pattern that isn't in the data.
3. Suggests one concrete, low-friction way to close the gap (a transfer amount, or covering the next shared cost instead).

It's deliberately instructed to stay warm and neutral rather than accusatory — no guilt-tripping, no "you always," no emoji, no markdown — because the whole point is to remove friction from the conversation, not add to it.

**The exact system prompt** (in [`app/api/mediate/route.js`](app/api/mediate/route.js)):

```
You are Sam, the mediator inside an app called Split & Settle that
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
  given (e.g. do not guess why someone hasn't paid).
```

## e. Tools, services, and models used

- **Framework:** Next.js 14 (App Router), React 18
- **Database:** Supabase (Postgres) — stores groups, members, and expenses
- **AI model:** Claude (`claude-sonnet-4-6`) via the Anthropic API / `@anthropic-ai/sdk`
- **Hosting:** Vercel
- **Styling:** hand-written CSS (no UI framework) — a "paper ledger / receipt" visual identity built for this project
- **Fonts:** Spectral (display), Inter (body), JetBrains Mono (numbers) via Google Fonts

## f. Screenshots

> Replace these with real screenshots (drag image files into `/screenshots` and update the paths below) before submitting. Take at least 3: the home page, a group with expenses logged, and the AI mediator message.

![Home page](screenshots/home.png)
![Group dashboard with balances](screenshots/group-dashboard.png)
![AI mediator message](screenshots/mediator.png)

## g. How to run the project

### 1. Clone and install

```bash
git clone https://github.com/your-username/split-and-settle.git
cd split-and-settle
npm install
```

### 2. Set up Supabase (free)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the entire contents of [`supabase-schema.sql`](supabase-schema.sql) — this creates the `groups`, `members`, and `expenses` tables.
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**.

### 3. Get an Anthropic API key

Create a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase URL, Supabase anon key, and Anthropic API key.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy to Vercel

1. Push this repo to your own public GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the Vercel project's **Environment Variables** settings, add the same three variables from `.env.local`.
4. Deploy. Vercel will give you a public URL — put that in section **b** above.

## Known limitations / possible next steps

- Expenses are split **equally** across all current members only — no partial/custom splits yet.
- No authentication — anyone with the group code can view and add to it, which is intentional for this use case (like a shared link) but wouldn't be appropriate for a production app with sensitive data.
- No editing/deleting of past expenses yet.

## License

MIT — see [LICENSE](LICENSE).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function Home() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [firstMember, setFirstMember] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!groupName.trim() || !firstMember.trim()) return;
    setBusy(true);
    setError("");
    try {
      const code = generateCode();
      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .insert({ name: groupName.trim(), code })
        .select()
        .single();
      if (groupErr) throw groupErr;

      const { error: memberErr } = await supabase
        .from("members")
        .insert({ group_id: group.id, name: firstMember.trim() });
      if (memberErr) throw memberErr;

      router.push(`/group/${code}`);
    } catch (err) {
      setError(err.message || "Could not create the group. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setBusy(true);
    setError("");
    try {
      const code = joinCode.trim().toUpperCase();
      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .select("code")
        .eq("code", code)
        .single();
      if (groupErr || !group) {
        setError("No group found with that code. Check it and try again.");
        setBusy(false);
        return;
      }
      router.push(`/group/${code}`);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="eyebrow">split &amp; settle</div>
      <h1 className="title">Shared costs, settled without the awkward text.</h1>
      <p className="subtitle">
        Log what everyone paid for rent, groceries, and bills — then let the
        mediator write the reminder message for you, fairly and diplomatically.
      </p>

      <div className="receipt">
        <div className="section-label">Start a new group</div>
        <form onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="groupName">Group name</label>
            <input
              id="groupName"
              placeholder="e.g. Flat 4B, DHA"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="firstMember">Your name</label>
            <input
              id="firstMember"
              placeholder="e.g. Ayesha"
              value={firstMember}
              onChange={(e) => setFirstMember(e.target.value)}
            />
          </div>
          <button className="primary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create group"}
          </button>
        </form>
      </div>

      <div className="receipt">
        <div className="section-label">Join an existing group</div>
        <form onSubmit={handleJoin}>
          <div className="field">
            <label htmlFor="joinCode">Group code</label>
            <input
              id="joinCode"
              placeholder="e.g. 7K2N9P"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
          </div>
          <button className="ghost" type="submit" disabled={busy}>
            {busy ? "Checking…" : "Join group"}
          </button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}

      <p className="footer-note">
        No account needed — anyone with the group code can view and add
        expenses, like a shared link.
      </p>
    </div>
  );
}

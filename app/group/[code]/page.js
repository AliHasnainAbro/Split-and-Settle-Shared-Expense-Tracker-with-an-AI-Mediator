"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { computeBalances } from "@/lib/balances";

export default function GroupPage({ params }) {
  const code = params.code.toUpperCase();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  const [mediatorText, setMediatorText] = useState("");
  const [mediatorLoading, setMediatorLoading] = useState(false);
  const [mediatorError, setMediatorError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    const { data: groupData, error: groupErr } = await supabase
      .from("groups")
      .select("*")
      .eq("code", code)
      .single();

    if (groupErr || !groupData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setGroup(groupData);

    const [{ data: memberData }, { data: expenseData }] = await Promise.all([
      supabase
        .from("members")
        .select("*")
        .eq("group_id", groupData.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("expenses")
        .select("*")
        .eq("group_id", groupData.id)
        .order("created_at", { ascending: false }),
    ]);

    setMembers(memberData || []);
    setExpenses(expenseData || []);
    if ((memberData || []).length > 0 && !paidBy) {
      setPaidBy(memberData[0].id);
    }
    setLoading(false);
  }, [code, paidBy]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleAddMember(e) {
    e.preventDefault();
    if (!newMemberName.trim() || !group) return;
    setSavingMember(true);
    setError("");
    const { error: err } = await supabase
      .from("members")
      .insert({ group_id: group.id, name: newMemberName.trim() });
    if (err) setError(err.message);
    setNewMemberName("");
    setSavingMember(false);
    loadData();
  }

  async function handleAddExpense(e) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!desc.trim() || !amountNum || amountNum <= 0 || !paidBy || !group) return;
    setSavingExpense(true);
    setError("");
    const { error: err } = await supabase.from("expenses").insert({
      group_id: group.id,
      description: desc.trim(),
      amount: amountNum,
      paid_by: paidBy,
    });
    if (err) setError(err.message);
    setDesc("");
    setAmount("");
    setSavingExpense(false);
    loadData();
  }

  async function handleAskMediator() {
    setMediatorLoading(true);
    setMediatorError("");
    setMediatorText("");
    try {
      const res = await fetch("/api/mediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The mediator couldn't respond.");
      setMediatorText(data.message);
    } catch (err) {
      setMediatorError(err.message);
    } finally {
      setMediatorLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="wrap">
        <p>Loading group…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="wrap">
        <div className="eyebrow">split &amp; settle</div>
        <h1 className="title">No group found</h1>
        <p className="subtitle">
          The code &ldquo;{code}&rdquo; doesn&apos;t match any group.{" "}
          <a href="/">Go back and create or join one.</a>
        </p>
      </div>
    );
  }

  const balances = computeBalances(members, expenses);

  return (
    <div className="wrap">
      <div className="eyebrow">split &amp; settle</div>
      <h1 className="title">{group.name}</h1>
      <p className="subtitle">
        Group code <span className="code-pill">{code}</span> — share it so
        others can join.
      </p>

      <div className="receipt">
        <div className="section-label">Balances</div>
        {balances.length === 0 && (
          <p className="subtitle" style={{ margin: 0 }}>
            Add members to start tracking balances.
          </p>
        )}
        {balances.map((b) => (
          <div className="ledger-line" key={b.id}>
            <span className="ledger-name">{b.name}</span>
            <span
              className={
                b.balance > 0.01
                  ? "balance-owed mono"
                  : b.balance < -0.01
                  ? "balance-owes mono"
                  : "balance-even mono"
              }
            >
              {b.balance > 0.01
                ? `is owed ${b.balance.toFixed(2)}`
                : b.balance < -0.01
                ? `owes ${Math.abs(b.balance).toFixed(2)}`
                : "settled up"}
            </span>
          </div>
        ))}
      </div>

      <div className="receipt">
        <div className="section-label">Add a member</div>
        <form onSubmit={handleAddMember} className="row">
          <input
            placeholder="Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
          />
          <button className="ghost" type="submit" disabled={savingMember}>
            {savingMember ? "Adding…" : "Add"}
          </button>
        </form>
      </div>

      <div className="receipt">
        <div className="section-label">Log an expense</div>
        <form onSubmit={handleAddExpense}>
          <div className="field">
            <label htmlFor="desc">What was it for?</label>
            <input
              id="desc"
              placeholder="e.g. Electricity bill"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="paidBy">Paid by</label>
              <select
                id="paidBy"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="primary"
            type="submit"
            disabled={savingExpense || members.length === 0}
          >
            {savingExpense ? "Saving…" : "Add expense"}
          </button>
        </form>
      </div>

      <div className="receipt">
        <div className="section-label">Expense log</div>
        {expenses.length === 0 && (
          <p className="subtitle" style={{ margin: 0 }}>
            No expenses yet.
          </p>
        )}
        {expenses.map((e) => {
          const payer = members.find((m) => m.id === e.paid_by);
          return (
            <div className="expense-row" key={e.id}>
              <span>
                {e.description}
                <br />
                <span className="expense-meta">
                  paid by {payer ? payer.name : "someone who left the group"}
                </span>
              </span>
              <span className="mono">{Number(e.amount).toFixed(2)}</span>
            </div>
          );
        })}
      </div>

      <div className="receipt">
        <div className="section-label">Ask the mediator</div>
        <p className="subtitle" style={{ margin: "0 0 16px" }}>
          Generates a short, fair message you can actually send to the group.
        </p>
        <button
          className="primary"
          onClick={handleAskMediator}
          disabled={mediatorLoading || expenses.length === 0}
        >
          {mediatorLoading ? "Thinking…" : "Get a settlement message"}
        </button>
        {mediatorError && <p className="error-text">{mediatorError}</p>}
        {mediatorText && (
          <div className="mediator-box" style={{ marginTop: 16 }}>
            {mediatorText}
          </div>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

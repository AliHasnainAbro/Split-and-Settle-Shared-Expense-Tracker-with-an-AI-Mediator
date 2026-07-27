// Equal-split balance calculator.
// Every expense is assumed to be split evenly across all current group members.
// balance > 0  -> this person is owed money by the group
// balance < 0  -> this person owes money to the group
export function computeBalances(members, expenses) {
  const memberCount = members.length || 1;
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const fairShare = totalSpend / memberCount;

  const paidByMember = {};
  members.forEach((m) => {
    paidByMember[m.id] = 0;
  });
  expenses.forEach((e) => {
    if (paidByMember[e.paid_by] === undefined) return;
    paidByMember[e.paid_by] += Number(e.amount);
  });

  return members.map((m) => ({
    id: m.id,
    name: m.name,
    paid: Number(paidByMember[m.id].toFixed(2)),
    fairShare: Number(fairShare.toFixed(2)),
    balance: Number((paidByMember[m.id] - fairShare).toFixed(2)),
  }));
}

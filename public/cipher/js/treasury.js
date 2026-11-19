/* CIPHER — Treasury: ledger, accounts, recurring commitments, reserves (savings goals) and budgets. */
(() => {
  "use strict";
  const { esc, today, addDays, addMonths, daysBetween, fmtDate, MONTHS, sum, uid } = CX;

  const EXP = ["Housing", "Groceries", "Dining", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Subscriptions", "Travel", "Education", "Gifts", "Insurance", "Personal care", "Other"];
  const INC = ["Salary", "Freelance", "Business", "Investment", "Interest", "Gift", "Refund", "Other income"];
  const ACC_TYPES = ["Bank", "Card", "Cash", "Wallet", "Investment", "Loan", "Other"];
  const CYCLES = [["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["yearly", "Yearly"]];
  const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  CX.EXP_CATS = EXP;

  Object.assign(CX.ui, { trTab: "overview", trMonth: today().slice(0, 7), lMonth: today().slice(0, 7), lType: "all", lCat: "all", lAcct: "all", lQ: "" });

  const money = (n, o) => CX.money(n, o);
  const real = (arr) => arr.filter((t) => t.type !== "transfer");
  const inMonth = (m) => CX.S.txns.filter((t) => t.date.startsWith(m));
  CX.monthTotals = (m) => {
    const tx = real(inMonth(m));
    const income = sum(tx.filter((t) => t.type === "income")), expense = sum(tx.filter((t) => t.type === "expense"));
    return { income, expense, net: income - expense };
  };
  CX.catSpend = (m) => {
    const c = {};
    inMonth(m).filter((t) => t.type === "expense").forEach((t) => { c[t.category] = (c[t.category] || 0) + Number(t.amount); });
    return c;
  };
  CX.overBudget = (m) => { const c = CX.catSpend(m), b = CX.S.settings.catBudgets; return Object.keys(b).filter((k) => Number(b[k]) > 0 && (c[k] || 0) > Number(b[k])); };
  CX.balance = (a) => CX.S.txns.reduce((bal, t) => {
    const v = Number(t.amount) || 0;
    if (t.type === "transfer") { if (t.account === a.id) bal -= v; if (t.toAccount === a.id) bal += v; }
    else if (t.account === a.id) bal += t.type === "income" ? v : -v;
    return bal;
  }, Number(a.opening) || 0);
  CX.netWorth = () => CX.S.accounts.filter((a) => !a.archived).reduce((s, a) => s + CX.balance(a), 0);
  CX.billsDue = (days) => CX.S.recurring.filter((r) => r.active && r.nextDate && daysBetween(today(), r.nextDate) <= days).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const acctName = (id) => CX.find("accounts", id)?.name || "";
  const nextDate = (d, cycle) => (cycle === "weekly" ? addDays(d, 7) : addMonths(d, cycle === "quarterly" ? 3 : cycle === "yearly" ? 12 : 1));

  CX.calendar.push((day) => CX.S.recurring.filter((r) => r.active && r.nextDate === day).map((r) => ({
    kind: "bill", label: `${r.name} · ${money(r.amount)}`, tag: r.type === "income" ? "Income" : "Payment", color: r.type === "income" ? "var(--green)" : "var(--blue)", act: "edit-recurring", id: r.id,
  })));
  CX.searchers.push((q) => [
    ...CX.S.txns.filter((t) => CX.match(q, t.payee, t.category, t.tags)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((t) => ({
      kind: "Transaction", label: `${t.payee || t.category} · ${money(t.amount)}`, sub: `${fmtDate(t.date, { day: "numeric", month: "short", year: "numeric" })} · ${t.category}`, run: () => { location.hash = "treasury"; CX.actions["edit-txn"](t.id); },
    })),
    ...CX.S.accounts.filter((a) => CX.match(q, a.name, a.type)).map((a) => ({ kind: "Account", label: a.name, sub: money(CX.balance(a)), run: () => { location.hash = "treasury"; CX.ui.trTab = "accounts"; CX.render(); } })),
    ...CX.S.recurring.filter((r) => CX.match(q, r.name, r.category)).map((r) => ({ kind: "Recurring", label: r.name, sub: `${money(r.amount)} · next ${fmtDate(r.nextDate)}`, run: () => { location.hash = "treasury"; CX.actions["edit-recurring"](r.id); } })),
    ...CX.S.reserves.filter((r) => CX.match(q, r.name, r.notes)).map((r) => ({ kind: "Reserve", label: r.name, sub: `${money(r.saved)} of ${money(r.target)}`, run: () => { location.hash = "treasury"; CX.ui.trTab = "reserves"; CX.render(); } })),
  ]);

  // ---------- Forms ----------
  const acctOpts = (blank = "— None —") => [["", blank], ...CX.S.accounts.filter((a) => !a.archived).map((a) => [a.id, a.name])];
  const txnFields = () => [
    { key: "type", label: "Type", type: "select", options: [["expense", "Expense"], ["income", "Income"], ["transfer", "Transfer between accounts"]], half: true, default: "expense" },
    { key: "amount", label: `Amount (${CX.S.settings.currency})`, type: "number", min: 0, required: true, half: true },
    { key: "payee", label: "Detail / payee", placeholder: "e.g. Supermarket", half: true },
    { key: "date", label: "Date", type: "date", required: true, half: true, default: today },
    { key: "category", label: "Category", list: [...EXP, ...INC], half: true, default: "Groceries", placeholder: "Pick or type your own" },
    { key: "tags", label: "Tags", half: true, placeholder: "e.g. trip, reimbursable" },
    { key: "account", label: "Account", type: "select", options: acctOpts(), half: true },
    { key: "toAccount", label: "To account", type: "select", options: acctOpts("—"), half: true, hint: "Transfers only" },
  ];
  const editTxn = (rec, defaults) => CX.edit("txns", txnFields, rec, {
    noun: "transaction", newTitle: "Record transaction", titleKey: "payee", defaults,
    transform: (d) => { if (d.type !== "transfer") d.toAccount = ""; if (!d.category) d.category = d.type === "income" ? "Other income" : "Other"; return d; },
  });
  const acctFields = () => [
    { key: "name", label: "Account name", required: true, placeholder: "e.g. Salary account" },
    { key: "type", label: "Type", type: "select", options: ACC_TYPES, half: true, default: "Bank" },
    { key: "opening", label: `Opening balance (${CX.S.settings.currency})`, type: "number", half: true, default: 0, hint: "Use a negative number for debt" },
    { key: "notes", label: "Notes", type: "textarea", rows: 2 },
    { key: "archived", label: "Archived", type: "checkbox", text: "Archive (hide from net worth)" },
  ];
  const recFields = () => [
    { key: "name", label: "Name", required: true, placeholder: "e.g. Rent, Netflix, Salary" },
    { key: "type", label: "Type", type: "select", options: [["expense", "Payment"], ["income", "Income"]], half: true, default: "expense" },
    { key: "amount", label: `Amount (${CX.S.settings.currency})`, type: "number", min: 0, required: true, half: true },
    { key: "cycle", label: "Cycle", type: "select", options: CYCLES, half: true, default: "monthly" },
    { key: "nextDate", label: "Next due", type: "date", required: true, half: true, default: today },
    { key: "category", label: "Category", list: [...EXP, ...INC], half: true, default: "Subscriptions" },
    { key: "account", label: "Account", type: "select", options: acctOpts(), half: true },
    { key: "notes", label: "Notes", type: "textarea", rows: 2 },
    { key: "active", label: "Active", type: "checkbox", text: "Active", default: true },
  ];
  const resFields = () => [
    { key: "name", label: "Reserve", required: true, placeholder: "e.g. Emergency fund" },
    { key: "target", label: `Target (${CX.S.settings.currency})`, type: "number", min: 0, required: true, half: true },
    { key: "saved", label: "Saved so far", type: "number", min: 0, half: true, default: 0 },
    { key: "deadline", label: "Target date", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", rows: 2 },
  ];

  // ---------- Tabs ----------
  function overview() {
    const m = CX.ui.trMonth;
    const [y, mo] = m.split("-").map(Number);
    const { income, expense, net } = CX.monthTotals(m);
    const budget = Number(CX.S.settings.budget) || 0;
    const rate = income ? Math.round((net / income) * 100) : 0;
    const cats = Object.entries(CX.catSpend(m)).sort((a, b) => b[1] - a[1]);
    const max = cats[0]?.[1] || 1;
    const cb = CX.S.settings.catBudgets;
    const months = Array.from({ length: 6 }, (_, i) => CX.shiftMonth(m, i - 5));
    const tot = months.map((x) => ({ x, ...CX.monthTotals(x) }));
    const tmax = Math.max(1, ...tot.map((t) => Math.max(t.income, t.expense)));
    const top = inMonth(m).filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5);
    const bills = CX.billsDue(30);
    const accts = CX.S.accounts.filter((a) => !a.archived);
    return `
      <div class="cal-head" style="margin-bottom:16px">
        <div class="month-nav"><button class="btn sm" data-act="tr-month" data-id="-1" aria-label="Previous month">‹</button><span>${MONTHS[mo - 1]} ${y}</span><button class="btn sm" data-act="tr-month" data-id="1" aria-label="Next month">›</button></div>
      </div>
      <div class="grid g5 stats" style="margin-bottom:18px">
        ${CX.stat("Income", money(income), "", "green-t")}
        ${CX.stat("Expenditure", money(expense))}
        ${CX.stat("Net position", money(net), "", net < 0 ? "red-t" : "")}
        ${CX.stat("Savings rate", income ? rate + "%" : "—", rate >= 20 ? "Healthy" : income ? "Aim for 20%+" : "", rate < 0 ? "red-t" : "")}
        <div class="panel stat"><div class="mono dim tiny">Budget remaining</div><div class="val ${budget - expense < 0 ? "red-t" : ""}">${budget ? money(budget - expense) : "—"}</div>${budget ? `<div style="margin-top:10px">${CX.bar((expense / budget) * 100, expense > budget ? "over" : "")}</div>` : `<div class="sub">Set one under Budgets</div>`}</div>
      </div>
      <div class="grid g2">
        ${CX.panel("Spending by category", cats.length ? cats.map(([c, v]) => {
          const b = Number(cb[c]) || 0;
          return `<div class="cat-row"><span>${esc(c)}</span><div>${CX.bar(b ? (v / b) * 100 : (v / max) * 100, b && v > b ? "over" : b ? "" : "plain")}</div><span class="amt">${money(v)}${b ? `<span class="faint"> / ${money(b)}</span>` : ""}</span></div>`;
        }).join("") : CX.empty("No expenditure this month."), `<a class="mono tiny link" href="#" data-act="tab" data-id="trTab:budgets">Budgets →</a>`)}
        ${CX.panel("Six-month trend", `
          <div class="trend">${tot.map((t) => `<div class="tcol ${t.x === m ? "cur" : ""}" title="${MONTHS[Number(t.x.slice(5)) - 1]}: in ${money(t.income)}, out ${money(t.expense)}">
            <div class="tbars"><i class="ti" style="height:${(t.income / tmax) * 100}%"></i><i class="te" style="height:${(t.expense / tmax) * 100}%"></i></div>
            <div class="mono tiny dim">${MONTHS[Number(t.x.slice(5)) - 1].slice(0, 3)}</div></div>`).join("")}</div>
          <div class="hm-legend mono tiny dim"><i class="sw ti"></i> Income <i class="sw te"></i> Expenditure</div>`)}
        ${CX.panel("Upcoming commitments", bills.length ? `<div class="list">${bills.map((r) => `
          <div class="row clickable" data-act="edit-recurring" data-id="${r.id}"><div class="when ${r.nextDate < today() ? "red-t" : ""}">${fmtDate(r.nextDate)}</div><div class="grow"><div class="title">${esc(r.name)}</div><div class="meta">${CX.relDays(r.nextDate)} · ${esc(r.category)}</div></div><span class="amt-s ${r.type === "income" ? "green-t" : ""}">${money(r.amount, { sign: r.type === "income" })}</span></div>`).join("")}</div>` : CX.empty("Nothing due in the next 30 days."), `<span class="mono tiny dim">30 days</span>`)}
        ${CX.panel("Accounts", accts.length ? `<div class="list">${accts.map((a) => `<div class="row"><div class="grow"><div class="title">${esc(a.name)}</div><div class="meta">${esc(a.type)}</div></div><span class="amt-s ${CX.balance(a) < 0 ? "red-t" : ""}">${money(CX.balance(a))}</span></div>`).join("")}<div class="row total"><div class="grow mono tiny">Net worth</div><span class="amt-s gold-t">${money(CX.netWorth())}</span></div></div>` : CX.empty("No accounts yet."), `<a class="mono tiny link" href="#" data-act="tab" data-id="trTab:accounts">Manage →</a>`)}
        ${CX.panel("Largest expenses", top.length ? `<div class="list">${top.map((t) => `<div class="row clickable" data-act="edit-txn" data-id="${t.id}"><div class="when">${fmtDate(t.date)}</div><div class="grow"><div class="title">${esc(t.payee || t.category)}</div><div class="meta">${esc(t.category)}</div></div><span class="amt-s">${money(t.amount)}</span></div>`).join("")}</div>` : CX.empty("None this month."))}
        ${CX.panel("Reserves", CX.S.reserves.length ? CX.S.reserves.map((r) => `<div class="res-mini"><div class="kv"><span>${esc(r.name)}</span><b>${Math.round((r.saved / (r.target || 1)) * 100)}%</b></div>${CX.bar((r.saved / (r.target || 1)) * 100)}</div>`).join("") : CX.empty("No savings goals."), `<a class="mono tiny link" href="#" data-act="tab" data-id="trTab:reserves">All reserves →</a>`)}
      </div>`;
  }

  function ledgerRows() {
    const u = CX.ui, q = (u.lQ || "").toLowerCase();
    return CX.S.txns.filter((t) => (u.lMonth === "all" || t.date.startsWith(u.lMonth)) && (u.lType === "all" || t.type === u.lType) && (u.lCat === "all" || t.category === u.lCat)
      && (u.lAcct === "all" || t.account === u.lAcct || t.toAccount === u.lAcct) && (!q || CX.match(q, t.payee, t.category, t.tags, String(t.amount))))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  function ledger() {
    const rows = ledgerRows();
    const months = [...new Set([CX.ui.lMonth, today().slice(0, 7), ...CX.S.txns.map((t) => t.date.slice(0, 7))])].filter((x) => x !== "all").sort().reverse();
    const cats = [...new Set(CX.S.txns.map((t) => t.category))].sort();
    const inc = sum(rows.filter((t) => t.type === "income")), exp = sum(rows.filter((t) => t.type === "expense"));
    return `
      <div class="toolbar">
        <div class="filters">
          ${CX.uiSearch("lQ", "Search detail, tag, amount…")}
          ${CX.uiSelect("lMonth", [["all", "All months"], ...months.map((x) => [x, `${MONTHS[Number(x.slice(5)) - 1]} ${x.slice(0, 4)}`])], "Month")}
          ${CX.uiSelect("lType", [["all", "All types"], ["expense", "Expenses"], ["income", "Income"], ["transfer", "Transfers"]], "Type")}
          ${CX.uiSelect("lCat", [["all", "All categories"], ...cats], "Category")}
          ${CX.uiSelect("lAcct", [["all", "All accounts"], ...CX.S.accounts.map((a) => [a.id, a.name])], "Account")}
        </div>
        <button class="btn sm" data-act="export-csv">Export CSV</button>
      </div>
      <div class="panel">
        <div class="panel-head"><h2>Ledger</h2><span class="mono tiny dim">${rows.length} entries · <span class="green-t">${money(inc)}</span> in · ${money(exp)} out</span></div>
        ${rows.length ? `<div style="overflow-x:auto"><table>
          <thead><tr><th>Date</th><th>Detail</th><th class="hide-sm">Category</th><th class="hide-sm">Account</th><th class="amt">Amount</th></tr></thead>
          <tbody>${rows.slice(0, 400).map((t) => `
            <tr class="clickable" data-act="edit-txn" data-id="${t.id}">
              <td class="mono tiny dim nowrap">${fmtDate(t.date, { day: "numeric", month: "short", year: "2-digit" })}</td>
              <td><span class="title">${esc(t.payee || t.category)}</span>${t.tags ? `<div class="tags">${t.tags.split(",").map((x) => x.trim()).filter(Boolean).map((x) => `<span class="badge">${esc(x)}</span>`).join("")}</div>` : ""}</td>
              <td class="hide-sm dim">${esc(t.category)}</td>
              <td class="hide-sm dim">${t.type === "transfer" ? `${esc(acctName(t.account))} → ${esc(acctName(t.toAccount))}` : esc(acctName(t.account))}</td>
              <td class="amt ${t.type === "income" ? "green-t" : t.type === "transfer" ? "dim" : ""}">${t.type === "income" ? "+" : t.type === "transfer" ? "⇄ " : "−"}${money(t.amount)}</td>
            </tr>`).join("")}</tbody></table></div>` : CX.empty("No transactions match these filters.")}
      </div>`;
  }

  function accounts() {
    const list = CX.S.accounts;
    const assets = list.filter((a) => !a.archived && CX.balance(a) >= 0).reduce((s, a) => s + CX.balance(a), 0);
    const debt = list.filter((a) => !a.archived && CX.balance(a) < 0).reduce((s, a) => s + CX.balance(a), 0);
    return `
      <div class="grid g3 stats" style="margin-bottom:18px">
        ${CX.stat("Net worth", money(CX.netWorth()), "assets minus debt", "gold-t")}
        ${CX.stat("Assets", money(assets), "", "green-t")}
        ${CX.stat("Debt", money(debt), "", debt < 0 ? "red-t" : "")}
      </div>
      <div class="people">${list.map((a) => {
        const bal = CX.balance(a);
        const n = CX.S.txns.filter((t) => t.account === a.id || t.toAccount === a.id).length;
        return `<button type="button" class="panel acct ${a.archived ? "closed" : ""}" data-act="edit-account" data-id="${a.id}">
          <div class="mono tiny dim">${esc(a.type)}${a.archived ? " · archived" : ""}</div>
          <div class="pname" style="margin:6px 0 10px">${esc(a.name)}</div>
          <div class="val serif ${bal < 0 ? "red-t" : ""}" style="font-size:28px">${money(bal)}</div>
          <div class="meta dim" style="font-size:12px;margin-top:4px">${n} transaction${n === 1 ? "" : "s"} · opened at ${money(a.opening)}</div>
        </button>`;
      }).join("") || `<div class="panel" style="grid-column:1/-1">${CX.empty("Add your bank accounts, cards and cash to track balances and net worth.")}</div>`}</div>`;
  }

  function recurring() {
    const list = CX.S.recurring.slice().sort((a, b) => (b.active - a.active) || a.nextDate.localeCompare(b.nextDate));
    const act = list.filter((r) => r.active);
    const monthlyOut = act.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount * PER_MONTH[r.cycle], 0);
    const monthlyIn = act.filter((r) => r.type === "income").reduce((s, r) => s + r.amount * PER_MONTH[r.cycle], 0);
    const overdue = act.filter((r) => r.nextDate < today()).length;
    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Monthly commitments", money(Math.round(monthlyOut)), `${money(Math.round(monthlyOut * 12))} a year`)}
        ${CX.stat("Recurring income", money(Math.round(monthlyIn)), "per month", "green-t")}
        ${CX.stat("Free cash flow", money(Math.round(monthlyIn - monthlyOut)), "after commitments", monthlyIn - monthlyOut < 0 ? "red-t" : "")}
        ${CX.stat("Overdue", overdue, overdue ? "log or skip them below" : "all clear", overdue ? "red-t" : "")}
      </div>
      <div class="panel">
        ${list.length ? `<div style="overflow-x:auto"><table>
          <thead><tr><th>Name</th><th class="hide-sm">Cycle</th><th>Next due</th><th class="amt">Amount</th><th class="amt hide-sm">Per month</th><th></th></tr></thead>
          <tbody>${list.map((r) => `<tr class="${r.active ? "" : "faded"}">
            <td><span class="title clickable" data-act="edit-recurring" data-id="${r.id}">${esc(r.name)}</span><div class="meta">${esc(r.category)}${r.account ? " · " + esc(acctName(r.account)) : ""}${r.active ? "" : " · paused"}</div></td>
            <td class="hide-sm dim">${CYCLES.find((c) => c[0] === r.cycle)?.[1]}</td>
            <td class="nowrap ${r.active && r.nextDate < today() ? "red-t" : ""}">${fmtDate(r.nextDate)} <span class="dim tiny hide-sm">${CX.relDays(r.nextDate)}</span></td>
            <td class="amt ${r.type === "income" ? "green-t" : ""}">${money(r.amount, { sign: r.type === "income" })}</td>
            <td class="amt hide-sm dim">${money(Math.round(r.amount * PER_MONTH[r.cycle]))}</td>
            <td class="nowrap rec-actions" style="text-align:right">${r.active ? `<button class="btn sm" data-act="pay-recurring" data-id="${r.id}" title="Record the transaction and move to the next date">${r.type === "income" ? "Received" : "Paid"}</button> <button class="btn sm ghost" data-act="skip-recurring" data-id="${r.id}" title="Move to the next date without recording">Skip</button>` : ""}</td>
          </tr>`).join("")}</tbody></table></div>` : CX.empty("Track rent, subscriptions, insurance and salary here. Cipher reminds you before they're due.")}
      </div>`;
  }

  function reserves() {
    const list = CX.S.reserves;
    const saved = sum(list, (r) => r.saved), target = sum(list, (r) => r.target);
    return `
      <div class="grid g3 stats" style="margin-bottom:18px">
        ${CX.stat("Total reserved", money(saved), `of ${money(target)}`)}
        ${CX.stat("Overall progress", target ? Math.round((saved / target) * 100) + "%" : "—")}
        ${CX.stat("Reserves", list.length, `${list.filter((r) => r.saved >= r.target).length} fully funded`)}
      </div>
      <div class="grid g3">${list.map((r) => {
        const pct = Math.round((r.saved / (r.target || 1)) * 100);
        const left = Math.max(0, r.target - r.saved);
        const months = r.deadline ? Math.max(1, daysBetween(today(), r.deadline) / 30.4) : 0;
        return `<div class="panel">
          <div class="panel-head"><h2>${esc(r.name)}</h2><button class="icon-btn" data-act="edit-reserve" data-id="${r.id}">Edit</button></div>
          <div class="val serif" style="font-size:30px">${money(r.saved)} <span class="dim" style="font-size:16px">/ ${money(r.target)}</span></div>
          <div style="margin:12px 0 8px">${CX.bar(pct)}</div>
          <div class="kv"><span>Progress</span><b>${pct}%</b></div>
          <div class="kv"><span>Remaining</span><b>${money(left)}</b></div>
          ${r.deadline ? `<div class="kv"><span>Target date</span><b>${fmtDate(r.deadline, { day: "numeric", month: "short", year: "numeric" })}</b></div><div class="kv"><span>Needed per month</span><b class="${left ? "gold-t" : "green-t"}">${left ? money(Math.ceil(left / months)) : "Funded"}</b></div>` : ""}
          ${r.notes ? `<p class="help" style="margin-top:10px">${esc(r.notes)}</p>` : ""}
          <div class="actions" style="margin-top:12px"><button class="btn sm gold" data-act="deposit" data-id="${r.id}">Deposit</button><button class="btn sm ghost" data-act="deposit" data-id="${r.id}" data-w="1">Withdraw</button></div>
          ${r.log.length ? `<div class="list" style="margin-top:10px">${r.log.slice(-3).reverse().map((l) => `<div class="row"><div class="when">${fmtDate(l.date)}</div><div class="grow meta">${esc(l.note || "")}</div><span class="amt-s ${l.amount < 0 ? "red-t" : "green-t"}">${money(l.amount, { sign: true })}</span></div>`).join("")}</div>` : ""}
        </div>`;
      }).join("") || `<div class="panel" style="grid-column:1/-1">${CX.empty("Create reserves for an emergency fund, a trip or a major purchase.")}</div>`}</div>`;
  }

  function budgets() {
    const m = today().slice(0, 7);
    const spend = CX.catSpend(m);
    const cb = CX.S.settings.catBudgets;
    const total = Object.values(cb).reduce((a, b) => a + (Number(b) || 0), 0);
    return `
      <form class="panel" data-form="budgets">
        <div class="panel-head"><h2>Monthly budgets</h2><span class="mono tiny dim">${MONTHS[Number(m.slice(5)) - 1]} spending shown</span></div>
        <p class="help">Set an overall monthly cap and optional limits per category. Leave a category blank for no limit. Category limits currently add up to <b>${money(total)}</b>.</p>
        <div class="field" style="max-width:280px"><label for="b_total">Overall monthly budget</label><input id="b_total" name="__total" type="number" min="0" step="any" value="${esc(CX.S.settings.budget)}"></div>
        <div class="budget-grid">${EXP.map((c) => {
          const b = Number(cb[c]) || 0, s = spend[c] || 0;
          const bid = "b_" + c.replace(/\W/g, "_");
          return `<div class="budget-row"><label for="${bid}">${esc(c)}</label><input id="${bid}" name="${esc(c)}" type="number" min="0" step="any" value="${b || ""}" placeholder="No limit"><div>${b ? CX.bar((s / b) * 100, s > b ? "over" : "") : ""}<span class="mono tiny ${b && s > b ? "red-t" : "dim"}">${money(s)} spent${b ? ` · ${Math.round((s / b) * 100)}%` : ""}</span></div></div>`;
        }).join("")}</div>
        <button class="btn gold" style="margin-top:14px">Save budgets</button>
      </form>`;
  }

  function render() {
    const views = { overview, ledger, accounts, recurring, reserves, budgets };
    const overdue = CX.S.recurring.filter((r) => r.active && r.nextDate < today()).length;
    return `
      <div class="toolbar">${CX.tabs("trTab", [["overview", "Overview"], ["ledger", "Ledger"], ["accounts", "Accounts"], ["recurring", `Recurring${overdue ? ` <span class="nb">${overdue}</span>` : ""}`], ["reserves", "Reserves"], ["budgets", "Budgets"]])}</div>
      ${(views[CX.ui.trTab] || overview)()}`;
  }

  const head = () => {
    const t = CX.ui.trTab;
    if (t === "accounts") return `<button class="btn" data-act="new-txn">+ Transaction</button><button class="btn gold" data-act="new-account">+ Account</button>`;
    if (t === "recurring") return `<button class="btn gold" data-act="new-recurring">+ Recurring</button>`;
    if (t === "reserves") return `<button class="btn gold" data-act="new-reserve">+ Reserve</button>`;
    return `<button class="btn" data-act="new-income">+ Income</button><button class="btn gold" data-act="new-txn" title="Shortcut: N">+ Expense</button>`;
  };

  Object.assign(CX.actions, {
    "new-txn": () => editTxn(null, { type: "expense", date: today(), account: CX.S.accounts[0]?.id || "" }),
    "new-income": () => editTxn(null, { type: "income", category: "Salary", date: today(), account: CX.S.accounts[0]?.id || "" }),
    "edit-txn": (id) => editTxn(CX.find("txns", id)),
    "tr-month": (n) => { CX.ui.trMonth = CX.shiftMonth(CX.ui.trMonth, Number(n)); CX.render(); },
    "new-account": () => CX.edit("accounts", acctFields, null, { noun: "account", newTitle: "New account", titleKey: "name" }),
    "edit-account": (id) => CX.edit("accounts", acctFields, CX.find("accounts", id), { noun: "account", newTitle: "Account", titleKey: "name" }),
    "new-recurring": () => CX.edit("recurring", recFields, null, { noun: "recurring item", newTitle: "New recurring item", titleKey: "name", defaults: { active: true, account: CX.S.accounts[0]?.id || "" } }),
    "edit-recurring": (id) => CX.edit("recurring", recFields, CX.find("recurring", id), { noun: "recurring item", newTitle: "Recurring", titleKey: "name" }),
    "pay-recurring": (id) => {
      const r = CX.find("recurring", id);
      CX.undoable(`${r.name} recorded. Next due ${fmtDate(nextDate(r.nextDate, r.cycle))}.`, () => {
        CX.S.txns.push({ id: uid(), type: r.type, amount: r.amount, category: r.category, payee: r.name, account: r.account || "", toAccount: "", date: r.nextDate > today() ? today() : r.nextDate, tags: "recurring" });
        r.nextDate = nextDate(r.nextDate, r.cycle);
      });
    },
    "skip-recurring": (id) => { const r = CX.find("recurring", id); CX.undoable(`${r.name} skipped.`, () => { r.nextDate = nextDate(r.nextDate, r.cycle); }); },
    "new-reserve": () => CX.edit("reserves", resFields, null, { noun: "reserve", newTitle: "New reserve", titleKey: "name", extra: () => ({ log: [] }) }),
    "edit-reserve": (id) => CX.edit("reserves", resFields, CX.find("reserves", id), { noun: "reserve", newTitle: "Reserve", titleKey: "name" }),
    deposit: (id, el) => {
      const r = CX.find("reserves", id), w = !!el.dataset.w;
      CX.openForm({
        kicker: w ? "Withdraw from reserve" : "Deposit to reserve", title: r.name, saveLabel: w ? "Withdraw" : "Deposit",
        fields: [{ key: "amount", label: `Amount (${CX.S.settings.currency})`, type: "number", min: 0, required: true }, { key: "note", label: "Note" }],
        onSave: (d) => {
          const amt = (w ? -1 : 1) * (Number(d.amount) || 0);
          r.saved = Math.max(0, (Number(r.saved) || 0) + amt);
          r.log.push({ date: today(), amount: amt, note: d.note });
          CX.toast(r.saved >= r.target ? `${r.name} fully funded.` : `${w ? "Withdrew" : "Deposited"} ${money(Math.abs(amt))}.`);
        },
      });
    },
    "export-csv": () => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const rows = ledgerRows().map((t) => [t.date, t.type, t.amount, t.category, t.payee, acctName(t.account), acctName(t.toAccount), t.tags].map(q).join(","));
      CX.download(`cipher-ledger-${today()}.csv`, ["Date,Type,Amount,Category,Detail,Account,To account,Tags", ...rows].join("\n"), "text/csv");
      CX.toast(`Exported ${rows.length} transactions.`);
    },
  });
  CX.forms.budgets = (d) => {
    CX.S.settings.budget = Number(d.__total) || 0;
    const cb = {};
    EXP.forEach((c) => { const v = Number(d[c]); if (v > 0) cb[c] = v; });
    CX.S.settings.catBudgets = cb;
    CX.save(); CX.render(); CX.toast("Budgets saved.");
  };

  CX.view("treasury", {
    order: 6, icon: "money", label: "Money", kicker: "Treasury · funds & accounts",
    head, render, newAct: "new-txn", newLabel: "Expense", hideNew: true,
    badge: () => CX.S.recurring.filter((r) => r.active && r.nextDate < today()).length,
  });
})();

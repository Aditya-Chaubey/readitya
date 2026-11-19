/* CIPHER — Briefing: one calm page that pulls every section together. */
(() => {
  "use strict";
  const { esc, today, daysBetween, fmtDate, dayOfYear } = CX;

  const DIRECTIVES = [
    "Plan the work. Then work the plan.",
    "Discretion is a skill. Practise it daily.",
    "Small advantages, compounded, win campaigns.",
    "Know your exits before you need them.",
    "Composure is the uniform. Wear it.",
    "Every contact is an asset. Maintain it.",
    "Precision first. Speed follows.",
    "Leave every room better informed than you entered.",
    "Train hard so the mission feels easy.",
    "Money is ammunition. Don't waste rounds.",
    "Read the room, then read the fine print.",
    "Rest is part of the operation.",
    "The best agents are never in a hurry.",
    "Dress for the mission you want.",
  ];

  // Readiness: weighted blend of drills, mission pace, budget health and network warmth
  function readiness() {
    const t = today();
    const td = CX.drillsToday();
    const drills = td.total ? td.done / td.total : 1;
    const paced = CX.S.missions.filter((m) => m.status === "active").map(CX.pace).filter(Boolean);
    const missions = paced.length ? paced.filter((p) => p.status !== "Behind").length / paced.length : 1;
    const budget = Number(CX.S.settings.budget) || 0;
    const spent = CX.monthTotals(t.slice(0, 7)).expense;
    const d = new Date(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const allowed = budget * (d.getDate() / dim);
    const money = !budget ? 1 : spent <= allowed ? 1 : Math.max(0, 1 - (spent - allowed) / budget);
    const people = CX.S.people.length ? CX.S.people.filter((p) => !CX.isCold(p)).length / CX.S.people.length : 1;
    const parts = [["Drills", drills, 35], ["Missions on pace", missions, 25], ["Budget", money, 20], ["Network", people, 20]];
    return { score: Math.round(parts.reduce((a, [, v, w]) => a + v * w, 0)), parts };
  }
  const status = (s) => (s >= 85 ? "Mission ready" : s >= 65 ? "Operational" : s >= 45 ? "Compromised" : "Critical");

  function render() {
    const t = today();
    const h = new Date().getHours();
    const greet = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    const todayItems = CX.itemsOn(t);
    const td = CX.drillsToday();
    const active = CX.S.missions.filter((m) => m.status === "active").sort((a, b) => a.priority.localeCompare(b.priority));
    const cases = CX.S.cases.filter((c) => c.status === "open").sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    const ym = t.slice(0, 7);
    const mt = CX.monthTotals(ym);
    const budget = Number(CX.S.settings.budget) || 0;
    const r = readiness();
    const C = 2 * Math.PI * 52;

    // Situation report: everything that needs attention, most urgent first
    const alerts = [];
    CX.overdueObjectives().forEach(({ m, o }) => alerts.push({ lvl: "bad", text: `Objective overdue: ${o.text}`, sub: m.title, act: "open-mission", id: m.id }));
    CX.S.recurring.filter((x) => x.active && x.nextDate < t).forEach((x) => alerts.push({ lvl: "bad", text: `${x.name} payment overdue`, sub: CX.money(x.amount), go: "treasury" }));
    CX.vaultAlerts().forEach((v) => alerts.push({ lvl: v.expiry < t ? "bad" : "warn", text: `${v.title} ${v.expiry < t ? "has expired" : "expires " + CX.relDays(v.expiry)}`, sub: "Vault", act: "edit-vault", id: v.id }));
    CX.billsDue(7).filter((x) => x.nextDate >= t).forEach((x) => alerts.push({ lvl: "warn", text: `${x.name} due ${CX.relDays(x.nextDate)}`, sub: CX.money(x.amount), go: "treasury" }));
    CX.overBudget(ym).forEach((c) => alerts.push({ lvl: "warn", text: `Over budget on ${c}`, sub: `${CX.money(CX.catSpend(ym)[c])} of ${CX.money(CX.S.settings.catBudgets[c])}`, go: "treasury" }));
    CX.S.missions.filter((m) => m.status === "active" && CX.pace(m)?.status === "Behind").forEach((m) => alerts.push({ lvl: "warn", text: `Behind schedule: ${m.title}`, sub: `${CX.progress(m)}% done, ${CX.pace(m).elapsed}% of the time used`, act: "open-mission", id: m.id }));
    CX.S.people.map((p) => ({ p, d: CX.nextBirthday(p) })).filter((x) => x.d && daysBetween(t, x.d) <= 14).forEach(({ p, d }) => alerts.push({ lvl: "info", text: `${p.name}'s birthday ${CX.relDays(d)}`, sub: p.giftIdeas ? `Gift idea: ${p.giftIdeas}` : fmtDate(d, { day: "numeric", month: "long" }), act: "view-person", id: p.id }));
    CX.S.people.filter(CX.isCold).sort((a, b) => CX.lastSeen(a).localeCompare(CX.lastSeen(b))).slice(0, 3).forEach((p) => alerts.push({ lvl: "info", text: `Reconnect with ${p.name}`, sub: `Last contact ${CX.relDays(CX.lastSeen(p))}`, act: "view-person", id: p.id }));
    if (!CX.journalToday() && h >= 18) alerts.push({ lvl: "info", text: "Today's field log is not yet filed", sub: CX.prompt(), act: "new-entry" });

    const item = (x) => `
      <div class="row ${x.act ? "clickable" : ""}" ${x.act ? `data-act="${x.act}" data-id="${x.id}"` : ""}>
        <span class="dot" style="--c:${x.color || "var(--gold)"}"></span>
        <div class="when">${x.time ? esc(CX.fmtTime(x.time)) : x.tag || "All day"}</div>
        <div class="grow"><div class="title">${esc(x.label)}</div>${x.meta ? `<div class="meta">${esc(x.meta)}</div>` : ""}</div>
        ${CX.img(x.img, "thumb")}
      </div>`;

    return `
      <section class="hero">
        <div>
          <div class="kicker gold-t">${fmtDate(t, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <p class="greet">${greet}, <b>${esc(CX.S.settings.codename)}</b>.</p>
          <p class="directive serif">${DIRECTIVES[dayOfYear() % DIRECTIVES.length]}</p>
        </div>
        <div class="readiness">
          <svg viewBox="0 0 120 120" class="ring" role="img" aria-label="Readiness ${r.score} out of 100">
            <circle cx="60" cy="60" r="52" class="ring-bg"></circle>
            <circle cx="60" cy="60" r="52" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - r.score / 100)}"></circle>
            <text x="60" y="64" text-anchor="middle" class="ring-num">${r.score}</text>
          </svg>
          <div>
            <div class="kicker">Readiness</div>
            <div class="ready-status serif">${status(r.score)}</div>
            <div class="ready-parts">${r.parts.map(([k, v]) => `<span title="${k}: ${Math.round(v * 100)}%"><i style="--p:${Math.round(v * 100)}%"></i>${k}</span>`).join("")}</div>
          </div>
        </div>
      </section>

      <div class="stats">
        ${CX.stat("Today", todayItems.filter((x) => x.kind === "event").length, "operations scheduled")}
        ${CX.stat("Drills", `${td.done}<span class="dim">/${td.total}</span>`, td.total && td.done === td.total ? "all complete" : "done today")}
        ${CX.stat(`Spent · ${CX.MONTHS[new Date().getMonth()].slice(0, 3)}`, CX.money(mt.expense), budget ? `${Math.round((mt.expense / budget) * 100)}% of budget` : "", budget && mt.expense > budget ? "red-t" : "")}
        ${CX.stat("Net worth", CX.money(CX.netWorth()), "", "gold-t")}
        ${CX.stat("Open cases", cases.length)}
      </div>

      <div class="grid g3">
        ${CX.panel("Today", todayItems.length ? `<div class="list">${todayItems.map(item).join("")}</div>` : CX.empty("Nothing scheduled. Make the day count."), CX.link("operations", "Calendar"))}
        ${CX.panel("Drills", td.list.length ? td.list.map(CX.drillRow).join("") : CX.empty("No drills today."), CX.link("drills", "All drills"))}
        ${CX.panel("Situation report", alerts.length ? `<div class="list">${alerts.slice(0, 7).map((a) => `
          <div class="row ${a.act || a.go ? "clickable" : ""}" ${a.act ? `data-act="${a.act}" data-id="${a.id || ""}"` : a.go ? `data-act="go" data-id="${a.go}"` : ""}>
            <span class="alert-dot ${a.lvl}"></span><div class="grow"><div class="title">${esc(a.text)}</div><div class="meta">${esc(a.sub || "")}</div></div>
          </div>`).join("")}</div>${alerts.length > 7 ? `<div class="meta" style="margin-top:8px">and ${alerts.length - 7} more</div>` : ""}` : CX.empty("All quiet."), `<span class="kicker">${alerts.length}</span>`)}
      </div>

      <div class="grid g2" style="margin-top:20px">
        ${CX.panel("Active missions", active.length ? `<div class="list">${active.slice(0, 5).map((m) => { const p = CX.progress(m), pace = CX.pace(m); return `
          <div class="row clickable col" data-act="open-mission" data-id="${m.id}">
            <div class="spread"><span class="title">${esc(m.title)}</span><span class="kicker gold-t">${p}%</span></div>
            ${CX.bar(p)}
            <div class="meta">${m.deadline ? `Due ${fmtDate(m.deadline)}, ${CX.relDays(m.deadline)}` : "No deadline"}${pace ? ` · <span class="${pace.status === "Behind" ? "red-t" : "green-t"}">${pace.status}</span>` : ""}</div>
          </div>`; }).join("")}</div>` : CX.empty("No active missions. Assign yourself one."), CX.link("missions", "Missions"))}
        ${CX.panel("Open cases", cases.length ? `<div class="list">${cases.slice(0, 5).map((c) => `
          <a class="row clickable plain" href="#cases/${c.id}">
            <span class="case-ic">${CX.icon("cases", 16)}</span>
            <div class="grow"><div class="title">${esc(c.title)}</div><div class="meta">${esc(c.question || c.kind)}</div></div>
            <span class="kicker">${c.nodes.length} nodes</span>
          </a>`).join("")}</div>` : CX.empty("No open cases."), CX.link("cases", "Cases"))}
      </div>`;
  }

  CX.view("briefing", {
    order: 1, icon: "briefing", label: "Briefing", kicker: "Daily intelligence", render,
    head: () => `<button class="btn ghost" data-act="new-entry">Log entry</button><button class="btn ghost" data-act="new-txn">Expense</button><button class="btn gold" data-act="new-event">${CX.icon("plus", 14)} Operation</button>`,
  });
})();

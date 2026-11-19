/* CIPHER — Field Log: a daily debrief with mood and energy tracking. */
(() => {
  "use strict";
  const { esc, today, addDays, daysBetween, fmtDate, dayOfYear } = CX;

  const MOODS = ["", "Compromised", "Strained", "Steady", "Sharp", "Unstoppable"];
  const ENERGY = ["", "Depleted", "Low", "Moderate", "High", "Peak"];
  const PROMPTS = [
    "What was today's decisive moment?",
    "What did you learn that you didn't know this morning?",
    "Who helped you today, and how can you return the favour?",
    "What would you do differently if you replayed today?",
    "What's the one thing tomorrow must accomplish?",
    "Where did you waste time, and what will you change?",
    "What are you avoiding? Why?",
    "What small win deserves recognition?",
    "Which relationship needs attention this week?",
    "What drained your energy today? What restored it?",
    "If today were a mission report, what would the headline be?",
    "What risk are you not taking that you should?",
  ];
  CX.prompt = () => PROMPTS[dayOfYear() % PROMPTS.length];
  Object.assign(CX.ui, { jQ: "", jTag: "all" });

  const writingStreak = () => {
    const days = new Set(CX.S.journal.map((j) => j.date));
    let d = today(), n = 0;
    if (!days.has(d)) d = addDays(d, -1);
    while (days.has(d)) { n++; d = addDays(d, -1); }
    return n;
  };
  const avg = (arr, k) => { const v = arr.map((x) => Number(x[k])).filter(Boolean); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; };
  CX.journalToday = () => CX.S.journal.some((j) => j.date === today());

  CX.searchers.push((q) => CX.S.journal.filter((j) => CX.match(q, j.title, j.body, j.wins, j.lessons, j.tags)).slice(0, 6).map((j) => ({
    kind: "Field log", label: j.title || "Untitled entry", sub: fmtDate(j.date, { day: "numeric", month: "short", year: "numeric" }), run: () => { location.hash = "journal"; CX.openEntry(j.id); },
  })));

  const fields = () => [
    { key: "date", label: "Date", type: "date", required: true, half: true, default: today },
    { key: "title", label: "Headline", half: true, placeholder: "Today in five words" },
    { key: "mood", label: "Mood", type: "select", options: MOODS.slice(1).map((m, i) => [String(i + 1), `${i + 1} — ${m}`]), half: true, default: "3" },
    { key: "energy", label: "Energy", type: "select", options: ENERGY.slice(1).map((m, i) => [String(i + 1), `${i + 1} — ${m}`]), half: true, default: "3" },
    { key: "body", label: "Debrief", type: "textarea", rows: 6, placeholder: CX.prompt() },
    { key: "wins", label: "Wins", type: "textarea", rows: 2, half: true },
    { key: "lessons", label: "Lessons", type: "textarea", rows: 2, half: true },
    { key: "tags", label: "Tags", placeholder: "comma, separated" },
    { key: "photo", label: "Photo of the day", type: "photo" },
  ];
  const editEntry = (rec, defaults) => CX.edit("journal", fields, rec, {
    noun: "entry", newTitle: "Field log entry", titleKey: "title", wide: true, defaults,
    intro: rec ? "" : `Prompt: <i>${esc(CX.prompt())}</i>`,
    transform: (d) => { d.mood = Number(d.mood) || 3; d.energy = Number(d.energy) || 3; return d; },
  });

  function render() {
    const all = CX.S.journal.slice().sort((a, b) => b.date.localeCompare(a.date));
    const q = (CX.ui.jQ || "").toLowerCase();
    const tags = [...new Set(all.flatMap((j) => (j.tags || "").split(",").map((t) => t.trim()).filter(Boolean)))].sort();
    const list = all.filter((j) => (!q || CX.match(q, j.title, j.body, j.wins, j.lessons, j.tags)) && (CX.ui.jTag === "all" || (j.tags || "").split(",").map((t) => t.trim()).includes(CX.ui.jTag)));
    const last30 = all.filter((j) => daysBetween(j.date, today()) < 30);
    const month = today().slice(0, 7);
    const byDate = Object.fromEntries(all.map((j) => [j.date, j]));
    const chart = Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today(), i - 29), j = byDate[d];
      return `<div class="mcol" title="${fmtDate(d)}${j ? ` · mood ${j.mood}, energy ${j.energy}` : " · no entry"}"><i class="mb" style="height:${j ? j.mood * 20 : 4}%;${j ? "" : "opacity:.25"}"></i><i class="eb" style="height:${j ? j.energy * 20 : 0}%"></i></div>`;
    }).join("");
    const done = CX.journalToday();
    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Entries this month", all.filter((j) => j.date.startsWith(month)).length, `${all.length} total`)}
        ${CX.stat("Writing streak", writingStreak() + "d", done ? "Today's entry filed" : "File today's entry to extend it")}
        ${CX.stat("Average mood · 30d", avg(last30, "mood"), MOODS[Math.round(Number(avg(last30, "mood"))) || 0] || "")}
        ${CX.stat("Average energy · 30d", avg(last30, "energy"), ENERGY[Math.round(Number(avg(last30, "energy"))) || 0] || "")}
      </div>
      <div class="grid g2" style="margin-bottom:18px">
        <div class="panel prompt-card">
          <div class="mono tiny dim">Prompt of the day</div>
          <p class="serif prompt">${esc(CX.prompt())}</p>
          <button class="btn ${done ? "" : "gold"}" data-act="new-entry">${done ? "Add another entry" : "Write today's debrief"}</button>
        </div>
        ${CX.panel("Mood & energy · 30 days", `<div class="moodchart">${chart}</div><div class="hm-legend mono tiny dim"><i class="sw mb"></i> Mood <i class="sw eb"></i> Energy</div>`)}
      </div>
      <div class="toolbar">
        <div class="filters">${CX.uiSearch("jQ", "Search entries…")}${CX.uiSelect("jTag", [["all", "All tags"], ...tags], "Filter by tag")}</div>
        <span class="mono tiny dim">${list.length} entr${list.length === 1 ? "y" : "ies"}</span>
      </div>
      <div class="entries">${list.map((j) => `
        <button type="button" class="panel entry" data-act="open-entry" data-id="${j.id}">
          ${CX.img(j.photo, "entry-img")}<div class="entry-date"><div class="serif">${CX.parse(j.date).getDate()}</div><div class="mono tiny dim">${fmtDate(j.date, { month: "short", year: "2-digit" })}</div></div>
          <div style="min-width:0;flex:1">
            <div class="title">${esc(j.title || "Untitled entry")}</div>
            <div class="meta">${esc((j.body || j.wins || "").slice(0, 160))}${(j.body || "").length > 160 ? "…" : ""}</div>
            <div class="tags"><span class="badge m${j.mood}">${MOODS[j.mood] || ""}</span><span class="badge">Energy ${j.energy}/5</span>${(j.tags || "").split(",").map((t) => t.trim()).filter(Boolean).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>
          </div>
        </button>`).join("") || `<div class="panel">${CX.empty(all.length ? "No entries match." : "No entries yet. Agents who debrief, improve.")}</div>`}</div>`;
  }

  CX.openEntry = (id) => {
    const j = CX.find("journal", id);
    if (!j) return;
    const block = (k, v) => (v ? `<div class="form-sec mono tiny">${k}</div><p class="prose">${esc(v)}</p>` : "");
    CX.showModal(`
      <div class="dossier">
        <div class="mono dim tiny">Field log · ${fmtDate(j.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        <h2 style="margin:6px 0">${esc(j.title || "Untitled entry")}</h2>
        <div class="badges"><span class="badge m${j.mood}">Mood · ${MOODS[j.mood]}</span><span class="badge">Energy · ${ENERGY[j.energy]}</span></div>
        ${CX.img(j.photo, "entry-full")}${block("Debrief", j.body)}${block("Wins", j.wins)}${block("Lessons", j.lessons)}
        ${j.tags ? `<div class="tags" style="margin-top:12px">${j.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>` : ""}
        <div class="modal-foot"><button type="button" class="btn ghost left" data-m="close">Close</button><button type="button" class="btn gold" data-act="edit-entry" data-id="${j.id}">Edit</button></div>
      </div>`, { wide: true });
  };

  Object.assign(CX.actions, {
    "new-entry": () => editEntry(null, { date: today() }),
    "edit-entry": (id) => editEntry(CX.find("journal", id)),
    "open-entry": (id) => CX.openEntry(id),
  });

  CX.view("journal", { order: 8, icon: "journal", label: "Journal", tabLabel: "Field log", kicker: "Field log · daily debriefs", newAct: "new-entry", newLabel: "New entry", render });
})();

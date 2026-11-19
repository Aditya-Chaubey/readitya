/* CIPHER — Arsenal: skills you have, skills in training and skills to acquire, with a practice log. */
(() => {
  "use strict";
  const { esc, today, addDays, fmtDate, uid } = CX;

  const CATS = ["Technical", "Languages", "Combat", "Field", "Influence", "Fitness", "Creative", "Finance", "Survival", "Other"];
  const STATUS = [["mastered", "Mastered"], ["training", "In training"], ["target", "Target — to acquire"]];
  const LEVELS = [["0", "0 — None"], ["1", "1 — Novice"], ["2", "2 — Basic"], ["3", "3 — Capable"], ["4", "4 — Advanced"], ["5", "5 — Expert"]];
  const LEVEL_NAME = ["None", "Novice", "Basic", "Capable", "Advanced", "Expert"];
  Object.assign(CX.ui, { aView: "board", aCat: "all" });

  const minutes = (k, since = "") => k.sessions.filter((s) => !since || s.date >= since).reduce((a, s) => a + (Number(s.minutes) || 0), 0);
  const hrs = (m) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10}h` : `${m}m`);
  const lastPractice = (k) => k.sessions.map((s) => s.date).sort().pop() || "";

  CX.searchers.push((q) => CX.S.skills.filter((k) => CX.match(q, k.name, k.category, k.notes, k.resources)).slice(0, 6).map((k) => ({
    kind: "Skill", label: k.name, sub: `${STATUS.find((s) => s[0] === k.status)[1]} · level ${k.level}`, run: () => { location.hash = "arsenal"; CX.openSkill(k.id); },
  })));

  const fields = () => [
    { key: "name", label: "Skill", required: true, placeholder: "e.g. Lock picking" },
    { key: "category", label: "Discipline", type: "select", options: CATS, half: true, default: "Technical" },
    { key: "status", label: "Status", type: "select", options: STATUS, half: true, default: "target" },
    { key: "level", label: "Current proficiency", type: "select", options: LEVELS, half: true, default: "0" },
    { key: "targetLevel", label: "Target proficiency", type: "select", options: LEVELS.slice(1), half: true, default: "3" },
    { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"], half: true, default: "Medium" },
    { key: "started", label: "Started", type: "date", half: true },
    { key: "resources", label: "Resources", type: "textarea", placeholder: "Books, courses, links — one per line" },
    { key: "notes", label: "Notes", type: "textarea", rows: 2 },
  ];
  const editSkill = (rec) => CX.edit("skills", fields, rec, {
    noun: "skill", newTitle: "Add skill", titleKey: "name", extra: () => ({ sessions: [] }),
    transform: (d) => { d.level = Number(d.level) || 0; d.targetLevel = Number(d.targetLevel) || 0; if (d.status === "training" && !d.started) d.started = today(); return d; },
  });

  const skillRow = (k) => `
    <div class="skill">
      <div class="grow clickable" style="flex:1;min-width:0" data-act="open-skill" data-id="${k.id}">
        <div class="title">${esc(k.name)}${k.priority === "High" && k.status !== "mastered" ? ` <span class="badge warn">High</span>` : ""}</div>
        <div class="meta">${esc(k.category)} · ${LEVEL_NAME[k.level] || "None"}${k.sessions.length ? ` · ${hrs(minutes(k))} logged` : ""}</div>
      </div>
      <div class="pips" title="Level ${k.level} of 5, target ${k.targetLevel || "—"}">${CX.pips(k.level, 5, k.targetLevel)}</div>
      ${k.status !== "mastered" ? `<button class="icon-btn" data-act="log-practice" data-id="${k.id}" title="Log practice" aria-label="Log practice">+</button>` : ""}
      ${k.status !== "mastered" ? `<button class="icon-btn" data-act="promote" data-id="${k.id}" title="${k.status === "target" ? "Begin training" : "Mark mastered"}" aria-label="Advance">→</button>` : ""}
    </div>`;

  function board(list) {
    const col = (status, title, sub) => {
      const items = list.filter((k) => k.status === status).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] ?? 1) - ({ High: 0, Medium: 1, Low: 2 }[b.priority] ?? 1) || b.level - a.level || a.name.localeCompare(b.name));
      return `<div class="panel"><div class="panel-head"><div><h2>${title}</h2><div class="mono tiny dim">${sub}</div></div><span class="mono gold-t">${items.length}</span></div><div>${items.map(skillRow).join("") || CX.empty("None yet.")}</div></div>`;
    };
    return `<div class="grid g3">${col("mastered", "Mastered", "Skills in your kit")}${col("training", "In training", "Actively developing")}${col("target", "Targets", "Skills to acquire")}</div>`;
  }
  function table(list) {
    return `<div class="panel"><div style="overflow-x:auto"><table>
      <thead><tr><th>Skill</th><th class="hide-sm">Discipline</th><th class="hide-sm">Status</th><th>Level</th><th class="amt">Hours</th><th class="hide-sm">Last practice</th></tr></thead>
      <tbody>${list.sort((a, b) => a.name.localeCompare(b.name)).map((k) => `<tr class="clickable" data-act="open-skill" data-id="${k.id}">
        <td><span class="title">${esc(k.name)}</span></td><td class="hide-sm dim">${esc(k.category)}</td>
        <td class="hide-sm"><span class="badge st-${k.status}">${STATUS.find((s) => s[0] === k.status)[1].split(" —")[0]}</span></td>
        <td><div class="pips">${CX.pips(k.level, 5, k.targetLevel)}</div></td>
        <td class="amt">${hrs(minutes(k))}</td><td class="hide-sm dim">${lastPractice(k) ? CX.relDays(lastPractice(k)) : "—"}</td></tr>`).join("") || `<tr><td colspan="6">${CX.empty("No skills.")}</td></tr>`}</tbody></table></div></div>`;
  }

  function render() {
    const all = CX.S.skills;
    const list = all.filter((k) => CX.ui.aCat === "all" || k.category === CX.ui.aCat);
    const month = today().slice(0, 7) + "-01";
    const mMin = all.reduce((a, k) => a + minutes(k, month), 0);
    const wMin = all.reduce((a, k) => a + minutes(k, addDays(today(), -6)), 0);
    const total = all.reduce((a, k) => a + minutes(k), 0);
    const recent = all.flatMap((k) => k.sessions.map((s) => ({ ...s, k }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    const n = (s) => all.filter((k) => k.status === s).length;
    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Mastered", n("mastered"), `${all.filter((k) => k.level >= 4).length} at advanced or above`)}
        ${CX.stat("In training", n("training"), `${n("target")} targets queued`)}
        ${CX.stat("Practice · this month", hrs(mMin), `${hrs(wMin)} in the last 7 days`)}
        ${CX.stat("Total time invested", hrs(total))}
      </div>
      <div class="toolbar">
        ${CX.tabs("aView", [["board", "Board"], ["list", "List"]])}
        <div class="filters">${CX.uiSelect("aCat", [["all", "All disciplines"], ...CATS], "Filter by discipline")}</div>
      </div>
      ${CX.ui.aView === "list" ? table(list) : board(list)}
      <div style="margin-top:18px">${CX.panel("Recent practice", recent.length ? `<div class="list">${recent.map((s) => `<div class="row clickable" data-act="open-skill" data-id="${s.k.id}"><div class="when">${fmtDate(s.date)}</div><div class="grow"><div class="title">${esc(s.k.name)}</div>${s.note ? `<div class="meta">${esc(s.note)}</div>` : ""}</div><span class="mono tiny gold-t">${hrs(Number(s.minutes) || 0)}</span></div>`).join("")}</div>` : CX.empty("Log practice sessions with the + button on any skill."))}</div>`;
  }

  CX.openSkill = (id) => {
    const k = CX.find("skills", id);
    if (!k) return;
    const res = (k.resources || "").split("\n").map((x) => x.trim()).filter(Boolean);
    const link = (x) => (/^https?:\/\//.test(x) ? `<a href="${esc(x)}" target="_blank" rel="noopener noreferrer">${esc(x)}</a>` : esc(x));
    CX.showModal(`
      <div class="dossier">
        <div class="mono dim tiny">Skill file · ${esc(k.category)}</div>
        <h2 style="margin:6px 0">${esc(k.name)}</h2>
        <div class="badges"><span class="badge st-${k.status}">${STATUS.find((s) => s[0] === k.status)[1].split(" —")[0]}</span><span class="badge">${esc(k.priority || "Medium")} priority</span></div>
        <div class="grid g2" style="margin-top:16px">
          <div>
            <div class="kv"><span>Proficiency</span><b>${k.level} · ${LEVEL_NAME[k.level]}</b></div>
            <div class="kv"><span>Target</span><b>${k.targetLevel ? `${k.targetLevel} · ${LEVEL_NAME[k.targetLevel]}` : "—"}</b></div>
            <div class="pips lg" style="margin:8px 0 12px">${CX.pips(k.level, 5, k.targetLevel)}</div>
            <div class="kv"><span>Time invested</span><b>${hrs(minutes(k))}</b></div>
            <div class="kv"><span>Sessions</span><b>${k.sessions.length}</b></div>
            ${k.started ? `<div class="kv"><span>Started</span><b>${fmtDate(k.started, { day: "numeric", month: "short", year: "numeric" })}</b></div>` : ""}
            <div class="form-sec mono tiny">Resources</div>
            ${res.length ? `<ul class="res">${res.map((x) => `<li>${link(x)}</li>`).join("")}</ul>` : CX.empty("No resources listed.")}
            ${k.notes ? `<div class="form-sec mono tiny">Notes</div><p class="help">${esc(k.notes)}</p>` : ""}
          </div>
          <div>
            <div class="form-sec mono tiny" style="margin-top:0">Log practice</div>
            <form class="ix-form" data-form="practice" data-id="${k.id}">
              <input name="minutes" type="number" min="1" placeholder="Minutes" required aria-label="Minutes" style="max-width:100px">
              <input name="date" type="date" value="${today()}" aria-label="Date">
              <input name="note" placeholder="What did you work on?" class="ix-note" aria-label="Note">
              <button class="btn sm gold">Log</button>
            </form>
            <div class="form-sec mono tiny">Practice log</div>
            <div class="list">${k.sessions.slice().sort((a, b) => b.date.localeCompare(a.date)).map((s) => `<div class="row"><div class="when">${fmtDate(s.date)}</div><div class="grow">${s.note ? esc(s.note) : `<span class="faint">—</span>`}</div><span class="mono tiny gold-t">${hrs(Number(s.minutes) || 0)}</span><button class="icon-btn" data-act="del-session" data-id="${k.id}" data-x="${s.id}" aria-label="Delete session">✕</button></div>`).join("") || CX.empty("No sessions yet.")}</div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost left" data-m="close">Close</button>
          ${k.status !== "mastered" ? `<button type="button" class="btn" data-act="promote" data-id="${k.id}">${k.status === "target" ? "Begin training" : "Mark mastered"}</button>` : ""}
          <button type="button" class="btn gold" data-act="edit-skill" data-id="${k.id}">Edit</button>
        </div>
      </div>`, { wide: true });
  };
  const reopen = (id) => { CX.save(); CX.render(); if (document.getElementById("modal").open) CX.openSkill(id); };

  Object.assign(CX.actions, {
    "new-skill": () => editSkill(null),
    "edit-skill": (id) => editSkill(CX.find("skills", id)),
    "open-skill": (id) => CX.openSkill(id),
    "log-practice": (id) => CX.openSkill(id),
    "del-session": (id, el) => { const k = CX.find("skills", id); k.sessions = k.sessions.filter((s) => s.id !== el.dataset.x); reopen(id); },
    promote: (id) => {
      const k = CX.find("skills", id);
      k.status = k.status === "target" ? "training" : "mastered";
      if (k.status === "training") { if (!k.level) k.level = 1; if (!k.started) k.started = today(); }
      if (k.status === "mastered" && k.targetLevel && k.level < k.targetLevel) k.level = k.targetLevel;
      reopen(id);
      CX.toast(k.status === "mastered" ? `${k.name} mastered. Added to your kit.` : `Training begins: ${k.name}.`);
    },
  });
  CX.forms.practice = (d, f) => {
    const k = CX.find("skills", f.dataset.id);
    const m = Number(d.minutes) || 0;
    if (!m) return;
    k.sessions.push({ id: uid(), date: d.date || today(), minutes: m, note: d.note });
    if (k.status === "target") { k.status = "training"; if (!k.level) k.level = 1; if (!k.started) k.started = today(); }
    reopen(k.id); CX.toast(`${hrs(m)} of ${k.name} logged.`);
  };

  CX.view("arsenal", { order: 7, icon: "skills", label: "Skills", kicker: "Arsenal · skills & training", newAct: "new-skill", newLabel: "Add skill", render });
})();

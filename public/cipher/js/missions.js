/* CIPHER — Missions: goals with codenames, objectives, a mission log and debriefs. */
(() => {
  "use strict";
  const { esc, today, addDays, daysBetween, fmtDate, uid, pick } = CX;

  const CATS = ["Career", "Health", "Finance", "Learning", "Relationships", "Personal", "Adventure", "Creative"];
  const STATUS = { active: "Active", paused: "Paused", done: "Accomplished", aborted: "Aborted" };
  const PRI = { 1: "Priority I", 2: "Priority II", 3: "Priority III" };
  const ADJ = ["Silent", "Iron", "Velvet", "Crimson", "Midnight", "Glass", "Golden", "Black", "Arctic", "Phantom", "Silver", "Northern", "Quiet", "Burning", "Hollow", "Cobalt", "Amber", "Obsidian"];
  const NOUN = ["Falcon", "Meridian", "Lantern", "Harbour", "Sparrow", "Monarch", "Cascade", "Citadel", "Orchid", "Vertex", "Tempest", "Compass", "Raven", "Sentinel", "Ember", "Atlas", "Kestrel", "Gambit"];
  CX.codename = () => `${pick(ADJ)} ${pick(NOUN)}`;

  Object.assign(CX.ui, { mTab: "active", mCat: "all", mSort: "priority" });

  CX.progress = (m) => (m.objectives.length ? Math.round((m.objectives.filter((o) => o.done).length / m.objectives.length) * 100) : m.status === "done" ? 100 : 0);
  // Compare progress to time elapsed between start and deadline
  CX.pace = (m) => {
    if (m.status !== "active" || !m.startDate || !m.deadline) return null;
    const total = daysBetween(m.startDate, m.deadline);
    if (total <= 0) return null;
    const elapsed = Math.max(0, Math.min(100, (daysBetween(m.startDate, today()) / total) * 100));
    const p = CX.progress(m);
    return { elapsed: Math.round(elapsed), status: p >= elapsed - 10 ? (p > elapsed + 15 ? "Ahead" : "On track") : "Behind" };
  };
  const overdueObjectives = () => CX.S.missions.filter((m) => m.status === "active").flatMap((m) => m.objectives.filter((o) => !o.done && o.due && o.due < today()).map((o) => ({ m, o })));
  CX.overdueObjectives = overdueObjectives;

  CX.calendar.push((day) => {
    const out = [];
    CX.S.missions.forEach((m) => {
      if (m.status !== "active" && m.status !== "paused") return;
      if (m.deadline === day) out.push({ kind: "deadline", label: `Deadline · ${m.title}`, tag: "Deadline", color: "var(--red)", act: "open-mission", id: m.id });
      m.objectives.forEach((o) => { if (!o.done && o.due === day) out.push({ kind: "objective", label: `${o.text}`, tag: "Objective", meta: m.title, color: "var(--red)", act: "open-mission", id: m.id }); });
    });
    return out;
  });
  CX.searchers.push((q) => CX.S.missions.filter((m) => CX.match(q, m.title, m.codename, m.brief, m.category, ...m.objectives.map((o) => o.text))).slice(0, 8).map((m) => ({
    kind: "Mission", label: m.title, sub: `Operation ${m.codename || ""} · ${STATUS[m.status]}`, run: () => { location.hash = "missions"; CX.openMission(m.id); },
  })));

  const fields = () => [
    { key: "title", label: "Mission", required: true, placeholder: "e.g. Learn to fly a plane" },
    { key: "codename", label: "Codename", half: true, placeholder: "Leave blank to generate", hint: "Shown as Operation …" },
    { key: "category", label: "Theatre", type: "select", options: CATS, half: true, default: "Personal" },
    { key: "priority", label: "Priority", type: "select", options: [["1", "Priority I — Critical"], ["2", "Priority II — Important"], ["3", "Priority III — Routine"]], half: true, default: "2" },
    { key: "status", label: "Status", type: "select", options: Object.entries(STATUS), half: true, default: "active" },
    { key: "startDate", label: "Start date", type: "date", half: true, default: today },
    { key: "deadline", label: "Deadline", type: "date", half: true },
    { key: "brief", label: "Brief", type: "textarea", placeholder: "What does success look like?" },
    { key: "motive", label: "Motive", placeholder: "Why this matters to you", half: true },
    { key: "reward", label: "Reward on completion", placeholder: "How you'll celebrate", half: true },
  ];
  const editMission = (rec) => CX.edit("missions", fields, rec, {
    noun: "mission", newTitle: "New mission", titleKey: "title",
    extra: () => ({ objectives: [], log: [] }),
    transform: (d, r) => { if (!d.codename) d.codename = CX.codename(); if (d.status === "done" && (!r || r.status !== "done")) d.completedOn = today(); return d; },
  });

  const countdown = (m) => {
    if (!m.deadline || m.status === "done" || m.status === "aborted") return "";
    const n = daysBetween(today(), m.deadline);
    return `<span class="badge ${n < 0 ? "bad" : n <= 14 ? "warn" : ""}">${n < 0 ? `Overdue ${-n} days` : n === 0 ? "Due today" : `${n} days left`}</span>`;
  };
  const objRow = (m, o) => `
    <div class="obj ${o.done ? "done" : ""}">
      <input type="checkbox" id="o_${o.id}" ${o.done ? "checked" : ""} data-act="toggle-obj" data-id="${m.id}" data-obj="${o.id}">
      <label for="o_${o.id}">${esc(o.text)}</label>
      ${o.due && !o.done ? `<span class="mono tiny ${o.due < today() ? "red-t" : "dim"}">${fmtDate(o.due)}</span>` : ""}
      ${o.done && o.doneOn ? `<span class="mono tiny faint">✓ ${fmtDate(o.doneOn)}</span>` : ""}
      <button class="icon-btn" data-act="del-obj" data-id="${m.id}" data-obj="${o.id}" title="Remove objective" aria-label="Remove objective">✕</button>
    </div>`;
  const addObjForm = (m) => `<form class="add-obj" data-form="add-obj" data-id="${m.id}"><input name="text" placeholder="Add objective…" aria-label="New objective" required><input name="due" type="date" aria-label="Objective due date" title="Due date (optional)"><button class="btn sm">Add</button></form>`;

  function card(m) {
    const p = CX.progress(m);
    const pace = CX.pace(m);
    const closed = m.status === "done" || m.status === "aborted";
    return `
      <div class="panel mission ${closed ? "closed" : ""} ${m.status === "paused" ? "paused" : ""}">
        <div class="head">
          <div style="min-width:0">
            <div class="badges">
              ${m.status === "active" ? `<span class="badge p${m.priority}">${PRI[m.priority]}</span>` : `<span class="badge st-${m.status}">${STATUS[m.status]}</span>`}
              <span class="badge">${esc(m.category)}</span>
              ${countdown(m)}
              ${pace ? `<span class="badge ${pace.status === "Behind" ? "bad" : "ok"}">${pace.status}</span>` : ""}
            </div>
            ${m.codename ? `<div class="mono tiny gold-t" style="margin-top:10px">Operation ${esc(m.codename)}</div>` : ""}
            <h3>${esc(m.title)}</h3>
          </div>
          <button class="btn sm ghost" data-act="open-mission" data-id="${m.id}">Open file</button>
        </div>
        ${m.brief ? `<p class="brief">${esc(m.brief)}</p>` : ""}
        <div>
          ${m.objectives.map((o) => objRow(m, o)).join("")}
          ${!closed ? addObjForm(m) : ""}
        </div>
        <div class="foot">
          <div style="flex:1">${CX.bar(p)}${pace ? `<div class="pace-mark" style="left:${pace.elapsed}%" title="Time elapsed: ${pace.elapsed}%"></div>` : ""}</div>
          <span class="mono tiny gold-t">${p}%</span>
        </div>
        <div class="foot">
          <span class="meta">${m.objectives.filter((o) => o.done).length}/${m.objectives.length} objectives · ${m.log.length} log entr${m.log.length === 1 ? "y" : "ies"}${m.deadline ? ` · due ${fmtDate(m.deadline, { day: "numeric", month: "short", year: "numeric" })}` : ""}</span>
          <div class="actions">
            ${m.status === "active" ? `<button class="btn sm ghost" data-act="mission-status" data-id="${m.id}" data-status="paused">Pause</button><button class="btn sm" data-act="accomplish" data-id="${m.id}">Accomplished</button>` : ""}
            ${m.status === "paused" ? `<button class="btn sm" data-act="mission-status" data-id="${m.id}" data-status="active">Resume</button>` : ""}
            ${closed ? `<button class="btn sm ghost" data-act="mission-status" data-id="${m.id}" data-status="active">Reopen</button>` : ""}
          </div>
        </div>
      </div>`;
  }

  function render() {
    const all = CX.S.missions;
    const active = all.filter((m) => m.status === "active");
    const year = today().slice(0, 4);
    const doneYear = all.filter((m) => m.status === "done" && (m.completedOn || "").startsWith(year)).length;
    const avg = active.length ? Math.round(active.reduce((a, m) => a + CX.progress(m), 0) / active.length) : 0;
    const behind = active.filter((m) => CX.pace(m)?.status === "Behind").length;
    let list = all.filter((m) => (CX.ui.mTab === "all" || m.status === CX.ui.mTab) && (CX.ui.mCat === "all" || m.category === CX.ui.mCat));
    const sorters = {
      priority: (a, b) => a.priority.localeCompare(b.priority) || (a.deadline || "9").localeCompare(b.deadline || "9"),
      deadline: (a, b) => (a.deadline || "9").localeCompare(b.deadline || "9"),
      progress: (a, b) => CX.progress(b) - CX.progress(a),
      recent: (a, b) => (b.created || b.startDate || "").localeCompare(a.created || a.startDate || ""),
    };
    list = list.sort(sorters[CX.ui.mSort] || sorters.priority);
    const cnt = (s) => all.filter((m) => m.status === s).length;
    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Active missions", active.length, `${cnt("paused")} paused`)}
        ${CX.stat("Accomplished · " + year, doneYear, `${cnt("done")} all time`)}
        ${CX.stat("Average progress", avg + "%", "across active missions")}
        ${CX.stat("Behind schedule", behind, `${overdueObjectives().length} overdue objective${overdueObjectives().length === 1 ? "" : "s"}`, behind ? "red-t" : "")}
      </div>
      <div class="toolbar">
        ${CX.tabs("mTab", [["active", `Active · ${cnt("active")}`], ["paused", `Paused · ${cnt("paused")}`], ["done", `Accomplished · ${cnt("done")}`], ["aborted", `Aborted · ${cnt("aborted")}`], ["all", "All"]])}
        <div class="filters">
          ${CX.uiSelect("mCat", [["all", "All theatres"], ...CATS], "Filter by theatre")}
          ${CX.uiSelect("mSort", [["priority", "Sort: priority"], ["deadline", "Sort: deadline"], ["progress", "Sort: progress"], ["recent", "Sort: newest"]], "Sort missions")}
        </div>
      </div>
      <div class="grid g2">${list.length ? list.map(card).join("") : `<div class="panel" style="grid-column:1/-1">${CX.empty("No missions here. Every agent needs an objective.")}</div>`}</div>`;
  }

  CX.openMission = (id) => {
    const m = CX.find("missions", id);
    if (!m) return;
    const p = CX.progress(m);
    const pace = CX.pace(m);
    const row = (k, v) => (v ? `<dt>${k}</dt><dd>${v}</dd>` : "");
    CX.showModal(`
      <div class="dossier">
        <div class="mono dim tiny">Mission file · ${STATUS[m.status]}</div>
        ${m.codename ? `<div class="mono tiny gold-t" style="margin-top:8px">Operation ${esc(m.codename)}</div>` : ""}
        <h2 style="margin:4px 0 6px">${esc(m.title)}</h2>
        <div class="badges"><span class="badge p${m.priority}">${PRI[m.priority]}</span><span class="badge">${esc(m.category)}</span>${countdown(m)}${pace ? `<span class="badge ${pace.status === "Behind" ? "bad" : "ok"}">${pace.status}</span>` : ""}</div>
        <div class="grid g2" style="margin-top:18px">
          <div>
            <dl>
              ${row("Brief", esc(m.brief))}
              ${row("Motive", esc(m.motive))}
              ${row("Reward", esc(m.reward))}
              ${row("Started", m.startDate ? fmtDate(m.startDate, { day: "numeric", month: "long", year: "numeric" }) : "")}
              ${row("Deadline", m.deadline ? `${fmtDate(m.deadline, { day: "numeric", month: "long", year: "numeric" })} <span class="dim">(${CX.relDays(m.deadline)})</span>` : "")}
              ${row("Completed", m.completedOn ? fmtDate(m.completedOn, { day: "numeric", month: "long", year: "numeric" }) : "")}
              ${row("Debrief", esc(m.debrief))}
            </dl>
            <div class="form-sec mono tiny">Progress</div>
            <div class="kv"><span>Objectives complete</span><b>${p}%</b></div>
            ${pace ? `<div class="kv"><span>Time elapsed</span><b>${pace.elapsed}%</b></div>` : ""}
            ${CX.bar(p)}
          </div>
          <div>
            <div class="form-sec mono tiny" style="margin-top:0">Objectives</div>
            ${m.objectives.map((o) => objRow(m, o)).join("") || CX.empty("No objectives yet.")}
            ${m.status !== "done" && m.status !== "aborted" ? addObjForm(m) : ""}
            <div class="form-sec mono tiny">Mission log</div>
            <form class="add-obj" data-form="mission-log" data-id="${m.id}"><input name="text" placeholder="Field note…" aria-label="Log entry" required><button class="btn sm">Log</button></form>
            <div class="list" style="margin-top:8px">${m.log.slice().sort((a, b) => b.date.localeCompare(a.date)).map((l) => `
              <div class="row"><div class="when">${fmtDate(l.date)}</div><div class="grow">${esc(l.text)}</div><button class="icon-btn" data-act="del-log" data-id="${m.id}" data-x="${l.id}" aria-label="Delete log entry">✕</button></div>`).join("") || CX.empty("No entries.")}</div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost danger left" data-act="abort-mission" data-id="${m.id}">${m.status === "aborted" ? "Delete mission" : "Abort mission"}</button>
          <button type="button" class="btn ghost" data-m="close">Close</button>
          <button type="button" class="btn" data-act="edit-mission" data-id="${m.id}">Edit</button>
          ${m.status === "active" ? `<button type="button" class="btn gold" data-act="accomplish" data-id="${m.id}">Mission accomplished</button>` : ""}
        </div>
      </div>`, { wide: true });
  };
  const refresh = (id) => { CX.save(); CX.render(); if (document.getElementById("modal").open) CX.openMission(id); };

  Object.assign(CX.actions, {
    "new-mission": () => editMission(null),
    "edit-mission": (id) => editMission(CX.find("missions", id)),
    "open-mission": (id) => CX.openMission(id),
    "toggle-obj": (id, el) => {
      const o = CX.find("missions", id).objectives.find((x) => x.id === el.dataset.obj);
      o.done = !o.done; o.doneOn = o.done ? today() : "";
      refresh(id);
      if (o.done && CX.progress(CX.find("missions", id)) === 100) CX.toast("All objectives complete. Mark the mission accomplished?");
    },
    "del-obj": (id, el) => { const m = CX.find("missions", id); m.objectives = m.objectives.filter((x) => x.id !== el.dataset.obj); refresh(id); },
    "del-log": (id, el) => { const m = CX.find("missions", id); m.log = m.log.filter((x) => x.id !== el.dataset.x); refresh(id); },
    "mission-status": (id, el) => {
      const m = CX.find("missions", id); m.status = el.dataset.status;
      if (m.status !== "done") m.completedOn = "";
      refresh(id); CX.toast(`Mission ${STATUS[m.status].toLowerCase()}.`);
    },
    accomplish: (id) => {
      const m = CX.find("missions", id);
      CX.openForm({
        kicker: "Mission accomplished", title: m.title, saveLabel: "Close the file",
        intro: "Record an after-action report while it's fresh. What worked, what didn't, what you'd do differently.",
        fields: [
          { key: "debrief", label: "Debrief", type: "textarea", rows: 5 },
          { key: "completedOn", label: "Completed on", type: "date", default: today },
          { key: "allObj", label: "Mark all objectives complete", type: "checkbox", default: true },
        ],
        values: { debrief: m.debrief },
        onSave: (d) => {
          m.status = "done"; m.debrief = d.debrief; m.completedOn = d.completedOn || today();
          if (d.allObj) m.objectives.forEach((o) => { if (!o.done) { o.done = true; o.doneOn = m.completedOn; } });
          CX.toast(`Mission accomplished${m.reward ? ` — claim your reward: ${m.reward}` : ""}.`);
        },
      });
    },
    "abort-mission": (id) => {
      const m = CX.find("missions", id);
      CX.closeModal();
      if (m.status === "aborted") CX.undoable("Mission deleted.", () => CX.remove("missions", id));
      else CX.undoable("Mission aborted.", () => { m.status = "aborted"; });
    },
  });
  CX.forms["add-obj"] = (d, f) => {
    if (!d.text) return;
    CX.find("missions", f.dataset.id).objectives.push({ id: uid(), text: d.text, done: false, due: d.due || "", doneOn: "" });
    refresh(f.dataset.id);
    document.querySelector(`[data-form="add-obj"][data-id="${f.dataset.id}"] input`)?.focus();
  };
  CX.forms["mission-log"] = (d, f) => {
    if (!d.text) return;
    CX.find("missions", f.dataset.id).log.push({ id: uid(), date: today(), text: d.text });
    refresh(f.dataset.id);
  };

  CX.view("missions", {
    order: 3, icon: "missions", label: "Missions", tabLabel: "Missions", kicker: "Goals & objectives", newAct: "new-mission", newLabel: "New mission",
    badge: () => overdueObjectives().length,
    render,
  });
})();

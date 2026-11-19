/* CIPHER — Drills: daily habits with streaks, a weekly grid and a discipline heatmap. */
(() => {
  "use strict";
  const { esc, today, addDays, parse, fmtDate } = CX;

  const CATS = ["Fitness", "Mind", "Health", "Discipline", "Learning", "Social", "Finance", "Craft"];
  const SLOTS = ["Morning", "Afternoon", "Evening", "Anytime"];
  const FREQ = [["daily", "Every day"], ["weekdays", "Weekdays only"], ["weekly", "X times per week"]];
  Object.assign(CX.ui, { drillWeek: "", drillShowArchived: "no" });

  const active = () => CX.S.drills.filter((d) => !d.archived);
  const isDone = (d, day) => !!d.log[day];
  const scheduled = (d, day) => {
    if (d.started && day < d.started) return false;
    if (d.freq === "weekdays") { const g = parse(day).getDay(); return g !== 0 && g !== 6; }
    return d.freq !== "weekly"; // weekly drills have no fixed day
  };
  const weekCount = (d, ws) => Array.from({ length: 7 }, (_, i) => isDone(d, addDays(ws, i))).filter(Boolean).length;

  CX.streak = (d) => {
    if (d.freq === "weekly") {
      let ws = CX.weekStart(today()), n = 0;
      if (weekCount(d, ws) >= (d.target || 1)) n++;
      ws = addDays(ws, -7);
      for (let i = 0; i < 520 && weekCount(d, ws) >= (d.target || 1); i++) { n++; ws = addDays(ws, -7); }
      return n;
    }
    let day = today(), n = 0;
    if (!isDone(d, day)) day = addDays(day, -1);
    for (let i = 0; i < 2000; i++) {
      if (d.started && day < d.started) break;
      if (!scheduled(d, day)) { day = addDays(day, -1); continue; }
      if (!isDone(d, day)) break;
      n++; day = addDays(day, -1);
    }
    return n;
  };
  const bestStreak = (d) => {
    if (d.freq === "weekly") return null;
    let best = 0, cur = 0;
    for (let i = 365; i >= 0; i--) {
      const day = addDays(today(), -i);
      if (!scheduled(d, day)) continue;
      if (isDone(d, day)) { cur++; best = Math.max(best, cur); } else if (i !== 0) cur = 0;
    }
    return best;
  };
  const rate30 = (d) => {
    if (d.freq === "weekly") {
      let done = 0; for (let i = 0; i < 28; i++) if (isDone(d, addDays(today(), -i))) done++;
      return Math.min(100, Math.round((done / ((d.target || 1) * 4)) * 100));
    }
    let sched = 0, done = 0;
    for (let i = 0; i < 30; i++) { const day = addDays(today(), -i); if (!scheduled(d, day)) continue; sched++; if (isDone(d, day)) done++; }
    return sched ? Math.round((done / sched) * 100) : 0;
  };
  const span = (d, n) => (d.freq === "weekly" ? `${n} wk${n === 1 ? "" : "s"}` : `${n} day${n === 1 ? "" : "s"}`);

  // Drills that count for today: daily/weekdays scheduled today, weekly ones still short of target this week
  CX.drillsToday = () => {
    const t = today(), ws = CX.weekStart(t);
    const list = active().filter((d) => (d.freq === "weekly" ? weekCount(d, ws) < (d.target || 1) || isDone(d, t) : scheduled(d, t)));
    return { list, done: list.filter((d) => isDone(d, t)).length, total: list.length };
  };
  CX.drillRow = (d) => {
    const t = today(), done = isDone(d, t), s = CX.streak(d);
    return `
      <div class="drill ${done ? "done" : ""}">
        <button type="button" class="check-btn ${done ? "on" : ""}" data-act="toggle-drill" data-id="${d.id}" data-day="${t}" aria-pressed="${done}" aria-label="Mark ${esc(d.name)} ${done ? "not done" : "done"}">${done ? "✓" : ""}</button>
        <div class="grow clickable" data-act="edit-drill" data-id="${d.id}"><div class="title">${esc(d.name)}</div><div class="meta">${esc(d.category)}${d.freq === "weekly" ? ` · ${weekCount(d, CX.weekStart(t))}/${d.target} this week` : ""}</div></div>
        <span class="mono tiny ${s ? "gold-t" : "faint"}" title="Current streak">${span(d, s)}</span>
      </div>`;
  };

  CX.searchers.push((q) => CX.S.drills.filter((d) => CX.match(q, d.name, d.category, d.notes)).slice(0, 5).map((d) => ({
    kind: "Drill", label: d.name, sub: `${span(d, CX.streak(d))} streak`, run: () => { location.hash = "drills"; CX.actions["edit-drill"](d.id); },
  })));

  const fields = () => [
    { key: "name", label: "Drill", required: true, placeholder: "e.g. 50 push-ups" },
    { key: "category", label: "Category", type: "select", options: CATS, half: true, default: "Fitness" },
    { key: "slot", label: "Time of day", type: "select", options: SLOTS, half: true, default: "Morning" },
    { key: "freq", label: "Frequency", type: "select", options: FREQ, half: true, default: "daily" },
    { key: "target", label: "Times per week", type: "number", min: 1, half: true, default: 3, hint: "Only for “X times per week”" },
    { key: "started", label: "Start date", type: "date", half: true, default: today },
    { key: "archived", label: "Archived", type: "checkbox", text: "Archive this drill (keeps history, hides it)", half: true },
    { key: "notes", label: "Notes / cue", type: "textarea", placeholder: "When and where you'll do it" },
  ];
  const editDrill = (rec) => CX.edit("drills", fields, rec, { noun: "drill", newTitle: "New drill", titleKey: "name", extra: () => ({ log: {} }) });

  function render() {
    const t = today();
    const ws = CX.ui.drillWeek || CX.weekStart(t);
    const act = active();
    const td = CX.drillsToday();
    const streaks = act.map((d) => ({ d, s: CX.streak(d) })).sort((a, b) => b.s - a.s);
    const disc = act.length ? Math.round(act.reduce((a, d) => a + rate30(d), 0) / act.length) : 0;

    const bySlot = SLOTS.map((slot) => {
      const items = td.list.filter((d) => (d.slot || "Anytime") === slot);
      return items.length ? `<div class="form-sec mono tiny">${slot}</div>${items.map(CX.drillRow).join("")}` : "";
    }).join("");

    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const grid = `
      <div style="overflow-x:auto"><table class="drill-grid">
        <thead><tr><th>Drill</th>${days.map((d, i) => `<th class="c ${d === t ? "gold-t" : ""}">${CX.dowLabels()[i]}<br><span class="faint">${parse(d).getDate()}</span></th>`).join("")}<th class="c hide-sm">Streak</th><th class="c hide-sm">30d</th><th class="c hide-sm">Best</th></tr></thead>
        <tbody>${act.map((d) => `<tr>
          <td><span class="title clickable" data-act="edit-drill" data-id="${d.id}">${esc(d.name)}</span><div class="meta">${d.freq === "weekly" ? `${weekCount(d, ws)}/${d.target} this week` : FREQ.find((f) => f[0] === d.freq)[1]}</div></td>
          ${days.map((day) => {
            const future = day > t, sch = scheduled(d, day) || d.freq === "weekly";
            return `<td class="c"><button type="button" class="cell ${isDone(d, day) ? "on" : ""} ${!sch ? "off" : ""}" ${future ? "disabled" : `data-act="toggle-drill" data-id="${d.id}" data-day="${day}"`} aria-label="${esc(d.name)} ${fmtDate(day)}"></button></td>`;
          }).join("")}
          <td class="c mono tiny gold-t hide-sm">${span(d, CX.streak(d))}</td>
          <td class="c mono tiny hide-sm">${rate30(d)}%</td>
          <td class="c mono tiny hide-sm dim">${bestStreak(d) ?? "—"}</td>
        </tr>`).join("") || `<tr><td colspan="11">${CX.empty("No drills yet.")}</td></tr>`}</tbody>
      </table></div>`;

    // 12-week heatmap of overall completion
    const hmStart = addDays(CX.weekStart(t), -77);
    let heat = "";
    for (let w = 0; w < 12; w++) {
      heat += `<div class="hm-col">`;
      for (let i = 0; i < 7; i++) {
        const day = addDays(hmStart, w * 7 + i);
        const sch = act.filter((d) => scheduled(d, day));
        const frac = day > t || !sch.length ? -1 : sch.filter((d) => isDone(d, day)).length / sch.length;
        heat += `<i class="hm l${frac < 0 ? "x" : Math.ceil(frac * 4)}" title="${fmtDate(day)}${frac >= 0 ? ` · ${Math.round(frac * 100)}%` : ""}"></i>`;
      }
      heat += `</div>`;
    }
    const archived = CX.S.drills.filter((d) => d.archived);

    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Today", `${td.done}<span class="dim">/${td.total}</span>`, td.total && td.done === td.total ? "All drills complete" : `${td.total - td.done} remaining`)}
        ${CX.stat("Active drills", act.length, `${archived.length} archived`)}
        ${CX.stat("Longest current streak", streaks[0] ? span(streaks[0].d, streaks[0].s) : "—", streaks[0] ? esc(streaks[0].d.name) : "")}
        ${CX.stat("Discipline · 30 days", disc + "%", "scheduled drills completed")}
      </div>
      <div class="grid split">
        <div class="stack">
          ${CX.panel("Today's drills", bySlot || CX.empty("Nothing scheduled today."), `<span class="mono tiny dim">${fmtDate(t, { weekday: "long" })}</span>`)}
          ${CX.panel("Discipline record", `<div class="heatmap">${heat}</div><div class="hm-legend mono tiny dim">Less <i class="hm l0"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i> More</div>`, `<span class="mono tiny dim">12 weeks</span>`)}
        </div>
        <div class="stack">
          ${CX.panel(`Week of ${fmtDate(ws, { day: "numeric", month: "short" })}`, grid, `<div class="month-nav"><button class="btn sm" data-act="drill-week" data-id="-7" aria-label="Previous week">‹</button><button class="btn sm" data-act="drill-week" data-id="0">This week</button><button class="btn sm" data-act="drill-week" data-id="7" aria-label="Next week">›</button></div>`)}
          ${archived.length ? CX.panel("Archived", archived.map((d) => `<div class="row clickable" data-act="edit-drill" data-id="${d.id}"><div class="grow"><div class="title">${esc(d.name)}</div><div class="meta">${Object.keys(d.log).length} completions on record</div></div></div>`).join("")) : ""}
        </div>
      </div>`;
  }

  Object.assign(CX.actions, {
    "new-drill": () => editDrill(null),
    "edit-drill": (id) => editDrill(CX.find("drills", id)),
    "toggle-drill": (id, el) => {
      const d = CX.find("drills", id), day = el.dataset.day;
      if (d.log[day]) delete d.log[day]; else d.log[day] = true;
      CX.save(); CX.render();
      if (d.log[day] && day === today()) { const s = CX.streak(d); if (s > 1 && (s % 7 === 0 || s === 3)) CX.toast(`${d.name}: ${span(d, s)}. Keep the edge.`); }
    },
    "drill-week": (n) => { const cur = CX.ui.drillWeek || CX.weekStart(today()); CX.ui.drillWeek = Number(n) === 0 ? "" : addDays(cur, Number(n)); CX.render(); },
  });

  CX.view("drills", {
    order: 3.5, parent: "missions", label: "Drills", tabLabel: "Drills", kicker: "Habits & daily discipline", newAct: "new-drill", newLabel: "New drill",
    badge: () => { const t = CX.drillsToday(); return t.total - t.done; },
    render,
  });
})();

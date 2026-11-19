/* CIPHER — Operations: calendar with month / week / agenda views and recurring events. */
(() => {
  "use strict";
  const { esc, today, addDays, parse, iso, daysBetween, fmtDate, MONTHS, pad } = CX;

  const CATS = { Work: "#c9a96a", Meeting: "#7f9cc0", Personal: "#a493c9", Social: "#c98fae", Health: "#7fb08a", Training: "#d09a6a", Travel: "#6fb3b8", Errand: "#8a8f98" };
  CX.EVENT_CATS = CATS;
  const RECUR = [["none", "Does not repeat"], ["daily", "Every day"], ["weekdays", "Every weekday (Mon–Fri)"], ["weekly", "Every week"], ["biweekly", "Every 2 weeks"], ["monthly", "Every month"], ["yearly", "Every year"]];
  const RECUR_LABEL = Object.fromEntries(RECUR);

  Object.assign(CX.ui, { calMonth: today().slice(0, 7), selDay: today(), opsView: "month", opsCat: "all" });

  CX.occursOn = (e, day) => {
    if (day < e.date || (e.until && day > e.until)) return false;
    if (day === e.date) return true;
    const a = parse(e.date), b = parse(day);
    switch (e.recur) {
      case "daily": return true;
      case "weekdays": return b.getDay() !== 0 && b.getDay() !== 6;
      case "weekly": return a.getDay() === b.getDay();
      case "biweekly": return a.getDay() === b.getDay() && daysBetween(e.date, day) % 14 === 0;
      case "monthly": return a.getDate() === b.getDate();
      case "yearly": return e.date.slice(5) === day.slice(5);
      default: return false;
    }
  };
  CX.eventsOn = (day) => CX.S.events.filter((e) => CX.occursOn(e, day)).sort((x, y) => (x.time || "").localeCompare(y.time || ""));

  CX.calendar.push((day) => CX.eventsOn(day).map((e) => ({
    kind: "event", label: e.title, time: e.time, end: e.endTime, color: CATS[e.category] || CATS.Errand, act: "edit-event", id: e.id,
    cat: e.category, img: e.photo, meta: [e.location, e.with && `with ${e.with}`].filter(Boolean).join(" · "),
  })));

  CX.searchers.push((q) => CX.S.events.filter((e) => CX.match(q, e.title, e.location, e.with, e.notes, e.category)).slice(0, 8).map((e) => ({
    kind: "Operation", label: e.title, sub: `${fmtDate(e.date, { day: "numeric", month: "short", year: "numeric" })}${e.recur !== "none" ? " · " + RECUR_LABEL[e.recur] : ""}`,
    run: () => { location.hash = "operations"; CX.ui.selDay = e.date; CX.ui.calMonth = e.date.slice(0, 7); CX.actions["edit-event"](e.id); },
  })));

  const fields = () => [
    { key: "title", label: "Operation", required: true, placeholder: "e.g. Briefing with the board" },
    { key: "category", label: "Type", type: "select", options: Object.keys(CATS), half: true, default: "Personal" },
    { key: "date", label: "Date", type: "date", required: true, half: true },
    { key: "time", label: "Start time", type: "time", half: true, hint: "Leave empty for all day" },
    { key: "endTime", label: "End time", type: "time", half: true },
    { key: "recur", label: "Repeats", type: "select", options: RECUR, half: true, default: "none" },
    { key: "until", label: "Repeat until", type: "date", half: true, hint: "Optional" },
    { key: "location", label: "Location", half: true },
    { key: "with", label: "With", placeholder: "People involved", half: true, list: CX.S.people.map((p) => p.name) },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "photo", label: "Photo", type: "photo", hint: "A venue, ticket, invitation or face to remember" },
  ];
  const editEvent = (rec, defaults) => CX.edit("events", fields, rec, {
    noun: "operation", newTitle: "Schedule operation", titleKey: "title", defaults,
    intro: rec && rec.recur !== "none" ? "This is a recurring operation — changes apply to every occurrence." : "",
  });

  const timeRange = (it) => (it.time ? `${CX.fmtTime(it.time)}${it.end ? "–" + CX.fmtTime(it.end) : ""}` : "");
  const filtered = (items) => (CX.ui.opsCat === "all" ? items : items.filter((x) => x.kind !== "event" || x.cat === CX.ui.opsCat));
  const chip = (x) => `<span class="chip k-${x.kind}" style="--c:${x.color || "var(--gold)"}">${x.time ? `<b>${esc(CX.fmtTime(x.time))}</b> ` : ""}${esc(x.label)}</span>`;
  const itemRow = (x) => `
    <div class="row ${x.act ? "clickable" : ""}" ${x.act ? `data-act="${x.act}" data-id="${x.id}"` : ""}>
      <span class="dot" style="--c:${x.color || "var(--gold)"}"></span>
      <div class="when">${x.time ? esc(timeRange(x)) : x.tag || "All day"}</div>
      <div class="grow"><div class="title">${esc(x.label)}</div>${x.meta ? `<div class="meta">${esc(x.meta)}</div>` : ""}</div>
      ${CX.img(x.img, "thumb")}
    </div>`;

  function monthView() {
    const [y, m] = CX.ui.calMonth.split("-").map(Number);
    const first = `${CX.ui.calMonth}-01`;
    const start = CX.weekStart(first);
    const t = today();
    let cells = CX.dowLabels().map((d) => `<div class="dow">${d}</div>`).join("");
    for (let i = 0; i < 42; i++) {
      const ds = addDays(start, i);
      const items = filtered(CX.itemsOn(ds));
      const out = parse(ds).getMonth() !== m - 1;
      if (i === 35 && out) break; // drop an empty 6th row
      const cls = ["day", out && "out", ds === t && "today", ds === CX.ui.selDay && "sel"].filter(Boolean).join(" ");
      cells += `<button type="button" class="${cls}" data-act="sel-day" data-id="${ds}" aria-label="${fmtDate(ds, { day: "numeric", month: "long" })}, ${items.length} items">
        <span class="n">${parse(ds).getDate()}</span>
        ${items.slice(0, 3).map(chip).join("")}
        ${items.length > 3 ? `<span class="more">+${items.length - 3} more</span>` : ""}
      </button>`;
    }
    return `
      <div class="cal-head">
        <h2>${MONTHS[m - 1]} <span class="dim">${y}</span></h2>
        <div class="month-nav">
          <button class="btn sm" data-act="cal-shift" data-id="-1" aria-label="Previous month">‹</button>
          <button class="btn sm" data-act="cal-today">Today</button>
          <button class="btn sm" data-act="cal-shift" data-id="1" aria-label="Next month">›</button>
        </div>
      </div>
      <div class="cal">${cells}</div>`;
  }

  function weekView() {
    const start = CX.weekStart(CX.ui.selDay);
    const t = today();
    const cols = Array.from({ length: 7 }, (_, i) => {
      const ds = addDays(start, i);
      const items = filtered(CX.itemsOn(ds));
      return `<div class="wcol ${ds === t ? "today" : ""} ${ds === CX.ui.selDay ? "sel" : ""}">
        <button type="button" class="whead" data-act="sel-day" data-id="${ds}"><span class="mono tiny dim">${CX.dowLabels()[i]}</span><span class="wn">${parse(ds).getDate()}</span></button>
        ${items.map((x) => `<div class="wit ${x.act ? "clickable" : ""}" style="--c:${x.color || "var(--gold)"}" ${x.act ? `data-act="${x.act}" data-id="${x.id}"` : ""}>
          ${CX.img(x.img, "wit-img")}<div class="mono tiny">${esc(timeRange(x) || x.tag || "All day")}</div><div class="title">${esc(x.label)}</div>${x.meta ? `<div class="meta">${esc(x.meta)}</div>` : ""}</div>`).join("") || `<div class="faint tiny" style="padding:6px 2px">—</div>`}
      </div>`;
    }).join("");
    return `
      <div class="cal-head">
        <h2>${fmtDate(start, { day: "numeric", month: "short" })} – ${fmtDate(addDays(start, 6), { day: "numeric", month: "short", year: "numeric" })}</h2>
        <div class="month-nav">
          <button class="btn sm" data-act="week-shift" data-id="-7" aria-label="Previous week">‹</button>
          <button class="btn sm" data-act="cal-today">Today</button>
          <button class="btn sm" data-act="week-shift" data-id="7" aria-label="Next week">›</button>
        </div>
      </div>
      <div class="week">${cols}</div>`;
  }

  function agendaView() {
    const t = today();
    let html = "";
    for (let i = 0; i < 60; i++) {
      const ds = addDays(t, i);
      const items = filtered(CX.itemsOn(ds));
      if (!items.length) continue;
      html += `<div class="agenda-day"><div class="agenda-date"><div class="serif">${parse(ds).getDate()}</div><div class="mono tiny dim">${fmtDate(ds, { weekday: "short" })} · ${fmtDate(ds, { month: "short" })}</div><div class="mono tiny gold-t">${i === 0 ? "Today" : i === 1 ? "Tomorrow" : `in ${i} days`}</div></div><div class="list grow">${items.map(itemRow).join("")}</div></div>`;
    }
    return `<div class="cal-head"><h2>Next 60 days</h2></div><div class="panel">${html || CX.empty("Nothing scheduled in the next 60 days.")}</div>`;
  }

  function render() {
    const sel = CX.itemsOn(CX.ui.selDay);
    const t = today();
    const main = CX.ui.opsView === "week" ? weekView() : CX.ui.opsView === "agenda" ? agendaView() : monthView();
    return `
      <div class="toolbar">
        ${CX.tabs("opsView", [["month", "Month"], ["week", "Week"], ["agenda", "Agenda"]])}
        <div class="legend">
          <button type="button" class="leg ${CX.ui.opsCat === "all" ? "on" : ""}" data-act="tab" data-id="opsCat:all">All</button>
          ${Object.entries(CATS).map(([k, c]) => `<button type="button" class="leg ${CX.ui.opsCat === k ? "on" : ""}" data-act="tab" data-id="opsCat:${k}"><span class="dot" style="--c:${c}"></span>${k}</button>`).join("")}
        </div>
      </div>
      <div class="grid cal-wrap">
        <div>${main}</div>
        <div class="stack">
          <div class="panel">
            <div class="panel-head"><div><div class="mono dim tiny">${CX.ui.selDay === t ? "Today" : CX.relDays(CX.ui.selDay)}</div><h2>${fmtDate(CX.ui.selDay, { weekday: "long", day: "numeric", month: "long" })}</h2></div></div>
            <div class="list">${sel.length ? sel.map(itemRow).join("") : CX.empty("No operations on this day.")}</div>
            <form class="quick-add" data-form="quick-event">
              <input name="title" placeholder="Quick add for this day…" aria-label="Quick add operation" required>
              <input name="time" type="time" aria-label="Time">
              <button class="btn sm">Add</button>
            </form>
          </div>
        </div>
      </div>`;
  }

  function exportIcs() {
    const dt = (d, tm) => d.replace(/-/g, "") + (tm ? "T" + tm.replace(":", "") + "00" : "");
    const RR = { daily: "FREQ=DAILY", weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", weekly: "FREQ=WEEKLY", biweekly: "FREQ=WEEKLY;INTERVAL=2", monthly: "FREQ=MONTHLY", yearly: "FREQ=YEARLY" };
    const tx = (s) => String(s || "").replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cipher//Operations//EN", "CALSCALE:GREGORIAN"];
    CX.S.events.forEach((e) => {
      L.push("BEGIN:VEVENT", `UID:${e.id}@cipher`, `DTSTAMP:${dt(today())}T000000`, `SUMMARY:${tx(e.title)}`);
      if (e.time) { L.push(`DTSTART:${dt(e.date, e.time)}`, `DTEND:${dt(e.date, e.endTime && e.endTime > e.time ? e.endTime : e.time)}`); }
      else { L.push(`DTSTART;VALUE=DATE:${dt(e.date)}`, `DTEND;VALUE=DATE:${dt(addDays(e.date, 1))}`); }
      if (RR[e.recur]) L.push(`RRULE:${RR[e.recur]}${e.until ? ";UNTIL=" + dt(e.until) + (e.time ? "T235959" : "") : ""}`);
      if (e.location) L.push(`LOCATION:${tx(e.location)}`);
      if (e.notes || e.with) L.push(`DESCRIPTION:${tx([e.with && "With: " + e.with, e.notes].filter(Boolean).join("\n"))}`);
      L.push(`CATEGORIES:${tx(e.category)}`, "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    CX.download(`cipher-operations-${today()}.ics`, L.join("\r\n"), "text/calendar");
    CX.toast("Calendar exported (.ics).");
  }

  Object.assign(CX.actions, {
    "new-event": () => editEvent(null, { date: CX.route() === "operations" ? CX.ui.selDay : today() }),
    "edit-event": (id) => editEvent(CX.find("events", id)),
    "sel-day": (id) => { CX.ui.selDay = id; CX.ui.calMonth = id.slice(0, 7); CX.render(); },
    "cal-shift": (n) => { CX.ui.calMonth = CX.shiftMonth(CX.ui.calMonth, Number(n)); CX.render(); },
    "week-shift": (n) => { CX.ui.selDay = addDays(CX.ui.selDay, Number(n)); CX.ui.calMonth = CX.ui.selDay.slice(0, 7); CX.render(); },
    "cal-today": () => { CX.ui.calMonth = today().slice(0, 7); CX.ui.selDay = today(); CX.render(); },
    "export-ics": exportIcs,
  });
  CX.forms["quick-event"] = (d) => {
    if (!d.title) return;
    CX.S.events.push({ id: CX.uid(), title: d.title, category: "Personal", date: CX.ui.selDay, time: d.time || "", endTime: "", recur: "none", until: "", location: "", with: "", notes: "" });
    CX.save(); CX.render(); CX.toast("Operation scheduled.");
    document.querySelector("[data-form='quick-event'] input")?.focus();
  };

  CX.view("operations", {
    order: 2, icon: "calendar", label: "Calendar", kicker: "Operations & schedule", newAct: "new-event", newLabel: "Operation",
    head: () => `<button class="btn" data-act="export-ics" title="Download an .ics file for Google / Apple / Outlook calendar">Export .ics</button>`,
    badge: () => CX.eventsOn(today()).length || 0,
    render,
  });
})();

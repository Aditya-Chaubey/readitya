/* CIPHER — Network: dossiers on the people you know, contact cadence and interaction history. */
(() => {
  "use strict";
  const { esc, today, addDays, daysBetween, fmtDate, initials, uid } = CX;

  const TIERS = [["inner", "Inner circle"], ["trusted", "Trusted"], ["associate", "Associate"], ["acquaintance", "Acquaintance"]];
  const TIER = Object.fromEntries(TIERS);
  const ITYPES = ["Call", "Meeting", "Message", "Email", "Video call", "Event", "Gift"];
  Object.assign(CX.ui, { nTier: "all", nQ: "", nSort: "name" });

  CX.lastSeen = (p) => [p.lastContact, ...p.interactions.map((i) => i.date)].filter(Boolean).sort().pop() || "";
  CX.cadence = (p) => Number(p.cadence) || Number(CX.S.settings.cadence) || 30;
  CX.isCold = (p) => { const l = CX.lastSeen(p); return !l || daysBetween(l, today()) > CX.cadence(p); };
  const bdayMD = (b) => (/^\d{4}-\d{2}-\d{2}$/.test(b || "") ? b.slice(5) : /^\d{2}-\d{2}$/.test(b || "") ? b : "");
  CX.nextBirthday = (p) => {
    const md = bdayMD(p.birthday);
    if (!md) return "";
    const t = today();
    let d = `${t.slice(0, 4)}-${md}`;
    if (d < t) d = `${Number(t.slice(0, 4)) + 1}-${md}`;
    return d;
  };
  CX.ageAt = (p, date) => (/^\d{4}/.test(p.birthday || "") && p.birthday.length === 10 ? Number(date.slice(0, 4)) - Number(p.birthday.slice(0, 4)) : null);
  // warmth: 100 = just spoke, 0 = cadence fully elapsed
  const warmth = (p) => { const l = CX.lastSeen(p); return l ? Math.max(0, Math.round(100 - (daysBetween(l, today()) / CX.cadence(p)) * 100)) : 0; };

  CX.calendar.push((day) => CX.S.people.filter((p) => bdayMD(p.birthday) === day.slice(5)).map((p) => {
    const age = CX.ageAt(p, day);
    return { kind: "birthday", label: `${p.name}'s birthday${age ? ` (${age})` : ""}`, tag: "Birthday", color: "var(--blue)", act: "view-person", id: p.id };
  }));
  CX.searchers.push((q) => CX.S.people.filter((p) => CX.match(q, p.name, p.alias, p.relation, p.company, p.role, p.location, p.tags, p.notes, p.interests)).slice(0, 8).map((p) => ({
    kind: "Person", label: p.name, sub: [p.relation, p.company, p.location].filter(Boolean).join(" · "), run: () => { location.hash = "network"; CX.openDossier(p.id); },
  })));

  const fields = () => [
    { key: "name", label: "Full name", required: true, section: "Identity" },
    { key: "photo", label: "Portrait", type: "photo", max: 640 },
    { key: "alias", label: "Alias / nickname", half: true },
    { key: "tier", label: "Clearance tier", type: "select", options: TIERS, half: true, default: "associate" },
    { key: "relation", label: "Relation", list: ["Friend", "Family", "Partner", "Colleague", "Mentor", "Client", "Neighbour", "Contact"], half: true },
    { key: "howMet", label: "How you met", half: true },
    { key: "company", label: "Organisation", half: true },
    { key: "role", label: "Role", half: true },
    { key: "phone", label: "Phone", type: "tel", half: true, section: "Contact" },
    { key: "email", label: "Email", type: "email", half: true },
    { key: "social", label: "Social / handle", half: true },
    { key: "location", label: "City", half: true },
    { key: "address", label: "Address", type: "textarea", rows: 2 },
    { key: "birthday", label: "Birthday", placeholder: "YYYY-MM-DD or MM-DD", half: true, section: "Personal", hint: "Year optional — adds age" },
    { key: "family", label: "Family", half: true, placeholder: "Partner, kids, pets…" },
    { key: "interests", label: "Interests", placeholder: "What they love talking about" },
    { key: "giftIdeas", label: "Gift ideas", type: "textarea", rows: 2 },
    { key: "cadence", label: "Contact every (days)", type: "number", min: 1, half: true, section: "Protocol", hint: `Default ${CX.S.settings.cadence} days` },
    { key: "lastContact", label: "Last contact", type: "date", half: true },
    { key: "tags", label: "Tags", placeholder: "comma, separated" },
    { key: "notes", label: "Intel", type: "textarea", rows: 4, placeholder: "Preferences, history, things to remember…" },
  ];
  const editPerson = (rec) => CX.edit("people", fields, rec, { noun: "dossier", newTitle: "New dossier", titleKey: "name", wide: true, extra: () => ({ interactions: [] }) });

  function card(p) {
    const l = CX.lastSeen(p), w = warmth(p), cold = CX.isCold(p);
    const bd = CX.nextBirthday(p);
    const soon = bd && daysBetween(today(), bd) <= 14;
    return `
      <button type="button" class="panel person" data-act="view-person" data-id="${p.id}">
        ${CX.avatar(p)}
        <div style="min-width:0;flex:1">
          <div class="pname">${esc(p.name)}${p.alias ? ` <span class="dim mono tiny">“${esc(p.alias)}”</span>` : ""}</div>
          <div class="meta">${esc([p.relation, p.role && p.company ? `${p.role}, ${p.company}` : p.company || p.role, p.location].filter(Boolean).join(" · ") || "—")}</div>
          <div class="warm"><div class="bar ${cold ? "over" : ""}"><i style="width:${w}%"></i></div><span class="mono tiny ${cold ? "red-t" : "dim"}">${l ? CX.relDays(l) : "never"}</span></div>
          <div class="tags"><span class="badge t-${p.tier}">${TIER[p.tier]}</span>${soon ? `<span class="badge warn">Birthday ${CX.relDays(bd)}</span>` : ""}${(p.tags || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>
        </div>
      </button>`;
  }

  function render() {
    const all = CX.S.people;
    const q = (CX.ui.nQ || "").toLowerCase();
    let list = all.filter((p) => (CX.ui.nTier === "all" || (CX.ui.nTier === "cold" ? CX.isCold(p) : p.tier === CX.ui.nTier))
      && (!q || CX.match(q, p.name, p.alias, p.relation, p.company, p.role, p.location, p.tags, p.notes, p.interests, p.family)));
    const sorters = {
      name: (a, b) => a.name.localeCompare(b.name),
      recent: (a, b) => CX.lastSeen(b).localeCompare(CX.lastSeen(a)),
      cold: (a, b) => warmth(a) - warmth(b),
      birthday: (a, b) => (CX.nextBirthday(a) || "9").localeCompare(CX.nextBirthday(b) || "9"),
      tier: (a, b) => TIERS.findIndex((t) => t[0] === a.tier) - TIERS.findIndex((t) => t[0] === b.tier) || a.name.localeCompare(b.name),
    };
    list = list.sort(sorters[CX.ui.nSort] || sorters.name);
    const cold = all.filter(CX.isCold).length;
    const bdays = all.filter((p) => { const b = CX.nextBirthday(p); return b && daysBetween(today(), b) <= 30; }).length;
    const month = today().slice(0, 7);
    const touches = all.reduce((a, p) => a + p.interactions.filter((i) => i.date.startsWith(month)).length, 0);
    const n = (k) => all.filter((p) => p.tier === k).length;
    return `
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Network", all.length, `${n("inner")} inner circle · ${n("trusted")} trusted`)}
        ${CX.stat("Going cold", cold, "past their contact cadence", cold ? "red-t" : "")}
        ${CX.stat("Birthdays · 30 days", bdays)}
        ${CX.stat("Interactions this month", touches)}
      </div>
      <div class="toolbar">
        ${CX.tabs("nTier", [["all", "All"], ...TIERS.map(([k, l]) => [k, `${l} · ${n(k)}`]), ["cold", `Cold · ${cold}`]])}
        <div class="filters">
          ${CX.uiSearch("nQ", "Search names, tags, intel…")}
          ${CX.uiSelect("nSort", [["name", "Sort: name"], ["recent", "Sort: recent contact"], ["cold", "Sort: coldest first"], ["birthday", "Sort: next birthday"], ["tier", "Sort: tier"]], "Sort people")}
        </div>
      </div>
      <div class="people">${list.length ? list.map(card).join("") : `<div class="panel" style="grid-column:1/-1">${CX.empty(all.length ? "No one matches." : "Your network is empty. Open a dossier on someone you know.")}</div>`}</div>`;
  }

  CX.openDossier = (id) => {
    const p = CX.find("people", id);
    if (!p) return;
    const bd = CX.nextBirthday(p), l = CX.lastSeen(p), age = CX.ageAt(p, today());
    const row = (k, v) => (v ? `<dt>${k}</dt><dd>${v}</dd>` : "");
    const ix = p.interactions.slice().sort((a, b) => b.date.localeCompare(a.date));
    CX.showModal(`
      <div class="dossier">
        <div class="mono dim tiny">Dossier · ${TIER[p.tier]} · Classified</div>
        <div style="display:flex;gap:16px;align-items:center;margin-top:12px">
          ${CX.avatar(p, "lg")}
          <div style="min-width:0"><h2 style="margin:0">${esc(p.name)}</h2><div class="dim">${esc([p.alias && `“${p.alias}”`, p.relation, p.role && p.company ? `${p.role} at ${p.company}` : p.company || p.role].filter(Boolean).join(" · "))}</div></div>
        </div>
        <div class="grid g2" style="margin-top:14px">
          <div>
            <div class="form-sec mono tiny">Profile</div>
            <dl>
              ${row("City", esc(p.location))}
              ${row("Phone", p.phone ? `<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>` : "")}
              ${row("Email", p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : "")}
              ${row("Social", esc(p.social))}
              ${row("Address", esc(p.address))}
              ${row("Birthday", bd ? `${fmtDate(bd, { day: "numeric", month: "long" })}${age !== null ? ` · ${age} yrs` : ""} <span class="dim">(${CX.relDays(bd)})</span>` : "")}
              ${row("How met", esc(p.howMet))}
              ${row("Family", esc(p.family))}
              ${row("Interests", esc(p.interests))}
              ${row("Gift ideas", esc(p.giftIdeas))}
              ${row("Tags", esc(p.tags))}
              ${row("Intel", esc(p.notes))}
            </dl>
          </div>
          <div>
            <div class="form-sec mono tiny" style="margin-top:0">Contact protocol</div>
            <div class="kv"><span>Last contact</span><b class="${CX.isCold(p) ? "red-t" : ""}">${l ? `${fmtDate(l, { day: "numeric", month: "short", year: "numeric" })} · ${CX.relDays(l)}` : "Never"}</b></div>
            <div class="kv"><span>Cadence</span><b>every ${CX.cadence(p)} days</b></div>
            <div class="kv"><span>Next contact due</span><b>${l ? fmtDate(addDays(l, CX.cadence(p)), { day: "numeric", month: "short" }) : "Now"}</b></div>
            <div style="margin:8px 0 4px">${CX.bar(warmth(p), CX.isCold(p) ? "over" : "")}</div>
            <div class="form-sec mono tiny">Log interaction</div>
            <form class="ix-form" data-form="interaction" data-id="${p.id}">
              <select name="type" aria-label="Interaction type">${ITYPES.map((t) => `<option>${t}</option>`).join("")}</select>
              <input name="date" type="date" value="${today()}" aria-label="Date">
              <input name="note" placeholder="What was discussed?" aria-label="Note" class="ix-note">
              <button class="btn sm gold">Log</button>
            </form>
            <div class="form-sec mono tiny">History · ${ix.length}</div>
            <div class="list">${ix.map((i) => `<div class="row"><div class="when">${fmtDate(i.date, { day: "numeric", month: "short", year: "2-digit" })}</div><div class="grow"><div class="title">${esc(i.type)}</div>${i.note ? `<div class="meta">${esc(i.note)}</div>` : ""}</div><button class="icon-btn" data-act="del-ix" data-id="${p.id}" data-x="${i.id}" aria-label="Delete interaction">✕</button></div>`).join("") || CX.empty("No interactions logged.")}</div>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn ghost left" data-m="close">Close</button>
          <button type="button" class="btn" data-act="edit-person" data-id="${p.id}">Edit dossier</button>
        </div>
      </div>`, { wide: true });
  };

  Object.assign(CX.actions, {
    "new-person": () => editPerson(null),
    "edit-person": (id) => editPerson(CX.find("people", id)),
    "view-person": (id) => CX.openDossier(id),
    "log-contact": (id) => {
      const p = CX.find("people", id);
      p.interactions.push({ id: uid(), date: today(), type: "Message", note: "" });
      CX.save(); CX.render(); CX.toast(`Contact with ${p.name} logged.`);
    },
    "del-ix": (id, el) => { const p = CX.find("people", id); p.interactions = p.interactions.filter((i) => i.id !== el.dataset.x); CX.save(); CX.render(); CX.openDossier(id); },
  });
  CX.forms.interaction = (d, f) => {
    const p = CX.find("people", f.dataset.id);
    p.interactions.push({ id: uid(), date: d.date || today(), type: d.type, note: d.note });
    CX.save(); CX.render(); CX.openDossier(p.id); CX.toast("Interaction logged.");
  };

  CX.view("network", {
    order: 5, icon: "people", label: "People", kicker: "Network & dossiers", newAct: "new-person", newLabel: "New dossier",
    badge: () => CX.S.people.filter(CX.isCold).length,
    render,
  });
})();

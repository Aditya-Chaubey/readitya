/* CIPHER — Vault: important documents and records, with expiry tracking. */
(() => {
  "use strict";
  const { esc, today, daysBetween, fmtDate } = CX;

  const KINDS = ["Identity", "Finance", "Insurance", "Vehicle", "Medical", "Property", "Education", "Travel", "Legal", "Note", "Other"];
  Object.assign(CX.ui, { vKind: "all", vQ: "", vReveal: {} });

  const expiryState = (v) => {
    if (!v.expiry) return null;
    const n = daysBetween(today(), v.expiry);
    return n < 0 ? { cls: "bad", text: `Expired ${-n} days ago`, n } : n <= 60 ? { cls: "warn", text: `Expires ${CX.relDays(v.expiry)}`, n } : { cls: "", text: `Valid to ${fmtDate(v.expiry, { month: "short", year: "numeric" })}`, n };
  };
  CX.vaultAlerts = () => CX.S.vault.filter((v) => { const s = expiryState(v); return s && s.n <= 60; }).sort((a, b) => a.expiry.localeCompare(b.expiry));
  const mask = (s) => (!s ? "" : s.length <= 4 ? "••••" : "•••• " + s.slice(-4));

  CX.calendar.push((day) => CX.S.vault.filter((v) => v.expiry === day).map((v) => ({ kind: "expiry", label: `${v.title} expires`, tag: "Expiry", color: "var(--red)", act: "edit-vault", id: v.id })));
  CX.searchers.push((q) => CX.S.vault.filter((v) => CX.match(q, v.title, v.kind, v.issuer, v.notes, v.location)).slice(0, 6).map((v) => ({
    kind: "Vault", label: v.title, sub: [v.kind, expiryState(v)?.text].filter(Boolean).join(" · "), run: () => { location.hash = "vault"; CX.actions["edit-vault"](v.id); },
  })));

  const fields = () => [
    { key: "title", label: "Record", required: true, placeholder: "e.g. Passport" },
    { key: "kind", label: "Kind", type: "select", options: KINDS, half: true, default: "Identity" },
    { key: "issuer", label: "Issued by", half: true },
    { key: "reference", label: "Reference / number", half: true, hint: "Masked on screen until revealed" },
    { key: "location", label: "Where it's kept", half: true, placeholder: "Safe, wallet, email…" },
    { key: "issued", label: "Issue date", type: "date", half: true },
    { key: "expiry", label: "Expiry date", type: "date", half: true },
    { key: "notes", label: "Notes", type: "textarea" },
    { key: "scan", label: "Scan / photo of the document", type: "photo", max: 1600 },
    { key: "pinned", label: "Pinned", type: "checkbox", text: "Pin to the top" },
  ];
  const editVault = (rec) => CX.edit("vault", fields, rec, {
    noun: "record", newTitle: "New vault record", titleKey: "title",
    intro: "Never store passwords or full card numbers here — data is kept unencrypted in this browser.",
  });

  function render() {
    const q = (CX.ui.vQ || "").toLowerCase();
    const list = CX.S.vault.filter((v) => (CX.ui.vKind === "all" || v.kind === CX.ui.vKind) && (!q || CX.match(q, v.title, v.kind, v.issuer, v.notes, v.location)));
    const alerts = CX.vaultAlerts();
    const expired = CX.S.vault.filter((v) => expiryState(v)?.cls === "bad").length;
    const groups = KINDS.map((k) => [k, list.filter((v) => v.kind === k).sort((a, b) => (b.pinned - a.pinned) || a.title.localeCompare(b.title))]).filter(([, l]) => l.length);
    const pinned = list.filter((v) => v.pinned);
    const row = (v) => {
      const s = expiryState(v), shown = CX.ui.vReveal[v.id];
      return `<div class="row">
        <div class="grow clickable" data-act="edit-vault" data-id="${v.id}">
          <div class="title">${v.pinned ? `<span class="gold-t">◆</span> ` : ""}${esc(v.title)}</div>
          <div class="meta">${esc([v.issuer, v.location && `kept: ${v.location}`].filter(Boolean).join(" · "))}</div>
        </div>
        ${CX.img(v.scan, "thumb clickable", v.title).replace("<img", `<img data-act="view-scan" data-id="${v.id}"`)}
        ${v.reference ? `<button type="button" class="ref mono" data-act="reveal" data-id="${v.id}" title="${shown ? "Hide" : "Reveal"} reference">${esc(shown ? v.reference : mask(v.reference))}</button>` : ""}
        ${s ? `<span class="badge ${s.cls}">${s.text}</span>` : `<span class="badge">No expiry</span>`}
      </div>`;
    };
    return `
      <div class="notice"><b>Classified, not encrypted.</b> Records live only in this browser. Use the vault for document numbers, expiry dates and where things are kept — never passwords or full card numbers.</div>
      <div class="grid g4 stats" style="margin-bottom:18px">
        ${CX.stat("Records", CX.S.vault.length, `${pinned.length} pinned`)}
        ${CX.stat("Expiring · 60 days", alerts.length - expired, "", alerts.length - expired ? "gold-t" : "")}
        ${CX.stat("Expired", expired, expired ? "renew immediately" : "", expired ? "red-t" : "")}
        ${CX.stat("Categories", new Set(CX.S.vault.map((v) => v.kind)).size)}
      </div>
      ${alerts.length ? `<div class="panel" style="margin-bottom:18px"><div class="panel-head"><h2>Renewal watch</h2></div><div class="list">${alerts.map(row).join("")}</div></div>` : ""}
      <div class="toolbar"><div class="filters">${CX.uiSearch("vQ", "Search the vault…")}${CX.uiSelect("vKind", [["all", "All kinds"], ...KINDS], "Filter by kind")}</div></div>
      <div class="grid g2">${groups.map(([k, l]) => CX.panel(k, `<div class="list">${l.map(row).join("")}</div>`, `<span class="mono tiny dim">${l.length}</span>`)).join("") || `<div class="panel" style="grid-column:1/-1">${CX.empty("The vault is empty.")}</div>`}</div>`;
  }

  Object.assign(CX.actions, {
    "new-vault": () => editVault(null),
    "edit-vault": (id) => editVault(CX.find("vault", id)),
    "view-scan": (id) => { const v = CX.find("vault", id); CX.showModal(`<div><div class="kicker gold-t">${esc(v.kind)}</div><h2>${esc(v.title)}</h2>${CX.img(v.scan, "scan-full", v.title)}<div class="modal-foot"><button type="button" class="btn ghost left" data-m="close">Close</button><button type="button" class="btn gold" data-act="edit-vault" data-id="${v.id}">Edit</button></div></div>`, { wide: true }); },
    reveal: (id) => { CX.ui.vReveal[id] = !CX.ui.vReveal[id]; CX.render(); },
  });

  CX.view("vault", {
    order: 8.5, parent: "journal", label: "Vault", tabLabel: "Vault", kicker: "Documents & records", newAct: "new-vault", newLabel: "New record",
    badge: () => CX.vaultAlerts().length, render,
  });
})();

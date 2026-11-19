/* CIPHER — core: utilities, state, photo storage, forms, router, search, lock.
   Records live in this browser's localStorage; photos live in IndexedDB. Use Settings → Archive to back up. */
(() => {
  "use strict";
  const CX = (window.CX = { views: {}, actions: {}, forms: {}, changes: {}, calendar: [], searchers: [], ui: {} });

  // ---------- Utilities ----------
  const $ = (s, el = document) => el.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMonths = (s, n) => {
    const [y, m, d] = s.split("-").map(Number);
    const last = new Date(y, m - 1 + n + 1, 0).getDate();
    return iso(new Date(y, m - 1 + n, Math.min(d, last)));
  };
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const fmtDate = (s, o = { day: "numeric", month: "short" }) => (s ? parse(s).toLocaleDateString("en-GB", o) : "");
  const relDays = (s) => {
    if (!s) return "never";
    const n = daysBetween(today(), s);
    return n === 0 ? "today" : n === 1 ? "tomorrow" : n === -1 ? "yesterday" : n > 0 ? `in ${n} days` : `${-n} days ago`;
  };
  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const sum = (arr, f = (x) => x.amount) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shiftMonth = (m, n) => addMonths(m + "-01", n).slice(0, 7);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const match = (q, ...fields) => fields.join(" ").toLowerCase().includes(q);
  const dayOfYear = () => { const n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 86400000); };
  Object.assign(CX, { $, uid, esc, pad, iso, parse, today, addDays, addMonths, daysBetween, MONTHS, fmtDate, relDays, initials, clamp, sum, pick, shiftMonth, cap, match, dayOfYear });

  CX.weekStartIdx = () => (CX.S.settings.weekStart === "sun" ? 0 : 1);
  CX.weekStart = (s) => { const off = (parse(s).getDay() - CX.weekStartIdx() + 7) % 7; return addDays(s, -off); };
  CX.dowLabels = () => { const L = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; const w = CX.weekStartIdx(); return [...L.slice(w), ...L.slice(0, w)]; };
  CX.fmtTime = (t) => {
    if (!t) return "";
    if (CX.S.settings.clock !== "12") return t;
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${pad(m)}${h < 12 ? "am" : "pm"}`;
  };
  CX.money = (n, { sign = false } = {}) => {
    const v = Number(n) || 0;
    const loc = CX.S.settings.grouping === "intl" ? "en-US" : "en-IN";
    const s = Math.abs(v).toLocaleString(loc, { maximumFractionDigits: 2 });
    return (v < 0 ? "−" : sign && v > 0 ? "+" : "") + CX.S.settings.currency + s;
  };
  CX.isTouch = () => window.matchMedia("(pointer: coarse)").matches;
  CX.download = async (name, text, type = "application/json") => {
    try {
      const file = new File([text], name, { type });
      if (CX.isTouch() && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (err) { if (err && err.name === "AbortError") return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  CX.safeUrl = (u) => { const s = String(u || "").trim(); if (!s) return ""; return /^https?:\/\//i.test(s) ? s : /^[\w.-]+\.[a-z]{2,}/i.test(s) ? "https://" + s : ""; };
  CX.host = (u) => { try { return new URL(CX.safeUrl(u)).hostname.replace(/^www\./, ""); } catch { return u; } };

  // ---------- Icons (inline line icons) ----------
  const ICONS = {
    briefing: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    missions: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    cases: '<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6.6 8.1l4 7.6M17.4 8.1l-4 7.6M7.5 6h9"/>',
    people: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    money: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    skills: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    journal: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  };
  CX.icon = (name, size = 18) => `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  // ---------- Photo storage (IndexedDB, cached in memory) ----------
  CX.media = (() => {
    const DB = "cipher-media", STORE = "media", cache = {};
    let db = null;
    const open = () => new Promise((res) => {
      try {
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      } catch { res(null); }
    });
    const tx = (mode, fn) => { if (!db) return; try { fn(db.transaction(STORE, mode).objectStore(STORE)); } catch {} };
    return {
      async init() {
        db = await open();
        if (!db) return;
        await new Promise((res) => {
          try {
            const rq = db.transaction(STORE).objectStore(STORE).openCursor();
            rq.onsuccess = () => { const c = rq.result; if (c) { cache[c.key] = c.value; c.continue(); } else res(); };
            rq.onerror = () => res();
          } catch { res(); }
        });
      },
      available: () => !!db,
      put(data, id = "m_" + uid()) { cache[id] = data; tx("readwrite", (s) => s.put(data, id)); return id; },
      get: (id) => (id && cache[id]) || "",
      del(id) { delete cache[id]; tx("readwrite", (s) => s.delete(id)); },
      all: () => ({ ...cache }),
      // Downscale and re-encode an image file/blob to keep storage small
      fromFile(file, max = 1280) {
        return new Promise((res, rej) => {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
            const c = document.createElement("canvas");
            c.width = Math.max(1, Math.round(img.naturalWidth * s));
            c.height = Math.max(1, Math.round(img.naturalHeight * s));
            const g = c.getContext("2d");
            g.fillStyle = "#0e1013"; g.fillRect(0, 0, c.width, c.height);
            g.drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url);
            res(CX.media.put(c.toDataURL("image/jpeg", 0.84)));
          };
          img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("unreadable")); };
          img.src = url;
        });
      },
    };
  })();
  CX.img = (id, cls = "", alt = "") => { const s = CX.media.get(id); return s ? `<img class="${cls}" src="${s}" alt="${esc(alt)}" loading="lazy" draggable="false">` : ""; };
  CX.avatar = (p, cls = "") => {
    const src = p && CX.media.get(p.photo);
    return `<div class="mono-av ${cls} ${p && p.tier ? "t-" + p.tier : ""}">${src ? `<img src="${src}" alt="">` : esc(initials((p && p.name) || "?"))}</div>`;
  };

  // ---------- State ----------
  const KEY = "cipher.v2";
  const COLLS = ["events", "missions", "drills", "cases", "txns", "accounts", "recurring", "reserves", "people", "skills", "journal", "vault"];
  CX.COLLS = COLLS;
  CX.blank = () => ({
    version: 3,
    settings: {
      codename: "Agent", realName: "", currency: "₹", grouping: "indian", budget: 30000, catBudgets: {},
      clock: "24", weekStart: "mon", cadence: 30, accent: "gold", pinHash: "", autoLock: 0,
    },
    ...Object.fromEntries(COLLS.map((k) => [k, []])),
  });
  CX.normalize = (d) => {
    const b = CX.blank();
    const s = { ...b, ...d, settings: { ...b.settings, ...((d && d.settings) || {}) } };
    delete s.media;
    COLLS.forEach((k) => { if (!Array.isArray(s[k])) s[k] = []; });
    if (!s.settings.catBudgets || typeof s.settings.catBudgets !== "object") s.settings.catBudgets = {};
    s.events.forEach((e) => { e.recur ||= "none"; e.category ||= "Personal"; });
    s.missions.forEach((m) => { m.objectives ||= []; m.log ||= []; m.status ||= "active"; m.priority = String(m.priority || "2"); m.category ||= "Personal"; });
    s.drills.forEach((x) => { if (!x.log || typeof x.log !== "object") x.log = {}; x.freq ||= "daily"; });
    s.cases.forEach((c) => { c.nodes ||= []; c.links ||= []; c.status ||= "open"; c.view ||= { x: 0, y: 0, z: 1 }; });
    s.txns.forEach((t) => { t.type ||= "expense"; t.payee ??= t.note || ""; });
    s.people.forEach((p) => { p.interactions ||= []; p.tier ||= "associate"; });
    s.skills.forEach((k) => { k.sessions ||= []; k.level = Number(k.level || 0); k.status ||= "target"; });
    s.reserves.forEach((r) => { r.log ||= []; });
    s.version = 3;
    return s;
  };
  function load() {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem("cipher.v1");
      return raw ? CX.normalize(JSON.parse(raw)) : CX.seed();
    } catch { return CX.seed(); }
  }
  CX.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(CX.S)); }
    catch { CX.toast("Storage unavailable — export a backup now."); }
  };
  CX.find = (coll, id) => CX.S[coll].find((x) => x.id === id);
  CX.remove = (coll, id) => { CX.S[coll] = CX.S[coll].filter((x) => x.id !== id); };
  CX.backup = () => {
    const json = JSON.stringify(CX.S);
    const media = {};
    Object.entries(CX.media.all()).forEach(([k, v]) => { if (json.includes(k)) media[k] = v; });
    return JSON.stringify({ ...CX.S, media });
  };

  // ---------- Toast & undo ----------
  let toastT;
  CX.toast = (msg, opts = {}) => {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(msg)}</span>${opts.undo ? `<button type="button" class="toast-btn">Undo</button>` : ""}`;
    if (opts.undo) el.querySelector("button").onclick = () => { el.classList.remove("show"); opts.undo(); };
    el.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove("show"), opts.undo ? 6000 : 2200);
  };
  CX.undoable = (msg, fn) => {
    const snap = JSON.stringify(CX.S);
    fn(); CX.save(); CX.render();
    CX.toast(msg, { undo: () => { CX.S = CX.normalize(JSON.parse(snap)); CX.save(); CX.render(); CX.toast("Restored."); } });
  };

  // ---------- Modal & forms ----------
  CX.showModal = (html, { wide = false } = {}) => {
    const dlg = $("#modal");
    dlg.classList.toggle("wide", wide);
    $("#modalBody").innerHTML = html;
    const fresh = !dlg.open;
    if (fresh) dlg.showModal();
    return fresh;
  };
  CX.closeModal = () => { if ($("#modal").open) $("#modal").close(); };

  // fields: { key, label, type, options, required, half, placeholder, hint, list, section, default, text, rows, max }
  CX.openForm = (o) => {
    const { kicker = "", title, intro = "", fields, values = {}, onSave, onDelete, saveLabel = "Save", wide = false } = o;
    const lists = [];
    const val = (f) => {
      const v = values[f.key];
      if (v !== undefined && v !== null && v !== "") return v;
      return typeof f.default === "function" ? f.default() : f.default ?? "";
    };
    const control = (f) => {
      const v = val(f);
      const id = `f_${f.key}`;
      const common = `name="${f.key}" id="${id}" ${f.required ? "required" : ""}`;
      const ph = f.placeholder ? `placeholder="${esc(f.placeholder)}"` : "";
      if (f.type === "textarea") return `<textarea ${common} ${ph} rows="${f.rows || 3}">${esc(v)}</textarea>`;
      if (f.type === "select") {
        return `<select ${common}>${f.options.map((op) => { const [ov, ol] = Array.isArray(op) ? op : [op, op]; return `<option value="${esc(ov)}" ${String(ov) === String(v) ? "selected" : ""}>${esc(ol)}</option>`; }).join("")}</select>`;
      }
      if (f.type === "checkbox") return `<label class="check"><input type="checkbox" ${common} ${v === true ? "checked" : ""}><span>${esc(f.text || f.label)}</span></label>`;
      if (f.type === "photo") {
        const src = CX.media.get(v);
        return `<div class="photo-field" data-photo-field data-max="${f.max || 1280}">
          <input type="hidden" ${common} value="${esc(src ? v : "")}">
          <div class="photo-prev">${src ? `<img src="${src}" alt="">` : `<span>${CX.icon("image", 22)}No photo</span>`}</div>
          <div class="photo-btns">
            <label class="btn sm">Choose photo<input type="file" accept="image/*" hidden data-photo-input></label>
            <button type="button" class="btn sm ghost" data-photo-clear>Remove</button>
          </div>
        </div>`;
      }
      let extra = "";
      if (f.list) { lists.push(`<datalist id="${id}_l">${f.list.map((x) => `<option value="${esc(x)}"></option>`).join("")}</datalist>`); extra = `list="${id}_l"`; }
      const num = f.type === "number" ? `step="${f.step || "any"}" ${f.min !== undefined ? `min="${f.min}"` : ""}` : "";
      return `<input type="${f.type || "text"}" value="${esc(v)}" ${common} ${ph} ${num} ${extra}>`;
    };
    const cell = (f) => `<div class="field">${f.type === "checkbox" ? "" : `<label for="f_${f.key}">${esc(f.label)}</label>`}${control(f)}${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ""}</div>`;
    let html = "";
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (f.section) html += `<div class="form-sec">${esc(f.section)}</div>`;
      const n = fields[i + 1];
      if (f.half && n && n.half && !n.section) { html += `<div class="two">${cell(f)}${cell(n)}</div>`; i++; }
      else html += cell(f);
    }
    const fresh = CX.showModal(`
      <form class="mform" autocomplete="off">
        <div class="kicker gold-t">${esc(kicker)}</div>
        <h2>${esc(title)}</h2>
        ${intro ? `<p class="help">${intro}</p>` : ""}
        ${html}${lists.join("")}
        <div class="modal-foot">
          ${onDelete ? `<button type="button" class="btn ghost danger left" data-del>Delete</button>` : ""}
          <button type="button" class="btn ghost" data-m="close">Cancel</button>
          <button type="submit" class="btn gold">${esc(saveLabel)}</button>
        </div>
      </form>`, { wide });
    const form = $("#modalBody form");
    form.querySelectorAll("[data-photo-field]").forEach((pf) => {
      const hidden = pf.querySelector("input[type=hidden]"), prev = pf.querySelector(".photo-prev"), file = pf.querySelector("[data-photo-input]");
      file.onchange = async () => {
        const f = file.files[0];
        if (!f) return;
        prev.innerHTML = "<span>Developing…</span>";
        try {
          const id = await CX.media.fromFile(f, Number(pf.dataset.max) || 1280);
          hidden.value = id;
          prev.innerHTML = `<img src="${CX.media.get(id)}" alt="">`;
        } catch { prev.innerHTML = "<span>Could not read that image</span>"; }
      };
      pf.querySelector("[data-photo-clear]").onclick = () => { hidden.value = ""; file.value = ""; prev.innerHTML = `<span>${CX.icon("image", 22)}No photo</span>`; };
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {};
      fields.forEach((f) => {
        if (f.type === "checkbox") data[f.key] = fd.has(f.key);
        else if (f.type === "number") data[f.key] = fd.get(f.key) === "" ? "" : Number(fd.get(f.key));
        else data[f.key] = String(fd.get(f.key) ?? "").trim();
      });
      if (onSave(data) === false) return;
      CX.save(); CX.closeModal(); CX.render();
    };
    const del = form.querySelector("[data-del]");
    if (del) del.onclick = () => { CX.closeModal(); CX.undoable("Record deleted.", onDelete); };
    if (fresh) setTimeout(() => form.querySelector("input:not([type=checkbox]):not([type=hidden]):not([type=file]),textarea,select")?.focus(), 30);
  };

  // Generic create / edit for a collection record
  CX.edit = (coll, schema, rec, o) => {
    const isNew = !rec;
    CX.openForm({
      kicker: `${isNew ? "New" : "Edit"} ${o.noun}`,
      title: isNew ? o.newTitle : rec[o.titleKey] || o.newTitle,
      intro: o.intro, wide: o.wide, saveLabel: o.saveLabel,
      fields: typeof schema === "function" ? schema(rec) : schema,
      values: rec || (typeof o.defaults === "function" ? o.defaults() : o.defaults) || {},
      onSave: (d) => {
        if (o.transform) d = o.transform(d, rec) || d;
        if (isNew) {
          const r = { id: uid(), created: today(), ...(o.extra ? o.extra() : {}), ...d };
          CX.S[coll].push(r);
          o.onCreate?.(r);
        } else Object.assign(rec, d);
        CX.toast(isNew ? `${cap(o.noun)} logged.` : "Updated.");
      },
      onDelete: isNew ? null : () => CX.remove(coll, rec.id),
    });
  };

  // ---------- UI components ----------
  CX.tabs = (key, items) => `<div class="tabs" role="tablist">${items.map(([v, l]) => `<button type="button" role="tab" class="${CX.ui[key] === v ? "on" : ""}" data-act="tab" data-id="${key}:${v}">${l}</button>`).join("")}</div>`;
  CX.stat = (label, val, sub = "", cls = "") => `<div class="stat"><div class="kicker">${label}</div><div class="val ${cls}">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
  CX.bar = (pct, cls = "") => `<div class="bar ${cls}"><i style="width:${clamp(Number(pct) || 0, 0, 100)}%"></i></div>`;
  CX.empty = (t) => `<div class="empty">${t}</div>`;
  CX.pips = (n, max = 5, target = 0) => Array.from({ length: max }, (_, i) => `<i class="${i < Number(n) ? "on" : i < Number(target) ? "tgt" : ""}"></i>`).join("");
  CX.uiSelect = (key, options, label) => `<select class="mini" data-ui="${key}" aria-label="${esc(label)}">${options.map((op) => { const [v, l] = Array.isArray(op) ? op : [op, op]; return `<option value="${esc(v)}" ${String(CX.ui[key]) === String(v) ? "selected" : ""}>${esc(l)}</option>`; }).join("")}</select>`;
  CX.uiSearch = (key, ph) => `<input type="search" class="mini-search" id="q_${key}" data-ui="${key}" value="${esc(CX.ui[key] || "")}" placeholder="${esc(ph)}" aria-label="${esc(ph)}">`;
  CX.panel = (title, body, right = "", cls = "") => `<div class="panel ${cls}"><div class="panel-head"><h2>${title}</h2>${right}</div>${body}</div>`;
  CX.link = (route, text) => `<a class="kicker link" href="#${route}">${text} →</a>`;

  // Calendar: modules push providers (day) => [{ kind, label, time, color, act, id, meta, img }]
  CX.itemsOn = (day) => CX.calendar.flatMap((f) => f(day)).sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // ---------- Router & render ----------
  CX.view = (key, def) => { CX.views[key] = def; };
  const sortedViews = () => Object.entries(CX.views).sort((a, b) => a[1].order - b[1].order);
  const topViews = () => sortedViews().filter(([, x]) => !x.parent && !x.footer);
  CX.route = () => { const h = location.hash.slice(1).split("/")[0]; return CX.views[h] ? h : "briefing"; };
  CX.routeArg = () => decodeURIComponent(location.hash.slice(1).split("/")[1] || "");

  CX.render = () => {
    const act = document.activeElement;
    const focusId = act && act.id && $("#view").contains(act) ? act.id : null;
    let caret = null;
    try { caret = focusId ? act.selectionStart : null; } catch {}
    const r = CX.route();
    const v = CX.views[r];
    const fam = v.parent || r;
    const famDef = CX.views[fam];
    const badgeOf = (k) => sortedViews().filter(([kk, x]) => kk === k || x.parent === k).reduce((a, [, x]) => a + (Number(x.badge ? x.badge() : 0) || 0), 0);
    $("#nav").innerHTML = topViews().map(([k, x]) => {
      const b = badgeOf(k);
      return `<a href="#${k}" class="${k === fam ? "on" : ""}" ${k === fam ? 'aria-current="page"' : ""}>${CX.icon(x.icon)}<span class="nl">${x.label}</span>${b ? `<span class="nb">${b}</span>` : ""}</a>`;
    }).join("");
    $("#settingsLink").classList.toggle("on", r === "settings");
    const kids = sortedViews().filter(([k, x]) => k === fam || x.parent === fam);
    const sub = kids.length > 1 ? `<nav class="subnav" aria-label="${esc(famDef.label)}">${kids.map(([k, x]) => `<a href="#${k}" class="${k === r ? "on" : ""}">${x.tabLabel || x.label}</a>`).join("")}</nav>` : "";
    const bleed = !!(v.bleed && v.bleed());
    $(".main").classList.toggle("bleed", bleed);
    document.body.classList.toggle("bleed", bleed);
    const TABS = ["briefing", "operations", "missions", "cases"];
    const inMore = !TABS.includes(fam);
    const moreBadge = topViews().filter(([k]) => !TABS.includes(k)).reduce((a, [k]) => a + badgeOf(k), 0);
    $("#tabbar").innerHTML = TABS.map((k) => { const x = CX.views[k]; const b = badgeOf(k); return `<a href="#${k}" class="${k === fam ? "on" : ""}" ${k === fam ? 'aria-current="page"' : ""}>${CX.icon(x.icon, 22)}<span>${x.label}</span>${b ? `<i class="tb-dot" aria-label="${b} need attention"></i>` : ""}</a>`; }).join("")
      + `<button type="button" class="${inMore ? "on" : ""}" data-act="more-menu" aria-label="More sections">${CX.icon("menu", 22)}<span>${inMore && r !== "settings" ? esc(famDef.label) : "More"}</span>${moreBadge ? '<i class="tb-dot"></i>' : ""}</button>`;
    $("#pageKicker").textContent = v.kicker;
    $("#pageTitle").textContent = famDef.label;
    $("#pageActions").innerHTML = (v.head ? v.head() : "") + (v.newAct && !v.hideNew ? `<button class="btn gold" data-act="${v.newAct}" title="Shortcut: N">${CX.icon("plus", 14)} ${v.newLabel}</button>` : "");
    $("#view").innerHTML = (bleed ? "" : sub) + v.render();
    v.after?.();
    $("#footCodename").textContent = CX.S.settings.codename;
    document.title = `${v.tabLabel || famDef.label} · Cipher`;
    document.body.classList.remove("nav-open");
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); if (caret != null) try { el.setSelectionRange(caret, caret); } catch {} }
    }
  };

  // ---------- Global actions ----------
  Object.assign(CX.actions, {
    tab: (id) => { const [k, v] = id.split(":"); CX.ui[k] = v; CX.render(); },
    go: (id) => { location.hash = id; },
    "more-menu": () => {
      const r = CX.route(), fam = CX.views[r].parent || r;
      const badgeOf = (k) => sortedViews().filter(([kk, x]) => kk === k || x.parent === k).reduce((a, [, x]) => a + (Number(x.badge ? x.badge() : 0) || 0), 0);
      CX.showModal(`<div class="more-sheet">
        <div class="kicker gold-t">Cipher</div><h2>All sections</h2>
        <div class="more-grid">${topViews().map(([k, x]) => { const b = badgeOf(k); return `<a href="#${k}" data-m="close" class="more-item ${k === fam ? "on" : ""}">${CX.icon(x.icon, 24)}<span>${x.label}</span>${b ? `<b class="nb">${b}</b>` : ""}</a>`; }).join("")}</div>
        <div class="more-list">
          <a href="#settings" data-m="close" class="more-row">${CX.icon("settings", 18)}<span>Settings</span></a>
          <button type="button" class="more-row" data-act="open-search">${CX.icon("search", 18)}<span>Search everything</span></button>
          <button type="button" class="more-row" data-act="lock-console">${CX.icon("lock", 18)}<span>Lock console</span></button>
        </div>
        <div class="agent-line kicker">Agent ${esc(CX.S.settings.codename)} · ${esc($("#clock").textContent)}</div>
      </div>`);
    },
    "open-search": () => CX.openPalette(),
    "lock-console": () => CX.lock(),
    "export-json": () => { CX.download(`cipher-backup-${today()}.json`, CX.backup()); CX.toast("Backup exported (photos included)."); },
  });

  // ---------- Event delegation ----------
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-m='close']")) { CX.closeModal(); return; }
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const fn = CX.actions[el.dataset.act];
    if (!fn) return;
    if (!(el.tagName === "INPUT" && el.type === "checkbox")) e.preventDefault();
    e.stopPropagation();
    fn(el.dataset.id, el, e);
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const data = {};
    new FormData(f).forEach((v, k) => { data[k] = typeof v === "string" ? v.trim() : v; });
    CX.forms[f.dataset.form]?.(data, f);
  });
  const uiSet = (el) => { CX.ui[el.dataset.ui] = el.value; CX.render(); };
  document.addEventListener("input", (e) => {
    if (e.target.matches("input[data-ui]")) uiSet(e.target);
    if (e.target.id === "palInput") { palSel = 0; palRender(); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("select[data-ui]")) uiSet(e.target);
    const c = e.target.closest("[data-change]");
    if (c) CX.changes[c.dataset.change]?.(c, e);
  });
  ["modal", "palette"].forEach((id) => {
    const d = document.getElementById(id);
    d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); });
  });

  // ---------- Command palette ----------
  let palItems = [], palSel = 0, palMode = "all";
  function palCommands() {
    const cmds = [];
    sortedViews().forEach(([k, v]) => {
      if (palMode === "all") cmds.push({ kind: "Go to", label: v.tabLabel || v.label, sub: v.kicker, run: () => (location.hash = k) });
      if (v.newAct) cmds.push({ kind: "Create", label: v.createLabel || v.newLabel, sub: CX.views[v.parent || k].label, run: () => { location.hash = k; setTimeout(() => CX.actions[v.newAct](), 30); } });
    });
    if (palMode === "create") cmds.push({ kind: "Create", label: "Income", sub: "Money", run: () => { location.hash = "treasury"; setTimeout(() => CX.actions["new-income"](), 30); } });
    if (palMode === "all") {
      cmds.push({ kind: "Command", label: "Lock console", sub: "Shift + L", run: () => CX.lock() });
      cmds.push({ kind: "Command", label: "Export backup", sub: "Download everything", run: () => CX.actions["export-json"]() });
    }
    return cmds;
  }
  function palRender() {
    const q = $("#palInput").value.trim().toLowerCase();
    const cmds = palCommands().filter((c) => !q || match(q, c.label, c.sub || "", c.kind));
    const rank = (it) => { const l = it.label.toLowerCase(); return l.startsWith(q) ? 0 : l.split(/\s+/).some((w) => w.startsWith(q)) ? 1 : l.includes(q) ? 2 : 3; };
    const recs = q && palMode === "all" ? CX.searchers.flatMap((f) => f(q)).map((it, i) => ({ it, i, r: rank(it) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.it) : [];
    palItems = [...cmds, ...recs].slice(0, 50);
    palSel = clamp(palSel, 0, Math.max(0, palItems.length - 1));
    $("#palList").innerHTML = palItems.length
      ? palItems.map((it, i) => `<button type="button" class="pal-item ${i === palSel ? "on" : ""}" data-pi="${i}"><span class="badge">${esc(it.kind)}</span><span class="pal-label">${esc(it.label)}</span><span class="pal-sub">${esc(it.sub || "")}</span></button>`).join("")
      : CX.empty("No matches.");
    $("#palList .on")?.scrollIntoView({ block: "nearest" });
  }
  function palRun(i) { const it = palItems[i]; if (!it) return; $("#palette").close(); it.run(); }
  CX.openPalette = (mode = "all") => {
    const d = $("#palette");
    if (d.open || !$("#lock").hidden) return;
    CX.closeModal();
    palMode = mode; palSel = 0;
    $("#palInput").value = "";
    $("#palInput").placeholder = mode === "create" ? "What would you like to create?" : "Search everything, or type a command…";
    d.showModal(); palRender(); $("#palInput").focus();
  };
  $("#palInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); palRender(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(palSel - 1, 0); palRender(); }
    else if (e.key === "Enter") { e.preventDefault(); palRun(palSel); }
  });
  $("#palList").addEventListener("click", (e) => { const b = e.target.closest("[data-pi]"); if (b) palRun(Number(b.dataset.pi)); });
  $("#searchBtn").onclick = () => CX.openPalette();
  $("#searchBtnM").onclick = () => CX.openPalette();
  $("#newBtn").onclick = () => CX.openPalette("create");
  $("#newBtnM").onclick = () => CX.openPalette("create");

  // ---------- Keyboard shortcuts ----------
  document.addEventListener("keydown", (e) => {
    const a = document.activeElement;
    const typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); CX.openPalette(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || $("#modal").open || $("#palette").open || !$("#lock").hidden) return;
    const v = CX.views[CX.route()];
    if (v.onKey && v.onKey(e)) { e.preventDefault(); return; }
    if (e.key === "/") { e.preventDefault(); CX.openPalette(); }
    else if (e.key === "n" && v.newAct) { e.preventDefault(); CX.actions[v.newAct](); }
    else if (e.key === "L" && e.shiftKey) { e.preventDefault(); CX.lock(); }
    else if (/^[1-9]$/.test(e.key)) { const t = topViews()[Number(e.key) - 1]; if (t) location.hash = t[0]; }
  });

  // ---------- Lock ----------
  CX.hash = async (str) => {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cipher:" + str));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; for (const c of "cipher:" + str) h = (h * 31 + c.charCodeAt(0)) | 0;
    return "x" + h;
  };
  CX.lock = () => {
    if (!CX.S.settings.pinHash) return CX.toast("Set a passcode in Settings to enable the lock.");
    CX.closeModal();
    if ($("#palette").open) $("#palette").close();
    $("#lock").hidden = false; $("#lockInput").value = ""; $("#lockMsg").textContent = "";
    setTimeout(() => $("#lockInput").focus(), 30);
  };
  $("#lockBtn").onclick = () => CX.lock();
  $("#lockForm").onsubmit = async (e) => {
    e.preventDefault();
    if ((await CX.hash($("#lockInput").value)) === CX.S.settings.pinHash) { $("#lock").hidden = true; lastActive = Date.now(); CX.render(); }
    else { $("#lockMsg").textContent = "Access denied"; $("#lockInput").value = ""; }
  };
  let lastActive = Date.now();
  ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
  setInterval(() => {
    const m = Number(CX.S?.settings.autoLock) || 0;
    if (m > 0 && CX.S.settings.pinHash && $("#lock").hidden && Date.now() - lastActive > m * 60000) CX.lock();
  }, 15000);

  // ---------- Clock & prefs ----------
  function tick() {
    const d = new Date();
    const t = CX.fmtTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    $("#clock").textContent = `${d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })} · ${t}`;
  }
  CX.applyPrefs = () => { document.documentElement.dataset.accent = CX.S.settings.accent || "gold"; tick(); };

  // ---------- Boot ----------
  CX.boot = async () => {
    document.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", CX.icon(el.dataset.icon)));
    await CX.media.init();
    CX.S = load();
    CX.save();
    // remove photos no record refers to any more
    const json = JSON.stringify(CX.S);
    Object.keys(CX.media.all()).forEach((id) => { if (!json.includes(id)) CX.media.del(id); });
    CX.applyPrefs();
    setInterval(tick, 15000);
    window.addEventListener("hashchange", () => { CX.views[CX.route()].onEnter?.(); CX.render(); window.scrollTo(0, 0); });
    CX.render();
    if (CX.S.settings.pinHash) CX.lock();
    CX.installHint();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  };

  // ---------- Install on iPhone ----------
  CX.isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  CX.isStandalone = () => window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  CX.installHint = () => {
    document.documentElement.classList.toggle("standalone", CX.isStandalone());
    const el = $("#installHint");
    let dismissed = false;
    try { dismissed = localStorage.getItem("cipher.installHint") === "no"; } catch {}
    if (!CX.isIOS() || CX.isStandalone() || dismissed) return;
    const share = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>';
    el.innerHTML = `<span class="crest xs">C</span><div class="grow"><b>Install Cipher</b><div>Tap ${share} <b>Share</b>, then <b>Add to Home Screen</b>.</div></div><button type="button" class="icon-btn" aria-label="Dismiss">✕</button>`;
    el.hidden = false;
    el.querySelector("button").onclick = () => { el.hidden = true; try { localStorage.setItem("cipher.installHint", "no"); } catch {} };
  };
})();

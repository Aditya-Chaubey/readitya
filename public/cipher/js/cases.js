/* CIPHER — Cases: open-ended projects worked on a node board.
   Add notes, photos, people, evidence and options as nodes, then wire them together. */
(() => {
  "use strict";
  const { esc, today, uid, fmtDate, clamp } = CX;

  const TYPES = {
    question: { label: "Question", color: "#c6a15b", ph: "What are you trying to find out?" },
    note: { label: "Note", color: "#9aa0a8", ph: "A thought, fact or observation" },
    evidence: { label: "Evidence", color: "#d07a6a", ph: "What was found" },
    photo: { label: "Photo", color: "#7f9cc0", ph: "Caption" },
    person: { label: "Person", color: "#a493c9", ph: "Name" },
    option: { label: "Option", color: "#6fb3b8", ph: "A possible choice" },
    link: { label: "Link", color: "#7fb08a", ph: "Source or reference" },
    verdict: { label: "Verdict", color: "#e4c88a", ph: "The conclusion" },
  };
  const WIRES = { related: ["Related", "#7d838c"], supports: ["Supports", "#7fb08a"], contradicts: ["Contradicts", "#d07a6a"], leads: ["Leads to", "#c6a15b"] };
  const KINDS = ["Investigation", "Decision", "Gift", "Purchase", "Research", "Planning", "Personal", "Other"];
  const STATUS = { open: "Open", cold: "Cold", solved: "Solved" };
  const NW = 232; // node width
  const PY = 17; // port offset from node top
  Object.assign(CX.ui, { caseTab: "open", caseQ: "", caseSide: window.innerWidth > 1100 ? "1" : "" });

  let sel = null;      // { kind: 'node' | 'wire', id }
  let drag = null;     // active pointer gesture
  let pending = null;  // where the add-menu / photo picker will place a node
  let viewSaveT;
  const pts = new Map(); // active touch points, for pinch zoom
  let pinch = null;
  let lastTap = null;
  let lastPtr = null, edgeT = null;
  // While dragging a node or a connection near the canvas edge, pan the board so off-screen nodes can be reached
  function edgeLoop() {
    edgeT = null;
    const c = cur(), cv = el("canvas");
    if (!drag || (drag.mode !== "wire" && drag.mode !== "node") || !c || !cv || !lastPtr) return;
    const r = cv.getBoundingClientRect();
    const tb = document.querySelector(".tools")?.getBoundingClientRect();
    const bottom = tb && tb.top > r.top + r.height / 2 ? tb.top : r.bottom;
    const m = 48, sp = 12;
    let dx = 0, dy = 0;
    if (lastPtr.x < r.left + m) dx = sp; else if (lastPtr.x > r.right - m) dx = -sp;
    if (lastPtr.y < r.top + m) dy = sp; else if (lastPtr.y > bottom - m) dy = -sp;
    if (!dx && !dy) return;
    c.view.x += dx; c.view.y += dy; applyView(c);
    if (drag.mode === "node") {
      drag.ox -= dx / c.view.z; drag.oy -= dy / c.view.z; drag.moved = true;
      const n = nodeOf(c, drag.id);
      n.x = Math.round(drag.ox + (lastPtr.x - drag.sx) / c.view.z); n.y = Math.round(drag.oy + (lastPtr.y - drag.sy) / c.view.z);
      drag.el.style.left = n.x + "px"; drag.el.style.top = n.y + "px";
      drawWires(c);
    } else {
      const a = nodeOf(c, drag.from), t = el("tempWire");
      if (a && t) t.setAttribute("d", bez(outP(a), toWorld(c, lastPtr.x, lastPtr.y)).d);
    }
    edgeT = setTimeout(edgeLoop, 16);
  }
  // true when this tap completes a double-tap on the same target
  function isDoubleTap(key, e) {
    const now = Date.now();
    if (lastTap && now - lastTap.t < 350 && lastTap.key === key && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { lastTap = null; return true; }
    lastTap = { t: now, key, x: e.clientX, y: e.clientY };
    return false;
  }

  const cur = () => (CX.route() === "cases" ? CX.find("cases", CX.routeArg()) : null);
  const nodeOf = (c, id) => c.nodes.find((n) => n.id === id);
  const touch = (c) => { c.updated = today(); };
  const el = (id) => document.getElementById(id);

  // ---------- Templates ----------
  const TEMPLATES = {
    blank: { label: "Blank board", build: () => ({ nodes: [], links: [] }) },
    investigation: {
      label: "Investigation — suspects, evidence, theory",
      build: (q) => {
        const n = {
          q: mk("question", 0, 0, q || "Who did it?"), e1: mk("evidence", -330, -110, "Evidence #1"), e2: mk("evidence", -330, 90, "Evidence #2"),
          s1: mk("person", 330, -190, "Suspect A"), s2: mk("person", 330, 0, "Suspect B"), s3: mk("person", 330, 190, "Suspect C"),
          t: mk("note", 660, 0, "Working theory"), v: mk("verdict", 990, 0, "Verdict"),
        };
        return { nodes: Object.values(n), links: [lk(n.e1, n.q, "leads"), lk(n.e2, n.q, "leads"), lk(n.q, n.s1), lk(n.q, n.s2), lk(n.q, n.s3), lk(n.s2, n.t), lk(n.t, n.v, "leads")] };
      },
    },
    decision: {
      label: "Decision — criteria, options, choice",
      build: (q) => {
        const n = {
          c: mk("note", -330, 0, "Criteria", "Budget:\nMust have:\nNice to have:"), q: mk("question", 0, 0, q || "What should I choose?"),
          o1: mk("option", 330, -200, "Option 1"), o2: mk("option", 330, 0, "Option 2"), o3: mk("option", 330, 200, "Option 3"), v: mk("verdict", 660, 0, "Decision"),
        };
        return { nodes: Object.values(n), links: [lk(n.c, n.q, "leads"), lk(n.q, n.o1), lk(n.q, n.o2), lk(n.q, n.o3)] };
      },
    },
    research: {
      label: "Research — sources, findings, conclusion",
      build: (q) => {
        const n = { q: mk("question", 0, 0, q || "What do I need to know?"), s1: mk("link", 330, -120, "Source 1"), s2: mk("link", 330, 80, "Source 2"), f: mk("note", 660, -20, "Findings"), v: mk("verdict", 990, -20, "Conclusion") };
        return { nodes: Object.values(n), links: [lk(n.q, n.s1), lk(n.q, n.s2), lk(n.s1, n.f, "supports"), lk(n.s2, n.f, "supports"), lk(n.f, n.v, "leads")] };
      },
    },
  };
  function mk(type, x, y, title = "", body = "", extra = {}) { return { id: uid(), type, x, y, title, body, photo: "", url: "", price: "", rating: 0, personId: "", starred: false, ...extra }; }
  function lk(a, b, kind = "related", label = "") { return { id: uid(), from: a.id, to: b.id, kind, label }; }
  CX.caseNode = mk; CX.caseLink = lk;
  const autoTemplate = (kind) => ({ Investigation: "investigation", Decision: "decision", Gift: "decision", Purchase: "decision", Research: "research", Planning: "research" }[kind] || "blank");

  CX.searchers.push((q) => CX.S.cases.filter((c) => CX.match(q, c.title, c.question, c.verdict, ...c.nodes.map((n) => `${n.title} ${n.body}`))).slice(0, 6).map((c) => ({
    kind: "Case", label: c.title, sub: `${c.kind} · ${STATUS[c.status]} · ${c.nodes.length} nodes`, run: () => { location.hash = `cases/${c.id}`; },
  })));

  // ---------- Case list ----------
  function preview(c) {
    if (!c.nodes.length) return `<div class="thumb-empty">${CX.icon("cases", 28)}</div>`;
    const xs = c.nodes.map((n) => n.x), ys = c.nodes.map((n) => n.y);
    const minx = Math.min(...xs) - 40, miny = Math.min(...ys) - 40, w = Math.max(...xs) + NW + 40 - minx, h = Math.max(...ys) + 110 - miny;
    const lines = c.links.map((l) => {
      const a = nodeOf(c, l.from), b = nodeOf(c, l.to);
      if (!a || !b) return "";
      const x1 = a.x + NW, y1 = a.y + 35, x2 = b.x, y2 = b.y + 35, dx = Math.max(40, Math.abs(x2 - x1) / 2);
      return `<path d="M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}" stroke="${(WIRES[l.kind] || WIRES.related)[1]}" stroke-width="5" fill="none" opacity=".7"/>`;
    }).join("");
    const rects = c.nodes.map((n) => `<rect x="${n.x}" y="${n.y}" width="${NW}" height="70" rx="10" fill="#14171b" stroke="${(TYPES[n.type] || TYPES.note).color}" stroke-width="4"/><rect x="${n.x}" y="${n.y}" width="${NW}" height="16" rx="6" fill="${(TYPES[n.type] || TYPES.note).color}" opacity=".85"/>`).join("");
    return `<svg viewBox="${minx} ${miny} ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${lines}${rects}</svg>`;
  }

  function renderList() {
    const all = CX.S.cases;
    const q = (CX.ui.caseQ || "").toLowerCase();
    const list = all.filter((c) => (CX.ui.caseTab === "all" || c.status === CX.ui.caseTab) && (!q || CX.match(q, c.title, c.question, c.kind, c.verdict)))
      .sort((a, b) => (b.updated || b.created || "").localeCompare(a.updated || a.created || ""));
    const n = (s) => all.filter((c) => c.status === s).length;
    const nodes = all.reduce((a, c) => a + c.nodes.length, 0);
    const photos = all.reduce((a, c) => a + c.nodes.filter((x) => x.photo).length, 0);
    return `
      <div class="stats">
        ${CX.stat("Open cases", n("open"), `${n("cold")} gone cold`)}
        ${CX.stat("Solved", n("solved"))}
        ${CX.stat("Nodes on boards", nodes, `${photos} photo${photos === 1 ? "" : "s"}`)}
      </div>
      <div class="toolbar">
        ${CX.tabs("caseTab", [["open", `Open · ${n("open")}`], ["cold", `Cold · ${n("cold")}`], ["solved", `Solved · ${n("solved")}`], ["all", "All"]])}
        <div class="filters">${CX.uiSearch("caseQ", "Search cases…")}</div>
      </div>
      <div class="cases-grid">
        ${list.map((c) => `
          <a class="case-card" href="#cases/${c.id}">
            <div class="case-thumb">${preview(c)}</div>
            <div class="case-info">
              <div class="badges"><span class="badge">${esc(c.kind)}</span><span class="badge st-${c.status}">${STATUS[c.status]}</span></div>
              <h3 class="serif">${esc(c.title)}</h3>
              ${c.question ? `<p class="q">${esc(c.question)}</p>` : ""}
              ${c.status === "solved" && c.verdict ? `<p class="verdict-line"><span class="kicker gold-t">Verdict</span> ${esc(c.verdict)}</p>` : ""}
              <div class="meta">${c.nodes.length} nodes · ${c.links.length} connections · updated ${CX.relDays(c.updated || c.created)}</div>
            </div>
          </a>`).join("")}
        <button type="button" class="case-card new" data-act="new-case">${CX.icon("plus", 26)}<span class="serif">Open a new case</span><span class="meta">A mystery, a decision, a gift, a plan</span></button>
      </div>`;
  }

  // ---------- Board ----------
  function nodeHtml(n) {
    const t = TYPES[n.type] || TYPES.note;
    const person = n.personId && CX.find("people", n.personId);
    const isSel = sel && sel.kind === "node" && sel.id === n.id;
    const url = CX.safeUrl(n.url);
    return `
      <div class="node ${isSel ? "sel" : ""} ${n.starred ? "key" : ""}" data-node="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${t.color}">
        <span class="port in" aria-hidden="true"></span>
        <div class="node-head"><span>${t.label}</span>${n.starred ? `<b title="Key node">◆</b>` : ""}</div>
        ${CX.img(n.photo, "node-img", n.title)}
        <div class="node-main">
          ${person ? `<div class="node-person">${CX.avatar(person, "sm")}<div style="min-width:0"><div class="node-title">${esc(n.title || person.name)}</div><div class="meta">${esc([person.relation, person.location].filter(Boolean).join(" · "))}</div></div></div>` : `<div class="node-title">${esc(n.title || t.label)}</div>`}
          ${n.type === "option" && (n.price || n.rating) ? `<div class="node-opt">${n.price ? `<span>${CX.money(n.price)}</span>` : "<span></span>"}${n.rating ? `<span class="stars">${"★".repeat(n.rating)}<i>${"★".repeat(5 - n.rating)}</i></span>` : ""}</div>` : ""}
          ${n.body ? `<div class="node-body">${esc(n.body)}</div>` : ""}
          ${url ? `<a class="node-url" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(CX.host(url))} ↗</a>` : ""}
        </div>
        <span class="port out" data-port="out" title="Drag to connect"></span>
      </div>`;
  }

  function sidePanel(c) {
    const options = c.nodes.filter((n) => n.type === "option").sort((a, b) => (b.rating || 0) - (a.rating || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
    const keys = c.nodes.filter((n) => n.starred);
    const counts = Object.keys(TYPES).map((k) => [k, c.nodes.filter((n) => n.type === k).length]).filter(([, v]) => v);
    const jump = (n) => `<button type="button" class="side-row" data-act="b-focus" data-id="${n.id}"><span class="dot" style="--c:${TYPES[n.type].color}"></span><span class="grow">${esc(n.title || TYPES[n.type].label)}</span>`;
    return `
      <aside class="case-side" aria-label="Case file">
        <div class="kicker gold-t">Case file</div>
        <div class="field" style="margin-top:12px"><label for="caseStatus">Status</label>
          <select id="caseStatus" data-change="case-status">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${c.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        ${c.question ? `<div class="side-sec">The question</div><p class="side-q serif">${esc(c.question)}</p>` : ""}
        ${c.verdict ? `<div class="side-sec">Verdict</div><p class="prose">${esc(c.verdict)}</p>` : ""}
        ${options.length ? `<div class="side-sec">Shortlist</div>${options.map((n) => `${jump(n)}<span class="side-meta">${n.price ? CX.money(n.price) : ""} ${n.rating ? `<span class="stars">${"★".repeat(n.rating)}</span>` : ""}</span></button>`).join("")}` : ""}
        ${keys.length ? `<div class="side-sec">Key nodes</div>${keys.map((n) => `${jump(n)}</button>`).join("")}` : ""}
        <div class="side-sec">On the board</div>
        <div class="tags">${counts.map(([k, v]) => `<span class="badge" style="border-color:${TYPES[k].color};color:${TYPES[k].color}">${v} ${TYPES[k].label}${v > 1 ? "s" : ""}</span>`).join("") || `<span class="meta">Nothing yet.</span>`}</div>
        ${c.notes ? `<div class="side-sec">Notes</div><p class="prose meta">${esc(c.notes)}</p>` : ""}
        <div class="side-sec">How it works</div>
        <ul class="howto">
          <li>Add nodes from the toolbar, or double-click empty space.</li>
          <li>Drag the <span class="port-dot"></span> on a node's right edge onto another node to connect them. Drop it on empty space to create a connected node.</li>
          <li>Drag photos onto the board, or paste them with Ctrl V.</li>
          <li>Double-click a node or connection to edit it. Delete removes the selection.</li>
          <li>Scroll to zoom, drag the background to pan, F to fit.</li>
          <li>On a phone: pinch to zoom, double-tap to add or edit, tap a node for its actions.</li>
        </ul>
      </aside>`;
  }

  function renderBoard(c) {
    const wireDefs = Object.entries(WIRES).map(([k, [, col]]) => `<marker id="arr-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L9 5L0 9z" fill="${col}"/></marker>`).join("");
    return `
      <div class="board">
        <div class="board-top">
          <a class="btn ghost sm" href="#cases" aria-label="Back to cases">${CX.icon("back", 14)}<span class="lbl"> Cases</span></a>
          <div class="board-title"><div class="kicker gold-t">${esc(c.kind)} · ${STATUS[c.status]}</div><h1 class="serif">${esc(c.title)}</h1></div>
          <div class="actions">
            <button class="btn sm ghost" data-act="case-edit" aria-label="Edit case">${CX.icon("edit", 14)}<span class="lbl"> Edit</span></button>
            ${c.status === "solved" ? `<button class="btn sm ghost" data-act="case-reopen">Reopen</button>` : `<button class="btn sm gold" data-act="case-close">Close<span class="lbl"> the case</span></button>`}
            <button class="btn sm ghost ${CX.ui.caseSide ? "on" : ""}" data-act="case-side" aria-pressed="${!!CX.ui.caseSide}" aria-label="Case file">${CX.icon("panel", 14)}<span class="lbl"> Case file</span></button>
          </div>
        </div>
        <div class="board-body">
          <div class="canvas" id="canvas" aria-label="Case board">
            <div class="world" id="world">
              <svg class="wires" width="20000" height="20000" aria-hidden="true"><defs>${wireDefs}</defs><g id="wireG" transform="translate(10000 10000)"></g></svg>
              ${c.nodes.map(nodeHtml).join("")}
            </div>
            <div class="board-ui tools" role="toolbar" aria-label="Add node">
              ${Object.entries(TYPES).map(([k, t]) => `<button type="button" class="tool" data-act="b-add" data-id="${k}" style="--c:${t.color}" title="Add ${t.label.toLowerCase()}"><i></i>${t.label}</button>`).join("")}
            </div>
            <div class="board-ui zoom">
              <button type="button" data-act="b-zoom" data-id="-1" aria-label="Zoom out">−</button>
              <span id="zoomPct">100%</span>
              <button type="button" data-act="b-zoom" data-id="1" aria-label="Zoom in">+</button>
              <button type="button" data-act="b-fit" aria-label="Fit to view" title="Fit (F)">${CX.icon("fit", 14)}</button>
            </div>
            ${c.nodes.length ? "" : `<div class="board-empty"><div class="serif">An empty board.</div><p>Double-click anywhere to place your first clue, or drop a photo here.</p></div>`}
            <div id="selBar" class="board-ui selbar" hidden></div>
            <div id="addMenu" class="add-menu board-ui" hidden></div>
            <input type="file" id="photoPick" accept="image/*" multiple hidden>
          </div>
          ${CX.ui.caseSide ? sidePanel(c) : ""}
        </div>
      </div>`;
  }

  // ---------- Geometry & drawing ----------
  const outP = (n) => ({ x: n.x + NW, y: n.y + PY });
  const inP = (n) => ({ x: n.x, y: n.y + PY });
  function bez(a, b) {
    const dx = Math.max(60, Math.abs(b.x - a.x) * 0.5);
    const c1 = { x: a.x + dx, y: a.y }, c2 = { x: b.x - dx, y: b.y };
    return { d: `M${a.x} ${a.y} C${c1.x} ${c1.y},${c2.x} ${c2.y},${b.x} ${b.y}`, mid: { x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8, y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8 } };
  }
  function drawWires(c) {
    const g = el("wireG");
    if (!g) return;
    g.innerHTML = c.links.map((l) => {
      const a = nodeOf(c, l.from), b = nodeOf(c, l.to);
      if (!a || !b) return "";
      const { d, mid } = bez(outP(a), inP(b));
      const k = WIRES[l.kind] ? l.kind : "related";
      const isSel = sel && sel.kind === "wire" && sel.id === l.id;
      return `<g class="wire-g ${isSel ? "sel" : ""}" data-wire="${l.id}"><path class="hit" d="${d}"/><path class="wire" d="${d}" stroke="${WIRES[k][1]}" marker-end="url(#arr-${k})"/>${l.label ? `<text x="${mid.x}" y="${mid.y - 7}" text-anchor="middle" class="wire-lbl">${esc(l.label)}</text>` : ""}</g>`;
    }).join("") + `<path id="tempWire" class="wire temp" d=""/>`;
  }
  function applyView(c) {
    const v = c.view, w = el("world"), cv = el("canvas");
    if (!w || !cv) return;
    w.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.z})`;
    cv.style.backgroundSize = `${28 * v.z}px ${28 * v.z}px`;
    cv.style.backgroundPosition = `${v.x}px ${v.y}px`;
    cv.style.setProperty("--inv", (1 / v.z).toFixed(3)); // keeps touch targets a constant on-screen size
    const z = el("zoomPct"); if (z) z.textContent = `${Math.round(v.z * 100)}%`;
  }
  const saveView = () => { clearTimeout(viewSaveT); viewSaveT = setTimeout(() => CX.save(), 400); };
  const toWorld = (c, clientX, clientY) => { const r = el("canvas").getBoundingClientRect(); return { x: (clientX - r.left - c.view.x) / c.view.z, y: (clientY - r.top - c.view.y) / c.view.z }; };
  function zoomAt(c, clientX, clientY, f) {
    const r = el("canvas").getBoundingClientRect(), v = c.view;
    const sx = clientX - r.left, sy = clientY - r.top, nz = clamp(v.z * f, 0.2, 2.5);
    v.x = sx - (sx - v.x) * (nz / v.z); v.y = sy - (sy - v.y) * (nz / v.z); v.z = nz;
    applyView(c); saveView();
  }
  function fit(c) {
    const cv = el("canvas");
    if (!cv) return;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (!c.nodes.length) { c.view = { x: cw / 2 - NW / 2, y: ch / 2 - 60, z: 1, init: true }; applyView(c); return; }
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    c.nodes.forEach((n) => {
      const h = document.querySelector(`[data-node="${n.id}"]`)?.offsetHeight || 90;
      minx = Math.min(minx, n.x); miny = Math.min(miny, n.y); maxx = Math.max(maxx, n.x + NW); maxy = Math.max(maxy, n.y + h);
    });
    const bw = maxx - minx, bh = maxy - miny;
    const padL = cw > 760 ? 150 : 0; // keep clear of the node toolbar
    const minZ = cw < 600 ? 0.5 : 0.25; // keep text legible on phones; pan to see the rest
    const z = clamp(Math.min((cw - padL - 100) / bw, (ch - 160) / bh), minZ, 1.15);
    c.view = { x: padL + (cw - padL - bw * z) / 2 - minx * z, y: (ch - bh * z) / 2 - miny * z + 20, z, init: true };
    applyView(c); saveView();
  }
  function centerPos(c) {
    const cv = el("canvas"), v = c.view, j = () => Math.round((Math.random() - 0.5) * 80);
    return { x: (cv.clientWidth / 2 - v.x) / v.z - NW / 2 + j(), y: (cv.clientHeight / 2 - v.y) / v.z - 50 + j() };
  }
  function setSel(s) {
    sel = s;
    document.querySelectorAll(".node.sel").forEach((n) => n.classList.remove("sel"));
    if (s && s.kind === "node") document.querySelector(`[data-node="${s.id}"]`)?.classList.add("sel");
    const c = cur(); if (c) { drawWires(c); updateSelBar(c); }
  }
  function updateSelBar(c) {
    const b = el("selBar");
    if (!b) return;
    const n = sel && sel.kind === "node" ? nodeOf(c, sel.id) : null;
    const w = sel && sel.kind === "wire" ? c.links.find((l) => l.id === sel.id) : null;
    if (!n && !w) { b.hidden = true; return; }
    b.innerHTML = `<span class="kicker">${n ? esc((TYPES[n.type] || TYPES.note).label) : "Connection"}</span>
      <button type="button" data-act="b-sel-edit">Edit</button>
      ${n ? `<button type="button" data-act="b-sel-key" class="${n.starred ? "on" : ""}">◆ Key</button><button type="button" data-act="b-sel-dup">Duplicate</button>` : ""}
      <button type="button" data-act="b-sel-del" class="danger">Delete</button>`;
    b.hidden = false;
  }
  function startPinch(c) {
    const [a, b] = [...pts.values()];
    if (drag && drag.mode === "node") { drag.el.classList.remove("dragging"); if (drag.moved) { touch(c); CX.save(); } }
    drag = null;
    el("tempWire")?.setAttribute("d", "");
    el("canvas")?.classList.remove("panning");
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: c.view.z, w: toWorld(c, mid.x, mid.y) };
  }
  function movePinch(c) {
    const [a, b] = [...pts.values()];
    const r = el("canvas").getBoundingClientRect(), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const z = clamp((pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d0, 0.2, 2.5);
    c.view.z = z; c.view.x = mid.x - r.left - pinch.w.x * z; c.view.y = mid.y - r.top - pinch.w.y * z;
    applyView(c);
  }
  function focusNode(c, id) {
    const n = nodeOf(c, id), cv = el("canvas");
    if (!n || !cv) return;
    c.view.z = Math.max(c.view.z, 0.9);
    c.view.x = cv.clientWidth / 2 - (n.x + NW / 2) * c.view.z;
    c.view.y = cv.clientHeight / 2 - (n.y + 60) * c.view.z;
    applyView(c); setSel({ kind: "node", id }); saveView();
  }

  // ---------- Node operations ----------
  function createNode(c, type, x, y, from, extra = {}, { edit = true, render = true } = {}) {
    const n = mk(type, Math.round(x), Math.round(y), extra.title || "", "", extra);
    c.nodes.push(n);
    if (from && from !== n.id) c.links.push(lk({ id: from }, n));
    touch(c);
    sel = { kind: "node", id: n.id };
    if (render) { CX.save(); CX.render(); }
    if (edit && type !== "photo") editNode(c, n.id, true);
    return n;
  }
  async function addPhotos(c, files, x, y, from) {
    const imgs = [...files].filter((f) => f.type.startsWith("image/")).slice(0, 12);
    if (!imgs.length) return;
    CX.toast(`Developing ${imgs.length} photo${imgs.length > 1 ? "s" : ""}…`);
    for (let i = 0; i < imgs.length; i++) {
      try {
        const id = await CX.media.fromFile(imgs[i], 1280);
        createNode(c, "photo", x + i * 36, y + i * 36, i === 0 ? from : null, { photo: id, title: (imgs[i].name || "Photo").replace(/\.[^.]+$/, "") }, { edit: false, render: false });
      } catch { CX.toast("One image could not be read."); }
    }
    CX.save(); CX.render();
    CX.toast(`${imgs.length} photo${imgs.length > 1 ? "s" : ""} pinned to the board.`);
  }
  function removeNode(c, id) { c.nodes = c.nodes.filter((n) => n.id !== id); c.links = c.links.filter((l) => l.from !== id && l.to !== id); touch(c); }
  function deleteSel(c) {
    if (!sel) return;
    const s = sel; sel = null;
    if (s.kind === "node") CX.undoable("Node removed.", () => removeNode(c, s.id));
    else CX.undoable("Connection removed.", () => { c.links = c.links.filter((l) => l.id !== s.id); touch(c); });
  }

  function editNode(c, id, isNew = false) {
    const n = nodeOf(c, id);
    if (!n) return;
    const t = TYPES[n.type] || TYPES.note;
    const fields = [
      { key: "title", label: n.type === "person" ? "Name" : "Title", placeholder: t.ph },
      { key: "type", label: "Node type", type: "select", options: Object.entries(TYPES).map(([k, x]) => [k, x.label]), half: true },
      { key: "starred", label: "Key", type: "checkbox", text: "Mark as key node ◆", half: true },
    ];
    if (n.type === "person") fields.push({ key: "personId", label: "Link to someone in People", type: "select", options: [["", "— Not linked —"], ...CX.S.people.map((p) => [p.id, p.name])], hint: "Shows their photo and details on the node" });
    if (n.type === "option") fields.push(
      { key: "price", label: `Price (${CX.S.settings.currency})`, type: "number", min: 0, half: true },
      { key: "rating", label: "Rating", type: "select", options: [["0", "Unrated"], ["1", "★"], ["2", "★★"], ["3", "★★★"], ["4", "★★★★"], ["5", "★★★★★"]], half: true },
    );
    fields.push(
      { key: "body", label: n.type === "evidence" ? "Details" : n.type === "option" ? "Pros, cons, notes" : "Notes", type: "textarea", rows: 4 },
      { key: "photo", label: "Photo", type: "photo" },
      { key: "url", label: "Link", placeholder: "https://…" },
    );
    CX.openForm({
      kicker: `${isNew ? "New" : "Edit"} ${t.label.toLowerCase()}`, title: n.title || t.label, fields, values: n, saveLabel: "Save node",
      onSave: (d) => { Object.assign(n, d, { rating: Number(d.rating) || 0, price: d.price === "" || d.price === undefined ? "" : Number(d.price) }); touch(c); },
      onDelete: () => removeNode(c, n.id),
    });
  }
  function editWire(c, id) {
    const l = c.links.find((x) => x.id === id);
    if (!l) return;
    const a = nodeOf(c, l.from), b = nodeOf(c, l.to);
    CX.openForm({
      kicker: "Connection", title: `${a?.title || "Node"} → ${b?.title || "Node"}`, saveLabel: "Save connection",
      fields: [
        { key: "kind", label: "Relationship", type: "select", options: Object.entries(WIRES).map(([k, [lab]]) => [k, lab]) },
        { key: "label", label: "Label", placeholder: "e.g. motive, alibi, cheaper, recommended by" },
      ],
      values: l,
      onSave: (d) => { Object.assign(l, d); touch(c); },
      onDelete: () => { c.links = c.links.filter((x) => x.id !== id); touch(c); },
    });
  }

  // ---------- Add-node menu ----------
  function showMenu(c, clientX, clientY, from) {
    const m = el("addMenu"), cv = el("canvas");
    if (!m || !cv) return;
    const r = cv.getBoundingClientRect();
    pending = { ...toWorld(c, clientX, clientY), from };
    m.innerHTML = `<div class="kicker">${from ? "Connect to a new…" : "Add here"}</div>` + Object.entries(TYPES).map(([k, t]) => `<button type="button" data-act="b-menu-add" data-id="${k}" style="--c:${t.color}"><i></i>${t.label}</button>`).join("");
    m.hidden = false;
    m.style.left = `${clamp(clientX - r.left, 8, r.width - 180)}px`;
    m.style.top = `${clamp(clientY - r.top, 8, r.height - 330)}px`;
  }
  const hideMenu = () => { const m = el("addMenu"); if (m) m.hidden = true; };

  // ---------- Board events ----------
  function bind() {
    const c = cur(), cv = el("canvas");
    if (!c || !cv) return;
    pts.clear(); pinch = null;
    applyView(c);
    drawWires(c);
    updateSelBar(c);
    if (!c.view.init) requestAnimationFrame(() => fit(c));

    cv.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".board-ui")) return;
      hideMenu();
      if (e.pointerType === "touch") {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size >= 2) { startPinch(c); return; }
      }
      const nodeEl = e.target.closest("[data-node]");
      const wireEl = e.target.closest("[data-wire]");
      if (e.target.closest("[data-port='out']") && nodeEl) {
        drag = { mode: "wire", from: nodeEl.dataset.node };
        e.preventDefault();
        return;
      }
      if (nodeEl) {
        if (e.target.closest("a")) return;
        const n = nodeOf(c, nodeEl.dataset.node);
        drag = { mode: "node", id: n.id, el: nodeEl, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false };
        nodeEl.classList.add("dragging");
        e.preventDefault();
        return;
      }
      if (wireEl) {
        const id = wireEl.dataset.wire;
        if (e.pointerType === "touch" && isDoubleTap("w:" + id, e)) { editWire(c, id); return; }
        setSel({ kind: "wire", id });
        return;
      }
      drag = { mode: "pan", sx: e.clientX, sy: e.clientY, ox: c.view.x, oy: c.view.y, moved: false };
      cv.classList.add("panning");
    });
    cv.addEventListener("dblclick", (e) => {
      if (e.target.closest(".board-ui")) return;
      const nodeEl = e.target.closest("[data-node]"), wireEl = e.target.closest("[data-wire]");
      if (nodeEl) editNode(c, nodeEl.dataset.node);
      else if (wireEl) editWire(c, wireEl.dataset.wire);
      else showMenu(c, e.clientX, e.clientY, null);
    });
    cv.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(c, e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    cv.addEventListener("dragover", (e) => { if ([...(e.dataTransfer?.types || [])].includes("Files")) { e.preventDefault(); cv.classList.add("drop"); } });
    cv.addEventListener("dragleave", (e) => { if (e.target === cv) cv.classList.remove("drop"); });
    cv.addEventListener("drop", (e) => {
      e.preventDefault(); cv.classList.remove("drop");
      const p = toWorld(c, e.clientX, e.clientY);
      addPhotos(c, e.dataTransfer.files, p.x - NW / 2, p.y - 40, null);
    });
    el("photoPick").addEventListener("change", (e) => {
      const p = pending || centerPos(c);
      addPhotos(c, e.target.files, p.x, p.y, pending && pending.from);
      pending = null;
    });
  }

  window.addEventListener("pointermove", (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch) { const c = cur(); if (c && pts.size >= 2) movePinch(c); return; }
    if (!drag) return;
    lastPtr = { x: e.clientX, y: e.clientY };
    if ((drag.mode === "wire" || drag.mode === "node") && !edgeT) edgeT = setTimeout(edgeLoop, 16);
    const c = cur();
    if (!c) { drag = null; return; }
    if (drag.mode === "node") {
      const dx = (e.clientX - drag.sx) / c.view.z, dy = (e.clientY - drag.sy) / c.view.z;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      const n = nodeOf(c, drag.id);
      n.x = Math.round(drag.ox + dx); n.y = Math.round(drag.oy + dy);
      drag.el.style.left = n.x + "px"; drag.el.style.top = n.y + "px";
      drawWires(c);
    } else if (drag.mode === "pan") {
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      c.view.x = drag.ox + dx; c.view.y = drag.oy + dy;
      applyView(c);
    } else if (drag.mode === "wire") {
      const a = nodeOf(c, drag.from), p = toWorld(c, e.clientX, e.clientY);
      const t = el("tempWire");
      if (a && t) t.setAttribute("d", bez(outP(a), p).d);
    }
  });
  window.addEventListener("pointercancel", (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (!drag) return;
    const c = cur(), d = drag;
    drag = null;
    el("canvas")?.classList.remove("panning");
    el("tempWire")?.setAttribute("d", "");
    if (d.mode === "node") { d.el.classList.remove("dragging"); if (c && d.moved) { touch(c); CX.save(); } }
    if (d.mode === "pan" && c) saveView();
  });
  window.addEventListener("pointerup", (e) => {
    pts.delete(e.pointerId);
    if (pinch) { if (pts.size < 2) { pinch = null; saveView(); } return; }
    if (!drag) return;
    const c = cur(), d = drag;
    drag = null;
    if (!c) return;
    el("canvas")?.classList.remove("panning");
    if (d.mode === "node") {
      d.el.classList.remove("dragging");
      if (d.moved) { touch(c); CX.save(); }
      else if (e.pointerType === "touch" && isDoubleTap(d.id, e)) { editNode(c, d.id); return; }
      setSel({ kind: "node", id: d.id });
    } else if (d.mode === "pan") {
      if (d.moved) saveView();
      else if (e.pointerType === "touch" && isDoubleTap("bg", e)) showMenu(c, e.clientX, e.clientY, null);
      else setSel(null);
    } else if (d.mode === "wire") {
      el("tempWire")?.setAttribute("d", "");
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = target && target.closest("[data-node]");
      if (nodeEl && nodeEl.dataset.node !== d.from) {
        const to = nodeEl.dataset.node;
        if (!c.links.some((l) => (l.from === d.from && l.to === to) || (l.from === to && l.to === d.from))) {
          c.links.push(lk({ id: d.from }, { id: to }));
          touch(c); CX.save(); drawWires(c);
          CX.toast("Connected. Double-click the line to label it.");
        }
      } else if (target && target.closest("#canvas") && !target.closest(".board-ui")) {
        showMenu(c, e.clientX, e.clientY, d.from);
      }
    }
  });
  document.addEventListener("paste", async (e) => {
    const c = cur();
    if (!c || document.getElementById("modal").open) return;
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    const items = [...(e.clipboardData?.items || [])];
    const img = items.find((i) => i.type.startsWith("image/"));
    const p = centerPos(c);
    if (img) { e.preventDefault(); addPhotos(c, [img.getAsFile()], p.x, p.y, null); return; }
    const text = (e.clipboardData?.getData("text/plain") || "").trim();
    if (!text) return;
    e.preventDefault();
    if (/^https?:\/\/\S+$/.test(text)) createNode(c, "link", p.x, p.y, null, { title: CX.host(text), url: text }, { edit: false });
    else { const title = text.split("\n")[0].slice(0, 60); createNode(c, "note", p.x, p.y, null, { title, body: text.length > title.length ? text : "" }, { edit: false }); }
    CX.toast("Pasted onto the board.");
  });

  // ---------- Case forms ----------
  const caseFields = (isNew) => [
    { key: "title", label: "Case name", required: true, placeholder: "e.g. The missing watch · Anniversary gift" },
    { key: "kind", label: "Kind of case", type: "select", options: KINDS, half: true, default: "Investigation" },
    isNew ? { key: "template", label: "Start with", type: "select", options: [["auto", "Best template for this kind"], ...Object.entries(TEMPLATES).map(([k, t]) => [k, t.label])], half: true, default: "auto" }
      : { key: "status", label: "Status", type: "select", options: Object.entries(STATUS), half: true },
    { key: "question", label: "The question", type: "textarea", rows: 2, placeholder: "Who did this? What should I buy? Where should we go?" },
    ...(isNew ? [] : [{ key: "verdict", label: "Verdict", type: "textarea", rows: 2 }]),
    { key: "notes", label: "Background", type: "textarea", rows: 3, placeholder: "Context, constraints, budget, deadline…" },
  ];

  Object.assign(CX.actions, {
    "new-case": () => CX.openForm({
      kicker: "New case", title: "Open a case", fields: caseFields(true), saveLabel: "Open the board",
      onSave: (d) => {
        const tpl = TEMPLATES[d.template === "auto" ? autoTemplate(d.kind) : d.template] || TEMPLATES.blank;
        const { nodes, links } = tpl.build(d.question);
        const c = { id: uid(), title: d.title, kind: d.kind, status: "open", question: d.question, notes: d.notes, verdict: "", created: today(), updated: today(), nodes, links, view: { x: 0, y: 0, z: 1 } };
        CX.S.cases.push(c);
        setTimeout(() => { location.hash = `cases/${c.id}`; }, 0);
        CX.toast("Case opened. The board is yours.");
      },
    }),
    "case-edit": () => {
      const c = cur(); if (!c) return;
      CX.openForm({
        kicker: "Edit case", title: c.title, fields: caseFields(false), values: c,
        onSave: (d) => { Object.assign(c, d); touch(c); },
        onDelete: () => { CX.remove("cases", c.id); setTimeout(() => { location.hash = "cases"; }, 0); },
      });
    },
    "case-close": () => {
      const c = cur(); if (!c) return;
      const options = c.nodes.filter((n) => n.type === "option").sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const verdictNode = c.nodes.find((n) => n.type === "verdict" && n.body);
      CX.openForm({
        kicker: "Close the case", title: c.title, saveLabel: "Case closed",
        intro: "State your conclusion. It's recorded on the case file and a verdict node is added to the board.",
        fields: [{ key: "verdict", label: "Verdict", type: "textarea", rows: 4, required: true }],
        values: { verdict: c.verdict || verdictNode?.body || (options[0] ? options[0].title : "") },
        onSave: (d) => {
          c.verdict = d.verdict; c.status = "solved"; touch(c);
          const v = c.nodes.find((n) => n.type === "verdict");
          if (v) { v.body = d.verdict; if (!v.title || /^(verdict|decision|conclusion)$/i.test(v.title)) v.title = "Verdict"; v.starred = true; }
          else { const maxX = Math.max(0, ...c.nodes.map((n) => n.x)); c.nodes.push(mk("verdict", maxX + 330, 0, "Verdict", d.verdict, { starred: true })); }
          CX.toast("Case closed.");
        },
      });
    },
    "case-reopen": () => { const c = cur(); if (!c) return; c.status = "open"; touch(c); CX.save(); CX.render(); CX.toast("Case reopened."); },
    "case-side": () => { CX.ui.caseSide = CX.ui.caseSide ? "" : "1"; CX.render(); },
    "b-add": (type) => {
      const c = cur(); if (!c) return;
      const p = centerPos(c);
      if (type === "photo") { pending = { ...p, from: null }; el("photoPick").click(); return; }
      createNode(c, type, p.x, p.y, null);
    },
    "b-menu-add": (type) => {
      const c = cur(); if (!c || !pending) return;
      hideMenu();
      const p = pending;
      if (type === "photo") { pending = { x: p.x, y: p.y - 20, from: p.from }; el("photoPick").click(); return; }
      pending = null;
      createNode(c, type, p.x, p.y - 20, p.from);
    },
    "b-zoom": (dir) => { const c = cur(), cv = el("canvas"); if (!c || !cv) return; const r = cv.getBoundingClientRect(); zoomAt(c, r.left + r.width / 2, r.top + r.height / 2, Number(dir) > 0 ? 1.2 : 1 / 1.2); },
    "b-fit": () => { const c = cur(); if (c) fit(c); },
    "b-focus": (id) => { const c = cur(); if (c) focusNode(c, id); },
    "b-sel-edit": () => { const c = cur(); if (!c || !sel) return; if (sel.kind === "node") editNode(c, sel.id); else editWire(c, sel.id); },
    "b-sel-del": () => { const c = cur(); if (c) deleteSel(c); },
    "b-sel-key": () => { const c = cur(), n = c && sel && nodeOf(c, sel.id); if (!n) return; n.starred = !n.starred; touch(c); CX.save(); CX.render(); },
    "b-sel-dup": () => {
      const c = cur(), n = c && sel && nodeOf(c, sel.id); if (!n) return;
      const copy = { ...n, id: uid(), x: n.x + 40, y: n.y + 40, title: n.title ? n.title + " (copy)" : "", starred: false };
      c.nodes.push(copy); sel = { kind: "node", id: copy.id }; touch(c); CX.save(); CX.render(); CX.toast("Node duplicated.");
    },
  });
  CX.changes["case-status"] = (s) => { const c = cur(); if (!c) return; c.status = s.value; touch(c); CX.save(); CX.render(); };

  CX.view("cases", {
    order: 4, label: "Cases", icon: "cases", kicker: "Investigations & decisions", newAct: "new-case", newLabel: "New case",
    badge: () => CX.S.cases.filter((c) => c.status === "open").length,
    bleed: () => !!cur(),
    render: () => { const c = cur(); return c ? renderBoard(c) : renderList(); },
    after: () => { if (cur()) bind(); else sel = null; },
    // on phones, open boards with the case file closed so the canvas is usable
    onEnter: () => { if (window.innerWidth <= 900) CX.ui.caseSide = ""; },
    onKey: (e) => {
      const c = cur(); if (!c) return false;
      if (e.key === "Delete" || e.key === "Backspace") { deleteSel(c); return true; }
      if (e.key === "Escape") { setSel(null); hideMenu(); return true; }
      if (e.key === "f" || e.key === "F") { fit(c); return true; }
      if (e.key === "n") { const p = centerPos(c); createNode(c, "note", p.x, p.y, null); return true; }
      if (e.key === "+" || e.key === "=") { CX.actions["b-zoom"]("1"); return true; }
      if (e.key === "-") { CX.actions["b-zoom"]("-1"); return true; }
      return false;
    },
  });
})();

/* lrn — The Tree That Asks Questions. All figures are drawn live. */
(function () {
  'use strict';
  const L = window.DTLib;
  const D = L.DOMAIN;
  const C = {
    ink: '#1b241e', soft: '#4a554c', faint: '#7d857c', line: '#d8cfbb', card: '#fbf8f0', paper: '#f4efe3',
    moss: '#4a7d36', berry: '#c0354d', ochre: '#d4912a', forest: '#12382a',
    mossRGB: '74,125,54', berryRGB: '192,53,77',
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pct = (x) => Math.round(x * 100) + '%';
  const fmt = (n) => n.toLocaleString('en-US');
  const cm = (t) => (+t).toFixed(1);
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ───────── data & models (deterministic) ───────── */
  const train = L.makeData(160, 11, 0.08);
  const test = L.makeData(400, 202, 0.08);
  const full = L.buildTree(train, { maxDepth: 20 });
  const fullDepth = L.depthOf(full);
  const atDepth = [];
  for (let d = 0; d <= fullDepth; d++) atDepth[d] = L.truncate(full, d);
  const trainAcc = atDepth.map((t) => L.accuracy(t, train));
  const testAcc = atDepth.map((t) => L.accuracy(t, test));
  let bestDepth = 1;
  for (let d = 1; d <= Math.min(10, fullDepth); d++) if (testAcc[d] > testAcc[bestDepth] + 1e-9) bestDepth = d;

  function truncateWhere(node, expand) {
    if (node.leaf || !expand(node)) return { ...node, leaf: true, left: undefined, right: undefined };
    return { ...node, left: truncateWhere(node.left, expand), right: truncateWhere(node.right, expand) };
  }

  /* fill numbers in prose */
  const fills = {
    t0: cm(full.threshold), t1: cm(full.left.threshold), t2: cm(full.right.threshold),
    acc1: Math.round(trainAcc[1] * 100), acc3: Math.round(trainAcc[3] * 100),
    fullDepth, fullLeaves: L.leaves(full).length,
    bestDepth, bestAcc: Math.round(testAcc[bestDepth] * 100),
  };
  $$('[data-fill]').forEach((el) => { if (fills[el.dataset.fill] !== undefined) el.textContent = fills[el.dataset.fill]; });

  /* ───────── canvas + plot helpers ───────── */
  function sizeCanvas(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function makePlot(cv, opt = {}) {
    const { ctx, w, h } = sizeCanvas(cv);
    const small = w < 420;
    const pad = opt.bare ? { l: 4, r: 4, t: 4, b: 4 } : { l: small ? 34 : 44, r: 10, t: 10, b: small ? 32 : 38 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const P = {
      ctx, w, h, pad, iw, ih, dark: !!opt.dark, small,
      sx: (v) => pad.l + ((v - D.x0) / (D.x1 - D.x0)) * iw,
      sy: (v) => pad.t + ih - ((v - D.y0) / (D.y1 - D.y0)) * ih,
      ix: (px) => D.x0 + ((px - pad.l) / iw) * (D.x1 - D.x0),
      iy: (py) => D.y0 + ((pad.t + ih - py) / ih) * (D.y1 - D.y0),
      inside: (px, py) => px >= pad.l && px <= pad.l + iw && py >= pad.t && py <= pad.t + ih,
    };
    return P;
  }

  function drawFrame(P) {
    const { ctx, pad, iw, ih, dark } = P;
    ctx.save();
    ctx.fillStyle = dark ? '#0f271e' : '#fffdf7';
    ctx.fillRect(pad.l, pad.t, iw, ih);
    ctx.restore();
  }

  function drawAxes(P) {
    if (P.pad.l < 10) return;
    const { ctx, pad, iw, ih, dark, small } = P;
    ctx.save();
    ctx.strokeStyle = dark ? 'rgba(236,229,211,.08)' : 'rgba(27,36,30,.06)';
    ctx.lineWidth = 1;
    ctx.fillStyle = dark ? '#8fa38a' : C.faint;
    ctx.font = `500 ${small ? 9 : 10}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = 2; v <= 16; v += 2) {
      const x = P.sx(v);
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ih); ctx.stroke();
      ctx.fillText(v, x, pad.t + ih + 5);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let v = 1; v <= 13; v += 2) {
      const y = P.sy(v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + iw, y); ctx.stroke();
      ctx.fillText(v, pad.l - 6, y);
    }
    ctx.fillStyle = dark ? '#b6c3ae' : C.soft;
    ctx.font = `600 ${small ? 9 : 10}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('CAP WIDTH (cm) →', pad.l + iw, P.h - 1);
    ctx.save();
    ctx.translate(11, pad.t); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('STEM HEIGHT (cm) →', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function leafAlpha(n) {
    const p = n.n ? n.counts[1] / n.n : 0.5;
    return 0.1 + 0.26 * Math.abs(p - 0.5) * 2;
  }
  function drawRegions(P, tree, alpha = 1, only) {
    const { ctx } = P;
    for (const n of L.leaves(tree)) {
      if (only && !only(n)) continue;
      const b = n.bounds;
      const x0 = P.sx(b.x0), x1 = P.sx(b.x1), y0 = P.sy(b.y1), y1 = P.sy(b.y0);
      ctx.fillStyle = `rgba(${n.pred ? C.berryRGB : C.mossRGB},${leafAlpha(n) * alpha * (P.dark ? 1.25 : 1)})`;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  function drawSplits(P, tree, prog = () => 1, color) {
    const { ctx } = P;
    ctx.save();
    ctx.strokeStyle = color || (P.dark ? 'rgba(244,239,227,.85)' : C.ink);
    ctx.lineCap = 'round';
    for (const n of L.nodes(tree)) {
      if (n.leaf) continue;
      const t = prog(n);
      if (t <= 0) continue;
      const b = n.bounds;
      ctx.lineWidth = Math.max(1, 2.6 - n.depth * 0.4);
      ctx.beginPath();
      if (n.feature === 'cap') {
        const x = P.sx(n.threshold), ya = P.sy(b.y0), yb = P.sy(b.y1);
        ctx.moveTo(x, ya); ctx.lineTo(x, ya + (yb - ya) * t);
      } else {
        const y = P.sy(n.threshold), xa = P.sx(b.x0), xb = P.sx(b.x1);
        ctx.moveTo(xa, y); ctx.lineTo(xa + (xb - xa) * t, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawPoints(P, pts, o = {}) {
    const { ctx } = P;
    const r = o.r || (P.small ? 3.2 : 4.2);
    const a = o.alpha ?? 1;
    ctx.save();
    for (const d of pts) {
      const x = P.sx(d.cap) + (o.jitter ? (o.jitter(d) - 0.5) * 3 : 0), y = P.sy(d.stem);
      const sc = o.scale ? o.scale(d) : 1;
      if (sc <= 0) continue;
      const rr = r * sc;
      ctx.globalAlpha = a;
      let fill = d.label ? C.berry : C.moss;
      if (o.colorT !== undefined && o.colorT < 1) fill = mix('#8d968c', fill, o.colorT);
      ctx.beginPath();
      if (d.label && (o.colorT === undefined || o.colorT > 0.5)) {
        ctx.moveTo(x, y - rr * 1.2); ctx.lineTo(x + rr * 1.2, y); ctx.lineTo(x, y + rr * 1.2); ctx.lineTo(x - rr * 1.2, y); ctx.closePath();
      } else ctx.arc(x, y, rr, 0, Math.PI * 2);
      if (o.hollow) {
        ctx.lineWidth = 1.6; ctx.strokeStyle = fill; ctx.stroke();
      } else {
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = P.dark ? 'rgba(11,36,27,.9)' : 'rgba(255,253,247,.95)'; ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawTruth(P, t = 1) {
    const { ctx } = P;
    const shapes = [
      [[9.5, 7.5], [16, 7.5], [16, 13], [9.5, 13]],
      [[2, 1], [5.5, 1], [5.5, 5], [2, 5]],
      [[2, 5.2], [9.8, 13], [2, 13]],
    ];
    ctx.save();
    ctx.globalAlpha = t;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.dark ? '#f4efe3' : C.ink;
    for (const s of shapes) {
      ctx.beginPath();
      s.forEach(([a, b], i) => (i ? ctx.lineTo(P.sx(a), P.sy(b)) : ctx.moveTo(P.sx(a), P.sy(b))));
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }
  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }

  /* ───────── tree diagram (SVG) ───────── */
  const NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const qText = (n) => `${n.feature} > ${cm(n.threshold)}?`;

  function renderTree(svg, tree, opt = {}) {
    const seen = svg._seen || new Set();
    const leaves = L.leaves(tree);
    const nodes = L.nodes(tree);
    const maxD = Math.max(...nodes.map((n) => n.depth));
    const nw = opt.nodeW || 84, nh = 30, gx = opt.gapX || 10, lh = opt.levelH || 62;
    const W = Math.max(opt.minW || 360, leaves.length * (nw + gx));
    const H = (maxD + 1) * lh - lh + nh + 8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (opt.scrollable) svg.style.minWidth = Math.max(300, leaves.length * 64) + 'px';
    svg.textContent = '';
    const pos = new Map();
    let li = 0;
    (function place(n) {
      if (n.leaf) { pos.set(n.id, { x: (li + 0.5) * (W / leaves.length), y: 4 + n.depth * lh }); li++; return; }
      place(n.left); place(n.right);
      pos.set(n.id, { x: (pos.get(n.left.id).x + pos.get(n.right.id).x) / 2, y: 4 + n.depth * lh });
    })(tree);
    const gE = el('g', {}, svg), gN = el('g', {}, svg);
    const refs = { nodes: new Map(), edges: new Map() };
    for (const n of nodes) {
      if (n.leaf) continue;
      const p = pos.get(n.id);
      for (const [ch, lab] of [[n.left, 'no'], [n.right, 'yes']]) {
        const c = pos.get(ch.id);
        const y1 = p.y + nh, y2 = c.y, my = (y1 + y2) / 2;
        const isNew = !seen.has(ch.id);
        const path = el('path', { class: 'te' + (isNew ? ' new' : ''), d: `M${p.x},${y1} C${p.x},${my} ${c.x},${my} ${c.x},${y2}` }, gE);
        refs.edges.set(ch.id, path);
        const t = el('text', { class: 'tel', x: (p.x * 0.4 + c.x * 0.6), y: my + 3 }, gE);
        t.textContent = lab;
      }
    }
    for (const n of nodes) {
      const p = pos.get(n.id);
      const isNew = !seen.has(n.id);
      const g = el('g', { class: 'tn ' + (n.leaf ? 'lf ' + (n.pred ? 'p' : 'e') : 'q') + (isNew ? ' new' : ''), 'data-id': n.id, tabindex: opt.interactive ? 0 : -1 }, gN);
      if (isNew) g.style.animationDelay = (opt.stagger ? n.depth * 0.08 : 0) + 's';
      const w = n.leaf ? nw - 12 : nw;
      el('rect', { x: p.x - w / 2, y: p.y, width: w, height: nh, rx: n.leaf ? 15 : 6 }, g);
      if (n.leaf) {
        const t1 = el('text', { x: p.x, y: p.y + 11 }, g); t1.textContent = n.pred ? 'poison' : 'edible';
        const t2 = el('text', { class: 'sub', x: p.x, y: p.y + 22 }, g); t2.textContent = `${n.counts[0]} · ${n.counts[1]}`;
      } else {
        const t = el('text', { x: p.x, y: p.y + nh / 2 + 1 }, g); t.textContent = qText(n);
      }
      refs.nodes.set(n.id, g);
      seen.add(n.id);
    }
    svg._seen = seen;
    return refs;
  }
  function resetSeen(svg) { svg._seen = new Set(); }

  /* ───────── shared resize registry & reveal ───────── */
  const redraws = [];
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => redraws.forEach((f) => f()), 120); });
  // run fn when elx nears the viewport; everything still gets drawn shortly after load as a fallback
  const pendingSeen = [];
  const onSeen = (elx, fn, margin = '200px') => {
    let done = false;
    const run = () => { if (!done) { done = true; io.disconnect(); fn(); } };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && run()), { rootMargin: margin });
    io.observe(elx);
    pendingSeen.push(run);
  };
  addEventListener('load', () => setTimeout(() => pendingSeen.forEach((r, i) => setTimeout(r, i * 120)), 1800));
  function syncFill(inp) {
    const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
    inp.style.setProperty('--fill', p + '%');
  }
  $$('input[type=range]').forEach((i) => { syncFill(i); i.addEventListener('input', () => syncFill(i)); });

  $$('.wide-fig, .full-fig, .plate, .card, .anatomy-item, .ledger-col, blockquote.pull').forEach((e) => e.classList.add('reveal-up'));
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal-up').forEach((e) => rio.observe(e));
  const tl = $('#timeline');
  $$('li', tl).forEach((li, i) => (li.style.transitionDelay = 0.2 + i * 0.15 + 's'));
  const tio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tl.classList.add('in'); tio.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
  tio.observe(tl);

  /* progress */
  const bar = $('#progress-bar');
  addEventListener('scroll', () => {
    const m = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
  }, { passive: true });

  /* ═════════ HERO ═════════ */
  (function hero() {
    const cv = $('#hero-canvas');
    const tree = atDepth[Math.min(5, fullDepth)];
    const spores = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.15 + Math.random() * 0.5, ph: Math.random() * 6.28, hue: i % 5 === 0 }));
    let t0 = performance.now(), raf, running = true;
    function frame(now) {
      const { ctx, w, h } = sizeCanvas(cv);
      const t = (now - t0) / 1000;
      const mobile = w < 760;
      const X0 = mobile ? w * 0.04 : w * 0.42, X1 = w * 0.97, Y0 = h * (mobile ? 0.1 : 0.14), Y1 = h * (mobile ? 0.36 : 0.78);
      ctx.globalAlpha = 1;
      // faint partition of the real data, bottom-right
      const leaves = L.leaves(tree);
      const maxD = Math.max(...L.nodes(tree).map((n) => n.depth));
      const pos = new Map(); let li = 0;
      (function place(n) {
        if (n.leaf) { pos.set(n.id, { x: X0 + (li + 0.5) * ((X1 - X0) / leaves.length), y: Y0 + (n.depth / maxD) * (Y1 - Y0) }); li++; return; }
        place(n.left); place(n.right);
        pos.set(n.id, { x: (pos.get(n.left.id).x + pos.get(n.right.id).x) / 2, y: Y0 + (n.depth / maxD) * (Y1 - Y0) });
      })(tree);
      const grow = reduced ? 99 : t / 0.75; // levels revealed
      const base = mobile ? 0.45 : 1;
      // edges
      for (const n of L.nodes(tree)) {
        if (n.leaf) continue;
        const p = pos.get(n.id);
        for (const ch of [n.left, n.right]) {
          const k = Math.max(0, Math.min(1, grow - n.depth));
          if (!k) continue;
          const c = pos.get(ch.id), my = (p.y + c.y) / 2;
          ctx.save();
          ctx.strokeStyle = `rgba(239,232,214,${0.42 * base})`;
          ctx.lineWidth = Math.max(0.8, 2.4 - n.depth * 0.35);
          ctx.beginPath();
          const steps = 30, upto = Math.floor(steps * ease(k));
          for (let i = 0; i <= upto; i++) {
            const u = i / steps, a = 1 - u;
            const x = a * a * a * p.x + 3 * a * a * u * p.x + 3 * a * u * u * c.x + u * u * u * c.x;
            const y = a * a * a * p.y + 3 * a * a * u * my + 3 * a * u * u * my + u * u * u * c.y;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke(); ctx.restore();
        }
      }
      // nodes
      ctx.font = `500 ${mobile ? 9 : 11}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const n of L.nodes(tree)) {
        const k = Math.max(0, Math.min(1, grow - n.depth + 0.2));
        if (!k) continue;
        const p = pos.get(n.id);
        const bob = reduced ? 0 : Math.sin(t * 0.8 + n.id) * 1.5;
        if (n.leaf) {
          const col = n.pred ? '240,110,130' : '160,205,120';
          const g = ctx.createRadialGradient(p.x, p.y + bob, 0, p.x, p.y + bob, 16);
          g.addColorStop(0, `rgba(${col},${0.55 * k * base})`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 16, 0, 6.29); ctx.fill();
          ctx.fillStyle = `rgba(${col},${k * base})`; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 3.6, 0, 6.29); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(239,232,214,${k * base})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, n.depth === 0 ? 5 : 3.2, 0, 6.29); ctx.fill();
          if (n.depth < (mobile ? 1 : 3)) {
            const label = qText(n);
            const tw = ctx.measureText(label).width + 14;
            ctx.fillStyle = `rgba(11,36,27,${0.75 * k * base})`;
            ctx.beginPath(); ctx.roundRect ? ctx.roundRect(p.x - tw / 2, p.y - 25, tw, 18, 9) : ctx.rect(p.x - tw / 2, p.y - 25, tw, 18); ctx.fill();
            ctx.fillStyle = `rgba(232,196,120,${k * base})`;
            ctx.fillText(label, p.x, p.y - 16);
          }
        }
      }
      // spores
      for (const s of spores) {
        const y = ((s.y - (reduced ? 0 : t * s.s * 0.02)) % 1 + 1) % 1;
        const x = s.x + Math.sin(t * 0.5 + s.ph) * 0.01;
        ctx.fillStyle = s.hue ? `rgba(232,180,90,${0.5 * base})` : `rgba(230,240,220,${0.28 * base})`;
        ctx.beginPath(); ctx.arc(x * w, y * h, s.r, 0, 6.29); ctx.fill();
      }
      if (running && !reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    }).observe(cv);
    redraws.push(() => requestAnimationFrame(frame));
  })();

  /* ═════════ MUSHROOM ILLUSTRATIONS ═════════ */
  const SHROOMS = [
    { id: 'freckled', name: 'Freckled Parasol', type: 'parasol', cap: '#c4552f', spots: true, ring: true, wood: false, eat: 'Poisonous' },
    { id: 'button', name: 'Moss Button', type: 'button', cap: '#8a5a36', ring: false, wood: false, eat: 'Edible' },
    { id: 'copper', name: 'Copper Shelf', type: 'shelf', cap: '#d27a2c', wood: true, eat: 'Edible' },
    { id: 'friar', name: 'Pale Friar', type: 'dome', cap: '#efe7d3', ring: true, wood: false, eat: 'Poisonous' },
    { id: 'ember', name: 'Ember Bell', type: 'bell', cap: '#c7283c', wood: true, eat: 'Poisonous' },
    { id: 'inkwell', name: 'Inkwell Cone', type: 'cone', cap: '#3b3d45', ring: false, wood: false, eat: 'Edible' },
    { id: 'honey', name: 'Honey Cluster', type: 'cluster', cap: '#d9a441', wood: true, eat: 'Edible' },
    { id: 'ash', name: 'Ash Bracket', type: 'shelf', cap: '#9b9a90', wood: true, eat: 'Inedible' },
  ];
  const byId = Object.fromEntries(SHROOMS.map((m) => [m.id, m]));
  const STEM = '#f1e8d2', STEM_S = '#d9ccb0', GILL = 'rgba(0,0,0,.18)';
  function stem(x, top, bot, w, ring) {
    let s = `<path d="M${x - w / 2} ${bot} Q${x - w / 2 - 1} ${(top + bot) / 2} ${x - w / 2 + 1} ${top} L${x + w / 2 - 1} ${top} Q${x + w / 2 + 1} ${(top + bot) / 2} ${x + w / 2} ${bot}Z" fill="${STEM}" stroke="${STEM_S}" stroke-width="1"/>`;
    if (ring) s += `<path d="M${x - w / 2 - 4} ${top + 10} Q${x} ${top + 17} ${x + w / 2 + 4} ${top + 10} Q${x} ${top + 13} ${x - w / 2 - 4} ${top + 10}Z" fill="#fff8e8" stroke="${STEM_S}"/>`;
    return s;
  }
  function shroomSVG(m) {
    let g = '';
    if (m.type === 'shelf') {
      g += `<path d="M14 92 L14 24 Q22 16 34 22 L38 92Z" fill="#6e4a2b"/><path d="M18 30 L18 90 M26 26 L27 90 M33 28 L34 90" stroke="#5a3b21" stroke-width="1.3"/><ellipse cx="50" cy="93" rx="44" ry="4" fill="#5d8a41" opacity=".6"/>`;
      for (const [y, s] of [[34, 1], [52, 1.15], [70, 0.9]]) {
        g += `<path d="M36 ${y} Q${62 + 18 * s} ${y - 8 * s} ${64 + 16 * s} ${y + 3} Q${58 + 12 * s} ${y + 12 * s} 36 ${y + 9 * s}Z" fill="${m.cap}" stroke="rgba(0,0,0,.25)"/>`;
        g += `<path d="M38 ${y + 3} Q${58 + 12 * s} ${y - 2} ${60 + 12 * s} ${y + 4}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>`;
      }
      return g;
    }
    if (m.wood) {
      g += `<rect x="6" y="74" width="86" height="18" rx="9" fill="#77512f"/><path d="M14 80h40M30 86h44" stroke="#5a3b21" stroke-width="1.4"/><ellipse cx="88" cy="83" rx="6" ry="9" fill="#b08455"/><ellipse cx="88" cy="83" rx="3" ry="5" fill="none" stroke="#77512f"/>`;
    } else {
      g += `<ellipse cx="50" cy="90" rx="42" ry="7" fill="#5d8a41"/><path d="M14 88l2-7 2 7M80 89l2-8 2 8M24 90l1-5 2 5" stroke="#46703a" stroke-width="1.5" fill="none"/>`;
    }
    if (m.type === 'parasol') {
      g += stem(50, 32, 88, 7, m.ring);
      g += `<path d="M12 38 Q50 6 88 38 Q50 30 12 38Z" fill="${m.cap}" stroke="rgba(0,0,0,.25)"/><path d="M16 37 Q50 33 84 37" stroke="${GILL}" stroke-width="2"/>`;
      if (m.spots) for (const [x, y, r] of [[30, 26, 3], [45, 19, 2.6], [60, 21, 3.2], [72, 29, 2.4], [38, 31, 1.8], [54, 28, 2]]) g += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7e6"/>`;
    } else if (m.type === 'dome') {
      g += stem(50, 50, 88, 10, m.ring);
      g += `<path d="M22 54 Q22 20 50 20 Q78 20 78 54 Q50 49 22 54Z" fill="${m.cap}" stroke="#cbbf9f"/><path d="M34 28 Q42 23 50 24" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`;
    } else if (m.type === 'cone') {
      g += stem(50, 52, 88, 6, false);
      g += `<path d="M33 58 Q37 16 50 10 Q63 16 67 58 Q50 54 33 58Z" fill="${m.cap}"/><path d="M42 50 Q44 26 50 16" stroke="rgba(255,255,255,.25)" stroke-width="2" fill="none"/><path d="M33 58 l3 4 l3 -3 l3 4 l3 -3 l4 4 l3 -4 l3 3 l3 -4 l3 4 l3 -5" stroke="${m.cap}" fill="none" stroke-width="1.5"/>`;
    } else if (m.type === 'button') {
      g += stem(50, 68, 88, 9, false);
      g += `<path d="M31 72 Q31 48 50 48 Q69 48 69 72 Q50 68 31 72Z" fill="${m.cap}"/><path d="M40 54 Q46 51 52 51" stroke="#fff" stroke-width="2.5" fill="none" opacity=".35"/>`;
    } else if (m.type === 'bell') {
      for (const [x, top, s] of [[36, 36, 1], [64, 46, 0.8]]) {
        g += stem(x, top + 18 * s, 76, 5 * s, false);
        g += `<path d="M${x - 14 * s} ${top + 24 * s} Q${x - 12 * s} ${top} ${x} ${top - 2} Q${x + 12 * s} ${top} ${x + 14 * s} ${top + 24 * s} Q${x} ${top + 19 * s} ${x - 14 * s} ${top + 24 * s}Z" fill="${m.cap}" stroke="rgba(0,0,0,.2)"/><path d="M${x - 5 * s} ${top + 6} Q${x - 2} ${top + 2} ${x + 2} ${top + 2}" stroke="#fff" stroke-width="2" opacity=".45" fill="none"/>`;
      }
    } else if (m.type === 'cluster') {
      for (const [x, top, s] of [[30, 50, 0.8], [46, 36, 1], [62, 44, 0.9], [76, 56, 0.7]]) {
        g += stem(x, top + 10 * s, 76, 5 * s, false);
        g += `<path d="M${x - 12 * s} ${top + 12 * s} Q${x - 12 * s} ${top - 4 * s} ${x} ${top - 4 * s} Q${x + 12 * s} ${top - 4 * s} ${x + 12 * s} ${top + 12 * s} Q${x} ${top + 9 * s} ${x - 12 * s} ${top + 12 * s}Z" fill="${m.cap}" stroke="rgba(0,0,0,.2)"/>`;
      }
    }
    return g;
  }

  /* ═════════ CH1: FIELD KEY ═════════ */
  (function keyGame() {
    const Q = {
      wood: { q: 'Does it grow on wood?', test: (m) => m.wood },
      shelf: { q: 'Is the cap a flat, shelf-like bracket?', test: (m) => m.type === 'shelf' },
      orange: { q: 'Is the shelf orange?', test: (m) => m.id === 'copper' },
      red: { q: 'Is the cap red?', test: (m) => m.id === 'ember' },
      ring: { q: 'Is there a ring around the stem?', test: (m) => !!m.ring },
      spots: { q: 'Does the cap have white spots?', test: (m) => !!m.spots },
      cone: { q: 'Is the cap shaped like a cone?', test: (m) => m.type === 'cone' },
    };
    const short = { wood: 'On wood?', shelf: 'Shelf-shaped?', orange: 'Orange?', red: 'Red cap?', ring: 'Ring on stem?', spots: 'White spots?', cone: 'Cone cap?' };
    // no = left, yes = right (same convention as the learned trees)
    const KEY = { k: 'wood',
      no: { k: 'ring', no: { k: 'cone', no: 'button', yes: 'inkwell' }, yes: { k: 'spots', no: 'friar', yes: 'freckled' } },
      yes: { k: 'shelf', no: { k: 'red', no: 'honey', yes: 'ember' }, yes: { k: 'orange', no: 'ash', yes: 'copper' } } };

    const cards = $('#key-cards'), svg = $('#key-tree'), dlg = $('#key-dialog');
    SHROOMS.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'kcard'; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', 'false'); b.dataset.id = m.id;
      b.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true">${shroomSVG(m)}</svg><span class="kn">${m.name}</span><span class="ke" style="color:${m.eat === 'Poisonous' ? C.berry : m.eat === 'Edible' ? C.moss : C.faint}">${m.eat}</span>`;
      b.style.animation = `rise .7s ${i * 0.05}s both`;
      b.addEventListener('click', () => start(m.id));
      cards.appendChild(b);
    });

    // layout
    const W = 880, lv = [26, 112, 198], leafY = 290;
    const nodes = [], edges = [];
    let leafI = 0;
    (function lay(n, depth, path) {
      if (typeof n === 'string') {
        const x = (leafI + 0.5) * (W / 8); leafI++;
        nodes.push({ leaf: n, x, y: leafY, path });
        return { x, y: leafY };
      }
      const a = lay(n.no, depth + 1, path + '0'), b = lay(n.yes, depth + 1, path + '1');
      const x = (a.x + b.x) / 2, y = lv[depth];
      nodes.push({ k: n.k, x, y, path });
      edges.push({ from: { x, y }, to: a, path: path + '0', lab: 'no' }, { from: { x, y }, to: b, path: path + '1', lab: 'yes' });
      return { x, y };
    })(KEY, 0, '');
    svg.setAttribute('viewBox', `0 0 ${W} 345`);
    for (const e of edges) {
      const y1 = e.from.y + 16, y2 = e.to.y - (e.to.y === leafY ? 24 : 15), my = (y1 + y2) / 2;
      el('path', { class: 'kt-edge', 'data-path': e.path, d: `M${e.from.x},${y1} C${e.from.x},${my} ${e.to.x},${my} ${e.to.x},${y2}` }, svg);
      const t = el('text', { class: 'kt-elabel', x: e.from.x * 0.35 + e.to.x * 0.65, y: my + 4, 'text-anchor': 'middle' }, svg);
      t.textContent = e.lab;
    }
    for (const n of nodes) {
      if (n.leaf) {
        const g = el('g', { class: 'kt-leaf', 'data-path': n.path }, svg);
        el('circle', { cx: n.x, cy: n.y, r: 24 }, g);
        const inner = el('g', { transform: `translate(${n.x - 19} ${n.y - 21}) scale(.38)` }, g);
        inner.innerHTML = shroomSVG(byId[n.leaf]);
        const t = el('text', { x: n.x, y: n.y + 40, 'text-anchor': 'middle' }, g);
        t.textContent = byId[n.leaf].name.split(' ')[0];
      } else {
        const g = el('g', { class: 'kt-node', 'data-path': n.path }, svg);
        const w = 128;
        el('rect', { x: n.x - w / 2, y: n.y - 15, width: w, height: 30, rx: 6 }, g);
        const t = el('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle' }, g);
        t.textContent = short[n.k];
      }
    }

    let chosen = null, cur = null, path = '', asked = 0;
    function subtreeIds(n) { return typeof n === 'string' ? [n] : [...subtreeIds(n.no), ...subtreeIds(n.yes)]; }
    function paint() {
      $$('.kt-edge', svg).forEach((e) => e.classList.toggle('on', path.startsWith(e.dataset.path)));
      $$('.kt-node, .kt-leaf', svg).forEach((g) => {
        const p = g.dataset.path;
        g.classList.toggle('on', chosen && path.startsWith(p) && p !== path);
        g.classList.toggle('ask', chosen && p === path && typeof cur !== 'string');
        if (g.classList.contains('kt-leaf')) g.classList.toggle('on', chosen && p === path && typeof cur === 'string');
      });
      const alive = cur ? subtreeIds(cur) : SHROOMS.map((m) => m.id);
      $$('.kcard', cards).forEach((c) => c.classList.toggle('out', !!chosen && !alive.includes(c.dataset.id) && c.dataset.id !== chosen));
    }
    function start(id) {
      chosen = id; cur = KEY; path = ''; asked = 0;
      $$('.kcard', cards).forEach((c) => { c.setAttribute('aria-selected', String(c.dataset.id === id)); c.classList.remove('reveal-e'); });
      ask();
    }
    function ask() {
      paint();
      if (typeof cur === 'string') return finish();
      const q = Q[cur.k];
      dlg.innerHTML = `<p class="key-step">Question ${asked + 1} of 3 · ${subtreeIds(cur).length} mushrooms left</p><p class="key-prompt">${q.q}</p><div class="key-btns"><button type="button" class="btn" data-a="yes">Yes</button><button type="button" class="btn" data-a="no">No</button></div><p class="key-result" style="margin-top:.7rem">Look at your <b>${byId[chosen].name}</b>.</p>`;
      $$('[data-a]', dlg).forEach((b) => b.addEventListener('click', () => {
        const yes = b.dataset.a === 'yes';
        path += yes ? '1' : '0'; asked++;
        cur = yes ? cur.yes : cur.no;
        ask();
      }));
      $('[data-a]', dlg).focus({ preventScroll: true });
    }
    function finish() {
      const m = byId[cur];
      const ok = cur === chosen;
      $(`.kcard[data-id="${cur}"]`, cards).classList.add('reveal-e');
      dlg.innerHTML = ok
        ? `<p class="key-step">Found in 3 questions</p><p class="key-prompt">It's the ${m.name}.</p><p class="key-result">In this invented forest it's <b style="color:${m.eat === 'Poisonous' ? '#f39aa8' : '#bfe3a3'}">${m.eat.toLowerCase()}</b>. Eight possibilities, three questions, no guessing. <button type="button" class="btn" style="margin-top:.6rem" data-again>Try another</button></p>`
        : `<p class="key-step">Hmm</p><p class="key-prompt">The key landed on the ${m.name}.</p><p class="key-result">But you picked the ${byId[chosen].name}. One answer went the other way — look closely and try again. <button type="button" class="btn" style="margin-top:.6rem" data-retry>Retry</button></p>`;
      const again = $('[data-again]', dlg), retry = $('[data-retry]', dlg);
      if (again) again.addEventListener('click', reset);
      if (retry) retry.addEventListener('click', () => start(chosen));
    }
    function reset() {
      chosen = null; cur = null; path = '';
      $$('.kcard', cards).forEach((c) => { c.setAttribute('aria-selected', 'false'); c.classList.remove('out'); });
      dlg.innerHTML = '<p class="key-prompt">Choose a mushroom above to begin.</p>';
      paint();
    }
  })();

  /* ═════════ CH1: DOUBLING ═════════ */
  (function doubling() {
    const s = $('#dbl-slider'), cv = $('#dbl-canvas');
    const things = {
      1: 'a coin toss: heads or tails.', 2: 'the four suits in a deck of cards.', 3: 'our eight mushrooms.', 4: 'sixteen — a small dinner party.',
      5: 'about the students in a classroom.', 6: 'the squares on a chessboard.', 7: 'every character on a basic keyboard, roughly.', 8: 'a page of a phone book.',
      9: 'a big school year group.', 10: 'about the words in a short essay.', 11: 'a large village.', 12: 'a small town’s households.',
      13: 'the seats in a big concert hall, give or take.', 14: 'a small town.', 15: 'a sold-out arena, twice over.', 16: 'a packed football stadium.',
      17: 'a mid-sized city’s households.', 18: 'a quarter of a million.', 19: 'half a million.', 20: 'over a million. Twenty good questions can pick out one person in a city of a million.',
    };
    let shown = 0, target = 0, raf;
    function draw() {
      const n = +s.value;
      $('#dbl-n').textContent = n;
      $('#dbl-count').textContent = fmt(2 ** n);
      $('#dbl-thing').textContent = '— ' + things[n];
      target = Math.min(2 ** n, 1024);
      cancelAnimationFrame(raf);
      const tick = () => {
        shown += (target - shown) * (reduced ? 1 : 0.18);
        if (Math.abs(target - shown) < 0.5) shown = target;
        paint(n, Math.round(shown));
        if (shown !== target) raf = requestAnimationFrame(tick);
      };
      tick();
    }
    function paint(n, k) {
      const { ctx, w, h } = sizeCanvas(cv);
      const cols = 64, rows = 16;
      const cell = Math.min(w / cols, h / rows);
      const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
      const scale = n > 10 ? 2 ** (n - 10) : 1;
      for (let i = 0; i < 1024; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        const x = ox + c * cell + cell / 2, y = oy + r * cell + cell / 2;
        ctx.beginPath(); ctx.arc(x, y, cell * 0.32, 0, 6.29);
        if (i < k) ctx.fillStyle = i === 0 ? C.ochre : scale > 1 ? mix('#4a7d36', '#12382a', Math.min(1, (n - 10) / 10)) : C.moss;
        else ctx.fillStyle = 'rgba(27,36,30,.07)';
        ctx.fill();
      }
      if (scale > 1) {
        ctx.fillStyle = 'rgba(251,248,240,.9)';
        const label = `each dot = ${fmt(scale)} things`;
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(label).width + 16;
        ctx.fillRect(w - tw - 6, h - 26, tw, 20);
        ctx.fillStyle = C.ink; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(label, w - 14, h - 16);
      }
    }
    s.addEventListener('input', draw);
    onSeen(cv, draw);
    redraws.push(() => paint(+s.value, Math.round(shown)));
  })();

  /* ═════════ CH1: ARCHIVE PLATE ═════════ */
  (function plate() {
    const svg = $('#plate-svg');
    const ink = '#4a3519', faint = 'rgba(74,53,25,.55)';
    const rows = [
      ['1', 'Fleurs apparentes', '2'], ['—', 'Fleurs non apparentes', '9'],
      ['2', 'Corolle d’une seule pièce', '3'], ['—', 'Corolle de plusieurs pièces', '6'],
      ['3', 'Fruit charnu', '4'], ['—', 'Fruit sec', '5'],
    ];
    let s = `<rect x="6" y="6" width="508" height="348" fill="none" stroke="${faint}" stroke-width="1"/><rect x="12" y="12" width="496" height="336" fill="none" stroke="${faint}" stroke-width=".6"/>`;
    s += `<text x="260" y="44" text-anchor="middle" font-family="Fraunces, serif" font-size="19" font-style="italic" fill="${ink}">Clef analytique.</text>`;
    s += `<text x="260" y="64" text-anchor="middle" font-family="Fraunces, serif" font-size="10" letter-spacing="3" fill="${faint}">TABLE DES DIVISIONS</text>`;
    s += `<path d="M150 76h220" stroke="${faint}"/>`;
    rows.forEach(([n, t, go], i) => {
      const y = 104 + i * 26;
      const ind = Math.floor(i / 2) * 16;
      s += `<text x="${34 + ind}" y="${y}" font-family="Fraunces, serif" font-size="13" fill="${ink}">${n}</text>`;
      s += `<text x="${56 + ind}" y="${y}" font-family="Fraunces, serif" font-size="13" font-style="italic" fill="${ink}">${t}</text>`;
      s += `<path d="M${60 + ind + t.length * 6.4} ${y - 3}H272" stroke="${faint}" stroke-dasharray="1 4"/>`;
      s += `<text x="286" y="${y}" font-family="Fraunces, serif" font-size="13" fill="${ink}">${go}</text>`;
    });
    // bracket diagram
    s += `<g fill="none" stroke="${ink}" stroke-width="1.2"><path d="M312 100 h16 v26 h-16 M328 113 h12"/><path d="M332 152 h14 v26 h-14 M346 165 h10"/><path d="M350 204 h12 v26 h-12 M362 217 h8"/></g>`;
    // botanical drawing
    s += `<g transform="translate(395 96)" fill="none" stroke="${ink}" stroke-width="1.1" stroke-linecap="round">
      <path d="M40 210 C38 170 44 120 40 70"/><path d="M40 160 C20 150 8 132 10 118 C26 120 38 136 40 160Z" fill="rgba(110,130,60,.18)"/>
      <path d="M40 130 C60 120 72 102 70 88 C54 92 42 108 40 130Z" fill="rgba(110,130,60,.18)"/>
      <path d="M40 70 C22 66 14 48 22 34 C30 44 36 54 40 70Z M40 70 C58 66 66 48 58 34 C50 44 44 54 40 70Z M40 70 C34 50 34 30 40 16 C46 30 46 50 40 70Z" fill="rgba(192,53,77,.22)"/>
      <path d="M16 118 L28 130 M68 92 L56 106"/><circle cx="40" cy="70" r="3" fill="${ink}"/></g>`;
    s += `<text x="434" y="330" text-anchor="middle" font-family="Fraunces, serif" font-size="9" font-style="italic" fill="${faint}">Fig. 1</text>`;
    s += `<text x="34" y="300" font-family="Fraunces, serif" font-size="10.5" fill="${faint}">On choisit entre deux caractères opposés,</text>`;
    s += `<text x="34" y="316" font-family="Fraunces, serif" font-size="10.5" fill="${faint}">et l’on suit le numéro indiqué.</text>`;
    s += `<text x="34" y="336" font-family="Fraunces, serif" font-size="9" letter-spacing="2" fill="${faint}">— D’APRÈS LAMARCK, 1778 —</text>`;
    svg.innerHTML = s;
  })();

  /* ═════════ CH2: SCROLLYTELLING ═════════ */
  (function scrolly() {
    const cv = $('#field-canvas'), svg = $('#field-tree'), accEl = $('#field-acc');
    const jit = new Map(train.map((d) => [d.id, Math.random()]));
    const views = {
      3: atDepth[1],
      4: truncateWhere(full, (n) => n.depth === 0 || (n.depth === 1 && n.id === full.left.id)),
      5: atDepth[2], 6: atDepth[3], 7: atDepth[3], 8: atDepth[3],
    };
    let step = -1, prevTree = null, curTree = null, anim = 1, a0 = 0, raf, sweepT = 0;
    const appear = new Map(train.map((d) => [d.id, Math.random() * 0.6]));
    let introT = 0;
    function draw() {
      const P = makePlot(cv);
      drawFrame(P);
      const k = ease(anim);
      if (prevTree && curTree !== prevTree) drawRegions(P, prevTree, 1 - k);
      if (curTree) drawRegions(P, curTree, prevTree === curTree ? 1 : k);
      drawAxes(P);
      if (curTree) {
        const had = new Set(prevTree ? L.nodes(prevTree).filter((n) => !n.leaf).map((n) => n.id) : []);
        drawSplits(P, curTree, (n) => (had.has(n.id) ? 1 : k));
      }
      if (step === 2) {
        // candidate questions flicker
        const { ctx } = P;
        ctx.save();
        for (let i = 0; i < 9; i++) {
          const ph = (sweepT * 0.9 + i / 9) % 1;
          const horiz = i % 2 === 0;
          ctx.strokeStyle = `rgba(212,145,42,${0.15 + 0.6 * Math.sin(ph * Math.PI)})`;
          ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
          ctx.beginPath();
          if (horiz) { const y = P.sy(D.y0 + ((i * 0.137 + sweepT * 0.11) % 1) * (D.y1 - D.y0)); ctx.moveTo(P.pad.l, y); ctx.lineTo(P.pad.l + P.iw, y); }
          else { const x = P.sx(D.x0 + ((i * 0.173 + sweepT * 0.07) % 1) * (D.x1 - D.x0)); ctx.moveTo(x, P.pad.t); ctx.lineTo(x, P.pad.t + P.ih); }
          ctx.stroke();
        }
        ctx.restore();
      }
      const colorT = step <= 0 ? 0 : step === 1 ? ease(anim) : 1;
      drawPoints(P, train, { colorT, jitter: () => 0, scale: (d) => Math.max(0, Math.min(1, (introT - appear.get(d.id)) / 0.4)) });
      if (step >= 7) drawTruth(P, step === 7 ? ease(anim) : 1);
    }
    function loop(now) {
      anim = reduced ? 1 : Math.min(1, (now - a0) / 750);
      introT = reduced ? 2 : Math.min(2, introT + 0.025);
      sweepT += 0.01;
      draw();
      if (anim < 1 || introT < 1.2 || step === 2) raf = requestAnimationFrame(loop);
    }
    function setStep(s) {
      if (s === step) return;
      step = s;
      prevTree = curTree;
      curTree = views[s] || null;
      if (prevTree === curTree) prevTree = curTree;
      a0 = performance.now(); anim = 0;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      if (curTree) {
        renderTree(svg, curTree, { nodeW: 92, levelH: 58, minW: 680, stagger: true });
        accEl.textContent = 'Accuracy ' + pct(L.accuracy(curTree, train));
      } else {
        resetSeen(svg); svg.textContent = '';
        accEl.textContent = '';
      }
      $$('.step').forEach((e) => e.classList.toggle('active', +e.dataset.step === s));
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.step); });
    }, { rootMargin: matchMedia('(max-width: 960px)').matches ? '-72% 0px -8% 0px' : '-45% 0px -45% 0px' });
    $$('.step').forEach((e) => io.observe(e));
    onSeen(cv, () => { if (step < 0) setStep(0); });
    redraws.push(draw);
  })();

  /* ═════════ CH3: JAR ═════════ */
  (function jar() {
    const s = $('#jar-slider'), cv = $('#jar-canvas'), cc = $('#jar-curve');
    const spots = [];
    const r = L.rng(5);
    for (let i = 0; i < 20; i++) spots.push({ x: 0.18 + (i % 5) * 0.16 + (r() - 0.5) * 0.05, y: 0.3 + Math.floor(i / 5) * 0.15 + (r() - 0.5) * 0.04, o: r() });
    const order = spots.map((_, i) => i).sort((a, b) => spots[a].o - spots[b].o);
    function draw() {
      const k = +s.value, n = 20;
      const c = [n - k, k];
      $('#jar-out').textContent = `${k} of 20`;
      $('#jar-gini').textContent = L.gini(c).toFixed(2);
      $('#jar-ent').textContent = L.entropy(c).toFixed(2);
      // basket
      let { ctx, w, h } = sizeCanvas(cv);
      ctx.save();
      ctx.fillStyle = '#e9dcbd';
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.22); ctx.lineTo(w * 0.92, h * 0.22); ctx.lineTo(w * 0.82, h * 0.96); ctx.lineTo(w * 0.18, h * 0.96); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.2;
      for (let i = 1; i < 7; i++) { const y = h * (0.22 + i * 0.105); ctx.beginPath(); ctx.moveTo(w * (0.08 + i * 0.0143), y); ctx.lineTo(w * (0.92 - i * 0.0143), y); ctx.stroke(); }
      ctx.lineWidth = 6; ctx.strokeStyle = '#b89a62';
      ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.22, w * 0.36, h * 0.2, 0, Math.PI, 0); ctx.stroke();
      const poison = new Set(order.slice(0, k));
      spots.forEach((p, i) => {
        const x = p.x * w, y = p.y * h, rr = Math.min(w, h) * 0.05;
        const pz = poison.has(i);
        ctx.fillStyle = STEM; ctx.fillRect(x - rr * 0.25, y, rr * 0.5, rr * 0.9);
        ctx.fillStyle = pz ? C.berry : C.moss;
        ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.75, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        if (pz) { ctx.fillStyle = '#fff3e6'; ctx.beginPath(); ctx.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.13, 0, 6.29); ctx.arc(x + rr * 0.25, y - rr * 0.5, rr * 0.1, 0, 6.29); ctx.fill(); }
      });
      ctx.restore();
      // curve
      ({ ctx, w, h } = sizeCanvas(cc));
      const pad = { l: 34, r: 10, t: 12, b: 28 };
      const X = (p) => pad.l + p * (w - pad.l - pad.r), Y = (v) => h - pad.b - v * (h - pad.t - pad.b);
      ctx.strokeStyle = 'rgba(27,36,30,.08)'; ctx.fillStyle = C.faint; ctx.font = '500 10px "IBM Plex Mono", monospace';
      for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(v.toFixed(1), pad.l - 6, Y(v)); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ['all edible', '50 / 50', 'all poisonous'].forEach((t, i) => ctx.fillText(t, X(i / 2), h - pad.b + 7));
      const curve = (f, col, dash) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash(dash || []);
        ctx.beginPath();
        for (let i = 0; i <= 100; i++) { const p = i / 100; const v = f([1 - p, p]); i ? ctx.lineTo(X(p), Y(v)) : ctx.moveTo(X(p), Y(v)); }
        ctx.stroke(); ctx.restore();
      };
      curve(L.gini, C.moss); curve(L.entropy, C.ochre, [6, 5]);
      const p = k / n;
      ctx.strokeStyle = 'rgba(27,36,30,.3)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(X(p), pad.t); ctx.lineTo(X(p), h - pad.b); ctx.stroke(); ctx.setLineDash([]);
      for (const [f, col] of [[L.gini, C.moss], [L.entropy, C.ochre]]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(p), Y(f([1 - p, p])), 6, 0, 6.29); ctx.fill();
        ctx.strokeStyle = C.card; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    s.addEventListener('input', draw);
    onSeen(cv, draw);
    redraws.push(draw);
  })();

  /* ═════════ CH3: SPLIT LAB ═════════ */
  (function splitLab() {
    const cv = $('#split-canvas'), sc = $('#sweep-canvas'), s = $('#split-slider');
    let feature = 'stem';
    let sweeps = { stem: L.sweep(train, 'stem'), cap: L.sweep(train, 'cap') };
    const before = L.gini(L.counts(train));
    $('#g-before').textContent = before.toFixed(3);
    const best = L.bestSplit(train, { minLeaf: 1 }, Math.random);
    let animating = false;
    function setRange() {
      const [lo, hi] = feature === 'cap' ? [D.x0, D.x1] : [D.y0, D.y1];
      s.min = lo; s.max = hi;
      $('#split-q').firstChild.textContent = feature === 'cap' ? 'Is the cap wider than ' : 'Is the stem taller than ';
      cv.classList.toggle('horiz', feature === 'stem');
    }
    function basket(id, c) {
      const b = $(id), n = c[0] + c[1];
      $('.e', b).style.width = n ? (c[0] / n) * 100 + '%' : '0';
      $('.p', b).style.width = n ? (c[1] / n) * 100 + '%' : '0';
      $('.b-n', b).textContent = `${n} mushrooms · ${c[0]} edible, ${c[1]} poisonous`;
      $('.b-g', b).textContent = 'Gini ' + L.gini(c).toFixed(3);
    }
    function draw() {
      const t = +s.value;
      $('#split-t').textContent = cm(t);
      syncFill(s);
      const r = L.splitScore(train, feature, t);
      basket('#basket-l', r.left); basket('#basket-r', r.right);
      $('#g-after').textContent = r.score.toFixed(3);
      const gain = before - r.score;
      $('#g-gain').textContent = gain.toFixed(3);
      // plot
      const P = makePlot(cv);
      drawFrame(P);
      const { ctx } = P;
      ctx.save();
      if (feature === 'cap') {
        const x = P.sx(t);
        ctx.fillStyle = 'rgba(212,145,42,.08)'; ctx.fillRect(x, P.pad.t, P.pad.l + P.iw - x, P.ih);
      } else {
        const y = P.sy(t);
        ctx.fillStyle = 'rgba(212,145,42,.08)'; ctx.fillRect(P.pad.l, P.pad.t, P.iw, y - P.pad.t);
      }
      ctx.restore();
      drawAxes(P);
      drawPoints(P, train, { alpha: 0.95 });
      ctx.save();
      ctx.strokeStyle = C.ochre; ctx.lineWidth = 3;
      ctx.beginPath();
      if (feature === 'cap') { const x = P.sx(t); ctx.moveTo(x, P.pad.t); ctx.lineTo(x, P.pad.t + P.ih); }
      else { const y = P.sy(t); ctx.moveTo(P.pad.l, y); ctx.lineTo(P.pad.l + P.iw, y); }
      ctx.stroke();
      // handle
      ctx.fillStyle = C.ochre;
      const hx = feature === 'cap' ? P.sx(t) : P.pad.l + P.iw - 14, hy = feature === 'cap' ? P.pad.t + 14 : P.sy(t);
      ctx.beginPath(); ctx.arc(hx, hy, 9, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 10px "IBM Plex Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(feature === 'cap' ? '↔' : '↕', hx, hy + 1);
      ctx.font = '600 10px "IBM Plex Mono"';
      ctx.fillStyle = C.ink;
      if (feature === 'cap') { ctx.textAlign = 'left'; ctx.fillText('YES →', P.sx(t) + 8, P.pad.t + P.ih - 10); ctx.textAlign = 'right'; ctx.fillText('← NO', P.sx(t) - 8, P.pad.t + P.ih - 10); }
      else { ctx.textAlign = 'left'; ctx.fillText('YES ↑', P.pad.l + 8, P.sy(t) - 10); ctx.fillText('NO ↓', P.pad.l + 8, P.sy(t) + 12); }
      ctx.restore();
      drawSweep(t);
    }
    function drawSweep(t) {
      const { ctx, w, h } = sizeCanvas(sc);
      const pad = { l: 38, r: 8, t: 10, b: 20 };
      const [lo, hi] = feature === 'cap' ? [D.x0, D.x1] : [D.y0, D.y1];
      const X = (v) => pad.l + ((v - lo) / (hi - lo)) * (w - pad.l - pad.r);
      const vmin = 0.3, vmax = 0.52;
      const Y = (v) => pad.t + (1 - (v - vmin) / (vmax - vmin)) * (h - pad.t - pad.b);
      ctx.font = '500 9px "IBM Plex Mono", monospace'; ctx.fillStyle = C.faint;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (const v of [0.3, 0.4, 0.5]) { ctx.fillText(v.toFixed(1), pad.l - 5, Y(v)); ctx.strokeStyle = 'rgba(27,36,30,.07)'; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke(); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('weighted impurity after the cut — lower is better', pad.l + 2, h - pad.b + 6);
      const sw = sweeps[feature];
      ctx.beginPath(); ctx.strokeStyle = C.forest; ctx.lineWidth = 1.8;
      sw.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.score)) : ctx.moveTo(X(p.t), Y(p.score))));
      ctx.stroke();
      let m = sw[0];
      for (const p of sw) if (p.score < m.score) m = p;
      ctx.fillStyle = C.berry; ctx.beginPath(); ctx.arc(X(m.t), Y(m.score), 4, 0, 6.29); ctx.fill();
      ctx.font = '600 9px "IBM Plex Mono"'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = C.berry;
      ctx.fillText(`best ${cm(m.t)}`, X(m.t), Y(m.score) - 6);
      const cur = L.splitScore(train, feature, t).score;
      ctx.strokeStyle = C.ochre; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(t), pad.t); ctx.lineTo(X(t), h - pad.b); ctx.stroke();
      ctx.fillStyle = C.ochre; ctx.beginPath(); ctx.arc(X(t), Y(Math.min(vmax, cur)), 5, 0, 6.29); ctx.fill();
    }
    $$('#split-lab [data-feature]').forEach((b) => b.addEventListener('click', () => {
      feature = b.dataset.feature;
      $$('#split-lab [data-feature]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      setRange();
      s.value = feature === 'cap' ? 5 : 4;
      draw();
    }));
    s.addEventListener('input', draw);
    // drag directly on canvas
    let drag = false;
    const fromEvent = (e) => {
      const r = cv.getBoundingClientRect();
      const P = makePlot(cv);
      const v = feature === 'cap' ? P.ix(e.clientX - r.left) : P.iy(e.clientY - r.top);
      s.value = Math.max(+s.min, Math.min(+s.max, v));
      draw();
    };
    cv.addEventListener('pointerdown', (e) => { drag = true; cv.setPointerCapture(e.pointerId); fromEvent(e); });
    cv.addEventListener('pointermove', (e) => drag && fromEvent(e));
    cv.addEventListener('pointerup', () => (drag = false));
    $('#split-best').addEventListener('click', () => {
      if (animating) return;
      // sweep the current ruler, then jump to the overall best
      animating = true;
      const sw = sweeps[feature];
      let i = 0;
      const step = () => {
        i += Math.max(1, Math.round(sw.length / 70));
        if (i < sw.length && !reduced) { s.value = sw[i].t; draw(); setTimeout(step, 16); return; }
        if (best.feature !== feature) {
          feature = best.feature;
          $$('#split-lab [data-feature]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.feature === feature)));
          setRange();
        }
        s.value = best.t; draw();
        animating = false;
      };
      step();
    });
    setRange();
    onSeen(cv, draw);
    redraws.push(draw);
  })();

  /* ═════════ CH4: GROW ═════════ */
  (function grow() {
    const cv = $('#grow-canvas'), svg = $('#grow-tree'), pathEl = $('#grow-path');
    const maxD = Math.min(fullDepth, 7);
    let depth = 0, playing = null, hoverNode = null, hoverPt = null, refs = null, prevTree = null, a0 = 0, raf;
    function tree() { return atDepth[depth]; }
    function draw() {
      const P = makePlot(cv);
      const t = tree();
      const k = reduced ? 1 : ease(Math.min(1, (performance.now() - a0) / 650));
      drawFrame(P);
      if (prevTree && prevTree !== t) drawRegions(P, prevTree, 1 - k);
      drawRegions(P, t, prevTree && prevTree !== t ? k : 1);
      drawAxes(P);
      const had = new Set(prevTree ? L.nodes(prevTree).filter((n) => !n.leaf).map((n) => n.id) : []);
      drawSplits(P, t, (n) => (had.has(n.id) ? 1 : k));
      drawPoints(P, train, { alpha: hoverNode ? 0.35 : 0.95 });
      const { ctx } = P;
      if (hoverNode) {
        const b = hoverNode.bounds;
        ctx.save();
        ctx.strokeStyle = C.ochre; ctx.lineWidth = 3;
        ctx.strokeRect(P.sx(b.x0), P.sy(b.y1), P.sx(b.x1) - P.sx(b.x0), P.sy(b.y0) - P.sy(b.y1));
        ctx.restore();
        const inside = train.filter((d) => d.cap > b.x0 && d.cap <= b.x1 && d.stem > b.y0 && d.stem <= b.y1);
        drawPoints(P, inside);
      }
      if (hoverPt) {
        ctx.save();
        ctx.strokeStyle = C.ochre; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
        const x = P.sx(hoverPt.cap), y = P.sy(hoverPt.stem);
        ctx.beginPath(); ctx.moveTo(x, P.pad.t + P.ih); ctx.lineTo(x, y); ctx.lineTo(P.pad.l, y); ctx.stroke();
        ctx.setLineDash([]); ctx.fillStyle = C.ochre; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.29); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      if (k < 1) raf = requestAnimationFrame(draw);
    }
    function update(animate = true) {
      const t = tree();
      $('#grow-depth').textContent = depth;
      const nl = L.leaves(t).length;
      $('#grow-leaves').textContent = nl + (nl === 1 ? ' leaf' : ' leaves');
      $('#grow-acc').textContent = pct(trainAcc[depth]);
      refs = renderTree(svg, t, { nodeW: 84, levelH: 60, minW: 420, scrollable: true, interactive: true, stagger: true });
      bindNodes();
      a0 = animate ? performance.now() : 0;
      cancelAnimationFrame(raf); draw();
      prevTree = t;
      $('#grow-play').textContent = depth >= maxD ? '↺ Replant' : playing ? '❚❚ Pause' : '▶ Grow';
    }
    function highlightPath(leaf) {
      if (!refs) return;
      refs.nodes.forEach((g) => g.classList.remove('hl'));
      refs.edges.forEach((e) => e.classList.remove('hl'));
      if (!leaf) return;
      let n = tree();
      while (true) {
        refs.nodes.get(n.id)?.classList.add('hl');
        if (n.leaf) break;
        const v = n.feature === 'cap' ? leaf.cap : leaf.stem;
        n = v <= n.threshold ? n.left : n.right;
        refs.edges.get(n.id)?.classList.add('hl');
      }
    }
    function bindNodes() {
      refs.nodes.forEach((g, id) => {
        const n = L.nodes(tree()).find((x) => x.id === id);
        const on = () => { hoverNode = n; hoverPt = null; refs.nodes.forEach((x) => x.classList.toggle('dim', x !== g)); g.classList.add('hl'); draw(); describe(n); };
        const off = () => { hoverNode = null; refs.nodes.forEach((x) => x.classList.remove('dim', 'hl')); draw(); };
        g.addEventListener('pointerenter', on); g.addEventListener('focus', on);
        g.addEventListener('pointerleave', off); g.addEventListener('blur', off);
      });
    }
    function describe(n) {
      const conds = n.path.map((p) => `${p.f} ${p.dir === 'gt' ? '>' : '≤'} ${cm(p.t)}`);
      pathEl.innerHTML = (conds.length ? `<b>Responsible for:</b> ${conds.join(' and ')}. ` : '<b>The root</b> sees every mushroom. ') +
        `${n.n} mushrooms (${n.counts[0]} edible · ${n.counts[1]} poisonous), Gini ${n.impurity.toFixed(2)}.`;
    }
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect();
      const P = makePlot(cv);
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (!P.inside(px, py)) return;
      hoverPt = { cap: P.ix(px), stem: P.iy(py) };
      hoverNode = null;
      highlightPath(hoverPt);
      let n = tree(); const steps = [];
      while (!n.leaf) {
        const v = n.feature === 'cap' ? hoverPt.cap : hoverPt.stem;
        const yes = v > n.threshold;
        steps.push(`${n.feature} ${cm(v)} &gt; ${cm(n.threshold)}? <span class="ans">${yes ? 'yes' : 'no'}</span>`);
        n = yes ? n.right : n.left;
      }
      pathEl.innerHTML = `<b>Cap ${cm(hoverPt.cap)} cm, stem ${cm(hoverPt.stem)} cm:</b> ${steps.join(' → ') || 'no questions yet'} → <b style="color:${n.pred ? C.berry : C.moss}">${n.pred ? 'poisonous' : 'edible'}</b>`;
      draw();
    });
    cv.addEventListener('pointerleave', () => { hoverPt = null; highlightPath(null); draw(); });
    const setDepth = (d) => { depth = Math.max(0, Math.min(maxD, d)); update(); };
    $('#grow-plus').addEventListener('click', () => { stop(); setDepth(depth + 1); });
    $('#grow-minus').addEventListener('click', () => { stop(); setDepth(depth - 1); });
    function stop() { clearInterval(playing); playing = null; $('#grow-play').textContent = depth >= maxD ? '↺ Replant' : '▶ Grow'; }
    $('#grow-play').addEventListener('click', () => {
      if (playing) return stop();
      if (depth >= maxD) { resetSeen(svg); prevTree = null; setDepth(0); }
      playing = setInterval(() => { if (depth >= maxD) return stop(); setDepth(depth + 1); }, 1300);
      setDepth(depth + 1);
    });
    onSeen(cv, () => update(false));
    redraws.push(() => draw());
  })();

  /* ═════════ CH5: OVERFIT ═════════ */
  (function overfit() {
    const cv = $('#of-canvas'), ch = $('#of-chart'), s = $('#of-slider'), flips = $('#of-flips');
    let show = 'train';
    const maxD = Math.min(10, fullDepth);
    s.max = 10;
    const tAt = (d) => atDepth[Math.min(d, fullDepth)];
    const tr = (d) => trainAcc[Math.min(d, fullDepth)], te = (d) => testAcc[Math.min(d, fullDepth)];
    function draw() {
      const d = +s.value;
      $('#of-depth').textContent = d;
      $('#of-train').textContent = pct(tr(d));
      $('#of-test').textContent = pct(te(d));
      const P = makePlot(cv, { dark: true });
      drawFrame(P);
      drawRegions(P, tAt(d));
      drawAxes(P);
      drawSplits(P, tAt(d), () => 1, 'rgba(244,239,227,.55)');
      if (show === 'train') {
        drawPoints(P, train);
        if (flips.checked) {
          const { ctx } = P;
          ctx.save(); ctx.strokeStyle = C.ochre; ctx.lineWidth = 2;
          for (const p of train.filter((x) => x.flipped)) { ctx.beginPath(); ctx.arc(P.sx(p.cap), P.sy(p.stem), 10, 0, 6.29); ctx.stroke(); }
          ctx.restore();
        }
      } else {
        // new mushrooms: mark the wrong ones
        const t = tAt(d);
        drawPoints(P, test, { r: P.small ? 2.4 : 3, alpha: 0.9 });
        const { ctx } = P;
        ctx.save(); ctx.strokeStyle = '#f4efe3'; ctx.lineWidth = 1.4;
        for (const p of test) if (L.predict(t, p.cap, p.stem) !== p.label) {
          const x = P.sx(p.cap), y = P.sy(p.stem);
          ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
        }
        ctx.restore();
      }
      chart(d);
    }
    function chart(d) {
      const { ctx, w, h } = sizeCanvas(ch);
      const pad = { l: 38, r: 12, t: 14, b: 30 };
      const X = (v) => pad.l + ((v - 1) / 9) * (w - pad.l - pad.r);
      const vmin = 0.7, Y = (v) => pad.t + (1 - (v - vmin) / (1 - vmin)) * (h - pad.t - pad.b);
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      for (const v of [0.7, 0.8, 0.9, 1]) {
        ctx.strokeStyle = 'rgba(236,229,211,.08)'; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke();
        ctx.fillStyle = '#8fa38a'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(v * 100) + '%', pad.l - 6, Y(v));
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (let i = 1; i <= 10; i++) ctx.fillText(i, X(i), h - pad.b + 6);
      ctx.fillText('tree depth', (pad.l + w) / 2, h - 12);
      // sweet spot band
      ctx.fillStyle = 'rgba(212,145,42,.13)';
      ctx.fillRect(X(bestDepth) - 12, pad.t, 24, h - pad.t - pad.b);
      ctx.fillStyle = C.ochre; ctx.font = '600 9px "IBM Plex Mono"'; ctx.textBaseline = 'top';
      ctx.fillText('SWEET SPOT', X(bestDepth), pad.t + 2);
      for (const [f, col] of [[tr, '#9cc77f'], [te, '#f07d8f']]) {
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 1; i <= 10; i++) (i > 1 ? ctx.lineTo(X(i), Y(f(i))) : ctx.moveTo(X(i), Y(f(i))));
        ctx.stroke();
        for (let i = 1; i <= 10; i++) { ctx.fillStyle = i === d ? col : '#132e23'; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(i), Y(f(i)), i === d ? 6 : 3.5, 0, 6.29); ctx.fill(); ctx.stroke(); }
      }
      ctx.font = '600 10px "IBM Plex Mono"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#9cc77f'; ctx.fillText('learned from', X(7.2), Y(tr(10)) + 14);
      ctx.fillStyle = '#f07d8f'; ctx.fillText('new mushrooms', X(7.2), Y(te(10)) + 14);
    }
    $$('#overfit-lab [data-show]').forEach((b) => b.addEventListener('click', () => {
      show = b.dataset.show;
      $$('#overfit-lab [data-show]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      flips.disabled = show !== 'train';
      draw();
    }));
    s.addEventListener('input', draw);
    flips.addEventListener('change', draw);
    onSeen(cv, draw);
    redraws.push(draw);
    void maxD;
  })();

  /* ═════════ CH6: WOBBLE ═════════ */
  (function wobble() {
    const grid = $('#wobble-grid');
    const panels = [0, 1, 2].map((i) => {
      const d = document.createElement('div'); d.className = 'wb';
      d.innerHTML = `<canvas role="img" aria-label="Tree from basket ${i + 1}"></canvas><p class="wb-k">Basket ${String.fromCharCode(65 + i)}</p><p class="wb-q"></p>`;
      grid.appendChild(d);
      return { cv: $('canvas', d), q: $('.wb-q', d), tree: null, sample: null };
    });
    let seed = 1;
    function make() {
      panels.forEach((p, i) => {
        const r = L.rng(seed * 101 + i * 7919);
        p.sample = L.bootstrap(train, r);
        p.tree = L.buildTree(p.sample, { maxDepth: 5 });
        const t = p.tree;
        p.q.innerHTML = `First question: <b>${t.feature} &gt; ${cm(t.threshold)} cm?</b><br><span style="color:${C.faint}">${L.leaves(t).length} leaves · ${pct(L.accuracy(t, test))} on new mushrooms</span>`;
      });
      seed++;
      draw(true);
    }
    function draw(fade) {
      panels.forEach((p, i) => {
        const go = () => {
          const P = makePlot(p.cv, { bare: true });
          drawFrame(P); drawRegions(P, p.tree); drawSplits(P, p.tree);
          const counts = new Map();
          for (const d of p.sample) counts.set(d.id, (counts.get(d.id) || 0) + 1);
          const uniq = [...counts.keys()].map((id) => train[id]);
          drawPoints(P, uniq, { r: 2.6, scale: (d) => 0.8 + 0.35 * (counts.get(d.id) - 1) });
          p.cv.style.opacity = 1;
        };
        if (fade && !reduced) { p.cv.style.transition = 'opacity .35s'; p.cv.style.opacity = 0; setTimeout(go, 220 + i * 120); } else go();
      });
    }
    $('#wobble-go').addEventListener('click', make);
    onSeen(grid, make);
    redraws.push(() => draw(false));
  })();

  /* ═════════ CH7: FOREST ═════════ */
  (function forestLab() {
    const cv = $('#fo-canvas'), ch = $('#fo-chart'), s = $('#fo-slider'), grove = $('#fo-grove');
    s.min = 1; s.value = 1; syncFill(s);
    let trees = null, accs = null, hover = null, grid = null, gridK = 0;
    const icon = (fill) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 25'><rect x='9' y='17' width='2' height='8' fill='#6e4a2b'/><path d='M10 1 L18 12 H13 L18 19 H2 L7 12 H2Z' fill='${fill}'/></svg>`)}")`;
    const icons = { n: icon('#12382a'), e: icon('#4a7d36'), p: icon('#c0354d') };
    const cells = [];
    for (let i = 0; i < 100; i++) { const c = document.createElement('i'); c.style.backgroundImage = icons.n; grove.appendChild(c); cells.push(c); }
    $('#fo-single').textContent = pct(L.accuracy(full, test));
    function init() {
      trees = L.forest(train, 100, { seed: 4242 });
      accs = [0];
      for (let k = 1; k <= 100; k++) accs[k] = L.accuracy(trees, test, (m, a, b) => (L.forestVote(m, a, b, k) > 0.5 ? 1 : 0));
      draw();
    }
    function computeGrid(P, k) {
      const nx = Math.max(60, Math.round(P.iw / 3)), ny = Math.max(50, Math.round(P.ih / 3));
      const g = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const cap = D.x0 + ((i + 0.5) / nx) * (D.x1 - D.x0), st = D.y0 + ((j + 0.5) / ny) * (D.y1 - D.y0);
        g[j * nx + i] = L.forestVote(trees, cap, st, k);
      }
      return { g, nx, ny };
    }
    function draw() {
      if (!trees) return;
      const k = +s.value;
      $('#fo-n').textContent = k; $('#fo-out').textContent = k;
      $('#fo-trees').textContent = k === 1 ? 'tree' : 'trees';
      $('#fo-acc').textContent = pct(accs[k]);
      const P = makePlot(cv);
      drawFrame(P);
      if (!grid || gridK !== k || grid.w !== P.w) { grid = { ...computeGrid(P, k), w: P.w }; gridK = k; }
      const { ctx } = P, { g, nx, ny } = grid;
      if (!grid.img) {
        const off = document.createElement('canvas'); off.width = nx; off.height = ny;
        const octx = off.getContext('2d'), im = octx.createImageData(nx, ny);
        const bg = [255, 253, 247], be = [192, 53, 77], mo = [74, 125, 54], oc = [212, 145, 42];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const v = g[j * nx + i], a = Math.abs(v - 0.5) * 2;
          const [col, al] = v > 0.5 ? [be, 0.06 + 0.42 * a] : v < 0.5 ? [mo, 0.06 + 0.32 * a] : [oc, 0.15];
          const o = ((ny - 1 - j) * nx + i) * 4;
          for (let q = 0; q < 3; q++) im.data[o + q] = Math.round(bg[q] * (1 - al) + col[q] * al);
          im.data[o + 3] = 255;
        }
        octx.putImageData(im, 0, 0);
        grid.img = off;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(grid.img, P.pad.l, P.pad.t, P.iw, P.ih);
      drawAxes(P);
      drawPoints(P, test, { r: P.small ? 2 : 2.6, alpha: 0.75 });
      if (hover) {
        ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(P.sx(hover.cap), P.sy(hover.stem), 9, 0, 6.29); ctx.stroke(); ctx.restore();
      }
      // grove
      cells.forEach((c, i) => {
        c.classList.toggle('on', i < k);
        let img = icons.n;
        if (hover && i < k) img = L.predict(trees[i], hover.cap, hover.stem) ? icons.p : icons.e;
        c.style.backgroundImage = img;
      });
      if (hover) {
        const v = Math.round(L.forestVote(trees, hover.cap, hover.stem, k) * k);
        $('#fo-hint').innerHTML = `Cap ${cm(hover.cap)}, stem ${cm(hover.stem)}: <b style="color:${C.berry}">${v} poisonous</b> · <b style="color:${C.moss}">${k - v} edible</b> → the forest says <b>${v > k / 2 ? 'poisonous' : v === k / 2 ? 'a tie' : 'edible'}</b>.`;
      }
      chart(k);
    }
    function chart(k) {
      const { ctx, w, h } = sizeCanvas(ch);
      const pad = { l: 38, r: 10, t: 12, b: 26 };
      const X = (v) => pad.l + ((v - 1) / 99) * (w - pad.l - pad.r);
      const vmin = 0.74, vmax = 0.9, Y = (v) => pad.t + (1 - (v - vmin) / (vmax - vmin)) * (h - pad.t - pad.b);
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      for (const v of [0.75, 0.8, 0.85, 0.9]) {
        ctx.strokeStyle = 'rgba(27,36,30,.07)'; ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(w - pad.r, Y(v)); ctx.stroke();
        ctx.fillStyle = C.faint; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(v * 100) + '%', pad.l - 6, Y(v));
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (const t of [1, 25, 50, 75, 100]) ctx.fillText(t, X(t), h - pad.b + 6);
      const single = L.accuracy(full, test);
      ctx.strokeStyle = C.moss; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pad.l, Y(single)); ctx.lineTo(w - pad.r, Y(single)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.moss; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.font = '600 9px "IBM Plex Mono"';
      ctx.fillText('one deep tree', w - pad.r, Y(single) - 3);
      ctx.strokeStyle = C.berry; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 1; i <= k; i++) (i > 1 ? ctx.lineTo(X(i), Y(accs[i])) : ctx.moveTo(X(i), Y(accs[i])));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(192,53,77,.18)'; ctx.beginPath();
      for (let i = k; i <= 100; i++) (i > k ? ctx.lineTo(X(i), Y(accs[i])) : ctx.moveTo(X(i), Y(accs[i])));
      ctx.stroke();
      ctx.fillStyle = C.berry; ctx.beginPath(); ctx.arc(X(k), Y(accs[k]), 5, 0, 6.29); ctx.fill();
    }
    let pend = 0;
    s.addEventListener('input', () => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; draw(); }); });
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect(); const P = makePlot(cv);
      const px = e.clientX - r.left, py = e.clientY - r.top;
      if (!P.inside(px, py)) return;
      hover = { cap: P.ix(px), stem: P.iy(py) };
      draw();
    });
    cv.addEventListener('pointerleave', () => { hover = null; $('#fo-hint').textContent = 'Hover the map to see how the trees vote on a single mushroom.'; draw(); });
    onSeen(cv, init, '600px');
    redraws.push(() => { grid = null; draw(); });
  })();

  /* ═════════ CH7: ENSEMBLE DIAGRAM ═════════ */
  (function ensemble() {
    const svg = $('#ensemble-svg');
    const tri = (x, y, s, fill) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.5" y="22" width="3" height="10" fill="#6e4a2b"/><path d="M0 0 L14 16 H6 L14 26 H-14 L-6 16 H-14Z" fill="${fill}"/></g>`;
    const mono = 'font-family="IBM Plex Mono, monospace"';
    let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C.soft}"/></marker></defs>`;
    s += `<text x="215" y="24" text-anchor="middle" ${mono} font-size="12" font-weight="600" fill="${C.berry}" letter-spacing="2">RANDOM FOREST</text>`;
    s += `<text x="215" y="44" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="15" fill="${C.soft}">independent trees, then a vote</text>`;
    const votes = [1, 1, 0, 1, 1];
    votes.forEach((v, i) => {
      const x = 75 + i * 70;
      s += `<rect x="${x - 28}" y="66" width="56" height="18" rx="9" fill="${C.paper}" stroke="${C.line}"/><text x="${x}" y="79" text-anchor="middle" ${mono} font-size="9" fill="${C.soft}">basket ${i + 1}</text>`;
      s += tri(x, 98, 1.35, C.forest);
      s += `<path d="M${x} 150 C${x} 180 215 180 215 205" fill="none" stroke="${C.line}" stroke-width="1.5" marker-end="url(#ar)"/>`;
      s += `<circle cx="${x}" cy="160" r="9" fill="${v ? C.berry : C.moss}"/>`;
    });
    s += `<rect x="150" y="210" width="130" height="44" rx="10" fill="${C.forest}"/><text x="215" y="230" text-anchor="middle" ${mono} font-size="10" fill="#cfe0c3">MAJORITY VOTE</text><text x="215" y="246" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="#fff">poisonous · 4 of 5</text>`;
    s += `<line x1="450" y1="20" x2="450" y2="280" stroke="${C.line}" stroke-dasharray="3 5"/>`;
    s += `<text x="680" y="24" text-anchor="middle" ${mono} font-size="12" font-weight="600" fill="${C.ochre}" letter-spacing="2">GRADIENT BOOSTING</text>`;
    s += `<text x="680" y="44" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="15" fill="${C.soft}">small trees in a line, each fixing the last</text>`;
    [0, 1, 2, 3].forEach((i) => {
      const x = 520 + i * 108;
      s += tri(x, 86, 0.95 - i * 0.12, mix('#12382a', '#d4912a', i / 3));
      s += `<text x="${x}" y="134" text-anchor="middle" ${mono} font-size="9" fill="${C.soft}">tree ${i + 1}</text>`;
      const err = [9, 5, 3, 1.5][i];
      s += `<rect x="${x - 26}" y="146" width="52" height="8" rx="4" fill="${C.paper}" stroke="${C.line}"/><rect x="${x - 26}" y="146" width="${(err / 9) * 52}" height="8" rx="4" fill="${C.berry}" opacity=".75"/>`;
      if (i < 3) s += `<path d="M${x + 20} 108 H${x + 86}" stroke="${C.soft}" stroke-width="1.5" marker-end="url(#ar)"/><text x="${x + 54}" y="100" text-anchor="middle" ${mono} font-size="8.5" fill="${C.faint}">errors →</text>`;
    });
    s += `<text x="680" y="176" text-anchor="middle" ${mono} font-size="9" fill="${C.faint}">remaining error after each tree</text>`;
    s += `<rect x="560" y="210" width="240" height="44" rx="10" fill="${C.ochre}"/><text x="680" y="230" text-anchor="middle" ${mono} font-size="10" fill="#3d2a0b">ADD THEM UP</text><text x="680" y="246" text-anchor="middle" font-family="Fraunces, serif" font-size="14" fill="#1b241e">tree 1 + tree 2 + tree 3 + …</text>`;
    svg.innerHTML = s;
  })();
})();

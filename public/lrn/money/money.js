/* lrn — Slow Rich */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const C = { c1: '#1f8a5b', c2: '#e0a01a', c3: '#e2553a', c4: '#3b6fd8' };

  /* ───────── money formatting (Indian lakh / crore) ───────── */
  const inr = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
  const fmt = (v) => {
    const a = Math.abs(v), s = v < 0 ? '−' : '';
    if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(a >= 1e9 ? 0 : 2) + ' Cr';
    if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a >= 1e6 ? 1 : 2) + ' L';
    return s + inr(a);
  };
  const fmtShort = (v) => {
    const a = Math.abs(v);
    if (a >= 1e7) return '₹' + +(a / 1e7).toFixed(1) + 'Cr';
    if (a >= 1e5) return '₹' + +(a / 1e5).toFixed(1) + 'L';
    if (a >= 1e3) return '₹' + +(a / 1e3).toFixed(0) + 'k';
    return '₹' + Math.round(a);
  };
  const pct = (v, d = 0) => (+v).toFixed(d) + '%';
  const mRate = (R) => Math.pow(1 + R / 100, 1 / 12) - 1; // effective monthly from annual %

  /* ───────── tooltip ───────── */
  const tip = $('#tip');
  const showTip = (html, x, y) => {
    tip.innerHTML = html; tip.classList.add('show');
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y - h - 12;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (node, fn) => {
    node.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY));
    node.addEventListener('pointerleave', hideTip);
  };

  /* ───────── range inputs: fill + outputs ───────── */
  const fill = (i) => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%');
  $$('input[type=range]').forEach((i) => { fill(i); i.addEventListener('input', () => fill(i)); });
  const val = (id) => +$('#' + id).value;
  const out = (id, text) => { const o = $('#' + id + '-o'); if (o) o.textContent = text; };
  const onInputs = (ids, fn) => { ids.forEach((id) => $('#' + id).addEventListener('input', fn)); fn(); };
  const seg = (id, fn) => {
    const root = $('#' + id);
    $$('button', root).forEach((b) => b.addEventListener('click', () => { $$('button', root).forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.v); }));
    return () => $('button.on', root).dataset.v;
  };
  const countTo = (node, to, f = fmt, dur = 500) => {
    const from = +node.dataset.v || 0; node.dataset.v = to;
    if (RM) { node.textContent = f(to); return; }
    const t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };

  /* ───────── progress, rail, reveal ───────── */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  chapters.forEach((c) => { const a = el('a'); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const railLinks = $$('a', rail);
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', h.scrollTop > innerHeight * .8);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    railLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
    rail.classList.toggle('on-light', cur >= 0 && chapters[cur].classList.contains('light'));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const io = 'IntersectionObserver' in window;
  const reveal = (node, cb) => {
    if (RM || !io) { node.classList.add('in'); cb && cb(); return; }
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { node.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    o.observe(node);
  };
  $$('.rv').forEach((n) => reveal(n));

  /* ───────── generic line/area chart with crosshair ───────── */
  function lineChart(host, opt) {
    const draw = (animate) => {
      host.innerHTML = '';
      const W = host.clientWidth, H = host.clientHeight; if (!W) return;
      const nLab = opt.series.filter((s) => s.label !== false).length;
      const m = { l: 58, r: nLab ? (W < 500 ? 70 : 104) : 14, t: 14, b: 30 };
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': opt.aria || 'Chart' });
      const xs = opt.series[0].pts.map((p) => p.x);
      const x0 = opt.xMin ?? xs[0], x1 = opt.xMax ?? xs[xs.length - 1];
      let yMax = opt.yMax ?? Math.max(...opt.series.flatMap((s) => s.pts.map((p) => p.y)));
      let yMin = opt.yMin ?? 0;
      const nice = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
      const step = nice((yMax - yMin) / 4); yMax = Math.ceil(yMax / step) * step;
      const X = (x) => m.l + (x - x0) / (x1 - x0 || 1) * (W - m.l - m.r);
      const Y = (y) => H - m.b - (y - yMin) / (yMax - yMin || 1) * (H - m.t - m.b);
      const ax = sv('g', { class: 'ax' });
      for (let v = yMin; v <= yMax + 1e-9; v += step) {
        ax.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: v === yMin ? 'base' : '' }));
        const t = sv('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = (opt.yFmt || fmtShort)(v); ax.append(t);
      }
      const xt = opt.xTicks || [x0, x1];
      xt.forEach((v) => { const t = sv('text', { x: X(v), y: H - 8, 'text-anchor': 'middle' }); t.textContent = (opt.xFmt || String)(v); ax.append(t); });
      svg.append(ax);
      const labels = [];
      opt.series.forEach((s) => {
        const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
        if (s.area) {
          const base = s.areaBase ? s.areaBase : null;
          let ad = d + ' L' + X(s.pts[s.pts.length - 1].x) + ' ' + (base ? '' : Y(yMin));
          if (base) ad = d + ' ' + base.slice().reverse().map((p) => 'L' + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ') + ' Z';
          else ad += ' L' + X(s.pts[0].x) + ' ' + Y(yMin) + ' Z';
          const a = sv('path', { d: ad, fill: s.color, opacity: s.areaOpacity ?? .16 });
          if (animate && !RM) { a.style.opacity = 0; a.style.transition = 'opacity 1s .6s'; requestAnimationFrame(() => (a.style.opacity = s.areaOpacity ?? .16)); }
          svg.append(a);
        }
        const p = sv('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || '' });
        svg.append(p);
        if (animate && !RM && !s.dash) { const len = p.getTotalLength(); p.style.setProperty('--len', len); p.classList.add('draw'); }
        const last = s.pts[s.pts.length - 1];
        if (s.label !== false) labels.push({ s, y: Y(last.y), x: X(last.x) });
      });
      labels.sort((a, b) => a.y - b.y);
      for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
      labels.forEach(({ s, y, x }) => {
        svg.append(sv('circle', { cx: x, cy: Y(s.pts[s.pts.length - 1].y), r: 4, fill: s.color, stroke: '#fffdf7', 'stroke-width': 2 }));
        const t = sv('text', { x: x + 9, y: y + 4, class: 'dl' }); t.textContent = s.name; svg.append(t);
      });
      // crosshair
      const xh = sv('line', { class: 'xh', y1: m.t, y2: H - m.b }); svg.append(xh);
      const dots = opt.series.map((s) => { const c = sv('circle', { r: 4.5, fill: s.color, stroke: '#fffdf7', 'stroke-width': 2, opacity: 0 }); svg.append(c); return c; });
      const hit = sv('rect', { x: m.l, y: m.t, width: Math.max(1, W - m.l - m.r), height: Math.max(1, H - m.t - m.b), class: 'hit' }); svg.append(hit);
      const move = (e) => {
        const r = svg.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width);
        let bi = 0, bd = 1e9; xs.forEach((x, i) => { const dd = Math.abs(X(x) - mx); if (dd < bd) { bd = dd; bi = i; } });
        const px = X(xs[bi]); xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.opacity = .5;
        dots.forEach((c, k) => { const p = opt.series[k].pts[bi]; if (!p) return; c.setAttribute('cx', X(p.x)); c.setAttribute('cy', Y(p.y)); c.setAttribute('opacity', 1); });
        const rows = opt.series.map((s) => s.pts[bi] ? `<div><i style="background:${s.color}"></i>${s.name}: <b>${(opt.tipFmt || fmt)(s.pts[bi].y)}</b></div>` : '').join('');
        showTip(`<div style="margin-bottom:.25rem;opacity:.7">${(opt.xTip || opt.xFmt || String)(xs[bi])}</div>${rows}${opt.tipExtra ? opt.tipExtra(bi) : ''}`, e.clientX, e.clientY);
      };
      hit.addEventListener('pointermove', move);
      hit.addEventListener('pointerleave', () => { hideTip(); xh.style.opacity = 0; dots.forEach((c) => c.setAttribute('opacity', 0)); });
      host.append(svg);
    };
    return draw;
  }
  const charts = [];
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => charts.forEach((f) => f(false)), 150); });

  /* ───────── HERO curve ───────── */
  (() => {
    const svg = $('#hero-svg'); if (!svg) return;
    const W = 600, H = 360, rm = mRate(11);
    const pts = []; let v = 0, inv = 0;
    for (let mo = 0; mo <= 420; mo++) { if (mo % 6 === 0) pts.push({ m: mo, v, inv }); v = (v + 10000) * (1 + rm); inv += 10000; }
    const max = pts[pts.length - 1].v;
    const X = (m) => 20 + m / 420 * (W - 40), Y = (y) => H - 30 - y / max * (H - 140);
    const defs = sv('defs');
    defs.innerHTML = '<linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ddc97" stop-opacity=".45"/><stop offset="1" stop-color="#3ddc97" stop-opacity="0"/></linearGradient><linearGradient id="hl" x1="0" x2="1"><stop offset="0" stop-color="#3ddc97"/><stop offset="1" stop-color="#f2b632"/></linearGradient>';
    svg.append(defs);
    for (let a = 25; a <= 60; a += 5) { const x = X((a - 25) * 12); svg.append(sv('line', { x1: x, x2: x, y1: 100, y2: H - 30, stroke: 'rgba(255,255,255,.06)' })); const t = sv('text', { x, y: H - 10, 'text-anchor': 'middle', fill: 'rgba(238,242,232,.4)', 'font-family': 'JetBrains Mono', 'font-size': 11 }); t.textContent = a; svg.append(t); }
    const line = (k) => pts.slice(0, k + 1).map((p, i) => (i ? 'L' : 'M') + X(p.m).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ');
    const invD = pts.map((p, i) => (i ? 'L' : 'M') + X(p.m).toFixed(1) + ' ' + Y(p.inv).toFixed(1)).join(' ');
    const invP = sv('path', { d: invD, fill: 'none', stroke: 'rgba(238,242,232,.35)', 'stroke-width': 1.5, 'stroke-dasharray': '4 5' }); svg.append(invP);
    const area = sv('path', { fill: 'url(#hg)' }), path = sv('path', { fill: 'none', stroke: 'url(#hl)', 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    const dot = sv('circle', { r: 7, fill: '#f2b632', stroke: '#0b120f', 'stroke-width': 3 });
    const halo = sv('circle', { r: 16, fill: 'rgba(242,182,50,.25)' });
    const invL = sv('text', { x: X(420) - 4, y: Y(pts[pts.length - 1].inv) - 8, 'text-anchor': 'end', fill: 'rgba(238,242,232,.5)', 'font-family': 'Space Grotesk', 'font-size': 12 }); invL.textContent = 'what you put in: ₹42 L';
    svg.append(area, path, halo, dot, invL);
    const vEl = $('#hero-v'), aEl = $('#hero-age');
    const render = (k) => {
      const p = pts[k]; path.setAttribute('d', line(k));
      area.setAttribute('d', line(k) + ` L${X(p.m)} ${H - 30} L${X(0)} ${H - 30} Z`);
      dot.setAttribute('cx', X(p.m)); dot.setAttribute('cy', Y(p.v)); halo.setAttribute('cx', X(p.m)); halo.setAttribute('cy', Y(p.v));
      vEl.textContent = fmt(p.v); aEl.textContent = 'age ' + Math.floor(25 + p.m / 12);
    };
    if (RM) { render(pts.length - 1); return; }
    render(0);
    setTimeout(() => {
      const t0 = performance.now(), dur = 4200;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; render(Math.round(e * (pts.length - 1))); if (k < 1) requestAnimationFrame(step); else halo.animate([{ r: 12, opacity: 1 }, { r: 26, opacity: 0 }], { duration: 1600, iterations: Infinity }); };
      requestAnimationFrame(step);
    }, 900);
    $('h1 .w2').classList.add('shine');
  })();

  /* ───────── 1. salary decoder ───────── */
  const newRegimeTax = (t) => {
    if (t <= 1200000) return 0;
    const B = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
    let tax = 0, lo = 0;
    for (const [hi, r] of B) { if (t > lo) tax += (Math.min(t, hi) - lo) * r; lo = hi; }
    tax = Math.min(tax, t - 1200000); // marginal relief just above the rebate limit
    return tax * 1.04;
  };
  (() => {
    if (!$('#salary')) return;
    const pfMode = seg('sal-pf', () => run());
    const bars = $('#sal-bars'), tb = $('#sal-table tbody');
    const segs = [['inhand', 'In-hand', C.c1], ['other', 'Gratuity + prof. tax', C.c2], ['tax', 'Income tax', C.c3], ['pf', 'Provident fund (both)', C.c4]];
    segs.forEach(([k, n, c]) => { const d = el('div', 'wf'); d.dataset.k = k; d.style.background = c; d.textContent = n; bars.append(d); });
    let last = {};
    segs.forEach(([k, n]) => bindTip($(`.wf[data-k="${k}"]`, bars), () => `${n}: <b>${fmt(last[k] || 0)}</b> a year (${pct((last[k] || 0) / last.ctc * 100, 1)} of CTC)`));
    const run = () => {
      const ctc = val('sal-ctc'), bp = val('sal-basic');
      out('sal-ctc', fmt(ctc)); out('sal-basic', bp + '%');
      const basic = ctc * bp / 100, pfBase = pfMode() === 'cap' ? Math.min(basic, 180000) : basic;
      const erPF = .12 * pfBase, grat = .0481 * basic, gross = ctc - erPF - grat;
      const eePF = .12 * pfBase, pt = 2500, taxable = Math.max(0, gross - 75000), tax = newRegimeTax(taxable);
      const inhand = gross - eePF - pt - tax;
      last = { ctc, inhand, other: grat + pt, tax, pf: erPF + eePF };
      countTo($('#sal-month'), inhand / 12, inr);
      $('#sal-note').innerHTML = tax > 0 ? `Income tax ≈ <b>${inr(tax / 12)}</b>/month. Your EPF grows by <b>${inr((erPF + eePF) / 12)}</b>/month.` : `<b>Zero income tax</b> under the new regime. Your EPF grows by <b>${inr((erPF + eePF) / 12)}</b>/month.`;
      segs.forEach(([k, nm]) => { const d = $(`.wf[data-k="${k}"]`, bars); d.style.flex = `${Math.max(.004, last[k] / ctc)} 1 0`; d.textContent = last[k] / ctc > .14 ? nm : ""; });
      const rows = [
        ['CTC (offer letter)', ctc, '', 1],
        ['− Employer’s PF (12% of basic)', -erPF, C.c4], ['− Gratuity provision (4.81% of basic)', -grat, C.c2],
        ['= Gross salary', gross, '', 1],
        ['− Your PF (12% of basic)', -eePF, C.c4], ['− Professional tax', -pt, C.c2], ['− Income tax incl. cess (new regime)', -tax, C.c3],
        ['= In-hand per year', inhand, C.c1, 1],
      ];
      tb.innerHTML = rows.map(([n, v, c, t]) => `<tr class="${t ? 'tot' : ''}"><td>${c ? `<i style="background:${c}"></i>` : ''}${n}</td><td>${v < 0 ? '−' : ''}${inr(Math.abs(v))}</td></tr>`).join('') + `<tr><td class="muted" colspan="2">Taxable income after ₹75,000 standard deduction: ${inr(taxable)}. HRA and other allowances are inside gross salary and don’t change this under the new regime.</td></tr>`;
    };
    onInputs(['sal-ctc', 'sal-basic'], run);
  })();

  /* slabs */
  (() => {
    const row = $('#slab-row'); if (!row) return;
    const S = [['0–4L', 0], ['4–8L', 5], ['8–12L', 10], ['12–16L', 15], ['16–20L', 20], ['20–24L', 25], ['24L+', 30]];
    S.forEach(([r, p], i) => {
      const s = el('div', 'slab', `<span class="slab-pc">${p}%</span><div class="slab-bar" style="height:${Math.max(2, p / 30 * 150)}px;transition-delay:${i * .07}s;opacity:${.35 + p / 30 * .65}"></div><span class="slab-r">${r}</span>`);
      bindTip(s, () => p === 0 ? `Income from ${r.replace('L', ' lakh')}: <b>no tax</b>` : `Each rupee of taxable income in the ${r} band is taxed at <b>${p}%</b> (plus 4% cess)${i < 3 ? '. Fully rebated if total taxable income ≤ ₹12 L' : ''}`);
      row.append(s);
    });
    reveal($('#slabs'));
  })();

  /* ───────── 2. budget donut ───────── */
  (() => {
    const svg = $('#bud-donut'); if (!svg) return;
    const R = 80, CIRC = 2 * Math.PI * R;
    const cats = [['Needs', C.c4], ['Wants', C.c2], ['Savings', C.c1]];
    const rings = cats.map(([n, c]) => { const ci = sv('circle', { cx: 100, cy: 100, r: R, stroke: c }); svg.append(ci); return ci; });
    let vals = [];
    rings.forEach((ci, i) => bindTip(ci, () => `${cats[i][0]}: <b>${inr(vals[i] || 0)}</b>/month`));
    const leg = $('#bud-legend');
    const run = () => {
      const inc = val('bud-inc'); let n = val('bud-n'), w = val('bud-w');
      if (n + w > 100) { w = 100 - n; $('#bud-w').value = w; fill($('#bud-w')); }
      const s = 100 - n - w;
      out('bud-inc', inr(inc)); out('bud-n', n + '%'); out('bud-w', w + '%');
      vals = [inc * n / 100, inc * w / 100, inc * s / 100];
      let off = 0; const gap = 2.5;
      [n, w, s].forEach((p, i) => { const len = Math.max(0, p / 100 * CIRC - (p > 0 ? gap : 0)); rings[i].setAttribute('stroke-dasharray', `${len} ${CIRC}`); rings[i].setAttribute('stroke-dashoffset', -off); off += p / 100 * CIRC; });
      countTo($('#bud-save'), vals[2], inr, 300);
      leg.innerHTML = cats.map(([nm, c], i) => `<span><i style="background:${c}"></i>${nm} <b>${inr(vals[i])}</b></span>`).join('');
      const yr = vals[2] * 12;
      const rm = mRate(11); let fv = 0; for (let k = 0; k < 120; k++) fv = (fv + vals[2]) * (1 + rm);
      $('#bud-verdict').innerHTML = s < 10 ? `Saving <b>${s}%</b> leaves almost no room for emergencies or the future. Look hard at the biggest “want” and at rent.` : `That’s <b>${fmt(yr)}</b> a year. Invested at 11% for ten years it could grow to about <b>${fmt(fv)}</b>.${s >= 30 ? ' A savings rate this high in your twenties is a genuine superpower.' : ''}`;
    };
    onInputs(['bud-inc', 'bud-n', 'bud-w'], run);
  })();

  /* ───────── 3. emergency fund ───────── */
  (() => {
    const tr = $('#ef-track'); if (!tr) return;
    let shown = false;
    const run = () => {
      const e = val('ef-exp'), m = val('ef-m'), s = val('ef-s'), target = e * m, months = target / s;
      out('ef-exp', inr(e)); out('ef-m', m + ' months'); out('ef-s', inr(s));
      countTo($('#ef-target'), target, fmt, 300);
      const full = Math.floor(months), part = months - full;
      $('#ef-time').innerHTML = `At ${inr(s)} a month you’ll have it in <b>${Math.ceil(months)} months</b>${months > 24 ? ' — try a bigger monthly amount or a bonus top-up.' : '.'} Each square below is one month of saving.`;
      const n = Math.min(60, Math.ceil(months)); tr.innerHTML = '';
      for (let i = 0; i < n; i++) { const q = el('i'); if (i < full) q.className = 'on'; else if (part > 0) { q.className = 'part'; q.style.setProperty('--f', (part * 100) + '%'); } if (shown && !RM) { q.style.transitionDelay = (i * 0.012) + 's'; } tr.append(q); }
    };
    onInputs(['ef-exp', 'ef-m', 'ef-s'], run);
    reveal($('#efund'), () => { shown = true; });
  })();

  /* ───────── 4. credit card trap ───────── */
  (() => {
    const host = $('#cc-chart'); if (!host) return;
    let draw;
    const run = (anim) => {
      const B = val('cc-bal'), r = val('cc-r') / 100, p = val('cc-p');
      out('cc-bal', inr(B)); out('cc-r', val('cc-r').toFixed(2) + '% (' + pct(val('cc-r') * 12) + '/yr)'); out('cc-p', p >= 100 ? 'Full balance' : p + '% of balance');
      let bal = B, mo = 0, int = 0; const ptsB = [{ x: 0, y: B }], ptsI = [{ x: 0, y: 0 }];
      if (p >= 100) { mo = 1; ptsB.push({ x: 1, y: 0 }); ptsI.push({ x: 1, y: 0 }); }
      else while (bal > 0.5 && mo < 600) {
        const i = bal * r; bal += i; int += i;
        const pay = Math.min(bal, Math.max(200, bal * p / 100)); bal -= pay; mo++;
        ptsB.push({ x: mo, y: bal }); ptsI.push({ x: mo, y: int });
      }
      const y = Math.floor(mo / 12), m = mo % 12;
      $('#cc-time').textContent = p >= 100 ? '1 month' : mo >= 600 ? '50+ years' : (y ? y + (y === 1 ? ' yr ' : ' yrs ') : '') + (m ? m + ' mo' : '');
      $('#cc-int').innerHTML = p >= 100 ? 'Pay the full statement and you pay <b>₹0</b> interest. This is the only way to use a card.' : `You pay <b>${inr(int)}</b> in interest, <b>${pct(int / B * 100)}</b> of what you originally spent.`;
      const yrs = mo / 12, tick = yrs <= 2 ? 6 : yrs <= 6 ? 12 : yrs <= 15 ? 36 : 60;
      const xt = []; for (let t = 0; t <= Math.max(mo, 1); t += tick) xt.push(t);
      draw = lineChart(host, { aria: 'Card balance and interest paid over time', series: [{ name: 'Interest paid', color: C.c2, pts: ptsI }, { name: 'Balance left', color: C.c3, pts: ptsB, area: true }], xTicks: xt, xMax: Math.max(mo, 1), xFmt: (v) => v < 12 ? v + ' mo' : (v / 12).toFixed(v % 12 ? 1 : 0) + ' yr', xTip: (v) => 'Month ' + v });
      draw(anim);
    };
    ['cc-bal', 'cc-r', 'cc-p'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    run(false); charts.push((a) => draw && draw(a));
    reveal(host, () => run(true));
  })();

  /* ───────── 5. inflation ───────── */
  (() => {
    const host = $('#in-chart'); if (!host) return;
    let draw;
    const run = (anim) => {
      const i = val('in-r'), y = val('in-y'), f = Math.pow(1 + i / 100, y);
      out('in-r', i + '%'); out('in-y', y + (y === 1 ? ' year' : ' years'));
      $('#in-buy').textContent = inr(1e5 / f); $('#in-life').textContent = inr(40000 * f); $('#in-thali').textContent = inr(200 * f);
      const mk = (R) => { const a = []; for (let t = 0; t <= 35; t++) a.push({ x: t, y: 1e5 * Math.pow((1 + R / 100) / (1 + i / 100), t) }); return a; };
      draw = lineChart(host, { aria: 'Real value of ₹1 lakh over time in different places', yFmt: fmtShort, series: [
        { name: 'Equity at 11%', color: C.c1, pts: mk(11) }, { name: 'FD at 7%*', color: C.c2, pts: mk(7) }, { name: 'Savings at 3%', color: C.c3, pts: mk(3) }, { name: 'Cash, 0%', color: C.c4, pts: mk(0) }],
        xTicks: [0, 5, 10, 15, 20, 25, 30, 35], xFmt: (v) => '+' + v + 'y', xTip: (v) => `After ${v} years, in today’s rupees`, tipExtra: () => '<div style="opacity:.6;margin-top:.2rem">*before tax</div>' });
      draw(anim);
    };
    ['in-r', 'in-y'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    run(false); charts.push((a) => draw && draw(a));
    reveal(host, () => run(true));
  })();

  /* ───────── 6a. the race ───────── */
  (() => {
    const host = $('#race-chart'); if (!host) return;
    let draw;
    const run = (anim) => {
      const R = val('race-r'), stop = val('race-s'), rm = mRate(R);
      out('race-r', R + '%'); out('race-s', stop);
      const a = [], b = []; let va = 0, vb = 0, ia = 0, ib = 0;
      for (let mo = 0; mo <= 420; mo++) {
        const age = 25 + mo / 12;
        if (mo % 12 === 0) { a.push({ x: age, y: va }); b.push({ x: age, y: vb }); }
        if (mo === 420) break;
        if (age < stop) { va += 10000; ia += 10000; } va *= 1 + rm;
        if (age >= 35) { vb += 10000; ib += 10000; } vb *= 1 + rm;
      }
      countTo($('#race-a'), va); countTo($('#race-b'), vb);
      $('#race-a-in').textContent = `₹10k/month, 25 → ${stop} · put in ${fmt(ia)}`;
      $('#race-b-in').textContent = `₹10k/month, 35 → 60 · put in ${fmt(ib)}`;
      $('.racer.r1').classList.toggle('win', va > vb); $('.racer.r2').classList.toggle('win', vb > va);
      draw = lineChart(host, { aria: 'Ishaan versus Dev portfolio value by age', series: [{ name: 'Ishaan', color: C.c1, pts: a, area: true, areaOpacity: .1 }, { name: 'Dev', color: C.c2, pts: b }], xTicks: [25, 30, 35, 40, 45, 50, 55, 60], xTip: (v) => 'Age ' + v });
      draw(anim);
    };
    ['race-r', 'race-s'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    $('#race-play').addEventListener('click', () => run(true));
    run(false); charts.push((a) => draw && draw(a));
    reveal(host, () => run(true));
  })();

  /* ───────── 6b. step-up SIP ───────── */
  const sipFV = (m, up, R, years) => { const rm = mRate(R); let v = 0, inv = 0, s = m; const pts = [{ x: 0, v: 0, inv: 0 }]; for (let y = 0; y < years; y++) { for (let k = 0; k < 12; k++) { v = (v + s) * (1 + rm); inv += s; } pts.push({ x: y + 1, v, inv }); s *= 1 + up / 100; } return { v, inv, pts }; };
  (() => {
    const host = $('#sip-chart'); if (!host) return;
    let draw;
    const run = (anim) => {
      const m = val('sip-m'), u = val('sip-u'), R = val('sip-r'), age = val('sip-y'), yrs = age - 25;
      out('sip-m', inr(m)); out('sip-u', u + '%'); out('sip-r', R + '%'); out('sip-y', age);
      const { v, inv, pts } = sipFV(m, u, R, yrs);
      countTo($('#sip-total'), v);
      const last = m * Math.pow(1 + u / 100, yrs - 1);
      $('#sip-note').innerHTML = `You put in <b>${fmt(inv)}</b>; growth adds <b>${fmt(v - inv)}</b> (${pct((v - inv) / v * 100)} of the total). In today’s rupees (6% inflation) ≈ <b>${fmt(v / Math.pow(1.06, yrs))}</b>.${u ? ` Your final SIP would be ${inr(last)}/month.` : ''}`;
      const total = pts.map((p) => ({ x: 25 + p.x, y: p.v })), invested = pts.map((p) => ({ x: 25 + p.x, y: p.inv }));
      const xt = []; for (let a = 25; a <= age; a += yrs > 20 ? 5 : yrs > 8 ? 2 : 1) xt.push(a);
      draw = lineChart(host, { aria: 'SIP value versus money invested', series: [{ name: 'Total value', color: C.c1, pts: total, area: true, areaBase: invested, areaOpacity: .22 }, { name: 'Money put in', color: C.c2, pts: invested, area: true, areaOpacity: .28 }], xTicks: xt, xTip: (v) => 'Age ' + v, tipExtra: (i) => `<div>Growth: <b>${fmt(total[i].y - invested[i].y)}</b></div>` });
      draw(anim);
    };
    ['sip-m', 'sip-u', 'sip-r', 'sip-y'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    run(false); charts.push((a) => draw && draw(a));
    reveal(host, () => run(true));
  })();

  /* ───────── 7a. instruments ───────── */
  (() => {
    const root = $('#instr'); if (!root) return;
    const I = [
      ['Bank', 'Savings account', 1, 'low', '~2.5–3.5% a year', 'Where your salary lands. Instant access, insured up to ₹5 lakh per bank by DICGC.', [['Use for', 'Monthly spending, a small buffer'], ['Tax', 'Interest taxed at your slab'], ['Watch out', 'Loses to inflation; don’t park long-term money here']], 'Use for spending money only', 'meh'],
      ['Bank', 'Fixed deposit (FD)', 1, 'low', '~6–7.5% a year', 'Lend the bank money for a fixed period at a fixed rate. Predictable and simple.', [['Use for', 'Goals 1–3 years away, part of the emergency fund (sweep-in FDs)'], ['Tax', 'Interest taxed at your slab every year'], ['Watch out', 'After tax and inflation, real returns are thin']], 'Good for short-term goals', ''],
      ['Debt fund', 'Liquid fund', 1, 'low', '~5.5–7% a year', 'A mutual fund that lends money for days to weeks to governments and companies. Withdraw in a day.', [['Use for', 'Emergency fund, money parked for months'], ['Tax', 'Gains taxed at your slab'], ['Watch out', 'Not guaranteed, but very low volatility']], 'Great home for your emergency fund', ''],
      ['Govt', 'EPF / VPF', 1, 'low', '8.25% (2025–26)', 'Your provident fund, built from your and your employer’s contributions. VPF lets you add more voluntarily.', [['Use for', 'The stable, “debt” part of your retirement money'], ['Tax', 'Interest tax-free on your contributions up to ₹2.5 lakh a year'], ['Watch out', 'Don’t withdraw when switching jobs; transfer via UAN']], 'Keep it, never break it', ''],
      ['Govt', 'PPF', 1, 'low', '7.1% (Oct–Dec 2026)', 'Public Provident Fund: a 15-year government-backed account, up to ₹1.5 lakh a year. Fully tax-free.', [['Use for', 'Long-term safe savings, especially if you prefer old regime 80C'], ['Tax', 'EEE: contribution (old regime), interest and maturity all tax-free'], ['Watch out', 'Locked for 15 years, partial withdrawals only from year 7']], 'Solid, if you’re okay with the lock-in', ''],
      ['Govt', 'NPS', 3, 'mid', 'Market-linked', 'National Pension System: low-cost retirement account mixing equity and debt, locked until 60.', [['Use for', 'Retirement, especially via employer contribution'], ['Tax', 'Employer’s contribution up to 14% of basic deductible in new regime'], ['Watch out', 'Part of the corpus must buy an annuity at 60; very illiquid']], 'Take it if your employer contributes', ''],
      ['Equity', 'Nifty 50 index fund', 4, 'high', '~11–12% historically', 'Owns India’s 50 largest companies in proportion to size. Tiny fees, no stock-picking.', [['Use for', 'The core of long-term (7+ year) investing'], ['Tax', 'LTCG 12.5% above ₹1.25 lakh/yr after 1 year; STCG 20%'], ['Watch out', 'Can fall 30–50% in a crash. Choose direct plan, low expense ratio']], 'The core of your portfolio', ''],
      ['Equity', 'Flexi-cap / mid & small cap', 4, 'high', 'Higher, bumpier', 'Funds that also own mid-sized and smaller companies. More growth potential, more volatility.', [['Use for', 'A satellite to the index core, 10+ year horizon'], ['Tax', 'Same as equity'], ['Watch out', 'Small caps can halve and stay down for years; don’t chase last year’s winner']], 'Optional, in moderation', 'meh'],
      ['Gold', 'Gold ETF / gold fund', 3, 'mid', 'Volatile, long-run ~ inflation+', 'Digital gold without lockers or making charges. Often rises when everything else is scared.', [['Use for', 'A small diversifier, 5–10% of the portfolio'], ['Tax', 'Taxed under specified rules for gold funds; check current treatment'], ['Watch out', 'Jewellery is consumption, not investment']], 'A little, as insurance', ''],
      ['Equity', 'Direct stocks', 5, 'high', 'Anything', 'Picking individual companies yourself. Exciting, educational, and hard to do well.', [['Use for', 'Learning, with a small slice you can afford to get wrong'], ['Tax', 'Same as equity'], ['Watch out', 'Most stock-pickers underperform the index; tips are not research']], 'Only with fun money', 'meh'],
      ['Speculation', 'Crypto', 5, 'high', 'Anything, including zero', 'Digital assets with no cash flows. Prices move on sentiment; regulation is still evolving in India.', [['Use for', 'Only money you can lose entirely'], ['Tax', 'Flat 30% on gains + 1% TDS; losses can’t be set off'], ['Watch out', 'Scams, exchange failures, 80% drawdowns']], 'Skip, or keep it tiny', 'bad'],
      ['Speculation', 'F&O trading', 5, 'high', '~9 in 10 lose (SEBI)', 'Futures and options: leveraged bets on short-term price moves.', [['Use for', 'Professionals, hedging'], ['Tax', 'Business income at slab rate'], ['Watch out', 'SEBI found about nine in ten individual traders lost money']], 'Avoid', 'bad'],
      ['Insurance', 'Endowment / money-back', 1, 'low', 'Often ~4–6% a year', 'Insurance mixed with investment, sold as safe and tax-saving.', [['Use for', 'Almost nothing a term plan + index fund can’t do better'], ['Tax', 'Maturity rules vary'], ['Watch out', 'Low cover, low returns, heavy surrender penalties']], 'Avoid', 'bad'],
    ];
    I.forEach(([tag, name, risk, rc, ret, what, more, verdict, vc]) => {
      const b = el('button', 'in-card rv');
      b.innerHTML = `<div class="in-top"><span class="in-tag">${tag}</span><span class="in-risk ${rc}" title="Risk ${risk} of 5">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= risk ? 'on' : ''}"></i>`).join('')}</span></div><h3>${name}</h3><p class="in-ret">${ret}</p><p class="in-what">${what}</p><p class="in-verdict ${vc}">${verdict}</p><div class="in-more"><div><dl>${more.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div></div><span class="in-tog">+ Details</span>`;
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => { const o = b.classList.toggle('open'); b.setAttribute('aria-expanded', o); $('.in-tog', b).textContent = o ? '− Less' : '+ Details'; });
      root.append(b); reveal(b);
    });
  })();

  /* ───────── 7b. risk map ───────── */
  (() => {
    const host = $('#risk-chart'); if (!host) return;
    const P = [
      ['Savings a/c', 0, 2.5, 3.5], ['FD', 4, 6, 7.5], ['PPF', 8, 7.1, 7.1], ['EPF', 12, 8.25, 8.25], ['Liquid fund', 16, 5.5, 7], ['Gold', 23, 6, 12], ['Nifty 50', 30, 10, 13], ['Mid/small cap', 38, 11, 16], ['Single stocks', 48, -5, 25], ['Crypto', 62, -20, 40],
    ];
    const draw = () => {
      host.innerHTML = '';
      const W = host.clientWidth, H = host.clientHeight; if (!W) return;
      const m = { l: 44, r: 16, t: 14, b: 34 }, yMin = -20, yMax = 45;
      const X = (v) => m.l + 20 + v / 64 * (W - m.l - m.r - 40), Y = (v) => H - m.b - (v - yMin) / (yMax - yMin) * (H - m.t - m.b);
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Risk versus return map' });
      const ax = sv('g', { class: 'ax' });
      [-20, -10, 0, 10, 20, 30, 40].forEach((v) => { ax.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: v === 0 ? 'base' : '' })); const t = sv('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = v + '%'; ax.append(t); });
      [['Calm', 6], ['Bumpy', 34], ['Wild', 60]].forEach(([s, v]) => { const t = sv('text', { x: X(v), y: H - 10, 'text-anchor': 'middle' }); t.textContent = s; ax.append(t); });
      const inf = sv('line', { x1: m.l, x2: W - m.r, y1: Y(6), y2: Y(6), stroke: C.c3, 'stroke-dasharray': '5 4', 'stroke-width': 1.5 });
      const it = sv('text', { x: W - m.r - 4, y: Y(6) - 6, 'text-anchor': 'end', class: 'dl' }); it.textContent = 'inflation ~6%';
      svg.append(ax, inf, it);
      P.forEach(([n, vol, lo, hi], i) => {
        const g = sv('g', { style: 'cursor:default' });
        const x = X(vol), w = Math.max(10, W / 60);
        const r = sv('rect', { x: x - w / 2, y: Y(hi), width: w, height: Math.max(4, Y(lo) - Y(hi)), rx: 4, fill: C.c1, opacity: .85 });
        if (!RM) { r.style.transformOrigin = `${x}px ${Y((lo + hi) / 2)}px`; r.style.transform = 'scaleY(0)'; r.style.transition = `transform .8s cubic-bezier(.34,1.56,.64,1) ${i * .06}s`; requestAnimationFrame(() => requestAnimationFrame(() => (r.style.transform = 'scaleY(1)'))); }
        const t = sv('text', { x, y: Y(hi) - 8 - (i % 2) * 14, class: 'dl', 'text-anchor': 'middle', 'font-size': W < 520 ? 10 : 12 }); t.textContent = n;
        g.append(sv('rect', { x: x - 16, y: Y(hi) - 30, width: 32, height: Y(lo) - Y(hi) + 38, fill: 'transparent' }), r, t);
        bindTip(g, () => `<b style="font-family:var(--sans)">${n}</b><br>Typical long-run return: ${lo === hi ? lo + '%' : lo + '% to ' + hi + '%'} a year<br>Swing: ${vol < 5 ? 'very low' : vol < 20 ? 'moderate' : vol < 35 ? 'high' : 'extreme'}`);
        svg.append(g);
      });
      host.append(svg);
    };
    charts.push(draw);
    reveal(host, draw);
  })();

  /* ───────── 7c. fees ───────── */
  (() => {
    const root = $('#fee-bars'); if (!root) return;
    root.innerHTML = `<div class="fb"><span>Direct plan</span><div class="fb-t" id="fb-d" style="background:${C.c1}"></div></div><div class="fb"><span>Regular plan</span><div class="fb-t" id="fb-r" style="background:${C.c3}"></div></div>`;
    const run = () => {
      const m = val('fe-m'), f = val('fe-f'), y = val('fe-y');
      out('fe-m', inr(m)); out('fe-f', f.toFixed(2) + '%'); out('fe-y', y + ' years');
      const a = sipFV(m, 0, 11, y).v, b = sipFV(m, 0, 11 - f, y).v;
      countTo($('#fe-lost'), a - b, fmt, 300);
      $('#fe-note').innerHTML = `That’s <b>${pct((a - b) / a * 100)}</b> of your final wealth, for the same fund. Assumes 11% gross return.`;
      $('#fb-d').style.width = '100%'; $('#fb-d').textContent = fmt(a);
      $('#fb-r').style.width = (b / a * 100) + '%'; $('#fb-r').textContent = fmt(b);
    };
    onInputs(['fe-m', 'fe-f', 'fe-y'], run);
  })();

  /* ───────── 7d. allocation ───────── */
  (() => {
    if (!$('#alloc')) return;
    const temper = seg('al-t', () => run());
    const run = () => {
      const y = val('al-y'), t = +temper();
      out('al-y', y + (y === 1 ? ' year' : ' years'));
      let eq = y < 3 ? 0 : y < 5 ? 25 : y < 7 ? 45 : y < 10 ? 60 : 75;
      if (y >= 3) eq += t === 0 ? -20 : t === 2 ? 10 : 0;
      eq = Math.max(0, Math.min(90, eq));
      $('#al-eq').style.flex = `${Math.max(eq, .001)} 1 0`; $('#al-debt').style.flex = `${Math.max(100 - eq, .001)} 1 0`;
      $('#al-eq span').textContent = eq >= 12 ? `Equity ${eq}%` : ''; $('#al-debt span').textContent = 100 - eq >= 12 ? `Debt ${100 - eq}%` : '';
      $('#al-verdict').innerHTML = y < 3 ? `<b>Money needed within 3 years shouldn’t be in equity.</b> FDs, liquid or short-term debt funds. A crash right before you need it is a real risk.` :
        t === 0 ? `<b>Know thyself.</b> If a fall would make you sell, a lower equity share you can stick with beats a higher one you abandon at the bottom.` :
          `A rough illustration, not a recommendation: about <b>${eq}% equity</b> for a goal ${y} years away${t === 2 ? ', given a strong stomach for falls' : ''}. Rebalance once a year back to your target.`;
    };
    onInputs(['al-y'], run);
  })();

  /* ───────── 9. real cost ───────── */
  (() => {
    const chips = $('#rc-chips'); if (!chips) return;
    const P = [['New phone', 80000], ['Weekend trip', 25000], ['Designer watch', 150000], ['Bike', 160000], ['Hatchback', 750000], ['Lavish wedding extra', 1500000]];
    P.forEach(([n, p], i) => { const b = el('button', i === 0 ? 'on' : '', n); b.onclick = () => { $$('button', chips).forEach((x) => x.classList.toggle('on', x === b)); $('#rc-p').value = p; fill($('#rc-p')); run(); }; chips.append(b); });
    const run = () => {
      const p = val('rc-p'), r = val('rc-r');
      out('rc-p', inr(p)); out('rc-r', r + '%');
      const nom = p * Math.pow(1 + r / 100, 35), real = nom / Math.pow(1.06, 35);
      countTo($('#rc-nom'), nom, fmt, 300); countTo($('#rc-real'), real, fmt, 300);
      $('#rc-verdict').innerHTML = `In real terms, spending <b>${inr(p)}</b> at 25 costs your 60-year-old self about <b>${(real / p).toFixed(1)}×</b> as much in today’s money. Buy it if it’s worth that. Many things are.`;
    };
    onInputs(['rc-r'], run); $('#rc-p').addEventListener('input', () => { $$('button', chips).forEach((x) => x.classList.remove('on')); run(); });
  })();

  /* ───────── 10. scam quiz ───────── */
  (() => {
    const body = $('#scam-body'); if (!body) return;
    const Q = [
      ['UPI request · unknown', 'Congratulations! You’ve won ₹5,000 cashback 🎉 Tap “Pay” and enter your UPI PIN to receive the money.', 1, 'You never need your UPI PIN to receive money. Entering it always sends money out. This is the most common UPI fraud in India.'],
      ['Your bank · SMS', 'Txn of ₹1,240 at a food delivery app on your card ending 4417. If this wasn’t you, call the number on the back of your card.', 0, 'Probably legit: it doesn’t ask you to click a link or share anything, and it tells you to use the number printed on your own card. Still, verify through your bank app.'],
      ['WhatsApp · “Elite Traders VIP”', 'Our members earn guaranteed 3% DAILY. Join our institutional trading app, deposit ₹50,000 and our experts trade for you. Limited seats!', 1, '“Guaranteed” plus high returns plus urgency is the classic investment scam, often with a fake app that shows gains you can never withdraw.'],
      ['Video call · “CBI officer”', 'A parcel in your name was seized with illegal items. You are under digital arrest. Stay on this call and transfer your savings to an RBI verification account.', 1, 'There is no such thing as a “digital arrest” in Indian law. Real agencies don’t investigate over video calls or ask you to move money. Hang up and report it on cybercrime.gov.in or 1930.'],
      ['Email · your mutual fund house', 'Your SIP instalment of ₹10,000 has been processed and units allotted at the applicable NAV. View your statement in the app.', 0, 'Looks legit: routine confirmation, no request for passwords, OTPs or payment. Check by opening the app yourself rather than clicking any link.'],
      ['Telegram · job offer', 'Work from home! Earn ₹3,000/day just liking YouTube videos. Pay a ₹2,000 refundable registration fee to unlock premium tasks.', 1, 'Task scams start with small real payouts, then ask you to “invest” to unlock bigger tasks. Real jobs never charge you to start.'],
      ['SMS · “Electricity dept”', 'Dear consumer, your power will be disconnected tonight at 9:30 pm as last bill was not updated. Call officer 98XXXXXXXX immediately.', 1, 'Urgency plus a personal mobile number is the giveaway. Utilities don’t disconnect over SMS threats; check through the official app or website.'],
    ];
    let i = 0, score = 0;
    const render = () => {
      $('#scam-s').textContent = `${score} / ${Q.length}`;
      if (i >= Q.length) {
        body.innerHTML = `<div class="msg" style="max-width:none"><small>RESULT</small><b style="font-size:1.4rem;font-family:var(--mono)">${score} of ${Q.length}</b><br>${score === Q.length ? 'Perfect. Now forward this to your parents.' : 'Scammers are professionals. The rule that beats almost all of them: never act on urgency, never share an OTP or PIN, and verify through the official app.'}</div><div class="scam-q"><button class="btn" id="scam-again">Play again</button></div>`;
        $('#scam-again').onclick = () => { i = 0; score = 0; render(); };
        return;
      }
      const [from, text] = Q[i];
      body.innerHTML = `<p style="font:600 .74rem var(--sans);color:var(--ink-3);margin-bottom:.6rem">Message ${i + 1} of ${Q.length}</p><div class="msg"><small>${from}</small>${text}</div><div class="scam-q"><button class="btn" data-a="1" style="background:var(--coral)">🚩 Scam</button><button class="btn" data-a="0">✓ Looks legit</button></div>`;
      $$('.scam-q button', body).forEach((b) => b.onclick = () => {
        const ok = +b.dataset.a === Q[i][2]; if (ok) score++;
        $$('.scam-q button', body).forEach((x) => (x.disabled = true));
        const fb = el('div', 'scam-fb ' + (ok ? 'ok' : 'no'), `<p><b>${ok ? 'Correct' : 'Not quite'}: ${Q[i][2] ? 'scam' : 'likely legit'}.</b>${Q[i][3]}</p>`);
        const nx = el('button', 'btn', i === Q.length - 1 ? 'See score' : 'Next →'); nx.onclick = () => { i++; render(); };
        fb.append(nx); body.append(fb); $('#scam-s').textContent = `${score} / ${Q.length}`; nx.focus({ preventScroll: true });
      });
    };
    render();
  })();

  /* ───────── 11. freedom number ───────── */
  (() => {
    if (!$('#fire')) return;
    const run = () => {
      const e = val('fi-e'), a = val('fi-a'), x = val('fi-x'), i = val('fi-i'), r = val('fi-r');
      out('fi-e', inr(e)); out('fi-a', a); out('fi-x', x + '×'); out('fi-i', i + '%'); out('fi-r', r + '%');
      const n = a - 25, num = e * Math.pow(1 + i / 100, n) * 12 * x;
      $('#fi-age').textContent = a;
      countTo($('#fi-num'), num);
      $('#fi-today').textContent = `≈ ${fmt(num / Math.pow(1 + i / 100, n))} in today’s rupees, because ${inr(e)}/month today will cost ${inr(e * Math.pow(1 + i / 100, n))}/month then.`;
      const flat = num / sipFV(1, 0, r, n).v, step = num / sipFV(1, 10, r, n).v;
      countTo($('#fi-flat'), flat, inr); countTo($('#fi-step'), step, inr);
    };
    onInputs(['fi-e', 'fi-a', 'fi-x', 'fi-i', 'fi-r'], run);
  })();

  /* ───────── 12. checklist ───────── */
  (() => {
    const cols = $('#ck-cols'); if (!cols) return;
    const L = [
      ['Weeks 1–2 · Set up', ['Read your payslip line by line until every number makes sense', 'Activate your UAN on the EPFO portal and check deposits are arriving', 'Pick your tax regime with payroll (new is usually right at 25)', 'Link PAN and Aadhaar; finish KYC for investing', 'Add nominees to your bank account, EPF and investments', 'Open a second “spending” account and link it to UPI', 'Turn on transaction alerts and set sensible UPI limits']],
      ['Month 1 · Protect', ['Work out your essential monthly expenses', 'Start an automatic transfer into your emergency fund', 'Buy personal health insurance, ideally with a super top-up', 'Look into a health policy for your parents', 'Buy pure term insurance if anyone depends on you', 'Set every credit card to auto-pay the FULL statement', 'Check your credit score and report for errors']],
      ['Months 2–3 · Grow', ['Start a SIP in a direct Nifty 50 index fund, the day after payday', 'Decide now how much you’ll step up the SIP at your next raise', 'Write down three goals with an amount and a date', 'Track three months of spending, once, and fix the biggest leak', 'Leave every “tips” group and mute the finfluencers', 'Calendar reminder: file your ITR before 31 July', 'Calendar reminder: a yearly money review on your birthday']],
    ];
    const KEY = 'lrn-money-90'; let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
    let n = 0;
    L.forEach(([h, items]) => {
      const c = el('div', 'ck-col'); c.append(el('h4', '', h)); const ul = el('ul');
      items.forEach((t) => { const id = n++; const li = el('li'); li.innerHTML = `<input type="checkbox" id="ck-${id}" ${saved.includes(id) ? 'checked' : ''}><label for="ck-${id}"><span class="bx"></span><span class="t">${t}</span></label>`; ul.append(li); });
      c.append(ul); cols.append(c);
    });
    const boxes = $$('input', cols), LAB = ['Start with the first box. It takes ten minutes.', 'Good start. The boring setup is the hard part.', 'Your floor is being built.', 'Most people your age never get this far.', 'Nearly there.', 'Done. Now let time do the rest.'];
    const upd = () => {
      const on = boxes.filter((b) => b.checked).length, tot = boxes.length;
      $('#ck-fill').style.strokeDashoffset = (326.7 * (1 - on / tot)).toFixed(1);
      $('#ck-n').textContent = `${on} / ${tot}`; $('#ck-l').textContent = LAB[on === tot ? 5 : Math.min(4, Math.ceil(on / tot * 4))];
      try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0))); } catch (e) { /* storage unavailable */ }
    };
    boxes.forEach((b) => b.addEventListener('change', upd));
    $('#ck-reset').onclick = () => { boxes.forEach((b) => (b.checked = false)); upd(); };
    upd();
  })();
})();

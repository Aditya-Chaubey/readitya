/* lrn — Lights Out */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const C = { c1: '#7c6cf0', c2: '#bf8a1e', c3: '#2fa881', c4: '#e8604f', card: '#141a3a' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const hhmm = (h) => { h = ((h % 24) + 24) % 24; let H = Math.floor(h), M = Math.round((h - H) * 60); if (M === 60) { H = (H + 1) % 24; M = 0; } const ap = H < 12 ? 'AM' : 'PM'; const h12 = H % 12 || 12; return `${h12}:${String(M).padStart(2, '0')} ${ap}`; };

  /* ───────── tooltip ───────── */
  const tip = $('#tip');
  const showTip = (html, x, y) => { tip.innerHTML = html; tip.classList.add('show'); const w = tip.offsetWidth, h = tip.offsetHeight; let l = x + 14, t = y - h - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', hideTip); };

  /* ───────── ranges ───────── */
  const fill = (i) => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min) * 100) + '%');
  $$('input[type=range]').forEach((i) => { fill(i); i.addEventListener('input', () => fill(i)); });
  const val = (id) => +$('#' + id).value;
  const out = (id, t) => { const o = $('#' + id + '-o'); if (o) o.textContent = t; };
  const seg = (id, fn) => { const r = $('#' + id); $$('button', r).forEach((b) => b.addEventListener('click', () => { $$('button', r).forEach((x) => x.classList.toggle('on', x === b)); fn(b.dataset.v); })); return () => $('button.on', r).dataset.v; };

  /* ───────── reveal ───────── */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb, margin = '0px 0px -10% 0px') => {
    if (RM || !io) { n.classList.add('in'); cb && cb(); return; }
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: margin });
    o.observe(n);
  };
  $$('.rv').forEach((n) => reveal(n));

  /* ═════════ THE SKY: dusk → midnight → dawn ═════════ */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
  const KEYS = [
    // p, top, mid, bottom, horizon rgba, stars
    [0.00, '#2a2160', '#4a3478', '#d97a86', [255, 150, 130, .45], .35],
    [0.07, '#171a4a', '#2a2463', '#6b3f7a', [255, 140, 140, .2], .8],
    [0.18, '#070a1f', '#0c1033', '#1a1a4a', [120, 100, 200, .12], 1],
    [0.80, '#070a1f', '#0c1033', '#1a1a4a', [120, 100, 200, .12], 1],
    [0.89, '#1a2152', '#3b3577', '#a0607e', [255, 150, 120, .3], .55],
    [0.95, '#6a6aa8', '#e59a8a', '#ffc79a', [255, 190, 130, .5], .1],
    [1.00, '#9fc2ea', '#ffd1a8', '#ffe7c7', [255, 220, 170, .5], 0],
  ];
  const sky = $('#sky'), hz = $('#horizon'), moon = $('#moon'), clock = $('#clock'), ct = $('#clock-t'), cap = $('#clock-ap'), cico = $('#clock-ico'), bar = $('#progress');
  let starAlpha = .35;
  const chapters = $$('[data-rail]'), rail = $('#rail');
  chapters.forEach((c) => { const a = el('a'); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const railLinks = $$('a', rail);
  const sun = $('.sun'), dawn = $('#ch-dawn');
  const paint = () => {
    const d = document.documentElement, max = Math.max(1, d.scrollHeight - innerHeight);
    const p = clamp(scrollY / max, 0, 1);
    bar.style.width = (p * 100).toFixed(2) + '%';
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = clamp((p - a[0]) / (b[0] - a[0]), 0, 1);
    sky.style.setProperty('--sky-a', mix(a[1], b[1], t)); sky.style.setProperty('--sky-b', mix(a[2], b[2], t)); sky.style.setProperty('--sky-c', mix(a[3], b[3], t));
    const H = a[4].map((v, k) => lerp(v, b[4][k], t)); hz.style.setProperty('--hz', `rgba(${H[0] | 0},${H[1] | 0},${H[2] | 0},${H[3].toFixed(3)})`);
    starAlpha = lerp(a[5], b[5], t);
    // moon arc
    const q = clamp(p / .9, 0, 1), W = innerWidth, Hh = innerHeight;
    const mx = lerp(W * .06, W * .9, q), my = Hh * (.62 - .48 * Math.sin(Math.PI * q));
    moon.style.transform = `translate(${mx - 32}px, ${my - 32}px)`;
    moon.style.setProperty('--moon-o', Math.min(clamp((scrollY - innerHeight * .6) / (innerHeight * .5), 0, 1), clamp(1 - (p - .86) / .08, 0, 1)).toFixed(3));
    // clock 9:30 PM → 7:00 AM
    const hrs = 21.5 + p * 9.5, hh = hhmm(hrs).split(' ');
    ct.textContent = hh[0]; cap.textContent = hh[1];
    const day = p > .93; clock.classList.toggle('day', day); cico.textContent = day ? '☀' : '☾';
    clock.classList.toggle('show', scrollY > innerHeight * .5);
    rail.classList.toggle('show', scrollY > innerHeight * .8);
    let cur = -1; chapters.forEach((c, k) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = k; });
    railLinks.forEach((l, k) => { l.classList.toggle('on', k === cur); l.classList.toggle('done', k < cur); });
    if (sun && dawn) { const r = dawn.getBoundingClientRect(); const s = clamp(1 - (r.top + 200) / innerHeight, 0, 1); sun.style.setProperty('--sun-y', (60 - s * 110) + '%'); }
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { paint(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', paint);
  paint();

  /* stars */
  (() => {
    const c = $('#stars'), ctx = c.getContext('2d');
    let w, h, dpr, stars = [], shoot = null, nextShoot = performance.now() + 4000, boost = 1;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(w * h / 5200);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h * .92, r: Math.random() < .08 ? 1.6 + Math.random() : .4 + Math.random() * .9, t: Math.random() * 6.28, s: .5 + Math.random() * 2, warm: Math.random() < .2 }));
    };
    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      const A = starAlpha * boost;
      if (A > .01) {
        for (const s of stars) {
          const tw = RM ? .8 : .55 + .45 * Math.sin(s.t + now / 1000 * s.s);
          ctx.globalAlpha = clamp(A * tw, 0, 1);
          ctx.fillStyle = s.warm ? '#ffe6b0' : '#e8e6ff';
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
          if (s.r > 1.5) { ctx.globalAlpha *= .25; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, 6.283); ctx.fill(); }
        }
        if (!RM && A > .6) {
          if (!shoot && now > nextShoot) shoot = { x: Math.random() * w * .7 + w * .2, y: Math.random() * h * .35, life: 0 };
          if (shoot) {
            shoot.life += 16; const k = shoot.life / 900, x = shoot.x - k * 340, y = shoot.y + k * 160;
            const g = ctx.createLinearGradient(x, y, x + 90, y - 42); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = A * (1 - k); ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 42); ctx.stroke();
            if (k >= 1) { shoot = null; nextShoot = now + 6000 + Math.random() * 9000; }
          }
        }
      }
      ctx.globalAlpha = 1;
      if (!RM) requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size); requestAnimationFrame(draw);
    if (RM) addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
    // pull cord
    const pull = $('#pull'), lights = $('#lights');
    pull.addEventListener('click', () => {
      const off = document.body.classList.toggle('lights-out');
      lights.classList.toggle('off', off); boost = off ? 1.6 : 1;
      pull.setAttribute('aria-pressed', off); $('.pull-l', pull).textContent = off ? 'Pull to turn the lights back on' : 'Pull to turn the lights out';
    });
  })();

  /* ═════════ chart helper ═════════ */
  function lineChart(host, opt) {
    return (animate) => {
      host.innerHTML = '';
      const W = host.clientWidth, H = host.clientHeight; if (!W) return;
      const nLab = opt.series.filter((s) => s.label !== false).length;
      const m = { l: opt.ml ?? 48, r: nLab ? (W < 520 ? 76 : 118) : 14, t: 16, b: 30 };
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': opt.aria || 'Chart' });
      const xs = opt.series[0].pts.map((p) => p.x), x0 = opt.xMin ?? xs[0], x1 = opt.xMax ?? xs[xs.length - 1];
      let yMax = opt.yMax ?? Math.max(1e-9, ...opt.series.flatMap((s) => s.pts.map((p) => p.y))), yMin = opt.yMin ?? 0;
      const nice = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
      const step = opt.yStep || nice((yMax - yMin) / 4); if (!opt.yMax) yMax = Math.ceil(yMax / step) * step;
      const X = (x) => m.l + (x - x0) / (x1 - x0 || 1) * (W - m.l - m.r), Y = (y) => H - m.b - (y - yMin) / (yMax - yMin || 1) * (H - m.t - m.b);
      (opt.bands || []).forEach((b) => { const r = sv('rect', { x: X(b.from), y: m.t, width: Math.max(0, X(b.to) - X(b.from)), height: H - m.t - m.b, fill: b.fill, rx: 8 }); svg.append(r); if (b.label) { const t = sv('text', { x: X(b.from) + 8, y: m.t + 16, class: 'dl', opacity: .75 }); t.textContent = b.label; svg.append(t); } });
      const ax = sv('g', { class: 'ax' });
      for (let v = yMin; v <= yMax + 1e-9; v += step) { ax.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: v === yMin ? 'base' : '' })); const t = sv('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = (opt.yFmt || String)(v); ax.append(t); }
      (opt.xTicks || [x0, x1]).forEach((v) => { const t = sv('text', { x: X(v), y: H - 8, 'text-anchor': 'middle' }); t.textContent = (opt.xFmt || String)(v); ax.append(t); });
      svg.append(ax);
      (opt.vlines || []).forEach((v) => { svg.append(sv('line', { x1: X(v.x), x2: X(v.x), y1: m.t, y2: H - m.b, stroke: v.color || '#f4efe6', 'stroke-width': 1.5, 'stroke-dasharray': '4 4', opacity: .8 })); const t = sv('text', { x: X(v.x) + 6, y: m.t + 12, class: 'dl' }); t.textContent = v.label; svg.append(t); });
      const labels = [];
      opt.series.forEach((s) => {
        const d = s.pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
        if (s.area) { const a = sv('path', { d: d + ` L${X(s.pts[s.pts.length - 1].x)} ${Y(yMin)} L${X(s.pts[0].x)} ${Y(yMin)} Z`, fill: s.color, opacity: s.areaOpacity ?? .18 }); svg.append(a); }
        const p = sv('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash || '' });
        svg.append(p);
        if (animate && !RM && !s.dash) { p.style.setProperty('--len', p.getTotalLength()); p.classList.add('draw'); }
        if (s.label !== false) { const L = s.pts[s.pts.length - 1]; labels.push({ s, y: Y(L.y), x: X(L.x), ly: Y(L.y) }); }
      });
      labels.sort((a, b) => a.y - b.y); for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
      labels.forEach(({ s, y, x, ly }) => { svg.append(sv('circle', { cx: x, cy: ly, r: 4, fill: s.color, stroke: C.card, 'stroke-width': 2 })); const t = sv('text', { x: x + 9, y: y + 4, class: 'dl' }); t.textContent = s.short || s.name; svg.append(t); });
      const xh = sv('line', { class: 'xh', y1: m.t, y2: H - m.b }); svg.append(xh);
      const dots = opt.series.map((s) => { const c = sv('circle', { r: 4.5, fill: s.color, stroke: C.card, 'stroke-width': 2, opacity: 0 }); svg.append(c); return c; });
      const hit = sv('rect', { x: m.l, y: m.t, width: Math.max(1, W - m.l - m.r), height: Math.max(1, H - m.t - m.b), class: 'hit' }); svg.append(hit);
      hit.addEventListener('pointermove', (e) => {
        const r = svg.getBoundingClientRect(), mx = (e.clientX - r.left) * (W / r.width);
        let bi = 0, bd = 1e9; xs.forEach((x, i) => { const dd = Math.abs(X(x) - mx); if (dd < bd) { bd = dd; bi = i; } });
        xh.setAttribute('x1', X(xs[bi])); xh.setAttribute('x2', X(xs[bi])); xh.style.opacity = .5;
        dots.forEach((c, k) => { const p = opt.series[k].pts[bi]; if (p) { c.setAttribute('cx', X(p.x)); c.setAttribute('cy', Y(p.y)); c.setAttribute('opacity', 1); } });
        showTip(`<div style="opacity:.7;margin-bottom:.2rem">${(opt.xTip || opt.xFmt || String)(xs[bi])}</div>` + opt.series.map((s) => s.pts[bi] ? `<div><i style="background:${s.color}"></i>${s.name}: <b>${(opt.tipFmt || String)(s.pts[bi].y)}</b></div>` : '').join(''), e.clientX, e.clientY);
      });
      hit.addEventListener('pointerleave', () => { hideTip(); xh.style.opacity = 0; dots.forEach((c) => c.setAttribute('opacity', 0)); });
      host.append(svg);
    };
  }
  const redraws = []; let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => redraws.forEach((f) => f(false)), 160); });

  /* ═════════ 1. why cards ═════════ */
  (() => {
    const root = $('#whys'); if (!root) return;
    const W = [
      ['🧽', 'Brain cleaning', 'The night shift cleaners', '#3b2f8f', '#6b4bc4', 'In 2013, Maiken Nedergaard’s lab found that in sleeping mice, the spaces between brain cells widen and cerebrospinal fluid flushes through faster, washing out waste proteins, including ones linked to Alzheimer’s. It’s called the glymphatic system. How strongly this applies in humans is still actively debated.', 'Promising, still debated'],
      ['📚', 'Memory', 'Save, sort and file', '#1f5a7a', '#2f8db0', 'During deep sleep, the hippocampus “replays” the day’s experiences and transfers them to long-term storage in the cortex. REM seems to help link new memories with old ones, which may be why you sometimes wake up with a solution. Students who sleep after learning remember more than those who stay up.', 'Strong evidence'],
      ['🎭', 'Emotions', 'Overnight therapy', '#7a2f5a', '#b54a7c', 'In a 2007 brain-imaging study, sleep-deprived people’s amygdala, the brain’s alarm centre, reacted about 60 percent more strongly to upsetting images than rested people’s. REM sleep appears to help take the sting out of emotional memories. That’s why everything feels worse when you’re tired.', 'Good evidence'],
      ['🛡️', 'Immunity', 'Arming the defences', '#1f6a52', '#2fa881', 'In a 2015 study, volunteers were deliberately exposed to a cold virus. Those who’d slept under six hours a night the week before were about four times more likely to catch the cold than those sleeping over seven. Sleep also improves how well vaccines work.', 'Good evidence'],
      ['💪', 'Body repair', 'Rebuild and restore', '#7a4a1f', '#bf8a1e', 'The biggest pulse of growth hormone each day is released during deep sleep, helping repair muscle and tissue. Athletes who sleep more tend to react faster, sprint faster and get injured less. Sleep is part of training, not a break from it.', 'Good evidence'],
      ['🍩', 'Appetite', 'Why tired you wants pastries', '#7a2f2f', '#e8604f', 'In a 2004 study, two nights of four hours’ sleep lowered leptin (the “I’m full” hormone) by about 18 percent and raised ghrelin (the “I’m hungry” hormone) by about 28 percent. Participants craved more high-carb, sugary food. Short sleep also makes the body worse at handling blood sugar.', 'Good evidence'],
    ];
    W.forEach(([ico, t, s, g1, g2, back, conf], i) => {
      const b = el('button', 'wy rv'); b.style.setProperty('--d', (i % 3) * .08 + 's');
      b.innerHTML = `<div class="wy-in"><div class="wy-f" style="--g1:${g1};--g2:${g2}"><span class="ico">${ico}</span><h3>${t}</h3><p>${s} · tap to flip</p></div><div class="wy-b"><h4>${ico} ${t}</h4><p>${back}</p><span class="conf">● ${conf}</span></div></div>`;
      b.setAttribute('aria-label', `${t}. Flip for details.`);
      b.addEventListener('click', () => b.classList.toggle('flip'));
      root.append(b); reveal(b);
    });
  })();

  /* ═════════ 2. two-process model ═════════ */
  (() => {
    const host = $('#forces-chart'); if (!host) return;
    const night = seg('fo-n', () => run(false));
    const leg = $('#forces-legend');
    let draw;
    const Cf = (h) => { const x = 2 * Math.PI * (h - 19.5) / 24; return .5 + .38 * Math.cos(x) + .12 * Math.cos(2 * x); };
    const run = (anim) => {
      const w = val('fo-w'), cups = val('fo-c'), allNight = night() === '1';
      out('fo-w', hhmm(w)); out('fo-c', cups ? `${cups} cup${cups > 1 ? 's' : ''} at 3 PM` : 'none');
      const bed = w + 16;
      let S = allNight ? .92 : .12; const sP = [], cP = [], fP = [];
      for (let h = w; h <= w + 24.001; h += .25) {
        const awake = h < bed;
        if (h > w) S = awake ? 1 - (1 - S) * Math.exp(-.25 / 18) : S * Math.exp(-.25 / 4.2);
        const tt = h - 15, caf = cups && tt >= 0 ? .16 * cups * Math.pow(.5, tt / 5) : 0;
        sP.push({ x: h, y: S }); cP.push({ x: h, y: Cf(h) }); fP.push({ x: h, y: Math.max(0, S - caf) });
      }
      const series = [{ name: 'Sleep pressure (adenosine)', short: 'Pressure', color: C.c1, pts: sP, area: true, areaOpacity: .12 }, { name: 'Clock’s alerting signal', short: 'Clock', color: C.c2, pts: cP }];
      if (cups) series.push({ name: 'Pressure you feel, with coffee', short: 'Felt', color: C.c3, pts: fP, dash: '6 5' });
      const xt = []; for (let h = Math.ceil(w / 3) * 3; h <= w + 24; h += 3) xt.push(h);
      draw = lineChart(host, { aria: 'Sleep pressure and circadian alerting signal across a day', series, xTicks: xt, xFmt: (h) => hhmm(h).replace(':00', ''), xTip: hhmm, yMin: 0, yMax: 1, yStep: .5, yFmt: (v) => v === 0 ? 'low' : v === 1 ? 'high' : '', tipFmt: (v) => Math.round(v * 100) + '%', bands: [{ from: bed, to: w + 24, fill: 'rgba(124,108,240,.08)', label: 'asleep' }] });
      draw(anim);
      leg.innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
      const dip = 14.5, peak = 19.5;
      $('#forces-note').innerHTML = allNight ? `After an all-nighter, pressure starts the day near its maximum. Your clock’s alerting signal still rises in the morning, which is why you feel <b>weirdly okay</b> around mid-morning and then collapse in the afternoon dip.` :
        `Pressure climbs all day. Your clock’s alerting signal dips around <b>${hhmm(dip)}</b> (the post-lunch slump) and peaks around <b>${hhmm(peak)}</b>, holding off sleep until it falls away. With this wake time, a natural bedtime lands near <b>${hhmm(bed)}</b>.${cups ? ' The dashed line shows how coffee hides the pressure without removing it: notice how much is still being masked at bedtime.' : ''}`;
    };
    ['fo-w', 'fo-c'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    run(false); redraws.push((a) => draw && draw(a)); reveal(host, () => run(true));
  })();

  /* ═════════ 3a. brain waves ═════════ */
  const STAGES = [
    { k: 'W', n: 'Awake', hz: 'beta · 13–30 Hz', c: C.c2, d: 'Fast, small, jumbled waves: millions of neurons all doing different things. Close your eyes and relax and they smooth into alpha waves, the doorway to sleep.', f: 'Brief awakenings happen many times a night. Most are so short you never remember them.' },
    { k: 'N1', n: 'Light sleep (N1)', hz: 'theta · 4–7 Hz', c: '#a99cf6', d: 'The drifting-off stage, lasting just a few minutes. Muscles relax, thoughts turn dreamlike, and you can be woken easily, often insisting you weren’t asleep.', f: 'That sudden falling jolt as you drift off is a hypnic jerk. Very common, completely harmless.' },
    { k: 'N2', n: 'Stable sleep (N2)', hz: 'spindles & K-complexes', c: '#8a7bf2', d: 'Your heart rate and temperature drop. The brain produces sleep spindles (quick bursts) and K-complexes (big single waves) that help protect sleep from noise and lock in memories.', f: 'N2 takes up about half of a typical night, more than any other stage.' },
    { k: 'N3', n: 'Deep sleep (N3)', hz: 'delta · 0.5–2 Hz', c: C.c1, d: 'Huge, slow, synchronised waves, like a stadium doing the Mexican wave. This is the most restorative stage, hardest to wake from, and when growth hormone pulses.', f: 'Deep sleep falls steadily with age. Sleepwalking and night terrors happen in this stage.' },
    { k: 'REM', n: 'REM sleep', hz: 'mixed, sawtooth waves', c: C.c4, d: 'Your brain looks almost awake, your eyes dart about, and your body is temporarily paralysed. This is where the most vivid dreams happen and emotional memories get processed.', f: 'REM makes up roughly a fifth to a quarter of adult sleep, mostly in the early morning.' },
  ];
  (() => {
    const cv = $('#wv-canvas'); if (!cv) return;
    const ctx = cv.getContext('2d'), tabs = $('#wv-tabs'), info = $('.wv-info');
    let cur = 0, t0 = performance.now(), amp = 1, targetAmp = 1, running = false;
    STAGES.forEach((s, i) => { const b = el('button', i === 0 ? 'on' : '', `${s.n}<small>${s.hz}</small>`); b.style.setProperty('--sc', s.c); b.setAttribute('role', 'tab'); b.onclick = () => set(i); tabs.append(b); });
    const noise = (x) => Math.sin(x * 12.9898) * 43758.5453 % 1;
    const wave = (k, x) => {
      switch (k) {
        case 'W': return .22 * Math.sin(x * 2.4) + .16 * Math.sin(x * 3.7 + 1) + .12 * Math.sin(x * 5.3 + 2) + .1 * noise(Math.floor(x * 3));
        case 'N1': return .35 * Math.sin(x * .95) + .12 * Math.sin(x * 2.1 + 1);
        case 'N2': { const ph = x % 40; const sp = ph > 8 && ph < 13 ? .5 * Math.sin(x * 4) * Math.sin((ph - 8) / 5 * Math.PI) : 0; const kc = ph > 25 && ph < 30 ? -1.1 * Math.sin((ph - 25) / 5 * Math.PI) * (ph < 27.5 ? 1 : -.6) : 0; return .25 * Math.sin(x * .8) + sp + kc; }
        case 'N3': return .85 * Math.sin(x * .28) + .12 * Math.sin(x * 1.3);
        case 'REM': { const saw = ((x * .45) % (2 * Math.PI)) / Math.PI - 1; return .3 * saw + .15 * Math.sin(x * 3.1) + .1 * Math.sin(x * 4.7 + 1); }
      }
      return 0;
    };
    const frame = (now) => {
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      amp += (targetAmp - amp) * .12;
      const s = STAGES[cur], off = (now - t0) / 1000 * 9;
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      ctx.lineWidth = 2; ctx.strokeStyle = s.c; ctx.shadowColor = s.c; ctx.shadowBlur = 10; ctx.beginPath();
      for (let px = 0; px <= w; px += 2) { const y = h / 2 - wave(s.k, px / 8 + off) * (h * .38) * amp; px ? ctx.lineTo(px, y) : ctx.moveTo(px, y); }
      ctx.stroke(); ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, '#141a3a'); g.addColorStop(1, 'rgba(20,26,58,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 60, h);
      if (running && !RM) requestAnimationFrame(frame);
    };
    const set = (i) => {
      cur = i; amp = .1; targetAmp = 1; const s = STAGES[i];
      $$('button', tabs).forEach((b, k) => b.classList.toggle('on', k === i));
      $('#wv-t').textContent = s.n; $('#wv-d').textContent = s.d; $('#wv-f').textContent = '✦ ' + s.f;
      info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
      if (RM) frame(performance.now());
    };
    set(0);
    if (io) new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) requestAnimationFrame(frame); }).observe(cv);
    else { running = true; requestAnimationFrame(frame); }
  })();

  /* ═════════ 3b. hypnogram ═════════ */
  (() => {
    const host = $('#hypno-chart'); if (!host) return;
    const LV = { W: 0, REM: 1, N1: 2, N2: 3, N3: 4 };
    const COL = { W: C.c2, REM: C.c4, N1: '#a99cf6', N2: '#8a7bf2', N3: C.c1 };
    const NIGHT = [['W', 8], ['N1', 6], ['N2', 14], ['N3', 38], ['N2', 12], ['REM', 10], ['N2', 18], ['N3', 30], ['N2', 14], ['W', 2], ['REM', 20], ['N1', 3], ['N2', 28], ['N3', 14], ['N2', 14], ['REM', 30], ['N2', 42], ['W', 2], ['REM', 38], ['N2', 34], ['N1', 3], ['REM', 42], ['N2', 20], ['W', 2], ['REM', 26]];
    const tot = NIGHT.reduce((a, s) => a + s[1], 0);
    const lenSeg = seg('hy-len', () => render(true));
    let playing = false;
    const build = (L) => { const scale = 480 / tot; const segs = []; let t = 0; for (const [k, d] of NIGHT) { const dd = d * scale; if (t >= L) break; segs.push([k, t, Math.min(t + dd, L)]); t += dd; } return segs; };
    const stats = (segs) => { const o = { N3: 0, REM: 0, N2: 0, N1: 0, W: 0 }; segs.forEach(([k, a, b]) => (o[k] += b - a)); return o; };
    const full = stats(build(480));
    const render = (anim) => {
      host.innerHTML = '';
      const L = +lenSeg() * 60, segs = build(L), st = stats(segs);
      const W = host.clientWidth, H = host.clientHeight; if (!W) return;
      const m = { l: W < 520 ? 52 : 72, r: 14, t: 14, b: 30 };
      const X = (t) => m.l + t / 480 * (W - m.l - m.r), rowH = (H - m.t - m.b) / 5, Y = (lv) => m.t + rowH * (lv + .5);
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Hypnogram: sleep stages through the night' });
      const ax = sv('g', { class: 'ax' });
      Object.entries(LV).forEach(([k, lv]) => { ax.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(lv), y2: Y(lv) })); const t = sv('text', { x: m.l - 8, y: Y(lv) + 4, 'text-anchor': 'end' }); t.textContent = k === 'W' ? 'Awake' : k === 'REM' ? 'REM' : k === 'N3' ? 'Deep N3' : k; ax.append(t); });
      for (let hr = 0; hr <= 8; hr++) { const t = sv('text', { x: X(hr * 60), y: H - 8, 'text-anchor': 'middle' }); t.textContent = hhmm(23 + hr).replace(':00', ''); ax.append(t); }
      svg.append(ax);
      if (L < 480) { svg.append(sv('rect', { x: X(L), y: m.t, width: X(480) - X(L), height: H - m.t - m.b, fill: 'rgba(232,96,79,.08)', rx: 8 })); const t = sv('text', { x: X(L) + 8, y: m.t + 14, class: 'dl' }); t.textContent = 'lost: mostly REM'; svg.append(t); }
      const clip = sv('clipPath', { id: 'hyclip' }); const cr = sv('rect', { x: 0, y: 0, width: anim && !RM ? m.l : W, height: H }); clip.append(cr); svg.append(clip);
      const g = sv('g', { 'clip-path': 'url(#hyclip)' });
      segs.forEach(([k, a, b]) => { const r = sv('rect', { x: X(a), y: Y(LV[k]) - rowH * .32, width: Math.max(1, X(b) - X(a) - 1), height: rowH * .64, rx: 4, fill: COL[k] }); bindTip(r, () => `${k === 'W' ? 'Awake' : k}: <b>${Math.round(b - a)} min</b><br><span style="opacity:.7">${hhmm(23 + a / 60)} – ${hhmm(23 + b / 60)}</span>`); g.append(r); });
      let d = ''; segs.forEach(([k, a, b], i) => { d += (i ? `L${X(a)} ${Y(LV[k])}` : `M${X(a)} ${Y(LV[k])}`) + ` L${X(b)} ${Y(LV[k])}`; });
      g.append(sv('path', { d, fill: 'none', stroke: 'rgba(244,239,230,.55)', 'stroke-width': 1.5 }));
      svg.append(g);
      const head = sv('line', { x1: m.l, x2: m.l, y1: m.t, y2: H - m.b, stroke: '#ffd978', 'stroke-width': 2, opacity: anim && !RM ? 1 : 0 }); svg.append(head);
      const hl = sv('text', { x: m.l + 6, y: H - m.b - 6, class: 'dl', fill: '#ffd978', opacity: anim && !RM ? 1 : 0 }); svg.append(hl);
      host.append(svg);
      if (anim && !RM) {
        playing = true; const t0 = performance.now(), dur = 4200, end = X(L);
        const step = (now) => { const k = Math.min(1, (now - t0) / dur), x = lerp(m.l, end, k); cr.setAttribute('width', x); head.setAttribute('x1', x); head.setAttribute('x2', x); hl.setAttribute('x', Math.min(x + 6, W - 70)); hl.textContent = hhmm(23 + (x - m.l) / (W - m.l - m.r) * 8); if (k < 1) requestAnimationFrame(step); else { head.setAttribute('opacity', 0); hl.setAttribute('opacity', 0); playing = false; } };
        requestAnimationFrame(step);
      }
      const pc = (k) => full[k] ? Math.round((1 - st[k] / full[k]) * 100) : 0;
      $('#hy-stats').innerHTML = [['N3', 'Deep sleep'], ['REM', 'REM sleep'], ['N2', 'Stable N2'], ['W', 'Awake']].map(([k, n]) => `<div style="--sc:${COL[k]}"><p>${n}</p><b>${Math.round(st[k])} min</b>${L < 480 && k !== 'W' ? `<span>−${pc(k)}% vs 8 h</span>` : ''}</div>`).join('');
    };
    $('#hy-play').onclick = () => !playing && render(true);
    render(false); redraws.push(() => render(false)); reveal(host, () => render(true));
  })();

  /* ═════════ 4a. ages ═════════ */
  (() => {
    const root = $('#ages-bars'); if (!root) return;
    const A = [['Newborn', '0–3 months', 14, 17], ['Infant', '4–11 months', 12, 15], ['Toddler', '1–2 years', 11, 14], ['Preschool', '3–5 years', 10, 13], ['School age', '6–13 years', 9, 11], ['Teenager', '14–17 years', 8, 10], ['Young adult', '18–25 years', 7, 9, 1], ['Adult', '26–64 years', 7, 9], ['Older adult', '65+ years', 7, 8]];
    A.forEach(([n, r, lo, hi, you], i) => {
      const d = el('div', 'age' + (you ? ' you' : ''), `<span>${n}${you ? ' ←' : ''}</span><div class="age-track"><div class="age-bar" style="left:${lo / 18 * 100}%;width:${(hi - lo) / 18 * 100}%;transition-delay:${i * .07}s">${lo}–${hi}h</div></div>`);
      bindTip(d, () => `${n} (${r}): <b>${lo}–${hi} hours</b>${you ? '<br>Probably you.' : ''}`);
      root.append(d);
    });
    root.append(el('div', 'age-ax', `<span></span><div>${[0, 3, 6, 9, 12, 15, 18].map((h) => `<span>${h}h</span>`).join('')}</div>`));
    reveal(root);
  })();

  /* ═════════ 4b. debt + social jet lag ═════════ */
  (() => {
    const wk = $('#debt-week'); if (!wk) return;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    wk.innerHTML = days.map((d) => `<div class="dw"><span>${d}</span><div class="dw-t"><div class="dw-b ${d === 'Sat' || d === 'Sun' ? 'f' : 'w'}"></div></div></div>`).join('') + `<div class="dw-ticks"><span></span><div>${['8 PM', '11 PM', '2 AM', '5 AM', '8 AM', '11 AM', '2 PM'].map((t) => `<span>${t}</span>`).join('')}</div></div>`;
    const bars = $$('.dw-b', wk);
    const fmtH = (h) => { const s = h < 0 ? '+' : ''; h = Math.abs(h); const H = Math.floor(h), M = Math.round((h - H) * 60); return `${s}${H}h${M ? ' ' + M + 'm' : ''}`; };
    const run = () => {
      const wb = val('db-wb'), ww = val('db-ww') + 24, fb = val('db-fb'), fw = val('db-fw') + 24, need = val('db-n');
      out('db-wb', hhmm(wb)); out('db-ww', hhmm(ww)); out('db-fb', hhmm(fb)); out('db-fw', hhmm(fw)); out('db-n', need + 'h');
      const sw = Math.max(0, ww - wb), sf = Math.max(0, fw - fb);
      const P = (h) => (h - 20) / 18 * 100;
      bars.forEach((b, i) => { const f = i >= 5; const s = f ? fb : wb, e = f ? fw : ww; b.style.left = P(s) + '%'; b.style.width = Math.max(0, P(e) - P(s)) + '%'; });
      const debt = 7 * need - (5 * sw + 2 * sf);
      $('#db-debt').textContent = debt > 0 ? fmtH(debt) : 'None';
      const jl = Math.abs((fb + fw) / 2 - (wb + ww) / 2);
      $('#db-jl').textContent = fmtH(jl);
      const trip = jl < .75 ? 'Barely any. Your weekends and weekdays agree. 👏' : jl < 2 ? 'Like flying Delhi → Dubai every Friday and back every Monday.' : jl < 3 ? 'Like flying Delhi → Singapore every weekend.' : jl < 4 ? 'Like flying Delhi → Tokyo every weekend.' : 'Like flying Delhi → London and back every single week.';
      $('#db-jl-n').textContent = trip;
    };
    ['db-wb', 'db-ww', 'db-fb', 'db-fw', 'db-n'].forEach((id) => $('#' + id).addEventListener('input', run)); run();
  })();

  /* ═════════ 5. chronotype quiz ═════════ */
  (() => {
    const body = $('#qz-body'); if (!body) return;
    const Q = [
      ['On a completely free day, with no alarm, you’d wake up…', ['Before 6:30 AM', '6:30–8 AM', '8–10 AM', 'After 10 AM']],
      ['With no obligations at all, you’d go to bed…', ['Before 10 PM', '10–11:30 PM', '11:30 PM–1 AM', 'After 1 AM']],
      ['The first half hour after waking, you feel…', ['Fresh and ready', 'Fine after a bit', 'Groggy', 'Like a zombie']],
      ['Your sharpest time for hard thinking is…', ['Early morning', 'Late morning', 'Afternoon', 'Late evening']],
      ['A friend suggests a 7 AM run. You…', ['Love it', 'Can manage', 'Reluctantly agree', 'Need a new friend']],
      ['At 10 PM on a normal night you usually feel…', ['Exhausted', 'Winding down', 'Still going', 'Just getting started']],
    ];
    let i = 0, score = 0;
    const R = [
      [10, '🐤', 'Lark', 'You’re a morning type. Your clock runs early: you’re at your best before lunch and fading by the evening. Protect your mornings for important work, and don’t let late social plans wreck your sleep. You’re probably already annoying your owl friends with sunrise photos.'],
      [17, '🕊️', 'In between', 'You’re in the middle, like most people. Your clock is flexible enough to bend either way, so your habits (morning light, consistent wake times, evening screens) have a big say in which way it drifts. Use that power wisely.'],
      [99, '🦉', 'Night owl', 'You’re an evening type. Your clock runs late, and early mornings feel like a punishment. Get bright light as early as you can, dim things at night, and keep your wake time steady, even on weekends. Schedule demanding work for late morning and afternoon if you can.'],
    ];
    const render = () => {
      if (i >= Q.length) {
        const [, bird, name, txt] = R.find((r) => score <= r[0]);
        const pos = (score - 6) / 18 * 100;
        body.innerHTML = `<div class="qz-res"><div class="bird">${bird}</div><div><p class="qz-step">Your chronotype, roughly</p><h3>${name}</h3><div class="qz-meter"><i style="left:0%"></i></div><div class="qz-ends"><span>Lark</span><span>Owl</span></div><p>${txt}</p><p style="margin-top:1rem"><button class="btn ghost small" id="qz-again">Take it again</button></p></div></div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => ($('.qz-meter i', body).style.left = pos + '%')));
        $('#qz-again').onclick = () => { i = 0; score = 0; render(); };
        return;
      }
      const [q, opts] = Q[i];
      body.innerHTML = `<p class="qz-step">Question ${i + 1} of ${Q.length}</p><div class="qz-bar"><i style="width:${i / Q.length * 100}%"></i></div><p class="qz-q">${q}</p><div class="qz-opts">${opts.map((o, k) => `<button data-s="${k + 1}">${o}</button>`).join('')}</div>`;
      $$('.qz-opts button', body).forEach((b) => (b.onclick = () => { score += +b.dataset.s; i++; render(); }));
    };
    render();
  })();

  /* ═════════ 6. caffeine ═════════ */
  (() => {
    const host = $('#caff-chart'); if (!host) return;
    const D = [['☕', 'Filter coffee', 100], ['⚡', 'Espresso shot', 65], ['🫖', 'Masala chai', 40], ['🥄', 'Instant coffee', 60], ['🍵', 'Green tea', 30], ['🥤', 'Cola (can)', 35], ['🔋', 'Energy drink', 80], ['🧋', 'Large cold coffee', 150], ['🍫', 'Dark chocolate', 20]];
    let day = [[0, 9], [2, 16.5]], draw;
    const dRoot = $('#cf-drinks'), dayEl = $('#cf-day');
    D.forEach(([ico, n, mg], k) => { const b = el('button', '', `<span>${ico}</span>${n}<small>~${mg}mg</small>`); b.onclick = () => { const last = day.length ? day[day.length - 1][1] : 8; day.push([k, Math.min(23, last + 2)]); renderDay(); run(true); }; dRoot.append(b); });
    const times = []; for (let h = 6; h <= 23.5; h += .5) times.push(h);
    const renderDay = () => {
      dayEl.innerHTML = day.length ? '' : '<p class="cf-hint">Tap drinks above to add them to your day.</p>';
      day.forEach(([k, t], idx) => {
        const c = el('span', 'cf-chip', `${D[k][0]} ${D[k][1]} at <select aria-label="Time">${times.map((h) => `<option value="${h}" ${h === t ? 'selected' : ''}>${hhmm(h)}</option>`).join('')}</select><button aria-label="Remove">×</button>`);
        $('select', c).onchange = (e) => { day[idx][1] = +e.target.value; run(false); };
        $('button', c).onclick = () => { day.splice(idx, 1); renderDay(); run(false); };
        dayEl.append(c);
      });
    };
    const level = (h, hl) => day.reduce((sum, [k, t]) => { const dt = h - t; if (dt <= 0) return sum; const mg = D[k][2]; const abs = Math.min(1, dt / .75); return sum + mg * abs * Math.pow(.5, Math.max(0, dt - .375) / hl); }, 0);
    const run = (anim) => {
      const bed = val('cf-bed'), hl = val('cf-hl');
      out('cf-bed', hhmm(bed)); out('cf-hl', hl + ' h');
      const pts = []; for (let h = 6; h <= 30.001; h += .25) pts.push({ x: h, y: level(h, hl) });
      draw = lineChart(host, { aria: 'Caffeine in your body across the day', series: [{ name: 'Caffeine in your body', short: 'Caffeine', color: C.c2, pts, area: true, areaOpacity: .2 }], xTicks: [6, 9, 12, 15, 18, 21, 24, 27, 30], xFmt: (h) => hhmm(h).replace(':00', ''), xTip: hhmm, yFmt: (v) => v + 'mg', tipFmt: (v) => Math.round(v) + ' mg', vlines: [{ x: bed, label: 'bedtime', color: '#ffd978' }], yMax: Math.max(50, Math.ceil(Math.max(...pts.map((p) => p.y)) / 50) * 50) });
      draw(anim);
      const atBed = level(bed, hl), chai = atBed / 40;
      let halfAt = null; for (let h = bed; h < bed + 24; h += .25) { if (level(h, hl) <= atBed / 2) { halfAt = h; break; } }
      $('#caff-note').innerHTML = !day.length ? 'No caffeine today. Your adenosine is unmasked and doing its job.' : atBed < 8 ? `At bedtime you have about <b>${Math.round(atBed)} mg</b> left. Basically clear. Nicely done.` : `At bedtime you still have about <b>${Math.round(atBed)} mg</b> of caffeine in your body, roughly <b>${chai >= .95 && chai < 1.05 ? 'one cup of chai' : chai.toFixed(1) + ' cups of chai'}</b>’ worth.${halfAt ? ` Half of that will still be there at <b>${hhmm(halfAt)}</b>.` : ''}`;
    };
    ['cf-bed', 'cf-hl'].forEach((id) => $('#' + id).addEventListener('input', () => run(false)));
    $('#cf-clear').onclick = () => { day = []; renderDay(); run(false); };
    renderDay(); run(false); redraws.push((a) => draw && draw(a)); reveal(host, () => run(true));
  })();

  /* ═════════ 7. bedroom builder ═════════ */
  (() => {
    const svg = $('#room-svg'); if (!svg) return;
    svg.innerHTML = `
      <defs><radialGradient id="lampg" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#ffd978" stop-opacity=".55"/><stop offset="1" stop-color="#ffd978" stop-opacity="0"/></radialGradient>
      <radialGradient id="streetg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#ffb35c" stop-opacity=".9"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
      <radialGradient id="phoneg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fc4ff" stop-opacity=".7"/><stop offset="1" stop-color="#8fc4ff" stop-opacity="0"/></radialGradient></defs>
      <rect width="460" height="320" fill="#1b2250"/><rect y="250" width="460" height="70" fill="#121735"/>
      <rect id="r-warm" width="460" height="320" fill="#ff8a3d" opacity="0"/>
      <g transform="translate(40 50)"><rect width="120" height="110" rx="6" fill="#0c1033" stroke="#2b3570" stroke-width="5"/><circle cx="86" cy="30" r="12" fill="#ffe39a"/><circle id="r-street" cx="30" cy="80" r="40" fill="url(#streetg)"/><line x1="60" y1="0" x2="60" y2="110" stroke="#2b3570" stroke-width="4"/>
        <rect id="r-curL" x="-8" y="-6" width="20" height="124" rx="4" fill="#5b4bb5"/><rect id="r-curR" x="108" y="-6" width="20" height="124" rx="4" fill="#5b4bb5"/></g>
      <g transform="translate(325 22)"><line x1="0" y1="-22" x2="0" y2="0" stroke="#2b3570" stroke-width="4"/><g id="r-fan"><ellipse cx="-34" cy="0" rx="32" ry="6" fill="#3a4486"/><ellipse cx="34" cy="0" rx="32" ry="6" fill="#3a4486"/></g><circle r="7" fill="#4b56a0"/></g>
      <g transform="translate(408 60)"><rect x="-7" y="0" width="14" height="70" rx="7" fill="#2b3570"/><rect id="r-merc" x="-3" y="20" width="6" height="46" rx="3" fill="#e8604f"/><circle cy="72" r="11" id="r-bulb" fill="#e8604f"/><text id="r-temp" x="0" y="-8" text-anchor="middle" font-family="DM Mono" font-size="13" fill="#f4efe6">29°</text></g>
      <g transform="translate(82 200)"><rect width="56" height="50" rx="4" fill="#2b3570"/><rect x="4" y="18" width="48" height="3" fill="#1b2250"/>
        <g id="r-lamp"><circle cx="18" cy="-26" r="60" fill="url(#lampg)"/><path d="M6-30h24l6 22H0z" fill="#ffd978"/><rect x="16" y="-8" width="4" height="8" fill="#a98a4a"/></g>
        <g id="r-lampoff" opacity="0"><path d="M6-30h24l6 22H0z" fill="#4b56a0"/><rect x="16" y="-8" width="4" height="8" fill="#3a4486"/></g>
        <g id="r-phone"><circle cx="44" cy="-6" r="22" fill="url(#phoneg)"/><rect x="38" y="-12" width="12" height="9" rx="2" fill="#8fc4ff"/></g>
        <g id="r-clock"><rect x="30" y="-12" width="0" height="0"/></g></g>
      <g transform="translate(160 170)"><rect x="0" y="0" width="16" height="84" rx="4" fill="#3a2f7a"/><rect x="10" y="40" width="250" height="44" rx="10" fill="#2a2160"/>
        <rect x="22" y="26" width="64" height="24" rx="12" fill="#e8e3ff"/><g id="r-head"><circle cx="58" cy="22" r="17" fill="#f2c9a0"/><path d="M41 18q17-18 34 0" fill="#3a2a2a"/><g id="r-eyesC"><path d="M50 24q3 3 6 0M62 24q3 3 6 0" stroke="#3a2a2a" stroke-width="2" fill="none" stroke-linecap="round"/></g><g id="r-eyesO" opacity="0"><circle cx="53" cy="23" r="2.2" fill="#3a2a2a"/><circle cx="65" cy="23" r="2.2" fill="#3a2a2a"/><path d="M54 31h8" stroke="#3a2a2a" stroke-width="2"/></g></g>
        <path d="M76 34h178q8 0 8 10v30H70z" fill="#7c6cf0"/><path d="M76 34h178q8 0 8 10v6H72z" fill="#9a8cff"/>
        <g id="r-net" opacity="0"><path d="M0-60 L270-60 L270 84 L0 84Z" fill="#e8e3ff" opacity=".08" stroke="#e8e3ff" stroke-opacity=".35" stroke-dasharray="3 4"/></g></g>
      <g id="r-mosq"><circle r="2.4" fill="#f4efe6"/><path d="M-5-3l5 2M5-3l-5 2" stroke="#f4efe6" stroke-width="1"/></g>
      <g id="r-zzz" font-family="Fraunces" font-weight="800" fill="#e8e3ff" opacity="0"><text x="240" y="160" font-size="16">z</text><text x="252" y="146" font-size="21">z</text><text x="268" y="128" font-size="27">Z</text></g>`;
    const T = [
      ['blackout', 'Blackout curtains', 14], ['phone', 'Phone outside the room', 16], ['lamp', 'Lamps off, lights dim', 12], ['noise', 'Fan / white noise', 8],
      ['net', 'Mosquito net or repellent', 8], ['bed', 'Bed used only for sleep', 10], ['pillow', 'Comfy pillow & mattress', 6], ['clock', 'Clock turned away', 4],
    ];
    const on = { blackout: false, phone: false, lamp: false, noise: false, net: false, bed: false, pillow: false, clock: false };
    const tg = $('#rm-toggles');
    T.forEach(([k, n]) => { const b = el('button', 'tg', `<span class="sw"></span>${n}`); b.setAttribute('aria-pressed', 'false'); b.onclick = () => { on[k] = !on[k]; b.classList.toggle('on', on[k]); b.setAttribute('aria-pressed', on[k]); run(); }; tg.append(b); });
    const q = (id) => svg.querySelector('#' + id);
    let fanAnim = null, mosqAnim = null;
    const run = () => {
      const t = val('rm-t'); out('rm-t', t + '°C');
      const tScore = t <= 15 ? 12 : t <= 24 ? 22 : t <= 26 ? 16 : t <= 28 ? 8 : t <= 30 ? 3 : 0;
      const score = tScore + T.reduce((s, [k, , p]) => s + (on[k] ? p : 0), 0);
      q('r-temp').textContent = t + '°'; const hot = clamp((t - 18) / 14, 0, 1);
      const col = mix('#2fa881', '#e8604f', hot); q('r-merc').setAttribute('fill', col); q('r-bulb').setAttribute('fill', col);
      q('r-merc').setAttribute('y', 66 - (10 + hot * 46)); q('r-merc').setAttribute('height', 10 + hot * 46);
      q('r-warm').setAttribute('opacity', (hot * .16).toFixed(3));
      q('r-curL').setAttribute('width', on.blackout ? 66 : 20); q('r-curR').setAttribute('x', on.blackout ? 62 : 108); q('r-curR').setAttribute('width', on.blackout ? 66 : 20);
      q('r-street').setAttribute('opacity', on.blackout ? 0 : 1);
      q('r-phone').setAttribute('opacity', on.phone ? 0 : 1);
      q('r-lamp').setAttribute('opacity', on.lamp ? 0 : 1); q('r-lampoff').setAttribute('opacity', on.lamp ? 1 : 0);
      q('r-net').setAttribute('opacity', on.net ? 1 : 0);
      if (!RM) {
        if (on.noise && !fanAnim) fanAnim = q('r-fan').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, iterations: Infinity });
        if (!on.noise && fanAnim) { fanAnim.cancel(); fanAnim = null; }
        const m = q('r-mosq');
        if (!on.net && !mosqAnim) mosqAnim = m.animate([{ transform: 'translate(250px,120px)' }, { transform: 'translate(290px,100px)' }, { transform: 'translate(230px,150px)' }, { transform: 'translate(270px,170px)' }, { transform: 'translate(250px,120px)' }], { duration: 2600, iterations: Infinity });
        if (on.net && mosqAnim) { mosqAnim.cancel(); mosqAnim = null; }
        m.setAttribute('opacity', on.net ? 0 : 1);
      } else q('r-mosq').setAttribute('opacity', on.net ? 0 : 1);
      const asleep = score >= 70;
      q('r-eyesC').setAttribute('opacity', asleep ? 1 : 0); q('r-eyesO').setAttribute('opacity', asleep ? 0 : 1); q('r-zzz').setAttribute('opacity', asleep ? 1 : 0);
      $('#rs-fill').style.strokeDashoffset = (326.7 * (1 - score / 100)).toFixed(1);
      $('#rs-fill').style.stroke = score >= 70 ? '#7fe0c3' : score >= 40 ? '#ffd978' : '#e8604f';
      $('#rs-n').textContent = score;
      $('#rs-l').textContent = score >= 85 ? 'Sleep sanctuary. The cat approves.' : score >= 70 ? 'Very good. Out like a light.' : score >= 40 ? 'Getting there. Tossing and turning.' : 'Wide awake and sweating.';
      const tips = []; if (t > 26) tips.push('it’s too warm'); if (!on.phone) tips.push('the phone is glowing on the nightstand'); if (!on.blackout) tips.push('streetlight is leaking in'); if (!on.net) tips.push('a mosquito is plotting');
      $('#rm-note').innerHTML = tips.length ? `Still keeping you up: ${tips.join(', ')}.` : 'Cool, dark, quiet and boring. Perfect.';
    };
    $('#rm-t').addEventListener('input', run); run();
  })();

  /* ═════════ 8. the day timeline ═════════ */
  (() => {
    const line = $('#day-line'); if (!line) return;
    const S = [
      [7, '⏰', 'Wake at the same time, every day', 'The #1 habit', 'A consistent wake-up time is the anchor for your whole body clock, more important than a consistent bedtime. Keep it within about an hour, weekends included. Your bedtime will start to settle naturally.'],
      [7.5, '☀️', 'Get outside light, early', 'Top 3', 'Ten to thirty minutes of outdoor light within an hour or two of waking (longer if it’s cloudy) tells your master clock the day has begun and sets up sleepiness that night. A walk, a balcony chai, a commute on foot all count. Sunglasses off if it’s safe.'],
      [10, '🏃', 'Move your body', 'Top 5', 'Regular exercise helps you fall asleep faster and sleep more deeply. Any time of day works for most people; only very intense exercise in the hour before bed delays sleep for some. Daytime activity also builds healthy sleep pressure.'],
      [14, '☕', 'Caffeine curfew', 'Top 3', 'Make your last caffeine roughly 8 hours before bed, so around 2 or 3 p.m. for an 11 p.m. bedtime. Remember chai, cola, green tea, energy drinks and dark chocolate all count.'],
      [14.5, '😴', 'Nap smart, or not at all', 'Optional', 'If you nap, keep it to 10–20 minutes and finish before about 3 p.m., so you don’t steal sleep pressure from the night. If you struggle with insomnia, skip naps entirely.'],
      [20, '🍛', 'Dinner and drinks done', 'Top 5', 'Finish heavy meals and alcohol two to three hours before bed. Digestion and alcohol both disrupt the second half of the night, and lying down on a full stomach invites reflux.'],
      [21.5, '💡', 'Dim the lights, cool the room', 'Top 5', 'Switch to warm, low lamps and drop the bedroom temperature. Dim light lets melatonin rise on schedule. A warm shower now helps too: the cool-down afterwards is a sleep signal.'],
      [22, '📵', 'Wind-down hour', 'Top 3', 'Phone on charge outside the bedroom. Write tomorrow’s to-do list to empty your head. Read a paper book, stretch, talk, listen to something calm. You can’t go from 100 to 0; give yourself a runway.'],
      [23, '🛏️', 'Lights out', 'Every night', 'Go to bed when you’re sleepy, at roughly the same time. If you’re not asleep in what feels like 20 minutes, get up and do something calm in dim light until you are. Then try again.'],
    ];
    const P = (i) => 3 + i / (S.length - 1) * 94;
    S.forEach(([h, ico, t], i) => { const b = el('button', 'stop', `${ico}<small>${hhmm(h)}</small>`); b.style.left = P(i) + '%'; b.setAttribute('aria-label', `${hhmm(h)}: ${t}`); b.onclick = () => set(i); line.append(b); });
    const stops = $$('.stop', line), card = $('#day-card'), sunEl = $('#day-sun');
    let cur = 0;
    const set = (i) => {
      cur = i; const [h, ico, t, rank, d] = S[i];
      stops.forEach((s, k) => s.classList.toggle('on', k === i));
      sunEl.style.left = P(i) + '%'; sunEl.classList.toggle('night', h >= 20);
      card.innerHTML = `<span class="big-ico">${ico}</span><p class="when">${hhmm(h)}</p><h3>${t}<span class="rank">${rank}</span></h3><p>${d}</p><div class="day-nav" style="grid-column:1/-1"><button class="btn ghost small" id="dn-p" ${i === 0 ? 'disabled' : ''}>← Earlier</button><button class="btn small" id="dn-n" ${i === S.length - 1 ? 'disabled' : ''}>Later →</button></div>`;
      $('#dn-p').onclick = () => set(Math.max(0, cur - 1)); $('#dn-n').onclick = () => set(Math.min(S.length - 1, cur + 1));
    };
    set(0);
  })();

  /* ═════════ 9. breathing ═════════ */
  (() => {
    const orb = $('#br-orb'); if (!orb) return;
    const M = {
      sigh: { cap: 'Cyclic sighing: a deep breath in through the nose, a short extra sip of air on top, then a long, slow exhale through the mouth. Five minutes is plenty.', ph: [['Breathe in', 2, 1.55], ['Top up', 1, 1.75], ['Long exhale', 6, 1]] },
      '478': { cap: '4-7-8: in through the nose for 4, hold for 7, out through the mouth for 8. The long hold and exhale slow everything down. Four rounds is a good start.', ph: [['Breathe in', 4, 1.7], ['Hold', 7, 1.7], ['Breathe out', 8, 1]] },
      box: { cap: 'Box breathing: in for 4, hold for 4, out for 4, hold for 4. Used by pilots, athletes and the military to stay calm under pressure.', ph: [['Breathe in', 4, 1.7], ['Hold', 4, 1.7], ['Breathe out', 4, 1], ['Hold', 4, 1]] },
    };
    let mode = 'sigh', running = false, token = 0;
    const word = $('#br-word'), prog = $('#br-prog'), capEl = $('#br-cap'), go = $('#br-go');
    const setS = (s, t) => { orb.style.setProperty('--t', t + 's'); orb.style.setProperty('--s', s); };
    const stop = () => { running = false; token++; setS(1, .8); word.textContent = 'Ready'; go.textContent = 'Start breathing'; prog.style.transition = 'none'; prog.style.strokeDashoffset = 578; };
    const loop = async (tk) => {
      while (running && tk === token) {
        const ph = M[mode].ph, total = ph.reduce((a, p) => a + p[1], 0);
        prog.style.transition = 'none'; prog.style.strokeDashoffset = 578; void prog.getBoundingClientRect();
        prog.style.transition = `stroke-dashoffset ${total}s linear`; prog.style.strokeDashoffset = 0;
        for (const [w, d, s] of ph) { if (!running || tk !== token) return; word.textContent = w; setS(s, d); await wait(d * 1000); }
      }
    };
    $$('#br-tabs button').forEach((b) => b.onclick = () => { $$('#br-tabs button').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.m; capEl.textContent = M[mode].cap; if (running) { stop(); running = true; go.textContent = 'Stop'; loop(token); } });
    go.onclick = () => { if (running) stop(); else { running = true; go.textContent = 'Stop'; loop(token); } };
    capEl.textContent = M[mode].cap;
    if (io) new IntersectionObserver(([e]) => { if (!e.isIntersecting && running) stop(); }).observe(orb);
  })();

  /* ═════════ 10a. myths ═════════ */
  (() => {
    const root = $('#myths'); if (!root) return;
    const M = [
      ['You can catch up on all your lost sleep at the weekend.', 'myth', 'Sleeping in helps a bit, but studies suggest it doesn’t fully reverse a week of short nights, and it creates social jet lag that makes Monday worse.'],
      ['A nightcap helps you sleep better.', 'myth', 'Alcohol helps you fall asleep, then fragments the second half of the night and suppresses REM. You sleep more, but worse.'],
      ['Older people need much less sleep.', 'myth', 'Need drops only slightly (to about 7–8 hours). What changes is that sleep gets lighter and more broken, so older adults often get less than they need.'],
      ['Snoring is harmless.', 'both', 'Often it is. But loud snoring with pauses, gasping or daytime exhaustion can signal sleep apnoea, which is serious and very treatable.'],
      ['Waking a sleepwalker is dangerous.', 'myth', 'It won’t harm them, though they may be confused or startled. The kindest move is to gently guide them back to bed.'],
      ['Teenagers who sleep late are just lazy.', 'myth', 'Puberty shifts the body clock later, so teens genuinely can’t fall asleep early. It’s biology, which is why later school start times help.'],
      ['Exercise helps you sleep.', 'fact', 'Regular physical activity helps you fall asleep faster and get more deep sleep. Only very intense workouts right before bed delay sleep for some people.'],
      ['Your brain switches off while you sleep.', 'myth', 'In REM, parts of the brain are as active as when you’re awake. Sleep is a busy, organised state, not a shutdown.'],
      ['Counting sheep helps you fall asleep.', 'myth', 'In a 2002 Oxford study, insomniacs who imagined a calm, detailed scene (a waterfall, a beach) fell asleep faster than those told to count sheep, who if anything took a little longer than usual.'],
      ['A warm shower before bed can help.', 'fact', 'A warm shower or bath an hour or two before bed draws heat to your skin, and the cool-down afterwards helps trigger sleepiness.'],
    ];
    M.forEach(([q, a, exp], i) => {
      const d = el('div', 'my rv'); d.style.setProperty('--d', (i % 3) * .06 + 's');
      const vt = a === 'myth' ? 'Myth' : a === 'fact' ? 'Fact' : 'Half true';
      d.innerHTML = `<div class="my-in"><div class="my-f"><p class="n">${String(i + 1).padStart(2, '0')} / 10</p><p class="q">${q}</p><div class="my-btns"><button data-g="myth">Myth</button><button data-g="fact">Fact</button></div></div><div class="my-b"><p class="verdict ${a}">${vt}</p><p>${exp}</p><p class="you"></p></div></div>`;
      $$('.my-btns button', d).forEach((b) => (b.onclick = () => { const ok = a === 'both' || b.dataset.g === a; const y = $('.you', d); y.textContent = ok ? '✓ You got it' : '✗ Not quite'; y.className = 'you ' + (ok ? 'ok' : 'no'); d.classList.add('flip'); }));
      $('.my-b', d).addEventListener('click', () => d.classList.remove('flip'));
      root.append(d); reveal(d);
    });
  })();

  /* ═════════ 10b. zoo ═════════ */
  (() => {
    const root = $('#zoo-bars'); if (!root) return;
    const Z = [['🦇', 'Little brown bat', 19.9, 'Hunts insects for a few hours around dusk, sleeps most of the rest.'], ['🐍', 'Python', 18, 'After a big meal, why move?'], ['🐯', 'Tiger', 15.8, 'Big predators that can eat a lot at once can afford long rests.'], ['🐈', 'Cat', 12.1, 'Cat naps add up. The one on the moon is an expert.'], ['🐕', 'Dog', 10.1, 'Mostly in short bouts through the day and night.'], ['🧑', 'Human', 8, 'Or at least, that’s the goal.', 1], ['🐄', 'Cow', 4, 'Can doze standing up, but needs to lie down for REM.'], ['🐎', 'Horse', 2.9, 'Locks its legs to doze standing; lies down briefly for REM.'], ['🐘', 'Wild elephant', 2, 'The shortest sleep recorded in any mammal. Sometimes skips a night entirely.'], ['🦒', 'Giraffe', 1.9, 'Sleeps in short bursts, sometimes only minutes long.']];
    Z.forEach(([e, n, h, f, you], i) => { const d = el('div', 'zb' + (you ? ' human' : ''), `<span><em>${e}</em>${n}</span><div class="zb-t"><div class="zb-b" style="width:${h / 20 * 100}%;transition-delay:${i * .06}s">${h}h</div></div>`); bindTip(d, () => `${e} ${n}: <b>~${h} h/day</b><br>${f}`); root.append(d); });
    reveal(root);
  })();

  /* ═════════ 11. tonight's plan ═════════ */
  (() => {
    const list = $('#pl-list'); if (!list) return;
    const P = [['⏰', 'Same wake-up time, weekends too (within an hour)'], ['☀️', '10–30 minutes of outdoor light every morning'], ['☕', 'Last caffeine by early afternoon'], ['🍷', 'No alcohol in the 3 hours before bed'], ['🍛', 'Dinner finished 2–3 hours before bed'], ['💡', 'Lights dimmed an hour before bed'], ['📵', 'Phone charging outside the bedroom'], ['📝', 'A five-minute to-do list before bed'], ['🌡️', 'Room cool, dark and quiet'], ['🚶', 'Can’t sleep after ~20 minutes? Get up'], ['😴', 'Naps short (10–20 min) and before 3 PM'], ['🩺', 'Snoring with gasping, or months of insomnia → see a doctor']];
    const KEY = 'lrn-sleep-plan'; let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
    P.forEach(([ic, t], i) => { const li = el('li'); li.innerHTML = `<input type="checkbox" id="pl-${i}" ${saved.includes(i) ? 'checked' : ''}><label for="pl-${i}"><span class="ic">${ic}</span><span class="t">${t}</span></label>`; list.append(li); });
    const boxes = $$('input', list), L = ['Start with the first one. It’s the most important.', 'Good start.', 'Your body clock is noticing.', 'Halfway to great sleep.', 'Nearly there.', 'All set. Sweet dreams.'];
    const upd = () => { const on = boxes.filter((b) => b.checked).length, n = boxes.length; $('#pl-fill').style.strokeDashoffset = (326.7 * (1 - on / n)).toFixed(1); $('#pl-n').textContent = `${on} / ${n}`; $('#pl-l').textContent = L[on === n ? 5 : Math.min(4, Math.ceil(on / n * 4))]; try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0))); } catch (e) { /* storage unavailable */ } };
    boxes.forEach((b) => b.addEventListener('change', upd)); $('#pl-reset').onclick = () => { boxes.forEach((b) => (b.checked = false)); upd(); }; upd();
  })();
})();

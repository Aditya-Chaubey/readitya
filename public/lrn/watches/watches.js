/* lrn — The Machine on Your Wrist. Every watch on this page is drawn in code. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = { gold: '#c9a96e', gold2: '#e8d5a8', lume: '#b8f5a6', red: '#e5484d', steel: '#cfd3d9', ink: '#16181b' };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let uid = 0;

  /* ───────── shared helpers ───────── */
  const redraws = [];
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => redraws.forEach((f) => f()), 150); });
  const pending = [];
  function onSeen(el, fn, margin = '250px') {
    let done = false;
    const run = () => { if (!done) { done = true; io.disconnect(); fn(); } };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && run()), { rootMargin: margin });
    io.observe(el);
    pending.push(run);
  }
  addEventListener('load', () => setTimeout(() => pending.forEach((r, i) => setTimeout(r, i * 100)), 2000));
  // run a frame loop only while an element is on screen
  function loopWhileVisible(el, frame) {
    let on = false, raf = 0;
    const tick = (t) => { frame(t); if (on) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(tick);
    }, { rootMargin: '100px' }).observe(el);
    return () => frame(performance.now());
  }
  function sizeCanvas(cv) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }
  function syncFill(i) { i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'); }
  $$('input[type=range]').forEach((i) => { syncFill(i); i.addEventListener('input', () => syncFill(i)); });
  function segGroup(sel, attr, cb) {
    const btns = $$(sel);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cb(b.dataset[attr], b);
    }));
  }
  const bar = $('#progress');
  addEventListener('scroll', () => {
    const m = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
  }, { passive: true });
  $$('.fig, .mv, .care > div, .bcard, blockquote.pull, .wr-table').forEach((e) => e.classList.add('reveal'));
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((e) => rio.observe(e));

  /* ───────── audio (only after a user gesture) ───────── */
  let AC = null;
  const audio = () => (AC ||= new (window.AudioContext || window.webkitAudioContext)());
  function tick(vol = 0.25) {
    const ac = audio(), t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.012);
    const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = 3;
    const g = ac.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(ac.destination); src.start(t);
  }
  function gong(at, freq, vol = 0.35) {
    const ac = audio();
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq * m;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol / (i * 2.5 + 1), at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + (i ? 0.5 : 1.6));
      o.connect(g).connect(ac.destination); o.start(at); o.stop(at + 1.7);
    });
  }

  /* ═════════ THE WATCH RENDERER ═════════ */
  const CASES = {
    steel: ['#f4f6f8', '#a3aab2', '#e6e9ec', '#6e757d'],
    gold: ['#f8e6ad', '#b98c3e', '#f1d792', '#86611f'],
    black: ['#5a5f66', '#1d2024', '#3a3e44', '#0d0f11'],
  };
  function polar(r, deg) { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  const f1 = (n) => +n.toFixed(2);

  function handPath(kind, len, w, tail = 0) {
    switch (kind) {
      case 'dauphine': return `M0 ${tail} L${-w} -2 L0 ${-len} L${w} -2 Z`;
      case 'baton': return `M${-w / 2} ${tail} L${-w / 2} ${-len} L${w / 2} ${-len} L${w / 2} ${tail} Z`;
      case 'pencil': return `M${-w / 2} ${tail} L${-w / 2} ${-len + w} L0 ${-len} L${w / 2} ${-len + w} L${w / 2} ${tail} Z`;
      case 'leaf': return `M0 ${tail} Q${-w * 1.4} ${-len * 0.45} 0 ${-len} Q${w * 1.4} ${-len * 0.45} 0 ${tail} Z`;
      default: return `M${-w * 0.45} ${tail} L${-w} ${-len * 0.72} L0 ${-len} L${w} ${-len * 0.72} L${w * 0.45} ${tail} Z`; // sword
    }
  }

  function watchSVG(opt = {}) {
    const o = {
      id: 'w' + uid++, dial: '#141a20', dial2: '#232b33', caseC: 'steel', bezel: 'none', bezelC: '#121417',
      idx: 'baton', hands: 'sword', lume: true, date: false, subs: 0, smallSec: false, gmt: false,
      strap: '#1d1d1f', bracelet: false, crown: 'plain', guards: false, pushers: false, shape: 'round',
      top: '', bot: '', secHand: true, texture: '', idxC: '#f1ece2', handC: '#f1ece2', parts: false,
      extra: '', over: '', bezelText: '', size: 'm', ...opt,
    };
    const id = o.id, cc = CASES[o.caseC], P = (name, s) => (o.parts ? `<g class="anat-part" data-part="${name}">${s}</g>` : s);
    const integ = o.shape === 'octagon';
    let s = `<svg viewBox="-150 -195 300 390" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cc[0]}"/><stop offset=".45" stop-color="${cc[1]}"/><stop offset=".7" stop-color="${cc[2]}"/><stop offset="1" stop-color="${cc[3]}"/></linearGradient>
      <linearGradient id="${id}-c2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cc[2]}"/><stop offset="1" stop-color="${cc[3]}"/></linearGradient>
      <radialGradient id="${id}-d" cx=".42" cy=".35" r=".8"><stop offset="0" stop-color="${o.dial2}"/><stop offset="1" stop-color="${o.dial}"/></radialGradient>
      <linearGradient id="${id}-x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".06"/></linearGradient>
      <linearGradient id="${id}-st" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${o.strap}" stop-opacity=".75"/><stop offset=".5" stop-color="${o.strap}"/><stop offset="1" stop-color="${o.strap}" stop-opacity=".7"/></linearGradient>
      <clipPath id="${id}-dc"><circle r="${o.bezel === 'none' ? 91 : 86}"/></clipPath>
    </defs>`;

    /* strap / bracelet */
    let st = '';
    if (o.bracelet) {
      for (const dir of [-1, 1]) {
        for (let k = 0; k < 7; k++) {
          const y0 = dir * (integ ? 96 : 112) + dir * k * 13;
          const yy = dir > 0 ? y0 : y0 - 12;
          const w = integ ? 86 - k * 1.2 : 78 - k * 0.8;
          st += `<rect x="${-w / 2}" y="${yy}" width="${w * 0.27}" height="12" rx="2" fill="url(#${id}-c2)"/><rect x="${-w * 0.21}" y="${yy}" width="${w * 0.42}" height="12" rx="2" fill="url(#${id}-c)"/><rect x="${w * 0.23}" y="${yy}" width="${w * 0.27}" height="12" rx="2" fill="url(#${id}-c2)"/>`;
        }
      }
    } else {
      const lw = o.shape === 'tank' ? 64 : 76;
      st += `<path d="M${-lw / 2} -100 L${-lw / 2 + 4} -195 L${lw / 2 - 4} -195 L${lw / 2} -100 Z M${-lw / 2} 100 L${-lw / 2 + 4} 195 L${lw / 2 - 4} 195 L${lw / 2} 100 Z" fill="url(#${id}-st)"/>`;
      if (o.stitch !== false) st += `<path d="M${-lw / 2 + 6} -110 L${-lw / 2 + 9} -195 M${lw / 2 - 6} -110 L${lw / 2 - 9} -195 M${-lw / 2 + 6} 110 L${-lw / 2 + 9} 195 M${lw / 2 - 6} 110 L${lw / 2 - 9} 195" stroke="${o.stitchC || 'rgba(255,255,255,.28)'}" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>`;
      if (o.nato) st += `<path d="M${-lw / 2} -160 h${lw} M${-lw / 2} -150 h${lw} M${-lw / 2} 150 h${lw} M${-lw / 2} 160 h${lw}" stroke="${o.nato}" stroke-width="5"/>`;
    }
    s += P('strap', st);

    /* lugs */
    if (!integ && o.shape !== 'tank') {
      let lg = '';
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        lg += `<path d="M${sx * 30} ${sy * 70} L${sx * 33} ${sy * 120} Q${sx * 42} ${sy * 126} ${sx * 50} ${sy * 120} L${sx * 56} ${sy * 72} Z" fill="url(#${id}-c)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`;
      }
      s += P('lugs', lg);
    }

    /* crown & pushers */
    let cr = '';
    if (o.shape === 'tank') {
      cr += `<rect x="78" y="-9" width="12" height="18" rx="3" fill="url(#${id}-c)"/><polygon points="90,-6 97,0 90,6" fill="#3557c4"/>`;
    } else {
      const big = o.crown === 'onion';
      const cw = big ? 20 : 15, ch = big ? 34 : 24, cx = integ ? 106 : 100;
      if (o.guards) cr += `<path d="M${cx - 4} -26 Q${cx + 14} -24 ${cx + 12} -14 L${cx - 2} -12 Z M${cx - 4} 26 Q${cx + 14} 24 ${cx + 12} 14 L${cx - 2} 12 Z" fill="url(#${id}-c)"/>`;
      cr += `<rect x="${cx}" y="${-ch / 2}" width="${cw}" height="${ch}" rx="${big ? 6 : 3}" fill="url(#${id}-c)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`;
      for (let k = 1; k < (big ? 8 : 6); k++) cr += `<line x1="${cx + 3}" x2="${cx + cw - 2}" y1="${-ch / 2 + k * ch / (big ? 8 : 6)}" y2="${-ch / 2 + k * ch / (big ? 8 : 6)}" stroke="rgba(0,0,0,.25)" stroke-width="1"/>`;
      if (o.pushers) for (const a of [-38, 38]) {
        const [x, y] = polar(102, 90 + a);
        cr += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><rect x="-2" y="-8" width="14" height="16" rx="3" fill="url(#${id}-c)" stroke="rgba(0,0,0,.25)" stroke-width=".6"/></g>`;
      }
    }
    s += P('crown', cr);

    /* case */
    let cs = '';
    if (integ) {
      const pts = Array.from({ length: 8 }, (_, k) => polar(112, 22.5 + k * 45).map(f1).join(',')).join(' ');
      cs += `<path d="M-60 -92 L60 -92 L112 -40 L112 40 L60 92 L-60 92 L-112 40 L-112 -40 Z" fill="url(#${id}-c)"/><polygon points="${pts}" transform="scale(.93)" fill="url(#${id}-c2)"/>`;
    } else if (o.shape === 'tank') {
      cs += `<rect x="-80" y="-104" width="160" height="208" rx="10" fill="url(#${id}-c)"/><rect x="-62" y="-96" width="124" height="192" rx="4" fill="url(#${id}-c2)"/>`;
    } else if (o.shape === 'cushion') {
      cs += `<rect x="-104" y="-104" width="208" height="208" rx="48" fill="url(#${id}-c)"/>`;
    } else {
      cs += `<circle r="104" fill="url(#${id}-c)"/><circle r="104" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;
    }
    s += P('case', cs);

    /* bezel */
    let bz = '';
    if (o.shape === 'tank') {
      // no bezel
    } else if (o.bezel === 'diver' || o.bezel === 'gmt' || o.bezel === 'tachy' || o.bezel === 'count') {
      bz += `<circle r="99" fill="${o.bezelC}"/><circle r="99" fill="none" stroke="url(#${id}-c)" stroke-width="3"/>`;
      if (o.bezel === 'gmt') {
        bz += `<path d="M-99 0 A99 99 0 0 1 99 0 L86 0 A86 86 0 0 0 -86 0 Z" fill="${o.gmtNight || '#1f2f6b'}"/><path d="M-99 0 A99 99 0 0 0 99 0 L86 0 A86 86 0 0 1 -86 0 Z" fill="${o.gmtDay || '#a3242c'}"/>`;
        for (let k = 0; k < 24; k++) {
          const [x, y] = polar(92.5, k * 15);
          if (k % 2 === 0) bz += `<text x="${f1(x)}" y="${f1(y)}" fill="#f2ede4" font-family="DM Mono, monospace" font-size="8.5" text-anchor="middle" dominant-baseline="central" transform="rotate(${k * 15} ${f1(x)} ${f1(y)})">${k === 0 ? '▼' : k}</text>`;
          else { const [a, b] = polar(89, k * 15), [c, d] = polar(96, k * 15); bz += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="#f2ede4" stroke-width="1.6"/>`; }
        }
      } else if (o.bezel === 'tachy') {
        bz += `<text font-family="DM Mono, monospace" font-size="5.5" fill="#f2ede4" letter-spacing="1.5"><textPath href="#${id}-tp" startOffset="73%">TACHYMETRE</textPath></text><path id="${id}-tp" d="M-92 0 A92 92 0 1 1 92 0 A92 92 0 1 1 -92 0" fill="none"/>`;
        for (const v of [500, 400, 300, 250, 200, 150, 120, 100, 90, 80, 70, 60]) {
          const ang = (3600 / v) * 6;
          const [x, y] = polar(92.5, ang);
          bz += `<text x="${f1(x)}" y="${f1(y)}" fill="#f2ede4" font-family="DM Mono, monospace" font-size="7" text-anchor="middle" dominant-baseline="central" transform="rotate(${f1(ang)} ${f1(x)} ${f1(y)})">${v}</text>`;
        }
      } else {
        for (let k = 0; k < 60; k++) {
          const ang = k * 6;
          if (k % 10 === 0 && k) { const [x, y] = polar(92.5, ang); bz += `<text x="${f1(x)}" y="${f1(y)}" fill="#f2ede4" font-family="DM Mono, monospace" font-size="10" text-anchor="middle" dominant-baseline="central" transform="rotate(${ang} ${f1(x)} ${f1(y)})">${k}</text>`; }
          else if (k === 0) { bz += `<polygon points="0,-88 -6,-97 6,-97" fill="#f2ede4"/><circle cy="-93.5" r="2" fill="${G.lume}"/>`; }
          else if (k < 15 || k % 5 === 0) { const [a, b] = polar(k % 5 ? 92 : 89, ang), [c, d] = polar(97, ang); bz += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="#f2ede4" stroke-width="${k % 5 ? 1 : 2}"/>`; }
        }
      }
      if (o.bezelRot) bz = `<g id="${id}-bz" transform="rotate(${o.bezelRot})">${bz}</g>`; else bz = `<g id="${id}-bz">${bz}</g>`;
    } else if (o.bezel === 'fluted') {
      bz += `<circle r="100" fill="url(#${id}-c)"/>`;
      for (let k = 0; k < 72; k++) { const [a, b] = polar(90, k * 5), [c, d] = polar(100, k * 5); bz += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="${k % 2 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.55)'}" stroke-width="2.2"/>`; }
    } else if (integ) {
      const pts = Array.from({ length: 8 }, (_, k) => polar(100, 22.5 + k * 45).map(f1).join(',')).join(' ');
      bz += `<polygon points="${pts}" fill="url(#${id}-c)" stroke="rgba(0,0,0,.2)"/>`;
      for (let k = 0; k < 8; k++) { const [x, y] = polar(93, 22.5 + k * 45); bz += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.4" fill="url(#${id}-c2)" stroke="rgba(0,0,0,.35)" stroke-width=".6"/><line x1="${f1(x - 2.4)}" y1="${f1(y)}" x2="${f1(x + 2.4)}" y2="${f1(y)}" stroke="rgba(0,0,0,.45)" stroke-width=".8"/>`; }
    } else {
      bz += `<circle r="${o.bezel === 'thin' ? 96 : 99}" fill="url(#${id}-c2)"/>`;
    }
    s += P('bezel', bz);

    /* dial */
    let dl = '';
    const DR = o.shape === 'tank' ? 0 : (o.bezel === 'none' || o.bezel === 'thin' || integ ? 91 : 86);
    if (o.shape === 'tank') dl += `<rect x="-58" y="-90" width="116" height="180" rx="2" fill="url(#${id}-d)"/>`;
    else dl += `<circle r="${DR}" fill="url(#${id}-d)"/>`;
    if (o.texture === 'tapisserie') {
      let t = ''; for (let k = -90; k <= 90; k += 7) t += `<line x1="${k}" y1="-91" x2="${k}" y2="91" stroke="rgba(0,0,0,.22)" stroke-width="2.4"/><line x1="-91" y1="${k}" x2="91" y2="${k}" stroke="rgba(0,0,0,.22)" stroke-width="2.4"/>`;
      dl += `<g clip-path="url(#${id}-dc)">${t}</g>`;
    } else if (o.texture === 'sunburst') {
      let t = ''; for (let k = 0; k < 120; k++) { const [x, y] = polar(95, k * 3); t += `<line x1="0" y1="0" x2="${f1(x)}" y2="${f1(y)}" stroke="rgba(255,255,255,${k % 2 ? 0.025 : 0.05})" stroke-width="2"/>`; }
      dl += `<g clip-path="url(#${id}-dc)">${t}</g>`;
    }
    if (o.shape !== 'tank') {
      // minute track
      const r0 = DR - 3;
      for (let k = 0; k < 60; k++) {
        const big = k % 5 === 0;
        const [a, b] = polar(r0 - (big ? 6 : 3.5), k * 6), [c, d] = polar(r0, k * 6);
        dl += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="${o.idxC}" stroke-opacity="${big ? 0.85 : 0.5}" stroke-width="${big ? 1.4 : 0.8}"/>`;
      }
    }
    s += P('dial', dl);

    /* indices */
    let ix = '';
    const lumeC = o.lume ? G.lume : o.idxC;
    const R1 = DR - 12;
    const skip = new Set();
    if (o.subs === 3) [3, 6, 9].forEach((h) => skip.add(h));
    if (o.subs === 2) [3, 9].forEach((h) => skip.add(h));
    if (o.smallSec) skip.add(6);
    if (o.date && !o.subs) skip.add(3);
    if (o.moon) skip.add(6);
    if (o.tourb) skip.add(6);
    if (o.shape === 'tank') {
      const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (let h = 0; h < 12; h++) {
        const a = (h * 30 - 90) * Math.PI / 180;
        const kx = 50 / Math.abs(Math.cos(a) || 1e-6), ky = 80 / Math.abs(Math.sin(a) || 1e-6);
        const r = Math.min(kx, ky) - 4;
        const x = r * Math.cos(a), y = r * Math.sin(a);
        ix += `<text x="${f1(x)}" y="${f1(y)}" font-family="DM Serif Display, Georgia, serif" font-size="${h % 3 === 0 ? 15 : 12}" fill="#1b1b1b" text-anchor="middle" dominant-baseline="central" transform="rotate(${h * 30} ${f1(x)} ${f1(y)})">${rom[h]}</text>`;
      }
      ix += `<rect x="-36" y="-58" width="72" height="116" fill="none" stroke="#1b1b1b" stroke-width=".7"/>`;
    } else {
      for (let h = 0; h < 12; h++) {
        if (skip.has(h === 0 ? 12 : h)) continue;
        const ang = h * 30;
        if (o.idx === 'baton' || o.idx === 'dagger') {
          const w = o.idx === 'dagger' ? 2.2 : 4.6, L = o.idx === 'dagger' ? 13 : 15;
          const g = h === 0 && o.idx === 'baton' ? `<rect x="-7" y="${-R1}" width="${w}" height="${L}" rx="1" fill="${lumeC}" stroke="${o.idxC}" stroke-width=".8"/><rect x="${7 - w}" y="${-R1}" width="${w}" height="${L}" rx="1" fill="${lumeC}" stroke="${o.idxC}" stroke-width=".8"/>`
            : `<rect x="${-w / 2}" y="${-R1}" width="${w}" height="${L}" rx="1" fill="${o.idx === 'dagger' ? o.idxC : lumeC}" stroke="${o.idxC}" stroke-width=".8"/>`;
          ix += `<g transform="rotate(${ang})">${g}</g>`;
        } else if (o.idx === 'dot') {
          if (h === 0) ix += `<polygon points="0,${-R1 + 16} -8,${-R1} 8,${-R1}" fill="${lumeC}" stroke="${o.idxC}" stroke-width="1.2"/>`;
          else if (h % 3 === 0) ix += `<g transform="rotate(${ang})"><rect x="-3.5" y="${-R1}" width="7" height="16" rx="1" fill="${lumeC}" stroke="${o.idxC}" stroke-width="1.2"/></g>`;
          else { const [x, y] = polar(R1 - 6, ang); ix += `<circle cx="${f1(x)}" cy="${f1(y)}" r="5.4" fill="${lumeC}" stroke="${o.idxC}" stroke-width="1.2"/>`; }
        } else if (o.idx === 'pilot') {
          if (h === 0) ix += `<polygon points="0,${-R1 + 18} -9,${-R1} 9,${-R1}" fill="${o.idxC}"/><circle cx="-12" cy="${-R1 + 4}" r="2.4" fill="${o.idxC}"/><circle cx="12" cy="${-R1 + 4}" r="2.4" fill="${o.idxC}"/>`;
          else { const [x, y] = polar(R1 - 9, ang); ix += `<text x="${f1(x)}" y="${f1(y)}" font-family="DM Mono, monospace" font-weight="500" font-size="19" fill="${o.idxC}" text-anchor="middle" dominant-baseline="central">${h}</text>`; }
        } else if (o.idx === 'field') {
          const [x, y] = polar(R1 - 8, ang); ix += `<text x="${f1(x)}" y="${f1(y)}" font-family="DM Mono, monospace" font-weight="500" font-size="15" fill="${o.idxC}" text-anchor="middle" dominant-baseline="central">${h || 12}</text>`;
          const [x2, y2] = polar(R1 - 26, ang); ix += `<text x="${f1(x2)}" y="${f1(y2)}" font-family="DM Mono, monospace" font-size="7" fill="${o.idxC}" fill-opacity=".7" text-anchor="middle" dominant-baseline="central">${h + 12}</text>`;
        } else if (o.idx === 'roman') {
          const rom = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
          const [x, y] = polar(R1 - 8, ang); ix += `<text x="${f1(x)}" y="${f1(y)}" font-family="DM Serif Display, Georgia, serif" font-size="13" fill="${o.idxC}" text-anchor="middle" dominant-baseline="central">${rom[h]}</text>`;
        } else if (o.idx === 'arabic') {
          const [x, y] = polar(R1 - 8, ang); ix += `<text x="${f1(x)}" y="${f1(y)}" font-family="DM Serif Display, Georgia, serif" font-size="17" fill="${o.idxC}" text-anchor="middle" dominant-baseline="central">${h || 12}</text>`;
        }
      }
    }
    if (o.top) ix += `<text y="${o.subs ? -46 : -40}" font-family="DM Serif Display, Georgia, serif" font-size="11" letter-spacing="2" fill="${o.idxC}" text-anchor="middle">${o.top}</text>`;
    if (o.bot) ix += `<text y="${o.subs === 3 ? 58 : o.smallSec || o.moon || o.tourb ? -26 : 42}" font-family="DM Mono, monospace" font-size="6" letter-spacing="1.6" fill="${o.idxC}" fill-opacity=".75" text-anchor="middle">${o.bot}</text>`;
    s += P('indices', ix);

    /* subdials, date, extras */
    let sb = '';
    const sub = (cx, cy, r, hid, labels) => {
      let t = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(0,0,0,.22)" stroke="${o.idxC}" stroke-opacity=".35"/>`;
      for (let k = 0; k < 12; k++) { const [a, b] = polar(r - 3, k * 30), [c, d] = polar(r - 0.5, k * 30); t += `<line x1="${f1(cx + a)}" y1="${f1(cy + b)}" x2="${f1(cx + c)}" y2="${f1(cy + d)}" stroke="${o.idxC}" stroke-opacity=".7" stroke-width=".8"/>`; }
      if (labels) labels.forEach((l, k) => { const [x, y] = polar(r - 8, k * (360 / labels.length)); t += `<text x="${f1(cx + x)}" y="${f1(cy + y)}" font-family="DM Mono, monospace" font-size="4.6" fill="${o.idxC}" fill-opacity=".8" text-anchor="middle" dominant-baseline="central">${l}</text>`; });
      t += `<g id="${id}-${hid}" transform="translate(${cx} ${cy})"><path d="M-0.9 3 L-0.9 ${-r + 3} L0.9 ${-r + 3} L0.9 3Z" fill="${o.subHandC || o.handC}"/><circle r="1.8" fill="${o.subHandC || o.handC}"/></g>`;
      return t;
    };
    if (o.subs === 3) { sb += sub(-38, 0, 17, 'sub9', ['60', '20', '40']); sb += sub(38, 0, 17, 'sub3', ['30', '10', '20']); sb += sub(0, 38, 17, 'sub6', ['12', '3', '6', '9']); }
    if (o.subs === 2) { sb += sub(-38, 0, 19, 'sub9', ['60', '20', '40']); sb += sub(38, 0, 19, 'sub3', ['30', '10', '20']); }
    if (o.smallSec) sb += sub(0, 42, 19, 'ss', ['60', '15', '30', '45']);
    if (o.date) {
      const [dx, dy] = o.subs ? [0, -54] : [58, 0];
      sb += `<rect x="${dx - 9}" y="${dy - 7.5}" width="18" height="15" rx="1.5" fill="#f6f3ec" stroke="${o.idxC}" stroke-opacity=".5"/><text id="${id}-date" x="${dx}" y="${dy + 0.6}" font-family="DM Mono, monospace" font-size="10" fill="#111" text-anchor="middle" dominant-baseline="central">${new Date().getDate()}</text>`;
    }
    sb += o.extra;
    s += P('subdials', sb);

    /* hands */
    let hd = '';
    const HC = o.handC, lm = o.lume ? G.lume : HC;
    if (o.gmt) hd += `<g id="${id}-g"><path d="M-1.1 10 L-1.1 -70 L1.1 -70 L1.1 10Z" fill="${o.gmtC || G.red}"/><polygon points="0,-84 -6,-68 6,-68" fill="${o.gmtC || G.red}"/><polygon points="0,-80 -3,-71 3,-71" fill="${lm}"/></g>`;
    if (o.hands === 'mercedes') {
      hd += `<g id="${id}-h"><path d="M-2.4 12 L-2.4 -30 L2.4 -30 L2.4 12Z" fill="${HC}"/><circle cy="-37" r="10" fill="${HC}"/><circle cy="-37" r="7.5" fill="${lm}"/><path d="M0 -37 L0 -44.5 M0 -37 L-6.5 -33.2 M0 -37 L6.5 -33.2" stroke="${HC}" stroke-width="2"/><polygon points="0,-58 -5,-46 5,-46" fill="${HC}"/></g>`;
      hd += `<g id="${id}-m"><path d="M-2.6 14 L-2.6 -64 L0 -74 L2.6 -64 L2.6 14Z" fill="${HC}"/><path d="M-1.4 -12 L-1.4 -62 L1.4 -62 L1.4 -12Z" fill="${lm}"/></g>`;
    } else {
      const k = o.hands;
      const hw = k === 'dauphine' ? 5 : k === 'baton' ? 5 : k === 'pencil' ? 6 : k === 'leaf' ? 4 : 6;
      hd += `<g id="${id}-h"><path d="${handPath(k, 48, hw, 10)}" fill="${HC}"/>${o.lume && k !== 'dauphine' && k !== 'leaf' ? `<path d="${handPath(k === 'sword' ? 'sword' : 'baton', 36, hw * 0.5, -10)}" fill="${lm}"/>` : ''}</g>`;
      hd += `<g id="${id}-m"><path d="${handPath(k, 74, hw * 0.85, 12)}" fill="${HC}"/>${o.lume && k !== 'dauphine' && k !== 'leaf' ? `<path d="${handPath(k === 'sword' ? 'sword' : 'baton', 60, hw * 0.42, -12)}" fill="${lm}"/>` : ''}</g>`;
    }
    if (o.secHand) {
      const SC = o.secC || (o.subs ? G.red : o.lume ? G.red : HC);
      hd += `<g id="${id}-s"><path d="M-0.7 22 L-0.7 -82 L0.7 -82 L0.7 22Z" fill="${SC}"/>${o.lume ? `<circle cy="-58" r="3.4" fill="${SC}"/><circle cy="-58" r="2" fill="${lm}"/>` : ''}<circle cy="16" r="3.2" fill="${SC}"/></g>`;
    }
    hd += `<circle r="4" fill="${o.secC || (o.subs || o.lume ? G.red : HC)}"/><circle r="1.6" fill="#222"/>`;
    s += P('hands', hd);
    s += o.over;
    s += P('crystal', o.shape === 'tank' ? `<rect x="-62" y="-96" width="124" height="192" rx="4" fill="url(#${id}-x)"/>` : `<circle r="${DR}" fill="url(#${id}-x)"/>`);
    s += '</svg>';
    return { svg: s, id };
  }

  function mount(el, opt) {
    const w = watchSVG(opt);
    el.innerHTML = w.svg;
    return w.id;
  }
  function rot(id, part, deg) {
    const e = document.getElementById(`${id}-${part}`);
    if (!e) return;
    const tr = e.getAttribute('transform') || '';
    const m = tr.match(/translate\([^)]*\)/);
    e.setAttribute('transform', (m ? m[0] + ' ' : '') + `rotate(${f1(deg)})`);
  }
  function setTime(id, d, secMode = 'sweep', vph = 28800) {
    const ms = d.getMilliseconds(), sec = d.getSeconds(), min = d.getMinutes(), hr = d.getHours() % 12;
    let sf;
    if (secMode === 'sweep') { const bps = vph / 3600; sf = sec + Math.floor((ms / 1000) * bps) / bps; }
    else if (secMode === 'quartz') sf = ms < 80 ? sec - 1 + ease(ms / 80) : sec;
    else sf = sec + ms / 1000;
    rot(id, 's', sf * 6);
    rot(id, 'm', (min + sec / 60) * 6);
    rot(id, 'h', (hr + min / 60) * 30);
  }

  /* ═════════ HERO ═════════ */
  (function hero() {
    const el = $('#hero-watch');
    const id = mount(el, { dial: '#0f1418', dial2: '#1f2a33', bezel: 'diver', bezelC: '#0f1216', idx: 'dot', hands: 'mercedes', date: true, bracelet: true, guards: true, top: 'lrn', bot: 'AUTOMATIC · 300M', texture: 'sunburst' });
    let mode = 'mech';
    segGroup('[data-hero]', 'hero', (v) => (mode = v));
    const t = $('#hero-time');
    loopWhileVisible(el, () => {
      const d = new Date();
      setTime(id, d, mode === 'mech' ? 'sweep' : 'quartz');
      t.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const de = document.getElementById(id + '-date'); if (de) de.textContent = d.getDate();
    });
  })();

  /* ═════════ CH1: ANATOMY ═════════ */
  (function anatomy() {
    const stage = $('#anat-stage'), list = $('#anat-list'), card = $('#anat-card');
    const id = mount(stage, { parts: true, dial: '#13324a', dial2: '#245276', bezel: 'diver', bezelC: '#0f2033', idx: 'dot', hands: 'mercedes', date: true, bracelet: false, strap: '#262a2f', guards: true, top: 'lrn', bot: 'AUTOMATIC · 200M', texture: 'sunburst' });
    const d0 = new Date(2026, 0, 1, 10, 9, 36); setTime(id, d0, 'smooth');
    const PARTS = [
      { k: 'case', n: 'Case', x: -82, y: 72, t: 'The metal body that holds everything. Usually steel, sometimes titanium, gold, bronze or ceramic. On the back is the <b>caseback</b>, solid or with a glass window so you can see the movement.', tip: 'Measured across, excluding the crown: "a 40 mm watch".' },
      { k: 'bezel', n: 'Bezel', x: 0, y: -100, t: 'The ring around the crystal. On a dive watch it rotates in one direction only, so you can line its triangle up with the minute hand and read how long you’ve been underwater.', tip: 'One-way, so a knock can only make it show more time elapsed, never less.' },
      { k: 'crystal', n: 'Crystal', x: 52, y: -48, t: 'The "glass". Cheap watches use mineral glass or acrylic; most good ones use <b>sapphire crystal</b>, a lab-grown material so hard that only diamond reliably scratches it.', tip: 'Vintage acrylic crystals scratch easily, but a little polish makes them clear again.' },
      { k: 'dial', n: 'Dial', x: -40, y: -20, t: 'The face. Its finish, whether sunburst, matte, lacquer, enamel or textured, is a big part of a watch’s personality and price. Collectors often call it the "face" only once.', tip: 'Sunburst dials change color as they catch the light.' },
      { k: 'indices', n: 'Indices & lume', x: 0, y: -60, t: 'The hour markers. On tool watches they’re filled with <b>lume</b>: a photoluminescent paint, usually Super-LumiNova, that charges in light and glows in the dark.', tip: 'Before the 1960s, lume was often radioactive radium. Don’t lick old watches.' },
      { k: 'hands', n: 'Hands', x: 22, y: 12, t: 'Hour, minute and seconds. Their shapes have names: sword, dauphine, baton, Mercedes (this one, with the circle). On a dive watch the minute hand is the most important, so it’s often the most visible.', tip: 'Tiny gears under the dial, the "motion works", turn the hour hand 12 times slower than the minute hand.' },
      { k: 'subdials', n: 'Date window', x: 58, y: 0, t: 'A <b>complication</b>, the watch word for any function beyond telling time. The date disc turns once around midnight.', tip: 'Avoid changing the date between about 9 pm and 3 am on most mechanical watches.' },
      { k: 'crown', n: 'Crown', x: 110, y: 0, t: 'The knob for winding the mainspring and setting the time and date. Pull it out to positions one and two. On dive watches it <b>screws down</b> to seal out water, and the "crown guards" around it protect it from knocks.', tip: 'Good watches "hack": the seconds hand stops when you pull the crown out, so you can set them to the exact second.' },
      { k: 'lugs', n: 'Lugs', x: -44, y: -112, t: 'The horns that hold the strap. A spring bar sits between them. The distance between lugs (often 18–22 mm) decides which straps fit, and the length of the lugs decides how big a watch wears.', tip: 'Lug width is the number to know when buying straps.' },
      { k: 'strap', n: 'Strap', x: 0, y: 160, t: 'Leather, rubber, fabric (like the military-style NATO strap) or a metal <b>bracelet</b>. Changing the strap is the cheapest way to make one watch feel like several.', tip: 'Quick-release spring bars let you swap straps without tools.' },
    ];
    const svg = stage.querySelector('svg');
    const NS = 'http://www.w3.org/2000/svg';
    const hots = document.createElementNS(NS, 'g');
    svg.appendChild(hots);
    let cur = null;
    PARTS.forEach((p, i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'hot'); g.setAttribute('transform', `translate(${p.x} ${p.y})`); g.setAttribute('tabindex', '-1');
      g.innerHTML = `<circle class="ring" r="9"/><circle class="core" r="9"/><text>${i + 1}</text>`;
      g.addEventListener('click', () => pick(i));
      hots.appendChild(g);
      const li = document.createElement('li');
      li.innerHTML = `<button type="button" aria-pressed="false"><i>${i + 1}</i>${p.n}</button>`;
      li.firstChild.addEventListener('click', () => pick(i));
      list.appendChild(li);
    });
    function pick(i) {
      cur = cur === i ? null : i;
      stage.classList.toggle('focus', cur !== null);
      $$('.anat-part', svg).forEach((g) => g.classList.toggle('on', cur !== null && g.dataset.part === PARTS[cur].k));
      $$('.hot', svg).forEach((g, j) => g.classList.toggle('on', j === cur));
      $$('button', list).forEach((b, j) => b.setAttribute('aria-pressed', String(j === cur)));
      const p = PARTS[cur ?? 0];
      card.innerHTML = cur === null ? `<h4>Pick a part</h4><p>Ten parts, ten words you’ll see everywhere. Start with the crown: it’s the one you’ll touch most.</p>` : `<h4>${p.n}</h4><p>${p.t}</p><p class="tip">↳ ${p.tip}</p>`;
    }
    pick(null);
  })();

  /* ═════════ CH2: POWER RESERVE ═════════ */
  (function reserve() {
    const sp = $('#res-spring'), gc = $('#res-gauge'), hoursEl = $('#res-hours'), clockEl = $('#res-clock'), hint = $('#res-hint');
    const MAX = 72, PER_TURN = MAX / 40;
    let hrs = 0, simH = 0, barrelA = 0, rotorA = 0, mode = 'manual', last = performance.now(), lastX = null, windFlash = 0;
    segGroup('[data-wind]', 'wind', (v) => {
      mode = v;
      $('#res-wind').hidden = v === 'auto';
      hint.textContent = v === 'auto' ? 'Move your pointer or finger back and forth across the panel. That’s your wrist moving: the rotor swings and winds the spring.' : 'Each press is one turn of the crown. About 40 turns fills a typical mainspring.';
    });
    $('#res-wind').addEventListener('click', () => { hrs = Math.min(MAX, hrs + PER_TURN); windFlash = 1; try { tick(0.15); } catch (e) {} });
    $('#res-reset').addEventListener('click', () => { hrs = 0; });
    const body = $('.res-body');
    body.addEventListener('pointermove', (e) => {
      if (mode !== 'auto') return;
      if (lastX !== null) {
        const dx = Math.abs(e.clientX - lastX) + Math.abs(e.movementY || 0);
        rotorA += dx * 0.9;
        hrs = Math.min(MAX, hrs + dx * 0.012);
      }
      lastX = e.clientX;
    });
    body.addEventListener('pointerleave', () => (lastX = null));
    function draw(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (hrs > 0) { const dh = dt * 2; hrs = Math.max(0, hrs - dh); simH += dh; barrelA += dh * 45; }
      windFlash = Math.max(0, windFlash - dt * 3);
      // spring
      let { ctx, w, h } = sizeCanvas(sp);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.44, frac = hrs / MAX;
      ctx.save(); ctx.translate(cx, cy);
      // barrel with teeth
      ctx.rotate(barrelA * Math.PI / 180);
      ctx.fillStyle = '#1b2128'; ctx.strokeStyle = '#3a434d'; ctx.lineWidth = 2;
      ctx.beginPath();
      const teeth = 72;
      for (let i = 0; i <= teeth * 2; i++) { const a = i / (teeth * 2) * Math.PI * 2, rr = i % 2 ? R * 1.04 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const g = ctx.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 0.95);
      g.addColorStop(0, '#2a323b'); g.addColorStop(1, '#151a1f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, 7); ctx.fill();
      ctx.restore(); ctx.save(); ctx.translate(cx, cy);
      // spiral: wound = tight around arbor, unwound = against the wall
      const ri = R * 0.17, ro = lerp(R * 0.92, R * 0.52, frac), turns = lerp(6, 12, frac);
      const grad = ctx.createLinearGradient(-R, -R, R, R);
      grad.addColorStop(0, '#dfe3e8'); grad.addColorStop(0.5, '#8b929b'); grad.addColorStop(1, '#cfd3d9');
      ctx.strokeStyle = grad; ctx.lineWidth = Math.max(1.4, R * 0.012);
      ctx.beginPath();
      const N = 900, spin = -barrelA * Math.PI / 180 * 0.25 + frac * 6;
      for (let i = 0; i <= N; i++) {
        const u = i / N, a = u * turns * Math.PI * 2 + spin;
        const r = ri + (ro - ri) * Math.pow(u, frac > 0.5 ? 1.25 : 0.85);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      // arbor
      ctx.fillStyle = '#9aa1a9'; ctx.beginPath(); ctx.arc(0, 0, ri * 0.85, 0, 7); ctx.fill();
      ctx.fillStyle = '#5c636b'; ctx.fillRect(-ri * 0.35, -ri * 0.35, ri * 0.7, ri * 0.7);
      // rotor overlay in auto mode
      if (mode === 'auto') {
        ctx.rotate(rotorA * Math.PI / 180);
        ctx.fillStyle = 'rgba(201,169,110,.32)'; ctx.strokeStyle = 'rgba(232,213,168,.8)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, R * 1.02, 0, Math.PI); ctx.arc(0, 0, R * 0.25, Math.PI, 0, true); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(232,213,168,.9)'; ctx.font = `500 ${Math.max(9, R * 0.07)}px DM Mono, monospace`; ctx.textAlign = 'center';
        ctx.fillText('ROTOR', 0, R * 0.65);
      }
      if (windFlash > 0) { ctx.strokeStyle = `rgba(184,245,166,${windFlash * 0.6})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R * 1.08, 0, 7); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#8b929b'; ctx.font = '400 11px DM Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(frac > 0.6 ? 'TIGHTLY WOUND' : frac > 0.05 ? 'UNWINDING' : 'RELAXED — WATCH STOPPED', cx, h - 6);
      // gauge
      ({ ctx, w, h } = sizeCanvas(gc));
      const gx = w / 2, gy = h * 0.9, gr = Math.min(w / 2, h) * 0.85;
      ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.strokeStyle = '#262d36'; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 0); ctx.stroke();
      const gg = ctx.createLinearGradient(gx - gr, 0, gx + gr, 0); gg.addColorStop(0, G.red); gg.addColorStop(0.3, G.gold); gg.addColorStop(1, G.lume);
      ctx.strokeStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * frac); ctx.stroke();
      ctx.fillStyle = '#8b929b'; ctx.font = '400 9px DM Mono, monospace'; ctx.textAlign = 'center';
      [0, 24, 48, 72].forEach((v) => { const a = Math.PI + Math.PI * v / MAX; ctx.fillText(v, gx + Math.cos(a) * (gr - 18), gy + Math.sin(a) * (gr - 18) + 3); });
      hoursEl.textContent = Math.round(hrs) + ' h';
      clockEl.textContent = `${Math.floor(simH)} h ${String(Math.floor((simH % 1) * 60)).padStart(2, '0')} m`;
    }
    loopWhileVisible(sp, draw);
  })();

  /* ═════════ CH3: GEAR TRAIN ═════════ */
  (function train() {
    const svg = $('#train-svg'), read = $('#train-read');
    const NS = 'http://www.w3.org/2000/svg';
    const GEARS = [
      { k: 'barrel', n: 'Barrel', x: 150, y: 360, r: 112, t: 84, c: '#c9a96e', speed: 'once every ~8 hours', job: 'stores the energy' },
      { k: 'center', n: 'Center wheel', x: 318, y: 238, r: 74, t: 64, c: '#d9c08e', speed: 'once an hour', job: 'carries the minute hand' },
      { k: 'third', n: 'Third wheel', x: 446, y: 352, r: 56, t: 56, c: '#cfd3d9', speed: 'about once every 7½ min', job: 'steps the speed up' },
      { k: 'fourth', n: 'Fourth wheel', x: 552, y: 228, r: 50, t: 50, c: '#cfd3d9', speed: 'once a minute', job: 'carries the seconds hand' },
      { k: 'escape', n: 'Escape wheel', x: 640, y: 352, r: 36, t: 15, c: '#e5484d', speed: 'a few seconds per turn, in steps', job: 'is released one tooth at a time' },
      { k: 'balance', n: 'Balance wheel', x: 672, y: 120, r: 56, t: 0, c: '#b8f5a6', speed: '4 swings a second', job: 'keeps the time' },
    ];
    const rates = { barrel: 3, center: 9, third: 26, fourth: 60, escape: 0, balance: 0 };
    function gearPath(r, t, club) {
      if (!t) return '';
      let d = '';
      const rr = r * 0.88;
      for (let i = 0; i < t; i++) {
        const a0 = (i / t) * Math.PI * 2, a1 = ((i + 0.25) / t) * Math.PI * 2, a2 = ((i + 0.5) / t) * Math.PI * 2, a3 = ((i + 0.75) / t) * Math.PI * 2;
        if (club) {
          d += `${i ? 'L' : 'M'}${f1(Math.cos(a0) * rr * 0.86)},${f1(Math.sin(a0) * rr * 0.86)} L${f1(Math.cos(a1) * r)},${f1(Math.sin(a1) * r)} L${f1(Math.cos(a2 - 0.08) * r * 0.98)},${f1(Math.sin(a2 - 0.08) * r * 0.98)} L${f1(Math.cos(a3) * rr * 0.86)},${f1(Math.sin(a3) * rr * 0.86)} `;
        } else {
          d += `${i ? 'L' : 'M'}${f1(Math.cos(a0) * rr)},${f1(Math.sin(a0) * rr)} L${f1(Math.cos(a1) * r)},${f1(Math.sin(a1) * r)} L${f1(Math.cos(a2) * r)},${f1(Math.sin(a2) * r)} L${f1(Math.cos(a3) * rr)},${f1(Math.sin(a3) * rr)} `;
        }
      }
      return d + 'Z';
    }
    let html = `<defs><radialGradient id="tg-plate" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#1a2129"/><stop offset="1" stop-color="#0e1216"/></radialGradient></defs><rect width="760" height="520" rx="18" fill="url(#tg-plate)"/>`;
    for (let i = 0; i < 40; i++) html += `<circle cx="${(i * 97) % 760}" cy="${(i * 53) % 520}" r="1" fill="#2a323b"/>`;
    GEARS.forEach((g) => {
      html += `<g class="gear" data-k="${g.k}" transform="translate(${g.x} ${g.y})">`;
      if (g.k === 'balance') {
        html += `<g class="rot"><circle r="${g.r}" fill="none" stroke="${g.c}" stroke-width="7"/><path d="M0 ${-g.r} L0 ${g.r} M${-g.r} 0 L${g.r} 0" stroke="${g.c}" stroke-width="3" transform="rotate(45)"/>`;
        let sp = 'M0 0'; for (let a = 0; a < 6 * Math.PI * 2; a += 0.15) { const r = 3 + a * 1.1; sp += ` L${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)}`; }
        html += `<path d="${sp}" fill="none" stroke="#e8f8e0" stroke-width=".9" opacity=".8"/></g>`;
      } else {
        html += `<g class="rot"><path d="${gearPath(g.r, g.t, g.k === 'escape')}" fill="${g.c}" fill-opacity=".9" stroke="rgba(0,0,0,.4)" stroke-width=".8"/>`;
        if (g.k !== 'escape') html += `<circle r="${g.r * 0.72}" fill="#0f1317" fill-opacity=".85"/>${[0, 1, 2, 3].map((q) => `<path d="M0 0 L${f1(Math.cos(q * Math.PI / 2) * g.r * 0.72)} ${f1(Math.sin(q * Math.PI / 2) * g.r * 0.72)}" stroke="${g.c}" stroke-width="${g.r * 0.12}"/>`).join('')}`;
        else html += `<circle r="${g.r * 0.5}" fill="#0f1317"/><circle r="${g.r * 0.3}" fill="${g.c}"/>`;
        html += `<circle r="${Math.max(6, g.r * 0.16)}" fill="#8b929b"/><circle r="2.5" fill="#e5484d"/></g>`;
        if (g.k === 'barrel') html += `<text class="gear-label" y="${g.r * 0.18}" font-size="10" fill="#0a0c0f" style="fill:#0a0c0f">MAINSPRING</text>`;
      }
      html += `</g>`;
      html += `<text class="gear-label" data-k="${g.k}" x="${g.x}" y="${g.k === 'balance' ? g.y - g.r - 14 : g.y + g.r + 22}">${g.n.toUpperCase()}</text>`;
    });
    // pallet fork
    html += `<g class="gear" data-k="fork" transform="translate(676 262)"><g class="rot"><path d="M0 -76 L0 46 M-30 52 L0 46 L30 52" stroke="#cfd3d9" stroke-width="6" stroke-linecap="round" fill="none"/><rect x="-36" y="48" width="9" height="13" fill="#e5484d" transform="rotate(-12 -31 54)"/><rect x="27" y="48" width="9" height="13" fill="#e5484d" transform="rotate(12 31 54)"/><path d="M-7 -82 L-7 -96 M7 -82 L7 -96" stroke="#cfd3d9" stroke-width="4"/><circle r="5" fill="#8b929b"/></g></g>`;
    html += `<text class="gear-label" data-k="fork" x="728" y="262" text-anchor="end">FORK</text>`;
    svg.innerHTML = html;
    const gears = $$('.gear', svg), labels = $$('text.gear-label[data-k]', svg);
    const angles = {};
    let step = 0, last = performance.now();
    const ON = { 0: ['barrel', 'center', 'third', 'fourth', 'escape', 'balance', 'fork'], 1: ['barrel'], 2: ['center'], 3: ['third'], 4: ['fourth'], 5: ['escape'], 6: ['escape', 'fork', 'balance'] };
    function setStep(s) {
      step = s;
      const on = new Set(ON[s]);
      gears.forEach((g) => (g.style.opacity = s === 0 ? 0.55 : on.has(g.dataset.k) ? 1 : 0.18));
      labels.forEach((l) => l.classList.toggle('on', s !== 0 && on.has(l.dataset.k)));
      $$('#train-scrolly .step').forEach((e) => e.classList.toggle('active', +e.dataset.step === s));
      const g = GEARS.find((x) => x.k === (s === 6 ? 'balance' : ON[s][0]));
      read.innerHTML = s === 0 || !g ? `<div><span class="k">Energy flow</span><b>spring → balance</b></div><div><span class="k">Each wheel</span><b>faster, weaker</b></div><div><span class="k">Gear ratio, end to end</span><b>≈ 1 : 30,000</b></div>`
        : `<div><span class="k">Part</span><b>${g.n}</b></div><div><span class="k">Turns</span><b>${g.speed}</b></div><div><span class="k">Its job</span><b>${g.job}</b></div>`;
    }
    setStep(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: matchMedia('(max-width: 1000px)').matches ? '-70% 0px -10% 0px' : '-45% 0px -45% 0px' });
    $$('#train-scrolly .step').forEach((e) => io.observe(e));
    let t0 = performance.now();
    loopWhileVisible(svg, (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      GEARS.forEach((g, i) => {
        let a;
        if (g.k === 'balance') a = Math.sin(t * Math.PI * 2 * 0.8) * 200;
        else if (g.k === 'escape') { const ph = t * 0.8 * 2; a = (Math.floor(ph) + ease(clamp((ph % 1) * 6, 0, 1))) * 12; }
        else { angles[g.k] = (angles[g.k] || 0) + rates[g.k] * dt * (i % 2 ? -1 : 1); a = angles[g.k]; }
        const r = gears[i].querySelector('.rot'); r.setAttribute('transform', `rotate(${f1(a)})`);
      });
      const fork = gears.find((g) => g.dataset.k === 'fork').querySelector('.rot');
      fork.setAttribute('transform', `rotate(${f1(clamp(Math.sin(t * Math.PI * 2 * 0.8) * 4, -1, 1) * 9)})`);
    });
  })();

  /* ═════════ CH4: ESCAPEMENT ═════════ */
  (function escapement() {
    const cv = $('#esc-canvas'), ex = $('#esc-explain');
    let vph = 28800, speed = 0.04, simT = 0, last = performance.now(), lastBeat = 0;
    const TXT = {
      18000: '<b>18,000 vph</b> = 5 beats a second (2.5 Hz). Typical of many mid-century watches. Look at the seconds hand: you can almost count the steps.',
      21600: '<b>21,600 vph</b> = 6 beats a second (3 Hz). Common in many affordable Japanese automatics and in plenty of classic Swiss calibres.',
      28800: '<b>28,800 vph</b> = 8 beats a second (4 Hz). The modern standard for most Swiss and many Japanese automatics. A smooth-looking sweep.',
      36000: '<b>36,000 vph</b> = 10 beats a second (5 Hz). "High-beat", made famous by Zenith’s El Primero (1969) and Grand Seiko’s Hi-Beat. Very smooth, but harder on oils.',
    };
    ex.innerHTML = TXT[vph];
    segGroup('[data-vph]', 'vph', (v) => { vph = +v; ex.innerHTML = TXT[vph]; });
    segGroup('[data-speed]', 'speed', (v) => (speed = +v));
    // mini second dials
    const mini = (svgEl) => {
      let s = '<circle r="56" fill="#0f1317" stroke="#2a323b" stroke-width="2"/>';
      for (let k = 0; k < 60; k++) { const [a, b] = polar(k % 5 ? 50 : 46, k * 6), [c, d] = polar(53, k * 6); s += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="#8b929b" stroke-width="${k % 5 ? 0.7 : 1.4}"/>`; }
      s += `<g class="h"><path d="M-0.8 10 L-0.8 -50 L0.8 -50 L0.8 10Z" fill="${G.red}"/></g><circle r="3" fill="${G.red}"/>`;
      svgEl.innerHTML = s;
      return svgEl.querySelector('.h');
    };
    const hm = mini($('#esc-sec')), hq = mini($('#esc-q'));
    function wheel(ctx, r, teeth) {
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2, step = (Math.PI * 2) / teeth;
        const p = (aa, rr) => ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
        p(a, r * 0.78); p(a + step * 0.12, r); p(a + step * 0.42, r * 0.96); p(a + step * 0.48, r * 0.78);
      }
      ctx.closePath();
    }
    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      simT += dt * speed;
      const { ctx, w, h } = sizeCanvas(cv);
      const S = Math.min(w / 1.35, h);
      const fb = vph / 7200; // oscillations per second
      const phase = simT * fb * Math.PI * 2;
      const A = 210 * Math.PI / 180, theta = A * Math.sin(phase);
      const delta = Math.asin(0.16 / 1.0) * 0.9; // impulse zone in phase units
      const k = Math.round(phase / Math.PI), off = phase - k * Math.PI;
      const p = clamp((off + delta) / (2 * delta), 0, 1);
      const phi = (k - 1 + ease(p)) * (Math.PI * 2 / 15 / 2);
      const psi = clamp(Math.sin(phase) / Math.sin(delta), -1, 1) * 0.16;
      const beat = Math.floor((phase + delta) / Math.PI);
      if (beat !== lastBeat) { lastBeat = beat; if ($('#esc-sound').checked && speed >= 0.25) { try { tick(speed === 1 ? 0.12 : 0.25); } catch (e) {} } }
      const E = { x: w * 0.28, y: h * 0.62 }, F = { x: w * 0.5, y: h * 0.42 }, B = { x: w * 0.74, y: h * 0.4 };
      const Re = S * 0.24, Rb = S * 0.25;
      // escape wheel
      ctx.save(); ctx.translate(E.x, E.y); ctx.rotate(phi);
      const eg = ctx.createLinearGradient(-Re, -Re, Re, Re); eg.addColorStop(0, '#f0d8a0'); eg.addColorStop(1, '#a88446');
      ctx.fillStyle = eg; wheel(ctx, Re, 15); ctx.fill();
      ctx.fillStyle = '#0f1317'; ctx.beginPath(); ctx.arc(0, 0, Re * 0.62, 0, 7); ctx.fill();
      ctx.strokeStyle = '#c9a96e'; ctx.lineWidth = Re * 0.08;
      for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(q * Math.PI / 2) * Re * 0.62, Math.sin(q * Math.PI / 2) * Re * 0.62); ctx.stroke(); }
      ctx.fillStyle = '#8b929b'; ctx.beginPath(); ctx.arc(0, 0, Re * 0.1, 0, 7); ctx.fill();
      ctx.restore();
      // pallet fork
      ctx.save(); ctx.translate(F.x, F.y); ctx.rotate(psi);
      const toE = Math.atan2(E.y - F.y, E.x - F.x), toB = Math.atan2(B.y - F.y, B.x - F.x);
      const armL = Math.hypot(E.x - F.x, E.y - F.y) - Re * 0.9;
      ctx.strokeStyle = '#cfd3d9'; ctx.lineCap = 'round'; ctx.lineWidth = S * 0.022;
      const pal = [];
      for (const sgn of [-1, 1]) {
        const a = toE + sgn * 0.52;
        const x = Math.cos(a) * armL * 0.95, y = Math.sin(a) * armL * 0.95;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(x, y); ctx.stroke();
        pal.push([x, y, a]);
      }
      const tail = Math.hypot(B.x - F.x, B.y - F.y) - Rb * 0.32;
      const tx = Math.cos(toB) * tail, ty = Math.sin(toB) * tail;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.stroke();
      // horns
      const nx = -Math.sin(toB), ny = Math.cos(toB), hl = S * 0.035;
      ctx.lineWidth = S * 0.016;
      ctx.beginPath(); ctx.moveTo(tx + nx * hl, ty + ny * hl); ctx.lineTo(tx + nx * hl + Math.cos(toB) * hl * 1.3, ty + ny * hl + Math.sin(toB) * hl * 1.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx - nx * hl, ty - ny * hl); ctx.lineTo(tx - nx * hl + Math.cos(toB) * hl * 1.3, ty - ny * hl + Math.sin(toB) * hl * 1.3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx + nx * hl, ty + ny * hl); ctx.lineTo(tx - nx * hl, ty - ny * hl); ctx.stroke();
      // jewels
      pal.forEach(([x, y, a], i) => {
        const engaged = (i === 0) === (psi < 0);
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = engaged ? '#ff5f6b' : '#a3242c';
        ctx.shadowColor = engaged ? '#ff5f6b' : 'transparent'; ctx.shadowBlur = engaged ? 12 : 0;
        ctx.fillRect(-S * 0.018, -S * 0.03, S * 0.036, S * 0.06);
        ctx.restore();
      });
      ctx.fillStyle = '#8b929b'; ctx.beginPath(); ctx.arc(0, 0, S * 0.022, 0, 7); ctx.fill();
      ctx.restore();
      // balance
      ctx.save(); ctx.translate(B.x, B.y);
      // hairspring breathing
      ctx.strokeStyle = 'rgba(232,248,224,.75)'; ctx.lineWidth = 1;
      ctx.beginPath();
      const breathe = 1 + Math.sin(phase) * 0.06;
      for (let a = 0; a < 9 * Math.PI * 2; a += 0.12) { const r = (Rb * 0.08 + a * Rb * 0.0105) * breathe; ctx.lineTo(Math.cos(a + theta * 0.5) * r, Math.sin(a + theta * 0.5) * r); }
      ctx.stroke();
      ctx.rotate(theta);
      ctx.strokeStyle = G.gold; ctx.lineWidth = S * 0.03;
      ctx.beginPath(); ctx.arc(0, 0, Rb, 0, 7); ctx.stroke();
      ctx.lineWidth = S * 0.012;
      for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(q * 2.094) * Rb, Math.sin(q * 2.094) * Rb); ctx.stroke(); }
      for (let q = 0; q < 12; q++) { ctx.fillStyle = G.gold2; ctx.beginPath(); ctx.arc(Math.cos(q * 0.5236) * Rb, Math.sin(q * 0.5236) * Rb, S * 0.009, 0, 7); ctx.fill(); }
      // roller + impulse pin pointing toward fork at rest
      ctx.fillStyle = '#3a434d'; ctx.beginPath(); ctx.arc(0, 0, Rb * 0.22, 0, 7); ctx.fill();
      const pinA = toB + Math.PI;
      ctx.fillStyle = '#ff5f6b'; ctx.beginPath(); ctx.arc(Math.cos(pinA) * Rb * 0.2, Math.sin(pinA) * Rb * 0.2, S * 0.013, 0, 7); ctx.fill();
      ctx.restore();
      // labels
      ctx.font = `400 ${Math.max(9, S * 0.03)}px DM Mono, monospace`; ctx.fillStyle = '#8b929b'; ctx.textAlign = 'center';
      ctx.fillText('ESCAPE WHEEL', E.x, E.y + Re + S * 0.06);
      ctx.fillText('PALLET FORK', F.x, F.y - S * 0.2);
      ctx.fillText('BALANCE + HAIRSPRING', B.x, B.y + Rb + S * 0.07);
      // stage pill
      const st = Math.abs(off) < delta * 0.35 ? ['UNLOCK', G.gold2] : Math.abs(off) < delta ? ['IMPULSE', G.lume] : ['LOCKED · BALANCE SWINGS FREE', '#8b929b'];
      ctx.font = `500 ${Math.max(10, S * 0.034)}px DM Mono, monospace`;
      const tw = ctx.measureText(st[0]).width + 24;
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.strokeStyle = st[1]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(w / 2 - tw / 2, 12, tw, 26, 13) : ctx.rect(w / 2 - tw / 2, 12, tw, 26); ctx.fill(); ctx.stroke();
      ctx.fillStyle = st[1]; ctx.fillText(st[0], w / 2, 30);
      // mini dials (real time)
      const d = new Date(), bps = vph / 3600, s = d.getSeconds() + Math.floor(d.getMilliseconds() / 1000 * bps) / bps;
      hm.setAttribute('transform', `rotate(${f1(s * 6)})`);
      hq.setAttribute('transform', `rotate(${d.getSeconds() * 6})`);
    }
    loopWhileVisible(cv, draw);
  })();

  /* ═════════ CH5: QUARTZ DIVIDER ═════════ */
  (function quartz() {
    const chain = $('#q-chain'), fork = $('#q-fork');
    const leds = [];
    for (let k = 1; k <= 15; k++) {
      const hz = 32768 / 2 ** k;
      const li = document.createElement('li');
      li.innerHTML = `<span class="led"></span><span class="hz">${hz >= 1 ? hz.toLocaleString('en-US') : hz} Hz</span>`;
      chain.appendChild(li);
      leds.push({ el: li.firstChild, hz });
    }
    const out = $('#q-out');
    let s = '<circle r="56" fill="#fbf8f2" stroke="#d6cdbb" stroke-width="2"/>';
    for (let k = 0; k < 60; k++) { const [a, b] = polar(k % 5 ? 50 : 46, k * 6), [c, d] = polar(53, k * 6); s += `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="#16181b" stroke-width="${k % 5 ? 0.6 : 1.3}"/>`; }
    s += `<g class="h"><path d="M-0.9 10 L-0.9 -50 L0.9 -50 L0.9 10Z" fill="${G.red}"/></g><circle r="3" fill="${G.red}"/>`;
    out.innerHTML = s;
    const oh = out.querySelector('.h');
    const t0 = performance.now();
    loopWhileVisible(chain, (now) => {
      const t = (now - t0) / 1000;
      leds.forEach(({ el, hz }) => {
        if (hz > 8) { el.classList.add('blur'); el.classList.remove('on'); }
        else { el.classList.remove('blur'); el.classList.toggle('on', Math.floor(t * hz * 2) % 2 === 0); }
      });
      const sec = Math.floor(t), fr = t - sec;
      oh.setAttribute('transform', `rotate(${f1((sec + (fr < 0.06 ? ease(fr / 0.06) : 1) - 1) * 6 + 6)})`);
      const { ctx, w, h } = sizeCanvas(fork);
      ctx.save(); ctx.translate(w / 2, h * 0.92);
      for (let i = 0; i < 4; i++) {
        const v = Math.sin(t * 60 + i) * 2.2;
        ctx.strokeStyle = `rgba(63,143,90,${i ? 0.18 : 0.9})`; ctx.lineWidth = w * 0.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-w * 0.16 - v, -h * 0.75); ctx.lineTo(-w * 0.16, -h * 0.25); ctx.quadraticCurveTo(0, -h * 0.05, w * 0.16, -h * 0.25); ctx.lineTo(w * 0.16 + v, -h * 0.75); ctx.stroke();
      }
      ctx.fillStyle = '#16181b'; ctx.fillRect(-w * 0.06, -h * 0.14, w * 0.12, h * 0.14);
      ctx.restore();
    });
  })();

  /* ═════════ CH5: DRIFT RACE ═════════ */
  (function drift() {
    const rows = $('#drift-rows'), s = $('#drift-slider'), dEl = $('#drift-days');
    const W = [
      { n: 'Mechanical chronometer', d: 'COSC certified', rate: 6 },
      { n: 'Spring Drive', d: 'spring + quartz regulator', rate: 1 },
      { n: 'Standard quartz', d: '±15 s / month', rate: 0.5 },
      { n: 'High-accuracy quartz', d: '±10 s / year', rate: 10 / 365 },
      { n: 'Radio / GPS-synced', d: 'resets itself daily', rate: 0, good: true },
    ];
    W.forEach((w) => {
      const r = document.createElement('div'); r.className = 'drow';
      r.innerHTML = `<div class="dn">${w.n}<small>${w.d}</small></div><div class="dtrack${w.rate < 0.1 ? ' good' : ''}"><i></i></div><output>0 s</output>`;
      rows.appendChild(r); w.el = r;
    });
    const fmt = (sec) => {
      if (sec < 1) return sec === 0 ? '±0 s' : `+${sec.toFixed(1)} s`;
      if (sec < 60) return `+${sec.toFixed(0)} s`;
      const m = Math.floor(sec / 60), ss = Math.round(sec % 60);
      return m >= 60 ? `+${Math.floor(m / 60)} h ${m % 60} m` : `+${m} m ${String(ss).padStart(2, '0')} s`;
    };
    function draw() {
      const days = +s.value;
      dEl.textContent = days === 1 ? '1 day' : days === 365 ? 'a year' : `${days} days`;
      const max = 6 * 365;
      W.forEach((w) => {
        const err = w.rate * days;
        w.el.querySelector('i').style.width = Math.max(0.4, Math.sqrt(err / max) * 100) + '%';
        w.el.querySelector('output').textContent = fmt(err);
      });
    }
    s.addEventListener('input', draw);
    draw();
  })();

  /* ═════════ CH6: MOVEMENTS ═════════ */
  (function movements() {
    const ic = {
      manual: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="${G.gold}" stroke-width="2"/><path d="M24 24 m-2 0 a2 2 0 1 0 4 0 a6 6 0 1 0 -12 0 a10 10 0 1 0 20 0 a14 14 0 1 0 -28 0" fill="none" stroke="${G.gold2}" stroke-width="1.4"/><rect x="41" y="20" width="6" height="8" rx="1.5" fill="${G.gold}"/></svg>`,
      auto: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="none" stroke="${G.gold}" stroke-width="2"/><path d="M6 24 A18 18 0 0 0 42 24 L33 24 A9 9 0 0 1 15 24 Z" fill="${G.gold}" fill-opacity=".6"/><circle cx="24" cy="24" r="3" fill="${G.gold2}"/><path d="M10 10 a20 20 0 0 1 10 -5" stroke="${G.lume}" stroke-width="1.6" fill="none"/></svg>`,
      quartz: `<svg viewBox="0 0 48 48"><path d="M17 40 V16 Q24 8 31 16 V40" fill="none" stroke="${G.lume}" stroke-width="3" stroke-linecap="round"/><path d="M12 14 l-3 -3 M36 14 l3 -3 M24 6 v-4" stroke="${G.gold}" stroke-width="1.6"/><rect x="20" y="40" width="8" height="6" fill="${G.gold}"/></svg>`,
      solar: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="8" fill="${G.gold}"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${24 + Math.cos(a) * 12}" y1="${24 + Math.sin(a) * 12}" x2="${24 + Math.cos(a) * 18}" y2="${24 + Math.sin(a) * 18}" stroke="${G.gold2}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}</svg>`,
      spring: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="${G.gold}" stroke-width="2"/><path d="M24 24 m-2 0 a2 2 0 1 0 4 0 a6 6 0 1 0 -12 0 a10 10 0 1 0 20 0" fill="none" stroke="${G.gold2}" stroke-width="1.4"/><path d="M30 34 l4 -6 l3 4 l4 -7" stroke="${G.lume}" stroke-width="1.8" fill="none"/></svg>`,
      smart: `<svg viewBox="0 0 48 48"><rect x="11" y="8" width="26" height="32" rx="8" fill="none" stroke="${G.gold}" stroke-width="2"/><path d="M17 26 h4 l2 -6 l3 10 l2 -4 h4" stroke="${G.lume}" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>`,
    };
    const M = [
      ['manual', 'Hand-wound', 'The original. You wind the crown every day or two, a small ritual many people love. Movements can be thinner without a rotor, so the back view is often prettier.', ['mechanical', '±5–20 s/day', 'service 5–10 yrs']],
      ['auto', 'Automatic', 'A mechanical movement plus a swinging rotor that winds it as you move. The most popular kind of "serious" watch. Popularized by Rolex’s Perpetual rotor in 1931.', ['mechanical', '±5–20 s/day', 'service 5–10 yrs']],
      ['quartz', 'Quartz', 'Battery, quartz crystal, stepper motor. Cheap, tough, wildly accurate. The seconds hand ticks once a second. Snobs sneer; sensible people own at least one.', ['electronic', '±15 s/month', 'battery 2–5 yrs', 'g:most accurate']],
      ['solar', 'Solar', 'A quartz watch with a solar cell hidden under the dial, charging a rechargeable cell. Citizen’s Eco-Drive and Seiko’s Solar can run for months in the dark.', ['electronic', '±15 s/month', 'g:no battery swaps']],
      ['spring', 'Spring Drive', 'Seiko’s hybrid: a mainspring powers it, but a quartz crystal and a magnetic brake regulate it. No battery, no ticking: the seconds hand glides perfectly smoothly.', ['hybrid', '±1 s/day', 'g:truly smooth sweep']],
      ['smart', 'Smart & hybrid', 'Computers for your wrist: notifications, heart rate, GPS. "Hybrids" hide some of that behind real hands. Brilliant tools; measured in days of battery, not decades of service.', ['digital', 'synced time', 'charge daily–weekly']],
    ];
    $('#movements').innerHTML = M.map(([k, n, t, tags]) => `<div class="mv">${ic[k]}<h4>${n}</h4><p>${t}</p><div class="tags">${tags.map((x) => x.startsWith('g:') ? `<span class="g">${x.slice(2)}</span>` : `<span>${x}</span>`).join('')}</div></div>`).join('');
    $$('.mv').forEach((e) => { e.classList.add('reveal'); rio.observe(e); });
  })();

  /* ═════════ CH6: STYLES ═════════ */
  function digitalSVG() {
    return `<svg viewBox="-150 -195 300 390" aria-hidden="true"><defs><linearGradient id="dg-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3f46"/><stop offset="1" stop-color="#0d0f12"/></linearGradient></defs>
      <path d="M-34 -100 L-30 -195 L30 -195 L34 -100 Z M-34 100 L-30 195 L30 195 L34 100 Z" fill="#141518"/><path d="M-30 -180 h60 M-30 -168 h60 M-30 168 h60 M-30 180 h60" stroke="#26282c" stroke-width="3"/>
      <path d="M-96 -86 Q-112 0 -96 86 Q-60 112 0 112 Q60 112 96 86 Q112 0 96 -86 Q60 -112 0 -112 Q-60 -112 -96 -86 Z" fill="url(#dg-c)" stroke="#000" stroke-width="2"/>
      ${[[-106, -48], [-106, 48], [106, -48], [106, 48]].map(([x, y]) => `<rect x="${x - 7}" y="${y - 10}" width="14" height="20" rx="3" fill="#5b6068"/>`).join('')}
      <rect x="-72" y="-70" width="144" height="140" rx="14" fill="#1b1d21" stroke="#4a4f57" stroke-width="2"/>
      <text x="0" y="-48" text-anchor="middle" font-family="DM Mono, monospace" font-size="9" fill="#e5484d" letter-spacing="2">SHOCK RESIST</text>
      <rect x="-62" y="-34" width="124" height="70" rx="4" fill="#a9b39a"/>
      <text id="dg-time" x="-10" y="14" text-anchor="middle" font-family="DM Mono, monospace" font-weight="500" font-size="30" fill="#1e2419" letter-spacing="-1">12:00</text>
      <text id="dg-sec" x="40" y="14" font-family="DM Mono, monospace" font-size="13" fill="#1e2419">00</text>
      <text x="-54" y="-18" font-family="DM Mono, monospace" font-size="9" fill="#1e2419">MO</text>
      <text x="0" y="56" text-anchor="middle" font-family="DM Mono, monospace" font-size="8" fill="#8b929b" letter-spacing="2">WATER 200M RESIST</text></svg>`;
  }
  (function styles() {
    const tabs = $('#styles-tabs'), stage = $('#styles-watch'), info = $('#styles-info');
    const S = [
      { n: 'Dress', born: 'Wristwatch ancestor · 1920s–50s', o: { dial: '#efe9dc', dial2: '#fbf8f0', caseC: 'gold', bezel: 'thin', idx: 'dagger', hands: 'dauphine', lume: false, idxC: '#5a4520', handC: '#6b5122', strap: '#3a2316', secHand: false, top: 'lrn', bot: 'AUTOMATIC', texture: '' }, t: 'Built to disappear under a shirt cuff. Thin, simple, and usually on leather. Less is more: two or three hands, maybe a date, never a rotating bezel.', f: ['Slim case that slips under a cuff', 'Clean dial with applied markers, often no lume', 'Precious metals and leather straps', 'Smaller sizes, roughly 34–39 mm'], ex: 'Think: <b>Cartier Tank</b>, <b>Patek Philippe Calatrava</b>, <b>Seiko Presage</b>, <b>Orient Bambino</b>' },
      { n: 'Diver', born: 'Born 1953 · Blancpain & Rolex', o: { dial: '#0c0f12', dial2: '#1a2128', bezel: 'diver', bezelC: '#0e1114', idx: 'dot', hands: 'mercedes', date: true, bracelet: true, guards: true, top: 'lrn', bot: 'SUBMERSIBLE 300M' }, t: 'The most popular style in watches. Built to time a dive, tough enough to survive one, and somehow just as good with a suit or a T-shirt.', f: ['One-way rotating bezel to time a dive', 'Huge lume on hands and markers', 'Screw-down crown, often with guards', '200 m+ water resistance (ISO 6425)'], ex: 'Think: <b>Rolex Submariner</b>, <b>Omega Seamaster</b>, <b>Seiko Prospex</b>, <b>Tudor Black Bay</b>' },
      { n: 'Field', born: 'World War I & II', o: { dial: '#1f241e', dial2: '#2c3329', idx: 'field', hands: 'pencil', bezel: 'thin', strap: '#4b5233', nato: '#3b4128', stitch: false, top: '', bot: 'MECHANICAL', idxC: '#efe8d4' }, t: 'What soldiers wore. Designed for one thing: telling the time at a glance, in the mud, at night. Modest, legible and affordable, it’s one of the best first watches there is.', f: ['Big Arabic numerals, matte dial', 'Inner 13–24 track for military time', 'Small case, usually 36–40 mm', 'Fabric or leather strap'], ex: 'Think: <b>Hamilton Khaki Field</b>, <b>Seiko 5</b>, <b>Timex Expedition</b>' },
      { n: 'Pilot', born: '1930s–40s aviation', o: { dial: '#111316', dial2: '#1b1e22', idx: 'pilot', hands: 'sword', crown: 'onion', bezel: 'thin', strap: '#5a3b26', stitchC: 'rgba(255,240,220,.6)', top: '', bot: '', idxC: '#f3efe6' }, t: 'Descended from navigators’ watches of the 1940s: huge, matte, legible from across a cockpit. The triangle at 12 helps you orient the dial in the dark, and the giant crown works with gloves on.', f: ['Triangle and two dots at 12 o’clock', 'Oversized "onion" crown for gloves', 'High-contrast numerals', 'Often large: 40–46 mm'], ex: 'Think: <b>IWC Big Pilot</b>, <b>Laco</b>, <b>Stowa</b>, <b>Breitling Navitimer</b> (a different branch, with a slide rule)' },
      { n: 'Chronograph', born: 'Motorsport & aviation, 1930s–60s', o: { dial: '#eeeae2', dial2: '#fbfaf6', bezel: 'tachy', bezelC: '#111316', subs: 3, pushers: true, hands: 'baton', idx: 'baton', lume: false, idxC: '#16181b', handC: '#16181b', subHandC: '#16181b', bracelet: true, top: 'lrn', bot: 'CHRONOGRAPH' }, t: 'A stopwatch built into a watch. The pushers start, stop and reset the big seconds hand; the subdials count minutes and hours. The bezel scale is a tachymeter, which turns time into speed.', f: ['Two pushers beside the crown', 'Two or three subdials ("panda" when light with dark subdials)', 'Tachymeter bezel for speed', 'The busiest dial in watches'], ex: 'Think: <b>Omega Speedmaster</b>, <b>Rolex Daytona</b>, <b>TAG Heuer Carrera</b>, <b>Seiko Speedtimer</b>' },
      { n: 'GMT', born: '1950s · jet-age airline pilots', o: { dial: '#0d1014', dial2: '#1a1f26', bezel: 'gmt', gmt: true, idx: 'dot', hands: 'mercedes', date: true, bracelet: true, top: 'lrn', bot: 'GMT · 100M' }, t: 'Made for pilots crossing time zones in the 1950s. An extra hand goes round once every 24 hours and points to a 24-hour scale, showing a second time zone. Two-tone bezels separate day from night.', f: ['A fourth, usually colored, 24-hour hand', '24-hour bezel, often split day/night', 'Rotate the bezel for a third time zone', 'Beloved by frequent flyers'], ex: 'Think: <b>Rolex GMT-Master II</b>, <b>Tudor Black Bay GMT</b>, <b>Grand Seiko GMT</b>, <b>Seiko 5 Sports GMT</b>' },
      { n: 'Luxury sports', born: '1972 · the Royal Oak', o: { dial: '#1d3557', dial2: '#2c4c78', shape: 'octagon', bracelet: true, idx: 'baton', hands: 'baton', date: true, texture: 'tapisserie', top: 'lrn', bot: 'AUTOMATIC' }, t: 'In 1972 Audemars Piguet released a steel watch that cost more than many gold ones: the Royal Oak, designed by Gérald Genta. Steel sports watch with a flowing bracelet, priced as luxury. Genta then designed the Patek Philippe Nautilus. The category now has fans at every price.', f: ['Bracelet "integrated" into the case', 'Bold geometric bezel, sometimes with screws', 'Textured dials', 'Steel treated as a precious metal'], ex: 'Think: <b>Audemars Piguet Royal Oak</b>, <b>Patek Philippe Nautilus</b>, <b>Vacheron Constantin Overseas</b>, <b>Tissot PRX</b>' },
      { n: 'Digital', born: '1970s · the LED & LCD age', digital: true, t: 'Hamilton’s Pulsar of 1972 was the first digital watch with an LED display; LCDs soon followed. Casio’s G-Shock (1983), famously drop-tested from a building window during development, made digital watches indestructible. Many collectors own one.', f: ['Displays numbers, not hands', 'Alarms, stopwatches, backlights', 'Resin cases that shrug off knocks', 'Often very cheap, and very fun'], ex: 'Think: <b>Casio G-Shock</b>, <b>Casio F-91W</b>, <b>Timex Ironman</b>' },
    ];
    let cur = 0, wid = null;
    S.forEach((st, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0)); b.textContent = st.n;
      b.addEventListener('click', () => show(i));
      tabs.appendChild(b);
    });
    function show(i) {
      cur = i;
      $$('button', tabs).forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
      const st = S[i];
      if (st.digital) { stage.innerHTML = digitalSVG(); wid = null; }
      else wid = mount(stage, { ...st.o });
      info.innerHTML = `<h4>${st.n}</h4><p class="born">${st.born}</p><p>${st.t}</p><ul>${st.f.map((x) => `<li>${x}</li>`).join('')}</ul><p class="ex">${st.ex}</p>`;
    }
    show(0);
    loopWhileVisible(stage, () => {
      const d = new Date();
      if (wid) { setTime(wid, d, 'sweep'); rot(wid, 'g', ((d.getHours() + d.getMinutes() / 60) / 24) * 360); }
      else {
        const t = $('#dg-time'), sEl = $('#dg-sec');
        if (t) { t.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; sEl.textContent = String(d.getSeconds()).padStart(2, '0'); }
      }
    });
  })();

  /* ═════════ CH7: COMPLICATIONS ═════════ */
  (function comps() {
    const tabs = $('#comps-tabs'), stage = $('#comps-watch'), ctr = $('#comps-controls'), info = $('#comps-info');
    let state = {}, wid = null, active = 0;
    const SYN = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
    function moonInfo(d = new Date()) {
      const days = d.getTime() / 86400000 - NEW_MOON;
      const age = ((days % SYN) + SYN) % SYN;
      const illum = (1 - Math.cos((age / SYN) * 2 * Math.PI)) / 2;
      const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
      return { age, illum, name: names[Math.floor(((age / SYN) * 8 + 0.5)) % 8] };
    }
    function moonDisc(cx, cy, r, age) {
      // lit portion of a disc for a given lunar age
      const f = age / SYN, k = Math.cos(f * 2 * Math.PI); // 1 new → -1 full
      const waxing = f < 0.5;
      const rx = Math.abs(k) * r;
      const outer = waxing ? `M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r}` : `M${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r}`;
      const sweep = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1b2a4a"/><path d="${outer} A${f1(rx)} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z" fill="#f3e3a6"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(0,0,0,.25)"/>`;
    }
    const CITIES = [['Europe/London', 'London'], ['America/New_York', 'New York'], ['America/Los_Angeles', 'Los Angeles'], ['Asia/Tokyo', 'Tokyo'], ['Asia/Dubai', 'Dubai'], ['Asia/Singapore', 'Singapore'], ['Australia/Sydney', 'Sydney'], ['Asia/Kolkata', 'Mumbai']];
    const zoneHour = (tz, d) => {
      const p = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d);
      const h = +p.find((x) => x.type === 'hour').value, m = +p.find((x) => x.type === 'minute').value;
      return h + m / 60;
    };
    const C = [
      {
        n: 'Date & calendar', sub: 'the everyday one',
        o: { dial: '#f1ede4', dial2: '#fbf9f4', idx: 'baton', hands: 'dauphine', lume: false, idxC: '#16181b', handC: '#16181b', date: true, strap: '#3a2618', bezel: 'thin', top: 'lrn', bot: 'AUTOMATIC' },
        info: `<h4>Date & calendar</h4><p class="born">The most common complication</p><p>A ring printed with 1 to 31 sits under the dial and nudges forward one step each night, usually starting around 9 or 10 pm and snapping over near midnight. Simple, and dumb: it thinks every month has 31 days, so you correct it by hand five times a year.</p><p>Smarter versions exist. An <b>annual calendar</b> knows which months have 30 or 31 days and needs fixing only once a year, at the end of February. A <b>perpetual calendar</b> knows about February and leap years too. Set correctly, it won’t need correcting until March 2100, which, unusually, won’t be a leap year.</p>`,
        controls: () => `<span class="read">Today’s date window: <b>${new Date().getDate()}</b></span>`,
      },
      {
        n: 'Chronograph', sub: 'a built-in stopwatch',
        o: { dial: '#141719', dial2: '#202529', bezel: 'tachy', subs: 2, pushers: true, idx: 'baton', hands: 'baton', lume: true, bracelet: true, top: 'lrn', bot: 'CHRONOGRAPH', secC: '#e5484d', smallSec: false },
        info: `<h4>Chronograph</h4><p class="born">Stopwatch · motorsport’s favorite</p><p>Press the top pusher to start the big central seconds hand; press again to stop it; the bottom pusher snaps everything back to zero. The subdial at 3 counts minutes elapsed. The subdial at 9 is the watch’s normal running seconds. Try it.</p><p>The scale on the bezel is a <b>tachymeter</b>. Start the chronograph at one marker post and stop it at the next, a kilometer (or mile) later, and the hand points to your average speed. It works because speed = 3600 ÷ seconds taken.</p><p>Don’t confuse it with a <b>chronometer</b>, which is any watch certified for accuracy. A watch can be both.</p>`,
        controls: () => `<button type="button" class="btn" data-chrono="start">Start</button><button type="button" class="btn ghost" data-chrono="reset">Reset</button><span class="read" id="chrono-read">0.0 s</span>`,
      },
      {
        n: 'GMT / second time zone', sub: 'for travelers',
        o: { dial: '#0d1014', dial2: '#1a1f26', bezel: 'gmt', gmt: true, idx: 'dot', hands: 'mercedes', date: true, bracelet: true, top: 'lrn', bot: 'GMT · 100M' },
        info: `<h4>GMT</h4><p class="born">1950s · made for airline pilots</p><p>The red arrow-tipped hand goes around once every <b>24 hours</b> and reads against the 24-hour bezel. Set it to another time zone and you can read two at once: local time from the normal hands, "home" time from the arrow.</p><p>Pick a city. The red hand jumps to that city’s time on the 24-hour scale, while the normal hands keep showing yours. Turn the bezel and you can even track a third zone.</p>`,
        controls: () => `<label class="read">Second time zone <select id="gmt-city">${CITIES.map(([z, n]) => `<option value="${z}">${n}</option>`).join('')}</select></label><span class="read" id="gmt-read"></span>`,
      },
      {
        n: 'Moon phase', sub: 'the romantic one',
        moon: true,
        info: '',
        controls: () => `<span class="read" id="moon-read"></span>`,
      },
      {
        n: 'Minute repeater', sub: 'a watch that chimes',
        o: { dial: '#f3efe6', dial2: '#fcfaf5', idx: 'roman', hands: 'leaf', lume: false, idxC: '#2a2a2a', handC: '#2a2a2a', caseC: 'gold', strap: '#2a1810', bezel: 'thin', top: 'lrn', bot: 'RÉPÉTITION MINUTES', smallSec: true },
        info: `<h4>Minute repeater</h4><p class="born">Grand complication · born before electric light</p><p>Before electric lighting, telling the time in the dark was a real problem. The answer was a watch that <b>strikes the time on tiny gongs</b> when you slide a lever on the case: low notes for the hours, double "ding-dong" notes for each quarter hour, high notes for the minutes past.</p><p>Press the button to hear the current time. At 3:47, you’d hear three low tones, three ding-dongs (45 minutes) and two high tones. Repeaters are among the hardest watches to make, and to make sound beautiful.</p>`,
        controls: () => `<button type="button" class="btn" id="rep-go">♪ Strike the time</button><span class="read" id="rep-read"></span>`,
      },
      {
        n: 'Tourbillon', sub: 'a spinning cage',
        tourb: true,
        info: `<h4>Tourbillon</h4><p class="born">Patented by Abraham-Louis Breguet, 1801</p><p>Gravity tugs a balance wheel slightly differently depending on how the watch is positioned, causing tiny timing errors. Breguet’s answer, for pocket watches that sat upright in a waistcoat all day, was to put the entire escapement in a <b>cage that rotates</b>, typically once a minute, so the errors average out.</p><p>On a wristwatch, which moves around constantly anyway, the practical benefit is debated. But it’s mesmerizing to watch, fiendishly hard to make, and it has become the ultimate show of watchmaking skill, usually displayed through an opening in the dial.</p>`,
        controls: () => `<div class="seg" role="group" aria-label="Tourbillon speed"><button type="button" data-tb="1" aria-pressed="true">Real speed</button><button type="button" data-tb="10" aria-pressed="false">10× faster</button></div>`,
      },
    ];
    C.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0));
      b.innerHTML = `${c.n}<small>${c.sub}</small>`;
      b.addEventListener('click', () => show(i));
      tabs.appendChild(b);
    });
    function moonOpts() {
      const m = moonInfo();
      const cx = 0, cy = 42;
      const extra = `<g><path d="M-24 ${cy + 4} A24 24 0 0 1 24 ${cy + 4} Z" fill="#0f1c38" stroke="#c9a96e" stroke-width="1"/>${'<circle cx="-14" cy="' + (cy - 8) + '" r=".9" fill="#fff"/><circle cx="12" cy="' + (cy - 12) + '" r=".7" fill="#fff"/><circle cx="2" cy="' + (cy - 16) + '" r=".6" fill="#fff"/>'}<g clip-path="url(#moonclip)">${moonDisc(cx, cy - 2, 13, m.age)}</g><clipPath id="moonclip"><path d="M-24 ${cy + 4} A24 24 0 0 1 24 ${cy + 4} Z"/></clipPath><path d="M-24 ${cy + 4} Q-12 ${cy - 4} 0 ${cy + 4} Q12 ${cy - 4} 24 ${cy + 4}" fill="#1a2a4f" stroke="#c9a96e" stroke-width=".8"/></g>`;
      return { dial: '#14254a', dial2: '#23396b', idx: 'arabic', hands: 'leaf', lume: false, idxC: '#e8d5a8', handC: '#e8d5a8', caseC: 'gold', strap: '#1b2440', bezel: 'thin', top: 'lrn', bot: 'PHASES DE LUNE', moon: true, extra, secHand: false };
    }
    function tourbOpts() {
      const extra = `<g transform="translate(0 40)"><circle r="27" fill="#0b0d10" stroke="#c9a96e" stroke-width="1.2"/><g id="tb-cage"><path d="M0 -24 L0 24 M-21 -12 L21 12 M-21 12 L21 -12" stroke="#cfd3d9" stroke-width="2.4"/><circle r="24" fill="none" stroke="#cfd3d9" stroke-width="1.5"/><g id="tb-bal"><circle r="13" fill="none" stroke="#c9a96e" stroke-width="2.4"/><path d="M-13 0 L13 0 M0 -13 L0 13" stroke="#c9a96e" stroke-width="1"/></g><circle cx="16" cy="-8" r="5" fill="#e5484d" fill-opacity=".8"/><circle r="2.5" fill="#e5484d"/></g></g>`;
      return { dial: '#e9e5dc', dial2: '#f8f6f1', idx: 'roman', hands: 'leaf', lume: false, idxC: '#2a2a2a', handC: '#2a2a2a', strap: '#1c1c1c', bezel: 'thin', top: 'lrn', bot: 'TOURBILLON', tourb: true, extra, secHand: false };
    }
    function show(i) {
      active = i;
      clearInterval(state.rep);
      state = { chrono: { running: false, start: 0, acc: 0 }, tb: 1 };
      $$('button', tabs).forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
      const c = C[i];
      const o = c.moon ? moonOpts() : c.tourb ? tourbOpts() : c.o;
      wid = mount(stage, o);
      ctr.innerHTML = c.controls();
      if (c.moon) {
        const m = moonInfo();
        info.innerHTML = `<h4>Moon phase</h4><p class="born">Live · tonight’s moon</p><p>A disc painted with two moons sits under a semicircular window and advances a little every day, so the moon appears to wax and wane across the dial. This one is showing the real phase right now.</p><p>A simple mechanical moon phase uses a 59-tooth wheel to approximate two lunar months of 29.5 days each. It drifts by about a day every two and a half years. "Astronomical" versions use cleverer gearing and stay accurate for over a century.</p>`;
        $('#moon-read').innerHTML = `Tonight: <b>${m.name}</b> · ${m.age.toFixed(1)} days old · ${Math.round(m.illum * 100)}% lit`;
      } else info.innerHTML = c.info;
      // wire controls
      $$('[data-chrono]', ctr).forEach((b) => b.addEventListener('click', () => {
        const ch = state.chrono;
        if (b.dataset.chrono === 'start') {
          if (ch.running) { ch.acc += performance.now() - ch.start; ch.running = false; b.textContent = 'Start'; tachy(); }
          else { ch.start = performance.now(); ch.running = true; b.textContent = 'Stop'; }
        } else if (!ch.running) { ch.acc = 0; $('#chrono-read').textContent = '0.0 s'; }
      }));
      $$('[data-tb]', ctr).forEach((b) => b.addEventListener('click', () => { state.tb = +b.dataset.tb; $$('[data-tb]', ctr).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
      const rep = $('#rep-go', ctr);
      if (rep) rep.addEventListener('click', strike);
    }
    function tachy() {
      const s = state.chrono.acc / 1000;
      const r = $('#chrono-read');
      r.innerHTML = s >= 7.2 && s <= 60 ? `${s.toFixed(1)} s · if that was 1 km: <b>${Math.round(3600 / s)} km/h</b>` : `${s.toFixed(1)} s${s < 7.2 ? ' · (tachymeter reads 7.2–60 s)' : ''}`;
    }
    function strike() {
      const d = new Date();
      const h = d.getHours() % 12 || 12, q = Math.floor(d.getMinutes() / 15), m = d.getMinutes() % 15;
      const ac = audio(); let t = ac.currentTime + 0.15;
      const LOW = 659, HIGH = 988;
      for (let i = 0; i < h; i++) { gong(t, LOW); t += 0.55; }
      t += 0.5;
      for (let i = 0; i < q; i++) { gong(t, HIGH); gong(t + 0.2, LOW); t += 0.7; }
      if (q) t += 0.4;
      for (let i = 0; i < m; i++) { gong(t, HIGH, 0.28); t += 0.42; }
      $('#rep-read').innerHTML = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} → <b>${h}</b> low · <b>${q}</b> ding-dong · <b>${m}</b> high`;
    }
    show(0);
    let last = performance.now(), tbA = 0;
    loopWhileVisible(stage, (now) => {
      const dt = (now - last) / 1000; last = now;
      const d = new Date(), c = C[active];
      if (!wid) return;
      if (c.n === 'Chronograph') {
        // normal time on hands, small seconds at 9, chrono on center
        const ch = state.chrono, el = ch.acc + (ch.running ? now - ch.start : 0), s = el / 1000;
        rot(wid, 'm', (d.getMinutes() + d.getSeconds() / 60) * 6);
        rot(wid, 'h', ((d.getHours() % 12) + d.getMinutes() / 60) * 30);
        rot(wid, 's', (Math.floor(s * 8) / 8) * 6);
        rot(wid, 'sub3', (s / 60 / 30) * 360);
        rot(wid, 'sub9', (d.getSeconds() + Math.floor(d.getMilliseconds() / 125) / 8) * 6);
        if (ch.running) $('#chrono-read').textContent = s.toFixed(1) + ' s';
      } else {
        setTime(wid, d, 'sweep');
        if (c.n.startsWith('GMT')) {
          const sel = $('#gmt-city');
          if (sel) {
            const zh = zoneHour(sel.value, d);
            rot(wid, 'g', (zh / 24) * 360);
            $('#gmt-read').innerHTML = `${sel.options[sel.selectedIndex].text}: <b>${String(Math.floor(zh)).padStart(2, '0')}:${String(Math.round((zh % 1) * 60) % 60).padStart(2, '0')}</b>`;
          }
        }
        if (c.n === 'Minute repeater') rot(wid, 'ss', (d.getSeconds() + Math.floor(d.getMilliseconds() / 166) / 6) * 6);
        if (c.tourb) {
          tbA += dt * 6 * state.tb;
          const cage = $('#tb-cage'), bal = $('#tb-bal');
          if (cage) cage.setAttribute('transform', `rotate(${f1(tbA % 360)})`);
          if (bal) bal.setAttribute('transform', `rotate(${f1(Math.sin(now / 1000 * Math.PI * 2 * (state.tb === 10 ? 1 : 4)) * 160)})`);
        }
      }
    });
  })();

  /* ═════════ CH8: TIMELINE ═════════ */
  (function timeline() {
    const ol = $('#timeline');
    const ic = (k) => {
      const s = G.gold, s2 = G.gold2;
      const I = {
        egg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="30" ry="36" fill="none" stroke="${s}" stroke-width="2.5"/><circle cx="50" cy="15" r="5" fill="none" stroke="${s}" stroke-width="2"/><line x1="50" y1="55" x2="50" y2="32" stroke="${s2}" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => { const [x, y] = polar(24, i * 30); return `<circle cx="${50 + x}" cy="${55 + y}" r="1.6" fill="${s}"/>`; }).join('')}</svg>`,
        spring: `<svg viewBox="0 0 100 100"><path d="${(() => { let d = 'M50 50'; for (let a = 0; a < 6 * Math.PI * 2; a += 0.2) { const r = 2 + a * 1.05; d += ` L${f1(50 + Math.cos(a) * r)} ${f1(50 + Math.sin(a) * r)}`; } return d; })()}" fill="none" stroke="${s2}" stroke-width="1.6"/></svg>`,
        lever: `<svg viewBox="0 0 100 100"><circle cx="30" cy="62" r="20" fill="none" stroke="${s}" stroke-width="2.5"/><path d="M58 40 L40 54 M58 40 L46 66 M58 40 L84 22" stroke="${s2}" stroke-width="3" stroke-linecap="round"/><circle cx="58" cy="40" r="4" fill="${s}"/></svg>`,
        tourb: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="${s}" stroke-width="2.5"/><path d="M50 16 V84 M21 33 L79 67 M21 67 L79 33" stroke="${s2}" stroke-width="2"/><circle cx="50" cy="50" r="16" fill="none" stroke="${s}" stroke-width="2"/></svg>`,
        wrist: `<svg viewBox="0 0 100 100"><rect x="40" y="6" width="20" height="88" rx="4" fill="none" stroke="${s}" stroke-width="2"/><circle cx="50" cy="50" r="19" fill="#0a0c0f" stroke="${s2}" stroke-width="2.5"/><path d="M50 50 L50 38 M50 50 L58 54" stroke="${s2}" stroke-width="2"/></svg>`,
        plane: `<svg viewBox="0 0 100 100"><path d="M10 52 L90 44 M44 48 L30 22 M50 47 L64 22 M80 45 L86 34" stroke="${s2}" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="34" y="62" width="32" height="26" rx="6" fill="none" stroke="${s}" stroke-width="2.5"/></svg>`,
        helmet: `<svg viewBox="0 0 100 100"><path d="M18 60 Q50 10 82 60 Z" fill="none" stroke="${s}" stroke-width="2.5"/><line x1="10" y1="62" x2="90" y2="62" stroke="${s}" stroke-width="2.5"/><circle cx="50" cy="80" r="11" fill="none" stroke="${s2}" stroke-width="2.5"/></svg>`,
        wave: `<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="20" fill="none" stroke="${s2}" stroke-width="2.5"/><path d="M10 74 q10 -8 20 0 t20 0 t20 0 t20 0 M10 86 q10 -8 20 0 t20 0 t20 0 t20 0" stroke="${s}" stroke-width="2.5" fill="none"/></svg>`,
        rotor: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="${s}" stroke-width="2.5"/><path d="M16 50 A34 34 0 0 0 84 50 L64 50 A14 14 0 0 1 36 50 Z" fill="${s}" fill-opacity=".5"/></svg>`,
        dive: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="${s}" stroke-width="5" stroke-dasharray="2 4.6"/><circle cx="50" cy="50" r="26" fill="none" stroke="${s2}" stroke-width="2"/><polygon points="50,12 45,20 55,20" fill="${G.lume}"/></svg>`,
        moon: `<svg viewBox="0 0 100 100"><circle cx="50" cy="44" r="24" fill="none" stroke="${s2}" stroke-width="2.5"/><path d="M62 30 A18 18 0 1 0 62 58 A14 14 0 1 1 62 30" fill="${s}" fill-opacity=".6"/><path d="M14 90 Q50 66 86 90" stroke="${s}" stroke-width="2.5" fill="none"/></svg>`,
        crisis: `<svg viewBox="0 0 100 100"><polyline points="10,24 30,30 46,52 60,70 76,80 90,82" fill="none" stroke="${G.red}" stroke-width="3"/><path d="M10 88 H90 M10 88 V14" stroke="#6e3a3d" stroke-width="2"/></svg>`,
        swatch: `<svg viewBox="0 0 100 100"><rect x="36" y="6" width="28" height="88" rx="6" fill="#e5484d" fill-opacity=".7"/><circle cx="50" cy="50" r="20" fill="#f3d34a" stroke="#fff" stroke-width="2"/><path d="M50 50 L50 36 M50 50 L60 56" stroke="#16181b" stroke-width="2.4"/></svg>`,
        coax: `<svg viewBox="0 0 100 100"><circle cx="40" cy="56" r="22" fill="none" stroke="${s}" stroke-width="2.5"/><circle cx="40" cy="56" r="12" fill="none" stroke="${s2}" stroke-width="2.5"/><path d="M60 36 L80 20" stroke="${s2}" stroke-width="3"/><circle cx="62" cy="34" r="4" fill="${G.lume}"/></svg>`,
        smart: `<svg viewBox="0 0 100 100"><rect x="30" y="20" width="40" height="52" rx="12" fill="none" stroke="${s}" stroke-width="2.5"/><path d="M38 48 h6 l3 -8 l5 16 l3 -8 h7" stroke="${G.lume}" stroke-width="2.4" fill="none"/></svg>`,
        now: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="${s}" stroke-width="2.5"/><circle cx="50" cy="50" r="22" fill="none" stroke="${s2}" stroke-width="1"/><path d="M50 50 L50 30 M50 50 L64 58" stroke="${s2}" stroke-width="2.5"/><circle cx="50" cy="50" r="2.5" fill="${G.red}"/></svg>`,
      };
      return I[k];
    };
    const T = [
      ['c.1510', 'Renaissance', 'egg', 'Clocks you can carry', 'Spring-driven clocks small enough to carry appear in German cities like Nuremberg; locksmith Peter Henlein is often credited. Most had only an hour hand: they weren’t accurate enough to need a minute hand.'],
      ['1675', 'Scientific revolution', 'spring', 'The hairspring', 'Christiaan Huygens (and, he argued, Robert Hooke before him) adds a spiral balance spring to the balance wheel. Errors fall from hours a day to minutes. Pocket watches start getting minute hands.'],
      ['c.1755', 'Georgian England', 'lever', 'The lever escapement', 'English watchmaker Thomas Mudge invents the detached lever escapement. Refined by Swiss makers in the 1800s, its descendant beats inside almost every mechanical watch made today.'],
      ['1801', 'Paris', 'tourb', 'The tourbillon', 'Abraham-Louis Breguet patents the tourbillon. Breguet also gave us the overcoil hairspring, the first self-winding "perpétuelle" pocket watches and hands that still bear his name.'],
      ['1868', 'Geneva', 'wrist', 'A wristwatch, for a countess', 'Patek Philippe makes a jewelled wristwatch for Countess Koscowicz of Hungary, often cited as the first Swiss wristwatch. For decades, "wristlets" were considered women’s jewelry.'],
      ['1904', 'Paris', 'plane', 'The Santos', 'Aviator Alberto Santos-Dumont complains he can’t check his pocket watch while flying. His friend Louis Cartier makes him a wristwatch with a square case and visible screws.'],
      ['1914–18', 'World War I', 'helmet', 'The war that changed men’s minds', 'Officers coordinating attacks need the time at a glance, hands free. "Trench watches", pocket watches with welded lugs, go to the front. Soldiers come home wearing wristwatches.'],
      ['1926', 'Geneva', 'wave', 'The Oyster', 'Rolex patents the Oyster case with its screw-down crown, the first truly waterproof wristwatch case on the market. In 1927 swimmer Mercedes Gleitze wears one across the English Channel.'],
      ['1931', 'Geneva', 'rotor', 'The Perpetual rotor', 'After John Harwood’s 1920s self-winding watch, Rolex introduces a rotor that swings a full 360°. Nearly every automatic watch today winds this way.'],
      ['1953', 'Under the sea', 'dive', 'The dive watch', 'Blancpain’s Fifty Fathoms and Rolex’s Submariner arrive, with rotating bezels, big lume and serious water resistance. The style still dominates the market.'],
      ['1969', 'An extraordinary year', 'moon', 'The moon, automatic chronographs & quartz', 'In July an Omega Speedmaster goes to the lunar surface on Buzz Aldrin’s wrist. The first automatic chronographs launch: Zenith El Primero, the Heuer–Breitling–Hamilton Calibre 11, and Seiko’s 6139. And on Christmas Day, Seiko sells the first quartz wristwatch.'],
      ['1970s–80s', 'The quartz crisis', 'crisis', 'The industry collapses', 'Cheap, accurate quartz watches from Japan and the US flood the market. The Swiss industry shrinks dramatically: roughly two-thirds of its jobs disappear and hundreds of brands close or are sold.', true],
      ['1983', 'Comeback', 'swatch', 'Swatch and G-Shock', 'Swiss engineers launch the Swatch: plastic, 51 parts, cheap and fun. Its success helps fund the industry’s revival. The same year Casio launches the G-Shock.'],
      ['1999', 'New ideas', 'coax', 'Co-Axial and Spring Drive', 'Omega puts George Daniels’ co-axial escapement, the first truly new practical escapement in about 200 years, into series production. Seiko launches Spring Drive.'],
      ['2015', 'Silicon Valley', 'smart', 'The smartwatch', 'The Apple Watch launches. By some estimates, within a few years Apple ships more watches each year than the entire Swiss industry. Mechanical watches don’t die; they become luxuries.'],
      ['Today', 'The renaissance', 'now', 'A golden age for nerds', 'Independent watchmakers, enthusiastic microbrands, online communities and a huge pre-owned market. It has never been easier to learn about watches, or to find a great one at any price.'],
    ];
    ol.innerHTML = T.map(([y, era, k, h, p, cr]) => `<li class="tl${cr ? ' crisis' : ''}"><span class="yr">${y}</span><span class="era">${era}</span><div class="ic">${ic(k)}</div><h4>${h}</h4><p>${p}</p></li>`).join('');
    const bar = $('#tl-progress');
    const upd = () => { const m = ol.scrollWidth - ol.clientWidth; bar.style.width = (m > 0 ? (ol.scrollLeft / m) * 100 : 0) + '%'; };
    ol.addEventListener('scroll', upd, { passive: true }); upd();
    const stepW = () => ol.querySelector('.tl').getBoundingClientRect().width + 16;
    $('#tl-prev').addEventListener('click', () => ol.scrollBy({ left: -stepW(), behavior: 'smooth' }));
    $('#tl-next').addEventListener('click', () => ol.scrollBy({ left: stepW(), behavior: 'smooth' }));
    ol.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ol.scrollBy({ left: stepW(), behavior: 'smooth' }); if (e.key === 'ArrowLeft') ol.scrollBy({ left: -stepW(), behavior: 'smooth' }); });
    // drag to scroll with a mouse
    let down = false, sx = 0, sl = 0, moved = false;
    ol.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = ol.scrollLeft; });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; ol.classList.add('drag'); } ol.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; ol.classList.remove('drag'); });
  })();

  /* ═════════ CH9: BRANDS ═════════ */
  (function brands() {
    const B = [
      [1, 'Casio', '1946 · Tokyo, Japan', 'The watch everyone has owned.', 'Casio’s G-Shock (1983) was born when engineer Kikuo Ibe set out to make a watch that survived a fall. The humble F-91W has been in production since 1989 and still costs about as much as lunch. Collectors love both.', ['G-Shock', 'F-91W', 'Royale']],
      [1, 'Timex', '1854 · Connecticut, USA', 'America’s everyman watch.', 'Born as the Waterbury Clock Company, Timex made watches cheap enough for everyone. Its Ironman (1986) became the bestselling sports watch in America, and its Indiglo night-light is famous. Today it also makes stylish vintage reissues.', ['Weekender', 'Marlin', 'Ironman']],
      [1, 'Seiko', '1881 · Tokyo, Japan', 'Does everything, at every price.', 'Seiko gave the world the first quartz wristwatch and Spring Drive, and it makes nearly every part itself, down to hairsprings and lume. Its Seiko 5 and Prospex divers are classic first mechanical watches.', ['Seiko 5 Sports', 'Prospex', 'Presage', 'Astron']],
      [1, 'Citizen', '1918 · Tokyo, Japan', 'Powered by light.', 'Citizen pioneered light-powered analog watches, now called Eco-Drive: a solar cell under the dial means you may never change a battery. Through its Miyota division it is also one of the world’s biggest movement makers.', ['Eco-Drive', 'Promaster', 'Tsuyosa']],
      [2, 'Tissot', '1853 · Le Locle, Switzerland', 'Swiss, sensible, surprisingly cool.', 'Part of Swatch Group, Tissot makes affordable Swiss watches with solid movements. Its PRX, a revived 1970s integrated-bracelet design, became one of the hottest watches of the 2020s.', ['PRX', 'Gentleman', 'Seastar']],
      [2, 'Hamilton', '1892 · Pennsylvania, USA (now Swiss)', 'American roots, Hollywood star.', 'Hamilton supplied watches to the US military and railroads, made the first electric wristwatch (the 1957 Ventura) and has appeared in hundreds of films. Its Khaki Field Mechanical is a favorite first watch.', ['Khaki Field', 'Ventura', 'Intra-Matic']],
      [2, 'Oris', '1904 · Hölstein, Switzerland', 'Independent and unpretentious.', 'One of the few Swiss brands of its size with no big group behind it. Known for honest divers, a cheeky sense of humor and its in-house Calibre 400, with a five-day power reserve and strong anti-magnetism.', ['Aquis', 'Divers Sixty-Five', 'Big Crown']],
      [2, 'Longines', '1832 · Saint-Imier, Switzerland', 'Old-school elegance, fair prices.', 'Longines’ winged-hourglass logo is one of the oldest registered trademarks still in use. It timed early aviation records and designed a navigation watch with Charles Lindbergh. Excellent value inside Swatch Group.', ['Spirit', 'HydroConquest', 'Master Collection']],
      [3, 'Tudor', '1926 · Geneva, Switzerland', 'Rolex’s younger sibling.', 'Created by Rolex founder Hans Wilsdorf to offer Rolex quality at a lower price, Tudor supplied dive watches to navies. Reborn in the 2010s with the vintage-styled Black Bay, it’s now a hit in its own right.', ['Black Bay', 'Pelagos', 'Ranger']],
      [3, 'TAG Heuer', '1860 · Saint-Imier, Switzerland', 'Speed, racing, Steve McQueen.', 'Heuer made dashboard timers and racing chronographs. The square Monaco was worn by Steve McQueen in the 1971 film <em>Le Mans</em>; the Carrera is named after a Mexican road race. Now part of LVMH.', ['Carrera', 'Monaco', 'Aquaracer']],
      [3, 'Omega', '1848 · La Chaux-de-Fonds → Biel', 'The Moonwatch.', 'The Speedmaster was qualified by NASA for crewed spaceflight in 1965 and went to the Moon in 1969. Omega also brought the co-axial escapement into series production, has been James Bond’s watch since 1995 and keeps time at the Olympics.', ['Speedmaster', 'Seamaster', 'Constellation']],
      [3, 'Rolex', '1905 · London → Geneva', 'The name everyone knows.', 'Owned by a charitable foundation, Rolex is famously secretive and does nearly everything in-house, even casting its own gold. It gave us the waterproof Oyster case, the Perpetual rotor and the Datejust. Popular models can be very hard to buy new.', ['Submariner', 'Datejust', 'GMT-Master II', 'Daytona']],
      [3, 'Grand Seiko', '1960 · Japan', 'Seiko’s masterpiece.', 'Grand Seiko is known for <em>zaratsu</em> polishing that leaves distortion-free mirror surfaces, and for dials inspired by nature, like the textured "Snowflake". It makes mechanical, quartz and Spring Drive watches to very high standards.', ['Snowflake', 'Heritage', 'Evolution 9']],
      [3, 'Cartier', '1847 · Paris, France', 'The jeweler who shaped the wristwatch.', 'Cartier made the Santos for an aviator in 1904 and introduced the Tank, inspired by World War I tanks, in 1917. Its square and rectangular designs are some of the most copied in history.', ['Tank', 'Santos', 'Ballon Bleu']],
      [3, 'Jaeger-LeCoultre', '1833 · Le Sentier, Switzerland', 'The watchmaker’s watchmaker.', 'JLC has developed more than a thousand calibres, many supplied to other famous houses. Its Reverso (1931) flips over to protect the crystal during polo matches. It also makes the Atmos, a clock powered by changes in air temperature.', ['Reverso', 'Master Control', 'Polaris']],
      [3, 'IWC Schaffhausen', '1868 · Schaffhausen, Switzerland', 'Founded by an American, famous for pilots.', 'Founded by Boston watchmaker Florentine Ariosto Jones in German-speaking Switzerland, IWC is best known for big, clean pilot’s watches and the elegant Portugieser.', ['Big Pilot', 'Portugieser', 'Ingenieur']],
      [4, 'Audemars Piguet', '1875 · Le Brassus, Switzerland', 'The Royal Oak.', 'Still family-controlled, AP changed watchmaking in 1972 with the Royal Oak: a steel sports watch by Gérald Genta with an octagonal bezel, priced above many gold watches. Today it is among the most coveted watches in the world.', ['Royal Oak', 'Royal Oak Offshore', 'Code 11.59']],
      [4, 'Patek Philippe', '1839 · Geneva, Switzerland', 'The summit, for many collectors.', 'Family-owned by the Stern family since 1932. Patek made the most complicated watches of the 20th century, holds many records for the most expensive watches ever sold at auction, and its Nautilus, another Genta design, has had legendary waiting lists.', ['Calatrava', 'Nautilus', 'Aquanaut', 'Grand Complications']],
      [4, 'Vacheron Constantin', '1755 · Geneva, Switzerland', 'The oldest, still going.', 'Founded the year Thomas Mudge was inventing the lever escapement, Vacheron claims the longest unbroken history of any watch manufacture. Known for refined finishing and spectacular complications.', ['Overseas', 'Patrimony', 'Historiques']],
      [4, 'A. Lange & Söhne', '1845 · Glashütte, Germany', 'German precision, reborn.', 'Founded in Saxony, nationalized after World War II, and revived in 1990 by founder’s great-grandson Walter Lange. Famous for German-silver movements, hand-engraved balance cocks, and assembling movements twice to get them perfect. The Lange 1’s off-center dial is iconic.', ['Lange 1', 'Zeitwerk', 'Saxonia']],
      [4, 'The independents', 'Everywhere', 'Tiny workshops, enormous reputations.', 'Makers like F.P. Journe, Kari Voutilainen, Philippe Dufour and MB&F make a few hundred watches a year or fewer, often by hand. The late George Daniels made almost every part of his watches himself. Waiting lists can run for years.', ['F.P. Journe', 'MB&F', 'Voutilainen']],
    ];
    const tierS = ['', '$', '$$', '$$$', '$$$$'];
    const ul = $('#brands');
    ul.innerHTML = B.map(([tier, n, meta, hook, why, models]) => `<li data-tier="${tier}"><article class="bcard"><div class="bhead"><div><h3 class="bname">${n}</h3><p class="bmeta">${meta}</p></div><span class="btier" title="Typical price range">${tierS[tier]}</span></div><p class="bhook">${hook}</p><p class="bwhy">${why}</p><div class="bicons">${models.map((m) => `<span><b>◆</b> ${m}</span>`).join('')}</div></article></li>`).join('');
    $$('.bcard').forEach((e) => { e.classList.add('reveal'); rio.observe(e); });
    segGroup('.brand-filter button', 'tier', (t) => $$('li', ul).forEach((li) => (li.hidden = t !== 'all' && li.dataset.tier !== t)));
  })();

  /* ═════════ CH10: WRIST SIZER ═════════ */
  (function sizer() {
    const svg = $('#size-svg'), sw = $('#size-slider'), sc = $('#size-case-slider'), verdict = $('#size-verdict');
    function draw() {
      const C = +sw.value, D = +sc.value;
      $('#size-wrist').textContent = C + ' cm';
      $('#size-case').textContent = D + ' mm';
      syncFill(sw); syncFill(sc);
      const wristW = C * 10 * 0.3, L2L = D * 1.2;
      const px = 3.4, cy = 150, ww = wristW * px;
      const lo = Math.round(wristW * 0.88 / 1.2), hi = Math.round(wristW / 1.2);
      let s = `<defs><linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c79a77"/><stop offset=".5" stop-color="#e0b894"/><stop offset="1" stop-color="#b8876a"/></linearGradient></defs>`;
      s += `<path d="M-10 ${cy - ww / 2 - 6} C120 ${cy - ww / 2 - 10} 380 ${cy - ww / 2 + 4} 530 ${cy - ww / 2 - 14} L530 ${cy + ww / 2 + 14} C380 ${cy + ww / 2 - 4} 120 ${cy + ww / 2 + 10} -10 ${cy + ww / 2 + 6} Z" fill="url(#skin)"/>`;
      // strap
      s += `<rect x="${260 - D * px * 0.45}" y="0" width="${D * px * 0.9}" height="300" fill="#1f1f22" opacity=".95"/>`;
      // watch
      const r = (D / 2) * px, lug = (L2L / 2) * px;
      s += `<path d="M${260 - r * 0.62} ${cy - lug} L${260 + r * 0.62} ${cy - lug} L${260 + r * 0.8} ${cy} L${260 + r * 0.62} ${cy + lug} L${260 - r * 0.62} ${cy + lug} L${260 - r * 0.8} ${cy} Z" fill="#a3aab2"/>`;
      s += `<circle cx="260" cy="${cy}" r="${r}" fill="#cfd3d9" stroke="#6e757d"/><circle cx="260" cy="${cy}" r="${r * 0.84}" fill="#141a20"/>`;
      for (let k = 0; k < 12; k++) { const [x, y] = polar(r * 0.72, k * 30); s += `<circle cx="${260 + x}" cy="${cy + y}" r="${Math.max(1.5, r * 0.05)}" fill="${G.lume}"/>`; }
      s += `<path d="M260 ${cy} L260 ${cy - r * 0.6} M260 ${cy} L${260 + r * 0.4} ${cy + r * 0.15}" stroke="#f1ece2" stroke-width="${Math.max(2, r * 0.06)}" stroke-linecap="round"/>`;
      s += `<rect x="${260 + r}" y="${cy - 6}" width="9" height="12" rx="2" fill="#a3aab2"/>`;
      // dims
      const over = L2L > wristW;
      s += `<g font-family="DM Mono, monospace" font-size="11"><line x1="${380}" y1="${cy - ww / 2}" x2="${380}" y2="${cy + ww / 2}" stroke="#3b2414" stroke-width="1.4"/><path d="M374 ${cy - ww / 2} h12 M374 ${cy + ww / 2} h12" stroke="#3b2414"/><text x="392" y="${cy + 4}" fill="#3b2414" font-weight="500">wrist top ≈ ${Math.round(wristW)} mm</text>`;
      s += `<line x1="140" y1="${cy - lug}" x2="140" y2="${cy + lug}" stroke="${over ? '#a3161d' : '#1d5a2e'}" stroke-width="1.4"/><path d="M134 ${cy - lug} h12 M134 ${cy + lug} h12" stroke="${over ? '#a3161d' : '#1d5a2e'}"/><text x="128" y="${cy + 4}" text-anchor="end" font-weight="500" fill="${over ? '#a3161d' : '#1d5a2e'}">lug-to-lug ≈ ${Math.round(L2L)} mm</text></g>`;
      svg.innerHTML = s;
      const ratio = L2L / wristW;
      const v = ratio > 1.04 ? `<b>Too big.</b> The lugs overhang the edge of your wrist. Look below ${hi} mm, or at watches with short, curved lugs.`
        : ratio > 0.97 ? `<b>Right at the limit.</b> It will fit, but it’ll look big. Lots of people like that; lots don’t.`
        : ratio > 0.82 ? `<b>A good fit.</b> The lugs sit inside your wrist with a little room to spare.`
        : `<b>On the small side.</b> Fits comfortably, with a classic vintage look. Plenty of people prefer it.`;
      verdict.innerHTML = `${v}<br><span style="font-family:var(--mono);font-size:.78rem;color:var(--steel-2)">Sweet spot for a ${C} cm wrist: roughly ${lo}–${hi} mm.</span>`;
    }
    sw.addEventListener('input', draw); sc.addEventListener('input', draw);
    draw();
  })();

  /* ═════════ CH10: BUDGET LADDER ═════════ */
  (function budget() {
    const s = $('#bud-slider'), out = $('#bud-out'), card = $('#bud-card');
    const L = [
      ['$40', 'The cult classics', 'Under $50', 'Cheap doesn’t mean bad. These are tough, accurate, quartz and beloved by collectors who own watches worth a thousand times more.', ['Casio F-91W', 'Casio A158', 'Timex Weekender']],
      ['$150', 'Tough & charming', '$50–200', 'Indestructible digital icons and your first taste of a mechanical movement.', ['G-Shock DW-5600', 'Casio Duro', 'Orient Bambino', 'Timex Expedition']],
      ['$400', 'Your first automatic', '$200–500', 'The sweet spot for a first "real" watch: Japanese automatics, Swiss quartz and solar divers.', ['Seiko 5 Sports', 'Orient Kamasu', 'Citizen Promaster', 'Tissot PRX quartz']],
      ['$800', 'Swiss mechanical', '$500–1,000', 'Swiss automatic movements, sapphire crystals and better finishing. Also where enthusiast microbrands shine.', ['Hamilton Khaki Field', 'Tissot PRX Powermatic 80', 'Seiko Prospex', 'Baltic, Christopher Ward']],
      ['$2,000', 'The serious tier', '$1,000–3,000', 'Real heritage brands, in-house movements and the kind of finishing you notice up close.', ['Longines Spirit', 'Oris Aquis', 'Sinn 556', 'Hamilton Intra-Matic']],
      ['$5,000', 'Entry-level luxury', '$3,000–7,000', 'Watches you might pass down. Famous names, chronometer movements, long warranties.', ['Tudor Black Bay', 'Omega Seamaster 300M', 'Grand Seiko', 'TAG Heuer Carrera']],
      ['$10,000', 'The icons', '$7,000–15,000', 'The watches people mean when they say "a nice watch". Popular models may come with waiting lists.', ['Omega Speedmaster', 'Rolex Submariner', 'JLC Reverso', 'Grand Seiko Spring Drive']],
      ['$20,000+', 'Haute horlogerie', '$15,000 and up', 'High watchmaking: hand-finished movements, grand complications, independent makers. If you’re here, you’ve probably stopped reading guides.', ['AP Royal Oak', 'Patek Philippe Calatrava', 'A. Lange & Söhne Lange 1', 'F.P. Journe']],
    ];
    function draw() {
      const l = L[+s.value];
      out.textContent = l[0];
      card.innerHTML = `<div><p class="tier">${l[1]}</p><p class="range">${l[2]}</p></div><div><p>${l[3]}</p><ul>${l[4].map((x) => `<li>${x}</li>`).join('')}</ul></div>`;
    }
    s.addEventListener('input', draw); draw();
  })();

  /* ═════════ CH10: GLOSSARY ═════════ */
  (function glossary() {
    const T = [
      ['Calibre', 'The movement inside a watch, usually identified by a code like "ETA 2824" or "NH35".'],
      ['Chronometer', 'A watch certified for accuracy, usually by COSC in Switzerland (−4 to +6 s/day). Not the same as a chronograph.'],
      ['Chronograph', 'A watch with a built-in stopwatch, operated by pushers.'],
      ['Complication', 'Any function beyond hours, minutes and seconds: date, moon phase, chronograph, GMT and so on.'],
      ['Hacking', 'When the seconds hand stops as you pull out the crown, so you can set the time to the exact second.'],
      ['Lume', 'Glow-in-the-dark paint on the hands and markers. Modern lume (like Super-LumiNova) is non-radioactive.'],
      ['Sapphire crystal', 'Lab-grown sapphire used as the watch glass. Extremely scratch-resistant.'],
      ['Quickset', 'Being able to change the date directly with the crown instead of spinning the hands round 24 hours.'],
      ['Power reserve', 'How long a fully wound mechanical watch runs before stopping. Typically 40–80 hours.'],
      ['In-house', 'A movement designed and made by the brand itself rather than bought from a specialist supplier.'],
      ['Swiss Made', 'Legally protected: a Swiss movement, cased and finally inspected in Switzerland, with at least 60% of the manufacturing cost Swiss.'],
      ['Homage', 'A watch that closely copies the look of a famous design without copying its logo. Legal, cheap and endlessly debated.'],
      ['Grail', 'Your dream watch, the one you’d buy if money were no object. Everyone has one. It changes.'],
      ['Microbrand', 'A small, usually online-only brand, often founded by enthusiasts and great value for money.'],
      ['NATO strap', 'A single-piece fabric strap threaded under the watch, based on a British military design. Cheap, tough and very swappable.'],
      ['Patina', 'Aging of a dial, lume or hands, like old lume turning cream. Collectors often prize it on vintage watches.'],
    ];
    $('#glossary').innerHTML = T.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('');
  })();
})();

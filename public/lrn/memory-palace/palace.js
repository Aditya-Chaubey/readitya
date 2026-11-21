/* lrn — The Memory Palace */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const C = { c1: '#c8553d', c2: '#3b6fd8', c3: '#1f8a5b', card: '#fbf7ef' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => s.toLowerCase().trim().replace(/[^a-z ]/g, '').replace(/(ies)$/, 'y').replace(/(oes)$/, 'o').replace(/s$/, '');
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };

  /* tooltip */
  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', hideTip); };

  /* reveal */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(n); };
  $$('.rv').forEach((n) => reveal(n));

  /* progress + rail */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  chapters.forEach((c, i) => { const a = el('a', '', ROMAN[i]); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const rl = $$('a', rail);
  const onScroll = () => {
    const d = document.documentElement; bar.style.width = (d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', d.scrollTop > innerHeight * .8);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur)); rail.classList.toggle('on-dark', cur >= 0 && chapters[cur].classList.contains('blue'));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ═════════ HERO: blueprint draws itself ═════════ */
  (() => {
    const hero = $('.hero'); if (!hero) return;
    $$('.draw-me path, .draw-me circle', hero).forEach((p, i) => { const L = Math.ceil(p.getTotalLength ? p.getTotalLength() : 600); p.style.setProperty('--len', L); p.style.setProperty('--dl', (.2 + i * .12) + 's'); });
    requestAnimationFrame(() => hero.classList.add('go'));
    $('h1 .t3').classList.add('shine');
    // gold dust
    const c = $('#dust'), ctx = c.getContext('2d'); let w, h, dpr, P = [], run = true;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); P = Array.from({ length: Math.round(w / 18) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .6 + Math.random() * 1.8, v: .15 + Math.random() * .45, a: .2 + Math.random() * .6, t: Math.random() * 6 })); };
    const draw = () => { if (!run) return; ctx.clearRect(0, 0, w, h); for (const p of P) { p.y -= p.v; p.t += .02; p.x += Math.sin(p.t) * .25; if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; } ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(p.t * 2)); ctx.fillStyle = '#f3d38d'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); } if (!RM) requestAnimationFrame(draw); };
    size(); draw(); addEventListener('resize', size);
    if (io) new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was && !RM) draw(); }).observe(c);
  })();

  /* ═════════ ROUND 1: rote memory test ═════════ */
  const R1 = ['Umbrella', 'Violin', 'Pineapple', 'Ladder', 'Candle', 'Elephant', 'Kite', 'Diamond', 'Helmet', 'Volcano'];
  let r1Score = null;
  (() => {
    const body = $('#r1-body'); if (!body) return;
    const intro = () => {
      body.innerHTML = `<p class="r-h">The one-minute test</p><h3 class="r-title">Remember ten words</h3><p class="r-sub">You'll see ten words for 30 seconds. Then they'll disappear, and you'll type as many as you can remember, in any order. Use whatever method you normally would.</p><div class="r-act"><button class="btn" id="r1-go">Start the test</button></div>`;
      $('#r1-go').onclick = show;
    };
    const show = async () => {
      body.innerHTML = `<p class="r-h">Memorise these</p><div class="r-words">${R1.map((w, i) => `<span style="animation-delay:${i * .05}s">${w}</span>`).join('')}</div><div class="r-timer"><i id="r1-t"></i></div><div class="r-act"><button class="btn ghost small" id="r1-skip">I'm ready</button></div>`;
      const t = $('#r1-t'); let done = false;
      $('#r1-skip').onclick = () => { done = true; recall(); };
      const T0 = performance.now(), D = 30000;
      const tick = (now) => { if (done) return; const k = (now - T0) / D; t.style.transform = `scaleX(${1 - Math.min(1, k)})`; if (k >= 1) { done = true; recall(); } else requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    const recall = () => {
      const got = new Set(), wrong = [];
      body.innerHTML = `<p class="r-h">Now recall</p><h3 class="r-title">Type each word you remember</h3><p class="r-sub">Press Enter after each one. When you're out of ideas, hit Done.</p><div class="r-input"><input id="r1-in" placeholder="Type a word…" autocomplete="off" aria-label="Word"><button class="btn" id="r1-done">Done</button></div><div class="r-got" id="r1-got"></div>`;
      const inp = $('#r1-in'), g = $('#r1-got'); inp.focus({ preventScroll: true });
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !inp.value.trim()) return;
        const v = norm(inp.value), hit = R1.find((w) => norm(w) === v);
        if (hit && !got.has(hit)) { got.add(hit); g.append(el('span', 'ok', '✓ ' + hit)); } else if (!hit) { wrong.push(inp.value); g.append(el('span', 'no', inp.value)); }
        inp.value = '';
      });
      $('#r1-done').onclick = () => score(got.size);
    };
    const score = (n) => {
      r1Score = n;
      body.innerHTML = `<p class="r-h">Your baseline</p><div class="r-score"><p class="r-big">${n}<span style="font-size:.4em;color:var(--ink-3)">/10</span></p><div><p class="r-sub">${n >= 8 ? 'Impressive natural memory. A palace will make it bulletproof.' : n >= 5 ? 'Right in the typical range. Remember this number.' : 'Lists of unrelated words are hard for everyone. Watch what happens later.'}</p><div class="r-dots">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="animation-delay:${i * .06}s"></i>`).join('')}</div></div></div><div class="r-act"><button class="btn ghost small" id="r1-again">Try again</button></div>`;
      $('#r1-again').onclick = intro;
    };
    intro();
  })();

  /* ═════════ timeline ═════════ */
  (() => {
    const tr = $('#tl-track'); if (!tr) return;
    const T = [
      ['c. 500 BC', '🏛️', 'Simonides and the banquet', 'The legendary origin. A Greek poet identifies the victims of a collapsed hall by remembering where each sat.'],
      ['c. 80s BC', '📜', 'The first manual', 'The Roman <em>Rhetorica ad Herennium</em> sets out rules still used today: distinct, well-lit loci at moderate distances, and images that are striking, active and strange.'],
      ['55 BC', '🗣️', 'Cicero', 'Rome’s greatest orator tells the Simonides story in <em>De Oratore</em> and praises the method for giving long speeches without notes.'],
      ['c. AD 95', '🏺', 'Quintilian', 'The teacher of rhetoric describes walking through a house, placing an anchor in the living room, a spear in the dining room, to recall a speech.'],
      ['1200s', '⛪', 'Monks and scholars', 'Medieval thinkers such as Albertus Magnus and Thomas Aquinas treat trained memory as a moral virtue. Monks memorise scripture and sermons in imagined buildings.'],
      ['1500s', '🖨️', 'Printing changes everything', 'As printed books spread, memorising whole texts becomes less necessary, and the art slowly fades from education.'],
      ['1596', '🇨🇳', 'Matteo Ricci', 'An Italian Jesuit in China teaches the memory palace to Chinese scholars preparing for the imperial exams, as a way to win interest in European learning.'],
      ['1600', '🔥', 'Giordano Bruno', 'The philosopher who built dizzying memory systems is burned in Rome, for heresy rather than mnemonics, but he remains the art’s most famous martyr.'],
      ['1600s–1800s', '🔢', 'The Major System', 'Systems for turning numbers into consonant sounds appear in the 1600s and are refined over the next two centuries into the version used today.'],
      ['1991', '🏆', 'The World Memory Championships', 'Tony Buzan and Raymond Keene launch a competition where athletes memorise cards, numbers, names and poems. Almost all of them use memory palaces.'],
      ['2003', '🧠', 'Are champions’ brains different?', 'Eleanor Maguire’s team scans superior memorisers and finds normal brains, but a strategy: nearly all use the method of loci.'],
      ['2006', '📖', 'A journalist wins', 'Joshua Foer, a reporter covering the US Memory Championship, trains for a year and wins it. His book <em>Moonwalking with Einstein</em> becomes a bestseller.'],
      ['2010', '🔍', 'Sherlock’s mind palace', 'The BBC’s <em>Sherlock</em> makes the “mind palace” famous to a new generation.'],
      ['2017', '🧪', 'Six weeks to a better memory', 'Martin Dresler’s study shows ordinary people can train to near-athlete levels, and that their brain networks change to match.'],
      ['2021', '🌏', 'Songlines in medical school', 'A Monash University study finds an Aboriginal Australian landscape-and-story technique helps medical students remember even better than a standard palace.'],
    ];
    T.forEach(([y, ico, h, p]) => tr.append(el('div', 'tl-item', `<div class="tl-card"><div class="tl-ico">${ico}</div><p class="tl-y">${y}</p><h3>${h}</h3><p>${p}</p></div>`)));
    const barI = $('#tl-bar');
    const upd = () => { const max = tr.scrollWidth - tr.clientWidth; const vis = tr.clientWidth / tr.scrollWidth; barI.style.width = (vis * 100) + '%'; barI.style.marginLeft = (max ? tr.scrollLeft / max * (100 - vis * 100) : 0) + '%'; };
    tr.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    const step = () => (tr.querySelector('.tl-item')?.offsetWidth || 300) + 19;
    $('#tl-prev').onclick = () => tr.scrollBy({ left: -step(), behavior: 'smooth' });
    $('#tl-next').onclick = () => tr.scrollBy({ left: step(), behavior: 'smooth' });
    let down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft; tr.classList.add('drag'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; tr.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (down) { down = false; tr.classList.remove('drag'); } });
  })();

  /* ═════════ studies ═════════ */
  (() => {
    const root = $('#studies'); if (!root) return;
    const S = [
      ['2003 · Maguire et al., Nature Neuroscience', 'Are memory champions born with special brains?', 'Researchers in London compared ten “superior memorisers” with ordinary people, scanning their brains while they memorised.', 'No.', 'Their brain structure and general intelligence looked normal. The difference was strategy: nine of the ten used the method of loci, and while memorising, they used brain regions involved in spatial memory and navigation, including the hippocampus, more than other people did.', '<b>Caveat:</b> a small group, and a snapshot of experts rather than a training study.'],
      ['2017 · Dresler et al., Neuron', 'Can ordinary people learn it?', 'Fifty-one untrained adults were split into three groups: memory-palace training, a different memory training, or nothing, and compared with world-class memory athletes.', 'Yes, in six weeks.', 'After 40 half-hour sessions over six weeks, the palace group more than doubled the number of words they could recall from a 72-word list, coming close to the athletes. They still performed much better four months later, and their brain connectivity had shifted towards the athletes’ pattern. The other groups didn’t show the same gains.', '<b>Caveat:</b> tested on word lists in a lab, not on exam material.'],
      ['2021 · Reser et al., PLOS ONE', 'Is the classic palace the best version?', 'Medical students learned either the memory palace, an Aboriginal Australian technique that links a story to features of a landscape, or nothing, then memorised a list of 20 items.', 'Stories help.', 'Both techniques improved recall. Among students who weren’t already perfect, the Aboriginal narrative method gave the best odds of recalling the whole list (an odds ratio of about 2.8, versus about 2.0 for the memory palace). Adding a story connecting the loci seems to give an extra boost.', '<b>Caveat:</b> the test was easy for many students, and the training was short.'],
      ['2021 · Twomey & Kroneisen, meta-analysis', 'What about decades of experiments together?', 'This meta-analysis pooled the results of many studies of the method of loci, going back to the 1960s, to see how consistent the effect is.', 'Consistently effective.', 'Across studies, people using the method of loci recalled substantially more than people using other strategies or none, especially for ordered material. A separate 2025 systematic review reached the same overall conclusion for adults.', '<b>Caveat:</b> most studies use students and word lists; we know less about long-term, real-world learning.'],
    ];
    S.forEach(([yr, q, f, big, res, cav], i) => {
      const b = el('button', 'st rv'); b.style.setProperty('--d', (i % 2) * .1 + 's');
      b.innerHTML = `<div class="st-in"><div class="st-f"><p class="st-yr">${yr}</p><h3>${q}</h3><p>${f}</p><p class="st-q">See what they found</p></div><div class="st-b"><p class="st-big">${big}</p><p>${res}</p><p class="cav">${cav}</p></div></div>`;
      b.addEventListener('click', () => b.classList.toggle('flip'));
      root.append(b); reveal(b);
    });
  })();

  /* ═════════ vividness maker ═════════ */
  (() => {
    const root = $('#vv-toggles'); if (!root) return;
    const V = [['size', '🐘', 'Exaggerate', 'Make it huge or tiny'], ['move', '💥', 'Add motion', 'Make it act, burst, fly'], ['absurd', '🕶️', 'Make it absurd', 'Impossible and silly'], ['senses', '👃', 'Use senses', 'Sound, smell, texture'], ['emotion', '🤢', 'Add emotion', 'Funny, gross, scary'], ['you', '🧍', 'Put yourself in', 'You’re part of the scene']];
    const on = {}; const stage = $('#vv-stage'), fx = $('#vv-fx'), item = $('#vv-item');
    V.forEach(([k, ic, b, s]) => { const t = el('button', 'vv-t', `<span class="ic">${ic}</span><span><b>${b}</b><small>${s}</small></span>`); t.setAttribute('aria-pressed', 'false'); t.onclick = () => { on[k] = !on[k]; t.classList.toggle('on', on[k]); t.setAttribute('aria-pressed', on[k]); run(); }; root.append(t); });
    const run = () => {
      const subj = on.size ? 'A carton of milk as big as an auto-rickshaw' : 'A carton of milk';
      const abs = on.absurd ? ', wearing sunglasses and belting out an old Bollywood song,' : '';
      const verb = on.move ? 'wobbles, then bursts open and floods' : 'sits next to';
      let d = `${subj}${abs} ${verb} the front door.`;
      if (on.senses) d += ' You hear a loud glug-glug-glug and smell it turning sour.';
      if (on.emotion) d += ' It’s disgusting: warm, sticky milk soaks right through your socks.';
      if (on.you) d += ' You slip and slide on your back straight out of the doorway.';
      $('#vv-desc').textContent = d;
      const n = Object.values(on).filter(Boolean).length, score = Math.min(10, 1 + Math.round(n * 1.5));
      $('#vv-bar').style.width = score * 10 + '%'; $('#vv-n').textContent = score + '/10';
      V.forEach(([k]) => stage.classList.toggle(k, !!on[k]));
      item.textContent = on.absurd ? '🥛' : '🥛';
      const parts = []; if (on.move) parts.push('💦', '💦', '💧'); if (on.senses) parts.push('🎵', '👃'); if (on.emotion) parts.push('🤢'); if (on.you) parts.push('🧍'); if (on.absurd) parts.push('🕶️', '🎤');
      fx.innerHTML = parts.map((p, i) => `<span style="left:${30 + (i * 37) % 45}%;top:${30 + (i * 23) % 35}%;--dx:${(i % 2 ? 1 : -1) * (30 + i * 8)}px;--dy:${-40 - i * 6}px;animation-delay:${i * .3}s">${p}</span>`).join('');
    };
    run();
  })();

  /* ═════════ the flat: floor plan + walk ═════════ */
  const LOCI = [
    { n: 'Front door', e: '🚪', item: 'Tomatoes', ie: '🍅', x: 80, y: 418, s: 'You open the front door and a hailstorm of giant tomatoes explodes against it, splattering red juice everywhere. Your chappals squelch in the pulp.' },
    { n: 'Sofa', e: '🛋️', item: 'Paneer', ie: '🧀', x: 58, y: 300, s: 'The sofa is made of enormous soft cubes of paneer. You sink into it, and it squeaks and wobbles like jelly. It smells of fresh milk.' },
    { n: 'TV', e: '📺', item: 'Bread', ie: '🍞', x: 298, y: 300, s: 'The news anchor on TV is a slice of bread with googly eyes. Each time he speaks, crumbs and toast shoot out of the screen into your face.' },
    { n: 'Dining table', e: '🍽️', item: 'Eggs', ie: '🥚', x: 140, y: 105, s: 'Every plate on the dining table holds an egg. They crack all at once, and tiny yellow chicks leap out and start a dance-off on the tablecloth.' },
    { n: 'Stove', e: '🔥', item: 'Bananas', ie: '🍌', x: 320, y: 56, s: 'The pressure cooker on the stove whistles, and with every whistle it fires a banana into the ceiling like a rocket. Thwack. Thwack. Thwack.' },
    { n: 'Fridge', e: '🧊', item: 'Toothpaste', ie: '🪥', x: 442, y: 100, s: 'You open the fridge and a giant tube of toothpaste squeezes out minty foam that freezes into a sparkling white iceberg. Your eyes water from the mint.' },
    { n: 'Bathroom mirror', e: '🪞', item: 'Batteries', ie: '🔋', x: 400, y: 216, s: 'In the bathroom mirror, your reflection has a battery for a head. It sparks and buzzes, and its hair stands on end with static.' },
    { n: 'Bed', e: '🛏️', item: 'Rice', ie: '🍚', x: 620, y: 130, s: 'Your bed is filled with rice like a sandpit. You dive in and it pours into your ears, your pyjamas, everywhere. Grains crunch under you.' },
    { n: 'Wardrobe', e: '👔', item: 'Coriander', ie: '🌿', x: 668, y: 302, s: 'You open the wardrobe and a jungle of coriander bursts out, the smell so strong it makes you sneeze. Your shirts are completely green.' },
    { n: 'Balcony', e: '🪴', item: 'Detergent', ie: '🫧', x: 520, y: 395, s: 'The washing on the balcony line is spewing mountains of detergent bubbles, which float down onto the street while the neighbours shout up at you.' },
  ];
  (() => {
    const svg = $('#flat-svg'); if (!svg) return;
    const scene = $('#pl-scene');
    // floor & walls
    svg.innerHTML = `
      <rect x="20" y="20" width="720" height="430" fill="#fbf7ef"/>
      <rect x="330" y="330" width="410" height="120" fill="#eef0e6"/>
      <g class="furn-g">
        <rect class="furn-f" x="30" y="232" width="48" height="140" rx="8"/><rect class="furn" x="38" y="240" width="32" height="124" rx="5"/>
        <rect class="furn-f" x="300" y="250" width="18" height="100" rx="3"/><rect x="292" y="262" width="5" height="76" fill="#1e2230"/>
        <rect class="furn" x="120" y="270" width="110" height="64" rx="10"/>
        <rect class="furn-f" x="110" y="418" width="44" height="22" rx="3"/>
        <rect class="furn" x="80" y="72" width="120" height="66" rx="8"/><g class="furn-f"><circle cx="100" cy="62" r="8"/><circle cx="140" cy="62" r="8"/><circle cx="180" cy="62" r="8"/><circle cx="100" cy="148" r="8"/><circle cx="140" cy="148" r="8"/><circle cx="180" cy="148" r="8"/></g>
        <rect class="furn-f" x="250" y="26" width="160" height="40" rx="3"/><circle cx="305" cy="46" r="9" class="furn"/><circle cx="335" cy="46" r="9" class="furn"/><rect class="furn" x="365" y="34" width="34" height="24" rx="3"/>
        <rect class="furn-f" x="420" y="70" width="44" height="62" rx="4"/><path d="M424 100h36" stroke="#4b4f5c" stroke-width="1.2"/>
        <rect class="furn" x="380" y="196" width="44" height="18" rx="6"/><rect x="384" y="192" width="36" height="3" fill="#7fa3d6"/>
        <rect class="furn" x="420" y="270" width="34" height="46" rx="14"/><rect class="furn-f" x="336" y="200" width="30" height="110" rx="4"/>
        <rect class="furn-f" x="540" y="60" width="160" height="140" rx="8"/><rect class="furn" x="548" y="68" width="60" height="28" rx="8"/><rect class="furn" x="632" y="68" width="60" height="28" rx="8"/><rect class="furn" x="548" y="104" width="144" height="88" rx="6"/>
        <rect class="furn-f" x="600" y="282" width="134" height="42" rx="3"/><path d="M667 282v42" stroke="#4b4f5c" stroke-width="1.2"/>
        <circle cx="360" cy="400" r="14" class="furn-f"/><circle cx="360" cy="400" r="6" fill="#5f8a6e"/><circle cx="700" cy="400" r="14" class="furn-f"/><circle cx="700" cy="400" r="6" fill="#5f8a6e"/>
        <path d="M420 370h240" stroke="#868896" stroke-width="1.2" stroke-dasharray="1 0"/><g fill="#fff" stroke="#4b4f5c" stroke-width="1"><path d="M450 370v18h16v-18M500 370v22h14v-22M560 370v16h18v-16M610 370v20h14v-20"/></g>
      </g>
      <path class="wall" d="M20 20H740V450H110M50 450H20V20"/>
      <path class="wall-in" d="M20 190H140M220 190H470M330 190V210M330 262V450M330 330H560M620 330H740M470 20V140M470 186V330"/>
      <path class="door-arc" d="M50 450a60 60 0 0 1 60-60M330 262a50 50 0 0 1 0-52M470 140a46 46 0 0 1 46 46M560 330a60 60 0 0 1 60 0"/>
      <g class="room-l"><text x="150" y="430">Living</text><text x="40" y="40">Dining</text><text x="252" y="88">Kitchen</text><text x="370" y="320">Bath</text><text x="660" y="44">Bedroom</text><text x="600" y="440">Balcony</text></g>`;
    const WP = [[80, 466], [80, 418], [96, 340], [58, 300], [298, 300], [180, 230], [180, 186], [140, 105], [250, 90], [320, 56], [442, 100], [300, 140], [200, 160], [200, 205], [310, 236], [350, 236], [400, 216], [350, 236], [310, 236], [200, 205], [200, 163], [440, 163], [500, 163], [620, 130], [620, 240], [668, 302], [590, 315], [590, 350], [520, 395]];
    const locIdx = [1, 3, 4, 7, 9, 10, 16, 23, 25, 28];
    const d = WP.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ');
    const route = sv('path', { d, class: 'route' }); svg.append(route);
    const done = sv('path', { d, class: 'route-done' }); svg.append(done);
    const total = route.getTotalLength();
    // cumulative length to each waypoint
    const cum = [0]; for (let i = 1; i < WP.length; i++) cum.push(cum[i - 1] + Math.hypot(WP[i][0] - WP[i - 1][0], WP[i][1] - WP[i - 1][1]));
    const scale = total / cum[cum.length - 1];
    done.style.strokeDasharray = total; done.style.strokeDashoffset = total;
    const walker = sv('circle', { r: 8, class: 'walker', cx: WP[0][0], cy: WP[0][1] }); svg.append(walker);
    const marks = LOCI.map((L, i) => {
      const g = sv('g', { class: 'locus', tabindex: 0, role: 'button', 'aria-label': `Locus ${i + 1}: ${L.n}` });
      g.append(sv('circle', { class: 'halo', cx: L.x, cy: L.y, r: 12 }), sv('circle', { class: 'dot', cx: L.x, cy: L.y, r: 12 }));
      const t = sv('text', { x: L.x, y: L.y + 4 }); t.textContent = i + 1; g.append(t);
      g.addEventListener('click', () => go(i)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(i); } });
      bindTip(g, () => `${i + 1}. ${L.n}`);
      svg.append(g); return g;
    });
    let cur = -1, at = 0, playing = false, tok = 0;
    const lenAt = (i) => cum[locIdx[i]] * scale;
    const moveTo = (to, dur) => new Promise((res) => {
      const from = at; if (RM || dur === 0) { at = to; place(); return res(); }
      const t0 = performance.now();
      const st = (now) => { const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; at = from + (to - from) * e; place(); if (k < 1) requestAnimationFrame(st); else res(); };
      requestAnimationFrame(st);
    });
    const place = () => { const p = route.getPointAtLength(at); walker.setAttribute('cx', p.x); walker.setAttribute('cy', p.y); done.style.strokeDashoffset = total - at; };
    const show = (i) => {
      marks.forEach((m, k) => { m.classList.toggle('on', k === i); if (k < i) m.classList.add('seen'); });
      const L = LOCI[i];
      scene.innerHTML = `<p class="ps-n">Locus ${i + 1} of 10</p><h3 class="ps-loc">${L.n}</h3><div class="ps-emo"><span>${L.e}</span><span class="plus">+</span><span>${L.ie}</span></div><p class="ps-item">${L.item}</p><p class="ps-story">${L.s}</p><p class="ps-hint">${i < 9 ? 'Close your eyes and picture it for a few seconds before moving on.' : 'That’s the whole palace. Walk it once more in your head, then take the test below.'}</p>`;
    };
    const go = async (i) => { tok++; const my = tok; playing = false; $('#pl-play').textContent = '▶ Walk the palace'; cur = i; await moveTo(lenAt(i), 700); if (my === tok) show(i); };
    const intro = () => { scene.innerHTML = `<div class="ps-intro"><p class="ps-n">The palace</p><h3>A two-bedroom flat</h3><p>Ten loci, in order: front door, sofa, TV, dining table, stove, fridge, bathroom mirror, bed, wardrobe, balcony. Press play to walk through, or tap any numbered stop.</p></div><p class="ps-hint">Tip: say each image out loud, and picture it in colour.</p>`; };
    intro();
    $('#pl-next').onclick = () => go(Math.min(9, cur + 1));
    $('#pl-prev').onclick = () => go(Math.max(0, cur - 1));
    $('#pl-play').onclick = async () => {
      if (playing) { playing = false; tok++; $('#pl-play').textContent = '▶ Walk the palace'; return; }
      playing = true; tok++; const my = tok; $('#pl-play').textContent = '❚❚ Pause';
      if (cur >= 9) { cur = -1; at = 0; marks.forEach((m) => m.classList.remove('seen', 'on')); place(); }
      for (let i = cur + 1; i < 10; i++) {
        if (!playing || my !== tok) return;
        await moveTo(lenAt(i), 900); if (my !== tok) return;
        cur = i; show(i); await wait(RM ? 2500 : 6500);
      }
      playing = false; $('#pl-play').textContent = '↺ Walk again';
    };
  })();

  /* ═════════ ROUND 2: recall with the palace ═════════ */
  (() => {
    const body = $('#r2-body'); if (!body) return;
    const ALT = { Tomatoes: ['tomato', 'tamatar'], Paneer: ['paneer', 'cottage cheese', 'cheese'], Bread: ['bread', 'toast'], Eggs: ['egg', 'anda'], Bananas: ['banana', 'kela'], Toothpaste: ['toothpaste', 'paste', 'tooth paste'], Batteries: ['battery', 'batterie', 'cell'], Rice: ['rice', 'chawal'], Coriander: ['coriander', 'dhania', 'cilantro'], Detergent: ['detergent', 'washing powder', 'soap', 'surf', 'bubble'] };
    const ok = (item, v) => { const n = norm(v); return n && ALT[item].some((a) => norm(a) === n || n.includes(norm(a))); };
    const intro = () => {
      body.innerHTML = `<p class="r-h">The palace test</p><h3 class="r-title">Walk the flat and recall the list</h3><p class="r-sub">For each locus, type the item you left there. Take your time and picture the scene.</p><div class="r2-q">${LOCI.map((L, i) => `<label><em>${L.e}</em><div><span>${i + 1}. ${L.n}</span><input data-i="${i}" autocomplete="off" aria-label="Item at ${L.n}"></div></label>`).join('')}</div><div class="r-act"><button class="btn" id="r2-check">Check my answers</button></div>`;
      $('#r2-check').onclick = check;
    };
    const check = () => {
      let n = 0;
      $$('.r2-q input', body).forEach((inp) => { const L = LOCI[+inp.dataset.i]; const good = ok(L.item, inp.value); if (good) n++; inp.classList.toggle('ok', good); inp.classList.toggle('no', !good); inp.readOnly = true; if (!good) inp.insertAdjacentHTML('afterend', `<p class="ans">${L.item}</p>`); });
      const cmp = r1Score == null ? 'Take the one-minute test in Chapter I to compare.' : n > r1Score ? `That’s <b>${n - r1Score} more</b> than your first test (${r1Score}/10), and these are in order.` : n === r1Score ? `Same as your first test (${r1Score}/10), and this time they’re in order. It gets much easier with practice.` : `Your first test was ${r1Score}/10. Walk the palace once more, slowly, and try again: first palaces take a little practice.`;
      $('#r2-check').closest('.r-act').innerHTML = `<div class="r-score"><p class="r-big">${n}<span style="font-size:.4em;color:var(--ink-3)">/10</span></p><div><p class="r-sub">${cmp}</p><div class="r-dots">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="animation-delay:${i * .06}s"></i>`).join('')}</div></div></div><button class="btn ghost small" id="r2-again" style="margin-left:auto">Try again</button>`;
      $('#r2-again').onclick = intro;
    };
    intro();
  })();

  /* ═════════ Major system ═════════ */
  const PEG = 'Sauce Seat Sun Sumo Sore Sail Sash Sock Safe Soap Toes Tot Tuna Tomb Tire Towel Dish Duck Dove Tub Nose Net Nun Name Nero Nail Notch Neck Knife Knob Mouse Mat Moon Mummy Mower Mule Match Mug Movie Map Rose Rat Rain Ram Rower Roll Roach Rock Roof Rope Lace Light Lion Lamb Lure Lily Leash Log Lava Lip Cheese Sheet Chain Jam Cherry Jail Judge Chalk Chef Ship Case Cat Coin Comb Car Coal Cage Cake Cave Cub Fez Foot Fan Foam Fire File Fish Fog Fife Fob Bus Bat Bun Bomb Bear Bell Beach Book Beef Pipe'.split(' ');
  const SINGLE = ['Zoo', 'Tie', 'Noah', 'Ma', 'Rye', 'Law', 'Shoe', 'Cow', 'Ivy', 'Bee'];
  const SOUND = ['s/z', 't/d', 'n', 'm', 'r', 'l', 'j/sh/ch', 'k/g', 'f/v', 'p/b'];
  const HINT = ['z is for zero', 't has one downstroke', 'n has two legs', 'm has three legs', 'four ends in r', 'L is 50 in Roman numerals', 'a j looks like a flipped 6', 'a k is two 7s back to back', 'a cursive f looks like 8', 'p is a mirrored 9'];
  (() => {
    const key = $('#major-key'); if (!key) return;
    SOUND.forEach((s, d) => { const k = el('div', 'mk', `<b>${d}</b><span>${s}</span><small>${HINT[d]}</small>`); key.append(k); });
    const inp = $('#mj-input'), out = $('#mj-out');
    const run = () => {
      const v = inp.value.replace(/\D/g, '').slice(0, 16); if (inp.value !== v) inp.value = v;
      if (!v) { out.innerHTML = '<p class="card-note">Type some digits above.</p>'; return; }
      const parts = []; for (let i = 0; i < v.length; i += 2) parts.push(v.slice(i, i + 2));
      out.innerHTML = parts.map((p, i) => { const w = p.length === 2 ? PEG[+p] : SINGLE[+p]; const s = p.split('').map((d) => SOUND[d]).join(' · '); return `<div class="mj-pair" style="animation-delay:${i * .06}s"><p class="d">${p}</p><p class="s">${s}</p><p class="w">${w}</p></div>`; }).join('');
    };
    inp.addEventListener('input', run); run();
  })();

  /* ═════════ forgetting curve ═════════ */
  (() => {
    const host = $('#cv-chart'); if (!host) return;
    const R = [['Same day', .3], ['Day 1', 1], ['Day 3', 3], ['Day 7', 7], ['Day 14', 14], ['Day 30', 30]];
    const sel = new Set([.3, 1, 3, 7]);
    const chips = $('#cv-chips');
    R.forEach(([n, d]) => { const b = el('button', sel.has(d) ? 'on' : '', '+ ' + n); b.setAttribute('aria-pressed', sel.has(d)); b.onclick = () => { sel.has(d) ? sel.delete(d) : sel.add(d); b.classList.toggle('on', sel.has(d)); b.setAttribute('aria-pressed', sel.has(d)); draw(true); }; chips.append(b); });
    let mode = 'rote';
    $$('#cv-mode button').forEach((b) => b.onclick = () => { $$('#cv-mode button').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.v; draw(true); });
    const sim = (S0, reviews, F) => { const pts = []; let S = S0, last = 0; const rv = [...reviews].sort((a, b) => a - b); let ri = 0; for (let t = 0; t <= 30.001; t += .1) { while (ri < rv.length && t >= rv[ri]) { last = rv[ri]; S *= 2.6; ri++; } pts.push({ x: +t.toFixed(1), y: 100 * (F + (1 - F) * Math.exp(-(t - last) / S)) }); } return pts; };
    const draw = (anim) => {
      const S0 = mode === 'rote' ? 1.1 : 3.5, F = mode === 'rote' ? .18 : .3;
      const a = sim(S0, [], F), b = sim(S0, sel, F);
      const series = [{ name: 'No review', color: C.c1, pts: a }, { name: 'With your reviews', short: 'Reviewed', color: C.c2, pts: b }];
      render(host, series, anim);
      $('#cv-legend').innerHTML = series.map((s) => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('');
      const end = (p) => Math.round(p[p.length - 1].y);
      $('#cv-note').innerHTML = `After 30 days with ${mode === 'rote' ? 'rote learning' : 'a memory palace'}: about <b>${end(a)}%</b> left with no review, versus <b>${end(b)}%</b> with ${sel.size} review${sel.size === 1 ? '' : 's'}. Notice how each review makes the next drop slower.`;
    };
    const render = (host, series, anim) => {
      host.innerHTML = ''; const W = host.clientWidth, H = host.clientHeight; if (!W) return;
      const m = { l: 44, r: W < 520 ? 76 : 118, t: 14, b: 30 }, X = (x) => m.l + x / 30 * (W - m.l - m.r), Y = (y) => H - m.b - y / 100 * (H - m.t - m.b);
      const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Forgetting curve with and without spaced review' });
      const ax = sv('g', { class: 'ax' });
      [0, 25, 50, 75, 100].forEach((v) => { ax.append(sv('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: v === 0 ? 'base' : '' })); const t = sv('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end' }); t.textContent = v + '%'; ax.append(t); });
      [0, 5, 10, 15, 20, 25, 30].forEach((v) => { const t = sv('text', { x: X(v), y: H - 8, 'text-anchor': 'middle' }); t.textContent = 'day ' + v; ax.append(t); });
      svg.append(ax);
      [...sel].forEach((d) => svg.append(sv('line', { x1: X(d), x2: X(d), y1: m.t, y2: H - m.b, stroke: C.c2, 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: .5 })));
      const labels = [];
      series.forEach((s) => { const p = sv('path', { d: s.pts.map((q, i) => (i ? 'L' : 'M') + X(q.x).toFixed(1) + ' ' + Y(q.y).toFixed(1)).join(' '), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round' }); svg.append(p); if (anim && !RM) { p.style.setProperty('--len', p.getTotalLength()); p.classList.add('draw'); } const L = s.pts[s.pts.length - 1]; labels.push({ s, y: Y(L.y), ly: Y(L.y), x: X(L.x) }); });
      labels.sort((a, b) => a.y - b.y); for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
      labels.forEach(({ s, y, ly, x }) => { svg.append(sv('circle', { cx: x, cy: ly, r: 4, fill: s.color, stroke: C.card, 'stroke-width': 2 })); const t = sv('text', { x: x + 9, y: y + 4, class: 'dl' }); t.textContent = s.short || s.name; svg.append(t); });
      const xh = sv('line', { class: 'xh', y1: m.t, y2: H - m.b }); svg.append(xh);
      const dots = series.map((s) => { const c = sv('circle', { r: 4.5, fill: s.color, stroke: C.card, 'stroke-width': 2, opacity: 0 }); svg.append(c); return c; });
      const hit = sv('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: 'hit' }); svg.append(hit);
      hit.addEventListener('pointermove', (e) => { const r = svg.getBoundingClientRect(); const x = clamp(((e.clientX - r.left) * (W / r.width) - m.l) / (W - m.l - m.r) * 30, 0, 30); const i = Math.round(x * 10); xh.setAttribute('x1', X(i / 10)); xh.setAttribute('x2', X(i / 10)); xh.style.opacity = .5; dots.forEach((c, k) => { const q = series[k].pts[i]; c.setAttribute('cx', X(q.x)); c.setAttribute('cy', Y(q.y)); c.setAttribute('opacity', 1); }); showTip(`<div style="opacity:.7">Day ${(i / 10).toFixed(1)}</div>` + series.map((s) => `<div><i style="background:${s.color}"></i>${s.name}: <b>${Math.round(s.pts[i].y)}%</b></div>`).join(''), e.clientX, e.clientY); });
      hit.addEventListener('pointerleave', () => { hideTip(); xh.style.opacity = 0; dots.forEach((c) => c.setAttribute('opacity', 0)); });
      host.append(svg);
    };
    draw(false); let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => draw(false), 160); });
    reveal(host, () => draw(true));
  })();

  /* ═════════ uses ═════════ */
  (() => {
    const root = $('#uses'); if (!root) return;
    const U = [['g', '✓', 'Brilliant for', ['Speeches and presentations', 'Shopping and to-do lists', 'Vocabulary in a new language', 'Names at a party or meeting', 'Sequences: kings, steps, reactions', 'Numbers, PINs and dates', 'Anatomy, law sections, the periodic table']], ['m', '~', 'Sometimes useful', ['Exam facts, alongside real understanding', 'Poems and lines (one image per line)', 'Card tricks and party feats', 'Numbers you use daily (repetition works too)']], ['b', '✕', 'Not the right tool', ['Understanding how a concept works', 'Physical skills like cooking or driving', 'Things you can easily look up', 'Memories you’d rather forget']]];
    U.forEach(([c, ic, h, items], i) => { const d = el('div', 'use-col rv ' + c, `<h3><i>${ic}</i>${h}</h3><ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`); d.style.setProperty('--d', i * .1 + 's'); root.append(d); reveal(d); });
  })();

  /* ═════════ builder ═════════ */
  (() => {
    const root = $('#builder'); if (!root) return;
    const KEY = 'lrn-palace-builder';
    let data = store.get(KEY, { name: '', rows: Array.from({ length: 10 }, () => ({ l: '', i: '', m: '' })) });
    const list = $('#bd-list'), name = $('#bd-name'), saved = $('#bd-saved');
    let mode = 'edit', tmr;
    const save = () => { clearTimeout(tmr); tmr = setTimeout(() => { saved.textContent = store.set(KEY, data) ? 'Saved ✓' : 'Couldn’t save in this browser'; }, 300); };
    const render = () => {
      root.classList.toggle('walk', mode === 'walk');
      name.value = data.name;
      list.innerHTML = `<li class="bd-head"><span>#</span><span>Locus (a spot on your route)</span><span>${mode === 'walk' ? 'Recall the item' : 'What to remember'}</span><span>Your vivid image</span></li>`;
      data.rows.forEach((r, i) => {
        const li = el('li', 'bd-row'); li.style.animationDelay = i * .03 + 's';
        if (mode === 'edit') li.innerHTML = `<span class="n">${i + 1}</span><input class="loc" value="" placeholder="e.g. Shoe rack"><input class="item" value="" placeholder="e.g. Tomatoes"><input class="img" value="" placeholder="e.g. Tomatoes explode on the shoes">`;
        else li.innerHTML = `<span class="n">${i + 1}</span><input class="loc" readonly><input class="bd-guess" placeholder="${r.i ? 'What was here?' : '(empty)'}" ${r.i ? '' : 'disabled'}><input class="img" readonly>`;
        const [loc, mid, img] = $$('input', li);
        loc.value = r.l; img.value = mode === 'walk' ? '' : r.m;
        if (mode === 'edit') { mid.value = r.i; loc.oninput = () => { r.l = loc.value; save(); }; mid.oninput = () => { r.i = mid.value; save(); }; img.oninput = () => { r.m = img.value; save(); }; }
        else { img.placeholder = 'Picture it…'; mid.onchange = () => { const good = r.i && norm(mid.value) && (norm(mid.value) === norm(r.i) || norm(r.i).includes(norm(mid.value))); mid.classList.toggle('ok', !!good); mid.classList.toggle('no', !good); if (!good) { mid.value = mid.value + '  →  ' + r.i; } else img.value = r.m; }; }
        list.append(li);
      });
    };
    name.oninput = () => { data.name = name.value; save(); };
    $$('#bd-mode button').forEach((b) => b.onclick = () => { $$('#bd-mode button').forEach((x) => x.classList.toggle('on', x === b)); mode = b.dataset.v; render(); });
    $('#bd-example').onclick = () => {
      data = { name: 'My route to college', rows: [['Gate with the security guard', 'Article 14: equality', 'The guard weighs everyone on giant equal scales'], ['Chai stall', 'Article 19: freedoms', 'Six birds burst out of the chai kettle, free'], ['Notice board', 'Article 21: life & liberty', 'A heart beats inside the notice board, pinned up'], ['Staircase', 'Article 32: remedies', 'A judge slides down the banister handing out plasters'], ['Library door', 'Mitochondria', 'A mighty kite is jammed in the library door, powering the lights'], ['Photocopy shop', 'Ribosome', 'The copier prints ribbons that turn into proteins'], ['Canteen', 'Golgi body', 'A golfer (Golgi) packs samosas into gift boxes'], ['Lecture hall', 'Krebs cycle', 'A crab (Krebs) rides a cycle around the hall'], ['Lab', 'Nucleus', 'A glowing nut sits in a vault, guarded'], ['Parking lot', 'Cell membrane', 'A huge cling-film bubble wraps every bike']].map(([l, i, m]) => ({ l, i, m })) };
      render(); save();
    };
    $('#bd-clear').onclick = () => { data = { name: '', rows: Array.from({ length: 10 }, () => ({ l: '', i: '', m: '' })) }; render(); save(); };
    render();
  })();

  /* ═════════ FAQ ═════════ */
  (() => {
    const root = $('#faq'); if (!root) return;
    const F = [
      ['Can I reuse the same palace for a new list?', 'Yes, but old images can linger and get confused with new ones; memory athletes call these “ghosts”. For short-term lists like shopping, reusing a palace after a few days is fine, especially if you imagine sweeping it clean first. For things you want to keep permanently, give them their own palace.'],
      ['How many loci and palaces do I need?', 'Start with one palace of ten loci. When that feels easy, add more stops or more palaces: your office, your school, a relative’s house, your favourite café, the route to the station. Competitive memorisers build dozens of palaces with hundreds of loci. You’ll probably be happy with five or six.'],
      ['I can’t really “see” pictures in my head. Will it work?', 'Probably, yes. People with aphantasia (little or no mental imagery) report success by leaning on what they do have: a sense of spatial layout, and descriptions in words, sounds and actions. Instead of seeing the tomatoes, you know that “tomatoes are exploding at the door” as a fact about the place. The spatial structure does much of the work.'],
      ['Some loci come back empty. What went wrong?', 'Usually the image was too boring, or too disconnected from the spot. Make it bigger, more absurd, more emotional, and make it physically interact with the locus. Also check that your loci are distinct: two similar chairs will blur together. And review: one walk is rarely enough for a long list.'],
      ['Can I use an imaginary place, or one from a game or film?', 'Yes. Places from video games, films, or buildings you design yourself can work, though real places you know intimately are easiest at first because the layout already lives in your memory. Some people sketch a floor plan to firm up a new palace.'],
      ['How long does it take?', 'Your first palace might take 15 to 20 minutes to build and fill. With practice, choosing loci becomes instant and creating an image takes a few seconds. In the Dresler study, about six weeks of regular half-hour practice took ordinary people close to memory-athlete level on word lists.'],
      ['Will this improve my memory in general?', 'Not exactly. It doesn’t upgrade your natural memory for everything; it gives you a powerful skill you can apply deliberately. That said, training does reshape how your brain handles memorising, and people often report becoming more observant and more confident about remembering.'],
      ['Is it worth using for exams?', 'For the list-like parts, absolutely: sequences, classifications, causes, steps, names, numbers. Pair it with understanding (explaining ideas in your own words), practice questions and spaced review, and keep a separate palace per subject.'],
    ];
    F.forEach(([q, a], i) => { const d = el('div', 'fq rv'); d.innerHTML = `<button aria-expanded="false">${q}<i aria-hidden="true"></i></button><div class="fq-a"><div><p>${a}</p></div></div>`; const b = $('button', d); b.onclick = () => { const o = d.classList.toggle('open'); b.setAttribute('aria-expanded', o); }; root.append(d); reveal(d); });
  })();

  /* ═════════ first week ═════════ */
  (() => {
    const list = $('#wk-list'); if (!list) return;
    const W = [['Build the shopping-list palace in this guide, then recite it backwards.', 'You may have done this already.'], ['Recall yesterday’s list without looking. Then choose a second palace and pick ten loci.', 'Your office, college or a relative’s house.'], ['Memorise today’s real to-do list in your second palace.', 'Check it off from memory in the evening.'], ['Learn the Major System digits 0–9.', 'Turn the last four digits of your phone number into two images.'], ['Learn ten words in a language you’re studying with the keyword method.', 'Place them in your first palace.'], ['Memorise the main points of a short talk and say it to someone, without notes.', 'Or the planets, or your favourite poem.'], ['Walk all your palaces once, then retake the one-minute test with a new list.', 'Compare it with your first score.']];
    const KEY = 'lrn-palace-week'; const saved = store.get(KEY, []);
    W.forEach(([t, s], i) => { const li = el('li'); li.innerHTML = `<input type="checkbox" id="wk-${i}" ${saved.includes(i) ? 'checked' : ''}><label for="wk-${i}"><span class="d">Day ${i + 1}</span><span class="t"><b>${t}</b><span>${s}</span></span></label>`; list.append(li); });
    const boxes = $$('input', list), L = ['Day one starts whenever you’re ready.', 'A good start.', 'You’ve got two palaces now.', 'Halfway there.', 'Nearly a memory athlete.', 'A full week. Your palaces are open for business.'];
    const upd = () => { const on = boxes.filter((b) => b.checked).length; $('#wk-fill').style.strokeDashoffset = (326.7 * (1 - on / 7)).toFixed(1); $('#wk-n').textContent = `${on} / 7`; $('#wk-l').textContent = L[on === 7 ? 5 : Math.min(4, Math.ceil(on / 7 * 4))]; store.set(KEY, boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0)); };
    boxes.forEach((b) => b.addEventListener('change', upd)); upd();
  })();
})();

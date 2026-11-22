/* lrn — The Jane Method */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* tooltip */
  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', hideTip); };

  /* reveal */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(n); };

  /* progress + rail */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  const DARK = ['night', 'dusk', 'tea', 'velvet', 'shadow'];
  chapters.forEach((c) => { const a = el('a'); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const rl = $$('a', rail);
  const cardsFly = $('#cardsFly'), heroCup = $('.hero-cup');
  const onScroll = () => {
    const d = document.documentElement, y = d.scrollTop;
    bar.style.width = (y / Math.max(1, d.scrollHeight - d.clientHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', y > innerHeight * .8);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur));
    rail.classList.toggle('on-dark', cur >= 0 && DARK.some((k) => chapters[cur].classList.contains(k)));
    if (!RM && y < innerHeight * 1.2) { cardsFly.style.transform = `translateY(${y * -.25}px)`; heroCup.style.translate = `0 ${y * .12}px`; }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ═════════ PLAYING CARD ═════════ */
  const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const card = (rank, suit, back) => {
    if (back) return `<svg viewBox="0 0 100 140"><rect x="1" y="1" width="98" height="138" rx="9" fill="#7a2433" stroke="#f3d27e" stroke-width="2"/><rect x="8" y="8" width="84" height="124" rx="5" fill="none" stroke="#f3d27e" stroke-width="1" opacity=".7"/><g fill="none" stroke="#f3d27e" stroke-width="1" opacity=".55"><path d="M50 22l26 48-26 48-26-48z"/><path d="M50 40l16 30-16 30-16-30z"/><circle cx="50" cy="70" r="6"/></g></svg>`;
    const red = suit === 'h' || suit === 'd', c = red ? '#b23a2e' : '#1c2230', g = SUIT[suit];
    const face = 'JQK'.includes(rank);
    const mid = face
      ? `<rect x="20" y="28" width="60" height="84" rx="4" fill="${red ? '#fbeee6' : '#eef1f5'}" stroke="${c}" stroke-width="1.2"/><text x="50" y="84" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="600" font-size="46" fill="${c}">${rank}</text><text x="50" y="102" text-anchor="middle" font-size="14" fill="#d9a441">${g}</text><path d="M30 40h40" stroke="#d9a441" stroke-width="1.2"/>`
      : `<text x="50" y="86" text-anchor="middle" font-size="44" fill="${c}">${g}</text>`;
    return `<svg viewBox="0 0 100 140" role="img" aria-label="${rank} of ${({ s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' })[suit]}"><rect x="1" y="1" width="98" height="138" rx="9" fill="#fffdf7" stroke="#d8ccb4" stroke-width="1.5"/>${mid}<text x="10" y="22" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="17" fill="${c}">${rank}</text><text x="11" y="38" font-size="13" fill="${c}">${g}</text><g transform="rotate(180 50 70)"><text x="10" y="22" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="17" fill="${c}">${rank}</text><text x="11" y="38" font-size="13" fill="${c}">${g}</text></g></svg>`;
  };

  /* ═════════ HERO ═════════ */
  (() => {
    const narrow = innerWidth < 860;
    const set = narrow
      ? [['A', 's', 8, 14, -18, 0], [null, null, 92, 12, 14, 1], ['Q', 'h', 90, 92, 10, 0], ['7', 'd', 10, 90, -8, 0]]
      : [['A', 's', 50, 11, -18, 0], [null, null, 57, 90, 12, 1], ['Q', 'h', 91, 12, 8, 0], ['7', 'd', 97, 52, 16, 0], ['K', 'c', 92, 88, -12, 0], [null, null, 3, 95, -6, 1]];
    set.forEach(([r, s, x, y, rot, back], i) => {
      const f = el('div', 'fc' + (RM ? '' : ' bob'), card(r, s, back));
      f.style.left = x + '%'; f.style.top = y + '%'; f.style.setProperty('--r', rot + 'deg'); f.style.setProperty('--d', (0.6 + i * .15) + 's');
      if (RM) { f.style.opacity = .9; f.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`; f.style.animation = 'none'; }
      cardsFly.append(f);
    });
    // golden dust
    const cv = $('#motes'), ctx = cv.getContext('2d'); let W, H, P = [], vis = true;
    const size = () => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const N = narrow ? 40 : 80;
    for (let i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4, v: Math.random() * .25 + .06, a: Math.random() * Math.PI * 2, s: Math.random() * .02 + .005 });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      P.forEach((p) => { p.y -= p.v; p.a += p.s; p.x += Math.sin(p.a) * .25; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } const tw = .35 + Math.sin(p.a * 3) * .3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = `rgba(243,210,126,${clamp(tw, .05, .8)})`; ctx.fill(); });
      if (vis && !RM) requestAnimationFrame(draw);
    };
    draw();
    if (io) new IntersectionObserver(([e]) => { const was = vis; vis = e.isIntersecting; if (vis && !was && !RM) draw(); }).observe(cv);
    // pointer tilt on cup
    if (!RM && matchMedia('(pointer:fine)').matches) {
      const svg = $('#heroCup');
      $('.hero').addEventListener('pointermove', (e) => { const dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5; svg.style.transform = `rotate(${dx * 6}deg) translate(${dx * 14}px, ${dy * 10}px)`; });
    }
  })();

  /* ═════════ SIX INGREDIENTS ═════════ */
  (() => {
    const I = {
      look: '<path d="M18 10h10l4 14 4-14h10l4 44H14z" fill="#d9a441" opacity=".35"/><path d="M18 10h10l4 14 4-14h10l4 44H14zM32 24v30" fill="none" stroke="#1c2230" stroke-width="2.5" stroke-linejoin="round"/><circle cx="32" cy="32" r="1.8" fill="#1c2230"/><circle cx="32" cy="40" r="1.8" fill="#1c2230"/><circle cx="32" cy="48" r="1.8" fill="#1c2230"/>',
      tea: '<path d="M12 26h34c0 14-6 22-17 22S12 40 12 26z" fill="#7fa8c9" opacity=".4"/><path d="M12 26h34c0 14-6 22-17 22S12 40 12 26zM46 30c8 0 8 10 0 10M6 52h46" fill="none" stroke="#1c2230" stroke-width="2.5" stroke-linecap="round"/><path d="M24 20c-3-4 3-6 0-10M34 20c-3-4 3-6 0-10" fill="none" stroke="#a4632f" stroke-width="2.2" stroke-linecap="round"/>',
      rest: '<rect x="8" y="22" width="48" height="18" rx="7" fill="#a4632f" opacity=".4"/><path d="M8 40V30a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v10M4 34h8v12H4zM52 34h8v12h-8zM12 40h40M14 46v4M50 46v4" fill="none" stroke="#1c2230" stroke-width="2.5" stroke-linecap="round"/><text x="40" y="16" font-family="Fraunces" font-style="italic" font-size="12" fill="#a4632f">z z</text>',
      eye: '<path d="M4 32s10-16 28-16 28 16 28 16-10 16-28 16S4 32 4 32z" fill="#d9a441" opacity=".3"/><path d="M4 32s10-16 28-16 28 16 28 16-10 16-28 16S4 32 4 32z" fill="none" stroke="#1c2230" stroke-width="2.5"/><circle cx="32" cy="32" r="8" fill="#3f6f99"/><circle cx="32" cy="32" r="3" fill="#1c2230"/><circle cx="35" cy="29" r="1.6" fill="#fff"/>',
      craft: '<rect x="20" y="8" width="26" height="38" rx="4" transform="rotate(14 33 27)" fill="#b23a2e" opacity=".3"/><rect x="14" y="14" width="26" height="38" rx="4" fill="#fffdf7" stroke="#1c2230" stroke-width="2.5"/><text x="27" y="40" text-anchor="middle" font-size="16" fill="#b23a2e">♥</text><circle cx="48" cy="48" r="8" fill="#d9a441" stroke="#1c2230" stroke-width="2"/>',
      charm: '<circle cx="32" cy="32" r="22" fill="#d9a441" opacity=".3"/><circle cx="32" cy="32" r="22" fill="none" stroke="#1c2230" stroke-width="2.5"/><path d="M22 36c4 7 16 7 20 0" fill="none" stroke="#1c2230" stroke-width="2.5" stroke-linecap="round"/><path d="M24 26v2M40 25c-2-2-4-2-6 0" fill="none" stroke="#1c2230" stroke-width="2.5" stroke-linecap="round"/><path d="M52 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#d9a441"/>',
    };
    const S = [['look', 'The look', 'A suit, no tie, all ease', '#ch-look'], ['tea', 'The ritual', 'Tea, and the pause it buys', '#ch-tea'], ['rest', 'The couch', 'Rest as a thinking tool', '#ch-couch'], ['eye', 'The eye', 'Noticing what others miss', '#ch-eye'], ['craft', 'The craft', 'Readings, tells and tricks', '#ch-reading'], ['charm', 'The charm', 'Making people feel seen', '#ch-charm']];
    const g = $('#sixGrid');
    S.forEach(([k, t, d, h]) => { const a = el('a', '', `<svg viewBox="0 0 64 64" aria-hidden="true">${I[k]}</svg><b>${t}</b><span>${d}</span>`); a.href = h; g.append(a); });
  })();

  /* ═════════ A. WARDROBE ═════════ */
  (() => {
    const svg = $('#wdSvg'), ctl = $('#wdCtl');
    const OPT = {
      suit: { label: 'Suit colour', o: [['grey', 'Soft grey', '#6b717b', 1], ['char', 'Charcoal', '#3a3d44', 1], ['brown', 'Brown', '#7a6048', 1], ['navy', 'Navy', '#243552', .5], ['black', 'Black', '#17181b', 0]], w: 1 },
      jacket: { label: 'Jacket', o: [['on', 'On', null, 1], ['off', 'Off', null, .5]], w: 1 },
      vest: { label: 'Waistcoat', o: [['on', 'On', null, 1], ['off', 'Off', null, 0]], w: 2 },
      tie: { label: 'Tie', o: [['none', 'None', null, 1], ['slim', 'Slim', null, 0], ['classic', 'Classic', null, 0]], w: 2 },
      shirt: { label: 'Shirt', o: [['white', 'White', '#f7f5f0', 1], ['blue', 'Pale blue', '#cfe0ec', 1], ['black', 'Black', '#25262a', 0]], w: 1 },
      shoes: { label: 'Shoes', o: [['brown', 'Brown leather', '#6b3a1e', 1], ['black', 'Black leather', '#151515', .5], ['white', 'White trainers', '#f2f2f2', 0]], w: 1 },
      hair: { label: 'Hair', o: [['tousled', 'Tousled', null, 1], ['slick', 'Slicked back', null, 0], ['buzz', 'Buzz cut', null, 0]], w: 1 },
    };
    const st = { suit: 'navy', jacket: 'on', vest: 'off', tie: 'classic', shirt: 'white', shoes: 'black', hair: 'slick' };
    const pick = (k) => OPT[k].o.find((o) => o[0] === st[k]);
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = clamp(Math.round(r * f), 0, 255); g = clamp(Math.round(g * f), 0, 255); b = clamp(Math.round(b * f), 0, 255); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); };
    const render = () => {
      const s = pick('suit')[2], sd = shade(s, .78), sh = pick('shirt')[2], shoe = pick('shoes')[2], skin = '#e2b48c', hairC = '#c9a26b', ink = '#1c2230';
      const arms = st.jacket === 'on' ? s : sh;
      let h = '';
      h += `<ellipse cx="120" cy="428" rx="70" ry="8" fill="#000" opacity=".1"/>`;
      h += `<path d="M80 262L160 262L156 414L126 414L120 300L114 414L84 414Z" fill="${s}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<ellipse cx="97" cy="420" rx="22" ry="8" fill="${shoe}" stroke="${ink}" stroke-width="1.5"/><ellipse cx="143" cy="420" rx="22" ry="8" fill="${shoe}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<path d="M80 114L60 236L74 240L92 140Z" fill="${arms}" stroke="${ink}" stroke-width="1.5"/><path d="M160 114L180 236L166 240L148 140Z" fill="${arms}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<circle cx="67" cy="248" r="9" fill="${skin}" stroke="${ink}" stroke-width="1.5"/><circle cx="173" cy="248" r="9" fill="${skin}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<path d="M80 112L160 112L164 266L76 266Z" fill="${sh}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<rect x="110" y="86" width="20" height="26" fill="${skin}"/>`;
      if (st.tie === 'none') {
        h += `<path d="M111 104L120 130L129 104Z" fill="${skin}"/><path d="M108 100L118 130L101 118Z" fill="${sh}" stroke="${ink}" stroke-width="1.5"/><path d="M132 100L122 130L139 118Z" fill="${sh}" stroke="${ink}" stroke-width="1.5"/>`;
      } else {
        const blade = st.tie === 'slim' ? 'M117 121L123 121L125 196L120 204L115 196Z' : 'M114 121L126 121L131 200L120 212L109 200Z';
        h += `<path d="${blade}" fill="#7a2433" stroke="${ink}" stroke-width="1.5"/><path d="M115 111h10l-1.5 10h-7z" fill="#7a2433" stroke="${ink}" stroke-width="1.5"/><path d="M108 100L119 114L103 118Z" fill="${sh}" stroke="${ink}" stroke-width="1.5"/><path d="M132 100L121 114L137 118Z" fill="${sh}" stroke="${ink}" stroke-width="1.5"/>`;
      }
      if (st.vest === 'on') {
        h += `<path d="M82 122L108 122L120 170L132 122L158 122L162 258L140 266L120 260L100 266L78 258Z" fill="${s}" stroke="${ink}" stroke-width="1.5"/>`;
        [182, 200, 218, 236].forEach((y) => { h += `<circle cx="120" cy="${y}" r="2.6" fill="${ink}"/>`; });
        h += `<path d="M90 200h14M136 200h14" stroke="${sd}" stroke-width="2"/>`;
      }
      if (st.jacket === 'on') {
        h += `<path d="M80 112L104 112L116 178L108 282L72 274L76 200Z" fill="${s}" stroke="${ink}" stroke-width="1.5"/><path d="M160 112L136 112L124 178L132 282L168 274L164 200Z" fill="${s}" stroke="${ink}" stroke-width="1.5"/>`;
        h += `<path d="M104 112L116 178L97 150L95 120Z" fill="${sd}" stroke="${ink}" stroke-width="1.2"/><path d="M136 112L124 178L143 150L145 120Z" fill="${sd}" stroke="${ink}" stroke-width="1.2"/>`;
        h += `<path d="M140 162l12-2-2 7z" fill="#f7f5f0"/><path d="M84 236h16M140 236h16" stroke="${sd}" stroke-width="2"/>`;
      }
      h += `<ellipse cx="94" cy="64" rx="4" ry="7" fill="${skin}" stroke="${ink}" stroke-width="1.2"/><ellipse cx="146" cy="64" rx="4" ry="7" fill="${skin}" stroke="${ink}" stroke-width="1.2"/>`;
      h += `<ellipse cx="120" cy="62" rx="26" ry="30" fill="${skin}" stroke="${ink}" stroke-width="1.5"/>`;
      h += `<circle cx="110" cy="62" r="2.2" fill="${ink}"/><circle cx="130" cy="62" r="2.2" fill="${ink}"/><path d="M105 54q5-3 10 0M125 53q5-2 10 1" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M109 76q11 9 22 -1" stroke="${ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M120 64l-2 7h4" stroke="${ink}" stroke-width="1.2" fill="none"/>`;
      if (st.hair === 'tousled') h += `<path d="M93 60C88 36 102 22 121 24C141 22 154 38 147 60C145 50 140 44 133 46C129 39 120 41 116 46C110 40 100 46 98 56Z" fill="${hairC}" stroke="${ink}" stroke-width="1.5"/><path d="M104 30c4 6 10 6 12 2M124 28c4 6 12 6 14 0M112 38c3 4 8 4 10 0" stroke="#a37f4b" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      else if (st.hair === 'slick') h += `<path d="M94 56C92 30 148 28 146 56C141 40 99 40 94 56Z" fill="#8f7046" stroke="${ink}" stroke-width="1.5"/><path d="M104 38c10-5 24-5 34 0M100 46c12-6 30-6 42 0" stroke="#6b5232" stroke-width="1.4" fill="none"/>`;
      else h += `<path d="M95 52C97 34 143 34 145 52C137 44 103 44 95 52Z" fill="#a8885a" opacity=".85" stroke="${ink}" stroke-width="1.2"/>`;
      svg.innerHTML = h;
      let sc = 0, mx = 0; for (const k in OPT) { sc += pick(k)[3] * OPT[k].w; mx += OPT[k].w; }
      const p = Math.round(sc / mx * 100);
      $('#wdBar').style.width = p + '%';
      const V = p >= 95 ? 'Pure Jane. You look like you just solved a murder and are now looking for the biscuits.' : p >= 75 ? 'Very nearly. Something small is off, and Jane would notice it from across the room.' : p >= 50 ? 'Respectable, but more “visiting relative’s wedding” than “consultant with a secret”.' : p >= 25 ? 'This is a different TV detective altogether.' : 'Bold choice. Lisbon would ask if you were undercover.';
      $('#wdVerdict').innerHTML = `<b>${p}% Jane.</b> ${V}`;
      $$('button', ctl).forEach((b) => b.setAttribute('aria-pressed', String(st[b.dataset.k] === b.dataset.v)));
    };
    for (const k in OPT) {
      const r = el('div', 'wd-row', `<b>${OPT[k].label}</b>`), o = el('div', 'wd-opts'); o.setAttribute('role', 'group'); o.setAttribute('aria-label', OPT[k].label);
      OPT[k].o.forEach(([v, lab, col]) => { const b = el('button', '', (col ? `<i style="background:${col}"></i>` : '') + lab); b.type = 'button'; b.dataset.k = k; b.dataset.v = v; b.onclick = () => { st[k] = v; render(); }; o.append(b); });
      r.append(o); ctl.append(r);
    }
    render();
  })();

  /* DS car rises on reveal */
  reveal($('#ds'));

  /* ═════════ B. TEA ═════════ */
  (() => {
    const T = [
      ['eb', 'English Breakfast', 95, 240, '#6e3412', 'Strong and brisk. The safe bet for a man who drinks tea all day. Takes milk well.'],
      ['dj', 'Darjeeling', 90, 180, '#b8742a', 'The “champagne of teas”, from the hills of West Bengal. Light, floral, best without milk. Don’t over-steep or it turns bitter.'],
      ['as', 'Assam', 100, 240, '#53240a', 'Malty, bold and very Indian. The base of most breakfast blends and most chai.'],
      ['gr', 'Green', 80, 120, '#a2a843', 'Cooler water and a short steep, or it goes grassy and harsh. Calm, clean, slightly smug.'],
      ['ch', 'Chamomile', 100, 300, '#d9a73c', 'Not technically tea. Perfect before a couch nap.'],
      ['ma', 'Masala chai', 100, 300, '#b07a4d', 'Simmer, don’t steep: tea, milk, ginger, cardamom, sugar, five minutes on the flame. The great disarmer of the subcontinent.'],
    ];
    let cur = T[0], t = 0, run = null, speed = 1;
    const pick = $('#brewPick'), tea = $('#brewTea'), ring = $('#brewRing'), cup = $('#brewCup'), go = $('#brewGo'), fast = $('#brewFast');
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, f) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * f)).join(',')})`; };
    const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
    const draw = () => {
      const f = clamp(t / cur[3], 0, 1);
      tea.setAttribute('fill', mix('#e9d9b8', cur[4], Math.pow(f, .7)));
      ring.style.strokeDashoffset = 276.5 * (1 - f);
      $('#brewT').textContent = fmt(Math.max(0, cur[3] - t));
      $('#brewMeta').textContent = (cur[0] === 'ma' ? 'simmer' : cur[2] + '°C') + ' · ' + fmt(cur[3]).replace(':00', '') + ' min';
    };
    const stop = (done) => {
      clearInterval(run); run = null; cup.classList.remove('brewing'); go.textContent = done ? 'Brew another' : 'Start steeping'; fast.disabled = true; speed = 1;
      if (done) $('#brewNote').innerHTML = `<b>Ding.</b> Your ${cur[1]} is ready. Hold the saucer, take a slow sip, and raise one eyebrow at whoever’s nearest. You’ve just bought yourself ${fmt(cur[3]).replace(':00', '')} minutes of uninterrupted thinking.`;
    };
    const sel = (x) => { stop(); cur = x; t = 0; $$('button', pick).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.k === x[0]))); $('#brewNote').textContent = x[5]; draw(); };
    T.forEach((x) => { const b = el('button', '', `<i style="background:${x[4]}"></i>${x[1]}`); b.type = 'button'; b.dataset.k = x[0]; b.setAttribute('role', 'radio'); b.onclick = () => sel(x); pick.append(b); });
    go.onclick = () => {
      if (run) { stop(); return; }
      if (t >= cur[3]) t = 0;
      cup.classList.add('brewing'); go.textContent = 'Stop'; fast.disabled = false;
      $('#brewNote').textContent = 'Steeping. This is where Jane does his best thinking. Try it: what’s one problem you’ve been avoiding?';
      let last = performance.now();
      run = setInterval(() => { const now = performance.now(); t += (now - last) / 1000 * speed; last = now; draw(); if (t >= cur[3]) { t = cur[3]; draw(); stop(true); } }, 100);
    };
    fast.onclick = () => { speed = speed === 1 ? 20 : 1; fast.textContent = speed === 1 ? 'Fast-forward ×20' : 'Normal speed'; };
    sel(T[0]);
  })();

  /* ═════════ C. COUCH TEST (RAT) ═════════ */
  (() => {
    const R = [['cream', 'skate', 'water', 'ice'], ['show', 'life', 'row', 'boat'], ['night', 'wrist', 'stop', 'watch'], ['river', 'note', 'account', 'bank'], ['dew', 'comb', 'bee', 'honey'], ['pine', 'crab', 'sauce', 'apple'], ['sore', 'shoulder', 'sweat', 'cold'], ['french', 'car', 'shoe', 'horn']];
    const list = $('#ratList'), score = $('#ratScore'); let phase = 'before'; const solved = {};
    R.forEach((r, i) => {
      const row = el('div', 'rat', `<span>${r[0]}<i>·</i>${r[1]}<i>·</i>${r[2]}</span>`), inp = el('input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', `Link word for ${r[0]}, ${r[1]}, ${r[2]}`); inp.placeholder = '?';
      inp.addEventListener('input', () => { if (inp.value.trim().toLowerCase() === r[3] && !solved[i]) { solved[i] = phase; row.classList.add('ok'); if (phase === 'after') row.classList.add('late'); inp.readOnly = true; upd(); } });
      row.append(inp); list.append(row);
    });
    const upd = () => {
      const b = Object.values(solved).filter((v) => v === 'before').length, a = Object.values(solved).filter((v) => v === 'after').length, n = b + a;
      if (phase === 'before') score.textContent = n ? `${n} of ${R.length} solved. Stuck on the rest? That’s when you take the couch.` : '';
      else score.textContent = a ? `${b} before the break, ${a} more after it. That’s incubation at work: your mind kept chewing while you stared at the ceiling.` : `${b} before the break and none after, so far. Give it a minute; answers often arrive while you’re thinking about something else.`;
      if (n === R.length) score.textContent += ' All eight. Jane would be proud, and slightly annoyed.';
    };
    const over = $('#ratOver'), tt = $('#ratT'); let iv;
    const back = el('button', 'btn ghost', 'I’m back early'); back.style.marginTop = '1.4rem'; $('.ro-in', over).append(back);
    const end = () => { clearInterval(iv); over.hidden = true; phase = 'after'; upd(); const first = $$('.rat:not(.ok) input', list)[0]; first && first.focus(); };
    back.onclick = end;
    over.addEventListener('keydown', (e) => { if (e.key === 'Escape') end(); });
    $('#ratBreak').onclick = () => { over.hidden = false; let n = 40; tt.textContent = n; back.focus(); iv = setInterval(() => { n--; tt.textContent = n; if (n <= 0) end(); }, 1000); };
    $('#ratGive').onclick = () => { $$('.rat', list).forEach((row, i) => { const inp = $('input', row); if (!solved[i]) { inp.value = R[i][3]; inp.readOnly = true; row.style.opacity = '.65'; } }); score.textContent = 'Answers revealed. Notice how obvious they feel now. That “of course!” feeling is insight.'; };
  })();

  /* ═════════ D. READ THE STRANGER ═════════ */
  (() => {
    const svg = $('#stSvg');
    const ink = '#0f1420', skin = '#b97f56', tan = '#8a5432';
    svg.innerHTML = `
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9a86a"/><stop offset=".6" stop-color="#c77a52"/><stop offset="1" stop-color="#6d4a52"/></linearGradient></defs>
      <rect width="360" height="520" fill="url(#sky)"/>
      <g opacity=".35" fill="#5a3c46"><rect x="0" y="250" width="60" height="200"/><rect x="50" y="210" width="44" height="240"/><rect x="250" y="230" width="70" height="220"/><rect x="310" y="190" width="50" height="260"/></g>
      <rect x="0" y="470" width="360" height="50" fill="#5b5552"/><rect x="0" y="466" width="360" height="6" fill="#d6cfc4"/>
      <rect x="312" y="60" width="7" height="410" fill="#3b3f48"/><rect x="290" y="44" width="52" height="34" rx="6" fill="#2f6f4f" stroke="${ink}" stroke-width="2"/><text x="316" y="66" text-anchor="middle" font-family="Courier Prime, monospace" font-weight="700" font-size="13" fill="#fff">BUS</text>
      <rect x="58" y="168" width="54" height="116" rx="14" fill="#3d5a48" stroke="${ink}" stroke-width="2"/><path d="M70 180h30" stroke="#2c4335" stroke-width="3"/>
      <path d="M76 284l-4 16" stroke="${ink}" stroke-width="1.5"/><rect x="58" y="298" width="26" height="16" rx="2" fill="#f8f4ea" stroke="${ink}" stroke-width="1.5" transform="rotate(-8 71 306)"/><rect x="58" y="303" width="26" height="4" fill="#b23a2e" transform="rotate(-8 71 306)"/>
      <path d="M112 298L228 298L222 474L178 474L170 340L162 474L118 474Z" fill="#3a3f4a" stroke="${ink}" stroke-width="2"/>
      <path d="M116 470h46c4 0 6 6 4 12-2 4-6 6-12 6h-40c-6 0-8-4-6-10 2-6 4-8 8-8z" fill="#5a2e18" stroke="${ink}" stroke-width="2"/><path d="M124 474h18" stroke="#c48a5e" stroke-width="2" stroke-linecap="round"/>
      <path d="M178 470h46c4 0 8 2 10 8 2 6 0 10-6 10h-42c-6 0-10-4-10-10 0-4 0-8 2-8z" fill="#5a2e18" stroke="${ink}" stroke-width="2"/><path d="M186 474h18" stroke="#c48a5e" stroke-width="2" stroke-linecap="round"/><path d="M224 482l10 0" stroke="#b07d58" stroke-width="3"/>
      <path d="M118 146L96 228L116 236L134 172Z" fill="#cfe0ec" stroke="${ink}" stroke-width="2"/><rect x="94" y="226" width="24" height="10" rx="3" fill="#b9cfdf" stroke="${ink}" stroke-width="1.5" transform="rotate(14 106 231)"/>
      <path d="M98 236L86 318L102 322L116 240Z" fill="${tan}" stroke="${ink}" stroke-width="2"/>
      <circle cx="92" cy="330" r="13" fill="${tan}" stroke="${ink}" stroke-width="2"/><path d="M86 334h10" stroke="#e7c3a0" stroke-width="3" stroke-linecap="round"/>
      <path d="M222 146L244 228L224 236L206 172Z" fill="#cfe0ec" stroke="${ink}" stroke-width="2"/><rect x="222" y="226" width="24" height="10" rx="3" fill="#b9cfdf" stroke="${ink}" stroke-width="1.5" transform="rotate(-14 234 231)"/>
      <path d="M226 236L240 318L256 314L242 236Z" fill="${skin}" stroke="${ink}" stroke-width="2"/>
      <rect x="236" y="300" width="20" height="8" rx="2" fill="#3a2a20" transform="rotate(-8 246 304)"/><circle cx="238" cy="305" r="5" fill="#e8e3d6" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="252" cy="330" r="13" fill="${skin}" stroke="${ink}" stroke-width="2"/><path d="M263 324c2 5 2 10 0 14" stroke="#2d4bb3" stroke-width="4" stroke-linecap="round" opacity=".8"/>
      <path d="M118 144L222 144L232 302L108 302Z" fill="#cfe0ec" stroke="${ink}" stroke-width="2"/>
      <path d="M170 150v148" stroke="#9fb6c8" stroke-width="1.5"/><g fill="#9fb6c8"><circle cx="174" cy="176" r="2"/><circle cx="174" cy="206" r="2"/><circle cx="174" cy="236" r="2"/><circle cx="174" cy="266" r="2"/></g>
      <rect x="184" y="180" width="30" height="32" rx="2" fill="#bdd3e3" stroke="${ink}" stroke-width="1.5"/>
      <path d="M190 182C186 164 178 150 166 142M208 182C206 164 192 150 174 142" stroke="#2d4bb3" stroke-width="4" fill="none"/><rect x="194" y="176" width="10" height="8" rx="1" fill="#c9ccd1" stroke="${ink}" stroke-width="1"/>
      <rect x="158" y="120" width="24" height="26" fill="${skin}" stroke="${ink}" stroke-width="2"/>
      <path d="M150 138L170 160L160 166ZM190 138L170 160L180 166Z" fill="#e6eef5" stroke="${ink}" stroke-width="2"/>
      <ellipse cx="170" cy="92" rx="32" ry="36" fill="${skin}" stroke="${ink}" stroke-width="2"/>
      <path d="M138 88C134 56 152 50 170 50C192 50 208 60 202 90C198 76 188 68 176 70C164 66 150 72 144 86Z" fill="#1d1b1a" stroke="${ink}" stroke-width="2"/>
      <circle cx="158" cy="94" r="2.6" fill="${ink}"/><circle cx="182" cy="94" r="2.6" fill="${ink}"/><path d="M151 85q7-4 13 0M176 85q7-4 13 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M160 112q10 5 20 0" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M146 104c4 18 44 18 48 0" fill="none" stroke="#5a3a28" stroke-width="5" opacity=".18"/>
      <path d="M170 96l-3 9h6" stroke="${ink}" stroke-width="1.5" fill="none"/>`;
    const C = [
      [100, 280, 'The darker forearm', 'His right forearm is noticeably more tanned than his left.', 'He drives a lot. In India the driver sits on the right, so it’s the right arm that catches the sun through the window.', 'Or he plays cricket, or works outdoors. Look for a car key or a steering-wheel shine on his palm.'],
      [92, 334, 'A pale band', 'A thin pale stripe on his ring finger, but no ring.', 'He wore a ring for years and has taken it off recently.', 'A separation? Maybe. Or the ring is being resized, or his job doesn’t allow it. This is exactly what Jane says aloud and you never should.'],
      [264, 332, 'Ink on the edge', 'Blue ink smudged along the outer edge of his left hand.', 'He’s left-handed and writes a lot by hand. Left-handers drag their palm through wet ink.', 'Or he leaned on a leaky pen once. Check which hand he reaches for his phone with.'],
      [238, 305, 'The inside-out watch', 'His watch face sits on the inside of his wrist.', 'An old habit among nurses, doctors and soldiers: you can check the time while your hands are busy, without twisting your arm.', 'Or he just likes it that way. Alone it means little. With the next clue, it starts to mean more.'],
      [198, 190, 'The hidden lanyard', 'A blue lanyard tucked into his shirt pocket, badge hidden.', 'He has an ID badge for work and pockets it when he leaves, out of habit or for privacy. With the watch, a hospital job becomes a decent guess.', 'Lanyards are everywhere, from IT parks to banks. It narrows things only a little.'],
      [70, 306, 'The baggage tag', 'An airline baggage tag still hanging off his backpack.', 'He flew recently, probably in the last week or two, and hasn’t got round to removing it.', 'Some people leave tags on for months. A crisp tag means recent; a crumpled one means lazy.'],
      [204, 480, 'Shoes and heels', 'Well-polished shoes with heels worn down at the outer edge.', 'He cares how he looks but walks a lot. Polish is cheap and new soles cost money, so he’s careful rather than wealthy.', 'Or it’s simply his favourite pair. Everybody has one.'],
    ];
    const NS = 'http://www.w3.org/2000/svg', found = new Set(), out = $('#stOut');
    C.forEach(([x, y, t, see, inf, alt], i) => {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'hs'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', 'Clue: ' + t);
      g.innerHTML = `<circle class="ring" cx="${x}" cy="${y}" r="14"/><circle cx="${x}" cy="${y}" r="20" fill="transparent"/>`;
      const go = () => {
        if (found.has(i)) return; found.add(i); g.classList.add('found');
        if (found.size === 1) out.innerHTML = '';
        const d = el('div', 'clue', `<h4>${t}</h4><p><b>See:</b> ${see}</p><p><b>Infer:</b> ${inf}</p><p class="alt"><b>Or…</b> ${alt}</p>`);
        out.prepend(d); $('#stN').textContent = found.size;
        if (found.size === C.length) out.prepend(el('div', 'clue', `<h4>Putting it together</h4><p>Possibly a left-handed healthcare worker who drives to work, flew somewhere recently and has been through a change at home. <em>Possibly.</em> Jane would announce all of it to the whole bus stop. A gentleman keeps it to himself and just says, “Long day?”</p>`));
      };
      g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      svg.append(g);
    });
  })();

  /* ═════════ E. TWELVE SECONDS ═════════ */
  (() => {
    const svg = $('#dkSvg'), ink = '#1a1410';
    const hand = (cx, cy, len, deg, w) => { const a = (deg - 90) * Math.PI / 180; return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(a) * len}" y2="${cy + Math.sin(a) * len}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`; };
    let ticks = ''; for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180; ticks += `<line x1="${100 + Math.sin(a) * 30}" y1="${80 - Math.cos(a) * 30}" x2="${100 + Math.sin(a) * 36}" y2="${80 - Math.cos(a) * 36}" stroke="${ink}" stroke-width="${i % 3 ? 1.5 : 3}"/>`; }
    svg.innerHTML = `
      <rect width="600" height="210" fill="#4a3a2e"/><rect y="0" width="600" height="210" fill="url(#none)"/>
      <g opacity=".12" stroke="#000"><line x1="0" y1="60" x2="600" y2="60"/><line x1="0" y1="130" x2="600" y2="130"/></g>
      <circle cx="100" cy="80" r="44" fill="#f8f4ea" stroke="${ink}" stroke-width="4"/>${ticks}${hand(100, 80, 18, 110, 4)}${hand(100, 80, 30, 240, 2.5)}<circle cx="100" cy="80" r="3" fill="${ink}"/>
      <rect x="440" y="34" width="110" height="86" fill="#8a6a3c" stroke="${ink}" stroke-width="3"/><rect x="450" y="44" width="90" height="66" fill="#bcd3e0"/><rect x="450" y="88" width="90" height="22" fill="#8fb07a"/>
      <path d="M478 98c0-12 6-20 16-20 4-6 12-6 14 0 6 2 8 8 6 12l-4 2v10h-6v-8h-14v8h-6z" fill="#6b4a2e"/><path d="M506 78l4-8 4 9" fill="#6b4a2e"/><circle cx="510" cy="82" r="1.4" fill="#000"/>
      <rect y="200" width="600" height="160" fill="#7a4f2e"/><g stroke="#5e3a20" stroke-width="2" opacity=".5" fill="none"><path d="M0 240c120-8 240 8 360 0s200-6 240 0"/><path d="M0 300c140-6 260 8 380 0s180-4 220 2"/></g><rect y="200" width="600" height="8" fill="#9a6a42"/>
      <path d="M50 214l20-70h40l20 70z" fill="#2f6f4f" stroke="${ink}" stroke-width="2.5"/><rect x="84" y="214" width="12" height="40" fill="#c9a441"/><ellipse cx="90" cy="258" rx="34" ry="8" fill="#c9a441" stroke="${ink}" stroke-width="2"/>
      <g transform="rotate(-6 210 250)"><rect x="150" y="232" width="120" height="34" rx="3" fill="#3f7a4e" stroke="${ink}" stroke-width="2.5"/><rect x="150" y="232" width="12" height="34" fill="#2e5c39"/><text x="216" y="254" text-anchor="middle" font-family="Fraunces, serif" font-style="italic" font-size="13" fill="#f3d27e">Field Notes</text></g>
      <g transform="rotate(4 450 240)"><rect x="416" y="214" width="66" height="60" fill="#ffd45c" stroke="${ink}" stroke-width="1.5"/><text x="449" y="256" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="36" fill="#1c2230">47</text></g>
      <g stroke-linecap="round"><line x1="270" y1="316" x2="356" y2="300" stroke="#1c2230" stroke-width="7"/><line x1="282" y1="332" x2="368" y2="322" stroke="#b23a2e" stroke-width="7"/><line x1="292" y1="346" x2="372" y2="344" stroke="#3f6f99" stroke-width="7"/></g>
      <g fill="none" stroke="${ink}" stroke-width="3"><circle cx="318" cy="252" r="16"/><circle cx="356" cy="252" r="16"/><path d="M334 252h6M302 250l-14-6M372 250l14-6"/></g>
      <ellipse cx="530" cy="318" rx="52" ry="12" fill="#e9eef3" stroke="${ink}" stroke-width="2"/><path d="M500 280h60c0 22-10 34-30 34s-30-12-30-34z" fill="#f4f8fb" stroke="${ink}" stroke-width="2"/><path d="M500 288c-16-2-20 8-16 14s10 8 18 6" fill="none" stroke="${ink}" stroke-width="5"/><path d="M500 288c-16-2-20 8-16 14s10 8 18 6" fill="none" stroke="#f4f8fb" stroke-width="2"/><ellipse cx="530" cy="280" rx="30" ry="6" fill="#7a3b14" stroke="${ink}" stroke-width="2"/>
      <g transform="translate(180 320)"><circle cx="0" cy="0" r="9" fill="none" stroke="#c9ccd1" stroke-width="3"/><path d="M6 6l22 10M14 10l2 -5M20 13l2 -5" stroke="#c9ccd1" stroke-width="4" stroke-linecap="round"/><rect x="-22" y="-6" width="14" height="18" rx="3" fill="#2f6fb8" stroke="${ink}" stroke-width="1.5"/></g>`;
    const Q = [
      ['What time did the clock show?', ['3:40', '8:20', '4:15', '2:40'], 0],
      ['What number was written on the sticky note?', ['74', '47', '41', '17'], 1],
      ['How many pens were on the desk?', ['2', '3', '4', 'None'], 1],
      ['What was in the photo frame?', ['A beach', 'A woman', 'A dog', 'A car'], 2],
      ['What colour was the book?', ['Red', 'Green', 'Blue', 'Black'], 1],
      ['Which way did the teacup handle point?', ['Left', 'Right', 'Towards you', 'No handle'], 0],
      ['What colour was the keyring tag?', ['Red', 'Yellow', 'Blue', 'There were no keys'], 2],
    ];
    const cover = $('#dkCover'), qbox = $('#dkQ'), timer = $('#dkTimer');
    let qi = 0, score = 0;
    const ask = () => {
      if (qi >= Q.length) {
        const r = score >= 7 ? 'Jane-level. Are you sure you didn’t pause it?' : score >= 5 ? 'Sharp. Lisbon would want you on the team.' : score >= 3 ? 'Average, which is to say: you saw everything and noticed half.' : 'Normal! Most people notice very little they aren’t looking for. That’s what practice fixes.';
        qbox.innerHTML = `<div class="dk-res"><p class="big">${score}/${Q.length}</p><p>${r}</p><p style="font-size:.92rem;color:var(--on-3)">Drill: next time you leave a room, name five things in it without looking back. Do it daily for a week and watch the score climb.</p></div>`;
        const again = el('button', 'btn', 'Look again'); again.onclick = () => { cover.classList.add('off'); qbox.hidden = true; }; const w = el('div', 'btns'); w.style.justifyContent = 'center'; w.append(again); qbox.append(w);
        return;
      }
      const [q, opts, a] = Q[qi];
      qbox.innerHTML = `<p class="qn">Question ${qi + 1} of ${Q.length}</p><h4>${q}</h4>`;
      const o = el('div', 'opts');
      opts.forEach((t, i) => { const b = el('button', '', t); b.type = 'button'; b.onclick = () => { $$('button', o).forEach((x) => x.disabled = true); b.classList.add(i === a ? 'right' : 'wrong'); if (i !== a) o.children[a].classList.add('right'); else score++; setTimeout(() => { qi++; ask(); }, 900); }; o.append(b); });
      qbox.append(o); o.children[0].focus({ preventScroll: true });
    };
    $('#dkGo').onclick = () => {
      cover.classList.add('off'); timer.hidden = false; qbox.hidden = true; let n = 12; $('#dkT').textContent = n;
      const iv = setInterval(() => { n--; $('#dkT').textContent = n; if (n <= 0) { clearInterval(iv); timer.hidden = true; cover.classList.remove('off'); cover.innerHTML = '<p class="hand" style="font-size:2rem;color:var(--gold-l)">Desk hidden. No peeking.</p>'; qi = 0; score = 0; qbox.hidden = false; ask(); } }, 1000);
    };
  })();

  /* ═════════ F. THE READING ═════════ */
  (() => {
    const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const SIGN = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
    const SYM = {
      moon: '<path d="M22 6a14 14 0 1 0 8 24A12 12 0 0 1 22 6z" fill="none" stroke="#f3d27e" stroke-width="2"/>',
      star: '<path d="M17 3l4 10 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z" fill="none" stroke="#f3d27e" stroke-width="2" stroke-linejoin="round"/>',
      eye: '<path d="M2 17s6-9 15-9 15 9 15 9-6 9-15 9S2 17 2 17z" fill="none" stroke="#f3d27e" stroke-width="2"/><circle cx="17" cy="17" r="4" fill="#f3d27e"/>',
      key: '<circle cx="10" cy="17" r="6" fill="none" stroke="#f3d27e" stroke-width="2"/><path d="M16 17h15M26 17v5M30 17v4" stroke="#f3d27e" stroke-width="2" fill="none"/>',
    };
    const SYMTXT = { moon: 'The moon tells me you feel things more deeply than you show.', star: 'The star tells me you were always meant for something more than you’re doing now.', eye: 'The eye tells me you notice more than people give you credit for.', key: 'The key tells me there’s a door in your life you haven’t quite dared to open.' };
    const LINES = [
      ['You have a great deal of potential that the people around you haven’t fully recognised yet.', 'Flattery + Barnum', 'Almost everyone believes they’re underrated. Say it warmly and they’ll nod.'],
      ['You can be outgoing and good company, but there are days when you’d honestly rather be left alone.', 'Rainbow ruse', 'A trait and its opposite in one sentence. It covers every human being alive.'],
      ['You’re harder on yourself than you let other people see.', 'Barnum statement', 'Nearly universal, and it feels like a secret.'],
      ['There was a decision a while ago, about work, money or a relationship, that you still turn over in your mind.', 'Multiple outs', 'Three huge categories and no time limit. Something will fit, and you’ll supply the details yourself.'],
      ['Too much routine makes you restless. You need a bit of variety to feel alive.', 'Barnum statement', 'Who says “I adore monotony”?'],
      ['You’ve learned to be careful about how much you reveal to new people.', 'Barnum statement', 'True of every adult who’s ever been embarrassed once.'],
      ['I’m picking up an older man, a father figure perhaps, someone you have something unfinished with.', 'Fishing', 'Most people have an older male relative and something unsaid. A real reader would now watch your face and adjust.'],
    ];
    let sym = 'eye', rating = null;
    const ms = $('#rdMonth'); M.forEach((m, i) => { const o = el('option', '', m); o.value = i; ms.append(o); }); ms.value = new Date().getMonth();
    const sb = $('#rdSym');
    Object.keys(SYM).forEach((k) => { const b = el('button', '', `<svg viewBox="0 0 34 34">${SYM[k]}</svg>`); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', k); b.setAttribute('aria-checked', String(k === sym)); b.onclick = () => { sym = k; $$('button', sb).forEach((x) => x.setAttribute('aria-checked', String(x === b))); }; sb.append(b); });
    $('#rdGo').onclick = () => {
      const m = +ms.value, sign = SIGN[m];
      $('#rdStep1').hidden = true; $('#rdStep2').hidden = false;
      const c = $('#rdCard'); c.innerHTML = '';
      const all = [`Born in ${M[m]}, under ${sign}. That explains a great deal. ${SYMTXT[sym]}`].concat(LINES.map((l) => l[0]));
      all.forEach((t, i) => { const p = el('p', 'rd-line', t); c.append(p); setTimeout(() => p.classList.add('on'), RM ? 0 : 400 + i * 900); });
      const stars = $('#rdStars'); stars.innerHTML = '';
      for (let i = 0; i <= 5; i++) { const b = el('button', '', i); b.type = 'button'; b.setAttribute('aria-label', i + ' out of 5'); b.onclick = () => { rating = i; done(m); }; stars.append(b); }
    };
    const done = (m) => {
      $('#rdStep2').hidden = true; const s3 = $('#rdStep3'); s3.hidden = false;
      s3.innerHTML = `<div class="rd-reveal"><h4>Confession: everybody gets this reading.</h4><p>Whatever month you chose and whichever symbol you picked, the lines underneath were identical. Only the first sentence changed, and that’s decoration. Here’s how each line works.</p>
        <div class="rd-cmp"><div><b>${rating}/5</b><span>Your rating</span></div><div><b>4.26/5</b><span>Forer’s students, 1949</span></div></div>
        <ul class="rd-ann">${LINES.map((l) => `<li><em>${l[1]}</em> <q>${l[0]}</q><br>${l[2]}</li>`).join('')}</ul></div>`;
      const again = el('button', 'btn ghost', 'Try a different month'); again.onclick = () => { s3.hidden = true; $('#rdStep1').hidden = false; }; const w = el('div', 'btns'); w.append(again); s3.append(w);
      s3.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
    };
  })();

  /* cold reading techniques */
  const flipCards = (host, items, cls) => {
    items.forEach(([front, sub, back, ex]) => {
      const w = el('div', 'tc rv'), b = el('button');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="f">${cls === 'code' ? `<i>${sub}</i>` : ''}<b>${front}</b>${cls === 'code' ? '' : `<span>${sub}</span>`}<small>Tap to turn</small></span><span class="b">${back}${ex ? `<q>${ex}</q>` : ''}</span>`;
      b.onclick = () => { const f = w.classList.toggle('flip'); b.setAttribute('aria-pressed', String(f)); };
      w.append(b); host.append(w); reveal(w);
    });
  };
  flipCards($('#tech'), [
    ['Barnum statements', 'True of nearly everyone, felt as personal', 'Vague, flattering statements that almost anybody accepts as an accurate description of themselves.', 'You can be your own harshest critic.'],
    ['The rainbow ruse', 'A trait and its opposite', 'Credit someone with one quality and its opposite in the same breath, so you can’t be wrong.', 'You’re confident, but deep down you have doubts.'],
    ['Shotgunning', 'Fire lots of details, keep the hits', 'Rattle off many specifics quickly. The person latches onto whatever fits and forgets the rest.', 'I’m seeing a J… or a G… an older man… a document?'],
    ['Fishing', 'Questions dressed as statements', 'Phrase a guess so it sounds like a statement but invites correction. Whatever they say, claim it.', 'There’s a connection with water, isn’t there?'],
    ['Jacques statements', 'The worries of a life stage', 'Named after the “seven ages of man” speech in <em>As You Like It</em>. Every age has predictable concerns.', 'To a 28-year-old: You’re wondering if you’re on the right path.'],
    ['Hot reading', 'Cheating with research', 'Finding information beforehand. Fake psychics once hired researchers. Today they just open Instagram.', 'Your grandmother loved her garden, didn’t she?'],
    ['Reading the reaction', 'Follow the face', 'The reader watches micro-reactions, such as a nod, a lean or a tightened lip, and steers towards whatever lands.', 'Yes… I feel that’s important to you.'],
    ['Selective memory', 'Why it works afterwards', 'Not a technique but the engine: people remember hits, forget misses and retell the story even better.', 'She knew my father’s name! (She said “a J or a G.”)'],
  ]);

  /* ═════════ G. MYTHS ═════════ */
  (() => {
    const Q = [
      ['Liars avoid eye contact.', 'myth', 'A 2003 review of 158 possible cues found gaze aversion to be basically unrelated to lying. Liars know the stereotype too, and some hold your gaze on purpose.'],
      ['Glancing up and to the right means someone is making it up.', 'myth', 'This comes from neuro-linguistic programming. Richard Wiseman’s team tested it in three studies in 2012, including footage of real press conferences, and found no link at all.'],
      ['Most people catch lies only slightly better than a coin toss.', 'true', 'Across 206 studies and over 24,000 judges, average accuracy was about 54%. We’re also biased towards believing people: lies were correctly spotted less often than truths.'],
      ['Police officers and trained interrogators are far better at it than the rest of us.', 'myth', 'Experts did barely better than students, about 55% against 53%. What training mainly adds is confidence, which is arguably worse.'],
      ['Liars fidget and squirm.', 'myth', 'Not reliably. Some liars actually move <em>less</em>, because they’re concentrating on controlling themselves. Nervous truth-tellers fidget plenty.'],
      ['Lies tend to contain fewer details than true stories.', 'true', 'On average, yes. Liars are less forthcoming and give fewer specific, checkable details. Detail-based interviewing methods build on this, though the effect is modest.'],
      ['Asking for the story in reverse order can help expose a lie.', 'sort', 'In lab studies by Aldert Vrij and colleagues, reverse-order recall added mental load and made lies a bit easier to spot. It’s a useful tool, not a lie detector.'],
      ['If you know how someone normally behaves, you’ll easily spot when they’re lying.', 'sort', 'A baseline helps far less than you’d think. With people we love, familiarity often makes us <em>more</em> trusting, not more accurate.'],
    ];
    const LAB = { myth: 'Myth', true: 'True', sort: 'Sort of' };
    let i = 0, s = 0; const box = $('#myCard');
    const show = () => {
      if (i >= Q.length) {
        box.innerHTML = `<div class="my-end"><p class="my-n">Result</p><p class="big">${s}/${Q.length}</p><p>${s >= 7 ? 'You know more about lie detection than most police training manuals of the 1990s.' : s >= 5 ? 'Solid. You’ve escaped most of the movie myths.' : 'Don’t worry. Most people believe nearly all of these. Hollywood has a lot to answer for.'}</p><p style="font-size:.95rem;color:var(--ink-2)">The real lesson is humility. If you’re “sure” someone is lying from their body language alone, you’re probably just sure.</p></div>`;
        const a = el('button', 'btn ghost', 'Play again'); a.onclick = () => { i = 0; s = 0; show(); }; const w = el('div', 'btns'); w.style.justifyContent = 'center'; w.append(a); box.append(w); return;
      }
      const [q, v, ex] = Q[i];
      box.innerHTML = `<div class="my-dots">${Q.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div><p class="my-n">Claim ${i + 1} of ${Q.length}</p><p class="my-q">“${q}”</p>`;
      const bs = el('div', 'my-btns');
      ['myth', 'true', 'sort'].forEach((k) => { const b = el('button', '', LAB[k]); b.type = 'button'; b.onclick = () => {
        $$('button', bs).forEach((x) => x.disabled = true); b.classList.add(k === v ? 'right' : 'wrong'); if (k === v) s++; else bs.children[['myth', 'true', 'sort'].indexOf(v)].classList.add('right');
        const e = el('div', 'my-ex', `<b class="v v-${v}">${LAB[v]}</b>${ex}`); box.append(e);
        const n = el('button', 'btn', i === Q.length - 1 ? 'See my score' : 'Next claim'); n.onclick = () => { i++; show(); }; const w = el('div', 'btns'); w.append(n); box.append(w); n.focus({ preventScroll: true });
      }; bs.append(b); });
      box.append(bs);
    };
    show();
  })();
  reveal($('#coinFig'));

  /* ═════════ H. PREDICTIONS ═════════ */
  (() => {
    const Q = [
      ['Think of a number from 1 to 10.', '7', ['7', 'seven'], ['3', 'three'], 'Seven is the favourite by a distance. In a 1976 study by Kubovy and Psotka, about 28% of people asked for a “random” digit chose 7, nearly three times what chance predicts. The ends feel too obvious, the evens too neat, and seven feels the most random.'],
      ['A number between 1 and 50. Both digits odd, and different from each other.', '37', ['37'], ['35', '39', '17'], 'A mentalist favourite. Once you rule out the “obvious” 13 and 15 and avoid fives, 37 feels the most random. 35 is the usual runner-up, which is why a performer keeps it as a back-up “I was thinking 35, then it changed…”.'],
      ['Name a flower.', 'Rose', ['rose', 'roses', 'gulab'], ['lotus', 'sunflower', 'tulip', 'marigold', 'jasmine'], 'The rose is the prototype flower for most people. In India the lotus and marigold run it close.'],
      ['Name a piece of furniture.', 'Chair', ['chair', 'chairs'], ['table', 'sofa', 'couch', 'bed'], 'Chair, then table. When we’re asked for an example of a category, the most typical member jumps out first. Psychologists call this prototypicality.'],
      ['Name a colour.', 'Red', ['red'], ['blue'], 'Red and blue take most of the vote. A performer hedges with “I’m seeing a strong, primary colour…” and lets your face decide which.'],
      ['Name a tool.', 'Hammer', ['hammer'], ['screwdriver', 'spanner', 'wrench', 'saw', 'pliers'], 'The hammer is the archetypal tool, the one in every cartoon.'],
      ['Name a vegetable.', 'Potato', ['potato', 'potatoes', 'aloo', 'alu'], ['carrot', 'tomato', 'onion', 'brinjal', 'cabbage'], 'In Western surveys the carrot usually wins. In India the aloo is king. A good mentalist reads the room before choosing the prediction.'],
    ];
    const box = $('#prBody'); let i = 0, hits = 0;
    const norm = (s) => s.trim().toLowerCase().replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9 ]/g, '');
    const show = () => {
      if (i >= Q.length) {
        box.innerHTML = `<div class="pr-end"><p class="pr-n">Final tally</p><p class="big">${hits % 1 ? hits.toFixed(1) : hits}/${Q.length}</p><p>${hits >= 4 ? 'You’re beautifully typical. A mentalist’s dream audience member.' : hits >= 2 ? 'Partly predictable, like everyone. A real performer would have used your face to fix the misses.' : 'Admirably unpredictable. You’d be a mentalist’s nightmare, which is a compliment.'}</p><p style="font-size:.94rem;color:var(--on-2)">On stage, a mentalist never asks seven questions in a row like this. They pick one strong force, hedge with a near-miss, and frame any hit as a miracle. The odds do the rest.</p></div>`;
        const a = el('button', 'btn ghost', 'Start again'); a.onclick = () => { i = 0; hits = 0; show(); }; const w = el('div', 'btns'); w.style.justifyContent = 'center'; w.append(a); box.append(w); return;
      }
      const [q, pred, ok, near, note] = Q[i];
      box.innerHTML = `<p class="pr-n">Question ${i + 1} of ${Q.length}</p><p class="pr-q">${q}</p>`;
      const f = el('form', 'pr-in'), inp = el('input'), b = el('button', 'btn', 'Lock it in'); inp.type = 'text'; inp.required = true; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Your answer'); f.append(inp, b);
      const env = el('div', 'env', `<div class="back"></div><div class="letter"><small>My prediction</small><b>${pred}</b></div><div class="front"></div><div class="flap"></div><div class="seal"></div>`);
      const res = el('div', 'pr-res'); res.setAttribute('aria-live', 'polite');
      box.append(f, env, res); inp.focus({ preventScroll: true });
      f.onsubmit = (e) => {
        e.preventDefault(); const a = norm(inp.value); if (!a) return; inp.disabled = true; b.disabled = true; env.classList.add('open');
        const kind = ok.includes(a) ? 'hit' : near.includes(a) ? 'near' : 'miss'; if (kind === 'hit') hits++; else if (kind === 'near') hits += .5;
        setTimeout(() => {
          res.innerHTML = `<p class="${kind}">${kind === 'hit' ? 'Got you.' : kind === 'near' ? 'Close. That was my back-up.' : 'You slipped the net this time.'}</p><p>${note}</p>`;
          const n = el('button', 'btn', i === Q.length - 1 ? 'See the tally' : 'Next'); n.onclick = () => { i++; show(); }; const w = el('div', 'btns'); w.style.justifyContent = 'center'; w.append(n); res.append(w);
        }, RM ? 0 : 1100);
      };
    };
    show();
  })();

  /* ═════════ I. VANISHING CARD ═════════ */
  (() => {
    const A = [['K', 's'], ['Q', 'h'], ['J', 'c'], ['K', 'd'], ['Q', 's'], ['J', 'h']];
    const B = [['K', 'c'], ['Q', 'd'], ['J', 's'], ['K', 'h'], ['Q', 'c']];
    const row = $('#tkRow'), say = $('#tkSay'), go = $('#tkGo'), how = $('#tkHow'), hb = $('#tkHowBox'); let step = 0;
    const deal = (set) => { row.innerHTML = ''; set.forEach(([r, s], i) => { const c = el('div', 'pcard deal', card(r, s)); c.style.animationDelay = i * .08 + 's'; row.append(c); }); };
    const reset = () => { step = 0; deal(A); say.textContent = 'Look at all six. Pick one silently and fix it in your mind.'; go.textContent = 'I’ve got my card'; how.hidden = true; hb.hidden = true; };
    go.onclick = () => {
      if (step === 0) {
        step = 1; say.textContent = 'Good. Now picture it clearly. I’m going to reach into your mind and take that card out of the deck…'; go.disabled = true;
        setTimeout(() => { row.innerHTML = ''; for (let i = 0; i < 6; i++) { const c = el('div', 'pcard deal', card(0, 0, true)); c.style.animationDelay = i * .06 + 's'; row.append(c); } }, RM ? 0 : 1600);
        setTimeout(() => { deal(B); say.textContent = 'There. Your card is gone.'; go.disabled = false; go.textContent = 'Do it again'; how.hidden = false; step = 2; }, RM ? 0 : 3200);
      } else reset();
    };
    how.onclick = () => { hb.hidden = false; hb.innerHTML = `<b>Look closely: none of the original six cards is here.</b> Every single card changed. The first six were K♠ Q♥ J♣ K♦ Q♠ J♥. The second five are K♣ Q♦ J♠ K♥ Q♣. You only memorised <em>your</em> card, so you only noticed it was missing, and your brain filled in “the others are the same”.<br><br>Magicians call this kind of trick a “princess” card trick, and it works because attention is narrow. It’s the same blind spot that makes eyewitnesses unreliable and lets pickpockets work. Jane’s whole career runs on it.`; how.hidden = true; };
    reset();
  })();

  /* ═════════ J. SORTER ═════════ */
  (() => {
    const S = [
      ['Remembering the café waiter’s name from last week and using it when you order.', 'charm', 'Specific, warm and costs nothing. This is Jane at his best.'],
      ['Announcing to a new colleague, in front of the team, that you can tell they’ve recently split up.', 'much', 'The observation might be right, but the delivery is cruel. Private things stay private.'],
      ['Doing a “psychic reading” at a party and letting people go home believing it was real.', 'con', 'Fun as a trick if you reveal it at the end. Letting people believe it is exactly how the old Jane made his money.'],
      ['Showing a coin trick to a bored kid in a hospital waiting room, after a nod from the parent.', 'charm', 'Pure delight, with consent. This is what tricks are for.'],
      ['Noticing a friend seems off at dinner and quietly asking later if they’re okay.', 'charm', 'Observation used for care. The best use of the eye.'],
      ['Pranking your manager in front of her own boss to get a laugh.', 'much', 'Jane does this to Lisbon constantly. You get the laugh and she gets the consequences.'],
      ['Mirroring someone’s body language and flattering them to talk them into a deal.', 'con', 'Using rapport techniques as a lever on someone is manipulation, however smoothly it’s done.'],
      ['Making tea for someone who’s had a bad day, without being asked.', 'charm', 'The most Jane thing on this list, and the most quietly powerful.'],
      ['Bringing up something you know someone is insecure about to win an argument.', 'con', 'Reading people is a power. Using it to wound is the line Jane sometimes crosses and you never should.'],
    ];
    const L = { charm: 'Charming', much: 'Too much', con: 'A con' };
    const list = $('#soList'), sc = $('#soScore'); let done = 0, right = 0;
    shuffle(S).forEach(([t, v, why]) => {
      const c = el('div', 'so', `<p>${t}</p>`), bs = el('div', 'sb');
      Object.keys(L).forEach((k) => { const b = el('button', '', L[k]); b.type = 'button'; b.onclick = () => {
        $$('button', bs).forEach((x) => x.disabled = true); done++; if (k === v) { right++; b.classList.add('right'); } else { b.classList.add('wrong'); bs.children[Object.keys(L).indexOf(v)].classList.add('right'); }
        c.append(el('p', 'why', why));
        sc.textContent = done === S.length ? `${right} of ${S.length} matched. ${right >= 8 ? 'Your instincts are excellent: all of Jane’s charm and none of his bad habits.' : right >= 6 ? 'Good instincts, with a little Jane-style mischief left in you.' : 'Worth a second think. The line between charm and manipulation is mostly about consent and who benefits.'}` : `${done} of ${S.length} sorted.`;
      }; bs.append(b); });
      c.append(bs); list.append(c);
    });
  })();

  /* ═════════ JANE CODE ═════════ */
  flipCards($('#code'), [
    ['Curious, not clever', 'i', 'The point of noticing is to understand someone, not to score points off them.'],
    ['Calm is contagious', 'ii', 'Whoever stays unhurried sets the temperature of the room. Be the slowest person in a crisis.'],
    ['Ask the second question', 'iii', 'The first question is manners. The follow-up is interest, and interest is what people remember.'],
    ['Notice privately, praise publicly', 'iv', 'Keep the sensitive observations to yourself. Say the kind ones out loud, in front of others.'],
    ['Know the con', 'v', 'Learn how manipulation works so it can’t work on you, and so you can spot it working on others.'],
    ['Play, don’t perform', 'vi', 'Humour that includes people builds warmth. Humour at their expense builds an audience and nothing else.'],
    ['Rest is part of the work', 'vii', 'The couch isn’t laziness. Stepping away is how stuck problems get unstuck.'],
    ['Keep a Lisbon', 'viii', 'Find someone who likes you enough to tell you no, and listen when they do.'],
  ], 'code');

  /* ═════════ K. ACADEMY ═════════ */
  (() => {
    const D = [
      ['Three details', 'Notice three specific things about everyone you talk to today.'],
      ['Shoe day', 'Look at people’s shoes. Privately guess one fact per pair.'],
      ['The perfect cup', 'Brew tea properly, timer and all, and think while it steeps.'],
      ['Names', 'Use every new person’s name twice in conversation.'],
      ['The French drop', 'Learn the coin vanish. Ten minutes in front of a mirror.'],
      ['Room recall', 'Leave a room and write down ten things that were in it.'],
      ['Couch break', 'Stuck on something? Lie down for fifteen minutes, then go back to it.'],
      ['Follow-ups', 'Ask at least one follow-up question in every conversation.'],
      ['Barnum hunt', 'Find three Barnum statements in a horoscope, ad or “personality quiz”.'],
      ['Coin roll', 'Start walking a coin across your knuckles. Expect to drop it a lot.'],
      ['Baseline', 'Watch a friend tell a true story: their pace, detail and gestures.'],
      ['Slow down', 'Walk, talk and eat 20% slower all day. Notice how people respond.'],
      ['Dress the part', 'Wear your best-fitting outfit, or try a waistcoat without a tie.'],
      ['Twelve seconds', 'Glance at a table or shelf for twelve seconds, look away, and list it.'],
      ['Memory palace', 'Store a ten-item list along a walk through your home.'],
      ['Specific praise', 'Give three compliments that couldn’t apply to anyone else.'],
      ['Self-working trick', 'Learn the 21-card trick and perform it once.'],
      ['Reverse recall', 'Replay yesterday backwards, hour by hour, before you sleep.'],
      ['Kind notice', 'Spot someone struggling and help without being asked.'],
      ['Phone away', 'One whole meal with company, phone in another room.'],
      ['The 1-to-10 force', 'Ask five friends for a number from 1 to 10. Count the sevens.'],
      ['Listen for gaps', 'In one conversation, notice what the person doesn’t say.'],
      ['Perform', 'Show your coin trick to someone. Make it about their delight, not your skill.'],
      ['Scam school', 'Read up on one current scam (fake KYC, courier, “digital arrest”) and how it hooks people.'],
      ['Tea for two', 'Make tea for someone, unasked.'],
      ['The nap', 'Take a twenty-minute nap and note how sharp you feel afterwards.'],
      ['Play', 'Turn one boring chore into a game with someone.'],
      ['Own it', 'Admit one small mistake cleanly, with no excuses.'],
      ['The Lisbon call', 'Ask a trusted friend for one honest criticism. Just listen.'],
      ['Case file', 'Write a one-page dossier on what you’ve learned this month.'],
    ];
    const KEY = 'lrn-jane-30', ol = $('#ac'); let st = store.get(KEY, []);
    const RANK = [[30, 'Patrick Jane (minus the con)'], [25, 'Mentalist'], [20, 'Consultant'], [15, 'Senior agent'], [10, 'Junior agent'], [5, 'Rookie'], [0, 'Civilian']];
    const upd = () => { const n = st.length; $('#acN').textContent = n; $('#acBar').style.width = n / 30 * 100 + '%'; $('#acRank').textContent = 'Rank: ' + RANK.find((r) => n >= r[0])[1]; };
    D.forEach(([t, d], i) => {
      const li = el('li'), id = 'ac' + i, cb = el('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = st.includes(i);
      cb.onchange = () => { st = cb.checked ? [...new Set([...st, i])] : st.filter((x) => x !== i); store.set(KEY, st); upd(); };
      const lab = el('label', '', `<span><b>${t}</b>${d}</span>`); lab.htmlFor = id;
      li.append(cb, lab); ol.append(li);
    });
    $('#acReset').onclick = () => { st = []; store.set(KEY, st); $$('input', ol).forEach((c) => c.checked = false); upd(); };
    upd();
  })();

  /* reveal last so dynamic .rv nodes are included */
  $$('.rv').forEach((n) => reveal(n));
  void bindTip;
})();

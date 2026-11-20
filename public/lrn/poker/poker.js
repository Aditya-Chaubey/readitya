/* lrn — All In. Cards, evaluator, simulations and the cat are all computed here. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (n) => Math.floor(Math.random() * n);
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  /* ───────── shared helpers ───────── */
  function syncFill(i) { i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'); }
  $$('input[type=range]').forEach((i) => { syncFill(i); i.addEventListener('input', () => syncFill(i)); });
  function seg(sel, attr, cb) {
    const b = $$(sel);
    b.forEach((x) => x.addEventListener('click', () => { b.forEach((y) => y.setAttribute('aria-pressed', String(y === x))); cb(x.dataset[attr]); }));
  }
  const bar = $('#progress');
  addEventListener('scroll', () => {
    const m = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`;
  }, { passive: true });
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const reveal = (els) => els.forEach((e) => { e.classList.add('reveal'); rio.observe(e); });
  reveal($$('.fig, .act, .tell, .manners > div'));
  $$('.ch-head').forEach((e) => rio.observe(e));

  /* ───────── cards ───────── */
  const SUITS = ['s', 'h', 'd', 'c'], SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const RCH = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10' };
  const rch = (r) => RCH[r] || String(r);
  const parse = (str) => str.split(' ').map((t) => ({ r: { A: 14, K: 13, Q: 12, J: 11, T: 10 }[t[0]] || +t[0], s: t[1] }));
  const fullDeck = () => { const d = []; for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s }); return d; };
  const key = (c) => c.r + c.s;
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const NAME1 = { 14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten', 9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five', 4: 'Four', 3: 'Three', 2: 'Two' };
  const PLUR = (r) => (r === 6 ? 'Sixes' : NAME1[r] + 's');
  const SUITN = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };
  function cardEl(c, o = {}) {
    const el = document.createElement('div');
    const red = c && (c.s === 'h' || c.s === 'd');
    el.className = `pc${red ? ' r' : ''}${o.down ? ' down' : ''}${o.cls ? ' ' + o.cls : ''}`;
    if (c) { el.dataset.k = key(c); el.setAttribute('aria-label', `${NAME1[c.r]} of ${SUITN[c.s]}`); }
    const court = c && c.r >= 11 && c.r <= 13;
    el.innerHTML = `<div class="in"><div class="face">${c ? `<span class="cr tl">${rch(c.r)}<i>${SYM[c.s]}</i></span><span class="big${court ? ' court' : ''}">${court ? rch(c.r) : SYM[c.s]}</span><span class="cr br">${rch(c.r)}<i>${SYM[c.s]}</i></span>` : ''}</div><div class="back"></div></div>`;
    if (o.title !== false && c) el.title = `${NAME1[c.r]} of ${SUITN[c.s]}`;
    return el;
  }
  const flip = (el, up) => el.classList.toggle('down', !up);

  /* ───────── evaluator ───────── */
  const CATS = ['High card', 'One pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
  function eval5(cs) {
    const rs = cs.map((c) => c.r).sort((a, b) => b - a);
    const flush = cs.every((c) => c.s === cs[0].s);
    const uniq = [...new Set(rs)];
    let straight = 0;
    if (uniq.length === 5) {
      if (rs[0] - rs[4] === 4) straight = rs[0];
      else if (rs[0] === 14 && rs[1] === 5) straight = 5;
    }
    const cnt = {};
    rs.forEach((r) => (cnt[r] = (cnt[r] || 0) + 1));
    const groups = Object.entries(cnt).map(([r, n]) => [+r, n]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    let cat, tb;
    if (straight && flush) { cat = 8; tb = [straight]; }
    else if (groups[0][1] === 4) { cat = 7; tb = [groups[0][0], groups[1][0]]; }
    else if (groups[0][1] === 3 && groups[1][1] === 2) { cat = 6; tb = [groups[0][0], groups[1][0]]; }
    else if (flush) { cat = 5; tb = rs; }
    else if (straight) { cat = 4; tb = [straight]; }
    else if (groups[0][1] === 3) { cat = 3; tb = groups.map((g) => g[0]); }
    else if (groups[0][1] === 2 && groups[1][1] === 2) { cat = 2; tb = groups.map((g) => g[0]); }
    else if (groups[0][1] === 2) { cat = 1; tb = groups.map((g) => g[0]); }
    else { cat = 0; tb = rs; }
    let score = cat;
    for (let i = 0; i < 5; i++) score = score * 15 + (tb[i] || 0);
    return { score, cat, tb };
  }
  const COMBOS = [];
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) COMBOS.push([a, b]);
  function best(cards) {
    if (cards.length <= 5) return { ...eval5(cards), cards };
    let top = null;
    const n = cards.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      const five = cards.filter((_, i) => i !== a && i !== b);
      if (five.length !== 5) continue;
      const e = eval5(five);
      if (!top || e.score > top.score) top = { ...e, cards: five };
    }
    if (n === 6) { for (let a = 0; a < 6; a++) { const five = cards.filter((_, i) => i !== a); const e = eval5(five); if (!top || e.score > top.score) top = { ...e, cards: five }; } }
    return top;
  }
  function scoreOnly(cards) { // fast path for simulations (7 cards)
    let s = 0;
    for (const [a, b] of COMBOS) { const f = []; for (let i = 0; i < 7; i++) if (i !== a && i !== b) f.push(cards[i]); const v = eval5(f).score; if (v > s) s = v; }
    return s;
  }
  function describe(e) {
    const t = e.tb;
    switch (e.cat) {
      case 8: return t[0] === 14 ? 'Royal flush' : `Straight flush, ${NAME1[t[0]].toLowerCase()}-high`;
      case 7: return `Four ${PLUR(t[0]).toLowerCase()}`;
      case 6: return `Full house, ${PLUR(t[0]).toLowerCase()} full of ${PLUR(t[1]).toLowerCase()}`;
      case 5: return `Flush, ${NAME1[t[0]].toLowerCase()}-high`;
      case 4: return `Straight, ${NAME1[t[0]].toLowerCase()}-high`;
      case 3: return `Three ${PLUR(t[0]).toLowerCase()}`;
      case 2: return `Two pair, ${PLUR(t[0]).toLowerCase()} and ${PLUR(t[1]).toLowerCase()}`;
      case 1: return `Pair of ${PLUR(t[0]).toLowerCase()}`;
      default: return `${NAME1[t[0]]}-high`;
    }
  }
  function equity(a, b, board, n = 2000) {
    const known = new Set([...a, ...(b || []), ...board].map(key));
    const rest = fullDeck().filter((c) => !known.has(key(c)));
    let win = 0, tie = 0;
    const need = 5 - board.length + (b ? 0 : 2);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < need; k++) { const j = k + rnd(rest.length - k); [rest[k], rest[j]] = [rest[j], rest[k]]; }
      let p = 0;
      const opp = b || [rest[p++], rest[p++]];
      const bd = board.slice(); while (bd.length < 5) bd.push(rest[p++]);
      const sa = scoreOnly([...a, ...bd]), sb = scoreOnly([...opp, ...bd]);
      if (sa > sb) win++; else if (sa === sb) tie++;
    }
    return { win: win / n, tie: tie / n, lose: 1 - (win + tie) / n };
  }

  /* ═════════ HERO ═════════ */
  (function hero() {
    const fan = $('#hero-fan');
    const cards = parse('Ts Js Qs Ks As');
    cards.forEach((c, i) => {
      const el = cardEl(c, { down: true, title: false });
      el.style.transform = `translate(${(i - 2) * 30}px, 300px) rotate(${(i - 2) * 40}deg)`;
      el.style.opacity = '0';
      fan.appendChild(el);
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = `rotate(${(i - 2) * 11}deg) translateY(${Math.abs(i - 2) * 6}px)`; }, 200 + i * 120);
      setTimeout(() => flip(el, true), 900 + i * 110);
    });
    fan.addEventListener('mouseenter', () => $$('.pc', fan).forEach((el, i) => (el.style.transform = `rotate(${(i - 2) * 16}deg) translateY(${Math.abs(i - 2) * 9 - 10}px)`)));
    fan.addEventListener('mouseleave', () => $$('.pc', fan).forEach((el, i) => (el.style.transform = `rotate(${(i - 2) * 11}deg) translateY(${Math.abs(i - 2) * 6}px)`)));
    const fl = $('#chips-float');
    const cols = ['#d33a2c', '#2e5bd6', '#222', '#f0b93a', '#2e9c62'];
    for (let i = 0; i < 14; i++) {
      const c = document.createElement('i');
      c.className = 'fchip';
      const s = 26 + rnd(40);
      c.style.cssText = `--s:${s}px;--c:${cols[i % 5]};--d:${5 + rnd(5)}s;left:${(i * 37 + rnd(10)) % 100}%;top:${(i * 53 + rnd(10)) % 100}%;animation-delay:-${rnd(5)}s;filter:blur(${s < 40 ? 1.5 : 0}px)`;
      fl.appendChild(c);
    }
  })();

  /* ═════════ CH1: DECK ═════════ */
  (function deck() {
    const grid = $('#deck-grid'), fact = $('#deck-fact');
    const d = fullDeck();
    d.forEach((c) => grid.appendChild(cardEl(c)));
    let n = 0;
    $('#deck-shuffle').addEventListener('click', () => {
      const els = $$('.pc', grid);
      const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
      shuffle(els).forEach((e) => grid.appendChild(e));
      els.forEach((e) => {
        const a = first.get(e), b = e.getBoundingClientRect();
        e.style.transition = 'none';
        e.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) rotate(${rnd(40) - 20}deg)`;
      });
      requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((e, i) => { e.style.transition = `transform .7s cubic-bezier(.2,.8,.2,1) ${i * 6}ms`; e.style.transform = ''; })));
      n++;
      fact.innerHTML = n === 1 ? `That exact order has almost certainly <b>never existed before</b>.` : `Shuffle #${n}. Odds of repeating any earlier shuffle: about <b>1 in 8×10<sup>67</sup></b>.`;
    });
  })();

  /* ═════════ CH2: LADDER ═════════ */
  (function ladder() {
    const L = [
      ['High card', 'K♠ J♦ 8♣ 5♥ 2♠', 'Kd Jd 8c 5h 2s', 1302540, 'Nothing matches. Your hand is named after its highest card, here "king-high". It wins more often than you’d think when everyone else missed too.', 'Ks Jd 8c 5h 2s'],
      ['One pair', 'two cards of the same rank', '', 1098240, 'Two cards of the same rank. The most common made hand. A pair of Aces is a great start; a pair of 2s often isn’t enough.', 'Qh Qs 9c 6d 3s'],
      ['Two pair', 'two different pairs', '', 123552, 'Two pairs plus one other card. Compare the higher pair first, then the lower pair, then the leftover card.', 'Jc Jd 5h 5s Ac'],
      ['Three of a kind', 'three cards of one rank', '', 54912, 'Also called "trips", or a "set" when you hold a pair and one more lands on the board.', '7s 7h 7d Kc 2d'],
      ['Straight', 'five in a row, mixed suits', '', 10200, 'Five consecutive ranks in any suits. Ace can be high (10-J-Q-K-A) or low (A-2-3-4-5), but never in the middle.', '5d 6s 7c 8h 9s'],
      ['Flush', 'five of the same suit', '', 5108, 'Any five cards of one suit, not in sequence. Compare highest cards to break ties.', 'Ah Jh 8h 4h 2h'],
      ['Full house', 'three of a kind + a pair', '', 3744, 'Trips plus a pair, called by the trips first: "Queens full of sevens". A monster hand.', 'Qd Qs Qc 7h 7s'],
      ['Four of a kind', 'all four of one rank', '', 624, '"Quads." You will remember the first time you get them.', '9s 9h 9d 9c Kh'],
      ['Straight flush', 'five in a row, same suit', '', 36, 'A straight and a flush at once. Some players go years without making one.', '5c 6c 7c 8c 9c'],
      ['Royal flush', 'A-K-Q-J-10, one suit', '', 4, 'The best possible hand: an ace-high straight flush. There are only four, one per suit.', 'Ts Js Qs Ks As'],
    ];
    const list = $('#ladder-list'), cardsEl = $('#ladder-cards'), info = $('#ladder-info');
    const TOT = 2598960;
    L.forEach(([n], i) => {
      const li = document.createElement('li');
      const w = Math.max(2, (Math.log10(L[i][3]) / Math.log10(TOT)) * 100);
      li.innerHTML = `<button type="button" aria-pressed="false"><span class="ln">${String(i + 1).padStart(2, '0')}</span><span class="lname">${n}</span><span class="lbar"><i style="width:${w}%"></i></span></button>`;
      li.firstChild.addEventListener('click', () => show(i));
      list.appendChild(li);
    });
    function oneIn(c) { const x = TOT / c; return x < 10 ? x.toFixed(1) : Math.round(x).toLocaleString('en-US'); }
    function show(i) {
      $$('button', list).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      const [n, , , c, t, hand] = L[i];
      cardsEl.innerHTML = '';
      parse(hand).forEach((cd, k) => {
        const el = cardEl(cd, { down: true });
        el.style.animation = `deal .5s cubic-bezier(.34,1.56,.64,1) ${k * 0.07}s both`;
        cardsEl.appendChild(el);
        setTimeout(() => flip(el, true), 250 + k * 90);
      });
      const p = c / TOT * 100;
      info.innerHTML = `<h4>${n}</h4><p class="odds">${c.toLocaleString('en-US')} ways · 1 in ${oneIn(c)} · ${p < 0.01 ? p.toFixed(5) : p < 1 ? p.toFixed(3) : p.toFixed(1)}%</p><p>${t}</p>`;
    }
    show(9);
  })();

  /* ═════════ CH2: QUIZ ═════════ */
  (function quiz() {
    let streak = 0, bestS = 0, ans = null, locked = false;
    const A = $('#quiz-a'), B = $('#quiz-b'), msg = $('#quiz-msg'), sc = $('#quiz-score');
    function makeHand(d) {
      // bias toward interesting hands: sometimes build a made hand
      return d.splice(0, 5);
    }
    function round() {
      locked = false;
      let a, b, ea, eb, tries = 0;
      do {
        const d = shuffle(fullDeck());
        a = makeHand(d); b = makeHand(d);
        ea = eval5(a); eb = eval5(b);
        tries++;
      } while (tries < 30 && (ea.cat === 0 && eb.cat === 0 || (Math.random() < 0.6 && ea.cat !== eb.cat && Math.abs(ea.cat - eb.cat) > 2)));
      ans = ea.score > eb.score ? 'a' : ea.score < eb.score ? 'b' : 'tie';
      [[A, a, ea], [B, b, eb]].forEach(([el, h], idx) => {
        el.classList.remove('win');
        const box = $('.qh-cards', el); box.innerHTML = '';
        h.sort((x, y) => y.r - x.r).forEach((c, k) => { const ce = cardEl(c, { down: true }); box.appendChild(ce); setTimeout(() => flip(ce, true), 80 * k + idx * 200); });
        $('.qh-name', el).textContent = '';
      });
      A._e = ea; B._e = eb;
      msg.textContent = '';
    }
    $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      if (locked) return;
      locked = true;
      const ok = b.dataset.pick === ans;
      $('.qh-name', A).textContent = describe(A._e);
      $('.qh-name', B).textContent = describe(B._e);
      if (ans === 'a') A.classList.add('win'); else if (ans === 'b') B.classList.add('win'); else { A.classList.add('win'); B.classList.add('win'); }
      streak = ok ? streak + 1 : 0; bestS = Math.max(bestS, streak);
      sc.innerHTML = `Streak <b>${streak}</b> · Best <b>${bestS}</b>`;
      msg.textContent = ok ? ['Nice read.', 'Correct!', 'You’re a natural.', 'Ship it.'][rnd(4)] : `Not quite — ${ans === 'tie' ? 'it’s a split pot' : `Hand ${ans.toUpperCase()} wins`}.`;
      setTimeout(round, 2000);
    }));
    round();
  })();

  /* ═════════ CH3: THE TABLE (scrolly) ═════════ */
  (function table() {
    const T = $('#table');
    const SEATS = [[50, 91], [13, 73], [13, 25], [50, 8], [87, 25], [87, 73]];
    const NAMES = ['You', 'Ana', 'Bo', 'Cy', 'Dee', 'Eli'];
    const COLS = ['#f8f1e1', '#f2a65a', '#8fd1b4', '#c9a3e8', '#f3d34a', '#ff9e8a'];
    const HOLES = ['As Qs', 'Kd 3c', '7c 2d', 'Jc Tc', '9d 4s', '8h 8c'].map(parse);
    const BOARD = parse('Qd 9s 4s 2h Ks');
    const C = [50, 50];
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const DECK = [39, 32], BURN = [61, 32], MUCK = [50, 46];
    const BOARDP = [30, 40, 50, 60, 70].map((x) => [x, 49]);
    const el = (cls, html) => { const e = document.createElement('div'); e.className = 't-el ' + cls; e.innerHTML = html || ''; T.appendChild(e); return e; };
    const place = (e, p, rot = 0, extra = '') => { e.style.left = p[0] + '%'; e.style.top = p[1] + '%'; e.style.transform = `translate(-50%, -50%) rotate(${rot}deg) ${extra}`; };
    // deck stack
    for (let i = 0; i < 4; i++) { const d = el('t-card'); d.appendChild(cardEl(null, { down: true })); place(d, [DECK[0] + i * 0.15, DECK[1] - i * 0.25]); d.style.zIndex = 1; }
    const seats = SEATS.map((p, i) => {
      const s = el('t-seat', `<div class="av" style="--c:${COLS[i]}">${NAMES[i][0]}</div><p class="nm">${NAMES[i]}</p><p class="stk">200</p><span class="tag"></span>`);
      place(s, p); return s;
    });
    const holeEls = HOLES.map((h, i) => h.map((c, k) => { const e = el('t-card'); e.appendChild(cardEl(c, { down: true })); e.style.zIndex = 2; place(e, DECK); e.style.opacity = '0'; return e; }));
    const boardEls = BOARD.map((c) => { const e = el('t-card'); e.appendChild(cardEl(c, { down: true })); e.style.zIndex = 2; place(e, DECK); e.style.opacity = '0'; return e; });
    const burnEls = [0, 1, 2].map(() => { const e = el('t-card'); e.appendChild(cardEl(null, { down: true })); e.style.zIndex = 1; place(e, DECK); e.style.opacity = '0'; return e; });
    const btn = el('t-btn', 'D');
    const bets = SEATS.map((p) => { const b = el('t-bet', '<span class="chipico"></span><span class="amt"></span>'); place(b, lerp(p, C, 0.42)); b.style.opacity = '0'; return b; });
    const pot = el('t-pot', '<div class="stack"><span class="chipico"></span><span class="chipico" style="--c:#2e5bd6"></span><span class="chipico" style="--c:#222"></span></div><span class="pt"></span>');
    place(pot, [50, 64]); pot.style.opacity = '0';
    const label = el('t-label', '');
    place(label, [50, 33]); label.style.opacity = '0';

    const S = (o) => o;
    const ST = [
      S({ stacks: [200, 200, 200, 200, 200, 200] }),
      S({ stacks: [200, 200, 200, 200, 200, 200], act: [5] }),
      S({ stacks: [199, 198, 200, 200, 200, 200], bets: { 0: 1, 1: 2 }, tags: { 0: 'Small blind', 1: 'Big blind' }, act: [0, 1] }),
      S({ stacks: [199, 198, 200, 200, 200, 200], bets: { 0: 1, 1: 2 }, dealt: 1, label: 'Hole cards' }),
      S({ stacks: [194, 198, 200, 194, 200, 194], bets: { 0: 6, 1: 2, 3: 6, 5: 6 }, dealt: 1, folded: [1, 2, 4], tags: { 2: 'Fold', 3: 'Call', 4: 'Fold', 5: 'Raise 6', 0: 'Call', 1: 'Fold' }, act: [5], label: 'Pre-flop' }),
      S({ stacks: [194, 198, 200, 194, 200, 194], pot: 20, dealt: 1, folded: [1, 2, 4], board: 3, burn: 1, label: 'The flop' }),
      S({ stacks: [184, 198, 200, 184, 200, 184], pot: 20, bets: { 0: 10, 3: 10, 5: 10 }, dealt: 1, folded: [1, 2, 4], board: 3, burn: 1, tags: { 0: 'Check · Call', 3: 'Check · Call', 5: 'Bet 10' }, act: [5] }),
      S({ stacks: [164, 198, 200, 184, 200, 164], pot: 50, bets: { 0: 20, 5: 20 }, dealt: 1, folded: [1, 2, 4, 3], board: 4, burn: 2, tags: { 0: 'Call', 3: 'Fold', 5: 'Bet 20' }, act: [5], label: 'The turn' }),
      S({ stacks: [124, 198, 200, 184, 200, 124], pot: 90, bets: { 0: 40, 5: 40 }, dealt: 1, folded: [1, 2, 4, 3], board: 5, burn: 3, tags: { 0: 'Bet 40', 5: 'Call' }, act: [0], label: 'The river' }),
      S({ stacks: [124, 198, 200, 184, 200, 124], pot: 170, dealt: 1, folded: [1, 2, 4, 3], board: 5, burn: 3, show: [5], tags: { 0: 'Flush!', 5: 'Pair of 8s' }, hl: true, act: [0, 5], label: 'Showdown' }),
      S({ stacks: [294, 198, 200, 184, 200, 124], pot: 170, potTo: 0, dealt: 1, folded: [1, 2, 4, 3], board: 5, burn: 3, show: [5], tags: { 0: '+170' }, hl: true, win: 0, button: 0 }),
    ];
    let cur = -1;
    const HL = new Set(['As', 'Qs', '9s', '4s', 'Ks'].map((x) => { const c = parse(x)[0]; return key(c); }));
    function render(s) {
      const st = ST[s], prev = cur;
      cur = s;
      const folded = new Set(st.folded || []), show = new Set(st.show || []), act = new Set(st.act || []);
      seats.forEach((e, i) => {
        e.classList.toggle('out', folded.has(i));
        e.classList.toggle('turn', act.has(i));
        e.classList.toggle('win', st.win === i);
        $('.stk', e).textContent = st.stacks[i];
        const tg = $('.tag', e), t = st.tags && st.tags[i];
        tg.textContent = t || ''; tg.classList.toggle('on', !!t);
      });
      const bs = st.button ?? 5;
      place(btn, lerp(SEATS[bs], C, 0.25), 0, `translate(${bs === 0 ? 70 : 0}%, ${bs === 0 ? -40 : 0}%)`);
      // hole cards
      holeEls.forEach((pair, i) => pair.forEach((e, k) => {
        const dealing = st.dealt && prev < 3;
        e.style.transitionDelay = dealing ? `${(k * 6 + i) * 0.07}s` : '0s';
        const pc = e.firstChild;
        if (!st.dealt) { place(e, DECK); e.style.opacity = '0'; flip(pc, false); return; }
        if (folded.has(i)) { place(e, MUCK, 90 + k * 20, 'scale(.6)'); e.style.opacity = '0'; flip(pc, false); return; }
        const base = lerp(SEATS[i], C, i === 0 ? 0.36 : 0.3);
        place(e, [base[0] + (k ? 3.4 : -3.4), base[1]], k ? 6 : -6);
        e.style.opacity = '1';
        flip(pc, i === 0 || show.has(i));
        pc.classList.toggle('hl', !!st.hl && i === 0 && HL.has(pc.dataset.k));
        pc.classList.toggle('dim', !!st.hl && i !== 0);
      }));
      boardEls.forEach((e, i) => {
        const pc = e.firstChild;
        const on = i < (st.board || 0);
        const newly = on && i >= (ST[Math.max(0, prev)]?.board || 0);
        e.style.transitionDelay = newly ? `${(i - (ST[Math.max(0, prev)]?.board || 0)) * 0.12 + 0.2}s` : '0s';
        if (on) { place(e, BOARDP[i]); e.style.opacity = '1'; setTimeout(() => flip(pc, true), newly ? 500 + i * 120 : 0); }
        else { place(e, DECK); e.style.opacity = '0'; flip(pc, false); }
        pc.classList.toggle('hl', !!st.hl && HL.has(pc.dataset.k));
        pc.classList.toggle('dim', !!st.hl && !HL.has(pc.dataset.k));
      });
      burnEls.forEach((e, i) => { const on = i < (st.burn || 0); place(e, on ? [BURN[0] + i * 1.2, BURN[1]] : DECK, on ? 12 + i * 8 : 0); e.style.opacity = on ? '1' : '0'; });
      // bets
      bets.forEach((b, i) => {
        const amt = st.bets && st.bets[i];
        if (amt) { place(b, lerp(SEATS[i], C, 0.58)); b.style.opacity = '1'; $('.amt', b).textContent = amt; }
        else { place(b, [50, 64]); b.style.opacity = '0'; }
      });
      if (st.pot) {
        pot.style.opacity = '1';
        $('.pt', pot).textContent = st.potTo === 0 ? 'Shipped to you!' : `Pot ${st.pot}`;
        place(pot, st.potTo === 0 ? lerp(SEATS[0], C, 0.18) : [50, 64]);
      } else { pot.style.opacity = '0'; place(pot, [50, 64]); }
      if (st.label) { label.textContent = st.label; label.style.opacity = '1'; place(label, [50, 33], 0, 'scale(1)'); }
      else { label.style.opacity = '0'; place(label, [50, 33], 0, 'scale(.8)'); }
      $$('#hand-scrolly .step').forEach((e) => e.classList.toggle('active', +e.dataset.step === s));
    }
    render(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) render(+e.target.dataset.step); }), { rootMargin: matchMedia('(max-width: 1000px)').matches ? '-72% 0px -8% 0px' : '-45% 0px -45% 0px' });
    $$('#hand-scrolly .step').forEach((e) => io.observe(e));
  })();

  /* ═════════ CH4: ACTIONS (play on mobile, where there's no hover) ═════════ */
  if (!matchMedia('(hover: hover)').matches) {
    const aio = new IntersectionObserver((es) => es.forEach((e) => { e.target.classList.toggle('play', e.isIntersecting); }), { rootMargin: '-30% 0px -30% 0px' });
    $$('.act').forEach((a) => { aio.observe(a); a.addEventListener('click', () => { a.classList.remove('play'); void a.offsetWidth; a.classList.add('play'); }); });
  }

  /* ═════════ CH5: HAND READER ═════════ */
  (function reader() {
    const bEl = $('#rd-board'), hEl = $('#rd-hole'), out = $('#rd-out'), g = $('#rd-guess'), stk = $('#rd-streak');
    let mode = 'show', curE = null, streak = 0, answered = false;
    seg('[data-mode]', 'mode', (m) => { mode = m; deal(); });
    function deal() {
      answered = false;
      // nudge toward interesting results
      let d, hole, board, e, t = 0;
      do { d = shuffle(fullDeck()); hole = d.slice(0, 2); board = d.slice(2, 7); e = best([...hole, ...board]); t++; } while (t < 40 && e.cat < 1 + rnd(3));
      curE = e;
      bEl.innerHTML = ''; hEl.innerHTML = '';
      const bestK = new Set(e.cards.map(key));
      const all = [];
      board.forEach((c, i) => { const el = cardEl(c, { down: true }); el.style.animation = `deal .5s cubic-bezier(.34,1.56,.64,1) ${i * 0.06}s both`; bEl.appendChild(el); all.push(el); });
      hole.forEach((c, i) => { const el = cardEl(c, { down: true }); el.style.animation = `deal .5s cubic-bezier(.34,1.56,.64,1) ${0.35 + i * 0.06}s both`; hEl.appendChild(el); all.push(el); });
      all.forEach((el, i) => setTimeout(() => flip(el, true), 250 + i * 70));
      const usedHole = hole.filter((c) => bestK.has(key(c))).length;
      const reveal = () => {
        setTimeout(() => all.forEach((el) => { el.classList.toggle('hl', bestK.has(el.dataset.k)); el.classList.toggle('dim', !bestK.has(el.dataset.k)); }), 50);
        out.innerHTML = `<h4>${describe(e)}</h4><p>Using ${usedHole === 2 ? 'both your cards' : usedHole === 1 ? 'one of your cards' : 'none of your cards: you’re playing the board'} plus ${5 - usedHole} from the board.</p>`;
      };
      if (mode === 'show') { g.hidden = true; setTimeout(reveal, 1100); }
      else {
        out.innerHTML = '<p>What’s the best five-card hand here?</p>';
        g.hidden = false;
        g.innerHTML = CATS.slice(0, 8).map((n, i) => `<button type="button" data-c="${i}">${n}</button>`).join('') + '<button type="button" data-c="8">Straight flush</button>';
        $$('button', g).forEach((b) => b.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const ok = +b.dataset.c === e.cat;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) $(`[data-c="${e.cat}"]`, g).classList.add('right');
          streak = ok ? streak + 1 : 0;
          stk.textContent = streak ? `🔥 ${streak} in a row` : '';
          reveal();
        }));
      }
    }
    $('#rd-deal').addEventListener('click', deal);
    deal();
  })();

  /* ═════════ CH6: OUTS ═════════ */
  (function outs() {
    const s = $('#outs-slider'), deck = $('#outs-deck');
    let street = 'flop';
    for (let i = 0; i < 47; i++) deck.appendChild(document.createElement('i'));
    const P = [['Gutshot straight', 4], ['Pair → trips', 2], ['Two overcards', 6], ['Open-ended straight', 8], ['Flush draw', 9], ['Flush + gutshot', 12], ['Flush + open-ended', 15]];
    $('#outs-presets').innerHTML = P.map(([n, o]) => `<button type="button" data-o="${o}">${n} · ${o}</button>`).join('');
    $$('#outs-presets button').forEach((b) => b.addEventListener('click', () => { s.value = b.dataset.o; syncFill(s); draw(); }));
    seg('[data-street]', 'street', (v) => { street = v; draw(); });
    function draw() {
      const o = +s.value;
      $('#outs-n').textContent = o;
      const unseen = street === 'flop' ? 47 : 46;
      const exact = street === 'flop' ? 1 - ((unseen - o) * (unseen - o - 1)) / (unseen * (unseen - 1)) : o / unseen;
      const rule = o * (street === 'flop' ? 4 : 2);
      $('#outs-exact').textContent = (exact * 100).toFixed(1) + '%';
      const diff = Math.abs(rule - exact * 100);
      $('#outs-rule').innerHTML = `Rule of ${street === 'flop' ? 4 : 2} says <b>${rule}%</b>${diff < 3 ? ' — close enough.' : diff < 7 ? ' — a bit generous.' : ' — too generous with this many outs.'}`;
      $$('i', deck).forEach((c, i) => { c.classList.toggle('out', i < o); c.style.display = i < unseen ? '' : 'none'; c.style.transitionDelay = `${i * 8}ms`; });
    }
    s.addEventListener('input', draw); draw();
  })();

  /* ═════════ CH6: POT ODDS ═════════ */
  (function potodds() {
    const sp = $('#po-pot-s'), sc = $('#po-call-s'), se = $('#po-eq-s'), svg = $('#po-svg'), v = $('#po-verdict');
    function draw() {
      const pot = +sp.value, call = +sc.value, eq = +se.value / 100;
      $('#po-pot').textContent = pot; $('#po-call').textContent = call; $('#po-eq').textContent = Math.round(eq * 100) + '%';
      const need = call / (pot + call * 2);
      const winAmt = pot + call;
      const ev = eq * winAmt - (1 - eq) * call;
      // stacked bar: risk vs reward, plus need marker
      const W = 300, x0 = 10, w = 280;
      const needX = x0 + w * need, eqX = x0 + w * eq;
      svg.innerHTML = `
        <text x="10" y="18" font-family="Space Mono" font-size="10" fill="#4e4638">RISK ${call}  →  TO WIN ${winAmt}</text>
        <rect x="${x0}" y="28" width="${w}" height="26" rx="6" fill="#efe5cf"/>
        <rect x="${x0}" y="28" width="${w * call / (call + winAmt)}" height="26" rx="6" fill="#17140f"/>
        <text x="${x0 + 6}" y="45" font-family="Space Mono" font-size="10" fill="#f8f1e1">${call}</text>
        <text x="${x0 + w - 6}" y="45" font-family="Space Mono" font-size="10" fill="#17140f" text-anchor="end">${winAmt}</text>
        <text x="10" y="84" font-family="Space Mono" font-size="10" fill="#4e4638">CHANCE TO WIN</text>
        <rect x="${x0}" y="94" width="${w}" height="26" rx="6" fill="#efe5cf"/>
        <rect x="${x0}" y="94" width="${w * eq}" height="26" rx="6" fill="${eq >= need ? '#2e9c62' : '#d33a2c'}" style="transition:width .3s"/>
        <line x1="${needX}" y1="88" x2="${needX}" y2="126" stroke="#17140f" stroke-width="2" stroke-dasharray="3 2"/>
        <text x="${Math.min(W - 40, Math.max(40, needX))}" y="142" font-family="Space Mono" font-size="10" fill="#17140f" text-anchor="middle">need ${(need * 100).toFixed(0)}%</text>`;
      v.className = 'po-verdict ' + (eq >= need ? 'yes' : 'no');
      v.innerHTML = eq >= need ? `<b>Call.</b> You need ${(need * 100).toFixed(0)}% and you have ${Math.round(eq * 100)}%. On average this call earns about <b>+${ev.toFixed(1)}</b> chips.` : `<b>Fold.</b> You need ${(need * 100).toFixed(0)}% but only have ${Math.round(eq * 100)}%. Calling loses about <b>${ev.toFixed(1)}</b> chips on average.`;
      void eqX;
    }
    [sp, sc, se].forEach((x) => x.addEventListener('input', draw)); draw();
  })();

  /* ═════════ CH6: EQUITY ═════════ */
  (function eqcalc() {
    const sel = $('#eq-select');
    const M = [
      ['As Ah', 'Ks Kh', 'Aces vs Kings: the nightmare cooler. The underdog still wins about one time in five.'],
      ['Ac Kd', 'Qs Qh', 'Ace-King vs Queens: the classic "coin flip". Two big cards against a middle pair is close to 50/50.'],
      ['Ah Ks', '2c 2d', 'Even a tiny pair is a slight favorite over two big cards.'],
      ['7c 2d', 'As Ad', 'The worst hand vs the best. Hope is not a strategy, but it does happen.'],
      ['Jh Th', 'Ac Kd', 'Suited connectors vs Ace-King: closer than you’d guess, thanks to straights and flushes.'],
      ['Ks Qs', 'Ah Qd', '"Dominated": sharing a card with a better hand leaves you a big underdog.'],
      ['8h 8c', 'As Kd', 'Another coin flip: a mid pair against two overcards.'],
    ];
    sel.innerHTML = M.map(([a, b], i) => `<option value="${i}">${a.replace(/T/g, '10')} vs ${b.replace(/T/g, '10')}</option>`).join('');
    let job = 0;
    async function run() {
      const [a, b, note] = M[+sel.value], A = parse(a), B = parse(b);
      const my = ++job;
      [['#eq-a', A], ['#eq-b', B]].forEach(([id, h]) => {
        const box = $(id + ' .eq-cards'); box.innerHTML = '';
        h.forEach((c, k) => { const e = cardEl(c, { down: true }); box.appendChild(e); setTimeout(() => flip(e, true), 120 * k); });
      });
      $('#eq-note').textContent = note;
      let w = 0, t = 0, n = 0;
      for (let round = 0; round < 12; round++) {
        if (my !== job) return;
        const r = equity(A, B, [], 400);
        w += r.win * 400; t += r.tie * 400; n += 400;
        const pa = (w + t / 2) / n, pb = 1 - pa;
        $('#eq-a .eq-pct').textContent = (pa * 100).toFixed(1) + '%';
        $('#eq-b .eq-pct').textContent = (pb * 100).toFixed(1) + '%';
        $('#eq-a .eq-bar i').style.width = pa * 100 + '%';
        $('#eq-b .eq-bar i').style.width = pb * 100 + '%';
        $('#eq-tie').textContent = `${n.toLocaleString('en-US')} boards · ties ${(t / n * 100).toFixed(1)}%`;
        await sleep(40);
      }
    }
    sel.addEventListener('change', run);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(sel);
  })();

  /* ═════════ CH7: STARTING HAND CHART ═════════ */
  (function chart() {
    const grid = $('#grid169'), info = $('#chart-info');
    const R = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    function tier(a, b, suited) {
      if (a === b) return a >= 11 ? 1 : a >= 9 ? 2 : a >= 6 ? 3 : 4;
      const hi = Math.max(a, b), lo = Math.min(a, b), h = (x, y) => hi === x && lo === y;
      if (suited) {
        if (h(14, 13) || h(14, 12)) return 1;
        if (h(14, 11) || h(14, 10) || h(13, 12) || h(13, 11) || h(12, 11)) return 2;
        if (hi === 14 || h(13, 10) || h(12, 10) || h(11, 10) || h(10, 9)) return 3;
        if (h(13, 9) || h(12, 9) || h(11, 9) || h(9, 8) || h(8, 7) || h(7, 6) || h(6, 5)) return 4;
        return 0;
      }
      if (h(14, 13)) return 1;
      if (h(14, 12)) return 2;
      if (h(14, 11) || h(13, 12)) return 3;
      if (h(14, 10) || h(13, 11) || h(12, 11)) return 4;
      return 0;
    }
    const TX = ['Fold it. Really.', 'Premium: raise from any seat', 'Strong: raise from most seats', 'Playable from late position', 'Only near the button, carefully'];
    $('#chart-legend').innerHTML = [1, 2, 3, 4, 0].map((t) => `<div><i class="k${t}"></i>${TX[t]}<span>${countT(t)}</span></div>`).join('');
    function countT(t) { let n = 0; R.forEach((a, i) => R.forEach((b, j) => { if (tier(a, b, i < j) === t) n++; })); return n; }
    const nm = (r) => ({ 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T' }[r] || r);
    R.forEach((a, i) => R.forEach((b, j) => {
      const suited = i < j, pair = i === j;
      const hi = suited || pair ? a : b, lo = suited || pair ? b : a;
      const label = pair ? `${nm(a)}${nm(a)}` : `${nm(hi)}${nm(lo)}${suited ? 's' : 'o'}`;
      const t = tier(hi, lo, suited);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'k' + t; btn.textContent = label;
      btn.style.animationDelay = `${(i + j) * 22}ms`;
      const combos = pair ? 6 : suited ? 4 : 12;
      const show = () => { info.innerHTML = `<p class="ci-hand">${label.replace('T', '10')}</p><p><b>${pair ? 'Pocket pair' : suited ? 'Suited' : 'Offsuit'}</b> · ${combos} ways to be dealt (${(combos / 1326 * 100).toFixed(2)}%)<br>${TX[t]}.</p>`; };
      btn.addEventListener('mouseenter', show); btn.addEventListener('focus', show); btn.addEventListener('click', show);
      grid.appendChild(btn);
    }));
    // stagger the tiles in only when seen
    grid.style.visibility = 'hidden';
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { grid.style.visibility = ''; $$('button', grid).forEach((b) => (b.style.animationPlayState = 'running')); io.disconnect(); } });
    $$('button', grid).forEach((b) => (b.style.animationPlayState = 'paused'));
    io.observe(grid);
  })();

  /* ═════════ CH8: THE GAME ═════════ */
  (function game() {
    const ui = {
      you: $('#g-you-cards'), bot: $('#g-bot-cards'), board: $('#g-board'), pot: $('#g-pot'),
      ys: $('#g-you-stack'), bs: $('#g-bot-stack'), ctr: $('#g-controls'), log: $('#g-log'),
      say: $('#g-say'), hand: $('#g-hand'), odds: $('#g-odds'), youBtn: $('#g-you-btn'), botBtn: $('#g-bot-btn'),
      youSeat: $('.g-you'), botSeat: $('.g-bot'),
    };
    const G = { stacks: [100, 100], button: 1, deck: [], hole: [[], []], board: [], pot: 0, bet: [0, 0], street: 0, raises: 0, acted: [false, false], over: true, toAct: 0, hands: 0 };
    const STREET = ['Pre-flop', 'Flop', 'Turn', 'River'];
    const log = (h) => { const li = document.createElement('li'); li.innerHTML = h; ui.log.prepend(li); };
    const say = (t) => { ui.say.textContent = t; ui.say.classList.add('on'); clearTimeout(say._t); say._t = setTimeout(() => ui.say.classList.remove('on'), 1800); };
    const size = () => (G.street < 2 ? 2 : 4);
    function boardSlots() {
      ui.board.innerHTML = '';
      for (let i = 0; i < 5; i++) { const s = document.createElement('div'); s.className = 'slot'; ui.board.appendChild(s); }
    }
    function updateNums() {
      ui.ys.textContent = G.stacks[0]; ui.bs.textContent = G.stacks[1];
      ui.pot.textContent = G.pot; ui.pot.classList.add('bump'); setTimeout(() => ui.pot.classList.remove('bump'), 250);
      ui.youBtn.hidden = G.button !== 0; ui.botBtn.hidden = G.button !== 1;
      ui.youSeat.classList.toggle('turn', !G.over && G.toAct === 0);
      ui.botSeat.classList.toggle('turn', !G.over && G.toAct === 1);
      if (G.hole[0].length) {
        let txt = G.board.length >= 3 ? describe(best([...G.hole[0], ...G.board])) : (G.hole[0][0].r === G.hole[0][1].r ? `Pocket ${PLUR(G.hole[0][0].r).toLowerCase()}` : `${rch(Math.max(G.hole[0][0].r, G.hole[0][1].r))}-${rch(Math.min(G.hole[0][0].r, G.hole[0][1].r))}${G.hole[0][0].s === G.hole[0][1].s ? ' suited' : ''}`);
        if (ui.odds.checked && !G.over) { const q = equity(G.hole[0], null, G.board, 600); txt += ` · ${Math.round((q.win + q.tie / 2) * 100)}% to win`; }
        ui.hand.textContent = txt;
      } else ui.hand.textContent = '';
    }
    ui.odds.addEventListener('change', updateNums);
    function put(p, amt) {
      amt = Math.min(amt, G.stacks[p]);
      G.stacks[p] -= amt; G.bet[p] += amt; G.pot += amt;
      return amt;
    }
    async function dealTo(box, cards, up) {
      for (const c of cards) {
        const el = cardEl(c, { down: true, cls: 'deal' });
        box.appendChild(el);
        if (up) setTimeout(() => flip(el, true), 260);
        await sleep(180);
      }
    }
    async function newHand() {
      if (G.stacks[0] < 2 || G.stacks[1] < 2) {
        log(G.stacks[0] < 2 ? '<b>You’re out of chips.</b> Whiskers purrs. New game!' : '<b>You busted Whiskers!</b> New game!');
        G.stacks = [100, 100];
      }
      G.hands++;
      G.over = false; G.button = 1 - G.button; G.deck = shuffle(fullDeck()); G.board = []; G.pot = 0; G.bet = [0, 0]; G.street = 0; G.raises = 1; G.acted = [false, false];
      G.hole = [[G.deck.pop(), G.deck.pop()], [G.deck.pop(), G.deck.pop()]];
      ui.you.innerHTML = ''; ui.bot.innerHTML = ''; boardSlots(); ui.ctr.innerHTML = '';
      const sb = G.button, bb = 1 - G.button;
      put(sb, 1); put(bb, 2);
      log(`Hand ${G.hands}: ${sb === 0 ? 'you post the small blind, Whiskers the big' : 'Whiskers posts the small blind, you the big'}.`);
      updateNums();
      await dealTo(ui.you, [G.hole[0][0]], true); await dealTo(ui.bot, [G.hole[1][0]], false);
      await dealTo(ui.you, [G.hole[0][1]], true); await dealTo(ui.bot, [G.hole[1][1]], false);
      G.toAct = G.button; // heads-up: button acts first pre-flop
      next();
    }
    function options(p) {
      const toCall = Math.max(0, G.bet[1 - p] - G.bet[p]);
      const canRaise = G.raises < 4 && G.stacks[p] > toCall && G.stacks[1 - p] > 0;
      return { toCall, canRaise };
    }
    function next() {
      updateNums();
      if (G.over) return;
      if (G.toAct === 0) controls(); else { ui.ctr.innerHTML = '<p class="msg" style="font-size:1.1rem">Whiskers is thinking…</p>'; setTimeout(botMove, reduced ? 50 : 700 + rnd(600)); }
    }
    function controls() {
      const { toCall, canRaise } = options(0);
      const b = (label, cls, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn ' + cls; x.textContent = label; x.addEventListener('click', fn); ui.ctr.appendChild(x); };
      ui.ctr.innerHTML = '';
      if (toCall > 0) b('Fold', 'ghost', () => act(0, 'fold'));
      b(toCall > 0 ? `Call ${Math.min(toCall, G.stacks[0])}` : 'Check', '', () => act(0, toCall > 0 ? 'call' : 'check'));
      if (canRaise) b(toCall > 0 ? `Raise to ${G.bet[1] + size()}` : `Bet ${size()}`, 'red', () => act(0, toCall > 0 ? 'raise' : 'bet'));
    }
    function botMove() {
      if (G.over) return;
      const { toCall, canRaise } = options(1);
      const q = equity(G.hole[1], null, G.board, 350);
      const eq = q.win + q.tie / 2;
      const odds = toCall / (G.pot + toCall);
      let a;
      if (toCall > 0) {
        if (eq < odds * 0.95 && Math.random() > 0.1) a = 'fold';
        else if (eq > 0.66 && canRaise && Math.random() < 0.75) a = 'raise';
        else a = 'call';
      } else {
        if (eq > 0.6 && canRaise && Math.random() < 0.8) a = 'bet';
        else if (eq < 0.35 && canRaise && Math.random() < 0.16) a = 'bet';
        else a = 'check';
      }
      act(1, a);
    }
    function act(p, a) {
      const who = p ? 'Whiskers' : 'You';
      const { toCall } = options(p);
      ui.ctr.innerHTML = '';
      if (a === 'fold') {
        log(`${who} fold${p ? 's' : ''}.`);
        if (p) say(['Meh.', 'Not this time.', '*yawns*'][rnd(3)]);
        return finish(1 - p, false);
      }
      if (a === 'check') { log(`${who} check${p ? 's' : ''}.`); if (p) say('Check.'); }
      if (a === 'call') {
        const c = put(p, toCall);
        const diff = G.bet[1 - p] - G.bet[p];
        if (diff > 0) { G.stacks[1 - p] += diff; G.pot -= diff; G.bet[1 - p] -= diff; } // return the unmatched part of an all-in
        log(`${who} call${p ? 's' : ''} ${c}.`); if (p) say(['Call.', 'I’ll see that.', 'Fine.'][rnd(3)]); }
      if (a === 'bet' || a === 'raise') {
        put(p, toCall + size());
        G.raises++; G.acted[1 - p] = false;
        log(`${who} ${a === 'bet' ? `bet${p ? 's' : ''}` : `raise${p ? 's' : ''} to`} <b>${G.bet[p]}</b>.`);
        if (p) say(a === 'bet' ? ['Bet.', 'Purr-haps a bet.', 'Bet. 🐾'][rnd(3)] : ['Raise!', 'Raise. Meow.', 'Up it.'][rnd(3)]);
      }
      G.acted[p] = true;
      const done = (G.acted[0] && G.acted[1] && G.bet[0] === G.bet[1]) || (a === 'call' && (G.stacks[0] === 0 || G.stacks[1] === 0));
      if (done) return endStreet();
      G.toAct = 1 - p;
      next();
    }
    async function endStreet() {
      const allIn = G.stacks[0] === 0 || G.stacks[1] === 0;
      if (G.street === 3) return finish(null, true);
      G.street++; G.bet = [0, 0]; G.raises = 0; G.acted = [false, false];
      G.deck.pop(); // burn
      const n = G.street === 1 ? 3 : 1;
      const cards = []; for (let i = 0; i < n; i++) cards.push(G.deck.pop());
      G.board.push(...cards);
      log(`<b>${STREET[G.street]}:</b> ${G.board.map((c) => rch(c.r) + SYM[c.s]).join(' ')}`);
      const slots = $$('.slot', ui.board);
      for (const c of cards) {
        const el = cardEl(c, { down: true, cls: 'deal' });
        const slot = slots[G.board.indexOf(c)];
        slot.replaceWith(el);
        setTimeout(() => flip(el, true), 240);
        await sleep(220);
      }
      updateNums();
      if (allIn) { await sleep(500); return endStreet(); }
      G.toAct = 1 - G.button; // post-flop: non-button acts first
      next();
    }
    async function finish(winner, showdown) {
      G.over = true;
      updateNums();
      let msg;
      if (showdown) {
        $$('.pc', ui.bot).forEach((e) => flip(e, true));
        const e0 = best([...G.hole[0], ...G.board]), e1 = best([...G.hole[1], ...G.board]);
        const k0 = new Set(e0.cards.map(key)), k1 = new Set(e1.cards.map(key));
        await sleep(600);
        if (e0.score > e1.score) winner = 0; else if (e1.score > e0.score) winner = 1; else winner = -1;
        const k = winner === 1 ? k1 : k0;
        $$('.pc', ui.board).concat($$('.pc', winner === 1 ? ui.bot : ui.you)).forEach((el) => el.classList.toggle('hl', k.has(el.dataset.k)));
        log(`Showdown: you have <b>${describe(e0)}</b>, Whiskers has <b>${describe(e1)}</b>.`);
        msg = winner === 0 ? `You win ${G.pot} with ${describe(e0).toLowerCase()}!` : winner === 1 ? `Whiskers wins with ${describe(e1).toLowerCase()}.` : 'Split pot!';
        if (winner === 1) say(['Hiss-terical.', 'Purrfect.', 'Ha. 😼'][rnd(3)]);
        if (winner === 0) say(['Lucky.', 'Grr.', 'Rigged deck.'][rnd(3)]);
      } else msg = winner === 0 ? `Whiskers folds. You win ${G.pot}.` : `You fold. Whiskers takes ${G.pot}.`;
      if (winner === -1) { const h = Math.floor(G.pot / 2); G.stacks[0] += h; G.stacks[1] += G.pot - h; }
      else G.stacks[winner] += G.pot;
      G.pot = 0;
      updateNums();
      ui.ctr.innerHTML = `<p class="msg">${msg}</p>`;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = 'Deal next hand ♠';
      b.addEventListener('click', newHand); ui.ctr.appendChild(b);
    }
    boardSlots();
    ui.ctr.innerHTML = '';
    const start = document.createElement('button'); start.type = 'button'; start.className = 'btn red'; start.textContent = 'Deal me in ♠';
    start.addEventListener('click', newHand); ui.ctr.appendChild(start);
    log('Whiskers is waiting. Press “Deal me in”.');
  })();

  /* ═════════ CH9: HISTORY & VARIANTS ═════════ */
  (function history() {
    const H = [
      ['1829', '♠', 'New Orleans', 'English actor Joe Cowell describes a game in New Orleans: four players, a 20-card deck, betting on who holds the best hand.'],
      ['1830s', '♥', 'The full deck', 'The game spreads up the Mississippi on riverboats and switches to the full 52-card deck. The flush enters the rankings.'],
      ['1860s', '♦', 'Draw, stud and the straight', 'Around the American Civil War, draw poker and five-card stud spread, and the straight becomes a standard hand.'],
      ['1900s', '♣', 'Texas Hold’em is born', 'Legend places the first game in Robstown, Texas, in the early 1900s. In 2007 the Texas legislature officially recognized the town as its birthplace.'],
      ['1967', '♠', 'Hold’em goes to Vegas', 'A group of Texan players bring the game to Las Vegas, where it slowly takes over the casinos.'],
      ['1970', '♥', 'The World Series', 'The first World Series of Poker is held at Binion’s Horseshoe in Las Vegas. Johnny Moss is voted champion by his fellow players.'],
      ['1998', '♦', 'Poker goes online', 'The first real-money online poker games launch. The same year, the film <em>Rounders</em> makes poker look very cool.'],
      ['2003', '♣', 'The Moneymaker effect', 'An amateur named Chris Moneymaker turns an online qualifier costing under $100 into the WSOP Main Event title and $2.5 million. TV poker, with cameras showing hole cards, explodes. Millions start playing.'],
      ['2019', '♠', 'The robots arrive', 'After Libratus beat top pros heads-up in 2017, Pluribus, an AI from Carnegie Mellon and Facebook, beats elite professionals at six-player No-Limit Hold’em.'],
    ];
    const ol = $('#hist');
    ol.innerHTML = H.map(([y, s, h, p]) => `<li data-suit="${s}"><time>${y}</time><h4>${h}</h4><p>${p}</p></li>`).join('');
    $$('li', ol).forEach((li) => rio.observe(li));
    const V = [
      ['♠', 'Texas Hold’em', 'The king', 'Two hole cards each, five shared cards. Use any five of seven. Easy to learn, a lifetime to master. Usually No-Limit.', 'Players: 2–10'],
      ['♥', 'Omaha', 'Hold’em on steroids', 'Four hole cards each, five shared. The twist: you must use exactly two of your hole cards and three from the board. Huge hands are common.', 'Usually Pot-Limit'],
      ['♦', 'Seven-Card Stud', 'The old champion', 'No community cards. Each player gets seven cards, some face up and some face down, with a betting round after each. Memory matters: remember what folded.', 'Players: 2–8'],
      ['♣', 'Five-Card Draw', 'The cartoon classic', 'Five private cards, one betting round, then swap any you like for new ones, then bet again. The game in old westerns and kitchen tables.', 'Players: 2–6'],
      ['♠', 'Short Deck', 'The new kid', 'Hold’em with the 2s through 5s removed (36 cards). Big hands come more often, and a flush beats a full house because flushes become rarer.', 'Also called 6+ Hold’em'],
    ];
    const vg = $('#variants');
    vg.innerHTML = V.map(([s, n, k, t, f]) => `<button type="button" class="vcard" aria-label="${n}: flip for details"><div class="in"><div class="vf"><span class="vs">${s}</span><div><h4>${n}</h4><p class="tap">Tap to flip ↻</p></div></div><div class="vb"><p class="vk">${k}</p><h4>${n}</h4><p>${t}</p><p class="vk">${f}</p></div></div></button>`).join('');
    $$('.vcard', vg).forEach((c, i) => { c.addEventListener('click', () => c.classList.toggle('flip')); c.style.transitionDelay = i * 0.06 + 's'; });
    reveal($$('.vcard', vg));
  })();

  /* ═════════ CH10: GLOSSARY ═════════ */
  (function glossary() {
    const T = [
      ['The nuts', 'The best possible hand given the board. "I had the nut flush."'],
      ['Kicker', 'An unpaired side card that breaks ties. A-K beats A-Q on an Ace-high board thanks to the King kicker.'],
      ['Set vs trips', 'Both are three of a kind. A set uses a pocket pair plus one board card; trips use one hole card plus a pair on the board.'],
      ['Gutshot', 'A straight draw that needs one specific rank in the middle, like 5-6-_-8-9. Four outs.'],
      ['Open-ended', 'A straight draw that completes at either end, like 6-7-8-9. Eight outs.'],
      ['Limp', 'Just calling the big blind pre-flop instead of raising. Usually a beginner habit.'],
      ['Check-raise', 'Checking, then raising after someone bets. A strong, sneaky move.'],
      ['Value bet', 'Betting because you think a worse hand will call. The opposite of a bluff.'],
      ['Bad beat', 'Losing with a hand that was a big favorite. Everyone has a story. Nobody wants to hear it.'],
      ['Cooler', 'A hand where two very strong holdings collide, like Aces vs Kings. Nobody played it wrong.'],
      ['Tilt', 'Playing badly because you’re upset, usually after a bad beat. The most expensive emotion in poker.'],
      ['Muck', 'The pile of folded and discarded cards. Also a verb: "he mucked his hand."'],
      ['Rake', 'The small cut a casino or card room takes from each pot.'],
      ['Heads-up', 'Just two players, like your game against Whiskers.'],
      ['Fish & shark', 'A weak player and a strong one. Sharks eat fish.'],
      ['Overpair', 'A pocket pair higher than any card on the board.'],
    ];
    $('#glossary').innerHTML = T.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('');
  })();
})();

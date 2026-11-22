/* lrn — The Long Game: chess for adults */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const D = window.CHESS_DATA, C = window.Chess;
  const { sqName, sqOf, colorOf, typeOf } = C;
  const NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const cleanSAN = (s) => s.replace(/[+#!?]/g, '');

  /* tooltip */
  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');

  /* reveal */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb, margin) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: margin || '0px 0px -10% 0px' }); o.observe(n); };
  const whenSeen = (n, cb) => reveal(n, cb, '200px 0px 200px 0px');

  /* ═════════ PIECES (original drawings) ═════════ */
  const BASE = [['path', 'M20 91 Q20 84 27 83 H73 Q80 84 80 91 Z'], ['path', 'M26 83 Q27 77 33 76 H67 Q73 77 74 83 Z']];
  const SHAPES = {
    p: { s: [['path', 'M35 76 C37 68 42 62 43 57 H57 C58 62 63 68 65 76 Z'], ['path', 'M37 57 Q37 51 43 51 H57 Q63 51 63 57 Z'], ['circle', 50, 38, 13]], d: [] },
    r: { s: [['path', 'M34 76 L37 50 H63 L66 76 Z'], ['path', 'M32 50 Q32 44 37 44 H63 Q68 44 68 50 Z'], ['path', 'M31 44 V23 H40 V30 H46 V23 H54 V30 H60 V23 H69 V44 Z']], d: ['M35 38 H65', 'M40 60 H60'] },
    b: { s: [['path', 'M34 76 C38 69 42 64 43 60 H57 C58 64 62 69 66 76 Z'], ['path', 'M37 60 Q37 54 43 54 H57 Q63 54 63 60 Z'], ['path', 'M50 17 C39 26 35 38 38 47 C40 53 60 53 62 47 C65 38 61 26 50 17 Z'], ['circle', 50, 13, 4.5]], d: ['M56 27 L46 40'] },
    q: { s: [['path', 'M33 76 C37 66 41 58 42 51 H58 C59 58 63 66 67 76 Z'], ['path', 'M36 51 Q36 45 42 45 H58 Q64 45 64 51 Z'], ['path', 'M37 45 L29 26 L38 36 L40 22 L46 35 L50 19 L54 35 L60 22 L62 36 L71 26 L63 45 Z'], ['circle', 29, 24, 3.4], ['circle', 40, 20, 3.4], ['circle', 50, 16, 3.6], ['circle', 60, 20, 3.4], ['circle', 71, 24, 3.4]], d: ['M38 40 H62'] },
    k: { s: [['path', 'M33 76 C37 66 41 58 42 51 H58 C59 58 63 66 67 76 Z'], ['path', 'M36 51 Q36 45 42 45 H58 Q64 45 64 51 Z'], ['path', 'M37 45 C32 35 37 26 50 26 C63 26 68 35 63 45 Z'], ['path', 'M46.5 5 H53.5 V11 H59.5 V18 H53.5 V26 H46.5 V18 H40.5 V11 H46.5 Z']], d: ['M39 38 H61'] },
    n: { s: [['path', 'M31 76 C31 67 36 61 41 56 C35 57 29 57 26 54 C22 51 22 46 25 43 C30 37 34 32 37 26 L38 13 L46 20 C59 19 71 28 73 44 C75 58 70 68 69 76 Z']], d: ['M48 22 C60 25 67 34 68 48'], eye: true }
  };
  const pieceMarkup = (t, c) => {
    const W = c === 'w', fill = W ? 'url(#gIvory)' : 'url(#gEbony)', stroke = W ? '#5b4630' : '#0b0806', det = W ? '#8c7457' : '#9a8878';
    let s = `<g stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round" fill="${fill}">`;
    for (const sh of BASE.concat(SHAPES[t].s)) s += sh[0] === 'path' ? `<path d="${sh[1]}"/>` : `<circle cx="${sh[1]}" cy="${sh[2]}" r="${sh[3]}"/>`;
    s += '</g>';
    s += `<g fill="none" stroke="${det}" stroke-width="2" stroke-linecap="round">${SHAPES[t].d.map((d) => `<path d="${d}"/>`).join('')}<path d="M30 86.5 H70" opacity=".6"/></g>`;
    if (SHAPES[t].eye) s += `<circle cx="40" cy="31" r="2.4" fill="${W ? '#3a2a1c' : '#d9c7a4'}"/><circle cx="27" cy="48" r="1.4" fill="${W ? '#3a2a1c' : '#d9c7a4'}"/>`;
    s += `<ellipse cx="44" cy="${t === 'p' ? 34 : t === 'n' ? 40 : 60}" rx="5" ry="9" fill="#fff" opacity="${W ? .35 : .12}"/>`;
    return s;
  };
  (() => {
    const host = document.querySelector('svg defs').parentNode;
    let h = '';
    for (const c of 'wb') for (const t of 'pnbrqk') h += `<symbol id="pc-${c}${t}" viewBox="0 0 100 100">${pieceMarkup(t, c)}</symbol>`;
    host.insertAdjacentHTML('beforeend', h);
  })();
  const icon = (code) => `<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#pc-${code}"/></svg>`;
  const codeOf = (p) => colorOf(p) + typeOf(p);
  $$('.ic[data-piece]').forEach((n) => { n.innerHTML = icon(n.dataset.piece); });

  /* ═════════ BOARD ═════════ */
  const TRANSIENT = ['last', 'sel', 'check', 'dot', 'cap', 'ok', 'no', 'mark', 'found', 'missed', 'hint', 'cx', 'cb', 'kmate', 'box', 'sqr'];
  class Board {
    constructor(host, o = {}) {
      this.o = o; this.flip = !!o.flip; this.game = null; this.sel = null; this.legal = []; this.pieces = [];
      host.innerHTML = '';
      this.el = el('div', 'bd');
      this.sqs = el('div', 'sqs');
      this.cells = [];
      for (let i = 0; i < 64; i++) { const c = el('div', 'sq'); this.cells.push(c); this.sqs.append(c); }
      this.pcs = el('div', 'pcs');
      this.svg = sv('svg', { class: 'arrows', viewBox: '0 0 800 800', 'aria-hidden': 'true' });
      this.svg.append(sv('defs', {}));
      this.el.append(this.sqs, this.pcs, this.svg);
      host.append(this.el);
      this.layout();
      this.bind();
    }
    disp(sq) { const f = sq & 7, r = sq >> 3; return this.flip ? [7 - f, r] : [f, 7 - r]; }
    layout() {
      this.sqEl = new Array(64);
      for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
        const sq = this.flip ? row * 8 + (7 - col) : (7 - row) * 8 + col;
        const c = this.cells[row * 8 + col];
        c.className = 'sq' + ((((sq >> 3) + (sq & 7)) % 2 === 0) ? ' d' : '');
        c.innerHTML = '';
        if (this.o.coords !== false) {
          if (col === 0) c.append(el('span', 'co r', String((sq >> 3) + 1)));
          if (row === 7) c.append(el('span', 'co f', 'abcdefgh'[sq & 7]));
        }
        c.dataset.sq = sqName(sq);
        this.sqEl[sq] = c;
      }
      this.pieces.forEach((p) => this.place(p));
      this.drawArrows(this._arrows || []);
    }
    setFlip(v) { this.flip = v; this.layout(); this.deselect(); }
    place(pc) { const [x, y] = this.disp(pc.sq); const t = `translate(${x * 100}%, ${y * 100}%)`; pc.el.style.transform = t; pc.el.style.setProperty('--t', t); }
    newPiece(p, sq, anim) {
      const e = el('div', 'pc' + (anim ? ' new' : ''), icon(codeOf(p)));
      const pc = { el: e, sq, p };
      this.place(pc); this.pcs.append(e);
      if (anim) setTimeout(() => e.classList.remove('new'), 400);
      return pc;
    }
    /* sync pieces to a 64-array, animating moves */
    set(arr, anim = true) {
      if (typeof arr === 'string') arr = new C(arr).b;
      if (arr.b) arr = arr.b;
      if (!anim || RM) this.el.classList.add('noanim');
      const left = this.pieces.slice(), next = [], todo = [];
      for (let s = 0; s < 64; s++) {
        const p = arr[s]; if (!p) continue;
        const i = left.findIndex((x) => x.sq === s && x.p === p);
        if (i >= 0) { next.push(left[i]); left.splice(i, 1); } else todo.push([s, p]);
      }
      for (const [s, p] of todo) {
        let bi = -1, bd = 99;
        left.forEach((x, i) => { if (x.p !== p) return; const d = Math.max(Math.abs((x.sq & 7) - (s & 7)), Math.abs((x.sq >> 3) - (s >> 3))); if (d < bd) { bd = d; bi = i; } });
        if (bi >= 0) { const pc = left[bi]; left.splice(bi, 1); pc.sq = s; this.place(pc); next.push(pc); }
        else next.push(this.newPiece(p, s, anim && !RM));
      }
      for (const pc of left) { pc.el.classList.add('fade'); setTimeout(() => pc.el.remove(), anim ? 320 : 0); }
      this.pieces = next;
      if (!anim || RM) { void this.el.offsetWidth; requestAnimationFrame(() => this.el.classList.remove('noanim')); }
    }
    pieceAt(sq) { return this.pieces.find((p) => p.sq === sq); }
    classes(cls, sqs, extra) {
      for (const c of this.cells) { c.classList.remove(cls); if (extra) c.style.removeProperty('--dl'); }
      (sqs || []).forEach((s, i) => { const c = this.sqEl[s]; if (!c) return; c.classList.add(cls); if (extra) c.style.setProperty('--dl', (extra * i) + 's'); });
    }
    clearMarks(keep = []) { for (const c of this.cells) for (const t of TRANSIENT) if (!keep.includes(t)) c.classList.remove(t); }
    flash(sq, cls) { const c = this.sqEl[sq]; c.classList.remove(cls); void c.offsetWidth; c.classList.add(cls); setTimeout(() => c.classList.remove(cls), 750); }
    shake() { this.el.classList.remove('shake'); void this.el.offsetWidth; this.el.classList.add('shake'); }
    arrows(list) { this._arrows = list || []; this.drawArrows(this._arrows); }
    drawArrows(list) {
      const defs = this.svg.firstChild; this.svg.innerHTML = ''; defs.innerHTML = ''; this.svg.append(defs);
      const seen = {};
      for (const a of list) {
        const col = a.color || '#d4a640', id = 'ah' + col.replace(/[^a-z0-9]/gi, '');
        if (!seen[id]) { seen[id] = 1; const m = sv('marker', { id, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto-start-reverse' }); m.append(sv('path', { d: 'M0 0 L10 5 L0 10 z', fill: col })); defs.append(m); }
        const [x1, y1] = this.disp(a.from), [x2, y2] = this.disp(a.to);
        const cx1 = x1 * 100 + 50, cy1 = y1 * 100 + 50, cx2 = x2 * 100 + 50, cy2 = y2 * 100 + 50;
        const len = Math.hypot(cx2 - cx1, cy2 - cy1), sh = 30;
        const ex = cx2 - (cx2 - cx1) / len * sh, ey = cy2 - (cy2 - cy1) / len * sh;
        this.svg.append(sv('line', { x1: cx1, y1: cy1, x2: ex, y2: ey, stroke: col, 'stroke-width': 16, 'marker-end': `url(#${id})` }));
      }
    }
    sqAt(e) {
      const r = this.el.getBoundingClientRect();
      const col = Math.floor((e.clientX - r.left) / (r.width / 8)), row = Math.floor((e.clientY - r.top) / (r.height / 8));
      if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
      return this.flip ? row * 8 + (7 - col) : (7 - row) * 8 + col;
    }
    canMove() { return this.game && this.o.movable && this.o.movable(this.game.turn) && !this.busy; }
    select(sq) {
      this.sel = sq; this.legal = this.game.moves({ from: sq });
      this.classes('sel', [sq]);
      this.classes('dot', this.legal.filter((m) => !m.captured).map((m) => m.to));
      this.classes('cap', this.legal.filter((m) => m.captured).map((m) => m.to));
    }
    deselect() { this.sel = null; this.legal = []; this.classes('sel', []); this.classes('dot', []); this.classes('cap', []); }
    bind() {
      const bd = this.el;
      bd.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const sq = this.sqAt(e); if (sq < 0) return;
        if (this.o.onSquare) { this.o.onSquare(sq, e); }
        if (!this.canMove()) return;
        const p = this.game.b[sq];
        if (this.sel != null && this.legal.some((m) => m.to === sq)) { e.preventDefault(); this.tryMove(sq, false); return; }
        if (p && colorOf(p) === this.game.turn) {
          e.preventDefault();
          const again = this.sel === sq;
          this.select(sq);
          const pc = this.pieceAt(sq);
          if (pc) { this.drag = { sq, pc, x0: e.clientX, y0: e.clientY, moved: false, again }; try { bd.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } }
        } else this.deselect();
      });
      bd.addEventListener('pointermove', (e) => {
        const d = this.drag; if (!d) return;
        if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return;
        d.moved = true; d.pc.el.classList.add('drag');
        const r = bd.getBoundingClientRect(), s = r.width / 8;
        d.pc.el.style.transform = `translate(${e.clientX - r.left - s / 2}px, ${e.clientY - r.top - s / 2}px)`;
      });
      const up = (e) => {
        const d = this.drag; if (!d) return; this.drag = null;
        d.pc.el.classList.remove('drag');
        if (!d.moved) return;
        const to = this.sqAt(e);
        if (to >= 0 && to !== d.sq && this.legal.some((m) => m.to === to)) { this.tryMove(to, true, d.pc); return; }
        this.place(d.pc);
        if (to !== d.sq) this.deselect();
      };
      bd.addEventListener('pointerup', up);
      bd.addEventListener('pointercancel', (e) => { if (this.drag) { this.place(this.drag.pc); this.drag = null; } });
    }
    async tryMove(to, dragged, pc) {
      let cands = this.legal.filter((m) => m.to === to);
      const from = this.sel;
      if (dragged && pc) { pc.el.style.transition = 'none'; pc.sq = to; this.place(pc); void pc.el.offsetWidth; pc.el.style.transition = ''; }
      let m = cands[0];
      if (cands.length > 1) {
        const pick = await this.promo(colorOf(cands[0].piece));
        if (!pick) { if (pc) { pc.sq = from; this.place(pc); } this.deselect(); return; }
        m = cands.find((x) => typeOf(x.promo) === pick);
      }
      this.deselect();
      this.o.onMove && this.o.onMove(m);
    }
    promo(c) {
      return new Promise((res) => {
        const ov = el('div', 'promo'), box = el('div');
        for (const t of 'qrbn') { const b = el('button', '', icon(c + t)); b.setAttribute('aria-label', 'Promote to ' + NAMES[t]); b.onclick = (e) => { e.stopPropagation(); ov.remove(); res(t); }; box.append(b); }
        ov.append(box); ov.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (e.target === ov) { ov.remove(); res(null); } });
        this.el.append(ov);
      });
    }
    /* convenience: show a game with last move + check */
    show(game, m, anim = true) {
      this.set(game.b, anim);
      this.classes('last', m ? [m.from, m.to] : []);
      this.classes('check', game.inCheck() ? [game.kingSq(game.turn)] : []);
    }
  }
  const noanimCSS = document.createElement('style');
  noanimCSS.textContent = '.bd.noanim .pc{transition:none!important}';
  document.head.append(noanimCSS);

  /* ═════════ CHROME: progress, rail, toc ═════════ */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  const DARK = ['felt', 'walnut', 'night', 'oxblood'];
  chapters.forEach((c) => { const a = el('a'); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const rl = $$('a', rail);
  const onScroll = () => {
    const d = document.documentElement, y = d.scrollTop;
    bar.style.width = (y / Math.max(1, d.scrollHeight - d.clientHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', y > innerHeight * .8);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur));
    rail.classList.toggle('on-dark', cur >= 0 && DARK.some((k) => chapters[cur].classList.contains(k)));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  (() => {
    const toc = $('#toc'); if (!toc) return;
    const ic = ['wp', 'wn', 'wb', 'wr', 'bk', 'wq', 'bp', 'wk', 'bn', 'bb', 'bq'];
    chapters.slice(1).forEach((c, i) => {
      const li = el('li'), a = el('a');
      a.href = '#' + c.id;
      const h = $('h2', c).textContent.replace(/\s+/g, ' ').trim();
      a.innerHTML = `<span class="ic">${icon(ic[i % ic.length])}</span><b>${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i]}</b><span><strong>${c.dataset.rail}</strong> · ${h}</span>`;
      li.append(a); toc.append(li);
    });
  })();

  $$('.rv').forEach((n) => reveal(n));
  reveal($('#routine'));

  /* stats count-up */
  $$('[data-count]').forEach((n) => {
    const to = +n.dataset.count;
    reveal(n, () => { if (RM) return; const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 1400); n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-IN'); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  });

  /* ═════════ HERO ═════════ */
  (() => {
    const cv = $('#dust'), ctx = cv.getContext('2d');
    let W, H, motes = [];
    const size = () => { const r = cv.getBoundingClientRect(); W = cv.width = r.width * devicePixelRatio; H = cv.height = r.height * devicePixelRatio; motes = Array.from({ length: Math.round(W * H / 26000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .4) * devicePixelRatio, v: Math.random() * .25 + .05, a: Math.random() * .5 + .15, w: Math.random() * Math.PI * 2 })); };
    size(); addEventListener('resize', size);
    let on = true;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const m of motes) {
        m.y -= m.v * devicePixelRatio; m.w += .01; m.x += Math.sin(m.w) * .2;
        if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fillStyle = `rgba(255, 214, 150, ${m.a})`; ctx.fill();
      }
      if (on && !RM) requestAnimationFrame(draw);
    };
    draw();
    if (io) new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) draw(); }).observe(cv);

    const board = new Board($('#heroBoard'), { coords: false });
    const tick = $('#heroTick');
    let g = new C(), i = 0;
    board.set(g.b, false);
    const step = async () => {
      if (i >= D.opera.length) {
        tick.textContent = '17. Rd8#  Checkmate';
        await wait(4200);
        g = new C(); i = 0; board.clearMarks(); board.set(g.b); tick.textContent = 'A new game';
        await wait(1600);
      }
      const m = g.play(D.opera[i]);
      const n = Math.floor(i / 2) + 1;
      tick.textContent = (i % 2 === 0 ? n + '. ' : n + '… ') + m.san;
      board.show(g, m);
      if (g.status() === 'checkmate') board.classes('kmate', [g.kingSq(g.turn)]);
      i++;
    };
    let running = false;
    const loop = async () => { if (running) return; running = true; while (true) { await step(); await wait(RM ? 2600 : 1500); } };
    setTimeout(loop, 1400);
  })();

  /* ═════════ STUDY 01 · PIECES ═════════ */
  (() => {
    const SC = {
      k: '8/8/8/3p4/4K3/8/8/8 w - - 0 1', q: '8/6p1/1p6/8/3Q4/8/8/8 w - - 0 1', r: '8/3p4/8/8/3R2p1/8/8/8 w - - 0 1',
      b: '8/8/1p6/8/3B4/8/5p2/8 w - - 0 1', n: '8/8/2p5/5p2/3N4/8/8/8 w - - 0 1', p: '8/8/8/8/8/3p4/4P3/8 w - - 0 1',
      castle: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', ep: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', promo: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1'
    };
    const SPECIAL = {
      castle: { name: 'Castling', val: 'Special move', line: 'Move the king two squares towards either rook. The rook jumps over to land beside it.', fact: 'Short castling (O-O) is far more common. Long castling (O-O-O) puts the king on c1 and the rook straight onto the d-file.' },
      ep: { name: 'En passant', val: 'Special move', line: 'Black has just played d7–d5, landing beside your e5 pawn. Capture it “in passing” by moving to d6.', fact: 'The rule arrived when pawns gained their double first step, so they could not sneak past an enemy pawn.' },
      promo: { name: 'Promotion', val: 'Special move', line: 'Push the pawn to the eighth rank and choose what it becomes.', fact: 'Choosing anything other than a queen is called underpromotion. You will meet a good reason for it in Study 06.' }
    };
    const tabs = $('#pcTabs');
    let cur = 'n', g, tok = 0;
    const board = new Board($('#bdPieces'), {
      movable: (c) => c === 'w',
      onMove: (m) => {
        const mv = g.play(m);
        board.show(g, mv);
        if (SPECIAL[cur]) {
          const msg = { castle: 'Castled. The king is safe and the rook is in play.', ep: 'En passant! The black pawn is removed even though you landed behind it.', promo: 'Promoted. One pawn just became a ' + NAMES[typeOf(m.promo || 'q')] + '.' }[cur];
          $('#pcFact').textContent = msg;
          const tk = ++tok; setTimeout(() => { if (tk === tok && SPECIAL[cur]) load(cur); }, 2600);
          return;
        }
        g.turn = 'w'; g.ep = -1;
        board.classes('check', []);
        const left = g.b.filter((p) => p && colorOf(p) === 'b').length;
        if (!left) setTimeout(() => load(cur), 900);
        else setTimeout(() => { const sq = g.b.findIndex((p) => p && colorOf(p) === 'w'); if (sq >= 0) board.select(sq); }, 340);
      }
    });
    const load = (k) => {
      tok++; cur = k; g = new C(SC[k]); board.game = g;
      board.clearMarks(); board.arrows([]);
      board.set(g.b, true);
      const info = SPECIAL[k] || D.pieces[k];
      $('#pcName').textContent = info.name;
      $('#pcVal').textContent = SPECIAL[k] ? info.val : (k === 'k' ? 'Value: priceless' : 'Value: ' + info.val + (info.val === '1' ? ' point' : ' points'));
      $('#pcLine').textContent = info.line;
      $('#pcFact').textContent = info.fact;
      $$('.chip', tabs).forEach((b) => { const on = b.dataset.k === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      if (!SPECIAL[k]) setTimeout(() => { const sq = g.b.findIndex((p) => p && colorOf(p) === 'w'); board.select(sq); }, 380);
      if (k === 'ep') board.arrows([{ from: sqOf('e5'), to: sqOf('d6') }]);
      if (k === 'castle') board.arrows([{ from: sqOf('e1'), to: sqOf('g1') }, { from: sqOf('e1'), to: sqOf('c1'), color: '#8fb39a' }]);
    };
    [['k', 'wk'], ['q', 'wq'], ['r', 'wr'], ['b', 'wb'], ['n', 'wn'], ['p', 'wp']].forEach(([k, ic]) => {
      const b = el('button', 'chip', `<span class="ic">${icon(ic)}</span>${D.pieces[k].name}`); b.dataset.k = k; b.setAttribute('role', 'tab'); b.onclick = () => load(k); tabs.append(b);
    });
    for (const k of ['castle', 'ep', 'promo']) { const b = el('button', 'chip', SPECIAL[k].name); b.dataset.k = k; b.setAttribute('role', 'tab'); b.onclick = () => load(k); tabs.append(b); }
    whenSeen($('#stPieces'), () => load('n'));
  })();

  /* ═════════ STUDY 02 · COORDINATES ═════════ */
  (() => {
    let flip = false, running = false, score = 0, target = -1, tEnd = 0, timer;
    const best = store.get('lrn-chess-coords', { w: 0, b: 0 });
    const tgt = $('#coTarget'), sc = $('#coScore'), tm = $('#coTime'), bs = $('#coBest');
    const showBest = () => { bs.textContent = best[flip ? 'b' : 'w']; };
    const board = new Board($('#bdCoords'), {
      coords: false,
      onSquare: (sq) => {
        if (!running) return;
        if (sq === target) { score++; sc.textContent = score; board.flash(sq, 'ok'); next(); }
        else { board.flash(sq, 'no'); board.flash(target, 'ok'); next(); }
      }
    });
    board.set(new C().b, false);
    const next = () => { let t; do { t = Math.floor(Math.random() * 64); } while (t === target); target = t; tgt.textContent = sqName(t); tgt.classList.remove('pop'); void tgt.offsetWidth; tgt.classList.add('pop'); };
    const stop = () => {
      running = false; clearInterval(timer); tm.textContent = '0';
      const k = flip ? 'b' : 'w';
      tgt.textContent = score > best[k] ? 'New best!' : score + ' squares';
      if (score > best[k]) { best[k] = score; store.set('lrn-chess-coords', best); }
      showBest(); $('#coGo').textContent = 'Again';
      board.set(new C().b);
    };
    $('#coGo').onclick = () => {
      score = 0; sc.textContent = 0; running = true; tEnd = performance.now() + 30000;
      board.set(new Array(64).fill(null)); next();
      $('#coGo').textContent = 'Restart';
      clearInterval(timer);
      timer = setInterval(() => { const left = Math.max(0, (tEnd - performance.now()) / 1000); tm.textContent = Math.ceil(left); if (left <= 0) stop(); }, 100);
    };
    $('#coFlip').onclick = () => { flip = !flip; board.setFlip(flip); $('#coFlip').textContent = flip ? 'Play from White’s side' : 'Play from Black’s side'; showBest(); };
    showBest();
  })();

  /* ═════════ STUDY 03 · MEMORY ═════════ */
  (() => {
    const board = new Board($('#bdMemory'), { onSquare: (sq) => answer && answer(sq) });
    const ring = $('#memRing .arc'), secEl = $('#memSec'), msg = $('#memMsg');
    let answer = null, res = { real: [0, 0], rand: [0, 0] }, running = false;
    board.set(new C(D.memoryReal[0]).b, false);
    const randomise = (arr) => {
      const out = new Array(64).fill(null), ps = arr.filter(Boolean);
      const free = shuffle([...Array(64).keys()]);
      for (const p of ps) { const i = free.findIndex((s) => !(typeOf(p) === 'p' && ((s >> 3) === 0 || (s >> 3) === 7))); out[free[i]] = p; free.splice(i, 1); }
      return out;
    };
    const upd = () => {
      for (const k of ['real', 'rand']) {
        const [a, n] = res[k], id = k === 'real' ? 'Real' : 'Rand';
        $('#mem' + id).textContent = `${a} / ${n}`;
        $('#mem' + id + 'Bar').style.width = (n ? a / n * 100 : 0) + '%';
      }
    };
    const countdown = (s) => new Promise((done) => {
      const t0 = performance.now(), dur = s * 1000;
      const f = (t) => { const k = Math.min(1, (t - t0) / dur); ring.style.strokeDashoffset = (106.8 * k).toFixed(1); secEl.textContent = Math.ceil(s * (1 - k)) || ''; if (k < 1) requestAnimationFrame(f); else done(); };
      requestAnimationFrame(f);
    });
    const round = async (kind, fen) => {
      const real = new C(fen).b;
      const arr = kind === 'real' ? real : randomise(real);
      board.clearMarks();
      board.set(arr);
      msg.textContent = kind === 'real' ? 'Memorise this position…' : 'Memorise this position…';
      await countdown(5);
      board.set(new Array(64).fill(null));
      msg.textContent = 'Hold it in your head…';
      await wait(900);
      const cand = [...Array(64).keys()].filter((s) => arr[s] && typeOf(arr[s]) !== 'k');
      const gone = cand[Math.floor(Math.random() * cand.length)];
      const shown = arr.slice(); shown[gone] = null;
      board.set(shown);
      msg.textContent = 'One piece has vanished. Tap the square where it stood.';
      const sq = await new Promise((r) => { answer = r; });
      answer = null;
      const ok = sq === gone;
      res[kind][1]++; if (ok) res[kind][0]++;
      board.set(arr);
      board.flash(sq, ok ? 'ok' : 'no');
      board.classes('found', [gone]);
      msg.innerHTML = ok ? `Correct: the ${NAMES[typeOf(arr[gone])]} on ${sqName(gone)}. <em>(${kind === 'real' ? 'real game' : 'random'} position)</em>` : `It was the ${NAMES[typeOf(arr[gone])]} on ${sqName(gone)}. <em>(${kind === 'real' ? 'real game' : 'random'} position)</em>`;
      upd();
      await wait(2200);
    };
    $('#memGo').onclick = async () => {
      if (running) return; running = true; $('#memGo').disabled = true;
      res = { real: [0, 0], rand: [0, 0] }; upd();
      const reals = shuffle(D.memoryReal);
      const plan = shuffle(['real', 'real', 'real', 'rand', 'rand', 'rand']);
      for (let i = 0; i < plan.length; i++) await round(plan[i], reals[i % reals.length]);
      const r = res.real[0], q = res.rand[0];
      msg.innerHTML = r > q ? `You found ${r} of 3 in real positions and ${q} of 3 in random ones. That gap is chunking at work: real positions are made of patterns you already half-know.` : r === q ? `Even: ${r} of 3 each way. With more chess experience, real positions get noticeably easier than random ones. That is chunking.` : `Interesting: random positions went better this time (${q} vs ${r}). As you play more, real positions will start to “click” into familiar patterns.`;
      board.clearMarks(); ring.style.strokeDashoffset = 0; secEl.textContent = '5';
      $('#memGo').textContent = 'Try again'; $('#memGo').disabled = false; running = false;
    };
  })();

  /* ═════════ STUDY 04 · OPENINGS ═════════ */
  (() => {
    const tabs = $('#opTabs'), list = $('#opMoves'), note = $('#opNote'), track = $('#opTrack');
    const board = new Board($('#bdOpen'));
    let op, frames, idx = 0, timer = null;
    const prog = (b, c, cs) => {
      const W = c === 'w', P = W ? 'P' : 'p';
      const centre = ['d4', 'e4', 'd5', 'e5'].filter((s) => b[sqOf(s)] === P).length;
      const homes = W ? { b1: 'N', g1: 'N', c1: 'B', f1: 'B' } : { b8: 'n', g8: 'n', c8: 'b', f8: 'b' };
      const out = 4 - Object.entries(homes).filter(([s, p]) => b[sqOf(s)] === p).length;
      const castled = !!(cs && cs[c]);
      return { centre, out, castled };
    };
    const renderTrack = (b, cs) => {
      track.innerHTML = '';
      for (const [c, label, sw] of [['w', 'White', '#f4ecdc'], ['b', 'Black', '#2b2420']]) {
        const p = prog(b, c, cs), box = el('div');
        box.innerHTML = `<h5><i style="background:${sw};border:1px solid #c9a25a"></i>${label}</h5>
          <div class="tk ${p.centre ? 'on' : ''}"><span>${p.centre ? '✓' : ''}</span>Centre pawn<em>${p.centre}</em></div>
          <div class="tk ${p.out >= 2 ? 'on' : ''}"><span>${p.out >= 2 ? '✓' : ''}</span>Minor pieces out<em>${p.out}/4</em></div>
          <div class="tk ${p.castled ? 'on' : ''}"><span>${p.castled ? '✓' : ''}</span>King castled<em>${p.castled ? 'yes' : '—'}</em></div>`;
        track.append(box);
      }
    };
    const go = (i, anim = true) => {
      idx = clamp(i, 0, frames.length - 1);
      const f = frames[idx];
      board.set(f.b, anim);
      board.classes('last', f.m ? [f.m.from, f.m.to] : []);
      board.classes('check', f.check != null ? [f.check] : []);
      board.arrows(f.m ? [{ from: f.m.from, to: f.m.to, color: 'rgba(212,166,64,.85)' }] : []);
      note.innerHTML = idx === 0 ? `<b>Start</b>${op.style}. Press play, or step through with the arrows.` : `<b>${Math.ceil(idx / 2)}${idx % 2 ? '.' : '…'} ${f.san}</b>${op.notes[idx - 1]}`;
      $$('button', list).forEach((b) => b.classList.toggle('on', +b.dataset.i === idx));
      const on = $('button.on', list); if (on) list.scrollTop = on.offsetTop - list.offsetTop - 40;
      renderTrack(f.b, f.cs);
      $('#opPrev').disabled = $('#opFirst').disabled = idx === 0;
      $('#opNext').disabled = $('#opLast').disabled = idx === frames.length - 1;
    };
    const stop = () => { clearInterval(timer); timer = null; $('#opPlay').textContent = '▶'; $('#opPlay').setAttribute('aria-label', 'Play'); };
    const load = (o) => {
      stop(); op = o;
      const g = new C(); frames = [{ b: g.b.slice(), cs: {} }];
      const cs = {};
      for (const s of o.moves) { const m = g.play(s); if (m.flag === 'castle') cs[colorOf(m.piece)] = true; frames.push({ b: g.b.slice(), m, san: m.san, cs: { ...cs }, check: g.inCheck() ? g.kingSq(g.turn) : null }); }
      $('#opName').textContent = o.name;
      $('#opMeta').textContent = `${o.eco !== '—' ? 'ECO ' + o.eco + ' · ' : ''}${o.side === 'Know it' ? 'Know it, avoid it' : 'For ' + o.side}`;
      list.innerHTML = '';
      frames.slice(1).forEach((f, i) => {
        const li = el('li');
        if (i % 2 === 0) li.append(el('span', 'n', (i / 2 + 1) + '.'));
        const b = el('button', '', f.san); b.dataset.i = i + 1; b.onclick = () => { stop(); go(i + 1); };
        li.append(b); list.append(li);
      });
      $$('.chip', tabs).forEach((b) => b.classList.toggle('on', b.dataset.id === o.id));
      go(0, false);
    };
    D.openings.forEach((o) => { const b = el('button', 'chip', o.name); b.dataset.id = o.id; b.setAttribute('role', 'tab'); b.onclick = () => load(o); tabs.append(b); });
    $('#opFirst').onclick = () => { stop(); go(0); };
    $('#opPrev').onclick = () => { stop(); go(idx - 1); };
    $('#opNext').onclick = () => { stop(); go(idx + 1); };
    $('#opLast').onclick = () => { stop(); go(frames.length - 1); };
    $('#opPlay').onclick = () => {
      if (timer) return stop();
      if (idx >= frames.length - 1) go(0);
      $('#opPlay').textContent = '❚❚'; $('#opPlay').setAttribute('aria-label', 'Pause');
      timer = setInterval(() => { if (idx >= frames.length - 1) return stop(); go(idx + 1); }, 1900);
    };
    load(D.openings[0]);
  })();

  /* ═════════ MOTIFS ═════════ */
  (() => {
    const M = [
      ['Fork', 'wn', 'One piece attacks two or more targets at once. Knights are the great forkers, but every piece can do it, pawns included.'],
      ['Pin', 'wb', 'A piece can’t move without exposing something more valuable behind it. If that’s the king, the pin is absolute: moving is illegal.'],
      ['Skewer', 'wr', 'A pin in reverse. Attack a valuable piece; when it steps aside, take the one behind it.'],
      ['Discovered attack', 'wq', 'Move one piece out of another’s line and unleash a hidden attack. If it gives check, the moving piece gets a free move.'],
      ['Double check', 'bn', 'Two pieces give check at once. The king must move, since nothing can block or capture both checkers.'],
      ['Removing the guard', 'wb', 'Capture or chase away the piece that defends something, and that something falls.'],
      ['Deflection', 'wr', 'Force a defender away from its duty, often with a sacrifice it must accept.'],
      ['Decoy', 'wk', 'Lure a piece, often the king, onto a square where a tactic is waiting.'],
      ['Overloading', 'bq', 'One defender, two jobs. Make it do one, and the other is left undone.'],
      ['Zwischenzug', 'wp', 'German for “in-between move”. Instead of the expected recapture, play a stronger forcing move first.']
    ];
    const host = $('#motifs');
    M.forEach(([n, ic, t]) => {
      const b = el('button', 'motif');
      b.setAttribute('aria-label', n + ': tap to flip');
      b.innerHTML = `<div class="in"><div class="fr">${icon(ic)}<b>${n}</b><span>Tap to flip</span></div><div class="bk"><b>${n}</b><p>${t}</p></div></div>`;
      b.onclick = () => b.classList.toggle('flip');
      host.append(b);
    });
  })();

  /* ═════════ STUDY 05 · LOOSE PIECES ═════════ */
  (() => {
    let i = 0, g, marks = new Set(), checked = false;
    const msg = $('#loMsg');
    $('#loN').textContent = D.loose.length;
    const answerOf = (g) => {
      const out = [];
      for (let s = 0; s < 64; s++) {
        const p = g.b[s]; if (!p || colorOf(p) !== 'b' || p === 'k') continue;
        const att = g.attackers(s, 'w'); if (!att.length) continue;
        const def = g.attackers(s, 'b');
        const TV = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 99 };
        const cheapest = att.reduce((a, x) => TV[typeOf(g.b[x])] < TV[typeOf(g.b[a])] ? x : a, att[0]);
        if (!def.length || TV[typeOf(g.b[cheapest])] < TV[typeOf(p)]) out.push({ s, by: cheapest, def: def.length });
      }
      return out;
    };
    const board = new Board($('#bdLoose'), {
      onSquare: (sq) => {
        if (checked) return;
        const p = g.b[sq]; if (!p || colorOf(p) !== 'b' || p === 'k') { board.flash(sq, 'no'); return; }
        marks.has(sq) ? marks.delete(sq) : marks.add(sq);
        board.classes('mark', [...marks]);
      }
    });
    const load = () => {
      g = new C(D.loose[i]); marks = new Set(); checked = false;
      board.clearMarks(); board.arrows([]); board.set(g.b);
      $('#loIdx').textContent = i + 1; msg.textContent = ''; msg.className = 'lo-msg';
      $('#loCheck').disabled = false;
    };
    $('#loCheck').onclick = () => {
      checked = true; $('#loCheck').disabled = true;
      const ans = answerOf(g), set = new Set(ans.map((a) => a.s));
      const found = [...marks].filter((s) => set.has(s)), missed = ans.filter((a) => !marks.has(a.s)).map((a) => a.s), wrong = [...marks].filter((s) => !set.has(s));
      board.classes('mark', []); board.classes('found', found); board.classes('missed', missed);
      wrong.forEach((s) => board.flash(s, 'no'));
      board.arrows(ans.map((a) => ({ from: a.by, to: a.s, color: 'rgba(184,67,58,.85)' })));
      const desc = ans.map((a) => `the ${NAMES[typeOf(g.b[a.s])]} on ${sqName(a.s)} (${a.def ? 'attacked by a cheaper ' + NAMES[typeOf(g.b[a.by])] : 'undefended, hit by the ' + NAMES[typeOf(g.b[a.by])]})`).join('; ');
      const perfect = !missed.length && !wrong.length;
      msg.className = 'lo-msg ' + (perfect ? 'ok' : 'no');
      msg.innerHTML = (perfect ? '<b>Perfect.</b> ' : `<b>${found.length} of ${ans.length} found${wrong.length ? ', ' + wrong.length + ' safe piece' + (wrong.length > 1 ? 's' : '') + ' marked' : ''}.</b> `) + 'Loose: ' + desc + '.';
    };
    $('#loNext').onclick = () => { i = (i + 1) % D.loose.length; load(); };
    whenSeen($('#stLoose'), load);
  })();

  /* ═════════ STUDY 06 · TACTICS GYM ═════════ */
  (() => {
    const done = new Set(store.get('lrn-chess-gym', []));
    const list = $('#gymList'), msg = $('#gymMsg'), why = $('#gymWhy');
    let pi = 0, p, g, step = 0, left = 0, solved = false;
    const board = new Board($('#bdGym'), { movable: (c) => !solved && c === 'w', onMove: (m) => userMove(m) });
    const setMsg = (t, cls) => { msg.innerHTML = t; msg.className = 'gym-msg' + (cls ? ' ' + cls : ''); };
    const renderList = () => $$('button', list).forEach((b, i) => { b.classList.toggle('on', i === pi); b.classList.toggle('done', done.has(i)); });
    const win = () => {
      solved = true; done.add(pi); store.set('lrn-chess-gym', [...done]); renderList();
      setMsg(`<b>Solved!</b> ${done.size} of ${D.puzzles.length} puzzles cleared.`, 'ok');
      why.textContent = p.why;
      if (g.status() === 'checkmate') board.classes('kmate', [g.kingSq(g.turn)]);
    };
    const reply = async (san) => {
      board.busy = true; await wait(550);
      const m = san ? g.play(san) : g.play(g.moves()[Math.floor(Math.random() * g.moves().length)]);
      board.show(g, m); board.busy = false;
      setMsg(`Black replies <b>${m.san}</b>. Your move.`);
    };
    const expected = () => {
      if (p.type === 'mate') { const m = g.mateIn(left); return m ? [m] : []; }
      return p.moves[step].split('|').map((s) => { try { return g.moveSAN(s); } catch (e) { return null; } }).filter(Boolean);
    };
    const userMove = (m) => {
      board.classes('hint', []);
      const san = g.san(m);
      let ok;
      g.play(m);
      if (g.status() === 'checkmate') { board.show(g, m); return win(); }
      if (p.type === 'mate') ok = left > 1 && g.forcedMate(left - 1);
      else ok = p.moves[step].split('|').map(cleanSAN).includes(cleanSAN(san));
      if (!ok) {
        g.undo(); board.show(g, null, false); board.shake();
        setMsg(`<b>${san}</b> isn’t it. Try again. ${p.hint ? '' : ''}`, 'no');
        return;
      }
      board.show(g, m);
      if (p.type === 'mate') { left--; reply(); return; }
      step++;
      if (step >= p.moves.length) return win();
      const r = p.moves[step]; step++;
      reply(r).then(() => { if (step >= p.moves.length) win(); });
    };
    const load = (i) => {
      pi = i; p = D.puzzles[i]; g = new C(p.fen); step = 0; left = p.n || 0; solved = false;
      board.game = g; board.clearMarks(); board.arrows([]); board.set(g.b);
      $('#gymNum').textContent = `Puzzle ${i + 1} of ${D.puzzles.length} · White to move`;
      $('#gymName').textContent = p.name; $('#gymTheme').textContent = p.theme + (p.type === 'mate' ? ` Mate in ${p.n}.` : '');
      setMsg('Find the best move.'); why.textContent = '';
      renderList();
    };
    D.puzzles.forEach((q, i) => { const b = el('button', '', String(i + 1)); b.setAttribute('aria-label', 'Puzzle ' + (i + 1) + ': ' + q.name); b.onclick = () => load(i); list.append(b); });
    $('#gymHint').onclick = () => { if (solved) return; const e = expected(); if (e[0]) { board.classes('hint', [e[0].from]); setMsg(p.hint); } };
    $('#gymShow').onclick = async () => {
      if (solved || board.busy) return;
      board.busy = true;
      while (!solved) {
        const e = expected(); if (!e[0]) break;
        const m = e[0];
        board.busy = false; userMove(m); board.busy = true;
        await wait(1300);
      }
      board.busy = false;
    };
    $('#gymNext').onclick = () => load((pi + 1) % D.puzzles.length);
    whenSeen($('#stGym'), () => load(Math.min(done.size, D.puzzles.length - 1) && [...Array(D.puzzles.length).keys()].find((i) => !done.has(i)) || 0));
  })();

  /* ═════════ STUDY 07 · MATES ═════════ */
  (() => {
    const tabs = $('#mtTabs'); let cur = 0, tok = 0;
    const board = new Board($('#bdMates'));
    const play = async (i) => {
      const t = ++tok; cur = i;
      const mt = D.mates[i], g = new C(mt.fen);
      $$('.chip', tabs).forEach((b, j) => b.classList.toggle('on', j === i));
      $('#mtName').textContent = mt.name; $('#mtNote').textContent = mt.note; $('#mtMove').textContent = 'The final move: ' + mt.move;
      board.clearMarks(); board.arrows([]); board.set(g.b);
      await wait(900); if (t !== tok) return;
      const m = g.play(mt.move);
      board.show(g, m);
      await wait(500); if (t !== tok) return;
      const k = g.kingSq('b');
      board.classes('check', []); board.classes('kmate', [k]);
      const save = g.b[k]; g.b[k] = null;
      const cx = [], cb = [];
      for (const [df, dr] of [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]) {
        const f = (k & 7) + df, r = (k >> 3) + dr; if (f < 0 || f > 7 || r < 0 || r > 7) continue;
        const s = r * 8 + f, p = g.b[s];
        if (p && colorOf(p) === 'b') cb.push(s); else if (g.attacked(s, 'w')) cx.push(s);
      }
      g.b[k] = save;
      board.classes('cx', cx, .09); board.classes('cb', cb, .09);
      board.arrows(g.attackers(k, 'w').map((a) => ({ from: a, to: k, color: 'rgba(236,211,154,.95)' })));
    };
    D.mates.forEach((m, i) => { const b = el('button', 'chip', m.name); b.setAttribute('role', 'tab'); b.onclick = () => play(i); tabs.append(b); });
    $('#mtReplay').onclick = () => play(cur);
    whenSeen($('#stMates'), () => play(0));
  })();

  /* ═════════ STRATEGY IDEAS ═════════ */
  (() => {
    const IDEAS = [
      { t: 'Outposts', fen: 'r4rk1/pp3ppp/3p4/3Np3/4P3/8/PPP2PPP/R4RK1 w - - 0 1', box: ['d5'], arrows: [['d5', 'c7'], ['d5', 'e7'], ['d5', 'f6']], p: 'A square in enemy territory that no enemy pawn can ever attack. A knight planted on d5 here can never be chased away, and it watches everything.' },
      { t: 'Open files & the seventh', fen: '6k1/ppR2ppp/8/8/8/8/5PPP/6K1 w - - 0 1', box: ['c7'], arrows: [['c7', 'a7'], ['c7', 'f7']], p: 'Rooks need open files to breathe. A rook that reaches the seventh rank attacks pawns from behind and pins the king to the back rank.' },
      { t: 'Passed pawns', fen: '6k1/pp3ppp/8/3P4/8/8/PP3PPP/6K1 w - - 0 1', box: ['d5', 'd6', 'd7', 'd8'], arrows: [['d5', 'd8']], p: 'A pawn with no enemy pawns in front of it or on the neighbouring files. It ties down defenders and becomes more dangerous with every step. “Passed pawns must be pushed.”' },
      { t: 'Good & bad bishops', fen: '2b3k1/pp3p1p/4p1p1/3pP3/3P4/8/PP3PPP/6K1 w - - 0 1', box: ['c8', 'd5', 'e6', 'f7', 'h7'], arrows: [], p: 'Black’s bishop is hemmed in by its own pawns, all fixed on light squares. A bishop is “bad” when its pawns block it. Put your pawns on the opposite colour to your bishop.' },
      { t: 'The isolated pawn', fen: 'r4rk1/pp3ppp/4p3/8/3P4/2N2N2/PP3PPP/R4RK1 w - - 0 1', box: ['d4', 'd5'], arrows: [['f3', 'e5'], ['c3', 'd5']], p: 'A pawn with no friendly pawns on the neighbouring files can’t be defended by pawns. It gives active piece play, but the square in front of it, d5, is a perfect home for an enemy blockader.' },
      { t: 'A knight on the rim is dim', fen: '6k1/5ppp/8/8/3N4/8/5PPP/N5K1 w - - 0 1', box: ['a1', 'd4'], arrows: [['d4', 'c6'], ['d4', 'e6'], ['d4', 'f5'], ['d4', 'b5'], ['a1', 'b3'], ['a1', 'c2']], p: 'In the centre a knight reaches eight squares; in the corner, two. When you are unsure what to do, find your worst-placed piece and give it a better square.' }
    ];
    const host = $('#ideas');
    IDEAS.forEach((I) => {
      const card = el('div', 'idea rv'), b = el('div', 'board');
      card.append(b);
      card.insertAdjacentHTML('beforeend', `<h4>${I.t}</h4><p>${I.p}</p>`);
      host.append(card);
      const bd = new Board(b);
      whenSeen(card, () => {
        bd.set(new C(I.fen).b, false);
        setTimeout(() => { bd.classes('box', I.box.map(sqOf)); bd.arrows(I.arrows.map(([a, z]) => ({ from: sqOf(a), to: sqOf(z), color: 'rgba(79,138,91,.9)' }))); }, 500);
      });
      reveal(card);
    });
  })();

  /* ═════════ STUDY 08 · RULE OF THE SQUARE ═════════ */
  (() => {
    const PAWNS = ['c4', 'b2', 'f5', 'd3', 'e2'];
    let pawn = sqOf('c4'), king = sqOf('g6'), turn = 'b', racing = false, pIdx = 0;
    const WK = sqOf('h1');
    const verdict = $('#sqVerdict');
    const board = new Board($('#bdSquare'), {
      onSquare: (sq) => {
        if (racing) return;
        if (sq === pawn || sq === WK || Math.max(Math.abs((sq & 7) - 7), Math.abs(sq >> 3)) <= 1) { board.flash(sq, 'no'); return; }
        king = sq; draw();
      }
    });
    const geom = () => {
      const pf = pawn & 7, pr = pawn >> 3, eff = pr === 1 ? 2 : pr;
      const need = 7 - eff, start = eff, side = need;
      const kf = king & 7, kr = king >> 3;
      const d = Math.max(Math.abs(kf - pf), Math.abs(7 - kr));
      const catches = turn === 'b' ? d <= need + 1 : d <= need;
      return { pf, pr, start, side, catches, d, need };
    };
    const draw = () => {
      const arr = new Array(64).fill(null); arr[pawn] = 'P'; arr[king] = 'k'; arr[WK] = 'K';
      board.set(arr);
      const G = geom();
      const dir = (king & 7) >= G.pf ? 1 : -1, sqs = [];
      for (let r = G.start; r <= 7; r++) for (let k = 0; k <= G.side; k++) { const f = G.pf + dir * k; if (f >= 0 && f <= 7) sqs.push(r * 8 + f); }
      board.classes('sqr', sqs);
      board.classes('last', []); board.classes('kmate', []);
      const inside = G.d <= G.need;
      verdict.innerHTML = G.catches
        ? '<b>Caught.</b> ' + (inside ? 'The king stands inside the square' + (turn === 'w' ? ', which is enough even with White moving first.' : '.') : 'The king is outside, but Black moves first and can step straight into the square.')
        : '<b>The pawn queens.</b> ' + (turn === 'w' ? (inside ? '' : 'With White to move, the king must already be inside the square, and it isn’t.') : 'Even moving first, the king can’t step into the square.');
    };
    const race = async () => {
      if (racing) return; racing = true; $('#sqRace').disabled = true;
      board.classes('sqr', []);
      let pf = pawn & 7, pr = pawn >> 3, kf = king & 7, kr = king >> 3, t = turn, outcome = null, queen = false;
      const render = () => { const a = new Array(64).fill(null); a[WK] = 'K'; a[kr * 8 + kf] = 'k'; if (pr >= 0) a[pr * 8 + pf] = queen ? 'Q' : 'P'; board.set(a); };
      for (let ply = 0; ply < 30 && !outcome; ply++) {
        await wait(620);
        if (t === 'w') {
          const nr = pr === 1 && !(kf === pf && (kr === 2 || kr === 3)) ? 3 : pr + 1;
          if (kf === pf && kr === pr + 1) { /* blocked */ } else pr = nr;
          if (pr === 7) { queen = true; render(); if (Math.max(Math.abs(kf - pf), Math.abs(kr - 7)) <= 1) { await wait(620); kf = pf; kr = 7; pr = -1; render(); outcome = 'caught'; } else outcome = 'queen'; break; }
        } else {
          if (Math.max(Math.abs(kf - pf), Math.abs(kr - pr)) <= 1) { kf = pf; kr = pr; pr = -1; render(); outcome = 'caught'; break; }
          const opts = [];
          for (const [df, dr] of [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]) {
            const f = kf + df, r = kr + dr; if (f < 0 || f > 7 || r < 0 || r > 7) continue;
            if (r === pr + 1 && Math.abs(f - pf) === 1) continue; // attacked by pawn
            if (Math.max(Math.abs(f - 7), r) <= 1) continue; // next to white king
            opts.push([Math.max(Math.abs(f - pf), Math.abs(7 - r)) * 10 + Math.abs(f - pf), f, r]);
          }
          opts.sort((a, b) => a[0] - b[0]); kf = opts[0][1]; kr = opts[0][2];
        }
        render(); t = t === 'w' ? 'b' : 'w';
      }
      verdict.innerHTML = outcome === 'caught' ? '<b>Caught!</b> The king arrived in time, just as the square predicted.' : '<b>Promoted!</b> The pawn outran the king, just as the square predicted.';
      if (outcome === 'queen') board.classes('kmate', []);
      await wait(2200);
      racing = false; $('#sqRace').disabled = false; draw();
    };
    $$('#stSquare .seg button').forEach((b) => b.onclick = () => { if (racing) return; turn = b.dataset.turn; $$('#stSquare .seg button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); draw(); });
    $('#sqRace').onclick = race;
    $('#sqPawn').onclick = () => { if (racing) return; pIdx = (pIdx + 1) % PAWNS.length; pawn = sqOf(PAWNS[pIdx]); if (king === pawn) king = sqOf('h5'); draw(); };
    whenSeen($('#stSquare'), draw);
  })();

  /* ═════════ STUDY 09 · KQ vs K ═════════ */
  (() => {
    const STARTS = ['8/8/8/4k3/8/8/8/Q3K3 w - - 0 1', '8/8/2k5/8/8/8/6Q1/7K w - - 0 1', '8/8/8/8/3k4/8/8/1Q2K3 w - - 0 1', '8/5k2/8/8/8/2K5/8/7Q w - - 0 1'];
    let g, moves = 0, over = false, si = 0;
    const best = { v: store.get('lrn-chess-kqk', null) };
    const msg = $('#kqMsg'), boxOn = $('#kqBox');
    const setMsg = (t, c) => { msg.innerHTML = t; msg.className = 'kq-msg' + (c ? ' ' + c : ''); };
    const board = new Board($('#bdKQK'), { movable: (c) => c === 'w' && !over, onMove: (m) => user(m) });
    const showBox = () => {
      if (!boxOn.checked || over) { board.classes('box', []); return; }
      const k = g.kingSq('b'), save = g.b[k]; g.b[k] = null;
      const seen = new Set([k]), q = [k];
      while (q.length) {
        const s = q.shift();
        for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const f = (s & 7) + df, r = (s >> 3) + dr; if (f < 0 || f > 7 || r < 0 || r > 7) continue;
          const t = r * 8 + f; if (seen.has(t) || (g.b[t] && colorOf(g.b[t]) === 'w') || g.attacked(t, 'w')) continue;
          seen.add(t); q.push(t);
        }
      }
      g.b[k] = save;
      board.classes('box', [...seen]);
    };
    const end = () => {
      const st = g.status();
      if (st === 'checkmate') {
        over = true; board.classes('kmate', [g.kingSq('b')]); board.classes('box', []);
        const nb = best.v == null || moves < best.v; if (nb) { best.v = moves; store.set('lrn-chess-kqk', moves); }
        $('#kqBest').textContent = best.v;
        setMsg(`<b>Checkmate in ${moves} moves.</b> ${moves <= 10 ? 'Superb technique.' : moves <= 20 ? 'Clean and efficient.' : 'Done. Next time, try to shrink the box faster.'}${nb ? ' New best!' : ''}`, 'ok');
        return true;
      }
      if (st === 'stalemate') { over = true; board.classes('box', []); setMsg('<b>Stalemate!</b> Black has no legal move but is not in check, so it’s a draw. Take back and leave the king a square.', 'no'); return true; }
      if (st === 'fifty' || st === 'insufficient' || st === 'repetition') { over = true; setMsg('<b>Draw.</b> ' + (st === 'insufficient' ? 'The queen was lost.' : 'Too many moves without progress.'), 'no'); return true; }
      return false;
    };
    const user = async (m) => {
      const mv = g.play(m); moves++; $('#kqMoves').textContent = moves;
      board.show(g, mv); board.classes('hint', []);
      if (end()) return;
      board.busy = true;
      await wait(380);
      const list = g.analyse(3);
      const r = g.play(list[0].m);
      board.show(g, r); board.busy = false;
      showBox();
      if (g.b.indexOf('Q') < 0) { setMsg('Your queen was captured. Take back and keep the queen protected or out of reach.', 'no'); over = true; return; }
      const free = g.moves().length;
      setMsg(free <= 2 ? 'The box is tiny. Bring your king closer, and mind the stalemate.' : g.inCheck('b') ? 'Check. Remember: checks only help if they shrink the box.' : 'Keep shrinking the box. Stay a knight’s move from the king.');
    };
    const load = (fen) => { g = new C(fen); moves = 0; over = false; board.game = g; board.clearMarks(); board.set(g.b); $('#kqMoves').textContent = 0; setMsg('Shrink the box.'); showBox(); };
    $('#kqBest').textContent = best.v == null ? '—' : best.v;
    $('#kqNew').onclick = () => { si = (si + 1) % STARTS.length; load(STARTS[si]); };
    $('#kqUndo').onclick = () => {
      if (board.busy || !g.hist.length) return;
      g.undo(); if (g.turn === 'b' && g.hist.length) g.undo();
      if (g.turn !== 'w') { g.undo(); }
      moves = Math.max(0, moves - 1); over = false; $('#kqMoves').textContent = moves;
      const last = g.hist.length ? g.hist[g.hist.length - 1].m : null;
      board.clearMarks(); board.show(g, last); showBox(); setMsg('Taken back. Your move.');
    };
    $('#kqHint').onclick = () => {
      if (over || board.busy) return;
      const m = g.mateIn(1) || g.mateIn(2) || g.analyse(3).filter((x) => { g.make(x.m); const st = g.moves().length; g.unmake(); return st > 0 || g.inCheck(); })[0].m;
      board.arrows([{ from: m.from, to: m.to, color: 'rgba(79,138,91,.9)' }]); setTimeout(() => board.arrows([]), 2200);
    };
    boxOn.onchange = showBox;
    whenSeen($('#stKQK'), () => load(STARTS[0]));
  })();

  /* ═════════ STUDY 10 · ELO ═════════ */
  (() => {
    const me = $('#eloMe'), op = $('#eloOp'), svg = $('#eloSvg');
    let K = 20;
    const E = (d) => 1 / (1 + Math.pow(10, -d / 400));
    const W = 560, H = 330, L = 52, R = 18, T = 18, B = 44;
    const x = (d) => L + (d + 800) / 1600 * (W - L - R), y = (v) => T + (1 - v) * (H - T - B);
    const g0 = sv('g', {});
    for (const v of [0, .25, .5, .75, 1]) {
      g0.append(sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: 'rgba(244,236,220,.12)', 'stroke-dasharray': v === .5 ? '0' : '3 5' }));
      const t = sv('text', { x: L - 10, y: y(v) + 4, 'text-anchor': 'end', fill: 'rgba(244,236,220,.55)', 'font-size': 12, 'font-family': 'IBM Plex Mono' }); t.textContent = Math.round(v * 100) + '%'; g0.append(t);
    }
    for (const d of [-800, -400, 0, 400, 800]) {
      g0.append(sv('line', { x1: x(d), x2: x(d), y1: T, y2: H - B, stroke: 'rgba(244,236,220,.08)' }));
      const t = sv('text', { x: x(d), y: H - B + 22, 'text-anchor': 'middle', fill: 'rgba(244,236,220,.55)', 'font-size': 12, 'font-family': 'IBM Plex Mono' }); t.textContent = (d > 0 ? '+' : '') + d; g0.append(t);
    }
    const lab = sv('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle', fill: 'rgba(244,236,220,.55)', 'font-size': 11, 'font-family': 'IBM Plex Mono' }); lab.textContent = 'Your rating minus opponent’s'; g0.append(lab);
    let dpath = ''; for (let d = -800; d <= 800; d += 10) dpath += (d === -800 ? 'M' : 'L') + x(d).toFixed(1) + ' ' + y(E(d)).toFixed(1);
    const curve = sv('path', { d: dpath, fill: 'none', stroke: '#ecd39a', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
    const area = sv('path', { d: dpath + `L${x(800)} ${y(0)} L${x(-800)} ${y(0)} Z`, fill: 'rgba(201,162,90,.1)' });
    const vline = sv('line', { stroke: '#c9a25a', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 }), hline = sv('line', { stroke: '#c9a25a', 'stroke-dasharray': '4 4', 'stroke-width': 1.5 });
    const dot = sv('circle', { r: 7, fill: '#ecd39a', stroke: '#1a110b', 'stroke-width': 2.5 });
    const hv = sv('line', { stroke: 'rgba(244,236,220,.45)', 'stroke-width': 1, opacity: 0, y1: T, y2: H - B });
    const hd = sv('circle', { r: 5, fill: '#fff', stroke: '#1a110b', 'stroke-width': 2, opacity: 0 });
    const hit = sv('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' });
    svg.append(g0, area, curve, vline, hline, dot, hv, hd, hit);
    const upd = () => {
      const a = +me.value, b = +op.value, d = clamp(a - b, -800, 800), e = E(a - b);
      $('#eloMeV').textContent = a; $('#eloOpV').textContent = b;
      $('#eloExp').textContent = Math.round(e * 100) + '%';
      const f = (r) => { const v = Math.round(K * (r - e)); return (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v); };
      $('#eloW').textContent = f(1); $('#eloD').textContent = f(.5); $('#eloL').textContent = f(0);
      dot.setAttribute('cx', x(d)); dot.setAttribute('cy', y(E(d)));
      vline.setAttribute('x1', x(d)); vline.setAttribute('x2', x(d)); vline.setAttribute('y1', y(E(d))); vline.setAttribute('y2', H - B);
      hline.setAttribute('x1', L); hline.setAttribute('x2', x(d)); hline.setAttribute('y1', y(E(d))); hline.setAttribute('y2', y(E(d)));
    };
    hit.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W;
      const d = clamp(Math.round(((px - L) / (W - L - R) * 1600 - 800) / 10) * 10, -800, 800);
      hv.setAttribute('x1', x(d)); hv.setAttribute('x2', x(d)); hv.setAttribute('opacity', 1);
      hd.setAttribute('cx', x(d)); hd.setAttribute('cy', y(E(d))); hd.setAttribute('opacity', 1);
      showTip(`<b>${d > 0 ? '+' : ''}${d}</b> rating gap<br>Expected score <b>${(E(d) * 100).toFixed(1)}%</b>`, ev.clientX, ev.clientY);
    });
    hit.addEventListener('pointerleave', () => { hv.setAttribute('opacity', 0); hd.setAttribute('opacity', 0); hideTip(); });
    me.oninput = op.oninput = upd;
    $$('#stElo .seg button').forEach((b) => b.onclick = () => { K = +b.dataset.k; $$('#stElo .seg button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); upd(); });
    upd();
  })();

  /* ═════════ STUDY 11 · THE COACH BOT ═════════ */
  (() => {
    const status = $('#botStatus'), coach = $('#botCoach'), listEl = $('#botMoves');
    let g, side = 'w', level = 2, thinking = false, pre = null, holding = false, over = false, token = 0;
    const board = new Board($('#bdBot'), { movable: (c) => c === side && !thinking && !holding && !over, onMove: (m) => userMove(m) });
    const setStatus = (t, think) => { status.textContent = t; status.classList.toggle('think', !!think); };
    const START = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const captured = () => {
      const count = { w: {}, b: {} };
      for (const p of g.b) if (p && typeOf(p) !== 'k') { const c = colorOf(p), t = typeOf(p); count[c][t] = (count[c][t] || 0) + 1; }
      const lost = (c) => { const out = []; for (const t of 'qrbnp') for (let i = 0; i < Math.max(0, START[t] - (count[c][t] || 0)); i++) out.push(c + t); return out; };
      const diff = (g.material('w') - g.material('b')) / 100;
      const top = side === 'w' ? 'b' : 'w';
      const row = (host, c) => { // pieces captured BY colour c
        const opp = c === 'w' ? 'b' : 'w'; const ls = lost(opp);
        const adv = c === 'w' ? diff : -diff;
        host.innerHTML = ls.map((x) => `<span class="ic">${icon(x)}</span>`).join('') + (adv > 0 ? `<em>+${Math.round(adv)}</em>` : '');
      };
      row($('#botCapTop'), top); row($('#botCapBot'), side);
    };
    const renderMoves = () => {
      listEl.innerHTML = '';
      g.hist.forEach((h, i) => {
        const li = el('li');
        if (i % 2 === 0) li.append(el('span', 'n', (i / 2 + 1) + '.'));
        const b = el('button', '', h.m.san || '?'); li.append(b); listEl.append(li);
      });
      const last = $('li:last-child button', listEl); if (last) last.classList.add('on');
      listEl.scrollTop = listEl.scrollHeight;
    };
    const lastMove = () => (g.hist.length ? g.hist[g.hist.length - 1].m : null);
    const refresh = (anim = true) => { board.show(g, lastMove(), anim); captured(); renderMoves(); };
    const checkEnd = () => {
      const st = g.status(); if (!st) return false;
      over = true;
      const loser = g.turn;
      const txt = st === 'checkmate' ? (loser === side ? 'Checkmate. The coach wins this one. Take back a few moves, or start again.' : 'Checkmate! You win. Beautifully done.')
        : st === 'stalemate' ? 'Stalemate: a draw.' : st === 'repetition' ? 'Draw by threefold repetition.' : st === 'fifty' ? 'Draw by the fifty-move rule.' : 'Draw: not enough material to mate.';
      if (st === 'checkmate') board.classes('kmate', [g.kingSq(loser)]);
      setStatus(txt);
      return true;
    };
    const prepare = () => { pre = null; const t = token; setTimeout(() => { if (t === token && g.turn === side && !over) pre = g.analyse(2); }, 60); };
    const botMove = () => {
      if (over) return;
      thinking = true; setStatus('The coach is thinking', true);
      const t = ++token;
      setTimeout(() => {
        if (t !== token) return;
        const depth = level === 1 ? 1 : level === 2 ? 2 : 3, noise = level === 1 ? 140 : level === 2 ? 25 : 0;
        const m = g.best(depth, noise);
        if (!m) { thinking = false; return; }
        g.play(m); thinking = false; refresh();
        if (!checkEnd()) { setStatus(`${m.san}. Your move.`); prepare(); }
      }, 350);
    };
    const userMove = (m) => {
      const san = g.san(m);
      let warn = null;
      if ($('#botCoachOn').checked) {
        const list = pre || g.analyse(2);
        const mine = list.find((x) => x.m.from === m.from && x.m.to === m.to && x.m.promo === m.promo);
        const top = list[0];
        if (mine && top && top.score - mine.score >= 170 && top.score < 50000) warn = { drop: Math.round((top.score - mine.score) / 100), best: g.san(top.m) };
      }
      g.play(m); refresh(); coach.hidden = true;
      if (checkEnd()) return;
      if (warn) {
        holding = true;
        const rep = g.analyse(2)[0];
        const opp = g.turn === 'w' ? 'White' : 'Black';
        const why = rep && rep.m.captured ? `It lets ${opp} play <b>${g.san(rep.m)}</b>, winning your ${NAMES[typeOf(rep.m.captured)]}.` : rep && rep.score > 50000 ? `It allows a forced checkmate, starting with <b>${g.san(rep.m)}</b>.` : `It lets ${opp} reply <b>${g.san(rep.m)}</b> with a big advantage.`;
        coach.hidden = false;
        coach.innerHTML = `<b>Coach:</b> careful with ${san}. ${why} ${warn.best !== san ? `<b>${warn.best}</b> was safer.` : ''}<div class="btns"><button class="btn gold" id="cbBack">Take it back</button><button class="btn" id="cbOn">Play on</button></div>`;
        setStatus('Hold on a second…');
        $('#cbBack').onclick = () => { g.undo(); holding = false; coach.hidden = true; refresh(false); setStatus('Taken back. Your move.'); prepare(); };
        $('#cbOn').onclick = () => { holding = false; coach.hidden = true; botMove(); };
        return;
      }
      botMove();
    };
    const newGame = () => {
      token++; g = new C(); thinking = false; holding = false; over = false; coach.hidden = true; board.game = g;
      board.clearMarks(); board.arrows([]); board.setFlip(side === 'b'); refresh(false);
      if (side === 'b') botMove(); else { setStatus('Your move. You play White.'); prepare(); }
    };
    $('#botNew').onclick = newGame;
    $('#botFlip').onclick = () => board.setFlip(!board.flip);
    $('#botUndo').onclick = () => {
      if (thinking || !g.hist.length) return;
      token++; holding = false; coach.hidden = true; over = false; board.classes('kmate', []);
      g.undo(); if (g.turn !== side && g.hist.length) g.undo();
      if (g.turn !== side) { botMove(); return; }
      refresh(); setStatus('Taken back. Your move.'); prepare();
    };
    $('#botHint').onclick = () => {
      if (thinking || over || g.turn !== side) return;
      const m = (pre || g.analyse(2))[0].m;
      board.arrows([{ from: m.from, to: m.to, color: 'rgba(79,138,91,.9)' }]); setTimeout(() => board.arrows([]), 2500);
      setStatus('Hint: consider ' + g.san(m) + '.');
    };
    $$('#botLevel button').forEach((b) => b.onclick = () => { level = +b.dataset.lv; $$('#botLevel button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); });
    $$('#botSide button').forEach((b) => b.onclick = () => { side = b.dataset.side; $$('#botSide button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); newGame(); });
    whenSeen($('#stBot'), newGame);
  })();

  /* ═════════ STUDY 12 · MYTHS ═════════ */
  (() => {
    let i = 0, score = 0, answered = false;
    const order = D.myths;
    const show = () => {
      const m = order[i]; answered = false;
      $('#myN').textContent = `${i + 1} / ${order.length}`;
      $('#myQ').textContent = '“' + m.q + '”';
      $('#myA').hidden = true;
      $$('.my-btns .btn').forEach((b) => { b.classList.remove('pick-ok', 'pick-no'); b.disabled = false; });
    };
    $$('.my-btns .btn').forEach((b) => b.onclick = () => {
      if (answered) return; answered = true;
      const m = order[i], ok = b.dataset.a === m.a; if (ok) score++;
      $$('.my-btns .btn').forEach((x) => { x.disabled = true; if (x.dataset.a === m.a) x.classList.add('pick-ok'); else if (x === b) x.classList.add('pick-no'); });
      $('#myVerdict').textContent = (ok ? 'Right: ' : 'Not quite: ') + m.a + '.';
      $('#myR').textContent = m.r; $('#myA').hidden = false;
      $('#myScore').textContent = `Score: ${score} / ${i + 1}`;
      $('#myNext').textContent = i === order.length - 1 ? 'Start over' : 'Next';
    });
    $('#myNext').onclick = () => { if (i === order.length - 1) { i = 0; score = 0; $('#myScore').textContent = ''; } else i++; show(); };
    show();
  })();

  /* ═════════ STUDY 13 · PLAN ═════════ */
  (() => {
    const KEY = 'lrn-chess-12';
    let st = store.get(KEY, {});
    const weeks = $('#planWeeks'), file = $('#planFile');
    for (let i = 0; i < 8; i++) file.append(el('div', 's'));
    const pp = el('div', 'pp', icon('wp')); file.append(pp);
    const RANKS = ['Beginner', 'Learner', 'Improver', 'Tactician', 'Competitor', 'Club player', 'Club player ♛'];
    const total = D.plan.length * 3;
    D.plan.forEach((w, wi) => {
      const box = el('div', 'wk'); box.append(el('h5', '', 'Week ' + (wi + 1)));
      w.forEach((t, ti) => {
        const id = wi + '-' + ti, lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!st[id];
        cb.onchange = () => { if (cb.checked) st[id] = 1; else delete st[id]; store.set(KEY, st); upd(); };
        lab.append(cb, el('span', '', t)); box.append(lab);
      });
      weeks.append(box);
    });
    let wasQ = false;
    const upd = () => {
      const n = Object.keys(st).length, k = n / total;
      $('#planPct').textContent = Math.round(k * 100) + '%';
      $('#planRank').textContent = RANKS[Math.min(RANKS.length - 1, Math.floor(k * (RANKS.length - 1) + 1e-9))];
      const rank = Math.round(k * 7);
      const mobile = matchMedia('(max-width: 600px)').matches;
      if (mobile) { pp.style.left = (rank * 12.5) + '%'; pp.style.top = '0'; } else { pp.style.top = ((7 - rank) * 12.5) + '%'; pp.style.left = '0'; }
      const q = k >= 1;
      if (q !== wasQ) { pp.innerHTML = icon(q ? 'wq' : 'wp'); pp.classList.toggle('q', q); wasQ = q; }
      $$('.wk', weeks).forEach((w, wi) => w.classList.toggle('done', [0, 1, 2].every((ti) => st[wi + '-' + ti])));
    };
    $('#planReset').onclick = () => { st = {}; store.set(KEY, st); $$('input', weeks).forEach((c) => { c.checked = false; }); upd(); };
    addEventListener('resize', upd);
    upd();
  })();
})();

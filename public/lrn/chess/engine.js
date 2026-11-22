/* lrn — The Long Game: a small, complete chess engine (rules + search). */
(function (root) {
  'use strict';
  const FILES = 'abcdefgh';
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  const N8 = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const K8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const sqName = (s) => FILES[s & 7] + ((s >> 3) + 1);
  const sqOf = (n) => FILES.indexOf(n[0]) + (parseInt(n[1], 10) - 1) * 8;
  const colorOf = (p) => (p === p.toUpperCase() ? 'w' : 'b');
  const typeOf = (p) => p.toLowerCase();
  const onB = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;

  /* piece-square tables, written from White's side with rank 8 first */
  const PST_RAW = {
    p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
    ke: [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
  };
  const PST = {};
  for (const k in PST_RAW) { PST[k] = new Array(64); for (let i = 0; i < 64; i++) { const r = 7 - (i >> 3), f = i & 7; PST[k][r * 8 + f] = PST_RAW[k][i]; } }

  class Chess {
    constructor(fen) { this.load(fen || Chess.START); }
    load(fen) {
      const [pos, turn, cast, ep, half, full] = fen.trim().split(/\s+/);
      this.b = new Array(64).fill(null);
      let r = 7, f = 0;
      for (const ch of pos) {
        if (ch === '/') { r--; f = 0; } else if (/\d/.test(ch)) f += +ch; else { this.b[r * 8 + f] = ch; f++; }
      }
      this.turn = turn || 'w';
      this.castle = { K: false, Q: false, k: false, q: false };
      if (cast && cast !== '-') for (const c of cast) this.castle[c] = true;
      this.ep = ep && ep !== '-' ? sqOf(ep) : -1;
      this.half = +(half || 0); this.full = +(full || 1);
      this.hist = []; this.keys = [this.key()];
      return this;
    }
    clone() { const c = new Chess(this.fen()); c.keys = this.keys.slice(); return c; }
    fen() {
      let s = '';
      for (let r = 7; r >= 0; r--) {
        let e = 0;
        for (let f = 0; f < 8; f++) { const p = this.b[r * 8 + f]; if (!p) e++; else { if (e) { s += e; e = 0; } s += p; } }
        if (e) s += e; if (r) s += '/';
      }
      const c = ['K', 'Q', 'k', 'q'].filter((k) => this.castle[k]).join('') || '-';
      return `${s} ${this.turn} ${c} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
    }
    key() { return this.fen().split(' ').slice(0, 4).join(' '); }
    get(sq) { return this.b[typeof sq === 'string' ? sqOf(sq) : sq]; }
    kingSq(c) { return this.b.indexOf(c === 'w' ? 'K' : 'k'); }
    attacked(sq, by) {
      const f0 = sq & 7, r0 = sq >> 3, b = this.b, W = by === 'w';
      const pr = r0 + (W ? -1 : 1);
      for (const df of [-1, 1]) { const f = f0 + df; if (onB(f, pr) && b[pr * 8 + f] === (W ? 'P' : 'p')) return true; }
      for (const [df, dr] of N8) { const f = f0 + df, r = r0 + dr; if (onB(f, r) && b[r * 8 + f] === (W ? 'N' : 'n')) return true; }
      for (const [df, dr] of K8) { const f = f0 + df, r = r0 + dr; if (onB(f, r) && b[r * 8 + f] === (W ? 'K' : 'k')) return true; }
      const slide = (dirs, a, c) => {
        for (const [df, dr] of dirs) {
          let f = f0 + df, r = r0 + dr;
          while (onB(f, r)) { const p = b[r * 8 + f]; if (p) { if (p === a || p === c) return true; break; } f += df; r += dr; }
        }
        return false;
      };
      return slide(DIAG, W ? 'B' : 'b', W ? 'Q' : 'q') || slide(ORTH, W ? 'R' : 'r', W ? 'Q' : 'q');
    }
    /* squares of `by` pieces that attack sq */
    attackers(sq, by) {
      const out = [];
      for (let s = 0; s < 64; s++) { const p = this.b[s]; if (p && colorOf(p) === by && this.pieceAttacks(s).includes(sq)) out.push(s); }
      return out;
    }
    pieceAttacks(s) {
      const p = this.b[s]; if (!p) return [];
      const t = typeOf(p), c = colorOf(p), f0 = s & 7, r0 = s >> 3, out = [];
      if (t === 'p') { const dr = c === 'w' ? 1 : -1; for (const df of [-1, 1]) if (onB(f0 + df, r0 + dr)) out.push((r0 + dr) * 8 + f0 + df); return out; }
      if (t === 'n' || t === 'k') { for (const [df, dr] of (t === 'n' ? N8 : K8)) if (onB(f0 + df, r0 + dr)) out.push((r0 + dr) * 8 + f0 + df); return out; }
      const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
      for (const [df, dr] of dirs) { let f = f0 + df, r = r0 + dr; while (onB(f, r)) { out.push(r * 8 + f); if (this.b[r * 8 + f]) break; f += df; r += dr; } }
      return out;
    }
    inCheck(c) { c = c || this.turn; const k = this.kingSq(c); return k >= 0 && this.attacked(k, c === 'w' ? 'b' : 'w'); }
    pseudo(capsOnly) {
      const out = [], b = this.b, me = this.turn, them = me === 'w' ? 'b' : 'w';
      const add = (from, to, flag, promo) => {
        const cap = flag === 'ep' ? (me === 'w' ? 'p' : 'P') : b[to];
        if (capsOnly && !cap && !promo) return;
        out.push({ from, to, piece: b[from], captured: cap || null, flag: flag || '', promo: promo || null });
      };
      for (let s = 0; s < 64; s++) {
        const p = b[s]; if (!p || colorOf(p) !== me) continue;
        const t = typeOf(p), f0 = s & 7, r0 = s >> 3;
        if (t === 'p') {
          const dr = me === 'w' ? 1 : -1, start = me === 'w' ? 1 : 6, last = me === 'w' ? 7 : 0, r1 = r0 + dr;
          const push = (to, flag) => { if ((to >> 3) === last) { for (const q of 'qrbn') add(s, to, flag, me === 'w' ? q.toUpperCase() : q); } else add(s, to, flag); };
          if (onB(f0, r1) && !b[r1 * 8 + f0]) {
            push(r1 * 8 + f0);
            if (r0 === start && !b[(r0 + 2 * dr) * 8 + f0] && !capsOnly) add(s, (r0 + 2 * dr) * 8 + f0, 'double');
          }
          for (const df of [-1, 1]) {
            const f = f0 + df; if (!onB(f, r1)) continue; const to = r1 * 8 + f;
            if (b[to] && colorOf(b[to]) === them) push(to);
            else if (to === this.ep) add(s, to, 'ep');
          }
          continue;
        }
        if (t === 'n' || t === 'k') {
          for (const [df, dr] of (t === 'n' ? N8 : K8)) {
            const f = f0 + df, r = r0 + dr; if (!onB(f, r)) continue; const to = r * 8 + f;
            if (!b[to] || colorOf(b[to]) === them) add(s, to);
          }
          if (t === 'k' && !capsOnly) {
            const W = me === 'w', home = W ? 4 : 60;
            if (s === home && !this.attacked(home, them)) {
              if (this.castle[W ? 'K' : 'k'] && !b[home + 1] && !b[home + 2] && b[home + 3] === (W ? 'R' : 'r') && !this.attacked(home + 1, them) && !this.attacked(home + 2, them)) add(s, home + 2, 'castle');
              if (this.castle[W ? 'Q' : 'q'] && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === (W ? 'R' : 'r') && !this.attacked(home - 1, them) && !this.attacked(home - 2, them)) add(s, home - 2, 'castle');
            }
          }
          continue;
        }
        const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
        for (const [df, dr] of dirs) {
          let f = f0 + df, r = r0 + dr;
          while (onB(f, r)) { const to = r * 8 + f; if (b[to]) { if (colorOf(b[to]) === them) add(s, to); break; } add(s, to); f += df; r += dr; }
        }
      }
      return out;
    }
    make(m) {
      const b = this.b, me = this.turn;
      this.hist.push({ m, castle: { ...this.castle }, ep: this.ep, half: this.half, full: this.full });
      b[m.to] = m.promo || m.piece; b[m.from] = null;
      if (m.flag === 'ep') b[m.to + (me === 'w' ? -8 : 8)] = null;
      if (m.flag === 'castle') {
        if (m.to > m.from) { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = null; } else { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = null; }
      }
      const t = typeOf(m.piece);
      if (t === 'k') { if (me === 'w') this.castle.K = this.castle.Q = false; else this.castle.k = this.castle.q = false; }
      for (const [sq, k] of [[0, 'Q'], [7, 'K'], [56, 'q'], [63, 'k']]) if (m.from === sq || m.to === sq) this.castle[k] = false;
      this.ep = m.flag === 'double' ? (m.from + m.to) / 2 : -1;
      this.half = t === 'p' || m.captured ? 0 : this.half + 1;
      if (me === 'b') this.full++;
      this.turn = me === 'w' ? 'b' : 'w';
    }
    unmake() {
      const h = this.hist.pop(); if (!h) return null;
      const m = h.m, b = this.b;
      this.turn = this.turn === 'w' ? 'b' : 'w';
      const me = this.turn;
      b[m.from] = m.piece; b[m.to] = m.flag === 'ep' ? null : m.captured;
      if (m.flag === 'ep') b[m.to + (me === 'w' ? -8 : 8)] = m.captured;
      if (m.flag === 'castle') {
        if (m.to > m.from) { b[m.from + 3] = b[m.from + 1]; b[m.from + 1] = null; } else { b[m.from - 4] = b[m.from - 1]; b[m.from - 1] = null; }
      }
      this.castle = h.castle; this.ep = h.ep; this.half = h.half; this.full = h.full;
      return m;
    }
    moves(opts) {
      const me = this.turn, out = [];
      for (const m of this.pseudo(opts && opts.caps)) { this.make(m); if (!this.inCheck(me)) out.push(m); this.unmake(); }
      if (opts && opts.from != null) return out.filter((m) => m.from === opts.from);
      return out;
    }
    san(m, legal) {
      legal = legal || this.moves();
      let s;
      const t = typeOf(m.piece);
      if (m.flag === 'castle') s = m.to > m.from ? 'O-O' : 'O-O-O';
      else {
        const cap = !!m.captured;
        if (t === 'p') s = (cap ? FILES[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
        else {
          const others = legal.filter((o) => o.piece === m.piece && o.to === m.to && o.from !== m.from);
          let dis = '';
          if (others.length) {
            const sameF = others.some((o) => (o.from & 7) === (m.from & 7)), sameR = others.some((o) => (o.from >> 3) === (m.from >> 3));
            dis = !sameF ? FILES[m.from & 7] : !sameR ? String((m.from >> 3) + 1) : sqName(m.from);
          }
          s = t.toUpperCase() + dis + (cap ? 'x' : '') + sqName(m.to);
        }
      }
      this.make(m);
      if (this.inCheck()) s += this.moves().length ? '+' : '#';
      this.unmake();
      return s;
    }
    moveSAN(str) {
      const clean = (x) => x.replace(/[+#!?]/g, '').replace(/0/g, 'O');
      const legal = this.moves();
      const m = legal.find((mv) => clean(this.san(mv, legal)) === clean(str));
      if (!m) throw new Error('Illegal SAN ' + str + ' in ' + this.fen());
      return m;
    }
    /* public move: records repetition keys and returns the move with its SAN */
    play(m) {
      if (typeof m === 'string') m = this.moveSAN(m);
      const s = this.san(m); this.make(m); this.keys.push(this.key()); m.san = s; return m;
    }
    undo() { const m = this.unmake(); if (m) this.keys.pop(); return m; }
    status() {
      const legal = this.moves();
      if (!legal.length) return this.inCheck() ? 'checkmate' : 'stalemate';
      if (this.half >= 100) return 'fifty';
      const k = this.key(); if (this.keys.filter((x) => x === k).length >= 3) return 'repetition';
      if (this.insufficient()) return 'insufficient';
      return null;
    }
    insufficient() {
      const ps = this.b.filter((p) => p && typeOf(p) !== 'k');
      return !ps.length || (ps.length === 1 && 'nb'.includes(typeOf(ps[0])));
    }
    material(c) { let s = 0; for (const p of this.b) if (p && colorOf(p) === c) s += VAL[typeOf(p)]; return s; }

    /* ── evaluation & search ── */
    evaluate() { // side-to-move perspective
      let s = 0, nonPawn = 0;
      for (const p of this.b) if (p && 'nbrq'.includes(typeOf(p))) nonPawn += VAL[typeOf(p)];
      const endgame = nonPawn <= 1600;
      for (let i = 0; i < 64; i++) {
        const p = this.b[i]; if (!p) continue;
        const t = typeOf(p), w = colorOf(p) === 'w';
        const idx = w ? i : ((7 - (i >> 3)) * 8 + (i & 7));
        const tbl = t === 'k' ? (endgame ? PST.ke : PST.k) : PST[t];
        const v = VAL[t] + tbl[idx];
        s += w ? v : -v;
      }
      if (endgame) { // herd a lone king to the edge when clearly ahead
        const wk = this.kingSq('w'), bk = this.kingSq('b');
        const dist = Math.max(Math.abs((wk & 7) - (bk & 7)), Math.abs((wk >> 3) - (bk >> 3)));
        const mat = this.material('w') - this.material('b');
        const edge = (k) => Math.max(3 - (k & 7), (k & 7) - 4) + Math.max(3 - (k >> 3), (k >> 3) - 4);
        if (mat > 300) s += edge(bk) * 14 + (14 - dist) * 6;
        if (mat < -300) s -= edge(wk) * 14 + (14 - dist) * 6;
      }
      return this.turn === 'w' ? s : -s;
    }
    order(ms) {
      for (const m of ms) m._o = (m.captured ? 10 * VAL[typeOf(m.captured)] - VAL[typeOf(m.piece)] + 1000 : 0) + (m.promo ? 800 : 0);
      return ms.sort((a, b) => b._o - a._o);
    }
    quiesce(alpha, beta, depth) {
      this.nodes++;
      const stand = this.evaluate();
      if (stand >= beta) return beta;
      if (alpha < stand) alpha = stand;
      if (depth <= 0) return alpha;
      const me = this.turn;
      for (const m of this.order(this.pseudo(true))) {
        this.make(m);
        if (this.inCheck(me)) { this.unmake(); continue; }
        const sc = -this.quiesce(-beta, -alpha, depth - 1);
        this.unmake();
        if (sc >= beta) return beta;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }
    negamax(depth, alpha, beta, ply) {
      this.nodes++;
      if (depth <= 0) return this.quiesce(alpha, beta, 6);
      const me = this.turn, ms = this.order(this.pseudo());
      let legal = 0, best = -Infinity;
      for (const m of ms) {
        this.make(m);
        if (this.inCheck(me)) { this.unmake(); continue; }
        legal++;
        const sc = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
        this.unmake();
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (alpha >= beta) break;
      }
      if (!legal) return this.inCheck(me) ? -100000 + ply : 0;
      return best;
    }
    /* score every root move, best first */
    analyse(depth) {
      this.nodes = 0;
      const me = this.turn, out = [];
      for (const m of this.order(this.pseudo())) {
        this.make(m);
        if (this.inCheck(me)) { this.unmake(); continue; }
        const k = this.key();
        const sc = this.keys.filter((x) => x === k).length >= 2 ? 0 : -this.negamax(depth - 1, -Infinity, Infinity, 1);
        this.unmake();
        out.push({ m, score: sc });
      }
      return out.sort((a, b) => b.score - a.score);
    }
    best(depth, noise) {
      const list = this.analyse(depth);
      if (!list.length) return null;
      const top = list[0].score;
      const pool = list.filter((x) => x.score >= top - (noise || 0));
      return pool[Math.floor(Math.random() * pool.length)].m;
    }
    /* forced mate for the side to move within n of its moves? returns the move */
    mateIn(n) {
      for (const m of this.moves()) { this.make(m); const ok = this.forcedMate(n - 1); this.unmake(); if (ok) return m; }
      return null;
    }
    forcedMate(n) {
      const replies = this.moves();
      if (!replies.length) return this.inCheck();
      if (n <= 0) return false;
      for (const r of replies) { this.make(r); const m = this.mateIn(n); this.unmake(); if (!m) return false; }
      return true;
    }
    perft(d) { if (!d) return 1; let n = 0; for (const m of this.moves()) { this.make(m); n += this.perft(d - 1); this.unmake(); } return n; }
  }
  Chess.START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  Chess.sqName = sqName; Chess.sqOf = sqOf; Chess.colorOf = colorOf; Chess.typeOf = typeOf; Chess.VAL = VAL;
  if (typeof module !== 'undefined' && module.exports) module.exports = Chess; else root.Chess = Chess;
})(typeof window !== "undefined" ? window : globalThis);

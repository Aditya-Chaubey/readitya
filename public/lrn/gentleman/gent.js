/* lrn — Well Suited. Every figure on this page is drawn in code by man() below. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let UID = 0;

  /* ═════════════ palette ═════════════ */
  const C = {
    navy: '#1f2b47', navy2: '#24325a', charcoal: '#36393f', grey: '#8b8f96', lgrey: '#a9adb3', black: '#151518',
    camel: '#b98b55', tweed: '#7d6a4c', brown: '#5b3a24', dbrown: '#3f2717', tan: '#8a5a34', khaki: '#c8b48a',
    stone: '#d9ccb2', olive: '#5f6446', indigo: '#28385a', white: '#f7f5f0', blue: '#c3d4ea', pink: '#efcfca',
    cream: '#efe5cf', oat: '#cdbb9c', burgundy: '#6f1d2b', forest: '#2e4a3b', bottle: '#24412f', sky: '#9fb7d4',
  };
  const SKIN = ['#f1c9a8', '#dca983', '#b98159', '#8a5a3c', '#5d3a26'];
  const HAIR = { dark: '#231812', black: '#141010', brown: '#5e3f27', fair: '#b58b55', grey: '#9a958e' };

  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(hex) { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
  function shade(hex, amt) {
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    const [r, g, b] = rgb(hex).map((c) => Math.round((t - c) * p + c));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ═════════════ fabric patterns ═════════════ */
  function patDef(id, kind, base, sc = 1, inkOver) {
    const ink = inkOver || (lum(base) > 0.55 ? 'rgba(20,24,40,.2)' : 'rgba(255,255,255,.22)');
    const m = [1, 1.75, 2.9][sc - 1] || 1;
    let w = 6, h = 6, body = '', tr = '';
    switch (kind) {
      case 'pin': w = 5 * m; h = 10; body = `<path d="M${w / 2} 0V${h}" stroke="${ink}" stroke-width=".55"/>`; break;
      case 'chalk': w = 8 * m; h = 10; body = `<path d="M${w / 2} 0V${h}" stroke="${ink}" stroke-width="1.1" stroke-dasharray="2.2 1.1"/>`; break;
      case 'check': w = h = 13 * m; body = `<path d="M${w / 2} 0V${h}M0 ${h / 2}H${w}" stroke="${ink}" stroke-width=".7"/>`; break;
      case 'tweed': w = h = 5; body = `<path d="M0 0L2.5 2.5L0 5M2.5 0L5 2.5L2.5 5" stroke="${ink}" stroke-width=".55" fill="none"/><circle cx="1" cy="3.6" r=".45" fill="rgba(200,120,60,.35)"/>`; break;
      case 'stripe': w = 3.2 * m; h = 10; body = `<rect width="${w * 0.34}" height="${h}" fill="${ink}"/>`; break;
      case 'gingham': w = h = 3.4 * m; body = `<rect width="${w / 2}" height="${h}" fill="${ink}"/><rect width="${w}" height="${h / 2}" fill="${ink}"/>`; break;
      case 'dot': w = h = 4.6 * m; body = `<circle cx="${w / 2}" cy="${h / 2}" r="${0.55 * m + 0.25}" fill="${ink}"/>`; break;
      case 'repp': w = h = 6 * m; tr = ' patternTransform="rotate(-40)"'; body = `<rect width="${w}" height="${h * 0.32}" fill="${ink}"/>`; break;
      case 'foulard': w = h = 7 * m; body = `<g fill="${ink}"><rect x="${w / 2 - 0.9 * m}" y="${h / 2 - 0.9 * m}" width="${1.8 * m}" height="${1.8 * m}" transform="rotate(45 ${w / 2} ${h / 2})"/><circle r="${0.5 * m}"/><circle cx="${w}" r="${0.5 * m}"/><circle cy="${h}" r="${0.5 * m}"/><circle cx="${w}" cy="${h}" r="${0.5 * m}"/></g>`; break;
      case 'rib': w = 2.4; h = 10; body = `<path d="M1.2 0V10" stroke="rgba(0,0,0,.12)" stroke-width=".8"/>`; break;
      case 'denim': w = h = 3; body = `<path d="M0 3L3 0" stroke="rgba(255,255,255,.08)" stroke-width=".6"/>`; break;
      case 'knitrib': w = 10; h = 2.2; body = `<path d="M0 1.1H10" stroke="rgba(0,0,0,.16)" stroke-width=".7"/>`; break;
      default: return '';
    }
    return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${tr}><rect width="${w}" height="${h}" fill="${base}"/>${body}</pattern>`;
  }

  /* ═════════════ the figure ═════════════
     A paper-doll gentleman, 240 × 560 units, centre line x = 120.
     Every garment is a polygon built from the left half and mirrored. */
  const BASE = {
    skin: SKIN[1], hair: HAIR.dark, hairStyle: 'side', beard: false,
    jacket: 'suit', jc: C.navy, jp: null, jps: 1, lapel: 'notch', close: 'top',
    shirt: 'point', sc: C.white, sp: null, sps: 1, spInk: null,
    tie: 'tie', tc: C.burgundy, tp: null, tps: 1, knot: 'fih',
    tr: 'tailored', trc: null, trp: null,
    shoe: 'oxford', shc: C.black, sock: C.navy, belt: true,
    square: 'flat', sqc: C.white, vest: false,
  };
  const TAILORED = ['suit', 'blazer', 'sport', 'dinner', 'tails', 'coat'];
  const KNITS = ['crew', 'vneck', 'cardigan'];

  function man(o = {}, opt = {}) {
    const L = { ...BASE, ...o };
    const F = { shoulder: 0, sleeve: 0, length: 0, brk: 1, waist: 0, tie: 0, ...(o.fit || {}) };
    const u = 'w' + (++UID);
    const defs = [];
    let pc = 0;
    const X = 120;
    const fill = (base, kind, sc, ink) => {
      if (!kind) return base;
      const id = `${u}p${pc++}`;
      defs.push(patDef(id, kind, base, sc, ink));
      return `url(#${id})`;
    };
    const pt = ([x, y]) => `${(X + x).toFixed(1)},${(+y).toFixed(1)}`;
    const poly = (pts, f, ex = '') => `<polygon points="${pts.map(pt).join(' ')}" fill="${f}"${ex}/>`;
    const mir = (pts) => pts.map(([x, y]) => [-x, y]);
    const sym = (half) => [...half, ...mir(half).reverse()];
    const pl = (pts, st, w = 0.8, ex = '') => `<polyline points="${pts.map(pt).join(' ')}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${ex}/>`;
    const both = (pts, f, ex) => poly(pts, f, ex) + poly(mir(pts), f, ex);
    const shadeOver = (pts) => poly(pts, `url(#${u}sh)`);
    const out = [];
    const J = L.jacket;
    const isSuit = ['suit', 'dinner', 'tails'].includes(J);
    const collared = ['point', 'spread', 'cutaway', 'button', 'open', 'polo'].includes(L.shirt);
    const tucked = !['tee', 'polo'].includes(L.shirt);
    const hasTie = L.tie !== 'none' && collared && L.shirt !== 'polo' && L.shirt !== 'open';

    // ground shadow
    out.push(`<ellipse cx="${X}" cy="529" rx="62" ry="6" fill="rgba(0,0,0,.13)"/>`);

    /* tails sit behind the legs */
    if (J === 'tails') out.push(both([[-40, 256], [-55, 300], [-54, 414], [-40, 418], [-38, 300]], shade(L.jc, 0.06)));

    /* socks + shoes (under trousers) */
    const brk = clamp(F.brk, 0, 3);
    const hem = 498 + brk * 8;
    const flare = Math.max(0, brk - 1) * 1.6;
    out.push(both([[-39, 484], [-9, 484], [-9, 510], [-39, 510]], L.sock));
    out.push(shoeFront(X - 24, L.shoe, L.shc), shoeFront(X + 24, L.shoe, L.shc));

    /* trousers */
    const trc = L.trc || (isSuit ? L.jc : C.grey);
    const trF = L.trc ? fill(trc, L.trp || (L.tr === 'jeans' ? 'denim' : null), 1) : (isSuit ? fill(L.jc, L.jp, L.jps) : trc);
    const T = sym([[0, 254], [-46, 254], [-48.5, 300], [-40 - flare, hem], [-7 + flare * 0.3, hem], [-2, 318], [0, 318]]);
    out.push(poly(T, trF), shadeOver(T));
    const dk = shade(trc, -0.35);
    if (L.tr === 'jeans') {
      const st = ' stroke-dasharray="2 1.4"';
      out.push(pl([[-47, 262], [-41, hem - 3]], '#c98a45', 0.6, st), pl([[47, 262], [41, hem - 3]], '#c98a45', 0.6, st));
      out.push(pl([[-44, 263], [-36, 272], [-26, 263]], '#c98a45', 0.6, st), pl([[44, 263], [36, 272], [26, 263]], '#c98a45', 0.6, st));
      out.push(pl([[0, 262], [6, 262], [6, 296], [1, 304]], '#c98a45', 0.6, st));
    } else {
      out.push(pl([[-24, 322], [-23, hem - 3]], 'rgba(0,0,0,.16)', 0.8), pl([[24, 322], [23, hem - 3]], 'rgba(0,0,0,.16)', 0.8));
      out.push(pl([[-41, 262], [-35, 288]], dk, 0.7, ' opacity=".55"'), pl([[41, 262], [35, 288]], dk, 0.7, ' opacity=".55"'));
      out.push(pl([[0, 262], [0, 300]], dk, 0.5, ' opacity=".45"'));
    }
    for (const s of [-1, 1]) {
      if (brk > 1.15) out.push(`<path d="M${X + s * 39} ${hem - 5} Q${X + s * 24} ${hem - 0.5} ${X + s * 9} ${hem - 5}" fill="none" stroke="${dk}" stroke-width=".9" opacity=".7"/>`);
      if (brk > 2.1) out.push(`<path d="M${X + s * 38} ${hem - 13} Q${X + s * 25} ${hem - 9} ${X + s * 10} ${hem - 14}" fill="none" stroke="${dk}" stroke-width=".8" opacity=".55"/>`);
      if (brk > 2.7) out.push(`<path d="M${X + s * 37} ${hem - 22} Q${X + s * 22} ${hem - 17} ${X + s * 11} ${hem - 22}" fill="none" stroke="${dk}" stroke-width=".7" opacity=".45"/>`);
    }

    /* back of collar, neck */
    const collarBand = () => (collared ? poly([[-14, 93], [14, 93], [15, 104], [-15, 104]], shade(L.sc, -0.12)) : '');
    out.push(collarBand());
    out.push(`<rect x="${X - 9}" y="74" width="18" height="38" fill="${L.skin}"/><rect x="${X - 9}" y="80" width="18" height="9" fill="${shade(L.skin, -0.3)}" opacity=".45"/>`);

    /* shirt body */
    const shF = fill(L.sc, L.sp, L.sps, L.spInk);
    const covered = TAILORED.includes(J) || KNITS.includes(J);
    const tw = covered ? 37 : 47;
    const belt = () => {
      if (!L.belt || L.tr === 'none' || J === 'tails' || J === 'dinner') return '';
      const bc = L.shoe === 'sneaker' ? C.brown : L.shc;
      return `<rect x="${X - tw}" y="254" width="${tw * 2}" height="6.5" fill="${bc}"/><rect x="${X - 5}" y="253" width="10" height="8.5" rx="1" fill="none" stroke="#c9a65a" stroke-width="1.3"/>`;
    };
    if (!tucked) out.push(belt());
    const torsoHalf = L.shirt === 'tee' || L.shirt === 'roll' ? [[0, 108], [-12, 101], [-50, 117], [-47, 150], [-tw, tucked ? 258 : 276], [0, tucked ? 258 : 276]]
      : [[0, 100], [-12, 101], [-50, 117], [-(covered ? 44 : 47), 150], [-tw, tucked ? 258 : 276], [0, tucked ? 258 : 276]];
    const torso = sym(torsoHalf);
    out.push(poly(torso, shF), shadeOver(torso));
    if (['point', 'spread', 'cutaway', 'button', 'open'].includes(L.shirt)) {
      out.push(pl([[0, 112], [0, 256]], shade(L.sc, -0.16), 0.7));
      [140, 172, 204, 236].forEach((y) => out.push(`<circle cx="${X}" cy="${y}" r="1.25" fill="${shade(L.sc, -0.22)}"/>`));
    } else if (L.shirt === 'polo') {
      out.push(pl([[0, 106], [0, 140]], shade(L.sc, -0.25), 0.7), `<circle cx="${X}" cy="118" r="1.2" fill="${shade(L.sc, 0.3)}"/><circle cx="${X}" cy="132" r="1.2" fill="${shade(L.sc, 0.3)}"/>`);
      out.push(poly(sym([[0, 272], [-47, 272], [-47, 276], [0, 276]]), shade(L.sc, -0.1)));
    } else if (L.shirt === 'tee') {
      out.push(`<path d="M${X - 12} 101 Q${X} 115 ${X + 12} 101" fill="none" stroke="${shade(L.sc, -0.14)}" stroke-width="2.2"/>`);
    }
    if (L.vest) out.push(poly(sym([[0, 150], [-12, 116], [-24, 150], [-26, 252], [-12, 264], [0, 260]]), fill('#f6f3ea', 'dot', 1, 'rgba(0,0,0,.06)')), pl([[0, 176], [0, 260]], 'rgba(0,0,0,.12)', 0.6));
    if (J === 'tails' || J === 'dinner') out.push(poly(sym([[0, 250], [-tw, 250], [-tw, 262], [0, 262]]), J === 'dinner' ? '#0f0f11' : '#f6f3ea'));
    if (tucked) out.push(belt());

    /* arms: shirt sleeves, hands */
    const armL = [[-50, 117], [-58, 124], [-64, 150], [-67, 302], [-45, 302], [-43, 160], [-46, 140]];
    const hand = (s) => `<path d="M${X + s * 66} 300 C${X + s * 69} 318 ${X + s * 64} 338 ${X + s * 56} 341 C${X + s * 48} 338 ${X + s * 44} 320 ${X + s * 45} 300 Z" fill="${L.skin}"/>`;
    if (L.shirt === 'tee' || L.shirt === 'polo') {
      out.push(both(armL, L.skin));
      const sl = [[-50, 117], [-58, 124], [-63, 146], [-64.5, 178], [-44, 180], [-43, 160], [-46, 140]];
      out.push(both(sl, shF), shadeOver(sl), shadeOver(mir(sl)));
    } else {
      out.push(both(armL, shF), shadeOver(armL), shadeOver(mir(armL)));
      out.push(pl([[-66.5, 292], [-45.5, 292]], shade(L.sc, -0.18), 0.7), pl([[66.5, 292], [45.5, 292]], shade(L.sc, -0.18), 0.7));
    }
    out.push(hand(-1), hand(1));

    /* tie */
    const kw = { fih: 5, half: 6.6, wind: 8.6 }[L.knot] || 5.5;
    const tieMarkup = () => {
      if (!hasTie) return '';
      const tf = fill(L.tc, L.tp || (L.tie === 'knit' ? 'knitrib' : null), L.tps);
      if (L.tie === 'bow') {
        const wing = [[-2, 106], [-15, 99], [-17, 108], [-15, 117], [-2, 112]];
        return both(wing, tf, ` stroke="${shade(L.tc, lum(L.tc) > 0.7 ? -0.22 : 0.15)}" stroke-width=".6" stroke-linejoin="round"`) + `<rect x="${X - 3.2}" y="104" width="6.4" height="10" rx="1.5" fill="${shade(L.tc, -0.12)}"/>`;
      }
      const tipY = 262 + F.tie * 22;
      const blade = L.tie === 'knit' ? [[-kw * 0.7, 117], [-6.5, tipY], [6.5, tipY], [kw * 0.7, 117]]
        : [[-kw * 0.7, 117], [-9, tipY - 10], [0, tipY], [9, tipY - 10], [kw * 0.7, 117]];
      const sk = L.knot === 'fih' ? 1 : 0;
      return poly(blade, tf) + poly(blade, `url(#${u}sh)`) +
        poly([[-kw, 104], [kw, 104], [kw * 0.72 + sk, 118], [-kw * 0.72 + sk, 118]], tf, ` stroke="${shade(L.tc, -0.4)}" stroke-width=".6" stroke-linejoin="round"`) +
        poly([[-kw, 104], [kw, 104], [kw * 0.72 + sk, 118], [-kw * 0.72 + sk, 118]], `url(#${u}sh)`) +
        pl([[-kw * 0.72 + sk, 118.4], [kw * 0.72 + sk, 118.4]], 'rgba(0,0,0,.35)', 1) +
        pl([[sk * 0.5, 111], [sk * 0.5, 117.5]], shade(L.tc, -0.35), 0.7);
    };
    const collarMarkup = () => {
      if (L.shirt === 'roll') {
        return `<rect x="${X - 12}" y="84" width="24" height="24" rx="3" fill="${shF}"/>` + [89, 94, 99, 104].map((y) => pl([[-11, y], [11, y]], shade(L.sc, -0.12), 0.6)).join('');
      }
      if (!collared) return '';
      const P = { point: [-8, 127], spread: [-16.5, 121], cutaway: [-22, 113], button: [-10, 128], open: [-19, 125], polo: [-15, 119] }[L.shirt];
      const inner = hasTie ? (L.tie === 'bow' ? [-3, 110] : [-kw * 0.85, 110]) : (L.shirt === 'polo' ? [-3, 112] : [-5, 116]);
      let s = '';
      if (!hasTie && L.shirt !== 'polo') s += poly([[-7, 100], [7, 100], [0, 124]], L.skin);
      const wing = [[-12, 95], [-15.5, 104], P, inner, [-3, 99]];
      const cf = L.shirt === 'polo' ? shade(L.sc, 0.04) : shF;
      s += both(wing, cf, ` stroke="${shade(L.sc, -0.2)}" stroke-width=".6" stroke-linejoin="round"`);
      if (L.shirt === 'button') s += `<circle cx="${X + P[0] + 1.6}" cy="${P[1] - 3}" r="1" fill="${shade(L.sc, -0.3)}"/><circle cx="${X - P[0] - 1.6}" cy="${P[1] - 3}" r="1" fill="${shade(L.sc, -0.3)}"/>`;
      return s;
    };
    const bow = L.tie === 'bow';
    if (!bow) out.push(tieMarkup());
    const knit = KNITS.includes(J);
    if (!knit) out.push(collarMarkup());
    if (bow) out.push(tieMarkup());

    /* tailored jacket */
    if (TAILORED.includes(J)) {
      const sw = 52 + F.shoulder * 12, arm = 47 + F.shoulder * 3, wst = 41 - F.waist * 5;
      const coat = J === 'coat';
      const hip = 47 - F.waist * 2 + (coat ? 5 : 0);
      const jhem = (coat ? 404 : 324) + F.length * 34;
      const B = coat ? 206 : J === 'dinner' ? 238 : 232;
      const two = !['dinner', 'tails'].includes(J);
      const B2 = B + (coat ? 44 : 34);
      const cl = L.close;
      const open = cl === 'open' || J === 'tails';
      const closeY = cl === 'bottom' ? B2 : B;
      const jf = fill(L.jc, L.jp, L.jps);
      const jdk = shade(L.jc, -0.38);
      let panel = [[-12, 103], [-15, 98], [-sw, 116], [-arm, 150], [-wst, 236]];
      if (J === 'tails') panel.push([-45, 266], [-25, 268], [-17, 214]);
      else {
        panel.push([-hip, jhem - 8], [-hip + 3, jhem]);
        if (open) panel.push([-10, jhem + 1], [-10, B + 12]);
        else if (cl === 'both') panel.push([1, jhem + 2], [1, closeY]);
        else panel.push([-15, jhem + 1], [-1, Math.max(closeY + 10, jhem - 20)], [1, closeY]);
      }
      out.push(poly(panel, jf), shadeOver(panel), poly(mir(panel), jf), shadeOver(mir(panel)));
      // darts
      out.push(pl([[-27, 196], [-29, Math.min(jhem - 20, 290)]], jdk, 0.6, ' opacity=".4"'), pl([[27, 196], [29, Math.min(jhem - 20, 290)]], jdk, 0.6, ' opacity=".4"'));
      // strain
      const strain = Math.max(F.waist - 0.45, -F.shoulder - 0.45, 0);
      if (!open && strain > 0) {
        const op = clamp(strain * 1.6, 0.2, 0.85);
        for (const s of [-1, 1]) {
          out.push(pl([[0, closeY], [s * 24, closeY - 16]], jdk, 0.9, ` opacity="${op}"`), pl([[0, closeY], [s * 26, closeY + 12]], jdk, 0.9, ` opacity="${op}"`), pl([[0, closeY], [s * 18, closeY - 28]], jdk, 0.7, ` opacity="${op * 0.7}"`));
        }
      }
      if (cl === 'both' && !open) {
        for (const s of [-1, 1]) out.push(pl([[s * 4, jhem - 2], [s * 30, jhem - 22]], jdk, 0.8, ' opacity=".55"'), pl([[s * 3, B2 + 4], [s * 22, jhem - 6]], jdk, 0.7, ' opacity=".4"'));
      }
      // chest pocket + square (on the wearer's left = viewer's right)
      if (J !== 'tails' || true) {
        const sq = L.square, sc = L.sqc;
        if (sq === 'flat') out.push(poly([[21.5, 165], [35, 162.4], [35, 159.6], [21.5, 162.2]], sc));
        else if (sq === 'point') out.push(poly([[23, 165], [28.5, 152], [34, 163.5]], sc));
        else if (sq === 'crown') out.push(poly([[22, 166], [23.5, 156], [26.5, 162], [28.5, 152.5], [31, 161], [34, 155], [35, 164]], sc));
        else if (sq === 'puff') out.push(`<path d="M${X + 21} 165 C${X + 20} 154 ${X + 27} 153 ${X + 28} 157 C${X + 30} 151 ${X + 37} 155 ${X + 35.5} 164 Z" fill="${sc}"/>`);
        out.push(poly([[20, 166], [36, 163], [36.6, 167.4], [20.6, 170.4]], shade(L.jc, -0.12), ` stroke="${jdk}" stroke-width=".5"`));
      }
      // hip pockets
      if (J !== 'tails') {
        const py = coat ? 318 : 282;
        if (jhem > py + 14) {
          if (J === 'dinner') out.push(pl([[-40, py + 4], [-20, py + 2]], jdk, 1.1), pl([[40, py + 4], [20, py + 2]], jdk, 1.1));
          else out.push(both([[-41, py + 1], [-19, py - 1], [-19, py + 8], [-41, py + 10]], jf, ` stroke="${jdk}" stroke-width=".5"`));
        }
      }
      // lapels
      const E = open ? (J === 'tails' ? [-17, 212] : [-10, B + 14]) : [0.5, closeY - 3];
      const lp = { notch: [[-12, 104], [-15, 98], [-23, 101], [-22, 119], [-25, 124], [-30, 118], [-34, 128], E],
        peak: [[-12, 104], [-15, 98], [-23, 101], [-23, 121], [-27, 123], [-39, 109], [-35, 130], E],
        shawl: [[-12, 104], [-15, 98], [-24, 102], [-29, 118], [-31, 136], [-27, 168], E] }[L.lapel] || [];
      if (coat) lp.forEach((p, i) => { if (i > 2 && i < lp.length - 1) p[0] *= 1.22; });
      const satin = J === 'dinner' || J === 'tails';
      const lf = satin ? `url(#${u}sat)` : jf;
      out.push(poly(lp, lf, ` stroke="${jdk}" stroke-width=".7" stroke-linejoin="round"`), poly(mir(lp), lf, ` stroke="${jdk}" stroke-width=".7" stroke-linejoin="round"`));
      if (!satin) out.push(poly(lp, 'rgba(0,0,0,.07)'), poly(mir(lp), 'rgba(0,0,0,.07)'));
      // sleeves
      const Es = 294 + F.sleeve * 16 + (coat ? 8 : 0);
      const slv = [[-sw, 115], [-Math.max(sw + 5, 58), 126], [-64.5 - (coat ? 2 : 0), 150], [-68.5 - (coat ? 2 : 0), Es], [-44 + (coat ? 1 : 0), Es], [-42.5, 164], [-arm + 1, 140]];
      out.push(both(slv, jf), shadeOver(slv), shadeOver(mir(slv)));
      out.push(pl([[-68, Es - 1], [-44.5, Es - 1]], jdk, 0.6, ' opacity=".6"'), pl([[68, Es - 1], [44.5, Es - 1]], jdk, 0.6, ' opacity=".6"'));
      [5, 9, 13].forEach((d) => { out.push(`<circle cx="${X - 64.5}" cy="${Es - d}" r=".95" fill="${jdk}"/><circle cx="${X + 64.5}" cy="${Es - d}" r=".95" fill="${jdk}"/>`); });
      if (F.shoulder > 0.3) {
        const op = clamp((F.shoulder - 0.3) * 1.5, 0.25, 0.9);
        for (const s of [-1, 1]) out.push(`<path d="M${X + s * (sw - 2)} 121 Q${X + s * (sw - 5)} 133 ${X + s * 60} 140" fill="none" stroke="${jdk}" stroke-width="1" opacity="${op}"/>`);
      }
      if (F.shoulder < -0.3) {
        const op = clamp((-F.shoulder - 0.3) * 1.5, 0.25, 0.9);
        for (const s of [-1, 1]) out.push(pl([[s * 49, 124], [s * 60, 131]], jdk, 0.8, ` opacity="${op}"`), pl([[s * 48, 131], [s * 61, 140]], jdk, 0.8, ` opacity="${op}"`));
      }
      // buttons
      const btnC = J === 'blazer' ? '#c9a14a' : satin ? '#0d0d0f' : shade(L.jc, -0.45);
      const btn = (x, y) => `<circle cx="${X + x}" cy="${y}" r="2.5" fill="${btnC}"/><circle cx="${X + x - 0.7}" cy="${y - 0.7}" r=".8" fill="rgba(255,255,255,.35)"/>`;
      if (J !== 'tails') {
        const ys = coat ? [B, B + 44, B + 88] : two ? [B, B2] : [B];
        ys.forEach((y) => { if (y < jhem - 6) out.push(btn(open ? -10 : 0.5, y)); });
      }
    }

    /* knitwear */
    if (knit) {
      const kf = fill(L.jc, 'rib', 1);
      const depth = J === 'crew' ? null : J === 'vneck' ? 168 : 200;
      const half = depth ? [[0, depth], [-13, 102], [-51, 117], [-47, 150], [-46, 274], [0, 274]]
        : [[0, 112], [-12.5, 102], [-51, 117], [-47, 150], [-46, 274], [0, 274]];
      const body = sym(half);
      out.push(poly(body, kf), shadeOver(body));
      out.push(poly(sym([[0, 264], [-46.5, 264], [-46, 274], [0, 274]]), fill(shade(L.jc, -0.06), 'rib', 1)));
      if (J === 'crew') out.push(`<path d="M${X - 12.5} 102 Q${X} 117 ${X + 12.5} 102" fill="none" stroke="${shade(L.jc, -0.15)}" stroke-width="3"/>`);
      else out.push(pl([[-13, 102], [0, depth], [13, 102]], shade(L.jc, -0.18), 2.6));
      if (J === 'cardigan') {
        out.push(pl([[0, depth], [0, 274]], shade(L.jc, -0.25), 0.8));
        [214, 236, 258].forEach((y) => out.push(`<circle cx="${X}" cy="${y}" r="2.1" fill="${shade(L.jc, -0.4)}"/>`));
      }
      const sl = [[-51, 116], [-58, 124], [-64, 150], [-67.5, 302], [-44.5, 302], [-43, 162], [-46, 140]];
      out.push(both(sl, kf), shadeOver(sl), shadeOver(mir(sl)));
      out.push(both([[-67.4, 292], [-44.6, 292], [-44.5, 302], [-67.5, 302]], fill(shade(L.jc, -0.06), 'rib', 1)));
      out.push(collarMarkup());
    }

    /* head */
    out.push(`<ellipse cx="${X - 20.5}" cy="60" rx="3.6" ry="6.5" fill="${shade(L.skin, -0.06)}"/><ellipse cx="${X + 20.5}" cy="60" rx="3.6" ry="6.5" fill="${shade(L.skin, -0.06)}"/>`);
    out.push(`<ellipse cx="${X}" cy="57" rx="20" ry="25" fill="${L.skin}"/><path d="M${X - 14} 70 Q${X} 86 ${X + 14} 70" fill="none" stroke="${shade(L.skin, -0.18)}" stroke-width="1" opacity=".5"/>`);
    const H = {
      side: 'M-21 56 C-23 34 -10 27 2 28 C16 28 23 38 21 56 C19 46 14 40 6 39 C-2 38 -6 42 -14 41 C-18 44 -20 50 -21 56Z',
      crop: 'M-20.5 54 C-21 36 -12 30 0 30 C12 30 21 36 20.5 54 C18 44 10 39 0 39 C-10 39 -18 44 -20.5 54Z',
      slick: 'M-21 58 C-24 30 -4 24 6 26 C20 28 25 40 21 60 C20 46 12 36 0 36 C-12 36 -19 46 -21 58Z',
      bald: '',
    };
    if (L.hairStyle === 'curly') {
      const cs = [[-17, 46], [-12, 37], [-4, 33], [5, 33], [13, 37], [18, 46], [-8, 41], [8, 41], [0, 38]];
      out.push(cs.map(([x, y]) => `<circle cx="${X + x}" cy="${y}" r="6.6" fill="${L.hair}"/>`).join(''));
    } else if (H[L.hairStyle]) {
      out.push(`<path d="${H[L.hairStyle].replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, a, b) => `${X + +a} ${b}`)}" fill="${L.hair}"/>`);
    }
    if (L.beard) out.push(`<path d="M${X - 19.5} 60 C${X - 19} 80 ${X - 8} 86 ${X} 86 C${X + 8} 86 ${X + 19} 80 ${X + 19.5} 60 C${X + 16} 70 ${X + 9} 73 ${X} 73 C${X - 9} 73 ${X - 16} 70 ${X - 19.5} 60Z" fill="${L.hair}"/>`);

    const sh = `<linearGradient id="${u}sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>`;
    const sat = `<linearGradient id="${u}sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#45464c"/><stop offset=".42" stop-color="#121214"/><stop offset=".6" stop-color="#2d2e33"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient>`;
    const vb = opt.vb || '0 0 240 560';
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${opt.label || 'Illustration of a man in an outfit'}"><defs>${sh}${sat}${defs.join('')}</defs>${out.join('')}</svg>`;
  }

  function shoeFront(x0, type, col) {
    const dk = shade(col, lum(col) > 0.7 ? -0.2 : -0.4), hi = shade(col, 0.3);
    let s = '';
    if (type === 'boot') s += `<rect x="${x0 - 14}" y="470" width="28" height="40" rx="3" fill="${col}"/>`;
    s += `<path d="M${x0 - 18} 526 C${x0 - 20} 512 ${x0 - 13} 503.5 ${x0 - 4} 503 L${x0 + 4} 503 C${x0 + 13} 503.5 ${x0 + 19} 512 ${x0 + 18} 526 Z" fill="${col}"/>`;
    if (type === 'sneaker') s += `<rect x="${x0 - 19.5}" y="519" width="39" height="9" rx="3.5" fill="#fbfaf7" stroke="#d6d0c4" stroke-width=".7"/>`;
    else s += `<rect x="${x0 - 18.5}" y="524" width="37" height="4.5" rx="2" fill="${dk}"/>`;
    if (type === 'oxford') s += `<path d="M${x0 - 13} 517 Q${x0} 511.5 ${x0 + 13} 517" fill="none" stroke="${dk}" stroke-width=".8"/>` + [506, 509, 512].map((y) => `<path d="M${x0 - 3} ${y}H${x0 + 3}" stroke="${hi}" stroke-width=".7"/>`).join('');
    if (type === 'derby') s += `<path d="M${x0 - 7} 504 L${x0 - 9} 515 M${x0 + 7} 504 L${x0 + 9} 515" stroke="${dk}" stroke-width=".7"/>` + [506, 509, 512].map((y) => `<path d="M${x0 - 5} ${y}H${x0 + 5}" stroke="${hi}" stroke-width=".8"/>`).join('');
    if (type === 'loafer') s += `<path d="M${x0 - 11} 515 Q${x0} 503 ${x0 + 11} 515" fill="none" stroke="${dk}" stroke-width=".8"/><path d="M${x0 - 9} 510 H${x0 + 9}" stroke="${dk}" stroke-width="1.6"/>`;
    if (type === 'sneaker') s += [507, 510, 513].map((y) => `<circle cx="${x0 - 4}" cy="${y}" r=".8" fill="#bbb"/><circle cx="${x0 + 4}" cy="${y}" r=".8" fill="#bbb"/>`).join('');
    if (type === 'boot') s += `<path d="M${x0 - 14} 474 H${x0 + 14}" stroke="${dk}" stroke-width=".8"/>`;
    s += `<ellipse cx="${x0 - 6}" cy="516" rx="5" ry="3" fill="#fff" opacity="${type === 'sneaker' ? 0 : 0.14}"/>`;
    return s;
  }

  /* ═════════════ looks library ═════════════ */
  const LK = {
    interview: { skin: SKIN[1], hair: HAIR.dark, hairStyle: 'side', jacket: 'suit', jc: C.charcoal, shirt: 'spread', sc: C.white, tie: 'tie', tc: C.navy, tp: 'dot', knot: 'half', shoe: 'oxford', shc: C.black, sock: C.charcoal, square: 'flat', sqc: C.white },
    wedding: { skin: SKIN[0], hair: HAIR.brown, hairStyle: 'crop', jacket: 'suit', jc: '#8e98a6', shirt: 'point', sc: C.blue, tie: 'tie', tc: C.burgundy, tp: 'repp', shoe: 'oxford', shc: C.brown, sock: C.navy, square: 'puff', sqc: C.cream },
    bizcas: { skin: SKIN[3], hair: HAIR.black, hairStyle: 'crop', jacket: 'blazer', jc: C.navy2, close: 'open', shirt: 'button', sc: C.blue, tie: 'none', tr: 'tailored', trc: C.grey, shoe: 'loafer', shc: C.tan, sock: C.grey, square: 'flat', sqc: C.white },
    date: { skin: SKIN[2], hair: HAIR.black, hairStyle: 'curly', jacket: 'crew', jc: C.navy, shirt: 'button', sc: C.white, tie: 'none', tr: 'jeans', trc: C.indigo, shoe: 'boot', shc: C.dbrown, sock: C.navy },
    weekend: { skin: SKIN[0], hair: HAIR.fair, hairStyle: 'side', jacket: 'none', shirt: 'tee', sc: C.white, tie: 'none', tr: 'chino', trc: C.olive, shoe: 'sneaker', shc: C.white, sock: C.white },
    dinner: { skin: SKIN[4], hair: HAIR.black, hairStyle: 'crop', beard: true, jacket: 'sport', jc: C.tweed, jp: 'tweed', shirt: 'roll', sc: C.cream, tie: 'none', tr: 'tailored', trc: C.charcoal, shoe: 'derby', shc: C.dbrown, sock: C.charcoal, square: 'puff', sqc: '#b5523b' },
    gala: { skin: SKIN[1], hair: HAIR.dark, hairStyle: 'slick', jacket: 'dinner', jc: C.black, lapel: 'shawl', shirt: 'point', sc: C.white, tie: 'bow', tc: C.black, shoe: 'oxford', shc: '#0c0c0e', sock: C.black, square: 'flat', sqc: C.white, fit: { brk: 0.6 } },
    commute: { skin: SKIN[2], hair: HAIR.grey, hairStyle: 'side', jacket: 'coat', jc: C.camel, lapel: 'notch', shirt: 'point', sc: C.blue, tie: 'tie', tc: C.navy, tr: 'tailored', trc: C.charcoal, shoe: 'boot', shc: C.black, sock: C.charcoal, square: 'none' },
    tails: { skin: SKIN[3], hair: HAIR.black, hairStyle: 'slick', jacket: 'tails', jc: C.black, lapel: 'peak', shirt: 'cutaway', sc: C.white, tie: 'bow', tc: C.white, vest: true, shoe: 'oxford', shc: '#0c0c0e', sock: C.black, square: 'flat', sqc: C.white, fit: { brk: 0.5 } },
    bizformal: { skin: SKIN[2], hair: HAIR.dark, hairStyle: 'side', jacket: 'suit', jc: C.navy, shirt: 'spread', sc: C.white, tie: 'tie', tc: C.burgundy, knot: 'half', shoe: 'oxford', shc: C.black, sock: C.navy, square: 'flat', sqc: C.white },
    smartcas: { skin: SKIN[1], hair: HAIR.brown, hairStyle: 'crop', beard: true, jacket: 'sport', jc: '#6c6f73', jp: 'tweed', close: 'open', shirt: 'open', sc: C.white, tie: 'none', tr: 'jeans', trc: C.indigo, shoe: 'boot', shc: C.dbrown, sock: C.navy, square: 'puff', sqc: '#b5523b' },
    casual: { skin: SKIN[4], hair: HAIR.black, hairStyle: 'crop', jacket: 'none', shirt: 'polo', sc: C.navy, tie: 'none', tr: 'chino', trc: C.khaki, shoe: 'sneaker', shc: C.white, sock: C.white, fit: { brk: 0.3 } },
  };

  /* ═════════════ shared behaviour ═════════════ */
  // progress tape
  const bar = $('#progress');
  // reveals
  const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.fig, .pillar, .card, .flip, .mcard, .look-note, blockquote.pull, .tbl, .fab, .ch-head, .rule-row > div, .sq').forEach((e) => { e.classList.add('reveal'); rio.observe(e); });
  // split chapter titles into words
  $$('.ch-head h2').forEach((h) => {
    h.innerHTML = h.textContent.split(' ').map((w, i) => `<span class="w" style="--d:${i * 70}ms"><span>${w}</span></span>`).join(' ');
  });
  // pressed groups
  function seg(container, cb) {
    const btns = $$('button', container);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cb(b.dataset.v, b);
    }));
  }
  function syncFill(i) { i.style.setProperty('--fill', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'); }
  const swapIn = (el, html) => { el.innerHTML = html; if (!RM) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); } };

  /* ═════════════ hero ═════════════ */
  const HERO = [
    ['interview', 'Look 01', 'The interview'],
    ['bizcas', 'Look 02', 'Business casual'],
    ['dinner', 'Look 03', 'The dinner party'],
    ['date', 'Look 04', 'The first date'],
    ['gala', 'Look 05', 'Black tie'],
    ['weekend', 'Look 06', 'Saturday morning'],
  ];
  const heroStage = $('#hero-fig');
  if (heroStage) {
    heroStage.innerHTML = HERO.map(([k], i) => `<div class="hero-look${i === 0 ? ' on' : ''}">${man(LK[k], { label: 'An illustrated gentleman modelling a look' })}</div>`).join('');
    const tag = $('#hero-tag'), looks = $$('.hero-look', heroStage);
    let hi = 0;
    const show = (n) => {
      looks[hi].classList.remove('on'); hi = (n + looks.length) % looks.length; looks[hi].classList.add('on');
      tag.innerHTML = `<b>${HERO[hi][1]}</b> ${HERO[hi][2]}`;
    };
    show(0);
    let ht = RM ? 0 : setInterval(() => show(hi + 1), 2800);
    heroStage.addEventListener('click', () => { clearInterval(ht); ht = 0; show(hi + 1); });
  }

  // scroll-linked bits: progress, hero parallax, lookbook
  const swatches = $$('.swatch');
  const lb = $('#lookbook'), track = $('#lb-track'), lbBar = $('#lb-bar');
  const wideLB = () => innerWidth > 820 && !RM;
  function sizeLB() {
    if (!lb) return;
    if (wideLB()) { lb.classList.add('pinned'); lb.style.height = (track.scrollWidth - innerWidth + innerHeight) + 'px'; }
    else { lb.classList.remove('pinned'); lb.style.height = ''; track.style.transform = ''; }
  }
  let ticking = false;
  function onScroll() {
    ticking = false;
    const m = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (m > 0 ? (scrollY / m) * 100 : 0) + '%';
    if (!RM && scrollY < innerHeight * 1.2) swatches.forEach((s) => { s.style.translate = `0 ${scrollY * (+s.dataset.speed || 0.2)}px`; });
    if (lb && lb.classList.contains('pinned')) {
      const r = lb.getBoundingClientRect();
      const span = lb.offsetHeight - innerHeight;
      const p = clamp(-r.top / span, 0, 1);
      track.style.transform = `translate3d(${-p * (track.scrollWidth - innerWidth)}px,0,0)`;
      if (lbBar) lbBar.style.transform = `scaleX(${p})`;
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { sizeLB(); onScroll(); }, 120); });

  /* ═════════════ fit lab ═════════════ */
  const fitFig = $('#fit-fig');
  if (fitFig) {
    const sliders = $$('#fit-controls input[type=range]');
    const verdict = $('#fit-verdict'), score = $('#fit-score');
    let closed = 'top';
    const perfect = { shoulder: 0, sleeve: 0, length: 0, waist: 0, brk: 1, tie: 0 };
    const read = () => Object.fromEntries(sliders.map((s) => [s.name, +s.value]));
    const judge = (f) => {
      const cuff = 8 - 16 * f.sleeve; // units ≈ mm
      const R = [];
      R.push(Math.abs(f.shoulder) < 0.3 ? ['ok', 'Shoulders', 'The seam ends where your shoulder bone ends. This is the one measurement to buy for: a tailor can fix almost anything else.']
        : f.shoulder > 0 ? ['no', 'Shoulders', 'Too big. The pad overhangs your arm and a dent forms just below it. Shoulders are very hard to alter, so walk away from this one.']
          : ['no', 'Shoulders', 'Too small. The sleeve pulls across the top of your arm and ripples form. Size up.']);
      R.push(cuff >= 3 && cuff <= 14 ? ['ok', 'Sleeves', `About ${Math.round(cuff)} mm of shirt cuff shows. The classic target is a quarter to half an inch (6–13 mm).`]
        : cuff < 3 ? ['no', 'Sleeves', 'Too long. The sleeve swallows your shirt cuff and creeps onto your hand. An easy, cheap fix for a tailor.']
          : ['no', 'Sleeves', 'Too short. A big band of shirt shows (and maybe some wrist). Can be let out a little, only if there\'s spare cloth inside.']);
      R.push(Math.abs(f.length) < 0.3 ? ['ok', 'Length', 'The jacket covers your seat, and the hem lands around your knuckles with your arms relaxed.']
        : f.length > 0 ? ['no', 'Length', 'Too long. It shortens your legs and drifts toward overcoat territory. Length can only be taken up a little.']
          : ['no', 'Length', 'Too short. Fine on a runway, but it cuts you off at the seat and makes your torso look stubby.']);
      R.push(f.waist >= -0.4 && f.waist <= 0.5 ? ['ok', 'Waist', 'Gently shaped. Buttoned, you can slide a flat hand inside without the fabric pulling.']
        : f.waist < 0 ? ['no', 'Waist', 'Boxy. It hangs straight down from the chest like a cardboard box. A tailor can take in the sides.']
          : ['no', 'Waist', 'Too tight. See the X-shaped creases around the button? That\'s fabric under strain. Let it out or size up.']);
      R.push(f.brk <= 1.7 ? ['ok', 'Trousers', f.brk < 0.6 ? 'No break: a clean, modern line that flashes a little sock when you walk. Great with slimmer trousers.' : 'A slight break: one soft fold where the trouser meets the shoe. The safe, classic choice.']
        : f.brk <= 2.4 ? ['meh', 'Trousers', 'A full break. Traditional, and fine with wide trousers, but it looks sloppy on a slim cut.']
          : ['no', 'Trousers', 'Puddling. Fabric is piling up over your shoes. Hemming costs very little; do it.']);
      R.push(Math.abs(f.tie) < 0.35 ? ['ok', 'Tie', 'The tip just touches the top of the belt buckle. Perfect.']
        : f.tie < 0 ? ['no', 'Tie', 'Too short: the tie stops above your belt, very 1970s sitcom. Re-tie with the thin end shorter.']
          : ['no', 'Tie', 'Too long: it dangles below the belt. Use a bigger knot or start with the thin end longer.']);
      return R;
    };
    const draw = () => {
      const f = read();
      fitFig.innerHTML = man({ ...LK.bizformal, close: closed, fit: f }, { label: 'A figure showing how the current fit settings look' });
      const R = judge(f);
      verdict.innerHTML = R.map(([k, t, d]) => `<li class="${k}"><b>${t}</b><span>${d}</span></li>`).join('');
      const n = R.filter((r) => r[0] === 'ok').length;
      score.innerHTML = `<b>${n}</b>/6`;
      score.dataset.good = n === 6 ? 'yes' : 'no';
    };
    sliders.forEach((s) => { syncFill(s); s.addEventListener('input', () => { syncFill(s); draw(); }); });
    seg($('#fit-close'), (v) => { closed = v; draw(); });
    $('#fit-perfect').addEventListener('click', () => { sliders.forEach((s) => { s.value = perfect[s.name]; syncFill(s); }); draw(); });
    $('#fit-rack').addEventListener('click', () => {
      sliders.forEach((s) => {
        const lo = +s.min, hi = +s.max;
        const v = s.name === 'brk' ? 0.4 + Math.random() * 2.6 : (Math.random() * 2 - 1) * (hi - lo) / 2 * 0.95;
        s.value = v.toFixed(2); syncFill(s);
      });
      draw();
    });
    draw();
  }

  /* ═════════════ suit anatomy ═════════════ */
  const anat = $('#anat-fig');
  if (anat) {
    anat.innerHTML = man({ ...LK.bizformal, jc: C.navy, square: 'point', fit: { brk: 1.2 } }, { label: 'A navy suit with numbered parts' });
    const PARTS = [
      [88, 116, 'Notch lapel', 'The everyday lapel, with a small V-shaped "notch" where collar meets lapel. Peak lapels (pointing up) are dressier; shawl lapels (one smooth curve) belong on dinner jackets. Width should roughly match your tie\'s widest point: about 7–9 cm.'],
      [107, 104, 'Gorge', 'The seam where collar and lapel join. Higher gorges look modern and lengthen the chest; very low ones date a suit instantly.'],
      [148, 158, 'Chest pocket', 'Home of the pocket square, and nothing else. Pens, glasses and phones belong elsewhere: anything heavy here drags the whole front out of shape.'],
      [120, 232, 'The button stance', 'Where the top button sits. It should land at or just above your natural waist (about the navel). Higher looks stiff; lower makes your legs look shorter.'],
      [90, 286, 'Flap pockets', 'Usually still stitched shut when you buy the suit (more on that later). Keep them almost empty, and tuck the flaps in for a sleeker look if you like.'],
      [55, 281, 'Sleeve buttons', 'Normally four on a suit. Working buttonholes ("surgeon\'s cuffs") are a sign of quality, but they make shortening the sleeves harder, so get the length right first.'],
      [172, 117, 'Shoulder', 'The single most important part of the fit. Natural, soft shoulders feel relaxed (think Neapolitan); padded, roped shoulders feel formal and structured (think British).'],
      [111, 318, 'Quarters', 'The way the front edges curve open below the button. An open, rounded cutaway is classic and flattering; a straight, closed front reads boxy.'],
      [144, 420, 'Crease', 'A sharp line down the middle of each trouser leg. It makes legs look longer and is the difference between "suit" and "pajamas".'],
      [144, 508, 'Break', 'The fold where the trouser hem meets the shoe. Less is more: none or a slight one looks sharpest today.'],
    ];
    const box = $('#anat-pins'), card = $('#anat-card'), list = $('#anat-list');
    box.innerHTML = PARTS.map(([x, y, n], i) => `<button type="button" class="pin" style="left:${(x / 240) * 100}%;top:${(y / 560) * 100}%" data-i="${i}" aria-label="${n}">${i + 1}</button>`).join('');
    list.innerHTML = PARTS.map(([, , n], i) => `<li><button type="button" data-i="${i}"><i>${String(i + 1).padStart(2, '0')}</i>${n}</button></li>`).join('');
    const pick = (i) => {
      $$('[data-i]', anat.parentElement.parentElement).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
      card.innerHTML = `<p class="fig-k">Part ${String(i + 1).padStart(2, '0')}</p><h4>${PARTS[i][2]}</h4><p>${PARTS[i][3]}</p>`;
      if (!RM) { card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
    };
    $$('[data-i]', anat.parentElement.parentElement).forEach((b) => b.addEventListener('click', () => pick(+b.dataset.i)));
    pick(0);
  }

  /* ═════════════ button rule ═════════════ */
  const btnFig = $('#btn-fig');
  if (btnFig) {
    const st = { top: true, bot: false, seat: false };
    const out = $('#btn-out');
    const draw = () => {
      const close = st.top && st.bot ? 'both' : st.top ? 'top' : st.bot ? 'bottom' : 'open';
      btnFig.innerHTML = man({ ...LK.bizformal, jc: C.charcoal, close, tc: C.navy, tp: 'foulard' }, { vb: '40 80 160 260', label: 'Close-up of a jacket front showing its buttons' });
      $('#b-top').setAttribute('aria-pressed', st.top); $('#b-bot').setAttribute('aria-pressed', st.bot);
      let v;
      if (st.seat) v = (st.top || st.bot) ? ['no', 'Unbutton when you sit.', 'Sitting down with the jacket fastened strains the button and bunches the front. Undo it as you sit; do it up again as you stand.'] : ['ok', 'Perfect.', 'Seated and unbuttoned. Stand up to greet someone and your hand should go to that top button almost by reflex.'];
      else if (st.top && !st.bot) v = ['ok', 'Sometimes, Always, Never.', 'On a two-button jacket: top button always, bottom button never. (On a three-button: sometimes, always, never, top to bottom.)'];
      else if (st.top && st.bot) v = ['no', 'Never the bottom one.', 'Jackets are cut to flare open below the last button. Fasten it and the fabric pulls across your hips. Legend says the habit began with King Edward VII, who couldn\'t close his.'];
      else if (st.bot) v = ['no', 'Absolutely not.', 'Bottom only gives you a gaping V up top and a pinched waist below. There is no occasion on earth for this.'];
      else v = ['meh', 'Relaxed, but…', 'Unbuttoned is fine at a casual moment. In a meeting, on a stage, in a photo, or when you stand to meet someone, fasten the top button.'];
      out.className = 'btn-out ' + v[0];
      out.innerHTML = `<b>${v[1]}</b><span>${v[2]}</span>`;
    };
    $('#b-top').addEventListener('click', () => { st.top = !st.top; draw(); });
    $('#b-bot').addEventListener('click', () => { st.bot = !st.bot; draw(); });
    seg($('#btn-pose'), (v) => { st.seat = v === 'sit'; draw(); });
    draw();
  }

  /* ═════════════ collar & knot ═════════════ */
  const ckFig = $('#ck-fig');
  if (ckFig) {
    let collar = 'point', knot = 'fih';
    const M = {
      point: { fih: ['ok', 'A natural pair. The narrow collar points frame a slim knot neatly.'], half: ['ok', 'Works well, a touch more formal.'], wind: ['no', 'Too much knot. It forces the narrow collar points apart and bulges.'] },
      spread: { fih: ['meh', 'Fine, but the small knot leaves a gap. Try a half-Windsor.'], half: ['ok', 'The sweet spot: a medium knot fills a medium spread.'], wind: ['ok', 'Bold and formal. Good with a thicker tie.'] },
      cutaway: { fih: ['no', 'The knot looks lost in all that space between the collar points.'], half: ['meh', 'Passable, a little underpowered.'], wind: ['ok', 'This is what cutaways are for: a big, symmetrical knot.'] },
      button: { fih: ['ok', 'The classic Ivy League combination. Relaxed and correct.'], half: ['meh', 'A bit stiff for such a casual collar.'], wind: ['no', 'A huge formal knot on a sporty collar. Mixed signals.'] },
    };
    const out = $('#ck-out');
    const draw = () => {
      ckFig.innerHTML = man({ ...LK.bizformal, jacket: 'none', shirt: collar, sc: collar === 'button' ? C.blue : C.white, tc: C.burgundy, tp: 'repp', tps: 1, knot }, { vb: '78 76 84 84', label: 'Close-up of a shirt collar and tie knot' });
      const [k, t] = M[collar][knot];
      out.className = 'ck-out ' + k;
      out.innerHTML = `<b>${k === 'ok' ? 'Good match' : k === 'meh' ? 'It\'ll do' : 'Mismatch'}</b><span>${t}</span>`;
    };
    seg($('#ck-collar'), (v) => { collar = v; draw(); });
    seg($('#ck-knot'), (v) => { knot = v; draw(); });
    draw();
  }

  /* ═════════════ pocket squares ═════════════ */
  $$('.sq-fig').forEach((el) => {
    const f = el.dataset.fold;
    el.innerHTML = man({ ...LK.bizformal, jc: C.navy, square: f, sqc: f === 'puff' ? '#b5523b' : f === 'crown' ? C.cream : C.white }, { vb: '128 140 40 40', label: `A ${f} pocket square fold` });
  });

  /* ═════════════ pattern mixer ═════════════ */
  const pmFig = $('#pm-fig');
  if (pmFig) {
    const st = { j: ['solid', 1], s: ['solid', 1], t: ['dot', 1] };
    const JP = { solid: null, pin: 'pin', check: 'check' };
    const SP = { solid: null, stripe: 'stripe', gingham: 'gingham' };
    const TP = { solid: null, dot: 'dot', repp: 'repp', foulard: 'foulard' };
    const out = $('#pm-out');
    const judge = () => {
      const items = [['jacket', st.j], ['shirt', st.s], ['tie', st.t]].filter(([, [k]]) => k !== 'solid');
      const n = items.length;
      if (n === 0) return ['meh', 'All solids', 'Clean and safe, maybe a little flat. Add one pattern, usually on the tie, to bring it to life.'];
      if (n === 1) return ['ok', 'One pattern, two solids', 'The easiest win in menswear. Impossible to get wrong.'];
      const scales = items.map(([, [, s]]) => s);
      const clash = scales.some((s, i) => scales.indexOf(s) !== i);
      if (n === 2 && !clash) return ['ok', 'Two patterns, different scales', 'Nicely done. Because one pattern is bigger than the other, the eye reads them as separate things, not visual noise.'];
      if (n === 3 && !clash) return ['ok', 'Three patterns. Advanced, and it works', 'Small, medium, large. This is how the Italians do it. Keep the colours related so it doesn\'t become a circus.'];
      const same = items.filter(([, [, s]]) => scales.filter((x) => x === s).length > 1).map(([n]) => n);
      return ['no', 'Same-scale clash', `Your ${same.join(' and ')} use patterns of the same size, so they fight and shimmer. Make one bigger or bolder, or swap one for a solid.`];
    };
    const draw = () => {
      pmFig.innerHTML = man({ ...LK.bizformal, jc: C.charcoal, jp: JP[st.j[0]], jps: st.j[1], shirt: 'spread', sc: C.white, sp: SP[st.s[0]], sps: st.s[1], spInk: 'rgba(52,84,150,.5)', tc: C.burgundy, tp: TP[st.t[0]], tps: st.t[1], knot: 'half', square: 'puff', sqc: C.white }, { vb: '64 86 112 150', label: 'Close-up of a jacket, shirt and tie with the chosen patterns' });
      const [k, h, t] = judge();
      out.className = 'pm-out ' + k;
      out.innerHTML = `<b>${h}</b><span>${t}</span>`;
    };
    $$('.pm-row').forEach((row) => {
      const key = row.dataset.k;
      seg($('.pm-kind', row), (v) => { st[key][0] = v; row.classList.toggle('solid', v === 'solid'); draw(); });
      seg($('.pm-scale', row), (v) => { st[key][1] = +v; draw(); });
    });
    draw();
  }

  /* ═════════════ shoes (side view) ═════════════ */
  const SHOES = [
    ['oxford', 'Black cap-toe oxford', C.black, 10, 'The most formal everyday shoe. "Closed" lacing, where the side pieces are stitched under the front, gives it a sleek look. The only real choice with a dark suit at a funeral, an interview or black tie (in patent or high shine).'],
    ['derby', 'Brown derby', C.brown, 7, '"Open" lacing, with flaps stitched on top, makes it a little chunkier and more relaxed than an oxford. Works with suits, sport coats, chinos and even jeans. Very versatile.'],
    ['monk', 'Double monk strap', C.dbrown, 7, 'Buckles instead of laces. A little dandyish, which is the point. Great with suits and flannels; just don\'t wear them half-unbuckled on purpose.'],
    ['loafer', 'Suede penny loafer', C.tan, 5, 'The slip-on that runs the whole range, from chinos to a summer suit. Suede is softer and more casual than polished leather. Wear with or without (invisible) socks.'],
    ['chelsea', 'Chelsea boot', '#4b3a2c', 4, 'Elastic sides, no laces, a slim profile. Works with jeans, chinos and even a slim flannel suit. The best autumn and winter all-rounder.'],
    ['sneaker', 'Minimal white sneaker', '#f3f1ec', 2, 'Clean white leather, no logos to speak of. Smart enough for chinos, a knit or even a casual unstructured suit. Keep them spotless: a dirty white sneaker undoes the whole idea.'],
  ];
  function shoeSide(type, col) {
    const dk = shade(col, lum(col) > 0.7 ? -0.18 : -0.42), hi = shade(col, 0.35);
    const st = `stroke="${dk}" stroke-width="1.2" fill="none" stroke-linecap="round"`;
    let s = '';
    const sneaker = type === 'sneaker', loafer = type === 'loafer', chelsea = type === 'chelsea';
    const base = sneaker ? 74 : 78;
    if (chelsea) s += `<path d="M98 40 L106 4 Q107 0 112 0 L184 0 Q190 0 191 6 L198 ${base} L100 ${base} Z" fill="${col}"/><path d="M134 2 L146 46 L158 2 Z" fill="${shade(col, -0.28)}"/><path d="M138 6 L146 38 L154 6" ${st} opacity=".45"/><path d="M180 0 L183 -9 L190 -9 L189 2" fill="${dk}"/>`;
    const top = loafer ? `C58 52 78 48 96 44 C120 44 150 44 170 38 L190 32` : `C60 52 84 46 104 34 L112 30 C130 38 150 40 170 36 L190 30`;
    s += `<path d="M12 ${base} C8 66 16 58 34 56 ${top} C197 34 199 50 198 ${base} Z" fill="${col}"/>`;
    if (!chelsea) s += loafer ? `<path d="M96 44 C120 44 150 44 170 38 L190 32 C168 29 120 35 96 44 Z" fill="${shade(col, -0.6)}"/>` : `<path d="M112 30 C130 38 150 40 170 36 L190 30 C168 25 132 24 112 30 Z" fill="${shade(col, sneaker ? -0.3 : -0.6)}"/>`;
    if (sneaker) s += `<path d="M8 72 L200 72 L200 82 Q200 88 194 88 L16 88 Q6 88 6 80 Z" fill="#fff" stroke="#d3cdc1" stroke-width="1"/><path d="M8 80 H200" stroke="#d3cdc1" stroke-width=".8"/>`;
    else s += `<rect x="9" y="78" width="190" height="6" rx="3" fill="${dk}"/><path d="M164 84 H199 V92 Q199 94 197 94 H166 Q164 94 164 92 Z" fill="${shade(col, -0.55)}"/>`;
    const eyelets = (n, x0, y0, x1, y1) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return `<circle cx="${x0 + (x1 - x0) * t}" cy="${y0 + (y1 - y0) * t}" r="1.6" fill="${dk}"/>`; }).join('');
    if (type === 'oxford') s += `<path d="M42 55 C48 64 49 72 46 78" ${st}/><path d="M82 48 L112 31" ${st}/>${eyelets(5, 88, 46, 108, 34)}<path d="M88 46 L108 34" stroke="${hi}" stroke-width=".8" opacity=".6"/><path d="M112 31 C124 44 132 60 134 78" ${st} opacity=".6"/>`;
    if (type === 'derby') s += `<path d="M80 49 L112 30 C118 42 114 56 98 60 C90 58 84 54 80 49 Z" fill="${shade(col, 0.06)}" stroke="${dk}" stroke-width="1"/>${eyelets(5, 88, 46, 108, 34)}<path d="M86 47 L110 33" stroke="${hi}" stroke-width="1" opacity=".6"/>`;
    if (type === 'monk') s += `<path d="M78 51 C94 43 106 35 112 31 L122 58 C106 62 90 60 78 51 Z" fill="${shade(col, 0.05)}" stroke="${dk}"/><rect x="92" y="38" width="26" height="5.5" rx="2" transform="rotate(-24 105 41)" fill="${dk}"/><rect x="94" y="49" width="28" height="5.5" rx="2" transform="rotate(-18 108 52)" fill="${dk}"/><rect x="114" y="31" width="7" height="9" rx="1" fill="none" stroke="#c9a65a" stroke-width="1.6"/><rect x="117" y="44" width="7" height="9" rx="1" fill="none" stroke="#c9a65a" stroke-width="1.6"/>`;
    if (loafer) s += `<path d="M36 57 C56 46 80 42 100 44" ${st}/><path d="M86 47 L116 43 L118 55 L88 59 Z" fill="${shade(col, -0.12)}"/><ellipse cx="102" cy="51" rx="7" ry="2.2" fill="${shade(col, -0.45)}" transform="rotate(-8 102 51)"/>`;
    if (chelsea) s += `<path d="M42 56 C48 64 50 72 48 78" ${st} opacity=".45"/>`;
    if (sneaker) s += `<path d="M36 56 C40 64 40 70 38 72" stroke="#d3cdc1" stroke-width="1" fill="none"/>${eyelets(5, 86, 46, 108, 33)}<path d="M86 46 L108 33" stroke="#d3cdc1" stroke-width="1"/><path d="M126 40 C132 50 136 60 140 72" stroke="#c9b48a" stroke-width="3" fill="none" opacity=".7"/>`;
    s += `<path d="M50 54 C64 51 76 48 86 45" stroke="#fff" stroke-width="2.5" fill="none" opacity="${sneaker ? 0 : 0.14}" stroke-linecap="round"/>`;
    return `<svg viewBox="0 -10 210 108" aria-hidden="true">${s}</svg>`;
  }
  const shoeList = $('#shoe-list');
  if (shoeList) {
    shoeList.innerHTML = SHOES.map(([k, n, col, f, d], i) => `
      <li class="shoe" style="--i:${i}">
        <div class="shoe-art">${shoeSide(k, col)}</div>
        <div class="shoe-txt"><p class="fig-k">Formality ${f}/10</p><h4>${n}</h4><div class="meter"><span style="--f:${f * 10}%"></span></div><p>${d}</p></div>
      </li>`).join('');
    $$('.shoe', shoeList).forEach((e) => { e.classList.add('reveal'); rio.observe(e); });
  }

  /* ═════════════ dress codes (sticky scrolly) ═════════════ */
  const dcFig = $('#dc-fig');
  if (dcFig) {
    const codes = ['tails', 'gala', 'bizformal', 'bizcas', 'smartcas', 'casual'];
    const labels = ['White tie', 'Black tie', 'Business formal', 'Business casual', 'Smart casual', 'Casual'];
    const meter = $('#dc-meter'), lab = $('#dc-label');
    let cur = -1;
    const set = (i) => {
      if (i === cur) return; cur = i;
      swapIn(dcFig, man(LK[codes[i]], { label: `An outfit for the ${labels[i]} dress code` }));
      lab.textContent = labels[i];
      meter.style.setProperty('--p', `${100 - i * 18}%`);
      $$('.dc-step').forEach((s) => s.classList.toggle('on', +s.dataset.step === i));
    };
    set(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.step); }), { rootMargin: '-48% 0px -48% 0px' });
    $$('.dc-step').forEach((s) => io.observe(s));
  }

  /* ═════════════ lookbook ═════════════ */
  const LOOKS = [
    ['interview', 'The job interview', 'Quiet, competent, forgettable in the best way. You want them to remember what you said, not what you wore.', ['Charcoal two-piece suit', 'White spread-collar shirt', 'Navy tie with a small dot', 'Black cap-toe oxfords', 'White square, flat fold'], 'For a creative or start-up job, drop the tie but keep the suit. Look up what people there actually wear, then dress one notch above it.'],
    ['wedding', 'The summer wedding guest', 'Festive but never upstaging the groom. A lighter suit and a bit of colour say "celebration".', ['Mid-grey or light-blue suit', 'Pale-blue point-collar shirt', 'Burgundy striped tie', 'Brown oxfords', 'Cream square, puffed'], 'Never wear white. Skip all-black unless it\'s an evening do. Read the invitation: "garden party" and "black tie" are not the same thing.'],
    ['bizcas', 'Business casual, done right', 'The most misunderstood dress code. It does not mean "whatever". It means "a suit, minus a few pieces".', ['Navy blazer, worn open', 'Blue oxford button-down', 'Mid-grey wool trousers', 'Tobacco suede loafers', 'No tie needed'], 'Brass buttons too yacht-club for you? Swap them for dark horn ones. Most tailors will do it in ten minutes.'],
    ['date', 'The first date', 'Put-together without looking like you came from a meeting. Texture does the talking.', ['Navy merino crewneck', 'White oxford shirt, collar out', 'Dark, unfaded jeans', 'Dark-brown chelsea boots', 'One good watch'], 'Smell nice (two sprays, not six), have clean nails and put your phone away. That last part matters more than the knit.'],
    ['weekend', 'Saturday morning', 'Casual still has standards. Fit and cleanliness carry everything here, because there\'s nothing to hide behind.', ['Heavyweight white T-shirt', 'Olive chinos, slim not skinny', 'Clean white leather sneakers', 'No-show socks', 'Sunglasses that fit your face'], 'A T-shirt that fits: the shoulder seam sits on your shoulder, and the sleeves hit mid-bicep. Thicker cotton hangs better and hides less-than-perfect bits.'],
    ['dinner', 'The dinner party', 'Warm, textured, a little bit literary. The rollneck is the best-kept secret in menswear.', ['Brown tweed sport coat', 'Cream merino rollneck', 'Charcoal wool trousers', 'Dark-brown derbies', 'Rust square, puffed'], 'Bring something for the host (wine, flowers, chocolate), offer to help clear, and send a thank-you message the next morning.'],
    ['gala', 'Black tie', 'The most democratic dress code: everyone in the room wears the same thing, so it\'s all about fit and grooming.', ['Black or midnight-blue dinner jacket', 'Satin shawl or peak lapel', 'White shirt, black self-tie bow tie', 'Black patent or high-shine oxfords', 'White linen square'], 'Learn to tie a bow tie. It takes ten minutes of practice, and a slightly imperfect hand-tied bow looks far better than a perfect clip-on.'],
    ['commute', 'The cold commute', 'An overcoat makes anything under it look intentional. It\'s the first thing people see in winter.', ['Camel overcoat, below the knee', 'Charcoal trousers', 'Pale-blue shirt, navy tie', 'Black chelsea boots', 'Leather gloves'], 'Buy the overcoat a little roomy in the shoulders so it fits over a suit jacket. Camel and navy go over everything.'],
  ];
  if (track) {
    track.innerHTML = LOOKS.map(([k, n, d, items, tip], i) => `
      <article class="look">
        <div class="look-fig">${man(LK[k], { label: `Illustration: ${n}` })}<span class="look-no">${String(i + 1).padStart(2, '0')}</span></div>
        <div class="look-txt">
          <p class="fig-k">Plate ${String(i + 1).padStart(2, '0')} / ${String(LOOKS.length).padStart(2, '0')}</p>
          <h3>${n}</h3>
          <p class="look-d">${d}</p>
          <ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>
          <p class="look-tip"><b>Tip.</b> ${tip}</p>
        </div>
      </article>`).join('') + '<div class="look-end" aria-hidden="true"><p>Steal<br><em>freely.</em></p></div>';
    sizeLB();
    addEventListener('load', sizeLB);
  }

  /* ═════════════ outfit builder ═════════════ */
  const obFig = $('#ob-fig');
  if (obFig) {
    const OPT = {
      jacket: [
        ['none', 'No jacket', 2, { jacket: 'none' }],
        ['navysuit', 'Navy suit', 8, { jacket: 'suit', jc: C.navy }, true],
        ['charsuit', 'Charcoal suit', 8.5, { jacket: 'suit', jc: C.charcoal }, true],
        ['blazer', 'Navy blazer', 6, { jacket: 'blazer', jc: C.navy2 }],
        ['tweed', 'Tweed sport coat', 5, { jacket: 'sport', jc: C.tweed, jp: 'tweed' }],
        ['crew', 'Merino crewneck', 3.5, { jacket: 'crew', jc: C.bottle }],
        ['cardigan', 'Cardigan', 3.5, { jacket: 'cardigan', jc: C.oat }],
        ['dj', 'Dinner jacket', 10, { jacket: 'dinner', jc: C.black, lapel: 'shawl' }, true],
      ],
      shirt: [
        ['poplin', 'White poplin, spread', 8, { shirt: 'spread', sc: C.white }, true],
        ['ocbd', 'Blue oxford button-down', 5.5, { shirt: 'button', sc: C.blue }, true],
        ['stripe', 'Bengal stripe', 6.5, { shirt: 'point', sc: C.white, sp: 'stripe', spInk: 'rgba(52,84,150,.5)' }, true],
        ['tee', 'White T-shirt', 1.5, { shirt: 'tee', sc: C.white }],
        ['polo', 'Navy polo', 3, { shirt: 'polo', sc: C.navy }],
        ['roll', 'Cream rollneck', 4.5, { shirt: 'roll', sc: C.cream }],
      ],
      tie: [
        ['none', 'No tie', null, { tie: 'none' }],
        ['silk', 'Navy silk', 7, { tie: 'tie', tc: C.navy, tp: 'dot' }],
        ['repp', 'Burgundy stripe', 6.5, { tie: 'tie', tc: C.burgundy, tp: 'repp' }],
        ['knit', 'Green knit', 5, { tie: 'knit', tc: C.forest }],
        ['bow', 'Black bow tie', 10, { tie: 'bow', tc: C.black }],
      ],
      trousers: [
        ['flannel', 'Grey flannels', 6, { tr: 'tailored', trc: C.grey }],
        ['char', 'Charcoal wool', 6.5, { tr: 'tailored', trc: C.charcoal }],
        ['khaki', 'Khaki chinos', 4, { tr: 'chino', trc: C.khaki }],
        ['olive', 'Olive chinos', 3.5, { tr: 'chino', trc: C.olive }],
        ['jeans', 'Dark jeans', 2.5, { tr: 'jeans', trc: C.indigo }],
      ],
      shoes: [
        ['bo', 'Black oxfords', 9, { shoe: 'oxford', shc: C.black }],
        ['bro', 'Brown oxfords', 7.5, { shoe: 'oxford', shc: C.brown }],
        ['derby', 'Brown derbies', 6, { shoe: 'derby', shc: C.dbrown }],
        ['loafer', 'Suede loafers', 5, { shoe: 'loafer', shc: C.tan }],
        ['boot', 'Chelsea boots', 4.5, { shoe: 'boot', shc: '#4b3a2c' }],
        ['sneaker', 'White sneakers', 2, { shoe: 'sneaker', shc: '#f3f1ec' }],
      ],
    };
    const sel = { jacket: 'navysuit', shirt: 'poplin', tie: 'repp', trousers: 'flannel', shoes: 'bo' };
    const get = (g) => OPT[g].find((o) => o[0] === sel[g]);
    const groups = $('#ob-groups');
    groups.innerHTML = Object.keys(OPT).map((g) => `
      <div class="ob-g" data-g="${g}"><p class="fig-k">${g}</p><div class="chips">${OPT[g].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${sel[g] === k}">${n}</button>`).join('')}</div><p class="ob-lock"></p></div>`).join('');
    $$('.ob-g', groups).forEach((el) => seg($('.chips', el), (v) => { sel[el.dataset.g] = v; draw(); }));
    const CODE = [[9.2, 'Black tie'], [7.6, 'Business formal'], [6.2, 'Business'], [4.6, 'Smart casual'], [3, 'Casual'], [0, 'Weekend']];
    const draw = () => {
      const j = get('jacket'), s = get('shirt'), t = get('tie'), tr = get('trousers'), sh = get('shoes');
      const suit = !!j[4];
      const look = { skin: SKIN[2], hair: HAIR.dark, hairStyle: 'side', square: 'none', sock: C.navy, ...j[3], ...s[3], ...t[3], ...sh[3] };
      if (!suit) Object.assign(look, tr[3]); else { look.tr = 'tailored'; look.trc = null; }
      if (['suit', 'blazer', 'sport', 'dinner'].includes(look.jacket)) look.square = j[0] === 'tweed' ? 'puff' : 'flat', look.sqc = j[0] === 'tweed' ? '#b5523b' : C.white;
      if (look.shoe === 'sneaker') look.sock = C.white;
      swapIn(obFig, man(look, { label: 'Your outfit' }));
      const lock = $('.ob-g[data-g=trousers]', groups);
      lock.classList.toggle('locked', suit);
      $('.ob-lock', lock).textContent = suit ? 'The suit comes with matching trousers.' : '';
      // formality
      const fs = [j[2], s[2], t[2], suit ? j[2] : tr[2], sh[2]].filter((x) => x != null);
      const avg = fs.reduce((a, b) => a + b, 0) / fs.length;
      const spread = Math.max(...fs) - Math.min(...fs);
      const N = [];
      const collar = !!s[4];
      if (t[0] !== 'none' && !collar) N.push(['no', `A tie needs a proper collar. With a ${s[1].toLowerCase()}, lose the tie.`]);
      if (t[0] === 'bow' && j[0] !== 'dj') N.push(['meh', 'A black bow tie belongs with a dinner jacket. Outside black tie it reads as a costume.']);
      if (j[0] === 'dj' && t[0] !== 'bow') N.push(['no', 'A dinner jacket wants a black bow tie. No exceptions worth making.']);
      if (j[0] === 'dj' && sh[0] !== 'bo') N.push(['no', 'Black tie means black shoes: polished or patent oxfords.']);
      if (j[0] === 'dj' && s[0] !== 'poplin') N.push(['no', 'Black tie needs a plain white dress shirt.']);
      if (suit && j[0] !== 'dj' && sh[0] === 'sneaker') N.push(['meh', 'Suit plus sneakers: it can work with a soft, unstructured suit and spotless minimal sneakers, but it\'s a fashion move, not a classic one.']);
      if (suit && ['tee', 'polo'].includes(s[0])) N.push(['meh', 'A T-shirt or polo under a suit is a strong look. Works only if everything fits perfectly.']);
      if (sh[0] === 'bo' && !suit && ['khaki', 'olive', 'jeans'].includes(tr[0])) N.push(['meh', 'Black oxfords are the most formal shoe. With casual trousers they look borrowed from another outfit. Try brown or suede.']);
      if (j[0] === 'blazer' && tr[0] === 'jeans') N.push(['ok', 'Blazer and dark jeans: a modern classic.']);
      if (t[0] === 'knit' && suit && j[0] !== 'dj') N.push(['ok', 'A knit tie dresses a suit down beautifully.']);
      if (['crew', 'cardigan'].includes(j[0]) && collar) N.push(['ok', 'Knit over a collared shirt: very Ivy League, very easy.']);
      if (j[0] === 'tweed' && ['derby', 'boot', 'loafer'].includes(sh[0])) N.push(['ok', 'Tweed with brown country shoes. Textures that belong together.']);
      if (!N.some((n) => n[0] === 'no') && spread > 5.5) N.push(['meh', `Mixed signals: your most formal piece and your most casual piece are far apart. Bring the outliers closer together.`]);
      if (!N.length) N.push(['ok', 'Coherent. Every piece speaks the same language.']);
      const label = CODE.find(([th]) => avg >= th)[1];
      $('#ob-needle').style.setProperty('--p', `${(avg / 10) * 100}%`);
      $('#ob-code').textContent = label;
      const bad = N.filter((n) => n[0] === 'no').length, meh = N.filter((n) => n[0] === 'meh').length;
      $('#ob-grade').textContent = bad ? 'Needs work' : meh ? 'Almost' : 'Sharp';
      $('#ob-grade').dataset.k = bad ? 'no' : meh ? 'meh' : 'ok';
      $('#ob-notes').innerHTML = N.map(([k, t]) => `<li class="${k}">${t}</li>`).join('');
    };
    draw();
  }

  /* ═════════════ capsule ═════════════ */
  const capList = $('#cap-list');
  if (capList) {
    const P = [
      ['layer', 'Navy blazer', { jacket: 'blazer', jc: C.navy2 }, 6],
      ['layer', 'Grey tweed sport coat', { jacket: 'sport', jc: '#6c6f73', jp: 'tweed' }, 5],
      ['layer', 'Navy crewneck', { jacket: 'crew', jc: C.navy }, 3.5],
      ['shirt', 'White oxford shirt', { shirt: 'button', sc: C.white }, 5.5, true],
      ['shirt', 'Blue oxford shirt', { shirt: 'button', sc: C.blue }, 5.5, true],
      ['shirt', 'White T-shirt', { shirt: 'tee', sc: C.white }, 1.5],
      ['shirt', 'Navy polo', { shirt: 'polo', sc: C.navy }, 3],
      ['trousers', 'Grey flannels', { tr: 'tailored', trc: C.grey }, 6],
      ['trousers', 'Khaki chinos', { tr: 'chino', trc: C.khaki }, 4],
      ['trousers', 'Dark jeans', { tr: 'jeans', trc: C.indigo }, 2.5],
      ['shoes', 'Brown suede loafers', { shoe: 'loafer', shc: C.tan }, 5],
      ['shoes', 'Brown derbies', { shoe: 'derby', shc: C.dbrown }, 6],
      ['shoes', 'White sneakers', { shoe: 'sneaker', shc: '#f3f1ec', sock: C.white }, 2],
      ['shoes', 'Chelsea boots', { shoe: 'boot', shc: '#4b3a2c' }, 4.5],
      ['tie', 'Navy knit tie', { tie: 'knit', tc: C.navy }, 5],
    ];
    const own = new Set([0, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14]);
    capList.innerHTML = P.map(([g, n], i) => `<li><button type="button" data-i="${i}" aria-pressed="${own.has(i)}"><i class="cg-${g}"></i>${n}</button></li>`).join('');
    const fig = $('#cap-fig'), cnt = $('#cap-count'), pcs = $('#cap-pieces'), cap = $('#cap-cap');
    const valid = (o) => {
      if (o.tie && !(o.shirt && o.shirt[4])) return false;
      if (o.tie && o.shoes[1] === 'White sneakers') return false;
      if (o.layer && o.layer[2].jacket !== 'crew' && o.shirt[2].shirt === 'tee' && o.shoes[1] !== 'White sneakers') return false;
      const fs = [o.layer && o.layer[3], o.shirt[3], o.trousers[3], o.shoes[3], o.tie && o.tie[3]].filter(Boolean);
      return Math.max(...fs) - Math.min(...fs) <= 4.5;
    };
    const combos = () => {
      const by = (g) => [...own].map((i) => P[i]).filter((p) => p[0] === g);
      const L = [null, ...by('layer')], S = by('shirt'), T = by('trousers'), Sh = by('shoes'), Ti = [null, ...by('tie')];
      const res = [];
      for (const layer of L) for (const shirt of S) for (const trousers of T) for (const shoes of Sh) for (const tie of Ti) {
        const o = { layer, shirt, trousers, shoes, tie };
        if (valid(o)) res.push(o);
      }
      return res;
    };
    let last = 0;
    const countTo = (n) => {
      const from = last; last = n;
      if (RM) { cnt.textContent = n; return; }
      const t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 600); cnt.textContent = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const shuffle = () => {
      const all = combos();
      if (!all.length) { fig.innerHTML = '<p class="cap-empty">Add at least one shirt, one pair of trousers and one pair of shoes.</p>'; cap.textContent = ''; return; }
      const o = all[Math.floor(Math.random() * all.length)];
      const look = { skin: SKIN[Math.floor(Math.random() * 5)], hair: HAIR.dark, hairStyle: ['side', 'crop', 'curly'][Math.floor(Math.random() * 3)], jacket: 'none', tie: 'none', square: 'none', sock: C.navy, close: 'open', ...o.shirt[2], ...o.trousers[2], ...o.shoes[2] };
      if (o.layer) Object.assign(look, o.layer[2]);
      if (o.tie) Object.assign(look, o.tie[2]);
      if (look.jacket === 'blazer' || look.jacket === 'sport') { look.square = 'puff'; look.sqc = C.cream; }
      swapIn(fig, man(look, { label: 'A random outfit from your capsule' }));
      cap.textContent = [o.layer && o.layer[1], o.shirt[1], o.tie && o.tie[1], o.trousers[1], o.shoes[1]].filter(Boolean).join(' · ');
    };
    const update = () => {
      const n = combos().length;
      countTo(n);
      pcs.textContent = own.size;
    };
    $$('button', capList).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      own.has(i) ? own.delete(i) : own.add(i);
      b.setAttribute('aria-pressed', own.has(i));
      update(); shuffle();
    }));
    $('#cap-shuffle').addEventListener('click', shuffle);
    update(); shuffle();
  }

  /* ═════════════ flip cards ═════════════ */
  $$('.flip').forEach((f) => {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    f.setAttribute('aria-pressed', 'false');
    const t = () => { f.classList.toggle('flipped'); f.setAttribute('aria-pressed', f.classList.contains('flipped')); };
    f.addEventListener('click', t);
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } });
  });

  /* ═════════════ table setting ═════════════ */
  const table = $('#table-svg');
  if (table) {
    const info = $('#table-info');
    const T = {
      napkin: ['Napkin', 'Unfold it onto your lap as soon as you sit. If you leave mid-meal, put it on your chair; at the end, leave it loosely to the left of your plate.'],
      salad: ['Salad fork', 'The outer fork, for the first course. The golden rule: work from the outside in, one course at a time.'],
      fork: ['Dinner fork', 'For the main course. Forks on the left, knives and spoons on the right.'],
      plate: ['Dinner plate', 'Your plate is in the middle. Everything is laid out in the order you\'ll need it.'],
      knife: ['Dinner knife', 'Blade faces the plate. Once you\'ve used a piece of cutlery, it never goes back on the tablecloth, only on your plate.'],
      spoon: ['Soup spoon', 'On the far right. Spoon away from you, sip quietly from the side of the spoon, and tilt the bowl away from you to get the last bit.'],
      bread: ['Bread plate', 'Yours is on the left. Tear off a bite-sized piece, butter it, eat it. Don\'t butter the whole roll at once.'],
      bknife: ['Butter knife', 'Lives on the bread plate. Take butter from the shared dish onto your plate first, then onto your bread.'],
      dessert: ['Dessert spoon & fork', 'Above the plate. The spoon\'s handle points right (your right hand), the fork\'s points left.'],
      water: ['Water glass', 'Yours are on the right, above your knife. Hold wine glasses by the stem so your hand doesn\'t warm the wine.'],
      red: ['Red wine glass', 'Wider bowl. Don\'t fill it more than about a third.'],
      white: ['White wine glass', 'Narrower, so the wine stays cool. Not drinking? Just place your fingertips lightly over the rim when it\'s offered.'],
    };
    const show = (k) => {
      $$('[data-t]', table).forEach((e) => e.classList.toggle('on', e.dataset.t === k));
      info.innerHTML = `<b>${T[k][0]}</b><span>${T[k][1]}</span>`;
    };
    $$('[data-t]', table).forEach((e) => {
      e.setAttribute('tabindex', '0'); e.setAttribute('role', 'button'); e.setAttribute('aria-label', T[e.dataset.t][0]);
      e.addEventListener('click', () => show(e.dataset.t));
      e.addEventListener('mouseenter', () => show(e.dataset.t));
      e.addEventListener('focus', () => show(e.dataset.t));
    });
    const sc = $('#silent');
    seg($('#silent-ctl'), (v) => { sc.dataset.state = v; $('#silent-cap').textContent = v === 'pause' ? 'Pausing: fork and knife crossed or angled apart, like hands at twenty to four. The waiter leaves your plate.' : 'Finished: fork and knife side by side, handles at about four o\'clock. The waiter knows they can clear.'; });
  }

  /* ═════════════ quiz ═════════════ */
  const quiz = $('#quiz');
  if (quiz) {
    const Q = [
      ['You\'re at dinner and your phone buzzes. You\'re not expecting anything urgent.', ['Glance at it under the table', 'Leave it alone, face-down in your pocket', 'Pick it up, but apologise first'], 1, 'Phones live in pockets, not on tables. If you really are waiting for an urgent call, say so at the start and step away to take it.'],
      ['You meet someone and instantly forget their name.', ['Avoid using their name all evening', 'Ask again right away: "Sorry, tell me your name once more?"', 'Introduce them to a friend and hope they say it'], 1, 'Asking within the first minute is easy and flattering. Asking an hour later is awkward. Asking never is worse. Tip: use their name once straight away; it helps it stick.'],
      ['An invitation says "RSVP by Friday". You\'re not sure you can go.', ['Wait and see; turn up if you can', 'Reply by Friday either way', 'Say yes, and cancel if something comes up'], 1, 'An RSVP is a question, and silence isn\'t an answer. Hosts need numbers for food and seats. If you say yes, go.'],
      ['You invited a friend to dinner. The bill arrives.', ['Split it down the middle', 'You pay: you did the inviting', 'Go by who ordered what'], 1, 'Generally, whoever invites, pays. If you want to split it, make that clear when you invite them ("Dinner, my treat?" vs. "Shall we grab dinner?").'],
      ['Someone is a few steps behind you at a door.', ['Hold it open for them, whoever they are', 'Hold it only if they\'re older or a woman', 'Let it go; they can open it themselves'], 0, 'Courtesy isn\'t about gender. Hold it for anyone close behind, but don\'t hold it for someone 30 metres away and make them jog.'],
      ['You\'re seated at a wedding reception in a suit jacket. It\'s warm.', ['Take it off as soon as you sit down', 'Wait until the groom or host takes theirs off', 'Keep it on all night, no matter what'], 1, 'The traditional cue is the host. Once he removes his jacket, everyone can. If it\'s truly sweltering, it\'s okay to follow the room.'],
      ['A waiter brings you the wrong dish.', ['Eat it anyway, to be polite', 'Point it out kindly, with a smile', 'Ask for the manager'], 1, 'Mistakes happen. A calm "I think I ordered the fish, sorry!" fixes it. How you treat people who serve you says more about you than any suit.'],
      ['You\'re introducing your boss, Ms. Rao, to your friend Sam.', ['"Sam, this is Ms. Rao."', '"Ms. Rao, this is my friend Sam."', '"You two should meet, I\'m terrible at names!"'], 1, 'Traditionally you say the more senior or honoured person\'s name first, and add a detail to start the conversation: "Ms. Rao, this is my friend Sam. He just came back from Japan."'],
    ];
    let i = 0, score = 0;
    const box = $('#quiz-box'), prog = $('#quiz-prog');
    const render = () => {
      prog.style.setProperty('--p', `${(i / Q.length) * 100}%`);
      if (i >= Q.length) {
        const title = score === Q.length ? 'Gold-standard gentleman' : score >= 6 ? 'A true gent, give or take' : score >= 4 ? 'Promising. Keep practising' : 'Raised by wolves (lovely wolves)';
        box.innerHTML = `<div class="q-done"><p class="fig-k">Your score</p><p class="q-score">${score}<span>/${Q.length}</span></p><h4>${title}</h4><p>Manners are a skill, not a personality trait. Everyone gets better with practice.</p><button type="button" class="btn" id="q-again">Take it again</button></div>`;
        $('#q-again').addEventListener('click', () => { i = 0; score = 0; render(); });
        return;
      }
      const [q, opts] = Q[i];
      box.innerHTML = `<p class="fig-k">Question ${i + 1} of ${Q.length}</p><h4 class="q-q">${q}</h4><div class="q-opts">${opts.map((o, k) => `<button type="button" data-k="${k}"><i>${'ABC'[k]}</i>${o}</button>`).join('')}</div><div class="q-exp" aria-live="polite"></div>`;
      if (!RM) { box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap'); }
      $$('.q-opts button', box).forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, right = Q[i][2];
        if (k === right) score++;
        $$('.q-opts button', box).forEach((x) => { x.disabled = true; x.classList.toggle('right', +x.dataset.k === right); x.classList.toggle('wrong', +x.dataset.k === k && k !== right); });
        $('.q-exp', box).innerHTML = `<p><b>${k === right ? 'Correct.' : 'Not quite.'}</b> ${Q[i][3]}</p><button type="button" class="btn" id="q-next">${i === Q.length - 1 ? 'See your score' : 'Next question'} →</button>`;
        $('#q-next').addEventListener('click', () => { i++; render(); });
      }));
    };
    render();
  }

  /* ═════════════ checklist ═════════════ */
  const chk = $('#checklist');
  if (chk) {
    const KEY = 'lrn-gent-checklist';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    const boxes = $$('input[type=checkbox]', chk);
    const tally = $('#chk-tally');
    const upd = () => { const n = boxes.filter((b) => b.checked).length; tally.textContent = `${n} of ${boxes.length}`; chk.classList.toggle('all', n === boxes.length); };
    boxes.forEach((b, i) => {
      b.checked = !!saved[i];
      b.addEventListener('change', () => { saved[i] = b.checked; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* private mode */ } upd(); });
    });
    $('#chk-reset').addEventListener('click', () => { boxes.forEach((b) => (b.checked = false)); saved = {}; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } upd(); });
    upd();
  }

  onScroll();
})();

/* lrn — Off Duty. Motion: intro curtain, background morphs, masked reveals,
   scroll-linked reading, parallax, stacked cards, pinned lookbook, velocity marquee, cursor. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const body = document.body;

  /* ── text splitting ── */
  $$('.split').forEach((h) => {
    let n = 0;
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span class="wi">${[...w].map((c) => `<span class="c" style="--i:${n++}">${c}</span>`).join('')}</span></span>`).join(' ');
  });
  $$('.rv-words').forEach((p) => {
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w) => `<span class="rw">${w}</span>`).join(' ');
  });

  /* ── intro curtain ── */
  const loader = $('#loader'), ldN = $('#ld-n');
  const coverImgs = $$('.cover img');
  let loaded = 0;
  const finish = () => {
    if (body.classList.contains('ready')) return;
    body.classList.remove('loading'); body.classList.add('ready');
    setTimeout(() => loader && loader.remove(), 1600);
  };
  if (RM || !loader) finish();
  else {
    const t0 = performance.now();
    coverImgs.forEach((i) => { if (i.complete) loaded++; else i.addEventListener('load', () => loaded++, { once: true }); });
    const tick = (t) => {
      const timeP = clamp((t - t0) / 1600, 0, 1);
      const p = Math.min(timeP, 0.25 + 0.75 * (loaded / Math.max(1, coverImgs.length)));
      ldN.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (p >= 1 || t - t0 > 4500) { ldN.textContent = '100'; setTimeout(finish, 250); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── reveals ── */
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  $$('.split, .rv, .reveal, .card, .ch-head, .season').forEach((e) => io.observe(e));

  /* ── background morph ── */
  const bgSecs = $$('[data-bg]');
  const bio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const c = e.target.dataset.bg;
    body.style.setProperty('--bg', c);
    const dark = parseInt(c.slice(1, 3), 16) < 90;
    body.classList.toggle('on-dark', dark);
  }), { rootMargin: '-50% 0px -50% 0px' });
  bgSecs.forEach((s) => bio.observe(s));

  /* ── cursor ── */
  const cur = $('#cursor');
  if (FINE && !RM && cur) {
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; cur.classList.add('live'); }, { passive: true });
    $$('[data-cursor]').forEach((el) => { el.addEventListener('pointerenter', () => cur.classList.add('big')); el.addEventListener('pointerleave', () => cur.classList.remove('big')); });
    $$('a, button').forEach((el) => { el.addEventListener('pointerenter', () => cur.classList.add('link')); el.addEventListener('pointerleave', () => cur.classList.remove('link')); });
    const loop = () => { cx = lerp(cx, mx, 0.18); cy = lerp(cy, my, 0.18); cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); };
    loop();
  } else if (cur) cur.remove();

  /* ── scroll-driven frame ── */
  const prog = $('#prog');
  const pars = $$('[data-par]');
  const words = $$('.rv-words');
  const cards = $$('.card');
  const coverMain = $('.cover-main'), i1 = $('.cover-inset.i1'), i2 = $('.cover-inset.i2'), coverTxt = $('.cover-txt');
  const looks = $('#looks'), track = $('#looks-track'), lbar = $('#looks-bar'), lkI = $('#lk-i');
  const lookEls = $$('.look');
  const mq = $('#mq');
  let mqX = 0, lastY = scrollY, vel = 0, dir = 1;
  const wideMode = () => innerWidth > 860 && !RM;

  function sizeLooks() {
    if (!looks) return;
    if (wideMode()) { looks.classList.add('pinned'); looks.style.height = (track.scrollWidth - innerWidth + innerHeight * 1.1) + 'px'; }
    else { looks.classList.remove('pinned'); looks.style.height = ''; track.style.transform = ''; }
  }

  function frame() {
    const y = scrollY, vh = innerHeight;
    const m = document.documentElement.scrollHeight - vh;
    if (prog) prog.style.transform = `scaleX(${m > 0 ? y / m : 0})`;
    body.classList.toggle('scrolled', y > 40);

    if (!RM) {
      // cover: scroll-linked depth
      if (y < vh * 1.2 && coverMain) {
        const p = y / vh;
        coverMain.style.transform = `translate3d(0,${p * 18}vh,0) scale(${1 + p * 0.08})`;
        i1.style.transform = `translate3d(0,${-p * 30}vh,0)`;
        i2.style.transform = `translate3d(0,${-p * 48}vh,0)`;
        coverTxt.style.transform = `translate3d(0,${p * 10}vh,0)`;
        coverTxt.style.opacity = 1 - p * 1.1;
      }
      // parallax
      pars.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.setProperty('--py', `${(-p * +img.dataset.par * 100).toFixed(2)}%`);
      });
      // reading highlight
      words.forEach((p) => {
        const r = p.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const prog = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        const ws = p.children, n = ws.length, lit = prog * n;
        for (let i = 0; i < n; i++) ws[i].style.opacity = (0.16 + 0.84 * clamp(lit - i, 0, 1)).toFixed(2);
      });
      // stacked cards: shrink & dim the card being covered
      cards.forEach((c, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const r = next.getBoundingClientRect();
        const top = parseFloat(getComputedStyle(c).top) || 0;
        const p = clamp(1 - (r.top - top) / (vh * 0.75), 0, 1);
        c.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        c.style.setProperty('--dim', (p * 0.55).toFixed(3));
      });
    }
    // pinned lookbook
    if (looks && looks.classList.contains('pinned')) {
      const r = looks.getBoundingClientRect();
      const span = looks.offsetHeight - vh;
      const p = clamp(-r.top / span, 0, 1);
      const max = track.scrollWidth - innerWidth;
      track.style.transform = `translate3d(${-p * max}px,0,0)`;
      if (lbar) lbar.style.transform = `scaleX(${p})`;
      const mid = innerWidth / 2;
      let best = 0, bestD = 1e9;
      lookEls.forEach((el, i) => {
        const b = el.getBoundingClientRect();
        const d = (b.left + b.width / 2 - mid) / innerWidth;
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        el.style.setProperty('--d', d.toFixed(3));
      });
      if (lkI) lkI.textContent = String(best + 1).padStart(2, '0');
    }
  }

  // marquee: constant drift + scroll velocity
  function marquee() {
    const dy = scrollY - lastY; lastY = scrollY;
    if (dy) dir = dy > 0 ? 1 : -1;
    vel = lerp(vel, Math.abs(dy), 0.1);
    if (mq && !RM) {
      mqX -= (0.6 + vel * 0.35) * dir;
      const w = mq.scrollWidth / 2;
      if (mqX <= -w) mqX += w; if (mqX > 0) mqX -= w;
      mq.style.transform = `translate3d(${mqX}px,0,0) skewX(${clamp(-dy * 0.15, -8, 8)}deg)`;
    }
    frame();
    requestAnimationFrame(marquee);
  }
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(sizeLooks, 120); });
  addEventListener('load', sizeLooks);
  sizeLooks();
  requestAnimationFrame(marquee);
})();

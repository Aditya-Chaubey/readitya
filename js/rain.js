/* =========================================================
   rain.js — matrix-style digital rain (home page)
   Subtle green glyph columns behind the terminal.
   Cheap classic algorithm: one glyph per column per step,
   capped framerate, single scheduler. Respects reduced-motion.
   ========================================================= */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'rain';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  const GLYPHS = 'アイウエオカキクケコサシスセソ0123456789ABCDEF<>/\\[]{}=+*#$';
  const FONT = 14;          // glyph size (px)
  const FPS = 20;           // rain doesn't need 60fps
  const FRAME_MS = 1000 / FPS;

  let cols = [], w = 0, h = 0, rows = 0;

  function resize() {
    w = canvas.width = Math.max(window.innerWidth, document.documentElement.clientWidth, 320);
    h = canvas.height = Math.max(window.innerHeight, document.documentElement.clientHeight, 320);
    rows = Math.ceil(h / FONT);
    const n = Math.ceil(w / FONT);
    cols = Array.from({ length: n }, () => Math.floor(Math.random() * rows));  // head row per column
    ctx.font = `${FONT}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'top';
  }

  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  function draw() {
    // translucent wash dims the previous frame -> trailing tails
    ctx.fillStyle = 'rgba(10, 10, 11, 0.12)';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < cols.length; i++) {
      const y = cols[i] * FONT;
      const x = i * FONT;
      // bright leading glyph
      ctx.fillStyle = 'rgba(170, 255, 200, 0.9)';
      ctx.fillText(glyph(), x, y);
      // the glyph just behind the head, slightly dimmer, for a denser head
      ctx.fillStyle = 'rgba(92, 242, 141, 0.55)';
      ctx.fillText(glyph(), x, y - FONT);

      // advance; reset to top at random once past the bottom
      if (y > h && Math.random() > 0.975) cols[i] = 0;
      else cols[i]++;
    }
  }

  let raf, last = 0, paused = false;
  function tick(ts) {
    if (paused) return;
    raf = requestAnimationFrame(tick);
    if (ts - last < FRAME_MS) return;     // throttle to target FPS
    last = ts;
    draw();
  }

  // debug handle: lets a screenshot capture a stable frame
  window.__RAIN = {
    stop() { paused = true; cancelAnimationFrame(raf); },
    start() { if (paused) { paused = false; last = 0; raf = requestAnimationFrame(tick); } },
  };

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(tick);
})();

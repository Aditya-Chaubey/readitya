/* =========================================================
   main.js — shared chrome for every page
   - injects topbar + status line
   - live clock
   - text-scramble hover on [data-scramble]
   - reveal-on-scroll for [data-reveal]
   - live cursor coordinates in status bar
   ========================================================= */

const ROUTES = [
  { id: 'home',     label: 'home',     href: 'index.html' },
  { id: 'about',    label: 'about',    href: 'about.html' },
  { id: 'projects', label: 'projects', href: 'projects.html' },
  { id: 'contact',  label: 'contact',  href: 'contact.html' },
];

function currentPage() {
  return document.body.dataset.page || 'home';
}

/* ---------- chrome injection ---------- */
function mountChrome() {
  const page = currentPage();

  // atmosphere layers
  const fx = document.createElement('div');
  fx.innerHTML = `<div class="fx-grid"></div><div class="fx-vignette"></div><div class="fx-grain"></div>`;
  document.body.prepend(...fx.children);

  // topbar
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <a class="topbar__brand" href="index.html" aria-label="home">
      <span class="dot"></span><span>~/</span><b>portfolio</b>
    </a>
    <nav class="nav" aria-label="primary">
      ${ROUTES.filter(r => r.id !== 'home').map(r =>
        `<a href="${r.href}" data-scramble class="${r.id === page ? 'is-active' : ''}">${r.label}</a>`
      ).join('')}
    </nav>
    <div class="topbar__clock" aria-hidden="true">
      <span id="clock"><b>--:--:--</b></span>
    </div>`;
  document.body.appendChild(topbar);

  // status line
  const status = document.createElement('footer');
  status.className = 'statusbar';
  status.innerHTML = `
    <div class="seg">
      <span>STATUS:</span><span style="color:var(--accent)">● ONLINE</span>
      <span class="hide-sm">// SESSION ${Math.random().toString(36).slice(2, 8).toUpperCase()}</span>
    </div>
    <div class="seg">
      <span class="hide-sm">${navigator.language || 'en'} / utf-8</span>
      <span class="statusbar__coords" id="coords">x:000 y:000</span>
      <span class="key">ESC</span>
    </div>`;
  document.body.appendChild(status);
}

/* ---------- glitch / scatter cursor trail ---------- */
function mountTrail() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'trail';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const TRAIL_GLYPHS = '01<>/\\[]{}=+*#%$&_?:;ﾊﾐﾋｰ';
  let w, h, particles = [];
  let lastX = 0, lastY = 0, lastSpawn = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    ctx.textBaseline = 'middle';
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn(x, y, intensity) {
    const count = 1 + Math.floor(intensity * 3);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2 - 0.3,
        ch: TRAIL_GLYPHS[(Math.random() * TRAIL_GLYPHS.length) | 0],
        size: 9 + Math.random() * 7,
        life: 1,
        decay: 0.025 + Math.random() * 0.04,
        glitch: Math.random() < 0.35,         // some get RGB-split
      });
    }
    if (particles.length > 160) particles.splice(0, particles.length - 160);
  }

  let running = false;
  function ensureRunning() { if (!running) { running = true; requestAnimationFrame(frame); } }

  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    const dist = Math.hypot(dx, dy);
    lastX = e.clientX; lastY = e.clientY;
    if (now - lastSpawn > 16 && dist > 2) {
      spawn(e.clientX, e.clientY, Math.min(dist / 40, 1));
      lastSpawn = now;
      ensureRunning();
    }
  }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, w, h);
    if (particles.length === 0) { running = false; return; }  // idle: stop looping
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      if (Math.random() < 0.12) p.ch = TRAIL_GLYPHS[(Math.random() * TRAIL_GLYPHS.length) | 0];
      ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
      const a = p.life;
      if (p.glitch) {
        ctx.fillStyle = `rgba(255, 80, 90, ${a * 0.5})`;
        ctx.fillText(p.ch, p.x - 1.5, p.y);
        ctx.fillStyle = `rgba(90, 180, 255, ${a * 0.5})`;
        ctx.fillText(p.ch, p.x + 1.5, p.y);
      }
      ctx.fillStyle = `rgba(92, 242, 141, ${a})`;
      ctx.fillText(p.ch, p.x, p.y);
    }
    requestAnimationFrame(frame);
  }
}

/* ---------- live clock ---------- */
function startClock() {
  const el = () => document.getElementById('clock');
  const tick = () => {
    const node = el(); if (!node) return;
    const d = new Date();
    const t = d.toLocaleTimeString('en-GB', { hour12: false });
    node.innerHTML = `<b>${t}</b>`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- cursor coordinates ---------- */
function startCoords() {
  const node = () => document.getElementById('coords');
  window.addEventListener('pointermove', (e) => {
    const n = node(); if (!n) return;
    const x = String(Math.round(e.clientX)).padStart(3, '0');
    const y = String(Math.round(e.clientY)).padStart(3, '0');
    n.textContent = `x:${x} y:${y}`;
  }, { passive: true });
}

/* ---------- text scramble on hover ---------- */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#________';
function scramble(el) {
  const original = el.dataset.text || el.textContent;
  el.dataset.text = original;
  let frame = 0;
  const queue = [...original].map((ch, i) => ({
    ch, start: Math.floor(Math.random() * 8), end: Math.floor(Math.random() * 8) + 8 + i,
  }));
  let raf;
  const run = () => {
    let out = '', done = 0;
    queue.forEach((q) => {
      if (frame >= q.end) { out += q.ch; done++; }
      else if (frame >= q.start) {
        if (!q.r || Math.random() < 0.28) q.r = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        out += `<span style="color:var(--accent)">${q.r}</span>`;
      } else out += '';
    });
    el.innerHTML = out;
    if (done === queue.length) { el.textContent = original; return; }
    frame++;
    raf = requestAnimationFrame(run);
  };
  cancelAnimationFrame(raf);
  frame = 0;
  run();
}
function bindScramble() {
  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.addEventListener('mouseenter', () => scramble(el));
    el.addEventListener('focus', () => scramble(el));
  });
}

/* ---------- reveal on scroll ---------- */
function bindReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const delay = e.target.dataset.reveal || 0;
        setTimeout(() => e.target.classList.add('in'), delay * 90);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach((el) => io.observe(el));
}

/* ---------- ESC -> home ---------- */
function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentPage() !== 'home') {
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      window.location.href = 'index.html';
    }
  });
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  mountChrome();
  mountTrail();
  startClock();
  startCoords();
  bindScramble();
  bindReveal();
  bindKeys();
});

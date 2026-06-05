/* =========================================================
   terminal.js — interactive command prompt for the home page
   Type a command (or click a chip) to navigate.
   Supports: about, projects, contact, help, ls, whoami, clear,
   history (↑/↓), Tab autocomplete.
   ========================================================= */

const NAV = {
  about:    'about.html',
  projects: 'projects.html',
  contact:  'contact.html',
  home:     'index.html',
};

const COMMANDS = ['about', 'projects', 'contact', 'help', 'ls', 'whoami', 'clear', 'home'];

const HELP = [
  ['about',    'read the bio / background'],
  ['projects', 'browse the work archive'],
  ['contact',  'open communication channels'],
  ['ls',       'list everything available'],
  ['whoami',   'identify the current session'],
  ['clear',    'wipe the console'],
  ['help',     'show this list'],
];

document.addEventListener('DOMContentLoaded', () => {
  const body   = document.getElementById('term-body');
  const input  = document.getElementById('term-input');
  const cursor = document.getElementById('term-cursor');
  const ps1Path = '~/portfolio';
  let history = [];
  let hIdx = -1;
  let locked = false;

  /* ---- intro typing sequence ---- */
  const intro = [
    { t: 'booting portfolio.os v4.0 ...', cls: 'dim', d: 280 },
    { t: 'modules loaded ✓  renderer ✓  input ✓', cls: 'dim', d: 260 },
    { t: '', d: 80 },
    { t: "welcome, visitor. you've reached an interactive index.", cls: 'muted', d: 0 },
    { t: "type a command and hit ⏎ — or click a suggestion below.", cls: 'muted', d: 0 },
    { t: "try: help", cls: 'accent', d: 0 },
  ];

  function line(text, cls = '') {
    const el = document.createElement('div');
    el.className = 'term-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    body.appendChild(el);
    return el;
  }

  function typeLine(text, cls, done) {
    const el = line('', cls);
    let i = 0;
    const speed = 12;
    const step = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, speed);
      else done && done();
    };
    step();
  }

  async function runIntro() {
    locked = true;
    for (const ln of intro) {
      await new Promise((res) => {
        if (!ln.t) { line(' '); setTimeout(res, ln.d); return; }
        typeLine(ln.t, ln.cls, () => setTimeout(res, ln.d));
      });
    }
    locked = false;
    focusInput();
  }

  /* ---- echo a typed command into the log ---- */
  function echoCommand(cmd) {
    const el = document.createElement('div');
    el.className = 'term-line';
    el.innerHTML = `<span class="pfx">visitor@portfolio</span>:<span class="path">${ps1Path}</span>$ ${escapeHtml(cmd)}`;
    body.appendChild(el);
  }

  function output(html) {
    const el = document.createElement('div');
    el.className = 'term-output';
    el.innerHTML = html;
    body.appendChild(el);
  }

  function navigate(href, label) {
    locked = true;
    output(`<span style="color:var(--accent)">→ opening ${label} …</span>`);
    scrollDown();
    setTimeout(() => { window.location.href = href; }, 520);
  }

  /* ---- command handler ---- */
  function handle(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    echoCommand(raw.trim());
    history.unshift(raw.trim());
    hIdx = -1;

    if (NAV[cmd]) {
      navigate(NAV[cmd], cmd);
      return;
    }
    switch (cmd) {
      case 'help':
        output(
          `<div style="color:var(--muted);margin-bottom:6px">available commands:</div>` +
          HELP.map(([c, d]) =>
            `<div><a data-cmd="${c}">${c.padEnd(10, ' ')}</a><span style="color:var(--dim)"> — ${d}</span></div>`
          ).join('')
        );
        break;
      case 'ls':
        output(
          `<div style="color:var(--dim);margin-bottom:4px">drwxr-xr-x  visitor  ${new Date().getFullYear()}</div>` +
          ['about', 'projects', 'contact'].map(c =>
            `<div><span style="color:var(--dim)">— </span><a data-cmd="${c}">${c}/</a></div>`
          ).join('')
        );
        break;
      case 'whoami':
        output(`<span style="color:var(--muted)">guest · read-only · session ${Math.random().toString(36).slice(2,8)}</span>`);
        break;
      case 'clear':
        body.innerHTML = '';
        break;
      default:
        output(`<span class="term-line err">command not found: ${escapeHtml(cmd)}</span><br><span style="color:var(--dim)">type <a data-cmd="help">help</a> for options.</span>`);
    }
    scrollDown();
  }

  /* ---- helpers ---- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function focusInput() { if (!locked) input.focus(); }

  /* ---- cursor follows input ---- */
  function syncCursor() {
    const mirror = document.getElementById('term-mirror');
    mirror.textContent = input.value || '';
    cursor.style.transform = `translateX(${mirror.offsetWidth}px)`;
  }

  /* ---- events ---- */
  input.addEventListener('input', syncCursor);

  input.addEventListener('keydown', (e) => {
    if (locked) { e.preventDefault(); return; }
    if (e.key === 'Enter') {
      handle(input.value);
      input.value = '';
      syncCursor();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      const match = COMMANDS.find(c => c.startsWith(v) && v);
      if (match) { input.value = match; syncCursor(); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; syncCursor(); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
      else { hIdx = -1; input.value = ''; }
      syncCursor();
    }
  });

  // clicking anywhere in the terminal focuses input
  document.querySelector('.terminal').addEventListener('click', (e) => {
    if (e.target.dataset.cmd) { handle(e.target.dataset.cmd); return; }
    focusInput();
  });

  // suggestion chips
  document.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => handle(chip.dataset.chip));
  });

  // delegate clicks on generated command links
  body.addEventListener('click', (e) => {
    if (e.target.dataset && e.target.dataset.cmd) handle(e.target.dataset.cmd);
  });

  syncCursor();
  runIntro();
});

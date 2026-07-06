/* =========================================================
   command.js — persistent bottom command bar (inner pages)
   Same vocabulary as the home terminal: navigate from anywhere.
   Output (help/ls/errors) appears in a flyout above the bar.
   ========================================================= */
(function () {
  const NAV = {
    home: 'index.html', about: 'about.html',
    projects: 'projects.html', contact: 'contact.html',
  };
  const COMMANDS = ['home', 'about', 'projects', 'contact', 'help', 'ls', 'whoami', 'clear'];
  const HELP = [
    ['home', 'return to the console'],
    ['about', 'read the bio / background'],
    ['projects', 'browse the work archive'],
    ['contact', 'open communication channels'],
    ['ls', 'list everything available'],
    ['help', 'show this list'],
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page || '';
    document.body.classList.add('has-cmdbar');

    const bar = document.createElement('div');
    bar.className = 'cmdbar';
    bar.innerHTML = `
      <div class="cmdbar__flyout" id="cmd-flyout"></div>
      <span class="ps1"><span class="userhost"><span style="color:var(--accent)">visitor@portfolio</span>:</span><span class="path">~/${page}</span>$</span>
      <span class="cmdbar__field">
        <input id="cmd-input" type="text" autocomplete="off" autocapitalize="off"
               spellcheck="false" aria-label="command input"
               placeholder="type a destination — about · projects · contact · help" />
        <span id="cmd-mirror" style="position:absolute;visibility:hidden;white-space:pre;font:inherit;"></span>
        <span class="cursor-block" id="cmd-cursor"></span>
      </span>
      <span class="cmdbar__hint">⏎ run · ⇥ complete</span>`;
    document.body.appendChild(bar);

    const input  = document.getElementById('cmd-input');
    const mirror = document.getElementById('cmd-mirror');
    const cursor = document.getElementById('cmd-cursor');
    const flyout = document.getElementById('cmd-flyout');
    let history = [], hIdx = -1, flyTimer;

    function syncCursor() {
      mirror.textContent = input.value || '';
      // offset by placeholder width? cursor tracks typed text from field start
      cursor.style.transform = `translateX(${mirror.offsetWidth}px)`;
      cursor.style.opacity = document.activeElement === input ? '1' : '0';
    }

    function showFlyout(html, sticky) {
      flyout.innerHTML = html;
      flyout.classList.add('show');
      clearTimeout(flyTimer);
      if (!sticky) flyTimer = setTimeout(() => flyout.classList.remove('show'), 4200);
    }
    function hideFlyout() { flyout.classList.remove('show'); }

    function navigate(href, label) {
      showFlyout(`<div class="fo-line" style="color:var(--accent)">→ opening ${label} …</div>`, true);
      setTimeout(() => { window.location.href = href; }, 360);
    }

    function run(raw) {
      const cmd = (raw || '').trim().toLowerCase();
      if (!cmd) return;
      history.unshift(cmd); hIdx = -1;

      if (NAV[cmd]) {
        if (cmd === page) { showFlyout(`<div class="fo-line">already here: <span style="color:var(--accent)">~/${page}</span></div>`); return; }
        navigate(NAV[cmd], cmd); return;
      }
      switch (cmd) {
        case 'help':
          showFlyout(
            `<div class="fo-head">available commands</div>` +
            HELP.map(([c, d]) => `<div class="fo-line"><a data-cmd="${c}">${c.padEnd(9, ' ')}</a> — ${d}</div>`).join('')
          );
          break;
        case 'ls':
          showFlyout(
            `<div class="fo-head">~/portfolio</div>` +
            ['about', 'projects', 'contact'].map(c => `<div class="fo-line">— <a data-cmd="${c}">${c}/</a></div>`).join('')
          );
          break;
        case 'whoami':
          showFlyout(`<div class="fo-line">guest · read-only · session ${Math.random().toString(36).slice(2, 8)}</div>`);
          break;
        case 'clear':
          hideFlyout();
          break;
        default:
          showFlyout(`<div class="fo-line fo-err">command not found: ${cmd}</div><div class="fo-line">type <a data-cmd="help">help</a> for options.</div>`);
      }
    }

    input.addEventListener('input', syncCursor);
    input.addEventListener('focus', syncCursor);
    input.addEventListener('blur', syncCursor);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        run(input.value); input.value = ''; syncCursor();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.trim().toLowerCase();
        const m = v && COMMANDS.find(c => c.startsWith(v));
        if (m) { input.value = m; syncCursor(); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; syncCursor(); }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIdx > 0) { hIdx--; input.value = history[hIdx]; }
        else { hIdx = -1; input.value = ''; }
        syncCursor();
      } else if (e.key === 'Escape') {
        e.stopPropagation();           // let the bar clear instead of leaving the page
        if (input.value) { input.value = ''; syncCursor(); }
        else { hideFlyout(); input.blur(); }
      }
    });

    flyout.addEventListener('click', (e) => {
      if (e.target.dataset && e.target.dataset.cmd) run(e.target.dataset.cmd);
    });

    // press "/" anywhere to jump into the command bar
    document.addEventListener('keydown', (e) => {
      const ae = document.activeElement;
      const typing = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA');
      if (e.key === '/' && !typing) { e.preventDefault(); input.focus(); }
    });

    syncCursor();
  });
})();

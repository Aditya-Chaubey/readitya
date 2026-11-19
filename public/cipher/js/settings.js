/* CIPHER — Settings: identity, preferences, security and archive. */
(() => {
  "use strict";
  const { esc, today } = CX;

  const ACCENTS = [["gold", "Gold", "#c9a96a"], ["silver", "Platinum", "#b9c0ca"], ["emerald", "Emerald", "#6fb08c"], ["crimson", "Crimson", "#c46a6a"], ["sapphire", "Sapphire", "#6f95c9"]];
  const LABELS = { events: "Operations", missions: "Missions", drills: "Drills", cases: "Cases", txns: "Transactions", accounts: "Accounts", recurring: "Recurring", reserves: "Reserves", people: "People", skills: "Skills", journal: "Log entries", vault: "Vault records" };

  const sel = (name, opts, v) => `<select id="s_${name}" name="${name}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? "selected" : ""}>${l}</option>`).join("")}</select>`;

  function render() {
    const s = CX.S.settings;
    const size = new Blob([JSON.stringify(CX.S)]).size;
    const photos = Object.keys(CX.media.all()).length;
    return `
      <div class="grid g2">
        <form class="panel" data-form="prefs">
          <div class="panel-head"><h2>Identity & preferences</h2></div>
          <div class="two"><div class="field"><label for="s_codename">Codename</label><input id="s_codename" name="codename" value="${esc(s.codename)}"></div>
          <div class="field"><label for="s_realName">Real name</label><input id="s_realName" name="realName" value="${esc(s.realName)}" placeholder="Optional"></div></div>
          <div class="two"><div class="field"><label for="s_currency">Currency symbol</label><input id="s_currency" name="currency" value="${esc(s.currency)}" maxlength="4"></div>
          <div class="field"><label for="s_grouping">Number format</label>${sel("grouping", [["indian", "Indian · 1,00,000"], ["intl", "International · 100,000"]], s.grouping)}</div></div>
          <div class="two"><div class="field"><label for="s_clock">Clock</label>${sel("clock", [["24", "24-hour · 18:30"], ["12", "12-hour · 6:30pm"]], s.clock)}</div>
          <div class="field"><label for="s_weekStart">Week starts on</label>${sel("weekStart", [["mon", "Monday"], ["sun", "Sunday"]], s.weekStart)}</div></div>
          <div class="two"><div class="field"><label for="s_cadence">Default contact cadence (days)</label><input id="s_cadence" name="cadence" type="number" min="1" value="${esc(s.cadence)}"></div>
          <div class="field"><label for="s_budget">Monthly budget</label><input id="s_budget" name="budget" type="number" min="0" step="any" value="${esc(s.budget)}"></div></div>
          <div class="field"><label>Accent</label><div class="swatches">${ACCENTS.map(([k, l, c]) => `<label class="swatch"><input type="radio" name="accent" value="${k}" ${s.accent === k ? "checked" : ""}><span style="--c:${c}"></span>${l}</label>`).join("")}</div></div>
          <button class="btn gold">Save preferences</button>
        </form>

        <div class="stack">
          <form class="panel" data-form="pin">
            <div class="panel-head"><h2>Security</h2><span class="badge ${s.pinHash ? "ok" : ""}">${s.pinHash ? "Passcode on" : "No passcode"}</span></div>
            <p class="help">A passcode shows a lock screen whenever the console opens. It keeps casual eyes out on a shared device; it does not encrypt your data.</p>
            <div class="two">
              <div class="field"><label for="s_pin">${s.pinHash ? "New passcode" : "Set passcode"}</label><input id="s_pin" name="pin" type="password" minlength="4" placeholder="At least 4 characters" autocomplete="new-password"></div>
              <div class="field"><label for="s_autoLock">Auto-lock after</label>${sel("autoLock", [["0", "Never"], ["1", "1 minute idle"], ["5", "5 minutes idle"], ["15", "15 minutes idle"], ["30", "30 minutes idle"], ["60", "1 hour idle"]], s.autoLock)}</div>
            </div>
            <div class="actions">
              <button class="btn gold">${s.pinHash ? "Update security" : "Set passcode"}</button>
              ${s.pinHash ? `<button type="button" class="btn ghost danger" data-act="clear-pin">Remove passcode</button><button type="button" class="btn ghost" data-act="lock-now">Lock now</button>` : ""}
            </div>
          </form>
          <div class="panel">
            <div class="panel-head"><h2>Install on iPhone</h2><span class="badge ${CX.isStandalone() ? "ok" : ""}">${CX.isStandalone() ? "Installed" : "In browser"}</span></div>
            <ol class="steps">
              <li>Open this page in <b>Safari</b> on your iPhone.</li>
              <li>Tap the <b>Share</b> button at the bottom of the screen.</li>
              <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            </ol>
            <p class="help" style="margin:10px 0 0">Cipher then opens full-screen from its own icon and works offline. Each device keeps its own data — move it with Export and Import below.</p>
          </div>
          <div class="panel kbd-panel">
            <div class="panel-head"><h2>Keyboard</h2></div>
            <div class="kv"><span>Search & commands</span><b><kbd>Ctrl K</kbd> or <kbd>/</kbd></b></div>
            <div class="kv"><span>New item in current section</span><b><kbd>N</kbd></b></div>
            <div class="kv"><span>Jump to section</span><b><kbd>1</kbd> … <kbd>8</kbd></b></div>
            <div class="kv"><span>Lock console</span><b><kbd>Shift L</kbd></b></div>
            <div class="kv"><span>Close a window</span><b><kbd>Esc</kbd></b></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h2>Archive</h2><span class="kicker">${(size / 1024).toFixed(1)} KB · ${photos} photo${photos === 1 ? "" : "s"}</span></div>
          <p class="help">Everything is stored only in this browser — records in local storage, photos in its image database. Export a backup regularly (photos included); import it to restore or move to another device.</p>
          <div class="actions">
            <button class="btn gold" data-act="export-json">Export full backup</button>
            <label class="btn" for="importFile" style="cursor:pointer">Import backup</label>
            <input id="importFile" type="file" accept="application/json,.json" hidden data-change="import">
            <button class="btn" data-act="export-csv">Ledger CSV</button>
            <button class="btn" data-act="export-ics">Calendar .ics</button>
          </div>
          <div class="form-sec mono tiny">Inventory</div>
          <div class="inv">${CX.COLLS.map((k) => `<div class="kv"><span>${LABELS[k]}</span><b>${CX.S[k].length}</b></div>`).join("")}</div>
        </div>

        <div class="panel">
          <div class="panel-head"><h2>Burn notice</h2></div>
          <p class="help">Permanently erase records from this console. Export first if you want to keep anything. You'll get a few seconds to undo.</p>
          <div class="actions">
            <button class="btn ghost danger" data-act="clear-records">Erase all records, keep settings</button>
            <button class="btn ghost danger" data-act="wipe">Erase everything</button>
            <button class="btn ghost" data-act="load-sample">Reload sample data</button>
          </div>
        </div>
      </div>`;
  }

  CX.forms.prefs = (d) => {
    const s = CX.S.settings;
    Object.assign(s, {
      codename: d.codename || "Agent", realName: d.realName || "", currency: d.currency || "₹", grouping: d.grouping, clock: d.clock,
      weekStart: d.weekStart, cadence: Number(d.cadence) || 30, budget: Number(d.budget) || 0, accent: d.accent || "gold",
    });
    CX.save(); CX.applyPrefs(); CX.render(); CX.toast("Preferences saved.");
  };
  CX.forms.pin = async (d) => {
    const s = CX.S.settings;
    if (d.pin) {
      if (d.pin.length < 4) return CX.toast("Passcode must be at least 4 characters.");
      s.pinHash = await CX.hash(d.pin);
    }
    s.autoLock = Number(d.autoLock) || 0;
    if (s.autoLock && !s.pinHash) CX.toast("Auto-lock needs a passcode.");
    else CX.toast(d.pin ? "Passcode set." : "Security updated.");
    CX.save(); CX.render();
  };
  CX.changes.import = (el) => {
    const file = el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || typeof d !== "object" || !d.settings) throw new Error("bad");
        if (!confirm("Importing replaces all current data with the backup. Continue?")) return;
        if (d.media && typeof d.media === "object") Object.entries(d.media).forEach(([k, v]) => { if (typeof v === "string" && v.startsWith("data:image/")) CX.media.put(v, k); });
        CX.undoable("Backup restored.", () => { CX.S = CX.normalize(d); });
        CX.applyPrefs();
      } catch { CX.toast("That file is not a valid Cipher backup."); }
      el.value = "";
    };
    reader.readAsText(file);
  };

  Object.assign(CX.actions, {
    "clear-pin": () => { CX.S.settings.pinHash = ""; CX.S.settings.autoLock = 0; CX.save(); CX.render(); CX.toast("Passcode removed."); },
    "lock-now": () => CX.lock(),
    "clear-records": () => {
      if (!confirm("Erase every record (operations, missions, drills, money, people, skills, log, vault) but keep settings?")) return;
      CX.undoable("All records erased.", () => { CX.COLLS.forEach((k) => { CX.S[k] = []; }); });
    },
    wipe: () => {
      if (!confirm("Erase EVERYTHING, including settings and passcode?")) return;
      CX.undoable("Burn notice executed.", () => { CX.S = CX.blank(); });
      CX.applyPrefs();
    },
    "load-sample": () => {
      if (!confirm("Replace your current data with the sample data?")) return;
      const keep = CX.S.settings;
      CX.undoable("Sample data loaded.", () => { CX.S = CX.seed(); CX.S.settings = { ...CX.S.settings, ...keep, catBudgets: CX.S.settings.catBudgets }; });
    },
  });

  CX.view("settings", { order: 99, footer: true, icon: "settings", label: "Settings", kicker: "Console configuration", render });
})();

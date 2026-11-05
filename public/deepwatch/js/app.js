import { CATEGORIES, VIDEOS, PLAYLISTS, PATHS, LESSONS } from './data.js';
import * as store from './store.js';
import * as rec from './rec.js';

/* ---------- state & helpers ---------- */
const S = store.load();
let catalog = new Map();
const rebuild = () => { catalog = new Map([...VIDEOS, ...S.custom].map(v => [v.id, v])); };
rebuild();
const PL = new Map(PLAYLISTS.map(p => [p.id, p]));
const LESSON_TITLE = new Map(Object.values(LESSONS).flat());
let frozen = false; // set while erasing so unload handlers don't write the old state back
const save = (now) => { if (!frozen) store.save(S, now); };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const catName = id => (CATEGORIES.find(c => c.id === id) || { name: 'Other' }).name;
const fmtDur = sec => {
  sec = Math.round(sec || 0); if (!sec) return '';
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};
const fmtMin = sec => { const m = Math.round(sec / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const hue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
// Middle frame: YouTube auto-captures frames at 25/50/75% of every video. "2" is the midpoint.
const thumb = (id, q = 'sd2') => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
const parseId = s => (s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/) || s.trim().match(/^([\w-]{11})$/) || [])[1];

const I = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  deep: '<path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h12M8 7h6"/>',
  queue: '<path d="M4 6h12M4 12h12M4 18h7M17 14v6m-3-3h6"/>',
  notes: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tune: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  dots: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  up: '<path d="M7 10v11H3V10zm0 0l5-7a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.6 21H7"/>',
  down: '<path d="M17 14V3h4v11zm0 0l-5 7a2 2 0 0 1-3-2l1-5H4a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 5.4 3H17"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  focus: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
  ext: '<path d="M14 3h7v7M10 14L21 3M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  chevl: '<path d="M15 6l-6 6 6 6"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  t_ai: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9.5 9.5h5v5h-5zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  t_cs: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  t_math: '<path d="M18 5H6l6 7-6 7h12"/>',
  t_physics: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  t_biology: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15zM5 19l8-8"/>',
  t_science: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3M7 15h10"/>',
  t_tech: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  t_history: '<path d="M3 21h18M4 10h16M12 3l9 5H3zM6 10v8M10 10v8M14 10v8M18 10v8"/>',
  t_philosophy: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
  t_society: '<path d="M3 3v18h18M7 15l4-4 3 3 5-6"/>',
  t_arts: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 21 9.8C21 6 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
  t_learning: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  less: '<path d="M5 12h14"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  reddit: '<circle cx="12" cy="13" r="7"/><circle cx="9.5" cy="12.5" r="1" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor"/><path d="M9.5 15.5c1.5 1 3.5 1 5 0M12 6l1-3 4 1"/><circle cx="18" cy="4" r="1.2"/>',
};
const HUE = { ai: 265, cs: 215, math: 38, physics: 195, biology: 140, science: 172, tech: 20, history: 30, philosophy: 300, society: 95, arts: 335, learning: 55 };
const topicIcon = c => `<span class="t-ic" style="--h:${HUE[c] ?? 200}">${icon('t_' + c)}</span>`;
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

// Fallback chain for middle-frame thumbnails: sd2 (640x480) -> hq2 (480x360) -> mq2
// YouTube answers a missing frame with a 120x90 grey placeholder, so check size on load too.
function nextThumb(img) {
  const order = ['sd2', 'hq2', 'mq2'];
  const next = order[order.indexOf(img.dataset.q || 'sd2') + 1];
  if (next) { img.dataset.q = next; img.src = thumb(img.dataset.vid, next); }
}
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.dataset.vid) nextThumb(e.target); }, true);
document.addEventListener('load', e => { const img = e.target; if (img.tagName === 'IMG' && img.dataset.vid && img.naturalWidth <= 120 && img.dataset.q !== 'mq2') nextThumb(img); }, true);

/* ---------- toast & modal ---------- */
function toast(msg, opts = {}) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${msg}</span>${opts.undo ? '<button class="link">Undo</button>' : ''}`;
  $('#toasts').appendChild(el);
  if (opts.undo) el.querySelector('button').onclick = () => { opts.undo(); el.remove(); };
  setTimeout(() => el.classList.add('out'), opts.ms || 3800);
  setTimeout(() => el.remove(), (opts.ms || 3800) + 400);
}
function modal(html, onMount) {
  const root = $('#modal');
  root.innerHTML = `<div class="modal-bg" data-act="close-modal"></div><div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
  root.hidden = false;
  onMount && onMount(root);
}
const closeModal = () => { const r = $('#modal'); r.hidden = true; r.innerHTML = ''; };

/* ---------- feedback ---------- */
const FB_MSG = {
  up: 'Got it: more like this', down: 'Got it: fewer like this', hide: 'Hidden. You won\'t see this again',
  basic: 'Noted: aiming a bit deeper', advanced: 'Noted: easing the level a bit', save: 'Saved to your queue',
};
function feedback(id, sig) {
  const v = catalog.get(id); if (!v) return;
  const snap = JSON.stringify({ p: S.profile, f: S.feedback, l: S.log, q: S.queue });
  if (sig === 'save') {
    const i = S.queue.indexOf(id);
    if (i >= 0) { S.queue.splice(i, 1); save(); toast('Removed from queue'); refreshCardState(id); return; }
    S.queue.push(id);
  }
  if (['up', 'down', 'hide'].includes(sig)) S.feedback[id] = sig;
  rec.learn(S, v, sig);
  save();
  toast(FB_MSG[sig], {
    undo: () => { const o = JSON.parse(snap); S.profile = o.p; S.feedback = o.f; S.log = o.l; S.queue = o.q; save(); render(); },
  });
  if (sig === 'hide' || sig === 'down') {
    $$(`.card[data-id="${id}"]`).forEach(c => { if (!c.closest('.keep')) { c.classList.add('gone'); setTimeout(() => c.remove(), 250); } });
  }
  refreshCardState(id);
}
function refreshCardState(id) {
  $$(`[data-act="fb"][data-sig="save"][data-id="${id}"]`).forEach(b => b.classList.toggle('on', S.queue.includes(id)));
  $$(`[data-act="fb"][data-id="${id}"]`).forEach(b => { if (['up', 'down'].includes(b.dataset.sig)) b.classList.toggle('on', S.feedback[id] === b.dataset.sig); });
}

/* ---------- components ---------- */
function card(item) {
  const v = item.v || item, reasons = item.reasons || [], h = S.history[v.id];
  const prog = h ? Math.min(1, h.progress || 0) : 0;
  return `<article class="card" data-id="${v.id}">
    <a class="thumb" href="#/watch/${v.id}" aria-label="${esc(v.title)}">
      <img loading="lazy" data-vid="${v.id}" src="${thumb(v.id)}" alt="">
      ${v.dur ? `<span class="dur">${fmtDur(v.dur)}</span>` : ''}
      ${h?.completed ? `<span class="badge-done">${icon('check')} Watched</span>` : ''}
      ${prog > 0.03 && !h?.completed ? `<span class="prog"><i style="width:${prog * 100}%"></i></span>` : ''}
    </a>
    <div class="card-body">
      <div class="card-text">
        <a class="card-title" href="#/watch/${v.id}">${esc(v.title)}</a>
        <div class="meta"><a href="#/channel/${encodeURIComponent(v.channel)}">${esc(v.channel)}</a><span class="sep">·</span><span class="lvl l${v.level}" title="${rec.LEVELS[v.level]}"></span>${rec.LEVELS[v.level]}</div>
        ${reasons.length ? `<div class="why" tabindex="0" data-why="${esc(JSON.stringify(reasons.map(r => r.text)))}">${icon('spark')}<span>${esc(reasons[0].text)}</span></div>` : ''}
      </div>
      <button class="icon-btn sm menu-btn" data-act="menu" data-id="${v.id}" aria-label="More options">${icon('dots')}</button>
    </div>
  </article>`;
}
const grid = (items, cls = '') => `<div class="grid ${cls}">${items.map(card).join('')}</div>`;
const rowNav = () => `<div class="row-nav" hidden><button class="icon-btn sm" data-act="row-prev" aria-label="Scroll left">${icon('chevl')}</button><button class="icon-btn sm" data-act="row-next" aria-label="Scroll right">${icon('chev')}</button></div>`;
const shelfHead = (title, sub = '', extra = '', nav = false) => `<div class="shelf-head"><div class="sh-title"><h2>${title}</h2>${sub ? `<span class="sub">${sub}</span>` : ''}</div><div class="sh-tools">${extra}${nav ? rowNav() : ''}</div></div>`;
const row = (html, cls = '') => `<div class="row-scroll ${cls}">${html}</div>`;
const shelf = (title, sub, items, extra = '', key = '') => items.length ? `<section class="shelf"${key ? ` data-shelf="${key}"` : ''}>${shelfHead(title, sub, extra, true)}${row(items.map(card).join(''))}</section>` : '';
const plShelf = (title, sub, list, extra = '') => list.length ? `<section class="shelf">${shelfHead(title, sub, extra, true)}${row(list.map(plCard).join(''), 'pl-row')}</section>` : '';
const seeAll = href => `<a class="see-all" href="${href}">See all</a>`;

// Courses are ranked with the same taste profile as videos, plus a nudge for community favourites.
function rankPlaylists(list) {
  const P = S.profile;
  return list.map(p => {
    let s = (S.interests.includes(p.cat) ? 1 : 0) + Math.tanh((P.cat[p.cat] || 0) / 2)
      + p.tags.reduce((a, t) => a + Math.tanh((P.tag[t] || 0) / 1.5), 0) / Math.max(1, p.tags.length)
      - 0.5 * Math.abs(p.level - P.level) + (p.reddit ? 0.35 : 0);
    const st = S.playlists[p.id];
    if (st) s += 0.6; // keep courses you've started visible
    return { p, s };
  }).sort((a, b) => b.s - a.s).map(x => x.p);
}

function openPop(btn, html) {
  closeMenu();
  const m = document.createElement('div');
  m.className = 'popmenu'; m.id = 'popmenu'; m.innerHTML = html;
  document.body.appendChild(m);
  const r = btn.getBoundingClientRect();
  const top = Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 8);
  m.style.top = `${top + scrollY}px`;
  m.style.left = `${Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8))}px`;
}
function openMenu(btn) {
  const id = btn.dataset.id, inQ = S.queue.includes(id);
  openPop(btn, [
    ['save', inQ ? 'Remove from queue' : 'Save to queue', 'bookmark'],
    ['up', 'More like this', 'plus'], ['down', 'Less like this', 'less'],
    ['basic', 'Too basic for me', 'up'], ['advanced', 'Too advanced for me', 'down'],
    ['hide', 'Not interested', 'x'],
  ].map(([s, l, i]) => `<button data-act="fb" data-sig="${s}" data-id="${id}">${icon(i)}${l}</button>`).join(''));
}
const LENGTHS = [[0, 'Any length'], [15, 'Under 15 min'], [30, 'Under 30 min'], [60, 'Under an hour']];
const lenLabel = () => (LENGTHS.find(l => l[0] === (S.settings.budget || 0)) || LENGTHS[0])[1];
function openLenMenu(btn) {
  openPop(btn, LENGTHS.map(([m, l]) => `<button data-act="budget" data-min="${m}" class="${(S.settings.budget || 0) === m ? 'on' : ''}">${icon(m ? 'clock' : 'layers')}${l}${(S.settings.budget || 0) === m ? `<span class="pm-check">${icon('check')}</span>` : ''}</button>`).join(''));
}
const closeMenu = () => $('#popmenu')?.remove();

/* ---------- daily goal ---------- */
function todayRec() { return S.daily[store.today()] ||= { sec: 0, byCat: {} }; }
function streak() {
  let n = 0; const d = new Date();
  const ok = k => (S.daily[k]?.sec || 0) >= 300;
  if (!ok(store.today(d))) d.setDate(d.getDate() - 1);
  while (ok(store.today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function updateGoal() {
  const sec = S.daily[store.today()]?.sec || 0, goal = S.settings.goalMin * 60;
  const p = Math.min(1, sec / goal), C = 2 * Math.PI * 14;
  const el = $('#goal');
  el.innerHTML = `<svg viewBox="0 0 36 36" class="ring"><circle cx="18" cy="18" r="14" class="ring-bg"/><circle cx="18" cy="18" r="14" class="ring-fg ${p >= 1 ? 'full' : ''}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}"/></svg><span><b>${Math.round(sec / 60)}</b>/${S.settings.goalMin} min</span>`;
  el.title = `Today's learning goal: ${Math.round(sec / 60)} of ${S.settings.goalMin} minutes · ${streak()} day streak`;
}

/* ---------- YouTube player & tracking ---------- */
let ytReady;
function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise(res => {
    window.onYouTubeIframeAPIReady = () => res(window.YT);
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return ytReady;
}
let player = null, tickTimer = null, view = null;
const session = { sec: 0, breakShown: false };

function vidMeta(id, pl) {
  const v = catalog.get(id); if (v) return v;
  if (!pl) { // find which course this lesson belongs to
    const hit = Object.entries(LESSONS).find(([, items]) => items.some(x => x[0] === id));
    if (hit) pl = PL.get(hit[0]);
  }
  const st = pl && S.playlists[pl.id];
  return { id, title: LESSON_TITLE.get(id) || st?.titles?.[id] || 'Lesson', channel: pl?.channel || 'YouTube', cat: pl?.cat || 'learning', tags: pl?.tags || [], level: pl?.level || 2, dur: 0, fromPlaylist: true };
}

function beginView(id, pl) {
  endView();
  view = { id, pl, viewSec: 0, contentSec: 0, halfSent: false, seeked: false, v: vidMeta(id, pl) };
  const h = S.history[id] ||= { sec: 0, views: 0, first: Date.now(), reviews: 0, progress: 0 };
  h.views++; h.last = Date.now();
}
function endView() {
  if (!view) return;
  const h = S.history[view.id], dur = h?.dur || view.v.dur;
  if (h && !h.completed && dur > 300 && view.viewSec > 45 && view.contentSec < dur * 0.15) rec.learn(S, view.v, 'abandon');
  view = null; save();
}
function tick() {
  if (!player || !view || typeof player.getPlayerState !== 'function' || player.getPlayerState() !== 1) return;
  const id = view.id, h = S.history[id], v = view.v;
  const dur = player.getDuration() || v.dur || 0, pos = player.getCurrentTime() || 0, rate = player.getPlaybackRate() || 1;
  if (dur) { h.dur = dur; if (!v.dur && catalog.has(id)) { const c = S.custom.find(x => x.id === id); if (c) c.dur = Math.round(dur); } }
  h.sec += 1; h.pos = pos; h.last = Date.now();
  h.progress = dur ? pos / dur : 0;
  view.viewSec += 1; view.contentSec += rate;
  session.sec += 1;
  const d = todayRec(); d.sec += 1; d.byCat[v.cat] = (d.byCat[v.cat] || 0) + 1;
  if (dur && !h.completed && !view.halfSent && view.contentSec >= dur * 0.5) { view.halfSent = true; rec.learn(S, v, 'progress'); }
  if (dur && !h.completed && h.progress > 0.9 && view.contentSec >= dur * 0.45) {
    h.completed = true; h.completedAt = Date.now(); rec.scheduleReview(h); rec.learn(S, v, 'complete');
    if (view.pl) { const st = S.playlists[view.pl.id]; if (st && !st.done.includes(id)) st.done.push(id); renderLessons(); }
    toast(`${icon('check')} Finished. Your feed just learned from it`);
  }
  if (!session.breakShown && session.sec >= S.settings.breakMin * 60) {
    session.breakShown = true;
    toast(`You've been learning for ${S.settings.breakMin} minutes. A short break helps it stick.`, { ms: 8000 });
  }
  if (session.sec % 5 === 0) { updateGoal(); save(); }
}

async function mountPlayer({ videoId, playlist, start = 0 }) {
  const YT = await loadYT();
  if (!$('#player')) return; // navigated away
  const vars = { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1, iv_load_policy: 3, origin: location.origin };
  const cfg = { width: '100%', height: '100%', playerVars: vars, events: {} };
  if (playlist) {
    const st = S.playlists[playlist.id] ||= { started: Date.now(), index: 0, done: [], items: [], titles: {} };
    st.last = Date.now();
    Object.assign(vars, { listType: 'playlist', list: playlist.id, index: st.index || 0 });
  } else {
    cfg.videoId = videoId;
    if (start > 0) vars.start = Math.floor(start);
  }
  cfg.events.onStateChange = e => onState(e, playlist);
  cfg.events.onReady = () => { if (!playlist) beginView(videoId); };
  player = new YT.Player('player', cfg);
  clearInterval(tickTimer); tickTimer = setInterval(tick, 1000);
}

function onState(e, pl) {
  if (pl) {
    const data = player.getVideoData?.() || {}, id = data.video_id;
    const st = S.playlists[pl.id];
    if (id && (!view || view.id !== id)) {
      const items = player.getPlaylist?.(); if (items?.length) st.items = items;
      st.index = player.getPlaylistIndex?.() ?? st.index;
      if (data.title) st.titles[id] = data.title;
      beginView(id, pl);
      $('#lesson-title') && ($('#lesson-title').textContent = data.title || '');
      renderLessons(); renderNotes();
      save();
    }
    if (e.data === 1 && view && !view.seeked) { // resume inside a lesson
      view.seeked = true;
      const h = S.history[view.id];
      if (h && !h.completed && h.pos > 20 && h.dur && h.pos < h.dur - 30) player.seekTo(h.pos, true);
    }
  } else if (e.data === 0) showEndscreen();
}

function teardown() {
  endView();
  clearInterval(tickTimer); tickTimer = null;
  try { player?.destroy?.(); } catch {}
  player = null;
  document.body.classList.remove('focus');
  closeMenu();
  feed.observer?.disconnect();
}

/* ---------- pages ---------- */
const PAGES = {};
// Router.
//  - Same page, different query (filters, sort, "show more"): the page's update() patches only what changed.
//    Nothing is rebuilt, nothing scrolls.
//  - New page via a link: start at the top.
//  - Back/forward: restore where you were.
const scrollMem = new Map();
let curPath = null, navByLink = false;
history.scrollRestoration = 'manual';
document.addEventListener('click', e => { if (e.target.closest('a[href^="#"]')) navByLink = true; }, true);
document.addEventListener('submit', () => { navByLink = true; }, true);
window.addEventListener('hashchange', e => { scrollMem.set(new URL(e.oldURL).hash || '#/', scrollY); render(false); });

function parseRoute() {
  const [path, query] = location.hash.slice(1).split('?');
  const parts = (path || '/').split('/').filter(Boolean);
  const page = parts[0] || 'home';
  return { path: path || '/', page, fn: PAGES[page] || PAGES.home, args: parts.slice(1).map(decodeURIComponent), q: new URLSearchParams(query || ''), parts };
}
function render(force = true) {
  const r = parseRoute();
  closeMenu(); hideTip();
  if (!force && r.path === curPath && r.fn.update) { r.fn.update(r.args, r.q); navByLink = false; return; }
  const samePage = r.path === curPath;
  teardown();
  curPath = r.path;
  const main = $('#view');
  main.innerHTML = r.fn(r.args, r.q) || '';
  main.dataset.page = r.page;
  if (!samePage) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
  const navPage = { path: 'deep', playlist: 'deep' }[r.page] || r.page;
  $$('.nav a').forEach(a => { const h = a.getAttribute('href'); a.classList.toggle('active', h === `#/${navPage === 'home' ? '' : navPage}` || h === `#/${r.parts.join('/')}`); });
  r.fn.after?.(r.args, r.q);
  initRows(main);
  const saved = scrollMem.get(location.hash || '#/');
  if (samePage) { /* keep position */ }
  else if (!navByLink && saved != null) requestAnimationFrame(() => scrollTo(0, saved));
  else scrollTo(0, 0);
  navByLink = false;
  if (innerWidth < 900) document.body.classList.remove('nav-open');
  updateGoal();
}
// Update a list in place: reuse existing card nodes (so thumbnails never reload) and only create new ones.
function patchList(el, items, renderItem, keyOf) {
  if (!el) return;
  const old = new Map([...el.children].map(c => [c.dataset.id, c]));
  const frag = document.createDocumentFragment();
  for (const it of items) {
    let node = old.get(keyOf(it));
    if (!node) { const t = document.createElement('template'); t.innerHTML = renderItem(it).trim(); node = t.content.firstElementChild; }
    frag.appendChild(node);
  }
  el.replaceChildren(frag);
}
// When a filter shrinks a list, keep the filter bar in view instead of letting the page jump.
function keepBarInView(bar) {
  if (!bar) return;
  const top = bar.getBoundingClientRect().top + scrollY - $('.top').offsetHeight - 8;
  if (scrollY > top) scrollTo(0, top);
}
const setOn = (sel, pred) => $$(sel).forEach(el => el.classList.toggle('on', pred(el)));

/* ----- floating tooltip (never clipped by scroll containers) ----- */
const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; document.body.appendChild(tip);
function showTip(el) {
  const reasons = JSON.parse(el.dataset.why || '[]'); if (!reasons.length) return;
  tip.innerHTML = `<b>Why you're seeing this</b>${reasons.map(r => `<div>${esc(r)}</div>`).join('')}`;
  tip.hidden = false;
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  const left = Math.max(8, Math.min(r.left, innerWidth - w - 8));
  const top = r.bottom + 8 + h > innerHeight ? r.top - h - 8 : r.bottom + 8;
  tip.style.transform = `translate(${left}px, ${top}px)`;
}
function hideTip() { tip.hidden = true; }
document.addEventListener('mouseover', e => { const w = e.target.closest('.why'); if (w) showTip(w); });
document.addEventListener('mouseout', e => { if (e.target.closest('.why') && !e.relatedTarget?.closest?.('.why')) hideTip(); });
document.addEventListener('focusin', e => { const w = e.target.closest('.why'); if (w) showTip(w); });
document.addEventListener('focusout', e => { if (e.target.closest('.why')) hideTip(); });
addEventListener('scroll', () => { hideTip(); closeMenu(); document.body.classList.toggle('scrolled', scrollY > 4); }, { passive: true });

/* ----- horizontal shelves: arrow buttons, disabled at the ends ----- */
function syncRow(row) {
  const nav = row.closest('.shelf')?.querySelector('.row-nav'); if (!nav) return;
  const [prev, next] = nav.querySelectorAll('button');
  prev.disabled = row.scrollLeft < 4;
  next.disabled = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
  nav.hidden = row.scrollWidth <= row.clientWidth + 4;
}
function initRows(root) { $$('.row-scroll', root).forEach(row => { syncRow(row); row.addEventListener('scroll', () => syncRow(row), { passive: true }); }); }
addEventListener('resize', () => $$('.row-scroll').forEach(syncRow), { passive: true });

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late night learning' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
// Topic navigation: quiet text tabs with icons (used on topic pages).
const chips = (active) => `<nav class="topic-nav" aria-label="Topics"><a class="${!active ? 'on' : ''}" href="#/">${icon('home')}<span>For you</span></a>${CATEGORIES.map(c => `<a class="${active === c.id ? 'on' : ''}" href="#/c/${c.id}">${icon('t_' + c.id)}<span>${c.name}</span></a>`).join('')}</nav>`;
const catCounts = () => {
  const v = {}, p = {};
  for (const x of catalog.values()) v[x.cat] = (v[x.cat] || 0) + 1;
  for (const x of PLAYLISTS) p[x.cat] = (p[x.cat] || 0) + 1;
  return { v, p };
};
const topicTiles = () => {
  const { v, p } = catCounts();
  return `<div class="topic-grid">${CATEGORIES.map(c => `<a class="topic-tile" href="#/c/${c.id}">${topicIcon(c.id)}<span class="tt-text"><b>${c.name}</b><span>${v[c.id] || 0} videos · ${p[c.id] || 0} courses</span></span>${icon('chev', 'tt-go')}</a>`).join('')}</div>`;
};
const homeTopic = () => new URLSearchParams(location.hash.split('?')[1] || '').get('t') || '';
const homeTabs = () => (S.interests.length ? S.interests : ['ai', 'cs', 'math', 'physics', 'history', 'arts']);

/* ---------- Home: YouTube-style endless feed ----------
   Topic chips on top (All by default) and an endless grid ranked by the recommendation engine.
   The first few hundred picks go through the full diversity re-ranking; after that the rest of the library
   follows in score order, so the feed never runs dry. Home is videos only; courses, paths and talk collections live in Deep Dive. */
const FEED_BATCH = 24;
let feed = { items: [], shown: 0, batch: 0, observer: null };

function feedItems(topic = homeTopic()) {
  const pool = [...catalog.values()].filter(v => (!topic || v.cat === topic) && !S.history[v.id]?.completed && S.feedback[v.id] !== 'hide');
  const head = rec.rank(pool, S, catalog, { limit: Math.min(360, pool.length), includeSeen: true });
  const used = new Set(head.map(x => x.v.id));
  const ctx = rec.context(S, catalog);
  const tail = pool.filter(v => !used.has(v.id)).map(v => ({ v, ...rec.score(v, S, ctx) })).sort((x, y) => y.score - x.score);
  return head.concat(tail);
}

function appendFeed() {
  const grid = $('#feed'); if (!grid) return;
  const next = feed.items.slice(feed.shown, feed.shown + FEED_BATCH);
  if (!next.length) { $('#feed-end').hidden = false; feed.observer?.disconnect(); return; }
  grid.insertAdjacentHTML('beforeend', next.map(card).join(''));
  feed.shown += next.length; feed.batch++;
  initRows(grid);
}

function startFeed() {
  feed.observer?.disconnect();
  feed = { items: feedItems(), shown: 0, batch: 0, observer: null };
  const grid = $('#feed'); if (!grid) return;
  grid.innerHTML = '';
  $('#feed-empty').hidden = feed.items.length > 0;
  $('#feed-end').hidden = true;
  appendFeed();
  // Load the next batch well before the user reaches the bottom, so scrolling never stalls.
  feed.observer = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) appendFeed(); }, { rootMargin: '1400px 0px' });
  feed.observer.observe($('#feed-sentinel'));
}

PAGES.home = () => {
  const topic = homeTopic();
  return `<div class="feed-bar" id="feed-bar">
      <nav class="chips-row" aria-label="Topics"><a data-t="" class="chip ${!topic ? 'on' : ''}" href="#/">All</a>${CATEGORIES.map(c => `<a data-t="${c.id}" class="chip ${topic === c.id ? 'on' : ''}" href="#/?t=${c.id}">${c.name}</a>`).join('')}</nav>
      <div class="feed-tools"><button class="len-btn" data-act="len-menu" aria-haspopup="menu">${icon('clock')}<span id="len-label">${lenLabel()}</span>${icon('chevd')}</button><a class="icon-btn sm" href="#/algorithm" title="Tune your feed" aria-label="Tune your feed">${icon('tune')}</a></div>
    </div>
    <div class="grid feed" id="feed"></div>
    <div class="empty" id="feed-empty" hidden>Nothing fits that length. Try a longer one.</div>
    <div id="feed-sentinel" aria-hidden="true"></div>
    <p class="feed-end sub" id="feed-end" hidden>You've reached the end of your library for this topic.</p>`;
};
PAGES.home.after = () => {
  startFeed();
  // Coming back (browser Back): pre-load enough of the feed to restore the previous scroll position.
  if (!navByLink) {
    const want = scrollMem.get(location.hash || '#/') || 0;
    while (document.documentElement.scrollHeight < want + innerHeight * 1.5 && feed.shown < feed.items.length) appendFeed();
  }
};
// Chip or length change: rebuild the feed in place and bring the top of the feed into view.
function updateHome() {
  const topic = homeTopic();
  setOn('#feed-bar [data-t]', a => a.dataset.t === topic);
  const l = $('#len-label'); if (l) l.textContent = lenLabel();
  startFeed();
  if (scrollY > 0) scrollTo(0, 0);
}
PAGES.home.update = () => updateHome();

PAGES.landmarks = (_, q) => {
  const vids = rec.rank([...catalog.values()].filter(v => v.landmark), S, catalog, { includeSeen: true });
  const counts = {}; vids.forEach(x => { counts[x.v.cat] = (counts[x.v.cat] || 0) + 1; });
  const cat = q.get('cat') || '';
  return `<header class="page-head"><div><p class="eyebrow">Landmark talks</p><h1>Ideas worth a lifetime</h1>
    <p class="sub lead">Famous lectures, talks and documentaries that people keep recommending years later: Feynman, Hamming, Sagan, Kay, Pausch, Munger and more.</p></div></header>
    <section class="shelf">
      <div class="filterbar" id="lm-bar"><nav class="tabs"><a data-cat="" href="#/landmarks" class="${!cat ? 'on' : ''}">All<span class="n">${vids.length}</span></a>${CATEGORIES.filter(c => counts[c.id]).map(c => `<a data-cat="${c.id}" href="#/landmarks?cat=${c.id}" class="${cat === c.id ? 'on' : ''}">${icon('t_' + c.id)}${c.name}<span class="n">${counts[c.id]}</span></a>`).join('')}</nav>
      <div class="fb-right"><span class="sub" id="lm-count"></span></div></div>
      <div class="grid" id="lm-grid">${vids.map(card).join('')}</div></section>`;
};
// Filtering shows/hides existing cards: instant, no reload, no jump.
PAGES.landmarks.update = (_, q, initial = false) => {
  const cat = q.get('cat') || ''; let n = 0;
  $$('#lm-grid .card').forEach(c => { const show = !cat || catalog.get(c.dataset.id)?.cat === cat; c.hidden = !show; n += show; });
  $('#lm-count').textContent = `${n} talk${n === 1 ? '' : 's'}`;
  setOn('#lm-bar [data-cat]', a => a.dataset.cat === cat);
  if (!initial) keepBarInView($('#lm-bar'));
};
PAGES.landmarks.after = (a, q) => PAGES.landmarks.update(a, q, true);

PAGES.channel = ([name]) => {
  const vids = [...catalog.values()].filter(v => v.channel === name);
  const pls = PLAYLISTS.filter(p => p.channel === name);
  const total = vids.reduce((a, v) => a + (v.dur || 0), 0);
  return `<div class="channel-head"><span class="avatar lg" style="--h:${hue(name)}">${esc(name[0])}</span><div><h1>${esc(name)}</h1><p class="sub">${vids.length} videos · ${fmtMin(total)} of material${pls.length ? ` · ${pls.length} courses` : ''}</p></div></div>
    ${plShelf('Courses', '', pls)}
    <section class="shelf">${shelfHead('Videos', String(vids.length))}${grid(rec.rank(vids, S, catalog, { includeSeen: true }))}</section>`;
};

function reviewCard(v) {
  const notes = S.notes[v.id] || [], refl = S.reflections[v.id];
  return `<div class="review-card"><a href="#/watch/${v.id}" class="rthumb"><img data-vid="${v.id}" src="${thumb(v.id)}" alt=""></a>
    <div class="rbody"><a class="card-title" href="#/watch/${v.id}">${esc(v.title)}</a>
    <p class="sub">Can you recall the key ideas before peeking?</p>
    <details><summary>Show my notes (${notes.length + (refl ? 1 : 0)})</summary>
      ${refl ? `<p class="refl">“${esc(refl.text)}”</p>` : ''}
      ${notes.map(n => `<div class="note-line"><a href="#/watch/${v.id}?t=${Math.floor(n.t)}" class="ts">${fmtDur(n.t) || '0:00'}</a> ${esc(n.text)}</div>`).join('')}
    </details>
    <button class="btn sm" data-act="reviewed" data-id="${v.id}">${icon('check')} I remembered it</button></div></div>`;
}

const SORTS = [['foryou', 'For you'], ['level', 'Beginner first'], ['long', 'Longest'], ['short', 'Shortest']];
function catData(cat, q) {
  const sort = q.get('sort') || 'foryou', tag = q.get('tag') || '', n = +q.get('n') || 24;
  const inCat = [...catalog.values()].filter(v => v.cat === cat);
  const list = tag ? inCat.filter(v => v.tags.includes(tag)) : inCat;
  let items;
  if (sort === 'foryou') items = rec.rank(list, S, catalog, { includeSeen: true });
  else {
    const f = { short: (a, b) => a.dur - b.dur, long: (a, b) => b.dur - a.dur, level: (a, b) => a.level - b.level || a.dur - b.dur }[sort];
    items = list.filter(v => S.feedback[v.id] !== 'hide').sort(f).map(v => ({ v }));
  }
  return { sort, tag, n, inCat, items };
}
const catLink = (cat, o) => `#/c/${cat}?${new URLSearchParams(Object.fromEntries(Object.entries(o).filter(([, v]) => v && v !== 'foryou')))}`;
const moreBtn = (cat, d) => d.items.length > d.n ? `<a class="btn ghost" href="${catLink(cat, { sort: d.sort, tag: d.tag, n: d.n + 24 })}">Show ${Math.min(24, d.items.length - d.n)} more</a>` : '';
PAGES.c = ([cat], q) => {
  const d = catData(cat, q);
  // subtopics: the most common topic tags in this category (skip channel-name fallback tags)
  const chans = new Set(d.inCat.map(v => v.channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
  const freq = {}; d.inCat.forEach(v => v.tags.forEach(t => { if (!chans.has(t)) freq[t] = (freq[t] || 0) + 1; }));
  const subs = Object.entries(freq).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t]) => t);
  const pls = rankPlaylists(PLAYLISTS.filter(p => p.cat === cat));
  return `<header class="page-head"><div><p class="eyebrow">Topic</p><h1>${catName(cat)}</h1><p class="sub">${d.inCat.length} videos · ${pls.length} courses</p></div></header>
    ${chips(cat)}
    ${plShelf('Courses', `Go deep on ${catName(cat)}`, pls)}
    <section class="shelf">
      <div class="filterbar" id="cat-bar">
        <div class="subtopics" role="tablist"><a data-tag="" class="${!d.tag ? 'on' : ''}" href="${catLink(cat, { sort: d.sort })}">All</a>${subs.map(t => `<a data-tag="${t}" class="${d.tag === t ? 'on' : ''}" href="${catLink(cat, { sort: d.sort, tag: t })}">${t.replace(/-/g, ' ')}</a>`).join('')}</div>
        <div class="fb-right"><span class="sub" id="cat-count">${d.items.length} videos</span><div class="seg">${SORTS.map(([k, l]) => `<a data-sort="${k}" href="${catLink(cat, { sort: k, tag: d.tag })}" class="${d.sort === k ? 'on' : ''}">${l}</a>`).join('')}</div></div>
      </div>
      <div class="grid" id="cat-grid">${d.items.slice(0, d.n).map(card).join('')}</div>
      <div class="more" id="cat-more">${moreBtn(cat, d)}</div></section>`;
};
PAGES.c.update = ([cat], q) => {
  const d = catData(cat, q);
  const grew = q.has('n');
  patchList($('#cat-grid'), d.items.slice(0, d.n), card, x => x.v.id);
  $('#cat-more').innerHTML = moreBtn(cat, d);
  $('#cat-count').textContent = `${d.items.length} videos`;
  setOn('#cat-bar [data-tag]', a => a.dataset.tag === d.tag);
  setOn('#cat-bar [data-sort]', a => a.dataset.sort === d.sort);
  $$('#cat-bar [data-tag]').forEach(a => { a.href = catLink(cat, { sort: d.sort, tag: a.dataset.tag }); });
  $$('#cat-bar [data-sort]').forEach(a => { a.href = catLink(cat, { sort: a.dataset.sort, tag: d.tag }); });
  if (!grew) keepBarInView($('#cat-bar'));
};

/* ----- watch ----- */
PAGES.watch = ([id], q) => {
  const v = catalog.get(id);
  if (!v) return `<div class="empty">That video isn't in your library. <a class="link" href="#/settings">Add it in Settings</a>.</div>`;
  return watchLayout({
    title: esc(v.title),
    sub: `<a href="#/channel/${encodeURIComponent(v.channel)}" class="avatar" style="--h:${hue(v.channel)}">${esc(v.channel[0])}</a><div><a href="#/channel/${encodeURIComponent(v.channel)}"><b>${esc(v.channel)}</b></a><div class="meta"><span class="lvl l${v.level}"></span>${rec.LEVELS[v.level]} · <a href="#/c/${v.cat}">${catName(v.cat)}</a>${v.dur ? ' · ' + fmtDur(v.dur) : ''}${v.year ? ' · ' + v.year : ''}</div></div>`,
    id, v,
    below: `<div class="desc">${rec.communityReason(v) ? `<span class="badge-fav">${icon('star')} ${esc(rec.communityReason(v).text)}</span>` : ''}${v.desc ? `<p>${esc(v.desc)}</p>` : ''}<div class="tags">${v.tags.filter(t => t !== v.channel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).map(t => `<a class="tag" href="#/search/${encodeURIComponent(t.replace(/-/g, ' '))}">#${t}</a>`).join('')}</div></div>`,
    side: `<div class="reveal"><button class="btn ghost wide" data-act="toggle-recs">${icon('layers')} Show recommendations</button><div id="recs" hidden></div></div>`,
  });
};
PAGES.watch.after = ([id], q) => {
  const v = catalog.get(id); if (!v) return;
  const h = S.history[id];
  let start = Number(q.get('t')) || 0;
  if (!start && h && !h.completed && h.pos > 20 && h.dur && h.pos < h.dur - 30) start = h.pos;
  mountPlayer({ videoId: id, start });
  renderNotes();
};

function watchLayout({ title, sub, id, v, below, side, lessons }) {
  const inQ = S.queue.includes(id);
  return `<div class="watch">
    <div class="watch-main">
      <div class="player-wrap"><div id="player"></div><div id="endscreen" hidden></div></div>
      <h1 class="watch-title" id="lesson-title">${title}</h1>
      <div class="watch-bar"><div class="chan">${sub}</div>
        <div class="actions">
          ${v ? `<button class="pill ${inQ ? 'on' : ''}" data-act="fb" data-sig="save" data-id="${id}">${icon('bookmark')} Save</button>` : ''}
          <button class="pill" data-act="note-now">${icon('pen')} Note <kbd>N</kbd></button>
          <button class="pill" data-act="focus">${icon('focus')} Focus <kbd>F</kbd></button>
          <a class="pill" id="yt-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">${icon('ext')} YouTube</a>
        </div></div>
      ${v ? `<div class="tune-row"><span class="sub">Tune your feed</span>
        <button class="tiny ${S.feedback[id] === 'up' ? 'on' : ''}" data-act="fb" data-sig="up" data-id="${id}">${icon('plus')} More like this</button>
        <button class="tiny ${S.feedback[id] === 'down' ? 'on' : ''}" data-act="fb" data-sig="down" data-id="${id}">${icon('less')} Less like this</button>
        <button class="tiny" data-act="fb" data-sig="basic" data-id="${id}">Too basic</button>
        <button class="tiny" data-act="fb" data-sig="advanced" data-id="${id}">Too advanced</button></div>` : ''}
      ${below || ''}
      <div class="reveal comments-wrap"><button class="btn ghost" data-act="toggle-comments">Show comments <kbd>C</kbd></button><div id="comments" hidden></div></div>
    </div>
    <aside class="watch-side">
      ${lessons || ''}
      <div class="notes-panel" id="notes-panel"></div>
      ${side || ''}
    </aside>
  </div>`;
}

function curVid() { return view?.id || location.hash.split('/')[2]?.split('?')[0]; }
function renderNotes() {
  const el = $('#notes-panel'); if (!el) return;
  const id = curVid(); const notes = (S.notes[id] || []).slice().sort((a, b) => a.t - b.t);
  const refl = S.reflections[id];
  el.innerHTML = `<div class="np-head"><h3>${icon('pen')} Notes</h3><span class="sub">${notes.length ? notes.length : 'Timestamped, private'}</span></div>
    <form id="note-form"><textarea id="note-input" rows="2" placeholder="Write a note. It's stamped with the current time. Enter to save."></textarea>
    <div class="np-foot"><span class="sub" id="note-ts"></span><button class="btn sm" type="submit">Add note</button></div></form>
    ${refl ? `<div class="refl">${icon('spark')} <span>“${esc(refl.text)}”</span></div>` : ''}
    <div class="note-list">${notes.map((n) => `<div class="note-line"><button class="ts" data-act="seek" data-t="${n.t}">${fmtDur(n.t) || '0:00'}</button><span>${esc(n.text)}</span><button class="icon-btn xs" data-act="del-note" data-at="${n.at}" aria-label="Delete note">${icon('x')}</button></div>`).join('')}</div>`;
  const input = $('#note-input');
  let stamp = 0;
  input.addEventListener('focus', () => { stamp = player?.getCurrentTime?.() || 0; $('#note-ts').textContent = `at ${fmtDur(stamp) || '0:00'}`; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#note-form').requestSubmit(); } });
  $('#note-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    const id = curVid();
    (S.notes[id] ||= []).push({ t: stamp, text, at: Date.now() });
    const meta = view?.v || catalog.get(id);
    if ((S.notes[id].length === 1) && meta) rec.learn(S, meta, 'note');
    const h = S.history[id]; if (h?.completed && !h.nextReview) rec.scheduleReview(h);
    save(); renderNotes(); $('#note-input').focus();
  });
}

function showEndscreen() {
  const el = $('#endscreen'); if (!el) return;
  const id = curVid(), v = catalog.get(id);
  el.hidden = false;
  el.innerHTML = `<div class="end-inner"><h3>Before you move on…</h3><p>What's one thing you learned? Writing it down makes it stick, and helps your feed.</p>
    <textarea id="refl-input" rows="3" placeholder="In my own words…">${esc(S.reflections[id]?.text || '')}</textarea>
    <div class="end-actions"><button class="btn" data-act="save-refl">Save reflection</button><button class="btn ghost" data-act="replay">Replay</button><button class="btn ghost" data-act="close-end">Skip</button></div>
    ${session.sec > 40 * 60 ? `<p class="sub">You've learned for ${fmtMin(session.sec)} this session. Consider a break.</p>` : ''}</div>`;
  $('#refl-input').focus();
  el.dataset.vid = id; void v;
}

async function loadComments() {
  const el = $('#comments'), id = curVid();
  if (!S.settings.apiKey) {
    el.innerHTML = `<div class="empty sm">Comments need a free YouTube Data API key (stored only in this browser). <a class="link" href="#/settings">Add one in Settings</a>, or <a class="link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">read them on YouTube</a>.</div>`;
    return;
  }
  el.innerHTML = '<div class="sub">Loading top comments…</div>';
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&order=relevance&maxResults=20&textFormat=plainText&videoId=${id}&key=${encodeURIComponent(S.settings.apiKey)}`);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    el.innerHTML = (j.items || []).map(it => {
      const c = it.snippet.topLevelComment.snippet;
      return `<div class="comment"><span class="avatar sm" style="--h:${hue(c.authorDisplayName)}">${esc(c.authorDisplayName.replace('@', '')[0] || '?')}</span><div><b>${esc(c.authorDisplayName)}</b> <span class="sub">${esc(c.publishedAt.slice(0, 10))} · ${c.likeCount} likes</span><p>${esc(c.textOriginal || c.textDisplay)}</p></div></div>`;
    }).join('') || '<div class="sub">No comments.</div>';
  } catch (e) { el.innerHTML = `<div class="empty sm">Couldn't load comments: ${esc(e.message)}</div>`; }
}

function renderRecs() {
  const id = curVid(), like = view?.v || catalog.get(id);
  const items = rec.rank([...catalog.values()].filter(v => v.id !== id), S, catalog, { limit: 8, ctx: { like } });
  $('#recs').innerHTML = `<div class="side-list">${items.map(sideItem).join('')}</div>`;
}
const sideItem = ({ v, reasons }) => `<a class="side-item card" data-id="${v.id}" href="#/watch/${v.id}"><span class="thumb"><img loading="lazy" data-vid="${v.id}" src="${thumb(v.id)}" alt=""><span class="dur">${fmtDur(v.dur)}</span></span>
  <span class="si-text"><b>${esc(v.title)}</b><span class="meta">${esc(v.channel)}</span>${reasons?.[0] ? `<span class="meta why-inl">${icon('spark')} ${esc(reasons[0].text)}</span>` : ''}</span></a>`;

/* ----- deep dive ----- */
function plState(p) { const st = S.playlists[p.id]; const total = st?.items?.length || LESSONS[p.id]?.length || p.count || 0; return { st, total, done: st?.done?.length || 0 }; }
function plCard(p) {
  const { st, total, done } = plState(p);
  return `<a class="pl-card" href="#/playlist/${p.id}" data-id="${p.id}" data-cat="${p.cat}" data-fav="${p.reddit ? 1 : 0}">
    <span class="thumb"><img loading="lazy" data-vid="${p.first}" src="${thumb(p.first)}" alt="">
      <span class="pl-count">${icon('layers')} ${total || ''} lessons</span>
      ${p.reddit ? `<span class="fav" title="Most recommended">${icon('star')}</span>` : ''}
      ${st ? `<span class="prog"><i style="width:${total ? done / total * 100 : 0}%"></i></span>` : ''}</span>
    <span class="pl-text"><b>${esc(p.title)}</b><span class="meta">${esc(p.channel)}<span class="sep">·</span>${rec.LEVELS[p.level]}${st ? `<span class="sep">·</span><span class="accent">${done}/${total} done</span>` : ''}${p.newer ? `<span class="sep">·</span><span class="edition-inl">Newer edition available</span>` : ''}</span>
    <span class="pl-note">${esc(p.note)}</span></span></a>`;
}
const deepCats = () => [...new Set(PLAYLISTS.map(p => p.cat))];
PAGES.deep = (_, q) => {
  const lessons = PLAYLISTS.reduce((a, p) => a + (LESSONS[p.id]?.length || p.count || 0), 0);
  const deepLink = (c, f) => `#/deep?${new URLSearchParams({ ...(c ? { cat: c } : {}), ...(f ? { fav: '1' } : {}) })}`;
  const cat = q.get('cat') || '', fav = q.get('fav') === '1';
  return `<header class="page-head"><div><p class="eyebrow">Deep Dive</p><h1>Go deep, not wide</h1>
    <p class="sub lead">Full courses and lecture series that learning communities recommend again and again. Follow a path in order, or pick a single course.</p></div>
    <dl class="stats"><div><dt>${PLAYLISTS.length}</dt><dd>courses</dd></div><div><dt>${PATHS.length}</dt><dd>paths</dd></div><div><dt>${lessons.toLocaleString()}</dt><dd>lessons</dd></div></dl></header>
  ${plShelf('Courses for you', 'Ranked for your topics and level', rankPlaylists(PLAYLISTS.filter(p => !S.playlists[p.id] && !p.newer)).slice(0, 14))}
  <section class="shelf">${shelfHead('Learning paths', `${PATHS.length} curricula that build from first principles`)}
    <nav class="tabs" id="area-tabs">${AREAS.filter(([a]) => !a || PATHS.some(x => x.area === a)).map(([a, l]) => `<a href="#" data-act="path-area" data-area="${a}" class="${!a ? 'on' : ''}">${l}<span class="n">${a ? PATHS.filter(x => x.area === a).length : PATHS.length}</span></a>`).join('')}</nav>
    <div class="paths" id="path-grid">${PATHS.map(pathCard).join('')}</div></section>
  ${shelf('Landmark talks', 'Lectures and talks people return to for years', rec.rank([...catalog.values()].filter(v => v.landmark), S, catalog, { limit: 16, includeSeen: true }), seeAll('#/landmarks'))}
  ${shelf('Community favourites', 'Recommended again and again on Hacker News, Stack Exchange and curated lists', rec.rank([...catalog.values()].filter(v => v.rec && (v.rec.hn || 0) + (v.rec.se || 0) + (v.rec.lists || 0) >= 2), S, catalog, { limit: 16, includeSeen: true }))}
  <section class="shelf" id="all">${shelfHead('All courses')}
    <div class="filterbar" id="deep-bar">
      <div class="subtopics"><a data-cat="" href="${deepLink('', fav)}" class="${!cat ? 'on' : ''}">All</a>${deepCats().map(c => `<a data-cat="${c}" href="${deepLink(c, fav)}" class="${cat === c ? 'on' : ''}">${catName(c)}</a>`).join('')}</div>
      <div class="fb-right"><span class="sub" id="deep-count"></span><a class="toggle ${fav ? 'on' : ''}" id="fav-toggle" href="${deepLink(cat, !fav)}">${icon('star')} Most recommended</a></div>
    </div>
    <div class="pl-grid" id="deep-grid">${PLAYLISTS.map(plCard).join('')}</div>
    <div class="empty" id="deep-empty" hidden>No courses match. Try another topic.</div></section>`;
};
// Filtering just shows/hides existing cards: instant, no reload, no scroll jump.
PAGES.deep.update = (_, q, initial = false) => {
  const cat = q.get('cat') || '', fav = q.get('fav') === '1';
  let n = 0;
  $$('#deep-grid .pl-card').forEach(c => { const show = (!cat || c.dataset.cat === cat) && (!fav || c.dataset.fav === '1'); c.hidden = !show; n += show; });
  $('#deep-count').textContent = `${n} course${n === 1 ? '' : 's'}`;
  $('#deep-empty').hidden = n > 0;
  const deepLink = (c, f) => `#/deep?${new URLSearchParams({ ...(c ? { cat: c } : {}), ...(f ? { fav: '1' } : {}) })}`;
  $$('#deep-bar [data-cat]').forEach(a => { a.classList.toggle('on', a.dataset.cat === cat); a.href = deepLink(a.dataset.cat, fav); });
  const t = $('#fav-toggle'); t.classList.toggle('on', fav); t.href = deepLink(cat, !fav);
  if (!initial) keepBarInView($('#deep-bar'));
};
PAGES.deep.after = (a, q) => { PAGES.deep.update(a, q, true); };
const AREAS = [['', 'All'], ['math', 'Mathematics'], ['ai', 'AI'], ['cs', 'Computer Science'], ['physics', 'Physics'], ['science', 'Science & Engineering'], ['life', 'Life Sciences'], ['society', 'Economics'], ['humanities', 'Humanities'], ['mind', 'Learning']];
function pathStats(pa) {
  const steps = pa.steps.map(step => ({ step, p: PL.get(step.id) })).filter(x => x.p).map(({ step, p }) => {
    const s = plState(p);
    return { p, why: step.why, stage: step.stage, ...s, state: !s.st ? 'todo' : s.done >= s.total * 0.9 ? 'done' : 'doing' };
  });
  const lessons = steps.reduce((a, x) => a + x.total, 0), doneL = steps.reduce((a, x) => a + Math.min(x.done, x.total), 0);
  const next = steps.find(x => x.state !== 'done') || steps[0];
  return { steps, lessons, doneL, pct: lessons ? doneL / lessons : 0, next, doneN: steps.filter(x => x.state === 'done').length };
}
// Compact card: stacked covers, title, one-line description, and a segmented progress bar (one segment per course).
function pathCard(pa) {
  const s = pathStats(pa);
  return `<a class="path-card" href="#/path/${pa.id}" data-area="${pa.area || ''}">
    <span class="path-cover">${s.steps.slice(0, 3).map(x => `<img loading="lazy" data-vid="${x.p.first}" src="${thumb(x.p.first, 'mq2')}" data-q="mq2" alt="">`).join('')}</span>
    <span class="path-body">
      <b>${esc(pa.title)}</b><span class="sub">${esc(pa.desc)}</span>
      <span class="segbar" title="${s.doneN} of ${s.steps.length} courses done">${s.steps.map(x => `<i class="${x.state}"></i>`).join('')}</span>
      <span class="path-meta"><span>${s.steps.length} courses · ${[...new Set(s.steps.map(x => x.stage))].join(' → ')}</span>${s.doneL ? `<span class="accent">${Math.round(s.pct * 100)}%</span>` : `<span class="path-go">View path ${icon('chev')}</span>`}</span>
    </span></a>`;
}
// A newer edition of a course, if one exists (e.g. CS50 2021 → CS50x 2025)
const newerOf = p => p?.newer && PL.get(p.newer);
const newerLink = (p, cls = 'edition') => { const n = newerOf(p); return n ? `<a class="${cls}" href="#/playlist/${n.id}" title="${esc(n.title)}">${icon('spark')} Newer edition: ${esc(String(n.edition || n.title.match(/\b(19|20)\d\d\b/g)?.pop() || 'available'))}</a>` : ''; };

PAGES.path = ([id]) => {
  const pa = PATHS.find(p => p.id === id);
  if (!pa) return '<div class="empty">That path doesn\'t exist. <a class="link" href="#/deep">Back to Deep Dive</a></div>';
  const s = pathStats(pa);
  const after = (pa.after || []).map(a => PATHS.find(p => p.id === a)).filter(Boolean);
  const related = PATHS.filter(p => p.id !== id && (p.area === pa.area || (p.after || []).includes(id))).slice(0, 3);
  const stages = [...new Set(s.steps.map(x => x.stage))];
  const STAGE_SUB = { Foundations: 'Intuition and the basic language', Core: 'The main body of the subject', Deeper: 'Rigour and real depth', Frontier: 'Where the field is now' };
  let n = 0;
  return `<header class="path-hero">
      <div><p class="eyebrow"><a href="#/deep">Deep Dive</a><span class="sep">/</span>Learning path</p><h1>${esc(pa.title)}</h1><p class="sub lead">${esc(pa.desc)}</p>
        ${after.length ? `<p class="path-after">Best after ${after.map(a => `<a href="#/path/${a.id}">${esc(a.title)}</a>`).join(' and ')}</p>` : '<p class="path-after">No prerequisites: a good place to start.</p>'}
        <div class="path-cta"><a class="btn" href="#/playlist/${s.next.p.id}">${s.doneL ? 'Continue' : 'Start the path'} ${icon('chev')}</a><span class="sub">${s.doneL ? 'Up next' : 'First'}: ${esc(s.next.p.title)}</span></div></div>
      <dl class="stats"><div><dt>${s.steps.length}</dt><dd>courses</dd></div><div><dt>${s.lessons.toLocaleString()}</dt><dd>lessons</dd></div><div><dt>${Math.round(s.pct * 100)}%</dt><dd>complete</dd></div></dl>
    </header>
    <div class="path-sub"><span class="segbar lg">${s.steps.map(x => `<i class="${x.state}"></i>`).join('')}</span><span class="sub">${stages.join(' → ')}</span></div>
    ${stages.map(stage => `<section class="rm-stage"><div class="rm-stage-head"><h2>${stage}</h2><span class="sub">${STAGE_SUB[stage] || ''}</span></div>
    <ol class="roadmap">${s.steps.filter(x => x.stage === stage).map(x => { n++; return `<li class="rm-step ${x.state} ${x === s.next ? 'next' : ''}">
      <span class="rm-node">${x.state === 'done' ? icon('check') : n}</span>
      <div class="rm-card">
        <a class="thumb rm-thumb" href="#/playlist/${x.p.id}"><img loading="lazy" data-vid="${x.p.first}" src="${thumb(x.p.first)}" alt="">${x.p.reddit ? `<span class="fav" title="Most recommended">${icon('star')}</span>` : ''}</a>
        <span class="rm-body"><span class="rm-kicker">Step ${n} · ${rec.LEVELS[x.p.level]}${x === s.next && x.state !== 'done' ? ' · <span class="accent">Up next</span>' : ''}</span>
          <a href="#/playlist/${x.p.id}"><b>${esc(x.p.title)}</b></a><span class="meta">${esc(x.p.channel)} · ${x.total} lessons</span>
          ${x.why ? `<span class="rm-why">${esc(x.why)}</span>` : `<span class="pl-note">${esc(x.p.note)}</span>`}
          ${newerLink(x.p)}
          ${x.st ? `<span class="rm-prog"><span class="today-bar"><i style="width:${x.total ? Math.min(100, x.done / x.total * 100) : 0}%"></i></span><span class="sub">${x.done}/${x.total}</span></span>` : ''}</span>
        <a class="rm-cta" href="#/playlist/${x.p.id}">${x.state === 'done' ? 'Review' : x.state === 'doing' ? 'Continue' : 'Start'}${icon('chev')}</a></div></li>`; }).join('')}</ol></section>`).join('')}
    ${related.length ? `<section class="shelf mt-xl">${shelfHead('Where to go next', '', seeAll('#/deep'))}<div class="paths">${related.map(pathCard).join('')}</div></section>` : ''}`;
};

PAGES.playlist = ([pid]) => {
  const p = PL.get(pid); if (!p) return '<div class="empty">Playlist not found.</div>';
  const { total, done } = plState(p);
  return watchLayout({
    title: esc(p.title), id: p.first,
    sub: `<span class="avatar" style="--h:${hue(p.channel)}">${esc(p.channel[0])}</span><div><b>${esc(p.channel)}</b><div class="meta">${esc(p.title)} · <span id="pl-prog">${done}/${total}</span> lessons done</div></div>`,
    below: `<div class="desc">${newerOf(p) ? `<a class="edition-banner" href="#/playlist/${p.newer}">${icon('spark')}<span><b>A newer edition is available</b><span>${esc(newerOf(p).title)}</span></span>${icon('chev')}</a>` : ''}${p.older && PL.get(p.older) ? `<p class="sub">Newest edition. The earlier one: <a class="link" href="#/playlist/${p.older}">${esc(PL.get(p.older).title)}</a></p>` : ''}<p>${esc(p.note)}</p>${p.reddit ? `<span class="badge-fav">${icon('star')} Community favourite</span>` : ''}<div class="tags">${p.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
      <button class="btn sm ghost" data-act="mark-lesson">${icon('check')} Mark current lesson done</button></div>`,
    lessons: `<div class="lessons"><div class="np-head"><h3>${icon('layers')} Lessons</h3><span class="sub">${total}</span></div><div id="lesson-list" class="lesson-list"><div class="sub">Loading lessons…</div></div></div>`,
  });
};
PAGES.playlist.after = ([pid]) => {
  const p = PL.get(pid); if (!p) return;
  mountPlayer({ playlist: p });
  renderLessons(p);
  renderNotes();
};
function renderLessons(pArg) {
  const el = $('#lesson-list'); const p = pArg || view?.pl; if (!el || !p) return;
  const st = S.playlists[p.id] || { done: [], items: [], titles: {}, index: 0 };
  const items = st.items?.length ? st.items : (LESSONS[p.id] || []).map(x => x[0]);
  const cur = st.index ?? 0;
  el.innerHTML = items.map((id, i) => `<button class="lesson ${i === cur ? 'cur' : ''} ${st.done.includes(id) ? 'done' : ''}" data-act="lesson" data-i="${i}">
    <span class="li-n">${st.done.includes(id) ? icon('check') : i + 1}</span><span class="thumb"><img loading="lazy" data-vid="${id}" src="${thumb(id, 'mq2')}" data-q="mq2" alt=""></span>
    <span class="li-t">${esc(LESSON_TITLE.get(id) || st.titles?.[id] || `Lesson ${i + 1}`)}</span></button>`).join('');
  const c = el.querySelector('.cur'); if (c) el.scrollTop = c.offsetTop - el.offsetTop - 60;
  const pp = $('#pl-prog'); if (pp) pp.textContent = `${st.done.length}/${items.length || p.count}`;
}

/* ----- queue, notes, search ----- */
/* ---------- Queue & History ---------- */
const DAY_MS = 864e5;
function historyItems() {
  return Object.entries(S.history).filter(([, h]) => (h.sec || 0) >= 10 && h.last)
    .sort((a, b) => b[1].last - a[1].last).map(([id, h]) => ({ id, h, v: vidMeta(id, null) }));
}
function dayGroup(t) {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  if (t >= d0) return 'Today';
  if (t >= d0 - DAY_MS) return 'Yesterday';
  if (t >= d0 - 6 * DAY_MS) return 'This week';
  if (t >= d0 - 29 * DAY_MS) return 'This month';
  return 'Earlier';
}
const histRow = ({ id, h, v }) => {
  const dur = h.dur || v.dur || 0, pct = h.completed ? 100 : Math.min(100, (h.progress || 0) * 100);
  const g = dayGroup(h.last), dt = new Date(h.last);
  const when = g === 'Today' || g === 'Yesterday' ? dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : dt.toLocaleDateString(undefined, { weekday: g === 'This week' ? 'long' : undefined, day: 'numeric', month: 'short' });
  const status = h.completed ? `${icon('check')} Finished` : dur ? `Watched ${fmtMin(h.pos || 0)} of ${fmtMin(dur)}` : `Watched ${fmtMin(h.sec || 0)}`;
  return `<div class="hist-item" data-id="${id}">
    <a class="thumb" href="#/watch/${id}"><img loading="lazy" data-vid="${id}" src="${thumb(id)}" alt="">${dur ? `<span class="dur">${fmtDur(dur)}</span>` : ''}<span class="prog"><i style="width:${pct}%"></i></span></a>
    <div class="hist-body"><a class="card-title" href="#/watch/${id}">${esc(v.title)}</a>
      <div class="meta">${esc(v.channel)}<span class="sep">·</span>${catName(v.cat)}</div>
      <div class="hist-status ${h.completed ? 'done' : ''}">${status}<span class="sep">·</span><span class="sub">${when}</span></div></div>
    <button class="icon-btn sm" data-act="hist-remove" data-id="${id}" title="Remove from history" aria-label="Remove from history">${icon('x')}</button>
  </div>`;
};
function queueBody() {
  const items = S.queue.map(id => catalog.get(id)).filter(Boolean);
  const total = items.reduce((a, v) => a + (v.dur || 0), 0);
  if (!items.length) return `<div class="empty">Nothing saved yet. Use <b>Save</b> on a video, or “Save to queue” in a card's ⋯ menu, to watch it on purpose later.</div>`;
  return `<div class="qh-toolbar"><span class="sub">${items.length} video${items.length === 1 ? '' : 's'} · ${fmtMin(total)} total</span><button class="btn sm ghost" data-act="queue-clear">Clear queue</button></div>${grid(items.map(v => ({ v })), 'keep')}`;
}
function historyBody() {
  const items = historyItems();
  if (!items.length) return `<div class="empty">No history yet. Videos you watch show up here, newest first.</div>`;
  const watched = items.reduce((a, x) => a + (x.h.sec || 0), 0), done = items.filter(x => x.h.completed).length;
  const groups = [];
  for (const it of items) { const g = dayGroup(it.h.last); if (!groups.length || groups.at(-1).g !== g) groups.push({ g, items: [] }); groups.at(-1).items.push(it); }
  return `<div class="qh-toolbar"><span class="sub">${items.length} videos · ${done} finished · ${fmtMin(watched)} watched</span><button class="btn sm ghost" data-act="hist-clear">Clear history</button></div>
    ${groups.map(g => `<section class="hist-group"><h3>${g.g}</h3>${g.items.map(histRow).join('')}</section>`).join('')}`;
}
PAGES.queue = (_, q) => {
  const tab = q.get('tab') === 'history' ? 'history' : 'queue';
  return `<header class="page-head"><div><p class="eyebrow">Library</p><h1>Queue &amp; History</h1><p class="sub">Videos saved for later, and everything you've watched.</p></div></header>
    <nav class="tabs" id="qh-tabs"><a data-tab="queue" href="#/queue" class="${tab === 'queue' ? 'on' : ''}">Queue<span class="n">${S.queue.length}</span></a><a data-tab="history" href="#/queue?tab=history" class="${tab === 'history' ? 'on' : ''}">History<span class="n">${historyItems().length}</span></a></nav>
    <div id="qh-body">${tab === 'queue' ? queueBody() : historyBody()}</div>`;
};
// Switching tabs swaps the body in place.
PAGES.queue.update = (_, q) => {
  const tab = q.get('tab') === 'history' ? 'history' : 'queue';
  setOn('#qh-tabs [data-tab]', a => a.dataset.tab === tab);
  $('#qh-body').innerHTML = tab === 'queue' ? queueBody() : historyBody();
};

PAGES.notes = (_, q) => {
  const term = (q.get('q') || '').toLowerCase();
  const ids = [...new Set([...Object.keys(S.notes).filter(k => S.notes[k].length), ...Object.keys(S.reflections)])];
  const groups = ids.map(id => ({ id, v: vidMeta(id, null), notes: (S.notes[id] || []).slice().sort((a, b) => a.t - b.t), refl: S.reflections[id] }))
    .map(g => ({ ...g, notes: term ? g.notes.filter(n => n.text.toLowerCase().includes(term)) : g.notes }))
    .filter(g => !term || g.notes.length || g.v.title.toLowerCase().includes(term) || g.refl?.text.toLowerCase().includes(term))
    .sort((a, b) => Math.max(...[...a.notes.map(n => n.at), a.refl?.at || 0], 0) < Math.max(...[...b.notes.map(n => n.at), b.refl?.at || 0], 0) ? 1 : -1);
  const due = rec.dueReviews(S, catalog);
  return `<div class="page-head"><div><h1>${icon('notes')} Notes</h1><p class="sub">Everything you wrote down, with links back to the exact moment.</p></div>
    <div class="row"><form class="mini-search" data-form="notes"><input name="q" value="${esc(q.get('q') || '')}" placeholder="Search notes"></form><button class="btn ghost" data-act="export-notes">Export Markdown</button></div></div>
    ${due.length ? `<section class="shelf">${shelfHead('Due for review', 'Recall the key ideas before peeking at your notes')}<div class="review-list">${due.map(reviewCard).join('')}</div></section>` : ''}
    ${groups.length ? groups.map(g => `<div class="note-group"><a href="#/watch/${g.id}" class="rthumb"><img data-vid="${g.id}" src="${thumb(g.id)}" alt=""></a><div class="rbody"><a class="card-title" href="#/watch/${g.id}">${esc(g.v.title)}</a>
      ${g.refl ? `<p class="refl">${icon('spark')} “${esc(g.refl.text)}”</p>` : ''}
      ${g.notes.map(n => `<div class="note-line"><a class="ts" href="#/watch/${g.id}?t=${Math.floor(n.t)}">${fmtDur(n.t) || '0:00'}</a><span>${esc(n.text)}</span></div>`).join('')}</div></div>`).join('')
    : `<div class="empty">No notes yet. While watching, press <kbd>N</kbd> to jot something down. It's saved with a timestamp.</div>`}`;
};

PAGES.search = ([term = '']) => {
  const toks = term.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (fields) => toks.reduce((s, t) => s + fields.reduce((a, [f, w]) => a + (String(f).toLowerCase().includes(t) ? w : 0), 0), 0);
  const vids = [...catalog.values()].map(v => ({ v, m: match([[v.title, 3], [v.channel, 2], [v.tags.join(' ').replace(/-/g, ' '), 2], [catName(v.cat), 1.5], [v.desc, 0.5]]) })).filter(x => x.m > 0);
  const ctx = rec.context(S, catalog);
  const ranked = vids.map(x => ({ ...x, ...rec.score(x.v, S, ctx) })).sort((a, b) => (b.m * 2 + b.score) - (a.m * 2 + a.score));
  const pls = PLAYLISTS.filter(p => match([[p.title, 3], [p.channel, 2], [p.tags.join(' '), 2], [p.note, 1], [catName(p.cat), 1]]) > 0);
  setTimeout(() => { const i = $('#search-input'); if (i && !i.value) i.value = term; });
  return `<div class="page-head col"><h1>Results for “${esc(term)}”</h1><p class="sub">${ranked.length} videos · ${pls.length} courses</p></div>
    ${pls.length ? `<section class="shelf"><div class="shelf-head"><h2>Courses</h2></div><div class="row-scroll">${pls.map(plCard).join('')}</div></section>` : ''}
    ${ranked.length ? grid(ranked) : '<div class="empty">No matches in your curated library. Add videos from Settings.</div>'}`;
};

/* ----- progress ----- */
PAGES.progress = () => {
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); const k = store.today(d); return { k, d, sec: S.daily[k]?.sec || 0 }; });
  const max = Math.max(S.settings.goalMin * 60, ...days.map(d => d.sec));
  const byCat = {}; let tot = 0;
  for (const [k, r] of Object.entries(S.daily)) { if (Date.now() - new Date(k) > 30 * 86400000) continue; for (const [c, s] of Object.entries(r.byCat)) { byCat[c] = (byCat[c] || 0) + s; tot += s; } }
  const done = Object.values(S.history).filter(h => h.completed).length;
  const nNotes = Object.values(S.notes).reduce((a, n) => a + n.length, 0) + Object.keys(S.reflections).length;
  const all = Object.values(S.daily).reduce((a, r) => a + r.sec, 0);
  const week = days.slice(7).reduce((a, d) => a + d.sec, 0);
  const goal = S.settings.goalMin * 60;
  return `<div class="page-head col"><h1>${icon('chart')} Progress</h1><p class="sub">Time spent learning, not time spent scrolling.</p></div>
  <div class="tiles">
    <div class="tile"><span class="sub">Today</span><b>${fmtMin(S.daily[store.today()]?.sec || 0)}</b><span class="sub">goal ${S.settings.goalMin}m</span></div>
    <div class="tile"><span class="sub">Streak</span><b>${streak()} <small>days</small></b><span class="sub">5+ min a day</span></div>
    <div class="tile"><span class="sub">Last 7 days</span><b>${fmtMin(week)}</b><span class="sub">${fmtMin(all)} all time</span></div>
    <div class="tile"><span class="sub">Finished</span><b>${done}</b><span class="sub">videos</span></div>
    <div class="tile"><span class="sub">Notes & reflections</span><b>${nNotes}</b><span class="sub">written</span></div>
  </div>
  <div class="panels">
    <div class="panel"><h3>Last 14 days</h3><div class="bars">${days.map(d => `<div class="bar-col" title="${d.k}: ${fmtMin(d.sec)}"><div class="bar-track"><div class="bar ${d.sec >= goal ? 'hit' : ''}" style="height:${d.sec / max * 100}%"></div></div><span>${d.d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span></div>`).join('')}<div class="goal-line" style="bottom:${22 + goal / max * 168}px"><span>goal</span></div></div></div>
    <div class="panel"><h3>Learning diet <span class="sub">last 30 days</span></h3>${tot ? Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, s]) => `<div class="hbar"><span>${catName(c)}</span><div><i style="width:${s / tot * 100}%"></i></div><span class="sub">${fmtMin(s)}</span></div>`).join('') : '<div class="empty sm">Watch something to see your balance here.</div>'}</div>
  </div>`;
};

/* ----- algorithm transparency ----- */
PAGES.algorithm = () => {
  const P = S.profile;
  const tags = Object.entries(P.tag).sort((a, b) => b[1] - a[1]);
  const lvlName = P.level < 1.6 ? 'Beginner' : P.level < 2.4 ? 'Intermediate' : 'Advanced';
  return `<div class="page-head col"><h1>${icon('tune')} Your algorithm</h1><p class="sub">Nothing is hidden. This is everything the feed knows about you, and you can change any of it. It's stored only in this browser.</p></div>
  <div class="panels">
  <div class="panel"><h3>How it ranks</h3><ul class="principles">
    <li><b>Finishing beats clicking.</b> Completing a video, taking notes and writing reflections teach the feed. Opening a video and leaving early counts slightly against it.</li>
    <li><b>Substance over snacks.</b> Longer, deeper videos get a small boost and very short ones a small penalty.</li>
    <li><b>Next steps.</b> After you finish something, related videos at the same level or one up rise to the top.</li>
    <li><b>Balanced diet.</b> Interests you've neglected for two weeks get nudged back in.</li>
    <li><b>Deliberate exploration.</b> A few picks come from outside your topics. They change daily, not on every refresh.</li>
    <li><b>Diversity.</b> Results are re-ranked so no single channel or topic dominates.</li>
    <li><b>Finished means finished.</b> Videos you complete leave the feed and come back only as spaced-review prompts.</li></ul></div>
  <div class="panel"><h3>Interests</h3><p class="sub">Topics you're actively learning.</p>
    <div class="chips wrap">${CATEGORIES.map(c => `<button class="chip ${S.interests.includes(c.id) ? 'on' : ''}" data-act="interest" data-cat="${c.id}">${c.name}</button>`).join('')}</div>
    <h3 class="mt">Depth <span class="sub" id="lvl-name">${lvlName}</span></h3>
    <input type="range" min="1" max="3" step="0.1" value="${P.level}" data-set="level" aria-label="Depth"><div class="range-l"><span>Beginner</span><span>Advanced</span></div>
    <h3 class="mt">Exploration <span class="sub" id="exp-name">${Math.round(P.explore * 100)}%</span></h3>
    <input type="range" min="0" max="1" step="0.05" value="${P.explore}" data-set="explore" aria-label="Exploration"><div class="range-l"><span>Stay focused</span><span>Surprise me</span></div></div>
  <div class="panel"><h3>Learned category boosts</h3><p class="sub">Learned from what you finish and the feedback you give. Drag to override.</p>
    ${CATEGORIES.map(c => `<div class="slider-row"><span>${c.name}</span><input type="range" min="-4" max="6" step="0.1" value="${P.cat[c.id] || 0}" data-set="cat" data-cat="${c.id}" aria-label="${c.name} weight"><span class="sub val">${(P.cat[c.id] || 0).toFixed(1)}</span></div>`).join('')}</div>
  <div class="panel"><h3>Topics it thinks you like</h3><p class="sub">Click × to make it forget one.</p>
    <div class="chips wrap">${tags.length ? tags.map(([t, w]) => `<span class="chip tagw ${w < 0 ? 'neg' : ''}">${t.replace(/-/g, ' ')} <small>${w > 0 ? '+' : ''}${w.toFixed(1)}</small><button data-act="forget-tag" data-tag="${t}" aria-label="Forget ${t}">${icon('x')}</button></span>`).join('') : '<span class="sub">Nothing yet. Watch something all the way through.</span>'}</div>
    <h3 class="mt">Recent signals</h3><div class="log">${S.log.slice(0, 15).map(l => `<div><span class="sig ${['down', 'hide', 'abandon', 'advanced'].includes(l.signal) ? 'neg' : ''}">${esc(l.label)}</span> ${esc(l.title)}</div>`).join('') || '<span class="sub">No signals yet.</span>'}</div>
    <button class="btn ghost mt" data-act="reset-profile">Reset learned profile</button></div>
  </div>`;
};

/* ----- settings ----- */
PAGES.settings = () => {
  const st = S.settings;
  return `<div class="page-head col"><h1>${icon('gear')} Settings</h1></div>
  <div class="panels">
  <div class="panel"><h3>Habits</h3>
    <label class="field">Daily learning goal (minutes)<input type="number" min="5" max="600" value="${st.goalMin}" data-setting="goalMin"></label>
    <label class="field">Picks per feed<input type="number" min="4" max="40" value="${st.feedSize}" data-setting="feedSize"></label>
    <label class="field">Break reminder after (minutes of watching)<input type="number" min="10" max="240" value="${st.breakMin}" data-setting="breakMin"></label>
    <label class="check"><input type="checkbox" ${st.calmThumbs ? 'checked' : ''} data-setting="calmThumbs"> Calm thumbnails (desaturated until hover)</label>
    <label class="check"><input type="checkbox" ${st.theme === 'light' ? 'checked' : ''} data-setting="theme"> Light theme</label></div>
  <div class="panel"><h3>Add a video to your library</h3><p class="sub">Paste any YouTube link. It joins the recommendation pool.</p>
    <form id="add-form" class="stack-form"><input name="url" placeholder="https://www.youtube.com/watch?v=…" required>
      <div class="row"><select name="cat">${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
      <select name="level"><option value="1">Beginner</option><option value="2" selected>Intermediate</option><option value="3">Advanced</option></select></div>
      <input name="tags" placeholder="Topics, comma separated (e.g. probability, statistics)">
      <button class="btn" type="submit">${icon('plus')} Add video</button></form>
    ${S.custom.length ? `<div class="custom-list">${S.custom.map(v => `<div class="note-line"><a href="#/watch/${v.id}">${esc(v.title)}</a><button class="icon-btn xs" data-act="del-custom" data-id="${v.id}" aria-label="Remove">${icon('x')}</button></div>`).join('')}</div>` : ''}</div>
  <div class="panel"><h3>Comments (optional)</h3><p class="sub">Comments are hidden by default. To load them, add a free <a class="link" href="https://developers.google.com/youtube/v3/getting-started" target="_blank" rel="noopener">YouTube Data API v3 key</a>. It's stored only in this browser.</p>
    <label class="field">API key<input type="password" autocomplete="off" value="${esc(st.apiKey)}" data-setting="apiKey" placeholder="AIza…"></label></div>
  <div class="panel"><h3>Your data</h3><p class="sub">Everything lives in this browser's local storage.</p>
    <div class="row"><button class="btn ghost" data-act="export">Export JSON</button><label class="btn ghost">Import JSON<input type="file" accept="application/json" id="import" hidden></label><button class="btn danger" data-act="reset-all">Erase everything</button></div>
    <h3 class="mt">Shortcuts</h3><div class="kbd-list"><span><kbd>/</kbd> Search</span><span><kbd>N</kbd> Note at current time</span><span><kbd>F</kbd> Focus mode</span><span><kbd>C</kbd> Comments</span><span><kbd>R</kbd> Recommendations</span><span><kbd>Esc</kbd> Close</span></div></div>
  </div>`;
};
PAGES.settings.after = () => {
  $('#add-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target), id = parseId(f.get('url') || '');
    if (!id) return toast('That doesn\'t look like a YouTube link');
    if (catalog.has(id)) return toast('Already in your library');
    let title = 'Untitled video', channel = 'YouTube';
    try { const j = await (await fetch(`https://noembed.com/embed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`)).json(); if (j.title) { title = j.title; channel = j.author_name || channel; } } catch {}
    const tags = String(f.get('tags') || '').split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean);
    S.custom.push({ id, title, channel, cat: f.get('cat'), level: +f.get('level'), tags: tags.length ? tags : [f.get('cat')], dur: 0, year: null, desc: '' });
    rebuild(); save(); toast(`Added “${esc(title)}”`); render();
  });
  $('#import').addEventListener('change', async e => {
    try { const j = JSON.parse(await e.target.files[0].text()); Object.assign(S, j); rebuild(); save(true); toast('Imported'); render(); applySettings(); }
    catch { toast('Couldn\'t read that file'); }
  });
};

/* ---------- onboarding ---------- */
function onboarding() {
  const sel = new Set(S.interests);
  modal(`<h2>Build your learning feed</h2><p class="sub">No engagement tricks: no autoplay, no infinite scroll, comments and recommendations hidden until you ask. Pick what you want to get better at.</p>
    <div class="chips wrap" id="ob-cats">${CATEGORIES.map(c => `<button class="chip ${sel.has(c.id) ? 'on' : ''}" data-cat="${c.id}">${c.name}</button>`).join('')}</div>
    <h3 class="mt">Where are you starting from?</h3>
    <div class="seg" id="ob-lvl"><button data-l="1.2">Mostly new</button><button data-l="1.8" class="on">Some background</button><button data-l="2.6">Advanced</button></div>
    <h3 class="mt">Daily goal</h3>
    <div class="seg" id="ob-goal">${[20, 45, 90].map(m => `<button data-g="${m}" class="${m === 45 ? 'on' : ''}">${m} min</button>`).join('')}</div>
    <div class="end-actions mt"><button class="btn" id="ob-go">Start learning</button><button class="btn ghost" id="ob-skip">Skip</button></div>`, root => {
    root.querySelector('#ob-cats').onclick = e => { const b = e.target.closest('[data-cat]'); if (!b) return; b.classList.toggle('on'); sel.has(b.dataset.cat) ? sel.delete(b.dataset.cat) : sel.add(b.dataset.cat); };
    for (const g of ['#ob-lvl', '#ob-goal']) root.querySelector(g).onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('button', b.parentNode).forEach(x => x.classList.toggle('on', x === b)); };
    const finish = (apply) => {
      if (apply) {
        S.interests = [...sel];
        S.profile.level = +root.querySelector('#ob-lvl .on').dataset.l;
        S.settings.goalMin = +root.querySelector('#ob-goal .on').dataset.g;
      }
      S.onboarded = true; save(true); closeModal(); render();
    };
    root.querySelector('#ob-go').onclick = () => finish(true);
    root.querySelector('#ob-skip').onclick = () => finish(false);
  });
}

/* ---------- global events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!e.target.closest('#popmenu') && !(t && ['menu', 'len-menu'].includes(t.dataset.act))) closeMenu();
  if (!t) return;
  const a = t.dataset.act, id = t.dataset.id;
  switch (a) {
    case 'menu': e.preventDefault(); e.stopPropagation(); $('#popmenu') ? closeMenu() : openMenu(t); break;
    case 'fb': e.preventDefault(); closeMenu(); feedback(id, t.dataset.sig); break;
    case 'budget': S.settings.budget = +t.dataset.min; save(); closeMenu(); updateHome(); break;
    case 'len-menu': e.stopPropagation(); $('#popmenu') ? closeMenu() : openLenMenu(t); break;
    case 'path-area': {
      e.preventDefault(); const area = t.dataset.area;
      $$('#area-tabs a').forEach(a => a.classList.toggle('on', a === t));
      $$('#path-grid .path-card').forEach(c => { c.hidden = !!area && c.dataset.area !== area; });
      break;
    }
    case 'row-prev': case 'row-next': {
      const r = t.closest('.shelf').querySelector('.row-scroll');
      r.scrollBy({ left: (a === 'row-next' ? 1 : -1) * r.clientWidth * 0.9, behavior: 'smooth' }); break;
    }
    case 'toggle-comments': toggleReveal('#comments', t, 'comments', loadComments); break;
    case 'toggle-recs': toggleReveal('#recs', t, 'recommendations', renderRecs); break;
    case 'seek': player?.seekTo?.(+t.dataset.t, true); player?.playVideo?.(); break;
    case 'del-note': { const vid = curVid(); S.notes[vid] = (S.notes[vid] || []).filter(n => String(n.at) !== t.dataset.at); save(); renderNotes(); break; }
    case 'note-now': noteNow(); break;
    case 'focus': document.body.classList.toggle('focus'); break;
    case 'lesson': player?.playVideoAt?.(+t.dataset.i); break;
    case 'mark-lesson': {
      if (!view?.pl) break; const st = S.playlists[view.pl.id];
      if (!st.done.includes(view.id)) st.done.push(view.id);
      const h = S.history[view.id]; if (h && !h.completed) { h.completed = true; h.completedAt = Date.now(); rec.learn(S, view.v, 'complete'); }
      save(); renderLessons(); toast('Lesson marked done'); break;
    }
    case 'save-refl': {
      const el = $('#endscreen'), vid = el.dataset.vid, text = $('#refl-input').value.trim();
      if (text) {
        const first = !S.reflections[vid];
        S.reflections[vid] = { text, at: Date.now() };
        const v = catalog.get(vid); if (first && v) rec.learn(S, v, 'reflect');
        const h = S.history[vid]; if (h?.completed && !h.nextReview) rec.scheduleReview(h);
        save(); renderNotes(); toast('Reflection saved. It\'ll come back for review in a few days');
      }
      el.hidden = true; break;
    }
    case 'replay': $('#endscreen').hidden = true; player?.seekTo?.(0); player?.playVideo?.(); break;
    case 'close-end': $('#endscreen').hidden = true; break;
    case 'reviewed': {
      const h = S.history[id]; h.reviews = (h.reviews || 0) + 1; rec.scheduleReview(h); save();
      t.closest('.review-card').classList.add('gone'); setTimeout(render, 250); toast(`Nice. Next review in ${[2, 7, 21, 60][Math.min(h.reviews, 3)]} days`); break;
    }
    case 'interest': {
      const c = t.dataset.cat; S.interests = S.interests.includes(c) ? S.interests.filter(x => x !== c) : [...S.interests, c];
      t.classList.toggle('on'); save(); break;
    }
    case 'forget-tag': delete S.profile.tag[t.dataset.tag]; save(); t.closest('.chip').remove(); break;
    case 'reset-profile': if (confirm('Reset everything the feed has learned about your tastes? History and notes stay.')) { S.profile = { cat: {}, tag: {}, channel: {}, level: 1.5, explore: 0.35 }; S.feedback = {}; S.log = []; save(); render(); } break;
    case 'reset-all': if (confirm('Erase all history, notes, queue and settings on this device?')) { frozen = true; teardown(); store.reset(); location.hash = '#/'; location.reload(); } break;
    case 'export': download('deepwatch-data.json', JSON.stringify(S, null, 1), 'application/json'); break;
    case 'export-notes': download('deepwatch-notes.md', notesMarkdown(), 'text/markdown'); break;
    case 'hist-remove': {
      delete S.history[id]; save();
      const row = t.closest('.hist-item'); row.classList.add('gone');
      setTimeout(() => { const g = row.closest('.hist-group'); row.remove(); if (g && !g.querySelector('.hist-item')) g.remove(); }, 220);
      const n = $('#qh-tabs [data-tab="history"] .n'); if (n) n.textContent = historyItems().length;
      toast('Removed from history'); break;
    }
    case 'hist-clear': if (confirm('Clear your watch history? Notes, queue and what the feed has learned stay.')) { S.history = {}; save(); render(); toast('History cleared'); } break;
    case 'queue-clear': if (confirm('Remove every video from your queue?')) { S.queue = []; save(); render(); } break;
    case 'del-custom': S.custom = S.custom.filter(v => v.id !== id); rebuild(); save(); render(); break;
    case 'theme': S.settings.theme = S.settings.theme === 'light' ? 'dark' : 'light'; applySettings(); save(); break;
    case 'nav': document.body.classList.toggle(innerWidth < 900 ? 'nav-open' : 'nav-mini'); break;
    case 'close-modal': closeModal(); break;
  }
});

function toggleReveal(sel, btn, label, load) {
  const el = $(sel); if (!el) return;
  el.hidden = !el.hidden;
  btn.innerHTML = `${el.hidden ? 'Show' : 'Hide'} ${label}${label === 'comments' ? ' <kbd>C</kbd>' : ''}`;
  if (!el.hidden && !el.dataset.loaded) { el.dataset.loaded = 1; load(); }
}
function noteNow() {
  const i = $('#note-input'); if (!i) return;
  player?.pauseVideo?.(); i.focus(); i.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.set) {
    const P = S.profile, v = +t.value;
    if (t.dataset.set === 'level') { P.level = v; $('#lvl-name').textContent = v < 1.6 ? 'Beginner' : v < 2.4 ? 'Intermediate' : 'Advanced'; }
    if (t.dataset.set === 'explore') { P.explore = v; $('#exp-name').textContent = Math.round(v * 100) + '%'; }
    if (t.dataset.set === 'cat') { P.cat[t.dataset.cat] = v; t.nextElementSibling.textContent = v.toFixed(1); }
    save();
  }
  if (t.dataset.setting) {
    const k = t.dataset.setting;
    S.settings[k] = t.type === 'checkbox' ? (k === 'theme' ? (t.checked ? 'light' : 'dark') : t.checked) : t.type === 'number' ? Math.max(+t.min || 0, +t.value || 0) : t.value;
    applySettings(); save();
  }
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'search') { e.preventDefault(); const q = $('#search-input').value.trim(); if (q) location.hash = `#/search/${encodeURIComponent(q)}`; }
  if (f.dataset.form === 'notes') { e.preventDefault(); location.hash = `#/notes?q=${encodeURIComponent(f.q.value)}`; }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMenu(); closeModal(); document.body.classList.remove('focus'); if (document.activeElement?.blur) document.activeElement.blur(); return; }
  if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === '/') { e.preventDefault(); $('#search-input').focus(); }
  if (k === 'n') { e.preventDefault(); noteNow(); }
  if (k === 'f' && $('#player')) document.body.classList.toggle('focus');
  if (k === 'c') $('[data-act="toggle-comments"]')?.click();
  if (k === 'r') $('[data-act="toggle-recs"]')?.click();
});
window.addEventListener('beforeunload', () => { endView(); save(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });

function download(name, text, type) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function notesMarkdown() {
  const ids = [...new Set([...Object.keys(S.notes), ...Object.keys(S.reflections)])];
  return `# Deepwatch notes\n\n` + ids.map(id => {
    const v = vidMeta(id), notes = (S.notes[id] || []).slice().sort((a, b) => a.t - b.t);
    if (!notes.length && !S.reflections[id]) return '';
    return `## ${v.title}\n${v.channel} · https://www.youtube.com/watch?v=${id}\n\n${S.reflections[id] ? `> ${S.reflections[id].text}\n\n` : ''}${notes.map(n => `- [${fmtDur(n.t) || '0:00'}](https://www.youtube.com/watch?v=${id}&t=${Math.floor(n.t)}s) ${n.text}`).join('\n')}\n`;
  }).filter(Boolean).join('\n');
}

function applySettings() {
  document.documentElement.dataset.theme = S.settings.theme;
  document.body.classList.toggle('calm', !!S.settings.calmThumbs);
  updateGoal();
}

/* ---------- boot ---------- */
$('#nav').innerHTML = `
  <a href="#/">${icon('home')}<span>Home</span></a>
  <a href="#/deep">${icon('deep')}<span>Deep Dive</span></a>
  <a href="#/landmarks">${icon('spark')}<span>Landmark talks</span></a>
  <a href="#/queue">${icon('queue')}<span>Queue &amp; History</span></a>
  <a href="#/notes">${icon('notes')}<span>Notes</span></a>
  <a href="#/progress">${icon('chart')}<span>Progress</span></a>
  <a href="#/algorithm">${icon('tune')}<span>Your algorithm</span></a>
  <div class="nav-label">Topics</div>
  ${CATEGORIES.map(c => `<a class="topic" href="#/c/${c.id}"><span>${c.name}</span></a>`).join('')}
  <div class="nav-foot"><a href="#/settings">${icon('gear')}<span>Settings</span></a><a href="/"><span>← readitya.com</span></a></div>`;
$('#menu-btn').innerHTML = icon('menu');
$('#theme-btn').innerHTML = icon('moon');
$('#search-btn').innerHTML = icon('search');
applySettings();
render();
window.deepwatch = { state: S, render, save }; // handy for poking at your data from the console
if (!S.onboarded) onboarding();

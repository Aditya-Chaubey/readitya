// The recommendation engine. Everything runs locally and every score is explainable.
//
// Design goals (the opposite of an engagement-maximising feed):
//  - reward completion, note-taking and reflection, not clicks
//  - prefer substantive videos over short ones
//  - nudge you one level deeper on topics you've finished ("next step")
//  - keep a balanced learning diet across your interests, with deliberate exploration
//  - finite feed, diversity re-ranking, and spaced review of what you learned

import { CATEGORIES } from './data.js';

const DAY = 86400000;
// Tags that describe format, not subject. They count for taste but not for "next step" chains.
const STYLE_TAGS = new Set(['visual', 'intro', 'lecture', 'course', 'overview', 'map', 'coding', 'from-scratch', 'animation', 'documentary', 'fun', 'story', 'misconceptions', 'principles']);
const tanh = Math.tanh;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced'];
const catName = id => (CATEGORIES.find(c => c.id === id) || { name: id }).name;

// Signal strengths. Positive = "show me more of this".
const SIGNALS = {
  complete: 1.0, progress: 0.3, abandon: -0.35, note: 0.6, reflect: 0.8, save: 0.4,
  up: 1.5, down: -1.5, hide: -2.0, basic: 0, advanced: 0,
};
const LABELS = {
  complete: 'Finished', progress: 'Watched half', abandon: 'Left early', note: 'Took a note', reflect: 'Wrote a reflection',
  save: 'Saved', up: 'More like this', down: 'Less like this', hide: 'Not for me', basic: 'Too basic', advanced: 'Too advanced',
};

function bump(map, key, delta) {
  map[key] = clamp((map[key] || 0) + delta, -4, 6);
  if (Math.abs(map[key]) < 0.01) delete map[key];
}

/** Update the taste profile from one signal about one video. */
export function learn(state, v, signal) {
  if (!v) return;
  const P = state.profile, s = SIGNALS[signal] ?? 0, lr = 0.5;
  if (signal === 'basic') P.level = clamp(Math.max(P.level, v.level) + 0.4, 1, 3);
  if (signal === 'advanced') P.level = clamp(Math.min(P.level, v.level) - 0.4, 1, 3);
  if (signal === 'complete') P.level = clamp(P.level + (v.level - P.level) * 0.15, 1, 3); // drift towards what you finish
  if (s) {
    bump(P.cat, v.cat, lr * s);
    const per = (lr * s * 1.6) / Math.max(1, v.tags.length);
    v.tags.forEach(t => bump(P.tag, t, per));
    bump(P.channel, v.channel, lr * s * 0.5);
  }
  state.log.unshift({ at: Date.now(), id: v.id, title: v.title, signal, label: LABELS[signal], cat: v.cat });
  state.log.length = Math.min(state.log.length, 80);
}

// Deterministic per-day jitter so the feed changes daily but not on every refresh.
function jitter(id, salt) {
  let h = 2166136261;
  for (const c of id + salt) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}

function categoryShare(state, days = 14) {
  const share = {}; let total = 0;
  const cutoff = Date.now() - days * DAY;
  for (const [d, rec] of Object.entries(state.daily)) {
    if (new Date(d).getTime() < cutoff) continue;
    for (const [c, sec] of Object.entries(rec.byCat || {})) { share[c] = (share[c] || 0) + sec; total += sec; }
  }
  for (const c in share) share[c] /= total || 1;
  return share;
}

function recentCompleted(state, catalog, days = 21) {
  const cutoff = Date.now() - days * DAY;
  return Object.entries(state.history)
    .filter(([, h]) => h.completed && (h.completedAt || h.last) > cutoff)
    .sort((a, b) => (b[1].completedAt || 0) - (a[1].completedAt || 0))
    .map(([id]) => catalog.get(id)).filter(Boolean).slice(0, 8);
}

export function communityReason(v) {
  const r = v.rec; if (!r) return null;
  const hn = r.hn || 0, se = r.se || 0, li = r.lists || 0, n = hn + se + li;
  const text = hn ? `Recommended by ${hn} ${hn > 1 ? 'people' : 'person'} on Hacker News`
    : se ? `Recommended in Stack Exchange answers`
    : `On ${li} curated “best talks” list${li > 1 ? 's' : ''}`;
  return { n, text };
}

/** Score a single video. Returns { score, reasons: [{text, w}] }. */
export function score(v, state, ctx) {
  const P = state.profile, R = [];
  const add = (w, text) => { if (text && Math.abs(w) > 0.08) R.push({ text, w }); return w; };
  let s = 0;

  // 1. Interest in the category (onboarding interests + learned weight)
  const interest = (state.interests.includes(v.cat) ? 0.8 : 0) + tanh((P.cat[v.cat] || 0) / 2);
  s += interest * 0.9;
  if (interest > 0.5) R.push({ text: `You're learning ${catName(v.cat)}`, w: 0.25 }); // generic: shown only if nothing more specific

  // 1b. Community signal: recommended by real people on Hacker News, Stack Exchange or curated talk lists
  const cr = communityReason(v);
  if (cr) { s += cr.n >= 2 ? Math.min(0.15, 0.05 * cr.n) : 0; R.push({ text: cr.text, w: 0.32 }); }

  // 2. Topic affinity (learned tags)
  let best = null, tagSum = 0;
  for (const t of v.tags) {
    const a = tanh((P.tag[t] || 0) / 1.5); tagSum += a;
    if (!best || a > best.a) best = { t, a };
  }
  const tagScore = (tagSum / Math.max(1, v.tags.length)) * 1.3;
  s += add(tagScore, best && best.a > 0.25 ? `Builds on your interest in ${best.t.replace(/-/g, ' ')}` : '');

  // 3. Channel you tend to finish
  const ch = tanh((P.channel[v.channel] || 0) / 2) * 0.35;
  s += add(ch, ch > 0.15 ? `You usually finish ${v.channel}` : '');

  // 4. Level fit
  const gap = Math.abs(v.level - P.level);
  s += add(-0.55 * gap, '');
  if (gap < 0.6) R.push({ text: `${LEVELS[v.level]}: matches your level`, w: 0.2 });

  // 5. Substance over snacks: favour 10+ minute videos, penalise very short ones
  // Capped: depth matters, but a 3-hour podcast shouldn't beat a tight 30-minute lecture on length alone.
  const mins = (v.dur || 600) / 60;
  const subst = clamp(Math.log2(mins / 10), -1.2, 0.8) * 0.25 - (mins > 120 ? 0.25 : 0);
  if (mins >= 20 && mins <= 120) R.push({ text: `In-depth (${Math.round(mins)} min)`, w: 0.18 });
  s += subst;

  // 6. Next step: builds on something you just finished, at the same or a higher level
  for (const done of ctx.recent) {
    if (done.id === v.id) continue;
    const shared = v.tags.filter(t => done.tags.includes(t) && !STYLE_TAGS.has(t));
    if (shared.length && v.level >= done.level) {
      const series = done.channel === v.channel;
      s += add(0.35 + 0.3 * shared.length + (series ? 0.3 : 0) + (v.level > done.level ? 0.1 : 0),
        `${series ? 'Continues' : 'Next step after'} “${done.title.slice(0, 44)}${done.title.length > 44 ? '…' : ''}”`);
      break;
    }
  }

  // 7. Balanced diet: boost interests you've neglected lately
  if (state.interests.includes(v.cat) && ctx.interestCount > 1) {
    const fair = 1 / ctx.interestCount, got = ctx.share[v.cat] || 0;
    if (ctx.totalShare > 0 && got < fair * 0.5) s += add(0.35, `You haven't done much ${catName(v.cat)} lately`);
  }

  // 8. Exploration: a little daily randomness, larger outside your interests
  const outside = !state.interests.includes(v.cat) && (P.cat[v.cat] || 0) <= 0.3;
  const j = jitter(v.id, ctx.day);
  s += P.explore * (outside ? 0.9 : 0.35) * j;
  if (outside && j > 0.6 && P.explore > 0.15) R.push({ text: 'Something outside your usual topics', w: 0.2 });

  // 9. Time budget
  if (ctx.budget) {
    if (mins > ctx.budget * 1.1) s -= 3; else R.push({ text: `Fits your ${ctx.budget} min`, w: 0.15 });
  }

  // 10. Explicit feedback & context
  const fb = state.feedback[v.id];
  if (fb === 'down') s += add(-1.5, 'You said less like this');
  if (fb === 'up') s += add(0.4, 'You liked this');
  if (ctx.like) {
    const shared = v.tags.filter(t => ctx.like.tags.includes(t)).length;
    s += shared * 0.45 + (v.cat === ctx.like.cat ? 0.5 : 0);
    if (shared) R.push({ text: `Related to what you're watching`, w: 9 });
  }

  R.sort((a, b) => b.w - a.w);
  return { score: s, reasons: R.filter(r => r.w > 0).slice(0, 3) };
}

/** Build a context once per ranking pass. */
export function context(state, catalog, extra = {}) {
  const share = categoryShare(state);
  return {
    day: new Date().toDateString(),
    recent: recentCompleted(state, catalog),
    share, totalShare: Object.keys(share).length,
    interestCount: state.interests.length,
    budget: state.settings.budget || 0,
    ...extra,
  };
}

/** Rank candidates with Maximal-Marginal-Relevance style diversity. */
export function rank(cands, state, catalog, opts = {}) {
  const ctx = context(state, catalog, opts.ctx);
  const scored = cands
    .filter(v => state.feedback[v.id] !== 'hide')
    .filter(v => opts.includeSeen || !(state.history[v.id]?.completed))
    .filter(v => opts.includeSeen || !isInProgress(state, v.id))
    .map(v => ({ v, ...score(v, state, ctx) }));
  if (opts.sort === 'none') return scored.sort((a, b) => b.score - a.score);
  // Source mix: one-off forum talks each come from a different channel, so the channel rule alone would let
  // them crowd out curated channels. Each extra forum talk in the feed costs a little.
  const out = [], catCount = {}, chCount = {}; let forumCount = 0;
  const pool = scored.slice();
  const n = Math.min(opts.limit || pool.length, pool.length);
  while (out.length < n && pool.length) {
    let bi = 0, bs = -Infinity;
    pool.forEach((it, i) => {
      const d = it.score - (state.interests.includes(it.v.cat) ? 0.1 : 0.32) * (catCount[it.v.cat] || 0) - 0.45 * (chCount[it.v.channel] || 0) - (it.v.rec ? 0.3 * forumCount : 0);
      if (d > bs) { bs = d; bi = i; }
    });
    const [it] = pool.splice(bi, 1);
    catCount[it.v.cat] = (catCount[it.v.cat] || 0) + 1;
    chCount[it.v.channel] = (chCount[it.v.channel] || 0) + 1;
    if (it.v.rec) forumCount++;
    out.push(it);
  }
  return out;
}

export function isInProgress(state, id) {
  const h = state.history[id];
  return !!h && !h.completed && h.progress > 0.04 && h.progress < 0.9;
}

// Spaced review: finished videos you took notes on resurface after 2, 7, 21, 60 days.
const INTERVALS = [2, 7, 21, 60];
export function scheduleReview(h) {
  const i = Math.min(h.reviews || 0, INTERVALS.length - 1);
  h.nextReview = Date.now() + INTERVALS[i] * DAY;
}
export function dueReviews(state, catalog) {
  return Object.entries(state.history)
    .filter(([id, h]) => h.completed && h.nextReview && h.nextReview <= Date.now() && (state.notes[id]?.length || state.reflections[id]) && (h.reviews || 0) < INTERVALS.length)
    .map(([id]) => catalog.get(id)).filter(Boolean);
}

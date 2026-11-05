// Persistent state, kept in localStorage on this device only.
const KEY = 'deepwatch.v1';

export const defaults = () => ({
  onboarded: false,
  interests: [],
  profile: { cat: {}, tag: {}, channel: {}, level: 1.5, explore: 0.35 },
  history: {},     // videoId -> { sec, dur, pos, progress, completed, first, last, views, completedAt, reviews, nextReview }
  feedback: {},    // videoId -> 'up' | 'down' | 'hide'
  queue: [],       // videoIds
  notes: {},       // videoId -> [{ t, text, at }]
  reflections: {}, // videoId -> { text, at }
  playlists: {},   // playlistId -> { started, last, index, done: [videoIds], items: [videoIds], titles: {} }
  daily: {},       // 'YYYY-MM-DD' -> { sec, byCat: {} }
  custom: [],      // user-added videos (same shape as catalog)
  log: [],         // recent learning signals, for transparency
  settings: { theme: 'dark', goalMin: 45, calmThumbs: false, apiKey: '', feedSize: 12, budget: 0, breakMin: 50, sidebar: true },
});

function merge(base, saved) {
  for (const k of Object.keys(saved || {})) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && saved[k] && typeof saved[k] === 'object' && !Array.isArray(saved[k])) {
      base[k] = merge(base[k], saved[k]);
    } else base[k] = saved[k];
  }
  return base;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return merge(defaults(), raw ? JSON.parse(raw) : {});
  } catch { return defaults(); }
}

let timer = null;
export function save(state, now = false) {
  const write = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };
  clearTimeout(timer);
  if (now) write(); else timer = setTimeout(write, 300);
}

export function reset() {
  clearTimeout(timer);
  try { localStorage.removeItem(KEY); } catch {}
}

export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

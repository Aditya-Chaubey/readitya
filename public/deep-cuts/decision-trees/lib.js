/* Decision-tree engine for the Deep Cuts story "The Tree That Asks Questions".
   A small, honest CART implementation: Gini impurity, axis-aligned splits on
   midpoints, greedy recursion. Everything the page shows is computed here. */
(function (g) {
  'use strict';

  const DOMAIN = { x0: 2, x1: 16, y0: 1, y1: 13 };
  const FEATURES = ['cap', 'stem'];
  const FEATURE_NAMES = { cap: 'cap width', stem: 'stem height' };

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* The invented forest's hidden rule. 1 = poisonous, 0 = edible.
     Three pockets of danger: tall, broad "parasols"; short, tiny "buttons";
     and a diagonal band of spindly ones whose stems outgrow their caps. */
  function truth(cap, stem) {
    if (cap > 9.5 && stem > 7.5) return 1;
    if (cap < 5.5 && stem < 5) return 1;
    if (stem > cap + 3.2) return 1;
    return 0;
  }

  function makeData(n, seed, noise) {
    const r = rng(seed);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const cap = +(DOMAIN.x0 + 0.3 + r() * (DOMAIN.x1 - DOMAIN.x0 - 0.6)).toFixed(1);
      const stem = +(DOMAIN.y0 + 0.3 + r() * (DOMAIN.y1 - DOMAIN.y0 - 0.6)).toFixed(1);
      let label = truth(cap, stem);
      const flipped = r() < noise;
      if (flipped) label = 1 - label;
      pts.push({ id: i, cap, stem, label, flipped });
    }
    return pts;
  }

  function counts(pts) {
    let p = 0;
    for (const d of pts) p += d.label;
    return [pts.length - p, p];
  }

  function gini(c) {
    const n = c[0] + c[1];
    if (!n) return 0;
    const a = c[0] / n, b = c[1] / n;
    return 1 - a * a - b * b;
  }

  function entropy(c) {
    const n = c[0] + c[1];
    if (!n) return 0;
    let h = 0;
    for (const k of c) if (k) h -= (k / n) * Math.log2(k / n);
    return h;
  }

  /* Weighted impurity of splitting pts at feature <= t */
  function splitScore(pts, feature, t) {
    const L = [0, 0], R = [0, 0];
    for (const d of pts) (d[feature] <= t ? L : R)[d.label]++;
    const nl = L[0] + L[1], nr = R[0] + R[1], n = nl + nr;
    return { left: L, right: R, score: (nl * gini(L) + nr * gini(R)) / n };
  }

  /* Every candidate threshold for one feature, with its weighted impurity. */
  function sweep(pts, feature) {
    const vals = [...new Set(pts.map((d) => d[feature]))].sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < vals.length - 1; i++) {
      const t = +((vals[i] + vals[i + 1]) / 2).toFixed(2);
      out.push({ t, ...splitScore(pts, feature, t) });
    }
    return out;
  }

  function bestSplit(pts, opts, r) {
    let feats = FEATURES;
    if (opts.maxFeatures && opts.maxFeatures < FEATURES.length) {
      feats = [FEATURES[Math.floor(r() * FEATURES.length)]];
    }
    let best = null;
    for (const f of feats) {
      for (const s of sweep(pts, f)) {
        const nl = s.left[0] + s.left[1], nr = s.right[0] + s.right[1];
        if (nl < opts.minLeaf || nr < opts.minLeaf) continue;
        if (!best || s.score < best.score - 1e-12) best = { feature: f, ...s };
      }
    }
    return best;
  }

  let uid = 0;
  function buildTree(pts, opts = {}) {
    const o = { maxDepth: 4, minLeaf: 1, maxFeatures: 0, seed: 7, ...opts };
    const r = rng(o.seed);
    uid = 0;
    function grow(sub, depth, bounds, path) {
      const c = counts(sub);
      const node = {
        id: uid++, depth, n: sub.length, counts: c, impurity: gini(c),
        pred: c[1] > c[0] ? 1 : 0, bounds, path, leaf: true,
      };
      if (depth >= o.maxDepth || node.impurity === 0 || sub.length < 2 * o.minLeaf) return node;
      const s = bestSplit(sub, o, r);
      if (!s || s.score >= node.impurity - 1e-9) return node;
      node.leaf = false;
      node.feature = s.feature;
      node.threshold = s.t;
      node.gain = node.impurity - s.score;
      const [lo, hi] = s.feature === 'cap' ? ['x1', 'x0'] : ['y1', 'y0'];
      const lb = { ...bounds, [lo]: s.t }, rb = { ...bounds, [hi]: s.t };
      node.left = grow(sub.filter((d) => d[s.feature] <= s.t), depth + 1, lb, path.concat({ f: s.feature, t: s.t, dir: 'le' }));
      node.right = grow(sub.filter((d) => d[s.feature] > s.t), depth + 1, rb, path.concat({ f: s.feature, t: s.t, dir: 'gt' }));
      return node;
    }
    return grow(pts, 0, { ...DOMAIN }, []);
  }

  function predict(node, cap, stem) {
    while (!node.leaf) node = (node.feature === 'cap' ? cap : stem) <= node.threshold ? node.left : node.right;
    return node.pred;
  }
  function leafFor(node, cap, stem) {
    while (!node.leaf) node = (node.feature === 'cap' ? cap : stem) <= node.threshold ? node.left : node.right;
    return node;
  }

  function accuracy(model, pts, fn = predict) {
    let ok = 0;
    for (const d of pts) ok += fn(model, d.cap, d.stem) === d.label ? 1 : 0;
    return ok / pts.length;
  }

  function nodes(tree) {
    const out = [];
    (function walk(n) { out.push(n); if (!n.leaf) { walk(n.left); walk(n.right); } })(tree);
    return out;
  }
  const leaves = (tree) => nodes(tree).filter((n) => n.leaf);
  function depthOf(tree) { return Math.max(...nodes(tree).map((n) => n.depth)); }

  /* Prune a fully grown tree to a given depth (cheap view of the same tree). */
  function truncate(node, d) {
    if (node.leaf || node.depth >= d) return { ...node, leaf: true, left: undefined, right: undefined };
    return { ...node, left: truncate(node.left, d), right: truncate(node.right, d) };
  }

  function bootstrap(pts, r) {
    const out = [];
    for (let i = 0; i < pts.length; i++) out.push(pts[Math.floor(r() * pts.length)]);
    return out;
  }

  function forest(pts, n, opts = {}) {
    const r = rng(opts.seed || 99);
    const trees = [];
    for (let i = 0; i < n; i++) {
      const sample = bootstrap(pts, r);
      trees.push(buildTree(sample, { maxDepth: 12, minLeaf: 1, maxFeatures: 1, seed: Math.floor(r() * 1e9), ...opts.tree }));
    }
    return trees;
  }
  function forestVote(trees, cap, stem, k = trees.length) {
    let v = 0;
    for (let i = 0; i < k; i++) v += predict(trees[i], cap, stem);
    return v / k;
  }
  const forestPredict = (trees, cap, stem) => (forestVote(trees, cap, stem) > 0.5 ? 1 : 0);

  g.DTLib = {
    DOMAIN, FEATURES, FEATURE_NAMES, rng, truth, makeData, counts, gini, entropy,
    splitScore, sweep, bestSplit, buildTree, predict, leafFor, accuracy, nodes, leaves,
    depthOf, truncate, bootstrap, forest, forestVote, forestPredict,
  };
})(typeof window !== 'undefined' ? window : globalThis);

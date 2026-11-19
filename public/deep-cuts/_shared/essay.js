"use strict";

const byId = (id) => document.getElementById(id);
const ink = "#242451";
const blue = "#3535bc";
const orange = "#b94224";
const motion = matchMedia("(prefers-reduced-motion: reduce)");

function responsiveCanvas(canvas, heightRatio, draw) {
  const paint = () => {
    const width = canvas.clientWidth;
    if (!width) return;
    const height = Math.round(width * heightRatio);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(ctx, width, height);
  };
  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(paint);
  }).observe(canvas);
  paint();
  return paint;
}
function line(ctx, from, to, color, width = 1) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.stroke();
}

function dot(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function arrow(ctx, start, end, color, width = 2.6) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (Math.hypot(dx, dy) < 2) {
    dot(ctx, ...start, 4, color);
    return;
  }
  const angle = Math.atan2(dy, dx);
  line(ctx, start, end, color, width);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.moveTo(...end);
  for (const sign of [-1, 1]) {
    ctx.lineTo(end[0] - 10 * Math.cos(angle + sign * .48), end[1] - 10 * Math.sin(angle + sign * .48));
  }
  ctx.fill();
}

function label(ctx, value, x, y, color, align = "left", size = 12) {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = size + "px monospace";
  ctx.fillText(value, x, y);
}

function drawCover(ctx, width, height) {
  const w = width / 720;
  const h = height / 580;
  ctx.save();
  ctx.scale(w, h);
  const background = ctx.createRadialGradient(425, 270, 15, 380, 265, 550);
  background.addColorStop(0, "#393395");
  background.addColorStop(.55, "#23216a");
  background.addColorStop(1, "#111132");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 720, 580);

  for (let y = 35; y < 580; y += 22) {
    for (let x = 26; x < 720; x += 22) dot(ctx, x, y, 1, "#aaa0eb38");
  }
  const project = (u, v) => {
    const bow = Math.exp(-((u - .15) ** 2 * 1.5 + (v + .1) ** 2 * 2.1));
    const ripple = Math.sin(4 * u + 2 * v) * Math.exp(-(v ** 2 * 2));
    return [350 + 224 * u + 103 * v + 52 * bow, 321 + 57 * u - 139 * v - 134 * bow + 26 * ripple];
  };
  for (const direction of [0, 1]) {
    for (let n = -14; n <= 14; n++) {
      ctx.beginPath();
      const major = n % 5 === 0;
      ctx.strokeStyle = n === 0 ? "#f4b5efdc" : major ? "#c2a6ffb8" : "#9690fc91";
      ctx.lineWidth = n === 0 ? 2 : major ? 1.5 : .94;
      for (let sample = 0; sample <= 160; sample++) {
        const t = -1.65 + 3.3 * sample / 160;
        const fixed = n / 11;
        const xy = direction ? project(fixed, t) : project(t, fixed);
        if (sample === 0) ctx.moveTo(...xy);
        else ctx.lineTo(...xy);
      }
      ctx.stroke();
    }
  }

  const x = 398;
  const y = 199;
  const glow = ctx.createRadialGradient(x, y, 7, x, y, 116);
  glow.addColorStop(0, "#ff9f6377");
  glow.addColorStop(1, "#ff7d4a00");
  dot(ctx, x, y, 116, glow);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-.31);
  ctx.lineWidth = 1.4;
  for (const [rx, ry, shade] of [[109, 34, "#ff997bad"], [118, 40, "#fe9d655d"]]) {
    ctx.beginPath();
    ctx.strokeStyle = shade;
    ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  const sphere = ctx.createRadialGradient(x - 14, y - 15, 2, x + 1, y + 1, 43);
  sphere.addColorStop(0, "#fff5b6");
  sphere.addColorStop(.38, "#ffb361");
  sphere.addColorStop(.74, "#ff7040");
  sphere.addColorStop(1, "#ac2e63");
  dot(ctx, x, y, 43, sphere);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 43, 0, 2 * Math.PI);
  ctx.clip();
  for (let r = -36; r <= 36; r += 7) {
    ctx.beginPath();
    ctx.strokeStyle = "#71255866";
    ctx.lineWidth = .85;
    ctx.ellipse(x, y + r * .8, 45, 13, -.28, .05, Math.PI - .05);
    ctx.stroke();
  }
  ctx.restore();

  ctx.setLineDash([4, 6]);
  line(ctx, [x, y + 44], [x, 379], "#ffd1a8ac");
  line(ctx, [507, 157], [607, 126], "#dcc5ffaa");
  line(ctx, [322, 329], [217, 426], "#dcc5ffaa");
  ctx.setLineDash([]);
  dot(ctx, x, 379, 5, "#ff9e75");
  dot(ctx, 507, 157, 3, "#e5d4ff");
  dot(ctx, 322, 329, 3, "#e5d4ff");
  ctx.strokeStyle = "#b2a6eb65";
  ctx.strokeRect(25, 24, 670, 532);
  label(ctx, "v′", 615, 130, "#ded3ff", "left", 16);
  label(ctx, "v", 203, 437, "#ded3ff", "right", 16);
  ctx.restore();
}

const cover = byId("cover");
if (cover) {
  responsiveCanvas(cover, cover.closest(".archive-art") ? 1 / 1.35 : 1 / 1.24, drawCover);
}

const chapters = [...document.querySelectorAll("[data-chapter]")];
if (chapters.length) {
  const chapterLinks = [...document.querySelectorAll(".chapter-menu a")];
  const progress = byId("progress");
  const main = byId("main");
  let queued = false;
  function readingPosition() {
    queued = false;
    const bounds = main.getBoundingClientRect();
    const fraction = -bounds.top / Math.max(1, bounds.height - innerHeight);
    progress.style.transform = "scaleX(" + Math.max(0, Math.min(fraction, 1)) + ")";
    let active = 0;
    chapters.forEach((chapter, index) => {
      if (chapter.getBoundingClientRect().top <= innerHeight * .34) active = index;
    });
    chapterLinks.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  function scheduleReadingPosition() {
    if (!queued) requestAnimationFrame(readingPosition);
    queued = true;
  }
  addEventListener("scroll", scheduleReadingPosition, { passive: true });
  addEventListener("resize", scheduleReadingPosition);
  readingPosition();

  const toggle = document.querySelector(".contents-toggle");
  const menu = byId("chapter-menu");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  chapterLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
}

if (byId("vector-plot")) {
  const finance = byId("finance");
  const water = byId("water");
  const render = responsiveCanvas(byId("vector-plot"), .57, (ctx, width, height) => {
    const x = (v) => 37 + v / 5 * (width - 74);
    const y = (v) => height - 36 - v / 5 * (height - 62);
    for (let i = 0; i <= 5; i++) {
      line(ctx, [x(i), y(0)], [x(i), y(5)], "#dbd8ed");
      line(ctx, [x(0), y(i)], [x(5), y(i)], "#dbd8ed");
    }
    line(ctx, [x(0), y(0)], [x(5), y(0)], "#77739e");
    line(ctx, [x(0), y(0)], [x(0), y(5)], "#77739e");
    label(ctx, "Finance", x(5), height - 12, ink, "right");
    label(ctx, "Water", x(0), 17, ink);
    const sample = [["duck", .6, 4.45], ["river", 1.7, 3.75], ["savings", 3.45, .8], ["mortgage", 4.75, .4]];
    sample.forEach(([word, px, py]) => {
      dot(ctx, x(px), y(py), 4, blue);
      label(ctx, word, x(px) - (px > 3 ? 5 : -7), y(py) - 7, ink, px > 3 ? "right" : "left", width < 400 ? 10 : 12);
    });
    const px = +finance.value;
    const py = +water.value;
    arrow(ctx, [x(0), y(0)], [x(px), y(py)], orange);
    dot(ctx, x(px), y(py), 4, orange);
    label(ctx, "bank", x(px) + (px > 4 ? -8 : 8), y(py) - 9, orange, px > 4 ? "right" : "left");
    byId("finance-out").value = px.toFixed(1);
    byId("water-out").value = py.toFixed(1);
  });
  [finance, water].forEach((input) => input.addEventListener("input", render));
  document.querySelectorAll("[data-word-place]").forEach((button) => {
    button.addEventListener("click", () => {
      const atRiver = button.dataset.wordPlace === "river";
      finance.value = atRiver ? "2" : "4";
      water.value = atRiver ? "3.5" : "1.5";
      render();
    });
  });
}

if (byId("angle-plot")) {
  const slider = byId("angle");
  let shownAngle = +slider.value;
  let angleAnimation = 0;
  const render = responsiveCanvas(byId("angle-plot"), .5, (ctx, width, height) => {
    const degrees = +slider.value;
    const radians = shownAngle * Math.PI / 180;
    const origin = [width / 2, height * .72];
    const radius = Math.min(height * .56, width * .38);
    const point = [origin[0] + radius * Math.cos(radians), origin[1] - radius * Math.sin(radians)];
    ctx.beginPath();
    ctx.strokeStyle = "#69659b";
    ctx.arc(...origin, radius, Math.PI, Math.PI * 2);
    ctx.stroke();
    line(ctx, [origin[0] - radius, origin[1]], [origin[0] + radius, origin[1]], "#69659b");
    ctx.setLineDash([3, 4]);
    line(ctx, point, [point[0], origin[1]], "#f3b79e95");
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.strokeStyle = "#ff956e";
    ctx.arc(...origin, radius * .27, -radians, 0);
    ctx.stroke();
    arrow(ctx, origin, [origin[0] + radius, origin[1]], "#a69fff", 4);
    arrow(ctx, origin, point, "#ff936b", 2.4);
    label(ctx, "−1", origin[0] - radius, origin[1] + 20, "#d4cffd", "center");
    label(ctx, "0", origin[0], origin[1] + 20, "#d4cffd", "center");
    label(ctx, "+1", origin[0] + radius, origin[1] + 20, "#d4cffd", "center");
    byId("angle-out").value = degrees + "°";
    byId("cosine").value = Math.cos(degrees * Math.PI / 180).toFixed(2);
  });
  slider.addEventListener("input", () => {
    cancelAnimationFrame(angleAnimation);
    shownAngle = +slider.value;
    render();
  });
  document.querySelectorAll("[data-angle-value]").forEach((button) => {
    button.addEventListener("click", () => {
      cancelAnimationFrame(angleAnimation);
      const startAngle = shownAngle;
      const endAngle = Number(button.dataset.angleValue);
      slider.value = String(endAngle);
      const startTime = performance.now();
      function frame(now) {
        const t = motion.matches ? 1 : Math.min(1, (now - startTime) / 360);
        shownAngle = startAngle + (endAngle - startAngle) * (1 - (1 - t) ** 3);
        render();
        if (t < 1) angleAnimation = requestAnimationFrame(frame);
      }
      angleAnimation = requestAnimationFrame(frame);
    });
  });
}

const transforms = {
  identity: [1, 0, 0, 1],
  stretch: [1.5, 0, 0, .65],
  shear: [1, 1, 0, 1],
  rotate: [0, -1, 1, 0],
  flatten: [1, 0, 0, 0]
};

if (byId("matrix-plot")) {
  const buttons = [...document.querySelectorAll("[data-transform]")];
  let matrix = transforms.identity;
  let animation = 0;
  const render = responsiveCanvas(byId("matrix-plot"), .66, (ctx, width, height) => {
    const [a, b, c, d] = matrix;
    const scale = Math.min(width / 9, height / 6);
    const center = [width / 2, height / 2];
    const locate = (x, y) => [center[0] + x * scale, center[1] - y * scale];
    const mapped = (x, y) => locate(a * x + b * y, c * x + d * y);
    for (let i = -7; i <= 7; i++) {
      line(ctx, locate(i, -7), locate(i, 7), "#e3e0ef");
      line(ctx, locate(-7, i), locate(7, i), "#e3e0ef");
    }
    for (let i = -10; i <= 10; i++) {
      line(ctx, mapped(i, -12), mapped(i, 12), "#8175d375");
      line(ctx, mapped(-12, i), mapped(12, i), "#8175d375");
    }
    line(ctx, mapped(-12, 0), mapped(12, 0), "#6359a6", 1.5);
    line(ctx, mapped(0, -12), mapped(0, 12), "#6359a6", 1.5);
    arrow(ctx, center, mapped(1, 0), blue);
    arrow(ctx, center, mapped(0, 1), orange);
    const [px, py] = mapped(2, 1);
    ctx.fillStyle = "#211952";
    ctx.fillRect(px - 4, py - 4, 8, 8);
    if (Math.abs(determinant(matrix)) < .001) {
      label(ctx, "All points land on a line", 12, 22, ink, "left", width < 370 ? 10 : 12);
    }
  });
  function determinant([a, b, c, d]) {
    return a * d - b * c;
  }
  let selection = "identity";
  function select(name) {
    if (name === selection) return;
    selection = name;
    const target = transforms[name];
    const [a, b, c, d] = target;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.transform === name)));
    byId("matrix-values").textContent = "[ " + a + ", " + b + " / " + c + ", " + d + " ]";
    byId("determinant").textContent = String(+determinant(target).toFixed(3));
    byId("matrix-point").textContent = "(" + (2 * a + b) + ", " + (2 * c + d) + ")";
    cancelAnimationFrame(animation);
    const initial = matrix;
    const start = performance.now();
    function frame(now) {
      const t = motion.matches ? 1 : Math.min(1, (now - start) / 390);
      const blend = 1 - (1 - t) ** 3;
      matrix = target.map((value, i) => initial[i] + (value - initial[i]) * blend);
      render();
      if (t < 1) animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
  }
  buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.transform)));

  const wide = matchMedia("(min-width: 971px)");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!wide.matches) return;
      const visibleStep = entries.find((entry) => entry.isIntersecting)?.target;
      if (!visibleStep) return;
      document.querySelectorAll(".step").forEach((step) => step.classList.toggle("is-current", step === visibleStep));
      select(visibleStep.dataset.step);
    }, { rootMargin: "-40% 0px -42% 0px" });
    document.querySelectorAll("[data-step]").forEach((step) => observer.observe(step));
  }
}

function landscape(width, height) {
  const ridges = [
    { base: .45, peak: .12, center: .63, spread: .5, tone: 123, phase: .5 },
    { base: .7, peak: .27, center: .29, spread: .43, tone: 83, phase: 2.1 },
    { base: .91, peak: .23, center: .79, spread: .53, tone: 50, phase: 3.4 }
  ];
  return Array.from({ length: height }, (_, j) => Float64Array.from({ length: width }, (_, i) => {
    const x = i / (width - 1);
    const y = j / (height - 1);
    const hash = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    const noise = hash - Math.floor(hash) - .5;
    let brightness = 118 + 82 * y + 22 * Math.sin(3 * x) + noise * 10;
    const moon = Math.hypot(x - .7, (y - .235) * height / width);
    if (moon < .09) brightness = 237 - 14 * moon / .09 + noise * 6;
    const cloud = Math.sin(x * 16 + y * 70) + Math.sin(x * 29 - y * 29);
    brightness += Math.max(0, cloud - 1.12) * 13 * (1 - y);
    ridges.forEach(({ base, peak, center, spread, tone, phase }) => {
      const top = base - peak * Math.max(0, 1 - Math.abs(x - center) / spread)
        + .024 * Math.sin(31 * x + phase) + .011 * Math.sin(95 * x + phase);
      if (y > top) {
        const texture = Math.sin(x * 89 + y * 43 + phase) * Math.sin(x * 29 + y * 63);
        brightness = tone + (1 - y) * 32 + texture * 13 + noise * 21;
      }
    });
    return Math.max(0, Math.min(255, brightness));
  }));
}

function leftSingularVectors(image) {
  const n = image.length;
  const width = image[0].length;
  const gram = Array.from({ length: n }, () => new Float64Array(n));
  const basis = Array.from({ length: n }, (_, i) => Float64Array.from({ length: n }, (_, j) => +(i === j)));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let dotProduct = 0;
      for (let x = 0; x < width; x++) dotProduct += image[i][x] * image[j][x];
      gram[i][j] = gram[j][i] = dotProduct;
    }
  }
  // Jacobi rotations diagonalize the symmetric Gram matrix.
  const tolerance = gram.reduce((sum, row, i) => sum + row[i], 0) * 1e-13;
  for (let sweep = 0; sweep < 30; sweep++) {
    let rotated = false;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const pq = gram[p][q];
        if (Math.abs(pq) <= tolerance) continue;
        rotated = true;
        const theta = .5 * Math.atan2(2 * pq, gram[q][q] - gram[p][p]);
        const cosine = Math.cos(theta);
        const sine = Math.sin(theta);
        const pp = gram[p][p];
        const qq = gram[q][q];
        gram[p][p] = cosine ** 2 * pp - 2 * sine * cosine * pq + sine ** 2 * qq;
        gram[q][q] = sine ** 2 * pp + 2 * sine * cosine * pq + cosine ** 2 * qq;
        gram[p][q] = gram[q][p] = 0;
        for (let k = 0; k < n; k++) {
          if (k !== p && k !== q) {
            const kp = gram[k][p];
            const kq = gram[k][q];
            gram[k][p] = gram[p][k] = cosine * kp - sine * kq;
            gram[k][q] = gram[q][k] = sine * kp + cosine * kq;
          }
          const up = basis[k][p];
          const uq = basis[k][q];
          basis[k][p] = cosine * up - sine * uq;
          basis[k][q] = sine * up + cosine * uq;
        }
      }
    }
    if (!rotated) break;
  }
  return basis.map((_, i) => ({
    energy: Math.max(0, gram[i][i]),
    vector: Float64Array.from(basis, (row) => row[i])
  })).sort((a, b) => b.energy - a.energy);
}

function paintImage(canvas, matrix) {
  const ctx = canvas.getContext("2d");
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  matrix.forEach((row, y) => row.forEach((value, x) => {
    const i = 4 * (y * canvas.width + x);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }));
  ctx.putImageData(pixels, 0, 0);
}

if (byId("rank-original")) {
  const original = byId("rank-original");
  const preview = byId("rank-preview");
  const slider = byId("rank-slider");
  const { width, height } = original;
  const image = landscape(width, height);
  paintImage(original, image);

  const initialize = () => {
    const components = leftSingularVectors(image);
    const energy = components.reduce((sum, component) => sum + component.energy, 0);
    const patterns = components.slice(0, Number(slider.max)).map(({ vector }) =>
      Float64Array.from({ length: width }, (_, x) =>
        vector.reduce((sum, value, y) => sum + value * image[y][x], 0)));
    function render() {
      const count = Number(slider.value);
      const reconstruction = Array.from({ length: height }, () => new Float64Array(width));
      let retained = 0;
      for (let i = 0; i < count; i++) {
        const { vector, energy: part } = components[i];
        retained += part;
        reconstruction.forEach((row, y) => {
          for (let x = 0; x < width; x++) row[x] += vector[y] * patterns[i][x];
        });
      }
      paintImage(preview, reconstruction);
      byId("rank-out").value = count;
      byId("rank-count").textContent = (count * (width + height + 1)).toLocaleString("en") + " of " + (width * height).toLocaleString("en") + " scalar entries";
      byId("rank-energy").textContent = (100 * retained / energy).toFixed(2) + "% of squared brightness retained";
    }
    slider.addEventListener("input", render);
    document.querySelectorAll("[data-rank-value]").forEach((button) => {
      button.addEventListener("click", () => {
        slider.value = button.dataset.rankValue;
        render();
      });
    });
    render();
  };
  if ("requestIdleCallback" in window) requestIdleCallback(initialize, { timeout: 400 });
  else setTimeout(initialize, 0);
}

if (byId("attention-bars")) {
  const examples = {
    river: {
      text: "The duck waddled up the ",
      tokens: [
        ["The", [.1, .2], [.3, .3]], ["duck", [0, 3], [.1, 4.9]],
        ["waddled", [.1, 1.7], [.3, 3.5]], ["up", [.3, .2], [.3, .6]],
        ["the", [.1, .2], [.3, .3]], ["bank", [.5, .5], [2.5, 2.5]]
      ]
    },
    money: {
      text: "She opened an account at the ",
      tokens: [
        ["She", [.2, .1], [.5, .2]], ["opened", [1.5, .3], [3.1, .4]],
        ["an", [.1, .2], [.4, .3]], ["account", [3, .3], [4.9, .15]],
        ["at", [.4, .2], [.5, .6]], ["the", [.1, .2], [.3, .3]], ["bank", [.5, .5], [2.5, 2.5]]
      ]
    }
  };
  const instructions = {
    score: "Compare the query for “bank” with the key for each word. The bars show scaled dot products.",
    weights: "Turn the scores into shares with softmax. The shares add to 100% before rounding.",
    mix: "Multiply each word’s value vector by its share, then add the scaled vectors. The coordinates below show the result."
  };
  const sentenceButtons = [...document.querySelectorAll("[data-sentence]")];
  const phaseButtons = [...document.querySelectorAll("[data-attention-phase]")];
  const query = [1, 1];
  const scoreMax = Math.max(...Object.values(examples).flatMap(({ tokens }) =>
    tokens.map(([, key]) => scaledScore(key))));
  let sentence = "river";
  let phase = "score";

  function scaledScore(key) {
    return query.reduce((sum, value, i) => sum + value * key[i], 0) / Math.sqrt(query.length);
  }

  function show() {
    const { text, tokens } = examples[sentence];
    const mark = document.createElement("mark");
    mark.textContent = "bank";
    byId("sentence").replaceChildren(text, mark, ".");
    const scores = tokens.map(([word, key, value]) => ({ word, score: scaledScore(key), value }));
    const denominator = scores.reduce((sum, { score }) => sum + Math.exp(score), 0);
    const weighted = [0, 0];
    const rows = scores.sort((a, b) => b.score - a.score).map(({ word, score, value }) => {
      const share = Math.exp(score) / denominator;
      value.forEach((coordinate, i) => { weighted[i] += share * coordinate; });
      const row = document.createElement("div");
      row.className = "attention-row";
      const token = document.createElement("span");
      token.textContent = word;
      if (phase === "mix") {
        const details = document.createElement("small");
        details.className = "token-value";
        details.textContent = "(" + value.join(", ") + ")";
        token.append(details);
      }
      const track = document.createElement("div");
      track.className = "bar-track";
      track.setAttribute("aria-hidden", "true");
      const bar = document.createElement("b");
      bar.style.width = (phase === "score" ? 100 * score / scoreMax : 100 * share) + "%";
      track.append(bar);
      const number = document.createElement("small");
      number.textContent = phase === "score" ? score.toFixed(2) : (100 * share).toFixed(1) + "%";
      row.append(token, track, number);
      return row;
    });
    byId("attention-instruction").textContent = instructions[phase];
    byId("attention-bars").replaceChildren(...rows);
    byId("attention-mix").hidden = phase !== "mix";
    const [finance, water] = weighted;
    byId("mix-coordinates").value = "(" + finance.toFixed(2) + " finance, " + water.toFixed(2) + " water)";
    const map = document.querySelector(".mix-map");
    map.style.setProperty("--mix-finance", (finance / 5 * 100) + "%");
    map.style.setProperty("--mix-water", (water / 5 * 100) + "%");
    sentenceButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.sentence === sentence)));
    phaseButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.attentionPhase === phase)));
  }
  sentenceButtons.forEach((button) => button.addEventListener("click", () => {
    sentence = button.dataset.sentence;
    show();
  }));
  phaseButtons.forEach((button) => button.addEventListener("click", () => {
    phase = button.dataset.attentionPhase;
    show();
  }));
  show();
}

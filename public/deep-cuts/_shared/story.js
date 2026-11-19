"use strict";

const contextCanvas = byId("context-plot");
if (contextCanvas) {
  const coverSection = document.querySelector(".hero");
  const contextArt = document.querySelector(".context-art");
  const contextTag = byId("context-tag");
  const caption = byId("context-caption");
  const links = [...document.querySelectorAll("[data-scene-link]")];
  const steps = [...document.querySelectorAll("[data-context]")];
  const scenes = {
    river: { tag: "At the river", caption: "Here, the surrounding words point to a river’s edge." },
    account: { tag: "At the bank", caption: "The same word now points to an institution." },
    map: { tag: "", caption: "Two possible meanings, shown as points on an illustrative word map." }
  };
  let current = "river";
  let opacity = { river: 1, account: 0, map: 0 };
  let animation = 0;

  function drawRiver(ctx) {
    const river = ctx.createLinearGradient(0, 0, 680, 442);
    river.addColorStop(0, "#17a4c6");
    river.addColorStop(.52, "#4855b8");
    river.addColorStop(1, "#552c85");
    function shoreline(offset, endAtBottom) {
      ctx.beginPath();
      for (let x = -80; x <= 760; x += 5) {
        const y = 290 + Math.sin(x / 124 + .5) * 77 + Math.sin(x / 233 + 2.4) * 83 + offset;
        if (x === -80) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      if (endAtBottom) {
        ctx.lineTo(760, 442);
        ctx.lineTo(-80, 442);
        ctx.closePath();
      }
    }
    shoreline(-6, true);
    ctx.fillStyle = river;
    ctx.fill();
    for (let i = -7; i <= 13; i++) {
      shoreline(i * 15, false);
      ctx.strokeStyle = i === 0 ? "#e1f9ffdc" : i < 0 ? "#a49bef55" : "#b9e9ff55";
      ctx.lineWidth = i === 0 ? 2.4 : 1;
      ctx.stroke();
    }
    line(ctx, [155, 344], [194, 282], "#e3e7ffb0");
    dot(ctx, 194, 282, 3.2, "#f3e9fc");
    label(ctx, "SHORELINE", 144, 360, "#f0eafe", "right", 13);
  }

  function drawAccount(ctx) {
    const inset = 45;
    for (let y = 62; y < 390; y += 27) {
      line(ctx, [inset, y], [680 - inset, y], "#fdb39146");
    }
    for (let x = 165; x < 635; x += 112) {
      line(ctx, [x, 54], [x, 386], "#fdb39172");
    }
    label(ctx, "ACCOUNT LEDGER", 51, 43, "#ffd7b8", "left", 15);
    label(ctx, "BALANCE", 625, 43, "#ffd7b8", "right", 14);
    const values = ["+24.00", "−16.50", "+48.50", "+12.00", "−32.00"];
    values.forEach((amount, index) => label(ctx, amount, 620, 82 + index * 62, "#ffb38ddc", "right", 16));
    ctx.fillStyle = "#c8605168";
    ctx.fillRect(45, 359, 590, 27);
    label(ctx, "ILLUSTRATIVE TRANSACTIONS", 57, 378, "#ffe0ca", "left", 13);
  }

  function drawMap(ctx) {
    const left = 83;
    const bottom = 362;
    const right = 612;
    const top = 53;
    const position = (finance, water) => [left + (right - left) * finance / 5, bottom - (bottom - top) * water / 5];
    for (let i = 0; i <= 5; i++) {
      line(ctx, position(i, 0), position(i, 5), "#a9a3ed45");
      line(ctx, position(0, i), position(5, i), "#a9a3ed45");
    }
    arrow(ctx, [left, bottom], [right + 12, bottom], "#c1b9f6", 1.5);
    arrow(ctx, [left, bottom], [left, top - 12], "#c1b9f6", 1.5);
    label(ctx, "WATER", left, top - 18, "#dcd7ff", "left", 18);
    label(ctx, "FINANCE", right + 9, bottom + 33, "#dcd7ff", "right", 18);
    for (const [name, finance, water, color] of [
      ["bank (river)", 2, 3.5, "#a4e6fa"],
      ["bank (account)", 4, 1.5, "#ffae8d"]
    ]) {
      const [x, y] = position(finance, water);
      arrow(ctx, [left, bottom], [x, y], color, 2.5);
      dot(ctx, x, y, 5.5, color);
      label(ctx, name, x - 10, y - 14, color, "center", 22);
    }
  }

  const draw = { river: drawRiver, account: drawAccount, map: drawMap };
  const render = responsiveCanvas(contextCanvas, .65, (ctx, width, height) => {
    ctx.save();
    ctx.scale(width / 680, height / 442);
    const base = ctx.createRadialGradient(425, 205, 30, 340, 220, 410);
    base.addColorStop(0, "#393475");
    base.addColorStop(1, "#171733");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 680, 442);
    for (const name of Object.keys(draw)) {
      if (opacity[name] <= 0) continue;
      ctx.globalAlpha = opacity[name];
      draw[name](ctx);
    }
    ctx.restore();
  });

  caption.textContent = scenes.river.caption;
  function select(name) {
    if (name === current) return;
    current = name;
    contextArt.dataset.scene = name;
    contextTag.textContent = scenes[name].tag;
    caption.textContent = scenes[name].caption;
    links.forEach((link) => {
      if (link.dataset.sceneLink === name) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
    cancelAnimationFrame(animation);
    const previous = { ...opacity };
    const start = performance.now();
    function frame(now) {
      const t = motion.matches ? 1 : Math.min(1, (now - start) / 380);
      const blend = 1 - (1 - t) ** 3;
      Object.keys(opacity).forEach((scene) => {
        opacity[scene] = previous[scene] + (Number(scene === name) - previous[scene]) * blend;
      });
      render();
      if (t < 1) animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
  }

  let pending = 0;
  function update() {
    pending = 0;
    const coverBounds = coverSection.getBoundingClientRect();
    if (!motion.matches && coverBounds.bottom > 0) {
      const travel = Math.max(0, Math.min(1, -coverBounds.top / coverBounds.height));
      coverSection.style.setProperty("--cover-travel", travel.toFixed(3));
    }
    let scene = "river";
    steps.forEach((step) => {
      if (step.getBoundingClientRect().top <= innerHeight * .65) scene = step.dataset.context;
    });
    select(scene);
  }
  function schedule() {
    if (!pending) pending = requestAnimationFrame(update);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  update();
}

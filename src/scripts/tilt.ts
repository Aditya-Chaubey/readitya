/**
 * Gentle 3D tilt that follows the pointer.
 * Add `data-tilt` (optionally `data-tilt="12"` for max degrees) to any element.
 * Sets --rx / --ry (rotation) and --gx / --gy (glare position, %) on the element.
 */
export function tilt(root: ParentNode = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  for (const el of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
    if (el.dataset.tiltReady) continue;
    el.dataset.tiltReady = '1';
    const max = Number(el.dataset.tilt) || 7;
    let frame = 0;

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.classList.add('tilting');
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      el.classList.remove('tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }
}

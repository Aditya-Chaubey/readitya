const progressBar = document.querySelector('.reading-progress span');
const chapterLinks = [...document.querySelectorAll('.contents a')];
const chapters = chapterLinks.map((link) => document.querySelector(link.hash));
let frame = 0;

function updateReadingPosition() {
  frame = 0;
  const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
  progressBar.style.transform = `scaleX(${progress})`;

  const readingLine = Math.min(window.innerHeight / 3, 220);
  const active = chapters.findLastIndex((chapter) => chapter.getBoundingClientRect().top <= readingLine);
  chapterLinks.forEach((link, index) => {
    if (index === active) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function scheduleReadingUpdate() {
  if (!frame) frame = requestAnimationFrame(updateReadingPosition);
}

window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
window.addEventListener('resize', scheduleReadingUpdate);
new ResizeObserver(scheduleReadingUpdate).observe(document.body);
scheduleReadingUpdate();

const tasks = [...document.querySelectorAll('.planner input')];
const count = document.querySelector('#plan-count');
const reset = document.querySelector('#plan-reset');
const note = document.querySelector('#plan-note');
const storageKey = 'lrn.healthy-masculinity.plan.v1';

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) {
    tasks.forEach((task) => { task.checked = saved.includes(task.id); });
  }
} catch {
  note.textContent = 'Progress is available during this visit.';
}

function updatePlan(save) {
  const completed = tasks.filter((task) => task.checked).map((task) => task.id);
  count.textContent = `${completed.length} of ${tasks.length} complete`;
  if (save) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completed));
      note.textContent = 'Progress is saved on this device.';
    } catch {
      note.textContent = 'Progress is available during this visit.';
    }
  }
}

tasks.forEach((task) => task.addEventListener('change', () => updatePlan(true)));
reset.addEventListener('click', () => {
  tasks.forEach((task) => { task.checked = false; });
  updatePlan(true);
});
updatePlan(false);
count.hidden = false;
document.querySelector('.plan-actions').hidden = false;

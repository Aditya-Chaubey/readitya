/* =========================================================
   projects.js — file-explorer style project browser
   Click a file (or use ↑/↓ + ⏎) to load its detail panel.
   Edit the PROJECTS array to drop in real work later.
   ========================================================= */

const PROJECTS = [
  {
    name: 'hanok_notes', ext: '.app', size: '7.6kb',
    title: 'Hanok — Notes', role: 'Design + Build',
    year: '2026', type: 'Notes App / PWA', status: 'Live', client: 'Self',
    desc: 'A quiet, local-first notes app with Korean-gallery minimalism at its core — Notion-style rich editing, Obsidian-style backlinks, and an optional local-folder mode that stores notes as real, Obsidian-compatible Markdown files. Installable as a PWA; works fully offline.',
    stack: ['React', 'TipTap', 'IndexedDB', 'PWA'],
    link: 'hanok/',
  },
  {
    name: 'project_alpha', ext: '.proj', size: '4.2kb',
    title: 'Project Alpha', role: 'Design + Build',
    year: '2025', type: 'Web Platform', status: 'Live', client: 'Placeholder Co.',
    desc: 'Placeholder description. A short summary of the problem, the approach taken, and the outcome of the work. Replace this with a real case study when ready — two or three sentences works best here.',
    stack: ['TypeScript', 'WebGL', 'Node', 'Design Systems'],
  },
  {
    name: 'project_beta', ext: '.proj', size: '3.8kb',
    title: 'Project Beta', role: 'Creative Engineering',
    year: '2024', type: 'Interactive', status: 'Archived', client: 'Placeholder Labs',
    desc: 'Placeholder description. Describe the concept and what made the execution interesting. Keep it concise and focused on impact and craft.',
    stack: ['Three.js', 'GLSL', 'GSAP', 'Vite'],
  },
  {
    name: 'project_gamma', ext: '.proj', size: '5.1kb',
    title: 'Project Gamma', role: 'Full-Stack',
    year: '2024', type: 'Product', status: 'Live', client: 'Internal',
    desc: 'Placeholder description. Outline the product, the audience, and the role played end-to-end. A line about results or scale fits nicely here.',
    stack: ['React', 'Postgres', 'tRPC', 'AWS'],
  },
  {
    name: 'project_delta', ext: '.proj', size: '2.9kb',
    title: 'Project Delta', role: 'Brand + Motion',
    year: '2023', type: 'Identity', status: 'Shipped', client: 'Placeholder Studio',
    desc: 'Placeholder description. A few words on the visual language, motion principles, and how the system holds together across surfaces.',
    stack: ['After Effects', 'Figma', 'Lottie'],
  },
  {
    name: 'project_epsilon', ext: '.proj', size: '6.0kb',
    title: 'Project Epsilon', role: 'R&D / Prototype',
    year: '2023', type: 'Experiment', status: 'Open Source', client: 'Self',
    desc: 'Placeholder description. An exploratory build — note the hypothesis, what was learned, and where it could go next.',
    stack: ['Rust', 'WASM', 'Canvas'],
  },
];

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('file-list');
  const detail = document.getElementById('detail');
  let active = 0;

  // build list
  PROJECTS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'file';
    btn.dataset.i = i;
    btn.innerHTML = `
      <span class="fi">▸</span>
      <span class="fname">${p.name}<span class="ext">${p.ext}</span></span>
      <span class="fsize">${p.size}</span>`;
    btn.addEventListener('click', () => select(i));
    list.appendChild(btn);
  });

  function render(p, i) {
    detail.innerHTML = `
      <div class="detail swap">
        <div class="detail__index">[ ${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')} ] — ${p.name}${p.ext}</div>
        <h2 class="detail__title">${p.title}</h2>
        <div class="detail__role">${p.role}</div>
        <p class="detail__desc">${p.desc}</p>
        <div class="detail__meta">
          <div class="m"><div class="mk">Year</div><div class="mv">${p.year}</div></div>
          <div class="m"><div class="mk">Type</div><div class="mv">${p.type}</div></div>
          <div class="m"><div class="mk">Status</div><div class="mv" style="color:var(--accent)">${p.status}</div></div>
          <div class="m"><div class="mk">Client</div><div class="mv">${p.client}</div></div>
        </div>
        <div class="detail__stack">${p.stack.map(s => `<span>${s}</span>`).join('')}</div>
        <a class="btn" href="${p.link || '#'}" ${p.link ? 'target="_blank" rel="noopener"' : 'onclick="return false;"'}>view case study <span class="arr">→</span></a>
      </div>`;
  }

  function select(i) {
    active = i;
    list.querySelectorAll('.file').forEach((f, idx) => {
      f.classList.toggle('is-active', idx === i);
      f.querySelector('.fi').textContent = idx === i ? '▾' : '▸';
    });
    render(PROJECTS[i], i);
  }

  // keyboard nav
  document.addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault(); select((active + 1) % PROJECTS.length);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault(); select((active - 1 + PROJECTS.length) % PROJECTS.length);
    }
  });

  select(0);
});

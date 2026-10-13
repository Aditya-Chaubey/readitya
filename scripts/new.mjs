#!/usr/bin/env node
/**
 * Scaffold new content.
 *
 *   npm run new post "My Post Title"   → src/content/writings/my-post-title.md
 *   npm run new tidbit                 → src/content/tidbits/2026-10-13-0930.md
 *   npm run new tidbit "Optional title"
 *   npm run new project "My Project"    → src/content/projects/my-project.md
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [kind, ...rest] = process.argv.slice(2);
const title = rest.join(' ').trim();

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const offsetMin = -now.getTimezoneOffset();
const tz = `${offsetMin >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offsetMin) / 60))}:${pad(Math.abs(offsetMin) % 60)}`;
const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

function write(file, body) {
  if (existsSync(file)) {
    console.error(`✗ ${file} already exists — pick another title.`);
    process.exit(1);
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
  console.log(`✓ Created ${file.replace(root, '.').replaceAll('\\', '/')}`);
}

if (kind === 'post' || kind === 'writing') {
  if (!title) {
    console.error('Usage: npm run new post "My Post Title"');
    process.exit(1);
  }
  const file = join(root, 'src/content/writings', `${slugify(title)}.md`);
  write(
    file,
    `---
title: ${JSON.stringify(title)}
description: ""
date: ${day}
type: Essay
tags: []
draft: true   # set to false (or delete this line) to publish
---

Start writing here.
`,
  );
} else if (kind === 'project') {
  if (!title) {
    console.error('Usage: npm run new project "My Project"');
    process.exit(1);
  }
  const file = join(root, 'src/content/projects', `${slugify(title)}.md`);
  write(
    file,
    `---
title: ${JSON.stringify(title)}
summary: ""
status: In progress     # In progress · Shipped · Paused · Idea · Archived
started: ${day}
stack: []
links: []   # e.g. [{ label: Source, url: "https://github.com/you/project" }]
draft: true
---

What is it, why does it exist, how is it going?
`,
  );
} else if (kind === 'tidbit' || kind === 'micro') {
  const file = join(root, 'src/content/tidbits', `${day}-${time.replace(':', '')}.md`);
  write(
    file,
    `---
date: ${day}T${time}:00${tz}
${title ? `title: ${JSON.stringify(title)}\n` : ''}tags: []
---

`,
  );
} else {
  console.log(`Usage:
  npm run new post "My Post Title"
  npm run new tidbit ["Optional title"]
  npm run new project "My Project"`);
}

# How to use your website

A quick, simple guide. Everything you write is a plain text file — no logins, no dashboards.

---

## 1. Start the website on your computer

Open a terminal in this folder (`C:\Folders\Claude\mysite`) and run:

```
npm run dev
```

Open **http://localhost:4321** in your browser. Leave the terminal open — the site updates by itself every time you save a file. Press `Ctrl + C` to stop it.

> First time on a new computer? Run `npm install` once before anything else.

---

## 2. Write something

Every command below creates a new file for you. Open that file, write, save. That's it.

### A blog post (Writings)

```
npm run new post "My Post Title"
```

Creates `src/content/writings/my-post-title.md`. It looks like this:

```
---
title: "My Post Title"
description: "One line about the post."
date: 2026-10-13
type: Essay
tags: [life, ideas]
draft: true
---

Write your post here.
```

- The part between the `---` lines is the post's info. Fill in `description` and `tags`.
- Write the post below it.
- **`draft: true` means only you can see it.** Change it to `draft: false` when it's ready to publish.

### A short note (Tidbits)

```
npm run new tidbit
```

Creates a file named with today's date and time. Just write a few lines under the `---` and save. Tidbits publish right away (no draft step).

### A project

```
npm run new project "My Project"
```

Fill in `summary` (one or two sentences for the card) and `status` (`In progress`, `Shipped`, `Paused` or `Idea`). Add links like this:

```
links: [{ label: Source, url: "https://github.com/you/project" }]
```

Write about the project below the `---`. Change `draft: true` to `draft: false` to publish.

### Something you read, watched or listened to (Library)

Open the right file in `src/content/library/` — `books.yaml`, `movies.yaml`, `tv-shows.yaml`, `music.yaml`, `anime.yaml` or `manga.yaml` — and add an entry under `items:` by copying this:

```
  - title: The Name of the Thing
    creator: Who made it
    year: 2020
    rating: 4.5
    notes: What you thought, in a line or two (optional).
    cover: /images/covers/the-thing.jpg
    logs:
      - { date: 2026-10-01, status: Finished }
```

- `rating` is 0–5 (halves allowed). Delete the line if you don't want to rate it.
- `cover` is the item's image: put a file in `public/images/covers/` and write its path, or paste a full image URL. Leave it out and a cover is generated from the title in the shelf's colour.
- `notes` is optional. For more than one line, write `notes: |` and put the text on the lines below, indented — a blank line starts a new paragraph.
- Keep the spaces at the start of each line exactly as shown — they matter.
- **New category?** Copy any of those files, rename it (e.g. `games.yaml`), and change its `title`. A new tape appears in the tower.

---

## 3. Formatting your writing

Posts are written in **Markdown** — plain text with a few symbols:

| You type                    | You get                     |
| --------------------------- | --------------------------- |
| `## A heading`              | A section heading           |
| `**bold**` / `*italic*`     | **bold** / *italic*         |
| `[link text](https://...)`  | A link                      |
| `- item`                    | A bullet list               |
| `> quote`                   | A quote                     |
| `---`                       | A decorative section break  |
| `A fact.[^1]` + `[^1]: Note` | A footnote                 |
| `![description](/images/photo.jpg)` | An image            |

**Images:** put the image file in `public/images/`, then use `![description](/images/your-file.jpg)` in your post.

---

## 4. Make it yours

- **Your name, tagline, social links:** `src/site.config.ts`
- **About page:** `src/content/about.md`
- **Your photo:** put it at `public/images/me.jpg`, then in `about.md` change `# photo: /images/me.jpg` to `photo: /images/me.jpg`
- **Remove the examples:** delete the placeholder files in `src/content/` once you've written your own.

---

## 5. Put it online

1. Upload this folder to a GitHub repository.
2. Sign up at **Netlify**, **Vercel** or **Cloudflare Pages** (all free) and import that repository.
3. When asked: build command **`npm run build`**, output folder **`dist`**.
4. In `astro.config.mjs`, change `site: 'https://example.com'` to your real address.

After that, publishing is just: write → save → push to GitHub. The site rebuilds itself in about a minute.

---

## Quick reference

| I want to…            | Do this                               |
| --------------------- | ------------------------------------- |
| See the site          | `npm run dev` → http://localhost:4321 |
| Write a post          | `npm run new post "Title"`            |
| Write a short note    | `npm run new tidbit`                  |
| Add a project         | `npm run new project "Name"`          |
| Log a book/movie/etc. | Edit a file in `src/content/library/` |
| Publish a draft       | Change `draft: true` → `draft: false` |

**Something broke?** The terminal running `npm run dev` usually says which file and line has the problem — most often a missing `---` or a typo in the info section at the top of a file.

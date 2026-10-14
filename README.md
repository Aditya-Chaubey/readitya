# My corner of the internet

A personal site — **retro cassettes × an old book**. Built with [Astro](https://astro.build): every page is static HTML, all content is plain Markdown/YAML files, and there is no database or CMS to babysit.

```
/            → the cassette deck (pick a tape, press play)
/about       → About me
/projects    → things I'm building (generated retro cover art if no image)
/writings    → long-form posts, grouped by year
/tidbits     → short-form notes (paginated, each with a permalink)
/library     → shelves of books, movies, shows, music, anime, manga…
/rss.xml     → feed for writings      /tidbits/rss.xml → feed for tidbits
```

## Running it

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install        # once
npm run dev        # live preview at http://localhost:4321
npm run build      # produces the finished site in ./dist
npm run preview    # serve ./dist locally to double-check a build
```

## Make it yours (5 minutes)

1. **`src/site.config.ts`**: your name, tagline, timezone, social links, and the tapes on the home page (label, link and colours). Each nav entry also sets that section's colour (the big spine down the side of its pages, links and highlights).
2. **`astro.config.mjs`**: set `site:` to your real domain (feeds and the sitemap use it). Also update the domain in `public/robots.txt`.
3. **`src/content/about.md`**: your About page. To use a photo, put it at `public/images/me.jpg` and uncomment the `photo:` line.
4. Delete the placeholder post, tidbit and library entries when you're ready.

## Writing

### A long-form post

```bash
npm run new post "Why I Still Love Cassettes"
```

That creates `src/content/writings/why-i-still-love-cassettes.md`:

```md
---
title: "Why I Still Love Cassettes"
description: "One line that appears under the title and in the list."
date: 2026-10-13
type: Essay          # the little stamp above the title: Essay, Note, Review…
tags: [music, nostalgia]
draft: true          # drafts show in `npm run dev` but are left out of the build
# updated: 2026-11-01  # optional "Revised" date
# toc: false           # hide the Contents box
---

Your words here, in Markdown.
```

The filename becomes the URL: `/writings/why-i-still-love-cassettes/`. Everything Markdown supports works, including footnotes (`[^1]`), tables, code blocks, quotes, and `---` for a section-break ornament. Put images in `public/images/` and reference them as `/images/name.jpg`. For a captioned image, use the `<figure>` snippet from the placeholder post. Rename a file to `.mdx` if you want to use components inside it.

### A tidbit

```bash
npm run new tidbit                    # untitled
npm run new tidbit "Optional title"
```

This creates `src/content/tidbits/2026-10-13-0930.md` with the current date and time filled in. Write a line or a few paragraphs underneath.

### A project

```bash
npm run new project "Tape Deck Synth"
```

Creates `src/content/projects/tape-deck-synth.md`. The frontmatter holds the card details — `summary`, `status` (*In progress*, *Shipped*, *Paused*, *Idea*… each gets its own stamp colour), `started`/`ended`, `stack`, `links` — and the body is the project write-up. Without a `cover:` image, each project gets its own generated retro artwork (pick its tint with `color:`). Use `order:` to pin projects to the top.

### The library

Each shelf is one YAML file in `src/content/library/`. To log something, copy an item block:

```yaml
items:
  - title: The Left Hand of Darkness
    creator: Ursula K. Le Guin
    year: 1969
    rating: 4.5               # 0–5 in halves; delete the line if unrated
    notes: |
      Optional. A sentence or a full review.
    logs:
      - { date: 2026-09-01, end: 2026-09-14, status: Read }
      - { date: 2024, status: Did not finish }
    # cover: /images/covers/left-hand.jpg
    # link: https://…
```

**Add a new shelf** (games, podcasts, papers…) by copying any shelf file, e.g. `games.yaml`, and changing `title`, `creatorLabel`, `verb`, `order` and `color`. It appears as a new tape in the cassette tower automatically.

## Publishing to the world

Put the folder in a GitHub repository, then connect it to any static host. They all rebuild automatically every time you push a new post.

| Host | Settings |
| --- | --- |
| **Netlify** / **Vercel** / **Cloudflare Pages** | Import the repo. Build command `npm run build`, output directory `dist`. |
| **GitHub Pages** | Follow Astro's guide: <https://docs.astro.build/en/guides/deploy/github/> |

Then point your domain at it and update `site:` in `astro.config.mjs`.

## Where things live

```
src/
  site.config.ts        ← name, links, tapes
  content/              ← ALL your content
    about.md
    writings/*.md
    tidbits/*.md
    projects/*.md
    library/*.yaml
  pages/                ← routes (index = the cassette deck)
  components/           ← Cassette, Deck, Header, Footer, Rating…
  layouts/              ← Base (html shell) & Page (the "book page")
  styles/global.css     ← colours, fonts, typography (light & dark)
public/                 ← images, favicon, robots.txt
scripts/new.mjs         ← the `npm run new` helper
```

**Sounds**: the deck's mechanical clicks are synthesised in the browser (no audio files) and can be switched off with the little *Click* switch on the deck.

**Colours** are defined once at the top of `src/styles/global.css`: `:root` holds the light "paper" theme and `[data-theme='dark']` the "lamplight" theme.

---
title: "Remarkd."
summary: "A Markdown notes app for Windows, inspired by Obsidian. It writes in place, keeps your notes as plain files, and maps how they connect."
status: Shipped     # In progress · Shipped · Paused · Idea · Archived
started: 2026-10-13
ended: 2026-10-16
stack: [Electron, React, TypeScript, CodeMirror 6, unified / remark, KaTeX, Mermaid, ChatGPT, Codex]
links: [{ label: "Download for Windows", url: "#download-setup" }, { label: "Portable .exe", url: "#download-portable" }]   # TODO: swap the #download-… placeholders (here and in Download below) for the Drive links
cover: /images/projects/remarkd/cover.webp
draft: false
---

**Remarkd.** is a desktop notes app for writing in Markdown. It was inspired by Obsidian, but you don't need a vault. Remarkd opens ordinary `.md`, `.markdown` and `.txt` files and folders wherever they already are, and it saves them as plain Markdown. Your notes stay readable in any other app.

It understands the Obsidian style of Markdown: `[[wikilinks]]`, note embeds, callouts, tags, task lists, footnotes, tables, frontmatter, KaTeX math and Mermaid diagrams. You can export any note to **Word**, **PDF** or a self-contained **HTML** page.

![The Universe graph: notes as dots, links as lines, with the selected note's connections on the right](/images/projects/remarkd/universe.webp)

## Universe

Universe is an optional map of your notes. Add single files or whole folders and Remarkd draws the connections between them, from wikilinks, ordinary links and embeds. Notes without links still appear. Click a dot to see what links to it and what it links to, double-click to open it, and drag, pan and zoom around the map. Adding notes to Universe never moves or changes your files.

![Universe in dark mode](/images/projects/remarkd/universe-dark.webp)

## Writing

There are three views. **Edit** shows the raw Markdown. **Live**, the default, shows formatting as you type and reveals the Markdown only on the line you're editing. **Preview** is for reading. The Format menu lets you click or drag in headings, lists, tables and images. You can type straight into table cells, resize tables and images by dragging their edges, and move blocks up and down.

![The Format menu, open beside a note](/images/projects/remarkd/format.webp)

![Editing a table and resizing images in Live view](/images/projects/remarkd/tables.webp)

Switch to **Page** view to see your note on A4 or Letter paper at the same size it will export.

![Page view, showing a note on A4 paper](/images/projects/remarkd/page.webp)

## Nine designs

Under **Preferences → Theme**, you can choose Readitya (based on this site) or one of eight other designs: Okinawa Blues, Korean Minimal Gallery, Cyberpunk Green, Neo Persona, Zen Olive, Monochrome Editorial, Tokyo Vermillion and Swiss International. Each one has light and dark versions, its own fonts, and styles the whole app, not just the text.

![The theme picker in Preferences](/images/projects/remarkd/themes.webp)

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin:1.5rem 0">
  <img src="/images/projects/remarkd/okinawa.webp" alt="Okinawa Blues design, Live view" loading="lazy" style="margin:0" />
  <img src="/images/projects/remarkd/tokyo.webp" alt="Tokyo Vermillion design, Preview" loading="lazy" style="margin:0" />
  <img src="/images/projects/remarkd/cyberpunk.webp" alt="Cyberpunk Green design, Live view" loading="lazy" style="margin:0" />
  <img src="/images/projects/remarkd/persona.webp" alt="Neo Persona design, Live view" loading="lazy" style="margin:0" />
</div>

## How I made it

I developed Remarkd with **ChatGPT** and **Codex**. It started with research. I took apart the Obsidian app on my machine to learn exactly how it reads Markdown (wikilinks, embeds, callouts and so on), read Notion's documentation, and compared about a dozen other Markdown editors. ChatGPT helped me work out what the app should do and how to build it. Codex built it in parallel streams: the Markdown parser, the editor, the interface, file handling and export.

Then I improved it over nine versions, from 0.1 to 0.9. Each version added one thing, such as safe file saving, Word/PDF/HTML export, the Format menu, resizable tables and images, the nine designs, and finally Universe. Each one was checked with automated tests that click through the real desktop app.

## Download

<p><a class="btn" href="#download-setup">Download Remarkd for Windows (124 MB)</a></p>

The installer sets Remarkd up for your user account, with no admin rights needed, and lets you open `.md` files with it. If you'd rather not install anything, the [portable .exe](#download-portable) runs on its own. The app isn't code-signed yet, so Windows SmartScreen may show an "unknown publisher" warning the first time you open it.

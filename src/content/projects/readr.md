---
title: "Readr."
summary: "A reading app like Apple Books that runs on Windows, opens EPUB and PDF, and adds designer reading styles that Books doesn't have."
status: Shipped     # In progress · Shipped · Paused · Idea · Archived
started: 2026-10-16
ended: 2026-10-18
stack: [C#, WebView2, JavaScript, pdf.js, Ghidra, Mimo v2.6, Hermes Agent, Claude Opus 5.5, Claude Code]
links: [{ label: "Download for Windows", url: "/downloads/readr-setup.exe" }, { label: "Portable .zip", url: "/downloads/readr-portable.zip" }]
cover: /images/projects/readr/cover.webp
draft: false
---

**Readr.** is a desktop reading app that copies how Apple Books looks and works, but it runs on Windows. You get a library for your books and a reader with page turns, themes, highlights, bookmarks and search.

It opens **EPUB** books (reflowable and fixed-layout) and **PDF** files. To add a book, drag it in, use *Ctrl+O*, or double-click it in File Explorer.

The installer is about 2 MB. It uses the .NET Framework and the WebView2 runtime, which already come with Windows 10 and 11.

![The Readr library: continue reading, recently added, and shelves for books and PDFs](/images/projects/readr/library.webp)

## Apple Books, on Windows

The reader matches Books closely. It uses the same six themes with Apple's exact colours, the same font presets, margin math and text-size steps, and the same slide and page-curl page turns. Pages turn with the keyboard, a click, a trackpad swipe, or by dragging the paper.

![The stock Apple Books "Paper" look, two pages side by side](/images/projects/readr/paper.webp)

## More design options

Books has no designer reading styles; Readr adds them. Each **Style** restyles the whole page: colours, fonts, chapter headings, ornaments, paper texture and the reader's controls. There are seven: Readitya, Okinawa Blue, Zen Olive, Korean Minimal Gallery, Cyberpunk Green, Neo Persona and Tokyo Vermillion.

![The Styles picker, open over a book](/images/projects/readr/styles-picker.webp)

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin:1.5rem 0">
  <img src="/images/projects/readr/cyber.webp" alt="Cyberpunk Green style" loading="lazy" style="margin:0" />
  <img src="/images/projects/readr/persona.webp" alt="Neo Persona style" loading="lazy" style="margin:0" />
  <img src="/images/projects/readr/tokyo.webp" alt="Tokyo Vermillion style" loading="lazy" style="margin:0" />
  <img src="/images/projects/readr/okinawa.webp" alt="Okinawa Blue style" loading="lazy" style="margin:0" />
</div>

![Zen Olive style](/images/projects/readr/zen.webp)

## How I made it

**1. Reverse engineering.** I used **Mimo v2.6** on **Hermes Agent** to take apart Apple Books for Mac. It decompiled the app's frameworks and pulled out their stylesheets, theme colours, font presets, layout values and data schemas, and it wrote everything up as a spec covering the library, EPUB parsing, pagination, page turns, typography, themes and annotations.

**2. Rebuilding.** I gave that spec to **Claude Opus 5.5** in **Claude Code** and rebuilt the app for Windows. Readr keeps Books' architecture: a small native C# shell with the reader rendered by a web engine. Books uses WebKit; Readr uses the WebView2 engine built into Windows. Books' EPUB parser, pagination cache, page-curl controller and PDFKit reader each became a JavaScript module, with pdf.js handling PDFs.

## Download

<p><a class="btn" href="/downloads/readr-setup.exe" download>Download Readr for Windows (2.2 MB)</a></p>

The installer doesn't need admin rights. It adds Readr to the Start menu, with an optional desktop shortcut, and you can uninstall it from *Installed apps*. Running it again upgrades in place and keeps your library. If you'd rather not install anything, use the [portable .zip](/downloads/readr-portable.zip).

Apple's fonts are used if you have them installed. If not, Readr uses free stand-ins it ships with: Source Serif, EB Garamond, Charis SIL, Source Sans and Nunito Sans.

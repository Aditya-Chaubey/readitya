---
title: The First Page
description: A placeholder essay that shows off everything a post can do — headings, footnotes, quotes, figures and code.
date: 2026-10-13
type: Essay
tags: [meta, placeholder]
---

Every book begins with a blank page, and this one is no different. This is a placeholder essay; replace it with your own words. It exists to show how a post looks once it is set in type — the drop cap above, the small capitals of the first line, the rhythm of the paragraphs that follow. Write in plain Markdown and the site takes care of the rest.

A second paragraph, for good measure. Notice how text is justified and hyphenated, the way it would be in a printed book, and how links like [this one](https://example.com) are quietly underlined in ink.[^1]

## A section heading

Use `##` for sections and `###` for sub-sections. They show up in the *Contents* box at the top automatically. Lists work as you'd expect:

- Bullets are printed with a little fleuron.
- Numbered lists use plain numerals.
- **Bold**, *italic*, `inline code` and ~~strikethrough~~ all work.

> A blockquote looks like this — set in italics with a rule of red ink down its side. Good for quoting other people, or yourself.

### A sub-section

Images go in `public/images/` and can be wrapped in a figure to get a caption:

<figure>
  <img src="/images/placeholder.svg" alt="A placeholder illustration of a cassette tape on a desk" width="1200" height="675" />
  <figcaption>A caption, set small and in italics beneath the figure.</figcaption>
</figure>

## Code, tables & the rest

```js
// code blocks are syntax highlighted, and switch with the theme
function greet(name) {
  return `Hello, ${name}!`;
}
```

| Format   | Where it goes          |
| -------- | ---------------------- |
| Essays   | `src/content/writings` |
| Tidbits  | `src/content/tidbits`  |
| Library  | `src/content/library`  |

---

And a closing thought after a section break — the `---` above becomes a little ornament.[^2]

[^1]: Footnotes are written like `[^1]` in the text, and collected at the end of the post automatically.
[^2]: Each one gets a link back to where it came from.

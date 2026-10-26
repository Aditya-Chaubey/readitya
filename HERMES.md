# HERMES.md — adding an AI Daily article

How to add an article to the **AI Daily** section (`/ai`) and how each element is formatted.

Pushing to `main` deploys the whole site. **A broken file stops every page from deploying**, so always run the build check in step 4.

---

## 1. Create the file

Path: `src/content/ai/<YYYY-MM-DD>-<slug>.md`, date in **IST (Asia/Kolkata)**.
Slug: lowercase, hyphens, ASCII only, ≤ 60 chars.

Example: `src/content/ai/2026-10-27-what-is-an-embedding.md`

Or run `npm run new ai "What Is an Embedding?"` to generate the file with an empty frontmatter.

## 2. Frontmatter

The file must start with this block. Any missing required field, wrong type or unknown `level` fails the build.

```yaml
---
title: "What Is an Embedding?"          # required. Page heading. Keep ≤ 60 chars. Always quoted.
tldr: "One or two sentences."           # required. Shown in the "In one breath" box and on the index card. Plain text, no markdown. Always quoted.
date: 2026-10-27T09:00:00+05:30         # required. ISO 8601 with +05:30. Sets the order and day number.
level: Beginner                         # optional. Beginner | Intermediate | Advanced (exact spelling). Default: Beginner.
tags: [llm, basics]                     # optional. Lowercase, no spaces (use hyphens). Become filter buttons on /ai.
sources:                                # optional. Listed under "Further reading".
  - { label: "Link text", url: "https://..." }
drafted_with: [DeepSeek, Gemini]        # optional. Shown as "Drafted with help from DeepSeek & Gemini."
draft: false                            # optional. true = hidden on the live site (still visible in `npm run dev`).
---
```

YAML rules: quote any string containing `:` `#` `"` or starting with a special character, and escape inner double quotes as `\"`. Use spaces, never tabs.

## 3. Body elements

The body goes below the closing `---`. Write it in Markdown.

| Element | Syntax | Notes |
| --- | --- | --- |
| Title | — | **Do not** add a `# H1`; the page prints `title` itself. |
| Section heading | `## Heading` | Main sections. |
| Sub-heading | `### Heading` | Inside a section. |
| Small label heading | `#### Heading` | Rendered small and uppercase. |
| Paragraph | plain text, blank line between paragraphs | |
| Bold / italic | `**bold**` / `*italic*` | |
| Highlight | `<mark>text</mark>` | The only HTML allowed. |
| Inline code | `` `token` `` | For literal text, prompts, commands. |
| Code block | ```` ```python ```` … ```` ``` ```` | Add a language for syntax highlighting. |
| Bullet list | `- item` | |
| Numbered list | `1. item` | |
| Table | GitHub-style pipe table with a `\| --- \|` row | Header row is required. |
| Quote / callout | `> text` | |
| Section break | `---` on its own line, blank lines around it | |
| External link | `[text](https://...)` | |
| Link to another article | `[text](/ai/2026-10-27-what-is-an-embedding/)` | Use the filename without `.md`, with a trailing `/`. |
| Image | `![alt text](/images/ai/file.png)` | Put the file in `public/images/ai/`. Always write alt text. |
| Footnote | `A claim.[^1]` and later `[^1]: The note.` | Collected at the bottom under "Notes". |

Not supported: LaTeX/maths notation (it shows as raw text), raw HTML other than `<mark>`, MDX components, emoji shortcodes like `:smile:`.

## 4. Check, then publish

```bash
git pull --rebase origin main
# create the file
npm run build          # must end with "Complete!" and no errors
git add src/content/ai/<file>.md public/images/ai/   # images only if you added any
git commit -m "AI Daily: <title>"
git push origin main
```

If the build fails and you can't fix it, **do not push**. Set `draft: true` and report the error.
Only add or change files in `src/content/ai/` and `public/images/ai/`.

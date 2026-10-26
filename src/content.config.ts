import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Long-form posts: src/content/writings/<slug>.md (or .mdx) */
const writings = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/writings' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** A label shown above the title, e.g. Essay, Note, Review, Guide. */
    type: z.string().default('Essay'),
    tags: z.array(z.string()).default([]),
    /** Drafts are visible while running `npm run dev`, hidden in the built site. */
    draft: z.boolean().default(false),
    /** Show the "Contents" box (only if the post has 2+ headings). */
    toc: z.boolean().default(true),
  }),
});

/** Short-form posts: src/content/tidbits/<yyyy-mm-dd-hhmm>.md */
const tidbits = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/tidbits' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** AI Daily: src/content/ai/<yyyy-mm-dd>-<slug>.md — one concept explained per day. */
const ai = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/ai' }),
  schema: z.object({
    title: z.string(),
    /** The whole idea in one or two plain sentences. Shown on the card and atop the post. */
    tldr: z.string(),
    date: z.coerce.date(),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
    tags: z.array(z.string()).default([]),
    /** Further reading. */
    sources: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    /** Which models helped draft it, e.g. [DeepSeek, Gemini]. */
    drafted_with: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** A loose date: 2026, "2026-10", 2026-10-13 … */
const looseDate = z.union([z.string(), z.number(), z.date()]);

/** Library shelves: src/content/library/<shelf>.yaml — one file per category. */
const library = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{yaml,yml,json}', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    /** Label for the `creator` field: Author, Director, Artist, Studio… */
    creatorLabel: z.string().default('By'),
    /** Verb used for logs, e.g. "Read", "Watched", "Listened". */
    verb: z.string().default('Consumed'),
    /** Sort order of shelves on the /library page. */
    order: z.number().default(99),
    /** Spine colour on the bookshelf. */
    color: z.string().default('#7a2e22'),
    /** Shape of item images: posters/books are portrait, album art is square. */
    coverShape: z.enum(['portrait', 'square']).default('portrait'),
    items: z
      .array(
        z.object({
          title: z.string(),
          creator: z.string().optional(),
          year: z.union([z.number(), z.string()]).optional(),
          /** 0 – 5, halves allowed (e.g. 3.5) */
          rating: z.number().min(0).max(5).optional(),
          /** A few lines about the item — optional. Blank lines make new paragraphs. */
          notes: z.string().optional(),
          /** Image: a path in /public (e.g. /images/covers/x.jpg) or a full URL.
           *  Without one, a cover is generated from the title. */
          cover: z.string().optional(),
          link: z.string().optional(),
          tags: z.array(z.string()).default([]),
          logs: z
            .array(
              z.object({
                date: looseDate,
                end: looseDate.optional(),
                status: z.string().optional(),
              }),
            )
            .default([]),
        }),
      )
      .nullish()
      .transform((v) => v ?? []),
  }),
});

/** Projects: src/content/projects/<slug>.md */
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences shown on the card. */
    summary: z.string(),
    /** Free text, e.g. "In progress", "Shipped", "Paused", "Idea", "Archived". */
    status: z.string().default('In progress'),
    started: z.coerce.date(),
    ended: z.coerce.date().optional(),
    /** Tools / tech / materials. */
    stack: z.array(z.string()).default([]),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    /** Accent colour for the generated cover art. */
    color: z.string().optional(),
    /** Path to an image in /public (otherwise a cover is generated). */
    cover: z.string().optional(),
    /** Lower numbers come first. Unordered projects are sorted newest first. */
    order: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writings, tidbits, library, projects, ai };

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getConcepts } from '../../lib/utils';
import { SITE } from '../../site.config';

export async function GET(context: APIContext) {
  const items = (await getConcepts()).filter((p) => !p.data.draft);
  return rss({
    title: `${SITE.title} — AI Daily`,
    description: 'One AI concept a day, explained in plain language.',
    site: context.site!,
    items: items.map((p) => ({
      title: p.data.title,
      description: p.data.tldr,
      pubDate: p.data.date,
      link: `/ai/${p.id}/`,
      categories: p.data.tags,
      content: p.rendered?.html,
    })),
  });
}

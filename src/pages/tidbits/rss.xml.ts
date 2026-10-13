import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { formatDateTime, getTidbits } from '../../lib/utils';
import { SITE } from '../../site.config';

export async function GET(context: APIContext) {
  const items = (await getTidbits()).filter((t) => !t.data.draft);
  return rss({
    title: `${SITE.title} — Tidbits`,
    description: 'Short-form notes, links and passing thoughts.',
    site: context.site!,
    items: items.map((t) => ({
      title: t.data.title ?? `Tidbit · ${formatDateTime(t.data.date)}`,
      pubDate: t.data.date,
      link: `/tidbits/${t.id}/`,
      categories: t.data.tags,
      content: t.rendered?.html,
    })),
  });
}

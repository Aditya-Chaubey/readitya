import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getWritings } from '../lib/utils';
import { SITE } from '../site.config';

export async function GET(context: APIContext) {
  const posts = (await getWritings()).filter((p) => !p.data.draft);
  return rss({
    title: `${SITE.title} — Writings`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writings/${post.id}/`,
      categories: post.data.tags,
      content: post.rendered?.html,
    })),
  });
}

// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 👉 Change this to your real domain before deploying (used for RSS, sitemap & social cards).
  site: 'https://readitya.com',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: 'gruvbox-light-medium', dark: 'gruvbox-dark-medium' },
      wrap: true,
    },
  },
});

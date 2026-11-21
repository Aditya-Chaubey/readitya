/**
 * lrn — long readable notes.
 *
 * Each story is a self-contained interactive page in public/lrn/<slug>/
 * (its own HTML, CSS and JS, its own look). Add an entry here to list it
 * on /lrn. Newest first is decided by `date`, then by order in this list.
 */
export interface Story {
  slug: string;
  title: string;
  /** One-line hook under the title. */
  deck: string;
  /** Topic label; also used for the filter chips on /lrn. */
  topic: string;
  date: string;
  minutes: number;
  /** Number of interactive figures. */
  interactives: number;
  /** Cover image in /public. */
  cover: string;
  /** The story's own colours, used for its card. */
  bg: string;
  fg: string;
  accent: string;
}

export const STORIES: Story[] = [
  {
    slug: 'off-duty',
    title: 'Off Duty: The Quiet Art of Looking Expensive in Casual Clothes',
    deck: 'The palette, the silhouette, the fabrics, the ten pieces and the details, with Newman, McQueen, Delon, Gosling, Gong Yoo and Hyun Bin as the lookbook.',
    topic: 'Style & manners',
    date: '2026-11-20',
    minutes: 45,
    interactives: 0,
    cover: '/lrn/off-duty/img/gosling-cream.webp',
    bg: '#0f0f0e',
    fg: '#ece7de',
    accent: '#f0a77f',
  },
  {
    slug: 'gentleman',
    title: 'Well Suited: How to Dress Like a Modern Gentleman',
    deck: 'Fit, fabric, shoes, dress codes and the manners that matter more than any of it. With a paper-doll gentleman you can dress yourself.',
    topic: 'Style & manners',
    date: '2026-11-20',
    minutes: 40,
    interactives: 12,
    cover: '/lrn/_covers/gentleman.svg',
    bg: '#5c1421',
    fg: '#f4ecdd',
    accent: '#e3c48d',
  },
  {
    slug: 'poker',
    title: 'All In: A Friendly Guide to Poker',
    deck: 'How the world’s most famous card game works, why it’s really about people, and how to play your first hand. With a playable game against a cat.',
    topic: 'Games',
    date: '2026-11-20',
    minutes: 30,
    interactives: 12,
    cover: '/lrn/_covers/poker.svg',
    bg: '#0f4a35',
    fg: '#f8f1e1',
    accent: '#f0b93a',
  },
  {
    slug: 'watches',
    title: 'The Machine on Your Wrist',
    deck: 'How a wristwatch works, where it came from, and how to fall happily down the rabbit hole. A field guide for the newly curious.',
    topic: 'Objects & design',
    date: '2026-11-20',
    minutes: 35,
    interactives: 12,
    cover: '/lrn/_covers/watches.svg',
    bg: '#0a0c0f',
    fg: '#f1e9d8',
    accent: '#c9a96e',
  },
  {
    slug: 'decision-trees',
    title: 'The Tree That Asks Questions',
    deck: 'How a stack of yes-or-no questions became one of the most useful ideas in machine learning — and why one tree is never enough.',
    topic: 'Machine learning',
    date: '2026-11-20',
    minutes: 25,
    interactives: 9,
    cover: '/lrn/_covers/decision-trees.svg',
    bg: '#12382a',
    fg: '#f1ead8',
    accent: '#d4912a',
  },
  {
    slug: 'ai-agents',
    title: 'What Are AI Agents?',
    deck: 'A library errand with a few things that could go wrong — and what an agent actually does when they do.',
    topic: 'AI',
    date: '2026-11-20',
    minutes: 18,
    interactives: 5,
    cover: '/lrn/_covers/ai-agents.svg',
    bg: '#11382e',
    fg: '#f6f1e4',
    accent: '#f3c969',
  },
  {
    slug: 'linear-algebra',
    title: 'Linear Algebra',
    deck: 'How words become geometry. Follow one word through the math that helps a machine read.',
    topic: 'Mathematics',
    date: '2026-11-20',
    minutes: 20,
    interactives: 5,
    cover: '/lrn/_covers/linear-algebra.svg',
    bg: '#18194e',
    fg: '#f8f6ef',
    accent: '#fb7044',
  },
];

export const getStories = () =>
  STORIES.map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.date.localeCompare(a.s.date) || a.i - b.i)
    .map(({ s }) => s);

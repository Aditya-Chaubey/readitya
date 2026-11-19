/**
 * Deep Cuts — long, visual, hand-built stories.
 *
 * Each story is a self-contained interactive page in public/deep-cuts/<slug>/
 * (its own HTML, CSS and JS). Add an entry here to list it on /deep-cuts.
 * Newest first is decided by `date`.
 */
export interface DeepCut {
  slug: string;
  title: string;
  /** One-line hook under the title. */
  deck: string;
  /** Small label above the title, e.g. "Machine learning". */
  kicker: string;
  date: string;
  minutes: number;
  /** Number of interactive figures. */
  interactives: number;
  /** Cover image in /public. */
  cover: string;
  /** Accent used on the card. */
  color: string;
}

export const DEEP_CUTS: DeepCut[] = [
  {
    slug: 'decision-trees',
    title: 'The Tree That Asks Questions',
    deck: 'How a stack of yes-or-no questions became one of the most useful ideas in machine learning — and why one tree is never enough.',
    kicker: 'Machine learning',
    date: '2026-11-20',
    minutes: 25,
    interactives: 9,
    cover: '/deep-cuts/_covers/decision-trees.svg',
    color: '#d4912a',
  },
  {
    slug: 'ai-agents',
    title: 'What Are AI Agents?',
    deck: 'A library errand with a few things that could go wrong — and what an agent actually does when they do.',
    kicker: 'AI foundations',
    date: '2026-11-20',
    minutes: 18,
    interactives: 5,
    cover: '/deep-cuts/_covers/ai-agents.svg',
    color: '#f3c969',
  },
  {
    slug: 'linear-algebra',
    title: 'Linear Algebra',
    deck: 'How words become geometry. Follow one word through the math that helps a machine read.',
    kicker: 'Mathematics',
    date: '2026-11-20',
    minutes: 20,
    interactives: 5,
    cover: '/deep-cuts/_covers/linear-algebra.svg',
    color: '#fb7044',
  },
];

export const getDeepCuts = () => [...DEEP_CUTS].sort((a, b) => b.date.localeCompare(a.date));

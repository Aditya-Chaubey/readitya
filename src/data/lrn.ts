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
    slug: 'chess',
    title: 'The Long Game: Chess for Adults',
    deck: 'Learn chess as a grown-up and get properly good: the pieces, how adults really improve, openings, tactics, checkmates, strategy, endgames, ratings and etiquette, with a coach bot and 13 playable boards.',
    topic: 'Games',
    date: '2026-11-22',
    minutes: 60,
    interactives: 13,
    cover: '/lrn/_covers/chess.svg',
    bg: '#1a120c',
    fg: '#f4ecdc',
    accent: '#c9a25a',
  },
  {
    slug: 'patrick-jane',
    title: 'The Jane Method: How to Be Patrick Jane',
    deck: 'A playful field guide to The Mentalist’s consultant: the tieless three-piece, tea, the couch, observation, cold reading, the real science of lie detection, mentalism tricks and charm, with the con left out. Light spoilers only.',
    topic: 'Body & mind',
    date: '2026-11-22',
    minutes: 40,
    interactives: 11,
    cover: '/lrn/_covers/patrick-jane.svg',
    bg: '#141a26',
    fg: '#f4ead8',
    accent: '#d9a441',
  },
  {
    slug: 'hobbies',
    title: 'Off the Clock: Hobbies That Make a Man Interesting',
    deck: '29 cheap, healthy hobbies with real Indian starting costs: a hobby finder, a portfolio radar, a playable guitar, a mate-in-one puzzle, a CPR metronome, cost per hour, and a 30-day plan.',
    topic: 'Style & manners',
    date: '2026-11-22',
    minutes: 40,
    interactives: 13,
    cover: '/lrn/_covers/hobbies.svg',
    bg: '#1a1714',
    fg: '#f3ebdd',
    accent: '#ff6b35',
  },
  {
    slug: 'boyfriend',
    title: 'Devoted: How a Gentleman Loves',
    deck: 'How to be a great boyfriend, grown-up edition: turning toward her, love maps, celebrating her wins, small rituals, listening, fighting fair, repair, equality, courtesy and keeping the fire lit. Built on Gottman, Gable, Aron and Fromm.',
    topic: 'Style & manners',
    date: '2026-11-22',
    minutes: 45,
    interactives: 12,
    cover: '/lrn/_covers/boyfriend.svg',
    bg: '#1b1116',
    fg: '#f6ebe3',
    accent: '#e88a9b',
  },
  {
    slug: 'healthy-masculinity',
    title: 'A Good Man: What It Takes in the Modern World',
    deck: 'Character, the old codes rewritten, strength pointed well, composure, class, partnership, friendship and mentorship, with a golden-mean compass, a mental-load audit and a four-week plan.',
    topic: 'Style & manners',
    date: '2026-11-21',
    minutes: 45,
    interactives: 8,
    cover: '/lrn/healthy-masculinity/coast.jpg',
    bg: '#252b22',
    fg: '#f9f2e5',
    accent: '#edbc98',
  },
  {
    slug: 'memory-palace',
    title: 'The Memory Palace: How to Remember Almost Anything',
    deck: 'What the 2,500-year-old method of loci is, whether it really works, and how to build your own, with a walkable palace, the Major System and spaced review.',
    topic: 'Body & mind',
    date: '2026-11-21',
    minutes: 40,
    interactives: 11,
    cover: '/lrn/_covers/memory-palace.svg',
    bg: '#14223b',
    fg: '#eef1f7',
    accent: '#d6a84f',
  },
  {
    slug: 'sleep',
    title: 'Lights Out: A Field Guide to Sleep',
    deck: 'Why we sleep, the two forces that run your night, stages and dreams, caffeine, the perfect bedroom and the habits that matter most. Read it from dusk to dawn.',
    topic: 'Body & mind',
    date: '2026-11-21',
    minutes: 45,
    interactives: 12,
    cover: '/lrn/_covers/sleep.svg',
    bg: '#0a0d24',
    fg: '#f4efe6',
    accent: '#ffd978',
  },
  {
    slug: 'money',
    title: 'Slow Rich: Money Basics for Your Twenties',
    deck: 'For a 25-year-old with a first salary in India: CTC vs in-hand, budgeting, emergency funds, insurance, credit cards, inflation, compounding, index funds, tax and scams. With 13 calculators.',
    topic: 'Money',
    date: '2026-11-21',
    minutes: 60,
    interactives: 13,
    cover: '/lrn/_covers/money.svg',
    bg: '#0b120f',
    fg: '#eef2e8',
    accent: '#3ddc97',
  },
  {
    slug: 'conversation',
    title: 'Good Company: The Art of Conversation for Men',
    deck: 'How to talk to friends, strangers and women with ease: the science of liking, threading, listening, going deeper, stories, wit, and what Bond, Darcy, Cary Grant and Bourdain can teach you.',
    topic: 'Style & manners',
    date: '2026-11-21',
    minutes: 50,
    interactives: 10,
    cover: '/lrn/_covers/conversation.svg',
    bg: '#1a1116',
    fg: '#f4eadc',
    accent: '#f0b764',
  },
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

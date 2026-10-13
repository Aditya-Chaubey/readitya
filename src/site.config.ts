/**
 * ─────────────────────────────────────────────────────────────
 *  SITE CONFIG — edit this file to make the site yours.
 * ─────────────────────────────────────────────────────────────
 */
export const SITE = {
  /** Your name. Shown in the header, footer, running heads & feeds. */
  author: 'Aditya Chaubey',
  /** The site title (used in <title> and feeds). */
  title: 'Aditya Chaubey',
  /** A one-line description used for SEO and the home page. */
  description: 'A personal corner of the internet — writings, tidbits, and a library of everything I have consumed.',
  /** Short tagline under your name on the home page. */
  tagline: 'a personal mixtape of words & things',
  /** Your timezone — used to print tidbit timestamps. */
  timezone: 'Asia/Kolkata',
  /** Locale for formatting dates. 'en-GB' gives "13 Oct 2026". */
  locale: 'en-GB',
  /** How many tidbits to show per page. */
  tidbitsPerPage: 10,
};

/**
 * The tapes on the home page. Each one becomes a cassette in the carousel.
 * `shell` is the plastic colour, `band` the label stripe, `ink` the hub/accent.
 */
export const TAPES = [
  { label: 'About Me', href: '/about', side: 'A', length: 'C-46', shell: '#e9dcc0', band: '#b5412f', ink: '#2a1f17', note: 'liner notes' },
  { label: 'Projects', href: '/projects', side: 'A', length: 'C-60', shell: '#d9a13b', band: '#2b2622', ink: '#2b2622', note: 'works in progress' },
  { label: 'Writings', href: '/writings', side: 'A', length: 'C-90', shell: '#2b2622', band: '#e0a43a', ink: '#f2e6cf', note: 'long play' },
  { label: 'Tidbits', href: '/tidbits', side: 'B', length: 'C-30', shell: '#c4583f', band: '#24555a', ink: '#f6ecd7', note: 'short cuts' },
  { label: 'Library', href: '/library', side: 'A', length: 'C-120', shell: '#2f5d62', band: '#e8b04b', ink: '#f6ecd7', note: 'the archive' },
] as const;

/**
 * Main navigation (header). Numbered like a book's table of contents.
 * `ribbon` is the colour of the bookmark ribbon on that section's pages.
 */
export const NAV = [
  { label: 'About', href: '/about', ribbon: '#2f5d62' },
  { label: 'Projects', href: '/projects', ribbon: '#c08a2a' },
  { label: 'Writings', href: '/writings', ribbon: '#9a3324' },
  { label: 'Tidbits', href: '/tidbits', ribbon: '#4f6b34' },
  { label: 'Library', href: '/library', ribbon: '#4a3b6b' },
] as const;

/** Links shown in the footer and on the About page. Remove or add freely. */
export const SOCIALS = [
  { label: 'Email', href: 'mailto:hello@example.com' },
  { label: 'GitHub', href: 'https://github.com/' },
  { label: 'X / Twitter', href: 'https://x.com/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/' },
] as const;


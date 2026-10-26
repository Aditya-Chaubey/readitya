import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';

/** 13 Oct 2026 */
export function formatDate(date: Date) {
  return date.toLocaleDateString(SITE.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: SITE.timezone,
  });
}

/** 13 Oct 2026, 09:30 */
export function formatDateTime(date: Date) {
  const d = formatDate(date);
  const t = date.toLocaleTimeString(SITE.locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SITE.timezone,
  });
  return `${d}, ${t}`;
}

/** Year in the site's timezone */
export function yearOf(date: Date) {
  return Number(date.toLocaleDateString('en-GB', { year: 'numeric', timeZone: SITE.timezone }));
}

/** Format a loose library date (2026, "2026-10", Date) as text. */
export function formatLoose(d: string | number | Date) {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

/** Sortable key for a loose date. */
export function looseKey(d: string | number | Date | undefined) {
  if (d === undefined) return '';
  return formatLoose(d);
}

const ROMAN: [number, string][] = [
  [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
  [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
];
export function roman(n: number) {
  let out = '';
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Rough word count of a markdown body. */
export function wordCount(body = '') {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-|[\]()]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingTime(words: number) {
  return Math.max(1, Math.round(words / 230));
}

const showDrafts = import.meta.env.DEV;

export async function getWritings() {
  const posts = await getCollection('writings', (p) => showDrafts || !p.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getTidbits() {
  const items = await getCollection('tidbits', (p) => showDrafts || !p.data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** AI Daily posts, newest first. */
export async function getConcepts() {
  const items = await getCollection('ai', (p) => showDrafts || !p.data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getShelves() {
  const shelves = await getCollection('library');
  return shelves.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getProjects() {
  const items = await getCollection('projects', (p) => showDrafts || !p.data.draft);
  return items.sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) || b.data.started.valueOf() - a.data.started.valueOf(),
  );
}

/** "Oct 2026" */
export function formatMonth(date: Date) {
  return date.toLocaleDateString(SITE.locale, { month: 'short', year: 'numeric', timeZone: SITE.timezone });
}

/** Small stable hash for generative art. */
export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export type Writing = CollectionEntry<'writings'>;
export type Project = CollectionEntry<'projects'>;
export type Tidbit = CollectionEntry<'tidbits'>;
export type Shelf = CollectionEntry<'library'>;
export type Concept = CollectionEntry<'ai'>;

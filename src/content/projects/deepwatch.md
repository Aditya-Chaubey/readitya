---
title: "Deepwatch."
summary: "A YouTube-style app for learning, with a recommendation system built to help you finish things. Courses, learning paths, and thumbnails that don't shout."
status: Shipped     # In progress · Shipped · Paused · Idea · Archived
started: 2026-11-04
ended: 2026-11-05
stack: [JavaScript, HTML, CSS, Python, YouTube Data API v3, Claude Opus 5.5, Claude Code]
links: [{ label: "Open Deepwatch", url: "/deepwatch/" }]
cover: /images/projects/deepwatch/cover.webp
draft: false
---

**Deepwatch** is a YouTube clone built for one thing: learning. It looks and works like YouTube — a feed, a watch page, courses, a queue, notes — but the library is a set of courses and deep dives instead of entertainment, and a recommendation system of its own sits underneath. The difference is what the feed is trying to do. YouTube ranks for watch time. Deepwatch ranks for finished videos, notes written, and the next thing you should learn after this one.

The library is hand-built rather than endless: **3,575 videos, 293 courses, 9,632 lesson titles and 23 learning paths**, across 12 topics. Nothing in it is an ad, a Short, or a reaction video.

![The For you feed: a quiet grid of lectures and series, with topic chips along the top](/images/projects/deepwatch/home.webp)

## A different set of defaults

Most of the design is subtraction.

- **The feed is finite.** Scroll to the end of your library for a topic and it says so, instead of quietly serving more.
- **No autoplay into the next video.** When something finishes, you get a comment box asking what you learned.
- **Comments are off by default.** They're one click away if you add a free YouTube API key, and they never load on their own.
- **No Shorts, no countdowns, no red badges.** The interface stays quiet: no motion beyond a page transition and the "why you're seeing this" tooltip.
- **No account.** History, notes and settings live in your browser's local storage, and you can export or erase all of it.

## Thumbnails from the middle of the video

This is the detail I care about most. YouTube's automatic thumbnails come from inside the video: `sd1`, `sd2` and `sd3` are frames taken at roughly a quarter, half, and three quarters of the way through. The `sd2` frame — the midpoint — is what Deepwatch asks for on every card.

So a thumbnail is a whiteboard, a slide, a lecturer mid-sentence, or a diagram appearing — a picture of the thing you're about to learn, not a face pulled into an expression. Nothing is trying to win a click against the video next to it. There's also a **Calm thumbnails** setting that desaturates them until you hover.

## Courses, not just clips

The **Deep Dive** section holds **293 full courses** — mostly university lecture series and long-form series that people keep recommending: MIT 18.06, CS50, Karpathy's *Neural Networks: Zero to Hero*, 3Blue1Brown's *Essence of linear algebra*, Berkeley's CS61A, Stanford's CS144.

Each course opens as a playlist with its real lesson titles and lengths. Deepwatch remembers which lesson you're on, ticks off the ones you finish, and shows a progress bar on the card. Where a newer recording of the same course exists, the older page links to it; where a course is a community favourite, it gets a small star instead of a louder badge.

![Deep Dive: courses ranked for your topics, plus the learning paths below](/images/projects/deepwatch/deep-dive.webp)

## Learning paths

A course is a good unit. A path is a better one. There are **23 paths**, each a short curriculum that goes from first principles to the frontier, in four stages — *Foundations → Core → Deeper → Frontier*. Every step says why it's there, and each path lists what to do before it ("Best after …"). The progress bar has one segment per course, so you can see the shape of what's left.

Some of them: *Learn How to Learn*, *Mathematics from First Principles*, *Deep Learning, Built Up*, *Build a Computer from Scratch*, *The History of Everything*.

![A learning path: staged roadmap, with the next course marked and a reason for each step](/images/projects/deepwatch/path.webp)

## A recommendation system you can read

No embeddings, no black box. A video is scored on things you'd recognise: the topics you finish, the channels you stick with, whether its level matches yours, whether it's substantive (10–120 minutes gets a small boost; very long or very short gets a penalty), whether it continues something you just finished, and whether your recent learning has been lopsided. A little daily randomness, larger outside your interests, keeps the feed from collapsing into one subject.

Then the list is re-ranked so that no single channel or topic dominates. Finishing, note-taking and reflecting teach it more than clicking does; opening something and leaving early counts against it. Finished videos leave the feed and come back only for **spaced review** after 2, 7, 21 and 60 days if you took notes on them.

Every card can explain itself: hover and a tooltip lists the actual reasons ("Next step after …", "You haven't done much Physics lately", "Recommended by 3 people on Hacker News"). The **Your algorithm** page shows the whole profile — interests, depth, exploration, category weights, recent signals — with sliders over all of it.

![Your algorithm: the feed's whole model, with sliders and a reset](/images/projects/deepwatch/algorithm.webp)

## Paying attention

The watch page is built for one screen at a time: player, save, note, focus mode. Notes are timestamped with the video, one click to jump back, and the end screen asks for a reflection in your own words. Then there's a Progress page that measures time spent learning rather than time spent scrolling — daily goal, streak, a 14-day chart, and a breakdown of your learning diet by topic.

![The watch page: player, timestamped notes, and recommendations that justify themselves](/images/projects/deepwatch/watch.webp)

![Progress: daily goal, streak, the last two weeks, and the balance of your learning](/images/projects/deepwatch/progress.webp)

## Where the library comes from

Nothing is scraped blind. A small Python pipeline in `build/` assembles the catalog:

- **Hand-picked core** — videos and playlists I chose, verified with the YouTube Data API v3 (exists, embeddable, with real duration and lesson titles).
- **Channel picks** — educational channels' long-form uploads, filtered to drop clickbait, product promos and current politics.
- **Community lists** — courses from community-maintained lists such as *ML-YouTube-Courses* and *CS-video-courses*, plus landmark lectures (Feynman, Hamming, Sagan, Kay, Pausch).
- **Human recommendations** — 552 Hacker News threads and top Stack Exchange answers, so some videos carry a credit like "Recommended by 3 people on Hacker News". 950 videos in the library carry a community recommendation from one of those sources.

`gen.py` merges it into a single generated catalog. The app itself is plain files — one HTML page, four JavaScript modules, a stylesheet and that catalog — with a hash router and relative paths. There's no framework, no server and no build step at runtime, which is exactly why it can live in a folder on this site at **/deepwatch/** and just work.

## Open Deepwatch

<p><a class="btn" href="/deepwatch/">Open Deepwatch ↗</a></p>

It's free, there's nothing to sign up for, and everything you do stays in your browser. It's built for a laptop screen; open it, pick a topic, and start the first video in a path.

## Made with Claude Opus 5.5 on Claude Code

I made Deepwatch with **Claude Opus 5.5** on **Claude Code** — the catalog pipeline, the recommendation engine, and the interface.

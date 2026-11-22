/* lrn — Off the Clock */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const inr = (n) => n === 0 ? 'Free' : '₹' + n.toLocaleString('en-IN');

  /* tooltip */
  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', hideTip); };

  /* reveal */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(n); };
  $$('.rv').forEach((n) => reveal(n));

  /* progress + rail */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  chapters.forEach((c, i) => { const a = el('a', '', String(i + 1).padStart(2, '0')); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const rl = $$('a', rail);
  const onScroll = () => {
    const d = document.documentElement; bar.style.width = (d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', d.scrollTop > innerHeight * .8);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur)); rail.classList.toggle('on-dark', cur >= 0 && chapters[cur].classList.contains('ink'));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ═════════ RISO ICON LIBRARY (64×64) ═════════
     f = shapes printed in colour (offset, like a misregistered riso layer) and outlined in ink
     s = ink-only line work */
  const ICON = {
    cook: { f: '<circle cx="26" cy="36" r="15"/>', s: '<path d="M41 33h18v6H41z"/><path d="M20 8c3 3-3 5 0 9M28 6c3 3-3 5 0 9M36 8c3 3-3 5 0 9"/>' },
    bread: { f: '<path d="M8 42c0-12 11-20 24-20s24 8 24 20v8H8z"/>', s: '<path d="M21 30l4 9M31 28l4 9M41 30l4 9"/>' },
    coffee: { f: '<path d="M14 14h36L39 34H25z"/>', s: '<path d="M18 40h28v5a11 11 0 0 1-11 11h-6a11 11 0 0 1-11-11z"/><path d="M46 44h4a4 4 0 0 1 0 8h-5"/><path d="M32 35v3"/>' },
    wood: { f: '<path d="M6 34L42 20l8 15-36 14z"/>', s: '<path d="M42 20l9-4 7 13-8 4"/><path d="M14 49l2-4 3 3 2-4 3 3 2-4 3 3 2-4 3 3 2-4 3 3"/>' },
    sketch: { f: '<path d="M12 52l32-32 8 8-32 32-11 3z"/>', s: '<path d="M40 24l8 8M16 46l6 6"/><path d="M6 14c8-6 14 4 22-2"/>' },
    garden: { f: '<path d="M18 40h28l-5 18H23z"/>', s: '<path d="M32 40V20"/><path d="M32 32c-11 0-15-8-15-13 9 0 15 5 15 13zM32 27c9 0 13-7 13-11-8 0-13 4-13 11z"/>' },
    leather: { f: '<rect x="8" y="18" width="48" height="30" rx="5"/>', s: '<path d="M13 23h38v20H13z" stroke-dasharray="3 3"/><path d="M38 28h18v10H38z"/><circle cx="44" cy="33" r="2"/>' },
    photo: { f: '<rect x="6" y="20" width="52" height="34" rx="6"/>', s: '<path d="M22 20l4-7h12l4 7"/><circle cx="32" cy="37" r="10"/><circle cx="32" cy="37" r="4"/><path d="M48 27h4"/>' },
    run: { f: '<path d="M6 44c0-8 4-15 9-19l11 6 8-4c6 7 14 9 22 11 2 2 2 6 0 8H6z"/>', s: '<path d="M6 51h50"/><path d="M23 33l4-3M27 36l4-3M31 39l4-3"/>' },
    cali: { f: '<circle cx="32" cy="24" r="6"/><path d="M27 32h10v12H27z"/>', s: '<path d="M6 10h52"/><path d="M24 10v8l6 8M40 10v8l-6 8"/><path d="M29 44l-5 14M35 44l5 14"/>' },
    swim: { f: '<path d="M2 44c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 12 2v14H2z"/>', s: '<circle cx="44" cy="28" r="5"/><path d="M12 38c6-12 18-15 26-10"/><path d="M2 52c6-4 10-4 16 0s10 4 16 0 10-4 16 0"/>' },
    cycle: { f: '<circle cx="16" cy="42" r="11"/><circle cx="48" cy="42" r="11"/>', s: '<path d="M16 42l10-16h15l7 16M26 26l10 16h12M22 21h9M39 19h7"/>' },
    trek: { f: '<path d="M2 54l20-30 10 14 9-11 21 27z"/>', s: '<path d="M17 31l5-7 5 7"/><circle cx="50" cy="13" r="6"/>' },
    box: { f: '<path d="M18 18c0-6 6-10 14-10h6c8 0 12 6 12 14v14c0 6-4 10-10 10H28c-6 0-10-4-10-10z"/>', s: '<path d="M23 46h22v10H23z"/><path d="M18 28c-6 0-9 4-9 8s4 7 9 5"/><path d="M28 20c4 2 10 2 14 0"/>' },
    boulder: { f: '<path d="M12 26c4-11 21-15 31-9s13 19 6 27-23 10-31 4S8 34 12 26z"/>', s: '<circle cx="31" cy="31" r="3"/><path d="M52 4l-6 10M58 12l-9 5"/>' },
    yoga: { f: '<ellipse cx="32" cy="48" rx="22" ry="6"/><circle cx="32" cy="13" r="6"/>', s: '<path d="M32 20v18M32 26l-12 9M32 26l12 9"/><path d="M14 46c7-6 29-6 36 0"/>' },
    read: { f: '<path d="M6 16c9-4 18-4 26 2v34c-8-6-17-6-26-2z"/>', s: '<path d="M32 18c8-6 17-6 26-2v34c-9-4-18-4-26 2"/><path d="M12 26c5-1 10-1 14 1M12 33c5-1 10-1 14 1M38 27c5-2 10-2 14-1M38 34c5-2 10-2 14-1"/>' },
    chess: { f: '<path d="M22 54h24v-6c0-7-3-11-3-17 0-11-6-19-17-21l-2 6-6 4-4 10 4 4 9-4c-3 6-8 10-8 16v8z"/>', s: '<path d="M16 56h34"/><circle cx="29" cy="20" r="1.6"/>' },
    lang: { f: '<path d="M6 10h32v22H20l-9 8v-8H6z"/>', s: '<path d="M30 28h28v20h-5v8l-9-8H30z"/><path d="M13 19h18M13 25h10M37 37h14M37 42h9"/>' },
    write: { f: '<rect x="10" y="8" width="34" height="48" rx="3"/>', s: '<path d="M17 18h20M17 25h20M17 32h13"/><path d="M50 10l7 7-21 21-9 2 2-9z"/>' },
    stars: { f: '<path d="M8 30l32-15 5 11-32 15z"/>', s: '<path d="M28 32l-9 24M28 32l9 24M28 32v24"/><path d="M52 6l1.5 3.5L57 11l-3.5 1.5L52 16l-1.5-3.5L47 11l3.5-1.5z"/>' },
    guitar: { f: '<circle cx="21" cy="45" r="13"/><circle cx="31" cy="34" r="9"/>', s: '<circle cx="23" cy="43" r="3.5"/><path d="M33 31L51 10M36 34l18-21"/><path d="M50 6l8 8"/><path d="M14 52l6-6"/>' },
    dance: { f: '<ellipse cx="18" cy="48" rx="7" ry="5.5"/><ellipse cx="46" cy="42" rx="7" ry="5.5"/>', s: '<path d="M25 48V16l28-6v32"/><path d="M25 24l28-6"/>' },
    games: { f: '<rect x="8" y="24" width="26" height="26" rx="5"/>', s: '<rect x="30" y="10" width="24" height="24" rx="5"/><circle cx="15" cy="31" r="2" fill="currentColor"/><circle cx="21" cy="37" r="2" fill="currentColor"/><circle cx="27" cy="43" r="2" fill="currentColor"/><circle cx="37" cy="17" r="2" fill="currentColor"/><circle cx="47" cy="27" r="2" fill="currentColor"/>' },
    volunteer: { f: '<path d="M32 30c-4-6-14-4-14 3 0 7 14 15 14 15s14-8 14-15c0-7-10-9-14-3z"/>', s: '<path d="M4 50h14l10 4 18-6c3-1 6 2 3 4L31 62H4"/>' },
    mech: { f: '<path d="M46 6a12 12 0 0 0-11 16L10 47a5 5 0 0 0 7 7l25-25a12 12 0 0 0 16-11l-8 4-6-6 4-8z"/>', s: '<circle cx="13.5" cy="50.5" r="1.5"/>' },
    firstaid: { f: '<rect x="8" y="16" width="48" height="38" rx="6"/>', s: '<path d="M24 16v-6h16v6"/><path d="M32 25v20M22 35h20" stroke-width="4"/>' },
    diy: { f: '<path d="M12 10h26v13H12z"/>', s: '<path d="M38 13h10v7H38"/><path d="M22 23h7v34h-7z"/><path d="M50 40v16M46 40h8"/>' },
    speak: { f: '<rect x="23" y="6" width="18" height="30" rx="9"/>', s: '<path d="M16 28a16 16 0 0 0 32 0M32 44v10M23 56h18"/><path d="M27 14h10M27 20h10"/>' },
  };
  const CAT = { body: { n: 'Body', c: '#00a39a' }, hands: { n: 'Hands', c: '#ff6b35' }, mind: { n: 'Mind', c: '#3b5bdb' }, social: { n: 'Social', c: '#ff4f8b' }, useful: { n: 'Useful', c: '#ffc229' } };
  const icon = (key, col) => {
    const i = ICON[key]; if (!i) return '';
    return `<svg viewBox="-2 -2 68 68" aria-hidden="true"><g transform="translate(3 3)" fill="${col}" style="mix-blend-mode:multiply" opacity=".95">${i.f}</g><g fill="none" stroke="#1a1714" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" color="#1a1714">${i.f}${i.s}</g></svg>`;
  };

  /* ═════════ DATA: 29 hobbies ═════════
     start ₹, monthly ₹, hours/week, energy 1–3, social 0 solo · 1 either · 2 group, place, scores I U A H (1–3) */
  const H = [
    ['cook', 'Cooking', 'hands', 'cook', 4000, 1000, 4, 1, 1, 'in', [3, 3, 3, 2], 'Feeds you, your friends and anyone you love. Cheaper and healthier than ordering in, and the most quietly attractive skill on this list.', 'Buy a chef\'s knife and a heavy pan. Learn to dice an onion. Cook one dal, one egg dish and one pasta until you can do them without a recipe.', 'Host six friends for a dinner you cooked start to finish.'],
    ['bread', 'Baking bread', 'hands', 'bread', 6500, 500, 3, 1, 0, 'in', [2, 2, 2, 1], 'Flour, water, salt, time. Meditative, a little scientific, and nothing beats handing someone a loaf you made.', 'A basic OTG oven, a digital scale and a bag of flour. Start with a no-knead loaf before attempting sourdough.', 'A sourdough loaf with an open crumb, from a starter you raised.'],
    ['coffee', 'Specialty coffee', 'hands', 'coffee', 5000, 800, 2, 1, 0, 'in', [2, 2, 2, 1], 'India grows some of the world\'s best coffee. Learning to brew it well turns a habit into a craft and a morning ritual.', 'A hand grinder, a pour-over dripper and a kitchen scale. Buy freshly roasted beans from an Indian roaster and play with grind size.', 'Taste the difference between two estates in a blind cup.'],
    ['wood', 'Woodworking', 'hands', 'wood', 8000, 1000, 4, 2, 0, 'in', [3, 3, 2, 1], 'Making real, lasting objects with your hands. Deeply satisfying, endlessly expandable, and you\'ll never buy a flimsy shelf again.', 'Start with hand tools: a saw, chisels, a square, clamps and sandpaper. Build a simple box or a wall shelf from pine.', 'A small piece of furniture people actually use.'],
    ['sketch', 'Sketching', 'hands', 'sketch', 1000, 200, 3, 1, 0, 'both', [3, 1, 2, 1], 'Drawing teaches you to see. A pocket sketchbook turns every café, train and waiting room into practice.', 'A sketchbook and a few pens. Draw a mug, your shoe, your hand, every day for ten minutes. Join an Urban Sketchers meet-up.', 'Fill a whole sketchbook.'],
    ['garden', 'Balcony gardening', 'hands', 'garden', 2000, 300, 2, 1, 0, 'out', [2, 2, 2, 2], 'Growing herbs, chillies and tomatoes on a balcony. Calming, practical, and you\'ll cook with what you grow.', 'Pots, potting mix, and seeds or saplings of tulsi, mint, coriander and chilli. Water consistently and learn your sunlight.', 'A meal with something you grew in it.'],
    ['leather', 'Leathercraft', 'hands', 'leather', 4000, 800, 3, 1, 0, 'in', [2, 2, 2, 1], 'Hand-stitching wallets, belts and cardholders. A beautiful, quiet craft with gifts as the by-product.', 'A starter kit: a stitching chisel, needles, waxed thread, an edge tool and some offcuts. Make a simple cardholder.', 'A wallet you carry every day.'],
    ['photo', 'Photography', 'hands', 'photo', 0, 0, 3, 2, 1, 'out', [3, 2, 2, 2], 'Your phone is a superb camera. Learning composition and light gets you walking, noticing, and coming home with something to show.', 'Shoot with your phone for a month. Learn the rule of thirds, golden hour and editing basics. Join a photo walk.', 'Twelve photos good enough to print and frame.'],
    ['run', 'Running', 'body', 'run', 4500, 0, 3, 3, 1, 'out', [2, 2, 2, 3], 'The cheapest fitness there is, and running clubs are some of the friendliest communities in Indian cities.', 'Good running shoes fitted at a store. Follow Couch to 5K. Find a Sunday-morning running group.', 'Finish a 10K race.'],
    ['cali', 'Calisthenics', 'body', 'cali', 1500, 0, 3, 3, 0, 'both', [2, 2, 3, 3], 'Strength with your own bodyweight. Anywhere, any time, and the progressions toward muscle-ups and handstands are addictive.', 'A doorway pull-up bar. Three sessions a week of push-ups, rows, squats and dead hangs, climbing the progression ladders.', 'Ten strict pull-ups.'],
    ['swim', 'Swimming', 'body', 'swim', 1500, 2000, 3, 2, 0, 'in', [2, 3, 2, 3], 'Easy on the joints, works everything, and it\'s a skill that can save your life or someone else\'s.', 'Goggles, cap and a pool membership. If you can\'t swim confidently, book a few adult lessons first.', 'Swim 1 km continuously.'],
    ['cycle', 'Cycling', 'body', 'cycle', 20000, 300, 4, 3, 1, 'out', [2, 2, 2, 3], 'Early-morning rides out of the city, with a group or alone. Fitness, exploration and a reason to see sunrise.', 'An entry-level hybrid or road bike, a helmet and lights. Join a weekend ride with a local cycling club.', 'A 100 km ride.'],
    ['trek', 'Trekking', 'body', 'trek', 6000, 2500, 6, 3, 2, 'out', [3, 2, 3, 3], 'Sahyadris, Himalayas, Western Ghats. Weekends in the hills with friends, and stories for years.', 'Trekking shoes and a daypack. Start with a day trek near your city with an established trek group.', 'A multi-day Himalayan trek.'],
    ['box', 'Boxing / martial arts', 'body', 'box', 3000, 3000, 4, 3, 2, 'in', [3, 3, 3, 3], 'Fitness, discipline and the quiet confidence that comes from knowing you can handle yourself, and therefore never need to.', 'Try free trial classes at a boxing, BJJ or MMA gym. Buy gloves and hand wraps once you commit.', 'Your first sparring round, or a coloured belt.'],
    ['boulder', 'Bouldering', 'body', 'boulder', 0, 3000, 3, 3, 2, 'in', [3, 1, 3, 3], 'Climbing short walls without ropes. Part puzzle, part strength, very social, and growing fast in Indian metros.', 'Book an intro session at a climbing gym; shoes can be rented. Go with a friend and cheer each other on.', 'Send a route you couldn\'t touch on day one.'],
    ['yoga', 'Yoga', 'body', 'yoga', 1000, 0, 3, 1, 1, 'in', [2, 2, 2, 3], 'Flexibility, balance and calm. Every man who lifts or sits at a desk all day needs more of it.', 'A mat and a beginner class or a reputable online series. Twenty minutes, four mornings a week.', 'Touch your toes, then hold a crow pose.'],
    ['read', 'Reading', 'mind', 'read', 0, 600, 5, 1, 0, 'in', [3, 2, 2, 1], 'The cheapest hobby on earth and the one that makes you most interesting to talk to.', 'Join a library or a book club. Read twenty pages a day, phone in another room. Quit books you don\'t enjoy.', 'Twenty books in a year.'],
    ['chess', 'Chess', 'mind', 'chess', 500, 0, 3, 1, 1, 'in', [3, 1, 2, 1], 'Free online, a classic in every café, and India is now a chess superpower. Patience, pattern-spotting and losing graciously.', 'Play online daily, do ten puzzles a day, and learn three openings. Find a local club for over-the-board games.', 'A rated online rating of 1500.'],
    ['lang', 'A new language', 'mind', 'lang', 0, 0, 3, 1, 1, 'in', [3, 3, 3, 1], 'Spanish, French, Japanese, or a language from another Indian state. Travel becomes conversation.', 'An app for daily habit, plus a weekly class or tutor for real speaking. Watch shows in the language with subtitles.', 'A twenty-minute conversation with a native speaker.'],
    ['write', 'Writing & journaling', 'mind', 'write', 300, 0, 2, 1, 0, 'in', [3, 2, 1, 2], 'Writing clarifies thinking like nothing else. A journal, a blog, short stories or letters to friends.', 'A notebook. Write a page every morning, or one 500-word piece a week on something you\'re thinking about.', 'Thirty days of journaling in a row, or ten published pieces.'],
    ['stars', 'Stargazing', 'mind', 'stars', 4000, 0, 2, 1, 1, 'out', [3, 1, 3, 1], 'Naming planets, catching meteor showers and seeing Saturn\'s rings. Perfect for treks and late-night dates.', 'A free star-chart app, then 10×50 binoculars. Head out of the city on a moonless night.', 'See Jupiter\'s moons and Saturn\'s rings yourself.'],
    ['guitar', 'Guitar', 'social', 'guitar', 8000, 0, 4, 1, 1, 'in', [3, 1, 3, 1], 'Four chords unlock hundreds of songs. The person who can play at the campfire is always welcome.', 'A playable beginner acoustic and a free beginner course. Fifteen minutes a day. Learn songs you love.', 'Play three songs all the way through for friends.'],
    ['dance', 'Dancing', 'social', 'dance', 0, 2500, 3, 2, 2, 'in', [3, 1, 3, 3], 'Salsa, bachata, swing or Bollywood. Rhythm, confidence and a room full of new people every week.', 'Join a beginner group class; no partner needed. Go weekly for two months before judging yourself.', 'Dance a full song at a social without counting out loud.'],
    ['games', 'Board games & hosting', 'social', 'games', 3000, 500, 3, 1, 2, 'in', [2, 1, 2, 1], 'Modern board games are brilliant, and a regular games night is the easiest way to keep friendships alive.', 'Buy two great gateway games and invite four friends. Add snacks. Make it monthly.', 'A games night that\'s been running for a year.'],
    ['volunteer', 'Volunteering', 'social', 'volunteer', 0, 0, 3, 2, 2, 'both', [3, 3, 3, 2], 'Teaching kids, animal shelters, tree planting, food drives. Purpose, perspective and good people.', 'Pick a cause, find a local NGO, and commit to a regular slot rather than one-off visits.', 'Six months with the same organisation.'],
    ['speak', 'Public speaking', 'social', 'speak', 0, 600, 2, 1, 2, 'in', [3, 3, 3, 1], 'Toastmasters clubs meet across India. Speaking well makes you better at work, at weddings and in life.', 'Visit a Toastmasters club as a guest. Give your first prepared speech within a month.', 'Speak for five minutes to a room without notes.'],
    ['mech', 'Bike & car basics', 'useful', 'mech', 2000, 200, 2, 2, 0, 'out', [2, 3, 2, 1], 'Fix a puncture, change a tyre, adjust brakes, check fluids. Saves money and roadside panic.', 'A basic toolkit and a tyre-repair kit. Watch a video, then do it yourself on your own bike or car.', 'Change a tyre in under fifteen minutes.'],
    ['firstaid', 'First aid & CPR', 'useful', 'firstaid', 1500, 0, 1, 1, 2, 'in', [2, 3, 2, 1], 'The skill you hope never to use. A weekend course could one day let you save a life.', 'Book a certified first-aid and CPR course. Keep a proper first-aid kit at home and in the car.', 'A certificate, renewed every two years.'],
    ['diy', 'Home repairs', 'useful', 'diy', 3000, 300, 2, 2, 0, 'in', [2, 3, 2, 1], 'Taps, switches, shelves, sealant, a wobbly chair. Be the man who fixes it instead of waiting for someone.', 'A drill, screwdrivers, pliers, a tester and a spirit level. Start with one small job that\'s been annoying you.', 'Mount a TV or shelf perfectly level.'],
  ].map(([id, name, cat, ic, start, monthly, hrs, energy, social, place, sc, why, how, goal]) => ({ id, name, cat, ic, start, monthly, hrs, energy, social, place, I: sc[0], U: sc[1], A: sc[2], Hh: sc[3], why, how, goal, perHr: Math.round((start + monthly * 12) / (hrs * 48)) }));
  const byId = Object.fromEntries(H.map((h) => [h.id, h]));
  const col = (h) => CAT[h.cat].c;

  /* ═════════ HERO: pegboard objects + ticker ═════════ */
  (() => {
    const orbit = $('#orbit'); if (!orbit) return;
    const picks = [['guitar', 9, 22], ['cook', 88, 20], ['chess', 14, 74], ['trek', 86, 72], ['photo', 6, 48], ['read', 94, 46], ['run', 27, 12], ['coffee', 73, 10], ['box', 24, 88], ['stars', 76, 88]];
    const narrow = innerWidth < 700; const NP = [[12, 10], [88, 14], [10, 88], [90, 86]]; let nk = 0;
    picks.forEach(([id, x, y], i) => {
      if (narrow && (i % 2 || nk >= NP.length)) return;
      const h = byId[id]; const d = el('div', 'ob float', icon(h.ic, col(h)));
      const np = narrow ? NP[nk++] : [x, y]; d.style.left = np[0] + '%'; d.style.top = np[1] + '%';
      d.style.setProperty('--c', col(h)); d.style.setProperty('--r', ((i % 3) - 1) * 9 + 'deg'); d.style.setProperty('--d', (.5 + i * .12) + 's');
      d.dataset.depth = (.2 + (i % 4) * .15).toFixed(2);
      orbit.append(d);
    });
    // clock ticks
    const tk = $('.clock-o .ticks'); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; tk.append(sv('line', { x1: 50 + Math.sin(a) * 32, y1: 50 - Math.cos(a) * 32, x2: 50 + Math.sin(a) * 36, y2: 50 - Math.cos(a) * 36 })); }
    // parallax on scroll and pointer
    const obs = $$('.ob', orbit); let mx = 0, my = 0;
    const apply = () => { const s = scrollY; obs.forEach((o) => { const k = +o.dataset.depth; o.style.marginTop = (-s * k * .6 + my * k * 30) + 'px'; o.style.marginLeft = (mx * k * 30) + 'px'; }); };
    if (!RM) { addEventListener('scroll', apply, { passive: true }); $('.hero').addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; apply(); }); }
    const t = $('#ticker'); const names = H.map((h) => `<span>${h.name}</span>`).join(''); t.innerHTML = names + names;
  })();

  /* ═════════ 1. RECLAIM ═════════ */
  (() => {
    const r = $('#rc'); if (!r) return;
    const M = [[20, 'Reasonably competent at almost any new skill', 'sketch'], [40, 'Cook a dozen dishes without a recipe', 'cook'], [60, 'Play ten songs on the guitar', 'guitar'], [100, 'Go from the sofa to running a 10K', 'run'], [150, 'Read about twenty books', 'read'], [200, 'Hold simple conversations in a new language', 'lang'], [300, 'Beat most casual chess players', 'chess'], [400, 'A portfolio of photos worth framing', 'photo']];
    const list = $('#rc-list');
    M.forEach(([h, t, ic]) => { const hb = byId[ic]; const d = el('div', 'rc-i', `${icon(hb.ic, col(hb))}<span><b>${h} hours</b>${t}</span>`); d.style.setProperty('--c', col(hb)); d.dataset.h = h; list.append(d); });
    const upd = () => { const m = +r.value, hrs = Math.round(m * 365 / 60); $('#rc-v').textContent = m; $('#rc-h').textContent = hrs; $$('.rc-i', list).forEach((d) => d.classList.toggle('on', +d.dataset.h <= hrs)); };
    r.oninput = upd; upd();
  })();

  /* ═════════ 2. PORTFOLIO RADAR ═════════ */
  (() => {
    const svg = $('#pf-svg'); if (!svg) return;
    const axes = ['body', 'hands', 'mind', 'social', 'useful'];
    const cx = 160, cy = 150, R = 105;
    const pt = (i, v) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
    [.25, .5, .75, 1].forEach((k) => svg.append(sv('polygon', { points: axes.map((_, i) => pt(i, k).join(',')).join(' '), fill: 'none', stroke: '#3a332c', 'stroke-width': 1 })));
    axes.forEach((a, i) => { const [x, y] = pt(i, 1); svg.append(sv('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: '#3a332c' })); const [lx, ly] = pt(i, 1.2); const t = sv('text', { x: lx, y: ly + 4, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: CAT[a].c, 'font-family': 'Space Mono' }); t.textContent = CAT[a].n.toUpperCase(); svg.append(t); });
    const area = sv('polygon', { points: axes.map(() => `${cx},${cy}`).join(' '), fill: 'rgb(255 194 41 / .28)', stroke: '#ffc229', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }); area.style.transition = 'all .6s cubic-bezier(.3,1.5,.5,1)'; svg.append(area);
    const dots = axes.map((a) => { const c = sv('circle', { cx, cy, r: 5, fill: CAT[a].c, stroke: '#1a1714', 'stroke-width': 2 }); c.style.transition = 'all .6s cubic-bezier(.3,1.5,.5,1)'; svg.append(c); return c; });
    const chips = $('#pf-chips'); const sel = new Set(store.get('lrn-hobby-portfolio', []).filter((id) => byId[id]));
    H.forEach((h) => { const b = el('button', 'chip', `<i></i>${h.name}`); b.style.setProperty('--c', col(h)); b.dataset.id = h.id; b.setAttribute('aria-pressed', 'false'); b.onclick = () => { sel.has(h.id) ? sel.delete(h.id) : sel.size < 5 && sel.add(h.id); store.set('lrn-hobby-portfolio', [...sel]); upd(); }; chips.append(b); });
    const upd = () => {
      const score = Object.fromEntries(axes.map((a) => [a, 0]));
      sel.forEach((id) => { const h = byId[id]; score[h.cat] += 1; if (h.U >= 3 && h.cat !== 'useful') score.useful += .5; if (h.Hh >= 3 && h.cat !== 'body') score.body += .5; if (h.social === 2 && h.cat !== 'social') score.social += .5; });
      const v = axes.map((a) => clamp(score[a] / 1.5, 0, 1) * .92 + .06);
      area.setAttribute('points', v.map((k, i) => pt(i, k).join(',')).join(' '));
      dots.forEach((d, i) => { const [x, y] = pt(i, v[i]); d.setAttribute('cx', x); d.setAttribute('cy', y); });
      $$('.chip', chips).forEach((b) => { const on = sel.has(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.disabled = !on && sel.size >= 5; });
      const miss = axes.filter((a) => score[a] === 0).map((a) => CAT[a].n.toLowerCase());
      $('#pf-note').innerHTML = !sel.size ? 'Pick a few to begin.' : miss.length === 0 ? '<b style="color:#ffc229">A beautifully balanced spread.</b> You\'re the most interesting man at the table.' : `Missing: <b style="color:#ffc229">${miss.join(', ')}</b>. ${miss.length <= 2 ? 'One more hobby would round you out.' : 'Plenty of room to grow.'}`;
    };
    upd();
    bindTip(svg, () => 'Each hobby counts fully toward its own type, and half toward body, social or useful if it\'s strong there too.');
  })();

  /* ═════════ 3. FINDER ═════════ */
  (() => {
    const body = $('#finder-body'); if (!body) return;
    const Q = [
      ['What do you want more of in your life?', [['💪', 'A fitter, stronger body', { cat: 'body' }], ['🛠', 'Making things with my hands', { cat: 'hands' }], ['🧠', 'A sharper, calmer mind', { cat: 'mind' }], ['🤝', 'New people and better friendships', { cat: 'social' }], ['🔧', 'Being genuinely handy', { cat: 'useful' }]]],
      ['How much do you want to sweat?', [['🛋', 'Not at all, keep it calm', { energy: 1 }], ['🚶', 'A little movement is nice', { energy: 2 }], ['🔥', 'Wreck me', { energy: 3 }]]],
      ['Alone or with people?', [['🎧', 'Alone time, please', { social: 0 }], ['↔', 'Either works', { social: 1 }], ['🎉', 'The more the merrier', { social: 2 }]]],
      ['What can you spend to get started?', [['🪙', 'Under ₹1,000', { budget: 1000 }], ['💵', 'Up to ₹5,000', { budget: 5000 }], ['💳', 'Up to ₹20,000', { budget: 20000 }]]],
      ['Indoors or outdoors?', [['🏠', 'Indoors', { place: 'in' }], ['🌄', 'Outdoors', { place: 'out' }], ['🌗', 'Don\'t mind', { place: 'any' }]]],
      ['Above all, it should make me more…', [['✨', 'Interesting', { stat: 'I' }], ['🧰', 'Useful', { stat: 'U' }], ['😎', 'Attractive', { stat: 'A' }], ['❤', 'Healthy', { stat: 'Hh' }]]],
    ];
    let i = 0, ans = {};
    const step = () => {
      if (i >= Q.length) return result();
      const [q, opts] = Q[i];
      body.innerHTML = `<p class="fd-step">Question ${i + 1} of ${Q.length}</p><div class="fd-dots">${Q.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div><h3 class="fd-q">${q}</h3><div class="fd-opts">${opts.map((o, k) => `<button class="fd-opt" style="animation-delay:${k * 60}ms" data-k="${k}"><span class="em" aria-hidden="true">${o[0]}</span>${o[1]}</button>`).join('')}</div>`;
      $$('.fd-opt', body).forEach((b) => b.onclick = () => { Object.assign(ans, opts[+b.dataset.k][2]); i++; step(); });
    };
    const result = () => {
      const scored = H.map((h) => {
        let s = 0;
        if (h.cat === ans.cat) s += 6;
        s -= Math.abs(h.energy - ans.energy) * 2;
        s -= ans.social === 1 ? 0 : Math.abs(h.social - ans.social) * 1.6;
        if (h.start > ans.budget) s -= 12;
        if (ans.place !== 'any' && h.place !== 'both' && h.place !== ans.place) s -= 3;
        s += h[ans.stat] * 2;
        s += (h.I + h.U + h.A + h.Hh) * .25;
        return { h, s };
      }).sort((a, b) => b.s - a.s).slice(0, 3);
      body.innerHTML = `<p class="fd-step">Your top three</p><h3 class="fd-q">Try these first</h3><div class="fd-res">${scored.map(({ h }, k) => `<div class="fd-card" style="--c:${col(h)}"><span class="rank">#${k + 1}</span>${icon(h.ic, col(h))}<h4>${h.name}</h4><p>${h.why}</p><span class="cost">Start: ${inr(h.start)}</span></div>`).join('')}</div><button class="btn" id="fd-again">Take it again</button> <a class="btn ghost" href="#ch-catalogue" style="text-decoration:none">See all 29</a>`;
      $('#fd-again').onclick = () => { i = 0; ans = {}; step(); };
    };
    step();
  })();

  /* ═════════ 4. CATALOGUE ═════════ */
  (() => {
    const grid = $('#cat-grid'); if (!grid) return;
    const dlg = $('#drawer'), din = $('#dr-in');
    let cat = 'all', sort = 'cost';
    const stars = (h) => '★'.repeat(h.A) + '☆'.repeat(3 - h.A);
    const render = () => {
      let list = H.filter((h) => cat === 'all' || h.cat === cat);
      list = list.sort(sort === 'name' ? (a, b) => a.name.localeCompare(b.name) : sort === 'cool' ? (a, b) => (b.A * 10 + b.I) - (a.A * 10 + a.I) : (a, b) => a.start - b.start || a.monthly - b.monthly);
      grid.innerHTML = '';
      list.forEach((h, k) => {
        const b = el('button', 'hc enter', `<span class="hc-cat">${CAT[h.cat].n}</span>${icon(h.ic, col(h))}<h3>${h.name}</h3><p>${h.why.split('. ')[0]}.</p><span class="hc-meta"><span class="price">${inr(h.start)}</span><span class="stars" title="Attractiveness">${stars(h)}</span></span>`);
        b.style.setProperty('--c', col(h)); b.style.animationDelay = Math.min(k, 12) * 35 + 'ms';
        b.setAttribute('aria-label', `${h.name}. Starting cost ${inr(h.start)}. Open details.`);
        b.onclick = () => open(h); grid.append(b);
      });
    };
    const barRow = (label, v) => `<div class="dr-bar"><span>${label}</span><i style="--w:${v / 3 * 100}%"></i></div>`;
    const open = (h) => {
      dlg.style.setProperty('--c', col(h));
      din.innerHTML = `<button class="dr-x" aria-label="Close">✕</button><div class="dr-top">${icon(h.ic, col(h))}<div><span class="hc-cat" style="--c:${col(h)};font:700 .62rem var(--mono);letter-spacing:.12em;text-transform:uppercase;background:var(--c);padding:.2rem .45rem;border-radius:4px;border:1.5px solid var(--ink)">${CAT[h.cat].n}</span><h3 id="dr-title">${h.name}</h3></div></div>
        <p>${h.why}</p>
        <div class="dr-stats"><div><small>To start</small><b>${inr(h.start)}</b></div><div><small>Monthly</small><b>${h.monthly ? inr(h.monthly) : '₹0'}</b></div><div><small>Per week</small><b>${h.hrs} hrs</b></div></div>
        <div class="dr-bars" style="--c:${col(h)}">${barRow('Interesting', h.I)}${barRow('Useful', h.U)}${barRow('Attractive', h.A)}${barRow('Healthy', h.Hh)}</div>
        <h4>Start this weekend</h4><p>${h.how}</p><h4>First milestone</h4><p>${h.goal}</p>`;
      $('.dr-x', din).onclick = () => dlg.close();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    };
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    $$('#cat-ctl [data-c]').forEach((b) => b.onclick = () => { cat = b.dataset.c; $$('#cat-ctl [data-c]').forEach((x) => x.classList.toggle('on', x === b)); render(); });
    $$('#cat-ctl [data-s]').forEach((b) => b.onclick = () => { sort = b.dataset.s; $$('#cat-ctl [data-s]').forEach((x) => x.classList.toggle('on', x === b)); render(); });
    render();
  })();

  /* ═════════ 5. DISHES ═════════ */
  (() => {
    const g = $('#dish-grid'); if (!g) return;
    const D = [['🍳', 'Breakfast', 'A perfect omelette', 'or masala scrambled eggs, soft and seasoned'], ['🍛', 'Everyday', 'Dal and rice', 'the backbone of a thousand weeknight dinners'], ['🍝', 'Date night', 'A proper pasta', 'cacio e pepe or aglio olio: five ingredients, real technique'], ['🍗', 'Showpiece', 'A roast or a curry', 'one impressive dish you can make for six'], ['🍰', 'Dessert', 'One sweet thing', 'kheer, a chocolate mousse or a simple cake']];
    const K = 'lrn-hobby-dishes'; const done = new Set(store.get(K, []));
    D.forEach((d, i) => { const l = el('label', 'dish', `<input type="checkbox" ${done.has(i) ? 'checked' : ''}><span class="plate" aria-hidden="true">${d[0]}</span><small>${d[1]}</small><b>${d[2]}</b><span>${d[3]}</span>`); l.querySelector('input').onchange = (e) => { e.target.checked ? done.add(i) : done.delete(i); store.set(K, [...done]); upd(); }; g.append(l); });
    const upd = () => { const n = done.size; $('#dish-bar').style.width = n / 5 * 100 + '%'; $('#dish-n').innerHTML = n === 0 ? 'Tick a dish when you can cook it well, without a recipe.' : n < 5 ? `<b>${n} of 5.</b> ${5 - n} to go.` : '<b>All five.</b> You can feed yourself, a date and a crowd. Time to host.'; };
    upd();
  })();

  /* ═════════ 6. GUITAR (Karplus–Strong) ═════════ */
  (() => {
    const row = $('#ch-row'); if (!row) return;
    const OPEN = [82.41, 110, 146.83, 196, 246.94, 329.63];
    const CH = { G: [3, 2, 0, 0, 3, 3], D: [-1, -1, 0, 2, 3, 2], Em: [0, 2, 2, 0, 0, 0], C: [-1, 3, 2, 0, 1, 0], Am: [-1, 0, 2, 2, 1, 0] };
    let ac = null;
    const ctx = () => { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); } if (ac.state === 'suspended') ac.resume(); return ac; };
    const pluck = (f, when, vol = .5) => {
      const a = ctx(); if (!a) return;
      const sr = a.sampleRate, dur = 2.2, N = Math.round(sr / f), buf = a.createBuffer(1, Math.round(sr * dur), sr), d = buf.getChannelData(0);
      const ring = new Float32Array(N); for (let k = 0; k < N; k++) ring[k] = Math.random() * 2 - 1;
      let p = 0; for (let k = 0; k < d.length; k++) { const nx = (p + 1) % N; const v = (ring[p] + ring[nx]) * .4985; d[k] = ring[p]; ring[p] = v; p = nx; }
      const s = a.createBufferSource(); s.buffer = buf; const g = a.createGain(); g.gain.value = vol; const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      s.connect(lp).connect(g).connect(a.destination); s.start(a.currentTime + when);
    };
    const strum = (name, card) => {
      CH[name].forEach((fr, k) => { if (fr >= 0) pluck(OPEN[k] * Math.pow(2, fr / 12), k * .028, .32); });
      if (card) { card.classList.remove('hit'); void card.offsetWidth; card.classList.add('hit'); setTimeout(() => card.classList.remove('hit'), 700); }
    };
    const diagram = (frets) => {
      let s = '<svg viewBox="0 0 70 84" aria-hidden="true"><rect x="10" y="12" width="50" height="3" fill="#cfc4b3"/>';
      for (let f = 1; f <= 4; f++) s += `<line x1="10" x2="60" y1="${14 + f * 16}" y2="${14 + f * 16}" stroke="#4d4640"/>`;
      frets.forEach((fr, k) => { const x = 10 + k * 10; s += `<line class="str" x1="${x}" x2="${x}" y1="14" y2="78"/>`; if (fr === -1) s += `<text x="${x}" y="9" text-anchor="middle" font-size="8" fill="#998d7d">×</text>`; else if (fr === 0) s += `<circle cx="${x}" cy="6" r="2.6" fill="none" stroke="#cfc4b3"/>`; else s += `<circle cx="${x}" cy="${14 + fr * 16 - 8}" r="4.2" fill="#ff4f8b" stroke="#1a1714"/>`; });
      return s + '</svg>';
    };
    const cards = {};
    Object.keys(CH).forEach((n) => { const b = el('button', 'chord', `<b>${n}</b>${diagram(CH[n])}`); b.setAttribute('aria-label', `Strum ${n} chord`); b.onclick = () => strum(n, b); cards[n] = b; row.append(b); });
    let playing = false;
    $('#prog-go').onclick = async () => {
      if (playing) return; playing = true; const seq = ['G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C'];
      for (const n of seq) { strum(n, cards[n]); await new Promise((r) => setTimeout(r, 900)); }
      playing = false;
    };
  })();

  /* ═════════ 7. C25K ═════════ */
  (() => {
    const g = $('#ck-grid'); if (!g) return;
    const P = ['Run 1 min, walk 1.5 min ×8', 'Run 1.5 min, walk 2 min ×6', 'Run 1.5 & 3 min, walk between ×2', 'Run 3 & 5 min, walk between ×2', 'Run 5 min ×3, then 8 ×2, then 20 min', 'Run 5–10 min sets, then 25 min', 'Run 25 min', 'Run 28 min', 'Run 30 min'];
    const K = 'lrn-hobby-c25k'; const done = new Set(store.get(K, []));
    P.forEach((p, w) => { const r = el('div', 'ck-row', `<span>Week ${w + 1}</span>`); for (let d = 0; d < 3; d++) { const id = `${w}-${d}`; const b = el('button', 'ck-b' + (done.has(id) ? ' on' : ''), `Run ${d + 1}`); b.setAttribute('aria-pressed', done.has(id)); b.onclick = () => { done.has(id) ? done.delete(id) : done.add(id); b.classList.toggle('on'); b.setAttribute('aria-pressed', done.has(id)); store.set(K, [...done]); upd(); }; r.append(b); } r.append(el('span', 'plan-t', p)); g.append(r); });
    const upd = () => { $('#ck-n').textContent = `${done.size} of 27 runs${done.size === 27 ? ' · you run 5K now 🎉' : ''}`; };
    $('#ck-reset').onclick = () => { done.clear(); store.set(K, []); $$('.ck-b', g).forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', false); }); upd(); };
    upd();
  })();

  /* ═════════ 8. LADDER ═════════ */
  (() => {
    const lad = $('#lad'); if (!lad) return;
    const L = [['Wall push-ups', 'Hands on a wall, body straight', 'Everyone starts somewhere, and this is a fine place.'], ['Incline push-ups', 'Hands on a table or bench', 'Lower the incline as you get stronger.'], ['Knee push-ups', 'Full range, hips in line', 'Don\'t let your hips sag; tight core.'], ['Full push-ups', 'Chest to fist height, elbows at 45°', 'The classic. Aim for three sets of fifteen.'], ['Diamond push-ups', 'Hands close, under the chest', 'Hits triceps hard. You\'re getting genuinely strong.'], ['Archer push-ups', 'One arm does most of the work', 'Halfway to a one-arm push-up.'], ['One-arm push-up', 'Feet wide, everything braced', 'Party trick territory. Most people never get here.']];
    const K = 'lrn-hobby-ladder'; let cur = store.get(K, -1);
    L.forEach((l, i) => { const b = el('button', 'rung', `<span class="rn">${String(i + 1).padStart(2, '0')}</span><span>${l[0]}</span><small>${l[1]}</small>`); b.style.setProperty('--i', i); b.onclick = () => { cur = i; store.set(K, cur); upd(); }; lad.append(b); });
    const upd = () => { $$('.rung', lad).forEach((b, i) => { b.classList.toggle('done', i < cur); b.classList.toggle('cur', i === cur); b.setAttribute('aria-pressed', i === cur); }); $('#lad-out').innerHTML = cur < 0 ? 'Tap the hardest one you can do for three clean sets of eight.' : `<b>${L[cur][0]}.</b> ${L[cur][2]} ${cur < L.length - 1 ? `Next rung: <b>${L[cur + 1][0].toLowerCase()}</b>.` : ''}`; };
    upd();
  })();

  /* ═════════ 9. CHESS: mate in one ═════════ */
  (() => {
    const board = $('#board'); if (!board) return;
    const START = { g1: 'wK', a1: 'wR', c4: 'wB', f2: 'wP', g2: 'wP', h2: 'wP', b3: 'wP', g8: 'bK', f7: 'bP', g7: 'bP', h7: 'bP', h5: 'bN', b6: 'bP', c6: 'bP' };
    const G = { K: '♚', R: '♜', B: '♝', N: '♞', P: '♟', Q: '♛' };
    let pos, sel = null, solved = false;
    const files = 'abcdefgh';
    const sq = (f, r) => files[f] + (r + 1);
    const fr = (s) => [files.indexOf(s[0]), +s[1] - 1];
    const moves = (from) => {
      const p = pos[from]; if (!p || p[0] !== 'w') return [];
      const [f, r] = fr(from), out = [], t = p[1];
      const add = (ff, rr) => { if (ff < 0 || ff > 7 || rr < 0 || rr > 7) return false; const s = sq(ff, rr); if (pos[s] && pos[s][0] === 'w') return false; out.push(s); return !pos[s]; };
      const ray = (df, dr) => { let ff = f + df, rr = r + dr; while (add(ff, rr)) { ff += df; rr += dr; } };
      if (t === 'R') [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => ray(a, b));
      if (t === 'B') [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => ray(a, b));
      if (t === 'K') for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) add(f + a, r + b);
      if (t === 'P') { if (!pos[sq(f, r + 1)]) { out.push(sq(f, r + 1)); if (r === 1 && !pos[sq(f, r + 2)]) out.push(sq(f, r + 2)); } [-1, 1].forEach((a) => { const s = f + a >= 0 && f + a < 8 ? sq(f + a, r + 1) : null; if (s && pos[s] && pos[s][0] === 'b') out.push(s); }); }
      return out;
    };
    const draw = () => {
      board.innerHTML = '';
      const tg = sel ? moves(sel) : [];
      for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) {
        const s = sq(f, r), p = pos[s];
        const b = el('button', 'sq' + ((f + r) % 2 === 0 ? ' d' : '') + (p && p[0] === 'w' ? ' w' : '') + (s === sel ? ' sel' : '') + (tg.includes(s) ? ' tgt' : ''), p ? G[p[1]] : '');
        b.dataset.s = s; b.setAttribute('aria-label', s + (p ? ` ${p[0] === 'w' ? 'white' : 'black'} ${({ K: 'king', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' })[p[1]]}` : ''));
        if (f === 0) b.append(el('span', 'co', r + 1)); if (r === 0 && f) b.append(el('span', 'co', files[f]));
        b.onclick = () => click(s); board.append(b);
      }
    };
    const msg = (h) => { $('#chess-msg').innerHTML = h; };
    const click = (s) => {
      if (solved) return;
      if (sel && moves(sel).includes(s)) {
        const from = sel; sel = null;
        if (from === 'a1' && s === 'a8') { pos.a8 = 'wR'; delete pos.a1; solved = true; draw(); $(`[data-s="g8"]`, board).classList.add('mate'); msg('<b>Checkmate! Ra8#.</b> The classic back-rank mate: the black king is boxed in by its own pawns, and nothing can block or capture the rook.'); return; }
        const fb = from === 'c4' && s === 'f7' ? 'Check, but the king simply takes the bishop. Look for a check it can\'t escape.' : 'Not mate. Look at the black king\'s escape squares. Which ones are blocked by its own pieces?';
        const cell = $(`[data-s="${s}"]`, board); cell.classList.add('bad'); setTimeout(() => cell.classList.remove('bad'), 400); msg(fb); draw(); return;
      }
      sel = pos[s] && pos[s][0] === 'w' ? s : null; draw();
    };
    const reset = () => { pos = { ...START }; sel = null; solved = false; draw(); msg('White to move. Find the checkmate.'); };
    $('#chess-hint').onclick = () => msg('Hint: the black king is stuck on its back rank behind three pawns. Which white piece can reach that rank?');
    $('#chess-reset').onclick = reset; reset();
  })();

  /* ═════════ 10. BOOKS ═════════ */
  (() => {
    const r = $('#bk'); if (!r) return;
    const shelf = $('#shelf'); const cols = ['#ff6b35', '#00a39a', '#3b5bdb', '#ff4f8b', '#ffc229', '#cfc4b3'];
    const upd = () => {
      const p = +r.value, books = Math.round(p * 365 / 300); $('#bk-v').textContent = p;
      shelf.innerHTML = ''; for (let k = 0; k < books; k++) { const i = el('i'); i.style.setProperty('--c', cols[(k * 7) % cols.length]); i.style.setProperty('--k', k); i.style.height = (54 + ((k * 37) % 30)) + 'px'; shelf.append(i); }
      $('#bk-out').innerHTML = `<b>${books} books</b> a year, at about 300 pages each. That's roughly ${Math.round(p * 1.5)} minutes a day: one commute, or the time before bed you'd otherwise spend scrolling.`;
    };
    r.oninput = upd; reveal(r.closest('.widget'), upd);
  })();

  /* ═════════ 11. VIEWFINDER ═════════ */
  (() => {
    const svg = $('#vf'); if (!svg) return;
    const W = 600, Hh = 400;
    svg.innerHTML = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2a6b"/><stop offset=".55" stop-color="#ff6b35"/><stop offset="1" stop-color="#ffc229"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00a39a"/><stop offset="1" stop-color="#0b3b4a"/></linearGradient><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#1a1714" opacity=".18"/></pattern></defs>
      <rect width="${W}" height="${Hh}" fill="url(#sky)"/><g id="sun"><circle r="38" fill="#fff2c6" opacity=".95"/><circle r="56" fill="#fff2c6" opacity=".2"/></g>
      <rect id="seaR" x="0" width="${W}" fill="url(#sea)"/><path id="sand" fill="#f1d9a8"/><rect width="${W}" height="${Hh}" fill="url(#dots)"/>
      <g id="glint" opacity=".5"></g>
      <g class="fig" id="fig"><ellipse cx="0" cy="2" rx="20" ry="4.5" fill="#000" opacity=".28"/><g fill="#1a1714" stroke="#1a1714" stroke-linecap="round" stroke-linejoin="round"><circle cx="0" cy="-60" r="7.5"/><path d="M-8-50h16l3 22H-11z" stroke-width="2"/><path d="M-5-29l-2 29M5-29l3 29" stroke-width="6" fill="none"/><path d="M-9-48l-8 18M9-48l7 17" stroke-width="5" fill="none"/></g><rect x="-30" y="-75" width="60" height="80" fill="transparent"/></g>
      <g id="grid" stroke="#fff" stroke-width="1.5" opacity=".75" stroke-dasharray="6 6"><line x1="200" x2="200" y1="0" y2="400"/><line x1="400" x2="400" y1="0" y2="400"/><line y1="133.3" y2="133.3" x1="0" x2="600"/><line y1="266.7" y2="266.7" x1="0" x2="600"/></g>
      <g id="hot" fill="none" stroke="#ffc229" stroke-width="3"></g>`;
    const sand = $('#sand', svg), fig = $('#fig', svg), seaR = $('#seaR', svg), sun = $('#sun', svg), glint = $('#glint', svg), hot = $('#hot', svg), grid = $('#grid', svg);
    [[200, 133.3], [400, 133.3], [200, 266.7], [400, 266.7]].forEach(([x, y]) => hot.append(sv('circle', { cx: x, cy: y, r: 10, opacity: 0 })));
    let fx = 300, fy = 330, hz = 200;
    const upd = () => {
      seaR.setAttribute('y', hz); seaR.setAttribute('height', Hh - hz);
      sun.setAttribute('transform', `translate(${470} ${hz - 30})`);
      glint.innerHTML = ''; for (let k = 0; k < 6; k++) glint.append(sv('rect', { x: 470 - 30 + k * 4 - (k % 2) * 8, y: hz + 8 + k * 12, width: 60 - k * 8, height: 2.5, fill: '#fff2c6', rx: 1 }));
      const st = hz + (Hh - hz) * .45; sand.setAttribute('d', `M0 ${st + 14} Q 150 ${st - 6} 300 ${st + 6} T 600 ${st} V ${Hh} H 0 Z`); fy = clamp(fy, st + 30, 392); fig.setAttribute('transform', `translate(${fx} ${fy}) scale(${.75 + (fy - hz) / 500})`);
      const cx = fx, cy = fy - 30;
      const pts = [[200, 133.3], [400, 133.3], [200, 266.7], [400, 266.7]];
      const near = pts.map(([x, y], k) => ({ k, d: Math.hypot(cx - x, cy - y) })).sort((a, b) => a.d - b.d)[0];
      $$('circle', hot).forEach((c, k) => c.setAttribute('opacity', k === near.k && near.d < 60 ? 1 : 0));
      const hzOk = Math.abs(hz - 133.3) < 22 || Math.abs(hz - 266.7) < 22, centre = Math.abs(cx - 300) < 40;
      $('#vf-out').innerHTML = near.d < 60 && hzOk ? '<b>That\'s a composed photograph.</b> Subject on a thirds intersection, horizon on a thirds line. The eye has somewhere to travel.' : near.d < 60 ? 'The figure sits nicely on a thirds point. Now move the horizon onto a third: more sky for drama, more sea for depth.' : centre ? 'Dead centre feels static, like a passport photo. Try dragging the figure towards one of the grid intersections.' : hzOk ? 'Good horizon. Now drag the figure onto one of the four intersections.' : 'Drag the figure towards an intersection, and set the horizon on a grid line rather than across the middle.';
    };
    const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * Hh]; };
    let drag = false;
    fig.addEventListener('pointerdown', (e) => { drag = true; fig.setPointerCapture(e.pointerId); e.preventDefault(); });
    fig.addEventListener('pointermove', (e) => { if (!drag) return; const [x, y] = toSvg(e); fx = clamp(x, 20, 580); fy = y + 30; upd(); });
    fig.addEventListener('pointerup', () => { drag = false; });
    svg.addEventListener('keydown', () => {});
    $('#hz').oninput = (e) => { hz = +e.target.value; upd(); };
    const gt = $('#grid-t'); gt.onclick = () => { const on = gt.getAttribute('aria-pressed') !== 'true'; gt.setAttribute('aria-pressed', on); gt.textContent = on ? 'Grid on' : 'Grid off'; grid.style.display = on ? '' : 'none'; };
    upd();
  })();

  /* ═════════ 12. CPR METRONOME ═════════ */
  (() => {
    const heart = $('#cpr-heart'); if (!heart) return;
    let ac = null, timer = 0, n = 0, taps = [];
    const click = () => {
      try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = n % 30 === 29 ? 1320 : 880; g.gain.setValueAtTime(.25, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .08); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + .09); } catch (e) { /* no audio */ }
      n++; $('#cpr-n').textContent = ((n - 1) % 30) + 1; heart.classList.remove('beat'); void heart.offsetWidth; heart.classList.add('beat');
    };
    const go = $('#cpr-go');
    go.onclick = () => { if (timer) { clearInterval(timer); timer = 0; go.textContent = 'Start the beat'; return; } n = 0; click(); timer = setInterval(click, 60000 / 110); go.textContent = 'Stop'; };
    $('#cpr-tap').onclick = () => {
      const t = performance.now(); taps.push(t); taps = taps.filter((x) => t - x < 4000);
      heart.classList.remove('beat'); void heart.offsetWidth; heart.classList.add('beat');
      if (taps.length < 4) { $('#cpr-fb').textContent = 'Keep tapping…'; return; }
      const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1), bpm = Math.round(60000 / iv);
      $('#cpr-fb').textContent = bpm < 100 ? `${bpm} per minute: a little faster.` : bpm > 120 ? `${bpm} per minute: slightly too fast, ease off.` : `${bpm} per minute: that's the rhythm. Push hard, let the chest come back up.`;
    };
  })();

  /* ═════════ 13. COST PER HOUR CHART ═════════ */
  (() => {
    const svg = $('#cost-svg'); if (!svg) return;
    const data = [...H].sort((a, b) => a.perHr - b.perHr);
    const rowH = 22, T = 30, L = 170, R = 600, Hh = T + data.length * rowH + 30;
    svg.setAttribute('viewBox', `0 0 640 ${Hh}`);
    const max = 260, x = (v) => L + (R - L) * Math.min(v, max) / max;
    [0, 50, 100, 150, 200, 250].forEach((t) => { svg.append(sv('line', { x1: x(t), x2: x(t), y1: T - 6, y2: Hh - 26, stroke: '#e6d9c2' })); const tx = sv('text', { x: x(t), y: Hh - 10, 'text-anchor': 'middle', 'font-size': 11, fill: '#807468' }); tx.textContent = '₹' + t; svg.append(tx); });
    // reference: a multiplex film
    const ref = 175;
    svg.append(sv('line', { x1: x(ref), x2: x(ref), y1: T - 14, y2: Hh - 26, stroke: '#1a1714', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    const rt = sv('text', { x: x(ref) + 6, y: T - 10, 'font-size': 11, 'font-weight': 700, fill: '#1a1714' }); rt.textContent = 'a multiplex film ≈ ₹175/hr'; svg.append(rt);
    const bars = data.map((h, i) => {
      const y = T + i * rowH;
      const lab = sv('text', { x: L - 10, y: y + 15, 'text-anchor': 'end', 'font-size': 12, 'font-weight': 600, fill: '#1a1714' }); lab.textContent = h.name; svg.append(lab);
      const r = sv('rect', { class: 'bar', x: L, y: y + 4, height: rowH - 8, width: 0, rx: 3, fill: '#d24a1c' }); r.style.transitionDelay = i * 25 + 'ms'; svg.append(r);
      const v = sv('text', { x: L + 6, y: y + 15, 'font-size': 11, 'font-weight': 700, fill: '#4d4640', 'font-family': 'Space Mono', opacity: 0 }); v.textContent = h.perHr === 0 ? 'free' : '₹' + h.perHr; v.style.transition = `opacity .4s ${.6 + i * .025}s`; svg.append(v);
      const hit = sv('rect', { x: 0, y, width: 640, height: rowH, fill: 'transparent' }); svg.append(hit);
      bindTip(hit, () => `<b>${h.name}</b><br>Start ${inr(h.start)} + ${inr(h.monthly)}/mo × 12<br>÷ ${h.hrs} hrs/wk × 48 wks = <b>${h.perHr === 0 ? 'free' : '₹' + h.perHr + '/hr'}</b>`);
      return { r, v, h };
    });
    reveal(svg.closest('.widget'), () => bars.forEach(({ r, v, h }) => { const w = Math.max(2, x(h.perHr) - L); r.setAttribute('width', w); v.setAttribute('x', L + w + 6); v.setAttribute('opacity', 1); }));
  })();

  /* ═════════ 14. LEARNING CURVE ═════════ */
  (() => {
    const svg = $('#curve-svg'); if (!svg) return;
    const L = 50, R = 610, T = 20, B = 250, maxH = 40;
    const f = (h) => { const v = 62 * (1 - Math.exp(-h / 4.5)) - 20 * Math.exp(-((h - 12) ** 2) / (2 * 3.2 ** 2)) + .9 * h; return clamp(v, 0, 100); };
    const X = (h) => L + (R - L) * h / maxH, Y = (v) => B - (B - T) * v / 100;
    // dip band
    svg.append(sv('rect', { x: X(8), y: T, width: X(17) - X(8), height: B - T, fill: 'rgb(255 79 139 / .12)' }));
    const bl = sv('text', { x: X(12.5), y: T + 16, 'text-anchor': 'middle', 'font-size': 11, fill: '#ff4f8b', 'font-family': 'Space Mono', 'font-weight': 700 }); bl.textContent = 'THE DIP'; svg.append(bl);
    svg.append(sv('line', { x1: L, x2: R, y1: B, y2: B, stroke: '#4d4640' })); svg.append(sv('line', { x1: L, x2: L, y1: T, y2: B, stroke: '#4d4640' }));
    [0, 10, 20, 30, 40].forEach((h) => { const t = sv('text', { x: X(h), y: B + 18, 'text-anchor': 'middle', 'font-size': 11, fill: '#998d7d', 'font-family': 'Space Mono' }); t.textContent = h + 'h'; svg.append(t); });
    const yl = sv('text', { x: 14, y: (T + B) / 2, 'font-size': 11, fill: '#998d7d', 'font-family': 'Space Mono', transform: `rotate(-90 14 ${(T + B) / 2})`, 'text-anchor': 'middle' }); yl.textContent = 'HOW GOOD YOU FEEL'; svg.append(yl);
    let d = ''; for (let h = 0; h <= maxH; h += .25) d += (h ? 'L' : 'M') + X(h).toFixed(1) + ' ' + Y(f(h)).toFixed(1);
    const path = sv('path', { d, fill: 'none', stroke: '#00a39a', 'stroke-width': 3, 'stroke-linecap': 'round' }); svg.append(path);
    const len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.style.transition = 'stroke-dashoffset 2s cubic-bezier(.2,.8,.1,1)';
    const vline = sv('line', { y1: T, y2: B, stroke: '#ffc229', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }); svg.append(vline);
    const dot = sv('circle', { r: 8, fill: '#ffc229', stroke: '#1a1714', 'stroke-width': 2.5 }); svg.append(dot);
    const S = [[3, 'The honeymoon', 'Everything is new and progress is fast. You learn the basic moves in an evening and feel great.'], [8, 'Reality arrives', 'You now know enough to see how bad you are. The gap between taste and skill opens up.'], [13, 'The dip', 'This is where most people quit. Progress feels invisible and practice feels like a chore. Keep going: it\'s temporary.'], [20, 'Competent', 'Around Kaufman\'s twenty hours: you can do the thing, imperfectly but genuinely. Others notice.'], [41, 'Hooked', 'Now the skill is fun in itself, and every hour adds something. This is where a hobby becomes part of who you are.']];
    const set = (h) => { h = clamp(h, 0, maxH); const x = X(h), y = Y(f(h)); dot.setAttribute('cx', x); dot.setAttribute('cy', y); vline.setAttribute('x1', x); vline.setAttribute('x2', x); const s = S.find((st) => h <= st[0]) || S[S.length - 1]; $('#curve-out').innerHTML = `<b>${Math.round(h)} hours · ${s[1]}.</b> ${s[2]}`; };
    const toH = (e) => { const r = svg.getBoundingClientRect(); return ((e.clientX - r.left) / r.width * 640 - L) / (R - L) * maxH; };
    let dn = false;
    svg.addEventListener('pointerdown', (e) => { dn = true; svg.setPointerCapture(e.pointerId); set(toH(e)); });
    svg.addEventListener('pointermove', (e) => { if (dn || e.pointerType === 'mouse') set(toH(e)); });
    svg.addEventListener('pointerup', () => { dn = false; });
    svg.tabIndex = 0; let kh = 13; svg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { kh = Math.min(maxH, kh + 1); set(kh); e.preventDefault(); } if (e.key === 'ArrowLeft') { kh = Math.max(0, kh - 1); set(kh); e.preventDefault(); } });
    set(13);
    reveal(svg.closest('.widget'), () => { path.style.strokeDashoffset = 0; });
  })();

  /* ═════════ 15. 30-DAY PLAN ═════════ */
  (() => {
    const days = $('#days'); if (!days) return;
    const sel = $('#pl-sel'); const K = 'lrn-hobby-30';
    const st = store.get(K, { h: 'guitar', d: [] });
    H.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((h) => { const o = el('option', '', h.name); o.value = h.id; sel.append(o); });
    sel.value = byId[st.h] ? st.h : 'guitar';
    const done = new Set(st.d);
    for (let k = 1; k <= 30; k++) { const b = el('button', 'day' + (done.has(k) ? ' on' : ''), k); b.setAttribute('aria-pressed', done.has(k)); b.setAttribute('aria-label', 'Day ' + k); b.onclick = () => { done.has(k) ? done.delete(k) : done.add(k); b.classList.toggle('on'); b.setAttribute('aria-pressed', done.has(k)); save(); }; days.append(b); }
    const save = () => { store.set(K, { h: sel.value, d: [...done] }); const n = done.size, h = byId[sel.value]; $('#pl-n').textContent = `${n} / 30 days`; $('#pl-msg').innerHTML = n === 0 ? `Day one of ${h.name.toLowerCase()}. ${h.how.split('. ')[0]}.` : n < 10 ? 'Good start. The first week is about showing up, not being good.' : n < 20 ? 'You\'re in the dip zone. This is exactly where most people quit. Don\'t.' : n < 30 ? 'Nearly there. It\'s starting to feel like part of who you are, isn\'t it?' : `<b>Thirty days.</b> You're officially a man who does ${h.name.toLowerCase()}. Next: ${h.goal.charAt(0).toLowerCase() + h.goal.slice(1)}`; };
    sel.onchange = save;
    $('#pl-reset').onclick = () => { done.clear(); $$('.day', days).forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', false); }); save(); };
    save();
  })();
})();

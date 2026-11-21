/* lrn — A Good Man */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };

  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', () => tip.classList.remove('show')); };

  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(n); };
  $$('.rv, .horizon').forEach((n) => reveal(n));

  /* progress, rail, hero parallax */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]'), media = $('#hero-media');
  chapters.forEach((c) => { const a = el('a', '', `<i></i><span>${c.dataset.rail}</span>`); a.href = '#' + c.id; rail.append(a); });
  const rl = $$('a', rail);
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const d = document.documentElement, y = scrollY;
    bar.style.width = (y / Math.max(1, d.scrollHeight - innerHeight) * 100).toFixed(2) + '%';
    rail.classList.toggle('show', y > innerHeight * .85);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur));
    rail.classList.toggle('on-dark', cur >= 0 && chapters[cur].classList.contains('dusk'));
    if (media && !RM && y < innerHeight * 1.2) media.style.transform = `translate3d(0, ${y * .35}px, 0) scale(${1 + y / innerHeight * .06})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* golden motes in the hero light */
  (() => {
    const c = $('#motes'); if (!c) return; const ctx = c.getContext('2d'); let w, h, dpr, P = [], run = true;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); P = Array.from({ length: Math.round(w / 22) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: .5 + Math.random() * 1.8, vx: .1 + Math.random() * .3, vy: -.05 - Math.random() * .15, a: .15 + Math.random() * .5, t: Math.random() * 6 })); };
    const draw = () => { if (!run) return; ctx.clearRect(0, 0, w, h); for (const p of P) { p.x += p.vx; p.y += p.vy + Math.sin(p.t) * .1; p.t += .015; if (p.x > w + 10) p.x = -10; if (p.y < -10) p.y = h + 10; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4); g.addColorStop(0, `rgba(255,214,170,${p.a * (.6 + .4 * Math.sin(p.t * 2))})`); g.addColorStop(1, 'rgba(255,214,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill(); } if (!RM) requestAnimationFrame(draw); };
    size(); draw(); addEventListener('resize', size);
    if (io) new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was && !RM) draw(); }).observe(c);
  })();

  /* ═════════ virtues ═════════ */
  (() => {
    const root = $('#virtues'); if (!root) return;
    const ICON = {
      integrity: '<path d="M8 40h32M14 40V20M24 40V20M34 40V20M6 20h36L24 8z"/>',
      courage: '<path d="M24 6c6 8 10 14 10 21a10 10 0 0 1-20 0c0-4 2-7 4-9 0 4 2 6 4 6 0-6-1-11 2-18z"/>',
      composure: '<path d="M6 30c6-6 12-6 18 0s12 6 18 0M6 20c6-6 12-6 18 0s12 6 18 0"/>',
      humility: '<path d="M24 8v32M14 18l10-10 10 10M10 40h28"/>',
      competence: '<path d="M30 8l10 10-18 18H12V26zM26 12l10 10"/>',
      care: '<path d="M24 40 9 25a8 8 0 0 1 15-11 8 8 0 0 1 15 11z"/>',
      discipline: '<circle cx="24" cy="24" r="16"/><path d="M24 14v10l7 5"/>',
      fairness: '<path d="M24 8v32M12 40h24M8 14h32M8 14l-4 12h10zM40 14l-4 12h10z"/>',
    };
    const V = [
      ['integrity', 'Integrity', 'Keep your word. If you’ll miss a commitment, tell the person early and give them an honest date.', 'You promised your sister you’d look at her CV this week. It’s Thursday. You either do it tonight, or text her now with a real new date.'],
      ['courage', 'Courage', 'Risk a little embarrassment to tell the truth, speak up, or ask someone for help.', 'In the meeting, everyone nods along to a plan you think will fail. You say, “Can I raise a concern?”'],
      ['composure', 'Composure', 'Take responsibility for your tone and actions, especially when you feel slighted.', 'A driver cuts you off and shouts. You let him go, and you don’t take it out on the person in the passenger seat.'],
      ['humility', 'Humility', 'Be willing to learn from someone junior to you and to change your mind in public.', 'A new hire points out a mistake in your work. You say, “Good catch, thank you,” and fix it.'],
      ['competence', 'Competence', 'Learn practical skills and use them to make yourself dependable at home, at work and in your community.', 'The geyser stops working. You figure out it’s the breaker, fix it, and show your flatmate how.'],
      ['care', 'Care', 'Notice what someone needs, ask what would help, and follow through after the moment has passed.', 'Your colleague mentioned her mother’s surgery on Monday. On Wednesday, you ask how it went.'],
      ['discipline', 'Discipline', 'Do what needs doing when you don’t feel like it, and build routines that make the right thing easier.', 'You said you’d train three times a week. It’s raining, you’re tired, and you go anyway, for twenty minutes.'],
      ['fairness', 'Fairness', 'Treat people by the same standard, share credit honestly, and use your advantages to widen the door for others.', 'Your team’s project wins praise. You name the two juniors who did the hardest part, in front of the boss.'],
    ];
    V.forEach(([k, n, d, x], i) => {
      const b = el('button', 'vt rv'); b.style.setProperty('--d', (i % 4) * .07 + 's'); b.setAttribute('aria-expanded', 'false');
      b.innerHTML = `<span class="vt-plus" aria-hidden="true"></span><svg viewBox="0 0 48 48" aria-hidden="true">${ICON[k]}</svg><p class="vt-n">${String(i + 1).padStart(2, '0')}</p><h3>${n}</h3><p class="vt-d">${d}</p><div class="vt-x"><div><p><b>On an ordinary Tuesday</b>${x}</p></div></div>`;
      b.onclick = () => { const o = b.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
      root.append(b); reveal(b);
    });
  })();

  /* ═════════ golden-mean compass ═════════ */
  (() => {
    const root = $('#compass'); if (!root) return;
    const T = [
      ['Courage', 'Cowardice', 'Recklessness', 'You avoid every hard conversation and risk. Fear makes your decisions, and other people pay for your silence.', 'You act despite fear, after judging which risks are worth it, and for whom. You’ll speak up, step in, and try hard things.', 'You take risks to prove something: speeding, fights, dares, gambling. Courage has become a performance, and others carry the danger.'],
      ['Confidence', 'Self-doubt', 'Arrogance', 'You shrink, over-apologise and won’t back your own judgment, so others can’t rely on it either.', 'You know your worth without needing to announce it. You can be wrong without being crushed, and right without gloating.', 'You can’t admit mistakes, talk over people and treat disagreement as disrespect. It usually hides insecurity.'],
      ['Self-reliance', 'Helplessness', 'Isolation', 'You lean on others for things you could learn to do, and avoid responsibility for your own life.', 'You handle your own business and ask for help when you need it. Interdependence is the adult version of independence.', 'You’d rather suffer alone than admit you’re struggling. The research on men’s health says this rule is one of the costliest.'],
      ['Assertiveness', 'Passivity', 'Aggression', 'You don’t say what you want, then resent people for not guessing. Boundaries get crossed because you never set them.', 'You state your needs and limits clearly and respectfully, and leave the other person free to say no.', 'You push, intimidate or punish to get your way. People comply, but they stop trusting you.'],
      ['Ambition', 'Apathy', 'Ruthlessness', 'You drift. Nothing is worth working hard for, and your talents go unused.', 'You work hard toward goals that matter, and you don’t sacrifice your health, family or integrity to reach them.', 'Winning is everything: you cut corners, use people and miss your children growing up.'],
      ['Emotional control', 'Flooding', 'Shutdown', 'Your feelings drive the car: you snap, sulk or explode, and everyone around you walks on eggshells.', 'You feel your emotions fully, name them, and choose what to do with them. You can cry at a funeral and stay calm in a crisis.', 'You’ve buried everything so deep you can’t feel joy either, and the people who love you can’t reach you.'],
    ];
    let cur = 0;
    const tabs = $('#cp-tabs'), range = $('#cp-range'), needle = $('#cp-needle'), read = $('.cp-read', root);
    const ticks = $('.cp-ticks', root);
    for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 - i / 20), r1 = 172, r2 = i % 5 ? 180 : 186; ticks.append(sv('line', { x1: 200 + r1 * Math.cos(a), y1: 200 - r1 * Math.sin(a), x2: 200 + r2 * Math.cos(a), y2: 200 - r2 * Math.sin(a) })); }
    T.forEach((t, i) => { const b = el('button', i === 0 ? 'on' : '', t[0]); b.setAttribute('role', 'tab'); b.onclick = () => { cur = i; $$('button', tabs).forEach((x, k) => x.classList.toggle('on', k === i)); range.value = 50; upd(true); }; tabs.append(b); });
    let lastZone = '';
    const upd = (force) => {
      const v = +range.value, t = T[cur];
      needle.style.transform = `rotate(${(v - 50) * 1.6}deg)`;
      $('#cp-lo').textContent = t[1]; $('#cp-mid').textContent = t[0]; $('#cp-hi').textContent = t[2];
      const zone = v < 30 ? 'lo' : v > 70 ? 'hi' : 'mid';
      if (zone !== lastZone || force) {
        lastZone = zone;
        const z = $('#cp-zone'); z.className = 'cp-zone ' + zone;
        z.textContent = zone === 'lo' ? 'Too little' : zone === 'hi' ? 'Too much' : 'The virtue';
        $('#cp-title').textContent = zone === 'lo' ? t[1] : zone === 'hi' ? t[2] : t[0];
        $('#cp-desc').textContent = zone === 'lo' ? t[3] : zone === 'hi' ? t[5] : t[4];
        read.classList.remove('swap'); void read.offsetWidth; read.classList.add('swap');
      }
    };
    range.addEventListener('input', () => upd(false)); upd(true);
    // gentle intro sweep
    reveal(root, () => { if (RM) return; let k = 0; const seq = [50, 15, 85, 50]; const step = () => { if (k >= seq.length) return; range.value = seq[k++]; upd(false); setTimeout(step, 900); }; setTimeout(step, 500); });
  })();

  /* ═════════ three Ps ═════════ */
  (() => {
    const root = $('#ps'); if (!root) return;
    const P = [
      ['P', 'Protect', 'Stand between the tribe and danger: predators, raiders, rival groups. Physical courage was the price of respect.', 'Protect', 'Make the spaces you’re in safer for everyone, including from you. Your strength is never used against the people you love.', ['Step in when someone is being harassed', 'Walk a friend to her cab without being asked', 'Keep your temper so nobody at home is afraid of you', 'Protect people’s privacy, reputations and confidences']],
      ['P', 'Provide', 'Bring home the meat, the harvest, the wage. A man’s worth was measured by what he supplied.', 'Provide', 'Provide money and presence, practical care and emotional support. If your partner out-earns you, you provide in other ways, and that’s fine.', ['Carry your share of the housework, including planning', 'Be home, and actually present, for dinner', 'Build financial security without making it your whole identity', 'Provide steadiness when the family is shaken']],
      ['P', 'Pass it on', 'Father children and continue the line. Legacy was about blood and inheritance.', 'Pass it on', 'Generativity: raise, teach, mentor and build things that help the next generation, whether or not they’re your own children.', ['Be warmly, actively involved if you’re a father', 'Mentor a younger colleague or relative', 'Teach the skills you have to someone who needs them', 'Leave your workplace and community better than you found them']],
    ];
    P.forEach(([l, a, then, b, now, list], i) => {
      const c = el('button', 'p3 rv'); c.style.setProperty('--d', i * .1 + 's');
      c.innerHTML = `<div class="p3-in"><div class="p3-f" data-l="${i === 2 ? 'P' : l}"><p class="p3-k">Then · the ${['first', 'second', 'third'][i]} P</p><h3>${i === 2 ? 'Procreate' : a}</h3><p>${then}</p><p class="p3-flip">See the modern version</p></div><div class="p3-b"><p class="p3-k">Now</p><h3>${b}</h3><p>${now}</p><ul>${list.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>`;
      c.onclick = () => c.classList.toggle('flip');
      root.append(c); reveal(c);
    });
  })();

  /* ═════════ skills ═════════ */
  (() => {
    const grid = $('#sk-grid'); if (!grid) return;
    const S = [['🍳', 'Cook five meals well for guests'], ['🛞', 'Change a flat tyre'], ['❤️‍🩹', 'Do basic first aid and CPR'], ['📊', 'Run a budget and file your taxes'], ['👔', 'Iron a shirt and sew on a button'], ['🔧', 'Fix a leaking tap or a tripped switch'], ['🎤', 'Give a toast or short speech'], ['🏊', 'Swim confidently'], ['🧭', 'Plan a trip from start to finish'], ['🤝', 'Negotiate a salary or a fair price'], ['🫂', 'Comfort someone who is crying'], ['🙏', 'Apologise properly'], ['🏋️', 'Lift, carry and move safely'], ['🚗', 'Drive safely at night and on highways'], ['🩺', 'Look after a sick family member'], ['🍽️', 'Host a dinner and make people feel welcome']];
    const KEY = 'lrn-goodman-skills'; const saved = store.get(KEY, []);
    S.forEach(([ic, t], i) => { const d = el('div'); d.innerHTML = `<input type="checkbox" id="sk-${i}" ${saved.includes(i) ? 'checked' : ''}><label for="sk-${i}"><span class="ico">${ic}</span>${t}</label>`; grid.append(d); });
    const boxes = $$('input', grid);
    const L = ['Tick what you can already do', 'A start. Pick one gap for this month.', 'Solid foundations.', 'Genuinely capable.', 'The man people call when things go wrong.'];
    const upd = () => { const on = boxes.filter((b) => b.checked).length; $('#sk-n').textContent = on; $('#sk-fill').style.strokeDashoffset = (326.7 * (1 - on / S.length)).toFixed(1); $('#sk-t').textContent = L[on === 0 ? 0 : Math.min(4, Math.ceil(on / S.length * 4))]; store.set(KEY, boxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0)); };
    boxes.forEach((b) => b.addEventListener('change', upd)); upd();
  })();

  /* ═════════ count-ups ═════════ */
  $$('[data-count]').forEach((n) => reveal(n, () => { const to = +n.dataset.count; if (RM) { n.textContent = to; return; } const t0 = performance.now(); const st = (t) => { const k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 3); n.textContent = Math.round(to * e); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }));

  /* ═════════ repair ═════════ */
  (() => {
    const root = $('#repair'); if (!root) return;
    const M = {
      bad: { parts: [['I’m sorry ', ''], ['if you felt upset', '#c9a0a0', 'Conditional: blames their feelings, not your action'], [', ', ''], ['but', '#e3a37f', '“But” cancels everything before it'], [' you know how stressed I’ve been, and honestly ', ''], ['you were being a bit dramatic too', '#b5523a', 'Counter-attack: turns it back on them'], ['.', '']] },
      good: { parts: [['I spoke over you twice in that meeting and dismissed your concern.', '#8ab0d0', 'Name the specific action'], [' ', ''], ['That made you look less credible in front of the team.', '#9fbf8a', 'Name the effect on them'], [' ', ''], ['I’m sorry.', '#edbc98', 'Apologise, with no “but”'], [' ', ''], ['I’d like to hear the rest of your point.', '#c9a6d6', 'Invite them back in'], [' ', ''], ['At the next meeting, I’ll make sure you have the floor.', '#e0a070', 'Commit to a change']] },
    };
    const q = $('#rp-q'), parts = $('#rp-parts');
    const show = (m) => {
      let k = 0;
      q.innerHTML = '“' + M[m].parts.map(([t, c, l]) => c ? `<mark style="--hl:${c}55;--dl:${(k++) * .25}s" data-l="${l}">${t}</mark>` : t).join('') + '”';
      $$('mark', q).forEach((mk) => bindTip(mk, () => mk.dataset.l));
      parts.innerHTML = M[m].parts.filter((p) => p[1]).map(([, c, l], i) => `<span style="--hl:${c};animation-delay:${i * .08}s"><i></i>${l}</span>`).join('');
    };
    $$('.rp-tabs button', root).forEach((b) => b.onclick = () => { $$('.rp-tabs button', root).forEach((x) => x.classList.toggle('on', x === b)); show(b.dataset.m); });
    show('bad');
  })();

  /* ═════════ rehearsal ═════════ */
  (() => {
    const root = $('#rehearse'); if (!root) return;
    const R = [
      ['At dinner', 'A friend makes a cruel joke at someone’s expense', '“Come on, leave him out of it.” Then draw the person back into the conversation if they seem to want that. If your friend keeps doing it, tell him privately what you noticed and ask him to stop.'],
      ['At work', 'Feedback catches you on a bad day', '“I’m getting defensive. Can you give me a specific example?” If you need time before answering, agree when to follow up, and do it. You can take criticism seriously while still disagreeing with parts of it.'],
      ['On a date', 'Your date says they’d like to go home', '“Of course. Thanks for spending the evening with me.” Accept the decision without bargaining or asking for reassurance. Offer help getting home only if it would be welcome.'],
      ['With yourself', 'You’ve been struggling and keep saying you’re fine', '“I’ve been keeping this to myself. I don’t need you to fix it. Could we go for a walk this week?” Pick someone you trust, name a time, and tell them how they can help.'],
      ['In the group chat', 'Someone shares a degrading meme about a woman', '“Not funny, man.” Short, calm, no lecture. Most groups take their cues from whoever speaks first. If he’s a close friend, follow up one-on-one.'],
      ['With a child', 'Your nephew is crying after losing a match', '“That really hurt, huh. It’s okay to be upset. I’m right here.” Skip “boys don’t cry” and “stop being a baby”. Let the feeling pass, then talk about the next game.'],
    ];
    R.forEach(([k, s, a], i) => {
      const d = el('div', 'rh rv'); d.style.setProperty('--d', (i % 2) * .08 + 's');
      d.innerHTML = `<p class="rh-k">${k}</p><h3>${s}</h3><textarea placeholder="What would you say? (optional, stays on your device)" aria-label="Your answer"></textarea><button class="btn ghost small">Reveal a version that works</button><div class="rh-a"><div><p><b>Try:</b> ${a}</p></div></div>`;
      const b = $('button', d); b.onclick = () => { const o = d.classList.toggle('open'); b.textContent = o ? 'Hide' : 'Reveal a version that works'; };
      root.append(d); reveal(d);
    });
  })();

  /* ═════════ mental load audit ═════════ */
  (() => {
    const grid = $('#ld-grid'); if (!grid) return;
    const T = [['Cooking dinner', 'visible'], ['Planning meals & groceries', 'invisible'], ['Washing dishes', 'visible'], ['Laundry', 'visible'], ['Cleaning the bathroom', 'visible'], ['Noticing when supplies run low', 'invisible'], ['Paying bills on time', 'invisible'], ['Remembering birthdays & gifts', 'invisible'], ['Doctor appointments', 'invisible'], ['Kids’ school & homework', 'invisible'], ['Coordinating house help & repairs', 'invisible'], ['Checking in on parents', 'invisible']];
    const ST = ['unset', 'me', 'both', 'them'], LAB = { unset: 'Not set', me: 'Me', both: 'Shared', them: 'Partner / family' };
    const KEY = 'lrn-goodman-load'; const s = store.get(KEY, T.map(() => 'unset'));
    T.forEach(([t, kind], i) => { const b = el('button', 'ld-btn', `<i class="${s[i]}"></i><span>${t}<small>${kind === 'invisible' ? 'Invisible work' : 'Visible work'} · <em>${LAB[s[i]]}</em></small></span>`); b.onclick = () => { s[i] = ST[(ST.indexOf(s[i]) + 1) % 4]; $('i', b).className = s[i]; $('em', b).textContent = LAB[s[i]]; upd(); }; grid.append(b); });
    const upd = () => {
      store.set(KEY, s);
      const c = { me: 0, both: 0, them: 0 }; s.forEach((v) => v !== 'unset' && c[v]++);
      const tot = c.me + c.both + c.them;
      ['me', 'both', 'them'].forEach((k) => ($('#ld-' + k).style.flexBasis = (tot ? c[k] / tot * 100 : 0) + '%'));
      const inv = T.map((t, i) => [t[1], s[i]]).filter(([k, v]) => k === 'invisible' && v === 'them').length;
      const note = $('#ld-note');
      if (tot < 4) note.innerHTML = 'Tap each task to mark who mostly owns it, from noticing to finishing.';
      else if (c.them > c.me + c.both) note.innerHTML = `Your partner or family carries <b>most of this load</b>${inv ? `, including ${inv} invisible task${inv > 1 ? 's' : ''}` : ''}. Pick one and take full ownership of it this week, including the remembering.`;
      else if (c.me > c.them + c.both) note.innerHTML = 'You’re carrying most of it. That’s generous, and also worth a conversation, so it stays sustainable.';
      else note.innerHTML = `Looks reasonably shared.${inv ? ` Still, ${inv} invisible task${inv > 1 ? 's sit' : ' sits'} with someone else; those are the easiest to overlook.` : ' Check the invisible tasks again in a month; they drift.'}`;
    };
    upd();
  })();

  /* ═════════ friendship chart ═════════ */
  (() => {
    const root = $('#fc-bars'); if (!root) return;
    const D = [['No close friends', 3, 15], ['Six or more close friends', 55, 27]];
    D.forEach(([l, a, b]) => {
      const g = el('div', 'fc-g', `<div class="fc-b" style="height:${a / 60 * 100}%;background:var(--c1)"><span>${a}%</span></div><div class="fc-b" style="height:${b / 60 * 100}%;background:var(--c2);transition-delay:.15s"><span>${b}%</span></div><p class="fc-l">${l}</p>`);
      bindTip(g, () => `${l}<br>1990: <b>${a}%</b> · 2021: <b>${b}%</b>`);
      root.append(g);
    });
    reveal(root);
  })();

  /* ═════════ circles ═════════ */
  (() => {
    const svg = $('#ci-svg'); if (!svg) return;
    const R = [['Inner circle', 'You could call them at 3 a.m.', 70, 2], ['Close friends', 'You talk or meet most months', 120, 5], ['Good friends', 'You catch up a few times a year', 170, 9]];
    const KEY = 'lrn-goodman-circle'; const n = store.get(KEY, R.map((r) => r[3]));
    svg.innerHTML = `<defs><radialGradient id="cig" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#edbc98" stop-opacity=".35"/><stop offset="1" stop-color="#edbc98" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="190" fill="url(#cig)"/>` + R.map((r) => `<circle class="ring" cx="200" cy="200" r="${r[2]}"/>`).join('') + `<circle cx="200" cy="200" r="22" fill="#edbc98"/><text x="200" y="205" text-anchor="middle" font-family="Archivo" font-weight="700" font-size="12" fill="#1c2119">YOU</text><g id="ci-dots"></g>`;
    const dots = $('#ci-dots', svg), ctr = $('#ci-ctrls');
    R.forEach(([t, s], i) => { const row = el('div', 'ci-row', `<div><b>${t}</b><small>${s}</small></div><div class="ci-step"><button aria-label="Fewer">−</button><output>${n[i]}</output><button aria-label="More">+</button></div>`); const [m, p] = $$('button', row); m.onclick = () => { n[i] = Math.max(0, n[i] - 1); upd(); }; p.onclick = () => { n[i] = Math.min(i === 0 ? 10 : i === 1 ? 20 : 40, n[i] + 1); upd(); }; ctr.append(row); });
    const upd = () => {
      store.set(KEY, n); $$('output', ctr).forEach((o, i) => (o.textContent = n[i]));
      dots.innerHTML = '';
      R.forEach(([, , r], i) => { for (let k = 0; k < n[i]; k++) { const a = (k / Math.max(1, n[i])) * Math.PI * 2 + i * .7; const c = sv('circle', { cx: 200 + r * Math.cos(a), cy: 200 + r * Math.sin(a), r: i === 0 ? 9 : i === 1 ? 7 : 5.5, fill: i === 0 ? '#edbc98' : i === 1 ? '#d99a6f' : '#b8a0a8', class: 'person' }); if (!RM) { c.style.transformOrigin = '200px 200px'; c.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 500, delay: k * 30, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }); } dots.append(c); } });
      const note = $('#ci-note');
      note.textContent = n[0] === 0 ? 'Many men have nobody in this ring, and many more than admit it. Start with one person: someone you already like. Put a date on it this week.' : n[0] <= 2 ? 'One or two people you can truly lean on is a real foundation. Look after them, and consider moving one close friend a ring inward.' : 'The psychologist Robin Dunbar suggests most people have room for about five in their innermost layer. You’re in good shape: now protect the time it takes to keep them.';
    };
    upd();
  })();

  /* ═════════ models ═════════ */
  (() => {
    const root = $('#models'); if (!root) return;
    const M = [
      ['SD', 'Satish Dhawan', 'Scientist, ISRO chairman', 'Take the blame, give the credit', 'linear-gradient(160deg, #3d4a5a, #1f2630)', 'When India’s first SLV-3 satellite launch failed in 1979, Dhawan faced the press himself and took responsibility. When it succeeded a year later, he sent the project director, a young A.P.J. Abdul Kalam, to face the cameras instead. Kalam told this story for the rest of his life.', 'When things go wrong, step forward. When they go right, step back.'],
      ['RD', 'Rahul Dravid', 'Cricketer and coach', 'Steadiness and team first', 'linear-gradient(160deg, #3b4f3a, #1f2a1e)', 'Known as “The Wall”, Dravid built a career on patience and composure. When the team needed balance, he kept wicket in one-day cricket, a job he hadn’t trained for, without complaint. Win or lose, he was gracious, and as a coach he consistently handed the credit to his players.', 'Do the unglamorous job the team needs, and let the result speak.'],
      ['VB', 'Captain Vikram Batra', 'Param Vir Chakra, Kargil 1999', 'Physical courage for others', 'linear-gradient(160deg, #5a3a2e, #2a1c17)', 'Batra led his men up some of the hardest peaks of the Kargil war, and became famous for his radio message after one capture, “Yeh dil maange more!” He was killed at 24 while moving to rescue an injured fellow officer, and was awarded India’s highest military honour after his death.', 'Real courage is usually spent on someone else’s behalf.'],
      ['FR', 'Fred Rogers', 'Children’s television host', 'Gentleness as strength', 'linear-gradient(160deg, #5a3a4a, #2a1c24)', 'Rogers spent decades telling children their feelings mattered. In 1969 he testified before a sceptical US Senate committee, quietly and without notes, and won the funding for public broadcasting that its chairman had been ready to cut. Softness, it turned out, could move a room of powerful men.', 'Kindness, said calmly and clearly, can be more persuasive than force.'],
      ['MA', 'Marcus Aurelius', 'Roman emperor, Stoic', 'Self-command', 'linear-gradient(160deg, #4a4535, #23211a)', 'The most powerful man in the world spent his evenings writing private notes reminding himself to be patient, fair, humble and useful. Those notes, the <em>Meditations</em>, were never meant for publication, which is why they’re so honest.', 'Hold yourself to your standard, especially when nobody could make you.'],
      ['AF', 'Atticus Finch', 'To Kill a Mockingbird (fiction)', 'Moral courage', 'linear-gradient(160deg, #3a4550, #1d2329)', 'A small-town lawyer defends a Black man falsely accused in the segregated American South, knowing he’ll probably lose and that his own children will be taunted for it. At home, he is gentle, honest and present. The Art of Manliness calls integrity the foundation of his character.', 'Do the right thing even when you know you’ll lose.'],
    ];
    M.forEach(([ini, n, who, trait, g, story, les], i) => {
      const b = el('button', 'md rv'); b.style.setProperty('--d', (i % 3) * .08 + 's');
      b.innerHTML = `<div class="md-in"><div class="md-f" style="--g:${g}"><div class="md-medal">${ini}</div><h3>${n}</h3><p class="md-who">${who}</p><p class="md-trait">${trait}</p></div><div class="md-b"><h4>${n}</h4><p>${story}</p><p class="md-les">${les}</p></div></div>`;
      b.onclick = () => b.classList.toggle('flip');
      root.append(b); reveal(b);
    });
  })();

  /* ═════════ the mirror ═════════ */
  (() => {
    const list = $('#mr-list'); if (!list) return;
    const Q = [
      ['Integrity', 'I do what I said I’d do, or tell people early when I can’t.', 'Keep a short list of every promise you make this week, however small, and close each one.'],
      ['Courage', 'I speak up when something is wrong, even when it’s awkward.', 'This week, say one honest thing you’ve been avoiding, kindly and specifically.'],
      ['Composure', 'When I’m angry, I pause before I speak or send anything.', 'Practise Notice, Name, Choose once a day. Delay any angry message by at least an hour.'],
      ['Humility', 'I can admit I was wrong without adding excuses.', 'Next time you’re wrong, say “You’re right, I got that wrong” and stop there.'],
      ['Competence', 'I can handle most practical problems in daily life.', 'Pick one skill from Chapter Four and learn it properly this month.'],
      ['Care', 'I notice what people around me need, and I follow up.', 'Set a reminder to follow up on one thing someone told you this week.'],
      ['Connection', 'I’ve had a real conversation with a close friend in the past two weeks.', 'Invite one friend to do something specific, with a date and time, within seven days.'],
      ['Partnership', 'At home, I fully own tasks, including the planning and remembering.', 'Choose one recurring household task and own it completely, from noticing to finishing.'],
    ];
    const KEY = 'lrn-goodman-mirror'; const sc = store.get(KEY, Q.map(() => 0));
    Q.forEach(([k, q], i) => {
      const d = el('div', 'mr-q', `<p><small>${k}</small>${q}</p><div class="mr-sc" role="radiogroup" aria-label="${k}">${[1, 2, 3, 4, 5].map((v) => `<button role="radio" aria-checked="${sc[i] === v}" class="${sc[i] === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>`);
      $$('button', d).forEach((b) => b.onclick = () => { sc[i] = +b.dataset.v; $$('button', d).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); }); render(); });
      list.append(d);
    });
    const out = $('#mr-out');
    const render = () => {
      store.set(KEY, sc);
      const done = sc.filter(Boolean).length;
      if (done < 8) { out.innerHTML = `<h3>Your profile</h3>${Q.map(([k], i) => `<div class="mr-bar"><span>${k}</span><div><i style="width:${sc[i] * 20}%"></i></div><span>${sc[i] || '–'}</span></div>`).join('')}<p class="mr-empty" style="margin-top:1rem">${8 - done} more to go. Your answers stay on this device.</p>`; return; }
      const min = Math.min(...sc), weakest = Q.filter((q, i) => sc[i] === min);
      const pick = weakest[0];
      out.innerHTML = `<h3>Your profile</h3>${Q.map(([k], i) => `<div class="mr-bar"><span>${k}</span><div><i style="width:${sc[i] * 20}%"></i></div><span>${sc[i]}</span></div>`).join('')}<div class="mr-tip"><b>Start here: ${pick[0]}</b>${pick[2]}</div><p class="mr-empty" style="margin-top:.8rem">Try asking someone who knows you well to fill this in for you. The gap between your answers and theirs is the most useful part.</p>`;
    };
    render();
  })();

  /* ═════════ four-week plan (keeps progress from the earlier version) ═════════ */
  (() => {
    const list = $('#pl-weeks'); if (!list) return;
    const W = [['keep-word', 'Keep your word', 'Pick one overdue commitment. Send an honest update and finish what you promised, or agree on a new commitment.'], ['handle-tension', 'Handle tension', 'Have one conversation you’ve been avoiding. Open with a specific observation and a request. Listen to the answer.'], ['make-contact', 'Make contact', 'Invite a friend to do something on a specific day. Ask one question you genuinely want answered, and follow up later.'], ['share-care', 'Carry your share', 'Agree to own one recurring piece of care work. Handle planning and follow-through, and ask how the arrangement is working.']];
    const KEY = 'lrn.healthy-masculinity.plan.v1'; const saved = store.get(KEY, []);
    W.forEach(([id, t, d], i) => { const li = el('li'); li.innerHTML = `<input type="checkbox" id="${id}" ${saved.includes(id) ? 'checked' : ''}><label for="${id}"><span class="wk">${i + 1}</span><span><b>Week ${i + 1} · ${t}</b><span>${d}</span></span></label>`; list.append(li); });
    const boxes = $$('input', list), note = $('#pl-note');
    const upd = (save) => { const done = boxes.filter((b) => b.checked).map((b) => b.id); $('#pl-count').textContent = `${done.length} of 4 complete`; $('#pl-path').style.setProperty('--p', done.length / 4 * 100 + '%'); if (save) note.textContent = store.set(KEY, done) ? 'Progress is saved on this device.' : 'Progress is available during this visit.'; };
    boxes.forEach((b) => b.addEventListener('change', () => upd(true)));
    $('#pl-reset').onclick = () => { boxes.forEach((b) => (b.checked = false)); upd(true); };
    upd(false);
  })();
})();

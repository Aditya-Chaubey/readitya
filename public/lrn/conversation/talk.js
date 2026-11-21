/* lrn — Good Company */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ───────── progress + rail ───────── */
  const bar = $('#progress');
  const rail = $('#rail');
  const chapters = $$('[data-rail]');
  chapters.forEach((c) => {
    const a = el('a'); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail);
    a.append(el('span', '', c.dataset.rail)); rail.append(a);
  });
  const railLinks = $$('a', rail);
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    bar.style.width = (p * 100).toFixed(2) + '%';
    rail.classList.toggle('show', h.scrollTop > innerHeight * .8);
    let cur = -1;
    chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .45) cur = i; });
    railLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ───────── reveal ───────── */
  if (RM || !('IntersectionObserver' in window)) $$('.rv').forEach((e) => e.classList.add('in'));
  else {
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach((e) => rio.observe(e));
  }

  /* ───────── bokeh ───────── */
  (() => {
    const c = $('#bokeh'); if (!c) return;
    const ctx = c.getContext('2d');
    let w, h, dpr, dots = [], mx = 0, my = 0, tx = 0, ty = 0, run = true;
    const cols = ['240,183,100', '232,131,111', '255,226,176', '200,120,140'];
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, w / 28));
      dots = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 6 + Math.random() * Math.random() * 60, z: .2 + Math.random(), c: pick(cols), a: .05 + Math.random() * .22, vx: (Math.random() - .5) * .12, vy: -.05 - Math.random() * .15, t: Math.random() * 6.28 }));
    };
    const draw = () => {
      if (!run) return;
      tx += (mx - tx) * .04; ty += (my - ty) * .04;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy; d.t += .01;
        if (d.y < -80) { d.y = h + 80; d.x = Math.random() * w; }
        if (d.x < -80) d.x = w + 80; if (d.x > w + 80) d.x = -80;
        const x = d.x + tx * d.z * 24, y = d.y + ty * d.z * 24;
        const a = d.a * (.75 + .25 * Math.sin(d.t * 2));
        const g = ctx.createRadialGradient(x, y, 0, x, y, d.r);
        g.addColorStop(0, `rgba(${d.c},${a})`); g.addColorStop(.6, `rgba(${d.c},${a * .5})`); g.addColorStop(1, `rgba(${d.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, d.r, 0, 6.283); ctx.fill();
      }
      if (!RM) requestAnimationFrame(draw);
    };
    size(); draw();
    addEventListener('resize', size);
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was && !RM) draw(); }).observe(c);
  })();

  /* ───────── hero chat ───────── */
  (async () => {
    const box = $('#hero-chat'); if (!box) return;
    const script = [
      ['r', 'You', 'So how do you know the couple?'],
      ['l', 'Her', 'Bride’s cousin. Also her emergency speech editor, apparently.'],
      ['r', 'You', 'Speech editor! Did you have to cut anything scandalous?'],
      ['l', 'Her', 'Only the part about the goat.'],
      ['n', '', '↑ a thread worth pulling'],
      ['r', 'You', 'Okay, I’m going to need to hear about the goat.'],
      ['l', 'Her', 'Ha. It’s a very long story.'],
      ['r', 'You', 'Good. I’ve got all night.'],
      ['n', '', 'She laughs. Second date: likely.'],
    ];
    const add = (node) => { box.append(node); while (box.children.length > 7) box.firstElementChild.remove(); };
    await wait(1400);
    for (;;) {
      for (const [side, who, text] of script) {
        if (side === 'n') { add(el('div', 'bub note', text)); await wait(1500); continue; }
        const t = el('div', 'bub ' + side + ' typing', '<i></i><i></i><i></i>'); add(t);
        await wait(RM ? 200 : 700 + text.length * 14);
        t.className = 'bub ' + side; t.innerHTML = `<small>${who}</small>${text}`;
        await wait(RM ? 600 : 1300 + text.length * 22);
      }
      await wait(2500);
      [...box.children].forEach((c, i) => { c.style.transition = 'opacity .6s ' + i * .05 + 's'; c.style.opacity = 0; });
      await wait(1200); box.innerHTML = '';
    }
  })();

  /* ───────── predictions ───────── */
  $$('.pcard').forEach((card) => {
    const ans = card.dataset.answer;
    $$('.p-opts button', card).forEach((b) => b.addEventListener('click', () => {
      if (card.classList.contains('done')) return;
      card.classList.add('done');
      $$('.p-opts button', card).forEach((o) => {
        o.disabled = true;
        if (o.dataset.v === ans) o.classList.add('right');
        else if (o === b) o.classList.add('wrong');
        else o.classList.add('dim');
      });
    }));
  });

  /* ───────── opener machine ───────── */
  (() => {
    const root = $('#opener'); if (!root) return;
    const D = {
      'Party': [
        ['So how do you know the host? I’m trying to work out which part of her life everyone’s from.', 'The classic, because it works. Everyone has an answer, and the answer always comes with a story.'],
        ['I’ve been sent on a mission to find the person who made this guacamole. Was it you?', 'Playful, low-stakes, and food is common ground. Even a “no” leads somewhere.'],
        ['You look like you’ve escaped a conversation about cryptocurrency. Want to hide here for a bit?', 'Light conspiracy creates instant rapport: it’s you two against the room.'],
        ['I’m Kabir. I know almost nobody here, so I’m introducing myself to people who look interesting.', 'Plain honesty plus a sincere compliment. Disarming because it’s so rare.'],
      ],
      'Wedding': [
        ['Bride’s side or groom’s side? And what’s the most embarrassing thing you know about them?', 'Weddings are designed for this question. The second half turns a fact into a story.'],
        ['That speech was either the best or the most dangerous I’ve ever heard. Which way are you leaning?', 'Asks for an opinion about a shared moment. No wrong answer.'],
        ['I’ve been told I have to dance at some point. On a scale of one to uncle, how bad is it out there?', 'Self-deprecating, situational, and quietly opens the door to dancing together.'],
      ],
      'Coffee shop': [
        ['Sorry, I have to ask: is that book as good as the cover? I’ve been eyeing it for weeks.', 'People love talking about what they’re reading. Easy to leave if they’d rather read.'],
        ['I always panic and order the same thing. What do you get here?', 'Asks for their expertise. Short, kind, and easy to answer or decline.'],
        ['Is the wifi working for you, or is it just my laptop protesting?', 'A genuine, shared micro-problem. Low pressure, especially if they look busy.'],
      ],
      'Bookshop / gallery': [
        ['I can’t tell if this painting is genius or if I’m being trolled. What do you think?', 'Art invites opinions, and honesty about not “getting it” is charming.'],
        ['You’re in the poetry section on purpose. I respect that. Any recommendations for a beginner?', 'A light compliment on a choice, then a request for their taste.'],
        ['I need a gift for my sister who reads everything. If you had to pick one book, what would it be?', 'Gives a real reason to ask, and their pick tells you who they are.'],
      ],
      'Work event': [
        ['What are you working on that you’re actually excited about right now?', 'Better than “What do you do?” because it invites energy instead of a job title.'],
        ['Is this your first one of these? I’m still working out where the good snacks are hidden.', 'Admits mild uncertainty, which makes it easier for them to relax too.'],
        ['That talk was interesting. Did you agree with her point about remote work?', 'Shared context plus a request for an opinion gives you an instant topic.'],
      ],
      'Bar': [
        ['Settle something for us: my friend says this song is a classic, I say it’s a crime. Who’s right?', 'The “opinion poll” works because it’s playful and gives her an easy role.'],
        ['You ordered that with real confidence. What is it? I need to upgrade from my usual.', 'Compliments a choice and asks for advice. Easy to answer, easy to build on.'],
        ['Hi, I’m Dev. I saw you laughing at the bartender’s joke and thought, she seems fun. Mind if I join you for a minute?', 'Direct and honest about why you came over. Confidence is in the “for a minute”: no pressure.'],
      ],
      'Travelling': [
        ['Where are you headed, home or away?', 'Simple, open, and almost everyone has a story about where they’re going.'],
        ['I have a terrible feeling I’ve packed for the wrong weather. Have you been here before?', 'A small shared vulnerability, then a chance for them to be the expert.'],
        ['What’s the one thing I absolutely shouldn’t miss here?', 'Locals and seasoned travellers love answering this. It often leads to a recommendation, then a plan.'],
      ],
    };
    const chips = $('.op-chips', root), card = $('.op-card', root), line = $('.op-line', root), why = $('.op-why', root), count = $('.op-count', root);
    let set = 'Party', idx = 0;
    const show = (anim = true) => {
      const [l, w] = D[set][idx];
      line.textContent = l; why.innerHTML = `<b>Why it works</b>${w}`;
      count.textContent = `${idx + 1} of ${D[set].length}`;
      if (anim) { card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
    };
    Object.keys(D).forEach((k) => {
      const b = el('button', k === set ? 'on' : '', k); b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { set = k; idx = 0; $$('button', chips).forEach((x) => x.classList.toggle('on', x === b)); show(); });
      chips.append(b);
    });
    $('#op-shuffle').addEventListener('click', () => { idx = (idx + 1) % D[set].length; show(); });
    show(false);
  })();

  /* ───────── threading ───────── */
  (() => {
    const root = $('#thread'); if (!root) return;
    const T = {
      lisbon: { label: 'Lisbon', good: ['Lisbon! Was that your first time there?', 'What’s one thing you ate there you’re still thinking about?'], bad: 'I went to Barcelona last year.', tip: 'Places are memory palaces. Ask for a scene, a taste or a surprise, not an itinerary.' },
      wedding: { label: 'my sister’s wedding', good: ['How was it? Did anyone cry during the speeches?', 'Are you and your sister close?'], bad: 'Weddings are so expensive these days.', tip: 'Family threads go deep fast. The “are you close?” question often opens the best conversation of the night.' },
      job: { label: 'a new job on Monday', good: ['Congratulations! What’s the new job?', 'Are you more excited or nervous?'], bad: 'Ugh, I hate my job.', tip: 'Transitions are emotional. The “excited or nervous?” question invites feelings without prying.' },
      coffee: { label: 'living on coffee', good: ['How many cups are we talking? Be honest.', 'Are you a careful-coffee person or a whatever’s-hot person?'], bad: 'You should really cut down on caffeine.', tip: 'The light threads are for play. Tease gently and you’ll both relax.' },
      laundry: { label: 'remember how to do my own laundry', good: ['Wait, who was doing your laundry before?', 'Has it gone badly yet? Any pink shirts?'], bad: 'Laundry is easy, you just separate the colours.', tip: 'Jokes are often a hidden thread. Here it hints she’s been away a long time, or living with family. Follow the curiosity.' },
    };
    const txt = $('.th-text', root), out = $('.th-out', root);
    const tpl = 'Honestly? Chaotic. I just got back from {lisbon} for {wedding}, and I start {job}, so I’m {coffee} and trying to {laundry}.';
    txt.innerHTML = tpl.replace(/\{(\w+)\}/g, (_, k) => `<button data-k="${k}">${T[k].label}</button>`);
    const seen = new Set();
    $$('button', txt).forEach((b) => b.addEventListener('click', () => {
      const t = T[b.dataset.k]; seen.add(b.dataset.k);
      $$('button', txt).forEach((x) => { x.classList.toggle('on', x === b); if (seen.has(x.dataset.k)) x.classList.add('seen'); });
      out.innerHTML = `<div class="th-card"><h4>Pulling “${t.label}”</h4><ul>${t.good.map((g) => `<li><i class="g">Pull</i>“${g}”</li>`).join('')}<li><i class="b">Drop</i>“${t.bad}”</li></ul><p class="th-tip">${t.tip}</p>${seen.size === 5 ? '<p class="th-done">All five threads pulled. That’s ten good questions from one answer.</p>' : ''}</div>`;
    }));
  })();

  /* ───────── rally ───────── */
  (() => {
    const root = $('#rally'); if (!root) return;
    const ball = $('#ra-ball'), court = $('.ra-court', root), you = $('.ra-you', root), them = $('.ra-them', root), cap = $('#ra-cap'), my = $('#ra-y');
    const M = {
      interview: { share: 18, cap: '<b>The interview.</b> You serve question after question; they answer and wait for the next. You learn their CV. They learn nothing about you, and it starts to feel like an exam.' },
      monologue: { share: 88, cap: '<b>The monologue.</b> You keep the ball on your side of the net: one story leads to another, all about you. They stopped listening a while ago, and are planning their escape.' },
      rally: { share: 52, cap: '<b>The rally.</b> Ask, answer, react, share, ask back. Both people hit the ball, and neither knows quite where it will go next. That’s a conversation.' },
    };
    let mode = 'interview', token = 0;
    const pos = (side) => { const r = court.getBoundingClientRect(); const p = (side === 'you' ? you : them).getBoundingClientRect(); return p.left - r.left + p.width / 2 + (side === 'you' ? 52 : -52); };
    const fly = async (from, to, arc, dur, label) => {
      ball.style.setProperty('--l', label);
      const a = pos(from), b = pos(to);
      const anim = ball.animate([
        { transform: `translate(${a}px, 0)` },
        { transform: `translate(${(a + b) / 2}px, ${-arc}px)`, offset: .5 },
        { transform: `translate(${b}px, 0)` },
      ], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
      await anim.finished.catch(() => {});
      const p = to === 'you' ? you : them; p.classList.add('hit'); setTimeout(() => p.classList.remove('hit'), 260);
    };
    const bounce = async (side, dur) => {
      const a = pos(side);
      const anim = ball.animate([{ transform: `translate(${a}px,0)` }, { transform: `translate(${a + (side === 'you' ? 60 : -60)}px,-50px)` }, { transform: `translate(${a}px,0)` }], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
      await anim.finished.catch(() => {});
      you.classList.add('hit'); setTimeout(() => you.classList.remove('hit'), 260);
    };
    const loop = async (t) => {
      while (t === token) {
        if (mode === 'interview') { await fly('you', 'them', 70, 900); if (t !== token) return; await wait(150); await fly('them', 'you', 12, 700); await wait(250); }
        else if (mode === 'monologue') { await bounce('you', 700); }
        else { await fly('you', 'them', 60 + Math.random() * 40, 1000); if (t !== token) return; await wait(250); await fly('them', 'you', 60 + Math.random() * 40, 1000); await wait(250); }
      }
    };
    const set = (m) => {
      mode = m; token++;
      $$('.ra-tabs button', root).forEach((b) => b.classList.toggle('on', b.dataset.m === m));
      my.style.width = M[m].share + '%'; cap.innerHTML = M[m].cap;
      them.classList.toggle('bored', m !== 'rally'); you.classList.remove('bored');
      ball.getAnimations().forEach((a) => a.cancel());
      if (!RM) loop(token);
    };
    $$('.ra-tabs button', root).forEach((b) => b.addEventListener('click', () => set(b.dataset.m)));
    let started = false;
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; set('interview'); } else if (!e.isIntersecting && started) { token++; started = false; } }).observe(root);
    my.style.width = M.interview.share + '%'; cap.innerHTML = M.interview.cap;
  })();

  /* ───────── shift/support trainer ───────── */
  (() => {
    const root = $('#trainer'); if (!root) return;
    const S = [
      { who: 'Friend', said: 'I finally ran my first half-marathon on Sunday.', opts: [
        ['Nice! I did a full marathon a couple of years ago.', 'shift', 'A classic shift: it turns their milestone into a comparison with yours.'],
        ['No way! How did the last few kilometres feel?', 'support', 'Asks for the most vivid part of the story and keeps the spotlight on them.'],
        ['You should go for a full marathon next.', 'advice', 'Unsolicited advice skips past the moment. Celebrate first.']], right: 1 },
      { who: 'Colleague', said: 'My dog’s been sick all week. I’ve barely slept.', opts: [
        ['Have you tried a different vet?', 'fix', 'Jumping to solutions can feel like you want the topic closed. Listen first; offer help later if they want it.'],
        ['My cat had something like that once, it was a nightmare.', 'shift', 'Relating is natural, but now the story is about your cat.'],
        ['Oh no, that sounds exhausting. What’s wrong with him?', 'support', 'Labels the feeling, then asks for more. That’s what being heard feels like.']], right: 2 },
      { who: 'Friend', said: 'I’m seriously thinking of quitting to open a bakery.', opts: [
        ['Whoa. What’s pulling you toward it?', 'support', 'Curious, not judgmental. Lets them explore the dream before anyone pokes holes in it.'],
        ['Isn’t that really risky right now?', 'dismiss', 'Maybe true, but leading with doubt shuts the conversation down. Earn the right to challenge by understanding first.'],
        ['Ha, I’ve always wanted to open a bar.', 'shift', 'A shift disguised as solidarity.']], right: 0 },
      { who: 'Her', said: 'I’m a marine biologist. I mostly study octopuses.', opts: [
        ['Cool. I’m in finance, so, much less exciting.', 'shift', 'Self-deprecating, but you’ve moved straight to yourself and away from the most interesting job you’ll hear all year.'],
        ['Oh, I watched a documentary about them. They have nine brains, right?', 'show', 'Showing off what you know about her field tends to land as a quiz. Let her be the expert.'],
        ['Octopuses! What’s the strangest thing you’ve ever seen one do?', 'support', 'Pure curiosity, an invitation to tell a story, and a sign you find her world fascinating.']], right: 2 },
      { who: 'Friend', said: 'Ugh. My presentation went terribly today.', opts: [
        ['I’m sure it wasn’t as bad as you think!', 'minimise', 'Kindly meant, but it argues with their feelings. They’ll feel unheard.'],
        ['Sounds like it’s still bugging you. What happened?', 'support', 'A Voss-style label plus an open question. They’ll probably tell you everything.'],
        ['Don’t worry, mine last week was a total disaster.', 'shift', 'Comfort by comparison still moves the spotlight.']], right: 1 },
      { who: 'Couple at dinner', said: 'We just got back from two weeks in Japan.', opts: [
        ['Nice. Was it good?', 'closed', 'A closed question invites “yes, great” and a dead end.'],
        ['Japan’s on my list! I’m thinking Kyoto in the spring.', 'shift', 'Now you’re planning your trip instead of hearing about theirs.'],
        ['Amazing. What’s one moment from the trip you keep thinking about?', 'support', 'Asks for a scene, not a summary. You’ll get their best story.']], right: 2 },
    ];
    const body = $('.tr-body', root), step = $('.tr-step', root), score = $('.tr-score', root), dots = $('.tr-dots', root);
    let i = 0, pts = 0, res = [];
    const paint = () => {
      dots.innerHTML = S.map((_, k) => `<i class="${res[k] === true ? 'ok' : res[k] === false ? 'no' : k === i ? 'cur' : ''}"></i>`).join('');
      step.textContent = i < S.length ? `Moment ${i + 1} of ${S.length}` : 'Done'; score.textContent = `${pts} support${pts === 1 ? '' : 's'}`;
    };
    const render = () => {
      paint();
      if (i >= S.length) {
        const msg = pts === S.length ? 'A natural. People leave conversations with you feeling heard.' : pts >= 4 ? 'Very good. Watch for the sneaky shifts: they often disguise themselves as relating or helping.' : 'Most people score here at first. The instinct to relate, fix or reassure is strong. Notice it, then ask one more question instead.';
        body.innerHTML = `<div class="tr-end"><p class="tr-big">${pts}/${S.length}</p><p>${msg}</p><button class="btn" id="tr-again">Try again</button></div>`;
        $('#tr-again').onclick = () => { i = 0; pts = 0; res = []; render(); };
        return;
      }
      const s = S[i];
      body.innerHTML = `<p class="tr-said"><span class="who">${s.who}</span>“${s.said}”</p><div class="tr-opts">${s.opts.map((o, k) => `<button data-k="${k}">“${o[0]}”</button>`).join('')}</div>`;
      $$('.tr-opts button', body).forEach((b) => b.addEventListener('click', () => {
        const k = +b.dataset.k, ok = k === s.right;
        if (ok) pts++; res[i] = ok;
        $$('.tr-opts button', body).forEach((x, j) => {
          x.disabled = true;
          if (j === s.right) { x.classList.add('right'); x.insertAdjacentHTML('beforeend', '<small>Support</small>'); }
          else if (j === k) { x.classList.add('wrong'); x.insertAdjacentHTML('beforeend', `<small>${s.opts[j][1]}</small>`); }
          else x.classList.add('dim');
        });
        const fb = el('div', 'tr-fb', `<p>${s.opts[k][2]}</p>`);
        const nx = el('button', 'btn', i === S.length - 1 ? 'See score' : 'Next →');
        nx.onclick = () => { i++; render(); }; fb.append(nx); body.append(fb); paint();
        nx.focus({ preventScroll: true });
      }));
    };
    render();
  })();

  /* ───────── ladder ───────── */
  (() => {
    const root = $('#ladder'); if (!root) return;
    const L = [
      { k: 'Rung 1', n: 'Facts', c: '#8cc7a3', t: 'The handshake', d: 'Where you’re from, what you do, how you know the host. Safe, necessary and forgettable if you stay too long. Use it to collect threads.', q: ['Where did you grow up?', 'How do you know everyone here?', 'What part of the city do you live in?', 'What do you do when you’re not at work?', 'How long have you lived here?'] },
      { k: 'Rung 2', n: 'Opinions', c: '#b8d27a', t: 'How they think', d: 'Low risk, high reward. Opinions have no wrong answers and reveal taste, humour and values. Light disagreement here is fun, not dangerous.', q: ['What’s an overrated thing everyone seems to love?', 'Best place to eat around here, and you can only pick one?', 'Mountains or sea, and defend your answer.', 'What’s a hill you’re willing to die on?', 'What’s a film you could watch a hundred times?'] },
      { k: 'Rung 3', n: 'Stories', c: '#f0b764', t: 'What they’ve lived', d: 'Ask for scenes, not summaries. Stories are where people come alive and where you find out what they find funny, scary or wonderful.', q: ['What’s the best trip you’ve ever taken, and what happened?', 'What’s the strangest job you’ve ever had?', 'How did you end up doing what you do?', 'What was the last thing that made you laugh until it hurt?', 'What’s a time a wrong turn turned out better than the plan?'] },
      { k: 'Rung 4', n: 'Feelings', c: '#e8836f', t: 'What it was like', d: 'The same topics, but asking how it felt. This is where acquaintances become friends. Go first with a little of your own, and watch for a lean-in.', q: ['What’s something you’re looking forward to right now?', 'When do you feel most like yourself?', 'What’s been the hardest part of the move?', 'What’s something small that always cheers you up?', 'What’s been on your mind lately?'] },
      { k: 'Rung 5', n: 'Values & dreams', c: '#c890b8', t: 'Who they are', d: 'Reserved for when the conversation has earned it, often late at night. What they want from life, what they believe, what they’d do if they couldn’t fail.', q: ['If you could live one year of your life again, which would it be?', 'What would you do if money weren’t a factor at all?', 'Who has shaped you the most?', 'What are you most grateful for?', 'What do you hope people say about you when you’re not in the room?'] },
    ];
    const rungs = $('.ld-rungs', root), panel = $('.ld-panel', root), qt = $('.ld-qtext', root);
    let cur = 0; const last = {};
    const draw = (anim) => {
      const r = L[cur]; let n;
      do { n = Math.floor(Math.random() * r.q.length); } while (r.q.length > 1 && n === last[cur]);
      last[cur] = n; qt.textContent = '“' + r.q[n] + '”';
      if (anim) { qt.classList.remove('swap'); void qt.offsetWidth; qt.classList.add('swap'); }
    };
    const set = (i, anim = true) => {
      cur = i; const r = L[i];
      root.style.setProperty('--c', r.c); panel.style.setProperty('--c', r.c);
      $('.ld-k', panel).textContent = `${r.k} · ${r.n}`; $('.ld-t', panel).textContent = r.t; $('.ld-d', panel).textContent = r.d;
      $$('button', rungs).forEach((b, j) => b.classList.toggle('on', j === i));
      if (anim) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
      draw(anim);
    };
    L.forEach((r, i) => { const b = el('button', '', `<span>${r.k}</span><b>${r.n}</b>`); b.style.setProperty('--c', r.c); b.setAttribute('role', 'tab'); b.onclick = () => set(i); rungs.append(b); });
    $('#ld-draw').onclick = () => draw(true);
    set(0, false);
  })();

  /* ───────── story trimmer ───────── */
  (() => {
    const root = $('#trim'); if (!root) return;
    const P = [
      ['add', 'The best meal of my life was in a stranger’s kitchen. '],
      ['fat', 'So this was, I think, 2019? Or maybe 2018. Anyway, '],
      ['', 'I was in Rome '],
      ['fat', 'with my friend Rohan (you don’t know him, he’s an accountant, nice guy) '],
      ['', 'and we got completely lost looking for a restaurant'],
      ['fat', ' someone had recommended, I can’t remember who'],
      ['', '. '],
      ['fat', 'We’d been walking for about an hour, my phone was on four percent, and Rohan kept insisting we turn left. '],
      ['', 'We knocked on what we were sure was the restaurant door. '],
      ['fat', 'It had a sign, sort of. '],
      ['', 'A tiny old woman opened it, '],
      ['fat', 'wearing an apron, I think, or possibly a dressing gown, '],
      ['', 'and it was her house. '],
      ['fat', 'Which was obviously awkward. '],
      ['', 'Instead of shutting the door, she sat us down and made us the best carbonara I have ever eaten.'],
      ['fat', ' Then we went back to the hotel. It was a good trip overall.'],
      ['add', ' Have you ever had a wrong turn go better than the plan?'],
    ];
    const box = $('#tm-text'), btn = $('#tm-btn'), n = $('#tm-n');
    box.innerHTML = P.map(([c, t]) => `<span class="${c}">${t}</span>`).join('');
    const words = (f) => P.filter(f).map((p) => p[1]).join('').trim().split(/\s+/).length;
    const before = words((p) => p[0] !== 'add'), after = words((p) => p[0] !== 'fat');
    n.textContent = `${before} words · rambling`;
    let st = 0;
    btn.onclick = async () => {
      if (st === 0) { st = 1; btn.disabled = true; root.classList.add('cut'); n.textContent = 'Marking the fat…'; await wait(RM ? 0 : 1100); root.classList.add('gone'); n.textContent = `${after} words · hook up front, a hand-off at the end`; btn.textContent = 'Show the original'; btn.disabled = false; st = 2; }
      else { st = 0; root.classList.remove('gone', 'cut'); n.textContent = `${before} words · rambling`; btn.textContent = 'Cut the fat'; }
    };
  })();

  /* ───────── charm files ───────── */
  (() => {
    const grid = $('#ch-grid'); if (!grid) return;
    const C = [
      ['fic', 'James Bond', 'Ian Fleming’s novels · the films', 'Economy of words', '#0f1c2a', '#efe6d2', 'JB', 'Bond says less than anyone in the room, and every line is chosen. He notices details (the drink, the perfume, the tell) and mentions them. Under pressure he gets lighter, not tenser. His first conversation with Vesper on the train in <em>Casino Royale</em> (2006) is the model: two people playfully reading each other, each guessing the other’s story, neither backing down.', 'Say less, notice more, and stay amused when things get tense.'],
      ['fic', 'Mr Darcy', 'Pride and Prejudice · 1813', 'Sincerity over smoothness', '#3a2a4a', '#f1e7f5', 'D', 'Darcy is hopeless at small talk and admits it. What wins Elizabeth is not polish but honesty, and something rarer: when she tells him exactly what’s wrong with him, he listens, and changes. His second proposal is humble where the first was proud.', 'You don’t need to be smooth. Be honest, and be able to hear a hard truth about yourself.'],
      ['fic', 'Captain Wentworth', 'Persuasion · 1817', 'Saying it plainly', '#16343c', '#e3f0ee', 'W', 'After eight years of wounded silence, he overhears Anne talking about constancy and writes her a letter on the spot: “You pierce my soul. I am half agony, half hope.” It is the most romantic thing in Austen because it costs him everything to write it.', 'When it matters, say the true thing directly. Vulnerability is a form of courage.'],
      ['fic', 'Jay Gatsby', 'The Great Gatsby · 1925', 'The smile that sees you', '#1e3a2c', '#f3e9c8', 'G', 'Fitzgerald describes Gatsby’s smile as one that “understood you just as far as you wanted to be understood.” For a moment, you feel he believes in you as you’d like to believe in yourself. The warning is in the ending: Gatsby’s charm was a performance covering emptiness.', 'Make people feel believed in. But make sure there’s a real person behind the smile.'],
      ['fic', 'Rhett Butler', 'Gone with the Wind · 1936', 'Candour with a grin', '#4a1a1a', '#f5e2cf', 'R', 'Every other man flatters Scarlett. Rhett laughs at her pretensions, tells her uncomfortable truths and treats her as an equal sparring partner. That’s exactly why she can’t stop thinking about him. (Leave his darker moments in the book.)', 'Don’t flatter. Tease the pose, respect the person.'],
      ['fic', 'Jim Halpert', 'The Office (US) · 2005–13', 'The co-conspirator', '#2a3b52', '#e9eef5', 'JH', 'In a dull office, Jim makes Pam feel they share a secret world: a glance at the camera, a prank on Dwight, a Christmas teapot stuffed with inside jokes. He remembers the small things she says and shows her, months later, that he was listening.', 'Build a shared world: inside jokes, callbacks, a look across the room only you two understand.'],
      ['fic', 'Ted Lasso', 'Ted Lasso · 2020–23', 'Curious, not judgmental', '#123a6b', '#fff3c9', 'TL', 'He learns the kit man’s name before the star player’s, asks everyone questions, and brings his boss biscuits every morning until she cracks. In the famous darts scene he points out that the people who underestimated him never got curious enough to ask.', 'Get curious about everyone, especially the people everyone else overlooks.'],
      ['fic', 'Ri Jeong-hyuk', 'Crash Landing on You · 2019', 'Quiet attention', '#2b3d2e', '#eef0e2', 'RJ', 'Hyun Bin’s stern North Korean captain barely speaks. But he notices everything the woman in his care lets slip in passing (a comfort she misses, something she’d love) and quietly makes it appear. He’s proof that the most romantic kind of listening is done with your hands, later.', 'Prove you listened through action, days afterwards.'],
      ['fic', 'Westley', 'The Princess Bride · 1987', 'Playful respect', '#5a3a1a', '#fbecd2', 'W', 'Westley’s “As you wish” said “I love you” for years without saying it. Even his sword fight with Inigo is generous: the two trade compliments mid-duel. He banters with everyone, but never cruelly.', 'Banter with respect. Generosity toward your rival is wildly charming.'],
      ['real', 'Cary Grant', 'Actor · 1904–1986', 'Ease, built on purpose', '#1c1c1c', '#f0e6d6', 'CG', 'Born Archie Leach, a poor boy from Bristol, he constructed “Cary Grant” piece by piece, then played him until he became him. On screen he was happy to be the fool (chased, flustered, upstaged by a leopard) and that willingness to look silly made him irresistible.', 'Ease is learnable. Be willing to look a bit ridiculous.'],
      ['real', 'Paul Newman', 'Actor · 1925–2008', 'Self-deprecating warmth', '#1f3f5f', '#e6eef6', 'PN', 'One of the most handsome men in the world spent his interviews joking about himself and redirecting praise to others. He was married to Joanne Woodward for fifty years and spoke about her with open, funny devotion.', 'Deflect praise, share credit, and be the first to laugh at yourself.'],
      ['real', 'Anthony Bourdain', 'Chef, writer · 1956–2018', 'A guest, not an expert', '#2a2a24', '#efe6cf', 'AB', 'He sat on plastic stools all over the world and got strangers to tell him about their lives by asking about their food, their grandmothers and their neighbourhood, and then really listening. He never pretended to know more about someone’s home than they did.', 'Ask about the food, the place, the family. Be a curious guest at every table.'],
      ['real', 'Keanu Reeves', 'Actor · b. 1964', 'Humility and presence', '#262626', '#e8e8e8', 'KR', 'Countless stories describe him chatting with fans as if he had all the time in the world, giving up his seat on the subway, and posing for photos with his hand hovering politely rather than touching. Fame never seems to have reached his manners.', 'Treat everyone as equally worth your time, and respect their space.'],
      ['real', 'Shah Rukh Khan', 'Actor · b. 1965', 'Wit with gallantry', '#4b1627', '#f6e6d2', 'SRK', 'In interviews he makes himself the punchline, flirts playfully with the whole room without ever making anyone uncomfortable, and leaves interviewers looking brilliant. His humour about his own fame and age disarms everyone.', 'Make yourself the joke and the other person the star.'],
      ['real', 'Fred Rogers', 'Broadcaster · 1928–2003', 'Silence as a gift', '#7a2e2e', '#fde9df', 'FR', 'He let pauses run for as long as they needed. Accepting a lifetime award in 1997, he asked the glittering audience to spend ten seconds silently thinking of someone who had loved them into being, and timed it. Grown stars wept.', 'Let silence breathe. It gives people room to say the real thing.'],
      ['real', 'Bill Clinton', 'Politician · b. 1946', 'Total presence', '#1b2a4a', '#e8edf7', 'BC', 'Allies and enemies describe the same thing: the eye contact, the name remembered years later, the sense that for ninety seconds nothing else existed. It’s Cabane’s favourite example of presence, whatever you make of the man.', 'For the minute you’re with someone, be only with them.'],
      ['real', 'Richard Feynman', 'Physicist · 1918–1988', 'Contagious delight', '#3b2f12', '#f6ebc8', 'RF', 'A Nobel physicist who played bongos, cracked safes for fun and explained quantum mechanics as if telling you a great secret. People loved listening to him because he so obviously loved what he was saying.', 'Talk about what you love with real enthusiasm. Delight is attractive.'],
    ];
    C.forEach(([type, name, from, trait, bg, fg, mono, back, les]) => {
      const b = el('button', 'cc'); b.dataset.type = type; b.style.setProperty('--bg', bg); b.style.setProperty('--fg', fg);
      b.setAttribute('aria-label', `${name}: ${trait}. Flip for the lesson.`);
      b.innerHTML = `<div class="cc-in"><div class="cc-f" data-mono="${mono}"><p class="cc-type">${type === 'fic' ? 'Fiction' : 'Real life'}</p><h3 class="cc-name">${name}</h3><p class="cc-from">${from}</p><p class="cc-trait">${trait}</p></div><div class="cc-b"><h4>${trait}</h4><p>${back}</p><p class="les">${les}</p></div></div>`;
      b.addEventListener('click', () => { b.classList.toggle('flip'); b.setAttribute('aria-pressed', b.classList.contains('flip')); });
      grid.append(b);
    });
    $$('.ch-filter button').forEach((f) => f.addEventListener('click', () => {
      $$('.ch-filter button').forEach((x) => x.classList.toggle('on', x === f));
      let k = 0;
      $$('.cc', grid).forEach((c) => {
        const show = f.dataset.f === 'all' || c.dataset.type === f.dataset.f;
        c.classList.toggle('hide', !show); c.classList.remove('pop');
        if (show) { void c.offsetWidth; c.style.animationDelay = (k++ * .04) + 's'; c.classList.add('pop'); }
      });
    }));
  })();

  /* ───────── mistakes ───────── */
  (() => {
    const root = $('#mistakes'); if (!root) return;
    const M = [
      ['Waiting for your turn instead of listening', 'You can feel it when someone’s just reloading. Listen to the end of their sentence, pause a beat, and let your reply grow from what they actually said.'],
      ['The one-word answer', '“Good.” “Yeah.” “Analyst.” Closed answers make the other person do all the work. Add one piece of free information every time.'],
      ['Interrogating', 'Twenty questions in a row feels like a job interview. After a couple of questions, react, share something of your own, then ask again.'],
      ['Topping their story', 'They saw a fox; you saw a bear. Resist. Ask about their fox first. You can share the bear later, if it helps.'],
      ['Fixing instead of hearing', 'When someone vents, they usually want to be understood, not managed. Ask: “Do you want ideas, or do you just want to vent?”'],
      ['Phone on the table', 'It quietly tells them something more important might come along. Put it away. All the way away.'],
      ['Looking over their shoulder', 'Scanning the room for someone better is the fastest way to make a person feel small. If you need to leave, leave warmly.'],
      ['Trying to be impressive', 'Name-dropping, money talk, humblebrags. People are rarely impressed by impressiveness; they’re won over by interest and warmth.'],
      ['Arguing to win', 'A good-natured disagreement is fun. Needing to win it isn’t. Get curious about why they think what they think.'],
      ['Overstaying', 'The conversation peaked ten minutes ago and you’re still there. Leave on a high: signal, appreciate, reconnect.'],
    ];
    M.forEach(([q, a], i) => {
      const d = el('div', 'mk rv'); d.style.setProperty('--d', (i % 2) * .08 + 's');
      d.innerHTML = `<button aria-expanded="false"><em>${String(i + 1).padStart(2, '0')}</em><b>${q}</b><i aria-hidden="true"></i></button><div class="mk-a"><div><p>${a}</p></div></div>`;
      const b = $('button', d); b.onclick = () => { const o = d.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
      root.append(d);
      if (RM || !('IntersectionObserver' in window)) d.classList.add('in');
      else { const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { d.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' }); io.observe(d); }
    });
  })();

  /* ───────── month of practice ───────── */
  (() => {
    const root = $('#month'); if (!root) return;
    const W = [
      ['Week one · Warm up', ['Say good morning to a neighbour or doorman, and use their name.', 'Ask a barista or shopkeeper how their day is going, and ask one follow-up.', 'Put your phone away for an entire meal with someone.', 'In one conversation, ask only follow-up questions for five minutes.', 'Compliment a stranger on a choice: their shoes, book, or dog’s name.', 'Remember one detail someone tells you and write it down.', 'Call a friend instead of texting.']],
      ['Week two · Threads', ['Practise threading: find three threads in one answer.', 'Use a mirror (repeat their last words) twice in one chat.', 'Ask someone for their opinion on something trivial and enjoy their answer.', 'Start a conversation with a stranger using the ARE method.', 'Give a “free information” answer when someone asks what you do.', 'Notice every shift response you make today. Just notice.', 'Text someone to follow up on the detail you wrote down in week one.']],
      ['Week three · Depth', ['Ask a friend a rung-four question: “What are you looking forward to?”', 'Label a feeling: “Sounds like that was frustrating.”', 'Tell a story in under sixty seconds, ending with a question.', 'Pull a quiet person into a group conversation.', 'Ask “why?” about someone’s job or hobby, and listen fully.', 'Share something slightly personal first, then ask.', 'Have a conversation where you stay comfortable through a pause.']],
      ['Week four · Charm', ['Make a callback to a joke from earlier in the conversation.', 'Gently tease a choice someone made (with obvious affection).', 'Introduce two people to each other with a reason they’ll get on.', 'Celebrate someone’s good news with real questions.', 'End a conversation gracefully: signal, appreciate, reconnect.', 'Ask someone out, or invite a new friend for coffee. Say it plainly.', 'Talk to the person everyone else is ignoring.', 'Write down your three best stories.', 'Look back: which conversation this month will you remember?']],
    ];
    const KEY = 'lrn-conversation-month';
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
    const grid = $('#mo-grid'); let n = 0;
    W.forEach(([h, items]) => {
      grid.append(el('li', 'wk', h));
      items.forEach((t) => {
        const id = n++; const li = el('li');
        li.innerHTML = `<input type="checkbox" id="mo-${id}" ${saved.includes(id) ? 'checked' : ''}><label for="mo-${id}"><span class="d">${id + 1}</span><span>${t}</span></label>`;
        grid.append(li);
      });
    });
    const boxes = $$('input', grid), fill = $('#mo-fill'), num = $('#mo-n'), lab = $('#mo-l');
    const LAB = ['Day one starts whenever you do.', 'Good start. The first few are the hardest.', 'You’re building a habit now.', 'Halfway. People are noticing.', 'Nearly there. This is who you are now.', 'Thirty days. Good company, indeed.'];
    const upd = () => {
      const on = boxes.filter((b) => b.checked).length, tot = boxes.length;
      fill.style.strokeDashoffset = (326.7 * (1 - on / tot)).toFixed(1);
      num.textContent = `${on} / ${tot}`;
      lab.textContent = LAB[on === tot ? 5 : Math.min(4, Math.ceil(on / tot * 4))];
      try { localStorage.setItem(KEY, JSON.stringify(boxes.map((b, i) => b.checked ? i : -1).filter((i) => i >= 0))); } catch (e) { /* storage unavailable */ }
    };
    boxes.forEach((b) => b.addEventListener('change', upd));
    $('#mo-reset').onclick = () => { boxes.forEach((b) => (b.checked = false)); upd(); };
    upd();
  })();
})();

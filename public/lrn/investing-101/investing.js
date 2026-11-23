const byId = (id) => document.getElementById(id);
const setText = (id, value) => {
  const element = byId(id);
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
};
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
const decimals = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const money = (amount) => rupees.format(amount);
const percent = (amount) => decimals.format(amount) + '%';
const signedPercent = (amount) => {
  if (Math.abs(amount) < .005) return '0%';
  return (amount < 0 ? '−' : '+') + percent(Math.abs(amount));
};
const amount = (id) => byId(id).valueAsNumber;

function watchRanges(ids, render) {
  function update() {
    render();
    ids.forEach((id) => byId(id).setAttribute('aria-valuetext', byId(id + '-value').textContent));
  }
  ids.forEach((id) => byId(id).addEventListener('input', update));
  update();
}

function choose(id, key, render) {
  const group = byId(id);
  group.addEventListener('click', (event) => {
    const selected = event.target.closest('button');
    if (!selected || selected.getAttribute('aria-pressed') === 'true') return;
    group.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
    selected.setAttribute('aria-pressed', 'true');
    render(selected.dataset[key]);
  });
}

function width(id, percentage) {
  byId(id).style.width = percentage + '%';
}

function makeChart(id) {
  const canvas = byId(id);
  const ctx = canvas.getContext('2d');
  let data;
  const inks = ['#286347', '#a46924'];

  function draw() {
    if (!ctx || !data) return;
    const { series, label, timeLabel, floor } = data;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.font = '12px "Segoe UI", sans-serif';

    const values = series.flat();
    const low = floor ?? Math.min(...values);
    const high = Math.max(low + 1, ...values);
    const divider = 4;
    const ticks = Array.from({ length: divider + 1 }, (_, i) => high - (high - low) * i / divider);
    const left = Math.max(...ticks.map((tick) => ctx.measureText(label(tick)).width)) + 10;
    const right = w - 12;
    const top = 12;
    const bottom = h - 24;
    const count = series[0].length;
    const x = (i) => left + (right - left) * i / (count - 1);
    const y = (value) => top + (bottom - top) * (high - value) / (high - low);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4c6152';
    ctx.strokeStyle = '#c8d6c3';
    for (const tick of ticks) {
      const ordinate = y(tick);
      ctx.fillText(label(tick), left - 7, ordinate);
      ctx.beginPath();
      ctx.moveTo(left, ordinate);
      ctx.lineTo(right, ordinate);
      ctx.stroke();
    }

    const xTicks = [0, Math.floor((count - 1) / 2), count - 1];
    for (const i of xTicks) {
      ctx.textAlign = i === 0 ? 'left' : i === count - 1 ? 'right' : 'center';
      ctx.fillText(timeLabel(i), x(i), h - 9);
    }

    series.forEach((line, index) => {
      ctx.beginPath();
      line.forEach((value, i) => i ? ctx.lineTo(x(i), y(value)) : ctx.moveTo(x(i), y(value)));
      ctx.strokeStyle = inks[index];
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash(index === 1 ? [5, 5] : []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = inks[index];
      const last = line.length - 1;
      ctx.beginPath();
      ctx.arc(x(last), y(line[last]), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const observer = new ResizeObserver(draw);
  observer.observe(canvas);
  return (next) => {
    data = next;
    draw();
  };
}

function compactMoney(value) {
  if (value >= 1e7) return '₹' + decimals.format(value / 1e7) + ' cr';
  if (value >= 1e5) return '₹' + decimals.format(value / 1e5) + ' L';
  if (value >= 1e3) return '₹' + decimals.format(value / 1e3) + 'k';
  return money(value);
}

const growthChart = makeChart('growth-chart');
watchRanges(['grow-monthly', 'grow-years', 'grow-rate', 'grow-inflation'], () => {
  const monthly = amount('grow-monthly');
  const years = amount('grow-years');
  const rate = amount('grow-rate');
  const inflation = amount('grow-inflation');
  const monthlyRate = (1 + rate / 100) ** (1 / 12) - 1;
  const balances = [0];
  const contributions = [0];
  let balance = 0;
  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balance = balance * (1 + monthlyRate) + monthly;
    }
    balances.push(balance);
    contributions.push(monthly * 12 * year);
  }
  setText('grow-monthly-value', money(monthly));
  setText('grow-years-value', years);
  setText('grow-rate-value', percent(rate));
  setText('grow-inflation-value', percent(inflation));
  setText('grow-paid', money(monthly * 12 * years));
  setText('grow-balance', money(balance));
  setText('grow-real', money(balance / (1 + inflation / 100) ** years));
  growthChart({ series: [balances, contributions], label: compactMoney, timeLabel: (year) => 'Yr ' + year, floor: 0 });
});

const assets = {
  cash: ['LIQUIDITY', 'Cash and equivalents', 'Bank deposits or short-term instruments.', 'Interest or the difference between the purchase price and maturity value.', 'Inflation, withdrawal restrictions and who backs the product.'],
  bonds: ['LENDING', 'Bonds', 'A loan to a government, company or other issuer.', 'Coupon payments, principal repayment and changes in the resale price.', 'Default, shifting market yields, inflation and liquidity.'],
  stocks: ['OWNERSHIP', 'Stocks', 'A slice of a business.', 'Earnings, dividends and the price buyers are willing to pay.', 'Business failure, price declines and concentration.'],
  property: ['REAL ASSETS', 'Real estate', 'A building, a property share or units in a REIT.', 'Net rent, distributions and changes in property value.', 'Vacancy, repairs, borrowing costs and difficulty selling.'],
  gold: ['COMMODITIES', 'Gold', 'Metal itself or a vehicle providing gold exposure.', 'The price a buyer will pay, after costs.', 'Long stretches of weak returns, custody, spreads and fees.'],
  alts: ['SPECIALIZED EXPOSURE', 'Alternatives', 'Exposure that may include private assets, derivatives or cryptoassets.', 'Cash flows, contract payoffs or price moves, depending on the asset.', 'Lockups, leverage, custody, valuation and the potential for large losses.'],
};
choose('asset-buttons', 'asset', (key) => {
  const ids = ['asset-category', 'asset-name', 'asset-own', 'asset-pay', 'asset-risk'];
  ids.forEach((id, i) => setText(id, assets[key][i]));
  byId('asset-name').parentElement.classList.toggle('is-updated');
});

watchRanges(['bond-yield', 'bond-years'], () => {
  const yieldPercent = amount('bond-yield');
  const years = amount('bond-years');
  const discount = 1 + yieldPercent / 100;
  const face = 10_000;
  const coupon = 700;
  let price = face / discount ** years;
  for (let year = 1; year <= years; year++) price += coupon / discount ** year;
  setText('bond-yield-value', percent(yieldPercent));
  setText('bond-years-value', years);
  setText('bond-price', money(price));
  setText('bond-change', signedPercent((price / face - 1) * 100));
});

watchRanges(['fee-low', 'fee-high', 'fee-years'], () => {
  const feeA = amount('fee-low');
  const feeB = amount('fee-high');
  const years = amount('fee-years');
  const ending = (fee) => 100_000 * (1.08 * (1 - fee / 100)) ** years;
  const balanceA = ending(feeA);
  const balanceB = ending(feeB);
  const max = Math.max(balanceA, balanceB);
  setText('fee-low-value', feeA.toFixed(2) + '%');
  setText('fee-high-value', feeB.toFixed(2) + '%');
  setText('fee-years-value', years);
  setText('fee-a', money(balanceA));
  setText('fee-b', money(balanceB));
  setText('fee-gap', money(Math.abs(balanceA - balanceB)));
  width('fee-bar-a', 100 * balanceA / max);
  width('fee-bar-b', 100 * balanceB / max);
});

const shocks = { equity: [-40, 3], rates: [-10, -15], both: [-30, -10] };
let shock = 'equity';
function renderStress() {
  const stocks = amount('stress-stock');
  const bondInput = byId('stress-bond');
  const bonds = Math.min(bondInput.valueAsNumber, 100 - stocks);
  bondInput.max = 100 - stocks;
  bondInput.value = bonds;
  const cash = 100 - stocks - bonds;
  const [stockReturn, bondReturn] = shocks[shock];
  const change = (stocks * stockReturn + bonds * bondReturn) / 100;
  const capital = 1_000_000;
  setText('stress-stock-value', percent(stocks));
  setText('stress-bond-value', percent(bonds));
  setText('stress-cash', percent(cash));
  setText('stress-end', money(capital * (1 + change / 100)));
  setText('stress-return', signedPercent(change));
  setText('stress-recover', percent(change < 0 ? -change / (1 + change / 100) : 0));
  setText('stress-assumptions', 'Assumptions: stocks ' + signedPercent(stockReturn) + ', bonds ' + signedPercent(bondReturn) + ', cash 0%. One-period model before fees and taxes.');
  width('stress-stock-bar', stocks);
  width('stress-bond-bar', bonds);
  width('stress-cash-bar', cash);
}
choose('stress-buttons', 'shock', (value) => {
  shock = value;
  renderStress();
});
watchRanges(['stress-stock', 'stress-bond'], renderStress);

const timingChart = makeChart('timing-chart');
const pricePaths = {
  climb: [100, 105, 110, 115, 120, 125],
  dip: [100, 90, 75, 85, 100, 110],
  fall: [100, 95, 88, 83, 78, 72],
};
function renderTiming(path) {
  const prices = pricePaths[path];
  const last = prices.at(-1);
  const upfrontUnits = 60_000 / prices[0];
  const phasedUnits = prices.reduce((total, price) => total + 10_000 / price, 0);
  setText('timing-prices', 'Month 1–6 prices: ' + prices.map(money).join(' · '));
  setText('timing-immediate', money(upfrontUnits * last));
  setText('timing-phased', money(phasedUnits * last));
  timingChart({ series: [prices], label: money, timeLabel: (i) => 'Month ' + (i + 1), floor: 60 });
}
choose('timing-buttons', 'path', renderTiming);
renderTiming('climb');

watchRanges(['rebal-change'], () => {
  const stockReturn = amount('rebal-change');
  const stocks = 60_000 * (1 + stockReturn / 100);
  const bonds = 40_000;
  const total = stocks + bonds;
  const target = .6;
  const stockWeight = stocks / total;
  const trade = stocks - total * target;
  const addToBonds = stocks / target - total;
  const addToStocks = bonds / (1 - target) - total;
  setText('rebal-change-value', signedPercent(stockReturn));
  setText('rebal-weight', percent(stockWeight * 100));
  setText('rebal-trade-label', stockReturn > 0 ? 'Move from stocks to bonds' : stockReturn < 0 ? 'Move from bonds to stocks' : 'Trade needed');
  setText('rebal-cash-label', stockReturn > 0 ? 'Or add cash to bonds' : stockReturn < 0 ? 'Or add cash to stocks' : 'Contribution needed');
  setText('rebal-trade', money(Math.abs(trade)));
  setText('rebal-cash', money(Math.max(0, addToBonds, addToStocks)));
  width('rebal-stock-bar', stockWeight * 100);
  width('rebal-bond-bar', (1 - stockWeight) * 100);
});

const sequenceChart = makeChart('sequence-chart');
const gainsFirst = [.22, .15, .08, .05, -.12, -.2];
const lossesFirst = [...gainsFirst].reverse();
function spendThrough(returns, withdrawal) {
  const balances = [1_000_000];
  let unmet = 0;
  for (const annualReturn of returns) {
    const available = balances.at(-1);
    const paid = Math.min(available, withdrawal);
    balances.push((available - paid) * (1 + annualReturn));
    unmet += withdrawal - paid;
  }
  return { balances, unmet };
}
watchRanges(['sequence-spend'], () => {
  const spend = amount('sequence-spend');
  const early = spendThrough(gainsFirst, spend);
  const late = spendThrough(lossesFirst, spend);
  setText('sequence-spend-value', money(spend));
  setText('sequence-strong', money(early.balances.at(-1)));
  setText('sequence-weak', money(late.balances.at(-1)));
  setText('sequence-strong-short', early.unmet ? money(early.unmet) + ' in missed withdrawals' : '');
  setText('sequence-weak-short', late.unmet ? money(late.unmet) + ' in missed withdrawals' : '');
  sequenceChart({
    series: [early.balances, late.balances],
    label: compactMoney, timeLabel: (year) => 'Yr ' + year, floor: 0,
  });
});

const checklist = byId('first-checklist');
const checklistItems = [...checklist.querySelectorAll('input[type="checkbox"]')];
const checklistKey = 'lrn-investing-101-checklist';
function updateChecklist() {
  const checked = checklistItems.filter((item) => item.checked).map((item) => item.value);
  setText('check-status', checked.length + ' of ' + checklistItems.length + ' complete');
  try {
    localStorage.setItem(checklistKey, JSON.stringify(checked));
  } catch {
    // The checklist remains usable in browsers that disable storage.
  }
}
try {
  const previous = JSON.parse(localStorage.getItem(checklistKey));
  if (Array.isArray(previous)) checklistItems.forEach((item) => { item.checked = previous.includes(item.value); });
} catch {
  // A failed read or previous invalid value falls back to an empty checklist.
}
checklist.addEventListener('change', updateChecklist);
byId('check-reset').addEventListener('click', () => {
  checklistItems.forEach((item) => { item.checked = false; });
  updateChecklist();
});
updateChecklist();

const termQuery = byId('term-query');
const termCategory = byId('term-category');
const terms = [...byId('term-list').children].map((entry) => ({
  entry,
  text: ['dt', 'dd'].map((tag) => entry.querySelector(tag).firstChild.textContent.trim().toLowerCase()).join(' '),
}));
function filterTerms() {
  const query = termQuery.value.trim().toLowerCase();
  const category = termCategory.value;
  let found = 0;
  for (const { entry, text } of terms) {
    const matches = (!category || entry.dataset.category === category) && text.includes(query);
    entry.hidden = !matches;
    if (matches) found++;
  }
  setText('term-count', found + ' of ' + terms.length + ' terms');
  byId('term-empty').hidden = found > 0;
}
termQuery.addEventListener('input', filterTerms);
termCategory.addEventListener('change', filterTerms);
byId('glossary-controls').hidden = false;

const quiz = byId('investing-quiz');
const answerKey = ['b', 'c', 'a', 'b', 'c'];
const quizNotes = answerKey.map((_, i) => byId('quiz-note-' + (i + 1)));
const explanations = quizNotes.map((note) => note.textContent);
quiz.querySelector('[type="submit"]').disabled = false;
function clearFeedback() {
  quiz.querySelectorAll('.correct, .incorrect').forEach((label) => label.classList.remove('correct', 'incorrect'));
  quizNotes.forEach((note) => { note.hidden = true; });
  setText('quiz-status', '');
}
quiz.addEventListener('submit', (event) => {
  event.preventDefault();
  clearFeedback();
  const data = new FormData(quiz);
  let correct = 0;
  answerKey.forEach((answer, i) => {
    const field = 'q' + (i + 1);
    const chosen = data.get(field);
    const right = answer === chosen;
    if (right) correct++;
    const radio = [...quiz.elements[field]].find((input) => input.value === chosen);
    radio.closest('label').classList.add(right ? 'correct' : 'incorrect');
    quizNotes[i].textContent = (right ? 'Correct. ' : 'Take another look. ') + explanations[i];
    quizNotes[i].hidden = false;
  });
  setText('quiz-status', correct + ' out of ' + answerKey.length + ' correct.');
});
quiz.addEventListener('change', clearFeedback);
quiz.addEventListener('reset', clearFeedback);

const contents = byId('contents');
const compact = matchMedia('(max-width: 720px)');
const chapterLinks = [...contents.querySelectorAll('a')];
const chapters = chapterLinks.map((link) => byId(link.hash.slice(1)));
const readingProgress = byId('reading-progress');
const article = document.querySelector('.article');
let scrollQueued = false;
let selectedChapter = -1;
function updateContents() {
  const articleBounds = article.getBoundingClientRect();
  const visibleDepth = Math.max(1, articleBounds.height - innerHeight);
  const read = Math.min(1, Math.max(0, -articleBounds.top / visibleDepth));
  readingProgress.style.transform = 'scaleX(' + read + ')';
  let chapter = 0;
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].getBoundingClientRect().top > innerHeight * .32) break;
    chapter = i;
  }
  if (chapter !== selectedChapter) {
    chapterLinks[selectedChapter]?.removeAttribute('aria-current');
    chapterLinks[chapter].setAttribute('aria-current', 'location');
    selectedChapter = chapter;
  }
  scrollQueued = false;
}
function queueContentsUpdate() {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateContents);
  }
}
function matchContents() {
  contents.open = !compact.matches;
  queueContentsUpdate();
}
compact.addEventListener('change', matchContents);
contents.addEventListener('click', (event) => {
  if (compact.matches && event.target.closest('a')) contents.open = false;
});
window.addEventListener('scroll', queueContentsUpdate, { passive: true });
new ResizeObserver(queueContentsUpdate).observe(article);
matchContents();

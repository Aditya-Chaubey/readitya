"use strict";

const agentById = (id) => document.getElementById(id);
const loopStages = {
  goal: ["What are we trying to do?", "Find a free, step-free pickup for The Moon Atlas before 6 p.m."],
  act: ["Ask the catalog.", "The search suggests that Central and Cedar might have copies."],
  observe: ["The last copy went out.", "Central’s live record says zero available. The catalog snapshot is stale."],
  decide: ["Try the next candidate.", "Check Cedar’s stock and access before asking for a hold."]
};
const loopBeats = [...document.querySelectorAll("[data-beat]")];
const loopNodes = [...document.querySelectorAll("[data-node]")];
const loopJumps = [...document.querySelectorAll("[data-loop-jump]")];
const agentChapters = [...document.querySelectorAll("[data-agent-chapter]")];
const agentChapterLinks = [...document.querySelectorAll(".agent-rail a")];
const agentProgress = document.querySelector(".agent-progress span");
const agentMain = agentById("agent-main");
let visibleStage = "goal";
let visibleChapter = -1;
let scrollFrame = 0;

function showStage(name) {
  if (name === visibleStage) return;
  visibleStage = name;
  const [title, text] = loopStages[name];
  agentById("loop-figure-title").textContent = title;
  agentById("loop-example").textContent = text;
  loopNodes.forEach((node) => node.classList.toggle("is-active", node.dataset.node === name));
  loopJumps.forEach((link) => {
    if (link.dataset.loopJump === name) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
}

function updateReading() {
  scrollFrame = 0;
  const bounds = agentMain.getBoundingClientRect();
  const fraction = -bounds.top / Math.max(1, bounds.height - innerHeight);
  agentProgress.style.transform = "scaleX(" + Math.min(1, Math.max(0, fraction)) + ")";
  let stage = "goal";
  const loopThreshold = innerHeight * (innerWidth <= 680 && innerHeight <= 570 ? .25 : .52);
  loopBeats.forEach((beat) => {
    if (beat.getBoundingClientRect().top <= loopThreshold) stage = beat.dataset.beat;
  });
  showStage(stage);

  let active = 0;
  agentChapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= innerHeight * .35) active = index;
  });
  if (active !== visibleChapter) {
    visibleChapter = active;
    agentChapterLinks.forEach((link, index) => {
      if (index === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
}
function scheduleReading() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReading);
}
addEventListener("scroll", scheduleReading, { passive: true });
addEventListener("resize", scheduleReading);
updateReading();

const scenario = agentById("scenario");
const runStatus = agentById("run-status");
const nextStep = agentById("run-step");
const play = agentById("run-play");
const reset = agentById("run-reset");
const runGate = agentById("run-gate");
const runLog = agentById("run-log");
const holdQuestion = agentById("hold-question");

const branches = {
  Central: { closes: "7:00 p.m.", access: "a step-free east entrance", receipt: "H-193" },
  Cedar: { closes: "6:30 p.m.", access: "a step-free main entrance", receipt: "H-284" }
};
const cases = {
  stale: { centralCopies: 0, cedarAccessible: true, receiptLost: false },
  smooth: { centralCopies: 1, cedarAccessible: true, receiptLost: false },
  receipt: { centralCopies: 1, cedarAccessible: true, receiptLost: true },
  blocked: { centralCopies: 0, cedarAccessible: false, receiptLost: false }
};

let state;
let timer = 0;

function log(title, message) {
  const item = document.createElement("li");
  const label = document.createElement("b");
  const description = document.createElement("p");
  label.textContent = title;
  description.textContent = message;
  item.append(label, description);
  runLog.append(item);
}

function pause() {
  clearInterval(timer);
  timer = 0;
}

function renderRun() {
  const awaiting = state.stage === "approval";
  const finished = state.stage === "end";
  if (awaiting || finished) pause();
  runStatus.value = state.status;
  nextStep.disabled = awaiting || finished;
  play.disabled = awaiting || finished;
  play.textContent = timer ? "Pause" : "Play";
  runGate.hidden = !awaiting;
  if (awaiting) {
    holdQuestion.textContent = "Hold one copy of The Moon Atlas at " + state.branch + " Library for $0, for pickup by 6 p.m.?";
  }
}

function resetRun() {
  pause();
  state = { facts: cases[scenario.value], stage: "search", status: "Ready", branch: null, approval: null };
  runLog.replaceChildren();
  log("Goal loaded", "The agent can read library data. Placing a hold requires approval.");
  renderRun();
}

function askForHold(branch) {
  state.branch = branch;
  state.stage = "approval";
  state.status = "Needs approval";
  log("Approval requested", "The agent found a copy that meets the constraints. It pauses before changing the library record.");
}

function finish(status, title, message) {
  state.stage = "end";
  state.status = status;
  log(title, message);
}

function confirmHold() {
  const { closes, access, receipt } = branches[state.branch];
  finish("Confirmed", "Receipt " + receipt,
    "The Moon Atlas is on hold at " + state.branch + " Library. Pickup by 6 p.m. The branch has " + access + " and closes at " + closes);
}

function step() {
  const { facts } = state;
  switch (state.stage) {
    case "search":
      log("Catalog search", "The catalog snapshot lists one copy at Central and one at Cedar. Check the live Central record first.");
      state.stage = "central";
      state.status = "Checking";
      break;
    case "central":
      if (facts.centralCopies === 0) {
        log("Central live check", "Zero copies available. The catalog snapshot was stale. Check Cedar before asking for a hold.");
        state.stage = "cedar";
      } else {
        log("Central live check", "One copy available, $0, step-free east entrance, open until 7 p.m.");
        askForHold("Central");
      }
      break;
    case "cedar":
      if (facts.cedarAccessible) {
        log("Cedar live check", "One copy available, $0, step-free main entrance, open until 6:30 p.m.");
        askForHold("Cedar");
      } else {
        log("Cedar live check", "One copy available. The ramp is closed and the only open entrance has steps.");
        finish("No qualifying copy", "Stopped without a hold", "Central’s copy is gone and Cedar fails the access requirement.");
      }
      break;
    case "place":
      if (state.approval !== state.branch) return;
      if (facts.receiptLost) {
        log("Hold request timed out", "The reply never arrived. The operation may have succeeded. Check its status using the original request ID.");
        state.stage = "verify";
        state.status = "Verifying";
      } else {
        confirmHold();
      }
      break;
    case "verify":
      log("Status lookup", "The service reports that the original request succeeded. There’s no need to place another hold.");
      confirmHold();
      break;
    default:
      return;
  }
  renderRun();
  if ((state.stage === "approval" || state.stage === "end") && document.activeElement?.disabled) {
    if (state.stage === "approval") agentById("run-approve").focus({ preventScroll: true });
    else reset.focus({ preventScroll: true });
  }
}

scenario.addEventListener("change", resetRun);
reset.addEventListener("click", resetRun);
nextStep.addEventListener("click", step);
play.addEventListener("click", () => {
  if (timer) {
    pause();
    renderRun();
    return;
  }
  timer = setInterval(step, 1250);
  step();
});
agentById("run-approve").addEventListener("click", () => {
  if (state.stage !== "approval") return;
  state.approval = state.branch;
  state.stage = "place";
  state.status = "Approved";
  log("Hold approved", "Permission recorded for " + state.branch + " only. The next step makes the request.");
  renderRun();
  nextStep.focus({ preventScroll: true });
});
agentById("run-decline").addEventListener("click", () => {
  if (state.stage !== "approval") return;
  finish("Declined", "Stopped without a hold", "You declined. The agent reports the candidate but makes no reservation.");
  renderRun();
  reset.focus({ preventScroll: true });
});
resetRun();

const approaches = {
  chat: ["You choose the next step.", "The system can explain how to check other branches. You open the catalog, look up access, and decide where to go."],
  workflow: ["The programmed rule chooses.", "When a branch has no stock, the workflow checks the next branch on its list. The transition was written into the software ahead of time."],
  agent: ["The model chooses within set limits.", "The model sees the out-of-stock result, then chooses a different lookup, asks a question, or stops. The application still controls what it can access or change."]
};
const approachButtons = [...document.querySelectorAll("[data-approach]")];
approachButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const [owner, explanation] = approaches[button.dataset.approach];
    agentById("choice-owner").textContent = owner;
    agentById("choice-explanation").textContent = explanation;
    approachButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
  });
});

const stepsCount = agentById("steps-count");
const stepOdds = agentById("step-odds");
const chain = agentById("odds-chain");
function updateOdds() {
  const count = Number(stepsCount.value);
  const percentage = Number(stepOdds.value);
  const chance = percentage / 100;
  agentById("steps-value").value = count;
  agentById("odds-value").value = percentage + "%";
  agentById("total-odds").value = (100 * chance ** count).toFixed(1) + "%";
  while (chain.children.length > count) chain.lastElementChild.remove();
  while (chain.children.length < count) chain.append(document.createElement("span"));
  [...chain.children].forEach((bar, i) => bar.style.setProperty("--height", (100 * chance ** (i + 1)) + "%"));
}
[stepsCount, stepOdds].forEach((input) => input.addEventListener("input", updateOdds));
updateOdds();

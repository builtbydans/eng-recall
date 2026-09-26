import { applyShuffle, createShuffle, isValidShuffle } from "./shuffle.mjs";

async function loadCards(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

const [notionCards, extraOpenCards, mcqCards, extraMcqCards] = await Promise.all([
  loadCards("./cards.json"), loadCards("./extra-open.json"), loadCards("./mcq.json"), loadCards("./mcq-extra.json"),
]);
const allMcqCards = [...mcqCards, ...extraMcqCards];

const palettes = {
  TypeScript: { tint: "#eaf1fc", accent: "#a1bce8", ink: "#3c567c" },
  JavaScript: { tint: "#f9f2dd", accent: "#e5ce88", ink: "#6b5a2f" },
  Async: { tint: "#f8eddf", accent: "#e9bc8c", ink: "#765433" },
  Node: { tint: "#eaf3e8", accent: "#a4c8a1", ink: "#416249" },
  Errors: { tint: "#faeae9", accent: "#e7b0ab", ink: "#7b4947" },
  "Big O": { tint: "#f8eaf1", accent: "#dfb2cf", ink: "#754d68" },
  "HTTP & APIs": { tint: "#e7f4f3", accent: "#a1d1c9", ink: "#356761" },
  Databases: { tint: "#f4ecf8", accent: "#c8aad9", ink: "#684d78" },
  React: { tint: "#e8f4fa", accent: "#a5d4e7", ink: "#416678" },
  "System Design": { tint: "#f2f0e5", accent: "#d4cca2", ink: "#666041" },
};

const $ = (id) => document.getElementById(id);
const ui = {
  app: $("app"), panel: $("practice-panel"), openTab: $("open-tab"), mcqTab: $("mcq-tab"),
  category: $("category"), count: $("count"), score: $("score"), reset: $("reset-button"), eyebrow: $("eyebrow"),
  difficulty: $("difficulty"), question: $("question"), code: $("code-example"), choices: $("choices"),
  answerPanel: $("answer-panel"), answer: $("answer-text"), kicker: $("answer-kicker"),
  content: $("answer-content"), toggle: $("answer-toggle"), label: $("answer-label"), hint: $("answer-hint"),
  next: $("next-button"), progress: $("progress"), fill: $("progress-fill"),
  grade: $("self-grade"), gradeYes: $("grade-yes"), gradeNo: $("grade-no"), gradeNote: $("grade-note"),
};

const storageKey = "eng-recall-progress-v3";
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* Storage is optional. */ }
const initialShuffle = isValidShuffle(allMcqCards, stored.shuffle) ? stored.shuffle : createShuffle(allMcqCards);
const decks = { open: [...notionCards, ...extraOpenCards], mcq: applyShuffle(allMcqCards, initialShuffle) };
const state = {
  mode: stored.mode === "mcq" ? "mcq" : "open",
  categories: { open: stored.categories?.open || "All cards", mcq: stored.categories?.mcq || "All cards" },
  current: { open: stored.current?.open, mcq: stored.current?.mcq },
  marks: { open: stored.marks?.open || {}, mcq: isValidShuffle(allMcqCards, stored.shuffle) ? stored.marks?.mcq || {} : {} },
  shuffle: initialShuffle,
};
let opened = false;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Private browsing is fine. */ }
}
function visibleCards() {
  const deck = decks[state.mode];
  const category = state.categories[state.mode];
  return category === "All cards" ? deck : deck.filter((card) => card.category === category);
}
function indexOfCurrent(list) {
  const index = list.findIndex((card) => card.id === state.current[state.mode]);
  return index < 0 ? 0 : index;
}
function currentCard() { const list = visibleCards(); return list[indexOfCurrent(list)]; }
function currentMark() { return state.marks[state.mode][currentCard().id]; }
function updateScore() {
  const list = visibleCards();
  const marks = state.marks[state.mode];
  const answered = list.filter((card) => Object.hasOwn(marks, card.id));
  const correct = answered.filter((card) => state.mode === "open" ? marks[card.id] === true : marks[card.id] === card.correctIndex);
  ui.score.textContent = `Score ${correct.length}/${answered.length}`;
  ui.score.setAttribute("aria-label", `${correct.length} correct out of ${answered.length} answered in ${state.mode === "open" ? "open-ended" : "multiple choice"} mode`);
}
function setOpen(value) {
  opened = value;
  ui.toggle.setAttribute("aria-expanded", String(value));
  ui.content.hidden = !value;
  ui.label.textContent = state.mode === "mcq" || value ? "Answer" : "Reveal answer";
}
function populateCategories() {
  const deck = decks[state.mode];
  const available = ["All cards", ...Object.keys(palettes).filter((name) => deck.some((card) => card.category === name))];
  if (!available.includes(state.categories[state.mode])) state.categories[state.mode] = "All cards";
  ui.category.replaceChildren();
  for (const name of available) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name === "All cards" ? `All cards (${deck.length})` : `${name} (${deck.filter((card) => card.category === name).length})`;
    ui.category.append(option);
  }
  ui.category.value = state.categories[state.mode];
}
function renderChoices(card, selected) {
  ui.choices.replaceChildren();
  ui.choices.hidden = state.mode !== "mcq";
  if (state.mode !== "mcq") return;
  card.options.forEach((option, index) => {
    const button = document.createElement("button");
    const letter = document.createElement("span");
    const label = document.createElement("span");
    letter.className = "choice-letter";
    letter.textContent = "ABCD"[index];
    label.textContent = option;
    button.className = "choice";
    button.type = "button";
    button.append(letter, label);
    if (selected !== undefined) {
      button.disabled = true;
      if (index === card.correctIndex) button.classList.add("is-correct");
      else if (index === selected) button.classList.add("is-incorrect");
    } else {
      button.addEventListener("click", () => {
        state.marks.mcq[card.id] = index;
        save();
        renderChoices(card, index);
        renderAnswer(card, index);
        setOpen(true);
        updateScore();
      });
    }
    ui.choices.append(button);
  });
}
function renderAnswer(card, mark) {
  if (state.mode === "mcq") {
    ui.answerPanel.classList.toggle("is-awaiting-choice", mark === undefined);
    ui.hint.hidden = mark !== undefined;
    ui.toggle.disabled = mark === undefined;
    ui.kicker.textContent = mark === card.correctIndex ? "CORRECT" : "NOT QUITE";
    ui.answer.textContent = `Correct answer: ${card.options[card.correctIndex]}\n\n${card.explanation}`;
    ui.grade.hidden = true;
    ui.gradeNote.hidden = true;
  } else {
    ui.answerPanel.classList.remove("is-awaiting-choice");
    ui.hint.hidden = true;
    ui.toggle.disabled = false;
    ui.kicker.textContent = "THE ANSWER";
    ui.answer.textContent = card.answer;
    ui.grade.hidden = false;
    ui.gradeNote.hidden = true;
    ui.gradeYes.classList.toggle("is-selected", mark === true);
    ui.gradeNo.classList.toggle("is-selected", mark === false);
    ui.gradeYes.setAttribute("aria-pressed", String(mark === true));
    ui.gradeNo.setAttribute("aria-pressed", String(mark === false));
  }
}
function render() {
  populateCategories();
  const list = visibleCards();
  const index = indexOfCurrent(list);
  const card = list[index];
  state.current[state.mode] = card.id;
  const palette = palettes[card.category];
  ui.app.style.setProperty("--tint", palette.tint);
  ui.app.style.setProperty("--accent", palette.accent);
  ui.app.style.setProperty("--ink", palette.ink);
  ui.count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  ui.eyebrow.textContent = `${card.category} · ${String(index + 1).padStart(2, "0")}`;
  ui.difficulty.textContent = card.difficulty;
  ui.question.textContent = card.question;
  ui.code.hidden = !card.code;
  ui.code.textContent = card.code || "";
  const percentage = Math.round(((index + 1) / list.length) * 100);
  ui.fill.style.width = `${percentage}%`;
  ui.progress.setAttribute("aria-valuenow", String(percentage));
  ui.progress.setAttribute("aria-valuetext", `Card ${index + 1} of ${list.length}`);
  ui.openTab.setAttribute("aria-selected", String(state.mode === "open"));
  ui.mcqTab.setAttribute("aria-selected", String(state.mode === "mcq"));
  ui.openTab.tabIndex = state.mode === "open" ? 0 : -1;
  ui.mcqTab.tabIndex = state.mode === "mcq" ? 0 : -1;
  ui.panel.setAttribute("aria-labelledby", state.mode === "open" ? "open-tab" : "mcq-tab");
  const mark = currentMark();
  renderChoices(card, mark);
  renderAnswer(card, mark);
  setOpen(state.mode === "mcq" && mark !== undefined);
  updateScore();
  save();
}
function switchMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}
ui.openTab.addEventListener("click", () => switchMode("open"));
ui.mcqTab.addEventListener("click", () => switchMode("mcq"));
for (const [tab, mode] of [[ui.openTab, "open"], [ui.mcqTab, "mcq"]]) {
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const nextMode = mode === "open" ? "mcq" : "open";
    switchMode(nextMode);
    (nextMode === "open" ? ui.openTab : ui.mcqTab).focus();
  });
}
ui.category.addEventListener("change", (event) => {
  state.categories[state.mode] = event.target.value;
  state.current[state.mode] = visibleCards()[0].id;
  render();
});
ui.toggle.addEventListener("click", () => setOpen(!opened));
for (const [button, grade] of [[ui.gradeNo, false], [ui.gradeYes, true]]) {
  button.addEventListener("click", () => {
    state.marks.open[currentCard().id] = grade;
    save();
    renderAnswer(currentCard(), grade);
    updateScore();
  });
}
ui.next.addEventListener("click", () => {
  const list = visibleCards();
  state.current[state.mode] = list[(indexOfCurrent(list) + 1) % list.length].id;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});
ui.reset.addEventListener("click", () => {
  if (!window.confirm("Clear scores and progress in both modes, then reshuffle the MCQs and their answers?")) return;
  state.shuffle = createShuffle(allMcqCards);
  decks.mcq = applyShuffle(allMcqCards, state.shuffle);
  state.categories = { open: "All cards", mcq: "All cards" };
  state.current = { open: undefined, mcq: undefined };
  state.marks = { open: {}, mcq: {} };
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

render();

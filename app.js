const cards = await fetch(new URL("./cards.json", import.meta.url)).then((response) => {
  if (!response.ok) throw new Error("Could not load the card bank.");
  return response.json();
});

const palettes = {
  "All cards": { tint: "#f3eef9", accent: "#b5a0d9", ink: "#56446c" },
  TypeScript: { tint: "#eaf1fc", accent: "#a1bce8", ink: "#3c567c" },
  JavaScript: { tint: "#f9f2dd", accent: "#e5ce88", ink: "#6b5a2f" },
  Async: { tint: "#f8eddf", accent: "#e9bc8c", ink: "#765433" },
  Node: { tint: "#eaf3e8", accent: "#a4c8a1", ink: "#416249" },
  Errors: { tint: "#faeae9", accent: "#e7b0ab", ink: "#7b4947" },
  "Big O": { tint: "#f8eaf1", accent: "#dfb2cf", ink: "#754d68" },
};

const $ = (id) => document.getElementById(id);
const elements = {
  app: $("app"), category: $("category"), count: $("count"), eyebrow: $("eyebrow"),
  difficulty: $("difficulty"), question: $("question"), answer: $("answer-text"),
  content: $("answer-content"), toggle: $("answer-toggle"), label: $("answer-label"),
  next: $("next-button"), progress: $("progress"), fill: $("progress-fill"),
  source: $("source-link"),
};

const storageKey = "eng-recall-progress-v1";
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* Private browsing or old data. */ }
let category = palettes[saved.category] ? saved.category : "All cards";
let currentId = saved.currentId;
let opened = false;

const categoryNames = ["All cards", ...Object.keys(palettes).filter((name) => name !== "All cards")];
for (const name of categoryNames) {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name === "All cards" ? `All cards (${cards.length})` : `${name} (${cards.filter((card) => card.category === name).length})`;
  elements.category.append(option);
}

function visibleCards() { return category === "All cards" ? cards : cards.filter((card) => card.category === category); }
function indexOfCurrent(list) { const index = list.findIndex((card) => card.id === currentId); return index < 0 ? 0 : index; }
function remember() {
  try { localStorage.setItem(storageKey, JSON.stringify({ category, currentId })); } catch { /* Storage is optional. */ }
}
function setOpen(value) {
  opened = value;
  elements.app.classList.toggle("is-open", value);
  elements.toggle.setAttribute("aria-expanded", String(value));
  elements.content.hidden = !value;
  elements.label.textContent = value ? "Answer" : "Reveal answer";
  if (value) elements.content.scrollTop = 0;
}
function render() {
  const list = visibleCards();
  const index = indexOfCurrent(list);
  const card = list[index];
  currentId = card.id;
  elements.category.value = category;
  const palette = palettes[card.category];
  elements.app.style.setProperty("--tint", palette.tint);
  elements.app.style.setProperty("--accent", palette.accent);
  elements.app.style.setProperty("--ink", palette.ink);
  elements.count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
  elements.eyebrow.textContent = `${card.category} · ${String(index + 1).padStart(2, "0")}`;
  elements.difficulty.textContent = card.difficulty;
  elements.question.textContent = card.question;
  elements.answer.textContent = card.answer;
  elements.source.href = card.source;
  const percentage = Math.round(((index + 1) / list.length) * 100);
  elements.fill.style.width = `${percentage}%`;
  elements.progress.setAttribute("aria-valuenow", String(percentage));
  elements.progress.setAttribute("aria-valuetext", `Card ${index + 1} of ${list.length}`);
  setOpen(false);
  remember();
}

elements.category.addEventListener("change", (event) => {
  category = event.target.value;
  currentId = visibleCards()[0].id;
  render();
});
elements.toggle.addEventListener("click", () => setOpen(!opened));
elements.next.addEventListener("click", () => {
  const list = visibleCards();
  currentId = list[(indexOfCurrent(list) + 1) % list.length].id;
  render();
});

render();

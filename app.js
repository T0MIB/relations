
const prompts = [
  { question: "when I need a good listener", role: "listener" },
  { question: "from whom I receive constructive feedback on my performance", role: "encourager" },
  { question: "from whom I receive support when I feel lonely or depressed", role: "comforter" },
  { question: "who challenges me to do better work or live a better life", role: "motivator" },
  { question: "who reinforces my feeling that my work is valuable and that I have value too", role: "affirmation" },
  { question: "who helps me recognize and develop my skills and abilities", role: "supporter" },
  { question: "with whom I can share love and affection", role: "safe haven" },
  { question: "who helps me express and appreciate my own creativity", role: "inspiration" },
  { question: "with whom I can discuss my work or studies", role: "sparring partner" },
  { question: "with whom I can discuss my moral choices and values", role: "mentor" },
  { question: "who helps me when I worry about mistakes I have made or might make", role: "confessor" },
  { question: "with whom I can celebrate the good things in my life", role: "party buddy" },
  { question: "with whom I can experience a sense of belonging to the group I identify with most strongly", role: "kindred spirit" }
];

const storageKey = "relationship-map-v1";
let answers = JSON.parse(localStorage.getItem(storageKey) || "[]");
let current = 0;
let selectedRole = "";

const question = document.querySelector("#question");
const answer = document.querySelector("#answer");
const counter = document.querySelector("#counter");
const progressBar = document.querySelector("#progress-bar");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const map = document.querySelector("#map");
const roles = document.querySelector("#roles");
const rolesTitle = document.querySelector("#roles-title");
const mapStatus = document.querySelector("#map-status");
const answerHistory = document.querySelector("#answer-history");
const previousAnswers = document.querySelector("#previous-answers");
const answerSuggestions = document.querySelector("#answer-suggestions");

function normalized(value) {
  return value.trim().toLocaleLowerCase("en");
}

function save() {
  localStorage.setItem(storageKey, JSON.stringify(answers));
}

function renderQuestion() {
  counter.textContent = `Statement ${current + 1} / ${prompts.length} · ${prompts[current].role}`;
  progressBar.style.width = `${((current + 1) / prompts.length) * 100}%`;
  question.textContent = `I have a person ... ${prompts[current].question}.`;
  answer.value = answers[current] || "";
  previous.disabled = current === 0;
  next.textContent = current === prompts.length - 1 ? "Finish" : "Next";
  renderPreviousAnswers();
}

function people() {
  const unique = new Map();
  answers.forEach((value) => {
    const key = normalized(value || "");
    if (key && !unique.has(key)) unique.set(key, value.trim());
  });
  return [...unique.values()];
}

function renderPreviousAnswers() {
  const savedPeople = people();
  previousAnswers.replaceChildren();
  answerSuggestions.replaceChildren();
  answerHistory.hidden = savedPeople.length === 0;

  savedPeople.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    answerSuggestions.append(option);

    const choice = document.createElement("button");
    choice.className = "previous-answer";
    choice.type = "button";
    choice.textContent = name;
    choice.addEventListener("click", () => {
      answer.value = name;
      storeAnswer();
      answer.focus();
    });
    previousAnswers.append(choice);
  });
}

function line(x1, y1, x2, y2, className = "") {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const edge = document.createElement("div");
  edge.className = `edge ${className}`;
  edge.style.width = `${length}px`;
  edge.style.left = `${x1}px`;
  edge.style.top = `${y1}px`;
  edge.style.transform = `rotate(${angle}deg)`;
  map.append(edge);
}

function showRole(index) {
  roles.replaceChildren();

  if (index === undefined || index < 0) {
    rolesTitle.textContent = "Selected role";
    roles.innerHTML = '<span class="role empty">Answer a statement to see the connections.</span>';
    return;
  }

  const prompt = prompts[index];
  rolesTitle.textContent = `${prompt.role}: ${answers[index] || "not answered yet"}`;

  const item = document.createElement("button");
  item.className = "role";
  item.type = "button";
  item.textContent = prompt.question;
  item.addEventListener("click", () => {
    current = index;
    renderQuestion();
    answer.focus();
  });
  roles.append(item);
}

function renderMap() {
  const namedPeople = people();
  map.replaceChildren();

  if (!namedPeople.length) {
    map.innerHTML = '<p class="empty-map">Enter your first name or role.<br>The map will build automatically.</p>';
    mapStatus.textContent = "No answers";
    selectedRole = "";
    showRole();
    return;
  }

  mapStatus.textContent = `${namedPeople.length} ${
    namedPeople.length === 1 ? "person" : "people"
  }`;

  const width = map.clientWidth;
  const rowHeight = 56;
  const answeredPrompts = prompts
    .map((prompt, index) => ({ prompt, index }))
    .filter(({ index }) => answers[index]?.trim());

  const height = Math.max(600, answeredPrompts.length * rowHeight + 60);
  map.style.height = `${height}px`;

  const coreX = 54;
  const roleX = Math.max(195, width * 0.46);
  const personX = width - 72;
  const roleY = (row) => 34 + row * rowHeight;
  const personY = (person) =>
    34 + namedPeople.findIndex(
      (name) => normalized(name) === normalized(person)
    ) * rowHeight;

  answeredPrompts.forEach(({ prompt, index }, row) => {
    const y = roleY(row);
    line(coreX, height / 2, roleX, y);
    line(roleX, y, personX, personY(answers[index]), "person-edge");

    const node = document.createElement("button");
    node.className = `node role-node${selectedRole === index ? " selected" : ""}`;
    node.type = "button";
    node.style.left = `${roleX}px`;
    node.style.top = `${y}px`;
    node.textContent = prompt.role;
    node.title = prompt.question;
    node.addEventListener("click", () => {
      selectedRole = index;
      renderMap();
    });
    map.append(node);
  });

  const core = document.createElement("div");
  core.className = "node core";
  core.style.left = `${coreX}px`;
  core.style.top = `${height / 2}px`;
  core.textContent = "Me";
  map.append(core);

  namedPeople.forEach((person) => {
    const node = document.createElement("div");
    node.className = "node person-node";
    node.style.left = `${personX}px`;
    node.style.top = `${personY(person)}px`;
    node.textContent = person;
    map.append(node);
  });

  if (selectedRole === "" || !answers[selectedRole]?.trim()) {
    selectedRole = answers.findIndex((value) => value?.trim());
  }

  showRole(selectedRole);
}

function storeAnswer() {
  answers[current] = answer.value.trim();
  save();
  renderPreviousAnswers();
  renderMap();
}

answer.addEventListener("input", storeAnswer);

answer.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    storeAnswer();

    if (current < prompts.length - 1) {
      current += 1;
      renderQuestion();
      answer.focus();
    }
  }
});

previous.addEventListener("click", () => {
  storeAnswer();
  current -= 1;
  renderQuestion();
  answer.focus();
});

next.addEventListener("click", () => {
  storeAnswer();

  if (current < prompts.length - 1) {
    current += 1;
    renderQuestion();
    answer.focus();
  }
});

document.querySelector("#reset").addEventListener("click", () => {
  if (!window.confirm("Are you sure you want to clear all answers?")) return;

  answers = [];
  current = 0;
  selectedRole = "";
  localStorage.removeItem(storageKey);
  renderQuestion();
  renderMap();
  answer.focus();
});

window.addEventListener("resize", renderMap);

renderQuestion();
renderMap();

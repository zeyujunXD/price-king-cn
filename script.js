let products = [];

const $ = (id) => document.getElementById(id);
const state = {
  score: 0,
  streak: 0,
  rounds: 0,
  limit: 10,
  current: null,
  history: []
};

const fmt = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
const pick = () => products[Math.floor(Math.random() * products.length)];
const money = (n) => `¥${fmt(n)} 元`;

function renderCurrent() {
  const product = state.current;
  $("productName").textContent = product.name;
  $("productHint").textContent = product.hint;
  $("categoryTag").textContent = product.category;
  $("difficultyTag").textContent = product.price >= 1000 ? "进阶局" : "新手局";
  $("productImage").src = product.image;
  $("productImage").alt = product.name;
  $("result").textContent = "输入你的猜测，看看谁更接近真实价格。";
  $("guess").value = "";
  $("quickPicks").innerHTML = makeQuickPicks(product.price);
}

function makeQuickPicks(price) {
  const base = price >= 1000 ? [0.6, 0.8, 1, 1.2, 1.4] : [0.5, 0.8, 1, 1.2, 1.6];
  return base
    .map((ratio) => `<button type="button" class="ghost" data-price="${Math.max(1, Math.round(price * ratio))}">${money(Math.max(1, Math.round(price * ratio)))}</button>`)
    .join("");
}

function addLog(line, kind = "") {
  state.history.unshift({ line, kind });
  $("log").innerHTML = state.history
    .slice(0, 6)
    .map((item) => `<li class="${item.kind}">${item.line}</li>`)
    .join("");
}

function updateStats() {
  $("score").textContent = state.score;
  $("streak").textContent = state.streak;
  $("rounds").textContent = `${state.rounds}/${state.limit}`;
}

function newRound() {
  if (!products.length) return;
  state.current = pick();
  renderCurrent();
  updateStats();
}

function gradeGuess(guess) {
  const target = state.current.price;
  const gap = Math.abs(guess - target);
  const ratio = gap / target;
  let points = Math.max(0, Math.round(120 - ratio * 150));
  if (gap <= target * 0.03) points += 40;
  if (gap <= 20) points += 20;
  state.streak = gap <= target * 0.08 ? state.streak + 1 : 0;
  points += Math.min(50, state.streak * 5);
  state.score += points;
  state.rounds += 1;
  updateStats();
  const verdict = gap === 0 ? "完美命中" : gap <= target * 0.08 ? "非常接近" : gap <= target * 0.2 ? "还不错" : "差得有点远";
  const line = `${state.current.name} | 你的猜测 ${money(guess)} | 实价 ${money(target)} | 相差 ${money(gap)} | ${verdict} +${points}分`;
  addLog(line, gap <= target * 0.08 ? "good" : "bad");
  $("result").textContent = `本轮结果：${verdict}\n实际价格：${money(target)}\n你猜的价格：${money(guess)}\n得分：+${points}`;
  if (state.rounds >= state.limit) {
    $("result").textContent += "\n\n今日挑战已完成，可以重开再来一局。";
  } else {
    setTimeout(newRound, 900);
  }
}

function bindEvents() {
  $("submitBtn").addEventListener("click", () => {
    const guess = Number($("guess").value);
    if (!guess || guess <= 0) {
      $("result").textContent = "先输入一个有效价格。";
      return;
    }
    if (state.rounds >= state.limit) return;
    gradeGuess(guess);
  });

  $("guess").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("submitBtn").click();
  });

  $("quickPicks").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-price]");
    if (!btn) return;
    $("guess").value = btn.dataset.price;
  });

  $("skipBtn").addEventListener("click", () => newRound());
  $("dailyBtn").addEventListener("click", () => {
    state.score = 0;
    state.streak = 0;
    state.rounds = 0;
    state.history = [];
    $("log").innerHTML = "";
    newRound();
  });
  $("resetBtn").addEventListener("click", () => {
    state.score = 0;
    state.streak = 0;
    state.rounds = 0;
    state.history = [];
    $("log").innerHTML = "";
    newRound();
  });
}

async function init() {
  try {
    const res = await fetch("./data/products.json");
    products = await res.json();
    bindEvents();
    newRound();
  } catch (error) {
    $("result").textContent = "商品数据加载失败，请检查本地服务是否已启动。";
  }
}

init();

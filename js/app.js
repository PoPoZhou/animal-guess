import { ANIMALS, FEATURES, STAGES, GROUPS, COLORS, DETAILS, BREED_TRAITS } from "./data.js?v=12";
import {
  MAX_QUESTIONS, MAX_GUESSES, buildKnowledge, posterior, aliveNames,
  chooseQuestion, readyToGuess, contradictions,
} from "./engine.js?v=12";

const STORE_KEY = "animal-guess-taught";
const PAUSE = 450;

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const byName = Object.fromEntries(ANIMALS.map((a) => [a.name, a]));
const byKey = Object.fromEntries(FEATURES.map((f) => [f.key, f]));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const word = (value) => (value === true ? "是" : value === false ? "否" : "不確定");
const pct = (p) => `${Math.round(p * 100)}%`;
const label = (name) => `${byName[name].emoji} ${name}`;
const listNames = (names, limit = 6) =>
  names.slice(0, limit).join("、") + (names.length > limit ? ` 等 ${names.length} 種` : "");

let taught = loadTaught();
let kb = buildKnowledge(ANIMALS, taught);
let game;

function loadTaught() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function saveTaught() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(taught));
  } catch {
    /* 無痕模式存不了也沒關係，這一頁還是有效 */
  }
  kb = buildKnowledge(ANIMALS, taught);
  renderTable();
}

/* ---------- 思考面板 ---------- */

function buildChips() {
  $("chips").innerHTML = ANIMALS.map(
    (a) => `<div class="chip" data-name="${a.name}"><span class="e" aria-hidden="true">${a.emoji}</span>${a.name}</div>`,
  ).join("");
}

function renderPanel() {
  const post = posterior(kb, game.answers, game.excluded);
  const p = Object.fromEntries(post.map((row) => [row.name, row.p]));
  const alive = aliveNames(post);
  $("alive-count").textContent = alive.length;
  $("qno").textContent = game.answers.length;
  $("qmax").textContent = MAX_QUESTIONS;
  for (const chip of $("chips").children) {
    const name = chip.dataset.name;
    chip.classList.toggle("out", !alive.includes(name));
    chip.classList.toggle("lead", name === post[0].name && game.answers.length > 0 && post[0].p > 0);
  }
  $("top").innerHTML = post.slice(0, 3).map((row) => `
    <li><span>${label(row.name)}</span><span class="bar"><span style="width:${(row.p * 100).toFixed(1)}%"></span></span><span class="pct">${pct(row.p)}</span></li>`).join("");
  return { post, alive };
}

async function think(lines, head) {
  const log = $("log");
  if (head) {
    const li = document.createElement("li");
    li.className = "head";
    li.textContent = head;
    log.appendChild(li);
  }
  for (const line of lines) {
    await sleep(PAUSE);
    const li = document.createElement("li");
    li.textContent = line;
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
  }
}

/* ---------- 遊戲流程 ---------- */

function newGame() {
  game = { answers: [], excluded: [], guesses: [], steps: [], current: null, stage: 0 };
  $("log").innerHTML = "";
  renderPanel();
  stage.innerHTML = `
    <p class="step-label">準備</p>
    <p class="question">請從右邊的 ${ANIMALS.length} 種動物裡，在心裡選一種。</p>
    <p class="muted">不用告訴我。我會分四個階段問：先問<strong>種類</strong>，再問<strong>顏色</strong>，接著問<strong>細部特徵</strong>；如果是狗或貓，最後還會問到<strong>品種</strong>。最多問 ${MAX_QUESTIONS} 題、猜 ${MAX_GUESSES} 次，每一步怎麼想的都會寫在右邊。</p>
    <div class="answers"><button class="btn primary" data-act="start">我想好了，開始</button></div>`;
}

function showThinking(text = "思考中") {
  stage.querySelectorAll("button").forEach((b) => (b.disabled = true));
  const note = document.createElement("p");
  note.className = "thinking";
  note.textContent = text;
  stage.appendChild(note);
}

async function nextMove() {
  const { post } = renderPanel();
  if (readyToGuess(kb, FEATURES, game.answers, game.excluded, STAGES)) {
    const top = post[0];
    if (top.p === 0) return askReveal("候選都被排除了，我想不出還有哪種動物。");
    let reason;
    const alive = aliveNames(post);
    if (alive.length === 1 && alive[0] === top.name) reason = `只剩 ${top.name} 和你的答案最吻合，把握 ${pct(top.p)}，可以猜了。`;
    else if (game.answers.length >= MAX_QUESTIONS) reason = `已經問滿 ${MAX_QUESTIONS} 題，只能用目前最可能的答案猜。`;
    else reason = "剩下的問題都分不開這幾種動物了，直接猜最可能的。";
    await think([reason]);
    return showGuess(top);
  }
  const pick = chooseQuestion(kb, FEATURES, game.answers, game.excluded, STAGES);
  game.current = pick;
  const info = STAGES.find((s) => s.id === pick.stage);
  if (pick.stage !== game.stage) {
    const from = STAGES.find((s) => s.id === game.stage);
    const lines = [];
    if (from) lines.push(`「${from.name}」階段問完了。`);
    lines.push(info.intro);
    game.stage = pick.stage;
    await think(lines, `階段 ${info.id}：${info.name}`);
  }
  const why = pick.common
    ? `剩下的 ${pick.common} 種都有「${pick.feature.label}」這個特徵，這個階段的問題已經分不開牠們。進到下一步前，先確認牠們共同的特徵；如果你答「否」，代表前面可能有一題答錯。`
    : pick.confirm
    ? `我心裡已經有答案了：${pick.confirm}。開口前再確認一個牠的特徵：我的表寫牠是「${word(pick.expect)}」。如果你的回答不一樣，代表可能有一題答錯，我會重新想。`
    : `回答「是」會留下 ${pick.ifYes.length} 種，回答「否」會留下 ${pick.ifNo.length} 種。在「${info.name}」的問題裡，這題最接近對半切，不管你怎麼答都能刪掉很多。`;
  await think([`下一題問「${pick.feature.label}」：${why}`]);
  showQuestion(pick, why, info);
}

function showQuestion(pick, why, info) {
  stage.innerHTML = `
    <p class="step-label">第 ${game.answers.length + 1} 題 / 最多 ${MAX_QUESTIONS} 題 · 階段 ${info.id}：${info.name}</p>
    <p class="question">${pick.feature.question}</p>
    <div class="answers">
      <button class="btn primary" data-act="yes">是</button>
      <button class="btn no" data-act="no">否</button>
      <button class="btn" data-act="unsure">不確定</button>
    </div>
    <div class="why"><strong>我為什麼問這題</strong>${why}</div>`;
}

async function answer(value) {
  const pick = game.current;
  const before = aliveNames(posterior(kb, game.answers, game.excluded));
  game.answers.push({ key: pick.feature.key, value });
  showThinking();
  const after = aliveNames(posterior(kb, game.answers, game.excluded));
  const removed = before.filter((name) => !after.includes(name));
  game.steps.push({ index: game.answers.length, key: pick.feature.key, value, removed });
  const lines = [];
  const back = after.filter((name) => !before.includes(name));
  if (value === null) lines.push("你不確定，這題我不拿來判斷，換別的問題。");
  else if (back.length) lines.push(`沒有動物完全符合你的答案，可能有一題答錯了。我放寬條件，把只差一點的 ${listNames(back)} 找回來。`);
  else if (pick.common && value === pick.expect) lines.push(`確認了，剩下的 ${pick.common} 種都符合，接著往下分。`);
  else if (pick.confirm && value === pick.expect) lines.push(`和我想的一樣，更確定是 ${pick.confirm} 了。`);
  else if (pick.confirm) lines.push(`和我想的不一樣！${pick.confirm} 不太對，我要重新想。`);
  else if (removed.length) lines.push(`排除 ${removed.length} 種：${listNames(removed)}。`);
  else lines.push("這題沒有排除任何動物。");
  lines.push(`還剩 ${after.length} 種可能。`);
  renderPanel();
  await think(lines, `第 ${game.answers.length} 題「${pick.feature.label}」：你說「${word(value)}」`);
  await nextMove();
}

function showGuess(top) {
  game.current = null;
  game.guessing = top.name;
  stage.innerHTML = `
    <p class="step-label">第 ${game.guesses.length + 1} 次猜 / 最多 ${MAX_GUESSES} 次</p>
    <div class="guess-emoji" aria-hidden="true">${byName[top.name].emoji}</div>
    <p class="guess-name">我猜是：${top.name}</p>
    <p class="muted">把握度 ${pct(top.p)}，用了 ${game.answers.length} 題。</p>
    <div class="answers">
      <button class="btn primary" data-act="right">猜對了！</button>
      <button class="btn no" data-act="wrong">不是</button>
    </div>`;
}

async function guessResult(right) {
  const name = game.guessing;
  game.guesses.push(name);
  showThinking();
  if (right) {
    await think([`猜中了：${name}。`], `第 ${game.guesses.length} 次猜「${name}」`);
    return showReview(name, true);
  }
  const before = aliveNames(posterior(kb, game.answers, game.excluded));
  game.excluded.push(name);
  const after = aliveNames(posterior(kb, game.answers, game.excluded));
  const back = after.filter((n) => !before.includes(n));
  const lines = [`猜錯了，把 ${name} 排除，重新想。`];
  if (back.length) lines.push(`沒有動物完全符合你的答案了，可能有一題答錯。我放寬條件，把只差一點的 ${listNames(back)} 找回來，還剩 ${after.length} 種可能。`);
  renderPanel();
  await think(lines, `第 ${game.guesses.length} 次猜「${name}」`);
  if (game.guesses.length >= MAX_GUESSES) return askReveal(`我已經猜了 ${MAX_GUESSES} 次都沒猜中。`);
  await nextMove();
}

function askReveal(text) {
  game.current = null;
  stage.innerHTML = `
    <p class="step-label">我放棄了</p>
    <p class="question">${text}你想的是哪一種？</p>
    <p class="muted">告訴我答案，我會檢討是在哪裡想錯的。</p>
    <div class="pick-grid">${ANIMALS.map((a) => `<button data-act="reveal" data-name="${a.name}"><span class="e" aria-hidden="true">${a.emoji}</span>${a.name}</button>`).join("")}</div>`;
}

async function showReview(target, found) {
  showThinking("檢討中");
  const misses = contradictions(kb, target, game.answers);
  const key = [...game.steps].sort((a, b) => b.removed.length - a.removed.length)[0];
  const items = [];
  const lines = [];
  if (found) {
    items.push(`我問了 ${game.answers.length} 題、猜了 ${game.guesses.length} 次。`);
  } else {
    const wrong = game.guesses.length ? game.guesses.join("、") : "沒有";
    items.push(`你想的是 ${target}，我猜了 ${wrong}。`);
  }
  if (key && key.removed.length) {
    items.push(`最關鍵的是第 ${key.index} 題「${byKey[key.key].label}」，一次排除了 ${key.removed.length} 種。`);
  }
  for (const miss of misses) {
    const said = word(miss.value);
    const table = word(kb[target].has(miss.key));
    items.push(`第 ${miss.index + 1} 題「${byKey[miss.key].question}」你說「${said}」，但我的表寫 ${target} 是「${table}」。`);
  }
  if (!found && !misses.length) {
    const rival = game.guesses[game.guesses.length - 1];
    items.push(rival
      ? `你的答案和我的表都一致，問題是我問的題目還不夠把 ${target} 和 ${rival} 分開。要分開牠們，需要在知識表加新的特徵。`
      : `你的答案和我的表都一致，但題目不夠把 ${target} 和其他動物分開。`);
  }
  if (misses.length) {
    lines.push(`有 ${misses.length} 題你的答案和表上的 ${target} 不一樣，可能是我的表錯了，也可能是題目講得不夠清楚。`);
  } else {
    lines.push(`你的答案和表上的 ${target} 完全一致。`);
  }
  await think(lines, found ? "檢討這一局" : `正確答案是「${target}」`);

  stage.innerHTML = `
    <p class="step-label">${found ? "猜中了" : "沒猜中"}</p>
    <div class="guess-emoji" aria-hidden="true">${byName[target].emoji}</div>
    <p class="guess-name">${found ? `答案是 ${target}` : `原來是 ${target}`}</p>
    <h3>AI 的檢討</h3>
    <ol class="review">${items.map((t) => `<li>${t}</li>`).join("")}</ol>
    <div class="answers">
      ${misses.length ? `<button class="btn primary" data-act="teach" data-name="${target}">教我：照你的答案修正 ${target}</button>` : ""}
      <button class="btn${misses.length ? "" : " primary"}" data-act="again">再玩一局</button>
    </div>
    <p class="muted" id="teach-msg"></p>`;
}

function teach(target) {
  const misses = contradictions(kb, target, game.answers);
  taught[target] = { ...(taught[target] || {}) };
  for (const miss of misses) taught[target][miss.key] = miss.value;
  saveTaught();
  $("teach-msg").textContent = `記住了，我改了 ${target} 的 ${misses.length} 個特徵。這台瀏覽器之後都會用新的知識，可以在「AI 的知識表」看到黃色格子。`;
  stage.querySelector('[data-act="teach"]').disabled = true;
  think([`照你的答案修正 ${target} 的 ${misses.length} 個特徵。`], "學習");
}

/* ---------- 知識表 ---------- */

function renderTable() {
  const head = `<thead><tr><th>動物</th><th>種類</th><th>顏色</th>${[...DETAILS, ...BREED_TRAITS].map((f) => `<th title="${f.question}">${f.label}</th>`).join("")}</tr></thead>`;
  const rows = ANIMALS.map((a) => {
    const mine = taught[a.name] || {};
    const touched = (keys) => keys.some((k) => k in mine) ? " taught" : "";
    const groupKeys = GROUPS.map((g) => g.key);
    const colorKeys = COLORS.map((c) => `c_${c.key}`);
    const groups = GROUPS.filter((g) => kb[a.name].has(g.key)).map((g) => g.label).join("、") || "—";
    const colors = COLORS.filter((c) => kb[a.name].has(`c_${c.key}`)).map((c) => c.label).join("、") || "—";
    const cells = `<td class="${touched(groupKeys)}">${groups}</td><td class="${touched(colorKeys)}">${colors}</td>` + [...DETAILS, ...BREED_TRAITS].map((f) => {
      const yes = kb[a.name].has(f.key);
      const isTaught = taught[a.name] && f.key in taught[a.name];
      return `<td class="${yes ? "yes" : "no"}${isTaught ? " taught" : ""}">${yes ? "✓" : "·"}</td>`;
    }).join("");
    return `<tr><td>${label(a.name)}</td>${cells}</tr>`;
  }).join("");
  $("kb-table").innerHTML = head + `<tbody>${rows}</tbody>`;
  const count = Object.values(taught).reduce((n, row) => n + Object.keys(row).length, 0);
  $("taught-note").textContent = count ? `你已經教過 ${count} 個修正。` : "你還沒有教過任何修正。";
  $("reset-taught").disabled = !count;
}

/* ---------- 事件 ---------- */

stage.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button || button.disabled) return;
  const act = button.dataset.act;
  if (act === "start") { showThinking(); nextMove(); }
  else if (act === "yes") answer(true);
  else if (act === "no") answer(false);
  else if (act === "unsure") answer(null);
  else if (act === "right") guessResult(true);
  else if (act === "wrong") guessResult(false);
  else if (act === "reveal") showReview(button.dataset.name, false);
  else if (act === "teach") teach(button.dataset.name);
  else if (act === "again") newGame();
});

document.querySelectorAll(".tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    $("view-game").hidden = view !== "game";
    $("view-table").hidden = view !== "table";
  });
});

$("reset-taught").addEventListener("click", () => {
  taught = {};
  saveTaught();
});

buildChips();
renderTable();
newGame();

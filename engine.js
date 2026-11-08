// AI 的推理規則。這裡只有計算，沒有畫面，方便測試。

// 使用者可能答錯，所以答案和知識表不合時不直接刪掉，而是把可能性乘上這個數字。
export const SLIP = 0.05;
// 最可能的動物把握度到這個值，就開口猜。
export const CONFIDENT = 0.75;
export const MAX_QUESTIONS = 15;
export const MAX_GUESSES = 3;
// 開口猜之前，至少要問幾題細部特徵（不夠就問確認題）。
export const MIN_DETAILS = 3;

// 一種動物「是」的特徵：種類、顏色（加上 c_ 前綴）和細部特徵。
export function traitList(animal) {
  if (!animal.group) return animal.yes;
  return [animal.group, ...(animal.colors || []).map((c) => `c_${c}`), ...animal.yes];
}

// 把知識表和使用者教過的修正合在一起：{ 動物: Set(是的特徵) }
export function buildKnowledge(animals, overrides = {}) {
  const kb = {};
  for (const animal of animals) {
    const set = new Set(traitList(animal));
    for (const [key, value] of Object.entries(overrides[animal.name] || {})) {
      if (value) set.add(key);
      else set.delete(key);
    }
    kb[animal.name] = set;
  }
  return kb;
}

// answers: [{ key, value: true/false/null }]；excluded: 猜錯過的動物
export function posterior(kb, answers, excluded = []) {
  const rows = Object.entries(kb).map(([name, set]) => {
    if (excluded.includes(name)) return { name, weight: 0, misses: answers.length };
    let weight = 1;
    let misses = 0;
    for (const answer of answers) {
      if (answer.value === null) continue; // 「不確定」不算數
      if (set.has(answer.key) !== answer.value) {
        weight *= SLIP;
        misses += 1;
      }
    }
    return { name, weight, misses };
  });
  const total = rows.reduce((sum, row) => sum + row.weight, 0) || 1;
  return rows
    .map((row) => ({ name: row.name, p: row.weight / total, misses: row.misses }))
    .sort((a, b) => b.p - a.p);
}

// 「還有可能」的動物：和你的答案不合的題數最少的那些。
// 答錯的可能性仍保留在 p 裡，猜的時候會用到，但不算在剩下的種數。
export function aliveNames(post) {
  const live = post.filter((row) => row.p > 0);
  if (!live.length) return [];
  const fewest = Math.min(...live.map((row) => row.misses));
  return live.filter((row) => row.misses === fewest).map((row) => row.name);
}

// 挑下一題。問題分階段（種類 → 顏色 → 細部特徵），依序進行：
// 目前階段還有能把剩下的動物分開的問題，而且還沒問滿該階段的題數，就從這個階段挑；
// 否則進到下一個階段。同一階段裡，選「回答是」和「回答否」最接近對半切的問題。
export function chooseQuestion(kb, features, answers, excluded = [], stages = []) {
  const post = posterior(kb, answers, excluded);
  const alive = new Set(aliveNames(post));
  const weights = post.filter((row) => alive.has(row.name));
  const total = weights.reduce((sum, row) => sum + row.p, 0) || 1;
  const asked = new Set(answers.map((answer) => answer.key));
  const stageOf = (feature) => feature.stage ?? 1;
  const used = {};
  for (const answer of answers) {
    const feature = features.find((f) => f.key === answer.key);
    if (feature) used[stageOf(feature)] = (used[stageOf(feature)] || 0) + 1;
  }
  const order = [...new Set(features.map(stageOf))].sort((a, b) => a - b);
  for (const stage of order) {
    const limit = stages.find((s) => s.id === stage)?.limit ?? Infinity;
    if ((used[stage] || 0) >= limit) continue;
    let best = null;
    for (const feature of features) {
      if (stageOf(feature) !== stage || asked.has(feature.key)) continue;
      const yesMass = weights.reduce((sum, row) => sum + (kb[row.name].has(feature.key) ? row.p : 0), 0) / total;
      if (yesMass < 0.001 || yesMass > 0.999) continue; // 分不開剩下的動物
      const score = Math.abs(yesMass - 0.5);
      if (!best || score < best.score - 1e-9) best = { feature, yesMass, score };
    }
    if (best) return finish(best, stage);
  }

  // 分不開了，但細部特徵問得還不夠：挑一題「確認題」，
  // 問目前最可能的動物最有特色的特徵（越少動物有的越有特色）。
  const last = order[order.length - 1];
  const top = weights[0];
  if (!top || (used[last] || 0) >= MIN_DETAILS) return null;
  const share = (key) => Object.values(kb).filter((set) => set.has(key)).length;
  const options = features
    .filter((f) => stageOf(f) === last && !asked.has(f.key))
    .sort((a, b) => {
      const ha = kb[top.name].has(a.key) ? 0 : 1;
      const hb = kb[top.name].has(b.key) ? 0 : 1;
      return ha - hb || share(a.key) - share(b.key);
    });
  if (!options.length) return null;
  return finish({ feature: options[0], confirm: top.name, expect: kb[top.name].has(options[0].key) }, last);

  function finish(pick, stage) {
    pick.stage = stage;
    pick.ifYes = aliveNames(posterior(kb, [...answers, { key: pick.feature.key, value: true }], excluded));
    pick.ifNo = aliveNames(posterior(kb, [...answers, { key: pick.feature.key, value: false }], excluded));
    return pick;
  }
}

// 該不該開口猜了？分不開、而且細部特徵也確認夠了，或問滿題數。
export function readyToGuess(kb, features, answers, excluded = [], stages = []) {
  if (answers.length >= MAX_QUESTIONS) return true;
  return !chooseQuestion(kb, features, answers, excluded, stages);
}

// 使用者的答案和某動物的知識表不合的地方。
export function contradictions(kb, name, answers) {
  return answers
    .map((answer, index) => ({ ...answer, index }))
    .filter((answer) => answer.value !== null && kb[name].has(answer.key) !== answer.value);
}

// 用知識表當作誠實的玩家，自動玩一局。測試用。
export function autoplay(kb, features, target, lie = null, stages = []) {
  const answers = [];
  const excluded = [];
  const guesses = [];
  const asked = [];
  while (guesses.length < MAX_GUESSES) {
    if (readyToGuess(kb, features, answers, excluded, stages)) {
      const guess = posterior(kb, answers, excluded)[0];
      if (guess.p === 0) break;
      guesses.push(guess.name);
      if (guess.name === target) return { found: true, questions: answers.length, guesses, asked };
      excluded.push(guess.name);
      continue;
    }
    const pick = chooseQuestion(kb, features, answers, excluded, stages);
    let value = kb[target].has(pick.feature.key);
    if (lie !== null && answers.length === lie) value = !value;
    answers.push({ key: pick.feature.key, value });
    asked.push(pick);
  }
  return { found: false, questions: answers.length, guesses, asked };
}

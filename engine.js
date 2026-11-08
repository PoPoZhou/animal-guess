// AI 的推理規則。這裡只有計算，沒有畫面，方便測試。

// 使用者可能答錯，所以答案和知識表不合時不直接刪掉，而是把可能性乘上這個數字。
export const SLIP = 0.05;
// 可能性低於這個值，就當作「已經排除」。
export const ALIVE = 0.02;
// 最可能的動物把握度到這個值，就開口猜。
export const CONFIDENT = 0.75;
export const MAX_QUESTIONS = 10;
export const MAX_GUESSES = 3;

// 把知識表和使用者教過的修正合在一起：{ 動物: Set(是的特徵) }
export function buildKnowledge(animals, overrides = {}) {
  const kb = {};
  for (const animal of animals) {
    const set = new Set(animal.yes);
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

// 挑下一題：選「回答是」和「回答否」留下的可能性最接近一半的問題。
export function chooseQuestion(kb, features, answers, excluded = []) {
  const post = posterior(kb, answers, excluded);
  const asked = new Set(answers.map((answer) => answer.key));
  let best = null;
  for (const feature of features) {
    if (asked.has(feature.key)) continue;
    const yesMass = post.reduce((sum, row) => sum + (kb[row.name].has(feature.key) ? row.p : 0), 0);
    if (yesMass < 0.02 || yesMass > 0.98) continue;
    const score = Math.abs(yesMass - 0.5);
    if (!best || score < best.score - 1e-9) {
      const ifYes = aliveNames(posterior(kb, [...answers, { key: feature.key, value: true }], excluded));
      const ifNo = aliveNames(posterior(kb, [...answers, { key: feature.key, value: false }], excluded));
      best = { feature, yesMass, score, ifYes, ifNo };
    }
  }
  return best;
}

// 該不該開口猜了？
export function readyToGuess(kb, features, answers, excluded = []) {
  const post = posterior(kb, answers, excluded);
  if (post[0].p >= CONFIDENT) return true;
  if (answers.length >= MAX_QUESTIONS) return true;
  return !chooseQuestion(kb, features, answers, excluded);
}

// 使用者的答案和某動物的知識表不合的地方。
export function contradictions(kb, name, answers) {
  return answers
    .map((answer, index) => ({ ...answer, index }))
    .filter((answer) => answer.value !== null && kb[name].has(answer.key) !== answer.value);
}

// 用知識表當作誠實的玩家，自動玩一局。測試用。
export function autoplay(kb, features, target, lie = null) {
  const answers = [];
  const excluded = [];
  const guesses = [];
  while (guesses.length < MAX_GUESSES) {
    if (readyToGuess(kb, features, answers, excluded)) {
      const guess = posterior(kb, answers, excluded)[0];
      if (guess.p === 0) break;
      guesses.push(guess.name);
      if (guess.name === target) return { found: true, questions: answers.length, guesses };
      excluded.push(guess.name);
      continue;
    }
    const pick = chooseQuestion(kb, features, answers, excluded);
    let value = kb[target].has(pick.feature.key);
    if (lie !== null && answers.length === lie) value = !value;
    answers.push({ key: pick.feature.key, value });
  }
  return { found: false, questions: answers.length, guesses };
}

// Universal Engine — statistical predictor (NO AI, NO neural net, NO model file).
// A classic n-gram language model: it counts how often word sequences occur in a
// bundled corpus, then predicts the next word. Unlike a plain backoff model, it
// INTERPOLATES orders 1..5 (a weighted blend of unigram..pentagram evidence), so a
// long exact context dominates while shorter contexts still inform the ranking.
// Fully deterministic (argmax with lexicographic tie-break): same input, same
// output, so it stays testable and honest. It is prediction by counting, not
// understanding, and we say so.

const ORDER = 5; // highest n-gram order (context length up to ORDER-1)

// Tokenize to lowercase word tokens plus sentence punctuation as its own token.
export function tokenize(text) {
  return String(text || "").toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?|[.,!?;:]/g) || [];
}

// Build the model once from a corpus string. O(n * ORDER) over tokens.
export function train(text) {
  const toks = tokenize(text);
  const grams = Array.from({ length: ORDER + 1 }, () => new Map()); // grams[o]: contextKey -> Map(next -> count); grams[1] is uni: token -> count
  const uni = grams[1];
  const vocab = new Set();
  const bump = (m, k, next) => { let inner = m.get(k); if (!inner) { inner = new Map(); m.set(k, inner); } inner.set(next, (inner.get(next) || 0) + 1); };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    uni.set(t, (uni.get(t) || 0) + 1);
    vocab.add(t);
    for (let o = 2; o <= ORDER; o++) {
      if (i >= o - 1) bump(grams[o], toks.slice(i - o + 1, i).join(" "), t);
    }
  }
  // back-compat aliases used elsewhere
  return { grams, uni, bi: grams[2], tri: grams[3], quad: grams[4], pent: grams[5], vocab: [...vocab].sort(), tokens: toks.length };
}

// Adapt a trained model to new text (e.g. the user's own past requests), the way a
// phone keyboard learns your phrasing. Pure counting: each occurrence is added
// `weight` times, so a user's habits outrank the generic corpus. Mutates `model`.
export function learn(model, text, weight = 3) {
  if (!model || !model.grams) return model;
  const toks = tokenize(text);
  const vocab = new Set(model.vocab);
  const bump = (m, k, next) => { let inner = m.get(k); if (!inner) { inner = new Map(); m.set(k, inner); } inner.set(next, (inner.get(next) || 0) + weight); };
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    model.uni.set(t, (model.uni.get(t) || 0) + weight);
    vocab.add(t);
    for (let o = 2; o <= ORDER; o++) if (i >= o - 1) bump(model.grams[o], toks.slice(i - o + 1, i).join(" "), t);
  }
  model.vocab = [...vocab].sort();
  model.tokens += toks.length;
  return model;
}

// Interpolation weights per order: higher orders count for much more, but every
// matching order contributes, which smooths the ranking and breaks ties sensibly.
const W = [0, 1, 5, 12, 22, 36];

// Rank the k most likely next tokens given the trailing context.
// Returns [{ token, p, score, order }] where `order` is the longest context that
// contributed, p is the normalized interpolated probability.
export function predictNext(model, context, k = 5) {
  if (!model) return [];
  const ctx = Array.isArray(context) ? context : tokenize(context);
  const n = ctx.length;
  const scores = new Map();  // token -> blended score
  const bestOrder = new Map();
  const addFrom = (inner, order) => {
    if (!inner || !inner.size) return;
    let total = 0; for (const c of inner.values()) total += c;
    const cap = order === 1 ? 300 : 60;
    const top = [...inner.entries()].sort((a, b) => b[1] - a[1]).slice(0, cap);
    for (const [tok, c] of top) {
      scores.set(tok, (scores.get(tok) || 0) + W[order] * (c / total));
      if (!bestOrder.has(tok) || order > bestOrder.get(tok)) bestOrder.set(tok, order);
    }
  };
  addFrom(model.uni, 1);
  for (let o = 2; o <= ORDER; o++) {
    if (n < o - 1) continue;
    const key = ctx.slice(n - (o - 1)).join(" ");
    const mp = model.grams ? model.grams[o] : null;
    if (mp) addFrom(mp.get(key), o);
  }
  if (!scores.size) return [];
  let sum = 0; for (const v of scores.values()) sum += v;
  return [...scores.entries()]
    .map(([token, score]) => ({ token, score, p: score / sum, order: bestOrder.get(token) || 1 }))
    .sort((a, b) => (b.score - a.score) || (a.token < b.token ? -1 : 1))
    .slice(0, k);
}

const OPEN = new Set(["and", "or", "but", "the", "a", "an", "to", "of", "in", "for", "with", "is", "are", "was", "were", "that", "which", "as", "on", "at", "by", "from", "into"]);

// Continue a prompt. Deterministic scored decoding with a repetition penalty and
// loop guards, stopping at a sentence boundary once it has produced enough words
// and never ending on a dangling function word like "the" or "and".
export function complete(model, prompt, maxWords = 28) {
  if (!model) return "";
  const out = tokenize(prompt);
  if (!out.length) return "";
  const seed = out.length;
  const seenTri = new Set();
  const minWords = 5, hardCap = maxWords + 8;
  for (let step = 0; step < hardCap; step++) {
    const cands = predictNext(model, out, 8);
    if (!cands.length) break;
    const n = out.length;
    const last = out[n - 1], last2 = out[n - 2];
    let pick = null;
    for (const c of cands) {
      const t = c.token;
      if (t === last) continue;                       // no immediate repeat
      if (last2 && t === last2 && cands.length > 2) continue; // no a-b-a
      const triKey = last2 + " " + last + " " + t;
      if (seenTri.has(triKey)) continue;              // no repeated trigram (kills loops)
      pick = t; break;
    }
    if (pick == null) pick = cands[0].token;
    if (last2) seenTri.add(last2 + " " + last + " " + pick);
    const done = step >= maxWords - seed;
    // stop at a sentence end once we have enough, but not right after a function word
    if (/^[.!?]$/.test(pick)) { if (step + seed >= minWords + seed - 1 && !OPEN.has(last)) { out.push(pick); break; } else continue; }
    out.push(pick);
    if (done && !OPEN.has(pick) && !/^[,;:]$/.test(pick)) break;
  }
  const tail = out.slice(seed);
  let s = "";
  for (const t of tail) s += (/^[.,!?;:]$/.test(t) || s === "") ? t : " " + t;
  return s.trim();
}

// Complete a half-typed final word from the vocabulary, ranked by how likely each
// completion is in the current context (trigram, then bigram, then overall).
export function suggestWord(model, text, k = 6) {
  if (!model) return [];
  const toks = tokenize(text);
  if (!toks.length || /[.,!?;:\s]$/.test(text)) return [];
  const prefix = toks[toks.length - 1];
  const prev = toks.length >= 2 ? toks[toks.length - 2] : null;
  const prev2 = toks.length >= 3 ? toks[toks.length - 3] : null;
  const bi = prev ? (model.bi.get(prev) || new Map()) : new Map();
  const tri = (prev2 && prev) ? (model.tri.get(prev2 + " " + prev) || new Map()) : new Map();
  const matches = model.vocab.filter((w) => w !== prefix && w.startsWith(prefix) && /^[a-z0-9']+$/.test(w));
  return matches
    .map((w) => ({ word: w, tri: tri.get(w) || 0, bi: bi.get(w) || 0, uni: model.uni.get(w) || 0 }))
    .sort((a, b) => (b.tri - a.tri) || (b.bi - a.bi) || (b.uni - a.uni) || (a.word < b.word ? -1 : 1))
    .slice(0, k)
    .map((m) => m.word);
}

// How confident is the model about the single next word? (top interpolated prob)
export function confidence(model, context) {
  const r = predictNext(model, context, 1);
  return r.length ? r[0].p : 0;
}

// Universal Engine — the English word list (WordNet 3.0, Princeton University; notice in lexicon.txt).
// About 147,000 words and phrases with every meaning WordNet records: definitions, examples,
// synonyms, opposites and "is a kind of" links. Deterministic and offline: the list is a plain
// data file, downloaded once (during the site's boot screen when possible) and cached by the
// service worker. Until it arrives every function here answers "not loaded" and DI works as before.

export const LEX_VERSION = "1";
const POS_NAME = { n: "noun", v: "verb", a: "adjective", r: "adverb" };
let L = null, loading = null;

export const lexReady = () => !!L;

// parse lexicon.txt (format in tools/di-lexicon-build.mjs)
export function setLexicon(text) {
  const pos = [], topic = [], lem = [], gloss = [], ex = [], hyp = [], ant = [];
  const index = new Map(); // lowercase lemma -> [[line, rank, count], ...]
  let n = 0;
  for (const line of String(text).split("\n")) {
    if (!line || line[0] === "#") continue;
    const f = line.split("\t");
    const names = [];
    for (const raw of f[1].split("|")) {
      const m = raw.match(/^(.*?)(?:~(\d+))?(?:\*(\d+))?$/);
      names.push(m[1]);
      const k = m[1].toLowerCase();
      let arr = index.get(k); if (!arr) index.set(k, (arr = []));
      arr.push([n, m[2] ? +m[2] : 1, m[3] ? +m[3] : 0]);
    }
    pos.push(f[0][0]); topic.push(parseInt(f[0].slice(1) || "0", 36)); lem.push(names); gloss.push(f[2] || ""); ex.push(f[3] || "");
    hyp.push(f[4] ? f[4].split(" ").map((x) => parseInt(x, 36)) : null);
    ant.push(f[5] || null);
    n++;
  }
  L = { pos, topic, lem, gloss, ex, hyp, ant, index };
  return n;
}

// fetch once; resolves true when the list is ready, false if it could not be loaded
export function loadLexicon(url = "./lexicon.txt?v=" + LEX_VERSION) {
  if (L) return Promise.resolve(true);
  if (!loading) loading = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))))
    .then((t) => { setLexicon(t); return true; })
    .catch(() => { loading = null; return false; });
  return loading;
}

// ---------------------------------------------------------------- word forms
const IRREGULAR = {
  am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", being: "be", has: "have", had: "have", having: "have",
  did: "do", does: "do", done: "do", went: "go", gone: "go", goes: "go", said: "say", made: "make", took: "take", taken: "take",
  came: "come", saw: "see", seen: "see", knew: "know", known: "know", got: "get", gotten: "get", gave: "give", given: "give",
  found: "find", thought: "think", told: "tell", became: "become", left: "leave", felt: "feel", brought: "bring", began: "begin",
  begun: "begin", kept: "keep", held: "hold", wrote: "write", written: "write", stood: "stand", heard: "hear", meant: "mean",
  met: "meet", ran: "run", paid: "pay", sat: "sit", spoke: "speak", spoken: "speak", lay: "lie", lain: "lie", led: "lead",
  grew: "grow", grown: "grow", lost: "lose", fell: "fall", fallen: "fall", sent: "send", built: "build", understood: "understand",
  drew: "draw", drawn: "draw", broke: "break", broken: "break", spent: "spend", rose: "rise", risen: "rise", drove: "drive",
  driven: "drive", bought: "buy", wore: "wear", worn: "wear", chose: "choose", chosen: "choose", sought: "seek", threw: "throw",
  thrown: "throw", caught: "catch", dealt: "deal", won: "win", forgot: "forget", forgotten: "forget", ate: "eat", eaten: "eat",
  flew: "fly", flown: "fly", sang: "sing", sung: "sing", swam: "swim", swum: "swim", taught: "teach", fought: "fight", froze: "freeze",
  frozen: "freeze", hid: "hide", hidden: "hide", rode: "ride", ridden: "ride", sold: "sell", shook: "shake", shaken: "shake",
  slept: "sleep", stole: "steal", stolen: "steal", struck: "strike", swore: "swear", tore: "tear", torn: "tear", woke: "wake",
  woken: "wake", bit: "bite", bitten: "bite", blew: "blow", blown: "blow", dug: "dig", fed: "feed", fled: "flee", hung: "hang",
  knelt: "kneel", lent: "lend", lit: "light", slid: "slide", spun: "spin", stuck: "stick", stung: "sting", swept: "sweep", wept: "weep",
  children: "child", men: "man", women: "woman", people: "person", mice: "mouse", feet: "foot", teeth: "tooth", geese: "goose",
  oxen: "ox", lice: "louse", data: "datum", criteria: "criterion", phenomena: "phenomenon", indices: "index", matrices: "matrix",
  vertices: "vertex", analyses: "analysis", theses: "thesis", crises: "crisis", cacti: "cactus", fungi: "fungus", knives: "knife",
  wives: "wife", lives: "life", leaves: "leaf", wolves: "wolf", halves: "half", shelves: "shelf", thieves: "thief",
  better: "good", best: "good", worse: "bad", worst: "bad", less: "little", least: "little", more: "much", most: "much",
  further: "far", furthest: "far", farther: "far", farthest: "far", elder: "old", eldest: "old",
};
const RULES = [["ies", "y"], ["ves", "f"], ["ses", "s"], ["xes", "x"], ["zes", "z"], ["ches", "ch"], ["shes", "sh"], ["men", "man"], ["es", "e"], ["es", ""], ["s", ""],
  ["ied", "y"], ["ed", "e"], ["ed", ""], ["ying", "ie"], ["ing", "e"], ["ing", ""], ["ier", "y"], ["iest", "y"], ["er", ""], ["est", ""], ["er", "e"], ["est", "e"], ["ly", ""], ["ily", "y"]];

// base forms of a word that the list knows, most direct first: "running" -> ["running", "run"]
export function lemmas(word) {
  if (!L) return [];
  const w = String(word || "").toLowerCase().trim().replace(/[’]/g, "'").replace(/'s$/, "");
  if (!w) return [];
  const out = [];
  const add = (x) => { if (x && L.index.has(x) && !out.includes(x)) out.push(x); };
  add(w); add(w.replace(/-/g, " ")); add(IRREGULAR[w]);
  for (const [suf, rep] of RULES) if (w.length > suf.length + 1 && w.endsWith(suf)) {
    const base = w.slice(0, -suf.length) + rep;
    add(base);
    if (/(ing|ed|er|est)$/.test(suf) && /([b-df-hj-np-tv-z])\1$/.test(base)) add(base.slice(0, -1)); // running -> runn -> run
  }
  return out;
}

// words that carry grammar rather than meaning; WordNet leaves most of them out on purpose
const FUNCTION_WORDS = new Set(("a an the of to in on at by for from with without into onto over under about above below after before since until " +
  "and or but nor so yet if then than because while though although as i you he she it we they me him her us them my your his its our their " +
  "mine yours hers ours theirs this that these those what which who whom whose where when why how is am are was were be been being do does did " +
  "have has had can could will would shall should may might must not no yes there here some any all each every either neither both few many " +
  "much more most other another such own same very too also just only even please thanks thank ok okay hi hello hey let lets whats hows " +
  "im ive id youre theyre isnt arent wasnt dont doesnt didnt cant couldnt wont wouldnt shouldnt upon via per vs etc into out up down off").split(" "));

// is this a word DI understands (as a dictionary word or a grammar word)?
export function known(word) {
  const w = String(word || "").toLowerCase().replace(/[’']/g, "");
  if (!w) return false;
  if (FUNCTION_WORDS.has(w) || /^\d/.test(w)) return true;
  return lemmas(word).length > 0 || (/n't$/.test(String(word).toLowerCase()) && lemmas(String(word).toLowerCase().replace(/n't$/, "")).length > 0);
}

// share of the words in a text that are understood, and the ones that are not
export function coverage(text) {
  const toks = String(text || "").match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  const unknown = toks.filter((t) => !known(t));
  return { words: toks.length, known: toks.length - unknown.length, unknown };
}

// ---------------------------------------------------------------- meanings
function sensesOf(k) {
  const arr = (L && L.index.get(k)) || [];
  return arr.map(([line, rank, count]) => ({ line, rank, count, pos: L.pos[line] }));
}
const synset = (line) => ({ line, pos: L.pos[line], words: L.lem[line], gloss: L.gloss[line], example: L.ex[line] });

// every meaning of a word, grouped by part of speech, most used part of speech first
export function define(word, limit = 3) {
  if (!L) return { ok: false, loading: true };
  const forms = lemmas(word);
  if (!forms.length) return { ok: false, word };
  const base = forms[0];
  const groups = {};
  for (const s of sensesOf(base)) (groups[s.pos] = groups[s.pos] || []).push(s);
  const order = Object.keys(groups).sort((a, b) => groups[b].reduce((t, s) => t + s.count, 0) - groups[a].reduce((t, s) => t + s.count, 0) || "nvar".indexOf(a) - "nvar".indexOf(b));
  const out = order.map((p) => {
    const ss = groups[p].sort((a, b) => a.rank - b.rank);
    return { pos: POS_NAME[p], total: ss.length, senses: ss.slice(0, limit).map((s) => { const y = synset(s.line); return { gloss: y.gloss, example: y.example, synonyms: y.words.filter((w) => w.toLowerCase() !== base) }; }) };
  });
  return { ok: true, word: String(word).toLowerCase(), base, groups: out, senseCount: sensesOf(base).length, formOf: forms.slice(1).filter((f) => f !== base.replace(/-/g, " ")) };
}

// other words with the same meaning, grouped by meaning, most used meaning first
export function synonymsOf(word, max = 16, maxGroups = 5) {
  if (!L) return { ok: false, loading: true };
  const base = lemmas(word)[0];
  if (!base) return { ok: false, word };
  const out = [];
  const ss = sensesOf(base).sort((a, b) => b.count - a.count || a.rank - b.rank);
  const push = (line) => { for (const w of L.lem[line]) if (w.toLowerCase() !== base && !out.includes(w)) out.push(w); };
  for (const s of ss) push(s.line);
  for (const s of ss) if (s.pos === "a") for (const h of L.hyp[s.line] || []) push(h); // similar adjectives
  const groups = [];
  for (const s of ss) {
    const own = L.lem[s.line].filter((w) => w.toLowerCase() !== base);
    // a lone adjective meaning borrows its closest similar meanings' words ("happy" -> glad, blissful)
    const near = own.length || s.pos !== "a" ? [] : (L.hyp[s.line] || []).slice(0, 3).flatMap((h) => L.lem[h]).filter((w) => w.toLowerCase() !== base);
    const words = [...new Set([...own, ...near])].slice(0, 6);
    if (words.length) groups.push({ pos: POS_NAME[s.pos], gloss: L.gloss[s.line], words });
    if (groups.length >= maxGroups) break;
  }
  return { ok: true, word: base, words: out.slice(0, max), groups };
}

// opposites: WordNet's direct antonym links, then those of similar adjectives
export function antonymsOf(word, max = 10) {
  if (!L) return { ok: false, loading: true };
  const base = lemmas(word)[0];
  if (!base) return { ok: false, word };
  const out = [];
  for (const s of sensesOf(base).sort((a, b) => b.count - a.count || a.rank - b.rank)) {
    const i = L.lem[s.line].findIndex((w) => w.toLowerCase() === base);
    for (const a of (L.ant[s.line] || "").split(" ").filter(Boolean)) {
      const [src, ln, dst] = a.split(".").map((x) => parseInt(x, 36));
      if (src === i && L.lem[ln] && L.lem[ln][dst] && !out.includes(L.lem[ln][dst])) out.push(L.lem[ln][dst]);
    }
  }
  // a "satellite" adjective (glad) has no opposite of its own; its head meaning (happy) does
  if (!out.length) for (const s of sensesOf(base)) if (s.pos === "a") for (const h of L.hyp[s.line] || []) for (const a of (L.ant[h] || "").split(" ").filter(Boolean)) {
    const [, ln, dst] = a.split(".").map((x) => parseInt(x, 36));
    if (L.lem[ln] && L.lem[ln][dst] && !out.includes(L.lem[ln][dst])) out.push(L.lem[ln][dst]);
  }
  return { ok: true, word: base, words: out.slice(0, max) };
}

// "is a dog an animal": follow "is a kind of" links up from every noun meaning of a
function ancestry(line, depth = 0, seen = new Set()) {
  if (depth > 25 || seen.has(line)) return [];
  seen.add(line);
  const out = [[line]];
  for (const h of L.hyp[line] || []) for (const path of ancestry(h, depth + 1, seen)) out.push([line, ...path]);
  return out;
}
export function isKindOf(a, b) {
  if (!L) return { ok: false, loading: true };
  const A = lemmas(a).find((x) => sensesOf(x).some((s) => s.pos === "n")), B = lemmas(b).find((x) => sensesOf(x).some((s) => s.pos === "n"));
  if (!A || !B) return { ok: false, unknown: !A ? a : b };
  // the second word in its main meaning ("bird" the animal, not the shuttlecock)
  const bMain = sensesOf(B).filter((s) => s.pos === "n").sort((x, y) => y.count - x.count || x.rank - y.rank)[0];
  const targets = new Set([bMain.line]);
  const aSenses = sensesOf(A).filter((s) => s.pos === "n").sort((x, y) => x.rank - y.rank);
  let best = null;
  for (const s of aSenses) for (const path of ancestry(s.line)) {
    const end = path[path.length - 1];
    if (targets.has(end) && (!best || path.length < best.length)) best = path;
  }
  const name = (line, i) => (i === 0 ? A : L.lem[line][0]);
  // when only some meanings of a qualify ("dolphin" the fish, not the whale), say which one
  const shown = best && L.lem[best[0]].find((w) => w.toLowerCase() === A);
  // another meaning on the same topic that does not lead to b ("dolphin" the fish vs the whale)
  const reaches = (line) => ancestry(line).some((p) => targets.has(p[p.length - 1]));
  const otherMeaning = (line) => { const o = aSenses.find((s) => s.line !== line && L.topic[s.line] === L.topic[line] && !reaches(s.line)); return o ? L.gloss[o.line] : null; };
  if (best) return { ok: true, yes: true, a: A, b: B, proper: /^[A-Z]/.test(shown || ""), display: shown || A, chain: best.map((l, i) => (i === 0 ? shown || A : L.lem[l][0])), sense: best[0] !== aSenses[0].line || otherMeaning(best[0]) ? L.gloss[best[0]] : null, other: otherMeaning(best[0]) };
  // no link: take the meaning of a that is closest to b, and name the branch they share
  // ("a spider is an arachnid; spiders and insects are both arthropods")
  const bAnc = new Set();
  for (const t of targets) for (const p of ancestry(t)) for (const x of p) bAnc.add(x);
  // prefer the most specific shared branch (vertebrate over organism), then the shortest way to it
  const depth = (line) => Math.max(...ancestry(line).map((p) => p.length));
  let pick = null, at = Infinity, deep = -1;
  for (const s of aSenses) for (const p of ancestry(s.line)) {
    const i = p.findIndex((x, k) => k > 0 && bAnc.has(x)); if (i <= 0) continue;
    const d = depth(p[i]);
    if (d > deep || (d === deep && i < at)) { deep = d; at = i; pick = p; }
  }
  if (!pick) return { ok: true, yes: false, a: A, b: B, chain: [A], shared: null };
  // a far-off shared branch ("whole", "object") says nothing useful
  return at <= 4 ? { ok: true, yes: false, a: A, b: B, chain: pick.slice(0, at + 1).map(name), shared: L.lem[pick[at]][0] } : { ok: true, yes: false, a: A, b: B, chain: pick.slice(0, 4).map(name), shared: null };
}

// the verbs DI can act on; a word that means one of these can stand in for it
const COMMANDS = ["calculate", "compute", "convert", "reverse", "sort", "count", "total", "sum", "add", "subtract", "multiply", "divide", "average",
  "solve", "define", "factorize", "round", "encode", "decode", "translate", "uppercase", "lowercase", "capitalize", "generate", "write", "list", "simplify"];
const COMMAND_SET = new Set(COMMANDS);
// "tally 3, 4 and 5" -> "total 3, 4 and 5"; only a word DI does not already act on is swapped, and only for a command verb
export function commandSynonym(word) {
  if (!L) return null;
  const w = String(word || "").toLowerCase();
  if (COMMAND_SET.has(w) || FUNCTION_WORDS.has(w)) return null;
  for (const base of lemmas(w)) {
    const verbs = sensesOf(base).filter((s) => s.pos === "v").sort((a, b) => b.count - a.count || a.rank - b.rank);
    for (const s of verbs) for (const x of L.lem[s.line]) if (COMMAND_SET.has(x.toLowerCase()) && x.toLowerCase() !== w) return x.toLowerCase();
  }
  return null;
}

export const isFunctionWord = (w) => FUNCTION_WORDS.has(String(w || "").toLowerCase());
export const partOfSpeechName = (p) => POS_NAME[p] || p;
export const size = () => (L ? { meanings: L.pos.length, words: L.index.size } : null);

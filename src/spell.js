// Universal Engine — typo tolerance. Deterministic, no imports (unit-testable in
// Node), no AI, no model file. A noisy-channel spelling corrector in the classic
// sense: it scores every vocabulary word by a WEIGHTED edit distance that knows how
// people actually mistype — a doubled key ("conttinue"), a neighbouring key on a
// QWERTY keyboard ("powerfuk"), two swapped letters ("teh"), a dropped vowel
// ("wrte") — and breaks ties by how common the word is. Same input, same output.
//
// It only ever swaps a word for a real vocabulary word, never invents one, and it
// leaves alone anything that looks like content rather than prose: quoted text,
// [..] {..} literals, /regex/ literals, text after a colon, identifiers with _ or .,
// and numbers; a Capitalised word (maybe a name like "Maya") only gets a cheap fix.

// --- QWERTY neighbours (same row left/right, plus the staggered rows above/below) ---
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const ADJ = {};
for (let r = 0; r < ROWS.length; r++) {
  for (let c = 0; c < ROWS[r].length; c++) {
    const k = ROWS[r][c], s = new Set();
    const put = (rr, cc) => { if (ROWS[rr] && ROWS[rr][cc]) s.add(ROWS[rr][cc]); };
    put(r, c - 1); put(r, c + 1);
    put(r - 1, c); put(r - 1, c + 1);
    put(r + 1, c - 1); put(r + 1, c);
    ADJ[k] = s;
  }
}
const VOWEL = new Set(["a", "e", "i", "o", "u", "y"]);
export const isAdjacent = (a, b) => !!(ADJ[a] && ADJ[a].has(b));

// letters that sound alike, so people spell by ear ("desicion", "reconize")
const SOUND = new Map([["cs", 0.55], ["ck", 0.55], ["sz", 0.55], ["kq", 0.55], ["gj", 0.6], ["dt", 0.7], ["bp", 0.7], ["fv", 0.7]]);
function subCost(a, b) {
  if (a === b) return 0;
  if (isAdjacent(a, b)) return 0.5;         // fat-fingered the key next door
  const snd = SOUND.get(a < b ? a + b : b + a);
  if (snd) return snd;
  if (VOWEL.has(a) && VOWEL.has(b)) return 0.7; // vowel confusion ("seperate")
  return 1;
}

// silent letters people leave out: "dg" (budget), "bt" (doubt), "sc" (descend);
// "x_" marks a letter silent after x: "rc" (arctic), "xc" (except), "mn" (condemn), "gh" (night), "rh" (rhythm)
const SILENT = new Set(["dg", "bt", "sc", "rc_", "xc_", "mn_", "gh_", "rh_", "wh_"]);

// Weighted optimal-string-alignment distance from what was TYPED (a) to a
// vocabulary word (b). Stops early once every path exceeds `limit`.
export function typoDistance(a, b, limit = Infinity) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 3) return Infinity;
  const d = [];
  for (let i = 0; i <= m; i++) d.push(new Array(n + 1).fill(0));
  // an extra letter typed: cheap when it doubles its neighbour ("smmarter")
  const del = (i) => (i >= 2 && a[i - 1] === a[i - 2]) ? 0.3 : VOWEL.has(a[i - 1]) ? 0.8 : 1;
  // a letter left out: cheap when it was one half of a double ("fibonaci"), a vowel
  // ("wrte"), a silent letter in a cluster ("buget", "condem", "dout"), or an "r"
  // after a vowel, which is often not heard ("youself", "suprise")
  const ins = (j) => (j >= 2 && b[j - 1] === b[j - 2]) ? 0.4 : VOWEL.has(b[j - 1]) ? 0.7
    : SILENT.has(b[j - 1] + (b[j] || "")) || SILENT.has((b[j - 2] || "") + b[j - 1] + "_") ? 0.5
    : b[j - 1] === "r" && j >= 2 && VOWEL.has(b[j - 2]) && b[j] && !VOWEL.has(b[j]) ? 0.7 : 1;
  for (let i = 1; i <= m; i++) d[i][0] = d[i - 1][0] + del(i);
  for (let j = 1; j <= n; j++) d[0][j] = d[0][j - 1] + ins(j);
  let prevMin = 0;
  for (let i = 1; i <= m; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= n; j++) {
      let v = Math.min(d[i - 1][j] + del(i), d[i][j - 1] + ins(j), d[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2]) v = Math.min(v, d[i - 2][j - 2] + 0.45); // swapped pair ("teh", "waht"): the most common slip
      d[i][j] = v;
      if (v < rowMin) rowMin = v;
    }
    // a swap reaches back two rows, so only stop once two rows in a row are over
    if (rowMin > limit && prevMin > limit) return Infinity;
    prevMin = rowMin;
  }
  return d[m][n];
}

// Everyday English + request vocabulary, so ordinary words are recognised as
// correct (and never "fixed" into a technical term) and common typos of them are
// caught. Ordered roughly by frequency; earlier words get a higher prior.
export const COMMON = ("the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did does done doing said says made going gets got let lets " +
  "hi hello hey thanks thank please sorry yes yeah ok okay sure right wrong why where whats what's how's hows im i'm dont don't cant can't wont won't isnt isn't doesnt doesn't didnt didn't youre you're its it's thats that's theres there's whos who's ill i'll ive i've id i'd " +
  "much many more less few lot lots very really quite too enough every each single all both either neither another same different next last before again always never sometimes often maybe probably " +
  "number numbers word words letter letters character characters sentence sentences text string strings line lines list lists value values name names thing things something anything nothing everything someone anyone " +
  "calculate compute solve find show tell explain define describe answer question ask help check test try run build create write generate implement code program function method class variable loop array object file files data table tables " +
  "add plus minus subtract multiply divide times divided sum total difference product average mean median percent percentage half double triple square root cube power squared cubed equals equal greater smaller larger bigger less than between " +
  "convert conversion change into from turn translate transform become " +
  "smart smarter smartest powerful better best understand understanding predict prediction predictions typo typos mistake mistakes fix correct spelling spell " +
  "game website app page site tool agent model engine chat message reply prompt " +
  "today tomorrow yesterday week weeks month months year years day days hour hours minute minutes second seconds date dates time times morning night " +
  "capital country countries city cities element elements atomic mass symbol constant constants speed light gravity planet earth sun moon star " +
  "big small large little long short high low fast slow hot cold old young easy hard simple full empty open close start stop begin end continue finish keep " +
  "man woman child world life hand part place case point group problem fact home water room mother area money story month lot right study book eye job business issue side kind head house service friend father power hour game line end member law car city community name president team minute idea kid body information back parent face others level office door health person art war history party result change morning reason research girl guy moment air teacher force education " +
  "sort reverse count search match pattern email emails url urls link links extract remove delete replace upper lower uppercase lowercase title").split(/\s+/);

// Build a lexicon from weighted sources. `sources` is an array of either
// arrays of words (weight 1 each) or Maps/objects of word -> count.
export function makeLexicon(...sources) {
  const freq = new Map();
  const put = (w, c) => {
    w = String(w || "").toLowerCase().trim();
    if (!w) return;
    for (const part of w.split(/[\s\-/]+/)) { // multi-word entries contribute each word
      if (!/^[a-z][a-z']*$/.test(part)) continue;
      freq.set(part, (freq.get(part) || 0) + c);
    }
  };
  COMMON.forEach((w, i) => put(w, Math.max(2, 60 - Math.floor(i / 10)))); // rank prior
  for (const src of sources) {
    if (!src) continue;
    if (src instanceof Map) { for (const [w, c] of src) put(w, +c || 1); continue; }
    if (Array.isArray(src)) { for (const w of src) put(w, 1); continue; }
    if (typeof src === "object") for (const w in src) put(w, +src[w] || 1);
  }
  const byLen = new Map();
  for (const [w, c] of freq) { const L = w.length; if (!byLen.has(L)) byLen.set(L, []); byLen.get(L).push([w, c]); }
  for (const arr of byLen.values()) arr.sort((x, y) => (x[0] < y[0] ? -1 : 1)); // deterministic scan order
  return { freq, byLen, cache: new Map() };
}

// A dictionary of real English words can be attached (lex.dict, a Set). A word in
// it is left alone even when it is not in the vocabulary ("stand" is not split
// into "st and"); only a near-certain slip into a heavily weighted command word is
// still fixed, plus a few real words that are nearly always typos in a request.
// The dictionary also supplies low-weight candidates for everyday typos
// ("recieve" -> receive), scanned only among words with the same first letter.
export function withDictionary(lex, dict, band) {
  lex.dict = dict; lex.band = band || null; lex.cache.clear();
  lex.dictIdx = new Map(); // "<length>:<first letter>" -> words
  for (const w of dict) { const k = w.length + ":" + w[0]; if (!lex.dictIdx.has(k)) lex.dictIdx.set(k, []); lex.dictIdx.get(k).push(w); }
  return lex;
}
// `ctx(prev, cand)` (optional) returns how often cand follows prev, so the word
// before breaks ties the way a reader would: "5 mils" -> miles, "teh wether" ...
export function withContext(lex, ctx) { lex.ctx = ctx; return lex; }
// ranking weights (tuned on a held-out list of classic misspellings)
export const TUNE = { DICT_PENALTY: 0.3, DICT_BAND: 0.03, BAND_W: 0.05 };
let { DICT_PENALTY, DICT_BAND, BAND_W } = TUNE;
export function setTune(t) { ({ DICT_PENALTY, DICT_BAND, BAND_W } = { ...TUNE, ...t }); }
const TYPO_WORDS = new Set(["mils", "hwo", "teh", "adn", "taht", "thta", "cna", "nad", "yuo", "wether", "thier", "alot", "untill"]);
// After "the", "a", "my"... comes a noun or adjective, not a conjunction or pronoun
// ("the wether" -> weather, not whether).
const DETERMINER = new Set(["the", "a", "an", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their", "some", "any", "every", "each", "no"]);
const FUNCTION = new Set(["whether", "their", "there", "then", "than", "which", "because", "although", "though", "and", "or", "but", "if", "of", "to", "is", "are", "was", "were", "the", "a", "an", "they", "them", "he", "she", "we", "you", "it", "who", "what", "when", "where", "why", "how", "with", "from", "into", "onto", "for", "not", "very", "been", "being", "have", "has", "had", "does", "did", "will", "would", "should", "could", "can"]);
function inDict(lex, w) {
  if (!lex.dict || TYPO_WORDS.has(w)) return false;
  return lex.dict.has(w) || british(lex, w);
}
// British spellings are correct English, not typos: the dictionary is American, so
// "colour", "centre", "realise", "travelled", "licence" are checked by their US form.
const BRITISH = [[/our(s|ed|ing|able|ably|ite|ites|hood|hoods|ful|less)?$/, "or$1"], [/our/, "or"], [/re(s|d)?$/, "er$1"], [/is(e|es|ed|ing|ation|ations|er|ers)$/, "iz$1"], [/ys(e|es|ed|ing)$/, "yz$1"], [/ll(ed|ing|er|ers)$/, "l$1"], [/ogue(s)?$/, "og$1"], [/ence(s)?$/, "ense$1"], [/ae/, "e"], [/oe/, "e"], [/gramme(s)?$/, "gram$1"]];
function british(lex, w) {
  if (w.length < 5) return false;
  for (const [re, to] of BRITISH) if (re.test(w)) { const us = w.replace(re, to); if (us !== w && lex.dict.has(us)) return true; }
  return false;
}
// A regular derivation of a real word may be a real word too ("paintless",
// "lamplight", "whisperings", "unassailed"), but "wonderfull" and "sandwhich" also
// split into real parts. So a derivation is not accepted outright: it competes as
// "leave it alone" at this cost (0.8 for an affix, 0.9 for a compound), and only a
// correction cheaper than that wins. Every part must be a word of 4+ letters.
const SUFFIX = /^(.{4,}?)(less|ish|ness|ful|fully|ly|ings|ers|like|wards?)$/;
const PREFIX = /^(un|re|over|under|out|non|pre|mis|counter|super|semi|sub|inter)(.{4,})$/;
function derived(lex, w) {
  if (w.length < 7 || MISSPELLINGS[w]) return false;
  const d = lex.dict, m1 = w.match(SUFFIX), m2 = w.match(PREFIX);
  if (m1 && d.has(m1[1])) return 0.8;
  if (m2 && d.has(m2[2])) return 0.8;
  for (let i = 4; i <= w.length - 4; i++) if (d.has(w.slice(0, i)) && d.has(w.slice(i)) && (!lex.band || (lex.band(w.slice(0, i)) >= 2 && lex.band(w.slice(i)) >= 2))) return 0.9;
  return 0;
}

// Misspellings people make on purpose-looking words, where the edit distance
// alone points the wrong way ("suprise" is one letter from "sunrise" too).
export const MISSPELLINGS = { wich: "which", probly: "probably", prolly: "probably", rember: "remember", remeber: "remember", suprise: "surprise", happend: "happened", devide: "divide", truely: "truly", basicly: "basically", begining: "beginning", persue: "pursue", wierd: "weird", recieve: "receive", beleive: "believe", freind: "friend", definately: "definitely", defiantly: "definitely", seperate: "separate", untill: "until", alot: "a lot", thier: "their", occured: "occurred", tommorow: "tomorrow", tomorow: "tomorrow", arguement: "argument", goverment: "government", enviroment: "environment", neccessary: "necessary", necesary: "necessary", accomodate: "accommodate", acheive: "achieve", calender: "calendar", concious: "conscious", existance: "existence", foward: "forward", grammer: "grammar", immediatly: "immediately", independant: "independent", knowlege: "knowledge", libary: "library", posible: "possible", reccomend: "recommend", recomend: "recommend", sucess: "success", fourty: "forty", jewelery: "jewelry", jewellry: "jewelry", tounge: "tongue", minit: "minute", mony: "money", studing: "studying", calander: "calendar", desparate: "desperate", dicision: "decision", cofee: "coffee", coffe: "coffee", succes: "success", tomatos: "tomatoes", writting: "writing", becuase: "because", beacuse: "because", becasue: "because", finaly: "finally", realy: "really", publically: "publicly", embarass: "embarrass", occurence: "occurrence", wether: ["whether", "weather"], lenght: "length", widht: "width", heigth: "height", hieght: "height", strenght: "strength", seige: "siege", wensday: "wednesday", wendsday: "wednesday", febuary: "february", feburary: "february", substract: "subtract", mulitply: "multiply", tempature: "temperature", temprature: "temperature", celcius: "celsius", farenheit: "fahrenheit", fahrenheight: "fahrenheit", milimeter: "millimeter", algoritm: "algorithm", algorythm: "algorithm", pyhton: "python", pytohn: "python", javscript: "javascript", javasript: "javascript", funtion: "function", fucntion: "function", varible: "variable", arguements: "arguments", paramter: "parameter", parmeter: "parameter", recursoin: "recursion", fibonaci: "fibonacci", fibbonacci: "fibonacci", palindrom: "palindrome", factoral: "factorial", squareroot: "square root", percentge: "percentage", restaraunt: "restaurant", restraunt: "restaurant", resteraunt: "restaurant", resturant: "restaurant", liberry: "library", nucular: "nuclear", yatch: "yacht", excercise: "exercise", wholy: "wholly" };

// Is this word (or a plain inflection of it) already a known word? With a
// dictionary attached, the dictionary decides (it lists real inflections), so
// "begining" is not waved through as "begin" + "ing".
export function known(lex, w) {
  if (lex.freq.has(w)) return true;
  if (lex.dict) return false;
  const stems = [w.replace(/'s$/, ""), w.replace(/s$/, ""), w.replace(/es$/, ""), w.replace(/ed$/, ""), w.replace(/ed$/, "e"), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/ly$/, ""), w.replace(/ies$/, "y"), w.replace(/er$/, ""), w.replace(/est$/, "")];
  return stems.some((s) => s !== w && s.length >= 3 && lex.freq.has(s));
}

// How far a word may be from its correction, by length. Short words must be
// nearly exact (a 3-letter word forgives one cheap slip: "tto" -> "to", "teh" -> "the").
function limitFor(L) { return L <= 3 ? 0.6 : L === 4 ? 0.8 : L <= 6 ? 1.2 : L <= 8 ? 1.7 : 2.2; }

// Classic English spelling confusions, tried as whole-pattern rewrites and looked
// up exactly, each at a small cost: suffix vowels (-er/-or, -ant/-ent, -ance/-ence,
// -able/-ible, -ary/-ery), ie/ei, a dropped "y" before -ing, -ise/-ize.
const VARIANTS = [[/er$/, "or"], [/or$/, "er"], [/ar$/, "er"], [/er$/, "ar"], [/ant$/, "ent"], [/ent$/, "ant"], [/ance$/, "ence"], [/ence$/, "ance"], [/ancy$/, "ency"], [/ency$/, "ancy"],
  [/able$/, "ible"], [/ible$/, "able"], [/ery$/, "ary"], [/ary$/, "ery"], [/ory$/, "ary"], [/ie/, "ei"], [/ei/, "ie"], [/([^aeiouy])ing$/, "$1ying"], [/ise$/, "ize"], [/ture$/, "teur"], [/ous$/, "eous"], [/ius$/, "ious"],
  [/sion$/, "tion"], [/tion$/, "sion"], [/([^aeiou])ys$/, "$1ies"], [/os$/, "oes"], [/ley$/, "ly"], [/ary$/, "arly"], [/cle$/, "cal"], [/cal$/, "cle"], [/tle$/, "tal"], [/tal$/, "tle"], [/oe$/, "o"], [/ph/, "f"], [/f/, "ph"], [/ck/, "k"], [/k$/, "ck"],
  [/a?tl?e?ly$/, "itely"], [/^des/, "dis"], [/^dis/, "des"], [/tion$/, "tition"], [/sion$/, "ssion"], [/ular$/, "lear"], [/tch$/, "cht"], [/egue$/, "eague"],
  [/icly$/, "ically"], [/ently$/, "entally"], [/yness$/, "iness"], [/eatful$/, "ateful"], [/^interg/, "integ"], [/whi/, "wi"]];
function variants(lex, w) {
  const out = [];
  for (const [re, to] of VARIANTS) {
    if (!re.test(w)) continue;
    const v = w.replace(re, to);
    if (v !== w && (lex.freq.has(v) || (lex.dict && lex.dict.has(v)))) out.push([v, 0.35, lex.freq.get(v) || 0.5]);
  }
  return out;
}

// Every plausible correction of one word: [[candidate, cost, frequency]], cached.
function candidates(lex, w) {
  if (lex.cache.has(w)) return lex.cache.get(w);
  let list = [];
  // a known misspelling; when it has two readings ("wether"), the context ranks them
  if (MISSPELLINGS[w]) { const l = [].concat(MISSPELLINGS[w]).map((x) => [x, 0.3, 50]); lex.cache.set(w, l); return l; }
  const suspect = TYPO_WORDS.has(w);
  if (!suspect && !known(lex, w) && inDict(lex, w)) {
    // a real word: only a near-certain slip into a command word
    for (let L = w.length - 1; L <= w.length + 1; L++) {
      const bucket = lex.byLen.get(L); if (!bucket) continue;
      for (const [cand, c] of bucket) {
        if (c < 40 || cand[0] !== w[0] || (lex.band && lex.band(w) > 2)) continue; // a common real word ("chose") is meant
        const cost = typoDistance(w, cand, 0.45);
        if (cost <= 0.45) list.push([cand, cost, c]);
      }
    }
  } else if (suspect || !known(lex, w)) {
    const limit = limitFor(w.length);
    for (let L = Math.max(2, w.length - 2); L <= w.length + 2; L++) {
      const bucket = lex.byLen.get(L); if (!bucket) continue;
      for (const [cand, c] of bucket) {
        let cost = typoDistance(w, cand, limit + 0.3);
        if (cand[0] !== w[0]) cost += 0.3; // first letters are rarely wrong
        if (cost <= limit) list.push([cand, cost, c]);
      }
      // ordinary English from the dictionary, at the lowest weight
      const dw = lex.dictIdx && lex.dictIdx.get(L + ":" + w[0]);
      if (dw) for (const cand of dw) {
        if (lex.freq.has(cand)) continue;
        const cost = typoDistance(w, cand, limit);
        if (cost <= limit) list.push([cand, cost, 0.5]);
      }
    }
    for (const v of variants(lex, w)) if (!list.some((x) => x[0] === v[0] && x[1] <= v[1])) list.push(v);
    const keep = lex.dict ? derived(lex, w) : 0;
    if (keep) list.push([w, keep, -1]); // "leave it alone" (see derived)
    // a run-together pair of real words ("whatis", "howmany") splits. A split
    // costs 0.75, so a one-letter slip ("predicton" -> prediction, 0.7) still wins.
    // The split competes with the other candidates, so "youself" is still yourself.
    const SPLIT = 0.75;
    if (w.length >= 5 && !list.some((x) => x[1] <= SPLIT)) {
      for (let i = 2; i <= w.length - 2; i++) {
        const l = w.slice(0, i), r = w.slice(i);
        if (lex.freq.has(l) && lex.freq.has(r) && lex.freq.get(l) >= 2 && lex.freq.get(r) >= 2) { list.push([l + " " + r, SPLIT, Math.min(lex.freq.get(l), lex.freq.get(r))]); break; }
      }
    }
  }
  lex.cache.set(w, list);
  return list;
}

// Every correction of one word, best first: [{ to, cost, key }].
// Cheaper edit first, then the more common word, then the one that fits after `prev`.
export function rankFixes(lex, word, prev) {
  const w = String(word || "").toLowerCase();
  if (w.length < 3 || !/^[a-z][a-z']*$/.test(w)) return [];
  const list = candidates(lex, w);
  const p = prev ? String(prev).toLowerCase() : null;
  const ctx = (a, b) => (lex.ctx ? lex.ctx(a, b) : 0);
  const out = [];
  let keepKey = Infinity;
  for (const [cand, cost, c] of list) {
    if (cand === w) { if (c === -1) keepKey = cost; continue; }
    // a dictionary-only word is a rarer guess in a request; after a number
    // other than 1, a plural reads right ("5 mils" -> miles, not mile)
    const plural = (p && /^\d+(?:\.\d+)?$/.test(p) && p !== "1" && /s$/.test(cand) ? 0.25 : 0) - (/[^s]s$/.test(w) && !/s$/.test(cand) ? 0.3 : 0); // "minuts" stays plural
    // how common the word is in real English (band 0-9), when the dictionary knows
    const b = lex.band ? lex.band(cand) : 0;
    const rare = c < 1 ? Math.max(0, DICT_PENALTY - DICT_BAND * b) : 0;
    // one prior, not two: the vocabulary weight or the real-English frequency, whichever says more
    const prior = Math.max(0.12 * Math.log10(1 + c), BAND_W * b);
    // the first word of a request is usually its command ("convet" -> convert, not convey)
    const lead = prev === null && lex.ctx && c >= 40 ? 0.2 : 0;
    const grammar = p && DETERMINER.has(p) && FUNCTION.has(cand) ? 0.5 : 0;
    const key = cost + rare - prior - (p ? 0.3 * Math.log10(1 + ctx(p, cand)) : 0) - plural - lead + grammar;
    if (key < keepKey) out.push({ to: cand, cost, key });
  }
  if (keepKey < Infinity) return out.filter((x) => x.key < keepKey).sort((x, y) => (x.key - y.key) || (x.to < y.to ? -1 : 1));
  return out.sort((x, y) => (x.key - y.key) || (x.to < y.to ? -1 : 1));
}
// Best correction for one lowercase word: { to, cost } or null if it is fine / unfixable.
export function bestFix(lex, word, prev) {
  const r = rankFixes(lex, word, prev)[0];
  return r ? { to: r.to, cost: r.cost } : null;
}
// Is this a word the corrector recognises as correctly spelled?
export function isWord(lex, word) {
  const w = String(word || "").toLowerCase();
  return w.length < 3 || known(lex, w) || (inDict(lex, w) && !MISSPELLINGS[w]) || (!!lex.dict && !!derived(lex, w) && !rankFixes(lex, w).length);
}
export function correctWord(lex, word) { const f = bestFix(lex, word); return f ? f.to : null; }

// Spans that are content, not prose: never corrected.
const PROTECT = /"[^"]*"|'[^'\s][^']*'|`[^`]*`|\[[^\]]*\]|\{[^}]*\}|\/[^/\s][^/]*\/|#[0-9a-f]{3,8}\b|https?:\/\/\S+|\S+@\S+/gi;

// Correct a whole request. Returns { text, fixes: [{ from, to }] }.
// `accept(to, from)` can restrict which corrections are applied (e.g. command words only).
export function correctText(lex, input, accept) {
  const s = String(input || "");
  const colon = s.indexOf(":");
  const guard = new Array(s.length).fill(false);
  let m; PROTECT.lastIndex = 0;
  while ((m = PROTECT.exec(s))) for (let i = m.index; i < m.index + m[0].length; i++) guard[i] = true;
  if (colon >= 0) for (let i = colon + 1; i < s.length; i++) guard[i] = true; // "reverse: <payload>"
  const fixes = [];
  let last = null;
  const text = s.replace(/[A-Za-z][A-Za-z'\u2019]*/g, (tok, at) => {
    const out = fixOne(tok, at);
    last = { at, from: tok, to: out };
    return out;
  });
  function fixOne(tok, at) {
    if (guard[at] || tok.length > 30) return tok; // no English word is that long: content, not a typo
    const before = s[at - 1] || "", after = s[at + tok.length] || "";
    if (/[_.$0-9]/.test(before) || /[_$0-9(]/.test(after) || (after === "." && /[A-Za-z_]/.test(s[at + tok.length + 1] || ""))) return tok; // identifier, call, or path
    if (/^[A-Z]{2,5}$/.test(tok)) return tok; // an acronym (ABC, NASA, HTML) is content, not a typo
    // a possessive ("carbon's", "James'") is its stem plus the ending: fix only the stem
    const poss = tok.match(/^(.+?)(['\u2019]s|s['\u2019]|['\u2019])$/i);
    if (poss && poss[1].length >= 2 && /^[A-Za-z]+$/.test(poss[1])) {
      if (isWord(lex, poss[1].toLowerCase())) return tok;
      const inner = fixOne(poss[1], at);
      return inner + poss[2];
    }
    const cap = /^[A-Z]/.test(tok) && !/^[A-Z]+$/.test(tok);
    // a Capitalised word inside a sentence is usually a name ("Hurst", "Chester")
    const midCap = cap && at > 0 && !/(?:^|[.!?:\n]["'\u201c\u2018(]?)\s*$/.test(s.slice(Math.max(0, at - 4), at));
    if (/^(?:mr|mrs|ms|dr|st|jr|sr|vs|etc)$/i.test(tok)) return tok;
    // a contraction ("wasn't", "they'd") is left alone unless it is a known slip
    const ap = tok.search(/['\u2019]/);
    if (ap > 0 && !/['\u2019]s$/i.test(tok) && !/^[a-z]+['\u2019]$/i.test(tok)) return tok;
    const pm = s.slice(0, at).match(/([A-Za-z0-9']+)[^A-Za-z0-9']*$/);
    // the word before, as corrected ("Teh wether" reads "the" + wether)
    const prevWord = pm ? (last && last.at + last.from.length === pm.index + pm[1].length ? last.to : pm[1]) : null;
    const f = bestFix(lex, tok, prevWord);
    // a Capitalised word may be a name ("Maya", "Ada", "Sam"): only a cheap slip
    // (a swap, doubled or neighbouring key: "Captial") is fixed, never a real edit
    // mid-sentence, only a slip into a request word ("the Captial of") is fixed
    if (!f || (cap && f.cost > 0.6) || (midCap && lex.dict && (lex.freq.get(f.to) || 0) < 40) || (accept && !accept(f.to, tok))) return tok;
    const fix = f.to;
    fixes.push({ from: tok, to: fix });
    if (/^[A-Z][a-z]/.test(tok)) return fix.charAt(0).toUpperCase() + fix.slice(1);
    if (/^[A-Z]+$/.test(tok) && tok.length > 1) return fix.toUpperCase();
    return fix;
  }
  return { text, fixes };
}

// Fuzzy prefix: vocabulary words whose opening letters are a near-miss of a
// half-typed word ("fibn" -> fibonacci). Ranked by edit cost, then frequency.
export function fuzzyPrefix(lex, prefix, k = 6) {
  const p = String(prefix || "").toLowerCase();
  if (p.length < 3) return [];
  const limit = p.length <= 4 ? 0.8 : 1.2;
  const hits = [];
  for (const [L, bucket] of lex.byLen) {
    if (L < p.length) continue;
    for (const [w, c] of bucket) {
      if (w.startsWith(p)) continue; // exact prefixes are found by the normal path
      let best = Infinity;
      for (const cut of [p.length - 1, p.length, p.length + 1]) {
        if (cut < 2 || cut > w.length) continue;
        best = Math.min(best, typoDistance(p, w.slice(0, cut), limit) + (w[0] !== p[0] ? 0.3 : 0));
      }
      if (best <= limit) hits.push([w, best, c]);
    }
  }
  return hits.sort((a, b) => (a[1] - b[1]) || (b[2] - a[2]) || (a[0] < b[0] ? -1 : 1)).slice(0, k).map((h) => h[0]);
}

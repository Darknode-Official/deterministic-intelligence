// English word inflection for DI: plural/singular of a noun, the tenses of a verb, and the
// comparative/superlative of an adjective. Rule-based with explicit irregular tables, so every
// answer is deterministic and the engine can say exactly which rule it applied. No network, no LM.
//
// Scope is honest: regular inflection plus the common irregulars below are exact; a word that is
// both regular in form and absent from the tables gets the regular rule (correct for the vast
// majority). Truly unpredictable cases (e.g. a noun that is only ever plural) are not guessed.

// base noun -> irregular plural. Mirrors the reverse map in lexicon.js plus common extras.
const PLURAL = {
  child: "children", man: "men", woman: "women", person: "people", mouse: "mice", foot: "feet",
  tooth: "teeth", goose: "geese", ox: "oxen", louse: "lice", die: "dice", penny: "pence", datum: "data",
  criterion: "criteria", phenomenon: "phenomena", index: "indices", matrix: "matrices", vertex: "vertices", appendix: "appendices",
  analysis: "analyses", thesis: "theses", crisis: "crises", basis: "bases", axis: "axes", diagnosis: "diagnoses", oasis: "oases",
  cactus: "cacti", fungus: "fungi", nucleus: "nuclei", radius: "radii", stimulus: "stimuli", alumnus: "alumni", syllabus: "syllabi",
  knife: "knives", wife: "wives", life: "lives", leaf: "leaves", wolf: "wolves", half: "halves", shelf: "shelves", thief: "thieves",
  loaf: "loaves", calf: "calves", elf: "elves", self: "selves", scarf: "scarves", hoof: "hooves",
  bacterium: "bacteria", curriculum: "curricula", medium: "media", memorandum: "memoranda", millennium: "millennia",
  formula: "formulae", antenna: "antennae", vertebra: "vertebrae", larva: "larvae",
};
const SINGULAR = Object.fromEntries(Object.entries(PLURAL).map(([s, p]) => [p, s]));
// nouns whose plural equals the singular
const INVARIANT = new Set("sheep deer fish species series aircraft spacecraft salmon trout moose bison swine offspring means dice".split(" "));

// base verb -> [past tense, past participle]. Present participle and 3rd-person are regular from these.
const VERB = {
  be: ["was", "been"], have: ["had", "had"], do: ["did", "done"], go: ["went", "gone"], say: ["said", "said"],
  make: ["made", "made"], take: ["took", "taken"], come: ["came", "come"], see: ["saw", "seen"], know: ["knew", "known"],
  get: ["got", "gotten"], give: ["gave", "given"], find: ["found", "found"], think: ["thought", "thought"], tell: ["told", "told"],
  become: ["became", "become"], leave: ["left", "left"], feel: ["felt", "felt"], bring: ["brought", "brought"], begin: ["began", "begun"],
  keep: ["kept", "kept"], hold: ["held", "held"], write: ["wrote", "written"], stand: ["stood", "stood"], hear: ["heard", "heard"],
  mean: ["meant", "meant"], meet: ["met", "met"], run: ["ran", "run"], pay: ["paid", "paid"], sit: ["sat", "sat"],
  speak: ["spoke", "spoken"], lie: ["lay", "lain"], lead: ["led", "led"], grow: ["grew", "grown"], lose: ["lost", "lost"],
  fall: ["fell", "fallen"], send: ["sent", "sent"], build: ["built", "built"], understand: ["understood", "understood"],
  draw: ["drew", "drawn"], break: ["broke", "broken"], spend: ["spent", "spent"], rise: ["rose", "risen"], drive: ["drove", "driven"],
  buy: ["bought", "bought"], wear: ["wore", "worn"], choose: ["chose", "chosen"], seek: ["sought", "sought"], throw: ["threw", "thrown"],
  catch: ["caught", "caught"], deal: ["dealt", "dealt"], win: ["won", "won"], forget: ["forgot", "forgotten"], eat: ["ate", "eaten"],
  fly: ["flew", "flown"], sing: ["sang", "sung"], swim: ["swam", "swum"], teach: ["taught", "taught"], fight: ["fought", "fought"],
  freeze: ["froze", "frozen"], hide: ["hid", "hidden"], ride: ["rode", "ridden"], sell: ["sold", "sold"], shake: ["shook", "shaken"],
  sleep: ["slept", "slept"], steal: ["stole", "stolen"], strike: ["struck", "struck"], swear: ["swore", "sworn"], tear: ["tore", "torn"],
  wake: ["woke", "woken"], bite: ["bit", "bitten"], blow: ["blew", "blown"], dig: ["dug", "dug"], feed: ["fed", "fed"],
  flee: ["fled", "fled"], hang: ["hung", "hung"], kneel: ["knelt", "knelt"], lend: ["lent", "lent"], light: ["lit", "lit"],
  slide: ["slid", "slid"], spin: ["spun", "spun"], stick: ["stuck", "stuck"], sting: ["stung", "stung"], sweep: ["swept", "swept"],
  weep: ["wept", "wept"], read: ["read", "read"], put: ["put", "put"], cut: ["cut", "cut"], hurt: ["hurt", "hurt"],
  let: ["let", "let"], set: ["set", "set"], cost: ["cost", "cost"], hit: ["hit", "hit"], shut: ["shut", "shut"],
  swing: ["swung", "swung"], bend: ["bent", "bent"], sink: ["sank", "sunk"], drink: ["drank", "drunk"], ring: ["rang", "rung"],
};
// base adjective/adverb -> [comparative, superlative]
const ADJ = {
  good: ["better", "best"], well: ["better", "best"], bad: ["worse", "worst"], far: ["farther", "farthest"],
  little: ["less", "least"], much: ["more", "most"], many: ["more", "most"],
};

const isVowel = (c) => "aeiou".includes(c);
const endsSibilant = (w) => /(s|x|z|ch|sh)$/.test(w);

// double a final consonant for -ed/-ing/-er/-est when a short word ends CVC (but not w/x/y)
function doubleFinal(w) {
  if (w.length < 2) return false;
  const a = w[w.length - 3], b = w[w.length - 2], c = w[w.length - 1];
  return !isVowel(c) && !"wxy".includes(c) && isVowel(b) && (a === undefined || !isVowel(a)) && w.length <= 5;
}

export function pluralize(noun) {
  const w = String(noun || "").toLowerCase().trim();
  if (!w) return null;
  if (PLURAL[w]) return { word: PLURAL[w], rule: "irregular plural", irregular: true };
  if (INVARIANT.has(w)) return { word: w, rule: "unchanged in the plural", irregular: true };
  if (/[^aeiou]y$/.test(w)) return { word: w.slice(0, -1) + "ies", rule: "consonant + y → -ies" };
  if (/(?:[^f]fe|lf|rf)$/.test(w) && /fe$/.test(w)) return { word: w.slice(0, -2) + "ves", rule: "-fe → -ves" };
  if (endsSibilant(w)) return { word: w + "es", rule: "sibilant ending → -es" };
  if (/[^aeiou]o$/.test(w)) return { word: w + "es", rule: "consonant + o → -es" }; // potato, tomato, hero
  return { word: w + "s", rule: "add -s" };
}

export function singularize(noun) {
  const w = String(noun || "").toLowerCase().trim();
  if (!w) return null;
  if (SINGULAR[w]) return { word: SINGULAR[w], rule: "irregular singular", irregular: true };
  if (INVARIANT.has(w)) return { word: w, rule: "same in singular and plural", irregular: true };
  if (/[^aeiou]ies$/.test(w)) return { word: w.slice(0, -3) + "y", rule: "-ies → -y" };
  if (/ves$/.test(w)) return { word: w.slice(0, -3) + (/[aeiou]ves$/.test(w) ? "f" : "fe"), rule: "-ves → -f/-fe" };
  if (/(?:ss|s|x|z|ch|sh)es$/.test(w)) return { word: w.slice(0, -2), rule: "-es → (sibilant)" };
  if (/[^s]s$/.test(w)) return { word: w.slice(0, -1), rule: "drop -s" };
  return { word: w, rule: "already singular (or unchanged)" };
}

// base -> { present3?, gerund? } for verbs whose non-past forms are also irregular
const VERB_PRES = { be: { present3: "is", gerund: "being" }, have: { present3: "has" } };
export function verbForms(verb) {
  const w = String(verb || "").toLowerCase().trim();
  if (!w) return null;
  if (VERB[w]) { const [past, pp] = VERB[w], o = VERB_PRES[w] || {}; return { base: w, past, participle: pp, gerund: o.gerund || gerund(w), present3: o.present3 || present3(w), irregular: true }; }
  return simpleVerb(w);
}
function simpleVerb(w) {
  if (!w) return null;
  let past;
  if (/[^aeiou]y$/.test(w)) past = w.slice(0, -1) + "ied";
  else if (/e$/.test(w)) past = w + "d";
  else if (doubleFinal(w)) past = w + w[w.length - 1] + "ed";
  else past = w + "ed";
  return { base: w, past, participle: past, gerund: gerund(w), present3: present3(w) };
}
function gerund(w) {
  if (/[^aeiou]ie$/.test(w)) return w.slice(0, -2) + "ying"; // lie -> lying
  if (/e$/.test(w) && !/(ee|oe|ye)$/.test(w)) return w.slice(0, -1) + "ing";
  if (doubleFinal(w)) return w + w[w.length - 1] + "ing";
  return w + "ing";
}
function present3(w) {
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
  if (endsSibilant(w) || /o$/.test(w)) return w + "es";
  return w + "s";
}

export function compareForms(adj) {
  const w = String(adj || "").toLowerCase().trim();
  if (!w) return null;
  if (ADJ[w]) return { comparative: ADJ[w][0], superlative: ADJ[w][1], irregular: true };
  const syl = countSyllables(w);
  if (syl >= 3 || (syl === 2 && !/(y|le|er|ow)$/.test(w))) return { comparative: "more " + w, superlative: "most " + w, periphrastic: true };
  let stem = w, note = "add -er / -est";
  if (/[^aeiou]y$/.test(w)) { stem = w.slice(0, -1) + "i"; note = "y → i, add -er / -est"; }
  else if (/e$/.test(w)) { stem = w.slice(0, -1); note = "drop -e, add -er / -est"; }
  else if (doubleFinal(w)) { stem = w + w[w.length - 1]; note = "double the consonant, add -er / -est"; }
  return { comparative: stem + "er", superlative: stem + "est", rule: note };
}

// rough syllable count (vowel groups, minus a silent final e); only used to pick -er vs "more"
export function countSyllables(word) {
  const w = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const groups = w.match(/[aeiouy]+/g) || [];
  let n = groups.length;
  if (/[^aeiou]e$/.test(w) && n > 1) n--; // silent final e
  return Math.max(1, n);
}

// Parse a grammar question. Returns { op, word, ... } or null.
const OF = "(?:of|for)\\s+(?:the word\\s+|the\\s+)?[\"']?([A-Za-z][A-Za-z-]*)[\"']?";
const FORMS = [
  ["plural", new RegExp("^(?:what(?:'s| is)? (?:the )?)?plurals?\\s+" + OF + "\\s*\\??$", "i")],
  ["plural", new RegExp("^(?:make|turn)\\s+[\"']?([A-Za-z-]+)[\"']?\\s+plural\\s*\\??$", "i")],
  ["singular", new RegExp("^(?:what(?:'s| is)? (?:the )?)?singulars?\\s+" + OF + "\\s*\\??$", "i")],
  ["past", new RegExp("^(?:what(?:'s| is)? (?:the )?)?past\\s+tense\\s+" + OF + "\\s*\\??$", "i")],
  ["participle", new RegExp("^(?:what(?:'s| is)? (?:the )?)?(?:past\\s+)?participle\\s+" + OF + "\\s*\\??$", "i")],
  ["gerund", new RegExp("^(?:what(?:'s| is)? (?:the )?)?(?:gerund|present\\s+participle|-ing\\s+form|ing\\s+form)\\s+" + OF + "\\s*\\??$", "i")],
  ["comparative", new RegExp("^(?:what(?:'s| is)? (?:the )?)?comparative\\s+(?:form\\s+)?" + OF + "\\s*\\??$", "i")],
  ["superlative", new RegExp("^(?:what(?:'s| is)? (?:the )?)?superlative\\s+(?:form\\s+)?" + OF + "\\s*\\??$", "i")],
];
export function parseInflect(input) {
  const t = String(input || "").trim();
  for (const [op, re] of FORMS) { const m = t.match(re); if (m) return { op, word: m[1].toLowerCase() }; }
  return null;
}

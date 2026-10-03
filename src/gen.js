// Compositional code generation. A request such as "python function that takes a list of
// numbers, keeps the even ones, squares them and returns the sum" is read into a small
// program plan (a source, a chain of stages, a result), and the plan is emitted for each
// language from its grammar tables. Nothing here is a stored snippet: the stage list, the
// variable names, the loop bodies and the function signature all come from the sentence.
//
// plan = { name, source: {kind, ...}, stages: [{op, arg?}], result: {op, arg?} | null, sink }
//   source.kind: "list" (elem "num" | "str"), "text" (a string), "range" (from, to), "number"
//   stages: filter / map operations over the collection, in order of application
//   result: a reduction (sum, count, max, ...) or null (the collection itself is returned)
//   sink: "return" (a function) | "print" (a script that prints)

const WORD_NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, fifty: 50, hundred: 100, thousand: 1000 };
const numOf = (s) => (s === undefined ? null : /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : WORD_NUM[s] !== undefined ? WORD_NUM[s] : null);
const K = String.raw`(-?\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|fifty|hundred|thousand)`;

// each rule: regex over the lowercase sentence -> stage or result. `on` says what it applies to.
const STAGE_RULES = [
  // filters over numbers
  { re: /\b(?:even|evens)\b/, op: "filter", arg: "even", on: "num" },
  { re: /\b(?:odd|odds)\b/, op: "filter", arg: "odd", on: "num" },
  { re: /\bpositive\b/, op: "filter", arg: "positive", on: "num" },
  { re: /\bnegative\b/, op: "filter", arg: "negative", on: "num" },
  { re: /\bprimes?\b/, op: "filter", arg: "prime", on: "num" },
  { re: new RegExp(String.raw`\b(?:greater|bigger|larger|more|higher) than ${K}\b|\babove ${K}\b|\bover ${K}\b`), op: "filter", arg: "gt", on: "num" },
  { re: new RegExp(String.raw`\b(?:less|smaller|lower|fewer) than ${K}\b|\bbelow ${K}\b|\bunder ${K}\b`), op: "filter", arg: "lt", on: "num" },
  { re: new RegExp(String.raw`\bdivisible by ${K}\b|\bmultiples? of ${K}\b`), op: "filter", arg: "div", on: "num" },
  { re: new RegExp(String.raw`\bnot divisible by ${K}\b`), op: "filter", arg: "ndiv", on: "num", before: "div" },
  { re: /\b(?:non-?empty|not empty)\b/, op: "filter", arg: "nonempty", on: "str" },
  { re: new RegExp(String.raw`\blonger than ${K} (?:characters|chars|letters)\b`), op: "filter", arg: "longer", on: "str" },
  { re: new RegExp(String.raw`\bshorter than ${K} (?:characters|chars|letters)\b`), op: "filter", arg: "shorter", on: "str" },
  { re: /\b(?:that )?(?:start|starts|starting|begin|begins|beginning) with (?:the letter |a |an )?"?([a-z0-9])"?\b/, op: "filter", arg: "starts", on: "str" },
  { re: /\b(?:that )?(?:end|ends|ending) with (?:the letter |a |an )?"?([a-z0-9])"?\b/, op: "filter", arg: "ends", on: "str" },
  { re: /\b(?:that )?(?:contain|contains|containing|including|with) (?:the (?:letter|substring|word) )?"([^"]+)"/, op: "filter", arg: "contains", on: "str" },
  { re: /\bvowels\b/, op: "filter", arg: "vowel", on: "char" },
  { re: /\bconsonants\b/, op: "filter", arg: "consonant", on: "char" },
  { re: /\b(?:digits|numeric characters)\b/, op: "filter", arg: "digit", on: "char" },
  { re: /\b(?:unique|distinct|dedupe|deduplicate|without duplicates|no duplicates|remove(?:s|d)? (?:the )?duplicates|duplicates removed)\b/, op: "unique" },
  // maps
  { re: /\b(?:square|squares|squared|squaring)\b/, op: "map", arg: "square", on: "num" },
  { re: /\b(?:cube|cubes|cubed|cubing)\b/, op: "map", arg: "cube", on: "num" },
  { re: /\b(?:double|doubles|doubled|doubling|twice)\b/, op: "map", arg: "double", on: "num" },
  { re: /\b(?:halve|halves|halved|halving|half of each)\b/, op: "map", arg: "half", on: "num" },
  { re: /\b(?:negate|negates|negated|negating)\b/, op: "map", arg: "negate", on: "num" },
  { re: /\babsolute values?\b/, op: "map", arg: "abs", on: "num" },
  { re: new RegExp(String.raw`\b(?:add|adds|adding|plus|increment(?:s|ed)? (?:each |every one )?by) ${K}\b(?! to (?:the )?(?:list|array|end))`), op: "map", arg: "add", on: "num" },
  { re: new RegExp(String.raw`\b(?:subtract|subtracts|subtracting|minus) ${K}\b`), op: "map", arg: "sub", on: "num" },
  { re: new RegExp(String.raw`\b(?:multipl(?:y|ies|ied|ying)(?: each| every one| them)? by|times) ${K}\b`), op: "map", arg: "mul", on: "num" },
  { re: new RegExp(String.raw`\bdivid(?:e|es|ed|ing)(?: each| every one| them)? by ${K}\b`), op: "map", arg: "divk", on: "num" },
  { re: /\b(?:upper ?case|uppercased|capital letters|capitalize each|in caps)\b/, op: "map", arg: "upper", on: "str" },
  { re: /\b(?:lower ?case|lowercased)\b/, op: "map", arg: "lower", on: "str" },
  { re: /\b(?:trim|trims|trimmed|strip|strips|stripped)\b/, op: "map", arg: "trim", on: "str" },
  { re: /\b(?:lengths?|how long each)\b/, op: "map", arg: "len", on: "str" },
  { re: /\breverse(?:s|d)? each\b|\beach (?:one |word |string )?reversed\b/, op: "map", arg: "reverse", on: "str" },
  // orderings
  { re: /\b(?:sort|sorts|sorted|sorting|order|ordered)\b(?:(?! descending| in descending| from (?:largest|biggest|highest)| reverse| backwards).)*$/, op: "sort", arg: "asc" },
  { re: /\b(?:sort|sorts|sorted|sorting|order|ordered)\b.*\b(?:descending|from (?:largest|biggest|highest)|in reverse|backwards)\b|\bdescending order\b/, op: "sort", arg: "desc", before: "sort-asc" },
  { re: /\b(?:reverse|reverses|reversed|reversing|backwards)\b(?! each)/, op: "reverse" },
  { re: new RegExp(String.raw`\b(?:first|top) ${K}\b`), op: "take", arg: "first" },
  { re: new RegExp(String.raw`\b(?:last|bottom) ${K}\b`), op: "take", arg: "last" },
];
const RESULT_RULES = [
  { re: /\b(?:sum|total|add(?:s|ed|ing)? (?:them |everything |all )?(?:up|together)|summed?|adds? up)\b/, op: "sum", on: "num" },
  { re: /\b(?:product|multipl(?:y|ies|ied) (?:them |everything |all )?together)\b/, op: "product", on: "num" },
  { re: /\b(?:average|mean)\b/, op: "average", on: "num" },
  { re: /\b(?:largest|biggest|maximum|max|highest|greatest)\b(?! (?:than|to))/, op: "max", on: "num" },
  { re: /\b(?:smallest|minimum|min|lowest|least)\b(?! (?:than|to))/, op: "min", on: "num" },
  { re: /\b(?:count|counts|counting|how many|number of|the number)\b/, op: "count" },
  { re: /\b(?:join|joins|joined|joining|concatenate|concatenated|concatenates|glue|glued)\b(?:.*?\b(?:with|by|using|on|separated by) (?:a |the )?(?:"([^"]*)"|(comma|space|newline|dash|hyphen|underscore|pipe|semicolon|colon|nothing)s?))?/, op: "join" },
  { re: /\b(?:longest)\b/, op: "longest", on: "str" },
  { re: /\b(?:shortest)\b/, op: "shortest", on: "str" },
  { re: /\bis (?:a )?palindrome\b|\bpalindromes?\b/, op: "palindrome", on: "text" },
  { re: /\b(?:all|every one|each one)\b.*\b(?:is|are)\b|\bwhether all\b/, op: "all", on: "pred" },
  { re: /\bany\b.*\b(?:is|are)\b|\bwhether any\b|\bif any\b/, op: "any", on: "pred" },
];
const NEGATE = /\b(?:filter(?:s|ed|ing)? out|remov(?:e|es|ed|ing)|delet(?:e|es|ed|ing)|drop(?:s|ped|ping)?|exclud(?:e|es|ed|ing)|without|except|but not|gets? rid of|getting rid of|discard(?:s|ed|ing)?|skip(?:s|ped|ping)?|ignor(?:e|es|ed|ing)|reject(?:s|ed|ing)?|strip(?:s|ped|ping)? out|throw(?:s|ing)? (?:out|away))(?: all)?(?: of)?(?: the| any)?(?: \w+)?\s*$/;
const SEP_WORDS = { comma: ", ", space: " ", newline: "\n", dash: "-", hyphen: "-", underscore: "_", pipe: "|", semicolon: ";", colon: ":", nothing: "" };

function detectSource(s) {
  let m;
  if (/\bstrings? (?:in|from|of) (?:a |an |the )?(?:list|array|collection|vector|slice)\b/.test(s)) return { kind: "list", elem: "str", name: "strings" };
  if (/\b(?:words?|characters?|letters?|vowels|consonants|digits) (?:in|of|from) (?:a |an |the |some |any )?(?:sentence|string|text|paragraph|line)\b/.test(s))
    return { kind: "text", elem: "char", name: /\bsentence\b/.test(s) ? "sentence" : "text" };
  if ((m = s.match(new RegExp(String.raw`\b(?:numbers?|integers?|values?|counting|count(?:ing)?) (?:from|between) ${K} (?:to|and|through|up to) ${K}\b|\bfrom ${K} (?:to|through|up to) ${K}\b|\b${K} (?:to|through) ${K}\b`))))
    { const a = numOf(m[1] || m[3] || m[5]), b = numOf(m[2] || m[4] || m[6]); if (a !== null && b !== null) return { kind: "range", from: a, to: b, elem: "num" }; }
  if (/\b(?:list|array|sequence|collection|vector|slice)s? of (?:\w+ )?(?:strings?|words?|names?|lines?|texts?)\b|\b(?:strings|words|names|lines)\b/.test(s) && !/\blist of (?:\w+ )?(?:numbers?|integers?|ints?|floats?)\b/.test(s))
    return { kind: "list", elem: "str", name: /\bwords?\b/.test(s) ? "words" : /\bnames?\b/.test(s) ? "names" : /\blines?\b/.test(s) ? "lines" : "strings" };
  if (/\b(?:list|array|sequence|collection|vector|slice)s? of (?:\w+ )?(?:numbers?|integers?|ints?|floats?|values?)\b|\b(?:numbers|integers|values)\b/.test(s))
    return { kind: "list", elem: "num", name: /\bintegers?\b/.test(s) ? "integers" : /\bvalues?\b/.test(s) ? "values" : "numbers" };
  if (/\b(?:characters?|chars?|letters?|vowels|consonants|digits)\b.*\b(?:in|of) (?:a |the )?(?:string|text|word|sentence)\b|\b(?:string|text|word|sentence)\b/.test(s))
    return { kind: "text", elem: "char", name: /\bsentence\b/.test(s) ? "sentence" : /\bword\b/.test(s) ? "word" : "text" };
  if (/\b(?:a |an |the )?(?:number|integer) n\b|\bgiven (?:a |an )?(?:number|integer)\b/.test(s)) return { kind: "number", elem: "num", name: "n" };
  return null;
}

// Read the sentence into a plan. Returns null when the sentence is not a request this
// generator can read completely: it never guesses at a stage it did not find.
export function plan(input) {
  const raw = String(input || "").trim();
  let s = raw.toLowerCase().replace(/[?!.]+$/, "").replace(/\s+/g, " ");
  const sink = /\b(?:print|prints|printing|display|displays|show|shows|output|outputs)\b/.test(s) && !/\bfunction\b|\bmethod\b|\bdef\b|\breturns?\b/.test(s) ? "print" : "return";
  s = s.replace(/\b(?:in|using|with) (?:python|javascript|js|typescript|ts|rust|go|golang|java|c#|c\+\+|c|ruby|php|kotlin|swift)\b/g, " ").replace(/\s+/g, " ").trim();
  const source = detectSource(s);
  if (!source) return null;
  // the body after "that/which/to" is where the stages live; the head names the source
  const body = s;
  const wordsOfText = source.kind === "text" && /\bwords?\b/.test(body);
  const elemFor = wordsOfText ? "str" : source.elem;
  const found = [];
  const seen = new Set();
  for (const r of STAGE_RULES) {
    const m = r.re.exec(body); if (!m) continue;
    if (r.on === "num" && elemFor !== "num" && !(source.kind === "text" && r.arg === "len")) continue;
    if (r.on === "str" && elemFor !== "str") continue;
    if (r.on === "char" && (source.kind !== "text" || wordsOfText)) continue;
    const key = r.op + ":" + (r.arg || "");
    if (seen.has(key)) continue;
    const arg = m.slice(1).find((g) => g !== undefined);
    // "filters out the negative numbers", "removes odd ones", "without the primes": keep the rest
    const neg = r.op === "filter" && NEGATE.test(body.slice(Math.max(0, m.index - 40), m.index));
    found.push({ op: r.op, arg: r.arg, not: neg || undefined, k: arg !== undefined ? (numOf(arg) !== null ? numOf(arg) : arg) : undefined, at: m.index, rule: r });
    seen.add(key);
  }
  // "not divisible by" wins over "divisible by"; "sort descending" wins over "sort"
  const drop = new Set(found.filter((f) => f.rule.before).map((f) => f.rule.before));
  let stages = found.filter((f) => !(f.op === "filter" && f.arg === "div" && drop.has("div")) && !(f.op === "sort" && f.arg === "asc" && drop.has("sort-asc")));
  let result = null;
  for (const r of RESULT_RULES) {
    const m = r.re.exec(body); if (!m) continue;
    if (r.on === "num" && source.elem !== "num" && !stages.some((t) => t.arg === "len")) continue;
    if (r.on === "str" && elemFor !== "str") continue;
    if (r.on === "text" && source.kind !== "text") continue;
    if (r.on === "pred") continue; // all/any need a predicate stage; handled below
    result = { op: r.op, at: m.index, sep: r.op === "join" ? (m[1] !== undefined ? m[1] : m[2] ? SEP_WORDS[m[2]] : ", ") : undefined };
    break;
  }
  // "the sum of the squares of the even numbers": noun chains read inside-out
  const nounChain = /\b(?:sum|total|product|average|mean|count|number|largest|smallest|max|min|maximum|minimum) of\b/.test(body) && !/\bthen\b/.test(body);
  stages.sort((a, b) => (nounChain ? b.at - a.at : a.at - b.at));
  if (wordsOfText) stages.unshift({ op: "words" });
  // "count the vowels" over a string is a filter then a count; "reverse a string" alone is a stage with no reduction
  if (source.kind === "text" && !stages.length && !result) {
    if (/\breverse/.test(body)) stages.push({ op: "reverse" });
    else if (/\bupper ?case\b/.test(body)) stages.push({ op: "map", arg: "upper" });
    else if (/\blower ?case\b/.test(body)) stages.push({ op: "map", arg: "lower" });
    else if (/\b(?:count|number of|how many) (?:the )?(?:words)\b/.test(body)) { stages.push({ op: "words" }); result = { op: "count" }; }
    else if (/\bpalindrome\b/.test(body)) result = { op: "palindrome" };
    else return null;
  }
  if (source.kind === "text" && result && result.op === "count" && stages.some((t) => t.op === "filter")) { /* count of filtered characters */ }
  if (source.kind === "text" && result && result.op === "palindrome") stages = stages.filter((t) => t.op !== "reverse");
  if (source.kind === "number") return null; // single-number functions belong to the expression synthesizer
  if (!stages.length && !result) return null;
  // a plan must account for every "verb" word in the sentence; unknown verbs mean an unread request
  const VERBS = /\b(?:shuffle|randomi[sz]e|rotate|flatten|zip|chunk|group|partition|split|encrypt|hash|encode|decode|download|upload|fetch|request|parse|render|draw|animate|schedule|thread|async|await|database|sql|regex|validate|email)\b/;
  if (VERBS.test(body)) return null;
  const name = sink === "print" ? "print_" + nameFor(source, stages, result).replace(/_?values$/, "") : nameFor(source, stages, result);
  return { name, source, stages: stages.map(({ op, arg, k, not }) => (not ? { op, arg, k, not } : { op, arg, k })), result: result ? { op: result.op, sep: result.sep } : null, sink, raw };
}

function nameFor(source, stages, result) {
  const parts = [];
  if (result && (result.op === "longest" || result.op === "shortest") && stages.every((t) => t.op === "words")) return result.op + "_word";
  if (result) parts.push({ sum: "sum_of", product: "product_of", average: "average_of", max: "largest", min: "smallest", count: "count", join: "join", longest: "longest", shortest: "shortest", palindrome: "is_palindrome" }[result.op]);
  for (const t of stages) {
    if (t.op === "filter") parts.push((t.not ? "non_" : "") + { even: "even", odd: "odd", positive: "positive", negative: "negative", prime: "prime", gt: "large", lt: "small", div: "multiples", ndiv: "non_multiples", nonempty: "nonempty", longer: "long", shorter: "short", starts: "starting", ends: "ending", contains: "matching", vowel: "vowels", consonant: "consonants", digit: "digits" }[t.arg]);
    else if (t.op === "map") parts.push({ square: "squares", cube: "cubes", double: "doubled", half: "halved", negate: "negated", abs: "abs", add: "shifted", sub: "shifted", mul: "scaled", divk: "scaled", upper: "upper", lower: "lower", trim: "trimmed", len: "lengths", reverse: "reversed" }[t.arg]);
    else parts.push({ unique: "unique", sort: "sorted", reverse: "reversed", take: t.arg, words: "words" }[t.op]);
  }
  if (!result && !stages.some((t) => t.op === "map" || t.op === "filter")) parts.push(source.name || "values");
  else if (!result && !stages.some((t) => t.op === "map")) parts.push(source.name || "values");
  return parts.filter(Boolean).join("_").replace(/_+/g, "_");
}

// ---------------------------------------------------------------- emission
const isPrimeFn = {
  python: "def is_prime(n):\n    if n < 2:\n        return False\n    d = 2\n    while d * d <= n:\n        if n % d == 0:\n            return False\n        d += 1\n    return True\n\n",
  javascript: "function isPrime(n) {\n  if (n < 2) return false;\n  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;\n  return true;\n}\n\n",
  typescript: "function isPrime(n: number): boolean {\n  if (n < 2) return false;\n  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;\n  return true;\n}\n\n",
  go: "func isPrime(n int) bool {\n\tif n < 2 {\n\t\treturn false\n\t}\n\tfor d := 2; d*d <= n; d++ {\n\t\tif n%d == 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\n",
  rust: "fn is_prime(n: i64) -> bool {\n    if n < 2 {\n        return false;\n    }\n    let mut d = 2;\n    while d * d <= n {\n        if n % d == 0 {\n            return false;\n        }\n        d += 1;\n    }\n    true\n}\n\n",
  java: "    static boolean isPrime(long n) {\n        if (n < 2) return false;\n        for (long d = 2; d * d <= n; d++) if (n % d == 0) return false;\n        return true;\n    }\n\n",
};

// the predicate / transform for one element, per language (x is the element)
function pred(t, lang, elem) {
  // a negated simple test is written as its opposite ("not negative" is x >= 0)
  const INV = { even: "odd", odd: "even", div: "ndiv", ndiv: "div" };
  if (t.not && INV[t.arg]) return predBase({ ...t, arg: INV[t.arg], not: false }, lang, elem);
  if (t.not && /^(?:positive|negative|gt|lt)$/.test(t.arg)) {
    const k = t.arg === "positive" || t.arg === "negative" ? 0 : t.k;
    return t.arg === "positive" || t.arg === "gt" ? `x <= ${k}` : `x >= ${k}`;
  }
  const p = predBase(t, lang, elem);
  if (!t.not || p === null) return p;
  return lang === "python" ? `not (${p})` : `!(${p})`;
}
function predBase(t, lang, elem) {
  const eq = lang === "javascript" || lang === "typescript" ? "===" : "==";
  const neq = lang === "javascript" || lang === "typescript" ? "!==" : "!=";
  const k = t.k;
  const str = (v) => JSON.stringify(String(v));
  switch (t.arg) {
    case "even": return `x % 2 ${eq} 0`;
    case "odd": return `x % 2 ${neq} 0`;
    case "positive": return "x > 0";
    case "negative": return "x < 0";
    case "prime": return { python: "is_prime(x)", go: "isPrime(x)", rust: "is_prime(x)", java: "isPrime(x)" }[lang] || "isPrime(x)";
    case "gt": return `x > ${k}`;
    case "lt": return `x < ${k}`;
    case "div": return `x % ${k} ${eq} 0`;
    case "ndiv": return `x % ${k} ${neq} 0`;
    case "nonempty": return { python: "x != \"\"", javascript: "x !== \"\"", typescript: "x !== \"\"", go: "x != \"\"", rust: "!x.is_empty()", java: "!x.isEmpty()" }[lang];
    case "longer": return { python: `len(x) > ${k}`, javascript: `x.length > ${k}`, typescript: `x.length > ${k}`, go: `len(x) > ${k}`, rust: `x.chars().count() > ${k}`, java: `x.length() > ${k}` }[lang];
    case "shorter": return { python: `len(x) < ${k}`, javascript: `x.length < ${k}`, typescript: `x.length < ${k}`, go: `len(x) < ${k}`, rust: `x.chars().count() < ${k}`, java: `x.length() < ${k}` }[lang];
    case "starts": return { python: `x.startswith(${str(k)})`, javascript: `x.startsWith(${str(k)})`, typescript: `x.startsWith(${str(k)})`, go: `strings.HasPrefix(x, ${str(k)})`, rust: `x.starts_with(${str(k)})`, java: `x.startsWith(${str(k)})` }[lang];
    case "ends": return { python: `x.endswith(${str(k)})`, javascript: `x.endsWith(${str(k)})`, typescript: `x.endsWith(${str(k)})`, go: `strings.HasSuffix(x, ${str(k)})`, rust: `x.ends_with(${str(k)})`, java: `x.endsWith(${str(k)})` }[lang];
    case "contains": return { python: `${str(k)} in x`, javascript: `x.includes(${str(k)})`, typescript: `x.includes(${str(k)})`, go: `strings.Contains(x, ${str(k)})`, rust: `x.contains(${str(k)})`, java: `x.contains(${str(k)})` }[lang];
    case "vowel": return { python: `x in "aeiouAEIOU"`, javascript: `"aeiouAEIOU".includes(x)`, typescript: `"aeiouAEIOU".includes(x)`, go: `strings.ContainsRune("aeiouAEIOU", x)`, rust: `"aeiouAEIOU".contains(x)`, java: `"aeiouAEIOU".indexOf(x) >= 0` }[lang];
    case "consonant": return { python: `x.isalpha() and x not in "aeiouAEIOU"`, javascript: `/[a-z]/i.test(x) && !"aeiouAEIOU".includes(x)`, typescript: `/[a-z]/i.test(x) && !"aeiouAEIOU".includes(x)`, go: `unicode.IsLetter(x) && !strings.ContainsRune("aeiouAEIOU", x)`, rust: `x.is_alphabetic() && !"aeiouAEIOU".contains(x)`, java: `Character.isLetter(x) && "aeiouAEIOU".indexOf(x) < 0` }[lang];
    case "digit": return { python: "x.isdigit()", javascript: `x >= "0" && x <= "9"`, typescript: `x >= "0" && x <= "9"`, go: "unicode.IsDigit(x)", rust: "x.is_ascii_digit()", java: "Character.isDigit(x)" }[lang];
  }
  return null;
}
function xform(t, lang, elem) {
  const k = t.k;
  switch (t.arg) {
    case "square": return "x * x";
    case "cube": return "x * x * x";
    case "double": return "x * 2";
    case "half": return lang === "python" || lang === "javascript" || lang === "typescript" ? "x / 2" : lang === "go" ? "float64(x) / 2" : lang === "rust" ? "x as f64 / 2.0" : "x / 2.0";
    case "negate": return "-x";
    case "abs": return { python: "abs(x)", javascript: "Math.abs(x)", typescript: "Math.abs(x)", go: "abs(x)", rust: "x.abs()", java: "Math.abs(x)" }[lang];
    case "add": return `x + ${k}`;
    case "sub": return `x - ${k}`;
    case "mul": return `x * ${k}`;
    case "divk": return lang === "python" || lang === "javascript" || lang === "typescript" ? `x / ${k}` : lang === "go" ? `float64(x) / ${k}` : lang === "rust" ? `x as f64 / ${k}.0` : `x / ${k}.0`;
    case "upper": return { python: "x.upper()", javascript: "x.toUpperCase()", typescript: "x.toUpperCase()", go: "strings.ToUpper(x)", rust: "x.to_uppercase()", java: "x.toUpperCase()" }[lang];
    case "lower": return { python: "x.lower()", javascript: "x.toLowerCase()", typescript: "x.toLowerCase()", go: "strings.ToLower(x)", rust: "x.to_lowercase()", java: "x.toLowerCase()" }[lang];
    case "trim": return { python: "x.strip()", javascript: "x.trim()", typescript: "x.trim()", go: "strings.TrimSpace(x)", rust: "x.trim().to_string()", java: "x.trim()" }[lang];
    case "len": return { python: "len(x)", javascript: "x.length", typescript: "x.length", go: "len(x)", rust: "x.chars().count() as i64", java: "x.length()" }[lang];
    case "reverse": return { python: "x[::-1]", javascript: "[...x].reverse().join(\"\")", typescript: "[...x].reverse().join(\"\")", go: "reverseString(x)", rust: "x.chars().rev().collect::<String>()", java: "new StringBuilder(x).reverse().toString()" }[lang];
  }
  return null;
}
// element type after a stage
function elemAfter(elem, t) {
  if (t.op === "map") { if (t.arg === "len") return "num"; if (t.arg === "half" || t.arg === "divk") return "float"; }
  return elem;
}
const isFloatOut = (p) => p.stages.some((t) => t.op === "map" && (t.arg === "half" || t.arg === "divk")) || (p.result && p.result.op === "average");

// idiomatic Python: one comprehension per stage, builtins for the reduction
function emitPython(p) {
  const L = [], src = p.source, par = src.kind === "range" ? [] : [src.name];
  let cur = src.kind === "range" ? `range(${src.from}, ${src.to + 1})` : src.name, elem = src.elem;
  const usesPrime = p.stages.some((t) => t.arg === "prime");
  const body = [];
  let n = 0;
  for (const t of p.stages) {
    n++;
    const v = stageName(t, n);
    if (t.op === "filter") body.push(`${v} = [x for x in ${cur} if ${pred(t, "python", elem)}]`);
    else if (t.op === "map") body.push(`${v} = [${xform(t, "python", elem)} for x in ${cur}]`);
    else if (t.op === "unique") body.push(`${v} = list(dict.fromkeys(${cur}))  # keeps the first occurrence, in order`);
    else if (t.op === "sort") body.push(`${v} = sorted(${cur}${t.arg === "desc" ? ", reverse=True" : ""})`);
    else if (t.op === "reverse") body.push(src.kind === "text" && n === 1 ? `${v} = ${cur}[::-1]` : `${v} = list(reversed(${cur}))`);
    else if (t.op === "take") body.push(`${v} = ${cur}[${t.arg === "first" ? `:${t.k}` : `-${t.k}:`}]`);
    else if (t.op === "words") body.push(`${v} = ${cur}.split()`);
    cur = v; elem = elemAfter(elem, t);
  }
  let ret = cur;
  if (p.result) {
    const r = p.result.op;
    ret = r === "sum" ? `sum(${cur})` : r === "product" ? `math.prod(${cur})` : r === "average" ? `sum(${cur}) / len(${cur})` : r === "max" ? `max(${cur})` : r === "min" ? `min(${cur})` : r === "count" ? `len(${cur})`
      : r === "join" ? `${JSON.stringify(p.result.sep)}.join(${src.kind === "text" ? cur : elem === "str" ? cur : `str(x) for x in ${cur}`})` : r === "longest" ? `max(${cur}, key=len)` : r === "shortest" ? `min(${cur}, key=len)` : r === "palindrome" ? `${cur} == ${cur}[::-1]` : cur;
    if (r === "join" && elem !== "str" && src.kind !== "text") ret = `${JSON.stringify(p.result.sep)}.join(str(x) for x in ${cur})`;
    if (r === "join" && src.kind === "text") ret = `"".join(${cur})`;
  } else if (src.kind === "text" && elem === "char" && p.stages.some((t) => t.op === "filter" || (t.op === "map" && t.arg !== "len"))) ret = `"".join(${cur})`;
  const head = (usesPrime ? isPrimeFn.python : "") + (p.result && p.result.op === "product" ? "import math\n\n" : "");
  if (p.sink === "print") return head + body.join("\n") + (body.length ? "\n" : "") + `print(${ret})\n`;
  return head + `def ${p.name}(${par.join(", ")}):\n` + body.map((b) => "    " + b).join("\n") + (body.length ? "\n" : "") + `    return ${ret}\n`;
}
function stageName(t, n) {
  const base = t.op === "filter" && t.not ? "kept" : t.op === "filter" ? { even: "evens", odd: "odds", positive: "positives", negative: "negatives", prime: "primes", gt: "large", lt: "small", div: "multiples", ndiv: "rest", nonempty: "nonempty", longer: "long_ones", shorter: "short_ones", starts: "matching", ends: "matching", contains: "matching", vowel: "vowels", consonant: "consonants", digit: "digits" }[t.arg]
    : t.op === "map" ? { square: "squares", cube: "cubes", double: "doubled", half: "halved", negate: "negated", abs: "magnitudes", add: "shifted", sub: "shifted", mul: "scaled", divk: "scaled", upper: "upper", lower: "lower", trim: "trimmed", len: "lengths", reverse: "reversed_items" }[t.arg]
    : { unique: "unique", sort: "ordered", reverse: "reversed_values", take: t.arg === "first" ? "head" : "tail", words: "words" }[t.op];
  return base || `step${n}`;
}
const camel = (s) => s.replace(/_(\w)/g, (_, c) => c.toUpperCase());

// idiomatic JavaScript / TypeScript: array methods, one line per stage
function emitJs(p, ts) {
  const src = p.source, usesPrime = p.stages.some((t) => t.arg === "prime");
  let elem = src.elem;
  const tsT = (e) => (e === "str" || e === "char" ? "string" : "number");
  const par = src.kind === "range" ? "" : `${camel(src.name)}${ts ? (src.kind === "text" ? ": string" : `: ${tsT(src.elem)}[]`) : ""}`;
  const body = [];
  let cur = src.kind === "range" ? `Array.from({ length: ${src.to - src.from + 1} }, (_, i) => i + ${src.from})` : src.kind === "text" ? `[...${camel(src.name)}]` : camel(src.name);
  const spreadText = src.kind === "text" && cur !== camel(src.name);
  if (src.kind === "text" && !p.stages.some((t) => t.op === "filter" || t.op === "reverse" || t.op === "unique") && !(p.result && p.result.op === "palindrome")) cur = camel(src.name);
  let n = 0;
  for (const t of p.stages) {
    n++;
    const v = camel(stageName(t, n));
    if (t.op === "filter") body.push(`const ${v} = ${cur}.filter((x) => ${pred(t, "javascript", elem)});`);
    else if (t.op === "map") body.push(src.kind === "text" && cur === camel(src.name) ? `const ${v} = ${xform(t, "javascript", elem).replace(/\bx\b/g, cur)};` : `const ${v} = ${cur}.map((x) => ${xform(t, "javascript", elem)});`);
    else if (t.op === "unique") body.push(`const ${v} = [...new Set(${cur})];`);
    else if (t.op === "sort") body.push(elem === "num" || elem === "float" ? `const ${v} = [...${cur}].sort((a, b) => ${t.arg === "desc" ? "b - a" : "a - b"});` : `const ${v} = [...${cur}].sort(${t.arg === "desc" ? "(a, b) => b.localeCompare(a)" : ""});`);
    else if (t.op === "reverse") body.push(`const ${v} = ${spreadText && n === 1 ? cur : `[...${cur}]`}.reverse();`);
    else if (t.op === "take") body.push(`const ${v} = ${cur}.slice(${t.arg === "first" ? `0, ${t.k}` : `-${t.k}`});`);
    else if (t.op === "words") body.push(`const ${v} = ${cur}.trim().split(/\\s+/);`);
    cur = v; elem = elemAfter(elem, t);
  }
  let ret = cur, retT = ts ? `${tsT(elem)}[]` : "";
  if (p.result) {
    const r = p.result.op;
    ret = r === "sum" ? `${cur}.reduce((a, b) => a + b, 0)` : r === "product" ? `${cur}.reduce((a, b) => a * b, 1)` : r === "average" ? `${cur}.reduce((a, b) => a + b, 0) / ${cur}.length` : r === "max" ? `Math.max(...${cur})` : r === "min" ? `Math.min(...${cur})` : r === "count" ? `${cur}.length`
      : r === "join" ? `${cur}.join(${JSON.stringify(src.kind === "text" ? "" : p.result.sep)})` : r === "longest" ? `${cur}.reduce((a, b) => (b.length > a.length ? b : a))` : r === "shortest" ? `${cur}.reduce((a, b) => (b.length < a.length ? b : a))` : r === "palindrome" ? `${cur}.join("") === ${cur}.slice().reverse().join("")` : cur;
    retT = ts ? (r === "join" ? "string" : r === "palindrome" ? "boolean" : r === "longest" || r === "shortest" ? "string" : "number") : "";
  } else if (src.kind === "text" && elem === "char" && cur !== camel(src.name)) { ret = `${cur}.join("")`; retT = ts ? "string" : ""; }
  else if (src.kind === "text" && cur !== camel(src.name) && p.stages.every((t) => t.op === "map")) retT = ts ? "string" : "";
  const head = usesPrime ? (ts ? isPrimeFn.typescript : isPrimeFn.javascript) : "";
  if (p.sink === "print") return head + body.join("\n") + (body.length ? "\n" : "") + `console.log(${ret});\n`;
  return head + `function ${camel(p.name)}(${par})${ts ? `: ${retT}` : ""} {\n` + body.map((b) => "  " + b).join("\n") + (body.length ? "\n" : "") + `  return ${ret};\n}\n`;
}

// explicit loops for Go, Rust and Java: every stage is a loop that builds the next slice
function emitLoops(p, lang) {
  // a Go parameter must not shadow an imported package
  const src = lang === "go" && /^(?:strings|sort|fmt|unicode)$/.test(p.source.name || "") ? { ...p.source, name: "items" } : p.source;
  const usesPrime = p.stages.some((t) => t.arg === "prime");
  const needsStrings = p.stages.some((t) => ["upper", "lower", "trim", "starts", "ends", "contains", "vowel", "consonant"].includes(t.arg)) || (p.result && p.result.op === "join") || p.stages.some((t) => t.op === "words");
  const needsUnicode = p.stages.some((t) => ["consonant", "digit"].includes(t.arg));
  const needsSort = p.stages.some((t) => t.op === "sort");
  let elem = src.elem;
  const T = {
    go: (e) => (e === "num" ? "int" : e === "float" ? "float64" : e === "char" ? "rune" : "string"),
    rust: (e) => (e === "num" ? "i64" : e === "float" ? "f64" : e === "char" ? "char" : "String"),
    java: (e) => (e === "num" ? "Integer" : e === "float" ? "Double" : e === "char" ? "Character" : "String"),
  }[lang];
  const ind = lang === "go" ? "\t" : "    ";
  const list = (e) => (lang === "go" ? `[]${T(e)}` : lang === "rust" ? `Vec<${T(e)}>` : `List<${T(e)}>`);
  const body = [];
  let cur;
  const par = [];
  if (src.kind === "range") {
    cur = "values";
    if (lang === "go") body.push(`values := []int{}`, `for i := ${src.from}; i <= ${src.to}; i++ {`, `${ind}values = append(values, i)`, `}`);
    else if (lang === "rust") body.push(`let values: Vec<i64> = (${src.from}..=${src.to}).collect();`);
    else body.push(`List<Integer> values = new ArrayList<>();`, `for (int i = ${src.from}; i <= ${src.to}; i++) values.add(i);`);
  } else if (src.kind === "text") {
    cur = src.name;
    par.push(lang === "go" ? `${src.name} string` : lang === "rust" ? `${src.name}: &str` : `String ${src.name}`);
    const charsOnly = p.stages.some((t) => t.op === "filter" || t.op === "reverse" || t.op === "unique") || (p.result && p.result.op === "palindrome");
    if (charsOnly) {
      cur = "chars";
      if (lang === "go") body.push(`chars := []rune(${src.name})`);
      else if (lang === "rust") body.push(`let chars: Vec<char> = ${src.name}.chars().collect();`);
      else body.push(`List<Character> chars = new ArrayList<>();`, `for (char c : ${src.name}.toCharArray()) chars.add(c);`);
    }
  } else {
    cur = src.name;
    par.push(lang === "go" ? `${src.name} ${list(src.elem)}` : lang === "rust" ? `${src.name}: &[${T(src.elem)}]` : `${list(src.elem)} ${src.name}`);
  }
  let n = 0;
  for (const t of p.stages) {
    n++;
    const v = lang === "rust" ? stageName(t, n) : camel(stageName(t, n));
    const next = elemAfter(elem, t);
    const whole = src.kind === "text" && cur === src.name; // a string-level map ("uppercase the text")
    if (t.op === "filter") {
      const c = pred(t, lang, elem);
      if (lang === "go") body.push(`${v} := ${list(elem)}{}`, `for _, x := range ${cur} {`, `${ind}if ${c} {`, `${ind}${ind}${v} = append(${v}, x)`, `${ind}}`, `}`);
      else if (lang === "rust") body.push(`let ${v}: ${list(elem)} = ${cur}.iter().cloned().filter(|&x| ${c.replace(/\bx\b/g, "x")}).collect();`.replace("|&x|", elem === "str" ? "|x|" : "|&x|").replace(/cloned\(\)\.filter\(\|x\|/, "cloned().filter(|x|"));
      else body.push(`${list(elem)} ${v} = new ArrayList<>();`, `for (${T(elem)} x : ${cur}) if (${c}) ${v}.add(x);`);
    } else if (t.op === "map") {
      const f = xform(t, lang, elem);
      if (whole) { if (lang === "go") body.push(`${v} := ${f.replace(/\bx\b/g, cur)}`); else if (lang === "rust") body.push(`let ${v} = ${f.replace(/\bx\b/g, cur)};`); else body.push(`String ${v} = ${f.replace(/\bx\b/g, cur)};`); }
      else if (lang === "go") body.push(`${v} := ${list(next)}{}`, `for _, x := range ${cur} {`, `${ind}${v} = append(${v}, ${f})`, `}`);
      else if (lang === "rust") body.push(`let ${v}: ${list(next)} = ${cur}.iter().map(|&x| ${f}).collect();`.replace("|&x|", elem === "str" || elem === "char" ? "|x|" : "|&x|"));
      else body.push(`${list(next)} ${v} = new ArrayList<>();`, `for (${T(elem)} x : ${cur}) ${v}.add(${f});`);
    } else if (t.op === "unique") {
      if (lang === "go") body.push(`${v} := ${list(elem)}{}`, `seen := map[${T(elem)}]bool{}`, `for _, x := range ${cur} {`, `${ind}if !seen[x] {`, `${ind}${ind}seen[x] = true`, `${ind}${ind}${v} = append(${v}, x)`, `${ind}}`, `}`);
      else if (lang === "rust") body.push(`let mut seen = std::collections::HashSet::new();`, `let ${v}: ${list(elem)} = ${cur}.iter().cloned().filter(|x| seen.insert(x.clone())).collect();`);
      else body.push(`${list(elem)} ${v} = new ArrayList<>(new LinkedHashSet<>(${cur}));`);
    } else if (t.op === "sort") {
      if (lang === "go") body.push(`${v} := append(${list(elem)}{}, ${cur}...)`, `sort.Slice(${v}, func(i, j int) bool { return ${v}[i] ${t.arg === "desc" ? ">" : "<"} ${v}[j] })`);
      else if (lang === "rust") { body.push(`let mut ${v} = ${cur}.to_vec();`, elem === "float" ? `${v}.sort_by(|a, b| ${t.arg === "desc" ? "b.partial_cmp(a)" : "a.partial_cmp(b)"}.unwrap());` : `${v}.sort();`); if (t.arg === "desc" && elem !== "float") body.push(`${v}.reverse();`); }
      else body.push(`${list(elem)} ${v} = new ArrayList<>(${cur});`, t.arg === "desc" ? `${v}.sort(Collections.reverseOrder());` : `Collections.sort(${v});`);
    } else if (t.op === "reverse") {
      if (lang === "go") body.push(`${v} := ${list(elem)}{}`, `for i := len(${cur}) - 1; i >= 0; i-- {`, `${ind}${v} = append(${v}, ${cur}[i])`, `}`);
      else if (lang === "rust") body.push(`let ${v}: ${list(elem)} = ${cur}.iter().cloned().rev().collect();`);
      else body.push(`${list(elem)} ${v} = new ArrayList<>(${cur});`, `Collections.reverse(${v});`);
    } else if (t.op === "take") {
      const k = t.k;
      if (lang === "go") body.push(t.arg === "first" ? `${v} := ${cur}[:min(${k}, len(${cur}))]` : `${v} := ${cur}[max(0, len(${cur})-${k}):]`);
      else if (lang === "rust") body.push(t.arg === "first" ? `let ${v}: ${list(elem)} = ${cur}.iter().cloned().take(${k}).collect();` : `let ${v}: ${list(elem)} = ${cur}.iter().cloned().skip(${cur}.len().saturating_sub(${k})).collect();`);
      else body.push(t.arg === "first" ? `${list(elem)} ${v} = ${cur}.subList(0, Math.min(${k}, ${cur}.size()));` : `${list(elem)} ${v} = ${cur}.subList(Math.max(0, ${cur}.size() - ${k}), ${cur}.size());`);
    } else if (t.op === "words") {
      if (lang === "go") body.push(`${v} := strings.Fields(${cur})`);
      else if (lang === "rust") body.push(`let ${v}: Vec<String> = ${cur}.split_whitespace().map(|w| w.to_string()).collect();`);
      else body.push(`List<String> ${v} = new ArrayList<>(Arrays.asList(${cur}.trim().split("\\\\s+")));`);
      elem = "str"; cur = v; continue;
    }
    cur = v; elem = next;
  }
  let ret = cur, retT = list(elem);
  const r = p.result && p.result.op;
  const whole = src.kind === "text" && !p.stages.some((t) => t.op === "filter" || t.op === "reverse" || t.op === "unique" || t.op === "words") && !(r === "palindrome");
  if (r) {
    const numT = elem === "float" || r === "average" ? (lang === "go" ? "float64" : lang === "rust" ? "f64" : "double") : (lang === "go" ? "int" : lang === "rust" ? "i64" : "int");
    const cast = (x) => (elem === "float" || r !== "average" ? x : lang === "go" ? `float64(${x})` : lang === "rust" ? `${x} as f64` : `(double) ${x}`);
    if (r === "sum" || r === "product" || r === "average") {
      const init = r === "product" ? "1" : "0", op = r === "product" ? "*" : "+";
      if (lang === "go") body.push(`total := ${numT}(${init})`, `for _, x := range ${cur} {`, `${ind}total ${op}= ${cast("x")}`, `}`);
      else if (lang === "rust") body.push(`let mut total: ${numT} = ${init}${numT === "f64" ? ".0" : ""};`, `for &x in &${cur} {`, `${ind}total ${op}= ${cast("x")};`, `}`);
      else body.push(`${numT} total = ${init};`, `for (${T(elem)} x : ${cur}) total ${op}= ${cast("x")};`);
      ret = r === "average" ? (lang === "go" ? `total / float64(len(${cur}))` : lang === "rust" ? `total / ${cur}.len() as f64` : `total / ${cur}.size()`) : "total"; retT = numT;
    } else if (r === "max" || r === "min") {
      const cmp = r === "max" ? ">" : "<";
      if (lang === "go") body.push(`best := ${cur}[0]`, `for _, x := range ${cur}[1:] {`, `${ind}if x ${cmp} best {`, `${ind}${ind}best = x`, `${ind}}`, `}`);
      else if (lang === "rust") body.push(`let mut best = ${cur}[0];`, `for &x in &${cur}[1..] {`, `${ind}if x ${cmp} best {`, `${ind}${ind}best = x;`, `${ind}}`, `}`);
      else body.push(`${T(elem)} best = ${cur}.get(0);`, `for (${T(elem)} x : ${cur}) if (x ${cmp} best) best = x;`);
      ret = "best"; retT = T(elem);
    } else if (r === "count") { ret = lang === "go" ? `len(${cur})` : lang === "rust" ? `${cur}.len()` : `${cur}.size()`; retT = lang === "go" ? "int" : lang === "rust" ? "usize" : "int"; }
    else if (r === "join") {
      const sep = JSON.stringify(src.kind === "text" ? "" : p.result.sep);
      if (lang === "go") { if (src.kind === "text") { ret = `string(${cur})`; } else if (elem === "str") ret = `strings.Join(${cur}, ${sep})`; else { body.push(`parts := []string{}`, `for _, x := range ${cur} {`, `${ind}parts = append(parts, fmt.Sprint(x))`, `}`); ret = `strings.Join(parts, ${sep})`; } retT = "string"; }
      else if (lang === "rust") { ret = src.kind === "text" ? `${cur}.iter().collect::<String>()` : `${cur}.iter().map(|x| x.to_string()).collect::<Vec<_>>().join(${sep})`; retT = "String"; }
      else { ret = src.kind === "text" ? `${cur}.stream().map(String::valueOf).collect(Collectors.joining(""))` : `${cur}.stream().map(String::valueOf).collect(Collectors.joining(${sep}))`; retT = "String"; }
    } else if (r === "longest" || r === "shortest") {
      const cmp = r === "longest" ? ">" : "<";
      if (lang === "go") body.push(`best := ${cur}[0]`, `for _, x := range ${cur}[1:] {`, `${ind}if len(x) ${cmp} len(best) {`, `${ind}${ind}best = x`, `${ind}}`, `}`);
      else if (lang === "rust") body.push(`let mut best = ${cur}[0].clone();`, `for x in &${cur}[1..] {`, `${ind}if x.chars().count() ${cmp} best.chars().count() {`, `${ind}${ind}best = x.clone();`, `${ind}}`, `}`);
      else body.push(`String best = ${cur}.get(0);`, `for (String x : ${cur}) if (x.length() ${cmp} best.length()) best = x;`);
      ret = "best"; retT = T("str");
    } else if (r === "palindrome") {
      if (lang === "go") body.push(`for i, j := 0, len(${cur})-1; i < j; i, j = i+1, j-1 {`, `${ind}if ${cur}[i] != ${cur}[j] {`, `${ind}${ind}return false`, `${ind}}`, `}`);
      else if (lang === "rust") body.push(`let n = ${cur}.len();`, `for i in 0..n / 2 {`, `${ind}if ${cur}[i] != ${cur}[n - 1 - i] {`, `${ind}${ind}return false;`, `${ind}}`, `}`);
      else body.push(`for (int i = 0, j = ${cur}.size() - 1; i < j; i++, j--) if (!${cur}.get(i).equals(${cur}.get(j))) return false;`);
      ret = "true"; retT = lang === "go" ? "bool" : lang === "rust" ? "bool" : "boolean";
    }
  } else if (src.kind === "text" && !whole) {
    ret = lang === "go" ? `string(${cur})` : lang === "rust" ? `${cur}.iter().collect::<String>()` : `${cur}.stream().map(String::valueOf).collect(Collectors.joining(""))`; retT = T("str");
  } else if (whole) retT = T("str");
  if (lang === "rust" && retT === "Vec<String>" && !p.stages.length) retT = "Vec<String>";
  const imports = [];
  if (lang === "go") { if (needsStrings || (r === "join" && src.kind !== "text")) imports.push("strings"); if (r === "join" && elem !== "str" && src.kind !== "text") imports.push("fmt"); if (needsUnicode) imports.push("unicode"); if (needsSort) imports.push("sort"); }
  if (lang === "java") { imports.push("java.util.*"); if (r === "join" || (src.kind === "text" && !whole && !r)) imports.push("java.util.stream.Collectors"); }
  const name = lang === "java" || lang === "go" ? camel(p.name) : p.name;
  const helpers = usesPrime ? isPrimeFn[lang] : "";
  if (p.sink === "print") {
    if (lang === "go") return (imports.length || true ? `import (\n${["fmt", ...imports.filter((i) => i !== "fmt")].map((i) => `\t"${i}"`).join("\n")}\n)\n\n` : "") + helpers + `func main() {\n` + body.map((b) => ind + b).join("\n") + `\n${ind}fmt.Println(${ret})\n}\n`;
    if (lang === "rust") return helpers + `fn main() {\n` + body.map((b) => ind + b).join("\n") + `\n${ind}println!("{:?}", ${ret});\n}\n`;
    return imports.map((i) => `import ${i};`).join("\n") + `\n\npublic class Main {\n` + helpers + `    public static void main(String[] args) {\n` + body.map((b) => ind + ind + b).join("\n") + `\n${ind}${ind}System.out.println(${ret});\n    }\n}\n`;
  }
  if (lang === "go") return (imports.length ? `import (\n${imports.map((i) => `\t"${i}"`).join("\n")}\n)\n\n` : "") + helpers + `func ${name}(${par.join(", ")}) ${retT} {\n` + body.map((b) => ind + b).join("\n") + (body.length ? "\n" : "") + `${ind}return ${ret}\n}\n`;
  if (lang === "rust") return helpers + `fn ${name}(${par.join(", ")}) -> ${retT} {\n` + body.map((b) => ind + b).join("\n") + (body.length ? "\n" : "") + `${ind}${ret}\n}\n`;
  return imports.map((i) => `import ${i};`).join("\n") + `\n\npublic class Main {\n` + helpers + `    static ${retT} ${name}(${par.join(", ")}) {\n` + body.map((b) => ind + ind + b).join("\n") + (body.length ? "\n" : "") + `${ind}${ind}return ${ret};\n    }\n}\n`;
}

const LANGS = ["python", "javascript", "typescript", "go", "rust", "java"];
export function emit(p, lang) {
  try {
    if (lang === "python") return emitPython(p);
    if (lang === "javascript") return emitJs(p, false);
    if (lang === "typescript") return emitJs(p, true);
    if (lang === "go" || lang === "rust" || lang === "java") return emitLoops(p, lang);
  } catch (_) { return null; }
  return null;
}
export function generate(input, lang) {
  const p = plan(input);
  if (!p) return null;
  const L = LANGS.includes(lang) ? lang : "python";
  const code = emit(p, L);
  if (!code) return null;
  const words = [];
  if (p.source.kind === "range") words.push(`the numbers ${p.source.from} to ${p.source.to}`); else words.push(`the ${p.source.name}`);
  for (const t of p.stages) words.push(describe(t));
  if (p.result) words.push({ sum: "add them up", product: "multiply them together", average: "take the average", max: "take the largest", min: "take the smallest", count: "count them", join: "join them into one string", longest: "keep the longest", shortest: "keep the shortest", palindrome: "check that it reads the same backwards" }[p.result.op]);
  return { ok: true, kind: "generated", lang: L, op: p.name, code, plan: p, steps: words, langs: LANGS };
}
function describe(t) {
  if (t.op === "filter" && t.not) return "drop " + describe({ ...t, not: false }).replace(/^keep /, "");
  if (t.op === "filter") return { even: "keep the even ones", odd: "keep the odd ones", positive: "keep the positive ones", negative: "keep the negative ones", prime: "keep the primes", gt: `keep those greater than ${t.k}`, lt: `keep those less than ${t.k}`, div: `keep the multiples of ${t.k}`, ndiv: `drop the multiples of ${t.k}`, nonempty: "drop the empty ones", longer: `keep those longer than ${t.k} characters`, shorter: `keep those shorter than ${t.k} characters`, starts: `keep those starting with "${t.k}"`, ends: `keep those ending with "${t.k}"`, contains: `keep those containing "${t.k}"`, vowel: "keep the vowels", consonant: "keep the consonants", digit: "keep the digits" }[t.arg];
  if (t.op === "map") return { square: "square each one", cube: "cube each one", double: "double each one", half: "halve each one", negate: "negate each one", abs: "take absolute values", add: `add ${t.k} to each`, sub: `subtract ${t.k} from each`, mul: `multiply each by ${t.k}`, divk: `divide each by ${t.k}`, upper: "uppercase", lower: "lowercase", trim: "trim whitespace", len: "take each length", reverse: "reverse each one" }[t.arg];
  return { unique: "remove duplicates", sort: t.arg === "desc" ? "sort descending" : "sort ascending", reverse: "reverse the order", take: `take the ${t.arg} ${t.k}`, words: "split into words" }[t.op];
}

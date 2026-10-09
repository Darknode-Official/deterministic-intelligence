// Deterministic NLU helpers for DI. No model, no network: just dictionaries and
// rules. This is what lets the engine understand math and requests written in
// plain, varied, or spelled-out English while staying 100% reproducible.
// Imports nothing, so it is unit-testable in Node directly.

// ---------------------------------------------------------------------------
// English number words -> a numeric value. Handles 0..billions, "and" inside a
// run ("two hundred and fifty"), hyphenated tens ("twenty-one"), and a few named
// quantities (dozen, score, a couple/pair). Returns null if the run is not a number.
// ---------------------------------------------------------------------------
const SMALL = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES = { hundred: 100, thousand: 1000, million: 1e6, billion: 1e9, trillion: 1e12 };
const NAMED = { dozen: 12, score: 20, couple: 2, pair: 2 };
const NUMWORD = new Set([...Object.keys(SMALL), ...Object.keys(TENS), ...Object.keys(SCALES), ...Object.keys(NAMED), "and", "a"]);

function parseCardinal(words) {
  // words: array of lowercased tokens forming one number phrase
  let total = 0, current = 0, saw = false, pendingA = false;
  for (let w of words) {
    if (w === "and") continue;
    if (w === "a") { pendingA = true; continue; } // "a dozen", "a hundred"
    if (w in SMALL) { current += SMALL[w]; saw = true; }
    else if (w in TENS) { current += TENS[w]; saw = true; }
    else if (w === "hundred") { current = (current || 1) * 100; saw = true; }
    else if (w in SCALES) { total += (current || 1) * SCALES[w]; current = 0; saw = true; }
    else if (w in NAMED) { current += (pendingA ? 1 : (current || 1)) * NAMED[w] - (pendingA ? 0 : 0); if (!pendingA && current === NAMED[w]) { /* bare "dozen" = 12 */ } saw = true; }
    else return null;
    pendingA = false;
  }
  return saw ? total + current : null;
}

// Replace runs of number words with their digits, leaving the rest of the text intact.
export function numberWords(text) {
  // treat a hyphen between two letters as a space ("twenty-one" -> "twenty one")
  const src = String(text || "").replace(/([a-z])-([a-z])/gi, "$1 $2")
    // digits with a scale word: "3 hundred" -> 300, "2.5 million" -> 2500000
    .replace(/\b(\d+(?:\.\d+)?)\s+(hundred|thousand|million|billion|trillion)\b/gi, (m, n, sc) => String(Number((Number(n) * SCALES[sc.toLowerCase()]).toPrecision(15))));
  const tokens = src.split(/(\s+|[^a-z0-9']+)/i);
  const out = [];
  let run = [];
  const isSp = (t) => /^\s+$/.test(t);
  const flush = () => {
    if (!run.length) return;
    // peel off trailing spaces / dangling "and"/"a" so they are not eaten
    const trailing = [];
    while (run.length && (isSp(run[run.length - 1]) || ["and", "a"].includes(run[run.length - 1].toLowerCase()))) trailing.unshift(run.pop());
    const wordsOnly = run.filter((t) => /\S/.test(t)).map((t) => t.toLowerCase());
    const val = wordsOnly.length ? parseCardinal(wordsOnly) : null;
    if (val === null) out.push(...run); else out.push(String(val));
    out.push(...trailing);
    run = [];
  };
  for (const tok of tokens) {
    const low = tok.toLowerCase();
    if (/^[a-z']+$/i.test(tok) && NUMWORD.has(low)) run.push(tok);
    else if (isSp(tok) && run.length) run.push(tok); // keep spaces inside a run
    else { flush(); out.push(tok); }
  }
  flush();
  return out.join("").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// mathPhrase: translate arithmetic written in words into an expression string
// the calculator can evaluate, or null when it is not a math phrase. It is
// deliberately conservative: it returns a best-effort expression and lets calc
// validate it, so a mistranslation simply falls back to normal routing.
// ---------------------------------------------------------------------------
const ORD = { second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, twentieth: 20 };
const ORD_RE = Object.keys(ORD).join("|");
const MATHY = new RegExp("\\b(square root of|sqrt of|cube root of|cubic root of|root of|squared|cubed|to the power of|raised to|percent of|percentage of|per cent|plus|minus|times|multiplied by|multiplied with|divided by|divided into|modulo|mod|factorial of|square of|cube of|add|added to|subtract|multiply|divide[sd]?|sum of|take away|deduct|product of)\\b|%|\\d\\s*!|\\d\\s*pc\\b" +
  "|\\btake\\s+-?\\d+(?:\\.\\d+)?\\s+away\\b|\\b(?:double|twice|triple|quadruple|halve)\\s+-?\\d|\\bto the (?:\\d+(?:st|nd|rd|th)|" + ORD_RE + ")\\b");

export function hasMathPhrase(input) { return MATHY.test(String(input || "").toLowerCase()); }

export function mathPhrase(input) {
  let t = " " + numberWords(String(input || "").toLowerCase()) + " ";
  if (!/\d/.test(t)) return null;
  if (!MATHY.test(t)) return null;
  // "verb X prep Y" forms, resolved before the generic word-operator pass
  t = t.replace(/\badd\s+(-?\d+(?:\.\d+)?)\s+(?:and|to)\s+(-?\d+(?:\.\d+)?)/g, " $1 + $2 ");
  t = t.replace(/\bsubtract\s+(-?\d+(?:\.\d+)?)\s+from\s+(-?\d+(?:\.\d+)?)/g, " $2 - $1 ");
  t = t.replace(/\bmultiply\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)/g, " $1 * $2 ");
  t = t.replace(/\bdivide\s+(-?\d+(?:\.\d+)?)\s+by\s+(-?\d+(?:\.\d+)?)/g, " $1 / $2 ");
  t = t.replace(/\bmultiply\s+(-?\d+(?:\.\d+)?)\s+(?:and|with)\s+(-?\d+(?:\.\d+)?)/g, " $1 * $2 ");
  t = t.replace(/\b(?:take|deduct)\s+(-?\d+(?:\.\d+)?)\s+(?:away\s+)?from\s+(-?\d+(?:\.\d+)?)/g, " $2 - $1 ");
  t = t.replace(/\bper cent\b/g, " percent ").replace(/(\d)\s*pc\b/g, "$1 percent");
  t = t.replace(/\b(double|twice|triple|quadruple|halve)\s+(-?\d+(?:\.\d+)?)/g, (m, w, n) => w === "halve" ? " (" + n + " / 2) " : " (" + { double: 2, twice: 2, triple: 3, quadruple: 4 }[w] + " * " + n + ") ");
  t = t.replace(new RegExp("\\bto the (?:(\\d+)(?:st|nd|rd|th)|(" + ORD_RE + "))(?:\\s+power)?\\b", "g"), (m, d, o) => " ^ " + (d || ORD[o]) + " ");
  // drop polite / command lead-ins that carry no math meaning
  t = t.replace(/\b(please|kindly|can you|could you|would you|what do you get (?:if|when) you|what does|comes? (?:out )?to|adds? up to|whats|what is|what's|what|how much is|how much|how many|tell me|work out|figure out|calculate|compute|evaluate|find|give me|the value of|the result of|the answer to|equals|equal to|the|is)\b/g, " ");
  t = " " + t.replace(/\s+/g, " ").trim() + " "; // collapse gaps left by stripping so multi-word phrases still match
  // functions and powers (before the binary operators)
  t = t.replace(/\b(cube root of|cubic root of)\b/g, " __cbrt ");
  t = t.replace(/\b(square root of|sqrt of|root of)\b/g, " __sqrt ");
  t = t.replace(/\b(square of)\b/g, " __sq ");
  t = t.replace(/\b(cube of)\b/g, " __cube ");
  t = t.replace(/\bfactorial of\b/g, " __fact ");
  t = t.replace(/\bsquared\b/g, " ^ 2 ");
  t = t.replace(/\bcubed\b/g, " ^ 3 ");
  t = t.replace(/\b(to the power of|to power of|raised to the power of|raised to power of|raised to)\b/g, " ^ ");
  // percent ("20% of 80", "20 percent of 80", then a bare "20 percent")
  t = t.replace(/\b(percent of|percentage of)\b/g, " __pctof ");
  t = t.replace(/%\s*of\b/g, " __pctof ");
  t = t.replace(/\bpercent\b|%/g, " __pct ");
  // binary operators (word forms). "and"/"plus" both mean + only via "plus".
  t = t.replace(/\b(plus|added to|add|increased by)\b/g, " + ");
  t = t.replace(/\b(minus|subtract|subtracted by|less|decreased by|take away)\b/g, " - ");
  t = t.replace(/\b(times|multiplied by|multiplied with|multiply by)\b/g, " * ");
  t = t.replace(/\b(divided by|divide by|divided into|over)\b/g, " / ");
  t = t.replace(/\b(modulo|mod)\b/g, " % ");
  // apply function markers to their following number/parenthesised group
  const wrap = (re, pre, post) => { t = t.replace(re, pre + "$1" + post); };
  wrap(/__sqrt\s*\(?\s*(-?\d+(?:\.\d+)?)\)?/g, "sqrt(", ")");
  wrap(/__cbrt\s*\(?\s*(-?\d+(?:\.\d+)?)\)?/g, "cbrt(", ")");
  wrap(/__sq\s*\(?\s*(-?\d+(?:\.\d+)?)\)?/g, "(", ")^2");
  wrap(/__cube\s*\(?\s*(-?\d+(?:\.\d+)?)\)?/g, "(", ")^3");
  wrap(/__fact\s*\(?\s*(\d+)\)?/g, "", "!");
  // "X percent of Y" -> (X/100)*Y ; "X percent" -> (X/100)
  t = t.replace(/(-?\d+(?:\.\d+)?)\s*__pctof\s*(-?\d+(?:\.\d+)?)/g, "($1/100)*$2");
  t = t.replace(/(-?\d+(?:\.\d+)?)\s*__pct/g, "($1/100)");
  t = t.replace(/\s+/g, " ").trim();
  // whatever markers survived mean we could not translate cleanly
  if (/__/.test(t)) return null;
  // must reduce to expression characters plus known calc identifiers
  const stripped = t.replace(/\b(sqrt|cbrt|pi|e|tau|phi|abs|min|max|log|ln|sin|cos|tan|gcd|lcm|mod)\b/g, " ");
  if (!/\d/.test(t) || /[a-z]/i.test(stripped)) return null;
  return t;
}

// ---------------------------------------------------------------------------
// Command-verb synonyms: canonicalize varied phrasings to the word the router
// keys on, so "turn 5km into miles", "work out 2+2", "spell backwards" all land.
// Applied to routing text only, never to a skill's payload.
// ---------------------------------------------------------------------------
const SYN = [
  [/\b(work out|figure out|work through|solve for the value of|compute|evaluate)\b/g, "calculate"],
  [/\b(turn|change|switch|transform)\b(?=[^.]*\b(into|to)\b)/g, "convert"],
  [/\b(spell|write|print|type) (it |that )?backwards\b/g, "reverse"],
  [/\b(make|create|build|produce|write me|generate) (a |an |some )?(code|program|function|script)\b/g, "generate code"],
  [/\bhow do you (say|write)\b/g, "convert"],
  [/\bwhat's\b/g, "what is"],
  [/\bwhats\b/g, "what is"],
];
export function synonyms(text) {
  let t = String(text || "");
  for (const [re, to] of SYN) t = t.replace(re, to);
  return t;
}

// ---------------------------------------------------------------------------
// naturalize: make casual, conversational phrasing land on the right skill
// WITHOUT a model. It strips pure framing/politeness that carries no routing
// signal, and rewrites a few very common question shapes into the forms the
// skills already parse. Deliberately conservative: it never removes words that
// the router keys on (like "what is", which definitions need).
// ---------------------------------------------------------------------------
const UNITS = new Set(["mm", "cm", "m", "km", "meter", "meters", "metre", "metres", "kilometer", "kilometers", "kilometre", "kilometres", "inch", "inches", "in", "ft", "foot", "feet", "yard", "yards", "yd", "mile", "miles", "mi", "kg", "g", "gram", "grams", "kilogram", "kilograms", "mg", "lb", "lbs", "pound", "pounds", "oz", "ounce", "ounces", "tonne", "tonnes", "ton", "tons", "second", "seconds", "sec", "secs", "minute", "minutes", "min", "mins", "hour", "hours", "hr", "hrs", "day", "days", "week", "weeks", "month", "months", "year", "years", "byte", "bytes", "kb", "mb", "gb", "tb", "kilobyte", "kilobytes", "megabyte", "megabytes", "gigabyte", "gigabytes", "celsius", "fahrenheit", "kelvin", "stone", "st", "ml", "milliliter", "milliliters", "millilitre", "millilitres", "l", "liter", "liters", "litre", "litres", "gallon", "gallons", "gal", "quart", "quarts", "pint", "pints", "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon", "teaspoons", "tsp", "acre", "acres", "hectare", "hectares", "mph", "kph", "knots", "kms", "yds", "kilo", "kilos", "kgs", "gm", "gms", "wk", "wks", "fortnight", "fortnights", "yr", "yrs", "decade", "decades", "century", "centuries", "bit", "bits", "terabyte", "terabytes", "kmph", "kmh", "centigrade"]);
// currency majors and their fixed subunits count as units only for the "how many X in a Y" rewrite
const CURRENCY_SUB = new Set(["cent", "cents", "penny", "pennies", "pence", "dollar", "dollars", "euro", "euros", "usd", "eur", "gbp", "rupee", "rupees", "paisa", "paise", "peso", "pesos", "centavo", "centavos"]);
const isUnit = (w) => UNITS.has(String(w || "").toLowerCase()) || CURRENCY_SUB.has(String(w || "").toLowerCase());
export const UNIT_WORDS = UNITS;

export function naturalize(text) {
  let t = " " + String(text || "").toLowerCase().trim() + " ";
  // "how many U1 (are there) in [N|a] U2"  ->  "N U2 in U1"  (only when both are real units)
  t = t.replace(/\bhow (?:many|much)\s+([a-z]+)\s+(?:are\s+)?(?:there\s+)?in\s+(?:a\s+|an\s+|one\s+|each\s+)?(\d+(?:\.\d+)?)?\s*([a-z]+)\b/g,
    (m, u1, n, u2) => (isUnit(u1) && isUnit(u2)) ? " " + (n || "1") + " " + u2 + " in " + u1 + " " : m);
  // bare "seconds in a year" / "tablespoons in a cup" (the whole message is just the two units)
  t = t.replace(/^\s*([a-z]+)\s+(?:in|per)\s+(?:a|an|one)\s+([a-z]+)\s*$/, (m, u1, u2) => (isUnit(u1) && isUnit(u2) && u1 !== u2) ? " 1 " + u2 + " in " + u1 + " " : m);
  t = t.replace(/\bhow (?:many|much)\s+([a-z]+)\s+(?:is|are|makes?|equals?)\s+(\d+(?:\.\d+)?)\s*([a-z]+)\b/g,
    (m, u1, n, u2) => (isUnit(u1) && isUnit(u2)) ? " " + n + " " + u2 + " in " + u1 + " " : m);
  // strip trailing politeness
  t = t.replace(/[\s,]*\b(please|thanks|thank you|pls|plz)\b[\s.!?]*$/g, " ");
  // strip leading framing that carries no routing signal (repeatedly). NOTE: we do
  // NOT strip "what is"/"how much" here — definitions and math rely on those.
  // NOTE: we do NOT strip "how do i / how to" — those signal a how-to (code) intent
  // that the router uses; stripping them would misroute "how do i reverse a string".
  const LEAD = /^\s*(can you|could you|would you|will you|can u|please|kindly|hey|hi|yo|ok|okay|so|um|uh|well|i want to know|i wanna know|i want|i wanna|i need|i'd like to|i would like to|help me|let me know|do you know|i wonder|i was wondering)\b[\s,:-]*/;
  let prev; do { prev = t; t = t.replace(LEAD, " "); } while (t !== prev);
  return t.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// numberToWords: 1234 -> "one thousand two hundred thirty-four". Handles
// negatives, decimals (read digit by digit) and values up to the trillions.
// ---------------------------------------------------------------------------
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS_W = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const SCALE_W = [[1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
function under1000(n) {
  const parts = [];
  if (n >= 100) { parts.push(ONES[Math.floor(n / 100)] + " hundred"); n %= 100; }
  if (n >= 20) { parts.push(TENS_W[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "")); }
  else if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
}
export function numberToWords(value) {
  const str = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(str)) return null;
  const neg = str.startsWith("-");
  const [intPart, frac] = str.replace(/^-/, "").split(".");
  let n = Number(intPart);
  if (!Number.isSafeInteger(n) || n >= 1e15) return null;
  let words;
  if (n === 0) words = "zero";
  else {
    const parts = [];
    for (const [v, name] of SCALE_W) if (n >= v) { parts.push(under1000(Math.floor(n / v)) + " " + name); n %= v; }
    if (n > 0) parts.push(under1000(n));
    words = parts.join(" ");
  }
  if (frac) words += " point " + frac.split("").map((d) => ONES[+d]).join(" ");
  return (neg ? "minus " : "") + words;
}

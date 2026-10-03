// Universal Engine — deterministic skills ("sources"). Each skill is a pure function
// with a fixed, inspectable rule set. No AI, no randomness: same input -> same output,
// and each result is something the engine can show its work for.
//
// Skills: calc (arithmetic), convert (units), codegen (program synthesis from a spec,
// multi-language), text (transforms), regex (pattern builder), datetime (date math).

// ---------------------------------------------------------------------------
// calc: a real expression evaluator (shunting-yard -> RPN). Not eval(): a hand
// written parser that supports + - * / % ^, parentheses, unary minus, functions
// and constants. This is a genuine little computation, verifiable step by step.
// ---------------------------------------------------------------------------
export const CONSTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };

// integer helpers, exported so the number-theory skill can reuse them.
export function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw new Error("factorial needs a non-negative integer");
  if (n > 170) return Infinity;
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}
export function gcd2(a, b) { a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b)); while (b) { const t = a % b; a = b; b = t; } return a; }
function nCr(n, r) { if (r < 0 || r > n) return 0; return Math.round(factorial(n) / (factorial(r) * factorial(n - r))); }
function nPr(n, r) { if (r < 0 || r > n) return 0; return Math.round(factorial(n) / factorial(n - r)); }

// Functions take an argument array, so min/max/gcd/lcm/hypot are variadic.
const MFUNCS = {
  sqrt: (a) => Math.sqrt(a[0]), cbrt: (a) => Math.cbrt(a[0]), abs: (a) => Math.abs(a[0]),
  round: (a) => { const d = a.length > 1 ? Math.max(-15, Math.min(12, Math.trunc(a[1]))) : 0; const f = 10 ** d; return d < 0 ? Math.round(a[0] * f) * 10 ** -d : Math.round(a[0] * f) / f; }, floor: (a) => Math.floor(a[0]), ceil: (a) => Math.ceil(a[0]),
  sin: (a) => Math.sin(a[0]), cos: (a) => Math.cos(a[0]), tan: (a) => Math.tan(a[0]),
  asin: (a) => Math.asin(a[0]), acos: (a) => Math.acos(a[0]), atan: (a) => Math.atan(a[0]),
  ln: (a) => Math.log(a[0]), log: (a) => Math.log10(a[0]), log2: (a) => Math.log2(a[0]),
  exp: (a) => Math.exp(a[0]), sign: (a) => Math.sign(a[0]),
  fact: (a) => factorial(a[0]), factorial: (a) => factorial(a[0]),
  min: (a) => Math.min(...a), max: (a) => Math.max(...a), hypot: (a) => Math.hypot(...a),
  pow: (a) => Math.pow(a[0], a[1]), mod: (a) => ((a[0] % a[1]) + a[1]) % a[1],
  logb: (a) => Math.log(a[0]) / Math.log(a[1]), atan2: (a) => Math.atan2(a[0], a[1]),
  gcd: (a) => a.reduce((x, y) => gcd2(x, y)), lcm: (a) => a.reduce((x, y) => Math.abs(x / gcd2(x, y) * y)),
  ncr: (a) => nCr(a[0], a[1]), npr: (a) => nPr(a[0], a[1]), avg: (a) => a.reduce((x, y) => x + y, 0) / a.length,
};
const ARITY2 = { pow: 1, mod: 1, logb: 1, atan2: 1, gcd: 1, lcm: 1, ncr: 1, npr: 1 };

function lexMath(src) {
  const toks = [];
  const re = /\s*(0x[0-9a-f]+|0b[01]+|0o[0-7]+|[0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?|[a-z_][a-z0-9_]*|[-+*/%^!(),=])/gy;
  let m, consumed = 0;
  while ((m = re.exec(src))) {
    consumed = re.lastIndex; // sticky exec resets lastIndex to 0 on the final miss
    const t = m[1];
    if (/^0x/.test(t)) toks.push({ t: "num", v: parseInt(t.slice(2), 16) });
    else if (/^0b/.test(t)) toks.push({ t: "num", v: parseInt(t.slice(2), 2) });
    else if (/^0o/.test(t)) toks.push({ t: "num", v: parseInt(t.slice(2), 8) });
    else if (/^[0-9.]/.test(t)) toks.push({ t: "num", v: parseFloat(t) });
    else if (/^[a-z_]/.test(t)) toks.push({ t: "name", v: t });
    else toks.push({ t: "op", v: t });
  }
  if (consumed !== src.length && src.slice(consumed).trim() !== "") {
    throw new Error("unexpected token near '" + src.slice(consumed).trim().slice(0, 12) + "'");
  }
  return toks;
}

// Recursive-descent evaluator over one statement's tokens, sharing a vars map.
function evalTokens(toks, vars) {
  let i = 0;
  const peek = () => toks[i];
  const eat = (v) => { const t = toks[i]; if (v && (!t || t.v !== v)) throw new Error("expected '" + v + "'"); i++; return t; };
  const isOp = (v) => { const t = peek(); return t && t.t === "op" && t.v === v; };

  function expr() { return addSub(); }
  function addSub() { let x = mulDiv(); while (isOp("+") || isOp("-")) { const o = eat().v; const y = mulDiv(); x = o === "+" ? x + y : x - y; } return x; }
  function mulDiv() { let x = power(); while (isOp("*") || isOp("/") || isOp("%")) { const o = eat().v; const y = power(); x = o === "*" ? x * y : o === "/" ? x / y : x % y; } return x; }
  function power() { const b = unary(); if (isOp("^")) { eat(); return Math.pow(b, power()); } return b; }
  function unary() { if (isOp("-") || isOp("+")) { const o = eat().v; const x = unary(); return o === "-" ? -x : x; } return postfix(); }
  function postfix() {
    let x = primary();
    while (isOp("!") || isOp("%")) {
      if (isOp("%")) { const nx = toks[i + 1]; if (nx && (nx.t === "num" || nx.t === "name" || (nx.t === "op" && nx.v === "("))) break; eat(); x = x / 100; }
      else { eat(); x = factorial(x); }
    }
    return x;
  }
  function primary() {
    const t = peek();
    if (!t) throw new Error("unexpected end of expression");
    if (t.t === "num") { eat(); return t.v; }
    if (isOp("(")) { eat("("); const x = expr(); eat(")"); return x; }
    if (t.t === "name") {
      eat();
      if (isOp("(")) {
        eat("(");
        const args = [];
        if (!isOp(")")) { args.push(expr()); while (isOp(",")) { eat(); args.push(expr()); } }
        eat(")");
        const fn = MFUNCS[t.v];
        if (!fn) throw new Error("unknown function '" + t.v + "'");
        if (ARITY2[t.v] && args.length < 2) throw new Error(t.v + " needs at least 2 arguments");
        if (!args.length) throw new Error(t.v + " needs an argument");
        return fn(args);
      }
      if (t.v in CONSTS) return CONSTS[t.v];
      if (t.v in vars) return vars[t.v];
      throw new Error("unknown name '" + t.v + "'");
    }
    throw new Error("unexpected token");
  }

  const val = expr();
  if (i !== toks.length) throw new Error("unexpected trailing input");
  return val;
}

// Exact big integers when a double overflows: "171!", "2^1024", "50! / 48!" is not
// covered, only a lone factorial or an integer power. Capped to stay fast.
function bigExact(src) {
  const f = src.match(/^\s*\(?\s*(\d+)\s*\)?\s*!\s*$/), p = src.match(/^\s*\(?\s*(-?\d+)\s*\)?\s*(?:\^|\*\*)\s*(\d+)\s*$/);
  let v;
  if (f && +f[1] <= 3000) { v = 1n; for (let i = 2n; i <= BigInt(f[1]); i++) v *= i; }
  else if (p && BigInt(p[1].replace("-", "")).toString(2).length * +p[2] <= 40000) v = BigInt(p[1]) ** BigInt(p[2]);
  else return null;
  const digits = v.toString().replace("-", "").length;
  return { ok: true, value: v.toString(), big: true, digits };
}

function runCalc(src) {
  const stmts = src.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean);
  const vars = {};
  let value;
  try {
    for (const stmt of stmts) {
      const toks = lexMath(stmt);
      if (toks.length >= 2 && toks[0].t === "name" && toks[1].t === "op" && toks[1].v === "=") {
        const name = toks[0].v;
        if (name in CONSTS) throw new Error("cannot assign to constant '" + name + "'");
        value = evalTokens(toks.slice(2), vars);
        vars[name] = value;
      } else value = evalTokens(toks, vars);
    }
    if (!Number.isFinite(value)) {
      const big = bigExact(src);
      if (big) return big;
      if (/\/\s*\(?\s*0(?:\.0*)?\s*\)?(?![\d.])/.test(src)) return { ok: false, error: /(?:^|[^\d.])0(?:\.0*)?\s*\/\s*\(?\s*0/.test(src) ? "0 / 0 is undefined (it has no single value)" : "division by zero is undefined" };
      if (/\b(?:log|ln|log10|log2)\s*\(\s*0\s*\)/.test(src)) return { ok: false, error: "the logarithm of 0 is undefined (it falls toward minus infinity)" };
      if (value === Infinity || value === -Infinity) return { ok: false, error: "the result is too large for a double-precision number (above about 1.8 x 10^308)" };
      return { ok: false, error: "the result is not a real number (for example the square root or logarithm of a negative number, or 0 / 0)" };
    }
    // tan at an odd multiple of 90 degrees is undefined, but floating point gives ~1.6e16
    if (/\btan\s*\(/.test(src) && Math.abs(value) > 1e15) return { ok: false, error: "tan is undefined there (at odd multiples of 90 degrees, or pi/2 radians)" };
    value = Math.round(value * 1e12) / 1e12;
    const out = { ok: true, value };
    if (Object.keys(vars).length) out.vars = vars;
    return out;
  } catch (e) { return { ok: false, error: e.message }; }
}

// the simplest fraction within 1e-9 of x, by continued fractions (0.75 -> 3/4)
export function toFraction(x) {
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    [h1, h0] = [a * h1 + h0, h1]; [k1, k0] = [a * k1 + k0, k1];
    if (Math.abs(x - h1 / k1) < 1e-9 * Math.max(1, x) || k1 > 1e9) break;
    b = 1 / (b - a);
  }
  return { n: sign * h1, d: k1 };
}

export function calc(input) {
  let src = String(input || "").toLowerCase().replace(/[?]/g, "").trim();
  if (!src) return { ok: false, error: "empty expression" };
  const fr = src.match(/^(?:what is |whats |convert |write )?(-?\d*\.\d+|-?\d+(?:\.\d+)?\s*\/\s*\d+)\s+(?:as|to|in|into)\s+(?:a\s+|its\s+)?(?:simplest\s+)?fraction\s*$/);
  if (fr) {
    const x = runCalc(fr[1]); if (!x.ok) return x;
    const { n, d } = toFraction(x.value);
    return { ok: true, value: d === 1 ? String(n) : n + "/" + d, expr: fr[1] + " as a fraction" };
  }
  // "simplify 18/24", "reduce 18/24", "18/24 in lowest terms": exact integer gcd, no floats
  const sf = src.match(/^(?:(?:simplify|reduce|simplest form of|lowest terms of)\s+)?(-?\d+)\s*\/\s*(\d+)(?:\s+(?:in|to)\s+(?:its\s+)?(?:lowest|simplest)\s+(?:terms|form))?\s*$/);
  if (sf && /simplify|reduce|lowest|simplest/.test(src)) {
    const n0 = parseInt(sf[1], 10), d0 = parseInt(sf[2], 10);
    if (d0 === 0) return { ok: false, error: "division by zero" };
    const g = (a, b) => { a = Math.abs(a); while (b) [a, b] = [b, a % b]; return a; };
    const k = g(n0, d0) || 1, n = n0 / k, d = d0 / k;
    return { ok: true, value: d === 1 ? String(n) : n + "/" + d, expr: sf[1] + "/" + sf[2] + " simplified", gcd: k, already: k === 1 };
  }
  // "percent change from 40 to 50", "percentage increase from 200 to 250", "% decrease from 80 to 60"
  const pch = src.match(/^(?:what is |whats |find |calculate )?(?:the )?(?:percent(?:age)?|%) (change|increase|decrease|difference|growth|drop|rise|gain|loss) (?:from |between )?(-?\d+(?:\.\d+)?) (?:to|and) (-?\d+(?:\.\d+)?)$/) || src.match(/^(?:what is |whats |find |calculate )?(?:the )?(change|increase|decrease|difference|growth|drop|rise) (?:from |between )?(-?\d+(?:\.\d+)?) (?:to|and) (-?\d+(?:\.\d+)?) (?:as a |in )?(?:percent(?:age)?|%)$/);
  if (pch) {
    const a = parseFloat(pch[2]), b = parseFloat(pch[3]);
    if (a === 0) return { ok: false, error: "a change from 0 has no percentage (division by zero)" };
    const raw = (b - a) / Math.abs(a) * 100, v = Math.round(raw * 1e4) / 1e4;
    return { ok: true, value: v + "%", expr: "from " + pch[2] + " to " + pch[3] + " percent change", from: a, to: b, exact: Math.abs(raw - v) < 1e-12, word: pch[1] };
  }
  // ---- round 9 everyday arithmetic forms; each returns its own title + note so say() prints them as written ----
  const money = (x) => (Math.round(x * 100) / 100).toFixed(2).replace(/\.00$/, "");
  const r6 = (x) => Math.round(x * 1e6) / 1e6;
  // "12 divided by 5 remainder", "remainder of 17 divided by 5", "quotient and remainder of 17 and 5"
  const dr = src.match(/^(?:what is |whats |find |calculate )?(-?\d+)\s*(?:divided by|÷|\/)\s*(\d+)\s+(?:with\s+)?(?:the\s+)?(?:remainder|and remainder|rem|r)$/) || src.match(/^(?:what is |whats |find |calculate )?(?:the )?(?:remainder|quotient and remainder|quotient and the remainder|remainder and quotient)\s+(?:of|when|from|for)\s+(-?\d+)\s+(?:is\s+)?(?:divided by|÷|\/|and)\s+(\d+)$/);
  if (dr) {
    const a = parseInt(dr[1], 10), b = parseInt(dr[2], 10);
    if (b === 0) return { ok: false, error: "division by zero" };
    const q = Math.trunc(a / b), r = a - q * b;
    return { ok: true, value: q + " remainder " + r, expr: a + " divided by " + b, title: "Division with remainder", note: "**" + a + " ÷ " + b + " = " + q + " remainder " + r + "** (" + b + " × " + q + " + " + r + " = " + a + ")." + (a < 0 ? " The remainder takes the sign of the dividend (truncated division)." : "") };
  }
  // "price before tax if total is 54 at 8%", "original price if 80 after a 20% discount", "i paid 54 including 8% tax, what was the price"
  if (/\b(?:before (?:tax|tip|vat|gst|discount|markup|the (?:increase|discount|raise|markup|tax|tip))|original (?:price|amount|cost|value)|pre-?(?:tax|tip|discount) (?:price|amount|cost)|starting price|list price|price before)\b/.test(src)) {
    const pm = src.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/);
    const others = (src.replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)/, " ").match(/\d+(?:\.\d+)?/g) || []);
    if (pm && others.length === 1) {
      const p = parseFloat(pm[1]), t = parseFloat(others[0]);
      const down = /\b(?:discount|off|sale|reduction|reduced|decrease|decreased|markdown|marked down|cheaper|drop)\b/.test(src);
      if (down && p >= 100) return { ok: false, error: "a discount of " + p + "% or more leaves nothing to pay, so no original price can be recovered" };
      const base = down ? t / (1 - p / 100) : t / (1 + p / 100);
      const kind = down ? "discount" : (src.match(/\b(tax|tip|vat|gst|markup|increase|raise|fee|service charge)\b/) || [])[1] || "increase";
      return { ok: true, value: money(base), expr: t + " before " + p + "% " + kind, title: "Price before " + kind, note: "**" + money(base) + "** is the amount before the " + p + "% " + kind + ": " + t + " ÷ (1 " + (down ? "− " : "+ ") + p + "/100) = " + t + " ÷ " + r6(down ? 1 - p / 100 : 1 + p / 100) + ". The " + kind + " itself is " + money(Math.abs(t - base)) + "." };
    }
    if (pm) return { ok: false, error: "I need the total that was paid and the percentage, for example: price before tax if the total is 54 at 8%" };
  }
  // "3 items at 4.99", "how much is 4 tickets at 12.50 each" (hours at a rate belong to the pay skill)
  const ia = src.match(/^(?:how much (?:is|are|for|do i pay for|will i pay for) |what is |whats |what do |cost of |price of |total (?:for|of|cost of) |calculate )?(\d+(?:\.\d+)?)\s+(?!(?:hours?|hrs?|days?|weeks?|months?|years?|minutes?|mins?|percent|%)\b)([a-z]+)\s+(?:at|for|@|costing|priced at|x)\s+\$?(\d+(?:\.\d+)?)\s*(?:dollars?|bucks|usd|euros?|pounds?)?(?:\s+(?:each|apiece|a piece|per (?:item|unit|piece|ticket|one|[a-z]+)|a pop|every))?(?:\s+cost)?$/);
  if (ia && !/^(?:to|in|into|as|by|times|plus|minus|and|or|of|the|a|an)$/.test(ia[2])) {
    const n = parseFloat(ia[1]), each = parseFloat(ia[3]);
    return { ok: true, value: money(n * each), expr: n + " × " + each, title: "Total cost", note: "**" + n + " " + ia[2] + " at " + each + " each cost " + money(n * each) + "** (" + n + " × " + each + ")." };
  }
  // "change from 20 for 13.45", "change out of 50 on a 32.10 bill"
  const ch = src.match(/^(?:what is |whats |how much (?:is )?)?(?:the |my )?change (?:from|out of|on|for) (?:a |the )?\$?(\d+(?:\.\d+)?)(?: (?:bill|note|dollars?|bucks))? (?:for|on|if (?:it|the (?:bill|total|price|cost)) (?:is|costs?|was|comes to)|after (?:paying|spending|buying(?: something for)?)|when (?:i|you|we) (?:pay|spend|buy(?: something for)?)) (?:a |an |the )?\$?(\d+(?:\.\d+)?)(?: (?:bill|total|purchase|item|dollars?))?$/);
  if (ch) {
    const paid = parseFloat(ch[1]), cost = parseFloat(ch[2]);
    if (cost > paid) return { ok: false, error: money(paid) + " does not cover " + money(cost) + "; " + money(cost - paid) + " short" };
    return { ok: true, value: money(paid - cost), expr: paid + " − " + cost, title: "Change due", note: "**" + money(paid - cost) + "** change from " + money(paid) + " on " + money(cost) + " (" + paid + " − " + cost + ")." };
  }
  // "50 plus 8% tax", "add 20% tip to 45", "80 with 15% service charge", "120 including 10% vat" (the total, tax added)
  const pt = src.match(/^(?:what is |whats |calculate )?\$?(\d+(?:\.\d+)?)\s+(?:plus|with|\+|including|incl\.?|after adding|and)\s+(?:a |an )?(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(tax|sales tax|vat|gst|hst|tip|gratuity|service charge|service fee|fee|surcharge|markup)$/) || src.match(/^(?:add|apply|include)\s+(?:a |an )?(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(tax|sales tax|vat|gst|hst|tip|gratuity|service charge|service fee|fee|surcharge|markup)\s+(?:to|on)\s+\$?(\d+(?:\.\d+)?)$/);
  if (pt) {
    const flip = /^(?:add|apply|include)/.test(src), base = parseFloat(flip ? pt[3] : pt[1]), p = parseFloat(flip ? pt[1] : pt[2]), kind = flip ? pt[2] : pt[3];
    const extra = base * p / 100;
    return { ok: true, value: money(base + extra), expr: base + " + " + p + "% " + kind, title: "Total with " + kind, note: "**" + money(base) + " plus " + p + "% " + kind + " is " + money(base + extra) + "** (the " + kind + " is " + money(extra) + ")." };
  }
  // "30 percent as a fraction", "12.5% as a fraction"
  const pf = src.match(/^(?:what is |whats |write |express |convert )?(\d+(?:\.\d+)?)\s*(?:%|percent)\s+(?:as|to|in|into)\s+(?:a |its )?(?:simplest |lowest )?(?:fraction|fraction in lowest terms|ratio)$/);
  if (pf) {
    const p = parseFloat(pf[1]), { n, d } = toFraction(p / 100);
    return { ok: true, value: d === 1 ? String(n) : n + "/" + d, expr: p + "% as a fraction", title: "Percent as a fraction", note: "**" + p + "% = " + (d === 1 ? n : n + "/" + d) + "** (" + p + "/100 in lowest terms)." };
  }
  // "scientific notation for 123000", "0.00045 in scientific notation"
  const sn = src.match(/^(?:what is |whats |write |express |convert |put )?(-?\d+(?:\.\d+)?)\s+(?:in|as|to|into)\s+(?:scientific|standard index|exponential|e)\s+(?:notation|form)$/) || src.match(/^(?:what is |whats )?(?:the )?(?:scientific|standard index|exponential)\s+(?:notation|form)\s+(?:of|for)\s+(-?\d+(?:\.\d+)?)$/);
  if (sn) {
    const x = parseFloat(sn[1]); if (x === 0) return { ok: true, value: "0", expr: "0 in scientific notation", title: "Scientific notation", note: "**0** is written as 0 × 10^0 (zero has no exponent form)." };
    const e = Math.floor(Math.log10(Math.abs(x))), mant = r6(x / Math.pow(10, e));
    return { ok: true, value: mant + " × 10^" + e, expr: sn[1] + " in scientific notation", title: "Scientific notation", note: "**" + sn[1] + " = " + mant + " × 10^" + e + "** (" + mant + "e" + e + ")." };
  }
  // "1.5e6 as a number", "2.5e-3 in decimal"
  const en = src.match(/^(?:what is |whats |write |expand |convert )?(-?\d+(?:\.\d+)?)\s*(?:e|×\s*10\^|x\s*10\^|\*\s*10\^)\s*([+-]?\d+)\s+(?:as|in|to|into)\s+(?:a |an |its )?(?:number|decimal|plain number|ordinary number|standard form|full form|digits)$/);
  if (en) {
    const mant = sn ? null : en[1], e = parseInt(en[2], 10); if (Math.abs(e) > 300) return { ok: false, error: "an exponent of " + e + " is beyond double precision" };
    const x = parseFloat(mant) * Math.pow(10, e);
    let plain; if (Number.isInteger(x) && Math.abs(x) < 1e21) plain = BigInt(Math.round(x)).toString(); else plain = x.toFixed(Math.max(0, -e + (mant.split(".")[1] || "").length)).replace(/\.?0+$/, "");
    return { ok: true, value: plain, expr: mant + "e" + e + " as a number", title: "Plain number", note: "**" + mant + " × 10^" + e + " = " + plain + "**." };
  }
  // "1/3 as a percent", "0.25 as a percentage", "3/8 to percent"
  const pc = src.match(/^(?:what is |whats |convert |write |express )?(-?\d*\.\d+|-?\d+(?:\.\d+)?\s*\/\s*\d+|-?\d+)\s+(?:as|to|in|into)\s+(?:a\s+)?percent(?:age)?\s*$/);
  if (pc) {
    const x = runCalc(pc[1]); if (!x.ok) return x;
    const raw = x.value * 100, v = Math.round(raw * 1e4) / 1e4;
    return { ok: true, value: v + "%", expr: pc[1] + " as a percent", exact: Math.abs(raw - v) < 1e-12 };
  }
  src = src.replace(/([0-9.]+)\s*%\s+of\s+/g, "($1/100)*"); // "15% of 200"
  const res = runCalc(src);
  if (res.ok) { res.expr = src; return res; }
  // typo / filler tolerance: drop natural-language words that are not known names, then retry.
  // A word glued to "(" is kept — that is an intended function call, so it should error honestly.
  if (/\d/.test(src)) {
    const stripped = src.replace(/[a-z_][a-z0-9_]*/g, (w, off, str) =>
      (w in MFUNCS || w in CONSTS || /^\s*\(/.test(str.slice(off + w.length))) ? w : " ").replace(/\s+/g, " ").trim();
    if (stripped && stripped !== src && /\d/.test(stripped)) {
      const r2 = runCalc(stripped);
      if (r2.ok) { r2.expr = stripped; return r2; }
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// convert: unit conversion via factor tables (+ special temperature formulas).
// ---------------------------------------------------------------------------
const UNITS = {
  length: { base: "m", u: { mm: 1e-3, millimeter: 1e-3, millimeters: 1e-3, millimetre: 1e-3, millimetres: 1e-3, cm: 1e-2, centimeter: 1e-2, centimeters: 1e-2, centimetre: 1e-2, centimetres: 1e-2, m: 1, meter: 1, meters: 1, metre: 1, metres: 1, km: 1e3, kilometer: 1e3, kilometers: 1e3, kilometre: 1e3, kilometres: 1e3, kms: 1e3, in: 0.0254, inch: 0.0254, inches: 0.0254, ft: 0.3048, foot: 0.3048, feet: 0.3048, yd: 0.9144, yard: 0.9144, yards: 0.9144, mi: 1609.344, mile: 1609.344, miles: 1609.344, yds: 0.9144 } },
  mass: { base: "kg", u: { mg: 1e-6, milligram: 1e-6, milligrams: 1e-6, g: 1e-3, gram: 1e-3, grams: 1e-3, kg: 1, kilogram: 1, kilograms: 1, kilo: 1, kilos: 1, kgs: 1, gm: 1e-3, gms: 1e-3, t: 1e3, tonne: 1e3, tonnes: 1e3, oz: 0.0283495, ounce: 0.0283495, ounces: 0.0283495, lb: 0.453592, lbs: 0.453592, pound: 0.453592, pounds: 0.453592, st: 6.35029, stone: 6.35029 } },
  time: { base: "s", u: { ms: 1e-3, millisecond: 1e-3, milliseconds: 1e-3, s: 1, sec: 1, secs: 1, second: 1, seconds: 1, min: 60, mins: 60, minute: 60, minutes: 60, h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800, wk: 604800, wks: 604800, fortnight: 1209600, fortnights: 1209600, month: 2629800, months: 2629800, year: 31557600, years: 31557600, yr: 31557600, yrs: 31557600, decade: 315576000, decades: 315576000, century: 3155760000, centuries: 3155760000 } },
  data: { base: "b", u: { bit: 0.125, bits: 0.125, kilobyte: 1e3, kilobytes: 1e3, megabyte: 1e6, megabytes: 1e6, gigabyte: 1e9, gigabytes: 1e9, terabyte: 1e12, terabytes: 1e12, b: 1, byte: 1, bytes: 1, kb: 1e3, kib: 1024, mb: 1e6, mib: 1048576, gb: 1e9, gib: 1073741824, tb: 1e12, tib: 1099511627776 } },
  speed: { base: "mps", u: { mps: 1, "m/s": 1, kph: 0.277778, kmph: 0.277778, kmh: 0.277778, "km/h": 0.277778, "km/hr": 0.277778, "mi/h": 0.44704, mph: 0.44704, kn: 0.514444, knot: 0.514444, knots: 0.514444 } },
  // US customary volumes (gallon = 231 cubic inches exactly)
  volume: { base: "l", u: { ml: 1e-3, milliliter: 1e-3, milliliters: 1e-3, millilitre: 1e-3, millilitres: 1e-3, cc: 1e-3, cl: 1e-2, l: 1, liter: 1, liters: 1, litre: 1, litres: 1, gal: 3.785411784, gallon: 3.785411784, gallons: 3.785411784, qt: 0.946352946, quart: 0.946352946, quarts: 0.946352946, pt: 0.473176473, pint: 0.473176473, pints: 0.473176473, cup: 0.2365882365, cups: 0.2365882365, floz: 0.0295735295625, "fl oz": 0.0295735295625, tbsp: 0.01478676478125, tablespoon: 0.01478676478125, tablespoons: 0.01478676478125, tsp: 0.00492892159375, teaspoon: 0.00492892159375, teaspoons: 0.00492892159375 } },
  area: { base: "m2", u: { m2: 1, sqm: 1, km2: 1e6, sqkm: 1e6, ft2: 0.09290304, sqft: 0.09290304, acre: 4046.8564224, acres: 4046.8564224, hectare: 1e4, hectares: 1e4, ha: 1e4 } },
};
function findUnit(u) { u = u.toLowerCase(); for (const dim in UNITS) if (u in UNITS[dim].u) return { dim, factor: UNITS[dim].u[u] }; return null; }
// ISO currency codes and common names, recognised only to refuse honestly (no live rates offline)
export const CURRENCY = new Set(["usd", "eur", "gbp", "jpy", "cny", "inr", "aud", "cad", "chf", "nzd", "sek", "nok", "dkk", "krw", "brl", "mxn", "zar", "sgd", "hkd", "rub", "try", "pln", "thb", "idr", "php", "myr", "vnd", "aed", "sar", "ils", "czk", "huf", "btc", "eth", "dollars", "dollar", "euros", "euro", "pounds", "pound", "yen", "yuan", "rupees", "rupee", "francs", "franc", "won", "pesos", "peso", "rubles", "ruble", "rand", "bitcoin", "bitcoins"]);

export function convert(input) {
  // find the "<number> <unit> to <unit>" pattern anywhere, so leading words
  // (including a misspelled "convert") do not block the parse.
  let src = String(input || "").toLowerCase().trim();
  // amounts said as fractions or scale words: "1/3 cup", "2 1/2 cups", "1 million seconds", "5k" before a length unit
  src = src.replace(/(?<![\d.])(\d+)\s+(\d+)\s*\/\s*(\d+)(?=\s*[a-z°])/g, (m, w, n, d) => +d ? String(+w + n / d) : m)
    .replace(/(?<![\d.\/])(\d+)\s*\/\s*(\d+)(?=\s*[a-z°])/g, (m, n, d) => +d ? String(n / d) : m)
    .replace(/(\d+(?:\.\d+)?)\s+(thousand|million|billion|trillion)\b/g, (m, n, w) => String(+n * { thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12 }[w]))
    .replace(/^((?:convert\s+|what is\s+|whats\s+|how far is\s+)?)(\d+(?:\.\d+)?)k\s+(?:to|in|into|as)\s+(miles?|mi|km|kilomet\w+|metres?|meters?|m|feet|ft|yards?)\b/, "$1$2 km to $3");
  // "180 cm in feet and inches": a length asked as a mixed feet + inches figure
  const fi = src.match(/(-?[0-9]*\.?[0-9]+)\s*([a-z°/]+)\s*(?:to|in|into|as)\s+(?:feet|ft|foot)\s+(?:and|&|\+)\s+(?:inches|inch|in)\b/);
  if (fi) {
    const a = findUnit(fi[2].replace("°", ""));
    if (!a) return { ok: false, error: "unknown unit: " + fi[2] };
    if (a.dim !== "length") return { ok: false, error: "cannot convert " + a.dim + " to length" };
    const inches = parseFloat(fi[1]) * a.factor / 0.0254;
    let ft = Math.floor(inches / 12), rem = Math.round((inches - ft * 12) * 100) / 100;
    if (rem >= 12) { ft += 1; rem = 0; }
    return { ok: true, value: ft + " ft " + rem + " in", dim: "length", from: fi[2], to: "feet and inches", input: parseFloat(fi[1]), feet: ft, inches: rem, totalInches: Math.round(inches * 1e6) / 1e6 };
  }
  const m = src.match(/(-?[0-9]*\.?[0-9]+)\s*([a-z°/]+)\s*(?:to|in|into|as)\s+([a-z°/]+)/);
  if (!m) return { ok: false, error: "use the form: 12 km to miles" };
  const val = parseFloat(m[1]);
  let from = m[2].replace("°", ""), to = m[3].replace("°", "");
  // temperature (non-linear)
  const T = { c: "c", celsius: "c", centigrade: "c", degc: "c", degf: "f", f: "f", fahrenheit: "f", k: "k", kelvin: "k" };
  if (T[from] && T[to]) {
    let c; if (T[from] === "c") c = val; else if (T[from] === "f") c = (val - 32) * 5 / 9; else c = val - 273.15;
    if (c < -273.15 - 1e-9) return { ok: false, error: val + " " + from + " is below absolute zero (-273.15 C, -459.67 F, 0 K), so it is not a physical temperature" };
    let out; if (T[to] === "c") out = c; else if (T[to] === "f") out = c * 9 / 5 + 32; else out = c + 273.15;
    return { ok: true, value: Math.round(out * 1e6) / 1e6, dim: "temperature", from, to, input: val };
  }
  let a = findUnit(from), b = findUnit(to);
  // a currency's own subunit is a fixed 100:1, no exchange rate involved ("15 dollars in cents")
  const MAJOR = { usd: "US dollars", dollar: "dollars", dollars: "dollars", eur: "euros", euro: "euros", euros: "euros", gbp: "pounds sterling", aud: "Australian dollars", cad: "Canadian dollars", nzd: "New Zealand dollars", sgd: "Singapore dollars", hkd: "Hong Kong dollars", inr: "rupees", rupee: "rupees", rupees: "rupees", chf: "Swiss francs", franc: "francs", francs: "francs", mxn: "pesos", peso: "pesos", pesos: "pesos", brl: "reais", zar: "rand", rand: "rand", rub: "rubles", ruble: "rubles", rubles: "rubles", cny: "yuan", yuan: "yuan" };
  const MINOR = { cent: "cents", cents: "cents", penny: "pence", pennies: "pence", pence: "pence", p: "pence", paisa: "paise", paise: "paise", centavo: "centavos", centavos: "centavos", kopek: "kopeks", kopeks: "kopeks", rappen: "rappen", fen: "fen" };
  const majorOf = (u) => MAJOR[u] || (u === "pound" || u === "pounds" ? "pounds sterling" : null);
  if ((majorOf(from) && MINOR[to]) || (MINOR[from] && majorOf(to))) {
    const toMinor = !!majorOf(from); const value = toMinor ? val * 100 : val / 100;
    return { ok: true, value: Math.round(value * 1e6) / 1e6, dim: "currency (subunit)", from, to, input: val, subunit: true };
  }
  // currency needs a live exchange rate, which this offline engine does not have
  const cur = (!a && CURRENCY.has(from)) ? from : (!b && CURRENCY.has(to)) ? to : null;
  if (cur) return { ok: false, error: "currency conversion needs today's exchange rate, and this engine runs offline with no live data; a bank or exchange site will have the current " + (CURRENCY.has(from) && CURRENCY.has(to) ? from.toUpperCase() + " to " + to.toUpperCase() : cur.toUpperCase()) + " rate" };
  if (!a || !b) return { ok: false, error: "unknown unit: " + (!a ? from : to) };
  // "ounces" next to a volume means fluid ounces ("how many ounces in a cup")
  const FLOZ = { dim: "volume", factor: 0.0295735295625 };
  if (a.dim === "mass" && b.dim === "volume" && /^(?:oz|ounces?)$/.test(from)) a = FLOZ;
  if (b.dim === "mass" && a.dim === "volume" && /^(?:oz|ounces?)$/.test(to)) b = FLOZ;
  if (a.dim !== b.dim) return { ok: false, error: "cannot convert " + a.dim + " to " + b.dim };
  const out = val * a.factor / b.factor;
  return { ok: true, value: Math.round(out * 1e9) / 1e9, dim: a.dim, from, to, input: val };
}

// ---------------------------------------------------------------------------
// codegen: program synthesis from a specification, into a chosen language. This
// generates real code by instantiating a language backend for a known operation
// (not by pasting a stored blob — the same op is emitted fresh per language, and
// the identifier name is taken from your request). Unknown ops get a correct,
// typed skeleton, and we say plainly that it is a scaffold.
// ---------------------------------------------------------------------------
const LANGS = { python: "python", py: "python", javascript: "javascript", js: "javascript", node: "javascript", typescript: "typescript", ts: "typescript", rust: "rust", rs: "rust", go: "go", golang: "go", java: "java", c: "c" };

const OPGEN = {
  factorial: {
    keys: ["factorial"], name: "factorial",
    python: (n) => `def ${n}(x):\n    result = 1\n    for i in range(2, x + 1):\n        result *= i\n    return result`,
    javascript: (n) => `function ${n}(x) {\n  let result = 1;\n  for (let i = 2; i <= x; i++) result *= i;\n  return result;\n}`,
    typescript: (n) => `function ${n}(x: number): number {\n  let result = 1;\n  for (let i = 2; i <= x; i++) result *= i;\n  return result;\n}`,
    rust: (n) => `fn ${n}(x: u64) -> u64 {\n    (2..=x).product::<u64>().max(1)\n}`,
    go: (n) => `func ${n}(x int) int {\n\tresult := 1\n\tfor i := 2; i <= x; i++ {\n\t\tresult *= i\n\t}\n\treturn result\n}`,
    java: (n) => `static long ${n}(int x) {\n    long result = 1;\n    for (int i = 2; i <= x; i++) result *= i;\n    return result;\n}`,
    c: (n) => `long ${n}(int x) {\n    long result = 1;\n    for (int i = 2; i <= x; i++) result *= i;\n    return result;\n}`,
  },
  fibonacci: {
    keys: ["fibonacci", "fib"], name: "fibonacci",
    python: (n) => `def ${n}(x):\n    a, b = 0, 1\n    for _ in range(x):\n        a, b = b, a + b\n    return a`,
    javascript: (n) => `function ${n}(x) {\n  let a = 0, b = 1;\n  for (let i = 0; i < x; i++) [a, b] = [b, a + b];\n  return a;\n}`,
    typescript: (n) => `function ${n}(x: number): number {\n  let a = 0, b = 1;\n  for (let i = 0; i < x; i++) [a, b] = [b, a + b];\n  return a;\n}`,
    rust: (n) => `fn ${n}(x: u32) -> u64 {\n    let (mut a, mut b) = (0u64, 1u64);\n    for _ in 0..x { let t = a + b; a = b; b = t; }\n    a\n}`,
    go: (n) => `func ${n}(x int) int {\n\ta, b := 0, 1\n\tfor i := 0; i < x; i++ {\n\t\ta, b = b, a+b\n\t}\n\treturn a\n}`,
    java: (n) => `static long ${n}(int x) {\n    long a = 0, b = 1;\n    for (int i = 0; i < x; i++) { long t = a + b; a = b; b = t; }\n    return a;\n}`,
    c: (n) => `long ${n}(int x) {\n    long a = 0, b = 1;\n    for (int i = 0; i < x; i++) { long t = a + b; a = b; b = t; }\n    return a;\n}`,
  },
  reverseString: {
    keys: ["reverse"], name: "reverseString",
    python: (n) => `def ${n}(s):\n    return s[::-1]`,
    javascript: (n) => `function ${n}(s) {\n  return [...s].reverse().join("");\n}`,
    typescript: (n) => `function ${n}(s: string): string {\n  return [...s].reverse().join("");\n}`,
    rust: (n) => `fn ${n}(s: &str) -> String {\n    s.chars().rev().collect()\n}`,
    go: (n) => `func ${n}(s string) string {\n\tr := []rune(s)\n\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n\t\tr[i], r[j] = r[j], r[i]\n\t}\n\treturn string(r)\n}`,
    java: (n) => `static String ${n}(String s) {\n    return new StringBuilder(s).reverse().toString();\n}`,
    c: (n) => `void ${n}(char *s) {\n    int i = 0, j = strlen(s) - 1;\n    while (i < j) { char t = s[i]; s[i++] = s[j]; s[j--] = t; }\n}`,
  },
  isPrime: {
    keys: ["prime"], name: "isPrime",
    python: (n) => `def ${n}(x):\n    if x < 2:\n        return False\n    i = 2\n    while i * i <= x:\n        if x % i == 0:\n            return False\n        i += 1\n    return True`,
    javascript: (n) => `function ${n}(x) {\n  if (x < 2) return false;\n  for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;\n  return true;\n}`,
    typescript: (n) => `function ${n}(x: number): boolean {\n  if (x < 2) return false;\n  for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;\n  return true;\n}`,
    rust: (n) => `fn ${n}(x: u64) -> bool {\n    if x < 2 { return false; }\n    let mut i = 2;\n    while i * i <= x { if x % i == 0 { return false; } i += 1; }\n    true\n}`,
    go: (n) => `func ${n}(x int) bool {\n\tif x < 2 {\n\t\treturn false\n\t}\n\tfor i := 2; i*i <= x; i++ {\n\t\tif x%i == 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
    java: (n) => `static boolean ${n}(long x) {\n    if (x < 2) return false;\n    for (long i = 2; i * i <= x; i++) if (x % i == 0) return false;\n    return true;\n}`,
    c: (n) => `int ${n}(long x) {\n    if (x < 2) return 0;\n    for (long i = 2; i * i <= x; i++) if (x % i == 0) return 0;\n    return 1;\n}`,
  },
  isPalindrome: {
    keys: ["palindrome"], name: "isPalindrome",
    python: (n) => `def ${n}(s):\n    s = "".join(c.lower() for c in s if c.isalnum())\n    return s == s[::-1]`,
    javascript: (n) => `function ${n}(s) {\n  const t = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return t === [...t].reverse().join("");\n}`,
    typescript: (n) => `function ${n}(s: string): boolean {\n  const t = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return t === [...t].reverse().join("");\n}`,
    rust: (n) => `fn ${n}(s: &str) -> bool {\n    let t: String = s.chars().filter(|c| c.is_alphanumeric()).map(|c| c.to_ascii_lowercase()).collect();\n    t == t.chars().rev().collect::<String>()\n}`,
    go: (n) => `func ${n}(s string) bool {\n\tr := []rune(strings.ToLower(s))\n\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n\t\tif r[i] != r[j] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
    java: (n) => `static boolean ${n}(String s) {\n    String t = s.toLowerCase().replaceAll("[^a-z0-9]", "");\n    return t.equals(new StringBuilder(t).reverse().toString());\n}`,
    c: (n) => `int ${n}(const char *s) {\n    int i = 0, j = strlen(s) - 1;\n    while (i < j) if (s[i++] != s[j--]) return 0;\n    return 1;\n}`,
  },
  fizzbuzz: {
    keys: ["fizzbuzz", "fizz buzz"], name: "fizzbuzz",
    python: (n) => `def ${n}(limit):\n    for i in range(1, limit + 1):\n        if i % 15 == 0:\n            print("FizzBuzz")\n        elif i % 3 == 0:\n            print("Fizz")\n        elif i % 5 == 0:\n            print("Buzz")\n        else:\n            print(i)`,
    javascript: (n) => `function ${n}(limit) {\n  for (let i = 1; i <= limit; i++) {\n    if (i % 15 === 0) console.log("FizzBuzz");\n    else if (i % 3 === 0) console.log("Fizz");\n    else if (i % 5 === 0) console.log("Buzz");\n    else console.log(i);\n  }\n}`,
    typescript: (n) => `function ${n}(limit: number): void {\n  for (let i = 1; i <= limit; i++) {\n    if (i % 15 === 0) console.log("FizzBuzz");\n    else if (i % 3 === 0) console.log("Fizz");\n    else if (i % 5 === 0) console.log("Buzz");\n    else console.log(i);\n  }\n}`,
    rust: (n) => `fn ${n}(limit: u32) {\n    for i in 1..=limit {\n        match (i % 3, i % 5) {\n            (0, 0) => println!("FizzBuzz"),\n            (0, _) => println!("Fizz"),\n            (_, 0) => println!("Buzz"),\n            _ => println!("{}", i),\n        }\n    }\n}`,
    go: (n) => `func ${n}(limit int) {\n\tfor i := 1; i <= limit; i++ {\n\t\tswitch {\n\t\tcase i%15 == 0:\n\t\t\tfmt.Println("FizzBuzz")\n\t\tcase i%3 == 0:\n\t\t\tfmt.Println("Fizz")\n\t\tcase i%5 == 0:\n\t\t\tfmt.Println("Buzz")\n\t\tdefault:\n\t\t\tfmt.Println(i)\n\t\t}\n\t}\n}`,
    java: (n) => `static void ${n}(int limit) {\n    for (int i = 1; i <= limit; i++) {\n        if (i % 15 == 0) System.out.println("FizzBuzz");\n        else if (i % 3 == 0) System.out.println("Fizz");\n        else if (i % 5 == 0) System.out.println("Buzz");\n        else System.out.println(i);\n    }\n}`,
    c: (n) => `void ${n}(int limit) {\n    for (int i = 1; i <= limit; i++) {\n        if (i % 15 == 0) printf("FizzBuzz\\n");\n        else if (i % 3 == 0) printf("Fizz\\n");\n        else if (i % 5 == 0) printf("Buzz\\n");\n        else printf("%d\\n", i);\n    }\n}`,
  },
  sumList: {
    keys: ["sum", "total", "add up"], name: "sumList",
    python: (n) => `def ${n}(items):\n    return sum(items)`,
    javascript: (n) => `function ${n}(items) {\n  return items.reduce((a, b) => a + b, 0);\n}`,
    typescript: (n) => `function ${n}(items: number[]): number {\n  return items.reduce((a, b) => a + b, 0);\n}`,
    rust: (n) => `fn ${n}(items: &[i64]) -> i64 {\n    items.iter().sum()\n}`,
    go: (n) => `func ${n}(items []int) int {\n\tsum := 0\n\tfor _, v := range items {\n\t\tsum += v\n\t}\n\treturn sum\n}`,
    java: (n) => `static long ${n}(int[] items) {\n    long sum = 0;\n    for (int v : items) sum += v;\n    return sum;\n}`,
    c: (n) => `long ${n}(int *items, int len) {\n    long sum = 0;\n    for (int i = 0; i < len; i++) sum += items[i];\n    return sum;\n}`,
  },
  gcd: {
    keys: ["gcd", "greatest common"], name: "gcd",
    python: (n) => `def ${n}(a, b):\n    while b:\n        a, b = b, a % b\n    return a`,
    javascript: (n) => `function ${n}(a, b) {\n  while (b) [a, b] = [b, a % b];\n  return a;\n}`,
    typescript: (n) => `function ${n}(a: number, b: number): number {\n  while (b) [a, b] = [b, a % b];\n  return a;\n}`,
    rust: (n) => `fn ${n}(mut a: u64, mut b: u64) -> u64 {\n    while b != 0 { let t = b; b = a % b; a = t; }\n    a\n}`,
    go: (n) => `func ${n}(a, b int) int {\n\tfor b != 0 {\n\t\ta, b = b, a%b\n\t}\n\treturn a\n}`,
    java: (n) => `static long ${n}(long a, long b) {\n    while (b != 0) { long t = b; b = a % b; a = t; }\n    return a;\n}`,
    c: (n) => `long ${n}(long a, long b) {\n    while (b) { long t = b; b = a % b; a = t; }\n    return a;\n}`,
  },
  binarySearch: {
    keys: ["binary search", "bsearch"], name: "binarySearch",
    python: (n) => `def ${n}(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target:\n            return mid\n        if arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1`,
    javascript: (n) => `function ${n}(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}`,
    typescript: (n) => `function ${n}(arr: number[], target: number): number {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}`,
    rust: (n) => `fn ${n}(arr: &[i64], target: i64) -> i64 {\n    let (mut lo, mut hi) = (0i64, arr.len() as i64 - 1);\n    while lo <= hi {\n        let mid = (lo + hi) / 2;\n        let v = arr[mid as usize];\n        if v == target { return mid; }\n        if v < target { lo = mid + 1; } else { hi = mid - 1; }\n    }\n    -1\n}`,
    go: (n) => `func ${n}(arr []int, target int) int {\n\tlo, hi := 0, len(arr)-1\n\tfor lo <= hi {\n\t\tmid := (lo + hi) / 2\n\t\tif arr[mid] == target {\n\t\t\treturn mid\n\t\t}\n\t\tif arr[mid] < target {\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn -1\n}`,
    java: (n) => `static int ${n}(int[] arr, int target) {\n    int lo = 0, hi = arr.length - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) >>> 1;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}`,
    c: (n) => `int ${n}(int *arr, int len, int target) {\n    int lo = 0, hi = len - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}`,
  },
  bubbleSort: {
    keys: ["bubble sort", "bubblesort", "sort"], name: "bubbleSort",
    python: (n) => `def ${n}(arr):\n    a = list(arr)\n    for i in range(len(a)):\n        for j in range(len(a) - i - 1):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n    return a`,
    javascript: (n) => `function ${n}(arr) {\n  const a = arr.slice();\n  for (let i = 0; i < a.length; i++)\n    for (let j = 0; j < a.length - i - 1; j++)\n      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];\n  return a;\n}`,
    typescript: (n) => `function ${n}(arr: number[]): number[] {\n  const a = arr.slice();\n  for (let i = 0; i < a.length; i++)\n    for (let j = 0; j < a.length - i - 1; j++)\n      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];\n  return a;\n}`,
    rust: (n) => `fn ${n}(input: &[i64]) -> Vec<i64> {\n    let mut a = input.to_vec();\n    let len = a.len();\n    for i in 0..len {\n        for j in 0..len - i - 1 {\n            if a[j] > a[j + 1] { a.swap(j, j + 1); }\n        }\n    }\n    a\n}`,
    go: (n) => `func ${n}(input []int) []int {\n\ta := append([]int(nil), input...)\n\tfor i := 0; i < len(a); i++ {\n\t\tfor j := 0; j < len(a)-i-1; j++ {\n\t\t\tif a[j] > a[j+1] {\n\t\t\t\ta[j], a[j+1] = a[j+1], a[j]\n\t\t\t}\n\t\t}\n\t}\n\treturn a\n}`,
    java: (n) => `static int[] ${n}(int[] input) {\n    int[] a = input.clone();\n    for (int i = 0; i < a.length; i++)\n        for (int j = 0; j < a.length - i - 1; j++)\n            if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }\n    return a;\n}`,
    c: (n) => `void ${n}(int *a, int len) {\n    for (int i = 0; i < len; i++)\n        for (int j = 0; j < len - i - 1; j++)\n            if (a[j] > a[j + 1]) { int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t; }\n}`,
  },
  celsiusToFahrenheit: {
    keys: ["celsius", "fahrenheit", "c to f"], name: "celsiusToFahrenheit",
    python: (n) => `def ${n}(c):\n    return c * 9 / 5 + 32`,
    javascript: (n) => `function ${n}(c) {\n  return c * 9 / 5 + 32;\n}`,
    typescript: (n) => `function ${n}(c: number): number {\n  return c * 9 / 5 + 32;\n}`,
    rust: (n) => `fn ${n}(c: f64) -> f64 {\n    c * 9.0 / 5.0 + 32.0\n}`,
    go: (n) => `func ${n}(c float64) float64 {\n\treturn c*9/5 + 32\n}`,
    java: (n) => `static double ${n}(double c) {\n    return c * 9 / 5 + 32;\n}`,
    c: (n) => `double ${n}(double c) {\n    return c * 9 / 5 + 32;\n}`,
  },
  average: {
    keys: ["average", "mean of"], name: "average",
    python: (n) => `def ${n}(items):\n    return sum(items) / len(items)`,
    javascript: (n) => `function ${n}(items) {\n  return items.reduce((a, b) => a + b, 0) / items.length;\n}`,
    typescript: (n) => `function ${n}(items: number[]): number {\n  return items.reduce((a, b) => a + b, 0) / items.length;\n}`,
    rust: (n) => `fn ${n}(items: &[f64]) -> f64 {\n    items.iter().sum::<f64>() / items.len() as f64\n}`,
    go: (n) => `func ${n}(items []float64) float64 {\n\tsum := 0.0\n\tfor _, v := range items {\n\t\tsum += v\n\t}\n\treturn sum / float64(len(items))\n}`,
    java: (n) => `static double ${n}(double[] items) {\n    double sum = 0;\n    for (double v : items) sum += v;\n    return sum / items.length;\n}`,
    c: (n) => `double ${n}(double *items, int len) {\n    double sum = 0;\n    for (int i = 0; i < len; i++) sum += items[i];\n    return sum / len;\n}`,
  },
};

const camel = (s) => { const p = s.trim().split(/[^a-z0-9]+/i).filter(Boolean); return p.length ? p[0].toLowerCase() + p.slice(1).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("") : "solve"; };
const snake = (s) => camel(s).replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());

// Translate a single-variable arithmetic expression into a real function body in the
// target language. Small integer powers are expanded to multiplication so the result
// is portable; anything left is handled per language. Returns null if it is not a
// clean single-variable formula (so codegen falls back to a skeleton).
function synthExpr(rawExpr, lang, ctx) {
  let e = rawExpr.replace(/\s+/g, "");
  if (!e || !/[-+*/^]/.test(e)) return null;                 // must actually be a formula
  const vars = [...new Set((e.match(/[a-z]+/g) || []).filter((w) => w !== "pi" && w !== "e"))];
  if (vars.length > 1) return null;                          // only single-variable formulas
  const vn = vars[0] || "x";
  e = e.replace(/([0-9.)])([a-z(])/g, "$1*$2").replace(/\)([0-9a-z(])/g, ")*$1"); // implicit mult
  // expand base^n (n a small integer) to repeated multiplication
  let prev; do { prev = e; e = e.replace(/([a-z][a-z0-9]*|\d+(?:\.\d+)?)\^(\d+)/g, (m, b, p) => { p = +p; return (p >= 1 && p <= 6) ? "(" + Array(p).fill(b).join("*") + ")" : m; }); } while (e !== prev);
  let warn = "";
  if (e.includes("^")) {
    if (lang === "python" || lang === "javascript" || lang === "typescript") e = e.replace(/\^/g, "**");
    else { warn = " (note: a large/non-integer power remained as '^'; replace with the language's power operator)"; }
  }
  if (!/^[-+*/().0-9a-z*]+$/.test(e.replace(/\*\*/g, ""))) return null;
  const b = { python: `def f(${vn}):\n    return ${e}`,
    javascript: `function f(${vn}) {\n  return ${e};\n}`,
    typescript: `function f(${vn}: number): number {\n  return ${e};\n}`,
    rust: `fn f(${vn}: f64) -> f64 {\n    ${e}\n}`,
    go: `func f(${vn} float64) float64 {\n\treturn ${e}\n}`,
    java: `static double f(double ${vn}) {\n    return ${e};\n}`,
    c: `double f(double ${vn}) {\n    return ${e};\n}` };
  return { code: b[lang], expr: e, warn };
}

export function codegen(input) {
  const raw = String(input || "").trim();
  const low = raw.toLowerCase();

  // detect language (default python)
  let lang = "python";
  for (const k in LANGS) { const re = new RegExp("\\b" + k + "\\b"); if (re.test(low)) { lang = LANGS[k]; break; } }
  // detect operation
  let op = null;
  for (const id in OPGEN) { if (OPGEN[id].keys.some((k) => low.includes(k))) { op = OPGEN[id]; break; } }
  if (op) {
    // idiomatic naming per language: snake_case for python/c/rust, camelCase elsewhere (go uses MixedCaps, not snake)
    const name = (lang === "python" || lang === "c" || lang === "rust") ? snake(op.name) : op.name;
    const code = op[lang](name);
    return { ok: true, kind: "synthesized", lang, op: op.name, code, note: "Generated from scratch for " + lang + " (verified pattern), function name: " + name + "." };
  }
  // expression synthesis: "a function f(x) = 3x^2 - 2x + 1" / "returns x*2+3" -> real code
  const cleaned = low.replace(/\bin\s+(python|javascript|js|typescript|ts|rust|go|golang|java|c)\b/g, " ");
  const em = cleaned.match(/(?:=|returns?|compute[s]?|gives?|equals?|:)\s*([-+*/^().0-9a-z\s]+)$/);
  if (em) {
    const synth = synthExpr(em[1], lang, low);
    if (synth) return { ok: true, kind: "synthesized", lang, op: "expression", code: synth.code, note: "Synthesized a function that computes " + synth.expr + " from scratch for " + lang + "." + (synth.warn || "") };
  }
  // unknown op -> correct typed skeleton (honest scaffold)
  const nameMatch = low.match(/(?:function|func|method|routine)\s+(?:called\s+|named\s+)?([a-z][a-z0-9_ ]{0,30})/) || low.match(/\bthat\s+([a-z][a-z0-9_ ]{0,30})/);
  const base = nameMatch ? nameMatch[1] : "solve";
  const nC = camel(base), nS = snake(base);
  const skel = {
    python: `def ${nS}(*args):\n    # TODO: ${raw.replace(/\n/g, " ")}\n    raise NotImplementedError`,
    javascript: `function ${nC}(...args) {\n  // TODO: ${raw.replace(/\n/g, " ")}\n  throw new Error("not implemented");\n}`,
    typescript: `function ${nC}(...args: unknown[]): unknown {\n  // TODO: ${raw.replace(/\n/g, " ")}\n  throw new Error("not implemented");\n}`,
    rust: `fn ${nS}() {\n    // TODO: ${raw.replace(/\n/g, " ")}\n    unimplemented!()\n}`,
    go: `func ${nC}() {\n\t// TODO: ${raw.replace(/\n/g, " ")}\n\tpanic("not implemented")\n}`,
    java: `static Object ${nC}(Object... args) {\n    // TODO: ${raw.replace(/\n/g, " ")}\n    throw new UnsupportedOperationException();\n}`,
    c: `void ${nS}(void) {\n    /* TODO: ${raw.replace(/\n/g, " ")} */\n}`,
  };
  return { ok: true, kind: "skeleton", lang, code: skel[lang], note: "No exact synthesis rule matched, so this is a correct, typed scaffold. Give a specific known task (factorial, fibonacci, reverse, prime, palindrome, fizzbuzz, sum), a formula like f(x) = 3x^2 + 1, or one of the ready programs (snake, tic-tac-toe, to-do app, calculator, HTTP server, linked list, quicksort, ...) for a full implementation." };
}

// ---------------------------------------------------------------------------
// text: deterministic string transforms.
// ---------------------------------------------------------------------------
function b64encode(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (_) { return Buffer.from(s, "utf8").toString("base64"); } }
function b64decode(s) { try { return decodeURIComponent(escape(atob(s))); } catch (_) { return Buffer.from(s, "base64").toString("utf8"); } }

export function text(op, s) {
  s = String(s == null ? "" : s);
  switch (op) {
    case "upper": return s.toUpperCase();
    case "lower": return s.toLowerCase();
    case "title": return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "reverse": return [...s].reverse().join("");
    case "palindrome": { const k = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return k && k === [...k].reverse().join("") ? "yes, \u201c" + s + "\u201d is a palindrome (it reads the same backwards, ignoring spaces and punctuation)" : "no, \u201c" + s + "\u201d is not a palindrome (backwards it is \u201c" + [...s].reverse().join("") + "\u201d)"; }
    case "slug": return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    case "words": return s.trim() ? s.trim().split(/\s+/).length : 0;
    case "chars": return [...s].length;
    case "letters": return [...s].filter((c) => /\p{L}/u.test(c)).length;
    case "lines": return s.split(/\n/).length;
    case "sortlines": return s.split(/\n/).sort().join("\n");
    case "dedupewords": { const seen = new Set(); return s.split(/\s+/).filter((w) => { const k = w.toLowerCase(); if (!w || seen.has(k)) return false; seen.add(k); return true; }).join(" "); }
    case "dedupe": return /\n/.test(s) || !/[\s,]/.test(s.trim()) ? [...new Set(s.split(/\n/))].join("\n") : [...new Set(s.trim().split(/\s*,\s*|\s+/))].join(/,/.test(s) ? ", " : " ");
    case "reversewords": return s.trim().split(/\s+/).reverse().join(" ");
    case "base64": return b64encode(s);
    case "unbase64": return b64decode(s);
    case "json": try { return JSON.stringify(JSON.parse(s), null, 2); } catch (e) { return "invalid JSON: " + e.message; }
    case "camel": { const p = s.split(/[^a-z0-9]+/i).filter(Boolean); return p.length ? p[0].toLowerCase() + p.slice(1).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("") : ""; }
    case "snake": return s.trim().split(/[^a-z0-9]+/i).filter(Boolean).join("_").toLowerCase();
    case "kebab": return s.trim().split(/[^a-z0-9]+/i).filter(Boolean).join("-").toLowerCase();
    case "constant": return s.trim().split(/[^a-z0-9]+/i).filter(Boolean).join("_").toUpperCase();
    case "wordfreq": {
      const f = new Map(); for (const w of (s.toLowerCase().match(/[a-z0-9']+/g) || [])) f.set(w, (f.get(w) || 0) + 1);
      return [...f.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 15).map(([w, c]) => c + "\t" + w).join("\n");
    }
    case "emails": return [...new Set(s.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [])].join("\n");
    case "urls": return [...new Set(s.match(/https?:\/\/[^\s"'<>)]+/gi) || [])].join("\n");
    case "numbers": return (s.match(/-?\d+(?:\.\d+)?/g) || []).join("\n");
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// regex: a curated pattern builder (keyword -> tested regex + explanation).
// ---------------------------------------------------------------------------
const PATTERNS = {
  email: { re: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}", desc: "matches an email address" },
  url: { re: "https?://[\\w.-]+(?:/[\\w./%?=&#-]*)?", desc: "matches an http or https URL" },
  ipv4: { re: "\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b", desc: "matches an IPv4 address" },
  phone: { re: "\\+?\\d[\\d ().-]{7,}\\d", desc: "matches a phone number" },
  hex: { re: "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b", desc: "matches a hex color" },
  date: { re: "\\d{4}-\\d{2}-\\d{2}", desc: "matches an ISO date (YYYY-MM-DD)" },
  digits: { re: "\\d+", desc: "matches one or more digits" },
  word: { re: "\\b\\w+\\b", desc: "matches a word" },
  uuid: { re: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", desc: "matches a UUID" },
  mac: { re: "(?:[0-9a-f]{2}:){5}[0-9a-f]{2}", desc: "matches a MAC address" },
  time: { re: "([01]?\\d|2[0-3]):[0-5]\\d", desc: "matches a 24-hour time (HH:MM)" },
  float: { re: "-?\\d+\\.\\d+", desc: "matches a decimal number" },
  slug: { re: "[a-z0-9]+(?:-[a-z0-9]+)*", desc: "matches a url slug" },
};
export function regexBuild(input) {
  const low = String(input || "").toLowerCase();
  for (const key in PATTERNS) if (low.includes(key)) return { ok: true, key, ...PATTERNS[key] };
  if (/\bips?\b|ip address/.test(low)) return { ok: true, key: "ipv4", ...PATTERNS.ipv4 };
  return { ok: false, error: "no pattern for that. known: " + Object.keys(PATTERNS).join(", ") };
}

// Test a regex against sample text. Returns the matches (deterministic, capped).
export function regexTest(pattern, sample) {
  let re;
  try { re = new RegExp(pattern, "g"); } catch (e) { return { ok: false, error: "invalid regex: " + e.message }; }
  const matches = [];
  let m, guard = 0;
  while ((m = re.exec(String(sample || ""))) && guard++ < 500) { matches.push(m[0]); if (m.index === re.lastIndex) re.lastIndex++; }
  return { ok: true, pattern, count: matches.length, matches: matches.slice(0, 50), matched: matches.length > 0 };
}

// ---------------------------------------------------------------------------
// datetime: deterministic date math (no timezone guessing; UTC).
// ---------------------------------------------------------------------------
const DAYNAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// a real calendar date only: "2024-02-30" and "2024-13-45" are rejected, not rolled over
function parseISO(s) { const m = String(s).match(/(\d{4})-(\d{1,2})-(\d{1,2})/); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : null; }
// Holidays: fixed [month, day], or a rule for the movable ones (nth weekday of a month, last weekday, an offset from
// Easter Sunday). US observances where countries differ; the answer says so. holidayDate(name, year) -> UTC Date or null.
const HOLIDAYS = { "christmas eve": [12, 24], "christmas": [12, 25], "christmas day": [12, 25], "boxing day": [12, 26], "new year's eve": [12, 31], "new years eve": [12, 31], "new year's day": [1, 1], "new years day": [1, 1], "new year": [1, 1], "new years": [1, 1],
  "halloween": [10, 31], "valentine's day": [2, 14], "valentines day": [2, 14], "valentines": [2, 14], "april fools": [4, 1], "april fools day": [4, 1], "independence day": [7, 4], "fourth of july": [7, 4], "4th of july": [7, 4],
  "st patrick's day": [3, 17], "st patricks day": [3, 17], "saint patrick's day": [3, 17], "earth day": [4, 22], "juneteenth": [6, 19], "veterans day": [11, 11], "cinco de mayo": [5, 5], "pi day": [3, 14], "groundhog day": [2, 2], "leap day": [2, 29],
  "thanksgiving": { nth: [11, 4, 4], note: "US" }, "thanksgiving day": { nth: [11, 4, 4], note: "US" }, "canadian thanksgiving": { nth: [10, 1, 2] }, "black friday": { nth: [11, 4, 4], plus: 1 }, "cyber monday": { nth: [11, 4, 4], plus: 4 },
  "mother's day": { nth: [5, 0, 2], note: "US" }, "mothers day": { nth: [5, 0, 2], note: "US" }, "father's day": { nth: [6, 0, 3], note: "US" }, "fathers day": { nth: [6, 0, 3], note: "US" },
  "labor day": { nth: [9, 1, 1], note: "US" }, "memorial day": { last: [5, 1] }, "mlk day": { nth: [1, 1, 3] }, "martin luther king day": { nth: [1, 1, 3] }, "presidents day": { nth: [2, 1, 3] }, "presidents' day": { nth: [2, 1, 3] }, "columbus day": { nth: [10, 1, 2] }, "indigenous peoples day": { nth: [10, 1, 2] },
  "easter": { easter: 0 }, "easter sunday": { easter: 0 }, "good friday": { easter: -2 }, "easter monday": { easter: 1 }, "palm sunday": { easter: -7 }, "ash wednesday": { easter: -46 }, "mardi gras": { easter: -47 }, "shrove tuesday": { easter: -47 }, "pentecost": { easter: 49 }, "ascension day": { easter: 39 } };
function easterSunday(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451); const mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(Date.UTC(y, mo - 1, da)); }
export function holidayDate(name, year) {
  const r = HOLIDAYS[String(name || "").toLowerCase()]; if (!r || !(year >= 1583 && year <= 9999)) return null;
  if (Array.isArray(r)) { if (r[0] === 2 && r[1] === 29 && !(year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))) return null; return new Date(Date.UTC(year, r[0] - 1, r[1])); }
  let d = null;
  if (r.nth) { const [mo, wd, n] = r.nth; const first = new Date(Date.UTC(year, mo - 1, 1)); d = new Date(Date.UTC(year, mo - 1, 1 + ((wd - first.getUTCDay() + 7) % 7) + 7 * (n - 1))); if (d.getUTCMonth() !== mo - 1) return null; }
  else if (r.last) { const [mo, wd] = r.last; const last = new Date(Date.UTC(year, mo, 0)); d = new Date(Date.UTC(year, mo - 1, last.getUTCDate() - ((last.getUTCDay() - wd + 7) % 7))); }
  else if (r.easter !== undefined) { d = easterSunday(year); d = new Date(d.getTime() + r.easter * 86400000); }
  if (d && r.plus) d = new Date(d.getTime() + r.plus * 86400000);
  return d;
}
export const holidayNote = (name) => { const r = HOLIDAYS[String(name || "").toLowerCase()]; return r && !Array.isArray(r) && r.note ? r.note : null; };
export function datetime(input) {
  const low = String(input || "").toLowerCase();
  const isoAll = low.match(/\d{4}-\d{1,2}-\d{1,2}/g) || [];
  const bad = isoAll.find((d) => !parseISO(d));
  if (bad) return { ok: false, error: bad + " is not a real calendar date" };
  const dates = isoAll.map(parseISO);
  const nowY = new Date().getUTCFullYear();
  if (/^(?:what|which)\s+year\s+is\s+(?:it|this)(?:\s+now)?\s*$|^(?:what is |whats )?(?:the )?current year\s*$/.test(low.replace(/[?.!]/g, "").trim())) return { ok: true, kind: "year", text: "It is " + nowY + " (by this device's clock, UTC)" };
  if (/^(?:what is |whats |what's )?(?:the )?(?:date )?today(?:'s date)?\s*$|^(?:what is |whats |what's )(?:the )?date(?: today)?\s*$|^what day is (?:it|today)\s*$/.test(low.replace(/[?.!]/g, "").trim())) { const d = new Date(); return { ok: true, kind: "today", text: "Today is " + DAYNAMES[d.getUTCDay()] + ", " + d.toISOString().slice(0, 10) + " (UTC)" }; }
  // "when is 2027-03-28" (the rephrase pass turns "easter 2027" into its date first): the weekday and how far away
  const whenIso = /^(?:when (?:is|was|will be)|what date is)\s+(?:the )?(\d{4}-\d{1,2}-\d{1,2})\s*$/.exec(low.replace(/[?.!]/g, "").trim());
  if (whenIso) {
    const d = parseISO(whenIso[1]), now = new Date(), today0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()), diff = Math.round((d.getTime() - today0) / 86400000);
    return { ok: true, kind: "holiday", date: whenIso[1], weekday: DAYNAMES[d.getUTCDay()], text: whenIso[1] + " is a " + DAYNAMES[d.getUTCDay()] + (diff === 0 ? " (today)" : diff > 0 ? " (in " + diff + " day" + (diff === 1 ? "" : "s") + ")" : " (" + -diff + " day" + (diff === -1 ? "" : "s") + " ago)") };
  }
  // "when is easter 2027" / "what day is thanksgiving" / "mother's day this year" -> the date, its weekday and (when no
  // year was given) how far away it is. Movable feasts come from holidayDate(); the US ones say so.
  const whenH = /^(?:when (?:is|was|will be|does|do)|what (?:day|date) (?:is|was|will be|does|do)|which day (?:is|was|does)|what is the date (?:of|for)|date of|date for)?\s*(?:the )?([a-z' ]+?)(?:\s+(?:fall|falls|land|lands|happen|happens|take place|occur|occurs))?(?:\s+(?:on|in))?(?:\s+(this year|next year|last year|(\d{4})))?\s*$/.exec(low.replace(/[?.!]/g, "").trim());
  if (whenH && HOLIDAYS[whenH[1].trim()] && (whenH[0].includes(" is ") || whenH[0].includes(" was ") || whenH[2] || /^(?:when|what|which|date)/.test(low))) {
    const name = whenH[1].trim(), now = new Date(), today0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    let y = whenH[3] ? +whenH[3] : whenH[2] === "next year" ? nowY + 1 : whenH[2] === "last year" ? nowY - 1 : nowY, d = holidayDate(name, y);
    if (!whenH[2] && d && d.getTime() < today0) { y += 1; d = holidayDate(name, y); }
    if (!d && /leap day/.test(name)) { if (whenH[2]) return { ok: true, kind: "holiday", text: "There is no leap day in " + y + " (not a leap year)" }; for (let k = 1; k <= 8 && !d; k++) d = holidayDate(name, y + k); if (d) y = d.getUTCFullYear(); }
    if (!d) return { ok: false, error: "no date for " + name + " in " + y };
    const iso2 = d.toISOString().slice(0, 10), diff = Math.round((d.getTime() - today0) / 86400000), note = holidayNote(name);
    const cap = name.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/'S\b/g, "'s").replace(/\bMlk\b/, "MLK").replace(/\bSt\b/, "St.");
    return { ok: true, kind: "holiday", name, date: iso2, weekday: DAYNAMES[d.getUTCDay()], text: cap + (whenH[3] ? " " + y : "") + " is on " + DAYNAMES[d.getUTCDay()] + ", " + iso2 + (whenH[2] ? "" : diff === 0 ? " (today)" : " (in " + diff + " day" + (diff === 1 ? "" : "s") + ")") + (note ? ". That is the " + note + " date; other countries differ" : "") };
  }
  // "how many working days in 2026" / "weekends in 2026": counted from the calendar, not estimated
  const wk = /\b(working days|work days|business days|weekdays|weekend days|weekends|saturdays|sundays|mondays|tuesdays|wednesdays|thursdays|fridays)\b.*?\b(?:in|during|for)\s+(?:the year\s+)?(\d{4}|this year|next year|a year|the year)\b/.exec(low);
  if (wk) {
    const y = /\d{4}/.test(wk[2]) ? +wk[2] : wk[2] === "next year" ? nowY + 1 : nowY, days = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365;
    const counts = [0, 0, 0, 0, 0, 0, 0]; for (let i = 0; i < days; i++) counts[new Date(Date.UTC(y, 0, 1 + i)).getUTCDay()]++;
    const what = wk[1]; const generic = /^(?:a year|the year)$/.test(wk[2]) ? " (using " + y + "; a year has 52 of each weekday plus 1 or 2 extra days)" : "";
    const one = { saturdays: 6, sundays: 0, mondays: 1, tuesdays: 2, wednesdays: 3, thursdays: 4, fridays: 5 }[what];
    if (one !== undefined) return { ok: true, kind: "yeardays", value: counts[one], text: y + " has " + counts[one] + " " + what + generic };
    const wkd = counts[1] + counts[2] + counts[3] + counts[4] + counts[5], wke = counts[0] + counts[6];
    if (/weekends$/.test(what)) return { ok: true, kind: "yeardays", value: counts[6], text: y + " has " + counts[6] + " weekends (" + counts[6] + " Saturdays and " + counts[0] + " Sundays, " + wke + " weekend days)" + generic };
    if (/weekend days/.test(what)) return { ok: true, kind: "yeardays", value: wke, text: y + " has " + wke + " weekend days (" + counts[6] + " Saturdays and " + counts[0] + " Sundays)" + generic };
    return { ok: true, kind: "yeardays", value: wkd, text: y + " has " + wkd + " weekdays (Monday to Friday) out of " + days + " days; public holidays are not subtracted, since they differ by country" + generic };
  }
  const bornOn = /\bborn (?:on )?(\d{4}-\d{1,2}-\d{1,2})\b/.exec(low);
  if (bornOn && /how old|\bage\b|years old/.test(low)) {
    const b = parseISO(bornOn[1]), now = new Date();
    if (b.getTime() > Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) return { ok: false, error: bornOn[1] + " is in the future" };
    let a = now.getUTCFullYear() - b.getUTCFullYear();
    const hadBirthday = now.getUTCMonth() > b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() >= b.getUTCDate());
    if (!hadBirthday) a -= 1;
    const next = new Date(Date.UTC(now.getUTCFullYear() + (hadBirthday ? 1 : 0), b.getUTCMonth(), b.getUTCDate()));
    const toNext = Math.round((next.getTime() - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86400000);
    return { ok: true, kind: "age", value: a, text: "Someone born on " + bornOn[1] + " is " + a + " years old today (" + (toNext === 0 ? "it is their birthday today" : "turns " + (a + 1) + " in " + toNext + " day" + (toNext === 1 ? "" : "s")) + ")" };
  }
  const born = low.match(/\bborn in (\d{4})\b/) || low.match(/\bage (?:of )?(?:someone |a person )?(?:born )?(?:in )?(\d{4})\b/);
  if (born && /how old|age/.test(low)) { const y = +born[1], a = nowY - y; if (a < 0) return { ok: false, error: y + " is in the future" }; return { ok: true, kind: "age", value: a, text: "Someone born in " + y + " is " + (a - 1) + " or " + a + " in " + nowY + " (" + a + " once their birthday has passed this year)" }; }
  // today's place in the year, ISO week, quarter; unix time both ways; this device's zone
  const trimmed = low.replace(/[?.!]/g, "").trim();
  if (/^(?:how many )?days? (?:are )?(?:left|remaining|to go) (?:in|of) (?:the|this) year$|^days? (?:until|till) (?:the )?(?:end of (?:the|this) year|new year)$/.test(trimmed) || /^(?:how many )?days? (?:have )?(?:passed|gone|elapsed) (?:so far )?(?:this year|in the year)$|^(?:what|which) day of the year is (?:it|today)$|^day of (?:the )?year(?: today)?$/.test(trimmed)) {
    const now = new Date(), y = now.getUTCFullYear(), today0 = Date.UTC(y, now.getUTCMonth(), now.getUTCDate());
    const doy = Math.round((today0 - Date.UTC(y, 0, 0)) / 86400000), total = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365, left = total - doy;
    const askLeft = /left|remaining|to go|until|till/.test(trimmed);
    return { ok: true, kind: "yearpos", value: askLeft ? left : doy, text: askLeft ? left + " days left in " + y + " after today (today is day " + doy + " of " + total + ")" : "Today is day " + doy + " of " + y + " (" + (doy - 1) + " full days have passed, " + left + " remain after today)" };
  }
  if (/^(?:what|which) (?:iso )?week(?: number| of the year)? (?:is it|is this|are we in|is today)$|^(?:current |this )?(?:iso )?week number$/.test(trimmed)) {
    const now = new Date(), d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week decides the ISO year
    const y = d.getUTCFullYear(), wk = Math.ceil(((d - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
    return { ok: true, kind: "week", value: wk, text: "It is ISO week " + wk + " of " + y + " (weeks start on Monday; week 1 holds the year's first Thursday)" };
  }
  if (/^(?:what|which) (?:fiscal |calendar )?quarter (?:is it|is this|are we in|of the year is it)$|^(?:current |this )?quarter$/.test(trimmed)) {
    const now = new Date(), q = Math.floor(now.getUTCMonth() / 3) + 1, ends = [[3, 31], [6, 30], [9, 30], [12, 31]][q - 1];
    return { ok: true, kind: "quarter", value: q, text: "It is Q" + q + " of " + now.getUTCFullYear() + " (calendar quarters: Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec); this quarter ends " + now.getUTCFullYear() + "-" + String(ends[0]).padStart(2, "0") + "-" + ends[1] + ". A company's fiscal quarters may differ." };
  }
  if (/^(?:what is |whats |what's )?(?:the )?(?:current |present )?(?:unix|epoch|posix)(?: time(?:stamp)?| timestamp| seconds)?(?: now| right now)?$|^(?:what is |whats |what's )?(?:the )?(?:unix|epoch)?\s*timestamp(?: now| right now| for now)?$|^seconds since (?:the )?epoch$/.test(trimmed)) {
    const t = Date.now(); return { ok: true, kind: "epoch", value: Math.floor(t / 1000), text: "Unix time is " + Math.floor(t / 1000) + " seconds (" + t + " ms) since 1970-01-01T00:00:00Z, which is " + new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") + " now" };
  }
  const ep = trimmed.match(/^(?:what (?:is|date is|time is) |whats |what's |convert )?(?:the )?(?:unix |epoch |posix )?(?:time(?:stamp)? |timestamp |epoch |unix time )?(\d{9,13})(?: (?:to|as|in) (?:a )?(?:date|datetime|human(?: readable)?(?: date| time)?|iso|utc|time|readable))?$/) || trimmed.match(/^(?:what (?:date|time) is |convert )?(?:epoch|unix(?: time(?:stamp)?)?|timestamp) (\d{9,13})$/);
  if (ep) {
    const n = +ep[1], ms = ep[1].length >= 12 ? n : n * 1000, d = new Date(ms);
    return { ok: true, kind: "epoch", value: ms / 1000, text: (ep[1].length >= 12 ? "Unix time " + n + " ms" : "Unix time " + n) + " is " + d.toISOString().replace(/\.\d{3}Z$/, "Z") + " (" + DAYNAMES[d.getUTCDay()] + ", UTC)" + (ep[1].length >= 12 ? "" : "; read as seconds since 1970-01-01") };
  }
  const toEp = trimmed.match(/^(?:what is |whats |what's |convert )?(?:the )?(?:unix|epoch|posix)(?: time(?:stamp)?| timestamp)? (?:of|for) (\d{4}-\d{1,2}-\d{1,2})(?:[t ](\d{1,2}):(\d{2})(?::(\d{2}))?)?(?: utc| z)?$/) || trimmed.match(/^(\d{4}-\d{1,2}-\d{1,2})(?:[t ](\d{1,2}):(\d{2})(?::(\d{2}))?)? (?:to|as|in) (?:unix|epoch|posix|a timestamp|unix time|epoch time|unix timestamp)$/);
  if (toEp) {
    const d = parseISO(toEp[1]); if (!d) return { ok: false, error: toEp[1] + " is not a real calendar date" };
    const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), +(toEp[2] || 0), +(toEp[3] || 0), +(toEp[4] || 0));
    return { ok: true, kind: "epoch", value: t / 1000, text: new Date(t).toISOString().replace(/\.\d{3}Z$/, "Z") + " is Unix time " + t / 1000 + " (" + t + " ms), taking the time as UTC" };
  }
  if (/^(?:what is |whats |what's )?(?:my|the|this device'?s?|the current|the local) (?:time ?zone|tz)(?: here)?$|^(?:what|which) (?:time ?zone) am i in$|^(?:what is |whats |what's )?(?:my )?utc offset$/.test(trimmed)) {
    let zone = ""; try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
    const off = -new Date().getTimezoneOffset(), sign = off >= 0 ? "+" : "-", hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0"), mm = String(Math.abs(off) % 60).padStart(2, "0");
    return { ok: true, kind: "tz", value: zone || ("UTC" + sign + hh + ":" + mm), text: "This device's clock is set to " + (zone ? zone + " " : "") + "(UTC" + sign + hh + ":" + mm + " right now)" + (zone ? "" : "; the browser did not report a zone name") };
  }
  // "how many days are in february 2024": month length, leap years included
  const MN = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dim = low.match(/\bdays?\s+(?:are\s+|is\s+)?(?:there\s+)?in\s+(?:the\s+month\s+of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s+(?:of\s+)?(\d{4}))?/);
  if (dim) {
    const y = dim[2] ? +dim[2] : new Date().getUTCFullYear(), m = MN.indexOf(dim[1]);
    const n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const name = dim[1].charAt(0).toUpperCase() + ["anuary", "ebruary", "arch", "pril", "ay", "une", "uly", "ugust", "eptember", "ctober", "ovember", "ecember"][m];
    return { ok: true, kind: "monthdays", value: n, text: name + " " + y + " has " + n + " days" };
  }
  const dyr = low.match(/\bdays?\s+(?:are\s+)?(?:there\s+)?in\s+(?:the\s+year\s+)?(\d{4})\b/);
  if (dyr) { const y = +dyr[1], n = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365; return { ok: true, kind: "yeardays", value: n, text: y + " has " + n + " days" }; }
  // "what day is 90 days from today", "in 3 weeks", "2 months ago", "what date is 45 days from now"
  const relN = low.match(/\b(\d{1,4})\s+(days?|weeks?|months?|years?)\s+(from|after|before|ago)(?:\s+(?:today|now))?\b/) || low.match(/\bin\s+(\d{1,4})\s+(days?|weeks?|months?|years?)\b/);
  if (relN && !dates.length && !/\b(?:add|subtract|until|till|between|how many|how much)\b/.test(low)) {
    const n = +relN[1], unit = relN[2], dir = relN[3] === "before" || relN[3] === "ago" ? -1 : 1;
    const now = new Date();
    let d;
    if (/^day/.test(unit)) d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dir * n));
    else if (/^week/.test(unit)) d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dir * n * 7));
    else {
      const y = now.getUTCFullYear() + (/^year/.test(unit) ? dir * n : 0), mo = now.getUTCMonth() + (/^month/.test(unit) ? dir * n : 0);
      const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
      d = new Date(Date.UTC(y, mo, Math.min(now.getUTCDate(), last)));
    }
    const label = n + " " + unit.replace(/s$/, "") + (n === 1 ? "" : "s") + (dir < 0 ? " ago" : " from today");
    const note = /^(?:month|year)/.test(unit) && d.getUTCDate() !== now.getUTCDate() ? " (day clamped: the target month is shorter)" : "";
    return { ok: true, kind: "weekday", value: d.toISOString().slice(0, 10), text: label.charAt(0).toUpperCase() + label.slice(1) + " is " + DAYNAMES[d.getUTCDay()] + ", " + d.toISOString().slice(0, 10) + " (UTC)" + note };
  }
  // "what day is tomorrow", "yesterday was what day": relative to today (UTC)
  const rel = low.match(/\b(today|tomorrow|yesterday|the day after tomorrow|the day before yesterday)\b/);
  if (rel && /\bwhat day\b|\bwhich day\b|\bday (?:is|was|will)\b|\bweekday\b/.test(low)) {
    const off = { today: 0, tomorrow: 1, yesterday: -1, "the day after tomorrow": 2, "the day before yesterday": -2 }[rel[1]];
    const now = new Date(), d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + off));
    return { ok: true, kind: "weekday", text: rel[1].charAt(0).toUpperCase() + rel[1].slice(1) + " is " + DAYNAMES[d.getUTCDay()] + ", " + d.toISOString().slice(0, 10) + " (UTC)" };
  }
  // "how many days until christmas / until 2027-01-01" — counts from today (UTC).
  const untilM = /(days?|weeks?|months?)\s+(?:until|till|til|to go until|left until|to go to|to go before)\s+(.+)$/.exec(low);
  if (untilM) {
    const target = untilM[2].replace(/[?.!]/g, "").trim();
    let dest = null;
    const iso = target.match(/\d{4}-\d{1,2}-\d{1,2}/);
    if (iso) dest = parseISO(iso[0]);
    else {
      const hname = Object.keys(HOLIDAYS).sort((a, b) => b.length - a.length).find((h) => target.includes(h));
      if (hname) {
        const now = new Date();
        const today0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        dest = holidayDate(hname, now.getUTCFullYear());
        if (!dest || dest < today0) dest = holidayDate(hname, now.getUTCFullYear() + 1) || holidayDate(hname, now.getUTCFullYear() + 2) || holidayDate(hname, now.getUTCFullYear() + 3) || holidayDate(hname, now.getUTCFullYear() + 4);
      }
    }
    if (dest) {
      const now = new Date();
      const today0 = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const diff = Math.round((dest.getTime() - today0) / 86400000);
      const iso2 = dest.toISOString().slice(0, 10);
      if (/^week/.test(untilM[1])) { const w = Math.floor(Math.abs(diff) / 7), r = Math.abs(diff) % 7; return { ok: true, kind: "until", value: diff, weeks: w, text: (diff < 0 ? "-" : "") + w + " week" + (w === 1 ? "" : "s") + (r ? " and " + r + " day" + (r === 1 ? "" : "s") : "") + " until " + iso2 + " (" + diff + " days, counted from today)" }; }
      if (/^month/.test(untilM[1])) {
        let months = (dest.getUTCFullYear() - now.getUTCFullYear()) * 12 + dest.getUTCMonth() - now.getUTCMonth(); if (dest.getUTCDate() < now.getUTCDate()) months -= 1;
        const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, Math.min(now.getUTCDate(), new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months + 1, 0)).getUTCDate())));
        const rd = Math.round((dest.getTime() - anchor.getTime()) / 86400000);
        return { ok: true, kind: "until", value: diff, months, text: months + " month" + (months === 1 ? "" : "s") + (rd ? " and " + rd + " day" + (rd === 1 ? "" : "s") : "") + " until " + iso2 + " (" + diff + " days, counted from today; whole calendar months first)" };
      }
      return { ok: true, kind: "until", value: diff, text: diff + " day" + (diff === 1 ? "" : "s") + " until " + iso2 + " (counted from today)" };
    }
  }
  if (/days?\s+between/.test(low) && dates.length >= 2) {
    const diff = Math.round(Math.abs(dates[1] - dates[0]) / 86400000);
    return { ok: true, kind: "between", value: diff, text: diff + " day" + (diff === 1 ? "" : "s") };
  }
  const addM = low.match(/\b(add|subtract)\s+(\d+)\s+(days?|weeks?)\s+(?:to|from)\s+(\d{4}-\d{1,2}-\d{1,2})/);
  if (addM) { const d = parseISO(addM[4]); d.setUTCDate(d.getUTCDate() + (addM[1] === "add" ? 1 : -1) * +addM[2] * (/week/.test(addM[3]) ? 7 : 1)); return { ok: true, kind: "add", text: d.toISOString().slice(0, 10) }; }
  if (/leap/.test(low)) {
    const y = dates.length ? dates[0].getUTCFullYear() : Number((low.match(/\b(\d{4})\b/) || [])[1]);
    if (Number.isFinite(y)) { const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return { ok: true, kind: "leap", text: y + (leap ? " is a leap year" : " is not a leap year") }; }
  }
  if (/day of (the )?year|which day of/.test(low) && dates.length) {
    const d = dates[0], start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return { ok: true, kind: "dayofyear", value: Math.round((d - start) / 86400000), text: "day " + Math.round((d - start) / 86400000) + " of " + d.getUTCFullYear() };
  }
  if (/weekday|day of week|what day/.test(low) && dates.length) return { ok: true, kind: "weekday", text: DAYNAMES[dates[0].getUTCDay()] };
  return { ok: false, error: "try: days between 2024-01-01 and 2024-12-31, is 2024 a leap year, day of year for 2024-03-01" };
}

// vocabulary tables, shared with the typo corrector and the slot predictor
export { UNITS as UNIT_TABLE, HOLIDAYS };

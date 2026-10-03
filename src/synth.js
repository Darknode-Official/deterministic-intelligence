// From-scratch code synthesis for DI. This is NOT a snippet library: it parses a
// function specification into an abstract syntax tree, then COMPILES that tree
// into idiomatic source for each target language. The output is constructed from
// the spec every time, per language, so it is correct by construction rather than
// retrieved. Supports multiple parameters, arithmetic, powers, comparisons,
// boolean logic, conditionals (ternary / piecewise), multi-step bodies with local
// `let` bindings, common math calls, and integer-vs-float type inference so the
// signatures come out idiomatic. Imports nothing (Node-testable).

// --- tokenizer ---
function lex(src) {
  const toks = []; const re = /\s+|(\*\*|<=|>=|==|!=|&&|\|\||[-+*/%^(),<>!?:]|[0-9]*\.?[0-9]+|[a-zA-Z_][a-zA-Z0-9_]*)/g;
  let m, last = 0;
  while ((m = re.exec(src))) {
    if (m.index !== last) throw new Error("unexpected character near '" + src.slice(last, m.index + 1) + "'");
    last = re.lastIndex;
    if (/^\s+$/.test(m[0])) continue;
    toks.push(m[0]);
  }
  if (last !== src.length) throw new Error("unexpected character near '" + src.slice(last) + "'");
  return toks;
}

const KW_AND = new Set(["and"]), KW_OR = new Set(["or"]), KW_NOT = new Set(["not"]);
const FUNCS = new Set(["abs", "sqrt", "cbrt", "floor", "ceil", "round", "min", "max", "pow", "log", "ln", "log2", "log10", "exp", "sin", "cos", "tan", "asin", "acos", "atan", "hypot"]);
// Iterative aggregation forms compiled to accumulator loops (integer domain):
//   sum(i, lo, hi, term)  prod(i, lo, hi, term)  count(i, lo, hi, condition)
const AGG = new Set(["sum", "prod", "product", "count"]);
const isAgg = (n) => n && n.t === "call" && AGG.has(n.name) && n.args.length === 4 && n.args[0].t === "var";
function hasAgg(node) {
  if (!node) return false;
  if (isAgg(node)) return true;
  if (node.t === "bin") return hasAgg(node.l) || hasAgg(node.r);
  if (node.t === "un") return hasAgg(node.e);
  if (node.t === "cond") return hasAgg(node.c) || hasAgg(node.a) || hasAgg(node.b);
  if (node.t === "call") return node.args.some(hasAgg);
  if (node.t === "block") return node.lets.some((b) => hasAgg(b.expr)) || hasAgg(node.ret);
  return false;
}
// Tag calls that name the function being defined, so they emit as self-recursion
// instead of being looked up as math library functions.
function tagSelf(node, lname, fname) {
  if (!node) return;
  if (node.t === "call") { if (node.name === lname) { node.self = true; node.fname = fname; } node.args.forEach((a) => tagSelf(a, lname, fname)); }
  else if (node.t === "bin") { tagSelf(node.l, lname, fname); tagSelf(node.r, lname, fname); }
  else if (node.t === "un") tagSelf(node.e, lname, fname);
  else if (node.t === "cond") { tagSelf(node.c, lname, fname); tagSelf(node.a, lname, fname); tagSelf(node.b, lname, fname); }
  else if (node.t === "block") { node.lets.forEach((b) => tagSelf(b.expr, lname, fname)); tagSelf(node.ret, lname, fname); }
}

// Split on top-level occurrences of a separator, respecting () nesting.
function splitTop(src, sep) {
  const out = []; let depth = 0, cur = "";
  for (const ch of src) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// --- parser: precedence climbing into an AST for one expression ---
function parseExprSrc(src) {
  const toks = lex(src.replace(/\bif\b|\belse\b/g, (w) => " __" + w + " ").replace(/\s+/g, " "));
  let i = 0;
  const peek = () => toks[i], eat = () => toks[i++];
  const isNum = (t) => /^[0-9]*\.?[0-9]+$/.test(t);
  const isName = (t) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t);

  function parseExpr() { return parsePyCond(); }
  function parsePyCond() { // python "a if c else b"
    const a = parseTernary();
    if (peek() === "__if") { eat(); const c = parseTernary(); if (eat() !== "__else") throw new Error("expected 'else'"); const b = parsePyCond(); return { t: "cond", c, a, b }; }
    return a;
  }
  function parseTernary() { // c-style "c ? a : b"
    const c = parseOr();
    if (peek() === "?") { eat(); const a = parseExpr(); if (eat() !== ":") throw new Error("expected ':'"); const b = parseExpr(); return { t: "cond", c, a, b }; }
    return c;
  }
  function parseOr() { let a = parseAnd(); while (peek() === "||" || KW_OR.has(peek())) { eat(); a = { t: "bin", op: "||", l: a, r: parseAnd() }; } return a; }
  function parseAnd() { let a = parseNot(); while (peek() === "&&" || KW_AND.has(peek())) { eat(); a = { t: "bin", op: "&&", l: a, r: parseNot() }; } return a; }
  function parseNot() { if (peek() === "!" || KW_NOT.has(peek())) { eat(); return { t: "un", op: "!", e: parseNot() }; } return parseCmp(); }
  function parseCmp() { let a = parseAdd(); while (["<", ">", "<=", ">=", "==", "!="].includes(peek())) { const op = eat(); a = { t: "bin", op, l: a, r: parseAdd() }; } return a; }
  function parseAdd() { let a = parseMul(); while (peek() === "+" || peek() === "-") { const op = eat(); a = { t: "bin", op, l: a, r: parseMul() }; } return a; }
  function parseMul() { let a = parseUnary(); while (peek() === "*" || peek() === "/" || peek() === "%") { const op = eat(); a = { t: "bin", op, l: a, r: parseUnary() }; } return a; }
  function parseUnary() { if (peek() === "-" || peek() === "+") { const op = eat(); return { t: "un", op, e: parseUnary() }; } return parsePow(); }
  function parsePow() { const a = parsePostfix(); if (peek() === "^" || peek() === "**") { eat(); return { t: "bin", op: "^", l: a, r: parseUnary() }; } return a; }
  function parsePostfix() { return parseAtom(); }
  function parseAtom() {
    const t = peek();
    if (t === "(") { eat(); const e = parseExpr(); if (eat() !== ")") throw new Error("expected ')'"); return e; }
    if (t === undefined) throw new Error("unexpected end of expression");
    if (isNum(t)) { eat(); return { t: "num", v: t }; }
    if (isName(t)) {
      eat();
      if (peek() === "(") { eat(); const args = []; if (peek() !== ")") { args.push(parseExpr()); while (peek() === ",") { eat(); args.push(parseExpr()); } } if (eat() !== ")") throw new Error("expected ')'"); return { t: "call", name: t.toLowerCase(), args }; }
      return { t: "var", name: t };
    }
    throw new Error("unexpected token '" + t + "'");
  }
  const ast = parseExpr();
  if (i < toks.length) throw new Error("unexpected token '" + toks[i] + "'");
  return ast;
}

// Parse a whole body: either one expression, or a sequence of `let name = value`
// steps followed by a final return expression, separated by ';'.
function parse(src) {
  const segs = splitTop(src, ";").map((s) => s.trim()).filter(Boolean);
  if (segs.length <= 1) return parseExprSrc(src);
  const lets = [];
  for (let j = 0; j < segs.length - 1; j++) {
    const bm = segs[j].match(/^(?:let\s+|const\s+|var\s+)?([a-zA-Z_]\w*)\s*=(?!=)([\s\S]+)$/);
    if (!bm) throw new Error("expected 'name = value' in step: " + segs[j]);
    lets.push({ name: bm[1], expr: parseExprSrc(bm[2].trim()) });
  }
  const ret = parseExprSrc(segs[segs.length - 1].replace(/^return\s+/i, "").trim());
  return { t: "block", lets, ret };
}

// --- analysis ---
function collectVars(node, set) {
  if (!node) return set;
  if (node.t === "var") set.add(node.name);
  else if (node.t === "bin") { collectVars(node.l, set); collectVars(node.r, set); }
  else if (node.t === "un") collectVars(node.e, set);
  else if (node.t === "cond") { collectVars(node.c, set); collectVars(node.a, set); collectVars(node.b, set); }
  else if (node.t === "call") node.args.forEach((a) => collectVars(a, set));
  else if (node.t === "block") { node.lets.forEach((b) => collectVars(b.expr, set)); collectVars(node.ret, set); }
  return set;
}
const CMP = new Set(["<", ">", "<=", ">=", "==", "!="]);
function isBool(node) {
  if (!node) return false;
  if (node.t === "block") return isBool(node.ret);
  if (node.t === "bin") return CMP.has(node.op) || node.op === "&&" || node.op === "||";
  if (node.t === "un") return node.op === "!";
  if (node.t === "cond") return isBool(node.a) || isBool(node.b);
  return false;
}
// Does any numeric part of the expression require floating point? Any division,
// power, math call, decimal literal, or the pi/e constants forces float; pure
// integer arithmetic (+ - * %, comparisons, logic, conditionals) stays integer.
function forcesFloat(node) {
  if (!node) return false;
  switch (node.t) {
    case "num": return /\./.test(node.v);
    case "var": return !!NUMCONST[node.name];
    case "call": return (node.self || isAgg(node)) ? node.args.some(forcesFloat) : true;
    case "un": return forcesFloat(node.e);
    case "bin": return node.op === "/" || node.op === "^" || forcesFloat(node.l) || forcesFloat(node.r);
    case "cond": return forcesFloat(node.c) || forcesFloat(node.a) || forcesFloat(node.b);
    case "block": return node.lets.some((b) => forcesFloat(b.expr)) || forcesFloat(node.ret);
  }
  return false;
}

// --- per-language expression emitters ---
const NUMCONST = { pi: { python: "math.pi", javascript: "Math.PI", typescript: "Math.PI", rust: "std::f64::consts::PI", go: "math.Pi", java: "Math.PI", c: "M_PI" }, e: { python: "math.e", javascript: "Math.E", typescript: "Math.E", rust: "std::f64::consts::E", go: "math.E", java: "Math.E", c: "M_E" } };

// Fold an N-ary min/max down to nested binary calls for languages without a
// variadic form (java/go/c/rust), while python/js keep the native variadic call.
function foldMinMax(name, a, lang) {
  if (a.length === 1) return a[0];
  if (lang === "python") return `${name}(${a.join(", ")})`;
  if (lang === "javascript" || lang === "typescript") return `Math.${name}(${a.join(", ")})`;
  const bin = (x, y) => {
    if (lang === "rust") return `(${x}).${name}(${y})`;
    if (lang === "go") return `math.${name === "min" ? "Min" : "Max"}(${x}, ${y})`;
    if (lang === "java") return `Math.${name}(${x}, ${y})`;
    return `f${name}(${x}, ${y})`; // c
  };
  return a.reduce((acc, cur) => bin(acc, cur));
}

function callEmit(name, args, lang, uses, mode) {
  const a = args.map((x) => emit(x, lang, uses, mode));
  const two = a.length >= 2 ? a : [a[0], a[0]];
  if (name === "min" || name === "max") { if (["python", "rust", "go", "c"].includes(lang)) uses.add("math"); return foldMinMax(name, a, lang); }
  const map = {
    abs: { python: `abs(${a[0]})`, javascript: `Math.abs(${a[0]})`, typescript: `Math.abs(${a[0]})`, rust: `(${a[0]}).abs()`, go: `math.Abs(${a[0]})`, java: `Math.abs(${a[0]})`, c: `fabs(${a[0]})` },
    sqrt: { python: `math.sqrt(${a[0]})`, javascript: `Math.sqrt(${a[0]})`, typescript: `Math.sqrt(${a[0]})`, rust: `(${a[0]}).sqrt()`, go: `math.Sqrt(${a[0]})`, java: `Math.sqrt(${a[0]})`, c: `sqrt(${a[0]})` },
    cbrt: { python: `(${a[0]}) ** (1 / 3)`, javascript: `Math.cbrt(${a[0]})`, typescript: `Math.cbrt(${a[0]})`, rust: `(${a[0]}).cbrt()`, go: `math.Cbrt(${a[0]})`, java: `Math.cbrt(${a[0]})`, c: `cbrt(${a[0]})` },
    floor: { python: `math.floor(${a[0]})`, javascript: `Math.floor(${a[0]})`, typescript: `Math.floor(${a[0]})`, rust: `(${a[0]}).floor()`, go: `math.Floor(${a[0]})`, java: `Math.floor(${a[0]})`, c: `floor(${a[0]})` },
    ceil: { python: `math.ceil(${a[0]})`, javascript: `Math.ceil(${a[0]})`, typescript: `Math.ceil(${a[0]})`, rust: `(${a[0]}).ceil()`, go: `math.Ceil(${a[0]})`, java: `Math.ceil(${a[0]})`, c: `ceil(${a[0]})` },
    round: { python: `round(${a[0]})`, javascript: `Math.round(${a[0]})`, typescript: `Math.round(${a[0]})`, rust: `(${a[0]}).round()`, go: `math.Round(${a[0]})`, java: `Math.round(${a[0]})`, c: `round(${a[0]})` },
    exp: { python: `math.exp(${a[0]})`, javascript: `Math.exp(${a[0]})`, typescript: `Math.exp(${a[0]})`, rust: `(${a[0]}).exp()`, go: `math.Exp(${a[0]})`, java: `Math.exp(${a[0]})`, c: `exp(${a[0]})` },
    log: { python: `math.log(${a[0]})`, javascript: `Math.log(${a[0]})`, typescript: `Math.log(${a[0]})`, rust: `(${a[0]}).ln()`, go: `math.Log(${a[0]})`, java: `Math.log(${a[0]})`, c: `log(${a[0]})` },
    ln: { python: `math.log(${a[0]})`, javascript: `Math.log(${a[0]})`, typescript: `Math.log(${a[0]})`, rust: `(${a[0]}).ln()`, go: `math.Log(${a[0]})`, java: `Math.log(${a[0]})`, c: `log(${a[0]})` },
    log2: { python: `math.log2(${a[0]})`, javascript: `Math.log2(${a[0]})`, typescript: `Math.log2(${a[0]})`, rust: `(${a[0]}).log2()`, go: `math.Log2(${a[0]})`, java: `(Math.log(${a[0]}) / Math.log(2))`, c: `log2(${a[0]})` },
    log10: { python: `math.log10(${a[0]})`, javascript: `Math.log10(${a[0]})`, typescript: `Math.log10(${a[0]})`, rust: `(${a[0]}).log10()`, go: `math.Log10(${a[0]})`, java: `Math.log10(${a[0]})`, c: `log10(${a[0]})` },
    sin: { python: `math.sin(${a[0]})`, javascript: `Math.sin(${a[0]})`, typescript: `Math.sin(${a[0]})`, rust: `(${a[0]}).sin()`, go: `math.Sin(${a[0]})`, java: `Math.sin(${a[0]})`, c: `sin(${a[0]})` },
    cos: { python: `math.cos(${a[0]})`, javascript: `Math.cos(${a[0]})`, typescript: `Math.cos(${a[0]})`, rust: `(${a[0]}).cos()`, go: `math.Cos(${a[0]})`, java: `Math.cos(${a[0]})`, c: `cos(${a[0]})` },
    tan: { python: `math.tan(${a[0]})`, javascript: `Math.tan(${a[0]})`, typescript: `Math.tan(${a[0]})`, rust: `(${a[0]}).tan()`, go: `math.Tan(${a[0]})`, java: `Math.tan(${a[0]})`, c: `tan(${a[0]})` },
    asin: { python: `math.asin(${a[0]})`, javascript: `Math.asin(${a[0]})`, typescript: `Math.asin(${a[0]})`, rust: `(${a[0]}).asin()`, go: `math.Asin(${a[0]})`, java: `Math.asin(${a[0]})`, c: `asin(${a[0]})` },
    acos: { python: `math.acos(${a[0]})`, javascript: `Math.acos(${a[0]})`, typescript: `Math.acos(${a[0]})`, rust: `(${a[0]}).acos()`, go: `math.Acos(${a[0]})`, java: `Math.acos(${a[0]})`, c: `acos(${a[0]})` },
    atan: { python: `math.atan(${a[0]})`, javascript: `Math.atan(${a[0]})`, typescript: `Math.atan(${a[0]})`, rust: `(${a[0]}).atan()`, go: `math.Atan(${a[0]})`, java: `Math.atan(${a[0]})`, c: `atan(${a[0]})` },
    hypot: { python: `math.hypot(${two[0]}, ${two[1]})`, javascript: `Math.hypot(${two[0]}, ${two[1]})`, typescript: `Math.hypot(${two[0]}, ${two[1]})`, rust: `(${two[0]}).hypot(${two[1]})`, go: `math.Hypot(${two[0]}, ${two[1]})`, java: `Math.hypot(${two[0]}, ${two[1]})`, c: `hypot(${two[0]}, ${two[1]})` },
    pow: { python: `${two[0]} ** ${two[1]}`, javascript: `${two[0]} ** ${two[1]}`, typescript: `${two[0]} ** ${two[1]}`, rust: `(${two[0]}).powf(${two[1]})`, go: `math.Pow(${two[0]}, ${two[1]})`, java: `Math.pow(${two[0]}, ${two[1]})`, c: `pow(${two[0]}, ${two[1]})` },
  };
  if (!map[name]) throw new Error("unknown function '" + name + "'");
  if (["python", "rust", "go", "c"].includes(lang)) uses.add("math");
  return map[name][lang];
}
function powEmit(l, r, lang, uses, mode) {
  const le = emit(l, lang, uses, mode), re = emit(r, lang, uses, mode);
  if (lang === "python" || lang === "javascript" || lang === "typescript") return `${paren(l, le)} ** ${paren(r, re)}`;
  if (lang === "rust") return `${paren(l, le)}.powf(${re})`;
  if (lang === "go") { uses.add("math"); return `math.Pow(${le}, ${re})`; }
  if (lang === "java") return `Math.pow(${le}, ${re})`;
  uses.add("math"); return `pow(${le}, ${re})`; // c
}
function paren(node, s) { return (node.t === "bin" || node.t === "cond") ? "(" + s + ")" : s; }
// Go has no ternary: a conditional in return position becomes a flat if/return
// chain (recursing so nested conditionals stay valid Go, not `c ? a : b`).
function goStmt(node, uses, mode, ind) {
  if (node.t === "cond") {
    const c = emit(node.c, "go", uses, mode);
    return `${ind}if ${c} {\n${goStmt(node.a, uses, mode, ind + "\t")}\n${ind}}\n${goStmt(node.b, uses, mode, ind)}`;
  }
  return `${ind}return ${emit(node, "go", uses, mode)}`;
}
function boolOp(op, lang) {
  if (op === "&&") return lang === "python" ? " and " : " && ";
  if (op === "||") return lang === "python" ? " or " : " || ";
  return " " + op + " ";
}
function emit(node, lang, uses, mode) {
  switch (node.t) {
    case "num": return (lang === "rust" && mode === "float" && /^[0-9]+$/.test(node.v)) ? node.v + ".0" : node.v; // Rust needs f64 literals in float context
    case "var": return NUMCONST[node.name] ? NUMCONST[node.name][lang] : node.name;
    case "call":
      if (node.self) return `${node.fname}(${node.args.map((x) => emit(x, lang, uses, mode)).join(", ")})`;
      if (AGG.has(node.name)) throw new Error("iterative '" + node.name + "' may only be the whole body or a `let` binding's value");
      return callEmit(node.name, node.args, lang, uses, mode);
    case "un": {
      const e = emit(node.e, lang, uses, mode);
      if (node.op === "!") return lang === "python" ? "not " + paren(node.e, e) : "!" + paren(node.e, e);
      return node.op + paren(node.e, e);
    }
    case "bin": {
      if (node.op === "^") return powEmit(node.l, node.r, lang, uses, mode);
      const l = emit(node.l, lang, uses, mode), r = emit(node.r, lang, uses, mode);
      return paren(node.l, l) + boolOp(node.op, lang) + paren(node.r, r);
    }
    case "cond": {
      const c = emit(node.c, lang, uses, mode), a = emit(node.a, lang, uses, mode), b = emit(node.b, lang, uses, mode);
      if (lang === "python") return `${paren(node.a, a)} if ${c} else ${paren(node.b, b)}`;
      if (lang === "rust") return `if ${c} { ${a} } else ${node.b.t === "cond" ? b : "{ " + b + " }"}`; // chains into `else if`
      return `${paren(node.c, c)} ? ${paren(node.a, a)} : ${paren(node.b, b)}`; // js/ts/java/c
    }
  }
  throw new Error("cannot emit node");
}

// --- function assembly per language ---
const NUM_T = { rust: "f64", go: "float64", java: "double", c: "double" };
const INT_T = { rust: "i64", go: "int", java: "long", c: "long" };
const BOOL_T = { rust: "bool", go: "bool", java: "boolean", c: "int" };

// Compile an aggregation form into an accumulator loop that writes into `target`.
// Integer domain only (bounds and index are integers), which keeps it valid in
// every target language without casts.
function emitAggLoop(target, node, lang, uses) {
  const kind = node.name, idx = node.args[0].name;
  const lo = emit(node.args[1], lang, uses, "int"), hi = emit(node.args[2], lang, uses, "int");
  const isCount = kind === "count";
  const isProd = kind === "prod" || kind === "product";
  const init = isProd ? "1" : "0";
  const op = isProd ? "*" : "+";
  const term = emit(node.args[3], lang, uses, "int"); // condition when count
  switch (lang) {
    case "python":
      return isCount
        ? `    ${target} = 0\n    for ${idx} in range(${lo}, ${hi} + 1):\n        if ${term}:\n            ${target} += 1`
        : `    ${target} = ${init}\n    for ${idx} in range(${lo}, ${hi} + 1):\n        ${target} ${op}= ${term}`;
    case "javascript":
    case "typescript":
      return isCount
        ? `  let ${target} = 0;\n  for (let ${idx} = ${lo}; ${idx} <= ${hi}; ${idx}++) {\n    if (${term}) {\n      ${target} += 1;\n    }\n  }`
        : `  let ${target} = ${init};\n  for (let ${idx} = ${lo}; ${idx} <= ${hi}; ${idx}++) {\n    ${target} ${op}= ${term};\n  }`;
    case "rust":
      return isCount
        ? `    let mut ${target}: i64 = 0;\n    for ${idx} in ${lo}..=${hi} {\n        if ${term} {\n            ${target} += 1;\n        }\n    }`
        : `    let mut ${target}: i64 = ${init};\n    for ${idx} in ${lo}..=${hi} {\n        ${target} ${op}= ${term};\n    }`;
    case "go":
      return isCount
        ? `\t${target} := 0\n\tfor ${idx} := ${lo}; ${idx} <= ${hi}; ${idx}++ {\n\t\tif ${term} {\n\t\t\t${target} += 1\n\t\t}\n\t}`
        : `\t${target} := ${init}\n\tfor ${idx} := ${lo}; ${idx} <= ${hi}; ${idx}++ {\n\t\t${target} ${op}= ${term}\n\t}`;
    default: // java / c (both use long)
      return isCount
        ? `    long ${target} = 0;\n    for (long ${idx} = ${lo}; ${idx} <= ${hi}; ${idx}++) {\n        if (${term}) {\n            ${target} += 1;\n        }\n    }`
        : `    long ${target} = ${init};\n    for (long ${idx} = ${lo}; ${idx} <= ${hi}; ${idx}++) {\n        ${target} ${op}= ${term};\n    }`;
  }
}
// One local `let` binding per language: a plain binding, or an accumulator loop
// when its value is an aggregation form.
function emitLet(L, lang, uses, mode) {
  if (isAgg(L.expr)) return emitAggLoop(L.name, L.expr, lang, uses);
  const val = emit(L.expr, lang, uses, mode);
  const bt = isBool(L.expr) ? BOOL_T[lang] : (mode === "float" ? NUM_T[lang] : INT_T[lang]);
  if (lang === "python") return `    ${L.name} = ${val}`;
  if (lang === "javascript" || lang === "typescript") return `  const ${L.name} = ${val};`;
  if (lang === "rust") return `    let ${L.name} = ${val};`;
  if (lang === "go") return `\t${L.name} := ${val}`;
  return `    ${bt} ${L.name} = ${val};`; // java / c
}

function assemble(name, params, body, lang) {
  const uses = new Set();
  const mode = forcesFloat(body) ? "float" : "int";
  const numType = mode === "float" ? NUM_T[lang] : INT_T[lang];
  const ret = body.t === "block" ? body.ret : body;
  const bool = isBool(body);
  const retType = bool ? BOOL_T[lang] : numType;
  const pType = { python: "", javascript: "", typescript: "number", rust: numType, go: numType, java: numType, c: numType };
  const lets = body.t === "block" ? body.lets : [];

  const goCondRet = lang === "go" && ret.t === "cond";
  let expr, pre;
  try {
    expr = goCondRet ? null : emit(ret, lang, uses, mode);
    const lines = lets.map((L) => emitLet(L, lang, uses, mode));
    pre = lines.length ? lines.join("\n") + "\n" : "";
  } catch (e) { return { error: e.message }; }

  const paramList = (fmt) => params.map(fmt).join(", ");
  let code;
  if (lang === "python") {
    code = `def ${name}(${paramList((p) => p)}):\n${pre}    return ${expr}`;
  } else if (lang === "javascript") {
    code = `function ${name}(${paramList((p) => p)}) {\n${pre}  return ${expr};\n}`;
  } else if (lang === "typescript") {
    code = `function ${name}(${paramList((p) => p + ": number")}): ${bool ? "boolean" : "number"} {\n${pre}  return ${expr};\n}`;
  } else if (lang === "rust") {
    code = `fn ${name}(${paramList((p) => p + ": " + pType.rust)}) -> ${retType} {\n${pre}    ${expr}\n}`;
  } else if (lang === "java") {
    code = `static ${retType} ${name}(${paramList((p) => pType.java + " " + p)}) {\n${pre}    return ${expr};\n}`;
  } else if (lang === "c") {
    code = `${retType} ${name}(${paramList((p) => pType.c + " " + p)}) {\n${pre}    return ${expr};\n}`;
  } else if (lang === "go") {
    const sig = `func ${name}(${paramList((p) => p + " " + pType.go)}) ${retType}`;
    const tail = goCondRet ? goStmt(ret, uses, mode, "\t") : `\treturn ${expr}`;
    code = `${sig} {\n${pre}${tail}\n}`;
  }
  return { code, uses: [...uses] };
}

// Public: synthesize a function from a spec. Returns {ok, ...} or {ok:false}.
export function synth(spec) {
  const { name = "f", params: forced, body } = spec;
  let ast; try { ast = parse(body); } catch (e) { return { ok: false, error: e.message }; }
  tagSelf(ast, name.toLowerCase(), name);
  // Aggregations become loops, so an aggregation used as the whole body or as a
  // block's return is lifted into a local accumulator that we return. Pick a
  // readable accumulator name that does not collide with anything already used.
  const used = collectVars(ast, new Set());
  const acc = ["result", "total", "acc", "__acc"].find((n) => !used.has(n)) || "__acc";
  if (isAgg(ast)) ast = { t: "block", lets: [{ name: acc, expr: ast }], ret: { t: "var", name: acc } };
  else if (ast.t === "block" && isAgg(ast.ret)) { ast.lets.push({ name: acc, expr: ast.ret }); ast.ret = { t: "var", name: acc }; }
  if (hasAgg(ast) && forcesFloat(ast)) return { ok: false, error: "iterative sum/product/count supports integer bounds and terms only" };
  // Loop indices and let names are locals, not parameters.
  const locals = new Set();
  if (ast.t === "block") for (const b of ast.lets) { locals.add(b.name); if (isAgg(b.expr)) locals.add(b.expr.args[0].name); }
  const vars = [...collectVars(ast, new Set())].filter((v) => !NUMCONST[v] && !locals.has(v));
  const params = forced && forced.length ? forced : vars.sort();
  const out = {};
  for (const lang of ["python", "javascript", "typescript", "rust", "go", "java", "c"]) {
    const r = assemble(name, params, ast, lang);
    if (r.error) return { ok: false, error: r.error };
    out[lang] = r;
  }
  return { ok: true, name, params, bool: isBool(ast), recursive: /* self-call anywhere */ (function chk(n) { return !n ? false : n.self || (n.t === "bin" ? chk(n.l) || chk(n.r) : n.t === "un" ? chk(n.e) : n.t === "cond" ? chk(n.c) || chk(n.a) || chk(n.b) : n.t === "call" ? n.args.some(chk) : n.t === "block" ? n.lets.some((b) => chk(b.expr)) || chk(n.ret) : false); })(ast), iterative: hasAgg(ast), numeric: forcesFloat(ast) ? "float" : "int", langs: out };
}

// Parse a natural-language spec into {name, params, body}. Returns null if it is
// not a function specification we can synthesize.
export function parseSpec(input) {
  let s = String(input || "").trim();
  s = s.replace(/\bin\s+(python|javascript|js|typescript|ts|rust|go|golang|java|c)\b/gi, " ");
  // name(args) = body   OR   name(args) that returns body
  let m = s.match(/([a-zA-Z_]\w*)\s*\(([a-zA-Z0-9_,\s]*)\)\s*(?:=|:|->|returns?|=>|that\s+returns?|equals?)\s*(.+)$/i);
  if (m) {
    const params = m[2].split(",").map((p) => p.trim()).filter(Boolean);
    return { name: m[1], params, body: m[3].trim() };
  }
  // "a function that returns <body>" / "compute <body>" (params inferred)
  m = s.match(/(?:returns?|computes?|calculates?|gives?|equals?|=>|=|:)\s*(.+)$/i);
  if (m && (/[-+*/^%<>]|;|\blet\b/i.test(m[1]) || /\b(if|and|or|not|abs|sqrt|cbrt|min|max|floor|ceil|round|exp|log|ln|log2|log10|sin|cos|tan|asin|acos|atan|hypot|pow|sum|prod|product|count)\b/i.test(m[1]))) {
    const nm = s.match(/\b(?:function|func|method)\s+(?:called\s+|named\s+)?([a-z]\w*)/i);
    return { name: nm ? nm[1] : "f", params: null, body: m[1].trim() };
  }
  return null;
}

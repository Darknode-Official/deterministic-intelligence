// Unit tests for the Universal Engine (public./*).
// predict.js and skills.js import nothing, so Node imports them straight. engine.js
// and engine-tab.js use browser-absolute "/js/..." specifiers Node can't resolve,
// so those are checked at the source level (wiring, no emojis), like the learndo test.
import { readFileSync } from "node:fs";
import { test, group, assert } from "../harness.mjs";
import { train, predictNext, complete, suggestWord, learn } from "../../src/predict.js";
import { makeLexicon, withDictionary, withContext, bestFix, rankFixes, isWord, correctWord, correctText, typoDistance, fuzzyPrefix, isAdjacent } from "../../src/spell.js";
import { md5, sha1, sha256 } from "../../src/hash.js";
import { words as englishWords, band as wordBand } from "../../src/words.js";
import { createHash } from "node:crypto";
import { calc, convert, codegen, text, regexBuild, regexTest, datetime } from "../../src/skills.js";
import { stats, solveEquation, numberTheory, encode, lookup, isPrime, factorize, nthPrime, nthFib, wordMath, sequence, logic, setOps, combinatorics } from "../../src/advanced.js";
import { numberWords, numberToWords, mathPhrase, naturalize } from "../../src/nlp.js";
import { linalg, determinant, inverse, matMul, dot, cross } from "../../src/matrix.js";
import { unitMath } from "../../src/units.js";
import { synth, parseSpec } from "../../src/synth.js";
import { parseCSV, analyzeCSV, numberBase, toRoman, fromRoman } from "../../src/data.js";
import { colorConvert, jsonQuery, navigate } from "../../src/more.js";
import { capital, constant, element, facts, sci, withThe, CAPITALS, ELEMENTS } from "../../src/facts.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, a + " !~= " + b);

group("engine/predict: n-gram model", () => {
  const m = train("a computer program is a set of instructions. a computer program is code.");
  test("training builds vocab and counts", () => {
    assert.ok(m.tokens > 0);
    assert.ok(m.vocab.includes("computer") && m.vocab.includes("program"));
  });
  test("predictNext is deterministic and context-aware", () => {
    const r = predictNext(m, "a computer", 3);
    assert.equal(r[0].token, "program");
    // same call, same answer
    assert.deepEqual(predictNext(m, "a computer", 3).map((x) => x.token), r.map((x) => x.token));
  });
  test("complete continues without an infinite loop", () => {
    const s = complete(m, "a computer", 10);
    assert.equal(typeof s, "string");
    assert.ok(s.length > 0);
  });
  test("suggestWord completes a half-typed word", () => {
    const s = suggestWord(m, "a comp", 5);
    assert.ok(s.includes("computer"));
  });
  test("empty / unknown context is safe", () => {
    assert.deepEqual(predictNext(m, "", 3).length >= 0, true);
    assert.equal(complete(m, "", 5), "");
  });
  test("interpolated model builds orders 1..5 and prefers a longer exact context", () => {
    const big = train("the cat sat on the mat. the cat ran to the dog. the cat sat on the log.");
    assert.ok(big.grams && big.grams.length === 6 && big.pent instanceof Map);
    // after "the cat sat on the", the exact 4/5-gram context should pick "mat" or "log", not a generic word
    const top = predictNext(big, "the cat sat on the", 3).map((x) => x.token);
    assert.ok(top.includes("mat") || top.includes("log"));
  });
  test("complete does not immediately repeat the last word", () => {
    const big = train("data flows through the system and the system logs the data every day.");
    const cont = complete(big, "the system", 12).split(/\s+/);
    for (let i = 1; i < cont.length; i++) assert.ok(cont[i] !== cont[i - 1] || /[.,!?;:]/.test(cont[i]));
  });
});

group("engine/skills: calc", () => {
  test("precedence, parens, powers", () => {
    assert.equal(calc("2+3*4").value, 14);
    assert.equal(calc("(2+3)*4").value, 20);
    assert.equal(calc("2^3^2").value, 512); // right-associative
    assert.equal(calc("sqrt(144)+3*2^5").value, 108);
  });
  test("unary minus and functions and constants", () => {
    assert.equal(calc("-5+2").value, -3);
    assert.equal(calc("round(3.7)").value, 4);
    assert.equal(calc("abs(-8)").value, 8);
    near(calc("pi").value, Math.PI, 1e-9);
    near(calc("2*pi").value, 2 * Math.PI, 1e-9);
  });
  test("multi-arg functions, factorial, gcd", () => {
    assert.equal(calc("min(3,7,2)").value, 2);
    assert.equal(calc("max(3,7,2)").value, 7);
    assert.equal(calc("gcd(48,60)").value, 12);
    assert.equal(calc("lcm(4,6)").value, 12);
    assert.equal(calc("5!").value, 120);
    assert.equal(calc("hypot(3,4)").value, 5);
  });
  test("percent, hex/binary literals, and variables", () => {
    assert.equal(calc("15% of 200").value, 30);
    assert.equal(calc("50%").value, 0.5);
    assert.equal(calc("0xff + 0b1010").value, 265);
    assert.equal(calc("x = 5; x * 2 + 1").value, 11);
    assert.equal(calc("10 % 3").value, 1); // modulo, not percent
  });
  test("errors are reported, not thrown", () => {
    assert.equal(calc("2+").ok, false);
    assert.equal(calc("").ok, false);
    assert.equal(calc("1/0").ok, false);
    assert.equal(calc("bogus(2)").ok, false);
    assert.equal(calc("(-1)!").ok, false);
  });
  test("tolerates misspelled / filler words around an expression", () => {
    assert.equal(calc("whatt is 9+1").value, 10);        // typo'd "what"
    assert.equal(calc("calcualte 6 * 7").value, 42);      // typo'd "calculate"
    assert.equal(calc("please compute 2^10 thanks").value, 1024);
    assert.equal(calc("bogus(2)").ok, false);             // a call form still errors honestly
  });
});

group("engine/advanced: word problems", () => {
  test("totalling wording sums the numbers", () => {
    const r = wordMath("Maya has $45 saved. She saves $62 in February and $58 in March. How much money does Maya have in total?");
    assert.equal(r.ok, true);
    assert.equal(r.value, 165);
    assert.equal(r.op, "addition");
    assert.deepEqual(r.numbers, [45, 62, 58]);
  });
  test("difference wording subtracts", () => {
    const r = wordMath("Sam had 20 apples and gave away 8. How many are left?");
    assert.equal(r.value, 12);
    assert.equal(r.op, "subtraction");
  });
  test("product wording multiplies two numbers", () => {
    const r = wordMath("There are 6 boxes with 7 items each. What is the product?");
    assert.equal(r.value, 42);
    assert.equal(r.op, "multiplication");
  });
  test("needs at least two numbers", () => {
    assert.equal(wordMath("I have 5 apples").ok, false);
  });
  test("percentage discount", () => {
    const r = wordMath("20% off $80");
    assert.equal(r.op, "percentage discount");
    assert.equal(r.value, 64);
  });
});

group("engine/nlp: number words", () => {
  test("cardinals, hundreds, scales, hyphens, and", () => {
    assert.equal(numberWords("two hundred fifty"), "250");
    assert.equal(numberWords("twenty-one"), "21");
    assert.equal(numberWords("one thousand two hundred thirty four"), "1234");
    assert.equal(numberWords("two hundred and fifty"), "250");
    assert.equal(numberWords("three million"), "3000000");
  });
  test("leaves non-number words alone", () => {
    assert.equal(numberWords("one of the users"), "1 of the users");
    assert.equal(numberWords("the weather is nice"), "the weather is nice");
  });
});

group("engine/nlp: math in words", () => {
  test("percent, powers, roots, operators", () => {
    assert.equal(mathPhrase("twenty percent of two hundred plus thirty"), "(20/100)*200 + 30");
    assert.equal(mathPhrase("what is 15% of 80"), "(15/100)*80");
    assert.equal(mathPhrase("square root of 144"), "sqrt(144)");
    assert.equal(mathPhrase("5 squared"), "5 ^ 2");
    assert.equal(mathPhrase("factorial of 5"), "5!");
    assert.equal(mathPhrase("add 250 to 300"), "250 + 300");
    assert.equal(mathPhrase("subtract 15 from 100"), "100 - 15");
  });
  test("returns null for non-math and untranslatable phrases", () => {
    assert.equal(mathPhrase("hello world"), null);
    assert.equal(mathPhrase("20% off 80"), null); // a discount, not a bare expression
    assert.equal(mathPhrase("sum of 10, 20 and 30"), null);
  });
  test("the translated expression evaluates correctly", () => {
    assert.equal(calc(mathPhrase("twenty percent of two hundred plus thirty")).value, 70);
    assert.equal(calc(mathPhrase("square root of 144")).value, 12);
  });
  test("handles casual, conversational phrasing", () => {
    assert.equal(calc(mathPhrase("how much is 15 percent of 240")).value, 36);
    assert.equal(calc(mathPhrase("can you tell me what 12 times 12 is")).value, 144);
    assert.equal(calc(mathPhrase("what's the square root of 2")).value.toFixed(3), "1.414");
    assert.equal(calc(mathPhrase("whats 2 to the power of 10")).value, 1024);
  });
});

group("engine/nlp: naturalize (conversational front-end)", () => {
  test("rewrites 'how many X in [N] Y' into a conversion the skill parses", () => {
    assert.equal(naturalize("how many km in 5 miles"), "5 miles in km");
    assert.equal(naturalize("how many seconds in a day"), "1 day in seconds");
  });
  test("does not rewrite non-units (letters/words stay for text)", () => {
    assert.equal(naturalize("how many letters in mississippi"), "how many letters in mississippi");
  });
  test("strips pure framing but keeps routing signal", () => {
    assert.equal(naturalize("can you please reverse hello world"), "reverse hello world");
    assert.equal(naturalize("what is a closure"), "what is a closure"); // definitions rely on 'what is'
    assert.equal(naturalize("how do i reverse a string"), "how do i reverse a string"); // how-to signals code
  });
});

group("engine/advanced: sequences", () => {
  test("arithmetic", () => {
    const r = sequence("2 5 8 11 14");
    assert.equal(r.kind, "arithmetic"); assert.equal(r.common, 3);
    assert.deepEqual(r.next, [17, 20, 23]);
  });
  test("geometric", () => {
    const r = sequence("3 6 12 24");
    assert.equal(r.kind, "geometric"); assert.equal(r.common, 2);
    assert.deepEqual(r.next, [48, 96, 192]);
  });
  test("quadratic (constant second difference)", () => {
    const r = sequence("1 4 9 16 25");
    assert.equal(r.kind, "quadratic"); assert.deepEqual(r.next, [36, 49, 64]);
  });
  test("Fibonacci-like", () => {
    const r = sequence("1 1 2 3 5 8");
    assert.ok(/additive/.test(r.kind)); assert.deepEqual(r.next, [13, 21, 34]);
  });
  test("no pattern and too-short are rejected", () => {
    assert.equal(sequence("2 7 1 9").ok, false);
    assert.equal(sequence("2 4").ok, false);
  });
});

group("engine/advanced: truth tables", () => {
  test("evaluates and detects tautology / contradiction", () => {
    assert.equal(logic("a or not a").tautology, true);
    assert.equal(logic("a and not a").contradiction, true);
    assert.deepEqual(logic("a -> b").rows.map((r) => r.out), [true, true, false, true]);
  });
  test("respects precedence and parentheses", () => {
    const r = logic("(a and b) or c");
    assert.equal(r.vars.length, 3);
    assert.equal(r.rows.length, 8);
  });
  test("rejects malformed input", () => {
    assert.equal(logic("a and and b").ok, false);
  });
});

group("engine/advanced: set operations", () => {
  test("union / intersection / difference / symmetric", () => {
    assert.deepEqual(setOps("{1,2,3} and {2,3,4}").result, ["1", "2", "3", "4"]);
    assert.deepEqual(setOps("intersection of {1,2,3} and {2,3,4}").result, ["2", "3"]);
    assert.deepEqual(setOps("difference of {1,2,3} and {2,3,4}").result, ["1"]);
    assert.deepEqual(setOps("symmetric difference of {1,2,3} and {2,3,4}").result, ["1", "4"]);
  });
  test("needs two sets", () => {
    assert.equal(setOps("just {1,2,3}").ok, false);
  });
});

group("engine/matrix: linear algebra", () => {
  test("determinant, multiply, inverse, transpose", () => {
    assert.equal(determinant([[1, 2], [3, 4]]), -2);
    assert.deepEqual(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]]), [[19, 22], [43, 50]]);
    assert.deepEqual(inverse([[4, 7], [2, 6]]), [[0.6, -0.7], [-0.2, 0.4]]);
  });
  test("vector dot and cross", () => {
    assert.equal(dot([1, 2, 3], [4, 5, 6]), 32);
    assert.deepEqual(cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
  });
  test("linalg routes from text", () => {
    assert.equal(linalg("determinant of [[1,2],[3,4]]").value, -2);
    assert.equal(linalg("magnitude of [3,4]").value, 5);
    assert.equal(linalg("multiply [[1,0],[0,1]] and [[2,3],[4,5]]").matrix[0][0], 2);
  });
  test("singular matrix has no inverse", () => {
    assert.equal(linalg("inverse of [[1,2],[2,4]]").ok, false);
  });
});

group("engine/units: unit-aware arithmetic", () => {
  test("adds and subtracts same-dimension quantities", () => {
    assert.equal(unitMath("5 km + 300 m").value, 5.3);
    assert.equal(unitMath("2 hours + 45 minutes").value, 2.75);
    assert.equal(unitMath("3 kg - 500 g").value, 2.5);
  });
  test("optional output unit and dimension mismatch", () => {
    assert.equal(unitMath("1 gb + 512 mb").value, 1.5);
    assert.equal(unitMath("5 km + 2 kg").ok, false);
  });
});

group("engine/advanced: combinatorics", () => {
  test("combinations and permutations, either phrasing", () => {
    assert.equal(combinatorics("10 choose 3").value, 120);
    assert.equal(combinatorics("choose 3 from 10").value, 120);
    assert.equal(combinatorics("permutations of 3 from 10").value, 720);
    assert.equal(combinatorics("ways to arrange 5").value, 120);
  });
  test("probability with stated assumptions", () => {
    assert.equal(combinatorics("probability of 3 heads in a row").value, 0.125);
    assert.equal(combinatorics("probability of 2 out of 8").value, 0.25);
  });
});

group("engine/synth: from-scratch code synthesis", () => {
  test("parseSpec pulls name, params, body", () => {
    const s = parseSpec("f(x, y) = x^2 + y^2 in rust");
    assert.equal(s.name, "f"); assert.deepEqual(s.params, ["x", "y"]); assert.equal(s.body, "x^2 + y^2");
  });
  test("multi-variable formula compiles per language from an AST", () => {
    const r = synth({ name: "f", params: ["x", "y"], body: "x^2 + y^2" });
    assert.equal(r.ok, true);
    assert.equal(r.langs.python.code, "def f(x, y):\n    return (x ** 2) + (y ** 2)");
    assert.equal(r.langs.rust.code, "fn f(x: f64, y: f64) -> f64 {\n    (x.powf(2.0)) + (y.powf(2.0))\n}");
    assert.ok(/math\.Pow/.test(r.langs.go.code));
  });
  test("conditional / piecewise: ternary, python if-else, go if-return", () => {
    const r = synth({ name: "f", params: ["x"], body: "x if x > 0 else -x" });
    assert.equal(r.langs.python.code, "def f(x):\n    return x if x > 0 else -x");
    assert.equal(r.langs.javascript.code, "function f(x) {\n  return (x > 0) ? x : -x;\n}");
    assert.ok(/if x > 0[\s\S]*\} else \{/.test(r.langs.rust.code));
    assert.ok(/if x > 0 \{\n\t\treturn x\n\t\}\n\treturn -x/.test(r.langs.go.code));
  });
  test("boolean-valued function gets a boolean return type", () => {
    const r = synth({ name: "even", params: ["n"], body: "n % 2 == 0" });
    assert.equal(r.bool, true);
    assert.ok(/-> bool/.test(r.langs.rust.code));
    assert.ok(/: boolean/.test(r.langs.typescript.code));
  });
  test("math calls map to each language's library", () => {
    const r = synth({ name: "d", params: ["x", "y"], body: "sqrt(x*x + y*y)" });
    assert.ok(/math\.sqrt/.test(r.langs.python.code) && r.langs.python.uses.includes("math"));
    assert.ok(/\.sqrt\(\)/.test(r.langs.rust.code));
  });
  test("rejects a non-expression body", () => {
    assert.equal(synth({ name: "f", params: ["x"], body: "x +" }).ok, false);
    assert.equal(parseSpec("just some words"), null);
  });
  test("infers integer types for pure integer arithmetic", () => {
    const r = synth({ name: "add", params: ["a", "b"], body: "a + b" });
    assert.equal(r.numeric, "int");
    assert.equal(r.langs.rust.code, "fn add(a: i64, b: i64) -> i64 {\n    a + b\n}");
    assert.ok(/func add\(a int, b int\) int/.test(r.langs.go.code));
    assert.ok(/static long add\(long a, long b\)/.test(r.langs.java.code));
  });
  test("division / powers / math calls force floating point", () => {
    assert.equal(synth({ name: "half", params: ["x"], body: "x / 2" }).numeric, "float");
    assert.equal(synth({ name: "sq", params: ["x"], body: "x^2" }).numeric, "float");
    assert.equal(synth({ name: "r", params: ["x"], body: "sqrt(x)" }).numeric, "float");
  });
  test("multi-step body compiles to local let/const bindings", () => {
    const r = synth({ name: "root", params: ["a", "b", "c"], body: "let d = b*b - 4*a*c; (-b + sqrt(d)) / (2*a)" });
    assert.equal(r.ok, true);
    assert.equal(r.langs.python.code, "def root(a, b, c):\n    d = (b * b) - ((4 * a) * c)\n    return (-b + math.sqrt(d)) / (2 * a)");
    assert.ok(/let d = /.test(r.langs.rust.code));
    assert.ok(/d := /.test(r.langs.go.code));
    assert.ok(/double d = /.test(r.langs.java.code));
  });
  test("parseSpec accepts a multi-step let body", () => {
    const s = parseSpec("root(a,b,c) = let d = b*b - 4*a*c; (-b + sqrt(d))/(2*a)");
    assert.equal(s.name, "root");
    assert.ok(/let d/.test(s.body) && /;/.test(s.body));
  });
  test("N-ary min/max folds for languages without a variadic form", () => {
    const r = synth({ name: "m3", params: ["a", "b", "c"], body: "max(a, b, c)" });
    assert.equal(r.langs.python.code, "def m3(a, b, c):\n    return max(a, b, c)");
    assert.ok(/Math\.max\(Math\.max\(a, b\), c\)/.test(r.langs.java.code));
    assert.ok(/\(\(a\)\.max\(b\)\)\.max\(c\)/.test(r.langs.rust.code));
  });
  test("nested conditional stays valid Go (if/return chain, no ternary)", () => {
    const r = synth({ name: "clamp", params: ["x"], body: "x < 0 ? 0 : (x > 100 ? 100 : x)" });
    assert.ok(!/\?/.test(r.langs.go.code)); // Go has no ternary operator
    assert.ok(/if x < 0 \{[\s\S]*return 0[\s\S]*if x > 100 \{[\s\S]*return 100[\s\S]*return x/.test(r.langs.go.code));
    assert.ok(/else if x > 100/.test(r.langs.rust.code)); // Rust uses idiomatic else-if
  });
  test("C-style ternary lexes and compiles", () => {
    const r = synth({ name: "f", params: ["x"], body: "x > 0 ? x : -x" });
    assert.equal(r.ok, true);
    assert.equal(r.langs.javascript.code, "function f(x) {\n  return (x > 0) ? x : -x;\n}");
  });
  test("extended math functions map per language", () => {
    const r = synth({ name: "h", params: ["a", "b"], body: "hypot(a, b)" });
    assert.ok(/math\.hypot/.test(r.langs.python.code));
    assert.ok(/\(a\)\.hypot\(b\)/.test(r.langs.rust.code));
    assert.ok(/Math\.log10/.test(synth({ name: "l", params: ["x"], body: "log10(x)" }).langs.java.code));
  });
  test("compiles self-recursion (calls to the function's own name)", () => {
    const r = synth({ name: "fact", params: ["n"], body: "n <= 1 ? 1 : n * fact(n - 1)" });
    assert.equal(r.ok, true); assert.equal(r.recursive, true); assert.equal(r.numeric, "int");
    assert.equal(r.langs.python.code, "def fact(n):\n    return 1 if n <= 1 else (n * fact(n - 1))");
    assert.ok(/fact\(n - 1\)/.test(r.langs.rust.code) && /-> i64/.test(r.langs.rust.code));
    assert.ok(/return fact\(n - 1\)/.test(r.langs.go.code) || /fact\(n - 1\)/.test(r.langs.go.code));
  });
  test("mutual recursion arguments and multiple self-calls (fibonacci)", () => {
    const r = synth({ name: "fib", params: ["n"], body: "n < 2 ? n : fib(n - 1) + fib(n - 2)" });
    assert.equal(r.recursive, true);
    assert.ok(/fib\(n - 1\) \+ fib\(n - 2\)/.test(r.langs.javascript.code));
  });
  test("compiles an aggregation into an accumulator loop", () => {
    const r = synth({ name: "fact", params: ["n"], body: "prod(i, 1, n, i)" });
    assert.equal(r.ok, true); assert.equal(r.iterative, true);
    assert.equal(r.langs.python.code, "def fact(n):\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result");
    assert.ok(/for i := 1; i <= n; i\+\+ \{/.test(r.langs.go.code) && /result \*= i/.test(r.langs.go.code));
    assert.ok(/let mut result: i64 = 1;/.test(r.langs.rust.code) && /for i in 1..=n/.test(r.langs.rust.code));
    assert.deepEqual(r.params, ["n"]); // i and result are locals, only n is a parameter
  });
  test("sum and count aggregations compile with the right accumulator", () => {
    const s = synth({ name: "sumsq", params: ["n"], body: "sum(i, 1, n, i*i)" });
    assert.ok(/result = 0/.test(s.langs.python.code) && /result \+= i \* i/.test(s.langs.python.code));
    const c = synth({ name: "evens", params: ["n"], body: "count(i, 1, n, i % 2 == 0)" });
    assert.ok(/if \(i % 2\) == 0:/.test(c.langs.python.code) && /result \+= 1/.test(c.langs.python.code));
  });
  test("rejects floating-point aggregation (integer domain only)", () => {
    const r = synth({ name: "bad", params: ["n"], body: "sum(i, 1, n, i / 2)" });
    assert.equal(r.ok, false); assert.ok(/integer/.test(r.error));
  });
});

group("engine/skills: convert", () => {
  test("length and the classic marathon", () => {
    const r = convert("26.2 miles to km");
    assert.equal(r.ok, true); assert.equal(r.dim, "length");
    near(r.value, 42.1648128, 1e-5);
  });
  test("temperature is non-linear", () => {
    assert.equal(convert("100 c to f").value, 212);
    assert.equal(convert("32 f to c").value, 0);
  });
  test("rejects cross-dimension and unknown units", () => {
    assert.equal(convert("5 kg to m").ok, false);
    assert.equal(convert("5 blorp to m").ok, false);
    assert.equal(convert("hello").ok, false);
  });
});

group("engine/skills: codegen", () => {
  test("synthesizes a known op into the requested language", () => {
    const r = codegen("write a factorial function in rust");
    assert.equal(r.ok, true); assert.equal(r.kind, "synthesized");
    assert.equal(r.lang, "rust");
    assert.ok(r.code.includes("fn factorial"));
  });
  test("same op, different language, generated fresh", () => {
    const py = codegen("fibonacci in python");
    assert.equal(py.lang, "python");
    assert.ok(py.code.includes("def fibonacci"));
    const js = codegen("fibonacci in javascript");
    assert.ok(js.code.includes("function fibonacci"));
    assert.notEqual(py.code, js.code);
  });
  test("newer algorithms across languages", () => {
    assert.ok(codegen("gcd in python").code.includes("def gcd"));
    assert.ok(codegen("binary search in go").code.includes("func binarySearch"));
    assert.ok(codegen("bubble sort in rust").code.includes("a.swap"));
    assert.ok(codegen("celsius to fahrenheit in c").code.includes("* 9 / 5 + 32"));
    assert.equal(codegen("write average in java").ok, true);
  });
  test("synthesizes a real function from an arbitrary formula spec", () => {
    const r = codegen("write a function f(x) = 3x^2 - 2x + 1 in rust");
    assert.equal(r.ok, true); assert.equal(r.op, "expression"); assert.equal(r.lang, "rust");
    assert.ok(/fn f\(x: f64\)/.test(r.code));
    assert.ok(r.code.includes("x*x")); // ^2 expanded to portable multiplication
    const py = codegen("a python function that returns x*2 + 7");
    assert.ok(py.code.includes("def f(x):") && py.code.includes("return x*2+7"));
  });
  test("unknown task yields a typed scaffold, honestly labeled", () => {
    const r = codegen("a function that frobnicates widgets in python");
    assert.equal(r.kind, "skeleton");
    assert.ok(r.code.includes("NotImplementedError"));
    assert.ok(/scaffold/i.test(r.note));
  });
});

group("advanced: statistics", () => {
  test("full numeric summary", () => {
    const s = stats("4 8 15 16 23 42");
    assert.equal(s.count, 6); assert.equal(s.sum, 108); assert.equal(s.mean, 18);
    assert.equal(s.min, 4); assert.equal(s.max, 42); assert.equal(s.median, 15.5);
  });
  test("mode detects repeats and reports none when all unique", () => {
    assert.deepEqual(stats("1 2 2 3 3 3").mode, [3]);
    assert.deepEqual(stats("1 2 3 4").mode, []);
  });
  test("empty input is safe", () => { assert.equal(stats("no numbers here").ok, false); });
});

group("advanced: equation solver", () => {
  test("linear", () => {
    const r = solveEquation("2x + 3 = 7");
    assert.equal(r.ok, true); assert.equal(r.degree, 1); assert.deepEqual(r.roots, [2]);
  });
  test("quadratic with two roots (sorted)", () => {
    const r = solveEquation("x^2 - 5x + 6 = 0");
    assert.equal(r.degree, 2); assert.deepEqual(r.roots, [2, 3]);
  });
  test("no real roots reported honestly", () => {
    const r = solveEquation("x^2 + 1 = 0");
    assert.equal(r.ok, true); assert.deepEqual(r.roots, []);
  });
  test("rejects non-equations", () => { assert.equal(solveEquation("2x+3").ok, false); });
});

group("advanced: number theory", () => {
  test("primality and factorization", () => {
    assert.equal(isPrime(97), true); assert.equal(isPrime(91), false);
    assert.deepEqual(factorize(360), [2, 2, 2, 3, 3, 5]);
    assert.equal(nthPrime(10), 29);
    assert.equal(nthFib(10), 55);
  });
  test("router parses common phrasings", () => {
    assert.ok(numberTheory("factorize 360").text.includes("2^3"));
    assert.equal(numberTheory("gcd 48 60").text, "12");
    assert.equal(numberTheory("lcm 4 6").text, "12");
    assert.ok(numberTheory("is 97 prime").text.includes("is prime"));
    assert.ok(numberTheory("10th prime").text.includes("29"));
  });
});

group("advanced: encode / hash", () => {
  test("reversible encodings round-trip", () => {
    assert.equal(encode("unbase64", encode("base64", "hello")), "hello");
    assert.equal(encode("unhex", encode("hex", "Hi")), "Hi");
    assert.equal(encode("rot13", encode("rot13", "Attack")), "Attack");
    assert.equal(encode("unbinary", encode("binary", "AB")), "AB");
  });
  test("hashes are deterministic and fixed-width", () => {
    assert.equal(encode("crc32", "hello"), encode("crc32", "hello"));
    assert.equal(encode("crc32", "hello").length, 8);
    assert.equal(encode("fnv1a", "hello").length, 8);
    assert.notEqual(encode("crc32", "hello"), encode("crc32", "world"));
  });
  test("morse", () => { assert.equal(encode("morse", "sos"), "... --- ..."); });
});

group("advanced: knowledge base", () => {
  test("finds a definition and resolves aliases", () => {
    assert.equal(lookup("what is a hash function").term, "hash function");
    assert.equal(lookup("explain XSS").term, "cross site scripting");
    assert.ok(lookup("define recursion").text.length > 20);
  });
  test("returns not-found rather than inventing", () => {
    const r = lookup("what is the meaning of life");
    assert.equal(r.ok, false); assert.ok(Array.isArray(r.terms));
  });
  test("expanded glossary covers common casual terms", () => {
    assert.equal(lookup("what is a hash map").ok, true);
    assert.equal(lookup("whats an algorithm").ok, true);
    assert.equal(lookup("explain dynamic programming").ok, true);
    assert.equal(lookup("what is json").ok, true);
  });
});

group("engine/skills: text, regex, datetime", () => {
  test("text transforms", () => {
    assert.equal(text("upper", "hi"), "HI");
    assert.equal(text("reverse", "abc"), "cba");
    assert.equal(text("words", "a b c"), 3);
    assert.equal(text("slug", "Hello, World!"), "hello-world");
    assert.equal(text("unbase64", text("base64", "hello")), "hello");
  });
  test("regex builder returns tested patterns", () => {
    assert.equal(regexBuild("regex for an email address").key, "email");
    assert.ok(new RegExp(regexBuild("email").re).test("a@b.co"));
    assert.equal(regexBuild("pattern for nonsense").ok, false);
  });
  test("date math in UTC", () => {
    assert.equal(datetime("days between 2024-01-01 and 2024-12-31").value, 365);
    assert.equal(datetime("add 10 days to 2024-01-01").text, "2024-01-11");
    assert.equal(datetime("gibberish").ok, false);
  });
  test("days until a date or holiday", () => {
    const r = datetime("how many days until 3000-01-01");
    assert.equal(r.ok, true); assert.equal(r.kind, "until"); assert.ok(r.value > 0);
    assert.equal(datetime("days until christmas").ok, true);
  });
});

group("skills: text transforms (extended)", () => {
  test("case variants", () => {
    assert.equal(text("camel", "hello world example"), "helloWorldExample");
    assert.equal(text("snake", "Hello World Example"), "hello_world_example");
    assert.equal(text("kebab", "Hello World"), "hello-world");
    assert.equal(text("constant", "hello world"), "HELLO_WORLD");
  });
  test("extraction and frequency", () => {
    assert.equal(text("emails", "reach a@b.co and c@d.io"), "a@b.co\nc@d.io");
    assert.equal(text("numbers", "3 apples, 12 pears, 0.5 kg"), "3\n12\n0.5");
    assert.ok(text("wordfreq", "the cat the dog the").startsWith("3\tthe"));
  });
});

group("skills: regex tester", () => {
  test("runs a pattern against sample text", () => {
    const r = regexTest("\\d+", "a1 b22 c333");
    assert.equal(r.ok, true); assert.equal(r.count, 3); assert.deepEqual(r.matches, ["1", "22", "333"]);
  });
  test("invalid pattern is reported, not thrown", () => { assert.equal(regexTest("(", "x").ok, false); });
  test("no match is honest", () => { assert.equal(regexTest("z+", "abc").matched, false); });
});

group("data: CSV analysis", () => {
  test("parses quoted fields and CRLF", () => {
    const p = parseCSV('name,note\r\n"Ada, L.","said ""hi"""\nBob,plain');
    assert.deepEqual(p.headers, ["name", "note"]);
    assert.deepEqual(p.rows[0], ["Ada, L.", 'said "hi"']);
    assert.deepEqual(p.rows[1], ["Bob", "plain"]);
  });
  test("summarizes numeric and text columns", () => {
    const a = analyzeCSV("name,age\nAda,36\nBob,41\nAda,36");
    assert.equal(a.ok, true); assert.equal(a.rows, 3); assert.equal(a.columns, 2);
    const age = a.cols.find((c) => c.name === "age");
    assert.equal(age.type, "numeric"); assert.equal(age.min, 36); assert.equal(age.max, 41); assert.equal(age.mean, 37.666666667);
    const name = a.cols.find((c) => c.name === "name");
    assert.equal(name.type, "text"); assert.equal(name.distinct, 2); assert.ok(name.top[0].startsWith("Ada"));
  });
  test("empty input is safe", () => { assert.equal(analyzeCSV("").ok, false); });
});

group("data: base + roman", () => {
  test("base conversions", () => {
    assert.equal(numberBase("255 to hex").text, "255 = 0xff (base 16)");
    assert.equal(numberBase("0xff to binary").value, "11111111");
    assert.equal(numberBase("42 in binary").value, "101010");
  });
  test("roman numerals both ways", () => {
    assert.equal(toRoman(2024), "MMXXIV");
    assert.equal(fromRoman("MMXXIV"), 2024);
    assert.equal(toRoman(4000), null);
    assert.ok(numberBase("12 to roman").text.includes("XII"));
  });
});

group("more: color conversion", () => {
  test("hex to rgb and hsl", () => {
    const r = colorConvert("#ff8800 to rgb");
    assert.equal(r.ok, true); assert.equal(r.rgb, "rgb(255, 136, 0)"); assert.equal(r.hex, "#ff8800");
    assert.equal(r.hsl, "hsl(32, 100%, 50%)");
  });
  test("rgb to hex, and 3-digit hex expands", () => {
    assert.equal(colorConvert("rgb(255,136,0)").hex, "#ff8800");
    assert.equal(colorConvert("#0f0").rgb, "rgb(0, 255, 0)");
  });
  test("out-of-range and garbage are rejected", () => {
    assert.equal(colorConvert("rgb(300,0,0)").ok, false);
    assert.equal(colorConvert("not a color").ok, false);
  });
});

group("more: JSON query", () => {
  const blob = '{"users":[{"name":"Ada","age":36},{"name":"Bob"}],"count":2}';
  test("navigates by dotted/bracketed path", () => {
    assert.equal(navigate(JSON.parse(blob), ".users[0].name"), "Ada");
    assert.equal(navigate(JSON.parse(blob), ".count"), 2);
  });
  test("end-to-end query pulls the value", () => {
    assert.equal(jsonQuery("get .users[0].name in " + blob).value, "Ada");
    assert.equal(jsonQuery("query .users[1].name from " + blob).value, "Bob");
  });
  test("missing path and bad json are reported", () => {
    assert.equal(jsonQuery("get .nope in " + blob).ok, false);
    assert.equal(jsonQuery("get .x in {bad json}").ok, false);
  });
});

group("skills: datetime (extended)", () => {
  test("leap year", () => {
    assert.ok(datetime("is 2024 a leap year").text.includes("is a leap year"));
    assert.ok(datetime("is 2023 a leap year").text.includes("not a leap year"));
    assert.ok(datetime("is 1900 a leap year").text.includes("not a leap year"));
  });
  test("day of year", () => {
    assert.equal(datetime("day of year for 2024-03-01").value, 61); // 2024 is a leap year
  });
});

group("engine: wiring and hygiene (source level)", () => {
  test("no emojis anywhere in the engine", () => {
    const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const f of ["../../src/predict.js", "../../src/skills.js",
      "../../src/advanced.js", "../../src/data.js", "../../src/more.js", "../../src/engine.js", "../../src/corpus.js", "../../src/nlp.js", "../../src/matrix.js", "../../src/units.js", "../../src/synth.js", "../../src/smart.js", "../../src/spell.js", "../../src/facts.js", "../../src/hash.js"]) {
      assert.deepEqual([...read(f)].filter((ch) => re.test(ch)), [], f);
    }
  });
  test("engine.js only pulls from local engine modules (no network, no AI import)", () => {
    const eng = read("../../src/engine.js");
    const imports = [...eng.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(imports.filter((i) => !i.startsWith("./")), []);
  });
  test("engine.js wires typo tolerance and the word-problem skill", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/normalizeTypos/.test(eng) && /editDist/.test(eng));
    assert.ok(/case "wordmath": return A\.wordMath/.test(eng));
  });
  test("engine.js wires the NLU layer and the new reasoning skills", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/from "\.\/nlp\.js"/.test(eng));
    assert.ok(/mathPhrase/.test(eng) && /numberWords/.test(eng));
    assert.ok(/case "sequence": return A\.sequence/.test(eng));
    assert.ok(/case "logic": return A\.logic/.test(eng));
    assert.ok(/case "setops": return A\.setOps/.test(eng));
  });
  test("engine.js wires matrix, units, and combinatorics", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/from "\.\/matrix\.js"/.test(eng) && /from "\.\/units\.js"/.test(eng));
    assert.ok(/case "matrix": return MX\.linalg/.test(eng));
    assert.ok(/case "units": return unitMath/.test(eng));
    assert.ok(/case "combinatorics": return A\.combinatorics/.test(eng));
  });
  test("engine.js wires the from-scratch code synthesizer", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/from "\.\/synth\.js"/.test(eng));
    assert.ok(/parseSpec\(input\)/.test(eng) && /synth\(spec\)/.test(eng));
  });
  test("engine.js routes a bare function spec to codegen via parseSpec", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/parseSpec\(s\)\)\s*add\("codegen"/.test(eng));
  });
  test("engine.js answers whole-app requests honestly (not a shrug)", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/classifyBuild/.test(eng) && /APP_NOUN/.test(eng));
    // a build+app request is recognized and offered Smart mode, not routed to a scaffold
    assert.ok(/not a single function/.test(eng));
    assert.ok(/Smart mode/.test(eng));
    // app nouns without an algorithm keyword are excluded from codegen routing
    assert.ok(/langKW && !APP_NOUN\.test\(low\)/.test(eng));
  });
  test("engine.js only predicts a continuation when the text reads mid-sentence", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/midSentence/.test(eng));
    assert.ok(/recognizedWords/.test(eng));
  });
  test("engine.js routes through the conversational naturalize front-end", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/naturalize/.test(eng) && /numberWords\(naturalize\(s\)\)/.test(eng));
  });
  test("synth.js imports nothing (pure compiler, Node-testable)", () => {
    const sy = read("../../src/synth.js");
    assert.deepEqual([...sy.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)], []);
  });
  test("nlp.js imports nothing (pure, model-free, Node-testable)", () => {
    const nlp = read("../../src/nlp.js");
    assert.deepEqual([...nlp.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)], []);
  });
  test("the deterministic core never imports the optional Smart mode front-end", () => {
    const eng = read("../../src/engine.js");
    assert.ok(!/smart\.js/.test(eng)); // smart mode is a UI-only add-on; the engine stays model-free
  });
  test("smart.js calls the server route, ships no key, and bundles no model", () => {
    const smart = read("../../src/smart.js");
    assert.ok(/\/api\/smart/.test(smart)); // the key lives only in the Worker's secrets
    assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(smart) && !/generativelanguage/.test(smart) && !/localStorage/.test(smart));
    const imports = [...smart.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)];
    assert.deepEqual(imports, []); // no imports: pure browser fetch, nothing bundled
  });
});

group("engine/facts: curated fact packs (capitals, elements, constants)", () => {
  test("capitals: plain, aliased, multi-word, and reverse questions", () => {
    assert.equal(capital("what is the capital of france").capital, "Paris");
    const uk = capital("whats the capital of the uk"); assert.equal(uk.capital, "London"); assert.equal(uk.country, "United Kingdom");
    assert.equal(capital("capital of bosnia and herzegovina").capital, "Sarajevo");
    const rev = capital("amsterdam is the capital of which country"); assert.equal(rev.country, "Netherlands"); assert.ok(rev.reverse);
    assert.equal(capital("capital of atlantis").ok, false); // unknown: no invented answer
  });
  test("capitals: a short alias never matches inside another word", () => {
    assert.equal(capital("capital of belarus").capital, "Minsk"); // "us" must not match inside "belarus"
    assert.equal(withThe("Netherlands"), "the Netherlands");
    assert.equal(withThe("Japan"), "Japan");
    assert.ok(Object.keys(CAPITALS).length >= 195);
  });
  test("elements: all 118, by name, number, symbol, and alternate spelling", () => {
    assert.equal(ELEMENTS.length, 118);
    assert.deepEqual(ELEMENTS.map((e) => e.z), Array.from({ length: 118 }, (_, i) => i + 1));
    assert.equal(element("tell me about gold").sym, "Au");
    assert.equal(element("element 26").name, "iron");
    assert.equal(element("atomic mass of Fe").name, "iron");
    assert.equal(element("aluminium").name, "aluminum");
    assert.equal(element("oganesson").z, 118);
  });
  test("elements: ordinary words are not read as symbols", () => {
    assert.equal(element("he is in no rush").ok, false); // He, In, No only count with element casing
  });
  test("constants: multi-word names keep their words; one-letter keys cannot leak", () => {
    assert.equal(constant("speed of light").value, 2.99792458e8);
    assert.equal(constant("what is planck's constant").name, "planck constant"); // not "c" inside "planck"
    assert.equal(constant("euler's number").value, Math.E);
    assert.equal(constant("mass of the sun").value, 1.989e30);
    assert.equal(constant("warp factor").ok, false);
  });
  test("facts dispatcher and scientific formatting", () => {
    assert.equal(facts("capital of japan").capital, "Tokyo");
    assert.equal(facts("atomic number of carbon").z, 6);
    assert.equal(facts("avogadro constant").value, 6.02214076e23);
    assert.equal(facts("what is 36 times 3").ok, false); // a bare number is not element 36
    assert.equal(facts("what is element 36").name, "krypton");
    assert.equal(sci(2.99792458e8), "2.99792458 x 10^8");
    assert.equal(sci(1.380649e-23), "1.380649 x 10^-23");
    assert.equal(sci(9.80665), "9.80665");
  });
  test("nlp: 'sqrt of' and 'cube root of' translate to calc", () => {
    assert.equal(mathPhrase("sqrt of 2"), "sqrt(2)");
    assert.equal(mathPhrase("cube root of 27"), "cbrt(27)");
  });
  test("engine.js wires facts as a skill, protected from typo correction", () => {
    const eng = read("../../src/engine.js");
    assert.ok(/import \* as F from "\.\/facts\.js"/.test(eng));
    assert.ok(/case "facts": return F\.facts\(input\)/.test(eng));
    assert.ok(/"sqrt", "cbrt"/.test(eng)); // "sqrt" must not be corrected to "sort"
    assert.ok(/"factor", "factors"/.test(eng)); // "factors" must not be corrected to "vectors"
    assert.ok(/"multiply", "multiplied", "divide"/.test(eng)); // "multiply" must not be corrected to "multiple"
    assert.ok(/!\/\\d\{4\}-\\d\{1,2\}-\\d\{1,2\}\/\.test\(s\)/.test(eng)); // ISO-date dashes are not unit subtraction
    assert.ok(/!A\.lookup\(s\)\.ok/.test(eng)); // a glossary definition outranks a fact-pack guess
  });
  test("facts.js imports nothing (Node-testable, no model)", () => {
    const src = read("../../src/facts.js");
    assert.deepEqual([...src.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)], []);
  });
});

group("engine/spell: keyboard-aware typo correction", () => {
  const lex = makeLexicon(["capital", "france", "fibonacci", "python", "reverse", "recursion", "prediction", "kilometer", "planck"]);
  test("fixes the slips people actually make", () => {
    const cases = { conttinue: "continue", smmarter: "smarter", powerfuk: "powerful", whatt: "what", tto: "to", teh: "the", waht: "what",
      fibonaci: "fibonacci", frnace: "france", captial: "capital", wrte: "write", pythn: "python", revrse: "reverse", recurison: "recursion", predicton: "prediction", undrstand: "understand" };
    for (const [typo, want] of Object.entries(cases)) assert.equal(correctWord(lex, typo), want, typo);
  });
  test("weights: neighbouring key and swapped letters are cheaper than a random substitution", () => {
    assert.ok(isAdjacent("k", "l") && !isAdjacent("k", "q"));
    assert.ok(typoDistance("powerfuk", "powerful") < typoDistance("powerfuq", "powerful"));
    assert.ok(typoDistance("teh", "the") < 1);
    assert.ok(typoDistance("smmarter", "smarter") <= 0.3); // a doubled key is nearly free
  });
  test("splits run-together words but prefers a one-letter fix", () => {
    assert.equal(correctWord(lex, "whatis"), "what is");
    assert.equal(correctWord(lex, "howmany"), "how many");
    assert.equal(correctWord(lex, "predicton"), "prediction"); // not "predict on"
  });
  test("never touches known words, inflections, numbers or unknowable words", () => {
    assert.equal(correctWord(lex, "capital"), null);
    assert.equal(correctWord(lex, "capitals"), null);
    assert.equal(correctWord(lex, "kilometers"), null);
    assert.equal(correctWord(lex, "x2"), null);
    assert.equal(correctWord(lex, "zzqxv"), null);
  });
  test("leaves content alone: quotes, brackets, payload after a colon, identifiers, names", () => {
    assert.equal(correctText(lex, 'revrse "helo wrld"').text, 'reverse "helo wrld"');
    assert.equal(correctText(lex, "revrse: helo wrld").text, "reverse: helo wrld");
    assert.equal(correctText(lex, "sum of [helo, wrld]").text, "sum of [helo, wrld]");
    assert.equal(correctText(lex, "fib(n) = fibo(n-1)").text, "fib(n) = fibo(n-1)");
    assert.equal(correctText(lex, "then Maya saved 45").text, "then Maya saved 45");
    assert.equal(correctText(lex, "Maya saved 45").text, "Maya saved 45"); // a capitalised opener only gets a cheap fix
  });
  test("reports every fix and keeps the user's capitalisation", () => {
    const r = correctText(lex, "Whats the Captial of frnace");
    assert.equal(r.text, "Whats the Capital of france");
    assert.deepEqual(r.fixes.map((f) => f.to), ["capital", "france"]);
  });
  test("accept() limits which fixes apply (command words only)", () => {
    const r = correctText(lex, "revrse helo wrld", (to) => to === "reverse");
    assert.equal(r.text, "reverse helo wrld");
  });
  test("fuzzy prefix completes a mistyped half-word", () => {
    assert.ok(fuzzyPrefix(lex, "fibn").includes("fibonacci"));
    assert.ok(fuzzyPrefix(lex, "pyht").includes("python"));
  });
  test("deterministic: same input, same corrections", () => {
    assert.deepEqual(correctText(lex, "waht is recurison"), correctText(lex, "waht is recurison"));
  });
});

group("engine/predict: adapting to the user (learn)", () => {
  test("learn() makes a user's own phrasing the top prediction", () => {
    const m = train("the cat sat on the mat. the cat sat on the rug.");
    assert.notEqual(predictNext(m, "deploy to", 1)[0] && predictNext(m, "deploy to", 1)[0].token, "firebase");
    learn(m, "deploy to firebase. deploy to firebase.");
    assert.equal(predictNext(m, "deploy to", 1)[0].token, "firebase");
    assert.ok(m.vocab.includes("firebase"));
  });
});

group("engine: typo-aware routing + prediction wiring (source level)", () => {
  const eng = read("../../src/engine.js");
  test("respond() reads through typos, but never 'corrects' a code spec", () => {
    assert.ok(/const spec = parseSpec\(raw\)/.test(eng) && /fixTypos\(sa\.text, model\)/.test(eng) && /slang\(raw, true\)/.test(eng));
    assert.ok(/text: rephrase\(f1\.text\)/.test(eng) && /"Understood as \\u201c"/.test(eng)); // rephrasing is shown too
    assert.ok(/const VERBATIM = new Set\(\[[^\]]*"text", "encode"/.test(eng)); // content-transform skills keep the user's words
    assert.ok(/top\.skill === "data"/.test(eng)); // CSV is never touched
    assert.ok(/"Read " \+ applied/.test(eng)); // corrections are shown, not hidden
  });
  test("predictWords fills slots (countries, units, languages) and buildModel adds the phrasebook", () => {
    assert.ok(/export function predictWords/.test(eng) && /function slotWords/.test(eng));
    assert.ok(/capital \(\?:city \)\?of/.test(eng));
    assert.ok(/export function buildModel/.test(eng) && /Object\.values\(A\.GLOSSARY\)/.test(eng));
  });
  test("spell.js imports nothing (Node-testable, no model)", () => {
    const src = read("../../src/spell.js");
    assert.deepEqual([...src.matchAll(/\bimport\b[^;\n]*?\bfrom\s+"([^"]+)"/g)], []);
  });
});

group("engine: optional Smart mode bridge (source level)", () => {
  const smart = read("../../src/smart.js");
  test("Smart mode plans steps with conversation context through a server route", () => {
    assert.ok(/export async function smartInterpret\(input, history = \[\]\)/.test(smart));
    assert.ok(/history: \(history \|\| \[\]\)\.slice\(-6\)/.test(smart));
  });
  test("the bridge names no vendor and bundles no key or model", () => {
    for (const f of [smart, read("../../src/engine.js")]) assert.ok(!/gemini/i.test(f.replace(/\/\/.*$/gm, "")));
    assert.ok(!/AIza[0-9A-Za-z_-]{20,}/.test(smart));
  });
});

group("engine/hash: digests from the spec", () => {
  test("md5, sha1 and sha256 match Node's crypto, across padding edges and Unicode", () => {
    for (const x of ["", "hello", "The quick brown fox jumps over the lazy dog", "a".repeat(55), "a".repeat(56), "a".repeat(64), "a".repeat(200), "h\u00e9llo \u2713 \ud83d\ude00"]) {
      assert.equal(md5(x), createHash("md5").update(x, "utf8").digest("hex"));
      assert.equal(sha1(x), createHash("sha1").update(x, "utf8").digest("hex"));
      assert.equal(sha256(x), createHash("sha256").update(x, "utf8").digest("hex"));
    }
  });
  test("hash.js and words.js import nothing", () => {
    for (const f of ["hash.js", "words.js"]) assert.ok(!/^\s*import\s/m.test(read("../../src/" + f)), f);
  });
});

group("engine/spell: dictionary + context", () => {
  const dict = englishWords();
  const lex = () => withDictionary(makeLexicon(new Map([["miles", 40], ["mile", 40], ["convert", 40], ["st", 40], ["and", 40]]), ["weather", "whether"]), dict);
  test("the dictionary decodes to tens of thousands of real words", () => {
    assert.ok(dict.size > 60000);
    for (const w of ["stand", "third", "biggest", "receive"]) assert.ok(dict.has(w), w);
    assert.ok(!dict.has("teh") && !dict.has("captial"));
  });
  test("a real word is left alone (not split into 'st and')", () => {
    assert.equal(bestFix(lex(), "stand"), null);
  });
  test("ordinary English typos are fixed from the dictionary", () => {
    const l = lex();
    assert.equal(correctWord(l, "recieve"), "receive");
    assert.equal(correctWord(l, "definately"), "definitely");
    assert.equal(correctWord(l, "begining"), "beginning");
  });
  test("after a number, a plural reads right; context can break ties", () => {
    const l = lex();
    assert.equal(bestFix(l, "mils", "5").to, "miles");
    // "carf" is one neighbouring key from both "card" and "cart"; the word before decides
    const base = () => withDictionary(makeLexicon(["card", "cart", "push"]), dict);
    assert.equal(correctText(base(), "push the carf").text, "push the card");
    const c = withContext(base(), (p, w) => (p === "the" && w === "cart" ? 50 : 0));
    assert.equal(correctText(c, "push the carf").text, "push the cart");
  });
});

group("engine/spell: spelling rules and number words", () => {
  const dict = englishWords();
  const full = () => withDictionary(makeLexicon(["the", "a", "an", "of", "in", "and"]), dict, wordBand);
  test("suffix and letter-pattern variants are cheap edits", () => {
    const l = full();
    for (const [bad, good] of [["seperate", "separate"], ["independant", "independent"], ["occurance", "occurrence"], ["acheive", "achieve"], ["calender", "calendar"]])
      assert.equal(correctWord(l, bad), good, bad);
  });
  test("sound-alike letters rank the phonetic word first", () => {
    const l = full();
    assert.equal(rankFixes(l, "realy")[0].to, "really");
    assert.equal(rankFixes(l, "tomorow")[0].to, "tomorrow");
  });
  test("after a determiner, a content word beats a function word", () => {
    assert.equal(correctText(full(), "the wether").text, "the weather");
  });
  test("acronyms and possessives are never mangled", () => {
    const l = full();
    assert.equal(correctText(l, "ABC and NASA").text, "ABC and NASA");
    assert.equal(correctText(l, "the carbon's mass").text, "the carbon's mass");
    assert.equal(correctText(l, "the carbn's mass").text, "the carbon's mass");
  });
  test("isWord knows real words only", () => {
    const l = full();
    assert.ok(isWord(l, "necessary") && !isWord(l, "neccessary"));
  });
  test("numberToWords reads integers, negatives and decimals", () => {
    assert.equal(numberToWords(0), "zero");
    assert.equal(numberToWords(1234), "one thousand two hundred thirty-four");
    assert.equal(numberToWords(-15), "minus fifteen");
    assert.equal(numberToWords(3.14), "three point one four");
    assert.equal(numberToWords(1000000), "one million");
  });
});

group("engine/spell: real prose is left alone", () => {
  const dict = englishWords();
  const full = () => withDictionary(makeLexicon(["the", "a", "of", "and", "capital", "convert"].concat(Array(40).fill("capital"))), dict, wordBand);
  test("British spellings are correct English", () => {
    const l = full();
    for (const w of ["colour", "neighbour", "neighbourhood", "favourable", "centre", "realise", "travelled", "licence", "catalogue"]) assert.equal(bestFix(l, w), null, w);
  });
  test("names inside a sentence and titles are not typos", () => {
    const l = full();
    assert.equal(correctText(l, "and then Chester met Mrs Hurst").text, "and then Chester met Mrs Hurst");
  });
  test("contractions with either apostrophe are kept", () => {
    const l = full();
    assert.equal(correctText(l, "she wasn’t sure and they couldn't go").text, "she wasn’t sure and they couldn't go");
  });
  test("a regular derivation stays unless a cheap correction beats it", () => {
    const l = full();
    assert.equal(bestFix(l, "lamplight"), null);
    assert.equal(bestFix(l, "whisperings"), null);
    assert.equal(correctWord(l, "wonderfull"), "wonderful");
    assert.equal(correctWord(l, "sandwhich"), "sandwich");
  });
  test("silent letters, a dropped r, and -ally/-iness forms", () => {
    const l = full();
    for (const [bad, good] of [["buget", "budget"], ["condem", "condemn"], ["dout", "doubt"], ["youself", "yourself"], ["accidently", "accidentally"], ["specificly", "specifically"], ["lazyness", "laziness"], ["vehical", "vehicle"], ["competion", "competition"]])
      assert.equal(correctWord(l, bad), good, bad);
  });
});

// Round 11 curated knowledge (kb.js + kb-countries/people/syntax): acronyms, country facts,
// people, animals, records, counts, formulas, health guidance, syntax cards, digits of pi,
// time zones and calling codes. Anything that changes over time is refused, questions with
// numbers go to the calculators, and code requests still reach the generator.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-kb-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const KB = await import(pathToFileURL(join(dir, "kb.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => [r.title, r.body, r.pre].filter(Boolean).join(" | ").replace(/\*\*/g, "");
const ask = (q) => text(E.respond(q, model));
const skill = (q) => E.respond(q, model).skill;

group("kb: acronyms, countries, people, animals", () => {
  test("acronyms are answered from the raw question, not the rephrased one", () => {
    assert.ok(/CPU stands for Central Processing Unit/.test(ask("what does cpu stand for")));
    assert.ok(/National Aeronautics and Space Administration/.test(ask("what does nasa stand for")));
  });
  test("country fields", () => {
    assert.ok(/Japanese yen \(JPY\)/.test(ask("what is the currency of japan")));
    assert.ok(/Brazil is in South America/.test(ask("what continent is brazil in")));
    assert.ok(/India has about 1\.45 billion/.test(ask("what is the population of india")));
    assert.ok(/drive on the left/.test(ask("which side of the road do they drive on in japan")));
  });
  test("people and animals", () => {
    assert.ok(/Albert Einstein \(1879-1955\)/.test(ask("who was albert einstein")));
    assert.ok(/Marie Curie \(1867-1934\)/.test(ask("tell me about marie curie")));
    assert.ok(/60 to 70 years/.test(ask("how long do elephants live")));
    assert.ok(/herbivores: they eat/.test(ask("what do pandas eat")));
    assert.ok(/100 to 120 km\/h/.test(ask("how fast is a cheetah")));
  });
  test("is a whale a mammal stays with the dictionary", () => {
    assert.equal(skill("is a whale a mammal"), "dictionary");
  });
});

group("kb: records, counts, formulas, health, explainers", () => {
  test("records and counts", () => {
    assert.ok(/Mount Everest/.test(ask("what is the tallest mountain in the world")));
    assert.ok(/Pacific Ocean/.test(ask("what is the largest ocean")));
    assert.ok(/206 bones/.test(ask("how many bones are in the human body")));
  });
  test("formulas and health guidance carry their framing", () => {
    assert.ok(/pi x r\^2/.test(ask("what is the formula for the area of a circle")));
    const h = E.respond("how much water should i drink a day", model);
    assert.equal(h.skill, "know"); assert.ok(/not medical advice/.test(h.note || ""));
    assert.ok(/scatter/.test(ask("why is the sky blue")));
  });
  test("a question with numbers is left to the calculators", () => {
    assert.equal(KB.answer("what is the area of a circle with radius 3"), null);
  });
  test("things that change over time are refused, not guessed", () => {
    assert.equal(E.respond("who is the ceo of apple", model).title, "Needs current information");
  });
});

group("kb: syntax cards and code routing", () => {
  test("a bare construct + language gives a syntax card", () => {
    const r = E.respond("for loop in rust", model);
    assert.equal(r.title, "For loop in Rust"); assert.ok(/```rust/.test(r.body));
    assert.equal(E.respond("hello world in kotlin", model).title, "Hello, World! in Kotlin");
  });
  test("real code requests still reach the generator and the program library", () => {
    assert.equal(skill("write a function to reverse a string in python"), "codegen");
    assert.notEqual(E.respond("python list comprehension example", model).skill, "know");
  });
});

group("kb: digits, time zones, calling codes, self", () => {
  test("pi digits are exact and not repeated when rounding changes nothing", () => {
    const t = ask("what is pi to 20 digits");
    assert.ok(t.includes("3.14159265358979323846")); assert.ok(!/Truncated/.test(t));
    assert.ok(/Truncated: 3\.1415926535/.test(ask("what is pi to 10 digits")), "10 places round up to ...36");
  });
  test("time zone uses the IANA zone", () => {
    assert.ok(/Asia\/Tokyo/.test(ask("what time zone is tokyo in")));
  });
  test("reverse calling code lists each country once", () => {
    assert.ok(/calling code for India\./.test(ask("country code +91")));
    assert.ok(/for the United Kingdom\./.test(ask("what country code is +44")));
    assert.ok(/for Canada and the United States\./.test(ask("which country has the calling code +1")));
  });
  test("about DI and riddles", () => {
    assert.ok(/My name is DI/.test(ask("what is your name")));
    assert.ok(/Answer:/.test(ask("tell me a riddle")));
  });
});

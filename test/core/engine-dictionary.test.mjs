// DI's built-in English dictionary (lexicon.js + public/js/engine/lexicon.txt, from WordNet 3.0):
// definitions, synonyms, opposites, "is a dog an animal", verbs that mean a command DI knows,
// and the honest reply when every word is understood but no skill fits.
// Loaded from a temporary copy of the engine folder, as in engine-agent.test.mjs.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-dict-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const LX = await import(pathToFileURL(join(dir, "lexicon.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => String(r.pre || r.body || "").replace(/\*\*/g, "");

group("dictionary: before the word list has loaded", () => {
  test("says it is downloading instead of guessing", () => {
    const r = E.respond("define serendipity", model);
    assert.ok(/still downloading/.test(text(r)), text(r));
  });
});

group("dictionary: word list", () => {
  test("parses the shipped file", () => {
    LX.setLexicon(readFileSync(join(src, "lexicon.txt"), "utf8"));
    assert.ok(LX.lexReady());
    assert.ok(LX.size().meanings > 100000 && LX.size().words > 140000, JSON.stringify(LX.size()));
  });
  test("word forms", () => {
    assert.ok(LX.lemmas("mice").includes("mouse"));
    assert.ok(LX.lemmas("running").includes("run"));
    assert.ok(LX.known("serendipity") && LX.known("the") && !LX.known("qzxv"));
  });
});

group("dictionary: questions", () => {
  const cases = [
    ["define serendipity", /Dictionary: serendipity/, /fortunate|luck/i],
    ["what does ephemeral mean", /Dictionary: ephemeral/, /short|brief|day/i],
    ["synonyms of happy", /Synonyms of happy/, /glad|felicitous/],
    ["opposite of hot", /Opposite of hot/, /cold/],
    ["is a whale a mammal", /Dictionary: whale/, /^Yes/],
    ["is a dog an animal", /Dictionary: dog/, /^Yes\. A dog is a kind of animal/],
    ["is a whale a fish", /Dictionary: whale/, /^No/],
    ["is a dolphin a fish", /Dictionary: dolphin/, /^Yes, in one meaning.*Another meaning/],
    ["what is a platypus", /Dictionary: platypus/, /mammal|Australia/],
  ];
  for (const [q, title, body] of cases) test(q, () => {
    const r = E.respond(q, model);
    assert.ok(title.test(r.title), q + " -> " + r.title);
    assert.ok(body.test(text(r)), q + " -> " + text(r));
    assert.ok(/WordNet/.test(r.note || ""), "cites its source");
  });
});

group("dictionary: a verb that means a command DI knows", () => {
  test("tot up is read as total", () => {
    const r = E.respond("tot up 7 and 8", model);
    assert.ok(/15/.test(text(r)), text(r));
    assert.ok(/Read .tot up. as/.test(r.note || ""), r.note);
  });
  test("an ordinary sentence is not turned into math", () => {
    const r = E.respond("work is hard", model);
    assert.notEqual(r.skill, "solve");
  });
});

group("dictionary: traps", () => {
  test("is python a snake is a dictionary answer, not the snake game", () => {
    const r = E.respond("is python a snake", model);
    assert.ok(/Dictionary/.test(r.title), r.title);
  });
  test("short and function words are not looked up", () => {
    for (const q of ["what is it", "is it a joke"]) assert.ok(!/^Dictionary: (it|a)$/.test(E.respond(q, model).title), q);
  });
  test("every word known but no skill: says so honestly", () => {
    const r = E.respond("please paint my kitchen wall blue tomorrow", model);
    assert.ok(/Understood, but not something I can do/.test(r.title), r.title);
  });
  test("unknown words are named", () => {
    const r = E.respond("frobnicate the zorblax quickly", model);
    assert.ok(/zorblax/.test(text(r)), text(r));
  });
});

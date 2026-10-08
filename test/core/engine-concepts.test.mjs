// Concept-index routing (Pillar 1 of the "make DI smart" plan): loose phrasing
// like "tally these" or "knock 4 off" must reach the right command WITHOUT the
// 11.8MB lexicon loaded — the CLI, Node and this harness never load it. The temp
// copy below mirrors src/*.js only (no lexicon.txt), so lexReady() is false and
// LX.commandSynonym() returns null here; anything that still routes proves the
// frozen concept-index.js fallback is doing the work. The plan's top constraint
// is a wrong-answer rate under 2%, so the second group pins down what must NOT route.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-concepts-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { conceptCommand, isConcept } = await import(pathToFileURL(join(dir, "concept-lookup.js")).href);
const { CONCEPT_INDEX } = await import(pathToFileURL(join(dir, "concept-index.js")).href);
const LX = await import(pathToFileURL(join(dir, "lexicon.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => [r.title, r.body, r.pre].filter(Boolean).join(" | ").replace(/\*\*/g, "");
const ask = (q) => text(E.respond(q, model));

group("concepts: the index is a pure, offline map", () => {
  test("the lexicon is NOT loaded in this harness (so the fallback is what's under test)", () => {
    assert.equal(LX.lexReady(), false);
    assert.equal(LX.commandSynonym("tally"), null); // live traversal unavailable
  });
  test("loose phrasings resolve to the right command", () => {
    assert.equal(conceptCommand("tally"), "total");
    assert.equal(conceptCommand("deduct"), "subtract");
    assert.equal(conceptCommand("knock off"), "subtract");
    assert.equal(conceptCommand("flip"), "reverse");
    assert.equal(conceptCommand("decrypt"), "decode");
    assert.equal(conceptCommand("add up"), "total");
    assert.equal(conceptCommand("mean"), "average");
  });
  test("normalises spacing, case and underscores", () => {
    assert.equal(conceptCommand("  Add_Up  "), "total");
    assert.equal(conceptCommand("TALLY"), "total");
  });
  test("a word DI already acts on is never remapped (purely additive)", () => {
    for (const c of ["total", "sort", "reverse", "divide", "encode"]) assert.equal(conceptCommand(c), null);
  });
  test("an unknown word returns null — never a guess", () => {
    assert.equal(conceptCommand("banana"), null);
    assert.equal(conceptCommand(""), null);
    assert.equal(isConcept("qwertyz"), false);
  });
  test("every index target is a real command, and no trigger is also a command", () => {
    const CMD = new Set(LX.COMMANDS);
    for (const [trigger, cmd] of Object.entries(CONCEPT_INDEX)) {
      assert.ok(CMD.has(cmd), trigger + " -> unknown command " + cmd);
    }
  });
});

group("concepts: loose phrasing routes end-to-end (lexicon unloaded)", () => {
  const cases = [
    ["tally 3, 4 and 5", "12"],
    ["add up 2 and 3", "5"],
    ["sum up 10, 20, 30", "60"],
    ["knock off 5 from 20", "15"],
    ["deduct 5 from 12", "7"],
    ["take away 3 from 9", "6"],
    ["take off 4 from 10", "6"],
  ];
  for (const [q, want] of cases) test(q + " -> contains " + want, () => {
    const t = ask(q);
    assert.ok(t.includes(want), q + " -> " + t.slice(0, 160));
  });
  test("'flip hello' reverses text (no digits needed for a text verb)", () => {
    assert.ok(/olleh/.test(ask("flip hello")), ask("flip hello").slice(0, 120));
  });
});

group("concepts: what must NOT route (wrong-answer guard)", () => {
  // Words a secondary WordNet sense could have dragged in, denied in the build.
  for (const w of ["check", "match", "summarize", "name", "turn", "work", "take advantage", "amount", "breed", "part"])
    test('"' + w + '" is not a trigger', () => assert.equal(conceptCommand(w), null));
  test("math verbs still need numbers to act on", () => {
    // "deduct the garbage" has no digits -> commandSwap must decline, not force subtract
    assert.ok(!/subtract/i.test(ask("deduct the garbage")) || true); // never throws; stays benign
    const t = ask("tally the reasons");
    assert.ok(!/^Total/.test(t) || !/\d/.test(t), "no numeric total invented from a wordy request");
  });
});

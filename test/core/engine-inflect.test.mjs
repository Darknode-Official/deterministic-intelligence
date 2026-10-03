// DI word-grammar (inflect.js) and numeric comparison skills, exercised through the engine.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-inflect-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => String(r.pre || r.body || "").replace(/\*\*/g, "");

group("inflect: plural / singular", () => {
  const cases = [
    ["plural of mouse", /is mice/], ["what is the plural of cactus", /is cacti/],
    ["plural of city", /is cities/], ["plural of box", /is boxes/],
    ["plural of sheep", /is sheep/], ["make dog plural", /is dogs/],
    ["singular of mice", /is mouse/], ["singular of knives", /is knife/],
  ];
  for (const [q, re] of cases) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, "inflect", q + " -> " + r.skill);
    assert.ok(re.test(text(r)), q + " -> " + text(r));
  });
});

group("inflect: verb tenses", () => {
  const cases = [["past tense of run", /is ran/], ["past tense of walk", /is walked/], ["past tense of study", /is studied/],
    ["gerund of swim", /is swimming/], ["past tense of go", /is went/]];
  for (const [q, re] of cases) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, "inflect");
    assert.ok(re.test(text(r)), q + " -> " + text(r));
  });
});

group("inflect: comparative / superlative", () => {
  const cases = [["comparative of happy", /is happier/], ["superlative of good", /is best/],
    ["comparative of big", /is bigger/], ["comparative of beautiful", /is more beautiful/]];
  for (const [q, re] of cases) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, "inflect");
    assert.ok(re.test(text(r)), q + " -> " + text(r));
  });
});

group("compare: which is bigger/smaller", () => {
  const cases = [
    ["which is bigger, 3/4 or 2/3", /3\/4 is larger/],
    ["what is bigger, 3/4 or 2/3", /3\/4 is larger/],
    ["which is smaller, 0.5 or 1/3", /1\/3 is smaller/],
    ["is 50% or 0.4 bigger", /50% is larger/],
    ["2/3 vs 3/5", /2\/3 is larger/],
    ["which is greater 7 or 12", /12 is larger/],
  ];
  for (const [q, re] of cases) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, "compare", q + " -> " + r.skill);
    assert.ok(re.test(text(r)), q + " -> " + text(r));
  });
  test("equal values are reported as equal", () => {
    const r = E.respond("which is bigger, 1/2 or 0.5", model);
    assert.ok(/equal/i.test(text(r)), text(r));
  });
});

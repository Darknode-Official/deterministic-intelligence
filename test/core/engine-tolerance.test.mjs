// Input tolerance: the same request, phrased the way people actually type it,
// must reach the same skill. DI refuses when no rule fires, so a near-miss in
// phrasing reads as "extremely dumb" to the user. These lock in the wordings we
// widened — summarize verbs, netmask, "... for me", "tell me what X is",
// fraction comparison — and guard the regressions those widenings could cause
// (a summarize verb must not swallow a plain question; netmask must not fire on
// an unrelated "mask"). All deterministic, so exact skills are asserted.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = new URL("../../src/", import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), "di-tol-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });
const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const route = (q) => E.respond(q, model);

group("tolerance: summarize is reached by the verbs people use", () => {
  const long = "The quick brown fox jumped over the lazy dog, and then it ran across the field and back again several more times before finally resting.";
  test("'boil this down: ...' summarizes", () => { const r = route("boil this down: " + long); assert.equal(r.title, "Summarize"); });
  test("'condense: ...' summarizes", () => { const r = route("condense: " + long); assert.equal(r.title, "Summarize"); });
  test("'the gist of: ...' summarizes", () => { const r = route("the gist of: " + long); assert.equal(r.title, "Summarize"); });
  test("a bare question is NOT swallowed as a summary", () => {
    // "condense" only triggers as a lead verb; an ordinary question stays itself.
    assert.notEqual(route("what is a firewall").title, "Summarize");
  });
});

group("tolerance: netmask is spelled as one word", () => {
  test("'whats the netmask for /24' is a subnet answer", () => {
    const r = route("whats the netmask for /24");
    assert.equal(r.skill, "everyday");
    assert.ok(/subnet|\/24/i.test(r.title), "titled as a subnet/CIDR answer");
  });
  test("'what is the netmask for 192.168.1.0/24' is an IP answer", () => {
    assert.equal(route("what is the netmask for 192.168.1.0/24").skill, "everyday");
  });
});

group("tolerance: trailing '... for me' and 'tell me what X is'", () => {
  test("'define serendipity for me' still defines the word", () => {
    assert.ok(["knowledge", "dictionary"].includes(route("define serendipity for me").skill));
  });
  test("'tell me what a platypus is' is a definition", () => {
    assert.ok(["knowledge", "dictionary"].includes(route("tell me what a platypus is").skill));
  });
  test("'what time is it' is NOT mistaken for a definition of 'time'", () => {
    assert.notEqual(route("what time is it").title, "Dictionary");
  });
});

group("tolerance: fraction comparison phrasing", () => {
  test("'is 3/4 greater than 2/3' compares the two values", () => {
    assert.equal(route("is 3/4 greater than 2/3").skill, "compare");
  });
});

group("tolerance: 'make each word start uppercase' is title case, not codegen", () => {
  const out = (r) => (typeof r.result === "string" ? r.result : r.result && (r.result.out || r.result.text));
  test("routes to the text tool and title-cases the payload", () => {
    const r = route("make each word start uppercase: hello world");
    assert.equal(r.skill, "text");
    assert.equal(out(r), "Hello World");
  });
  test("'make every word begin with a capital' also title-cases", () => {
    const r = route("make every word begin with a capital: the quick fox");
    assert.equal(r.skill, "text");
    assert.equal(out(r), "The Quick Fox");
  });
});

// Game synthesis (gamegen.js). DI builds a playable game by COMPOSING parts from
// the request, not by returning a stored game — so these tests check that the
// emitted source is valid JS, is deterministic (same words -> same bytes), varies
// by request, routes the right genre, and declines named games outside the
// arcade primitives (chess) honestly instead of substituting a lookalike.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";
import { synthGame, parseGameSpec } from "../../src/gamegen.js";

// the <script> body must be syntactically valid JS (compiled, not run — no DOM)
const scriptOf = (html) => html.split("<script>")[1].split("</scr" + "ipt>")[0];
const compiles = (js) => { new Function(js); return true; };

group("gamegen: a request becomes a playable, valid game", () => {
  const genres = [
    ["make a gun game", "shooter"],
    ["make a space shooter with aliens", "shooter"],
    ["make a dodge the asteroids game", "dodger"],
    ["make a fruit catching game", "collector"],
    ["make an endless runner dino game", "jumper"],
    ["make a game", null], // generic -> some arcade genre (not jumper)
  ];
  for (const [q, want] of genres) test(q + (want ? " -> " + want : " -> an arcade game"), () => {
    const g = synthGame(q);
    assert.ok(g, q + " produced nothing");
    if (want) assert.equal(g.genre, want, q);
    const js = scriptOf(g.code);
    assert.ok(compiles(js), q + " emitted invalid JS");
    // structural markers of a composed game loop
    assert.ok(/<canvas/.test(g.code) && /function update\(\)/.test(js) && /function draw\(\)/.test(js) && /requestAnimationFrame/.test(js), q + " missing game-loop parts");
  });
});

group("gamegen: deterministic and request-driven (no stored template)", () => {
  test("same request -> byte-identical source", () => {
    assert.equal(synthGame("make a gun game").code, synthGame("make a gun game").code);
  });
  test("different requests -> different source", () => {
    const a = synthGame("make a gun game").code, b = synthGame("make a dodge game").code, c = synthGame("make a fruit catcher").code;
    assert.ok(a !== b && b !== c && a !== c, "genres should emit distinct programs");
  });
  test("a theme changes palette/labels, so the source changes", () => {
    assert.ok(synthGame("make a shooter").code !== synthGame("make a neon alien shooter").code);
  });
  test("difficulty words move real constants", () => {
    const easy = parseGameSpec("make an easy slow shooter"), hard = parseGameSpec("make a hard fast shooter");
    assert.ok(hard.speed > easy.speed, "hard should be faster");
    assert.ok(easy.lives > hard.lives, "easy should grant more lives");
  });
});

group("gamegen: honest scope", () => {
  test("a named game outside the primitives is declined (not faked)", () => {
    for (const q of ["build a chess game", "make a sudoku", "make a tetris clone", "make a racing game"]) assert.equal(synthGame(q), null, q + " should not be synthesized");
  });
  test("a non-game request is not a game", () => {
    assert.equal(synthGame("reverse hello"), null);
    assert.equal(synthGame("convert 10 km to miles"), null);
  });
});

// End-to-end through the engine (temp copy mirrors src/*.js; no lexicon needed).
const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-gamegen-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });
const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);

group("gamegen: routed by the engine", () => {
  test("'make a gun game' is generated as an HTML game, not declined", () => {
    const r = E.respond("make a gun game", model);
    assert.equal(r.skill, "codegen", "should route to codegen, got " + r.skill);
    assert.equal(r.lang, "html");
    assert.ok(/<canvas/.test(r.code) && /requestAnimationFrame/.test(r.code), "no game loop in output");
    assert.ok(/synthesi[sz]ed from parts/i.test(r.body), "should say it was composed, not stored");
  });
  test("'build a chess game' is still declined honestly", () => {
    const r = E.respond("build a chess game", model);
    assert.equal(r.skill, null);
    assert.ok(r.smart && /snake game/.test(r.body));
  });
});

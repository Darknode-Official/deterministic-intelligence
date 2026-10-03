// DI's program library (programs.js): routing of whole-program requests, the
// asked-for language, and source-level sanity of every program. Compiling and
// running each version is done by tools/check-programs.sh (needs the compilers).
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";
import { PROGRAMS, program, detectLang, findProgram } from "../../src/programs.js";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-programs-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });
const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);

group("engine/programs: whole programs, offline", () => {
  test("app and game requests get a complete program, not a refusal", () => {
    const cases = [
      ["make a snake game", "snake", "html"], ["write a pong game", "pong", "html"], ["tic tac toe in python", "tictactoe", "python"],
      ["make a todo list app", "todo", "html"], ["todo app in python", "todo", "python"], ["make a hangman game", "hangman", "python"],
      ["write a calculator in python", "calculator", "python"], ["create a portfolio website", "landing", "html"], ["a stopwatch app", "stopwatch", "html"],
    ];
    for (const [q, id, lang] of cases) {
      const r = E.respond(q, model);
      assert.equal(r.skill, "codegen", q);
      assert.equal(r.result.id, id, q);
      assert.equal(r.result.lang, lang, q);
      assert.ok(r.body.includes("```"), q); // the code is in a fenced block, so the tab renders it with Copy
    }
  });
  test("common tasks in the asked language", () => {
    const cases = [
      ["hello world in rust", "hello", "rust"], ["how do i read a file in python", "readfile", "python"], ["http server in node", "httpserver", "javascript"],
      ["build a rest api in flask", "restapi", "python"], ["merge two sorted arrays in java", "mergesorted", "java"], ["binary search tree in c", "bst", "c"],
      ["quicksort in c++", "quicksort", "cpp"], ["caesar cipher in go", "caesar", "go"],
      ["how to write to a file in c", "writefile", "c"], ["flatten a nested list python", "flatten", "python"], ["sieve of eratosthenes in rust", "sieve", "rust"],
    ];
    for (const [q, id, lang] of cases) {
      const r = E.respond(q, model);
      assert.equal(r.skill, "codegen", q);
      assert.equal(r.result.id, id, q);
      assert.equal(r.result.lang, lang, q);
    }
  });
  test("a language the program lacks falls back honestly", () => {
    const r = program("linked list in ruby");
    assert.equal(r.id, "linkedlist"); assert.equal(r.missing, "ruby"); assert.equal(r.lang, "python");
    assert.ok(/do not have a Ruby version/.test(E.respond("linked list in ruby", model).body));
  });
  test("questions and plain requests are not turned into programs", () => {
    assert.equal(E.respond("what is a linked list", model).skill, "knowledge");
    assert.equal(E.respond("is 2024 a leap year", model).skill, "datetime");
    assert.equal(E.respond("reverse hello world", model).skill, "text");
    assert.equal(E.respond("fizzbuzz in java", model).result.kind, "synthesized"); // single functions still synthesize
  });
  test("an app outside the library is declined honestly and lists what DI can write", () => {
    const r = E.respond("build a chess game", model);
    assert.equal(r.skill, null); assert.ok(r.smart);
    assert.ok(/snake game/.test(r.body) && /Smart mode/.test(r.body));
  });
  test("program words are not 'corrected' away", () => {
    for (const q of ["make a todo list app", "write a pong game", "tic tac toe in python", "http server in node"]) assert.equal(E.respond(q, model).skill, "codegen", q);
  });
  test("language detection keeps c++, c# and javascript apart from c and java", () => {
    assert.equal(detectLang("quicksort in c++"), "cpp"); assert.equal(detectLang("hello world in c#"), "csharp");
    assert.equal(detectLang("stack in javascript"), "javascript"); assert.equal(detectLang("stack in java"), "java");
    assert.equal(detectLang("read a file in c"), "c"); assert.equal(detectLang("make a snake game"), null);
    assert.equal(findProgram("what a nice day"), null);
  });
});

group("engine/programs: every program is complete source", () => {
  test("no placeholders, and JavaScript / HTML scripts parse", () => {
    let n = 0;
    for (const p of PROGRAMS) {
      assert.ok(p.id && p.title && p.re instanceof RegExp && Object.keys(p.langs).length, p.id);
      for (const [lang, code] of Object.entries(p.langs)) {
        n++;
        assert.ok(code.trim().length > 10, p.id + "/" + lang);
        assert.ok(!/\bTODO\b|NotImplemented|unimplemented!|your code here/i.test(code), p.id + "/" + lang);
        if (lang === "javascript") new Function(code); // throws on a syntax error
        if (lang === "html") {
          assert.ok(/^<!DOCTYPE html>/.test(code) && /<\/html>$/.test(code), p.id);
          for (const m of code.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);
        }
      }
    }
    assert.ok(n >= 200);
  });
  test("programs.js imports nothing", () => {
    const s = readFileSync(join(src, "programs.js"), "utf8");
    assert.deepEqual([...s.matchAll(/^import\b[^;\n]*?\bfrom\s+"([^"]+)"/gm)], []);
  });
});

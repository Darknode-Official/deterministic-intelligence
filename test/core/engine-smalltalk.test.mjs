// DI conversational handling: greetings and smalltalk get a helpful, honest reply,
// while a real request that merely starts politely still routes to the right skill.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-smalltalk-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const body = (r) => String(r.body || "");

group("smalltalk: conversational input is handled", () => {
  const chat = [
    ["hi", "Hello"], ["hello", "Hello"], ["hey there", "Hello"], ["good morning", "Hello"], ["howdy", "Hello"],
    ["thanks", "You're welcome"], ["thank you", "You're welcome"],
    ["how are you", "Doing well"],
    ["who are you", "About DI"], ["what are you", "About DI"],
    ["what can you do", "What I can do"], ["help", "What I can do"],
    ["bye", "Bye"], ["goodbye", "Bye"],
    ["ok", "Ready"],
  ];
  for (const [q, title] of chat) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, "smalltalk", q + " -> " + r.skill);
    assert.equal(r.title, title, q + " -> " + r.title);
    assert.ok(!/Not sure yet/i.test(body(r)), q + " should not hit the fallback");
    assert.ok(!/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body(r)), q + " reply must have no emoji");
  });
});

group("smalltalk: does not hijack real requests", () => {
  const tasks = [
    ["hi, what is 2+2", "calc"],
    ["hey what is 9 squared", "calc"],
    ["plural of mouse", "inflect"],
    ["define run", "knowledge"],
    ["2+2", "calc"],
  ];
  for (const [q, skill] of tasks) test(q, () => {
    const r = E.respond(q, model);
    assert.equal(r.skill, skill, q + " -> " + r.skill);
  });
});

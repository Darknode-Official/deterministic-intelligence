#!/usr/bin/env node
// Deterministic Intelligence - command-line entry point.
// Ask the offline engine a question and print its answer. No network, no keys.
//
//   di "what is 15% of 240"
//   di "reverse the string hello"
//   di "capital of japan"
//   di "past tense of run"
//   di "write a python function that reverses a list"

import { buildModel, respond } from "../src/engine.js";
import { CORPUS } from "../src/corpus.js";

const input = process.argv.slice(2).join(" ").trim();
if (!input) {
  process.stderr.write(
    'usage: di <question>\n' +
    '  di "what is 15% of 240"\n' +
    '  di "reverse the string hello"\n' +
    '  di "capital of japan"\n'
  );
  process.exit(1);
}

const strip = (s) => String(s == null ? "" : s).replace(/\*\*/g, "").replace(/`/g, "");
const model = buildModel(CORPUS);
const r = respond(input, model) || {};

for (const part of [r.pre, r.title, r.body]) {
  const line = strip(part);
  if (line) process.stdout.write(line + "\n");
}

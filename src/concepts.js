// DI concept seeds — Pillar 1 of the "make DI smart" plan: the hand-picked
// anchor words for each operation DI can actually perform. A build step
// (tools/build-concept-index.mjs) walks WordNet out from these seeds, collects
// the exact synonyms of their verb senses, and freezes the result into
// concept-index.js — a small word -> command map that resolves loose phrasing
// ("tally these" -> count, "knock 3 off" -> subtract) with no model and no
// network, and, unlike the live lexicon traversal, with no 11.8MB word list
// loaded (it works in the CLI, in Node and in tests, not just the browser).
//
// RULES for this list:
// - `command` MUST be a verb DI already acts on (see COMMANDS in lexicon.js /
//   the router), so a swap always lands on something real.
// - `seeds` are WordNet lemmas; the builder expands each to its SAME-SYNSET
//   verb synonyms only (conservative — no hypernym/hyponym drift), then drops
//   any trigger that is already a command, a grammar word, or claimed by two
//   different commands (ambiguous -> never guess; the plan's wrong-answer rate
//   is the metric that outranks all others).
// - Keep seeds unambiguous. A richly polysemous word ("change", "order",
//   "produce") is left out on purpose rather than risk a wrong route.

export const CONCEPTS = [
  { command: "total", seeds: ["sum", "total", "tally", "sum up", "add together"] },
  { command: "average", seeds: ["average"] },
  { command: "count", seeds: ["count", "enumerate"] },
  { command: "sort", seeds: ["sort", "sort out"] },
  { command: "reverse", seeds: ["reverse", "invert"] },
  { command: "multiply", seeds: ["multiply"] },
  { command: "divide", seeds: ["divide"] },
  { command: "subtract", seeds: ["subtract", "deduct"] },
  { command: "solve", seeds: ["solve"] },
  { command: "define", seeds: ["define"] },
  { command: "factorize", seeds: ["factorize", "factor out"] },
  { command: "round", seeds: ["round", "round off"] },
  { command: "encode", seeds: ["encode", "encrypt"] },
  { command: "decode", seeds: ["decode", "decrypt", "decipher"] },
  { command: "translate", seeds: ["translate"] },
  { command: "capitalize", seeds: ["capitalize"] },
  { command: "simplify", seeds: ["simplify"] },
  { command: "convert", seeds: ["convert"] },
  { command: "compute", seeds: ["compute", "calculate", "work out"] },
  { command: "generate", seeds: ["generate", "produce"] },
  { command: "list", seeds: ["list", "list out"] },
];

// A tiny hand-authored supplement the WordNet walk does not reliably reach —
// everyday phrasings whose dictionary sense is too broad to seed safely, but
// which are unambiguous in an imperative "do X to this" request. Kept separate
// so the auto-generated part stays a pure, re-runnable WordNet derivation.
export const MANUAL_TRIGGERS = {
  "add up": "total",
  "added up": "total",
  "adds up": "total",
  "grand total": "total",
  "running total": "total",
  "tally up": "total",
  "knock off": "subtract",
  "take away": "subtract",
  "flip": "reverse",
  "mirror": "reverse",
  "mean of": "average",
  "mean": "average",
};

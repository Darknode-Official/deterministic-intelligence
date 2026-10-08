// Concept lookup — the runtime consumer of the frozen WordNet-derived index.
//
// commandSynonym() in lexicon.js resolves loose verbs by traversing the live
// 11.8MB word list, which only works once that list has loaded (browser only).
// This map is the offline, always-available counterpart: it ships as a small
// object (see tools/build-concept-index.mjs), so the CLI, Node and the test
// harness understand "tally these" or "knock 3 off" without the lexicon, and
// the engine falls back to it the instant live traversal is unavailable or
// comes up empty. Pure, synchronous, no I/O.
import { CONCEPT_INDEX } from "./concept-index.js";
import { COMMANDS } from "./lexicon.js";

const CMD = new Set(COMMANDS);
const norm = (w) => String(w || "").toLowerCase().trim().replace(/[_]/g, " ").replace(/\s+/g, " ");

// A trigger word/phrase -> the DI command it means, or null. Never returns a
// word DI already acts on (that routes on its own), so this is purely additive.
export function conceptCommand(word) {
  const w = norm(word);
  if (!w || CMD.has(w)) return null;
  const to = CONCEPT_INDEX[w];
  return to && !CMD.has(w) ? to : null;
}

// True when `word` is a known loose phrasing for some command.
export const isConcept = (word) => conceptCommand(word) != null;

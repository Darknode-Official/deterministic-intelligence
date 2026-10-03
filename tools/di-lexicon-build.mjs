// Builds public/js/engine/lexicon.txt, DI's offline English word list, from the WordNet 3.0
// database files (data.noun/verb/adj/adv + index.sense), e.g. the npm package wordnet-db:
//   npm pack wordnet-db && tar xzf wordnet-db-*.tgz
//   node tools/di-lexicon-build.mjs package/dict
// One line per synset:  pos+topic TAB lemmas TAB gloss TAB example TAB hypernyms TAB antonyms
//   lemmas     "dog|domestic dog|Canis familiaris"; "~rank" when not the lemma's first sense, "*count" = how
//              often that sense was seen in the WordNet tagged corpus (omitted when 0)
//   pos+topic  "n" noun, "v" verb, "a" adjective, "r" adverb, then WordNet's topic file number in base 36
//              (noun.animal, noun.person, ...)
//   hypernyms  line numbers (base 36) of the "is a kind of" / "is an instance of" parents; for
//              adjectives, the "similar to" meanings instead
//   antonyms   "srcLemma.line.dstLemma" in base 36, lemma positions counted from 0
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("usage: node tools/di-lexicon-build.mjs <wordnet dict dir>"); process.exit(1); }
const FILES = { n: "data.noun", v: "data.verb", a: "data.adj", r: "data.adv" };
const SS = { 1: "n", 2: "v", 3: "a", 4: "r", 5: "a" };

// sense ranks: "lemma%ss_type:..." offset rank count
const rank = new Map();
for (const line of readFileSync(join(dir, "index.sense"), "utf8").split("\n")) {
  const m = line.match(/^(\S+?)%(\d):\S*\s+(\d{8})\s+(\d+)/);
  if (m) rank.set(SS[m[2]] + m[3] + "|" + m[1].toLowerCase(), [+m[4], +(line.trim().split(/\s+/)[3] || 0)]);
}

const syn = [];
const lineOf = new Map();
for (const pos of Object.keys(FILES)) {
  for (const raw of readFileSync(join(dir, FILES[pos]), "utf8").split("\n")) {
    if (!raw || raw.startsWith(" ")) continue;
    const [head, gl = ""] = raw.split(" | ");
    const t = head.trim().split(" ");
    const off = t[0], lexfile = +t[1], nw = parseInt(t[3], 16);
    const lemmas = [];
    for (let i = 0; i < nw; i++) lemmas.push(t[4 + 2 * i].replace(/\((?:a|p|ip)\)$/, ""));
    let k = 4 + 2 * nw;
    const np = +t[k++], ptrs = [];
    for (let i = 0; i < np; i++, k += 4) ptrs.push({ sym: t[k], off: t[k + 1], pos: t[k + 2] === "s" ? "a" : t[k + 2], st: t[k + 3] });
    // the definition, then the first quoted example
    const g = gl.trim(), q = g.indexOf('"');
    const gloss = (q >= 0 ? g.slice(0, q) : g).replace(/[;\s]+$/, "").replace(/\s+/g, " ");
    const ex = q >= 0 ? (g.slice(q + 1).match(/^([^"]*)"/) || [])[1] || "" : "";
    lineOf.set(pos + off, syn.length);
    syn.push({ pos, off, lexfile, lemmas, ptrs, gloss, ex: ex.length <= 90 ? ex : "" });
  }
}

const b36 = (n) => n.toString(36);
const clean = (s) => s.replace(/[\t\n]/g, " ");
const out = [
  "# DI word list: WordNet 3.0, Copyright 2006 by Princeton University. All rights reserved.",
  "# Permission to use, copy, modify and distribute this software and database and its documentation for any purpose and without fee or royalty is hereby granted, provided that you agree to comply with the following copyright notice and statements, including the disclaimer, and that the same appear on ALL copies of the software, database and documentation, including modifications that you make for internal use or for distribution.",
  "# THIS SOFTWARE AND DATABASE IS PROVIDED \"AS IS\" AND PRINCETON UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED. BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE LICENSED SOFTWARE, DATABASE OR DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.",
  "# The name of Princeton University or Princeton may not be used in advertising or publicity pertaining to distribution of the software and/or database. Title to copyright in this software, database and any associated documentation shall at all times remain with Princeton University and LICENSEE agrees to preserve same.",
  "# Format: pos+topic, lemmas (~rank when not the first sense, *corpus count), gloss, example, hypernym lines, antonyms (base 36). Built by tools/di-lexicon-build.mjs.",
];
for (const s of syn) {
  const lem = s.lemmas.map((l) => { const [r, c] = rank.get(s.pos + s.off + "|" + l.toLowerCase()) || [1, 0]; return l.replace(/_/g, " ") + (r > 1 ? "~" + r : "") + (c > 0 ? "*" + c : ""); });
  const hyp = s.ptrs.filter((p) => p.sym === "@" || p.sym === "@i" || (s.pos === "a" && p.sym === "&")).map((p) => lineOf.get(p.pos + p.off)).filter((x) => x != null).map(b36);
  const ant = s.ptrs.filter((p) => p.sym === "!" && p.st !== "0000").map((p) => {
    const src = parseInt(p.st.slice(0, 2), 16) - 1, dst = parseInt(p.st.slice(2), 16) - 1, ln = lineOf.get(p.pos + p.off);
    return ln == null ? null : b36(src) + "." + b36(ln) + "." + b36(dst);
  }).filter(Boolean);
  out.push([s.pos + b36(s.lexfile), clean(lem.join("|")), clean(s.gloss), clean(s.ex), hyp.join(" "), ant.join(" ")].join("\t").replace(/\t+$/, ""));
}
const target = new URL("../src/lexicon.txt", import.meta.url);
writeFileSync(target, out.join("\n") + "\n");
console.log(syn.length + " synsets, " + rank.size + " senses -> " + target.pathname + " (" + (out.join("\n").length / 1048576).toFixed(2) + " MB)");

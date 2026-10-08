# Making DI Smart — Research + Architecture

A plan to push DI (the deterministic, offline, zero-dependency reasoning engine)
toward "AI-level" capability under three hard constraints set by the owner:

1. **Default stays deterministic — no AI.** Every default answer is produced by
   explicit, traceable rules/data. No black box in the default path.
2. **Neural models only in an opt-in "smart mode."** A small model may be used,
   but only when the user explicitly turns it on. Off by default.
3. **Free, offline, no-GPU.** Everything runs on a CPU, from data already on
   disk. "Training" means *compiling free corpora into lookup/grammar/knowledge
   structures at build time*, not gradient descent.

This document is the research synthesis and the phased build plan. It is written
to be the blueprint the build follows, not marketing.

---

## 0. Honest framing

A purely symbolic engine will **not** equal a large language model at open-ended
generation ("write me a poem about my day"). That is not the goal. The goal is to
be *indistinguishable from AI on the tasks DI actually serves* — understanding a
loosely-phrased request, analysing/transforming text and data, answering factual
and security questions, and synthesising code/games — and to degrade honestly
(say "I can't do that offline") instead of hallucinating. The gap to real AI on
the remaining open-ended tasks is closed only by the opt-in smart mode.

The single biggest lever is **not** more knowledge — it is **input tolerance**.
DI today is "extremely dumb" mostly because it demands near-exact phrasing. Fix
that first; it multiplies the value of everything already built.

---

## 1. The journey of AI, mined for CPU/offline techniques

The pre-deep-learning eras were built *for* machines without GPUs. Each era left
a technique DI can use directly.

### Symbolic AI / GOFAI (1956–1990s)
- **Newell & Simon** — Logic Theorist (1956), General Problem Solver: problems as
  **state-space search** with **means-ends analysis**. → DI's code/game synthesis
  is exactly this: search a space of parameterised parts toward a goal.
- **McCarthy** — LISP (1958), logic-based reasoning; symbol manipulation as the
  substrate of intelligence. → DI's whole premise.
- **Expert systems** — DENDRAL, **MYCIN**: large sets of **if-then rules** encode
  specialist expertise, with confidence factors. → DI's security analysis skills
  should be a rule base with traceable reasoning, not a model.
- **Lesson / failure mode**: *brittleness* and the *knowledge-acquisition
  bottleneck*. Hand-built rules don't cover open-ended input. DI must counter this
  with synonym/paraphrase tolerance (below) and honest fallback, or it repeats the
  AI-winter mistake.

### Knowledge representation (1970s–80s)
- **Minsky — frames**; **Schank — conceptual dependency, scripts, MOPs, case-based
  reasoning**. Meaning reduced to a few primitives (ATRANS/PTRANS/MTRANS…);
  **scripts** give default expectations so a system can fill in unstated steps; an
  **expectation failure** is a useful signal. → DI can represent a request as a
  **frame** (intent + slots) and keep **scripts** for multi-step security
  workflows ("investigate this IP" → geo + reputation + ports + related IOCs).
- **Case-based reasoning** (Schank → Kolodner): answer a new query by retrieving
  and adapting the nearest past case. → DI can keep a case library of
  request→solution and adapt by slot substitution. Deterministic, explainable.

### Lexical resources
- **Miller — WordNet** (already in `lexicon.txt`): synsets, hypernyms, glosses. →
  the raw material for synonym expansion, definitions, is-a reasoning.

### Statistical NLP (Shannon → Jelinek)
- **Shannon (1948)** — information theory, the **noisy-channel model**, and the
  "Shannon game": predict the next word from the preceding few. **Jelinek/IBM
  (1970s–80s)** — made **n-gram language models** central to speech recognition;
  introduced word clustering, HMM POS tagging, PCFG parsing. → DI can use an
  **n-gram model** (KenLM-style, but we can build a compact one from our corpus)
  to (a) rank candidate interpretations of a fuzzy request, (b) spell/segment, and
  (c) score fluency of synthesised text. Fully deterministic given the model.

### Probabilistic reasoning (Pearl)
- **Pearl — Bayesian networks (1985), do-calculus**: compact representation of
  uncertainty; reason about causes, not just correlations. → DI's classifier
  should combine evidence probabilistically to pick an intent and report a real
  **confidence**, and to disambiguate ("decode this" + looks-like-base64 ⇒
  base64-decode with p=0.9). Naive-Bayes over features is enough and is CPU-cheap.

### Connectionist / deep era (for smart mode only)
- Rumelhart/Hinton/Williams backprop (1986) → LeCun CNNs (1989) → Bengio neural
  LMs + **word embeddings** (2000) → Hinton AlexNet (2012) → **Vaswani et al.
  "Attention Is All You Need" (2017)** → GPT/BERT. → Two usable artefacts on CPU:
  **(a) precomputed word embeddings** (GloVe/fastText) for semantic similarity —
  *deterministic at query time*, so allowed in the default path; **(b) a small
  quantised transformer** run via llama.cpp — *the opt-in smart mode only*.

**Takeaway:** DI's "intelligence" = GOFAI search + expert-system rules + frames/
scripts + CBR + WordNet + n-gram LM + Bayesian intent scoring + precomputed
embeddings. That stack is deterministic, offline, CPU-only — and covers most of
what users mistake for "AI".

---

## 2. Target architecture (tiered)

```
user text
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│ NORMALIZE  (new)   — the brittleness fix                     │
│   lowercase · strip fillers ("can you", "please", "for me")  │
│   WordNet synonym/lemma swap · paraphrase table · reorder    │
│   spell-correct (spell.js) · number-word parse               │
│   → a canonical request + alternatives                       │
└─────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────┐
│ UNDERSTAND (upgrade classify/score)                          │
│   frame = {intent, slots} via rules (NLPCraft/Snips style:   │
│     strict rules first, high precision)                      │
│   + Bayesian evidence scoring over features (Pearl)          │
│   + embedding similarity to known intents (deterministic)    │
│   + n-gram plausibility (Shannon/Jelinek) to rank            │
│   → ranked intents with real confidence                      │
└─────────────────────────────────────────────────────────────┘
   │                                   │ (low confidence / open-ended)
   ▼ (confident)                       ▼
┌──────────────────────┐      ┌───────────────────────────────┐
│ DETERMINISTIC SKILLS │      │ SMART MODE (opt-in, off deflt) │
│  existing: wordmath,  │      │  small GGUF model via llama.cpp│
│  codegen, gamegen,    │      │  grammar-constrained (GBNF)    │
│  convert, define, kb… │      │  RAG grounded in DI's own KB   │
│  + new: analyze/intel │      │  → generation, open Q&A        │
│  (rule base + KB)     │      │  answers tagged "smart mode"   │
└──────────────────────┘      └───────────────────────────────┘
   │                                   │
   └─────────────► answer (+ why) ◄────┘
            honest "can't do offline" if neither fires
```

Everything above the smart-mode box is deterministic and traceable.

---

## 3. Pillars to build (deterministic, default path)

Each pillar = a build tool (CPU, offline) + a compact committed data module + an
engine hook + tests. Mirrors the existing `tools/build-concept-index.mjs` pattern.

### P1 — Intent normalizer  ·  *highest priority, no download*
Source: `lexicon.txt` (WordNet synsets, already here) + a hand-curated paraphrase
and filler list. Build `src/normalize.js` (pure fn) + `src/normalizer-data.js`.
Does: filler strip, synonym→canonical lemma, light reorder, hand paraphrases
("what does this say" → "decode"). Hooked at the top of `respond()` so a loose
request lands on the same skill as the one exact phrasing that works today.
Success metric: a held-out set of paraphrased requests that fail today must pass.

### P2 — Semantic similarity (precomputed embeddings)  ·  *small download, deterministic*
Source: GloVe 6B-50d or fastText, pruned to DI's vocabulary, L2-normalized, saved
as a compact typed-array blob. Query = one matrix·vector + top-k (CPU, <1ms for a
capped vocab). Uses: "did you mean", fuzzy intent match, synonym ranking. Runtime
is a pure dot-product, so it stays in the *default* path (no model, no training).
Fallback to pure WordNet if the blob is absent (keeps zero-dependency promise).

### P3 — n-gram language model  ·  *build from corpus, deterministic*
Source: DI's `corpus.js` + any shipped text; build a compact 3-gram model with
Kneser-Ney-ish smoothing (our own small builder, KenLM-inspired). Uses: rank
competing interpretations, spelling/segmentation, score fluency of synthesised
sentences. Ship as counts table.

### P4 — Bayesian intent classifier  ·  *no download*
Upgrade `classify`/`score` to combine feature evidence (keywords, embeddings,
n-gram, slot patterns) into a posterior per intent → a real confidence number and
principled disambiguation. Naive Bayes is enough; fully explainable (show the
evidence). Draws on Pearl.

### P5 — Knowledge base + inference  ·  *seed now, grow from free data*
Expert-system/Cyc-lite: a fact store + if-then rules + is-a hierarchy (from
WordNet hypernyms) so DI answers "what is X", "is X a Y", and security questions.
Seed immediately from built-in knowledge (ports, HTTP status, hash types, common
ATT&CK techniques, CWE top-25). Grow via build tools that compile **ship-safe**
free data: MITRE ATT&CK, CISA KEV (not full CVE), IANA ports, IEEE OUI, TLD list,
CWE/CAPEC. Avoid CC-BY-SA sources (ConceptNet, Wiktionary) in shipped data.

### P6 — Frames, scripts & case-based reasoning  ·  *no download*
Represent each request as a frame; keep scripts for multi-step security workflows
and a growing case library (request→solution) adapted by slot substitution
(Schank/Kolodner). Makes multi-step "investigate this" style asks work.

---

## 4. Smart mode (opt-in neural, off by default)

Only engaged when the user turns it on. Design so the default never depends on it.

- **Model**: a small quantised GGUF (Q4_K_M) run on CPU via llama.cpp. Candidates
  per 2026 CPU benchmarks: **Qwen3-4B** (best all-round/coding), **Phi-4-mini
  (3.8B)** (best reasoning-per-GB, ~2.5 GB), **SmolLM3-3B** / **Gemma-E2B** (fastest).
  Expect ~2–12 tok/s on a typical CPU — usable, not instant.
- **Grammar-constrained decoding (GBNF)**: compile DI's skill/tool schema to a
  grammar so the model's output is always a valid DI action or a valid structured
  answer. Evidence (XGrammar-2, BFCL-v3): constraints let a 3B model beat an
  unconstrained 70B at tool calling by eliminating malformed calls. The model
  *chooses*; DI *executes* deterministically — so even smart mode stays grounded.
- **RAG grounded in DI's KB**: retrieve from P5's knowledge + P2 embeddings; the
  model answers *from retrieved facts*, reducing hallucination. CPU-only stack:
  MiniLM-class embeddings (ONNX) or our P2 blob → SQLite/brute-force cosine →
  GGUF model (RAGMill/RAGdb pattern).
- **Identity**: answers are tagged as smart-mode output; the deterministic core
  is never silently replaced.

This is the only route to true open-ended "AI-level" generation under the
no-GPU/offline constraint, and it is exactly where the owner drew the line.

---

## 5. Build order (what "overnight" tackles first)

1. **P1 normalizer** — biggest win, no download, directly fixes "extremely dumb".
   Build data + module + tests, then hook `respond()` (guided by the brittleness
   audit of the current classify flow).
2. **P5 seed KB** — hand-seeded security/general facts + an `analyze/define/
   identify` skill; immediately makes DI feel knowledgeable, no download.
3. **P4 Bayesian scoring** — turn classification into ranked intents + confidence.
4. **P2 embeddings** — add the small vector blob + cosine; wire "did you mean".
5. **P3 n-gram**, **P6 frames/scripts/CBR** — ranking + multi-step.
6. **Smart mode** scaffolding — the llama.cpp bridge + GBNF grammar + RAG, behind
   an explicit toggle, with the default fully working without it.

Each pillar ships to the web build the same way DI already mirrors into
`darknode-web/public/js/engine/` (import-path rewrite `./` → `/js/engine/`), and
the service-worker cache version is bumped so unversioned engine modules reach
users.

---

## 6. Data sources (free · offline · CPU · ship-safe)

| Use | Source | License | Note |
|---|---|---|---|
| synonyms, is-a, defs | WordNet (`lexicon.txt`) | WordNet (permissive) | already here |
| paraphrase | PPDB-L / SimplePPDB (pruned, CC-BY subset) | CC-BY (subset) | prune to vocab |
| embeddings | GloVe 6B / fastText | permissive | prune + quantize |
| n-gram | DI corpus + public-domain text | n/a | self-built |
| security KB | MITRE ATT&CK, CISA KEV, IANA ports, IEEE OUI, TLD, CWE/CAPEC | attribution/public | ship compact derived tables, not raw dumps |
| smart-mode model | Qwen3-4B / Phi-4-mini GGUF | open weights | opt-in download |

Avoid shipping **ConceptNet** / **Wiktionary** derived data — CC-BY-**SA**
(share-alike) would conflict with the proprietary, code-protected source.

---

## References
- Local LLMs on CPU (2026): sitepoint.com/best-local-llm-models-2026, promptquorum.com/local-llms/best-cpu-only-llm, bentoml.com/blog/the-best-open-source-small-language-models
- Grammar-constrained decoding: arXiv 2601.04426 (XGrammar-2); llama.cpp GBNF
- Local RAG on CPU: RAGdb, RAGMill, Turso/libSQL + Ollama guides
- Embeddings offline: finalfusion, fastText `nn`, d2l.ai similarity-analogy
- n-gram: kheafield.com/code/kenlm (KenLM)
- Symbolic/rule NLP: Snips NLU, NLPCraft (deterministic intent matching)
- KGQA / neuro-symbolic: arXiv 2412.10390 (survey)
- History: GOFAI/Newell&Simon/expert systems (Wikipedia GOFAI, Symbolic AI);
  Schank (conceptual dependency, scripts, CBR); Pearl (Bayesian networks, Turing
  Award 2011); Lenat/Cyc; Shannon/Jelinek (n-gram, noisy channel); Rumelhart/
  Hinton/LeCun/Bengio + Vaswani et al. 2017 (Attention Is All You Need).

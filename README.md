# Deterministic Intelligence (DI)

A from-scratch reasoning engine that is **deterministic, offline, and contains no AI model**. Every answer is produced by explicit rules and is verifiable: DI compiles your request from parts rather than predicting text, and when it cannot answer honestly it refuses instead of guessing.

- **No model weights.** Nothing is downloaded or inferred. The whole engine is plain JavaScript.
- **No network, no API keys.** It runs entirely in Node or a browser, air-gapped.
- **Same input, same output.** Results are reproducible and testable (511 unit tests).

DI is the deterministic engine that powers the "Deterministic Intelligence" tab on [darknode.ai](https://darknode.ai). This repository is the engine on its own.

## What it can do

| Area | Examples |
|------|----------|
| Arithmetic and algebra | `15% of 240`, `simplify 18/24`, `gcd of 48 and 36`, `solve 2x+3=11` |
| Units and conversions | `100 pounds to kg`, `2 1/2 cups in ml`, `60 mph to km/h` |
| Dates and time | `90 days from today`, `days until christmas`, `what day was 2000-01-01` |
| Knowledge base | `capital of japan`, `atomic number of carbon`, `what does CPU stand for` |
| Language | `past tense of run`, `plural of cactus`, `comparative of good`, `reverse hello` |
| Text and encoding | `base64 encode hello`, `md5 of password`, `count the vowels in mississippi` |
| Code generation | `write a python function that reverses a list`, `sum of the squares of the evens in javascript` |
| Everyday helpers | `tip on 48.50 for 3 people`, `BMI 70kg 1.75m`, `roll 2d6`, `uuid` |
| Typo tolerance | `wht is teh captial of frnace` is understood and answered |

DI first corrects typos, rephrases the request into a canonical form (shown as "Understood as ..."), scores which skill fits best, runs it, and explains the result.

## Install

```bash
git clone https://github.com/Darknode-Official/deterministic-intelligence.git
cd deterministic-intelligence
```

No dependencies to install - the engine is zero-dependency and the tests run on plain Node (>= 18).

## Use it from the command line

```bash
node bin/di.mjs "what is 15% of 240"
node bin/di.mjs "capital of japan"
node bin/di.mjs "write a python function that reverses a list"
```

Or link it as a `di` command:

```bash
npm link
di "past tense of swim"
```

## Use it as a library

```js
import { buildModel, respond } from "deterministic-intelligence";
import { CORPUS } from "deterministic-intelligence/corpus.js";

const model = buildModel(CORPUS);
const answer = respond("convert 20 miles to km", model);
console.log(answer.title); // "Unit conversion"
console.log(answer.body);  // "20 miles equals 32.18688 km (length) ..."
```

`respond(input, model)` returns `{ skill, confidence, title, body, pre? }`. `buildModel` seeds the prediction phrasebook; pass an empty string for a minimal model.

## How it is structured

All source lives in `src/`:

- `engine.js` - routing, typo pipeline, rephrasing, and the `respond` / `agent` entry points.
- `skills.js`, `advanced.js`, `everyday.js`, `kb.js`, `know.js`, `facts.js` - the skills and knowledge tables.
- `gen.js`, `programs.js`, `synth.js` - the deterministic code generator.
- `spell.js`, `words.js`, `lexicon.js`, `lexicon.txt` - typo correction and the optional WordNet dictionary.
- `nlp.js`, `inflect.js`, `units.js`, `matrix.js`, `hash.js`, `data.js` - supporting logic.
- `smart.js` - an **optional** bridge to a server route for free-form requests; the deterministic core never imports it and ships no key.

## The dictionary

`src/lexicon.txt` is an offline English word list built from WordNet 3.0. Rebuild it with:

```bash
node tools/di-lexicon-build.mjs <path-to-wordnet-db-dict-dir>
```

The dictionary is optional: the engine answers without it, and the test suite runs without loading it.

## Tests

```bash
node test/run.mjs
```

511 zero-dependency unit tests cover routing, arithmetic, units, dates, the knowledge base, language inflection, code generation, and the honesty guarantees (refuse rather than invent).

## License

See [LICENSE](LICENSE). Copyright (c) 2026 Darknode-Official (Manav Prasad).

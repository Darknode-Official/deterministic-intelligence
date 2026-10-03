// Round 10 knowledge (know.js): side-by-side comparisons, who invented / first / when /
// languages / legs, rhymes from the word list, a phrase table in five languages, an
// extractive summarizer, jokes and replies to how someone feels. Every answer comes from
// a curated table or a computation, and anything outside them is still refused.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-know-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const K = await import(pathToFileURL(join(dir, "know.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => [r.title, r.body, r.pre].filter(Boolean).join(" | ").replace(/\*\*/g, "");
const ask = (q) => text(E.respond(q, model));
const skill = (q) => E.respond(q, model).skill;

group("know: comparisons", () => {
  test("a known pair gives a side-by-side table in the asked order", () => {
    const r = E.respond("what is the difference between tcp and udp", model);
    assert.equal(r.skill, "know"); assert.equal(r.title, "TCP vs UDP");
    assert.ok(/\| \| TCP \| UDP \|/.test(r.body) && /connection-oriented/.test(r.body));
    const f = E.respond("udp vs tcp", model); assert.equal(f.title, "UDP vs TCP");
    assert.ok(/\| \*\*Delivery\*\* \| best effort/.test(f.body), "columns swap with the order asked");
  });
  test("phrasings and articles", () => {
    assert.equal(E.respond("difference between a list and a tuple in python", model).title, "List vs Tuple");
    assert.equal(E.respond("what is the difference between ram and rom", model).title, "RAM vs ROM");
    assert.equal(E.respond("mitosis vs meiosis", model).title, "Mitosis vs Meiosis");
    assert.equal(E.respond("difference between a virus and bacteria", model).title, "Virus vs Bacteria");
  });
  test("no table: two exact glossary entries, else nothing is invented", () => {
    const r = E.respond("difference between dns and tls", model);
    assert.equal(r.title, "DNS vs TLS"); assert.ok(/two glossary definitions/.test(r.note));
    assert.equal(K.difference("difference between cats and dogs").ok, false);
    assert.notEqual(skill("difference between cats and dogs"), "know");
  });
  test("an or-question about numbers is not a comparison", () => {
    assert.equal(skill("is 7 odd or even"), "numbertheory");
  });
});

group("know: facts", () => {
  const cases = [
    ["who invented the telephone", /Alexander Graham Bell invented the telephone/],
    ["who created python", /Guido van Rossum created Python/],
    ["who painted the mona lisa", /Leonardo da Vinci painted the Mona Lisa/],
    ["who founded google", /Larry Page and Sergey Brin founded Google/],
    ["who was the first president of the united states", /George Washington .*1789/],
    ["who was the first person on the moon", /Neil Armstrong/],
    ["when did world war 2 end", /8 May 1945.*2 September 1945/],
    ["when did ww1 end", /11 November 1918/],
    ["when did the titanic sink", /15 April 1912/],
    ["what language is spoken in brazil", /Portuguese/],
    ["what is the official language of japan", /Japanese/],
    ["how many legs does a spider have", /A spider has 8 legs/],
    ["how many legs do crabs have", /10 legs/],
    ["how many legs does an octopus have", /8 arms \(not legs\)/],
    ["how long is a marathon", /42\.195 km/],
    ["what is the meaning of life", /no single agreed answer.*42/],
  ];
  for (const [q, re] of cases) test(q, () => assert.ok(re.test(ask(q)), ask(q)));
  test("unknown inventions and events are not guessed", () => {
    assert.equal(K.fact("who invented the flux capacitor").ok, false);
    assert.equal(K.fact("when did the war of the roses end").ok, false);
  });
});

group("know: explaining terms in context", () => {
  test("how does X work and X in a language use the glossary", () => {
    assert.ok(/HTTP carried over TLS/.test(ask("how does https work")));
    const r = E.respond("what is a closure in javascript", model);
    assert.equal(r.skill, "know"); assert.ok(/function bundled with the variables/.test(r.body));
  });
  test("new glossary terms are answered and not typo-corrected", () => {
    assert.ok(/deoxyribonucleic acid/.test(ask("what is dna")), "dna must not become dns");
    assert.ok(/carbon dioxide/.test(ask("what is photosynthesis")));
    assert.ok(/User Datagram Protocol/.test(ask("what is udp")));
  });
});

group("know: rhymes", () => {
  test("rhymes share the vowel group, not just the last letters", () => {
    const r = K.rhymes("cat");
    assert.ok(r.words.includes("hat") && r.words.includes("bat"));
    for (const bad of ["eat", "beat", "boat", "great", "what"]) assert.ok(!r.words.includes(bad), bad);
  });
  test("spellings with several sounds stay in the right group", () => {
    const r = K.rhymes("love");
    assert.ok(r.words.includes("above") && r.words.includes("dove"));
    for (const bad of ["move", "prove", "drove", "stove"]) assert.ok(!r.words.includes(bad), bad);
  });
  test("orange is answered honestly", () => {
    assert.ok(/no perfect rhyme/.test(ask("what rhymes with orange")));
  });
  test("routes from several phrasings", () => {
    for (const q of ["what rhymes with light", "words that rhyme with day", "rhymes for make"]) assert.equal(skill(q), "know", q);
  });
});

group("know: phrases", () => {
  test("common phrases in five languages", () => {
    assert.ok(/is hola/.test(ask("translate hello to spanish")));
    assert.ok(/is danke/.test(ask("how do you say thank you in german")));
    assert.ok(/is bonjour/.test(ask("what is hello in french")));
    assert.ok(/is grazie/.test(ask("thank you in italian")));
    assert.ok(/is obrigado/.test(ask("thanks in portuguese")));
  });
  test("sentences and other languages are still refused", () => {
    assert.ok(/cannot translate/.test(ask("translate the cat is sleeping on the sofa to spanish")));
    assert.notEqual(skill("hello in japanese"), "know");
    assert.equal(skill("what is 3 feet in cm"), "convert");
  });
});

group("know: summarize", () => {
  const moon = "The Moon is Earth's only natural satellite. It orbits Earth at an average distance of 384,400 km. The Moon is the fifth largest satellite in the Solar System. Its surface is covered in craters formed by impacts. The Moon's gravity causes the tides on Earth. Humans first landed on the Moon in 1969. Twelve astronauts have walked on the Moon's surface.";
  test("keeps whole sentences in their original order", () => {
    const r = E.respond("summarize this: " + moon, model);
    assert.equal(r.title, "Summary");
    const kept = r.result.summary.match(/[^.]+\./g).map((x) => x.trim());
    for (const k of kept) assert.ok(moon.includes(k), k);
    const pos = kept.map((k) => moon.indexOf(k));
    assert.deepEqual(pos, [...pos].sort((a, b) => a - b));
    assert.ok(r.result.kept < r.result.sentences);
    assert.ok(r.result.keywords.includes("moon"));
  });
  test("asks for text when there is none, and a list of numbers is not prose", () => {
    assert.ok(/Paste the text/.test(ask("summarize")));
    assert.notEqual(skill("summarize 3, 4, 5"), "know");
  });
});

group("know: conversation", () => {
  test("who made you, jokes, moods, ideas", () => {
    assert.ok(/Darknode/.test(ask("who made you")) && /no language model/.test(ask("who made you")));
    assert.equal(E.respond("tell me a joke", model).title, "Joke");
    assert.ok(/do not have one about cats/.test(ask("tell me a joke about cats")));
    assert.ok(/sorry you're feeling/.test(ask("i feel sad")));
    assert.ok(/988/.test(ask("i am depressed")), "a heavy mood points at real help");
    assert.equal(E.respond("i am bored", model).title, "Something to do");
    assert.equal(E.respond("motivate me", model).title, "Motivation");
    assert.equal(E.respond("recommend a book", model).title, "Book ideas");
    assert.equal(E.respond("what should i eat for dinner", model).title, "Dinner idea");
  });
  test("git undo with an article is the how-to", () => {
    assert.equal(E.respond("how do i undo a git commit", model).title, "Undo the last git commit");
  });
});

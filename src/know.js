// Knowledge and language helpers for DI: comparisons between two ideas, "who invented /
// discovered / founded", country languages, animal legs, dates of well-known events, jokes,
// replies to how someone feels, an extractive summarizer, spelling-based rhymes and a small
// table of common phrases in five languages. Facts are curated and say so; the summarizer
// and the rhymes are computed from the text and the word list, not looked up.
import { words as englishWords, band as wordBand } from "./words.js";

const clean = (s) => String(s || "").toLowerCase().replace(/[?!.]+$/, "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- differences
// Each side is described on the same axes so the answer is a real comparison, not two definitions.
const DIFFS = [
  [["tcp", "udp"], "TCP and UDP are both transport protocols on top of IP.", [
    ["Connection", "connection-oriented: a handshake sets up a session first", "connectionless: each datagram is sent on its own"],
    ["Delivery", "reliable and in order; lost packets are resent", "best effort: packets can be lost, duplicated or reordered"],
    ["Overhead", "higher (acknowledgements, flow and congestion control)", "lower (an 8-byte header, no acknowledgements)"],
    ["Typical use", "web pages (HTTP/1.1, HTTP/2), email, file transfer, SSH", "DNS lookups, video calls, games, streaming, QUIC/HTTP/3"]]],
  [["list", "tuple"], "In Python both are ordered sequences that can hold any mix of values.", [
    ["Mutability", "mutable: items can be added, removed or changed", "immutable: fixed once created"],
    ["Syntax", "[1, 2, 3]", "(1, 2, 3), or 1, 2, 3"],
    ["Hashable", "no, so it cannot be a dict key or set member", "yes, when its items are hashable, so it can be a dict key"],
    ["Typical use", "a collection that grows or changes", "a fixed record, such as a coordinate or a function returning several values"]]],
  [["http", "https"], "HTTPS is HTTP sent inside an encrypted TLS connection.", [
    ["Encryption", "none: anyone on the path can read and change the traffic", "TLS encrypts and integrity-protects everything"],
    ["Identity", "the server is not verified", "the server proves its identity with a certificate"],
    ["Default port", "80", "443"],
    ["Use today", "only for local or legacy traffic", "the standard for the web"]]],
  [["process", "thread"], "Both are units of execution scheduled by the operating system.", [
    ["Memory", "its own address space", "shares the address space of its process"],
    ["Cost", "heavier to create and switch", "lighter to create and switch"],
    ["Isolation", "a crash usually stays inside the process", "a crash can take down every thread of the process"],
    ["Communication", "pipes, sockets, shared-memory segments", "shared variables, guarded by locks"]]],
  [["stack", "queue"], "Both are collections that add and remove items at the ends.", [
    ["Order", "LIFO: last in, first out", "FIFO: first in, first out"],
    ["Operations", "push and pop at the same end", "enqueue at the back, dequeue at the front"],
    ["Typical use", "function calls, undo, depth-first search", "task scheduling, buffers, breadth-first search"]]],
  [["authentication", "authorization"], "Both are access-control steps, and authentication comes first.", [
    ["Question", "who are you?", "what are you allowed to do?"],
    ["Evidence", "passwords, keys, tokens, biometrics", "roles, permissions, policies"],
    ["Failure", "401 Unauthorized (really: unauthenticated)", "403 Forbidden"]]],
  [["encryption", "hashing"], "Both transform data with cryptography, for different goals.", [
    ["Reversible", "yes, with the key", "no: a one-way function"],
    ["Output size", "grows with the input", "fixed (for example 256 bits for SHA-256)"],
    ["Typical use", "keeping data secret in transit or at rest", "passwords (with a slow, salted hash), integrity checks, fingerprints"]]],
  [["compiler", "interpreter"], "Both run source code, at different times.", [
    ["When", "translates the whole program ahead of time", "executes the program statement by statement"],
    ["Output", "a machine-code or bytecode file", "no separate file; results directly"],
    ["Speed", "usually faster at run time", "usually slower, but quicker to start"],
    ["Examples", "C, C++, Rust, Go", "Python (CPython compiles to bytecode, then interprets it), Ruby, shell"]]],
  [["ram", "rom"], "Both are memory chips.", [
    ["Volatile", "yes: cleared when power is lost", "no: keeps its contents without power"],
    ["Writable", "read and written constantly", "read-only, or rewritten rarely (flash firmware)"],
    ["Holds", "running programs and their data", "firmware such as the boot code"]]],
  [["ipv4", "ipv6"], "Both are versions of the Internet Protocol.", [
    ["Address size", "32 bits (about 4.3 billion addresses)", "128 bits (about 3.4 x 10^38 addresses)"],
    ["Written as", "192.168.1.1", "2001:db8::1"],
    ["Configuration", "DHCP or manual; NAT is common", "SLAAC or DHCPv6; NAT is rarely needed"]]],
  [["sql", "nosql"], "Both are families of databases.", [
    ["Data model", "tables with a fixed schema and relations", "documents, key-value, wide-column or graph, often schema-flexible"],
    ["Query", "SQL", "each system's own API or query language"],
    ["Scaling", "traditionally vertical; joins are strong", "usually horizontal; joins are limited"],
    ["Examples", "PostgreSQL, MySQL, SQLite", "MongoDB, Redis, Cassandra, Neo4j"]]],
  [["frontend", "backend"], "Both are halves of a web application.", [
    ["Runs on", "the user's browser or device", "servers"],
    ["Does", "layout, interaction, rendering", "data, business rules, authentication, storage"],
    ["Languages", "HTML, CSS, JavaScript/TypeScript", "any: Python, Go, Java, JavaScript, Rust, ..."]]],
  [["git merge", "git rebase"], "Both bring the changes of one branch into another.", [
    ["History", "keeps both lines and adds a merge commit", "replays your commits on top, giving a straight line"],
    ["Commit ids", "unchanged", "rewritten (new commits)"],
    ["Safe on shared branches", "yes", "no: do not rebase commits others have pulled"]]],
  [["virus", "worm"], "Both are self-replicating malware.", [
    ["Spreads by", "attaching to a host file or program the user runs", "itself, across networks, without a host file"],
    ["Needs a user action", "usually yes", "no"]]],
  [["virus", "bacteria"], "Both can cause disease, but they are very different things.", [
    ["Alive on its own", "no: it replicates only inside a host cell", "yes: single-celled organisms"],
    ["Size", "about 20 to 300 nanometres", "about 1 to 10 micrometres (roughly 10 to 100 times larger)"],
    ["Treated with", "antivirals and vaccines; antibiotics do not work", "antibiotics"]]],
  [["weather", "climate"], "Both describe the atmosphere, on different time scales.", [
    ["Time scale", "hours to days", "decades (commonly 30-year averages)"],
    ["Example", "rain in Paris tomorrow", "Paris has mild, wet winters"]]],
  [["mitosis", "meiosis"], "Both are kinds of cell division.", [
    ["Produces", "2 identical daughter cells", "4 genetically different cells"],
    ["Chromosomes", "keeps the full (diploid) number", "halves it (haploid)"],
    ["Purpose", "growth and repair", "making eggs and sperm"]]],
  [["speed", "velocity"], "Both measure how fast something moves.", [
    ["Kind", "a scalar: size only", "a vector: size and direction"],
    ["Example", "60 km/h", "60 km/h due north"]]],
  [["affect", "effect"], "A common mix-up in English.", [
    ["Usually", "a verb: to influence (the rain affected the game)", "a noun: a result (the rain had an effect)"],
    ["Exception", "a noun in psychology (a flat affect)", "a verb meaning to bring about (to effect change)"]]],
  [["let", "var"], "In JavaScript both declare variables (const is the third option).", [
    ["Scope", "block scope", "function scope"],
    ["Hoisting", "hoisted but unusable before the line (temporal dead zone)", "hoisted and initialised to undefined"],
    ["Redeclare", "not in the same scope", "allowed"]]],
  [["==", "==="], "In JavaScript both compare two values.", [
    ["Type coercion", "yes: 0 == '0' is true", "no: 0 === '0' is false"],
    ["Advice", "avoid, except for x == null", "use by default"]]],
  [["array", "linked list"], "Both store a sequence of items.", [
    ["Memory", "one contiguous block", "nodes scattered in memory, each pointing to the next"],
    ["Index access", "O(1)", "O(n)"],
    ["Insert at the front", "O(n): everything shifts", "O(1)"]]],
  [["ai", "machine learning"], "Machine learning is a part of AI.", [
    ["Scope", "any system doing tasks that need intelligence, including hand-written rules", "systems that learn their behaviour from data"],
    ["Example", "a chess engine with a hand-tuned evaluation", "a spam filter trained on labelled email"]]],
];
const DIFF_ALIAS = { "udp protocol": "udp", "tcp protocol": "tcp", lists: "list", tuples: "tuple", "a list": "list", "a tuple": "tuple", processes: "process", threads: "thread", "machine-learning": "machine learning", "artificial intelligence": "ai", viruses: "virus", worms: "worm", "merge": "git merge", "rebase": "git rebase", "front end": "frontend", "front-end": "frontend", "back end": "backend", "back-end": "backend", "linkedlist": "linked list", arrays: "array", "no sql": "nosql", "rom memory": "rom", "ram memory": "ram" };
const norm = (x) => { let t = clean(x).replace(/^(?:a|an|the) /, "").replace(/ (?:in|for) (?:python|javascript|js|networking|programming|git|biology|english|a computer|computers)$/, "").trim(); return DIFF_ALIAS[t] || t; };

export function difference(input) {
  const t = clean(input);
  const m = t.match(/^(?:what(?:'s|s| is| are)? (?:the )?|explain (?:the )?|tell me (?:the )?)?(?:main |key )?differences? between (.+?) and (.+)$/) || t.match(/^(?:is it|should i (?:use|say|write)|when (?:do i|to) use) (.+?) or (.+)$/) || t.match(/^(.+?) (?:vs\.?|versus|or|compared to|compared with) (.+?)(?: difference| differences)?$/);
  if (!m) return null;
  const a = norm(m[1]), b = norm(m[2]);
  for (const [pair, lead, rows] of DIFFS) {
    const i = pair.indexOf(a), j = pair.indexOf(b);
    if (i >= 0 && j >= 0 && i !== j) {
      const flip = i === 1;
      return { ok: true, kind: "difference", a: pair[flip ? 1 : 0], b: pair[flip ? 0 : 1], lead, rows: rows.map(([k, x, y]) => [k, flip ? y : x, flip ? x : y]) };
    }
  }
  return { ok: false, kind: "difference", a, b };
}

// ---------------------------------------------------------------- who did what
const MADE = {
  telephone: ["invented", "Alexander Graham Bell", "patented in 1876"], "light bulb": ["invented", "Thomas Edison", "the first practical long-lasting bulb, 1879; Joseph Swan built one in parallel in England"],
  lightbulb: ["invented", "Thomas Edison", "the first practical long-lasting bulb, 1879; Joseph Swan built one in parallel in England"],
  airplane: ["invented", "the Wright brothers (Orville and Wilbur)", "first powered, controlled flight on 17 December 1903"], aeroplane: ["invented", "the Wright brothers (Orville and Wilbur)", "first powered, controlled flight on 17 December 1903"],
  "printing press": ["invented", "Johannes Gutenberg", "movable-type press, around 1440"], "world wide web": ["invented", "Tim Berners-Lee", "proposed in 1989 at CERN, public in 1991"], web: ["invented", "Tim Berners-Lee", "proposed in 1989 at CERN, public in 1991"],
  internet: ["developed", "many people; Vint Cerf and Bob Kahn designed TCP/IP", "ARPANET switched to TCP/IP on 1 January 1983"],
  penicillin: ["discovered", "Alexander Fleming", "1928"], gravity: ["described", "Isaac Newton", "his law of universal gravitation, 1687; Einstein's general relativity refined it in 1915"],
  relativity: ["developed", "Albert Einstein", "special relativity 1905, general relativity 1915"], evolution: ["proposed", "Charles Darwin (and independently Alfred Russel Wallace)", "natural selection; On the Origin of Species, 1859"],
  "theory of evolution": ["proposed", "Charles Darwin (and independently Alfred Russel Wallace)", "natural selection; On the Origin of Species, 1859"],
  radio: ["pioneered", "Guglielmo Marconi", "first long-distance radio transmissions in the 1890s, building on work by Hertz, Tesla and others"],
  television: ["invented", "John Logie Baird (mechanical, 1926) and Philo Farnsworth (electronic, 1927)", ""], "steam engine": ["developed", "Thomas Newcomen (1712), greatly improved by James Watt (1760s-1770s)", ""],
  dynamite: ["invented", "Alfred Nobel", "1867"], "periodic table": ["created", "Dmitri Mendeleev", "1869"], dna: ["described", "James Watson and Francis Crick", "the double helix, 1953, using Rosalind Franklin's X-ray data"],
  python: ["created", "Guido van Rossum", "first released in 1991"], javascript: ["created", "Brendan Eich", "at Netscape in 1995"], linux: ["created", "Linus Torvalds", "1991"], c: ["created", "Dennis Ritchie", "at Bell Labs, around 1972"],
  java: ["created", "James Gosling", "at Sun Microsystems, released in 1995"], git: ["created", "Linus Torvalds", "2005"], "c++": ["created", "Bjarne Stroustrup", "1985"],
  "mona lisa": ["painted", "Leonardo da Vinci", "around 1503-1519"], "the mona lisa": ["painted", "Leonardo da Vinci", "around 1503-1519"], "starry night": ["painted", "Vincent van Gogh", "1889"], "the starry night": ["painted", "Vincent van Gogh", "1889"],
  "sistine chapel ceiling": ["painted", "Michelangelo", "1508-1512"], "the sistine chapel": ["painted", "Michelangelo", "the ceiling frescoes, 1508-1512, and later The Last Judgment, 1536-1541"], "the last supper": ["painted", "Leonardo da Vinci", "1495-1498"],
  microsoft: ["founded", "Bill Gates and Paul Allen", "1975"], apple: ["founded", "Steve Jobs, Steve Wozniak and Ronald Wayne", "1976"], google: ["founded", "Larry Page and Sergey Brin", "1998"],
  amazon: ["founded", "Jeff Bezos", "1994"], facebook: ["founded", "Mark Zuckerberg with Eduardo Saverin, Andrew McCollum, Dustin Moskovitz and Chris Hughes", "2004"],
  tesla: ["founded", "Martin Eberhard and Marc Tarpenning", "2003; Elon Musk joined as chairman and lead investor in 2004"], anthropic: ["founded", "Dario Amodei, Daniela Amodei and other former OpenAI researchers", "2021"],
  wikipedia: ["founded", "Jimmy Wales and Larry Sanger", "2001"], youtube: ["founded", "Chad Hurley, Steve Chen and Jawed Karim", "2005"],
  "declaration of independence": ["wrote", "Thomas Jefferson", "its principal author, working with the Committee of Five; adopted on 4 July 1776"],
  constitution: ["wrote", "James Madison", "the chief drafter of the US Constitution, 1787, often called its father"],
};
const PROPER = { python: "Python", javascript: "JavaScript", linux: "Linux", c: "C", java: "Java", git: "Git", "c++": "C++", microsoft: "Microsoft", apple: "Apple", google: "Google", amazon: "Amazon", facebook: "Facebook", tesla: "Tesla", anthropic: "Anthropic", wikipedia: "Wikipedia", youtube: "YouTube", internet: "the Internet", "world wide web": "the World Wide Web", web: "the World Wide Web", "periodic table": "the periodic table", evolution: "the theory of evolution", "theory of evolution": "the theory of evolution", gravity: "gravity", relativity: "the theory of relativity", penicillin: "penicillin", dynamite: "dynamite", radio: "radio", television: "television", "declaration of independence": "the Declaration of Independence", constitution: "the US Constitution" };
const FIRSTS = [
  [/^(?:who was )?(?:the )?first president of (?:the )?(?:united states|usa|us|america)(?: of america)?$/, "George Washington was the first president of the United States (1789 to 1797)."],
  [/^(?:who was )?(?:the )?first (?:man|person|human) (?:to walk )?on the moon$|^who (?:first )?walked on the moon first$/, "Neil Armstrong was the first person to walk on the Moon, on 20 July 1969 (Apollo 11); Buzz Aldrin followed him."],
  [/^(?:who was )?(?:the )?first (?:man|person|human) in space$/, "Yuri Gagarin was the first person in space, on 12 April 1961 (Vostok 1)."],
  [/^(?:who was )?(?:the )?first woman in space$/, "Valentina Tereshkova was the first woman in space, on 16 June 1963 (Vostok 6)."],
  [/^(?:who was )?(?:the )?first (?:person|man|people) (?:to climb|on top of|to summit) (?:mount |mt\.? )?everest$/, "Edmund Hillary and Tenzing Norgay first reached the summit of Everest, on 29 May 1953."],
  [/^(?:who was )?(?:the )?first (?:computer programmer|programmer)$/, "Ada Lovelace is usually called the first computer programmer, for her 1843 notes on Babbage's Analytical Engine."],
];
const EVENTS = {
  "world war 2": "World War II began on 1 September 1939 and ended in 1945: in Europe on 8 May 1945 (V-E Day), and with Japan's formal surrender on 2 September 1945.",
  "world war 1": "World War I began on 28 July 1914 and ended with the armistice of 11 November 1918 (the Treaty of Versailles followed in 1919).",
  "the american civil war": "The American Civil War lasted from 12 April 1861 to 1865; Lee surrendered at Appomattox on 9 April 1865.",
  "the cold war": "The Cold War is usually dated from 1947 to 1991; it ended with the dissolution of the Soviet Union on 26 December 1991.",
  "the moon landing": "Apollo 11 landed on the Moon on 20 July 1969.",
  "the berlin wall": "The Berlin Wall was built from 13 August 1961 and fell on 9 November 1989.",
  "the titanic": "The Titanic struck an iceberg late on 14 April 1912 and sank early on 15 April 1912.",
  "the french revolution": "The French Revolution began in 1789 (the storming of the Bastille was on 14 July 1789) and is usually said to end in 1799.",
  "american independence": "The Declaration of Independence was adopted on 4 July 1776.",
  "columbus discovering america": "Christopher Columbus reached the Caribbean (the island of Guanahani in the Bahamas) on 12 October 1492. Norse explorers led by Leif Erikson had reached North America around the year 1000.",
  "the declaration of independence": "The Declaration of Independence was adopted on 4 July 1776.",
  "columbus": "Christopher Columbus reached the Caribbean (the island of Guanahani in the Bahamas) on 12 October 1492. Norse explorers led by Leif Erikson had reached North America around the year 1000.",
  "9/11": "The September 11 attacks took place on 11 September 2001.",
  "the fall of rome": "The Western Roman Empire is traditionally said to have fallen in 476 AD; the Eastern (Byzantine) Empire lasted until 1453.",
  "the magna carta": "The Magna Carta was sealed on 15 June 1215.",
  "pearl harbor": "The attack on Pearl Harbor was on 7 December 1941.",
  "d-day": "D-Day, the Normandy landings, was on 6 June 1944.",
  "chernobyl": "The Chernobyl disaster happened on 26 April 1986.",
  "the first iphone": "The first iPhone was announced on 9 January 2007 and went on sale on 29 June 2007.",
  "the great depression": "The Great Depression began with the stock market crash of October 1929 and lasted through the 1930s.",
  "the covid pandemic": "The WHO declared COVID-19 a pandemic on 11 March 2020.",
};
const EVENT_ALIAS = { "world war ii": "world war 2", "ww2": "world war 2", "wwii": "world war 2", "second world war": "world war 2", "the second world war": "world war 2", "world war two": "world war 2", "world war i": "world war 1", "ww1": "world war 1", "wwi": "world war 1", "first world war": "world war 1", "the first world war": "world war 1", "world war one": "world war 1", "the great war": "world war 1", "civil war": "the american civil war", "the civil war": "the american civil war", "cold war": "the cold war", "moon landing": "the moon landing", "apollo 11": "the moon landing", "berlin wall": "the berlin wall", "the berlin wall fall": "the berlin wall", titanic: "the titanic", "french revolution": "the french revolution", "declaration of independence": "the declaration of independence", "magna carta": "the magna carta", "september 11": "9/11", "911": "9/11", "the iphone": "the first iphone", iphone: "the first iphone", "great depression": "the great depression", covid: "the covid pandemic", "covid 19": "the covid pandemic", "covid-19": "the covid pandemic", "the pandemic": "the covid pandemic", "fall of rome": "the fall of rome", "rome fall": "the fall of rome", "d day": "d-day" };

const LANGUAGES = {
  brazil: "Portuguese", portugal: "Portuguese", mexico: "Spanish", argentina: "Spanish", spain: "Spanish (with Catalan, Galician and Basque co-official in their regions)", colombia: "Spanish", chile: "Spanish", peru: "Spanish (with Quechua and Aymara)", venezuela: "Spanish", cuba: "Spanish",
  france: "French", germany: "German", austria: "German", switzerland: "German, French, Italian and Romansh", belgium: "Dutch, French and German", netherlands: "Dutch", holland: "Dutch", italy: "Italian",
  japan: "Japanese", china: "Mandarin Chinese (Standard Chinese)", taiwan: "Mandarin Chinese", "south korea": "Korean", "north korea": "Korean", korea: "Korean",
  india: "Hindi and English at the national level, with 22 languages recognised in the constitution", pakistan: "Urdu and English", bangladesh: "Bengali", russia: "Russian", ukraine: "Ukrainian",
  poland: "Polish", sweden: "Swedish", norway: "Norwegian", denmark: "Danish", finland: "Finnish and Swedish", iceland: "Icelandic", greece: "Greek", turkey: "Turkish", iran: "Persian (Farsi)",
  iraq: "Arabic and Kurdish", egypt: "Arabic", "saudi arabia": "Arabic", israel: "Hebrew", ethiopia: "Amharic (the federal working language)", kenya: "Swahili and English", tanzania: "Swahili and English",
  nigeria: "English (with Hausa, Yoruba and Igbo widely spoken)", "south africa": "12 official languages; Zulu is the most common home language, with Xhosa, Afrikaans and English among the others",
  indonesia: "Indonesian", malaysia: "Malay", philippines: "Filipino and English", vietnam: "Vietnamese", thailand: "Thai", canada: "English and French",
  "united states": "English (designated the official language by executive order in 2025; Spanish is the second most spoken)", usa: "English (designated the official language by executive order in 2025; Spanish is the second most spoken)", america: "English (designated the official language by executive order in 2025; Spanish is the second most spoken)",
  australia: "English", "new zealand": "English, Maori and New Zealand Sign Language", ireland: "Irish and English", "united kingdom": "English (with Welsh, Scottish Gaelic and others regionally)", uk: "English (with Welsh, Scottish Gaelic and others regionally)", england: "English",
  czechia: "Czech", "czech republic": "Czech", hungary: "Hungarian", romania: "Romanian", afghanistan: "Pashto and Dari", mongolia: "Mongolian", nepal: "Nepali", "sri lanka": "Sinhala and Tamil",
  haiti: "Haitian Creole and French", jamaica: "English", morocco: "Arabic and Tamazight (Berber)", singapore: "English, Malay, Mandarin and Tamil", "hong kong": "Chinese (Cantonese is spoken) and English",
};
const LEGS = {
  spider: "8 legs", insect: "6 legs", ant: "6 legs", bee: "6 legs", butterfly: "6 legs", fly: "6 legs", beetle: "6 legs", cockroach: "6 legs", grasshopper: "6 legs", mosquito: "6 legs",
  scorpion: "8 legs", tick: "8 legs", mite: "8 legs", crab: "10 legs (8 walking legs and 2 claws)", lobster: "10 legs (including the 2 claws)", shrimp: "10 walking legs",
  octopus: "8 arms (not legs)", squid: "8 arms and 2 longer tentacles", starfish: "usually 5 arms (some species have many more)",
  centipede: "from 30 to 382 legs depending on the species; always an odd number of pairs, so never exactly 100", millipede: "usually a few hundred legs; the record, Eumillipes persephone, has 1,306",
  dog: "4 legs", cat: "4 legs", horse: "4 legs", cow: "4 legs", elephant: "4 legs", frog: "4 legs", lizard: "4 legs", mouse: "4 legs", rabbit: "4 legs", pig: "4 legs", sheep: "4 legs", goat: "4 legs", lion: "4 legs", tiger: "4 legs", bear: "4 legs",
  bird: "2 legs", chicken: "2 legs", duck: "2 legs", ostrich: "2 legs", penguin: "2 legs", human: "2 legs", person: "2 legs", kangaroo: "2 legs (it also balances on its tail)",
  snake: "no legs", fish: "no legs", worm: "no legs", snail: "no legs (it moves on one muscular foot)",
};
const singular = (w) => w.replace(/(?:ies)$/, "y").replace(/(?:es)$/, (x) => (/(?:sh|ch|x|ss)es$/.test(w) ? "" : "e")).replace(/s$/, "").replace(/^people$/, "person").replace(/^mice$/, "mouse").replace(/^geese$/, "goose");

export function fact(input) {
  const t = clean(input).replace(/^(?:do you know |tell me |can you tell me )/, "");
  for (const [re, text] of FIRSTS) if (re.test(t)) return { ok: true, text };
  let m = t.match(/^who (invented|discovered|created|made|painted|founded|developed|designed|wrote|started|came up with) (?:the )?(.+)$/);
  if (m) {
    const k = m[2].replace(/^(?:a|an) /, ""), e = MADE[k] || MADE["the " + k];
    if (e) {
      const bare = k.replace(/^the /, "");
      const obj = PROPER[bare] || (/^(?:mona lisa|starry night|last supper|sistine)/.test(bare) ? "the " + bare.replace(/\b\w/g, (c) => c.toUpperCase()) : bare === "dna" ? "the structure of DNA" : "the " + bare);
      return { ok: true, text: `${cap(e[1])} ${e[0]} ${obj}${e[2] ? " (" + e[2] + ")" : ""}.` };
    }
  }
  if (/^(?:when|what year|in what year) (?:did (?:christopher )?columbus (?:discover|find|reach|land in|arrive in|sail to) (?:america|the americas|the new world)|was america discovered)$/.test(t)) return { ok: true, text: EVENTS.columbus };
  m = t.match(/^(?:when|what year|in what year|which year) (?:did|was|were) (.+?) (?:end|finish|over|begin|start|happen|take place|occur|sink|fall|built|signed|adopted|released|come out|land)$/) || t.match(/^when (?:was|were|is) (.+?)$/) || t.match(/^(?:when did )?(.+?) (?:start|end) date$/);
  if (m) { const k = m[1].replace(/^(?:the )?(?:end|start|beginning) of /, ""); const key = EVENTS[k] ? k : EVENT_ALIAS[k] || EVENT_ALIAS[k.replace(/^the /, "")]; if (key && EVENTS[key]) return { ok: true, text: EVENTS[key] }; }
  m = t.match(/^(?:what|which) (?:language|languages) (?:is|are) (?:spoken|used|official) in (?:the )?(.+)$/) || t.match(/^(?:what|which) (?:is the )?(?:official |main |national )?languages? (?:of|in) (?:the )?(.+)$/) || t.match(/^what do (?:they|people) speak in (?:the )?(.+)$/);
  if (m && LANGUAGES[m[1]]) return { ok: true, text: `The main language of ${m[1].replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^Usa$|^Uk$/, (x) => x.toUpperCase())}: ${LANGUAGES[m[1]]}.` };
  m = t.match(/^how many (?:legs|arms|feet) (?:does|do) (?:an? |the )?(.+?) have$/) || t.match(/^how many (?:legs|arms) (?:has|on) (?:an? |the )?(.+)$/);
  if (m) { const a = LEGS[m[1]] || LEGS[singular(m[1])]; if (a) return { ok: true, text: `${cap(/^(?:an? )/.test(m[1]) ? m[1] : (/^[aeiou]/.test(m[1]) ? "an " : "a ") + singular(m[1]))} has ${a}.` }; }
  if (/^(?:what is )?(?:the )?meaning of life(?: the universe and everything)?$/.test(t)) return { ok: true, text: "There is no single agreed answer: philosophers and religions answer it differently, and many people find meaning in relationships, curiosity, work and helping others. In Douglas Adams' The Hitchhiker's Guide to the Galaxy, the computer Deep Thought famously answers 42." };
  return { ok: false };
}

// ---------------------------------------------------------------- conversation
const JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 kinds of people in the world: those who understand binary and those who do not.",
  "Why did the developer go broke? Because they used up all their cache.",
  "A SQL query walks into a bar, goes up to two tables and asks: can I join you?",
  "Why was the math book sad? It had too many problems.",
  "Parallel lines have so much in common. It is a shame they will never meet.",
  "I would tell you a UDP joke, but you might not get it.",
  "Why do Java developers wear glasses? Because they do not C#.",
  "What is an astronaut's favourite key on the keyboard? The space bar.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I told my computer I needed a break, and it said: no problem, I will go to sleep.",
  "Why did the function stop calling itself? It finally reached its base case.",
  "Why are skeletons so calm? Nothing gets under their skin.",
  "How many programmers does it take to change a light bulb? None. That is a hardware problem.",
  "What do you call 8 hobbits? A hobbyte.",
  "Why did the zero skip the party? It felt it would not count.",
];
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];
export function chat(raw, seed = Date.now()) {
  const t = clean(raw).replace(/^im\b/, "i'm").replace(/^ive\b/, "i've");
  if (/^(?:who (?:made|built|created|developed|programmed|wrote|designed) you|who is your (?:creator|maker|developer|author)|who owns you|where do you come from|where are you from)$/.test(t))
    return { title: "Who made DI", body: "I was built by the **Darknode** team as a from-scratch engine: my own parser, typo reader, math, unit and date engines, code generator and curated knowledge packs. There is no language model inside me, which is why my answers are exact and repeatable, and why I tell you when something is outside what I know." };
  if (/^(?:what(?:'s| is) )?(?:the )?meaning of life(?:,? the universe,? and everything)?$|^what is the point of (?:life|living|it all)$|^why (?:are we|do we exist)(?: here)?$/.test(t))
    return { title: "The meaning of life", body: fact("meaning of life").text, note: "There is no computed answer to this one; this is a summary, not an opinion." };
  if (/^(?:tell|give|say|share) me (?:a |another |one more )?(?:joke|funny joke|programming joke|pun)|^(?:a )?joke(?: please)?$|^make me laugh$|^(?:know|got) any (?:good )?jokes$|^(?:another|one more) (?:joke|one)$/.test(t))
  {
    const about = (t.match(/\b(?:about|on|with) (?:a |an |the )?([a-z]+?)s?$/) || [])[1];
    const pool = about ? JOKES.filter((j) => new RegExp("\\b" + about + "(?:s|es)?\\b", "i").test(j)) : JOKES;
    return { title: "Joke", body: (about && !pool.length ? "I do not have one about " + about + "s, but here is one I do have:\n\n" : "") + pick(pool.length ? pool : JOKES, seed), note: "From DI's joke list; ask again for another." };
  }
  if (/^(?:i(?:'m| am) (?:so |very |really |kinda |kind of )?bored|i(?:'m| am) boring myself|bored|what should i do|what can i do (?:now|today)|entertain me)$/.test(t))
    return { title: "Something to do", body: "A few things we can do right now:\n- **quiz yourself**: ask me \"is 221 prime\" and guess first\n- **roll dice** or **flip a coin** to settle a decision\n- **learn a word**: \"define serendipity\"\n- **write some code**: \"python function that returns the sum of the even numbers in a list\"\n- **a puzzle**: \"what is the next number in 1, 1, 2, 3, 5, 8\"\n- or just **tell me a joke** request." };
  if (/^(?:i(?:'m| am| feel| am feeling|'m feeling) (?:so |very |really |a bit |kind of |kinda )?(?:sad|down|depressed|lonely|unhappy|upset|low|awful|terrible|miserable|stressed|anxious|overwhelmed|worried|tired|exhausted)|i feel bad|i(?:'m| am) not (?:ok|okay|doing well|feeling well))$/.test(t)) {
    const crisis = /depressed|miserable|awful|terrible/.test(t);
    return { title: "I hear you", body: "I'm sorry you're feeling this way. I'm an offline tool, not a counsellor, but a few things often help a little: step away from the screen for a few minutes, drink some water, get some daylight or a short walk, and tell someone you trust how you feel." + (crisis ? "\n\nIf it feels heavy or it has lasted a while, please talk to a doctor or a counsellor. If you are in danger or thinking about harming yourself, contact your local emergency number or a crisis line now (in the US, call or text **988**)." : "") + "\n\nIf a distraction would help, I can tell you a joke or give you a small puzzle." };
  }
  if (/^(?:motivate me|i need (?:some )?motivation|give me (?:some )?motivation|inspire me|(?:give me |tell me )?(?:a |an )?(?:motivational|inspirational|inspiring) (?:quote|message|words)|encourage me)$/.test(t))
    return { title: "Motivation", body: pick([
      "Start with the smallest possible step, the one that takes two minutes. Momentum is easier to keep than to find.",
      "You do not have to feel ready. Most people who finish things started before they felt ready.",
      "Progress beats perfection: a rough version today teaches you more than a perfect plan next month.",
      "Break it down until the next step is obvious, then do only that step.",
      "Look at how far you have already come. The same person who did that can do the next part.",
    ], seed) };
  if (/^(?:recommend|suggest) (?:me )?(?:a |some |good )?books?|^what (?:book|books) should i read|^(?:a )?good books? to read$/.test(t))
    return { title: "Book ideas", body: "A few widely loved picks across genres:\n- **Fiction**: *To Kill a Mockingbird* (Harper Lee), *1984* (George Orwell), *The Hobbit* (J. R. R. Tolkien)\n- **Science**: *A Short History of Nearly Everything* (Bill Bryson), *Cosmos* (Carl Sagan)\n- **Ideas**: *Sapiens* (Yuval Noah Harari), *Thinking, Fast and Slow* (Daniel Kahneman)\n- **Programming**: *The Pragmatic Programmer* (Hunt and Thomas), *Clean Code* (Robert C. Martin)\n\nTell me a genre and I can narrow it, or ask \"who wrote\" any title.", note: "A fixed starter list, not personalised." };
  if (/^(?:what should i (?:eat|have|cook|make) (?:for )?(?:dinner|lunch|breakfast|tonight|today)|(?:dinner|lunch|meal) (?:ideas|idea|suggestions)|what(?:'s| is) for dinner|suggest (?:a |something for )?(?:dinner|lunch|meal))$/.test(t)) {
    const meals = ["a stir-fry: whatever vegetables you have, garlic, soy sauce and rice or noodles", "pasta with tomato, garlic and olive oil, plus a green salad", "a big omelette or frittata with cheese and leftover vegetables", "tacos or wraps with beans or chicken, salsa and something crunchy", "a sheet-pan dinner: chicken or chickpeas with potatoes and vegetables, 40 minutes in a hot oven", "soup and toasted sandwiches", "a rice bowl: rice, a fried egg, greens and a spoon of chili sauce"];
    return { title: "Dinner idea", body: "How about " + pick(meals, seed) + "? Ask again for another idea, or tell me how many people and I can scale a recipe amount for you." };
  }
  return null;
}

// ---------------------------------------------------------------- summarizer
const STOP = new Set("a an the and or but if then so of to in on at by for with from as is are was were be been being it its this that these those i you he she we they them his her their our your my me him us not no do does did have has had will would can could should may might must there here what which who whom whose when where why how all any each few more most other some such only own same than too very just also into over under again further once about against between through during before after above below up down out off".split(" "));
export function summarize(text, maxSentences) {
  const src = String(text || "").replace(/\s+/g, " ").trim();
  const sents = (src.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || []).map((x) => x.trim()).filter((x) => x.split(" ").length >= 3);
  if (sents.length < 2) return { ok: false, error: "Give me at least two sentences to summarize." };
  const tok = (x) => x.toLowerCase().match(/[a-z][a-z'-]+/g) || [];
  const freq = new Map();
  for (const s of sents) for (const w of new Set(tok(s))) if (!STOP.has(w) && w.length > 2) freq.set(w, (freq.get(w) || 0) + 1);
  const top = Math.max(1, ...freq.values());
  const scored = sents.map((s, i) => {
    const ws = tok(s).filter((w) => !STOP.has(w) && w.length > 2);
    const sc = ws.reduce((a, w) => a + freq.get(w) / top, 0) / Math.sqrt(Math.max(1, ws.length)) + (i === 0 ? 0.25 : 0);
    return { s, i, sc };
  });
  const k = maxSentences || Math.max(1, Math.min(5, Math.round(sents.length / 3)));
  const keep = [...scored].sort((a, b) => b.sc - a.sc || a.i - b.i).slice(0, k).sort((a, b) => a.i - b.i);
  const keywords = [...freq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([w]) => w);
  const inWords = src.split(" ").length, outWords = keep.map((x) => x.s).join(" ").split(" ").length;
  return { ok: true, kind: "summary", summary: keep.map((x) => x.s).join(" "), sentences: sents.length, kept: keep.length, keywords, inWords, outWords };
}

// ---------------------------------------------------------------- rhymes
// Spelling-based: the rime is the last vowel group plus what follows ("cat" -> "at",
// "light" -> "ight"); a trailing silent e keeps the vowel before it ("make" -> "ake").
function rime(w) {
  const m = w.match(/[aeiouy]+[^aeiouy]*e?$/);
  if (!m) return null;
  let r = m[0];
  if (r === "e") { const m2 = w.match(/[aeiouy]+[^aeiouy]+e$/); if (m2) r = m2[0]; }
  return r;
}
// Some spellings hide several sounds. Words listed in one group never rhyme with another
// group of the same spelling ("love" / "move" / "drove").
const SOUNDS = {
  ove: [["love", "above", "glove", "dove", "shove", "foxglove"], ["move", "prove", "remove", "improve", "approve", "disprove", "groove"], ["drove", "grove", "stove", "cove", "wove", "strove", "clove", "rove", "trove", "alcove"]],
  ood: [["good", "wood", "hood", "stood", "understood", "childhood", "neighborhood", "could", "should", "would"], ["food", "mood", "brood", "rude", "dude"], ["blood", "flood", "mud"]],
  ear: [["hear", "fear", "near", "dear", "clear", "year", "gear", "tear", "spear", "appear", "disappear", "beer", "deer", "here"], ["bear", "wear", "pear", "swear", "care", "hair", "there", "where", "fair"]],
  ow: [["now", "cow", "how", "bow", "wow", "allow", "brow", "plow", "vow"], ["low", "show", "know", "grow", "slow", "snow", "blow", "flow", "throw", "below", "follow", "yellow", "go", "no"]],
  own: [["down", "town", "brown", "crown", "gown", "clown", "frown", "drown"], ["own", "known", "shown", "grown", "blown", "thrown", "flown", "sown"]],
  ome: [["home", "dome", "rome", "chrome", "gnome", "foam"], ["come", "some", "become", "income", "outcome", "welcome", "hum"]],
  at: [["what", "somewhat", "squat", "yacht"]],
  ere: [["here", "mere", "sincere", "severe", "sphere", "atmosphere", "interfere"], ["there", "where", "somewhere", "nowhere", "anywhere", "everywhere"], ["were"]],
  ough: [["tough", "rough", "enough"], ["though", "dough", "although"], ["through"], ["cough", "trough"], ["bough", "plough"], ["thought", "bought", "brought", "fought", "sought"]],
};
const NO_RHYME = { orange: ["door hinge (near rhyme)", "sporange (a rare botanical word)"], silver: ["chilver (a dialect word for a ewe lamb)"], purple: ["hurple (a Scots word for walking lamely)", "circle (near rhyme)"], month: ["oneth, dunth (made-up)"] };
function soundGroup(r, w) { const gs = SOUNDS[r]; if (!gs) return -1; const i = gs.findIndex((g) => g.includes(w)); return i; }
const syllables = (w) => Math.max(1, (w.replace(/e$/, "").match(/[aeiouy]+/g) || []).length);
export function rhymes(word, limit = 24) {
  const w = String(word || "").toLowerCase().trim();
  if (!/^[a-z]{2,20}$/.test(w)) return { ok: false, error: "Give me one word to rhyme." };
  if (NO_RHYME[w]) return { ok: true, kind: "rhymes", word: w, rime: "", words: NO_RHYME[w], total: 0, none: true };
  const r = rime(w);
  if (!r) return { ok: false, error: `I cannot find a vowel sound in "${w}" to rhyme.` };
  const n = syllables(w), all = englishWords(), out = [], g = soundGroup(r, w);
  for (const c of all) {
    if (c === w || c.length < 2 || !c.endsWith(r) || c.endsWith(w)) continue;
    if (w.endsWith(c) && c.length < w.length) continue;
    if (!/^[a-z]+$/.test(c) || (/(?:s|ed|ing)$/.test(c) && !/(?:s|ed|ing)$/.test(w))) continue;
    if (rime(c) !== r) continue;
    if (/[qg]ue$/.test(c) && !/[qg]ue$/.test(w)) continue; // "tongue", "basque": the -ue is silent // "eat" ends in "at" but its vowel is "ea"
    const cg = soundGroup(r, c);
    if (cg >= 0 && cg !== g) continue;
    if (g >= 0 && cg < 0 && !SOUNDS[r][g].some((m) => c.endsWith(m))) continue;
    out.push({ c, b: wordBand(c) + (g >= 0 && cg === g ? 3 : 0), d: Math.abs(syllables(c) - n) });
  }
  out.sort((a, b) => a.d - b.d || b.b - a.b || a.c.length - b.c.length || a.c.localeCompare(b.c));
  const best = out.filter((x) => x.b >= 2).slice(0, limit).map((x) => x.c);
  const list = best.length >= 6 ? best : out.slice(0, limit).map((x) => x.c);
  if (!list.length) return { ok: false, error: `I found no words ending in "-${r}" to rhyme with "${w}".` };
  return { ok: true, kind: "rhymes", word: w, rime: r, words: list, total: out.length };
}

// ---------------------------------------------------------------- phrases
const LANGS = ["spanish", "french", "german", "italian", "portuguese"];
const LANG_ALIAS = { es: "spanish", espanol: "spanish", "español": "spanish", fr: "french", francais: "french", de: "german", deutsch: "german", it: "italian", italiano: "italian", pt: "portuguese", "brazilian portuguese": "portuguese" };
const PHRASES = {
  hello: ["hola", "bonjour", "hallo", "ciao", "olá"], hi: ["hola", "salut", "hallo", "ciao", "oi"],
  goodbye: ["adiós", "au revoir", "auf Wiedersehen (informal: tschüss)", "arrivederci", "adeus (informal: tchau)"], bye: ["adiós", "salut", "tschüss", "ciao", "tchau"],
  "thank you": ["gracias", "merci", "danke", "grazie", "obrigado (said by a man) / obrigada (said by a woman)"], thanks: ["gracias", "merci", "danke", "grazie", "obrigado / obrigada"],
  "thank you very much": ["muchas gracias", "merci beaucoup", "vielen Dank", "grazie mille", "muito obrigado / muito obrigada"],
  please: ["por favor", "s'il vous plaît (informal: s'il te plaît)", "bitte", "per favore", "por favor"], yes: ["sí", "oui", "ja", "sì", "sim"], no: ["no", "non", "nein", "no", "não"],
  "good morning": ["buenos días", "bonjour", "guten Morgen", "buongiorno", "bom dia"], "good afternoon": ["buenas tardes", "bon après-midi", "guten Tag", "buon pomeriggio", "boa tarde"],
  "good evening": ["buenas noches", "bonsoir", "guten Abend", "buonasera", "boa noite"], "good night": ["buenas noches", "bonne nuit", "gute Nacht", "buona notte", "boa noite"],
  "how are you": ["¿cómo estás?", "comment ça va ?", "wie geht es dir?", "come stai?", "como você está?"], "i love you": ["te quiero (romantic: te amo)", "je t'aime", "ich liebe dich", "ti amo", "eu te amo"],
  sorry: ["lo siento", "désolé (said by a woman: désolée)", "Entschuldigung", "mi dispiace", "desculpe"], "excuse me": ["disculpe", "excusez-moi", "Entschuldigung", "mi scusi", "com licença"],
  "my name is": ["me llamo", "je m'appelle", "ich heiße", "mi chiamo", "meu nome é"], "what is your name": ["¿cómo te llamas?", "comment tu t'appelles ?", "wie heißt du?", "come ti chiami?", "qual é o seu nome?"],
  "where is the bathroom": ["¿dónde está el baño?", "où sont les toilettes ?", "wo ist die Toilette?", "dov'è il bagno?", "onde fica o banheiro?"],
  "i don't understand": ["no entiendo", "je ne comprends pas", "ich verstehe nicht", "non capisco", "não entendo"], "do you speak english": ["¿hablas inglés?", "parlez-vous anglais ?", "sprechen Sie Englisch?", "parli inglese?", "você fala inglês?"],
  "you're welcome": ["de nada", "de rien", "bitte schön", "prego", "de nada"], welcome: ["bienvenido", "bienvenue", "willkommen", "benvenuto", "bem-vindo"],
  cheers: ["¡salud!", "santé !", "prost!", "salute! / cin cin!", "saúde!"], "happy birthday": ["feliz cumpleaños", "joyeux anniversaire", "alles Gute zum Geburtstag", "buon compleanno", "feliz aniversário"],
  "good luck": ["buena suerte", "bonne chance", "viel Glück", "buona fortuna", "boa sorte"], "see you later": ["hasta luego", "à plus tard", "bis später", "a dopo", "até logo"],
  "how much is it": ["¿cuánto cuesta?", "combien ça coûte ?", "wie viel kostet das?", "quanto costa?", "quanto custa?"], "help": ["ayuda", "à l'aide / au secours", "Hilfe", "aiuto", "socorro"],
  water: ["agua", "eau", "Wasser", "acqua", "água"], friend: ["amigo / amiga", "ami / amie", "Freund / Freundin", "amico / amica", "amigo / amiga"], love: ["amor", "amour", "Liebe", "amore", "amor"],
  cat: ["gato", "chat", "Katze", "gatto", "gato"], dog: ["perro", "chien", "Hund", "cane", "cão (Brazil: cachorro)"], house: ["casa", "maison", "Haus", "casa", "casa"], food: ["comida", "nourriture", "Essen", "cibo", "comida"],
  beautiful: ["hermoso / hermosa", "beau / belle", "schön", "bello / bella", "bonito / bonita"], "good": ["bueno", "bon", "gut", "buono", "bom"], "one": ["uno", "un", "eins", "uno", "um"], "two": ["dos", "deux", "zwei", "due", "dois"], "three": ["tres", "trois", "drei", "tre", "três"],
};
export function translate(input) {
  const t = clean(input).replace(/[¿¡"]/g, "");
  const m = t.match(/^(?:translate|say) (.+?) (?:to|into|in) ([a-z ]+)$/) || t.match(/^(?:how (?:do|would) (?:you|i|we) say|what(?:'s| is)) (.+?) in ([a-z ]+)$/) || t.match(/^(.+?) in ([a-z ]+)$/);
  if (!m) return null;
  const lang = LANG_ALIAS[m[2].trim()] || m[2].trim(), li = LANGS.indexOf(lang);
  if (li < 0) return null;
  const phrase = m[1].replace(/^(?:the (?:word|phrase) )/, "").replace(/^"|"$/g, "").replace(/\bdo not\b/, "don't").replace(/\byou are welcome\b/, "you're welcome").replace(/\bwhere is the (?:restroom|toilet)\b/, "where is the bathroom").trim();
  const row = PHRASES[phrase];
  if (!row) return { ok: false, kind: "phrase", phrase, lang };
  return { ok: true, kind: "phrase", phrase, lang, text: row[li], others: LANGS.map((l, i) => [l, row[i]]).filter(([l]) => l !== lang) };
}
export const PHRASE_LANGS = LANGS;
const TABLE_WORDS = [...Object.keys(MADE), ...Object.keys(EVENTS), ...Object.keys(EVENT_ALIAS), ...Object.keys(LANGUAGES), ...Object.keys(LEGS), ...Object.keys(PHRASES), ...DIFFS.flatMap((d) => d[0])].join(" ").split(/[^a-z]+/).filter((w) => w.length > 2);
export const VOCAB = [...new Set(TABLE_WORDS)].concat(["rom", "ram", "tcp", "udp", "tuple", "tuples", "authentication", "authorization", "ipv4", "ipv6", "nosql", "frontend", "backend", "rebase", "mitosis", "meiosis", "joke", "jokes", "bored", "motivate", "motivation", "summarize", "summarise", "summary", "rhyme", "rhymes", "rhyming", "translate", "spanish", "french", "german", "italian", "portuguese", "centipede", "millipede", "penicillin", "gutenberg"]);

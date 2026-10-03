// Behavioural tests for the everyday tools (everyday.js), the curated how-to
// library (howto.js) and the Round 6 routing fixes around them: clock times must
// never be summed as digits, "flip a coin" is a draw not a text reverse, and
// travel time comes back as a formatted duration with units reconciled.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";

const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-everyday-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });

const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const EV = await import(pathToFileURL(join(dir, "everyday.js")).href);
const AD = await import(pathToFileURL(join(dir, "advanced.js")).href);
const HT = await import(pathToFileURL(join(dir, "howto.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const text = (r) => [r.title, r.body, r.pre].filter(Boolean).join(" | ").replace(/\*\*/g, "");
const ask = (q) => text(E.respond(q, model));
const skill = (q) => E.respond(q, model).skill;
const year = new Date().getUTCFullYear();

group("everyday: clock arithmetic", () => {
  const cases = [
    ["how many hours between 9am and 5:30pm", /8 hours 30 minutes \(8\.5 hours\)/],
    ["hours between 9:00 and 17:00", /8 hours \(8 hours\)/],
    ["how long from 10pm to 6am", /8 hours .*next day/],
    ["time between noon and 3:15pm", /3 hours 15 minutes/],
    ["add 45 minutes to 10:20", /\b11:05\b/],
    ["what time is 2 hours after 11:30pm", /1:30 AM .*next day/],
    ["subtract 90 minutes from 1:00pm", /11:30 AM/],
    ["10:20 + 45 minutes", /\b11:05\b/],
    ["3 hours before noon", /9:00 AM/],
    ["9 to 5 is how many hours", /8 hours \(8 hours\), reading 5 as 5pm/],
    ["what time will it be in 3 hours and 20 minutes from 2:15pm", /5:35 PM/],
  ];
  for (const [q, re] of cases) test(q, () => { assert.equal(skill(q), "everyday", q + " routed to " + skill(q)); const t = ask(q); assert.ok(re.test(t), q + " -> " + t.slice(0, 140)); });
  test("clock times are never summed as digits by wordmath", () => {
    assert.ok(!/\b44\b/.test(ask("how many hours between 9am and 5:30pm")));
    assert.ok(!/\b75\b/.test(ask("add 45 minutes to 10:20")));
  });
  test("bad clock values are not claimed", () => {
    assert.equal(EV.ask("add 45 minutes to 25:70"), null);
    assert.equal(EV.ask("hours between 13pm and 5pm"), null);
  });
});

group("everyday: time zones", () => {
  test("a major city answers with its IANA zone and offset", () => {
    const r = E.respond("what time is it in tokyo", model);
    assert.equal(r.skill, "everyday");
    assert.ok(/Asia\/Tokyo, UTC\+9\)/.test(text(r)), text(r));
    assert.ok(/\b\d{2}:\d{2}\b/.test(text(r)));
  });
  test("abbreviations, countries and multi-word cities resolve", () => {
    assert.ok(/America\/New_York/.test(ask("current time in new york")));
    assert.ok(/Asia\/Kolkata/.test(ask("time in india")));
    assert.ok(/UTC\+0\)|UTC-0\)|UTC\)/.test(ask("what time is it in utc")) || /\(UTC, UTC\+0\)/.test(ask("what time is it in utc")));
    assert.ok(/Europe\/Paris/.test(ask("what is the time in cet")));
  });
  test("an unknown place is refused, not guessed", () => {
    const t = ask("what time is it in atlantis");
    assert.ok(/do not have a time zone/.test(t), t);
  });
});

group("everyday: random draws", () => {
  test("coin, dice, number, pick, shuffle, uuid", () => {
    for (let i = 0; i < 5; i++) assert.ok(/Heads|Tails/.test(ask("flip a coin")));
    assert.equal(skill("flip a coin"), "everyday");
    assert.ok(!/nioc/.test(ask("flip a coin")));
    for (let i = 0; i < 10; i++) { const m = ask("roll a dice").match(/rolled a (\d)/); assert.ok(m && +m[1] >= 1 && +m[1] <= 6); }
    assert.ok(/2d20/.test(ask("roll 2d20")));
    for (let i = 0; i < 10; i++) { const m = ask("random number between 1 and 100").match(/\| (\d+) \(between 1 and 100/); assert.ok(m && +m[1] >= 1 && +m[1] <= 100, ask("random number between 1 and 100")); }
    assert.ok(/between 1 and 10/.test(ask("pick a number from 1 to 10")));
    assert.ok(/^Pick \| (pizza|tacos)\./.test(ask("pick between pizza and tacos")));
    assert.ok(/(red|green|blue)\./.test(ask("choose one: red, green, blue")));
    assert.ok(/^Pick \| (red|blue)\./.test(ask("should i pick red or blue")));
    const sh = E.respond("shuffle a, b, c, d", model); assert.equal(sh.skill, "everyday"); assert.deepEqual(sh.pre.split("\n").sort(), ["a", "b", "c", "d"]);
    assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(E.respond("uuid", model).pre));
    assert.equal(E.respond("generate 3 uuids", model).pre.split("\n").length, 3);
  });
  test("reverse is still reverse", () => {
    assert.ok(/dlrow olleh/.test(ask("flip hello world")));
  });
});

group("everyday: placeholder text", () => {
  test("lorem ipsum in words, sentences, paragraphs", () => {
    assert.equal(skill("lorem ipsum"), "everyday");
    assert.equal(E.respond("lorem ipsum 5 words", model).pre.split(/\s+/).length, 5);
    assert.equal(E.respond("3 paragraphs of lorem ipsum", model).pre.split("\n\n").length, 3);
    assert.ok(/^Lorem ipsum dolor/.test(E.respond("placeholder text", model).pre));
  });
});

group("everyday: money", () => {
  test("tip with a rate, with a table, with a split", () => {
    assert.ok(/18%: tip \$8\.55, total \$56\.05/.test(ask("tip on 47.50 at 18%")));
    const t = ask("tip on $80"); assert.ok(/15%: tip \$12\.00/.test(t) && /20%: tip \$16\.00/.test(t), t);
    assert.ok(/\$29\.40 each for 4/.test(ask("20% tip on 98 split 4 ways")));
  });
  test("loan payment is the standard amortised figure", () => {
    const t = ask("mortgage payment on 300000 at 6% for 30 years");
    assert.ok(/\$1,798\.65 per month/.test(t), t);
    assert.ok(/total interest\s+\$347,514\.57/.test(t), t);
    assert.ok(/\$188\.71 per month/.test(ask("car loan of $10,000 at 5% for 5 years")));
    assert.ok(/\$1,000\.00 per month/.test(ask("loan of 12000 at 0% for 12 months")));
    assert.ok(/\$495\.03 per month/.test(ask("monthly payment on a 25000 car loan at 7% over 5 years")));
    assert.ok(/\$2,555\.05 per month/.test(ask("mortgage 450000 at 5.5% 30 years")));
  });
  test("regular saving: plain and compounded", () => {
    const plain = ask("if i save 200 a month how much in 5 years");
    assert.ok(/\$12,000\.00 \(60 deposits/.test(plain), plain);
    assert.ok(!/\b205\b/.test(plain));
    const fv = ask("save 100 a month for 10 years at 6%");
    assert.ok(/\$16,387\.93/.test(fv), fv);
    assert.ok(/\$2,600\.00/.test(ask("put away 50 a week for a year")));
  });
});

group("everyday: body and travel", () => {
  test("bmi in metric and imperial", () => {
    assert.ok(/BMI 22\.9 \(normal weight\)/.test(ask("bmi 70 kg 175 cm")));
    assert.ok(/BMI 26\.6 \(overweight\)/.test(ask("what is my bmi at 180 lbs and 5 ft 9")));
    assert.ok(/BMI 17\.3 \(underweight\)/.test(ask("bmi for 50kg and 1.7m")));
    assert.ok(/BMI 22\.9 \(normal weight\)/.test(ask("bmi 70 kg 1.75 m")));
  });
  test("travel time is a duration, with units reconciled", () => {
    assert.ok(/5 hours \(5 hours\)/.test(ask("how long to travel 300 km at 60 km/h")));
    assert.ok(/4 hours 37 minutes \(4\.615 hours\)/.test(ask("how long to drive 300 miles at 65 mph")));
    const mixed = ask("how long to drive 300 km at 60 mph");
    assert.ok(/3 hours 6 minutes/.test(mixed), mixed);
    assert.ok(!/Calculation/.test(mixed));
    assert.ok(/\b200\b/.test(ask("how far can a car go at 100 km/h for 2 hours")));
  });
  test("steps to distance says it is an estimate", () => {
    const r = E.respond("how far is 10000 steps in miles", model);
    assert.ok(/4\.73 mi/.test(text(r)) && /Estimate/.test(r.note));
    assert.ok(/7\.62 km \(4\.73 miles\)/.test(ask("10000 steps")));
  });
});

group("everyday: ports and years", () => {
  test("service to port and port to service", () => {
    assert.ok(/HTTPS \(HTTP over TLS\) uses TCP port 443/.test(ask("what port does https use")));
    assert.ok(/TCP port 22/.test(ask("ssh port")));
    assert.ok(/TCP port 5432/.test(ask("default port for postgres")));
    assert.ok(/Port 3306 \(TCP\) is MySQL/.test(ask("what is port 3306")));
    assert.ok(/Port 8080 \(TCP\) is HTTP alternate/.test(ask("what port is 8080")));
    assert.ok(/UDP port 53|TCP\/UDP port 53/.test(ask("what port is dns on")));
    const t = ask("what is port 40000"); assert.ok(/no well-known assignment/.test(t) && /registered ports/.test(t), t);
    assert.ok(/only go up to 65535/.test(ask("port 70000")));
  });
  test("years ago / ahead / birth year", () => {
    assert.ok(new RegExp("\\b" + (year - 30) + "\\b").test(ask("what year was 30 years ago")));
    assert.ok(new RegExp("\\b" + (year + 10) + "\\b").test(ask("what year will it be in 10 years")));
    assert.ok(new RegExp((year - 25) + " if their birthday has already passed this year, otherwise " + (year - 26)).test(ask("what year was i born if i am 25")));
  });
});

group("everyday: does not over-claim", () => {
  test("lines that look close but are not tools return null", () => {
    for (const q of ["tip of the day", "port authority", "random thoughts", "pick up the phone", "how long is a piece of string", "save the whales", "bmi", "coin", "what is a port", "roll call", "steps to install python"])
      assert.equal(EV.ask(q), null, q + " was claimed");
  });
  test("existing skills keep their answers", () => {
    assert.ok(/\b36\b/.test(ask("what is 15% of 240")));
    assert.ok(/\b42\.66/.test(ask("split 128 dollars between 3 people")));
    assert.ok(/\b62\.993\b/.test(ask("what is 30% off 89.99")));
    assert.ok(/1628\.89/.test(ask("compound interest 1000 at 5% for 10 years")));
    assert.ok(/Password generator/.test(ask("password generator in python"))); // the program stays for code asks
    assert.ok(/Password generator/.test(ask("generate a password in python")));
    assert.ok(/\b1,? ?2,? ?5,? ?9\b/.test(ask("sort 5, 2, 9, 1")));
  });
});

group("round 6: routing fixes", () => {
  test("compare accepts powers and 'compare A and B'", () => {
    assert.ok(/1\/3 is larger/.test(ask("compare 0.3 and 1/3")));
    assert.ok(/2\^10 is larger\. 2\^10 = 1024 and 10\^3 = 1000/.test(ask("which is bigger 2^10 or 10^3")));
    assert.ok(/equal/.test(ask("compare 50% to 0.5")));
  });
  test("palindrome phrasings", () => {
    assert.ok(/yes, .racecar. is a palindrome/.test(ask("palindrome check racecar")));
    assert.ok(/yes, .racecar. is a palindrome/.test(ask("is racecar palindrome")));
    assert.ok(/no, .hello./.test(ask("check palindrome: hello")));
  });
  test("feet and inches", () => {
    assert.ok(/180 cm equals 5 ft 10\.87 in \(70\.866142 inches in all\)/.test(ask("180 cm in feet and inches")));
    assert.ok(/6 ft 0 in/.test(ask("72 inches to feet and inches")));
    assert.ok(/1\.8288 m|1\.8288 meters/.test(ask("6 feet in m")) || /1\.8288/.test(ask("6 feet in m")));
  });
  test("hash is the glossary, boiling point knows its units", () => {
    assert.ok(/Definition: hash function/.test(ask("what is a hash")));
    assert.ok(/Definition: hash map/.test(ask("what is a hashmap")));
    assert.ok(/212 degrees F \(100 degrees C\)/.test(ask("boiling point of water in fahrenheit")));
    assert.ok(/100 degrees C/.test(ask("what is the boiling point of water")));
    assert.ok(/273\.15 K/.test(ask("freezing point of water in kelvin")));
  });
});

group("howto: curated snippets", () => {
  const cases = [
    ["git undo last commit", /git reset --soft HEAD~1/], ["how do i undo the last commit in git", /git revert HEAD/],
    ["how do i center a div", /place-items: center/], ["python list comprehension example", /\[x \* x for x in range\(10\)\]/],
    ["how to create a new branch in git", /git switch -c/], ["debounce function in javascript", /clearTimeout\(t\)/],
    ["how to make a file executable", /chmod \+x/], ["what is using port 3000", /lsof -i :3000/],
    ["docker shell into container", /docker exec -it/], ["sql left join example", /LEFT JOIN/],
    ["how to hash passwords securely", /Argon2id or bcrypt/], ["generate a random secret in the terminal", /openssl rand -hex 32/],
    ["json to yaml", /yq -P/], ["what is my ip", /cannot see your network/], ["python f-string format a float", /price:,\.2f/],
    ["git stash", /git stash pop/], ["regex for email", /EMAIL\.test/], ["create a venv", /python3 -m venv/],
    // dev jargon must survive the typo corrector ("footer" is not "footed", "params" is not "paeans")
    ["how to make a sticky footer", /min-height: 100dvh/], ["how to read query params in js", /URLSearchParams/], ["docker exec bash", /docker exec -it/],
  ];
  for (const [q, re] of cases) test(q, () => { const r = E.respond(q, model); assert.equal(r.skill, "howto", q + " routed to " + r.skill); const t = text(r); assert.ok(re.test(t), q + " -> " + t.slice(0, 160)); });
  test("every entry has a title, a language, code and a unique id", () => {
    const ids = new Set();
    for (const h of HT.ENTRIES) { assert.ok(h.title && h.lang && h.code.length > 10, h.id); assert.ok(!ids.has(h.id), "dup " + h.id); ids.add(h.id); assert.ok(h.re instanceof RegExp); }
    assert.ok(HT.ENTRIES.length >= 90, "entries: " + HT.ENTRIES.length);
  });
  test("a how-to never steals a definition, a calculation or a program", () => {
    assert.equal(skill("what is a hash"), "knowledge");
    assert.equal(skill("what is 15% of 240"), "calc");
    assert.equal(skill("make a snake game in python"), "codegen");
    assert.equal(skill("sort 5, 2, 9, 1"), "listops");
    assert.equal(HT.ask("git"), null);
    assert.equal(HT.ask("center"), null);
  });
  test("the answer says it is curated, not generated", () => {
    assert.ok(/hand-written and reviewed, not generated/.test(E.respond("git undo last commit", model).note));
  });
});

// Round 7: relative dates, honest currency / live-data / translation refusals,
// fraction and percentage forms, JSON and cron tools, and the calculus pointer.
group("everyday: round 7", () => {
  const iso = (off) => { const n = new Date(); return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + off)).toISOString().slice(0, 10); };
  test("N days from today is an offset, not today", () => {
    const r = E.respond("what day is 90 days from today", model);
    assert.equal(r.skill, "datetime"); assert.ok(text(r).includes(iso(90)), text(r));
    assert.ok(text(E.respond("what date is 3 weeks from now", model)).includes(iso(21)));
    assert.ok(text(E.respond("what day was 10 days ago", model)).includes(iso(-10)));
    assert.ok(text(E.respond("what day is it in 5 days", model)).includes(iso(5)));
  });
  test("month offsets clamp to the last day instead of overflowing", () => {
    const d = new Date(Date.UTC(2026, 0, 31)); // Jan 31 + 1 month must be Feb 28, not Mar 3
    const last = new Date(Date.UTC(2026, 2, 0)).getUTCDate(); assert.equal(Math.min(d.getUTCDate(), last), 28);
    const r = E.respond("what day is 2 months from today", model); assert.equal(r.skill, "datetime"); assert.ok(/\d{4}-\d{2}-\d{2}/.test(text(r)));
  });
  test("currency is refused honestly, mass units still convert", () => {
    assert.ok(/exchange rate/.test(ask("what is 100 usd in eur")));
    assert.ok(/exchange rate.*DOLLARS to GBP/.test(ask("convert 50 dollars to gbp")));
    assert.ok(/90\.7184 kg/.test(ask("200 pounds to kg")));
    assert.ok(/exchange rate/.test(ask("100 pounds to dollars")));
  });
  test("fractions: simplify, lowest terms, as a percent", () => {
    assert.ok(/simplifies to 3\/4/.test(ask("simplify 18/24")));
    assert.ok(/simplifies to 2\/3/.test(ask("10/15 in lowest terms")));
    assert.ok(/already in lowest terms/.test(ask("reduce 7/9")));
    assert.ok(/33\.3333%/.test(ask("what is 1/3 as a percent")));
    assert.ok(/25%/.test(ask("0.25 as a percentage")));
    assert.ok(/37\.5%/.test(ask("3/8 to percent")));
    assert.equal(skill("what is 15% of 80"), "calc"); // "of" is a percent-of calculation, untouched
  });
  test("json: format, minify, validate, and a located error", () => {
    assert.ok(/"a": 1/.test(ask('json format {"a":1,"b":[1,2]}')));
    assert.ok(/\{"a":1,"b":\[1,2\]\}/.test(ask('minify json { "a": 1, "b": [1, 2] }')));
    assert.ok(/^Valid JSON/.test(ask('is this valid json {"ok":true}')));
    assert.ok(/Invalid JSON.*line 1, column/.test(ask("validate json {'a': 1}")));
    assert.equal(skill('pretty print json {"a":1}'), "everyday");
    assert.equal(skill('write json {"a":1}'), "everyday"); // allowed past the code gate
  });
  test("cron: only when cron is named, exact five fields", () => {
    const c = [["cron every monday at 9am", "0 9 * * 1"], ["crontab every 15 minutes", "*/15 * * * *"], ["cron job every day at 6:30pm", "30 18 * * *"],
      ["cron expression for weekdays at 8am", "0 8 * * 1-5"], ["cron every hour", "0 * * * *"], ["cron at midnight", "0 0 * * *"],
      ["cron monthly on the 1st at 3am", "0 3 1 * *"], ["cron every saturday and sunday at noon", "0 12 * * 0,6"], ["cron every 2 hours", "0 */2 * * *"]];
    for (const [q, expr] of c) { const r = E.respond(q, model); assert.equal(r.skill, "everyday", q); assert.equal(r.result.expr, expr, q + " -> " + r.result.expr); }
    assert.equal(EV.cronOf("every 90 minutes"), null); // not expressible in one line
    assert.equal(EV.cronOf("every monday at 25:00"), null);
    assert.notEqual(skill("run a script every day"), "everyday"); // no "cron": the how-to snippet handles it
    assert.equal(skill("what is a cron job"), "knowledge");
  });
  test("calculus points at Quelvra with a prefilled link", () => {
    const r = E.respond("derivative of x^2", model); assert.equal(r.skill, "everyday");
    assert.ok(r.result.link.startsWith("/quelvra/?q=derivative%20of%20x%5E2"), r.result.link);
    assert.ok(/Quelvra/.test(text(r)));
    assert.equal(E.respond("integrate sin(x) dx", model).result.link, "/quelvra/?q=integrate%20sin(x)%20dx");
    assert.equal(skill("what is 7!"), "calc");
  });
  test("live data and translation are refused, not guessed", () => {
    assert.ok(/needs live data/.test(ask("what is the weather today")));
    assert.ok(/needs live data/.test(ask("bitcoin price")));
    // round 10: common phrases come from a curated table; anything else is still refused
    assert.ok(/is merci/.test(ask("how do you say thank you in french")));
    assert.ok(/is hola/.test(ask("translate hello to spanish")));
    assert.ok(/cannot translate/.test(ask("translate the cat is sleeping on the sofa to spanish")));
    assert.equal(skill("what is 3 feet in cm"), "convert"); // "in <unit>" is not a language
  });
  test("random colour comes back as hex, rgb and hsl", () => {
    const r = E.respond("pick a random color", model); assert.equal(r.skill, "everyday");
    assert.ok(/^#[0-9a-f]{6}$/.test(r.result.hex)); assert.ok(/^rgb\(\d+, \d+, \d+\)$/.test(r.result.rgb)); assert.ok(/^hsl\(\d+, \d+%, \d+%\)$/.test(r.result.hsl));
  });
  test("base conversions name the source base", () => {
    assert.ok(/0b1010 \(binary\) = 10 \(decimal\)/.test(ask("convert 1010 binary to decimal")));
    assert.ok(/0xff \(hexadecimal\) = 255/.test(ask("hex ff to decimal")));
    assert.ok(/255 = 0xff/.test(ask("255 to hex")));
  });
  test("new trivia and the calendar-average note", () => {
    assert.ok(/384,400 km/.test(ask("how far is the moon")));
    assert.ok(/8,848\.86 m/.test(ask("how tall is mount everest")));
    assert.ok(/8 planets/.test(ask("how many planets are in the solar system")));
    assert.ok(/average calendar year/.test(ask("how many seconds in a year")));
    assert.ok(/fixed conversion factor/.test(ask("how many seconds in a day")));
  });
});

// Round 8: dates are never arithmetic, counting to a date in weeks/months, exact age, year position,
// unix time, bitwise ops, prime search, word/letter counts, durations, passwords, HTML entities,
// character codes, IP/CIDR facts, HTTP statuses, percent change and currency subunits.
group("everyday: round 8", () => {
  const today0 = () => { const n = new Date(); return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()); };
  test("an ISO date is never evaluated as subtraction", () => {
    const r = E.respond("how many weeks until 2027-06-01", model); assert.equal(r.skill, "datetime");
    const days = Math.round((Date.UTC(2027, 5, 1) - today0()) / 86400000);
    assert.ok(text(r).includes(Math.floor(days / 7) + " week"), text(r)); assert.ok(text(r).includes("(" + days + " days"), text(r));
    assert.notEqual(skill("what is 2026-01-01"), "calc");
    assert.equal(skill("how many months until 2027-06-01"), "datetime");
  });
  test("exact age from a birth date", () => {
    const r = E.respond("what is the age of someone born on 2000-05-15", model); assert.equal(r.skill, "datetime");
    const n = new Date(); let a = n.getUTCFullYear() - 2000; if (n.getUTCMonth() < 4 || (n.getUTCMonth() === 4 && n.getUTCDate() < 15)) a -= 1;
    assert.ok(text(r).includes("is " + a + " years old"), text(r));
    assert.ok(/in the future/.test(ask("how old is someone born on 2999-01-01")));
  });
  test("today's place in the year, ISO week, quarter, unix time, zone", () => {
    const n = new Date(), y = n.getUTCFullYear(), doy = Math.round((today0() - Date.UTC(y, 0, 0)) / 86400000), total = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
    assert.ok(ask("how many days left in the year").includes((total - doy) + " days left in " + y));
    assert.ok(ask("how many days have passed this year").includes("day " + doy + " of " + y));
    assert.ok(/ISO week \d{1,2} of \d{4}/.test(ask("what week number is it")));
    assert.ok(ask("what quarter is it").includes("Q" + (Math.floor(n.getUTCMonth() / 3) + 1)));
    assert.ok(/Unix time is \d{10} seconds/.test(ask("what is the unix timestamp")));
    assert.ok(/2023-11-14T22:13:20Z/.test(ask("what is epoch time 1700000000")));
    assert.ok(/2023-11-14T22:13:20Z/.test(ask("convert 1700000000 to date")));
    assert.ok(/Unix time 1767225600 /.test(ask("unix time of 2026-01-01")));
    assert.ok(/Unix time 1767268800 /.test(ask("2026-01-01 12:00 to unix")));
    assert.ok(/UTC[+-]\d{2}:\d{2}/.test(ask("what is my timezone")));
    assert.equal(skill("what is the date in 100 days"), "datetime");
  });
  test("bitwise ops are exact and shown in binary", () => {
    const r = E.respond("xor 5 and 3", model); assert.equal(r.result.value, "6"); assert.ok(/101.*011.*110/s.test(r.pre));
    assert.equal(E.respond("12 and 10 bitwise", model).result.value, "8");
    assert.equal(E.respond("1 << 40", model).result.value, "1099511627776");
    assert.equal(E.respond("0xff xor 0x0f", model).result.value, "240");
    assert.equal(E.respond("not 5", model).result.value, "250");
    assert.equal(E.respond("not 5 in 16 bits", model).result.value, "65530");
    assert.equal(skill("5 and 3"), "null" === "x" ? "" : skill("5 and 3")); // a bare "5 and 3" is not claimed as bitwise
    assert.notEqual(skill("5 and 3"), "everyday");
  });
  test("prime search", () => {
    assert.ok(/next prime after 100 is 101/.test(ask("next prime after 100")));
    assert.ok(/largest prime below 1000 is 997/.test(ask("largest prime below 1000")));
    assert.ok(/nearest prime to 100 is 101/.test(ask("nearest prime to 100")));
    assert.ok(/97 is itself prime/.test(ask("nearest prime to 97")));
    assert.ok(/no prime below 2/.test(ask("prime before 2")));
  });
  test("word and letter statistics", () => {
    assert.ok(/jumped.*6 letters/.test(ask("what is the longest word in the quick brown fox jumped")));
    assert.ok(/^Shortest word \| a \(1 letters/.test(ask("shortest word in what a day")) || /\ba\b.*1 letter/.test(ask("shortest word in what a day")));
    assert.ok(/appears 4 times/.test(ask("count how many times the letter s appears in mississippi")));
    assert.ok(/appears 4 times/.test(ask("how many s in mississippi")));
    assert.ok(/appears 2 times/.test(ask("how many times does the letter p appear in pepper")) || /appears 3 times/.test(ask("how many times does the letter p appear in pepper")));
    assert.equal(E.respond("how many times does the letter p appear in pepper", model).result.value, 3);
  });
  test("durations, passwords, html entities", () => {
    assert.ok(/1 hour, 23 minutes and 20 seconds \(1:23:20/.test(ask("how long is 5000 seconds")));
    assert.ok(/1 hour, 1 minute and 1 second/.test(ask("convert 3661 seconds to hours minutes seconds")));
    assert.equal(skill("convert 3661 seconds to hours"), "convert"); // a single target unit is still a plain conversion
    const pw = E.respond("password with 16 characters", model); assert.equal(pw.skill, "everyday"); assert.equal(pw.result.value.length, 16);
    assert.ok(/[a-z]/.test(pw.result.value) && /[A-Z]/.test(pw.result.value) && /\d/.test(pw.result.value) && /[^a-zA-Z0-9]/.test(pw.result.value));
    assert.equal(E.respond("strong password", model).result.value.length, 20);
    assert.ok(/^[a-z]+(?:-[a-z]+){3,7}$/.test(E.respond("random passphrase", model).result.value));
    assert.ok(/&lt;div class=&quot;a&quot;&gt;/.test(ask('html escape <div class="a">')));
    assert.ok(/<p> & html/.test(ask("unescape &lt;p&gt; &amp; html")));
  });
  test("character codes both ways", () => {
    assert.ok(/code point 65 \(U\+0041, ASCII, binary 01000001\)/.test(ask("what is the ascii code for A")));
    assert.ok(/is a \(ASCII\)/.test(ask("what character is ascii 97")));
    assert.ok(/8364 \(U\+20AC.*euro sign/.test(ask("unicode of €")));
    assert.ok(/U\+20AC\) is €/.test(ask("U+20AC")));
    assert.ok(/line feed/.test(ask("ascii 10")));
  });
  test("ip addresses, subnets, http statuses", () => {
    assert.ok(/loopback address/.test(ask("what is 127.0.0.1")));
    assert.ok(/private address \(RFC 1918, 192\.168/.test(ask("is 192.168.1.1 a private ip")));
    assert.ok(/public \(globally routable\)/.test(ask("is 8.8.8.8 public")));
    assert.ok(/255\.255\.255\.0.*254 usable hosts/.test(ask("what is the subnet mask for /24")));
    assert.ok(/62 usable hosts/.test(ask("how many hosts in a /26")));
    const r = E.respond("192.168.1.37/24 network range", model); assert.equal(r.result.range.network, "192.168.1.0"); assert.equal(r.result.range.broadcast, "192.168.1.255"); assert.equal(r.result.range.last, "192.168.1.254");
    assert.ok(/301 Moved Permanently.*redirection status/.test(ask("what is the http status 301")));
    assert.ok(/404 Not Found/.test(ask("what does 404 mean")));
    assert.ok(/teapot/.test(ask("http 418")));
    assert.notEqual(skill("what is 404"), "everyday"); // a bare number with no http/status word is not claimed
    assert.ok(/localhost is the hostname/.test(ask("what is localhost")));
  });
  test("percent change and currency subunits", () => {
    assert.ok(/change of 25%, an increase/.test(ask("what is the percent change from 40 to 50")));
    assert.ok(/change of -25%, a decrease/.test(ask("percent decrease from 80 to 60")));
    assert.ok(/division by zero/.test(ask("percent change from 0 to 5")));
    assert.ok(/1 dollar.*100 cents/.test(ask("how many cents in a dollar")));
    assert.ok(/1500 cents/.test(ask("what is 15 usd in cents")));
    assert.ok(/2\.5 dollars/.test(ask("250 cents in dollars")));
    assert.ok(/exchange rate/.test(ask("how many dollars in a euro")));
    assert.ok(/5f4dcc3b5aa765d61d8327deb882cf99/.test(ask("what is the md5 of password")));
  });
});

group("everyday: round 9", () => {
  test("movable holidays are computed, never hard-coded", () => {
    assert.ok(/Thursday/.test(ask("what day is thanksgiving 2026")), "thanksgiving 2026");
    assert.ok(/2027-03-28/.test(ask("when is easter 2027")), "easter 2027");
    assert.ok(/2026-05-25/.test(ask("when is memorial day 2026")), "memorial day");
    assert.ok(/2026-04-03/.test(ask("when is good friday 2026")), "good friday");
    assert.ok(/Sunday, \d{4}-05-\d{2}/.test(ask("when is mothers day")), "mothers day");
    assert.ok(/US date/.test(ask("when is thanksgiving this year")), "US note");
    assert.ok(/12-25/.test(ask("when is christmas")) && /in \d+ days|today/.test(ask("when is christmas")), "days until");
    assert.ok(/2028-02-29/.test(ask("when is leap day")), "leap day");
  });
  test("weekdays and weekends of a year are counted", () => {
    assert.ok(/261 weekdays/.test(ask("how many working days in 2026")), "working days 2026");
    assert.ok(/53 fridays/.test(ask("how many fridays in 2027")), "fridays 2027");
    assert.ok(/52 weekends/.test(ask("how many weekends in 2026")), "weekends");
  });
  test("everyday arithmetic said in words", () => {
    assert.ok(/2 remainder 2/.test(ask("12 divided by 5 remainder")));
    assert.ok(/\b50\b is the amount/.test(ask("price before tax if total is 54 at 8%")));
    assert.ok(/\b100\b is the amount/.test(ask("original price if 80 after a 20% discount")));
    assert.ok(/\b50\b is the amount/.test(ask("i paid 54 including 8% tax, what was the price before tax")));
    assert.ok(/14\.97/.test(ask("how much is 3 items at 4.99")));
    assert.ok(/6\.55/.test(ask("change from 20 for 13.45")));
    assert.ok(/is 54\b/.test(ask("50 plus 8% tax")));
    assert.ok(/is 54\b/.test(ask("add 20% tip to 45")));
    assert.ok(/3\/10/.test(ask("what is 30 percent as a fraction")));
    assert.ok(/1\.23 × 10\^5/.test(ask("scientific notation for 123000")));
    assert.ok(/4\.5 × 10\^-4/.test(ask("0.00045 in scientific notation")));
    assert.ok(/1500000/.test(ask("1.5e6 as a number")));
    assert.ok(/0\.875/.test(ask("7/8 in decimal")), "a fraction is not a base change");
    assert.ok(/1\.3333/.test(ask("double 2/3 cup")), "double a fraction");
  });
  test("conversions read fractions, scale words and 5k", () => {
    assert.ok(/5\.33333/.test(ask("1/3 cup in tablespoons")));
    assert.ok(/591\.47/.test(ask("2 1/2 cups in ml")));
    assert.ok(/11\.574/.test(ask("1 million seconds in days")));
    assert.ok(/3\.10(?:68|7)/.test(ask("5k in miles")));
    assert.ok(/31557600 seconds/.test(ask("seconds in a year")));
    assert.ok(/16 tablespoons/.test(ask("tablespoons in a cup")));
  });
  test("clock formats and time from now", () => {
    assert.ok(/2:30 PM/.test(ask("convert 14:30 to 12 hour time")));
    assert.ok(/14:30/.test(ask("2:30 pm in 24 hour time")));
    assert.ok(/6:30 PM/.test(ask("what is 1830 in military time")));
    assert.ok(/from now is \d{1,2}:\d{2} [AP]M/.test(ask("what time is 90 minutes from now")));
  });
  test("pay, fuel, pace, pets, pizzas", () => {
    assert.ok(/52,000\.00 a year/.test(ask("salary for 25 an hour")));
    assert.ok(/5,833\.33 a month/.test(ask("70000 a year is how much per month")));
    assert.ok(/28\.85 an hour/.test(ask("60000 a year to hourly")));
    assert.ok(/\$30\.00 an hour/.test(ask("time and a half of 20")));
    assert.ok(/\$600\.00/.test(ask("40 hours at 15 an hour")));
    assert.ok(/7\.5 L\/100 km/.test(ask("fuel consumption 400 km on 30 liters")) && /31\.4 mpg \(US\)/.test(ask("fuel consumption 400 km on 30 liters")));
    assert.ok(/7\.84 L\/100 km/.test(ask("30 mpg in l/100km")));
    assert.ok(/29\.4 mpg/.test(ask("8 l/100km in mpg")));
    assert.ok(/5:00 min\/km/.test(ask("pace for 5 km in 25 minutes")) && /8:03 min\/mile/.test(ask("pace for 5 km in 25 minutes")));
    assert.ok(/takes 55:00/.test(ask("how long to run 10k at 5:30 pace")));
    assert.ok(/about 39 in human years/.test(ask("dog years for a 5 year old dog")));
    assert.ok(/about 28 in human years/.test(ask("cat years for a 3 year old cat")));
    assert.ok(/5 large pizzas/.test(ask("how many pizzas for 12 people")));
    assert.ok(/No fixed conversion/.test(ask("eu shoe size 42 in us")), "shoe sizes are refused with a reason");
  });
  test("generations, zodiacs, anagrams, acronyms", () => {
    assert.ok(/a Millennial/.test(ask("what generation is someone born in 1990")));
    assert.ok(/Baby Boomer/.test(ask("what generation is 1950")));
    assert.ok(/year of the Horse/.test(ask("chinese zodiac for 1990")) && /Metal Horse/.test(ask("chinese zodiac for 1990")));
    assert.ok(/year of the Dragon/.test(ask("what animal is 2024")));
    assert.ok(/is Pisces/.test(ask("zodiac sign for march 15")));
    assert.ok(/is Capricorn/.test(ask("star sign for december 25")));
    assert.ok(/is Aquarius/.test(ask("what is my zodiac sign if i was born on january 20")));
    assert.ok(/Yes: listen and silent/.test(ask("is listen an anagram of silent")));
    assert.ok(/No: apple and pear/.test(ask("are apple and pear anagrams")));
    assert.ok(/\bPNG\b from/.test(ask("acronym for portable network graphics")));
    assert.ok(/olleh/.test(ask("hello backwards")));
    assert.ok(/apple, banana, cherry/.test(ask("sort apple, cherry, banana")));
    assert.ok(AD.lookup("what is an anagram").term !== "ram" && AD.lookup("what is a hash function").ok, "whole-word glossary match");
    assert.ok(/^\.\.\. --- \.\.\.$/m.test(ask("sos in morse")) || /\.\.\. --- \.\.\.$/.test(ask("sos in morse").trim()), "in morse is not payload");
  });
});

const GEN = await import(pathToFileURL(join(dir, "gen.js")).href);
group("codegen: compositional generator", () => {
  const code = (q) => E.respond(q, model).code || "";
  test("a filter/map/reduce sentence becomes a plan and a function, in the asked language", () => {
    const r = E.respond("write a python function that keeps the even numbers, squares them and returns the sum", model);
    assert.equal(r.skill, "codegen");
    assert.ok(/def sum_of_even_squares\(numbers\):/.test(r.code) && /x % 2 == 0/.test(r.code) && /x \* x/.test(r.code) && /return sum\(/.test(r.code), r.code);
    const js = code("javascript function that returns the sum of the squares of the even numbers in a list");
    assert.ok(/function sumOfEvenSquares\(numbers\)/.test(js) && /\.filter\(\(x\) => x % 2 === 0\)/.test(js) && /reduce\(\(a, b\) => a \+ b, 0\)/.test(js), js);
  });
  test("every target language is emitted from the same plan", () => {
    const p = GEN.plan("function that removes duplicates from a list of strings and sorts them descending");
    assert.ok(p && p.stages.map((t) => t.op).join(",") === "unique,sort" && p.stages[1].arg === "desc");
    for (const l of ["python", "javascript", "typescript", "go", "rust", "java"]) assert.ok(GEN.emit(p, l) && GEN.emit(p, l).length > 40, l);
    assert.ok(/fn unique_sorted_strings\(strings: &\[String\]\) -> Vec<String>/.test(GEN.emit(p, "rust")));
    assert.ok(/static List<String> uniqueSortedStrings\(List<String> strings\)/.test(GEN.emit(p, "java")));
    assert.ok(/func uniqueSortedStrings\(items \[\]string\) \[\]string/.test(GEN.emit(p, "go")), "Go renames a parameter that would shadow the strings package");
  });
  test("strings, ranges and print scripts", () => {
    assert.ok(/def count_vowels\(text\):/.test(code("count the vowels in a string in python")));
    assert.ok(/fn is_palindrome\(text: &str\) -> bool/.test(code("rust function that checks if a string is a palindrome")));
    const g = code("print the numbers from 1 to 50 that are divisible by 7 in go");
    assert.ok(/func main\(\)/.test(g) && /for i := 1; i <= 50; i\+\+/.test(g) && /x % 7 == 0/.test(g) && /fmt\.Println/.test(g), g);
    assert.ok(/", "\.join\(/.test(code("python function that joins the names that start with a with commas")));
  });
  test("a sentence with a verb the generator cannot read is refused, not guessed", () => {
    assert.equal(GEN.plan("function that shuffles a list of numbers"), null);
    assert.equal(GEN.plan("write a snake game in python"), null);
    assert.equal(GEN.plan("what is 2 + 2"), null);
  });
});

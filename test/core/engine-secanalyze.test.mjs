// Security analysis (secanalyze.js): JWT decode, hash identification, base32/58,
// encoding detection, IOC extraction, MAC parsing — all deterministic, so these
// check exact outputs, round-trips, honest ambiguity, and that the engine routes
// each request to the new skill without stealing from encode/base/knowledge.
import { readdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test, group, assert } from "../harness.mjs";
import * as SA from "../../src/secanalyze.js";

const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

group("secanalyze: JWT decode", () => {
  test("decodes header and payload without a key", () => {
    const r = SA.decodeJwt(JWT);
    assert.ok(r.ok, "should decode");
    assert.equal(r.alg, "HS256");
    assert.equal(r.payload.sub, "1234567890");
    assert.equal(r.payload.name, "John Doe");
  });
  test("surfaces the standard time claims and says the signature is unverified", () => {
    const r = SA.decodeJwt(JWT);
    assert.ok(r.claims.some(([k]) => k.startsWith("iat")), "iat claim present");
    assert.ok(r.warnings.some((w) => /not verified/i.test(w)), "warns signature unverified");
  });
  test("flags alg:none as unsigned", () => {
    // {"alg":"none"} . {"a":1} . (empty)
    const none = "eyJhbGciOiJub25lIn0.eyJhIjoxfQ.";
    const r = SA.decodeJwt(none);
    assert.ok(r.ok && r.warnings.some((w) => /UNSIGNED/.test(w)), "flags none alg");
  });
  test("rejects a non-JWT honestly", () => {
    assert.equal(SA.decodeJwt("not a token").ok, false);
  });
});

group("secanalyze: hash identification", () => {
  test("32 hex → MD5 first", () => {
    assert.equal(SA.identifyHash("5d41402abc4b2a76b9719d911017c592").candidates[0].algo, "MD5");
  });
  test("40 hex → SHA-1 first", () => {
    assert.equal(SA.identifyHash("e38ad214943daad1d64c102faec29de4afe9da3d").candidates[0].algo, "SHA-1");
  });
  test("64 hex → SHA-256 first, with alternatives", () => {
    const r = SA.identifyHash("a".repeat(64));
    assert.equal(r.candidates[0].algo, "SHA-256");
    assert.ok(r.candidates.length > 1, "offers ambiguous alternatives");
  });
  test("bcrypt is recognized with high confidence", () => {
    const r = SA.identifyHash("$2b$12$" + "a".repeat(53));
    assert.ok(r.ok && r.candidates[0].algo === "bcrypt" && r.candidates[0].confidence > 0.9);
  });
  test("an odd length is declined, not faked", () => {
    assert.equal(SA.identifyHash("abc123").ok, false);
  });
});

group("secanalyze: base32 / base58 round-trip", () => {
  test("base32 matches RFC 4648 vector and round-trips", () => {
    assert.equal(SA.base32encode("foobar"), "MZXW6YTBOI======");
    assert.equal(SA.base32decode(SA.base32encode("Hello DI!")), "Hello DI!");
  });
  test("base58 round-trips and preserves leading zero bytes", () => {
    assert.equal(SA.base58decode(SA.base58encode("Hello DI!")), "Hello DI!");
    assert.equal(SA.base58decode(SA.base58encode("\u0000\u0000x")), "\u0000\u0000x");
  });
  test("invalid input decodes to null, not a wrong guess", () => {
    assert.equal(SA.base58decode("0OIl"), null); // 0, O, I, l are not in the base58 alphabet
  });
});

group("secanalyze: encoding detection", () => {
  test("hex is detected", () => {
    assert.ok(SA.detectEncoding("48656c6c6f").guesses.some((g) => g.enc === "hex"));
  });
  test("a JWT is detected as a JWT", () => {
    assert.equal(SA.detectEncoding(JWT).guesses[0].enc, "JWT (JSON Web Token)");
  });
});

group("secanalyze: IOC extraction", () => {
  const blob = "beacon to evil.example talked to 10.0.0.5 and 999.1.1.1 via http://bad.io/x, md5 5d41402abc4b2a76b9719d911017c592, CVE-2021-44228, mail a@b.com";
  test("pulls the real indicators and drops the invalid IP", () => {
    const r = SA.extractIOCs(blob);
    assert.ok(r.groups.ipv4.includes("10.0.0.5"), "keeps valid IP");
    assert.ok(!r.groups.ipv4.includes("999.1.1.1"), "drops octet>255");
    assert.ok(r.groups.cve.includes("CVE-2021-44228"), "finds CVE");
    assert.ok(r.groups.md5.length === 1, "finds the md5");
    assert.ok(r.groups.urls.some((u) => /^http:\/\/bad\.io\/x$/.test(u)), "trims trailing comma off URL");
  });
  test("defang neutralizes dots and scheme", () => {
    assert.equal(SA.defang("http://evil.com"), "hxxp[://]evil[.]com");
  });
});

group("secanalyze: MAC", () => {
  test("normalizes to every common form and reads the flag bits", () => {
    const r = SA.parseMac("001A2B3C4D5E");
    assert.equal(r.colon, "00:1a:2b:3c:4d:5e");
    assert.equal(r.cisco, "001a.2b3c.4d5e");
    assert.equal(r.local, false);
    assert.equal(r.multicast, false);
  });
});

// End-to-end: the engine must route each request to "secanalyze" and NOT let it
// steal numeric base conversion, a definition, or a plain digest request.
const src = fileURLToPath(new URL("../../src/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "di-sec-"));
for (const f of readdirSync(src)) if (f.endsWith(".js")) writeFileSync(join(dir, f), readFileSync(join(src, f), "utf8").replace(/"\/js\/engine\//g, '"./'));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch (_) {} });
const E = await import(pathToFileURL(join(dir, "engine.js")).href);
const { CORPUS } = await import(pathToFileURL(join(dir, "corpus.js")).href);
const model = E.buildModel(CORPUS);
const route = (q) => E.respond(q, model);

group("secanalyze: routed by the engine", () => {
  test("a bare JWT is decoded", () => { const r = route(JWT); assert.equal(r.skill, "secanalyze"); assert.equal(r.title, "JWT decoded"); });
  test("'identify this hash <md5>' routes to hash ID", () => { const r = route("identify this hash 5d41402abc4b2a76b9719d911017c592"); assert.equal(r.skill, "secanalyze"); assert.ok(/Hash identification/.test(r.title)); });
  test("'base58 encode Hello' routes to secanalyze", () => { assert.equal(route("base58 encode Hello").skill, "secanalyze"); });
  test("'extract iocs ...' routes to secanalyze", () => { const r = route("extract iocs from: evil.com 10.0.0.5 CVE-2021-44228"); assert.equal(r.skill, "secanalyze"); });
  test("'255 to base 32' stays a NUMERIC base conversion", () => { assert.equal(route("255 to base 32").skill, "base"); });
  test("'what is a hash function' stays a definition", () => { assert.ok(["knowledge", "dictionary"].includes(route("what is a hash function").skill)); });
  test("'md5 of hello' stays the encode/digest skill", () => { assert.equal(route("md5 of hello").skill, "encode"); });
});

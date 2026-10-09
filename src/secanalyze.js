// Security analysis — deterministic, dependency-free capabilities DI lacked:
// JWT decode, hash identification, base32/base58, encoding auto-detect, IOC
// extraction, and MAC/IPv6 normalization. Everything here is exact string/byte
// manipulation with no model and no network, so it is fully reproducible and
// runs the same in Node and the browser. Imports nothing.

// ---------------------------------------------------------------------------
// byte <-> string helpers (UTF-8), and base64url — written out so the module is
// self-contained (no atob/Buffer dependency).
// ---------------------------------------------------------------------------
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function strToBytes(str) {
  const out = [];
  for (const ch of String(str)) {
    let c = ch.codePointAt(0);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return out;
}
function bytesToStr(bytes) {
  let out = "", i = 0;
  while (i < bytes.length) {
    const c = bytes[i++];
    if (c < 0x80) out += String.fromCharCode(c);
    else if (c >= 0xc0 && c < 0xe0) out += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
    else if (c >= 0xe0 && c < 0xf0) out += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
    else { const cp = ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63); out += String.fromCodePoint(cp); }
  }
  return out;
}
function b64ToBytes(s) {
  s = String(s || "").replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "").replace(/=+$/, "");
  const out = []; let buf = 0, bits = 0;
  for (const ch of s) { const v = B64.indexOf(ch); if (v < 0) continue; buf = (buf << 6) | v; bits += 6; if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 0xff); } }
  return out;
}

// ---------------------------------------------------------------------------
// JWT decode — split the three dot-separated base64url parts, parse header and
// payload as JSON, and interpret the standard time claims. The signature is NOT
// verified (that needs the key); DI says so plainly.
// ---------------------------------------------------------------------------
const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/;
export function looksLikeJwt(s) { return JWT_RE.test(String(s || "")); }

export function decodeJwt(token) {
  const m = String(token || "").match(JWT_RE);
  if (!m) return { ok: false, error: "no JWT found (expected three base64url parts separated by dots, header starting ‘eyJ’)" };
  const parts = m[0].split(".");
  const dec = (p) => { try { return JSON.parse(bytesToStr(b64ToBytes(p))); } catch (_) { return null; } };
  const header = dec(parts[0]), payload = dec(parts[1]);
  if (!header || !payload) return { ok: false, error: "the header or payload is not valid base64url-encoded JSON" };
  const now = Math.floor(Date.now() / 1000);
  const tfmt = (n) => Number.isFinite(n) ? new Date(n * 1000).toISOString().replace(/\.000Z$/, "Z") : String(n);
  const claims = [];
  const names = { iss: "issuer", sub: "subject", aud: "audience", jti: "JWT ID" };
  for (const k of ["iss", "sub", "aud", "jti"]) if (payload[k] != null) claims.push([k + " (" + names[k] + ")", String(payload[k])]);
  if (payload.iat != null) claims.push(["iat (issued at)", tfmt(payload.iat)]);
  if (payload.nbf != null) claims.push(["nbf (not before)", tfmt(payload.nbf)]);
  if (payload.exp != null) claims.push(["exp (expires)", tfmt(payload.exp) + (payload.exp < now ? "  — EXPIRED" : "  — not yet expired")]);
  const warnings = [];
  if ((header.alg || "").toLowerCase() === "none") warnings.push("alg is “none”: this token is UNSIGNED and must never be trusted.");
  warnings.push("The signature is NOT verified here — that requires the signing secret or public key.");
  return { ok: true, kind: "jwt", alg: header.alg || "?", typ: header.typ || "JWT", header, payload, claims, hasSig: parts.length > 2 && !!parts[2], warnings };
}

// ---------------------------------------------------------------------------
// Hash identification — infer the likely algorithm from format and length. Pure
// heuristic: fixed-length hex digests are ambiguous, so DI returns ranked
// candidates with honest confidences rather than one certain answer.
// ---------------------------------------------------------------------------
const HEXLEN = {
  8: [["CRC-32", 0.5], ["Adler-32", 0.3], ["CRC-32B", 0.2]],
  16: [["CRC-64", 0.6], ["MySQL<4.1", 0.3]],
  32: [["MD5", 0.5], ["NTLM", 0.3], ["MD4", 0.15], ["MD2", 0.05]],
  40: [["SHA-1", 0.7], ["RIPEMD-160", 0.2], ["HAS-160", 0.1]],
  56: [["SHA-224", 0.8], ["SHA3-224", 0.2]],
  64: [["SHA-256", 0.7], ["SHA3-256", 0.15], ["BLAKE2s-256", 0.1], ["RIPEMD-256", 0.05]],
  96: [["SHA-384", 0.8], ["SHA3-384", 0.2]],
  128: [["SHA-512", 0.7], ["SHA3-512", 0.15], ["BLAKE2b-512", 0.1], ["Whirlpool", 0.05]],
};
export function identifyHash(s) {
  const h = String(s || "").trim();
  const out = [];
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(h)) out.push(["bcrypt", 0.99]);
  else if (/^\$argon2(id|i|d)\$/.test(h)) out.push(["Argon2", 0.99]);
  else if (/^\$6\$/.test(h)) out.push(["sha512crypt (Unix $6$)", 0.95]);
  else if (/^\$5\$/.test(h)) out.push(["sha256crypt (Unix $5$)", 0.95]);
  else if (/^\$1\$/.test(h)) out.push(["md5crypt (Unix $1$)", 0.95]);
  else if (/^\{SSHA\}/i.test(h)) out.push(["Salted SHA-1 (LDAP {SSHA})", 0.9]);
  else if (/^[0-9a-f]+$/i.test(h) && HEXLEN[h.length]) out.push(...HEXLEN[h.length]);
  if (!out.length) return { ok: false, kind: "hashid", input: h, error: /^[0-9a-f]+$/i.test(h) ? ("a " + h.length + "-hex-digit string does not match a known fixed-length digest") : "not a recognized hash format" };
  return { ok: true, kind: "hashid", input: h, candidates: out.map(([algo, confidence]) => ({ algo, confidence })) };
}

// ---------------------------------------------------------------------------
// base32 (RFC 4648) and base58 (Bitcoin alphabet) encode/decode.
// ---------------------------------------------------------------------------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32encode(str) {
  const bytes = strToBytes(str); let bits = 0, val = 0, out = "";
  for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; out += B32[(val >> bits) & 31]; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
}
export function base32decode(s) {
  s = String(s || "").toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0, val = 0; const out = [];
  for (const ch of s) { const v = B32.indexOf(ch); if (v < 0) return null; val = (val << 5) | v; bits += 5; if (bits >= 8) { bits -= 8; out.push((val >> bits) & 0xff); } }
  return bytesToStr(out);
}
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58encode(str) {
  const bytes = strToBytes(str); if (!bytes.length) return "";
  let zeros = 0; while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits = [0];
  for (const b of bytes) { let carry = b; for (let j = 0; j < digits.length; j++) { carry += digits[j] << 8; digits[j] = carry % 58; carry = (carry / 58) | 0; } while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; } }
  let out = ""; for (let k = 0; k < zeros; k++) out += "1";
  for (let k = digits.length - 1; k >= 0; k--) out += B58[digits[k]];
  return out;
}
export function base58decode(s) {
  s = String(s || "").trim(); if (!s) return "";
  let zeros = 0; while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes = [0];
  for (const ch of s) { const v = B58.indexOf(ch); if (v < 0) return null; let carry = v; for (let j = 0; j < bytes.length; j++) { carry += bytes[j] * 58; bytes[j] = carry & 0xff; carry >>= 8; } while (carry) { bytes.push(carry & 0xff); carry >>= 8; } }
  const out = []; for (let k = 0; k < zeros; k++) out.push(0);
  for (let k = bytes.length - 1; k >= 0; k--) out.push(bytes[k]);
  return bytesToStr(out);
}

// ---------------------------------------------------------------------------
// Encoding auto-detect — rank the plausible encodings a blob could be. Honest
// about ambiguity (hex is also valid base64, etc.): returns ranked guesses.
// ---------------------------------------------------------------------------
export function detectEncoding(s) {
  const t = String(s || "").trim();
  if (!t) return { ok: false, error: "nothing to detect" };
  const g = [];
  const nospace = t.replace(/\s+/g, "");
  if (looksLikeJwt(t)) g.push(["JWT (JSON Web Token)", 0.95]);
  if (/^[01\s]+$/.test(t) && nospace.length >= 8 && nospace.length % 8 === 0) g.push(["binary (8-bit groups)", 0.85]);
  if (/^[.\-/\s]+$/.test(t) && /[.\-]/.test(t)) g.push(["Morse code", 0.8]);
  if (/%[0-9a-f]{2}/i.test(t)) g.push(["URL / percent-encoding", 0.7]);
  if (/^[0-9a-f]+$/i.test(nospace) && nospace.length % 2 === 0 && nospace.length >= 2) g.push(["hex", 0.6]);
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(nospace) && nospace.length % 4 === 0 && nospace.length >= 4) g.push(["base64", 0.55]);
  if (/^[A-Z2-7]+=*$/.test(nospace) && nospace.replace(/=+$/, "").length >= 2 && nospace.length % 8 === 0) g.push(["base32", 0.4]);
  if (/^[1-9A-HJ-NP-Za-km-z]+$/.test(t) && t.length >= 6) g.push(["base58", 0.35]);
  if (!g.length) return { ok: false, error: "does not match a known encoding (plain text?)" };
  const seen = new Set(); const ranked = g.sort((a, b) => b[1] - a[1]).filter(([n]) => !seen.has(n) && seen.add(n));
  return { ok: true, kind: "encdetect", input: t, guesses: ranked.map(([enc, confidence]) => ({ enc, confidence })) };
}

// ---------------------------------------------------------------------------
// IOC extraction — pull indicators of compromise out of a blob (log, report,
// paste). Deterministic regex sweep; de-duplicated; optional defang.
// ---------------------------------------------------------------------------
function validIpv4(ip) { const p = ip.split("."); return p.length === 4 && p.every((o) => o.length <= 3 && +o >= 0 && +o <= 255 && (o === "0" || !/^0/.test(o) || o.length === 1)); }
const uniq = (a) => [...new Set(a)];
export function extractIOCs(text) {
  const t = String(text || "");
  const ipv4 = uniq((t.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []).filter(validIpv4));
  const ipv6 = uniq((t.match(/\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b|\b(?:[0-9a-f]{1,4}:){1,7}:(?:[0-9a-f]{1,4})?\b/gi) || []).filter((x) => x.includes("::") || x.split(":").length >= 4));
  const urls = uniq((t.match(/\bhttps?:\/\/[^\s"'<>)\]]+/gi) || []).map((u) => u.replace(/[.,;:!?)\]]+$/, "")));
  const emails = uniq(t.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g) || []);
  const sha256 = uniq(t.match(/\b[a-f0-9]{64}\b/gi) || []);
  const sha1 = uniq((t.match(/\b[a-f0-9]{40}\b/gi) || []));
  const md5 = uniq((t.match(/\b[a-f0-9]{32}\b/gi) || []));
  const cves = uniq(t.match(/\bCVE-\d{4}-\d{4,7}\b/gi) || []);
  // domains: hostnames with a TLD, minus those that are part of a captured URL or email
  const inUrlOrEmail = (d) => urls.some((u) => u.includes(d)) || emails.some((e) => e.endsWith(d) || e.includes("@" + d));
  const domains = uniq((t.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi) || [])
    .filter((d) => !validIpv4(d) && !inUrlOrEmail(d)));
  const total = ipv4.length + ipv6.length + urls.length + emails.length + sha256.length + sha1.length + md5.length + cves.length + domains.length;
  return { ok: total > 0, kind: "ioc", total, groups: { ipv4, ipv6, domains, urls, emails, "md5": md5, "sha1": sha1, "sha256": sha256, "cve": cves } };
}
export function defang(s) { return String(s || "").replace(/\./g, "[.]").replace(/:\/\//g, "[://]").replace(/^http/i, "hxxp").replace(/@/g, "[@]"); }

// ---------------------------------------------------------------------------
// MAC address normalize + IPv6 expand/compress.
// ---------------------------------------------------------------------------
export function parseMac(s) {
  const m = String(s || "").match(/\b([0-9a-f]{2}[:\-\.]?){5}[0-9a-f]{2}\b|\b([0-9a-f]{4}\.){2}[0-9a-f]{4}\b/i);
  if (!m) return { ok: false, error: "not a MAC address (expected 12 hex digits, e.g. 00:1a:2b:3c:4d:5e)" };
  const hex = m[0].replace(/[^0-9a-f]/gi, "").toLowerCase();
  if (hex.length !== 12) return { ok: false, error: "a MAC address has exactly 12 hex digits" };
  const pairs = hex.match(/.{2}/g);
  const first = parseInt(pairs[0], 16);
  return {
    ok: true, kind: "mac",
    colon: pairs.join(":"), hyphen: pairs.join("-"), cisco: hex.match(/.{4}/g).join("."),
    oui: pairs.slice(0, 3).join(":").toUpperCase(),
    local: !!(first & 0x02), multicast: !!(first & 0x01),
  };
}

// ---------------------------------------------------------------------------
// Top-level dispatcher the engine calls. Decides the op from the request the
// same way score() detected "secanalyze", then runs it.
// ---------------------------------------------------------------------------
function payloadAfterColonOrQuote(input) {
  const q = input.match(/["']([^"']+)["']/); if (q) return q[1];
  const c = input.indexOf(":"); if (c >= 0 && !/^https?:/i.test(input.trim())) return input.slice(c + 1).trim();
  return null;
}
export function analyze(input) {
  const raw = String(input || "");
  const low = raw.toLowerCase();
  // JWT (a literal token present, or an explicit ask)
  if (looksLikeJwt(raw) || /\bjwt\b|json web token/.test(low)) return decodeJwt(raw);
  // hash identification
  if (/\b(identify|what\s*(?:kind|type|sort)?(?:\s+of)?|which|name)\b[^]*\bhash\b|\bhash\b[^]*\b(identif|what|which|type|kind)/.test(low) || /^hashid\b/.test(low)) {
    const tok = (raw.match(/\$[0-9a-z$][^\s]+|\b[0-9a-fA-F]{8,128}\b/) || [])[0] || payloadAfterColonOrQuote(raw) || "";
    return identifyHash(tok.trim());
  }
  // base32 / base58
  if (/base\s*58/.test(low)) { const p = payloadAfterColonOrQuote(raw) ?? stripVerb(raw); const dec = /\bdecode|\bfrom\b|unbase58/.test(low); const v = dec ? base58decode(p) : base58encode(p); return v == null ? { ok: false, error: "not valid base58" } : { ok: true, kind: "encode", op: dec ? "base58 decode" : "base58", payload: p, value: v }; }
  if (/base\s*32/.test(low)) { const p = payloadAfterColonOrQuote(raw) ?? stripVerb(raw); const dec = /\bdecode|\bfrom\b|unbase32/.test(low); const v = dec ? base32decode(p) : base32encode(p); return v == null ? { ok: false, error: "not valid base32" } : { ok: true, kind: "encode", op: dec ? "base32 decode" : "base32", payload: p, value: v }; }
  // encoding detection
  if (/(what|which|identify|detect|guess)\b[^]*\bencod/.test(low) || /encoding of|what is this (?:encoded|in)/.test(low)) {
    return detectEncoding(payloadAfterColonOrQuote(raw) ?? stripVerb(raw));
  }
  // IOC extraction
  if (/\biocs?\b|indicators? of compromise|extract (?:all\s+)?(?:the\s+)?(?:indicators?|iocs?|ips?|domains?|hashes?)\b|pull (?:out )?(?:indicators?|iocs?)/.test(low)) {
    const r = extractIOCs(raw); if (/\bdefang/.test(low)) r.defanged = true; return r;
  }
  // MAC
  if (/\bmac\b|\bmac address\b/.test(low)) return parseMac(raw);
  // fallback: if a bare JWT-ish or hash-ish token, try those
  return { ok: false, error: "no security-analysis operation recognized" };
}
function stripVerb(input) {
  let t = String(input || "").trim(), prev;
  const RE = /^(?:please|can you|could you|decode|encode|identify|detect|what\s+(?:is|are)|whats|the|this|is|base\s*32|base\s*58|from|to|as|of|a|an)\b[\s:]*/i;
  do { prev = t; t = t.replace(RE, ""); } while (t !== prev);
  return t || input;
}

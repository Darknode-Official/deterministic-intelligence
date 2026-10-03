// Universal Engine — advanced skills. All deterministic, self-contained (no imports
// so it is unit-testable in Node), no AI. Sources: statistics, an algebra solver,
// number theory, encoding/hashing, and a curated knowledge base.

// ---------------------------------------------------------------------------
// statistics: full numeric summary of a list of numbers.
// ---------------------------------------------------------------------------
export function parseNumbers(input) {
  return (String(input || "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
}
const r9 = (n) => Math.round(n * 1e9) / 1e9;
function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q, base = Math.floor(pos), rest = pos - base;
  return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
}
export function stats(input) {
  const xs = Array.isArray(input) ? input.slice() : parseNumbers(input);
  if (xs.length < 1) return { ok: false, error: "give me some numbers, e.g. stats 4 8 15 16 23 42" };
  const n = xs.length, sum = xs.reduce((a, b) => a + b, 0), mean = sum / n;
  const sorted = xs.slice().sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const freq = new Map(); for (const x of xs) freq.set(x, (freq.get(x) || 0) + 1);
  let maxf = 0; for (const c of freq.values()) maxf = Math.max(maxf, c);
  const mode = maxf > 1 ? [...freq.entries()].filter(([, c]) => c === maxf).map(([v]) => v).sort((a, b) => a - b) : [];
  const ss = xs.reduce((a, b) => a + (b - mean) ** 2, 0);
  const variance = ss / n, sampleVar = n > 1 ? ss / (n - 1) : 0;
  return {
    ok: true, count: n, sum: r9(sum), mean: r9(mean), median: r9(median),
    mode, min: sorted[0], max: sorted[n - 1], range: r9(sorted[n - 1] - sorted[0]),
    variance: r9(variance), stddev: r9(Math.sqrt(variance)),
    sampleStddev: r9(Math.sqrt(sampleVar)), q1: r9(quantile(sorted, 0.25)), q3: r9(quantile(sorted, 0.75)),
  };
}

// ---------------------------------------------------------------------------
// algebra: solve linear and quadratic equations. We sample the equation at three
// points to recover the polynomial coefficients (f(x)=a x^2 + b x + c), which is
// exact for any degree<=2 expression, then solve in closed form.
// ---------------------------------------------------------------------------
function evalVar(src, vn, x) {
  let s = src.replace(/\s+/g, "");
  s = s.replace(/([0-9.)])([a-z(])/g, "$1*$2");   // implicit multiplication: 3x -> 3*x, 2(x) -> 2*(x)
  s = s.replace(/\)([0-9a-z(])/g, ")*$1");         // )(  -> )*(
  const toks = s.match(/\d+\.?\d*|\.\d+|[a-z]+|[-+*/^()]/g) || [];
  let i = 0;
  const peek = () => toks[i], eat = () => toks[i++];
  const E = () => { let v = T(); while (peek() === "+" || peek() === "-") { const o = eat(); v = o === "+" ? v + T() : v - T(); } return v; };
  const T = () => { let v = P(); while (peek() === "*" || peek() === "/") { const o = eat(); const r = P(); v = o === "*" ? v * r : v / r; } return v; };
  const P = () => { const b = U(); if (peek() === "^") { eat(); return Math.pow(b, P()); } return b; };
  const U = () => { if (peek() === "-") { eat(); return -U(); } if (peek() === "+") { eat(); return U(); } return F(); };
  const F = () => {
    const t = peek();
    if (t === "(") { eat(); const v = E(); if (peek() !== ")") throw new Error("unbalanced parentheses"); eat(); return v; }
    if (/^\d|^\./.test(t)) { eat(); return parseFloat(t); }
    if (/^[a-z]+$/.test(t)) { eat(); if (t === vn) return x; if (t === "pi") return Math.PI; if (t === "e") return Math.E; throw new Error("unknown symbol '" + t + "'"); }
    throw new Error("could not parse the expression");
  };
  const v = E(); if (i !== toks.length) throw new Error("unexpected token in expression"); return v;
}
export function solveEquation(input) {
  const low = String(input || "").toLowerCase().replace(/^solve\s*/, "").trim();
  const parts = low.split("=");
  if (parts.length !== 2) return { ok: false, error: "give one equation with a single '=', e.g. 2x + 3 = 7" };
  const vn = ((low.replace(/pi/g, "").match(/[a-df-z]/) || [])[0]) || "x";
  const f = (x) => evalVar(parts[0], vn, x) - evalVar(parts[1], vn, x);
  let f0, f1, fm1;
  try { f0 = f(0); f1 = f(1); fm1 = f(-1); } catch (e) { return { ok: false, error: e.message }; }
  const c = f0, a = (f1 + fm1) / 2 - c, b = (f1 - fm1) / 2;
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return { ok: false, error: Math.abs(c) < 1e-12 ? "every value of " + vn + " is a solution" : "no solution (the equation is never true)" };
    return { ok: true, degree: 1, variable: vn, roots: [r9(-c / b)] };
  }
  const disc = b * b - 4 * a * c;
  if (disc < -1e-12) return { ok: true, degree: 2, variable: vn, roots: [], note: "no real roots (discriminant " + r9(disc) + ")" };
  const s = Math.sqrt(Math.max(disc, 0));
  const roots = s < 1e-12 ? [r9(-b / (2 * a))] : [r9((-b + s) / (2 * a)), r9((-b - s) / (2 * a))].sort((x, y) => x - y);
  return { ok: true, degree: 2, variable: vn, roots, coeffs: { a: r9(a), b: r9(b), c: r9(c) } };
}

// ---------------------------------------------------------------------------
// number theory
// ---------------------------------------------------------------------------
export function isPrime(n) { n = Math.trunc(n); if (n < 2) return false; if (n % 2 === 0) return n === 2; for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false; return true; }
export function factorize(n) { n = Math.trunc(Math.abs(n)); const f = []; for (let d = 2; d * d <= n; d++) while (n % d === 0) { f.push(d); n /= d; } if (n > 1) f.push(n); return f; }
export function nthPrime(k) { if (k < 1) return null; let c = 0, n = 1; while (c < k) { n++; if (isPrime(n)) c++; } return n; }
export function nthFib(n) { n = Math.trunc(n); let a = 0, b = 1; for (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; } return a; }
function gcd(a, b) { a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b)); while (b) { const t = a % b; a = b; b = t; } return a; }
export function numberTheory(input) {
  const low = String(input || "").toLowerCase();
  const nums = (low.match(/\d+/g) || []).map(Number);
  // "factors of 18" and "divisors of 18" list every divisor; "prime factors" stays the factorization
  const dv = low.match(/\b(?:(?:list|find|what are)\s+(?:all\s+)?(?:the\s+)?)?(?:all\s+)?(?:factors|divisors)\s+of\s+(\d+)\b/);
  if (dv && !/prime/.test(low) && +dv[1] >= 1 && +dv[1] <= 1e12) { const n = +dv[1], lo = [], hi = []; for (let d = 1; d * d <= n; d++) if (n % d === 0) { lo.push(d); if (d * d !== n) hi.unshift(n / d); }
    const all = lo.concat(hi), f = factorize(n), g = {}; for (const p of f) g[p] = (g[p] || 0) + 1;
    return { ok: true, kind: "divisors", text: all.join(", ") + " (" + all.length + " divisor" + (all.length === 1 ? "" : "s") + (f.length ? "; " + n + " = " + Object.entries(g).map(([p, e]) => e > 1 ? p + "^" + e : p).join(" * ") : "") + ")" }; }
  const ps = low.match(/\bis\s+(\d+)\s+(?:a\s+)?perfect\s+(square|cube)\b/);
  if (ps) { const n = +ps[1], cube = ps[2] === "cube", r = Math.round(cube ? Math.cbrt(n) : Math.sqrt(n)), pw = cube ? r ** 3 : r * r;
    if (n <= 1e15) return { ok: true, kind: "perfectpower", text: pw === n ? "Yes: " + n + " = " + r + "^" + (cube ? 3 : 2) : "No: " + n + " is not a perfect " + ps[2] + " (the nearest is " + r + "^" + (cube ? 3 : 2) + " = " + pw + ")" }; }
  const dby = low.match(/\bis\s+(\d+)\s+(?:evenly\s+)?divisible\s+by\s+(\d+)\b/);
  if (dby && +dby[2] === 0) return { ok: true, kind: "divisible", text: "No: nothing is divisible by 0, because division by 0 is undefined" };
  if (dby && +dby[2] > 0) { const a = +dby[1], b = +dby[2], r = a % b; return { ok: true, kind: "divisible", text: r === 0 ? "Yes: " + a + " = " + b + " x " + a / b : "No: " + a + " / " + b + " leaves remainder " + r }; }
  const ds = low.match(/\b(?:sum of (?:the |its )?digits (?:of|in)|digit sum (?:of )?)\s*(\d+)\b/);
  if (ds) { const d = ds[1].split(""); return { ok: true, kind: "digitsum", text: String(d.reduce((a, c) => a + +c, 0)) + " (" + d.join(" + ") + ")" }; }
  const dc = low.match(/\bhow many digits (?:does|do|are (?:there )?in|in|are in)\s+(\d+)\b(?!\s*[\^*!])/);
  if (dc) { const k = dc[1].replace(/^0+(?=\d)/, "").length; return { ok: true, kind: "digitcount", text: k + " digit" + (k === 1 ? "" : "s") }; }
  if (/factori[sz]e|prime factor|factors of/.test(low) && nums.length && nums[0] < 2) return { ok: true, kind: "factorize", n: nums[0], factors: [], text: nums[0] + " has no prime factorization (only whole numbers from 2 up have one)" };
  if (/factori[sz]e|prime factor|factors of/.test(low) && nums.length) {
    const f = factorize(nums[0]);
    const grouped = {}; for (const p of f) grouped[p] = (grouped[p] || 0) + 1;
    const pretty = Object.entries(grouped).map(([p, e]) => e > 1 ? p + "^" + e : p).join(" * ");
    return { ok: true, kind: "factorize", n: nums[0], factors: f, text: nums[0] + " = " + (pretty || nums[0]) };
  }
  if (/\bg\.?c\.?d|greatest common/.test(low) && nums.length >= 2) return { ok: true, kind: "gcd", text: String(nums.reduce((a, b) => gcd(a, b))) };
  if (/\bl\.?c\.?m|least common/.test(low) && nums.length >= 2) return { ok: true, kind: "lcm", text: String(nums.reduce((a, b) => Math.abs(a / gcd(a, b) * b))) };
  const signed = (low.match(/-?\d+/g) || []).map(Number);
  const eo = low.match(/\b(?:is|check (?:if|whether))\s+(-?\d+)\s+(?:an?\s+)?(even|odd)\b/);
  if (eo) { const v = Number(eo[1]), even = v % 2 === 0; return { ok: true, kind: "parity", text: ((eo[2] === "even") === even ? "Yes: " : "No: ") + v + " is " + (even ? "even" : "odd") + " (" + v + " / 2 leaves remainder " + Math.abs(v % 2) + ")" }; }
  if (/prime/.test(low) && /\b(is|check)\b/.test(low) && signed.length && signed[0] < 2) return { ok: true, kind: "isprime", text: signed[0] + " is not prime (primes are whole numbers greater than 1)" };
  if (/prime/.test(low) && /\b(is|check)\b/.test(low) && nums.length) return { ok: true, kind: "isprime", text: (isPrime(nums[0]) ? nums[0] + " is prime" : nums[0] + " is not prime (" + (factorize(nums[0]).join(" * ")) + ")") };
  const fp = low.match(/\b(?:first|list(?: the)?(?: first)?)\s+(\d+)\s+primes?(?: numbers?)?\b|\bprimes?\s+(?:below|under|less than|up to)\s+(\d+)/);
  if (fp) {
    const out = [];
    const capped = fp[1] ? +fp[1] > 1000 : +fp[2] > 100000;
    if (fp[1]) { const k = Math.min(1000, +fp[1]); for (let n = 2; out.length < k; n++) if (isPrime(n)) out.push(n); }
    else { const lim = Math.min(100000, +fp[2] - (/up to/.test(low) ? 0 : 1)); for (let n = 2; n <= lim; n++) if (isPrime(n)) out.push(n); }
    if (!out.length) return { ok: true, kind: "primes", text: "none: there are no primes " + (fp[1] ? "in an empty list" : "below 2") + " (the first prime is 2)" };
    return { ok: true, kind: "primes", text: out.join(", ") + " (" + out.length + " primes" + (capped ? ", capped here to keep the answer readable" : "") + ")" };
  }
  const np = low.match(/(\d+)(?:st|nd|rd|th)?\s+prime/) || (/nth prime/.test(low) && nums.length ? [0, nums[0]] : null);
  if (np) return { ok: true, kind: "nthprime", text: "prime #" + np[1] + " is " + nthPrime(Number(np[1])) };
  if (/fib/.test(low) && /(?:^|\s)-\d/.test(low)) return { ok: false, error: "Fibonacci numbers are indexed from 0 up, so a negative position has no value here" };
  // "first 8 fibonacci numbers": F(0) .. F(7)
  const ff = low.match(/\b(?:first|list(?: the)?(?: first)?)\s+(\d+)\s+fib(?:onacci)?(?:\s+(?:numbers?|terms?|sequence))?\b/);
  if (ff) { const k = Math.min(200, +ff[1]); const out = []; for (let i = 0; i < k; i++) out.push(String(nthFib(i)));
    return { ok: true, kind: "fibs", text: (out.join(", ") || "none") + " (" + k + " Fibonacci numbers, starting from F(0) = 0" + (+ff[1] > 200 ? ", capped here to keep the answer readable" : "") + ")" }; }
  const nf = low.match(/(\d+)(?:st|nd|rd|th)?\s+fib/) || (/fibonacci/.test(low) && nums.length ? [0, nums[0]] : null);
  if (nf) return { ok: true, kind: "fib", text: "Fibonacci #" + nf[1] + " is " + nthFib(Number(nf[1])) };
  return { ok: false, error: "try: factorize 360, gcd 12 18, is 97 prime, 10th prime, 20th fibonacci" };
}

// ---------------------------------------------------------------------------
// encoding + non-cryptographic hashing (sync, dependency-free, deterministic)
// ---------------------------------------------------------------------------
function b64e(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch (_) { return Buffer.from(s, "utf8").toString("base64"); } }
function b64d(s) { try { return decodeURIComponent(escape(atob(s))); } catch (_) { return Buffer.from(s, "base64").toString("utf8"); } }
const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
function crc32(str) { let c; const t = []; for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } let crc = -1; for (let i = 0; i < str.length; i++) crc = (crc >>> 8) ^ t[(crc ^ str.charCodeAt(i)) & 0xFF]; return ((crc ^ -1) >>> 0).toString(16).padStart(8, "0"); }
function fnv1a(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, "0"); }
function djb2(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0; return (h >>> 0).toString(16); }
export function encode(op, s) {
  s = String(s == null ? "" : s);
  switch (op) {
    case "base64": return b64e(s);
    case "unbase64": return b64d(s);
    case "hex": return [...s].map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
    case "unhex": return (s.match(/../g) || []).map((h) => String.fromCharCode(parseInt(h, 16))).join("");
    case "url": return encodeURIComponent(s);
    case "unurl": try { return decodeURIComponent(s); } catch (_) { return "invalid percent-encoding"; }
    case "rot13": return s.replace(/[a-z]/gi, (c) => { const base = c <= "Z" ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base); });
    case "binary": return [...s].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
    case "unbinary": return (s.trim().split(/\s+/).filter(Boolean)).map((b) => String.fromCharCode(parseInt(b, 2))).join("");
    case "morse": return [...s.toLowerCase()].map((c) => c === " " ? "/" : (MORSE[c] || "")).filter(Boolean).join(" ");
    case "crc32": return crc32(s);
    case "fnv1a": return fnv1a(s);
    case "djb2": return djb2(s);
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// knowledge base: a small, curated, sourced glossary. Every answer is our own
// text, so the engine can cite it and never fabricates. This is not AI; it is a
// lookup with keyword matching.
// ---------------------------------------------------------------------------
export const GLOSSARY = {
  "hash function": "A hash function maps input data of any size to a fixed-size value called a hash. Good hash functions spread inputs evenly and, for cryptographic use, make it infeasible to find two inputs with the same hash or to reverse a hash back to its input.",
  "encryption": "Encryption transforms data into a form only an authorized party can read, using a key. Symmetric encryption uses one shared key; asymmetric encryption uses a public key to encrypt and a matching private key to decrypt.",
  "public key cryptography": "Public key cryptography uses a key pair: a public key that anyone may hold and a private key kept secret. Data encrypted with the public key can only be decrypted with the private key, and a private key can sign data that the public key verifies.",
  "sql injection": "SQL injection is an attack where untrusted input is inserted into a database query, tricking the database into running commands the developer did not intend. It is prevented by using parameterized queries so input is treated as data, never as code.",
  "cross site scripting": "Cross-site scripting (XSS) injects malicious script into a page that other users then load, letting the attacker run code in their browsers. It is prevented by escaping output and using a content security policy.",
  "buffer overflow": "A buffer overflow writes past the end of a fixed-size buffer, corrupting adjacent memory. In unsafe languages this can overwrite return addresses and let an attacker hijack control of the program.",
  "firewall": "A firewall filters network traffic against a set of rules, allowing wanted connections and blocking the rest. It can operate on ports, addresses, protocols, or, at higher layers, on application content.",
  "authentication": "Authentication proves who a user is, for example with a password, a key, or a hardware token. It is distinct from authorization, which decides what an authenticated user is allowed to do.",
  "authorization": "Authorization decides what an authenticated identity is permitted to do. The principle of least privilege says each identity should get only the access it truly needs.",
  "tls": "Transport Layer Security (TLS) encrypts a network connection and authenticates the server (and optionally the client) using certificates, so traffic cannot be read or altered in transit.",
  "dns": "The Domain Name System (DNS) translates human-readable names like example.com into numeric IP addresses, using a distributed hierarchy of name servers.",
  "api": "An Application Programming Interface (API) defines how one program can request services from another: the operations available, their inputs, and their outputs.",
  "recursion": "Recursion is when a function solves a problem by calling itself on a smaller sub-problem, with a base case that stops the recursion. Many divide-and-conquer algorithms are naturally recursive.",
  "big o notation": "Big-O notation describes how an algorithm's running time or memory grows as the input size grows, ignoring constant factors. For example, binary search is O(log n) and a nested loop over the input is O(n^2).",
  "binary search": "Binary search finds a value in a sorted array by repeatedly comparing the target to the middle element and discarding the half that cannot contain it, running in O(log n) time.",
  "hash table": "A hash table stores key-value pairs and uses a hash function to find the slot for each key, giving average constant-time insertion and lookup.",
  "race condition": "A race condition occurs when the correctness of a program depends on the unpredictable timing of concurrent operations, such as two threads updating the same value at once.",
  "deadlock": "A deadlock is when two or more threads each wait for a resource the other holds, so none can proceed. It is avoided by ordering lock acquisition or by not holding multiple locks at once.",
  "vulnerability": "A vulnerability is a weakness in a system that an attacker can exploit to violate its security, for example to read data they should not, or to run code. A patch fixes it.",
  "zero trust": "Zero trust is a security model that trusts no request by default, whether inside or outside the network. Every request is authenticated, authorized, and encrypted based on identity and context.",
  "phishing": "Phishing tricks a person into revealing credentials or running malware, usually through a deceptive message that imitates a trusted sender. Defenses include user training, email authentication, and multi-factor authentication.",
  "salting": "A salt is random data added to a password before hashing, so that identical passwords produce different hashes and precomputed rainbow tables cannot be used.",
  "rest": "REST (Representational State Transfer) is an API style where resources are named by URLs and manipulated with standard HTTP methods such as GET, POST, PUT, and DELETE.",
  "cache": "A cache stores the result of an expensive operation so a later request for the same thing can be served without recomputing it, trading memory for speed.",
  "compiler": "A compiler translates source code in one language into another form, usually machine code or bytecode, checking the program's structure and reporting errors before it runs.",
  "interpreter": "An interpreter executes a program directly, statement by statement, without first compiling it to machine code. It starts fast but generally runs slower than compiled code.",
  "pointer": "A pointer is a value that holds the memory address of another value. Dereferencing a pointer reads or writes the value it points to; a null or dangling pointer is a common bug.",
  "linked list": "A linked list stores elements in nodes, each holding a value and a reference to the next node. Insertion and deletion are cheap, but access by index is linear because you must follow the links.",
  "stack": "A stack is a last-in-first-out collection: you push items on top and pop them off the top. It models function calls, undo history, and expression evaluation.",
  "queue": "A queue is a first-in-first-out collection: items are added at the back and removed from the front. It models work waiting to be processed in order.",
  "thread": "A thread is an independent sequence of execution within a process. Multiple threads share memory and can run concurrently, which is powerful but requires care to avoid race conditions.",
  "process": "A process is a running program with its own memory space. Processes are isolated from each other, unlike threads, which share the memory of their process.",
  "virtual machine": "A virtual machine emulates a computer in software, running its own operating system on top of a host. It isolates workloads and lets one physical machine run many independent systems.",
  "container": "A container packages an application with its dependencies and runs it in an isolated user space on a shared kernel. It is lighter than a virtual machine and starts almost instantly.",
  "load balancer": "A load balancer distributes incoming requests across several servers so no single server is overwhelmed, improving throughput and providing redundancy if one server fails.",
  "index": "A database index is a data structure that lets the database find matching rows without scanning the whole table, speeding up reads at the cost of extra storage and slower writes.",
  "transaction": "A database transaction groups operations so they either all succeed or all fail together, preserving consistency. Transactions are often described by the ACID properties.",
  "idempotent": "An operation is idempotent if performing it many times has the same effect as performing it once. Idempotent requests are safe to retry after a network failure.",
  "compression": "Compression encodes data using fewer bits by removing redundancy. Lossless compression restores the original exactly; lossy compression discards detail for a smaller size.",
  "checksum": "A checksum is a small value computed from data used to detect accidental corruption. If the data changes, the recomputed checksum will not match the stored one.",
  "certificate authority": "A certificate authority is a trusted organization that signs digital certificates, vouching that a public key belongs to the named owner so clients can trust it.",
  "sandbox": "A sandbox is a restricted environment that runs untrusted code with limited access to the rest of the system, containing any damage the code might try to do.",
  "brute force": "A brute-force attack tries every possible value, such as every password, until one works. Long secrets and rate limiting make brute force impractical.",
  "malware": "Malware is software written to harm or gain unauthorized access to a system, including viruses, worms, ransomware, spyware, and trojans.",
  "ransomware": "Ransomware is malware that encrypts a victim's files and demands payment for the key. Good, tested backups are the strongest defense.",
  "vpn": "A virtual private network creates an encrypted tunnel between a device and a network, protecting traffic on untrusted connections and hiding it from local observers.",
  "recursion": "Recursion is when a function calls itself on a smaller input, with a base case that stops the descent. It expresses problems that break into similar subproblems, like tree traversal.",
  "pointer": "A pointer is a variable that holds the memory address of another value. Dereferencing it reads or writes the value it points to.",
  "closure": "A closure is a function bundled with the variables from the scope where it was defined, so it keeps access to them even after that scope has returned.",
  "concurrency": "Concurrency is structuring a program as independent tasks that can make progress in overlapping time periods. Parallelism is actually running them at the same time on multiple cores.",
  "deadlock": "A deadlock is when two or more tasks each wait for a resource the other holds, so none can proceed. Consistent lock ordering and timeouts help avoid it.",
  "race condition": "A race condition is a bug where the result depends on the unpredictable timing of concurrent operations on shared state. Locks or atomic operations prevent it.",
  "idempotent": "An operation is idempotent if applying it many times has the same effect as applying it once, like an HTTP PUT. It makes retries safe.",
  "big o notation": "Big O notation describes how an algorithm's time or space grows with input size, keeping only the dominant term, e.g. O(n) linear, O(n log n), O(n^2) quadratic.",
  "hash table": "A hash table stores key-value pairs and uses a hash function to map a key to a bucket, giving average O(1) lookup, insert, and delete.",
  "binary tree": "A binary tree is a hierarchy where each node has up to two children. A binary search tree keeps them ordered so lookups take O(log n) when balanced.",
  "graph": "A graph is a set of nodes (vertices) connected by edges. It models networks, and algorithms like BFS and DFS traverse it.",
  "rest api": "A REST API exposes resources over HTTP using standard methods (GET, POST, PUT, DELETE) and stateless requests, typically exchanging JSON.",
  "idempotency": "See idempotent: repeating the request leaves the system in the same state as doing it once, which is what makes safe retries possible.",
  "cache": "A cache stores the results of expensive work so later requests for the same thing are served quickly. The hard parts are invalidation and staleness.",
  "load balancer": "A load balancer spreads incoming requests across several servers to improve throughput and availability, often with health checks and sticky sessions.",
  "container": "A container packages an application with its dependencies into an isolated, portable unit that shares the host kernel, making deployments reproducible.",
  "virtual machine": "A virtual machine emulates a whole computer, running its own operating system on top of a hypervisor. It isolates more than a container but is heavier.",
  "zero trust": "Zero trust is a security model that trusts no request by default, verifying identity and authorization for every access regardless of network location.",
  "jwt": "A JSON Web Token is a signed, self-contained token carrying claims (like a user id and expiry). The signature lets a server trust it without a session lookup.",
  "oauth": "OAuth is a delegation protocol that lets a user grant an app limited access to their account on another service without sharing their password, via access tokens.",
  "dns": "The Domain Name System translates human names like example.com into IP addresses, using a distributed hierarchy of nameservers.",
  "tcp": "TCP is a connection-oriented transport protocol that delivers a reliable, ordered byte stream, handling retransmission and flow control. UDP trades that for lower overhead.",
  "https": "HTTPS is HTTP carried over TLS, so the connection is encrypted and the server is authenticated by a certificate, protecting against eavesdropping and tampering.",
  "regression": "In machine learning, regression predicts a continuous number; classification predicts a category. In engineering, a regression is a change that breaks previously working behavior.",
  "hash map": "A hash map (hash table) stores key-value pairs, using a hash function to map each key to a bucket, giving average O(1) lookup, insert, and delete. It is unordered.",
  "array": "An array is an ordered, indexed collection of elements stored contiguously, giving O(1) access by index. Its size is often fixed and insertion in the middle is O(n).",
  "dictionary": "A dictionary (map) associates keys with values so you can look a value up by its key. Most languages implement it as a hash map or a balanced tree.",
  "set": "A set is an unordered collection of distinct elements with fast membership tests. It supports union, intersection, and difference.",
  "tuple": "A tuple is a fixed-size, ordered group of values, often of different types. Unlike a list it is typically immutable.",
  "variable": "A variable is a named storage location holding a value that a program can read and change. Its scope is the region of code where the name is visible.",
  "constant": "A constant is a named value that cannot be reassigned after it is set, which makes intent clear and prevents accidental change.",
  "loop": "A loop repeats a block of code, either a fixed number of times (for) or while a condition holds (while). Each pass is called an iteration.",
  "algorithm": "An algorithm is a finite, unambiguous sequence of steps that solves a problem or computes a result, judged by correctness and by its time and space cost.",
  "data structure": "A data structure organizes data so certain operations are efficient. Choosing the right one (array, hash map, tree, graph) is central to good performance.",
  "object": "In object-oriented programming, an object bundles data (fields) with the operations (methods) that act on it, and is usually an instance of a class.",
  "class": "A class is a blueprint that defines the fields and methods its objects will have. Objects are concrete instances created from a class.",
  "inheritance": "Inheritance lets a class derive fields and methods from a parent class, reusing and specializing behavior. Overuse creates fragile hierarchies.",
  "polymorphism": "Polymorphism lets one interface work with many types, so the same call runs different code depending on the actual object, as with overridden methods.",
  "encapsulation": "Encapsulation hides an object's internal state behind a public interface, so callers depend on behavior, not representation, and invariants stay protected.",
  "abstraction": "Abstraction exposes only the essential features of something and hides the details, letting you reason about what it does without how it does it.",
  "function": "A function is a named, reusable block of code that takes inputs (parameters), performs a computation, and usually returns a result. It is the basic unit of reuse.",
  "parameter": "A parameter is a named input in a function's definition; an argument is the actual value passed for it when the function is called.",
  "exception": "An exception is a signal that an error occurred, interrupting normal flow. Code can throw one and a handler can catch it to recover or report the failure.",
  "immutable": "An immutable value cannot be changed after creation; any modification produces a new value. Immutability makes code easier to reason about and to share across threads.",
  "json": "JSON (JavaScript Object Notation) is a lightweight text format for data, built from objects, arrays, strings, numbers, booleans, and null. It is language-independent.",
  "http": "HTTP is the request-response protocol of the web: a client sends a method (GET, POST, ...) and a path, and the server returns a status code and a body.",
  "ip address": "An IP address is a numeric label identifying a device on a network. IPv4 uses four bytes (like 192.168.0.1); IPv6 uses 128 bits for a vastly larger space.",
  "localhost": "localhost is the hostname that always points at the machine you are on, through the loopback address 127.0.0.1 (::1 in IPv6). Traffic to it never leaves the computer, which is why development servers such as http://localhost:3000 are reachable only from that same machine.",
  "loopback": "The loopback interface is a virtual network interface that delivers packets back to the same machine. Its IPv4 addresses are 127.0.0.0/8 (usually 127.0.0.1, named localhost) and its IPv6 address is ::1.",
  "private ip": "A private IP address is one from 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16 (RFC 1918). These are used inside home and office networks, are not routed on the public internet, and reach it through NAT on the router.",
  "subnet mask": "A subnet mask marks which bits of an IP address name the network and which name the host: 255.255.255.0 (written /24 in CIDR) keeps the first 24 bits for the network and leaves 8 bits, 256 addresses, for hosts.",
  "cidr": "CIDR (Classless Inter-Domain Routing) writes a network as address/prefix-length, like 192.168.1.0/24: the prefix length is the number of leading bits shared by every address in the block, so a /24 holds 2^(32-24) = 256 addresses.",
  "latency": "Latency is the time a single operation takes from request to response. Throughput is how many operations complete per unit time; they are different measures.",
  "protocol": "A protocol is an agreed set of rules for how two parties communicate: message format, order, and meaning, so independent systems can interoperate.",
  "kernel": "The kernel is the core of an operating system. It manages memory, scheduling, and hardware access, and mediates between programs and the machine.",
  "cpu": "The CPU (central processing unit) executes program instructions, doing arithmetic, logic, and control. Its speed, core count, and caches drive performance.",
  "memoization": "Memoization caches a function's results by its arguments, so repeated calls with the same inputs return instantly. It is a key technique in dynamic programming.",
  "dynamic programming": "Dynamic programming solves a problem by combining answers to overlapping subproblems, storing each once (memoization or a table) to avoid recomputation.",
  "greedy algorithm": "A greedy algorithm builds a solution step by step, always taking the locally best choice. It is fast and simple but only correct for problems with the right structure.",
  "merge sort": "Merge sort recursively splits a list in half, sorts each half, and merges them in order. It runs in O(n log n) time and is stable.",
  "quicksort": "Quicksort partitions a list around a pivot so smaller items go left and larger go right, then sorts each side. It averages O(n log n) but is O(n^2) in the worst case.",
  "binary tree": "A binary tree is a hierarchy where each node has up to two children. A balanced binary search tree keeps values ordered for O(log n) search.",
  "depth first search": "Depth-first search explores a graph or tree by going as deep as possible along each branch before backtracking, using a stack or recursion.",
  "breadth first search": "Breadth-first search explores a graph level by level from the start, using a queue. It finds the shortest path in an unweighted graph.",
  "git": "Git is a distributed version control system that tracks changes to files as commits, supports branching and merging, and lets many people collaborate on code.",
  "version control": "Version control records the history of changes to a project, letting you review, revert, branch, and merge work, and collaborate without overwriting each other.",
  "unit test": "A unit test checks one small piece of code (a function or class) in isolation against expected results, catching regressions early and documenting behavior.",
  "refactoring": "Refactoring restructures existing code to make it clearer or simpler without changing what it does, ideally under the protection of tests.",
  "machine learning": "Machine learning builds models that learn patterns from data to make predictions, rather than following rules written by hand. It is a subset of artificial intelligence.",
  "neural network": "A neural network is a model of connected layers of simple units whose weights are learned from data. Deep networks stack many layers to learn complex patterns.",
  "artificial intelligence": "Artificial intelligence is the field of building systems that perform tasks associated with human intelligence, such as perception, reasoning, and language.",
  "docker": "Docker is a platform for building and running containers: portable, isolated packages of an application and its dependencies that share the host kernel.",
  "blockchain": "A blockchain is an append-only ledger of records linked by cryptographic hashes and replicated across many nodes, making past entries hard to alter undetectably.",
  "html": "HTML (HyperText Markup Language) is the markup language for web pages: tags such as <p> and <a> describe a document's structure, which the browser renders.",
  "css": "CSS (Cascading Style Sheets) describes how HTML is presented: selectors pick elements and rules set their layout, colours, fonts, and spacing.",
  "javascript": "JavaScript is the programming language built into web browsers (and run on servers by Node.js). It makes pages interactive by changing the document in response to events.",
  "python": "Python is a general-purpose programming language known for readable, indentation-based syntax and a large standard library, widely used for scripting, data, and web back ends.",
  "bug": "A bug is a defect in a program that makes it behave differently from what was intended, from a wrong result to a crash. Finding and fixing one is called debugging.",
  "debugging": "Debugging is finding and fixing the cause of a bug: reproducing it, narrowing down where the behaviour goes wrong, and correcting the code.",
  "operating system": "An operating system manages a computer's hardware and runs programs on top of it, handling processes, memory, files, and devices (for example Linux, Windows, macOS).",
  "ram": "RAM (random access memory) is a computer's fast, temporary working memory. It holds running programs and their data and is cleared when power is lost.",
  "database": "A database is an organised store of data with software to query and update it safely; relational databases keep tables queried with SQL.",
  "sql": "SQL (Structured Query Language) is the language for querying and changing data in relational databases, with statements such as SELECT, INSERT, UPDATE, and DELETE.",
  "url": "A URL (uniform resource locator) is a web address: a scheme, a host, and a path, such as https://example.com/page, naming where a resource lives.",
  "open source": "Open source software publishes its source code under a licence that lets anyone read, change, and share it.",
  // round 10: everyday science and a few more computing terms
  "dna": "DNA (deoxyribonucleic acid) is the molecule that carries genetic instructions in living things: two strands wound into a double helix, with the code written in four bases (A, T, C, G).",
  "rna": "RNA (ribonucleic acid) is a single-stranded molecule, similar to DNA, that carries copies of genetic instructions (messenger RNA) and helps build proteins; it uses the base U in place of T.",
  "gene": "A gene is a stretch of DNA that holds the instructions for one product, usually a protein; genes are the basic units of heredity.",
  "protein": "A protein is a large molecule made of a chain of amino acids folded into a shape; proteins do most of the work in cells, as enzymes, structure, signals and transport.",
  "photosynthesis": "Photosynthesis is how plants, algae and some bacteria turn light into chemical energy: carbon dioxide + water + light gives glucose + oxygen (6CO2 + 6H2O -> C6H12O6 + 6O2).",
  "virus": "A virus is a tiny infectious agent (about 20 to 300 nanometres) made of genetic material in a protein coat; it can reproduce only inside a host cell. Antibiotics do not work on viruses.",
  "bacteria": "Bacteria are single-celled microorganisms without a nucleus. Most are harmless or useful (such as gut bacteria); some cause disease and can be treated with antibiotics.",
  "vaccine": "A vaccine trains the immune system to recognise a germ, using a harmless piece, a weakened or inactivated form, or instructions (mRNA) for one of its proteins, so the body can fight the real infection quickly.",
  "udp": "UDP (User Datagram Protocol) is a connectionless transport protocol: it sends datagrams with no handshake, ordering or retransmission, trading reliability for low delay (DNS, games, video calls, QUIC).",
  "router": "A router forwards packets between networks, choosing the next hop for each one from its routing table; a home router also joins your devices to the internet, usually with NAT and Wi-Fi.",
  "cookie": "A cookie is a small piece of data a website asks the browser to store and send back with later requests, used for sessions, preferences and tracking.",
  "kubernetes": "Kubernetes is an open-source system for running containers across a cluster of machines: it schedules them, restarts failed ones, scales them and routes traffic to them.",
  "black hole": "A black hole is a region of space where gravity is so strong that nothing, not even light, can escape once past its boundary, the event horizon. Many form when massive stars collapse.",
  "inflation": "Inflation is the rate at which prices rise across an economy over time, so each unit of money buys less; it is usually measured yearly with a consumer price index.",
  "recession": "A recession is a significant, broad decline in economic activity lasting months; a common rule of thumb is two consecutive quarters of falling GDP.",
  "climate change": "Climate change is the long-term shift in temperatures and weather patterns. Since the 1800s it has been driven mainly by burning fossil fuels, which adds heat-trapping greenhouse gases to the air.",
  "democracy": "Democracy is a system of government in which power rests with the people, who rule directly or through representatives chosen in free and fair elections.",
  "evolution": "Evolution is the change in the inherited traits of populations over generations. Natural selection, described by Darwin and Wallace, favours traits that help survival and reproduction.",
};
const KB_ALIASES = { xss: "cross site scripting", sqli: "sql injection", "ssl": "tls", "big o": "big o notation", "least privilege": "authorization", "asymmetric encryption": "public key cryptography", hash: "hash function", hashing: "hash function", hashes: "hash function", hashmap: "hash map" };
export function lookup(input) {
  let low = String(input || "").toLowerCase().replace(/^(what\s+is|what\s+are|define|explain|tell me about)\s+/, "").replace(/[?.]/g, "").replace(/^(a|an|the)\s+/, "").trim();
  if (GLOSSARY[low]) return { ok: true, term: low, text: GLOSSARY[low] };
  if (KB_ALIASES[low] && GLOSSARY[KB_ALIASES[low]]) return { ok: true, term: KB_ALIASES[low], text: GLOSSARY[KB_ALIASES[low]] };
  // keyword containment (longest matching key wins)
  // keyword containment on whole words only: "anagram" must not resolve to the "ram" entry
  const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const hasWord = (k) => new RegExp("(?:^|[^a-z0-9])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z0-9])").test(low);
  for (const k of keys) if (hasWord(k)) return { ok: true, term: k, text: GLOSSARY[k] };
  for (const alias in KB_ALIASES) if (hasWord(alias)) return { ok: true, term: KB_ALIASES[alias], text: GLOSSARY[KB_ALIASES[alias]] };
  return { ok: false, error: "no glossary entry for that", terms: Object.keys(GLOSSARY) };
}

// ---------------------------------------------------------------------------
// wordMath: interpret a natural-language arithmetic word problem deterministically.
// It extracts the numbers and infers ONE operation from cue words. It ALWAYS
// reports the numbers and the operation it chose, so the one reasoned guess it
// makes (which operation) is visible rather than hidden — no fake comprehension.
// ---------------------------------------------------------------------------
export function wordMath(input) {
  const low = String(input || "").toLowerCase();
  const nums = (low.match(/\$?\d[\d,]*(?:\.\d+)?/g) || [])
    .map((t) => parseFloat(t.replace(/[$,]/g, ""))).filter(Number.isFinite);
  if (nums.length < 2) return { ok: false, error: "I need at least two numbers in the sentence to work a word problem" };
  const cue = (re) => re.test(low);
  // percentage discount: "20% off $80", "15 percent discount on 200"
  const poff = low.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:off|discount)/) || (cue(/\b(off|discount|sale|reduced)\b/) && cue(/%|percent/) ? low.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/) : null);
  if (poff) {
    const p = parseFloat(poff[1]);
    const price = nums.find((n) => n !== p);
    if (price != null) {
      const value = Math.round((price - (p / 100) * price) * 1e6) / 1e6;
      return { ok: true, op: "percentage discount", value, expr: price + " - " + p + "% of " + price, numbers: nums };
    }
  }
  let op, word;
  // stems take \w* so "multiply", "divided", "reduced" match (a bare "multipl\b" never did)
  if (cue(/\b(difference|how many more|how much more|how many fewer|how much less|less than|left over|\bleft\b|remaining|remain\b|spen[dt]|gave away|give away|lost|lose|decreas\w*|reduc\w*|minus|take away|subtract\w*|deduct\w*)\b/)) { op = "sub"; word = "subtraction"; }
  else if (nums.length === 2 && cue(/\b(product|multipl\w*|times|twice|double|triple)\b/)) { op = "mul"; word = "multiplication"; }
  else if (nums.length === 2 && cue(/\b(split|shared? equally|divid\w*|per (person|group|box|bag|day|hour)|each (get|gets|receive|receives))\b/)) { op = "div"; word = "division"; }
  else { op = "add"; word = "addition"; } // totalling wording, or a plain many-number prose sum
  let value, expr;
  if (op === "add") { value = nums.reduce((a, b) => a + b, 0); expr = nums.join(" + "); }
  else if (op === "sub") { value = nums.slice(1).reduce((a, b) => a - b, nums[0]); expr = nums.join(" - "); }
  else if (op === "mul") { value = nums.reduce((a, b) => a * b, 1); expr = nums.join(" * "); }
  else { value = nums.slice(1).reduce((a, b) => a / b, nums[0]); expr = nums.join(" / "); }
  value = Math.round(value * 1e9) / 1e9;
  return { ok: true, op: word, value, expr, numbers: nums };
}

// ---------------------------------------------------------------------------
// sequence: given a list of numbers, deterministically identify the pattern
// (arithmetic, geometric, constant-second-difference/quadratic, or additive /
// Fibonacci-like), state the rule, and extend it. No guessing beyond a proven
// constant difference/ratio; if none fits, it says so.
// ---------------------------------------------------------------------------
export function sequence(input) {
  const nums = (String(input || "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  if (nums.length < 3) return { ok: false, error: "give at least three numbers so I can identify the pattern" };
  const eq = (a) => a.every((x) => Math.abs(x - a[0]) < 1e-9);
  const round = (x) => Math.round(x * 1e9) / 1e9;
  const diffs = nums.slice(1).map((n, i) => n - nums[i]);
  if (eq(diffs)) {
    const d = diffs[0], last = nums[nums.length - 1];
    return { ok: true, kind: "arithmetic", rule: "add " + round(d) + " each step", common: round(d), next: [1, 2, 3].map((k) => round(last + d * k)), nth: "a(n) = " + round(nums[0]) + " + (n-1)*" + round(d), sum: round(nums.reduce((a, b) => a + b, 0)) };
  }
  const ratios = nums.slice(1).map((n, i) => nums[i] === 0 ? null : n / nums[i]);
  if (ratios.every((r) => r !== null) && eq(ratios)) {
    const r = ratios[0], last = nums[nums.length - 1];
    return { ok: true, kind: "geometric", rule: "multiply by " + round(r) + " each step", common: round(r), next: [1, 2, 3].map((k) => round(last * Math.pow(r, k))), nth: "a(n) = " + round(nums[0]) + " * " + round(r) + "^(n-1)" };
  }
  const d2 = diffs.slice(1).map((n, i) => n - diffs[i]);
  if (d2.length && eq(d2)) {
    const c = d2[0]; let ld = diffs[diffs.length - 1], last = nums[nums.length - 1]; const next = [];
    for (let k = 0; k < 3; k++) { ld += c; last += ld; next.push(round(last)); }
    return { ok: true, kind: "quadratic", rule: "the second differences are constant (" + round(c) + ")", next };
  }
  if (nums.slice(2).every((n, i) => Math.abs(n - (nums[i] + nums[i + 1])) < 1e-9)) {
    let a = nums[nums.length - 2], b = nums[nums.length - 1]; const next = [];
    for (let k = 0; k < 3; k++) { const c = a + b; next.push(round(c)); a = b; b = c; }
    return { ok: true, kind: "additive (Fibonacci-like)", rule: "each term is the sum of the two before it", next };
  }
  return { ok: false, error: "no simple arithmetic, geometric, quadratic, or additive pattern fits these numbers" };
}

// ---------------------------------------------------------------------------
// logic: build the full truth table for a boolean expression. A real recursive
// descent parser (NO eval) over and/or/not/xor/implies(->)/iff(<->), variables
// are single letters. Deterministic and exhaustive over every assignment.
// ---------------------------------------------------------------------------
function boolTokens(s) {
  s = " " + s.toLowerCase() + " ";
  s = s.replace(/<->|<=>|\biff\b|\bxnor\b/g, " IFF ").replace(/->|=>|\bimplies\b/g, " IMP ")
    .replace(/\bxor\b/g, " XOR ").replace(/\band\b|&&|&|∧/g, " AND ").replace(/\bor\b|\|\||\||∨/g, " OR ")
    .replace(/\bnot\b|!|¬|~/g, " NOT ").replace(/\btrue\b|\bT\b/gi, " TRUE ").replace(/\bfalse\b|\bF\b/gi, " FALSE ");
  const toks = []; const re = /IFF|IMP|XOR|AND|OR|NOT|TRUE|FALSE|[a-z]|[()]/g; let m;
  while ((m = re.exec(s))) toks.push(m[0]);
  return toks;
}
function boolParser(toks) {
  let i = 0; const peek = () => toks[i], eat = () => toks[i++];
  const bin = (sub, tag, f) => () => { let a = sub(); while (peek() === tag) { eat(); const b = sub(); const aa = a; a = (e) => f(aa(e), b(e)); } return a; };
  const pAtom = () => { const t = eat(); if (t === "(") { const e = pIff(); if (peek() === ")") eat(); else throw new Error("missing )"); return e; } if (t === "TRUE") return () => true; if (t === "FALSE") return () => false; if (t && /^[a-z]$/.test(t)) return (e) => !!e[t]; throw new Error("unexpected '" + (t || "end of input") + "'"); };
  const pNot = () => { if (peek() === "NOT") { eat(); const b = pNot(); return (e) => !b(e); } return pAtom(); };
  const pAnd = bin(pNot, "AND", (x, y) => x && y);
  const pXor = bin(pAnd, "XOR", (x, y) => x !== y);
  const pOr = bin(pXor, "OR", (x, y) => x || y);
  const pImp = bin(pOr, "IMP", (x, y) => !x || y);
  const pIff = bin(pImp, "IFF", (x, y) => x === y);
  const fn = pIff(); if (i < toks.length) throw new Error("unexpected '" + toks[i] + "'"); return fn;
}
export function logic(input) {
  let expr = String(input || "");
  const m = expr.match(/truth table\s*(?:for|of)?\s*:?\s*(.+)$/i); if (m) expr = m[1];
  expr = expr.replace(/[?.]+\s*$/, "").trim();
  const toks = boolTokens(expr);
  if (!toks.length) return { ok: false, error: "give a boolean expression, e.g. (a and b) or not c" };
  let fn; try { fn = boolParser(toks); } catch (e) { return { ok: false, error: "could not parse that: " + e.message }; }
  const vars = [...new Set(toks.filter((t) => /^[a-z]$/.test(t)))].sort();
  if (vars.length > 6) return { ok: false, error: "that has " + vars.length + " variables; I cap truth tables at 6 (64 rows)" };
  const rows = []; const n = vars.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    const env = {}; vars.forEach((v, idx) => { env[v] = !!(mask & (1 << (n - 1 - idx))); });
    let out; try { out = !!fn(env); } catch (e) { return { ok: false, error: e.message }; }
    rows.push({ assign: env, out });
  }
  const trues = rows.filter((r) => r.out).length;
  const tautology = trues === rows.length, contradiction = trues === 0;
  return { ok: true, expr, vars, rows, tautology, contradiction };
}

// ---------------------------------------------------------------------------
// setOps: union / intersection / difference / symmetric difference of two sets,
// given as {a,b,c} and {b,c,d}, [..] and [..], or "... of X,Y and Z,W".
// ---------------------------------------------------------------------------
export function setOps(input) {
  const raw = String(input || ""); const low = raw.toLowerCase();
  let A, B;
  const groups = (raw.match(/\{[^}]*\}|\[[^\]]*\]/g) || []).map((g) => g.slice(1, -1));
  if (groups.length >= 2) { A = groups[0]; B = groups[1]; }
  else { const m = raw.match(/(?:of|between)\s+(.+?)\s+and\s+(.+)$/i); if (m) { A = m[1]; B = m[2]; } }
  if (A == null || B == null) return { ok: false, error: "give two sets, e.g. {1,2,3} and {2,3,4}" };
  const parse = (s) => [...new Set(s.replace(/[{}\[\]]/g, "").split(/[,\s]+/).map((x) => x.trim()).filter(Boolean))];
  const a = parse(A), b = parse(B), as = new Set(a), bs = new Set(b);
  let op, result;
  if (/intersection|∩|in both|common/.test(low)) { op = "intersection"; result = a.filter((x) => bs.has(x)); }
  else if (/symmetric/.test(low)) { op = "symmetric difference"; result = [...a.filter((x) => !bs.has(x)), ...b.filter((x) => !as.has(x))]; }
  else if (/difference|minus|except|not in|\bremove\b|subtract|\\/.test(low)) { op = "difference"; result = a.filter((x) => !bs.has(x)); }
  else { op = "union"; result = [...new Set([...a, ...b])]; }
  return { ok: true, op, a, b, result };
}

// ---------------------------------------------------------------------------
// combinatorics: combinations (nCr), permutations (nPr), arrangements (n!), and
// a few clearly-defined probability forms. Exact integer arithmetic; states its
// assumption for probability rather than guessing a scenario.
// ---------------------------------------------------------------------------
export function combinatorics(input) {
  const low = String(input || "").toLowerCase();
  const nums = (low.match(/\d+/g) || []).map(Number);
  const nCr = (n, r) => { if (r < 0 || r > n) return 0; r = Math.min(r, n - r); let c = 1; for (let i = 0; i < r; i++) c = c * (n - i) / (i + 1); return Math.round(c); };
  const nPr = (n, r) => { if (r < 0 || r > n) return 0; let p = 1; for (let i = 0; i < r; i++) p *= (n - i); return p; };
  const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const nr = () => (/\bfrom\b|out of/.test(low) ? { r: nums[0], n: nums[1] } : { n: nums[0], r: nums[1] });
  if (/\bchoose\b|combinations?|\bcombos?\b|\bncr\b/.test(low) && nums.length >= 2) {
    const { n, r } = nr(); return { ok: true, op: "combinations", n, r, value: nCr(n, r), formula: "C(" + n + ", " + r + ") = " + n + "! / (" + r + "! (" + n + "-" + r + ")!)" };
  }
  if (/permutations?|\bpermute\b|\bnpr\b/.test(low) && nums.length >= 2) {
    const { n, r } = nr(); return { ok: true, op: "permutations", n, r, value: nPr(n, r), formula: "P(" + n + ", " + r + ") = " + n + "! / (" + n + "-" + r + ")!" };
  }
  if (/(ways to (arrange|order)|arrangements? of|permutations of)\b/.test(low) && nums.length >= 1) {
    const n = nums[0]; return { ok: true, op: "arrangements", n, value: fact(n), formula: n + "!" };
  }
  if (/probability|\bchance\b|\bodds\b/.test(low)) {
    if (/coin|heads?\b|tails?\b/.test(low)) {
      // "two heads", "3 tails in a row": number words count too, or "two heads" read as 1 flip
      const W = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twice: 2 };
      const cn = (low.replace(/\b(one|an?|two|three|four|five|six|seven|eight|nine|ten)\b(?=\s+(?:heads?|tails?|coins?|flips?|tosses?|times?))/g, (w) => String(W[w])).match(/\d+/g) || []).map(Number);
      const r6 = (x) => Math.round(x * 1e9) / 1e9;
      const flips = (low.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:coin\s+)?(?:flips|tosses|coins|times)\b/) || [])[1];
      const n = flips ? (W[flips] || +flips) : null;
      // "at least one head in 3 flips" is the complement, not 1/2^k
      if (/at least (?:one|1|a)\b/.test(low) && n) return { ok: true, op: "probability", value: r6(1 - 1 / 2 ** n), text: "P = 1 - 1/2^" + n + " = " + r6(1 - 1 / 2 ** n) + " (at least one in " + n + " fair flips = 1 minus the chance of none)" };
      // "exactly 2 heads in 5 flips" is binomial
      const ex = low.match(/exactly\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:heads?|tails?)/);
      if (ex && n) { const k = W[ex[1]] || +ex[1]; const v = nCr(n, k) / 2 ** n; return { ok: true, op: "probability", value: r6(v), text: "P = C(" + n + ", " + k + ") / 2^" + n + " = " + nCr(n, k) + "/" + 2 ** n + " = " + r6(v) + " (exactly " + k + " in " + n + " fair flips)" }; }
      if (/at least|at most|or more|or fewer|or less/.test(low)) return { ok: false, error: "I can do \"at least one\" or \"exactly k in n flips\"; say it that way and I will compute it exactly" };
      const k = cn[0] || 1; return { ok: true, op: "probability", value: r6(1 / 2 ** k), text: "P = 1/2^" + k + " = " + r6(1 / 2 ** k) + " (assuming " + k + " independent fair coin flip" + (k === 1 ? "" : "s") + ")" };
    }
    if (/die|dice|roll/.test(low)) { return { ok: true, op: "probability", value: Math.round((1 / 6) * 1e6) / 1e6, text: "P = 1/6 = 0.166667 (one specific face on a fair 6-sided die)" }; }
    if (nums.length >= 2 && /out of|\/|in\b/.test(low)) { return { ok: true, op: "probability", value: Math.round((nums[0] / nums[1]) * 1e9) / 1e9, text: nums[0] + "/" + nums[1] + " = " + (nums[0] / nums[1]) }; }
  }
  return { ok: false, error: "try '10 choose 3', 'permutations of 3 from 10', 'ways to arrange 5', or 'probability of 3 heads in a row'" };
}

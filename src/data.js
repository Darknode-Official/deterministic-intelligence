// Universal Engine — data + number-representation skills. Deterministic, no imports
// (unit-testable in Node), no AI. Sources: CSV analysis, number-base conversion,
// and Roman numerals.

const r9 = (n) => Math.round(n * 1e9) / 1e9;

// ---------------------------------------------------------------------------
// CSV: an RFC-4180-ish parser (quoted fields, doubled quotes, CRLF) + a per-column
// analysis that infers numeric vs text columns and summarizes each.
// ---------------------------------------------------------------------------
export function parseCSV(text) {
  const s = String(text || "").replace(/\r\n?/g, "\n");
  const rows = []; let row = [], field = "", inQ = false, i = 0;
  while (i < s.length) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const clean = rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
  if (!clean.length) return { headers: [], rows: [] };
  return { headers: clean[0].map((h) => h.trim()), rows: clean.slice(1) };
}

export function analyzeCSV(text) {
  const { headers, rows } = parseCSV(text);
  if (!headers.length || !rows.length) return { ok: false, error: "no CSV rows found (need a header line and at least one data row)" };
  const cols = headers.map((name, idx) => {
    const vals = rows.map((r) => (r[idx] === undefined ? "" : r[idx].trim())).filter((v) => v !== "");
    const nums = vals.map(Number).filter((n) => Number.isFinite(n));
    if (vals.length && nums.length === vals.length) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const sorted = nums.slice().sort((a, b) => a - b);
      return { name, type: "numeric", count: nums.length, sum: r9(sum), mean: r9(sum / nums.length), min: sorted[0], max: sorted[sorted.length - 1] };
    }
    const freq = new Map(); for (const v of vals) freq.set(v, (freq.get(v) || 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 3).map(([v, c]) => v + " (" + c + ")");
    return { name, type: "text", count: vals.length, distinct: freq.size, top };
  });
  return { ok: true, rows: rows.length, columns: headers.length, cols };
}

// ---------------------------------------------------------------------------
// number base conversion + Roman numerals
// ---------------------------------------------------------------------------
const ROMAN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
export function toRoman(n) { n = Math.trunc(n); if (n < 1 || n > 3999) return null; let s = ""; for (const [v, sym] of ROMAN) while (n >= v) { s += sym; n -= v; } return s; }
export function fromRoman(str) {
  const s = String(str).toUpperCase(); const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0, prev = 0;
  for (let i = s.length - 1; i >= 0; i--) { const v = map[s[i]]; if (!v) return null; if (v < prev) total -= v; else { total += v; prev = v; } }
  return total;
}
export function numberBase(input) {
  const low = String(input || "").toLowerCase();
  if (/roman/.test(low)) {
    const n = (low.match(/\d+/) || [])[0];
    if (n) { const r = toRoman(+n); return r ? { ok: true, kind: "roman", text: n + " = " + r } : { ok: false, error: "Roman numerals cover 1 to 3999" }; }
    const rm = low.match(/\b([ivxlcdm]{2,})\b/);
    if (rm) { const v = fromRoman(rm[1]); return v ? { ok: true, kind: "roman", text: rm[1].toUpperCase() + " = " + v } : { ok: false, error: "invalid Roman numeral" }; }
    return { ok: false, error: "give a number 1..3999 or a Roman numeral" };
  }
  const m = low.match(/(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)\s*(?:to|in|into|as)\s*(hex\w*|bin\w*|oct\w*|dec\w*|base\s*\d+)/);
  if (!m) return { ok: false, error: "try: 255 to hex, 0xff to binary, 42 in binary, 12 to roman" };
  const t = m[1]; let v;
  if (/^0x/.test(t)) v = parseInt(t.slice(2), 16); else if (/^0b/.test(t)) v = parseInt(t.slice(2), 2);
  else if (/^0o/.test(t)) v = parseInt(t.slice(2), 8); else v = parseInt(t, 10);
  const tgt = m[2]; let radix = 10;
  if (/^hex/.test(tgt)) radix = 16; else if (/^bin/.test(tgt)) radix = 2; else if (/^oct/.test(tgt)) radix = 8;
  else if (/^dec/.test(tgt)) radix = 10; else { const bm = tgt.match(/base\s*(\d+)/); if (bm) radix = +bm[1]; }
  if (radix < 2 || radix > 36) return { ok: false, error: "base must be between 2 and 36" };
  if (!Number.isFinite(v)) return { ok: false, error: "that number is not a valid " + (/^0x/.test(t) ? "hexadecimal" : /^0b/.test(t) ? "binary" : /^0o/.test(t) ? "octal" : "decimal") + " literal" };
  if (v > Number.MAX_SAFE_INTEGER) return { ok: false, error: "that number is above 2^53, where this converter would lose digits" };
  const out = v.toString(radix);
  const pretty = radix === 16 ? "0x" + out : radix === 2 ? "0b" + out : radix === 8 ? "0o" + out : out;
  // name the source base whenever the input was not plain decimal, so "0b1010 to decimal" reads as a conversion
  const srcName = /^0x/.test(t) ? "hexadecimal" : /^0b/.test(t) ? "binary" : /^0o/.test(t) ? "octal" : null;
  const lhs = srcName ? t + " (" + srcName + ")" : String(v);
  return { ok: true, kind: "base", value: out, radix, text: lhs + " = " + pretty + (radix !== 10 ? " (base " + radix + ")" : radix === 10 && srcName ? " (decimal)" : "") };
}

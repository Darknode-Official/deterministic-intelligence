// Universal Engine (DI) — more skills: color conversion and JSON path queries.
// Deterministic, self-contained (no imports), no AI.

// ---------------------------------------------------------------------------
// color: convert between hex, rgb, and hsl. Reports all three representations.
// ---------------------------------------------------------------------------
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) { const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0"); return "#" + h(r) + h(g) + h(b); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100; let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = hue(p, q, h + 1 / 3); g = hue(p, q, h); b = hue(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
export function colorConvert(input) {
  const low = String(input || "").toLowerCase();
  const rgbm = low.match(/rgba?\s*\(?\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/);
  const hslm = low.match(/hsl\s*\(?\s*(\d+)[ ,]+(\d+)%?[ ,]+(\d+)%?/);
  const hexm = low.match(/#?\b([0-9a-f]{6}|[0-9a-f]{3})\b/);
  let rgb = null, src = "";
  if (rgbm) { rgb = { r: +rgbm[1], g: +rgbm[2], b: +rgbm[3] }; src = "rgb"; }
  else if (hslm) { rgb = hslToRgb(+hslm[1], +hslm[2], +hslm[3]); src = "hsl"; }
  else if (hexm) { rgb = hexToRgb(hexm[1]); src = "hex"; }
  if (!rgb) return { ok: false, error: "give a color: #ff8800, rgb(255,136,0), or hsl(32,100%,50%)" };
  if (rgb.r > 255 || rgb.g > 255 || rgb.b > 255) return { ok: false, error: "rgb components must be 0 to 255" };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return { ok: true, src, hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` };
}

// ---------------------------------------------------------------------------
// jsonQuery: navigate a JSON value by a dotted/bracketed path (a small JSONPath).
// Supports .key, [index], ["key"], and chains like .users[0].name.
// ---------------------------------------------------------------------------
export function navigate(data, path) {
  const toks = String(path).replace(/^\$?\.?/, "").match(/[a-z_$][\w$]*|\[\d+\]|\[".*?"\]|\['.*?'\]|\.[a-z_$][\w$]*/gi);
  if (!toks) return undefined;
  let cur = data;
  for (let t of toks) {
    if (cur == null) return undefined;
    if (t[0] === ".") t = t.slice(1);
    if (t[0] === "[") {
      const inner = t.slice(1, -1);
      cur = (inner[0] === '"' || inner[0] === "'") ? cur[inner.slice(1, -1)] : cur[parseInt(inner, 10)];
    } else cur = cur[t];
  }
  return cur;
}
export function jsonQuery(input) {
  const str = String(input || "");
  // an object "{...}" first, so a path's [0] brackets are not mistaken for the JSON
  const jm = str.match(/(\{[\s\S]*\})/) || str.match(/(\[[\s\S]*\])/);
  if (!jm) return { ok: false, error: "include a JSON object or array to query" };
  let data;
  try { data = JSON.parse(jm[1]); } catch (e) { return { ok: false, error: "invalid JSON: " + e.message }; }
  const before = input.slice(0, jm.index);
  const pm = before.match(/(?:get|query|path|value of|field|extract)\s+([$.\[\]\w"'-]+)/i)
    || input.match(/\$?(\.[$\w]+(?:\[\d+\]|\.[$\w]+|\["[^"]*"\])*)/)
    || before.match(/([$\w]+(?:\[\d+\]|\.[$\w]+)*)\s*(?:in|from|of)\b/i);
  const path = pm ? pm[1] : "";
  if (!path) return { ok: false, error: "specify a path like .users[0].name" };
  const val = navigate(data, path);
  if (val === undefined) return { ok: false, error: "path '" + path + "' not found in the JSON" };
  return { ok: true, path, type: Array.isArray(val) ? "array" : typeof val, value: (val !== null && typeof val === "object") ? JSON.stringify(val) : String(val) };
}

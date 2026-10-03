// Deterministic linear algebra for DI: matrices and vectors. No model, no libs.
// Parses [[1,2],[3,4]] / [1,2,3] literals and does exact-as-float arithmetic:
// add, subtract, scalar, multiply, transpose, determinant, inverse (Gauss-Jordan),
// plus vector dot, cross, and magnitude. Imports nothing (Node-testable).

const r9 = (x) => Math.round(x * 1e9) / 1e9;
function tryParse(str) { try { const v = JSON.parse(str); return v; } catch (_) { return null; } }
function isMatrix(v) { return Array.isArray(v) && v.length > 0 && v.every((r) => Array.isArray(r) && r.every((x) => typeof x === "number")) && v.every((r) => r.length === v[0].length); }
function isVector(v) { return Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "number"); }

export function transpose(a) { return a[0].map((_, j) => a.map((row) => row[j])); }
export function matAdd(a, b, sign = 1) {
  if (a.length !== b.length || a[0].length !== b[0].length) throw new Error("matrices must be the same size");
  return a.map((row, i) => row.map((x, j) => r9(x + sign * b[i][j])));
}
export function scalar(a, k) { return a.map((row) => row.map((x) => r9(x * k))); }
export function matMul(a, b) {
  if (a[0].length !== b.length) throw new Error("inner dimensions must match: " + a.length + "x" + a[0].length + " times " + b.length + "x" + b[0].length);
  return a.map((row) => b[0].map((_, j) => r9(row.reduce((s, _, k) => s + row[k] * b[k][j], 0))));
}
export function determinant(m) {
  const n = m.length;
  if (n !== m[0].length) throw new Error("determinant needs a square matrix");
  const a = m.map((r) => r.slice()); let det = 1;
  for (let col = 0; col < n; col++) {
    let piv = col; for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    if (Math.abs(a[piv][col]) < 1e-12) return 0;
    if (piv !== col) { [a[piv], a[col]] = [a[col], a[piv]]; det = -det; }
    det *= a[col][col];
    for (let r = col + 1; r < n; r++) { const f = a[r][col] / a[col][col]; for (let c = col; c < n; c++) a[r][c] -= f * a[col][c]; }
  }
  return r9(det);
}
export function inverse(m) {
  const n = m.length;
  if (n !== m[0].length) throw new Error("only a square matrix has an inverse");
  const a = m.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let piv = col; for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    if (Math.abs(a[piv][col]) < 1e-12) throw new Error("matrix is singular (no inverse)");
    [a[piv], a[col]] = [a[col], a[piv]];
    const d = a[col][col]; for (let c = 0; c < 2 * n; c++) a[col][c] /= d;
    for (let r = 0; r < n; r++) if (r !== col) { const f = a[r][col]; for (let c = 0; c < 2 * n; c++) a[r][c] -= f * a[col][c]; }
  }
  return a.map((row) => row.slice(n).map(r9));
}
export function dot(u, v) { if (u.length !== v.length) throw new Error("vectors must be the same length"); return r9(u.reduce((s, x, i) => s + x * v[i], 0)); }
export function cross(u, v) { if (u.length !== 3 || v.length !== 3) throw new Error("cross product needs two 3D vectors"); return [r9(u[1] * v[2] - u[2] * v[1]), r9(u[2] * v[0] - u[0] * v[2]), r9(u[0] * v[1] - u[1] * v[0])]; }
export function magnitude(v) { return r9(Math.sqrt(v.reduce((s, x) => s + x * x, 0))); }

const fmtMat = (m) => m.map((r) => "[" + r.join(", ") + "]").join("\n");

// Route + run a linear-algebra request from natural text.
export function linalg(input) {
  const low = String(input || "").toLowerCase();
  // collect matrix ([[...]]) and vector ([n,n,...]) literals
  const mats = []; const vecs = [];
  for (const m of String(input || "").matchAll(/\[\s*\[[\s\S]*?\]\s*\]/g)) { const v = tryParse(m[0].replace(/\s+/g, "")); if (isMatrix(v)) mats.push(v); }
  const noMats = String(input || "").replace(/\[\s*\[[\s\S]*?\]\s*\]/g, " ");
  for (const m of noMats.matchAll(/\[\s*-?\d[^\[\]]*\]/g)) { const v = tryParse(m[0].replace(/\s+/g, "")); if (isVector(v)) vecs.push(v); }

  try {
    if (/cross product|\bcross\b/.test(low) && vecs.length >= 2) return { ok: true, kind: "vector", op: "cross product", vector: cross(vecs[0], vecs[1]) };
    if (/dot product|\bdot\b|scalar product/.test(low) && vecs.length >= 2) return { ok: true, kind: "scalar", op: "dot product", value: dot(vecs[0], vecs[1]) };
    if (/magnitude|\bnorm\b|length of/.test(low) && vecs.length >= 1) return { ok: true, kind: "scalar", op: "magnitude", value: magnitude(vecs[0]) };
    if (vecs.length >= 2 && /\+|plus|add/.test(low)) return { ok: true, kind: "vector", op: "vector sum", vector: vecs[0].map((x, i) => r9(x + vecs[1][i])) };

    if (/transpose/.test(low) && mats.length) return { ok: true, kind: "matrix", op: "transpose", matrix: transpose(mats[0]), text: fmtMat(transpose(mats[0])) };
    if (/(determinant|\bdet\b)/.test(low) && mats.length) return { ok: true, kind: "scalar", op: "determinant", value: determinant(mats[0]) };
    if (/invers|invert/.test(low) && mats.length) { const inv = inverse(mats[0]); return { ok: true, kind: "matrix", op: "inverse", matrix: inv, text: fmtMat(inv) }; }
    if (mats.length >= 2 && /(multiply|product|times|\*)/.test(low)) { const p = matMul(mats[0], mats[1]); return { ok: true, kind: "matrix", op: "product", matrix: p, text: fmtMat(p) }; }
    if (mats.length >= 2 && /(subtract|minus|-)/.test(low)) { const p = matAdd(mats[0], mats[1], -1); return { ok: true, kind: "matrix", op: "difference", matrix: p, text: fmtMat(p) }; }
    if (mats.length >= 2 && /(add|plus|\+|sum)/.test(low)) { const p = matAdd(mats[0], mats[1]); return { ok: true, kind: "matrix", op: "sum", matrix: p, text: fmtMat(p) }; }
    const km = low.match(/(?:times|multiply by|scale by|scalar)\s*(-?\d+(?:\.\d+)?)/) || low.match(/(-?\d+(?:\.\d+)?)\s*(?:times|\*)/);
    if (mats.length && km) { const p = scalar(mats[0], parseFloat(km[1])); return { ok: true, kind: "matrix", op: "scalar multiple", matrix: p, text: fmtMat(p) }; }
  } catch (e) { return { ok: false, error: e.message }; }
  if (!mats.length && !vecs.length) return { ok: false, error: "give a matrix like [[1,2],[3,4]] or a vector like [1,2,3]" };
  return { ok: false, error: "say what to do: transpose, determinant, inverse, multiply, add, dot product, cross product, or magnitude" };
}

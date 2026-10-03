// Unit-aware arithmetic for DI: add and subtract physical quantities that use
// different units of the same dimension ("5 km + 300 m", "2 hours + 45 minutes",
// "3 kg - 500 g"), with an optional "in <unit>" to choose the output unit.
// Deterministic, fixed factors, imports nothing (Node-testable).

const GROUPS = {
  length: { m: 1, meter: 1, meters: 1, metre: 1, metres: 1, km: 1000, kilometer: 1000, kilometers: 1000, kilometre: 1000, kilometres: 1000, cm: 0.01, centimeter: 0.01, centimeters: 0.01, mm: 0.001, millimeter: 0.001, millimeters: 0.001, mi: 1609.344, mile: 1609.344, miles: 1609.344, yd: 0.9144, yard: 0.9144, yards: 0.9144, ft: 0.3048, foot: 0.3048, feet: 0.3048, in: 0.0254, inch: 0.0254, inches: 0.0254 },
  mass: { g: 1, gram: 1, grams: 1, kg: 1000, kilogram: 1000, kilograms: 1000, mg: 0.001, milligram: 0.001, milligrams: 0.001, t: 1e6, tonne: 1e6, tonnes: 1e6, lb: 453.59237, lbs: 453.59237, pound: 453.59237, pounds: 453.59237, oz: 28.349523, ounce: 28.349523, ounces: 28.349523 },
  time: { s: 1, sec: 1, secs: 1, second: 1, seconds: 1, ms: 0.001, millisecond: 0.001, milliseconds: 0.001, min: 60, mins: 60, minute: 60, minutes: 60, h: 3600, hr: 3600, hrs: 3600, hour: 3600, hours: 3600, day: 86400, days: 86400, week: 604800, weeks: 604800 },
  data: { b: 1, byte: 1, bytes: 1, kb: 1024, kilobyte: 1024, kilobytes: 1024, mb: 1048576, megabyte: 1048576, megabytes: 1048576, gb: 1073741824, gigabyte: 1073741824, gigabytes: 1073741824, tb: 1099511627776, terabyte: 1099511627776, terabytes: 1099511627776 },
};
const LOOKUP = {};
for (const dim in GROUPS) for (const u in GROUPS[dim]) LOOKUP[u] = { dim, factor: GROUPS[dim][u] };

const r9 = (x) => Math.round(x * 1e9) / 1e9;

export function unitMath(input) {
  let s = String(input || "").toLowerCase().replace(/(\d),(\d)/g, "$1$2");
  // optional "... in <unit>" chooses the output unit
  let outUnit = null;
  const im = s.match(/\bin\s+([a-z]+)\s*$/);
  if (im && LOOKUP[im[1]]) { outUnit = im[1]; s = s.slice(0, im.index); }
  const re = /([+\-]?)\s*(\d+(?:\.\d+)?)\s*([a-z]+)/g;
  const terms = []; let m;
  while ((m = re.exec(s))) { const u = m[3]; if (!LOOKUP[u]) continue; terms.push({ sign: m[1] === "-" ? -1 : 1, val: parseFloat(m[2]), unit: u }); }
  if (terms.length < 2) return { ok: false, error: "give at least two quantities to combine, e.g. 5 km + 300 m" };
  const dim = terms[0].unit ? LOOKUP[terms[0].unit].dim : null;
  if (terms.some((t) => LOOKUP[t.unit].dim !== dim)) return { ok: false, error: "the quantities are not the same kind (mixing " + [...new Set(terms.map((t) => LOOKUP[t.unit].dim))].join(" and ") + ")" };
  const base = terms.reduce((acc, t) => acc + t.sign * t.val * LOOKUP[t.unit].factor, 0);
  const unit = outUnit || terms[0].unit;
  if (outUnit && LOOKUP[outUnit].dim !== dim) return { ok: false, error: "cannot express a " + dim + " in " + outUnit };
  const value = r9(base / LOOKUP[unit].factor);
  return { ok: true, dim, value, unit, base: r9(base), expr: terms.map((t, i) => (i ? (t.sign < 0 ? " - " : " + ") : "") + t.val + " " + t.unit).join("") };
}

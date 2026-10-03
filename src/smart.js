// Smart mode (OPTIONAL, off by default): an online LANGUAGE FRONT-END for DI.
// The request goes to Darknode's server (/api/smart on the site's Worker proxy),
// which plans it into commands the deterministic engine understands, or writes
// the answer itself (code, explanations) when no engine rule applies. Whenever
// the request reduces to an engine capability, DI still computes the answer, so
// the result stays exact and verifiable. The server holds the only key; nothing
// secret is shipped to the browser, and the user needs no key of their own.
//
// This module is browser-only (fetch) and is NOT imported by the deterministic
// engine or its Node tests, so the core stays model-free and fully offline.

const DEFAULT_URL = "https://darknode-proxy.darknode-ai.workers.dev/api/smart";

function smartUrl() {
  try { if (typeof window !== "undefined" && window.DARKNODE_SMART_URL) return window.DARKNODE_SMART_URL; } catch (_) {}
  return DEFAULT_URL;
}
// kept for engine-tab.js: Smart mode no longer needs a key from the user
export function hasSmartKey() { return true; }

// history: [{ q, a }] of recent turns (a = a short text summary of DI's answer),
// so a follow-up like "now do it in rust" has its context.
export async function smartInterpret(input, history = []) {
  const body = {
    input: String(input || "").slice(0, 6000),
    history: (history || []).slice(-6).filter((h) => h && h.q).map((h) => ({ q: String(h.q).slice(0, 2000), a: String(h.a || "").slice(0, 600) })),
  };
  let r;
  try { r = await fetch(smartUrl(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
  catch (_) { return { ok: false, error: "Smart mode could not connect. Check your connection, or turn Smart mode off to keep working on-device." }; }
  let j = null; try { j = await r.json(); } catch (_) { j = null; }
  if (!r.ok || !j || j.error) return { ok: false, error: (j && j.error) || ("Smart mode had a problem (" + r.status + "). Try again in a moment.") };
  const steps = Array.isArray(j.steps) ? j.steps.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()).slice(0, 12) : [];
  const answer = typeof j.answer === "string" && j.answer.trim() ? j.answer : null;
  return { ok: true, steps, command: steps[0] || null, answer };
}

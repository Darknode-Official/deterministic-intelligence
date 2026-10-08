// Game synthesis — the gen.js idea (read a request into a plan, EMIT code from
// grammar/parts) applied to playable games. There is NO stored whole-game
// template here: a request is parsed into a GAME PLAN (genre, theme, palette,
// field, difficulty, entity labels) and a complete self-contained HTML/canvas
// game is COMPOSED from parameterized parts — input binding, spawner, motion,
// collision, HUD, render. Same request -> byte-identical source (a seeded PRNG
// keyed off the words fixes every "random" choice); different requests -> a
// structurally different game. No model, no network, no retrieved answers.
//
// plan = { genre, title, lead, theme, palette, field:{w,h}, player, enemyLabel,
//          lives, speed, spawnRate, starfield }
//   genre: "shooter" | "dodger" | "collector" | "jumper"  (the core composed)
//   theme/palette/labels/difficulty: tuned from the sentence + the seed

// --- deterministic seed: the same sentence always yields the same program ---
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

// --- vocabulary: how words map to a plan (the game "grammar") ---
const GENRES = [
  { id: "shooter", title: "Shooter", re: /\bgun game\b|\bshooting game\b|\bshoot ?[’']?em ?up\b|\b(?:shooter|space ?shooter|shmup|galaga|galaxian)\b/ },
  { id: "collector", title: "Catcher", re: /\b(?:catch(?:er|ing)?|collect(?:or|ing)?|basket|harvest)\b/ },
  { id: "jumper", title: "Runner", re: /\b(?:jump(?:er|ing)?|runner|endless runner|dino|flappy|platformer|hopper)\b/ },
  { id: "dodger", title: "Dodger", re: /\b(?:dodge[rn]?|dodging|avoid(?:er|ing)?|survive|survival|falling|asteroid field|meteor shower)\b/ },
];
// generic "a game" with no genre word still synthesizes something playable
const GAME_WORD = /\b(game|arcade|mini[- ]?game)\b/;

const THEMES = [
  { re: /\b(space|galaxy|galactic|cosmic|star|alien|ufo|asteroid|meteor)\b/, enemy: "alien", palette: "space", star: true },
  { re: /\b(zombie|undead|monster|ghost|skeleton)\b/, enemy: "zombie", palette: "toxic", star: false },
  { re: /\b(neon|cyber|synth|retro ?wave|vapor)\b/, enemy: "drone", palette: "neon", star: true },
  { re: /\b(fruit|apple|food|cook|kitchen)\b/, enemy: "fruit", palette: "forest", star: false },
  { re: /\b(bird|flappy|sky|cloud)\b/, enemy: "pipe", palette: "sky", star: false },
];
const PALETTES = {
  space: { bg: "#05050c", fg: "#e8f0ff", player: "#4df3ff", enemy: "#ff5c7a", bullet: "#ffe14d", accent: "#30304a" },
  neon: { bg: "#0d0221", fg: "#fdf0ff", player: "#00f6ff", enemy: "#ff2bd6", bullet: "#fdff8f", accent: "#3a1f5d" },
  toxic: { bg: "#0a1008", fg: "#eaffea", player: "#8cff5a", enemy: "#b45cff", bullet: "#e8ff6b", accent: "#1f3a1a" },
  forest: { bg: "#0c160c", fg: "#f0fff0", player: "#ffcf4d", enemy: "#5cff8f", bullet: "#fff0a8", accent: "#1f3a24" },
  sky: { bg: "#0a1830", fg: "#eef7ff", player: "#ffd34d", enemy: "#5ad1ff", bullet: "#fff2a8", accent: "#1d3350" },
  mono: { bg: "#08080a", fg: "#ffffff", player: "#ffffff", enemy: "#9aa0b4", bullet: "#ffd34d", accent: "#2a2a30" },
};

function detect(low, list) { for (const x of list) if (x.re.test(low)) return x; return null; }

// A request -> a game plan, or null when it is not a game-build request.
export function parseGameSpec(request) {
  const low = String(request || "").toLowerCase();
  // Named games that need rules DI's arcade primitives do not cover — declined
  // honestly rather than substituted with a lookalike.
  const UNSUPPORTED = /\b(chess|checkers|draughts|poker|blackjack|solitaire|sudoku|minesweeper|tetris|2048|mario|pac[- ]?man|battleship|mahjong|scrabble|monopoly|rubik|crossword|wordle|rpg|mmo|fps|racing|racer)\b/;
  const rnd = rng32(hashStr(low));
  let genre = detect(low, GENRES);
  if (!genre) {
    if (UNSUPPORTED.test(low)) return null;                        // specific game outside the primitives
    if (!GAME_WORD.test(low)) return null;                         // not a game-build request
    genre = pick(rnd, GENRES.filter((x) => x.id !== "jumper"));    // generic "make a game" -> a seeded arcade genre
  }
  if (!genre) return null;
  const theme = detect(low, THEMES);
  const palette = PALETTES[(theme && theme.palette) || pick(rnd, ["space", "neon", "mono", "forest"])];
  const enemyLabel = theme ? theme.enemy : (genre.id === "collector" ? "gem" : genre.id === "jumper" ? "block" : "foe");
  const portrait = genre.id !== "jumper";
  const field = portrait ? { w: 420 + Math.floor(rnd() * 3) * 30, h: 620 + Math.floor(rnd() * 3) * 20 } : { w: 640, h: 360 };
  // difficulty tuned from words + seed, clamped to playable ranges
  const hard = /\b(hard|insane|fast|brutal|intense)\b/.test(low);
  const easy = /\b(easy|slow|chill|relaxed|simple)\b/.test(low);
  const speed = +(1.1 + rnd() * 0.8 + (hard ? 0.9 : 0) - (easy ? 0.4 : 0)).toFixed(2);
  const spawnRate = Math.round(78 - rnd() * 18 - (hard ? 22 : 0) + (easy ? 18 : 0));
  const lives = genre.id === "jumper" ? 1 : easy ? 5 : hard ? 2 : 3;

  const niceGenre = { shooter: "shooter", dodger: "dodge", collector: "catch", jumper: "runner" }[genre.id];
  const themeWord = theme ? theme.enemy.replace(/^\w/, (c) => c.toUpperCase()) + " " : "";
  const title = (themeWord + genre.title).trim();

  return { genre: genre.id, title, theme: theme ? theme.palette : "mono", palette, field, enemyLabel, lives, speed, spawnRate, starfield: !!(theme && theme.star), niceGenre };
}

// --------------------------------------------------------------------------
// Parts. Each returns a code fragment; the genre bodies below compose them.
// --------------------------------------------------------------------------
function cssBlock(p) {
  return [
    "  body { margin:0; background:" + p.palette.bg + "; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; color:" + p.palette.fg + "; font-family:system-ui,sans-serif; }",
    "  canvas { border:2px solid " + p.palette.accent + "; max-width:95vw; background:" + p.palette.bg + "; touch-action:none; }",
    "  p { opacity:.7; font-size:14px; margin:10px 16px; text-align:center; }",
  ].join("\n");
}
function starDecls(p) {
  if (!p.starfield) return { decl: "", init: "", step: "", draw: "" };
  return {
    decl: "let stars;",
    init: "  stars = []; for (let i=0;i<64;i++) stars.push({ x:Math.random()*W, y:Math.random()*H, s:Math.random()*2+0.5 });",
    step: "  for (const st of stars) { st.y += st.s; if (st.y > H) { st.y = 0; st.x = Math.random()*W; } }",
    draw: '  ctx.fillStyle = "' + p.palette.accent + '"; for (const st of stars) ctx.fillRect(st.x, st.y, st.s, st.s);',
  };
}
function hudDraw(p, withLives) {
  const lines = [
    '  ctx.fillStyle = "' + p.palette.fg + '"; ctx.font = "18px monospace";',
    '  ctx.textAlign = "left"; ctx.fillText("Score " + score, 12, 26);',
  ];
  if (withLives) lines.push('  ctx.textAlign = "right"; ctx.fillText("Lives " + lives, W - 12, 26);');
  else lines.push('  ctx.textAlign = "right"; ctx.fillText("Best " + best, W - 12, 26);');
  return lines.join("\n");
}
function gameOverDraw(p, hint) {
  return [
    "  if (over) {",
    '    ctx.textAlign = "center"; ctx.fillStyle = "' + p.palette.fg + '";',
    '    ctx.font = "40px monospace"; ctx.fillText("GAME OVER", W/2, H/2 - 18);',
    '    ctx.font = "18px monospace"; ctx.fillText("Score " + score + "   Best " + best, W/2, H/2 + 14);',
    '    ctx.fillText("' + hint + '", W/2, H/2 + 44);',
    "  }",
  ].join("\n");
}
function skeleton(p, instructions, script) {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<title>" + p.title + "</title>",
    "<style>",
    cssBlock(p),
    "</style>",
    "</head>",
    "<body>",
    '<canvas id="game" width="' + p.field.w + '" height="' + p.field.h + '"></canvas>',
    "<p>" + instructions + "</p>",
    "<script>",
    script,
    "</" + "script>",
    "</body>",
    "</html>",
  ].join("\n");
}

// --- shared falling-entity genres: shooter / dodger / collector -------------
// They share a horizontal player and top-spawned fallers, and differ only in
// what a hit means (shoot to kill / avoid / catch) — composed from flags.
function fallingGame(p, mode) {
  const st = starDecls(p);
  const shoot = mode === "shooter";
  const catchMode = mode === "collector";
  const entName = catchMode ? "items" : "foes";
  const decls = ["let player, " + entName + ", score, best = 0, lives, over, spawnTimer;", shoot ? "let bullets, cooldown;" : "", st.decl].filter(Boolean).join("\n");

  const instr = (shoot
    ? "Move: Arrow keys / A D / mouse. Shoot: Space / click."
    : catchMode ? "Move the basket: Arrow keys / A D / mouse. Catch the " + p.enemyLabel + "s."
      : "Move: Arrow keys / A D / mouse. Dodge the falling " + p.enemyLabel + "s.") + " " + p.lives + " lives.";

  const reset = [
    "function reset() {",
    "  player = { x: W/2, y: H - 46, w: 36, h: 20, speed: 6 };",
    "  " + entName + " = [];",
    shoot ? "  bullets = []; cooldown = 0;" : "",
    "  score = 0; lives = " + p.lives + "; over = false; spawnTimer = 0;",
    st.init,
    "}",
  ].filter(Boolean).join("\n");

  const helpers = [
    "function spawn() {",
    "  " + entName + ".push({ x: 22 + Math.random()*(W-44), y: -18, r: 15, vy: " + p.speed + " + Math.random()*1.1 + score/500 });",
    "}",
    shoot ? "function fire() { if (over || cooldown > 0) return; bullets.push({ x: player.x, y: player.y - player.h/2 }); cooldown = 9; }" : "",
    "function loseLife() { lives--; if (lives <= 0) { over = true; best = Math.max(best, score); } }",
  ].filter(Boolean).join("\n");

  // update(): motion + spawn + collisions, assembled from the mode flags
  const upd = [];
  upd.push("function update() {");
  if (st.step) upd.push(st.step);
  upd.push("  if (over) return;");
  upd.push("  if (keys.ArrowLeft || keys.a) player.x -= player.speed;");
  upd.push("  if (keys.ArrowRight || keys.d) player.x += player.speed;");
  upd.push("  player.x = Math.max(player.w/2, Math.min(W - player.w/2, player.x));");
  if (shoot) upd.push("  if (cooldown > 0) cooldown--; for (const b of bullets) b.y -= 9;");
  upd.push("  if (--spawnTimer <= 0) { spawn(); spawnTimer = Math.max(20, " + p.spawnRate + " - score/25); }");
  upd.push("  for (const e of " + entName + ") e.y += e.vy;");
  if (shoot) {
    upd.push("  for (const e of foes) for (const b of bullets) if (Math.abs(b.x-e.x) < e.r && Math.abs(b.y-e.y) < e.r) { e.dead = true; b.y = -999; score += 10; }");
    upd.push("  for (const e of foes) { const hit = Math.abs(e.x-player.x) < e.r + player.w/2 && Math.abs(e.y-player.y) < e.r + player.h/2; if (hit || e.y > H + e.r) { e.dead = true; loseLife(); } }");
    upd.push("  bullets = bullets.filter(b => b.y > -10);");
    upd.push("  foes = foes.filter(e => !e.dead);");
  } else if (catchMode) {
    upd.push("  for (const e of items) { const caught = Math.abs(e.x-player.x) < e.r + player.w/2 && e.y + e.r > player.y - player.h/2 && e.y - e.r < player.y + player.h/2; if (caught) { e.dead = true; score += 10; } else if (e.y > H + e.r) { e.dead = true; loseLife(); } }");
    upd.push("  items = items.filter(e => !e.dead);");
  } else {
    upd.push("  for (const e of foes) { const hit = Math.abs(e.x-player.x) < e.r + player.w/2 && Math.abs(e.y-player.y) < e.r + player.h/2; if (hit) { e.dead = true; loseLife(); } else if (e.y > H + e.r) { e.dead = true; score += 5; } }");
    upd.push("  foes = foes.filter(e => !e.dead);");
  }
  upd.push("}");

  // draw(): background, player shape, entities, projectiles, HUD, game-over
  const drw = [];
  drw.push("function draw() {");
  drw.push('  ctx.fillStyle = "' + p.palette.bg + '"; ctx.fillRect(0, 0, W, H);');
  if (st.draw) drw.push(st.draw);
  // player: triangle ship for shooter, basket for collector, block for dodger
  if (shoot) {
    drw.push('  ctx.fillStyle = "' + p.palette.player + '"; ctx.beginPath();');
    drw.push("  ctx.moveTo(player.x, player.y - player.h/2); ctx.lineTo(player.x - player.w/2, player.y + player.h/2); ctx.lineTo(player.x + player.w/2, player.y + player.h/2); ctx.closePath(); ctx.fill();");
    drw.push('  ctx.fillStyle = "' + p.palette.bullet + '"; for (const b of bullets) ctx.fillRect(b.x-2, b.y-8, 4, 10);');
  } else if (catchMode) {
    drw.push('  ctx.fillStyle = "' + p.palette.player + '"; ctx.fillRect(player.x - player.w/2, player.y - player.h/2, player.w, player.h);');
    drw.push('  ctx.fillStyle = "' + p.palette.bg + '"; ctx.fillRect(player.x - player.w/2 + 3, player.y - player.h/2 - 4, player.w - 6, 5);');
  } else {
    drw.push('  ctx.fillStyle = "' + p.palette.player + '"; ctx.fillRect(player.x - player.w/2, player.y - player.h/2, player.w, player.h);');
  }
  drw.push('  ctx.fillStyle = "' + (catchMode ? p.palette.bullet : p.palette.enemy) + '"; for (const e of ' + entName + ') { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill(); }');
  drw.push(hudDraw(p, true));
  drw.push(gameOverDraw(p, shoot ? "Press Space or click to play again" : "Press Space or click to play again"));
  drw.push("}");

  const input = [
    'document.addEventListener("keydown", e => {',
    "  keys[e.key] = true;",
    shoot ? '  if (e.key === " ") { over ? reset() : fire(); }' : '  if (e.key === " " && over) reset();',
    '  if (["ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();',
    "});",
    'document.addEventListener("keyup", e => { keys[e.key] = false; });',
    'canvas.addEventListener("mousemove", e => { const r = canvas.getBoundingClientRect(); player.x = (e.clientX - r.left) * (W / r.width); });',
    'canvas.addEventListener("mousedown", () => { over ? reset() : ' + (shoot ? "fire()" : "null") + "; });",
  ].join("\n");

  const head = 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nconst W = canvas.width, H = canvas.height;\nconst keys = {};';
  return [head, decls, reset, helpers, upd.join("\n"), drw.join("\n"), "function loop() { update(); draw(); requestAnimationFrame(loop); }", input, "reset();", "loop();"].join("\n\n");
}

// --- jumper: a structurally different core (gravity + ground + scrolling) ---
function jumperGame(p) {
  const head = 'const canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nconst W = canvas.width, H = canvas.height;\nconst keys = {};\nconst GROUND = H - 40;';
  const body = [
    "let player, obstacles, score, best = 0, over, spawnTimer, speed;",
    "function reset() {",
    "  player = { x: 70, y: GROUND, w: 26, h: 30, vy: 0, onGround: true };",
    "  obstacles = []; score = 0; over = false; spawnTimer = 0; speed = " + (p.speed + 2).toFixed(2) + ";",
    "}",
    "function jump() { if (over) { reset(); return; } if (player.onGround) { player.vy = -12; player.onGround = false; } }",
    "function spawn() { const h = 20 + Math.random()*34; obstacles.push({ x: W + 20, y: GROUND - h + 30, w: 16 + Math.random()*14, h: h + 30 }); }",
    "function update() {",
    "  if (over) return;",
    "  player.vy += 0.6; player.y += player.vy;",
    "  if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }",
    "  if (--spawnTimer <= 0) { spawn(); spawnTimer = Math.max(45, 110 - score/8 - speed*6); }",
    "  for (const o of obstacles) o.x -= speed;",
    "  for (const o of obstacles) {",
    "    const px = player.x, py = player.y - player.h;",
    "    if (px + player.w > o.x && px < o.x + o.w && py + player.h > o.y) { over = true; best = Math.max(best, score); }",
    "  }",
    "  if (obstacles.length && obstacles[0].x + obstacles[0].w < 0) { obstacles.shift(); }",
    "  score++;",
    "  speed += 0.0015;",
    "}",
    "function draw() {",
    '  ctx.fillStyle = "' + p.palette.bg + '"; ctx.fillRect(0, 0, W, H);',
    '  ctx.fillStyle = "' + p.palette.accent + '"; ctx.fillRect(0, GROUND + 2, W, H - GROUND);',
    '  ctx.fillStyle = "' + p.palette.player + '"; ctx.fillRect(player.x, player.y - player.h, player.w, player.h);',
    '  ctx.fillStyle = "' + p.palette.enemy + '"; for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);',
    '  ctx.fillStyle = "' + p.palette.fg + '"; ctx.font = "18px monospace"; ctx.textAlign = "left";',
    '  ctx.fillText("Score " + Math.floor(score/5), 12, 26);',
    '  ctx.textAlign = "right"; ctx.fillText("Best " + Math.floor(best/5), W - 12, 26);',
    "  if (over) {",
    '    ctx.textAlign = "center"; ctx.font = "40px monospace"; ctx.fillText("GAME OVER", W/2, H/2 - 18);',
    '    ctx.font = "18px monospace"; ctx.fillText("Score " + Math.floor(score/5) + "   Best " + Math.floor(best/5), W/2, H/2 + 14);',
    '    ctx.fillText("Press Space / Up / click to run again", W/2, H/2 + 42);',
    "  }",
    "}",
    "function loop() { update(); draw(); requestAnimationFrame(loop); }",
    'document.addEventListener("keydown", e => { if (e.key === " " || e.key === "ArrowUp") { jump(); e.preventDefault(); } });',
    'canvas.addEventListener("mousedown", jump);',
    "reset();",
    "loop();",
  ].join("\n");
  return head + "\n\n" + body;
}

// A request -> a finished, playable game (or null when it is not a game build).
export function synthGame(request) {
  const p = parseGameSpec(request);
  if (!p) return null;
  let instr, script;
  if (p.genre === "jumper") {
    instr = "Press Space / Up / click to jump over the " + p.enemyLabel + "s. One life — go as far as you can.";
    script = jumperGame(p);
  } else {
    const mode = p.genre;
    script = fallingGame(p, mode);
    instr = mode === "shooter" ? "Move: Arrow keys / A D / mouse. Shoot: Space / click. " + p.lives + " lives."
      : mode === "collector" ? "Move the basket: Arrow keys / A D / mouse. Catch the " + p.enemyLabel + "s, do not drop them. " + p.lives + " lives."
        : "Move: Arrow keys / A D / mouse. Dodge the falling " + p.enemyLabel + "s. " + p.lives + " lives.";
  }
  const code = skeleton(p, instr, script);
  const lead = "Here is a complete, playable **" + p.title + "** game in a single HTML file. It is synthesized from parts — input, spawner, motion, collision and render were assembled from your request (genre **" + p.niceGenre + "**, " + p.theme + " palette, " + p.field.w + "×" + p.field.h + "), not copied from a stored game. Save it as `game.html` and open it in a browser.";
  const note = "Generated deterministically by DI's game synthesizer (gamegen.js): the same words always produce the same source, and a different request builds a different game. No model, no network.";
  return { title: p.title, genre: p.genre, lead, note, code, plan: p };
}

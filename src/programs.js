// Program library: complete, runnable programs for common coding requests,
// written by hand and checked by tools/check-programs.sh, which compiles every
// version (-Wall -Wextra, zero warnings for C/C++/Rust) and runs the ones that
// need no input; test/core/engine-programs.test.mjs covers routing and syntax. This is DI's deterministic answer to "write me a
// snake game" or "read a file in go": no model, no network, the same request
// always gives the same program. Single functions from a spec are synthesized
// elsewhere (synth.js / skills.codegen); this covers whole programs and the
// common tasks those generators do not.
//
// Each entry: id, title, re (what the request must mention), langs {lang: code}.
// Programs avoid backticks and "${" so they can live in String.raw templates.

const R = (s, ...v) => String.raw(s, ...v).replace(/^\n/, "").replace(/\s+$/, "");

export const LANG_NAMES = { python: "Python", javascript: "JavaScript", typescript: "TypeScript", rust: "Rust", go: "Go", java: "Java", c: "C", cpp: "C++", csharp: "C#", ruby: "Ruby", bash: "Bash", html: "HTML" };
const FENCE = { python: "python", javascript: "javascript", typescript: "typescript", rust: "rust", go: "go", java: "java", c: "c", cpp: "cpp", csharp: "csharp", ruby: "ruby", bash: "bash", html: "html" };
export const fenceLang = (l) => FENCE[l] || "";

// which language a request asks for (null = not said). Order matters: "c++"
// and "c#" before "c", "javascript" before "java".
export function detectLang(low) {
  const t = " " + low + " ";
  if (/\bc\s*\+\+|\bcpp\b/.test(t)) return "cpp";
  if (/\bc\s*#|\bc sharp\b|\bcsharp\b|\.net\b/.test(t)) return "csharp";
  if (/\btypescript\b|\bin ts\b/.test(t)) return "typescript";
  if (/\bjavascript\b|\bjs\b|\bnode(?:\.?js)?\b|\bexpress\b/.test(t)) return "javascript";
  if (/\bhtml\b|\bweb ?page\b|\bwebsite\b|\bbrowser\b|\bweb ?app\b/.test(t)) return "html";
  if (/\bpython\d?\b|\bpy\b|\bflask\b/.test(t)) return "python";
  if (/\brust\b/.test(t)) return "rust";
  if (/\bgolang\b|\bin go\b|\bgo (program|code|function|version)\b|\busing go\b|\bwith go\b/.test(t)) return "go";
  if (/\bjava\b/.test(t)) return "java";
  if (/\bruby\b/.test(t)) return "ruby";
  if (/\bbash\b|\bshell script\b|\bsh script\b/.test(t)) return "bash";
  if (/\bin c\b|\bc (program|code|function|language)\b|\busing c\b|\bwith c\b/.test(t)) return "c";
  return null;
}

export const PROGRAMS = [
  // ---------------------------------------------------------------- games/apps
  { id: "snake", title: "Snake game", re: /\bsnake\b/, langs: { html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Snake</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #111; color: #eee; font-family: system-ui, sans-serif; }
  canvas { background: #000; border: 2px solid #444; max-width: 95vw; }
  p { margin: 8px 0; }
</style>
</head>
<body>
<p>Score: <span id="score">0</span> &nbsp; Best: <span id="best">0</span></p>
<canvas id="board" width="400" height="400"></canvas>
<p>Arrow keys or WASD to move. Space to restart.</p>
<script>
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const CELL = 20, COLS = canvas.width / CELL, ROWS = canvas.height / CELL;
let snake, dir, nextDir, food, score, best = 0, alive, timer;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  alive = true;
  scoreEl.textContent = score;
  placeFood();
  clearInterval(timer);
  timer = setInterval(step, 100);
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  const eating = head.x === food.x && head.y === food.y;
  const body = eating ? snake : snake.slice(0, -1); // the tail moves away unless we grow
  const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  if (hitWall || body.some(s => s.x === head.x && s.y === head.y)) {
    alive = false;
    clearInterval(timer);
    draw();
    return;
  }
  snake.unshift(head);
  if (eating) {
    score++;
    best = Math.max(best, score);
    scoreEl.textContent = score;
    bestEl.textContent = best;
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e33";
  ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "#7f7" : "#3c3";
    ctx.fillRect(s.x * CELL, s.y * CELL, CELL - 1, CELL - 1);
  });
  if (!alive) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "28px system-ui";
    ctx.fillText("Game over", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px system-ui";
    ctx.fillText("Press Space to play again", canvas.width / 2, canvas.height / 2 + 30);
  }
}

const KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
document.addEventListener("keydown", e => {
  if (e.key === " ") {
    e.preventDefault();
    if (!alive) reset();
    return;
  }
  const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!k) return;
  e.preventDefault();
  if (k[0] === -dir.x && k[1] === -dir.y) return; // cannot turn back into yourself
  nextDir = { x: k[0], y: k[1] };
});

reset();
</script>
</body>
</html>` } },

  { id: "tictactoe", title: "Tic-tac-toe", re: /tic[\s-]*tac[\s-]*toe|noughts and crosses/, langs: {
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tic-tac-toe</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; margin-top: 40px; background: #f4f4f4; }
  #board { display: grid; grid-template-columns: repeat(3, 90px); gap: 6px; }
  .cell { width: 90px; height: 90px; font-size: 48px; font-weight: bold; border: none; border-radius: 8px; background: #fff; cursor: pointer; }
  .cell:disabled { cursor: default; }
  .win { background: #b8f0b8; }
  #status { font-size: 20px; margin: 16px; }
  button#reset { padding: 8px 18px; font-size: 16px; }
</style>
</head>
<body>
<h1>Tic-tac-toe</h1>
<div id="board"></div>
<div id="status"></div>
<button id="reset">New game</button>
<script>
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
let cells, turn, over;

function winner(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

function render() {
  boardEl.innerHTML = "";
  const line = winner(cells);
  cells.forEach((v, i) => {
    const btn = document.createElement("button");
    btn.className = "cell" + (line && line.includes(i) ? " win" : "");
    btn.textContent = v;
    btn.disabled = over || v !== "";
    btn.addEventListener("click", () => play(i));
    boardEl.appendChild(btn);
  });
}

function play(i) {
  cells[i] = turn;
  if (winner(cells)) { over = true; statusEl.textContent = turn + " wins!"; }
  else if (cells.every(v => v)) { over = true; statusEl.textContent = "It's a draw."; }
  else { turn = turn === "X" ? "O" : "X"; statusEl.textContent = turn + " to move"; }
  render();
}

function reset() {
  cells = Array(9).fill("");
  turn = "X";
  over = false;
  statusEl.textContent = "X to move";
  render();
}

document.getElementById("reset").addEventListener("click", reset);
reset();
</script>
</body>
</html>`,
    python: R`
LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def show(board):
    for r in range(3):
        print(" " + " | ".join(board[r * 3 + c] or str(r * 3 + c + 1) for c in range(3)))
        if r < 2:
            print("---+---+---")


def winner(board):
    for a, b, c in LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    return None


def main():
    board = [""] * 9
    turn = "X"
    while True:
        show(board)
        move = input(f"{turn}, choose a square (1-9): ").strip()
        if not move.isdigit() or not 1 <= int(move) <= 9 or board[int(move) - 1]:
            print("That square is not available, try again.\n")
            continue
        board[int(move) - 1] = turn
        if winner(board):
            show(board)
            print(f"{turn} wins!")
            break
        if all(board):
            show(board)
            print("It's a draw.")
            break
        turn = "O" if turn == "X" else "X"
        print()


if __name__ == "__main__":
    main()` } },

  { id: "todo", title: "To-do list app", re: /\bto[\s-]?do\b|\btask (list|manager|tracker)\b/, langs: {
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>To-do list</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
  form { display: flex; gap: 8px; }
  input[type=text] { flex: 1; padding: 8px; font-size: 16px; }
  button { padding: 8px 14px; font-size: 14px; cursor: pointer; }
  ul { list-style: none; padding: 0; }
  li { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #ddd; }
  li span { flex: 1; }
  li.done span { text-decoration: line-through; color: #888; }
  .del { background: none; border: none; color: #c33; font-size: 18px; }
  #count { color: #666; font-size: 14px; }
</style>
</head>
<body>
<h1>To-do list</h1>
<form id="form">
  <input type="text" id="text" placeholder="What needs doing?" autocomplete="off" required>
  <button type="submit">Add</button>
</form>
<ul id="list"></ul>
<p id="count"></p>
<button id="clear">Clear completed</button>
<script>
const KEY = "todos";
let todos = [];
try { todos = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { todos = []; }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch (e) { /* storage unavailable */ }
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if (t.done) li.className = "done";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = t.done;
    box.addEventListener("change", () => { t.done = box.checked; save(); render(); });
    const span = document.createElement("span");
    span.textContent = t.text;
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "x";
    del.title = "Delete";
    del.addEventListener("click", () => { todos.splice(i, 1); save(); render(); });
    li.append(box, span, del);
    list.appendChild(li);
  });
  const left = todos.filter(t => !t.done).length;
  document.getElementById("count").textContent = left + " item" + (left === 1 ? "" : "s") + " left";
}

document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("text");
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = "";
  save();
  render();
});

document.getElementById("clear").addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  save();
  render();
});

render();
</script>
</body>
</html>`,
    python: R`
import json
import os

FILE = "todos.json"


def load():
    if os.path.exists(FILE):
        with open(FILE) as f:
            return json.load(f)
    return []


def save(todos):
    with open(FILE, "w") as f:
        json.dump(todos, f, indent=2)


def show(todos):
    if not todos:
        print("Nothing to do.")
    for i, t in enumerate(todos, 1):
        print(f"{i}. [{'x' if t['done'] else ' '}] {t['text']}")


def main():
    todos = load()
    print("Commands: add <task>, done <n>, del <n>, list, quit")
    while True:
        cmd = input("> ").strip()
        if not cmd:
            continue
        verb, _, arg = cmd.partition(" ")
        verb = verb.lower()
        if verb == "add" and arg:
            todos.append({"text": arg, "done": False})
        elif verb in ("done", "del") and arg.isdigit() and 1 <= int(arg) <= len(todos):
            if verb == "done":
                todos[int(arg) - 1]["done"] = True
            else:
                todos.pop(int(arg) - 1)
        elif verb == "list":
            pass
        elif verb in ("quit", "exit", "q"):
            break
        else:
            print("Unknown command.")
            continue
        save(todos)
        show(todos)


if __name__ == "__main__":
    main()` } },

  { id: "calculator", title: "Calculator", re: /\bcalculator\b/, langs: {
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Calculator</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; justify-content: center; margin-top: 50px; background: #222; }
  .calc { background: #333; padding: 16px; border-radius: 12px; width: 260px; }
  #display { width: 100%; box-sizing: border-box; height: 56px; font-size: 28px; text-align: right; padding: 8px; border: none; border-radius: 6px; margin-bottom: 12px; background: #111; color: #fff; }
  .keys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  button { height: 52px; font-size: 20px; border: none; border-radius: 6px; cursor: pointer; background: #555; color: #fff; }
  button.op { background: #f90; }
  button.eq { background: #2a2; grid-column: span 2; }
</style>
</head>
<body>
<div class="calc">
  <input id="display" readonly value="0">
  <div class="keys">
    <button data-k="C">C</button><button data-k="(">(</button><button data-k=")">)</button><button class="op" data-k="/">/</button>
    <button data-k="7">7</button><button data-k="8">8</button><button data-k="9">9</button><button class="op" data-k="*">*</button>
    <button data-k="4">4</button><button data-k="5">5</button><button data-k="6">6</button><button class="op" data-k="-">-</button>
    <button data-k="1">1</button><button data-k="2">2</button><button data-k="3">3</button><button class="op" data-k="+">+</button>
    <button data-k="0">0</button><button data-k=".">.</button><button class="eq" data-k="=">=</button>
  </div>
</div>
<script>
const display = document.getElementById("display");
let expr = "";

// A small recursive-descent parser: + - * / and parentheses, no eval().
function evaluate(src) {
  let i = 0;
  const peek = () => src[i];
  function number() {
    let start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    if (start === i) throw new Error("number expected");
    return parseFloat(src.slice(start, i));
  }
  function factor() {
    if (peek() === "-") { i++; return -factor(); }
    if (peek() === "(") { i++; const v = sum(); if (src[i++] !== ")") throw new Error(") expected"); return v; }
    return number();
  }
  function product() {
    let v = factor();
    while (peek() === "*" || peek() === "/") { const op = src[i++]; const r = factor(); v = op === "*" ? v * r : v / r; }
    return v;
  }
  function sum() {
    let v = product();
    while (peek() === "+" || peek() === "-") { const op = src[i++]; const r = product(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  const v = sum();
  if (i !== src.length) throw new Error("unexpected input");
  return v;
}

function press(k) {
  if (k === "C") expr = "";
  else if (k === "=") {
    try {
      const v = evaluate(expr);
      expr = Number.isFinite(v) ? String(parseFloat(v.toPrecision(12))) : "";
      display.value = Number.isFinite(v) ? expr : "Error";
      return;
    } catch (e) { display.value = "Error"; expr = ""; return; }
  } else expr += k;
  display.value = expr || "0";
}

document.querySelector(".keys").addEventListener("click", e => {
  if (e.target.dataset.k) press(e.target.dataset.k);
});
document.addEventListener("keydown", e => {
  if (/^[0-9.+\-*/()]$/.test(e.key)) press(e.key);
  else if (e.key === "Enter" || e.key === "=") press("=");
  else if (e.key === "Escape") press("C");
  else if (e.key === "Backspace") { expr = expr.slice(0, -1); display.value = expr || "0"; }
});
</script>
</body>
</html>`,
    python: R`
import ast
import operator

OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: operator.pow, ast.Mod: operator.mod,
    ast.USub: operator.neg, ast.UAdd: operator.pos,
}


def evaluate(node):
    """Safely evaluate an arithmetic expression tree (no eval())."""
    if isinstance(node, ast.Expression):
        return evaluate(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPS:
        return OPS[type(node.op)](evaluate(node.left), evaluate(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
        return OPS[type(node.op)](evaluate(node.operand))
    raise ValueError("unsupported expression")


def main():
    print("Calculator: type an expression like (2 + 3) * 4, or 'quit'.")
    while True:
        text = input("> ").strip()
        if text.lower() in ("quit", "exit", "q"):
            break
        if not text:
            continue
        try:
            print(evaluate(ast.parse(text.replace("^", "**"), mode="eval")))
        except ZeroDivisionError:
            print("Error: division by zero")
        except (ValueError, SyntaxError):
            print("Error: invalid expression")


if __name__ == "__main__":
    main()`,
    javascript: R`
// Command-line calculator for Node.js: node calculator.js
const readline = require("readline");

function evaluate(src) {
  src = src.replace(/\s+/g, "");
  let i = 0;
  function number() {
    const start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    if (start === i) throw new Error("number expected");
    return parseFloat(src.slice(start, i));
  }
  function factor() {
    if (src[i] === "-") { i++; return -factor(); }
    if (src[i] === "(") { i++; const v = sum(); if (src[i++] !== ")") throw new Error(") expected"); return v; }
    return number();
  }
  function product() {
    let v = factor();
    while (src[i] === "*" || src[i] === "/") { const op = src[i++]; const r = factor(); v = op === "*" ? v * r : v / r; }
    return v;
  }
  function sum() {
    let v = product();
    while (src[i] === "+" || src[i] === "-") { const op = src[i++]; const r = product(); v = op === "+" ? v + r : v - r; }
    return v;
  }
  const v = sum();
  if (i !== src.length) throw new Error("unexpected input");
  return v;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
console.log("Calculator: type an expression like (2 + 3) * 4, or 'quit'.");
rl.prompt();
rl.on("line", line => {
  const text = line.trim();
  if (/^(quit|exit|q)$/i.test(text)) return rl.close();
  if (text) {
    try { console.log(evaluate(text)); } catch (e) { console.log("Error: invalid expression"); }
  }
  rl.prompt();
});` } },

  { id: "guess", title: "Number guessing game", re: /\bguess(ing)?\b.*\bnumber\b|\bnumber\b.*\bguess(ing)?\b|\bhigher or lower\b/, langs: {
    python: R`
import random


def main():
    secret = random.randint(1, 100)
    tries = 0
    print("I'm thinking of a number between 1 and 100.")
    while True:
        guess = input("Your guess: ").strip()
        if not guess.lstrip("-").isdigit():
            print("Please enter a whole number.")
            continue
        tries += 1
        guess = int(guess)
        if guess < secret:
            print("Higher!")
        elif guess > secret:
            print("Lower!")
        else:
            print(f"Correct! You got it in {tries} tries.")
            break


if __name__ == "__main__":
    main()`,
    javascript: R`
// Number guessing game for Node.js: node guess.js
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const secret = Math.floor(Math.random() * 100) + 1;
let tries = 0;

console.log("I'm thinking of a number between 1 and 100.");
function ask() {
  rl.question("Your guess: ", answer => {
    const guess = Number(answer.trim());
    if (!Number.isInteger(guess)) { console.log("Please enter a whole number."); return ask(); }
    tries++;
    if (guess < secret) { console.log("Higher!"); ask(); }
    else if (guess > secret) { console.log("Lower!"); ask(); }
    else { console.log("Correct! You got it in " + tries + " tries."); rl.close(); }
  });
}
ask();`,
    c: R`
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(void) {
    srand((unsigned) time(NULL));
    int secret = rand() % 100 + 1, guess, tries = 0;
    printf("I'm thinking of a number between 1 and 100.\n");
    for (;;) {
        printf("Your guess: ");
        if (scanf("%d", &guess) != 1) {
            int ch;
            while ((ch = getchar()) != '\n' && ch != EOF) {}
            if (ch == EOF) return 0;
            printf("Please enter a whole number.\n");
            continue;
        }
        tries++;
        if (guess < secret) printf("Higher!\n");
        else if (guess > secret) printf("Lower!\n");
        else { printf("Correct! You got it in %d tries.\n", tries); break; }
    }
    return 0;
}`,
    cpp: R`
#include <iostream>
#include <random>

int main() {
    std::mt19937 rng(std::random_device{}());
    int secret = std::uniform_int_distribution<int>(1, 100)(rng), guess, tries = 0;
    std::cout << "I'm thinking of a number between 1 and 100.\n";
    while (true) {
        std::cout << "Your guess: ";
        if (!(std::cin >> guess)) {
            if (std::cin.eof()) return 0;
            std::cin.clear();
            std::cin.ignore(10000, '\n');
            std::cout << "Please enter a whole number.\n";
            continue;
        }
        tries++;
        if (guess < secret) std::cout << "Higher!\n";
        else if (guess > secret) std::cout << "Lower!\n";
        else { std::cout << "Correct! You got it in " << tries << " tries.\n"; break; }
    }
}`,
    go: R`
package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
)

func main() {
	secret := rand.Intn(100) + 1
	tries := 0
	in := bufio.NewScanner(os.Stdin)
	fmt.Println("I'm thinking of a number between 1 and 100.")
	for {
		fmt.Print("Your guess: ")
		if !in.Scan() {
			return
		}
		guess, err := strconv.Atoi(strings.TrimSpace(in.Text()))
		if err != nil {
			fmt.Println("Please enter a whole number.")
			continue
		}
		tries++
		switch {
		case guess < secret:
			fmt.Println("Higher!")
		case guess > secret:
			fmt.Println("Lower!")
		default:
			fmt.Printf("Correct! You got it in %d tries.\n", tries)
			return
		}
	}
}` } },

  { id: "rps", title: "Rock, paper, scissors", re: /\brock\W+paper\W+scissors?\b/, langs: {
    python: R`
import random

BEATS = {"rock": "scissors", "paper": "rock", "scissors": "paper"}


def main():
    score = {"you": 0, "computer": 0}
    print("Type rock, paper or scissors (or quit).")
    while True:
        you = input("> ").strip().lower()
        if you in ("quit", "exit", "q"):
            break
        if you not in BEATS:
            print("Please type rock, paper or scissors.")
            continue
        cpu = random.choice(list(BEATS))
        if you == cpu:
            result = "Draw."
        elif BEATS[you] == cpu:
            result = "You win!"
            score["you"] += 1
        else:
            result = "Computer wins."
            score["computer"] += 1
        print(f"Computer chose {cpu}. {result}  (you {score['you']} - {score['computer']} computer)")


if __name__ == "__main__":
    main()`,
    javascript: R`
// Rock, paper, scissors for Node.js: node rps.js
const readline = require("readline");
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const score = { you: 0, computer: 0 };
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

console.log("Type rock, paper or scissors (or quit).");
rl.prompt();
rl.on("line", line => {
  const you = line.trim().toLowerCase();
  if (/^(quit|exit|q)$/.test(you)) return rl.close();
  if (!BEATS[you]) { console.log("Please type rock, paper or scissors."); return rl.prompt(); }
  const choices = Object.keys(BEATS);
  const cpu = choices[Math.floor(Math.random() * choices.length)];
  let result = "Draw.";
  if (BEATS[you] === cpu) { result = "You win!"; score.you++; }
  else if (you !== cpu) { result = "Computer wins."; score.computer++; }
  console.log("Computer chose " + cpu + ". " + result + "  (you " + score.you + " - " + score.computer + " computer)");
  rl.prompt();
});`,
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rock, paper, scissors</title>
<style>
  body { font-family: system-ui, sans-serif; text-align: center; margin-top: 50px; }
  button { font-size: 18px; padding: 12px 20px; margin: 6px; cursor: pointer; border-radius: 8px; }
  #result { font-size: 22px; margin: 20px; min-height: 30px; }
</style>
</head>
<body>
<h1>Rock, paper, scissors</h1>
<div>
  <button data-c="rock">Rock</button>
  <button data-c="paper">Paper</button>
  <button data-c="scissors">Scissors</button>
</div>
<div id="result">Make your move.</div>
<div>You <b id="you">0</b> : <b id="cpu">0</b> Computer</div>
<script>
const BEATS = { rock: "scissors", paper: "rock", scissors: "paper" };
const score = { you: 0, cpu: 0 };
document.querySelectorAll("button[data-c]").forEach(btn => {
  btn.addEventListener("click", () => {
    const you = btn.dataset.c;
    const choices = Object.keys(BEATS);
    const cpu = choices[Math.floor(Math.random() * choices.length)];
    let msg = "Draw.";
    if (BEATS[you] === cpu) { msg = "You win!"; score.you++; }
    else if (you !== cpu) { msg = "Computer wins."; score.cpu++; }
    document.getElementById("result").textContent = "Computer chose " + cpu + ". " + msg;
    document.getElementById("you").textContent = score.you;
    document.getElementById("cpu").textContent = score.cpu;
  });
});
</script>
</body>
</html>` } },

  { id: "hangman", title: "Hangman", re: /\bhangman\b/, langs: {
    python: R`
import random

WORDS = ["python", "keyboard", "galaxy", "puzzle", "journey", "oxygen", "rhythm", "wizard", "zombie", "quartz"]


def main():
    word = random.choice(WORDS)
    guessed = set()
    lives = 6
    while lives > 0:
        shown = " ".join(c if c in guessed else "_" for c in word)
        print(f"\n{shown}   lives: {lives}   guessed: {' '.join(sorted(guessed)) or '-'}")
        if "_" not in shown:
            print("You win!")
            return
        letter = input("Guess a letter: ").strip().lower()
        if len(letter) != 1 or not letter.isalpha():
            print("Please type a single letter.")
            continue
        if letter in guessed:
            print("You already tried that letter.")
            continue
        guessed.add(letter)
        if letter not in word:
            lives -= 1
            print("Nope.")
    print(f"\nOut of lives. The word was '{word}'.")


if __name__ == "__main__":
    main()` } },

  { id: "pong", title: "Pong", re: /\bpong\b/, langs: { html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pong</title>
<style>
  body { margin: 0; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #fff; font-family: system-ui, sans-serif; }
  canvas { border: 2px solid #444; max-width: 95vw; }
</style>
</head>
<body>
<canvas id="game" width="640" height="400"></canvas>
<p>W / S or Arrow Up / Down to move. First to 7 wins.</p>
<script>
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height, PH = 70, PW = 10, R = 7;
const keys = {};
let player, cpu, ball, scores, winner;

function serve(dir) {
  ball = { x: W / 2, y: H / 2, vx: 5 * dir, vy: (Math.random() * 4) - 2 };
}
function reset() {
  player = H / 2 - PH / 2;
  cpu = H / 2 - PH / 2;
  scores = [0, 0];
  winner = null;
  serve(Math.random() < 0.5 ? -1 : 1);
}

function update() {
  if (winner) return;
  if (keys.w || keys.ArrowUp) player -= 6;
  if (keys.s || keys.ArrowDown) player += 6;
  player = Math.max(0, Math.min(H - PH, player));
  const target = ball.y - PH / 2;                  // the computer follows the ball, a bit slower
  cpu += Math.max(-4.2, Math.min(4.2, target - cpu));
  cpu = Math.max(0, Math.min(H - PH, cpu));

  ball.x += ball.vx;
  ball.y += ball.vy;
  if (ball.y < R || ball.y > H - R) ball.vy = -ball.vy;

  const hit = (py, px) => ball.y > py && ball.y < py + PH && Math.abs(ball.x - px) < R + PW / 2;
  if (ball.vx < 0 && hit(player, 20)) { ball.vx = -ball.vx * 1.05; ball.vy += (ball.y - (player + PH / 2)) * 0.1; }
  if (ball.vx > 0 && hit(cpu, W - 20)) { ball.vx = -ball.vx * 1.05; ball.vy += (ball.y - (cpu + PH / 2)) * 0.1; }

  if (ball.x < 0) { scores[1]++; serve(1); }
  if (ball.x > W) { scores[0]++; serve(-1); }
  if (scores[0] === 7) winner = "You win!";
  if (scores[1] === 7) winner = "Computer wins.";
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  for (let y = 0; y < H; y += 20) ctx.fillRect(W / 2 - 1, y, 2, 10);
  ctx.fillRect(15, player, PW, PH);
  ctx.fillRect(W - 25, cpu, PW, PH);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "32px monospace";
  ctx.textAlign = "center";
  ctx.fillText(scores[0], W / 4, 40);
  ctx.fillText(scores[1], (3 * W) / 4, 40);
  if (winner) {
    ctx.fillText(winner, W / 2, H / 2);
    ctx.font = "16px monospace";
    ctx.fillText("Press Space to play again", W / 2, H / 2 + 30);
  }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === " " && winner) reset();
  if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
});
document.addEventListener("keyup", e => { keys[e.key] = false; });
reset();
loop();
</script>
</body>
</html>` } },

  { id: "quiz", title: "Quiz", re: /\bquiz\b|\btrivia game\b/, langs: {
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quiz</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 560px; margin: 40px auto; padding: 0 16px; }
  .opt { display: block; width: 100%; text-align: left; padding: 10px 14px; margin: 8px 0; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; background: #fff; cursor: pointer; }
  .right { background: #c8f2c8; border-color: #3a3; }
  .wrong { background: #f6caca; border-color: #c33; }
  #next { margin-top: 12px; padding: 8px 16px; font-size: 16px; }
</style>
</head>
<body>
<h1>Quiz</h1>
<p id="progress"></p>
<h2 id="question"></h2>
<div id="options"></div>
<button id="next" hidden>Next</button>
<script>
// Edit this list to make your own quiz. "answer" is the index of the right option.
const QUESTIONS = [
  { q: "What is the capital of Japan?", options: ["Seoul", "Tokyo", "Kyoto", "Beijing"], answer: 1 },
  { q: "How many planets are in the Solar System?", options: ["7", "8", "9", "10"], answer: 1 },
  { q: "What is the chemical symbol for gold?", options: ["Ag", "Gd", "Au", "Go"], answer: 2 },
  { q: "Which language runs natively in web browsers?", options: ["Python", "C", "Java", "JavaScript"], answer: 3 },
  { q: "What is 12 x 12?", options: ["144", "124", "132", "154"], answer: 0 },
];
let current = 0, score = 0;

function show() {
  const item = QUESTIONS[current];
  document.getElementById("progress").textContent = "Question " + (current + 1) + " of " + QUESTIONS.length + "  |  Score: " + score;
  document.getElementById("question").textContent = item.q;
  const box = document.getElementById("options");
  box.innerHTML = "";
  item.options.forEach((text, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.textContent = text;
    b.addEventListener("click", () => choose(i));
    box.appendChild(b);
  });
  document.getElementById("next").hidden = true;
}

function choose(i) {
  const item = QUESTIONS[current];
  const buttons = document.querySelectorAll(".opt");
  buttons.forEach(b => { b.disabled = true; });
  buttons[item.answer].classList.add("right");
  if (i === item.answer) score++;
  else buttons[i].classList.add("wrong");
  document.getElementById("next").hidden = false;
}

document.getElementById("next").addEventListener("click", () => {
  current++;
  if (current < QUESTIONS.length) return show();
  document.getElementById("progress").textContent = "";
  document.getElementById("question").textContent = "You scored " + score + " out of " + QUESTIONS.length + ".";
  document.getElementById("options").innerHTML = "";
  document.getElementById("next").hidden = true;
});

show();
</script>
</body>
</html>`,
    python: R`
QUESTIONS = [
    ("What is the capital of Japan?", ["Seoul", "Tokyo", "Kyoto", "Beijing"], 2),
    ("How many planets are in the Solar System?", ["7", "8", "9", "10"], 2),
    ("What is the chemical symbol for gold?", ["Ag", "Gd", "Au", "Go"], 3),
    ("What is 12 x 12?", ["144", "124", "132", "154"], 1),
]


def main():
    score = 0
    for number, (question, options, answer) in enumerate(QUESTIONS, 1):
        print(f"\nQ{number}. {question}")
        for i, option in enumerate(options, 1):
            print(f"  {i}) {option}")
        choice = input("Your answer (1-4): ").strip()
        if choice == str(answer):
            print("Correct!")
            score += 1
        else:
            print(f"Wrong, the answer was {options[answer - 1]}.")
    print(f"\nYou scored {score} out of {len(QUESTIONS)}.")


if __name__ == "__main__":
    main()` } },

  { id: "stopwatch", title: "Stopwatch and countdown timer", re: /\bstop ?watch\b|\bcount ?down\b|\btimer\b/, langs: {
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Stopwatch and timer</title>
<style>
  body { font-family: system-ui, sans-serif; text-align: center; margin-top: 40px; }
  .time { font-size: 56px; font-variant-numeric: tabular-nums; margin: 12px; }
  button { font-size: 16px; padding: 8px 16px; margin: 4px; cursor: pointer; }
  input { width: 70px; font-size: 16px; padding: 6px; }
  section { margin-bottom: 40px; }
</style>
</head>
<body>
<section>
  <h2>Stopwatch</h2>
  <div class="time" id="sw">00:00.00</div>
  <button id="swStart">Start</button><button id="swReset">Reset</button>
</section>
<section>
  <h2>Countdown</h2>
  <input type="number" id="min" min="0" value="1"> min
  <input type="number" id="sec" min="0" max="59" value="0"> sec
  <div class="time" id="cd">01:00</div>
  <button id="cdStart">Start</button><button id="cdReset">Reset</button>
</section>
<script>
const pad = n => String(n).padStart(2, "0");

// Stopwatch: measures real elapsed time, so it stays accurate even if the tab is throttled.
let swStart = 0, swElapsed = 0, swTimer = null;
function swShow() {
  const ms = swElapsed + (swTimer ? Date.now() - swStart : 0);
  document.getElementById("sw").textContent = pad(Math.floor(ms / 60000)) + ":" + pad(Math.floor(ms / 1000) % 60) + "." + pad(Math.floor(ms / 10) % 100);
}
document.getElementById("swStart").addEventListener("click", e => {
  if (swTimer) { swElapsed += Date.now() - swStart; clearInterval(swTimer); swTimer = null; e.target.textContent = "Start"; }
  else { swStart = Date.now(); swTimer = setInterval(swShow, 31); e.target.textContent = "Pause"; }
  swShow();
});
document.getElementById("swReset").addEventListener("click", () => {
  clearInterval(swTimer); swTimer = null; swElapsed = 0;
  document.getElementById("swStart").textContent = "Start";
  swShow();
});

// Countdown
let cdEnd = 0, cdTimer = null;
function cdTotal() { return (Number(document.getElementById("min").value) * 60 + Number(document.getElementById("sec").value)) * 1000; }
function cdShow(ms) { const s = Math.ceil(ms / 1000); document.getElementById("cd").textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60); }
function cdTick() {
  const left = cdEnd - Date.now();
  if (left <= 0) {
    clearInterval(cdTimer); cdTimer = null; cdShow(0);
    document.getElementById("cdStart").textContent = "Start";
    document.getElementById("cd").textContent = "Time's up!";
    return;
  }
  cdShow(left);
}
document.getElementById("cdStart").addEventListener("click", e => {
  if (cdTimer) return;
  const total = cdTotal();
  if (total <= 0) return;
  cdEnd = Date.now() + total;
  cdTimer = setInterval(cdTick, 200);
  cdTick();
  e.target.textContent = "Running";
});
document.getElementById("cdReset").addEventListener("click", () => {
  clearInterval(cdTimer); cdTimer = null;
  document.getElementById("cdStart").textContent = "Start";
  cdShow(cdTotal());
});
["min", "sec"].forEach(id => document.getElementById(id).addEventListener("input", () => { if (!cdTimer) cdShow(cdTotal()); }));
</script>
</body>
</html>`,
    python: R`
import sys
import time


def countdown(seconds):
    for left in range(seconds, 0, -1):
        mins, secs = divmod(left, 60)
        print(f"\r{mins:02d}:{secs:02d}", end="", flush=True)
        time.sleep(1)
    print("\rTime's up!")


if __name__ == "__main__":
    seconds = int(sys.argv[1]) if len(sys.argv) > 1 else int(input("Seconds to count down: "))
    countdown(seconds)` } },

  { id: "clock", title: "Digital clock", re: /\b(digital|live|real[- ]?time) clock\b|\bclock (app|widget|website|page)\b|\bmake (a|me a) clock\b/, langs: { html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Clock</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0d1117; color: #e6edf3; font-family: system-ui, sans-serif; }
  #time { font-size: 18vmin; font-variant-numeric: tabular-nums; }
  #date { font-size: 4vmin; opacity: 0.7; }
</style>
</head>
<body>
<div id="time"></div>
<div id="date"></div>
<script>
function tick() {
  const now = new Date();
  document.getElementById("time").textContent = now.toLocaleTimeString();
  document.getElementById("date").textContent = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
tick();
setInterval(tick, 1000);
</script>
</body>
</html>` } },

  { id: "landing", title: "Personal website", re: /\b(portfolio|landing page|personal (web ?site|page|homepage)|home ?page)\b/, langs: { html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Name - Portfolio</title>
<style>
  :root { --bg: #ffffff; --fg: #1d1d1f; --muted: #6e6e73; --accent: #0a66c2; --card: #f5f5f7; }
  @media (prefers-color-scheme: dark) { :root { --bg: #111; --fg: #f5f5f7; --muted: #a1a1a6; --card: #1c1c1e; } }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.6; }
  header, section, footer { max-width: 900px; margin: 0 auto; padding: 48px 20px; }
  nav { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; padding: 16px 20px; }
  nav a { color: var(--fg); text-decoration: none; margin-left: 18px; }
  h1 { font-size: clamp(2rem, 6vw, 3.4rem); margin: 0 0 8px; }
  .lead { color: var(--muted); font-size: 1.2rem; max-width: 600px; }
  .btn { display: inline-block; margin-top: 18px; padding: 10px 20px; background: var(--accent); color: #fff; border-radius: 8px; text-decoration: none; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
  .card { background: var(--card); border-radius: 12px; padding: 20px; }
  .card h3 { margin-top: 0; }
  footer { color: var(--muted); font-size: 0.9rem; }
</style>
</head>
<body>
<nav>
  <strong>Your Name</strong>
  <div><a href="#about">About</a><a href="#projects">Projects</a><a href="#contact">Contact</a></div>
</nav>
<header>
  <h1>Hi, I'm Your Name.</h1>
  <p class="lead">I build things for the web. Replace this line with a sentence about what you do and what you care about.</p>
  <a class="btn" href="#projects">See my work</a>
</header>
<section id="about">
  <h2>About</h2>
  <p>A short paragraph about your background, your skills, and what you are working on now.</p>
</section>
<section id="projects">
  <h2>Projects</h2>
  <div class="grid">
    <div class="card"><h3>Project one</h3><p>What it does and what you used to build it.</p><a href="#">View</a></div>
    <div class="card"><h3>Project two</h3><p>What it does and what you used to build it.</p><a href="#">View</a></div>
    <div class="card"><h3>Project three</h3><p>What it does and what you used to build it.</p><a href="#">View</a></div>
  </div>
</section>
<section id="contact">
  <h2>Contact</h2>
  <p>Email me at <a href="mailto:you@example.com">you@example.com</a>.</p>
</section>
<footer>&copy; <span id="year"></span> Your Name</footer>
<script>document.getElementById("year").textContent = new Date().getFullYear();</script>
</body>
</html>` } },

  { id: "login", title: "Login form", re: /\b(log ?in|sign ?in|sign ?up|registration) (form|page|screen)\b/, langs: { html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Log in</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  form { background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 320px; }
  h1 { margin-top: 0; font-size: 24px; }
  label { display: block; font-size: 14px; margin: 14px 0 4px; }
  input { width: 100%; box-sizing: border-box; padding: 10px; font-size: 15px; border: 1px solid #ccc; border-radius: 6px; }
  button { width: 100%; margin-top: 20px; padding: 11px; font-size: 16px; border: none; border-radius: 6px; background: #1a73e8; color: #fff; cursor: pointer; }
  .error { color: #c33; font-size: 13px; min-height: 18px; margin-top: 8px; }
</style>
</head>
<body>
<form id="login" novalidate>
  <h1>Log in</h1>
  <label for="email">Email</label>
  <input type="email" id="email" autocomplete="email" required>
  <label for="password">Password</label>
  <input type="password" id="password" autocomplete="current-password" minlength="8" required>
  <div class="error" id="error"></div>
  <button type="submit">Log in</button>
</form>
<script>
// Client-side checks only. A real login must be verified by your server over HTTPS.
document.getElementById("login").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = "Enter a valid email address."; return; }
  if (password.length < 8) { error.textContent = "Password must be at least 8 characters."; return; }
  error.textContent = "";
  // Send to your backend, for example:
  // fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
  alert("Looks good! Connect this form to your server to actually log in.");
});
</script>
</body>
</html>` } },

  { id: "password", title: "Password generator", re: /\bpassword generator\b|\bgenerat\w* (a |an )?(random |strong |secure )?password\b|\brandom password\b/, langs: {
    python: R`
import secrets
import string


def generate_password(length=16, symbols=True):
    alphabet = string.ascii_letters + string.digits + (string.punctuation if symbols else "")
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(length))
        # make sure every character class is present
        if (any(c.islower() for c in pw) and any(c.isupper() for c in pw)
                and any(c.isdigit() for c in pw)
                and (not symbols or any(c in string.punctuation for c in pw))):
            return pw


if __name__ == "__main__":
    print(generate_password())`,
    javascript: R`
// Cryptographically secure password generator (Node.js 17+ or any modern browser).
const { randomInt } = require("crypto");

function generatePassword(length = 16, symbols = true) {
  const lower = "abcdefghijklmnopqrstuvwxyz", upper = lower.toUpperCase(), digits = "0123456789", sym = "!@#$%^&*()-_=+[]{};:,.?";
  const alphabet = lower + upper + digits + (symbols ? sym : "");
  for (;;) {
    let pw = "";
    for (let i = 0; i < length; i++) pw += alphabet[randomInt(alphabet.length)];
    const ok = /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && (!symbols || [...pw].some(c => sym.includes(c)));
    if (ok) return pw;
  }
}

console.log(generatePassword());`,
    go: R`
package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"

func generatePassword(length int) (string, error) {
	out := make([]byte, length)
	for i := range out {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		out[i] = alphabet[n.Int64()]
	}
	return string(out), nil
}

func main() {
	pw, err := generatePassword(16)
	if err != nil {
		panic(err)
	}
	fmt.Println(pw)
}` } },

  // ------------------------------------------------------------------ servers
  { id: "restapi", title: "REST API", re: /\b(rest(ful)? api|crud api|json api|express (app|server|api)|flask (app|server|api))\b/, langs: {
    javascript: R`
// REST API with Express. Setup: npm install express, then: node server.js
const express = require("express");
const app = express();
app.use(express.json());

let nextId = 3;
const items = [{ id: 1, name: "First item" }, { id: 2, name: "Second item" }];

app.get("/api/items", (req, res) => res.json(items));

app.get("/api/items/:id", (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

app.post("/api/items", (req, res) => {
  if (!req.body || typeof req.body.name !== "string" || !req.body.name.trim()) return res.status(400).json({ error: "name is required" });
  const item = { id: nextId++, name: req.body.name.trim() };
  items.push(item);
  res.status(201).json(item);
});

app.put("/api/items/:id", (req, res) => {
  const item = items.find(i => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Not found" });
  if (typeof req.body.name === "string" && req.body.name.trim()) item.name = req.body.name.trim();
  res.json(item);
});

app.delete("/api/items/:id", (req, res) => {
  const i = items.findIndex(it => it.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: "Not found" });
  items.splice(i, 1);
  res.status(204).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API listening on http://localhost:" + PORT));`,
    python: R`
# REST API with Flask. Setup: pip install flask, then: python app.py
from flask import Flask, jsonify, request

app = Flask(__name__)
items = [{"id": 1, "name": "First item"}, {"id": 2, "name": "Second item"}]
next_id = 3


def find(item_id):
    return next((i for i in items if i["id"] == item_id), None)


@app.get("/api/items")
def list_items():
    return jsonify(items)


@app.get("/api/items/<int:item_id>")
def get_item(item_id):
    item = find(item_id)
    return (jsonify(item), 200) if item else (jsonify(error="Not found"), 404)


@app.post("/api/items")
def create_item():
    global next_id
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify(error="name is required"), 400
    item = {"id": next_id, "name": name}
    next_id += 1
    items.append(item)
    return jsonify(item), 201


@app.put("/api/items/<int:item_id>")
def update_item(item_id):
    item = find(item_id)
    if not item:
        return jsonify(error="Not found"), 404
    name = str((request.get_json(silent=True) or {}).get("name", "")).strip()
    if name:
        item["name"] = name
    return jsonify(item)


@app.delete("/api/items/<int:item_id>")
def delete_item(item_id):
    item = find(item_id)
    if not item:
        return jsonify(error="Not found"), 404
    items.remove(item)
    return "", 204


if __name__ == "__main__":
    app.run(port=5000, debug=True)` } },

  { id: "httpserver", title: "HTTP server", re: /\b(http|web|file) ?server\b|\bserver\b.*\b(node|python|go|golang)\b|\b(node|python|go|golang)\b.*\bserver\b|\bserve (a |an )?(html|static|web)/, langs: {
    javascript: R`
// Minimal HTTP server using only Node's built-in modules: node server.js
const http = require("http");

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>Hello from Node.js</h1>");
  } else if (req.method === "GET" && req.url === "/api/time") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ time: new Date().toISOString() }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running at http://localhost:" + PORT));`,
    python: R`
# Minimal HTTP server using only the standard library: python server.py
import json
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, content_type):
        data = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/":
            self.send(200, "<h1>Hello from Python</h1>", "text/html; charset=utf-8")
        elif self.path == "/api/time":
            self.send(200, json.dumps({"time": datetime.now(timezone.utc).isoformat()}), "application/json")
        else:
            self.send(404, "Not found", "text/plain")


if __name__ == "__main__":
    port = 8000
    print(f"Server running at http://localhost:{port}")
    HTTPServer(("", port), Handler).serve_forever()`,
    go: R`
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		fmt.Fprint(w, "<h1>Hello from Go</h1>")
	})
	http.HandleFunc("/api/time", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"time": time.Now().UTC().Format(time.RFC3339)})
	})
	log.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}` } },

  // --------------------------------------------------------------- files / io
  { id: "readfile", title: "Read a file", re: /\bread(ing)?\b.*\bfile\b|\bfile\b.*\bread(ing)?\b|\bopen (a |the )?(text )?file\b/, langs: {
    python: R`
def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


if __name__ == "__main__":
    text = read_file("example.txt")
    print(text)

    # or line by line, without loading the whole file:
    with open("example.txt", encoding="utf-8") as f:
        for number, line in enumerate(f, 1):
            print(number, line.rstrip("\n"))`,
    javascript: R`
// Node.js
const fs = require("fs");

// whole file at once
const text = fs.readFileSync("example.txt", "utf8");
console.log(text);

// line by line
text.split(/\r?\n/).forEach((line, i) => console.log(i + 1, line));

// or asynchronously
fs.promises.readFile("example.txt", "utf8").then(t => console.log(t.length + " characters"));`,
    go: R`
package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
)

func main() {
	// whole file at once
	data, err := os.ReadFile("example.txt")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Print(string(data))

	// line by line
	f, err := os.Open("example.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	for n := 1; scanner.Scan(); n++ {
		fmt.Println(n, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}
}`,
    rust: R`
use std::fs;
use std::io::{self, BufRead};

fn main() -> io::Result<()> {
    // whole file at once
    let text = fs::read_to_string("example.txt")?;
    println!("{}", text);

    // line by line
    let file = fs::File::open("example.txt")?;
    for (n, line) in io::BufReader::new(file).lines().enumerate() {
        println!("{} {}", n + 1, line?);
    }
    Ok(())
}`,
    java: R`
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class ReadFile {
    public static void main(String[] args) throws IOException {
        // whole file at once
        String text = Files.readString(Path.of("example.txt"));
        System.out.println(text);

        // line by line
        List<String> lines = Files.readAllLines(Path.of("example.txt"));
        for (int i = 0; i < lines.size(); i++) System.out.println((i + 1) + " " + lines.get(i));
    }
}`,
    c: R`
#include <stdio.h>

int main(void) {
    FILE *f = fopen("example.txt", "r");
    if (!f) {
        perror("example.txt");
        return 1;
    }
    char line[1024];
    int n = 1;
    while (fgets(line, sizeof line, f)) {
        printf("%d %s", n++, line);
    }
    fclose(f);
    return 0;
}`,
    cpp: R`
#include <fstream>
#include <iostream>
#include <string>

int main() {
    std::ifstream file("example.txt");
    if (!file) {
        std::cerr << "Could not open example.txt\n";
        return 1;
    }
    std::string line;
    int n = 1;
    while (std::getline(file, line)) {
        std::cout << n++ << " " << line << "\n";
    }
}`,
    ruby: R`
# whole file at once
text = File.read("example.txt")
puts text

# line by line
File.foreach("example.txt").with_index(1) do |line, n|
  puts "#{n} #{line}"
end` } },

  { id: "writefile", title: "Write to a file", re: /\b(write|save)\b.*\b(to|into|in) (a |the )?(text |new )?file\b|\bappend (to )?(a |the )?file\b|\bcreate (a |the )?(text )?file\b/, langs: {
    python: R`
lines = ["first line", "second line", "third line"]

# "w" creates the file or replaces its contents
with open("output.txt", "w", encoding="utf-8") as f:
    for line in lines:
        f.write(line + "\n")

# "a" appends to the end
with open("output.txt", "a", encoding="utf-8") as f:
    f.write("appended line\n")

print("Wrote output.txt")`,
    javascript: R`
// Node.js
const fs = require("fs");

const lines = ["first line", "second line", "third line"];
fs.writeFileSync("output.txt", lines.join("\n") + "\n", "utf8");   // create or replace
fs.appendFileSync("output.txt", "appended line\n", "utf8");       // append
console.log("Wrote output.txt");`,
    go: R`
package main

import (
	"fmt"
	"log"
	"os"
)

func main() {
	if err := os.WriteFile("output.txt", []byte("first line\nsecond line\n"), 0644); err != nil {
		log.Fatal(err)
	}
	f, err := os.OpenFile("output.txt", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	if _, err := f.WriteString("appended line\n"); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Wrote output.txt")
}`,
    rust: R`
use std::fs::{self, OpenOptions};
use std::io::{self, Write};

fn main() -> io::Result<()> {
    fs::write("output.txt", "first line\nsecond line\n")?;          // create or replace
    let mut f = OpenOptions::new().append(true).open("output.txt")?; // append
    writeln!(f, "appended line")?;
    println!("Wrote output.txt");
    Ok(())
}`,
    java: R`
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.List;

public class WriteFile {
    public static void main(String[] args) throws IOException {
        Path path = Path.of("output.txt");
        Files.write(path, List.of("first line", "second line"));   // create or replace
        Files.writeString(path, "appended line\n", StandardOpenOption.APPEND);
        System.out.println("Wrote output.txt");
    }
}`,
    c: R`
#include <stdio.h>

int main(void) {
    FILE *f = fopen("output.txt", "w");   /* "a" to append instead */
    if (!f) {
        perror("output.txt");
        return 1;
    }
    fprintf(f, "first line\n");
    fprintf(f, "second line\n");
    fclose(f);
    printf("Wrote output.txt\n");
    return 0;
}`,
    cpp: R`
#include <fstream>
#include <iostream>

int main() {
    std::ofstream out("output.txt");                 // std::ios::app to append
    if (!out) {
        std::cerr << "Could not open output.txt\n";
        return 1;
    }
    out << "first line\n" << "second line\n";
    std::cout << "Wrote output.txt\n";
}` } },

  { id: "fetchurl", title: "HTTP request", re: /\b(http (get |post )?request|get request|post request|fetch\b.*\b(url|api|data|json|website|web ?page)|call (an |a |the )?api|download (a |the )?(web ?page|url|file from))\b/, langs: {
    python: R`
import json
import urllib.request


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "python-example"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


if __name__ == "__main__":
    print(get_json("https://api.github.com/repos/python/cpython")["description"])`,
    javascript: R`
// Works in browsers and in Node.js 18+ (built-in fetch).
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

getJson("https://api.github.com/repos/nodejs/node")
  .then(data => console.log(data.description))
  .catch(err => console.error("Request failed:", err.message));`,
    go: R`
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://api.github.com/repos/golang/go")
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Fatalf("HTTP %d", resp.StatusCode)
	}
	var data struct {
		Description string ` + "`" + `json:"description"` + "`" + `
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		log.Fatal(err)
	}
	fmt.Println(data.Description)
}` } },

  { id: "json", title: "Parse and write JSON", re: /\b(parse|read|load|decode)\b.*\bjson\b|\bjson\b.*\b(parse|parsing|read|load|decode)\b/, langs: {
    python: R`
import json

text = '{"name": "Ada", "age": 36, "skills": ["math", "programming"]}'

data = json.loads(text)            # JSON string -> dict
print(data["name"], data["skills"][1])

data["age"] += 1
print(json.dumps(data, indent=2))  # dict -> JSON string

# files
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
with open("data.json", encoding="utf-8") as f:
    print(json.load(f)["age"])`,
    javascript: R`
const text = '{"name": "Ada", "age": 36, "skills": ["math", "programming"]}';

const data = JSON.parse(text);              // JSON string -> object
console.log(data.name, data.skills[1]);

data.age += 1;
console.log(JSON.stringify(data, null, 2)); // object -> JSON string

// invalid JSON throws, so guard untrusted input:
try { JSON.parse("{bad json}"); } catch (err) { console.log("Invalid JSON:", err.message); }`,
    go: R`
package main

import (
	"encoding/json"
	"fmt"
	"log"
)

type Person struct {
	Name   string   ` + "`" + `json:"name"` + "`" + `
	Age    int      ` + "`" + `json:"age"` + "`" + `
	Skills []string ` + "`" + `json:"skills"` + "`" + `
}

func main() {
	text := []byte(` + "`" + `{"name": "Ada", "age": 36, "skills": ["math", "programming"]}` + "`" + `)
	var p Person
	if err := json.Unmarshal(text, &p); err != nil {
		log.Fatal(err)
	}
	fmt.Println(p.Name, p.Skills[1])

	p.Age++
	out, _ := json.MarshalIndent(p, "", "  ")
	fmt.Println(string(out))
}` } },

  { id: "cliargs", title: "Command-line arguments", re: /\b(command[- ]?line|cli) (arg(ument)?s?|param(eter)?s?|options?)\b|\bargv\b/, langs: {
    python: R`
import argparse

parser = argparse.ArgumentParser(description="Greet someone.")
parser.add_argument("name", help="who to greet")
parser.add_argument("-n", "--times", type=int, default=1, help="how many times")
parser.add_argument("--shout", action="store_true", help="use capitals")
args = parser.parse_args()

message = f"Hello, {args.name}!"
for _ in range(args.times):
    print(message.upper() if args.shout else message)`,
    javascript: R`
// node greet.js Ada --times 2 --shout
const args = process.argv.slice(2);
const opts = { times: 1, shout: false, name: null };
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--times" || args[i] === "-n") opts.times = Number(args[++i]);
  else if (args[i] === "--shout") opts.shout = true;
  else opts.name = args[i];
}
if (!opts.name) { console.error("usage: node greet.js <name> [--times N] [--shout]"); process.exit(1); }
const msg = "Hello, " + opts.name + "!";
for (let i = 0; i < opts.times; i++) console.log(opts.shout ? msg.toUpperCase() : msg);`,
    go: R`
package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

func main() {
	times := flag.Int("times", 1, "how many times")
	shout := flag.Bool("shout", false, "use capitals")
	flag.Parse()
	if flag.NArg() < 1 {
		fmt.Fprintln(os.Stderr, "usage: greet [-times N] [-shout] <name>")
		os.Exit(1)
	}
	msg := "Hello, " + flag.Arg(0) + "!"
	if *shout {
		msg = strings.ToUpper(msg)
	}
	for i := 0; i < *times; i++ {
		fmt.Println(msg)
	}
}`,
    c: R`
#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("Program: %s\n", argv[0]);
    printf("%d argument(s):\n", argc - 1);
    for (int i = 1; i < argc; i++) {
        printf("  argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}`,
    rust: R`
use std::env;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() {
        eprintln!("usage: greet <name>");
        std::process::exit(1);
    }
    for (i, arg) in args.iter().enumerate() {
        println!("argument {}: {}", i + 1, arg);
    }
}` } },

  { id: "datetime", title: "Current date and time", re: /\b(current|today'?s?) (date|time|datetime)\b|\b(date and time|datetime) now\b|\bformat (a )?date\b/, langs: {
    python: R`
from datetime import datetime, timezone

now = datetime.now()
print(now)                                   # 2026-09-27 14:03:12.345678
print(now.strftime("%Y-%m-%d %H:%M:%S"))     # 2026-09-27 14:03:12
print(now.strftime("%A, %d %B %Y"))          # Sunday, 27 September 2026
print(datetime.now(timezone.utc).isoformat())`,
    javascript: R`
const now = new Date();
console.log(now.toISOString());                       // 2026-09-27T14:03:12.345Z (UTC)
console.log(now.toLocaleString());                    // local date and time
console.log(now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
const pad = n => String(n).padStart(2, "0");
console.log(now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()));`,
    go: R`
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println(now)
	fmt.Println(now.Format("2006-01-02 15:04:05")) // Go formats by example
	fmt.Println(now.Format("Monday, 02 January 2006"))
	fmt.Println(now.UTC().Format(time.RFC3339))
}`,
    java: R`
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Now {
    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();
        System.out.println(now);
        System.out.println(now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        System.out.println(now.format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")));
    }
}`,
    c: R`
#include <stdio.h>
#include <time.h>

int main(void) {
    time_t now = time(NULL);
    struct tm *local = localtime(&now);
    char buf[64];
    strftime(buf, sizeof buf, "%Y-%m-%d %H:%M:%S", local);
    printf("%s\n", buf);
    strftime(buf, sizeof buf, "%A, %d %B %Y", local);
    printf("%s\n", buf);
    return 0;
}` } },

  // ------------------------------------------------------------ algorithms
  { id: "mergesorted", title: "Merge two sorted arrays", re: /\bmerg\w* (two |2 )?sorted\b/, langs: {
    python: R`
def merge_sorted(a, b):
    result, i, j = [], 0, 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            result.append(a[i])
            i += 1
        else:
            result.append(b[j])
            j += 1
    result.extend(a[i:])
    result.extend(b[j:])
    return result


print(merge_sorted([1, 3, 5, 7], [2, 4, 6, 8, 10]))  # [1, 2, 3, 4, 5, 6, 7, 8, 10]`,
    javascript: R`
function mergeSorted(a, b) {
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) result.push(a[i] <= b[j] ? a[i++] : b[j++]);
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}

console.log(mergeSorted([1, 3, 5, 7], [2, 4, 6, 8, 10])); // [1, 2, 3, 4, 5, 6, 7, 8, 10]`,
    typescript: R`
function mergeSorted(a: number[], b: number[]): number[] {
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) result.push(a[i] <= b[j] ? a[i++] : b[j++]);
  while (i < a.length) result.push(a[i++]);
  while (j < b.length) result.push(b[j++]);
  return result;
}

console.log(mergeSorted([1, 3, 5, 7], [2, 4, 6, 8, 10]));`,
    java: R`
import java.util.Arrays;

public class MergeSorted {
    static int[] mergeSorted(int[] a, int[] b) {
        int[] result = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) result[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        while (i < a.length) result[k++] = a[i++];
        while (j < b.length) result[k++] = b[j++];
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(mergeSorted(new int[]{1, 3, 5, 7}, new int[]{2, 4, 6, 8, 10})));
    }
}`,
    go: R`
package main

import "fmt"

func mergeSorted(a, b []int) []int {
	result := make([]int, 0, len(a)+len(b))
	i, j := 0, 0
	for i < len(a) && j < len(b) {
		if a[i] <= b[j] {
			result = append(result, a[i])
			i++
		} else {
			result = append(result, b[j])
			j++
		}
	}
	result = append(result, a[i:]...)
	return append(result, b[j:]...)
}

func main() {
	fmt.Println(mergeSorted([]int{1, 3, 5, 7}, []int{2, 4, 6, 8, 10}))
}`,
    rust: R`
fn merge_sorted(a: &[i32], b: &[i32]) -> Vec<i32> {
    let mut result = Vec::with_capacity(a.len() + b.len());
    let (mut i, mut j) = (0, 0);
    while i < a.len() && j < b.len() {
        if a[i] <= b[j] { result.push(a[i]); i += 1; } else { result.push(b[j]); j += 1; }
    }
    result.extend_from_slice(&a[i..]);
    result.extend_from_slice(&b[j..]);
    result
}

fn main() {
    println!("{:?}", merge_sorted(&[1, 3, 5, 7], &[2, 4, 6, 8, 10]));
}`,
    c: R`
#include <stdio.h>

void merge_sorted(const int *a, int na, const int *b, int nb, int *out) {
    int i = 0, j = 0, k = 0;
    while (i < na && j < nb) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < na) out[k++] = a[i++];
    while (j < nb) out[k++] = b[j++];
}

int main(void) {
    int a[] = {1, 3, 5, 7}, b[] = {2, 4, 6, 8, 10}, out[9];
    merge_sorted(a, 4, b, 5, out);
    for (int i = 0; i < 9; i++) printf("%d ", out[i]);
    printf("\n");
    return 0;
}`,
    cpp: R`
#include <iostream>
#include <vector>

std::vector<int> mergeSorted(const std::vector<int>& a, const std::vector<int>& b) {
    std::vector<int> result;
    result.reserve(a.size() + b.size());
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) result.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) result.push_back(a[i++]);
    while (j < b.size()) result.push_back(b[j++]);
    return result;
}

int main() {
    for (int x : mergeSorted({1, 3, 5, 7}, {2, 4, 6, 8, 10})) std::cout << x << " ";
    std::cout << "\n";
}` } },

  { id: "quicksort", title: "Quicksort", re: /\bquick ?sort\b/, langs: {
    python: R`
def quicksort(items):
    if len(items) <= 1:
        return items
    pivot = items[len(items) // 2]
    less = [x for x in items if x < pivot]
    equal = [x for x in items if x == pivot]
    greater = [x for x in items if x > pivot]
    return quicksort(less) + equal + quicksort(greater)


print(quicksort([33, 10, 55, 71, 29, 3, 18, 42]))  # [3, 10, 18, 29, 33, 42, 55, 71]`,
    javascript: R`
// in-place quicksort (Lomuto partition)
function quicksort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return a;
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; }
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  quicksort(a, lo, i - 1);
  quicksort(a, i + 1, hi);
  return a;
}

console.log(quicksort([33, 10, 55, 71, 29, 3, 18, 42])); // [3, 10, 18, 29, 33, 42, 55, 71]`,
    java: R`
import java.util.Arrays;

public class QuickSort {
    static void quicksort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int pivot = a[hi], i = lo;
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) { int t = a[i]; a[i] = a[j]; a[j] = t; i++; }
        }
        int t = a[i]; a[i] = a[hi]; a[hi] = t;
        quicksort(a, lo, i - 1);
        quicksort(a, i + 1, hi);
    }

    public static void main(String[] args) {
        int[] a = {33, 10, 55, 71, 29, 3, 18, 42};
        quicksort(a, 0, a.length - 1);
        System.out.println(Arrays.toString(a));
    }
}`,
    c: R`
#include <stdio.h>

static void swap(int *x, int *y) { int t = *x; *x = *y; *y = t; }

void quicksort(int *a, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) swap(&a[i++], &a[j]);
    }
    swap(&a[i], &a[hi]);
    quicksort(a, lo, i - 1);
    quicksort(a, i + 1, hi);
}

int main(void) {
    int a[] = {33, 10, 55, 71, 29, 3, 18, 42};
    int n = sizeof a / sizeof a[0];
    quicksort(a, 0, n - 1);
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\n");
    return 0;
}`,
    cpp: R`
#include <iostream>
#include <utility>
#include <vector>

void quicksort(std::vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) std::swap(a[i++], a[j]);
    }
    std::swap(a[i], a[hi]);
    quicksort(a, lo, i - 1);
    quicksort(a, i + 1, hi);
}

int main() {
    std::vector<int> a = {33, 10, 55, 71, 29, 3, 18, 42};
    quicksort(a, 0, (int) a.size() - 1);
    for (int x : a) std::cout << x << " ";
    std::cout << "\n";
}`,
    go: R`
package main

import "fmt"

func quicksort(a []int) {
	if len(a) < 2 {
		return
	}
	pivot, i := a[len(a)-1], 0
	for j := 0; j < len(a)-1; j++ {
		if a[j] < pivot {
			a[i], a[j] = a[j], a[i]
			i++
		}
	}
	a[i], a[len(a)-1] = a[len(a)-1], a[i]
	quicksort(a[:i])
	quicksort(a[i+1:])
}

func main() {
	a := []int{33, 10, 55, 71, 29, 3, 18, 42}
	quicksort(a)
	fmt.Println(a)
}`,
    rust: R`
fn quicksort(a: &mut [i32]) {
    if a.len() < 2 {
        return;
    }
    let last = a.len() - 1;
    let pivot = a[last];
    let mut i = 0;
    for j in 0..last {
        if a[j] < pivot {
            a.swap(i, j);
            i += 1;
        }
    }
    a.swap(i, last);
    let (left, right) = a.split_at_mut(i);
    quicksort(left);
    quicksort(&mut right[1..]);
}

fn main() {
    let mut a = [33, 10, 55, 71, 29, 3, 18, 42];
    quicksort(&mut a);
    println!("{:?}", a);
}` } },

  { id: "mergesort", title: "Merge sort", re: /\bmerge ?sort\b/, langs: {
    python: R`
def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    left, right = merge_sort(items[:mid]), merge_sort(items[mid:])
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    return result + left[i:] + right[j:]


print(merge_sort([38, 27, 43, 3, 9, 82, 10]))  # [3, 9, 10, 27, 38, 43, 82]`,
    javascript: R`
function mergeSort(a) {
  if (a.length <= 1) return a;
  const mid = Math.floor(a.length / 2);
  const left = mergeSort(a.slice(0, mid)), right = mergeSort(a.slice(mid));
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) result.push(left[i] <= right[j] ? left[i++] : right[j++]);
  return result.concat(left.slice(i), right.slice(j));
}

console.log(mergeSort([38, 27, 43, 3, 9, 82, 10])); // [3, 9, 10, 27, 38, 43, 82]`,
    java: R`
import java.util.Arrays;

public class MergeSort {
    static int[] mergeSort(int[] a) {
        if (a.length <= 1) return a;
        int mid = a.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(a, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(a, mid, a.length));
        int[] out = new int[a.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) out[k++] = left[i] <= right[j] ? left[i++] : right[j++];
        while (i < left.length) out[k++] = left[i++];
        while (j < right.length) out[k++] = right[j++];
        return out;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(mergeSort(new int[]{38, 27, 43, 3, 9, 82, 10})));
    }
}`,
    c: R`
#include <stdio.h>
#include <string.h>

static void merge_sort(int *a, int *tmp, int n) {
    if (n < 2) return;
    int mid = n / 2;
    merge_sort(a, tmp, mid);
    merge_sort(a + mid, tmp, n - mid);
    int i = 0, j = mid, k = 0;
    while (i < mid && j < n) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i < mid) tmp[k++] = a[i++];
    while (j < n) tmp[k++] = a[j++];
    memcpy(a, tmp, n * sizeof *a);
}

int main(void) {
    int a[] = {38, 27, 43, 3, 9, 82, 10}, tmp[7];
    merge_sort(a, tmp, 7);
    for (int i = 0; i < 7; i++) printf("%d ", a[i]);
    printf("\n");
    return 0;
}`,
    go: R`
package main

import "fmt"

func mergeSort(a []int) []int {
	if len(a) <= 1 {
		return a
	}
	mid := len(a) / 2
	left, right := mergeSort(a[:mid]), mergeSort(a[mid:])
	out := make([]int, 0, len(a))
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if left[i] <= right[j] {
			out = append(out, left[i])
			i++
		} else {
			out = append(out, right[j])
			j++
		}
	}
	out = append(out, left[i:]...)
	return append(out, right[j:]...)
}

func main() {
	fmt.Println(mergeSort([]int{38, 27, 43, 3, 9, 82, 10}))
}` } },

  { id: "insertionsort", title: "Insertion sort", re: /\binsertion ?sort\b/, langs: {
    python: R`
def insertion_sort(items):
    a = list(items)
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a


print(insertion_sort([12, 11, 13, 5, 6]))  # [5, 6, 11, 12, 13]`,
    javascript: R`
function insertionSort(items) {
  const a = [...items];
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return a;
}

console.log(insertionSort([12, 11, 13, 5, 6])); // [5, 6, 11, 12, 13]`,
    c: R`
#include <stdio.h>

void insertion_sort(int *a, int n) {
    for (int i = 1; i < n; i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
        a[j + 1] = key;
    }
}

int main(void) {
    int a[] = {12, 11, 13, 5, 6};
    insertion_sort(a, 5);
    for (int i = 0; i < 5; i++) printf("%d ", a[i]);
    printf("\n");
    return 0;
}` } },

  { id: "selectionsort", title: "Selection sort", re: /\bselection ?sort\b/, langs: {
    python: R`
def selection_sort(items):
    a = list(items)
    for i in range(len(a)):
        smallest = min(range(i, len(a)), key=a.__getitem__)
        a[i], a[smallest] = a[smallest], a[i]
    return a


print(selection_sort([64, 25, 12, 22, 11]))  # [11, 12, 22, 25, 64]`,
    javascript: R`
function selectionSort(items) {
  const a = [...items];
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i + 1; j < a.length; j++) if (a[j] < a[min]) min = j;
    [a[i], a[min]] = [a[min], a[i]];
  }
  return a;
}

console.log(selectionSort([64, 25, 12, 22, 11])); // [11, 12, 22, 25, 64]`,
    c: R`
#include <stdio.h>

void selection_sort(int *a, int n) {
    for (int i = 0; i < n - 1; i++) {
        int min = i;
        for (int j = i + 1; j < n; j++) if (a[j] < a[min]) min = j;
        int t = a[i]; a[i] = a[min]; a[min] = t;
    }
}

int main(void) {
    int a[] = {64, 25, 12, 22, 11};
    selection_sort(a, 5);
    for (int i = 0; i < 5; i++) printf("%d ", a[i]);
    printf("\n");
    return 0;
}` } },

  { id: "linkedlist", title: "Linked list", re: /\blinked ?list\b/, langs: {
    python: R`
class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None
        self.size = 0

    def push_front(self, value):
        self.head = Node(value, self.head)
        self.size += 1

    def append(self, value):
        node = Node(value)
        if not self.head:
            self.head = node
        else:
            cur = self.head
            while cur.next:
                cur = cur.next
            cur.next = node
        self.size += 1

    def remove(self, value):
        prev, cur = None, self.head
        while cur:
            if cur.value == value:
                if prev:
                    prev.next = cur.next
                else:
                    self.head = cur.next
                self.size -= 1
                return True
            prev, cur = cur, cur.next
        return False

    def reverse(self):
        prev, cur = None, self.head
        while cur:
            cur.next, prev, cur = prev, cur, cur.next
        self.head = prev

    def __iter__(self):
        cur = self.head
        while cur:
            yield cur.value
            cur = cur.next

    def __repr__(self):
        return " -> ".join(map(str, self)) or "(empty)"


lst = LinkedList()
for v in [1, 2, 3, 4]:
    lst.append(v)
lst.push_front(0)
lst.remove(3)
print(lst)       # 0 -> 1 -> 2 -> 4
lst.reverse()
print(lst)       # 4 -> 2 -> 1 -> 0`,
    javascript: R`
class Node {
  constructor(value, next = null) { this.value = value; this.next = next; }
}

class LinkedList {
  constructor() { this.head = null; this.size = 0; }

  pushFront(value) { this.head = new Node(value, this.head); this.size++; }

  append(value) {
    const node = new Node(value);
    if (!this.head) this.head = node;
    else { let cur = this.head; while (cur.next) cur = cur.next; cur.next = node; }
    this.size++;
  }

  remove(value) {
    let prev = null, cur = this.head;
    while (cur) {
      if (cur.value === value) {
        if (prev) prev.next = cur.next; else this.head = cur.next;
        this.size--;
        return true;
      }
      prev = cur; cur = cur.next;
    }
    return false;
  }

  reverse() {
    let prev = null, cur = this.head;
    while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }
    this.head = prev;
  }

  *[Symbol.iterator]() { for (let cur = this.head; cur; cur = cur.next) yield cur.value; }

  toString() { return [...this].join(" -> ") || "(empty)"; }
}

const list = new LinkedList();
[1, 2, 3, 4].forEach(v => list.append(v));
list.pushFront(0);
list.remove(3);
console.log(String(list)); // 0 -> 1 -> 2 -> 4
list.reverse();
console.log(String(list)); // 4 -> 2 -> 1 -> 0`,
    java: R`
public class LinkedList<T> {
    private static class Node<T> {
        T value;
        Node<T> next;
        Node(T value, Node<T> next) { this.value = value; this.next = next; }
    }

    private Node<T> head;
    private int size;

    public void pushFront(T value) { head = new Node<>(value, head); size++; }

    public void append(T value) {
        Node<T> node = new Node<>(value, null);
        if (head == null) head = node;
        else { Node<T> cur = head; while (cur.next != null) cur = cur.next; cur.next = node; }
        size++;
    }

    public boolean remove(T value) {
        Node<T> prev = null, cur = head;
        while (cur != null) {
            if (cur.value.equals(value)) {
                if (prev != null) prev.next = cur.next; else head = cur.next;
                size--;
                return true;
            }
            prev = cur;
            cur = cur.next;
        }
        return false;
    }

    public void reverse() {
        Node<T> prev = null, cur = head;
        while (cur != null) { Node<T> next = cur.next; cur.next = prev; prev = cur; cur = next; }
        head = prev;
    }

    public int size() { return size; }

    @Override public String toString() {
        StringBuilder sb = new StringBuilder();
        for (Node<T> cur = head; cur != null; cur = cur.next) sb.append(cur.value).append(cur.next != null ? " -> " : "");
        return sb.length() == 0 ? "(empty)" : sb.toString();
    }

    public static void main(String[] args) {
        LinkedList<Integer> list = new LinkedList<>();
        for (int v : new int[]{1, 2, 3, 4}) list.append(v);
        list.pushFront(0);
        list.remove(3);
        System.out.println(list);
        list.reverse();
        System.out.println(list);
    }
}`,
    c: R`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

void push_front(Node **head, int value) {
    Node *n = malloc(sizeof *n);
    n->value = value;
    n->next = *head;
    *head = n;
}

void append(Node **head, int value) {
    Node *n = malloc(sizeof *n);
    n->value = value;
    n->next = NULL;
    while (*head) head = &(*head)->next;
    *head = n;
}

int remove_value(Node **head, int value) {
    for (; *head; head = &(*head)->next) {
        if ((*head)->value == value) {
            Node *dead = *head;
            *head = dead->next;
            free(dead);
            return 1;
        }
    }
    return 0;
}

void reverse(Node **head) {
    Node *prev = NULL, *cur = *head;
    while (cur) { Node *next = cur->next; cur->next = prev; prev = cur; cur = next; }
    *head = prev;
}

void print_list(const Node *n) {
    for (; n; n = n->next) printf("%d%s", n->value, n->next ? " -> " : "\n");
}

void free_list(Node *n) {
    while (n) { Node *next = n->next; free(n); n = next; }
}

int main(void) {
    Node *list = NULL;
    for (int v = 1; v <= 4; v++) append(&list, v);
    push_front(&list, 0);
    remove_value(&list, 3);
    print_list(list);   /* 0 -> 1 -> 2 -> 4 */
    reverse(&list);
    print_list(list);   /* 4 -> 2 -> 1 -> 0 */
    free_list(list);
    return 0;
}`,
    cpp: R`
#include <iostream>
#include <memory>

template <typename T>
class LinkedList {
    struct Node {
        T value;
        std::unique_ptr<Node> next;
    };
    std::unique_ptr<Node> head;

public:
    void pushFront(T value) { head = std::unique_ptr<Node>(new Node{value, std::move(head)}); }

    void append(T value) {
        std::unique_ptr<Node>* cur = &head;
        while (*cur) cur = &(*cur)->next;
        *cur = std::unique_ptr<Node>(new Node{value, nullptr});
    }

    bool remove(const T& value) {
        for (std::unique_ptr<Node>* cur = &head; *cur; cur = &(*cur)->next) {
            if ((*cur)->value == value) { *cur = std::move((*cur)->next); return true; }
        }
        return false;
    }

    void print() const {
        for (Node* n = head.get(); n; n = n->next.get()) std::cout << n->value << (n->next ? " -> " : "\n");
    }
};

int main() {
    LinkedList<int> list;
    for (int v = 1; v <= 4; v++) list.append(v);
    list.pushFront(0);
    list.remove(3);
    list.print();   // 0 -> 1 -> 2 -> 4
}`,
    go: R`
package main

import (
	"fmt"
	"strings"
)

type Node struct {
	Value int
	Next  *Node
}

type LinkedList struct {
	Head *Node
	Size int
}

func (l *LinkedList) PushFront(v int) {
	l.Head = &Node{v, l.Head}
	l.Size++
}

func (l *LinkedList) Append(v int) {
	p := &l.Head
	for *p != nil {
		p = &(*p).Next
	}
	*p = &Node{Value: v}
	l.Size++
}

func (l *LinkedList) Remove(v int) bool {
	for p := &l.Head; *p != nil; p = &(*p).Next {
		if (*p).Value == v {
			*p = (*p).Next
			l.Size--
			return true
		}
	}
	return false
}

func (l *LinkedList) String() string {
	var parts []string
	for n := l.Head; n != nil; n = n.Next {
		parts = append(parts, fmt.Sprint(n.Value))
	}
	return strings.Join(parts, " -> ")
}

func main() {
	var l LinkedList
	for v := 1; v <= 4; v++ {
		l.Append(v)
	}
	l.PushFront(0)
	l.Remove(3)
	fmt.Println(l.String()) // 0 -> 1 -> 2 -> 4
}` } },

  { id: "stack", title: "Stack", re: /\bstack\b(?!\s*(overflow|trace))(?!.*\b(full ?stack|tech stack)\b)/, langs: {
    python: R`
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("peek at empty stack")
        return self._items[-1]

    def is_empty(self):
        return not self._items

    def __len__(self):
        return len(self._items)


s = Stack()
for x in (1, 2, 3):
    s.push(x)
print(s.pop(), s.peek(), len(s))  # 3 2 2`,
    javascript: R`
class Stack {
  #items = [];
  push(item) { this.#items.push(item); }
  pop() {
    if (!this.#items.length) throw new Error("pop from empty stack");
    return this.#items.pop();
  }
  peek() {
    if (!this.#items.length) throw new Error("peek at empty stack");
    return this.#items[this.#items.length - 1];
  }
  isEmpty() { return this.#items.length === 0; }
  get size() { return this.#items.length; }
}

const s = new Stack();
[1, 2, 3].forEach(x => s.push(x));
console.log(s.pop(), s.peek(), s.size); // 3 2 2`,
    java: R`
import java.util.ArrayList;
import java.util.EmptyStackException;

public class Stack<T> {
    private final ArrayList<T> items = new ArrayList<>();

    public void push(T item) { items.add(item); }

    public T pop() {
        if (items.isEmpty()) throw new EmptyStackException();
        return items.remove(items.size() - 1);
    }

    public T peek() {
        if (items.isEmpty()) throw new EmptyStackException();
        return items.get(items.size() - 1);
    }

    public boolean isEmpty() { return items.isEmpty(); }
    public int size() { return items.size(); }

    public static void main(String[] args) {
        Stack<Integer> s = new Stack<>();
        s.push(1); s.push(2); s.push(3);
        System.out.println(s.pop() + " " + s.peek() + " " + s.size()); // 3 2 2
    }
}`,
    c: R`
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *items;
    int size, capacity;
} Stack;

void push(Stack *s, int v) {
    if (s->size == s->capacity) {
        s->capacity = s->capacity ? s->capacity * 2 : 8;
        s->items = realloc(s->items, s->capacity * sizeof *s->items);
    }
    s->items[s->size++] = v;
}

int pop(Stack *s) {
    if (s->size == 0) { fprintf(stderr, "pop from empty stack\n"); exit(1); }
    return s->items[--s->size];
}

int peek(const Stack *s) {
    if (s->size == 0) { fprintf(stderr, "peek at empty stack\n"); exit(1); }
    return s->items[s->size - 1];
}

int main(void) {
    Stack s = {0};
    push(&s, 1); push(&s, 2); push(&s, 3);
    int top = pop(&s);
    printf("%d %d %d\n", top, peek(&s), s.size);   /* 3 2 2 */
    free(s.items);
    return 0;
}`,
    go: R`
package main

import (
	"errors"
	"fmt"
)

type Stack[T any] struct{ items []T }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, error) {
	var zero T
	if len(s.items) == 0 {
		return zero, errors.New("pop from empty stack")
	}
	v := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return v, nil
}

func (s *Stack[T]) Len() int { return len(s.items) }

func main() {
	var s Stack[int]
	s.Push(1)
	s.Push(2)
	s.Push(3)
	top, _ := s.Pop()
	fmt.Println(top, s.Len()) // 3 2
}` } },

  { id: "queue", title: "Queue", re: /\bqueue\b/, langs: {
    python: R`
from collections import deque


class Queue:
    def __init__(self):
        self._items = deque()

    def enqueue(self, item):
        self._items.append(item)

    def dequeue(self):
        if not self._items:
            raise IndexError("dequeue from empty queue")
        return self._items.popleft()   # O(1), unlike list.pop(0)

    def peek(self):
        if not self._items:
            raise IndexError("peek at empty queue")
        return self._items[0]

    def __len__(self):
        return len(self._items)


q = Queue()
for x in ("a", "b", "c"):
    q.enqueue(x)
print(q.dequeue(), q.peek(), len(q))  # a b 2`,
    javascript: R`
// O(1) enqueue and dequeue (array shift() is O(n))
class Queue {
  #items = {};
  #head = 0;
  #tail = 0;
  enqueue(item) { this.#items[this.#tail++] = item; }
  dequeue() {
    if (this.size === 0) throw new Error("dequeue from empty queue");
    const item = this.#items[this.#head];
    delete this.#items[this.#head++];
    return item;
  }
  peek() {
    if (this.size === 0) throw new Error("peek at empty queue");
    return this.#items[this.#head];
  }
  get size() { return this.#tail - this.#head; }
}

const q = new Queue();
["a", "b", "c"].forEach(x => q.enqueue(x));
console.log(q.dequeue(), q.peek(), q.size); // a b 2`,
    java: R`
import java.util.ArrayDeque;
import java.util.Queue;

public class QueueDemo {
    public static void main(String[] args) {
        Queue<String> q = new ArrayDeque<>();
        q.offer("a");
        q.offer("b");
        q.offer("c");
        System.out.println(q.poll() + " " + q.peek() + " " + q.size()); // a b 2
    }
}`,
    go: R`
package main

import "fmt"

type Queue[T any] struct{ items []T }

func (q *Queue[T]) Enqueue(v T) { q.items = append(q.items, v) }

func (q *Queue[T]) Dequeue() (T, bool) {
	var zero T
	if len(q.items) == 0 {
		return zero, false
	}
	v := q.items[0]
	q.items = q.items[1:]
	return v, true
}

func (q *Queue[T]) Len() int { return len(q.items) }

func main() {
	var q Queue[string]
	q.Enqueue("a")
	q.Enqueue("b")
	q.Enqueue("c")
	first, _ := q.Dequeue()
	fmt.Println(first, q.Len()) // a 2
}` } },

  { id: "bst", title: "Binary search tree", re: /\bbinary (search )?tree\b|\bbst\b/, langs: {
    python: R`
class Node:
    def __init__(self, key):
        self.key = key
        self.left = self.right = None


class BST:
    def __init__(self):
        self.root = None

    def insert(self, key):
        if self.root is None:
            self.root = Node(key)
            return
        cur = self.root
        while True:
            if key < cur.key:
                if cur.left is None:
                    cur.left = Node(key)
                    return
                cur = cur.left
            elif key > cur.key:
                if cur.right is None:
                    cur.right = Node(key)
                    return
                cur = cur.right
            else:
                return  # no duplicates

    def contains(self, key):
        cur = self.root
        while cur:
            if key == cur.key:
                return True
            cur = cur.left if key < cur.key else cur.right
        return False

    def inorder(self):
        out, stack, cur = [], [], self.root
        while stack or cur:
            while cur:
                stack.append(cur)
                cur = cur.left
            cur = stack.pop()
            out.append(cur.key)
            cur = cur.right
        return out

    def height(self, node="root"):
        node = self.root if node == "root" else node
        return 0 if node is None else 1 + max(self.height(node.left), self.height(node.right))


tree = BST()
for k in [50, 30, 70, 20, 40, 60, 80]:
    tree.insert(k)
print(tree.inorder())                      # [20, 30, 40, 50, 60, 70, 80]
print(tree.contains(60), tree.contains(65))  # True False
print(tree.height())                       # 3`,
    javascript: R`
class Node {
  constructor(key) { this.key = key; this.left = null; this.right = null; }
}

class BST {
  constructor() { this.root = null; }

  insert(key) {
    const node = new Node(key);
    if (!this.root) { this.root = node; return; }
    let cur = this.root;
    for (;;) {
      if (key === cur.key) return;               // no duplicates
      const side = key < cur.key ? "left" : "right";
      if (!cur[side]) { cur[side] = node; return; }
      cur = cur[side];
    }
  }

  contains(key) {
    let cur = this.root;
    while (cur) {
      if (key === cur.key) return true;
      cur = key < cur.key ? cur.left : cur.right;
    }
    return false;
  }

  inorder(node = this.root, out = []) {
    if (node) { this.inorder(node.left, out); out.push(node.key); this.inorder(node.right, out); }
    return out;
  }

  height(node = this.root) {
    return node ? 1 + Math.max(this.height(node.left), this.height(node.right)) : 0;
  }
}

const tree = new BST();
[50, 30, 70, 20, 40, 60, 80].forEach(k => tree.insert(k));
console.log(tree.inorder());                        // [20, 30, 40, 50, 60, 70, 80]
console.log(tree.contains(60), tree.contains(65));  // true false
console.log(tree.height());                         // 3`,
    java: R`
import java.util.ArrayList;
import java.util.List;

public class BST {
    private static class Node {
        int key;
        Node left, right;
        Node(int key) { this.key = key; }
    }

    private Node root;

    public void insert(int key) { root = insert(root, key); }

    private Node insert(Node n, int key) {
        if (n == null) return new Node(key);
        if (key < n.key) n.left = insert(n.left, key);
        else if (key > n.key) n.right = insert(n.right, key);
        return n;
    }

    public boolean contains(int key) {
        Node cur = root;
        while (cur != null) {
            if (key == cur.key) return true;
            cur = key < cur.key ? cur.left : cur.right;
        }
        return false;
    }

    public List<Integer> inorder() { List<Integer> out = new ArrayList<>(); inorder(root, out); return out; }

    private void inorder(Node n, List<Integer> out) {
        if (n == null) return;
        inorder(n.left, out);
        out.add(n.key);
        inorder(n.right, out);
    }

    public static void main(String[] args) {
        BST tree = new BST();
        for (int k : new int[]{50, 30, 70, 20, 40, 60, 80}) tree.insert(k);
        System.out.println(tree.inorder());
        System.out.println(tree.contains(60) + " " + tree.contains(65));
    }
}`,
    c: R`
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int key;
    struct Node *left, *right;
} Node;

Node *insert(Node *n, int key) {
    if (!n) {
        n = calloc(1, sizeof *n);
        n->key = key;
    } else if (key < n->key) {
        n->left = insert(n->left, key);
    } else if (key > n->key) {
        n->right = insert(n->right, key);
    }
    return n;
}

int contains(const Node *n, int key) {
    while (n) {
        if (key == n->key) return 1;
        n = key < n->key ? n->left : n->right;
    }
    return 0;
}

void inorder(const Node *n) {
    if (!n) return;
    inorder(n->left);
    printf("%d ", n->key);
    inorder(n->right);
}

void free_tree(Node *n) {
    if (!n) return;
    free_tree(n->left);
    free_tree(n->right);
    free(n);
}

int main(void) {
    Node *root = NULL;
    int keys[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) root = insert(root, keys[i]);
    inorder(root);                                     /* 20 30 40 50 60 70 80 */
    printf("\n%d %d\n", contains(root, 60), contains(root, 65));   /* 1 0 */
    free_tree(root);
    return 0;
}`,
    go: R`
package main

import "fmt"

type Node struct {
	Key         int
	Left, Right *Node
}

func Insert(n *Node, key int) *Node {
	if n == nil {
		return &Node{Key: key}
	}
	if key < n.Key {
		n.Left = Insert(n.Left, key)
	} else if key > n.Key {
		n.Right = Insert(n.Right, key)
	}
	return n
}

func Contains(n *Node, key int) bool {
	for n != nil {
		if key == n.Key {
			return true
		}
		if key < n.Key {
			n = n.Left
		} else {
			n = n.Right
		}
	}
	return false
}

func Inorder(n *Node, visit func(int)) {
	if n == nil {
		return
	}
	Inorder(n.Left, visit)
	visit(n.Key)
	Inorder(n.Right, visit)
}

func main() {
	var root *Node
	for _, k := range []int{50, 30, 70, 20, 40, 60, 80} {
		root = Insert(root, k)
	}
	Inorder(root, func(k int) { fmt.Print(k, " ") })
	fmt.Println()
	fmt.Println(Contains(root, 60), Contains(root, 65)) // true false
}` } },

  { id: "twosum", title: "Two sum", re: /\btwo ?sum\b|\bpair (that |which )?(adds?|sums?) (up )?to\b/, langs: {
    python: R`
def two_sum(nums, target):
    """Indices of the two numbers that add up to target, or None. O(n)."""
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return seen[target - n], i
        seen[n] = i
    return None


print(two_sum([2, 7, 11, 15], 9))   # (0, 1)
print(two_sum([3, 2, 4], 6))        # (1, 2)`,
    javascript: R`
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}

console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));      // [1, 2]`,
    java: R`
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        return null;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // [0, 1]
    }
}`,
    cpp: R`
#include <iostream>
#include <unordered_map>
#include <vector>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < (int) nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    auto r = twoSum({2, 7, 11, 15}, 9);
    std::cout << r[0] << " " << r[1] << "\n";   // 0 1
}`,
    go: R`
package main

import "fmt"

func twoSum(nums []int, target int) (int, int, bool) {
	seen := map[int]int{}
	for i, n := range nums {
		if j, ok := seen[target-n]; ok {
			return j, i, true
		}
		seen[n] = i
	}
	return 0, 0, false
}

func main() {
	fmt.Println(twoSum([]int{2, 7, 11, 15}, 9)) // 0 1 true
}` } },

  { id: "maxmin", title: "Largest and smallest in a list", re: /\b(largest|biggest|max(imum)?|smallest|lowest|min(imum)?|highest)\b.*\b(array|list|numbers|elements?|values)\b/, langs: {
    python: R`
def min_max(items):
    if not items:
        raise ValueError("empty list")
    smallest = largest = items[0]
    for x in items[1:]:
        if x < smallest:
            smallest = x
        elif x > largest:
            largest = x
    return smallest, largest


nums = [34, 7, 23, 32, 5, 62]
print(min_max(nums))      # (5, 62)
print(min(nums), max(nums))  # the built-ins do the same`,
    javascript: R`
function minMax(items) {
  if (!items.length) throw new Error("empty array");
  let min = items[0], max = items[0];
  for (const x of items) { if (x < min) min = x; if (x > max) max = x; }
  return { min, max };
}

const nums = [34, 7, 23, 32, 5, 62];
console.log(minMax(nums));                         // { min: 5, max: 62 }
console.log(Math.min(...nums), Math.max(...nums)); // fine for small arrays`,
    c: R`
#include <stdio.h>

int main(void) {
    int a[] = {34, 7, 23, 32, 5, 62};
    int n = sizeof a / sizeof a[0];
    int min = a[0], max = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] < min) min = a[i];
        if (a[i] > max) max = a[i];
    }
    printf("min = %d, max = %d\n", min, max);
    return 0;
}`,
    java: R`
public class MinMax {
    public static void main(String[] args) {
        int[] a = {34, 7, 23, 32, 5, 62};
        int min = a[0], max = a[0];
        for (int x : a) {
            if (x < min) min = x;
            if (x > max) max = x;
        }
        System.out.println("min = " + min + ", max = " + max);
    }
}`,
    go: R`
package main

import "fmt"

func minMax(a []int) (int, int) {
	lo, hi := a[0], a[0]
	for _, x := range a[1:] {
		if x < lo {
			lo = x
		}
		if x > hi {
			hi = x
		}
	}
	return lo, hi
}

func main() {
	fmt.Println(minMax([]int{34, 7, 23, 32, 5, 62})) // 5 62
}` } },

  { id: "dedupe", title: "Remove duplicates", re: /\bremov\w* (the )?duplicates?\b|\bdedup\w*\b.*\b(array|list)\b|\bunique (elements|values|items)\b/, langs: {
    python: R`
def remove_duplicates(items):
    """Keeps the first occurrence of each item, in order."""
    seen = set()
    out = []
    for x in items:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


print(remove_duplicates([3, 1, 3, 2, 1, 5]))  # [3, 1, 2, 5]
print(list(dict.fromkeys([3, 1, 3, 2, 1, 5])))  # one-liner, same result`,
    javascript: R`
const removeDuplicates = items => [...new Set(items)]; // keeps first occurrences, in order

console.log(removeDuplicates([3, 1, 3, 2, 1, 5])); // [3, 1, 2, 5]

// by a key, for objects:
const uniqueBy = (items, key) => [...new Map(items.map(x => [x[key], x])).values()];`,
    java: R`
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

public class Dedupe {
    public static void main(String[] args) {
        List<Integer> items = List.of(3, 1, 3, 2, 1, 5);
        List<Integer> unique = new ArrayList<>(new LinkedHashSet<>(items)); // keeps order
        System.out.println(unique); // [3, 1, 2, 5]
    }
}`,
    go: R`
package main

import "fmt"

func removeDuplicates[T comparable](items []T) []T {
	seen := make(map[T]bool)
	var out []T
	for _, x := range items {
		if !seen[x] {
			seen[x] = true
			out = append(out, x)
		}
	}
	return out
}

func main() {
	fmt.Println(removeDuplicates([]int{3, 1, 3, 2, 1, 5})) // [3 1 2 5]
}` } },

  { id: "flatten", title: "Flatten a nested list", re: /\bflatt?en\b/, langs: {
    python: R`
def flatten(items):
    """Flattens arbitrarily nested lists/tuples into one flat list."""
    out = []
    for x in items:
        if isinstance(x, (list, tuple)):
            out.extend(flatten(x))
        else:
            out.append(x)
    return out


print(flatten([1, [2, [3, [4]], 5], (6, 7)]))  # [1, 2, 3, 4, 5, 6, 7]`,
    javascript: R`
// built in: arr.flat(Infinity)
console.log([1, [2, [3, [4]], 5]].flat(Infinity)); // [1, 2, 3, 4, 5]

// by hand, without recursion limits:
function flatten(items) {
  const out = [], stack = [...items].reverse();
  while (stack.length) {
    const x = stack.pop();
    if (Array.isArray(x)) for (let i = x.length - 1; i >= 0; i--) stack.push(x[i]);
    else out.push(x);
  }
  return out;
}

console.log(flatten([1, [2, [3, [4]], 5]])); // [1, 2, 3, 4, 5]`,
    ruby: R`
nested = [1, [2, [3, [4]], 5]]
p nested.flatten   # [1, 2, 3, 4, 5]` } },

  { id: "vowels", title: "Count vowels", re: /\bcount\w*\b.*\bvowels?\b|\bvowels?\b.*\bcount\b|\bnumber of vowels\b/, langs: {
    python: R`
def count_vowels(text):
    return sum(1 for c in text.lower() if c in "aeiou")


print(count_vowels("Hello World"))  # 3`,
    javascript: R`
function countVowels(text) {
  return (text.match(/[aeiou]/gi) || []).length;
}

console.log(countVowels("Hello World")); // 3`,
    java: R`
public class Vowels {
    static int countVowels(String text) {
        int count = 0;
        for (char c : text.toLowerCase().toCharArray()) {
            if ("aeiou".indexOf(c) >= 0) count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(countVowels("Hello World")); // 3
    }
}`,
    c: R`
#include <ctype.h>
#include <stdio.h>
#include <string.h>

int count_vowels(const char *s) {
    int count = 0;
    for (; *s; s++) {
        if (strchr("aeiou", tolower((unsigned char) *s))) count++;
    }
    return count;
}

int main(void) {
    printf("%d\n", count_vowels("Hello World"));   /* 3 */
    return 0;
}`,
    go: R`
package main

import (
	"fmt"
	"strings"
)

func countVowels(s string) int {
	n := 0
	for _, r := range strings.ToLower(s) {
		if strings.ContainsRune("aeiou", r) {
			n++
		}
	}
	return n
}

func main() {
	fmt.Println(countVowels("Hello World")) // 3
}`,
    rust: R`
fn count_vowels(s: &str) -> usize {
    s.chars().filter(|c| "aeiouAEIOU".contains(*c)).count()
}

fn main() {
    println!("{}", count_vowels("Hello World")); // 3
}`,
    cpp: R`
#include <cctype>
#include <iostream>
#include <string>

int countVowels(const std::string& s) {
    int n = 0;
    for (char c : s) {
        if (std::string("aeiou").find((char) std::tolower((unsigned char) c)) != std::string::npos) n++;
    }
    return n;
}

int main() {
    std::cout << countVowels("Hello World") << "\n";   // 3
}` } },

  { id: "wordfreq", title: "Word count and frequency", re: /\bword (count|frequenc\w*|counter)\b|\bcount\w* (the )?(words|word occurrences)\b|\bmost (common|frequent) words?\b/, langs: {
    python: R`
import re
from collections import Counter


def word_frequency(text, top=10):
    words = re.findall(r"[a-z']+", text.lower())
    return len(words), Counter(words).most_common(top)


text = "the quick brown fox jumps over the lazy dog the end"
total, common = word_frequency(text, 3)
print(total)    # 11
print(common)   # [('the', 3), ('quick', 1), ('brown', 1)]`,
    javascript: R`
function wordFrequency(text, top = 10) {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const counts = new Map();
  for (const w of words) counts.set(w, (counts.get(w) || 0) + 1);
  const common = [...counts].sort((a, b) => b[1] - a[1]).slice(0, top);
  return { total: words.length, common };
}

console.log(wordFrequency("the quick brown fox jumps over the lazy dog the end", 3));
// { total: 11, common: [ [ 'the', 3 ], [ 'quick', 1 ], [ 'brown', 1 ] ] }` } },

  { id: "anagram", title: "Anagram check", re: /\banagrams?\b/, langs: {
    python: R`
from collections import Counter


def is_anagram(a, b):
    clean = lambda s: Counter(c for c in s.lower() if c.isalnum())
    return clean(a) == clean(b)


print(is_anagram("Listen", "Silent"))          # True
print(is_anagram("Dormitory", "dirty room"))   # True
print(is_anagram("hello", "world"))            # False`,
    javascript: R`
function isAnagram(a, b) {
  const key = s => s.toLowerCase().replace(/[^a-z0-9]/g, "").split("").sort().join("");
  return key(a) === key(b);
}

console.log(isAnagram("Listen", "Silent"));        // true
console.log(isAnagram("Dormitory", "dirty room")); // true
console.log(isAnagram("hello", "world"));          // false`,
    java: R`
import java.util.Arrays;

public class Anagram {
    static boolean isAnagram(String a, String b) {
        char[] x = a.toLowerCase().replaceAll("[^a-z0-9]", "").toCharArray();
        char[] y = b.toLowerCase().replaceAll("[^a-z0-9]", "").toCharArray();
        Arrays.sort(x);
        Arrays.sort(y);
        return Arrays.equals(x, y);
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("Listen", "Silent"));   // true
    }
}`,
    c: R`
#include <ctype.h>
#include <stdio.h>

int is_anagram(const char *a, const char *b) {
    int counts[256] = {0};
    for (; *a; a++) if (isalnum((unsigned char) *a)) counts[tolower((unsigned char) *a)]++;
    for (; *b; b++) if (isalnum((unsigned char) *b)) counts[tolower((unsigned char) *b)]--;
    for (int i = 0; i < 256; i++) if (counts[i]) return 0;
    return 1;
}

int main(void) {
    printf("%d %d\n", is_anagram("Listen", "Silent"), is_anagram("hello", "world"));   /* 1 0 */
    return 0;
}`,
    go: R`
package main

import (
	"fmt"
	"unicode"
)

func isAnagram(a, b string) bool {
	counts := map[rune]int{}
	for _, r := range a {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			counts[unicode.ToLower(r)]++
		}
	}
	for _, r := range b {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			counts[unicode.ToLower(r)]--
		}
	}
	for _, n := range counts {
		if n != 0 {
			return false
		}
	}
	return true
}

func main() {
	fmt.Println(isAnagram("Listen", "Silent"), isAnagram("hello", "world")) // true false
}` } },

  { id: "reversewords", title: "Reverse the words in a sentence", re: /\breverse (the |each |all )?words\b|\bwords? in reverse order\b/, langs: {
    python: R`
def reverse_words(sentence):
    return " ".join(reversed(sentence.split()))


print(reverse_words("the quick brown fox"))  # fox brown quick the`,
    javascript: R`
const reverseWords = s => s.trim().split(/\s+/).reverse().join(" ");

console.log(reverseWords("the quick brown fox")); // fox brown quick the`,
    java: R`
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ReverseWords {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("the quick brown fox".trim().split("\\s+"));
        Collections.reverse(words);
        System.out.println(String.join(" ", words)); // fox brown quick the
    }
}` } },

  { id: "capwords", title: "Capitalize each word", re: /\bcapitali[sz]\w* (the )?(first letter of )?(each|every|all)( the)? words?\b/, langs: {
    python: R`
def capitalize_words(text):
    return " ".join(w[:1].upper() + w[1:].lower() for w in text.split(" "))


print(capitalize_words("hello wORLD from python"))  # Hello World From Python`,
    javascript: R`
const capitalizeWords = s => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

console.log(capitalizeWords("hello wORLD from javascript")); // Hello World From Javascript` } },

  { id: "caesar", title: "Caesar cipher", re: /\bcaesar\b|\bshift cipher\b/, langs: {
    python: R`
def caesar(text, shift):
    out = []
    for c in text:
        if c.isalpha():
            base = ord("A") if c.isupper() else ord("a")
            out.append(chr((ord(c) - base + shift) % 26 + base))
        else:
            out.append(c)
    return "".join(out)


secret = caesar("Hello, World!", 3)
print(secret)               # Khoor, Zruog!
print(caesar(secret, -3))   # Hello, World!`,
    javascript: R`
function caesar(text, shift) {
  return text.replace(/[a-z]/gi, c => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  });
}

const secret = caesar("Hello, World!", 3);
console.log(secret);              // Khoor, Zruog!
console.log(caesar(secret, -3));  // Hello, World!`,
    c: R`
#include <ctype.h>
#include <stdio.h>

void caesar(char *s, int shift) {
    shift = ((shift % 26) + 26) % 26;
    for (; *s; s++) {
        if (isupper((unsigned char) *s)) *s = 'A' + (*s - 'A' + shift) % 26;
        else if (islower((unsigned char) *s)) *s = 'a' + (*s - 'a' + shift) % 26;
    }
}

int main(void) {
    char msg[] = "Hello, World!";
    caesar(msg, 3);
    printf("%s\n", msg);   /* Khoor, Zruog! */
    caesar(msg, -3);
    printf("%s\n", msg);   /* Hello, World! */
    return 0;
}`,
    go: R`
package main

import "fmt"

func caesar(s string, shift int) string {
	shift = ((shift % 26) + 26) % 26
	out := []rune(s)
	for i, r := range out {
		switch {
		case r >= 'a' && r <= 'z':
			out[i] = 'a' + (r-'a'+rune(shift))%26
		case r >= 'A' && r <= 'Z':
			out[i] = 'A' + (r-'A'+rune(shift))%26
		}
	}
	return string(out)
}

func main() {
	secret := caesar("Hello, World!", 3)
	fmt.Println(secret, caesar(secret, -3))
}` } },

  { id: "leapyear", title: "Leap year check", re: /\bleap ?years?\b/, langs: {
    python: R`
def is_leap_year(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


for y in (1900, 2000, 2024, 2026):
    print(y, is_leap_year(y))   # False, True, True, False`,
    javascript: R`
const isLeapYear = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

for (const y of [1900, 2000, 2024, 2026]) console.log(y, isLeapYear(y)); // false true true false`,
    c: R`
#include <stdio.h>

int is_leap_year(int y) {
    return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
}

int main(void) {
    int years[] = {1900, 2000, 2024, 2026};
    for (int i = 0; i < 4; i++) printf("%d %s\n", years[i], is_leap_year(years[i]) ? "leap" : "not leap");
    return 0;
}`,
    java: R`
public class LeapYear {
    static boolean isLeapYear(int y) {
        return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0;
    }

    public static void main(String[] args) {
        for (int y : new int[]{1900, 2000, 2024, 2026}) System.out.println(y + " " + isLeapYear(y));
    }
}`,
    go: R`
package main

import "fmt"

func isLeapYear(y int) bool {
	return (y%4 == 0 && y%100 != 0) || y%400 == 0
}

func main() {
	for _, y := range []int{1900, 2000, 2024, 2026} {
		fmt.Println(y, isLeapYear(y))
	}
}`,
    rust: R`
fn is_leap_year(y: i32) -> bool {
    (y % 4 == 0 && y % 100 != 0) || y % 400 == 0
}

fn main() {
    for y in [1900, 2000, 2024, 2026] {
        println!("{} {}", y, is_leap_year(y));
    }
}` } },

  { id: "evenodd", title: "Even or odd", re: /\b(even or odd|odd or even)\b|\bis (a |the )?number (even|odd)\b|\bcheck (if |whether )?(a |the )?number is (even|odd)\b/, langs: {
    python: R`
n = int(input("Enter a number: "))
print(f"{n} is {'even' if n % 2 == 0 else 'odd'}")`,
    javascript: R`
const isEven = n => n % 2 === 0;

for (const n of [0, 7, -4, 13]) console.log(n + " is " + (isEven(n) ? "even" : "odd"));`,
    c: R`
#include <stdio.h>

int main(void) {
    int n;
    printf("Enter a number: ");
    if (scanf("%d", &n) != 1) return 1;
    printf("%d is %s\n", n, n % 2 == 0 ? "even" : "odd");
    return 0;
}`,
    java: R`
import java.util.Scanner;

public class EvenOdd {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int n = in.nextInt();
        System.out.println(n + " is " + (n % 2 == 0 ? "even" : "odd"));
    }
}`,
    go: R`
package main

import "fmt"

func main() {
	var n int
	fmt.Print("Enter a number: ")
	if _, err := fmt.Scan(&n); err != nil {
		fmt.Println("not a number")
		return
	}
	if n%2 == 0 {
		fmt.Println(n, "is even")
	} else {
		fmt.Println(n, "is odd")
	}
}` } },

  { id: "tempconv", title: "Temperature converter", re: /\btemperature conver\w*\b|\b(celsius|fahrenheit|kelvin)\b.*\bconverter\b|\bconverter\b.*\b(celsius|fahrenheit)\b/, langs: {
    python: R`
def c_to_f(c):
    return c * 9 / 5 + 32


def f_to_c(f):
    return (f - 32) * 5 / 9


def main():
    value = float(input("Temperature: "))
    unit = input("Unit (C or F): ").strip().upper()
    if unit == "C":
        print(f"{value} C = {c_to_f(value):.2f} F = {value + 273.15:.2f} K")
    elif unit == "F":
        c = f_to_c(value)
        print(f"{value} F = {c:.2f} C = {c + 273.15:.2f} K")
    else:
        print("Please type C or F.")


if __name__ == "__main__":
    main()`,
    javascript: R`
const cToF = c => c * 9 / 5 + 32;
const fToC = f => (f - 32) * 5 / 9;

console.log(cToF(100)); // 212
console.log(fToC(98.6).toFixed(1)); // 37.0`,
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Temperature converter</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 360px; margin: 50px auto; padding: 0 16px; }
  label { display: block; margin: 14px 0 4px; }
  input { width: 100%; box-sizing: border-box; padding: 10px; font-size: 18px; }
</style>
</head>
<body>
<h1>Temperature converter</h1>
<label for="c">Celsius</label><input id="c" type="number" step="any">
<label for="f">Fahrenheit</label><input id="f" type="number" step="any">
<label for="k">Kelvin</label><input id="k" type="number" step="any">
<script>
const els = { c: document.getElementById("c"), f: document.getElementById("f"), k: document.getElementById("k") };
const round = v => String(Math.round(v * 100) / 100);
function fromCelsius(c, skip) {
  if (skip !== "c") els.c.value = round(c);
  if (skip !== "f") els.f.value = round(c * 9 / 5 + 32);
  if (skip !== "k") els.k.value = round(c + 273.15);
}
els.c.addEventListener("input", () => { if (els.c.value !== "") fromCelsius(Number(els.c.value), "c"); });
els.f.addEventListener("input", () => { if (els.f.value !== "") fromCelsius((Number(els.f.value) - 32) * 5 / 9, "f"); });
els.k.addEventListener("input", () => { if (els.k.value !== "") fromCelsius(Number(els.k.value) - 273.15, "k"); });
fromCelsius(20);
</script>
</body>
</html>`,
    c: R`
#include <stdio.h>

int main(void) {
    double value;
    char unit;
    printf("Temperature and unit (e.g. 100 C or 98.6 F): ");
    if (scanf("%lf %c", &value, &unit) != 2) return 1;
    if (unit == 'C' || unit == 'c') printf("%.2f F\n", value * 9 / 5 + 32);
    else if (unit == 'F' || unit == 'f') printf("%.2f C\n", (value - 32) * 5 / 9);
    else printf("Unknown unit\n");
    return 0;
}` } },

  { id: "sumdigits", title: "Sum of digits", re: /\bsum (of )?(the |its )?digits\b|\bdigit sum\b/, langs: {
    python: R`
def sum_of_digits(n):
    n = abs(n)
    total = 0
    while n:
        total += n % 10
        n //= 10
    return total


print(sum_of_digits(12345))  # 15`,
    javascript: R`
function sumOfDigits(n) {
  n = Math.abs(n);
  let total = 0;
  while (n > 0) { total += n % 10; n = Math.floor(n / 10); }
  return total;
}

console.log(sumOfDigits(12345)); // 15`,
    c: R`
#include <stdio.h>
#include <stdlib.h>

int sum_of_digits(long n) {
    int total = 0;
    n = labs(n);
    while (n) { total += n % 10; n /= 10; }
    return total;
}

int main(void) {
    printf("%d\n", sum_of_digits(12345));   /* 15 */
    return 0;
}`,
    java: R`
public class SumDigits {
    static int sumOfDigits(long n) {
        int total = 0;
        n = Math.abs(n);
        while (n > 0) { total += n % 10; n /= 10; }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sumOfDigits(12345)); // 15
    }
}`,
    go: R`
package main

import "fmt"

func sumOfDigits(n int) int {
	if n < 0 {
		n = -n
	}
	total := 0
	for n > 0 {
		total += n % 10
		n /= 10
	}
	return total
}

func main() {
	fmt.Println(sumOfDigits(12345)) // 15
}` } },

  { id: "armstrong", title: "Armstrong numbers", re: /\barmstrong\b|\bnarcissistic number/, langs: {
    python: R`
def is_armstrong(n):
    digits = str(n)
    return n == sum(int(d) ** len(digits) for d in digits)


print([n for n in range(1, 10000) if is_armstrong(n)])
# [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474]`,
    javascript: R`
function isArmstrong(n) {
  const digits = String(n);
  return n === [...digits].reduce((sum, d) => sum + Number(d) ** digits.length, 0);
}

console.log(Array.from({ length: 9999 }, (_, i) => i + 1).filter(isArmstrong));`,
    c: R`
#include <stdio.h>

int is_armstrong(int n) {
    int digits = 0, sum = 0;
    for (int t = n; t; t /= 10) digits++;
    for (int t = n; t; t /= 10) {
        int d = t % 10, p = 1;
        for (int i = 0; i < digits; i++) p *= d;
        sum += p;
    }
    return sum == n;
}

int main(void) {
    for (int n = 1; n < 10000; n++) if (is_armstrong(n)) printf("%d ", n);
    printf("\n");
    return 0;
}` } },

  { id: "sieve", title: "Prime numbers up to N (sieve)", re: /\bsieve\b|\b(all |list (all |of )?|print (all )?|generate |find (all )?)primes? (numbers? )?(up ?to|below|under|less than|between)\b/, langs: {
    python: R`
def primes_up_to(n):
    """Sieve of Eratosthenes."""
    if n < 2:
        return []
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(n ** 0.5) + 1):
        if is_prime[i]:
            is_prime[i * i::i] = [False] * len(range(i * i, n + 1, i))
    return [i for i, p in enumerate(is_prime) if p]


print(primes_up_to(50))  # [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]`,
    javascript: R`
function primesUpTo(n) {
  const isPrime = new Uint8Array(n + 1).fill(1);
  isPrime[0] = 0;
  if (n >= 1) isPrime[1] = 0;
  for (let i = 2; i * i <= n; i++) {
    if (isPrime[i]) for (let j = i * i; j <= n; j += i) isPrime[j] = 0;
  }
  const out = [];
  for (let i = 2; i <= n; i++) if (isPrime[i]) out.push(i);
  return out;
}

console.log(primesUpTo(50)); // [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]`,
    c: R`
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 50;
    char *composite = calloc(n + 1, 1);
    for (int i = 2; i * i <= n; i++) {
        if (!composite[i]) for (int j = i * i; j <= n; j += i) composite[j] = 1;
    }
    for (int i = 2; i <= n; i++) if (!composite[i]) printf("%d ", i);
    printf("\n");
    free(composite);
    return 0;
}`,
    go: R`
package main

import "fmt"

func primesUpTo(n int) []int {
	composite := make([]bool, n+1)
	var out []int
	for i := 2; i <= n; i++ {
		if composite[i] {
			continue
		}
		out = append(out, i)
		for j := i * i; j <= n; j += i {
			composite[j] = true
		}
	}
	return out
}

func main() {
	fmt.Println(primesUpTo(50))
}`,
    rust: R`
fn primes_up_to(n: usize) -> Vec<usize> {
    let mut composite = vec![false; n + 1];
    let mut out = Vec::new();
    for i in 2..=n {
        if composite[i] {
            continue;
        }
        out.push(i);
        let mut j = i * i;
        while j <= n {
            composite[j] = true;
            j += i;
        }
    }
    out
}

fn main() {
    println!("{:?}", primes_up_to(50));
}` } },

  { id: "multtable", title: "Multiplication table", re: /\b(multiplication|times) tables?\b/, langs: {
    python: R`
def multiplication_table(n, upto=10):
    for i in range(1, upto + 1):
        print(f"{n} x {i:2} = {n * i:3}")


multiplication_table(7)`,
    javascript: R`
function multiplicationTable(n, upto = 10) {
  for (let i = 1; i <= upto; i++) console.log(n + " x " + String(i).padStart(2) + " = " + String(n * i).padStart(3));
}

multiplicationTable(7);`,
    c: R`
#include <stdio.h>

int main(void) {
    int n = 7;
    for (int i = 1; i <= 10; i++) printf("%d x %2d = %3d\n", n, i, n * i);
    return 0;
}`,
    java: R`
public class Table {
    public static void main(String[] args) {
        int n = 7;
        for (int i = 1; i <= 10; i++) System.out.printf("%d x %2d = %3d%n", n, i, n * i);
    }
}`,
    go: R`
package main

import "fmt"

func main() {
	n := 7
	for i := 1; i <= 10; i++ {
		fmt.Printf("%d x %2d = %3d\n", n, i, n*i)
	}
}` } },

  { id: "matmul", title: "Matrix multiplication", re: /\bmatri(x|ces)\b.*\bmultipl\w*\b|\bmultipl\w*\b.*\bmatri(x|ces)\b/, langs: {
    python: R`
def mat_mul(a, b):
    if len(a[0]) != len(b):
        raise ValueError("columns of A must equal rows of B")
    return [[sum(a[i][k] * b[k][j] for k in range(len(b))) for j in range(len(b[0]))] for i in range(len(a))]


A = [[1, 2], [3, 4]]
B = [[5, 6], [7, 8]]
print(mat_mul(A, B))  # [[19, 22], [43, 50]]`,
    javascript: R`
function matMul(a, b) {
  if (a[0].length !== b.length) throw new Error("columns of A must equal rows of B");
  return a.map(row => b[0].map((_, j) => row.reduce((sum, x, k) => sum + x * b[k][j], 0)));
}

console.log(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])); // [[19, 22], [43, 50]]`,
    c: R`
#include <stdio.h>

#define N 2

void mat_mul(int a[N][N], int b[N][N], int out[N][N]) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++) {
            out[i][j] = 0;
            for (int k = 0; k < N; k++) out[i][j] += a[i][k] * b[k][j];
        }
}

int main(void) {
    int a[N][N] = {{1, 2}, {3, 4}}, b[N][N] = {{5, 6}, {7, 8}}, c[N][N];
    mat_mul(a, b, c);
    for (int i = 0; i < N; i++) printf("%d %d\n", c[i][0], c[i][1]);   /* 19 22 / 43 50 */
    return 0;
}`,
    go: R`
package main

import "fmt"

func matMul(a, b [][]int) [][]int {
	out := make([][]int, len(a))
	for i := range a {
		out[i] = make([]int, len(b[0]))
		for j := range b[0] {
			for k := range b {
				out[i][j] += a[i][k] * b[k][j]
			}
		}
	}
	return out
}

func main() {
	fmt.Println(matMul([][]int{{1, 2}, {3, 4}}, [][]int{{5, 6}, {7, 8}})) // [[19 22] [43 50]]
}` } },

  { id: "dice", title: "Dice roller and random numbers", re: /\broll\w* (a |the |two |2 )?dic?e\b|\bdice (roll|roller|game)\b|\brandom (number|integer)\b/, langs: {
    python: R`
import random


def roll(sides=6, count=1):
    return [random.randint(1, sides) for _ in range(count)]


dice = roll(6, 2)
print(dice, "total:", sum(dice))
print(random.randint(1, 100))      # random integer 1..100 inclusive
print(random.random())             # float in [0, 1)`,
    javascript: R`
// random integer from min to max, inclusive
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const roll = (sides = 6, count = 1) => Array.from({ length: count }, () => randInt(1, sides));

const dice = roll(6, 2);
console.log(dice, "total:", dice[0] + dice[1]);
console.log(randInt(1, 100));`,
    c: R`
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int roll(int sides) {
    return rand() % sides + 1;
}

int main(void) {
    srand((unsigned) time(NULL));
    int a = roll(6), b = roll(6);
    printf("%d + %d = %d\n", a, b, a + b);
    return 0;
}`,
    go: R`
package main

import (
	"fmt"
	"math/rand"
)

func roll(sides int) int { return rand.Intn(sides) + 1 }

func main() {
	a, b := roll(6), roll(6)
	fmt.Printf("%d + %d = %d\n", a, b, a+b)
}` } },

  { id: "bmi", title: "BMI calculator", re: /\bbmi\b|\bbody mass index\b/, langs: {
    python: R`
def bmi(weight_kg, height_m):
    return weight_kg / height_m ** 2


def category(value):
    if value < 18.5:
        return "underweight"
    if value < 25:
        return "healthy weight"
    if value < 30:
        return "overweight"
    return "obese"


weight = float(input("Weight (kg): "))
height = float(input("Height (cm): ")) / 100
value = bmi(weight, height)
print(f"BMI: {value:.1f} ({category(value)})")`,
    javascript: R`
const bmi = (weightKg, heightM) => weightKg / (heightM * heightM);
const category = v => v < 18.5 ? "underweight" : v < 25 ? "healthy weight" : v < 30 ? "overweight" : "obese";

const value = bmi(70, 1.75);
console.log(value.toFixed(1), category(value)); // 22.9 healthy weight`,
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BMI calculator</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 360px; margin: 50px auto; padding: 0 16px; }
  label { display: block; margin: 14px 0 4px; }
  input { width: 100%; box-sizing: border-box; padding: 10px; font-size: 18px; }
  #out { margin-top: 20px; font-size: 22px; }
</style>
</head>
<body>
<h1>BMI calculator</h1>
<label for="w">Weight (kg)</label><input id="w" type="number" min="1" step="any" value="70">
<label for="h">Height (cm)</label><input id="h" type="number" min="1" step="any" value="175">
<div id="out"></div>
<script>
function update() {
  const w = Number(document.getElementById("w").value), h = Number(document.getElementById("h").value) / 100;
  const out = document.getElementById("out");
  if (!(w > 0 && h > 0)) { out.textContent = "Enter your weight and height."; return; }
  const v = w / (h * h);
  const cat = v < 18.5 ? "underweight" : v < 25 ? "healthy weight" : v < 30 ? "overweight" : "obese";
  out.textContent = "BMI " + v.toFixed(1) + " (" + cat + ")";
}
document.querySelectorAll("input").forEach(i => i.addEventListener("input", update));
update();
</script>
</body>
</html>` } },

  // -------------------------------------------------------------- hello world
  { id: "hello", title: "Hello, world", re: /\bhello,? ?world\b/, langs: {
    python: R`print("Hello, world!")`,
    javascript: R`console.log("Hello, world!");`,
    typescript: R`
const greeting: string = "Hello, world!";
console.log(greeting);`,
    rust: R`
fn main() {
    println!("Hello, world!");
}`,
    go: R`
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}`,
    java: R`
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`,
    c: R`
#include <stdio.h>

int main(void) {
    printf("Hello, world!\n");
    return 0;
}`,
    cpp: R`
#include <iostream>

int main() {
    std::cout << "Hello, world!\n";
}`,
    csharp: R`
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, world!");
    }
}`,
    ruby: R`puts "Hello, world!"`,
    bash: R`
#!/usr/bin/env bash
echo "Hello, world!"`,
    html: R`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hello</title>
</head>
<body>
<h1>Hello, world!</h1>
</body>
</html>` } },
];

// Default language when the request does not name one: a browser app for
// games/apps that have an HTML version, otherwise Python.
const PREFER = ["python", "javascript", "html", "go", "c", "java", "rust", "cpp", "typescript", "ruby", "csharp", "bash"];

// Does this request ask for one of the library's programs? Returns the entry
// (not yet a language). A code intent is required by the caller.
export function findProgram(low) {
  for (const p of PROGRAMS) if (p.re.test(low)) return p;
  return null;
}

// The program for a request, in the asked language (or the closest one we have).
export function program(input) {
  const low = String(input || "").toLowerCase();
  const p = findProgram(low);
  if (!p) return null;
  const asked = detectLang(low);
  const have = Object.keys(p.langs);
  let lang = asked && p.langs[asked] ? asked : null;
  if (!lang) lang = (!asked && p.langs.html && /\b(game|app|website|web ?page|page|site|ui|widget|form)\b/.test(low)) ? "html" : PREFER.find((l) => p.langs[l]);
  const missing = asked && !p.langs[asked] ? asked : null;
  return { ok: true, kind: "program", id: p.id, op: p.title, lang, code: p.langs[lang], langs: have, missing };
}

// Short notes on how to run each language's program.
export const RUN_HINT = {
  python: "Save as main.py and run: python3 main.py",
  javascript: "Save as main.js and run: node main.js",
  typescript: "Save as main.ts and run: npx tsx main.ts",
  rust: "Save as main.rs and run: rustc main.rs && ./main",
  go: "Save as main.go and run: go run main.go",
  java: "Save as the class name + .java and run: java <File>.java",
  c: "Save as main.c and run: gcc main.c -o main && ./main",
  cpp: "Save as main.cpp and run: g++ main.cpp -o main && ./main",
  csharp: "Run inside a .NET project: dotnet new console, paste into Program.cs, dotnet run",
  ruby: "Save as main.rb and run: ruby main.rb",
  bash: "Save as main.sh and run: bash main.sh",
  html: "Save as index.html and open it in any browser.",
};

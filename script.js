const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const soundButton = document.getElementById("soundButton");

const grid = 20;
const cell = canvas.width / grid;
let snake, food, direction, nextDirection, score, best = Number(localStorage.getItem("neon-snake-best") || 0);
let running = false;
let paused = false;
let timer;
let soundOn = true;
let audioContext;

bestEl.textContent = formatScore(best);

function formatScore(value) {
  return String(value).padStart(3, "0");
}

function resetGame() {
  snake = [{ x: 10, y: 11 }, { x: 9, y: 11 }, { x: 8, y: 11 }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  updateStats();
  placeFood();
  draw();
}

function updateStats() {
  scoreEl.textContent = formatScore(score);
  bestEl.textContent = formatScore(best);
  levelEl.textContent = `LEVEL ${Math.min(9, Math.floor(score / 5) + 1)}`;
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * grid), y: Math.floor(Math.random() * grid) };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function draw() {
  ctx.fillStyle = "#101918";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(201, 246, 109, .045)";
  ctx.lineWidth = 1;
  for (let i = 1; i < grid; i++) {
    ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke();
  }
  drawFood();
  snake.forEach((segment, index) => {
    const gap = 2.5;
    ctx.fillStyle = index === 0 ? "#d9ff7d" : `hsl(${78 - Math.min(index * 1.4, 26)}deg 76% ${66 - Math.min(index * .8, 16)}%)`;
    roundRect(segment.x * cell + gap, segment.y * cell + gap, cell - gap * 2, cell - gap * 2, index === 0 ? 6 : 5);
    ctx.fill();
    if (index === 0) {
      ctx.fillStyle = "#263018";
      const eyeOffset = direction.x === 0 ? 5 : 0;
      ctx.beginPath(); ctx.arc(segment.x * cell + cell / 2 - 4 + eyeOffset, segment.y * cell + cell / 2 - 3, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(segment.x * cell + cell / 2 + 4 + eyeOffset, segment.y * cell + cell / 2 - 3, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  });
}

function drawFood() {
  const x = food.x * cell + cell / 2;
  const y = food.y * cell + cell / 2;
  ctx.shadowColor = "#ff7b9c";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ff7095";
  ctx.beginPath(); ctx.arc(x, y, cell * .27, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffc1d0";
  ctx.beginPath(); ctx.arc(x - 3, y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function tick() {
  if (!running || paused) return;
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid;
  const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);
  if (hitWall || hitSelf) return endGame();
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    if (score > best) { best = score; localStorage.setItem("neon-snake-best", best); }
    updateStats(); playTone(520, .07); placeFood();
    clearInterval(timer); timer = setInterval(tick, Math.max(65, 145 - score * 4));
  } else {
    snake.pop();
  }
  draw();
}

function startGame() {
  resetGame();
  running = true; paused = false;
  overlay.classList.add("hidden");
  pauseButton.textContent = "Ⅱ";
  clearInterval(timer);
  timer = setInterval(tick, 145);
  playTone(360, .08);
}

function endGame() {
  running = false;
  clearInterval(timer);
  overlayTitle.textContent = "Game over.";
  overlayText.textContent = `You scored ${score} point${score === 1 ? "" : "s"}. Ready for another run?`;
  startButton.textContent = "Play again  →";
  overlay.classList.remove("hidden");
  playTone(130, .18);
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
  overlayTitle.textContent = "Taking a breather.";
  overlayText.textContent = "Press space or the pause button to jump back in.";
  startButton.textContent = "Resume  →";
  overlay.classList.toggle("hidden", !paused);
}

function setDirection(name) {
  const vectors = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const chosen = vectors[name];
  if (!chosen || (chosen.x === -direction.x && chosen.y === -direction.y)) return;
  nextDirection = chosen;
  if (running && paused) togglePause();
}

function playTone(frequency, duration) {
  if (!soundOn) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency; oscillator.type = "sine";
  gain.gain.setValueAtTime(.04, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}

document.addEventListener("keydown", event => {
  const keys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (keys[event.key]) { event.preventDefault(); setDirection(keys[event.key]); }
  if (event.code === "Space") { event.preventDefault(); togglePause(); }
});
document.querySelectorAll("[data-direction]").forEach(button => button.addEventListener("click", () => setDirection(button.dataset.direction)));
startButton.addEventListener("click", () => paused ? togglePause() : startGame());
pauseButton.addEventListener("click", togglePause);
soundButton.addEventListener("click", () => {
  soundOn = !soundOn;
  soundButton.textContent = soundOn ? "♫" : "♩";
  soundButton.setAttribute("aria-label", soundOn ? "Mute sound" : "Enable sound");
});

resetGame();

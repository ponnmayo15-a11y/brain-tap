import { saveScore, loadScores } from "./scores.js?v=17";
import { startFlash } from "./games/flash.js?v=17";
import { startReverse } from "./games/reverse.js?v=17";
import { startNback } from "./games/nback.js?v=17";

const GAMES = {
  flash: { title: "フラッシュ暗算", start: startFlash },
  reverse: { title: "逆唱", start: startReverse },
  nback: { title: "Nバック", start: startNback },
};

let playAbort = null;

/** 画面を切り替える */
function show(id) {
  document.querySelectorAll(".screen").forEach((el) => {
    el.classList.toggle("is-on", el.id === id);
  });
}

/** 起動時のつなぎ込み */
async function boot() {
  bindClicks();
  await openHome();
}

/** ボタンのクリックを結びつける */
function bindClicks() {
  document.getElementById("play-quit").addEventListener("click", quitPlay);
  document.getElementById("btn-again").addEventListener("click", () => {
    const game = document.getElementById("btn-again").dataset.game;
    startPlay(game);
  });
  document.getElementById("btn-home").addEventListener("click", () => openHome());
  document.querySelectorAll("[data-game]").forEach((btn) => {
    if (btn.id === "btn-again") return;
    btn.addEventListener("click", () => startPlay(btn.dataset.game));
  });
}

/** ホームを開いて記録を出す */
async function openHome() {
  show("screen-home");
  const scores = await loadScores();
  drawBests(scores);
}

/** 各ゲームの直近の点数をホームに出す */
function drawBests(scores) {
  for (const key of Object.keys(GAMES)) {
    const found = scores.find((s) => s.game === key);
    const el = document.getElementById(`best-${key}`);
    el.textContent = found ? `直近 ${found.points} 点` : "まだ記録なし";
  }
}

/** ゲームを開始する */
function startPlay(gameKey) {
  const game = GAMES[gameKey];
  if (!game) return;
  playAbort?.abort();
  playAbort = new AbortController();
  document.getElementById("play-title").textContent = game.title;
  document.getElementById("btn-again").dataset.game = gameKey;
  show("screen-play");
  const root = document.getElementById("play-stage");
  root.innerHTML = "";
  game.start(root, {
    signal: playAbort.signal,
    onDone: (result) => finishPlay(result),
  });
}

/** 途中でやめる */
function quitPlay() {
  playAbort?.abort();
  openHome();
}

/** 1回分の結果を保存して結果画面へ */
async function finishPlay(result) {
  await saveScore(result);
  if (result.stay) return;
  document.getElementById("result-message").textContent = result.message;
  document.getElementById("result-points").textContent = `${result.points} 点`;
  document.getElementById("result-detail").textContent = result.detail || "";
  show("screen-result");
}

boot();

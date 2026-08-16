import { initAuth, loginGoogle, logout, getUser, isFirebaseReady, loginErrorText } from "./auth.js";
import { saveScore, loadScores } from "./scores.js";
import { startFlash } from "./games/flash.js";
import { startReverse } from "./games/reverse.js";
import { startNback } from "./games/nback.js";

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
  updateLoginHint();
  await initAuth(onUser, (error) => {
    document.getElementById("login-error").textContent = loginErrorText(error);
  });
}

/** ボタンのクリックを結びつける */
function bindClicks() {
  document.getElementById("btn-login").addEventListener("click", onLogin);
  document.getElementById("btn-logout").addEventListener("click", onLogout);
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

/** Googleログインを押したとき */
async function onLogin() {
  const err = document.getElementById("login-error");
  err.textContent = "";
  if (!isFirebaseReady()) {
    err.textContent = "まだ Google ログインの準備ができていません。設定が終わるまで少し待ってください。";
    return;
  }
  try {
    await loginGoogle();
  } catch (error) {
    err.textContent = loginErrorText(error);
    console.warn(error);
  }
}

/** ログアウト */
async function onLogout() {
  await logout();
  show("screen-login");
}

/** ログイン状態が変わったとき */
function onUser(user) {
  if (user) {
    openHome();
    return;
  }
  if (!document.getElementById("screen-play").classList.contains("is-on")) {
    show("screen-login");
  }
}

/** ホームを開いて記録を出す */
async function openHome() {
  const user = getUser();
  if (!user) {
    show("screen-login");
    return;
  }
  document.getElementById("hello").textContent = user.displayName || "ログイン中";
  document.getElementById("save-place").textContent =
    "記録はクラウドに残ります。別の端末でも見られます。";
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
  document.getElementById("result-message").textContent = result.message;
  document.getElementById("result-points").textContent = `${result.points} 点`;
  document.getElementById("result-detail").textContent = result.detail || "";
  show("screen-result");
}

/** ログイン画面の説明文を、準備状況に合わせて変える */
function updateLoginHint() {
  const hint = document.getElementById("login-hint");
  if (isFirebaseReady()) {
    hint.textContent = "Googleでログインしてから、課題を選びます。";
    return;
  }
  hint.textContent = "Googleログインの設定が終わると、ここから入れます。";
}

boot();

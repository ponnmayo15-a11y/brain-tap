import { waitOrAbort, buzz } from "../wait.js?v=19";
import { renderGrid, lightCell, renderNext } from "../ui.js?v=19";
import { loadSettings, saveSettings } from "../settings.js?v=19";

const SOUNDS = ["あ", "い", "う", "え", "か", "さ", "た", "な"];
const TRIALS = 16;
const SHOW_MS = 2500;

/** Nバック。Nを選んでスタート。下のサウンド／ポジションを押す */
export function startNback(root, { onDone, signal }) {
  const saved = loadSettings();
  let n = saved.nbackN === 1 || saved.nbackN === 3 ? saved.nbackN : 2;
  drawSetup();

  /** Nを選ぶ画面を出す */
  function drawSetup() {
    if (signal.aborted) return;
    root.innerHTML = `
      <p class="stage-hint">N個前と同じなら下のボタンを押す</p>
      <p class="setup-label">N</p>
      <div class="choice-row" id="n-pick">
        ${[1, 2, 3].map((v) => `<button type="button" class="choice${v === n ? " is-on" : ""}" data-n="${v}">N = ${v}</button>`).join("")}
      </div>
      <button type="button" class="btn-start" id="btn-start">スタート</button>
    `;
    root.querySelector("#n-pick").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      n = Number(btn.dataset.n);
      drawSetup();
    });
    root.querySelector("#btn-start").addEventListener("click", () => {
      speak("あ");
      speechSynthesis.cancel();
      runPlay();
    });
  }

  /** 出題を回す */
  async function runPlay() {
    if (signal.aborted) return;
    saveSettings({ nbackN: n });
    const total = n + TRIALS;
    const sounds = makeStream(n, total, SOUNDS.length);
    const positions = makeStream(n, total, 9);
    drawBoard(root, n);
    const cells = [...root.querySelectorAll(".nb-grid i")];
    const hits = { ok: 0, total: 0 };
    for (let i = 0; i < total; i += 1) {
      if (signal.aborted) return;
      setProgress(root, (i / total) * 100);
      const got = await oneTrial({
        i, n, sounds, positions, cells, root, signal,
      });
      if (signal.aborted) return;
      if (i >= n) {
        hits.total += 2;
        hits.ok += got;
      }
    }
    const points = hits.total ? Math.round((100 * hits.ok) / hits.total) : 0;
    onDone({ game: "nback", points, maxPoints: 100, stay: true });
    renderNext(root, () => runPlay());
  }
}

/** 写真と同じく、下にサウンドとポジションを置く */
function drawBoard(root, n) {
  root.innerHTML = `
    <div class="dual-play">
      <div class="progress"><i id="bar"></i></div>
      <p class="n-row"><span>N = ${n}</span></p>
      <div id="grid-slot"></div>
      <div class="dual-btns">
        <button type="button" id="btn-sound">サウンド</button>
        <button type="button" id="btn-pos">ポジション</button>
      </div>
    </div>
  `;
  renderGrid(root.querySelector("#grid-slot"));
}

/** 1回分：音と位置を出して、ボタンを待つ */
function oneTrial(args) {
  const { i, n, sounds, positions, cells, root, signal } = args;
  const kana = SOUNDS[sounds[i]];
  lightCell(cells, positions[i]);
  speak(kana);
  const soundBtn = root.querySelector("#btn-sound");
  const posBtn = root.querySelector("#btn-pos");
  soundBtn.classList.remove("is-on");
  posBtn.classList.remove("is-on");
  const pressed = { sound: false, pos: false };
  const onSound = () => {
    pressed.sound = true;
    soundBtn.classList.add("is-on");
  };
  const onPos = () => {
    pressed.pos = true;
    posBtn.classList.add("is-on");
  };
  soundBtn.addEventListener("click", onSound);
  posBtn.addEventListener("click", onPos);
  const need = i >= n;
  const soundMatch = need && sounds[i] === sounds[i - n];
  const posMatch = need && positions[i] === positions[i - n];
  return waitOrAbort(SHOW_MS, signal).then(() => {
    soundBtn.removeEventListener("click", onSound);
    posBtn.removeEventListener("click", onPos);
    lightCell(cells, -1);
    if (!need) return 0;
    const soundOk = pressed.sound === soundMatch;
    const posOk = pressed.pos === posMatch;
    buzz(soundOk && posOk);
    return (soundOk ? 1 : 0) + (posOk ? 1 : 0);
  });
}

/** 進捗バーを更新する */
function setProgress(root, percent) {
  const bar = root.querySelector("#bar");
  if (bar) bar.style.width = `${percent}%`;
}

/** 声に出す */
function speak(text) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const talk = new SpeechSynthesisUtterance(text);
  talk.lang = "ja-JP";
  talk.rate = 1;
  speechSynthesis.speak(talk);
}

/** 約3割が一致する列を作る */
function makeStream(n, total, size) {
  const seq = [];
  for (let i = 0; i < total; i += 1) {
    seq.push(pickValue(seq, i, n, size));
  }
  return seq;
}

/** 1手分の値を決める */
function pickValue(seq, i, n, size) {
  if (i >= n && Math.random() < 0.3) return seq[i - n];
  let v = Math.floor(Math.random() * size);
  if (i >= n && v === seq[i - n]) v = (v + 1) % size;
  return v;
}

import { waitOrAbort, buzz } from "../wait.js";
import { renderSameDiff, renderGrid, lightCell } from "../ui.js";

const N = 2;
const TRIALS = 12;
const SHOW_MS = 2200;

/** Nバック（2つ前と同じか）を1回始める */
export async function startNback(root, { onDone, signal }) {
  const seq = makeSequence(N, N + TRIALS);
  const cells = setupBoard(root);
  const hits = { ok: 0, total: 0 };
  for (let i = 0; i < seq.length; i += 1) {
    if (signal.aborted) return;
    const needAnswer = i >= N;
    const result = await oneTrial(seq, i, cells, root, needAnswer, signal);
    if (signal.aborted) return;
    if (needAnswer) {
      hits.total += 1;
      if (result) hits.ok += 1;
    }
  }
  finishNback(hits, onDone);
}

/** 3×3マスとボタン置き場を出す */
function setupBoard(root) {
  root.innerHTML = `
    <p class="stage-hint" id="hint">2つ前と同じ位置なら「同じ」</p>
    <div id="grid-slot"></div>
    <div id="btn-slot"></div>
  `;
  return renderGrid(root.querySelector("#grid-slot"));
}

/** 約3割が「同じ」になる位置の列を作る */
function makeSequence(n, total) {
  const seq = [];
  for (let i = 0; i < total; i += 1) {
    seq.push(pickPos(seq, i, n));
  }
  return seq;
}

/** 1手分の位置を決める */
function pickPos(seq, i, n) {
  if (i >= n && Math.random() < 0.35) return seq[i - n];
  let pos = Math.floor(Math.random() * 9);
  if (i >= n && pos === seq[i - n]) pos = (pos + 1) % 9;
  return pos;
}

/** 1回分：点灯して、必要なら同じ／ちがうを待つ */
function oneTrial(seq, i, cells, root, needAnswer, signal) {
  lightCell(cells, seq[i]);
  const hint = root.querySelector("#hint");
  const slot = root.querySelector("#btn-slot");
  if (!needAnswer) {
    hint.textContent = "見て";
    slot.innerHTML = "";
    return waitOrAbort(SHOW_MS, signal).then(() => {
      lightCell(cells, -1);
    });
  }
  hint.textContent = "2つ前と同じ？";
  const target = seq[i] === seq[i - N];
  return askSame(slot, target, signal).then((ok) => {
    lightCell(cells, -1);
    return ok;
  });
}

/** 同じ／ちがうを受け取り、正解なら true */
function askSame(slot, target, signal) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok, silent) => {
      if (done) return;
      done = true;
      if (!silent) buzz(ok);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), SHOW_MS);
    renderSameDiff(slot, (saidSame) => {
      clearTimeout(timer);
      finish(saidSame === target);
    });
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      finish(false, true);
    }, { once: true });
  });
}

/** 正答率を点数にして返す */
function finishNback(hits, onDone) {
  const points = hits.total ? Math.round((100 * hits.ok) / hits.total) : 0;
  onDone({
    game: "nback",
    points,
    maxPoints: 100,
    message: `${hits.ok} / ${hits.total} 問正解`,
    detail: "2つ前と同じ位置かを判定",
  });
}

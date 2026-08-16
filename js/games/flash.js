import { waitOrAbort, buzz } from "../wait.js";
import { renderPad } from "../ui.js";

const COUNT = 5;
const SHOW_MS = 700;
const GAP_MS = 220;

/** フラッシュ暗算を1回始める */
export async function startFlash(root, { onDone, signal }) {
  const nums = makeNums(COUNT);
  const sum = nums.reduce((a, b) => a + b, 0);
  root.innerHTML = `
    <p class="stage-hint" id="hint">数字を見て、あとで合計を入れてください</p>
    <div class="stage-num" id="num"></div>
    <div id="pad-slot"></div>
  `;
  const numEl = root.querySelector("#num");
  const hint = root.querySelector("#hint");
  await showSequence(nums, numEl, hint, signal);
  if (signal.aborted) return;
  hint.textContent = "合計は？";
  numEl.textContent = "";
  let done = false;
  renderPad(root.querySelector("#pad-slot"), {
    prefix: " ",
    onOk: (value) => {
      if (done) return;
      done = true;
      finishFlash(value, sum, nums, onDone);
    },
  });
}

/** 1桁の数字を作る */
function makeNums(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
}

/** 数字を順番に大きく出す */
async function showSequence(nums, numEl, hint, signal) {
  hint.textContent = "見て";
  for (const n of nums) {
    if (signal.aborted) return;
    numEl.textContent = String(n);
    await waitOrAbort(SHOW_MS, signal);
    numEl.textContent = "";
    await waitOrAbort(GAP_MS, signal);
  }
}

/** 合計の正誤を判定して結果を返す */
function finishFlash(value, sum, nums, onDone) {
  const answer = Number(value);
  const ok = answer === sum;
  buzz(ok);
  onDone({
    game: "flash",
    points: ok ? 100 : 0,
    maxPoints: 100,
    message: ok ? "正解" : `正解は ${sum}`,
    detail: `出た数: ${nums.join(" + ")} = ${sum}`,
  });
}

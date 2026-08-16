import { waitOrAbort, buzz } from "../wait.js";
import { renderPad } from "../ui.js";

const LENGTH = 4;
const SHOW_MS = 900;
const GAP_MS = 250;

/** 逆唱を1回始める */
export async function startReverse(root, { onDone, signal }) {
  const nums = makeNums(LENGTH);
  const expected = [...nums].reverse().join("");
  root.innerHTML = `
    <p class="stage-hint" id="hint">数字を覚えて、逆の順でタップ</p>
    <div class="stage-num" id="num"></div>
    <div id="pad-slot"></div>
  `;
  const numEl = root.querySelector("#num");
  const hint = root.querySelector("#hint");
  await showSequence(nums, numEl, hint, signal);
  if (signal.aborted) return;
  hint.textContent = "逆の順でタップ";
  numEl.textContent = "";
  let done = false;
  renderPad(root.querySelector("#pad-slot"), {
    prefix: " ",
    hideOk: true,
    onDigit: (value) => {
      if (done || value.length < LENGTH) return;
      done = true;
      finishReverse(value, expected, nums, onDone);
    },
  });
}

/** 1〜9の数字列を作る */
function makeNums(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
}

/** 数字を順番に出す */
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

/** 逆順の正誤を判定する */
function finishReverse(value, expected, nums, onDone) {
  const ok = value === expected;
  buzz(ok);
  onDone({
    game: "reverse",
    points: ok ? 100 : 0,
    maxPoints: 100,
    message: ok ? "正解" : `正解は ${expected}`,
    detail: `出た順: ${nums.join(" → ")}`,
  });
}

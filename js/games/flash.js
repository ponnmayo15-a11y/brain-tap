import { waitOrAbort, buzz } from "../wait.js";
import { renderPad } from "../ui.js";
import { loadSettings, saveSettings, clampSpeed } from "../settings.js";

const COUNT = 5;
const GAP_MS = 150;

/** フラッシュ暗算。設定のあと、スタートで始める */
export function startFlash(root, { onDone, signal }) {
  const saved = loadSettings();
  let digits = saved.flashDigits === 2 || saved.flashDigits === 3 ? saved.flashDigits : 1;
  let speed = clampSpeed(saved.flashSpeed || 0.7);
  drawSetup();

  /** 桁と速さを選ぶ画面を出す */
  function drawSetup() {
    if (signal.aborted) return;
    root.innerHTML = `
      <p class="stage-hint">設定してからスタート</p>
      <p class="setup-label">桁数</p>
      <div class="choice-row" id="digit-row">
        ${[1, 2, 3].map((n) => `<button type="button" class="choice${n === digits ? " is-on" : ""}" data-d="${n}">${n}桁</button>`).join("")}
      </div>
      <p class="setup-label">表示の速さ</p>
      <div class="speed-row">
        <button type="button" class="choice" id="speed-down">−</button>
        <strong id="speed-view">${speed.toFixed(1)}秒</strong>
        <button type="button" class="choice" id="speed-up">＋</button>
      </div>
      <button type="button" class="btn-start" id="btn-start">スタート</button>
    `;
    root.querySelector("#digit-row").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      digits = Number(btn.dataset.d);
      drawSetup();
    });
    root.querySelector("#speed-down").addEventListener("click", () => {
      speed = clampSpeed(speed - 0.1);
      drawSetup();
    });
    root.querySelector("#speed-up").addEventListener("click", () => {
      speed = clampSpeed(speed + 0.1);
      drawSetup();
    });
    root.querySelector("#btn-start").addEventListener("click", () => runPlay());
  }

  /** 数字を流して、合計を聞く */
  async function runPlay() {
    if (signal.aborted) return;
    saveSettings({ flashDigits: digits, flashSpeed: speed });
    const nums = makeNums(COUNT, digits);
    const sum = nums.reduce((a, b) => a + b, 0);
    root.innerHTML = `
      <p class="stage-hint" id="hint">見て</p>
      <div class="stage-num${digits > 1 ? " is-wide" : ""}" id="num"></div>
      <div id="pad-slot"></div>
    `;
    const numEl = root.querySelector("#num");
    await showSequence(nums, numEl, speed * 1000, signal);
    if (signal.aborted) return;
    root.querySelector("#hint").textContent = "合計は？";
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
}

/** 指定桁の数字を作る */
function makeNums(count, digits) {
  const min = digits === 1 ? 1 : 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return Array.from({ length: count }, () => min + Math.floor(Math.random() * (max - min + 1)));
}

/** 数字を順番に出す */
async function showSequence(nums, numEl, showMs, signal) {
  for (const n of nums) {
    if (signal.aborted) return;
    numEl.textContent = String(n);
    await waitOrAbort(showMs, signal);
    numEl.textContent = "";
    await waitOrAbort(GAP_MS, signal);
  }
}

/** 合計の正誤を判定する */
function finishFlash(value, sum, nums, onDone) {
  const ok = Number(value) === sum;
  buzz(ok);
  onDone({
    game: "flash",
    points: ok ? 100 : 0,
    maxPoints: 100,
    message: ok ? "正解" : `正解は ${sum}`,
    detail: `出た数: ${nums.join(" + ")} = ${sum}`,
  });
}

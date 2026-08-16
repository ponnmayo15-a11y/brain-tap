import { waitOrAbort, buzz } from "../wait.js?v=21";
import { renderPad, renderNext } from "../ui.js?v=21";
import { loadSettings, saveSettings, clampSpeed, clampCount } from "../settings.js?v=21";

const GAP_MS = 150;

/** フラッシュ暗算。設定のあと、スタートで始める */
export function startFlash(root, { onDone, signal }) {
  const saved = loadSettings();
  let digits = saved.flashDigits === 2 || saved.flashDigits === 3 ? saved.flashDigits : 1;
  let speed = clampSpeed(saved.flashSpeed || 0.7);
  let count = clampCount(saved.flashCount || 5);
  drawSetup();

  /** 桁・個数・速さを選ぶ画面を出す */
  function drawSetup() {
    if (signal.aborted) return;
    root.innerHTML = `
      <p class="stage-hint">設定してからスタート</p>
      <p class="setup-label">桁数</p>
      <div class="choice-row" id="digit-row">
        ${[1, 2, 3].map((n) => `<button type="button" class="choice${n === digits ? " is-on" : ""}" data-d="${n}">${n}桁</button>`).join("")}
      </div>
      <p class="setup-label">数</p>
      <div class="speed-row">
        <button type="button" class="choice" id="count-down">−</button>
        <strong id="count-view">${count}個</strong>
        <button type="button" class="choice" id="count-up">＋</button>
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
    root.querySelector("#count-down").addEventListener("click", () => {
      count = clampCount(count - 1);
      drawSetup();
    });
    root.querySelector("#count-up").addEventListener("click", () => {
      count = clampCount(count + 1);
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
    saveSettings({ flashDigits: digits, flashSpeed: speed, flashCount: count });
    const nums = makeNums(count, digits);
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
        afterAnswer(value, sum);
      },
    });
  }

  /** ○×と正解を出して、同じ画面で次へ進める */
  function afterAnswer(value, sum) {
    const ok = Number(value) === sum;
    buzz(ok);
    onDone({
      game: "flash",
      points: ok ? 100 : 0,
      maxPoints: 100,
      stay: true,
    });
    root.innerHTML = `
      <p class="judge-mark ${ok ? "is-ok" : "is-ng"}">${ok ? "○" : "×"}</p>
      <p class="judge-answer">正解 ${sum}</p>
      <div id="next-slot"></div>
    `;
    renderNext(root.querySelector("#next-slot"), () => runPlay());
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

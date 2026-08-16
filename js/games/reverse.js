import { waitOrAbort, buzz } from "../wait.js";
import { renderPad, renderNext } from "../ui.js";
import { loadSettings, saveSettings } from "../settings.js";

const SHOW_MS = 900;
const GAP_MS = 250;

/** 逆唱。数字が1つずつ出たあと、逆の順でタップする */
export function startReverse(root, { onDone, signal }) {
  const saved = loadSettings();
  let count = saved.reverseRows >= 3 && saved.reverseRows <= 6 ? saved.reverseRows : 4;
  drawSetup();

  /** 個数を選ぶ画面を出す */
  function drawSetup() {
    if (signal.aborted) return;
    root.innerHTML = `
      <p class="stage-hint">いくつ覚えるか選んでスタート</p>
      <p class="setup-label">個数</p>
      <div class="choice-row" id="count-pick">
        ${[3, 4, 5, 6].map((n) => `<button type="button" class="choice${n === count ? " is-on" : ""}" data-n="${n}">${n}個</button>`).join("")}
      </div>
      <button type="button" class="btn-start" id="btn-start">スタート</button>
    `;
    root.querySelector("#count-pick").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      count = Number(btn.dataset.n);
      drawSetup();
    });
    root.querySelector("#btn-start").addEventListener("click", () => runPlay());
  }

  /** 数字を1つずつ出して、逆順で聞く */
  async function runPlay() {
    if (signal.aborted) return;
    saveSettings({ reverseRows: count });
    const nums = makeNums(count);
    const expected = [...nums].reverse().join("");
    root.innerHTML = `
      <p class="stage-hint" id="hint">見て</p>
      <div class="stage-num" id="num"></div>
      <button type="button" class="text-btn" id="btn-show" hidden>表示</button>
      <div id="pad-slot"></div>
    `;
    const numEl = root.querySelector("#num");
    const hint = root.querySelector("#hint");
    await showSequence(nums, numEl, signal);
    if (signal.aborted) return;
    hint.textContent = "逆の順でタップ";
    numEl.textContent = "";
    askReverse(nums, expected);
  }

  /** 逆順入力と、最初の番号を出すボタンを置く */
  function askReverse(nums, expected) {
    const showBtn = root.querySelector("#btn-show");
    const numEl = root.querySelector("#num");
    const hint = root.querySelector("#hint");
    showBtn.hidden = false;
    showBtn.addEventListener("click", () => {
      numEl.className = "num-rows is-side";
      numEl.innerHTML = nums.map((n) => `<span>${n}</span>`).join("");
      hint.textContent = "最初の番号";
    });
    let done = false;
    renderPad(root.querySelector("#pad-slot"), {
      prefix: " ",
      hideOk: true,
      onDigit: (value) => {
        if (done || value.length < nums.length) return;
        done = true;
        afterAnswer(value, expected);
      },
    });
  }

  /** ○×と正解を出して、同じ画面で次へ進める */
  function afterAnswer(value, expected) {
    const ok = value === expected;
    buzz(ok);
    onDone({
      game: "reverse",
      points: ok ? 100 : 0,
      maxPoints: 100,
      stay: true,
    });
    root.innerHTML = `
      <p class="judge-mark ${ok ? "is-ok" : "is-ng"}">${ok ? "○" : "×"}</p>
      <p class="judge-answer">正解 ${expected.split("").join(" ")}</p>
      <div id="next-slot"></div>
    `;
    renderNext(root.querySelector("#next-slot"), () => runPlay());
  }
}

/** 1〜9の数字列を作る */
function makeNums(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
}

/** 数字を1つずつ出す */
async function showSequence(nums, numEl, signal) {
  for (const n of nums) {
    if (signal.aborted) return;
    numEl.textContent = String(n);
    await waitOrAbort(SHOW_MS, signal);
    numEl.textContent = "";
    await waitOrAbort(GAP_MS, signal);
  }
}

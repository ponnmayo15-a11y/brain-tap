import { waitOrAbort, buzz } from "../wait.js?v=18";
import { renderPad, renderNext } from "../ui.js?v=18";
import { loadSettings, saveSettings } from "../settings.js?v=18";

const HIDE_MS = 2000;

/** 逆唱。行数を選んでスタート。番号は1回だけ出し、2秒で消える */
export function startReverse(root, { onDone, signal }) {
  const saved = loadSettings();
  let rows = saved.reverseRows >= 3 && saved.reverseRows <= 6 ? saved.reverseRows : 4;
  drawSetup();

  /** 行数を選ぶ画面を出す */
  function drawSetup() {
    if (signal.aborted) return;
    root.innerHTML = `
      <p class="stage-hint">何行覚えるか選んでスタート</p>
      <p class="setup-label">行数</p>
      <div class="choice-row" id="row-pick">
        ${[3, 4, 5, 6].map((n) => `<button type="button" class="choice${n === rows ? " is-on" : ""}" data-n="${n}">${n}行</button>`).join("")}
      </div>
      <button type="button" class="btn-start" id="btn-start">スタート</button>
    `;
    root.querySelector("#row-pick").addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      rows = Number(btn.dataset.n);
      drawSetup();
    });
    root.querySelector("#btn-start").addEventListener("click", () => runPlay());
  }

  /** 番号を1回だけ横に出して、2秒後に消す */
  async function runPlay() {
    if (signal.aborted) return;
    saveSettings({ reverseRows: rows });
    const nums = makeNums(rows);
    const expected = [...nums].reverse().join("");
    root.innerHTML = `
      <p class="stage-hint" id="hint">見て覚えて</p>
      <div class="num-rows is-side" id="rows">${rowHtml(nums)}</div>
      <button type="button" class="text-btn" id="btn-show" hidden>表示</button>
      <div id="pad-slot"></div>
    `;
    await waitOrAbort(HIDE_MS, signal);
    if (signal.aborted) return;
    hideAndAsk(nums, expected);
  }

  /** 番号を隠して、逆順入力と表示ボタンを出す */
  function hideAndAsk(nums, expected) {
    const hint = root.querySelector("#hint");
    const rowsEl = root.querySelector("#rows");
    const showBtn = root.querySelector("#btn-show");
    hint.textContent = "逆の順でタップ";
    rowsEl.innerHTML = "";
    showBtn.hidden = false;
    showBtn.addEventListener("click", () => {
      rowsEl.innerHTML = rowHtml(nums);
      hint.textContent = "最初の番号";
      showBtn.hidden = true;
    }, { once: true });
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

/** 1〜9を指定行だけ作る */
function makeNums(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
}

/** 横に並んだ番号のHTML */
function rowHtml(nums) {
  return nums.map((n) => `<span>${n}</span>`).join("");
}

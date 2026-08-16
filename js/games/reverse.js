import { waitOrAbort, buzz } from "../wait.js";
import { renderPad, renderNext } from "../ui.js";
import { loadSettings, saveSettings } from "../settings.js";

const HIDE_MS = 2000;

/** ぎゃくしょう。行数を選んでスタート。2秒で消え、表示で最初の番号を出せる */
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

  /** 番号を縦に出して、2秒後に消す */
  async function runPlay() {
    if (signal.aborted) return;
    saveSettings({ reverseRows: rows });
    const nums = makeNums(rows);
    const expected = [...nums].reverse().join("");
    root.innerHTML = `
      <p class="stage-hint" id="hint">見て覚えて</p>
      <div class="num-rows" id="rows">${rowHtml(nums)}</div>
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
    });
    let done = false;
    renderPad(root.querySelector("#pad-slot"), {
      prefix: " ",
      hideOk: true,
      onDigit: (value) => {
        if (done || value.length < nums.length) return;
        done = true;
        const ok = value === expected;
        buzz(ok);
        onDone({
          game: "reverse",
          points: ok ? 100 : 0,
          maxPoints: 100,
          stay: true,
        });
        renderNext(root, () => runPlay());
      },
    });
  }
}

/** 1〜9を指定個だけ作る */
function makeNums(count) {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 9));
}

/** 縦に並んだ番号のHTML */
function rowHtml(nums) {
  return nums.map((n) => `<span>${n}</span>`).join("");
}

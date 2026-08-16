/** 画面に大きな数字ボタンを出す */
export function renderPad(mount, options) {
  const hideOk = options.hideOk ? " hidden" : "";
  mount.innerHTML = `
    <p class="answer-view" id="answer-view">${options.prefix || ""}</p>
    <div class="pad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((n) => `<button type="button" class="pad-key" data-d="${n}">${n}</button>`)
        .join("")}
      <button type="button" class="pad-key pad-sub" data-act="del">消す</button>
      <button type="button" class="pad-key" data-d="0">0</button>
      <button type="button" class="pad-key pad-ok" data-act="ok"${hideOk}>決定</button>
    </div>
  `;
  const view = mount.querySelector("#answer-view");
  let value = "";
  mount.querySelector(".pad").addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    value = handlePadTap(btn, value, view, options);
  });
}

/** 数字ボタン1回分の処理 */
function handlePadTap(btn, value, view, options) {
  const digit = btn.dataset.d;
  const act = btn.dataset.act;
  if (digit !== undefined) {
    const next = value + digit;
    view.textContent = next || " ";
    if (options.onDigit) options.onDigit(next);
    return next;
  }
  if (act === "del") {
    const next = value.slice(0, -1);
    view.textContent = next || (options.prefix || " ");
    return next;
  }
  if (act === "ok" && options.onOk) options.onOk(value);
  return value;
}

/** 同じ／ちがうの大きなボタンを出す */
export function renderSameDiff(mount, onPick) {
  mount.innerHTML = `
    <div class="same-diff">
      <button type="button" class="btn-same" data-v="same">同じ</button>
      <button type="button" class="btn-diff" data-v="diff">ちがう</button>
    </div>
  `;
  mount.querySelector(".same-diff").addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    onPick(btn.dataset.v === "same");
  });
}

/** 3×3のマスを出す（Nバック用） */
export function renderGrid(mount) {
  mount.innerHTML = `<div class="nb-grid">${"<i></i>".repeat(9)}</div>`;
  return [...mount.querySelectorAll("i")];
}

/** マスの点灯を切り替える */
export function lightCell(cells, index) {
  cells.forEach((cell, i) => cell.classList.toggle("is-on", i === index));
}

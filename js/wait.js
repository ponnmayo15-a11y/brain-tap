/** 指定ミリ秒だけ待つ */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 中止されたらすぐ終わる待ち */
export async function waitOrAbort(ms, signal) {
  if (signal?.aborted) return;
  await Promise.race([
    wait(ms),
    new Promise((resolve) => {
      signal?.addEventListener("abort", resolve, { once: true });
    }),
  ]);
}

/** 正解・不正解の短い振動（対応端末のみ） */
export function buzz(ok) {
  if (!navigator.vibrate) return;
  navigator.vibrate(ok ? 15 : [30, 40, 30]);
}

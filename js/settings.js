const KEY = "brain-tap-settings";

/** 保存してある設定を返す */
export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** 設定の一部を保存する */
export function saveSettings(part) {
  const next = { ...loadSettings(), ...part };
  localStorage.setItem(KEY, JSON.stringify(next));
}

/** 速さを 0.5〜2.0 の 0.1 刻みに丸める */
export function clampSpeed(value) {
  const tenths = Math.round(Number(value) * 10);
  return Math.min(20, Math.max(5, tenths)) / 10;
}

/** 個数を 5〜15 に丸める */
export function clampCount(value) {
  const n = Math.round(Number(value));
  return Math.min(15, Math.max(5, n));
}

/** 逆唱の表示時間を 1.0〜4.0 の 0.5 刻みに丸める */
export function clampHide(value) {
  const halves = Math.round(Number(value) * 2);
  return Math.min(8, Math.max(2, halves)) / 2;
}

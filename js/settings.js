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

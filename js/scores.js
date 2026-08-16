const LOCAL_KEY = "brain-tap-scores";

/** 点数をこの端末に保存する */
export async function saveScore(entry) {
  const row = { ...entry, at: Date.now() };
  const all = loadLocal();
  all.unshift(row);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 50)));
}

/** 最近の点数を読み込む */
export async function loadScores() {
  return loadLocal();
}

/** この端末の記録を返す */
function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

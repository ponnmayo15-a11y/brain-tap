import { firebaseConfig, isFirebaseReady } from "./firebase-config.js";
import { getUser } from "./auth.js";

const LOCAL_KEY = "brain-tap-scores";
let db = null;

/** 点数を保存する（ログイン中はクラウド、それ以外はこの端末） */
export async function saveScore(entry) {
  const row = { ...entry, at: Date.now() };
  saveLocal(row);
  const user = getUser();
  if (!user || !isFirebaseReady()) return;
  const firestore = await getDb();
  const { collection, addDoc, serverTimestamp } = await fs();
  await addDoc(collection(firestore, "users", user.uid, "scores"), {
    game: entry.game,
    points: entry.points,
    maxPoints: entry.maxPoints,
    message: entry.message,
    detail: entry.detail,
    at: serverTimestamp(),
  });
}

/** 最近の点数を読み込む */
export async function loadScores() {
  const user = getUser();
  if (user && isFirebaseReady()) {
    try {
      return await loadCloud(user.uid);
    } catch (error) {
      console.warn("クラウドの読み込みに失敗したので、この端末の記録を使います", error);
    }
  }
  return loadLocal();
}

/** Firestore の部品を読み込む */
function fs() {
  return import("https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js");
}

/** Firestore を返す */
async function getDb() {
  if (db) return db;
  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js");
  const { getFirestore } = await fs();
  const app = getApps()[0] || initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

/** クラウドから直近20件を取る */
async function loadCloud(uid) {
  const firestore = await getDb();
  const { collection, query, orderBy, limit, getDocs } = await fs();
  const q = query(
    collection(firestore, "users", uid, "scores"),
    orderBy("at", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => {
    const data = doc.data();
    return { ...data, at: data.at?.toMillis?.() || Date.now() };
  });
}

/** この端末に1件足す */
function saveLocal(row) {
  const all = loadLocal();
  all.unshift(row);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all.slice(0, 50)));
}

/** この端末の記録を返す */
function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

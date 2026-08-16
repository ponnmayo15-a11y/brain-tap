import { firebaseConfig, isFirebaseReady } from "./firebase-config.js";

let auth = null;
let currentUser = null;
let googleProvider = null;
let signInWithRedirectFn = null;
let signOutFn = null;

/** Firebase を起動し、ログイン状態の変化を見る */
export async function initAuth(onUser, onError) {
  if (!isFirebaseReady()) {
    onUser(null);
    return;
  }
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js");
  const app = initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  auth.languageCode = "ja";
  googleProvider = new authMod.GoogleAuthProvider();
  signInWithRedirectFn = authMod.signInWithRedirect;
  signOutFn = authMod.signOut;
  try {
    await authMod.getRedirectResult(auth);
  } catch (error) {
    console.warn("Googleログインの戻り処理", error);
    if (onError) onError(error);
  }
  authMod.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onUser(user);
  });
}

/** Googleでログインする（画面遷移。公開ページでも動きやすい） */
export async function loginGoogle() {
  if (!auth || !signInWithRedirectFn) {
    throw new Error("まだ Google ログインの準備ができていません");
  }
  await signInWithRedirectFn(auth, googleProvider);
}

/** ログアウトする */
export async function logout() {
  if (!auth || !signOutFn) return;
  await signOutFn(auth);
  currentUser = null;
}

/** 今ログインしている人を返す */
export function getUser() {
  return currentUser;
}

/** 失敗理由を日本語にする */
export function loginErrorText(error) {
  const code = error?.code || "";
  if (code === "auth/unauthorized-domain") {
    return "このサイトからのログインが、まだ許可されていません。承認済みドメインは ponnmayo15-a11y.github.io だけにしてください（https:// は付けない）。";
  }
  if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
    return "ログイン画面が閉じられました。もう一度押してください。";
  }
  if (code === "auth/operation-not-allowed") {
    return "Googleログインが、まだ有効になっていません。";
  }
  if (code === "auth/network-request-failed") {
    return "通信に失敗しました。電波のよいところで、もう一度押してください。";
  }
  return `ログインできませんでした。${code || error?.message || ""}`.trim();
}

export { isFirebaseReady };

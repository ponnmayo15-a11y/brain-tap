import { firebaseConfig, isFirebaseReady } from "./firebase-config.js?v=7";

let auth = null;
let currentUser = null;
let googleProvider = null;
let signInWithPopupFn = null;
let signInWithRedirectFn = null;
let popupResolver = null;
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
  try {
    auth = authMod.initializeAuth(app, {
      persistence: authMod.indexedDBLocalPersistence,
      popupRedirectResolver: authMod.browserPopupRedirectResolver,
    });
  } catch {
    auth = authMod.getAuth(app);
  }
  auth.languageCode = "ja";
  googleProvider = new authMod.GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
  signInWithPopupFn = authMod.signInWithPopup;
  signInWithRedirectFn = authMod.signInWithRedirect;
  popupResolver = authMod.browserPopupRedirectResolver;
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

/** Googleでログインする（スマホは画面遷移。パソコンは窓） */
export async function loginGoogle() {
  if (!auth) {
    throw new Error("まだ Google ログインの準備ができていません");
  }
  if (isPhone() && signInWithRedirectFn) {
    await signInWithRedirectFn(auth, googleProvider);
    return;
  }
  if (!signInWithPopupFn) {
    throw new Error("まだ Google ログインの準備ができていません");
  }
  const result = await signInWithPopupFn(auth, googleProvider, popupResolver);
  currentUser = result.user;
  return result.user;
}

/** スマホかどうかをざっくり判定する */
function isPhone() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
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
  const extra = [code, error?.message].filter(Boolean).join(" / ");
  if (code === "auth/unauthorized-domain") {
    return `このサイトからのログインが許可されていません。${extra}`;
  }
  if (code === "auth/popup-blocked") {
    return `ログイン窓がブロックされました。ブラウザの許可を出して、もう一度押してください。${extra}`;
  }
  if (code === "auth/popup-closed-by-user") {
    return "ログイン窓が閉じられました。もう一度押してください。";
  }
  if (code === "auth/operation-not-allowed") {
    return `Googleログインが、まだ有効になっていません。${extra}`;
  }
  if (code === "auth/network-request-failed") {
    return `通信に失敗しました。${extra}`;
  }
  return `ログインできませんでした。${extra || "原因不明"}`;
}

export { isFirebaseReady };

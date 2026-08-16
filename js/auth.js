import { firebaseConfig, isFirebaseReady } from "./firebase-config.js";

let auth = null;
let currentUser = null;
let googleProvider = null;
let signInWithPopupFn = null;
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
  popupResolver = authMod.browserPopupRedirectResolver;
  signOutFn = authMod.signOut;
  authMod.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onUser(user);
  });
  if (onError && !auth) onError(new Error("auth-init-failed"));
}

/** Googleでログインする（同じページのポップアップ。GitHub Pages向き） */
export async function loginGoogle() {
  if (!auth || !signInWithPopupFn) {
    throw new Error("まだ Google ログインの準備ができていません");
  }
  const result = await signInWithPopupFn(auth, googleProvider, popupResolver);
  currentUser = result.user;
  return result.user;
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

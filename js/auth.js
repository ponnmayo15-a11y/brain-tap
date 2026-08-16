import { firebaseConfig, isFirebaseReady } from "./firebase-config.js";

let auth = null;
let currentUser = null;
let googleProvider = null;
let signInWithPopupFn = null;
let signInWithRedirectFn = null;
let signOutFn = null;

/** Firebase を起動し、ログイン状態の変化を見る */
export async function initAuth(onUser) {
  if (!isFirebaseReady()) {
    onUser(null);
    return;
  }
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js");
  const app = initializeApp(firebaseConfig);
  auth = authMod.getAuth(app);
  googleProvider = new authMod.GoogleAuthProvider();
  signInWithPopupFn = authMod.signInWithPopup;
  signInWithRedirectFn = authMod.signInWithRedirect;
  signOutFn = authMod.signOut;
  try {
    await authMod.getRedirectResult(auth);
  } catch (error) {
    console.warn("Googleログインの戻り処理", error);
  }
  authMod.onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onUser(user);
  });
}

/** Googleでログインする（スマホは画面遷移、パソコンはポップアップ） */
export async function loginGoogle() {
  if (!auth) {
    throw new Error("まだ Google ログインの準備ができていません");
  }
  if (isPhone()) {
    await signInWithRedirectFn(auth, googleProvider);
    return;
  }
  const result = await signInWithPopupFn(auth, googleProvider);
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

export { isFirebaseReady };

/** スマホかどうかをざっくり判定する */
function isPhone() {
  return /Mobi|Android|iPhone/i.test(navigator.userAgent);
}

/**
 * Firebase の接続情報。
 * 値はチャットで受け取り、エージェントがここに書く。
 * 空のままだと練習モード（この端末だけに記録）で動く。
 */
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

/** Firebase の値が入っているか返す */
export function isFirebaseReady() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

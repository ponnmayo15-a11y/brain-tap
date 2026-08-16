/**
 * Firebase の接続情報。
 * 値はチャットで受け取り、エージェントがここに書く。
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDMRNnGppU5-l9t_LKmjRQ0C6C0bMLROI8",
  authDomain: "brain-tap-3cbf0.firebaseapp.com",
  projectId: "brain-tap-3cbf0",
  storageBucket: "brain-tap-3cbf0.firebasestorage.app",
  messagingSenderId: "472842164463",
  appId: "1:472842164463:web:f70223058cc1475a74231a",
};

/** Firebase の値が入っているか返す */
export function isFirebaseReady() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

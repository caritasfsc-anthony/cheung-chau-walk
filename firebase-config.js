/* Firebase 網頁設定（公開資料，可以提交到 GitHub；權限由 Firestore 安全規則把關） */
export const firebaseConfig = {
  apiKey: "AIzaSyC5HBwiLDS127cm6EyD3TBzZS9FVb_iRLg",
  authDomain: "cheung-chau-walk.firebaseapp.com",
  projectId: "cheung-chau-walk",
  storageBucket: "cheung-chau-walk.firebasestorage.app",
  messagingSenderId: "698784280589",
  appId: "1:698784280589:web:1760c3fe2ea1c4cbb42544"
};

/* 只容許此網域的學校 Google 帳戶登入 */
export const SCHOOL_DOMAIN = "caritasfsc.edu.hk";

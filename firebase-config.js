/* Firebase 網頁設定（公開資料，可以提交到 GitHub；權限由 Firestore 安全規則把關） */
export const firebaseConfig = {
  apiKey: "AIzaSyD7CU7xWTrA8THE3PJYXTfXy3iNX6j06z4",
  authDomain: "cheung-chau-walk-rgb.firebaseapp.com",
  projectId: "cheung-chau-walk-rgb",
  storageBucket: "cheung-chau-walk-rgb.firebasestorage.app",
  messagingSenderId: "595056143682",
  appId: "1:595056143682:web:a499eccd94833625da2cdb"
};

/* 只容許此電郵的 Google 帳戶登入後台 */
export const ADMIN_EMAIL = "info@rgb-workshop.com";

/* Google 登入 hd 提示用（非強制；真正權限由 ADMIN_EMAIL 把關） */
export const SCHOOL_DOMAIN = "rgb-workshop.com";

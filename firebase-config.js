/* Firebase 網頁設定（公開資料，可以提交到 GitHub；權限由 Firestore 安全規則把關） */
export const firebaseConfig = {
  apiKey: "AIzaSyBlphtiPuM5TcNdb-WVTLZEVhLWdikpT_I",
  authDomain: "cheung-chau-map-rgb.firebaseapp.com",
  projectId: "cheung-chau-map-rgb",
  storageBucket: "cheung-chau-map-rgb.firebasestorage.app",
  messagingSenderId: "396145644538",
  appId: "1:396145644538:web:ebfd4497ade34a0d03ca43"
};

/* 只容許此電郵的 Google 帳戶登入後台 */
export const ADMIN_EMAIL = "info@rgb-workshop.com";

/* Google 登入 hd 提示用（非強制；真正權限由 ADMIN_EMAIL 把關） */
export const SCHOOL_DOMAIN = "rgb-workshop.com";

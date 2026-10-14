/* 長洲足印：內置地圖殼（公開首頁無預設路線；路線由後台建立後以 ?map= 分享） */

export const HOME = {
  center: [114.029, 22.208],
  zoom: 14.7,
  pitch: 62,
  bearing: -32,
  mobileZoom: 13.9,
  mobilePitch: 52
};

export const ROUTES = [];

export const FINE_NOTE = "公開首頁暫未附路線。管理員可在後台建立並發佈地圖，再用帶 ?map= 的連結分享。";

/* 內置版本的刊頭與設定（與 Firestore 地圖共用同一個顯示程式） */
export const BUILTIN_SITE = {
  marquee: "",
  builtin: true,
  title: "長洲足印",
  seal: "洲",
  eyebrow: "離島步行 · 不是導航",
  lede: "這張公開地圖暫時未有路線。管理員可在後台建立步行地圖後，以連結分享。",
  fineNote: FINE_NOTE,
  home: HOME,
  maxBounds: [[113.99, 22.175], [114.065, 22.238]],
  minZoom: 13,
  routes: ROUTES
};

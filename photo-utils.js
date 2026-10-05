/* 長洲立體步道：相片壓縮（後台與編輯器共用）
   把檔案／Blob 縮小並轉成 JPEG data URL，確保不超過 Firestore 文件大小限制。 */

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("無法讀取這張圖片，請確認檔案是 JPEG、PNG 或 WebP 圖片。")); };
    img.src = url;
  });
}

export async function compressImage(fileOrBlob, { maxDim = 1280, quality = 0.75, maxChars = 900000 } = {}) {
  if (!fileOrBlob || !(fileOrBlob instanceof Blob)) throw new Error("沒有可處理的圖片。");
  const img = await loadImage(fileOrBlob);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  if (!srcW || !srcH) throw new Error("圖片尺寸無效。");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let dim = maxDim;
  let q = quality;
  for (let attempt = 0; attempt < 12; attempt++) {
    const scale = Math.min(1, dim / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#ffffff"; // 透明背景轉 JPEG 時填白
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.startsWith("data:image/jpeg") && dataUrl.length <= maxChars) return { dataUrl, width, height };
    // 先降質素，再縮尺寸
    if (q > 0.5) q = Math.max(0.5, q - 0.1);
    else { dim = Math.round(dim * 0.8); q = Math.min(quality, 0.7); }
    if (dim < 200) break;
  }
  throw new Error("圖片壓縮後仍然太大，請先把相片裁細或改用較簡單的圖片再上載。");
}

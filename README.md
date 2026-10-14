# 長洲足印

以傾斜地圖閱讀長洲步行路線。介面為繁體中文。公開首頁不附預設路線；路線由管理員在後台建立後，以 `?map=` 連結分享。

## 線上版

GitHub Pages：<https://hkrgb.github.io/cheung-chau-walk/>（沒有 serve.py，會自動改用原圖磚網址）。

後台管理員：只限 `info@rgb-workshop.com`（Firebase 專案 `cheung-chau-map-rgb`）。

## 如何開啟（建議）

在這個資料夾啟動內建的靜態伺服器兼圖磚代理：

```bash
cd /workspace/cheung-chau-walk
python3 serve.py
```

然後用瀏覽器打開 [http://127.0.0.1:8765/](http://127.0.0.1:8765/)。

為什麼要用 `serve.py`，而不是一般的 `python3 -m http.server`？有些瀏覽器環境（例如本機的沙盒 Chrome）連不上 `tiles.openfreemap.org` 這類圖磚主機，畫面會一片空白。`serve.py` 會把樣式、矢量圖磚、字型、雪碧圖，以及地形圖磚，經 `/proxy/<主機>/<路徑>` 由本機轉發；樣式與 TileJSON 裡的絕對網址也會被改寫成本機代理。伺服器端用 `curl` 能連到的位址，瀏覽器就能畫出來。

頁面會先打 `/proxy/health`：有回應就走代理；你在自己的電腦直接開檔案，或用其他靜態伺服器，則仍用原網址，不受影響。

也可以指定埠口：

```bash
python3 serve.py --port 9000
```

不需要安裝 npm，也沒有建置步驟。電腦仍需能上網，因為代理要去上游取圖。

## 包含什麼

- 一張以長洲為中心的互動地圖（約北緯 22.208、東經 114.029），預設傾斜鏡頭。
- 底圖使用 [OpenFreeMap](https://tiles.openfreemap.org) 的 Liberty 樣式（免 API 金鑰）。此樣式在較大比例時有建築物擠出；另加公開的 Terrarium 高程，做出地形起伏。若 Liberty 載入失敗或逾時（約 12 秒），會改用 OpenFreeMap Dark，並維持傾斜視角。
- 公開首頁（`index.html`）為空殼：地圖可瀏覽，但沒有內置步行路線。管理員在後台新增地圖、加入路線與站點後發佈，訪客用 `index.html?map=<id>` 開啟。
- 手機版（闊度 ≤820px，或橫向矮螢幕）：地圖鋪滿全屏，路線面板變成底部抽屜，可拖動或輕按把手，在「收起／半開／全開」之間切換。桌面版外觀不變。
- 任何站點都可以附一張相片，會顯示在資訊卡上，站點列表也會出現縮圖。

## 後台

開啟 `admin.html`，以 `info@rgb-workshop.com` Google 帳戶登入後可：

- 新增空白地圖
- 編輯路線、站點、相片與頂部提示字
- 發佈／取消發佈，並設定可見範圍（公開或只限管理員）
- 複製分享連結

Firebase 專案為 `cheung-chau-map-rgb`；權限由 `firestore.rules` 與 `ADMIN_EMAIL` 把關。

## 座標是約數

站點經緯度由管理員標示，屬約數，**不是**康樂及文化事務署或任何機構的官方步道軌跡。狹窄的啞鈴桿、灘邊與山徑，實地請跟路牌與現場告示。

/* 長洲立體步道：地圖底層（樣式、地形、本機代理偵測），檢視頁與編輯器共用 */

export const DIRECT_TERRAIN = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const LANDSD = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz";
const LANDSD_ATTR = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" rel="noopener">© 地政總署 Map information from Lands Department</a>';
const OFM_GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
const OFM_VECTOR = "https://tiles.openfreemap.org/planet";

/* 地政總署底圖（WGS84 XYZ PNG）：kind = "map"（地形圖）或 "imagery"（航照）；另疊中文標籤與 OpenFreeMap 立體建築 */
export function landsdStyle(kind, proxied) {
  const u = (url) => (proxied ? toProxy(url) : url);
  const raster = (path, minzoom) => ({
    type: "raster", tiles: [u(LANDSD + "/" + path + "/WGS84/{z}/{x}/{y}.png")],
    tileSize: 256, minzoom, maxzoom: 20, attribution: LANDSD_ATTR
  });
  return {
    version: 8,
    glyphs: u(OFM_GLYPHS),
    sources: {
      "landsd-basemap": raster(kind === "imagery" ? "imagery" : "basemap", kind === "imagery" ? 0 : 10),
      "landsd-label": raster("label/hk/tc", 10),
      openmaptiles: { type: "vector", url: u(OFM_VECTOR) }
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": kind === "imagery" ? "#1d2420" : "#eef0ea" } },
      { id: "landsd-basemap", type: "raster", source: "landsd-basemap" },
      {
        id: "building-3d", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 15,
        paint: {
          "fill-extrusion-color": "#d8d2c8",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": kind === "imagery" ? 0.45 : 0.6
        }
      },
      { id: "landsd-label", type: "raster", source: "landsd-label" }
    ]
  };
}

/* kind：map / imagery / osm（供切換鈕使用）；style 可為網址或樣式物件 */
export const DIRECT_STYLES = [
  { kind: "osm", style: () => "https://tiles.openfreemap.org/styles/liberty", label: "OpenFreeMap Liberty", proxied: false },
  { kind: "osm", style: () => "https://tiles.openfreemap.org/styles/dark", label: "OpenFreeMap Dark", proxied: false },
  { kind: "map", style: () => landsdStyle("map", false), label: "地政總署地形圖", minZoom: 10, proxied: false },
  { kind: "imagery", style: () => landsdStyle("imagery", false), label: "地政總署航照", minZoom: 10, proxied: false }
];
const PROXY_HOSTS = ["tiles.openfreemap.org", "s3.amazonaws.com", "mapapi.geodata.gov.hk"];
const STYLE_TIMEOUT_MS = 12000;

/* 由 serve.py 提供時改用 /proxy/<host>/<path>；直接開檔或其他伺服器（GitHub Pages 等）則用原網址。 */
export const tiles = {
  styles: DIRECT_STYLES.slice(),
  terrain: DIRECT_TERRAIN,
  proxyMode: false
};

export function toProxy(url) {
  for (const host of PROXY_HOSTS) {
    const prefix = "https://" + host + "/";
    if (url.startsWith(prefix)) return location.origin + "/proxy/" + host + "/" + url.slice(prefix.length);
  }
  return url;
}

async function probeProxy() {
  if (!/^https?:$/.test(location.protocol)) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch("/proxy/health", { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.ok === true;
  } catch (error) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

let detecting = null;
export function detectProxy() {
  if (!detecting) {
    detecting = probeProxy().then((ok) => {
      tiles.proxyMode = ok;
      if (ok) {
        // 先走本機代理，最後才嘗試直連。
        tiles.styles = DIRECT_STYLES.map((s) => ({
          ...s,
          style: s.kind === "osm" ? () => toProxy(s.style()) : () => landsdStyle(s.kind, true),
          label: s.label + "（本機代理）", proxied: true
        })).concat(DIRECT_STYLES);
        tiles.terrain = toProxy(DIRECT_TERRAIN);
      }
      window.__ccw = { proxyMode: ok, styles: tiles.styles.map((s) => s.label), terrain: tiles.terrain };
      return ok;
    });
  }
  return detecting;
}

/* 建立地圖；樣式載入失敗時自動換下一個樣式（重新建立地圖）。
   opts: { container, mapOptions, onCreate(map, entry), onLoad(map, entry), onStatus(msg), onFail() } */
export function createMap(opts) {
  let index = 0;
  const boot = () => {
    const entry = tiles.styles[index];
    let ready = false;
    let failed = false;
    const holder = { entry };
    const map = new maplibregl.Map({
      container: opts.container,
      style: entry.style(),
      attributionControl: false,
      localIdeographFontFamily: "'Noto Sans TC', 'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif",
      // 代理模式下的保險：即使樣式內有漏改的網址，也轉到本機代理。
      transformRequest: (url) => ({ url: holder.entry.proxied ? toProxy(url) : url }),
      ...opts.mapOptions()
    });
    map.__ccwHolder = holder;
    map.__ccwBaseMin = map.getMinZoom();
    if (entry.minZoom && map.getMinZoom() < entry.minZoom) map.setMinZoom(entry.minZoom);
    if (window.__ccw) window.__ccw.map = map;
    if (opts.onCreate) opts.onCreate(map, entry);
    const failOver = (reason) => {
      if (ready || failed) return;
      failed = true;
      clearTimeout(timer);
      console.warn("[長洲立體步道] 樣式失敗：" + entry.label + "（" + reason + "）");
      map.remove();
      if (index < tiles.styles.length - 1) {
        index += 1;
        if (opts.onStatus) opts.onStatus("地圖樣式未能載入，改用備用底圖……");
        boot();
      } else if (opts.onStatus) {
        opts.onStatus("所有地圖樣式都未能載入。請確認網絡，或在資料夾執行 python3 serve.py 後開啟 http://127.0.0.1:8765/。");
      }
    };
    const timer = setTimeout(() => failOver("逾時 " + STYLE_TIMEOUT_MS / 1000 + " 秒"), STYLE_TIMEOUT_MS);
    map.on("error", (event) => {
      if (event && (event.sourceId || event.tile)) return; // 單一圖磚失敗不換樣式
      const message = String(event && event.error ? event.error.message : event);
      // 樣式未載入前的任何錯誤（連線被斷、404、樣式解析失敗）都轉用下一個樣式。
      if (!ready && !map.isStyleLoaded()) failOver(message);
    });
    map.on("load", () => {
      ready = true;
      clearTimeout(timer);
      if (opts.onStatus) opts.onStatus("");
      if (opts.onLoad) opts.onLoad(map, entry);
    });
  };
  boot();
}

/* 切換底圖（map / imagery / osm）；完成後呼叫 onReady(map, entry) 以重新加上地形、路線等 */
export function currentKind(map) {
  return map && map.__ccwHolder ? map.__ccwHolder.entry.kind : null;
}

export function switchStyle(map, kind, onReady) {
  const holder = map.__ccwHolder;
  const current = holder.entry;
  const entry = tiles.styles.find((s) => s.kind === kind && s.proxied === !!current.proxied)
    || tiles.styles.find((s) => s.kind === kind);
  if (!entry) return null;
  holder.entry = entry;
  map.setMinZoom(Math.max(map.__ccwBaseMin || 0, entry.minZoom || 0));
  map.once("style.load", () => onReady && onReady(map, entry));
  map.setStyle(entry.style(), { diff: false });
  return entry;
}

/* 加入地形與天空；成功回傳 true */
export function enableTerrain(map, exaggeration) {
  try {
    if (!map.getSource("terrain-dem")) {
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: [tiles.terrain],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15
      });
    }
    map.setTerrain({ source: "terrain-dem", exaggeration });
    if (!map.getLayer("sky")) {
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [180, 18],
          "sky-atmosphere-sun-intensity": 6
        }
      });
    }
    return true;
  } catch (error) {
    return false;
  }
}

/* 路線線條：route.path（[[lng,lat],…]）缺少時以站點依次連接 */
export function routeCoords(route) {
  if (Array.isArray(route.path) && route.path.length > 1) return route.path;
  return route.stops.map((s) => [s.lng, s.lat]);
}

export function setRouteLine(map, coords, color) {
  const data = coords.length > 1
    ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }
    : { type: "FeatureCollection", features: [] };
  if (map.getSource("route")) {
    map.getSource("route").setData(data);
  } else {
    map.addSource("route", { type: "geojson", data });
    map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#1a120e", "line-width": 9, "line-opacity": 0.45 }
    });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": color || "#e25b3a", "line-width": 4.2 }
    });
  }
  if (color) map.setPaintProperty("route-line", "line-color", color);
}

export function clearRouteLine(map) {
  if (map.getSource("route")) map.getSource("route").setData({ type: "FeatureCollection", features: [] });
}

/* 文字轉義：Firestore 內容一律當純文字 */
export function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* 顏色只接受 #rrggbb，避免把任意字串放進 style */
export function safeColor(value, fallback = "#e25b3a") {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? value : fallback;
}

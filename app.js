/* 長洲立體步道
   站點座標取自公開地圖與維基條目，屬約數，路線是站與站的步行示意，不是官方步道軌跡。
   記述只採用已核對的公開資料；未能核對的年份與故事不寫。 */

const HOME = {
  center: [114.029, 22.208],
  zoom: 14.7,
  pitch: 62,
  bearing: -32
};

const DIRECT_TERRAIN = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const DIRECT_STYLES = [
  { url: "https://tiles.openfreemap.org/styles/liberty", label: "OpenFreeMap Liberty", proxied: false },
  { url: "https://tiles.openfreemap.org/styles/dark", label: "OpenFreeMap Dark", proxied: false }
];
const PROXY_HOSTS = ["tiles.openfreemap.org", "s3.amazonaws.com"];
const STYLE_TIMEOUT_MS = 12000;

/* 由 serve.py 提供時改用 /proxy/<host>/<path>；直接開檔或其他伺服器則用原網址。 */
let STYLES = DIRECT_STYLES.slice();
let TERRAIN_TILES = DIRECT_TERRAIN;
let proxyMode = false;

function toProxy(url) {
  for (const host of PROXY_HOSTS) {
    const prefix = "https://" + host + "/";
    if (url.startsWith(prefix)) return location.origin + "/proxy/" + host + "/" + url.slice(prefix.length);
  }
  return url;
}

async function detectProxy() {
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

const ROUTES = [
  {
    id: "north",
    theme: "廟宇與醮會",
    name: "北社山海",
    area: "北社、北眺、東灣",
    duration: "約 1.5 小時",
    color: "#e25b3a",
    blurb: "由渡輪碼頭北上北社的廟宇，登家樂徑到北眺亭，再落到東灣。適合想一次看廟、高處與醮會場地的慢走。",
    stops: [
      {
        name: "長洲渡輪碼頭",
        lng: 114.02834,
        lat: 22.20858,
        text: "碼頭在新興海傍街。香港旅遊發展局把這段窄腰稱為「啞鈴桿」，由中環乘船登島多在此落船。旁側另有長洲公眾碼頭，用途不同，此站以客運渡輪碼頭為準。"
      },
      {
        name: "北帝廟（玉虛宮）",
        lng: 114.02786,
        lat: 22.21235,
        text: "又名玉虛宮，位於北社街，建於乾隆四十八年（1783年），獲評為一級歷史建築，主祀北帝。華人廟宇委員會記，太平清醮為酬謝北帝，醮場設於東灣及廟前廣場。"
      },
      {
        name: "北社天后廟",
        lng: 114.02756,
        lat: 22.21295,
        text: "位於北帝廟以北、和順里一帶，與北社的廟宇相鄰，主祀天后。建造細節這次未再引申，只標出可步行到達的位置。"
      },
      {
        name: "北眺亭",
        lng: 114.03056,
        lat: 22.21707,
        text: "北眺亭在長洲家樂徑上，近島的北端高處。香港旅遊發展局介紹，天晴時可望見長洲、南丫島，以至青馬大橋。"
      },
      {
        name: "東灣泳灘",
        lng: 114.0294,
        lat: 22.2112,
        text: "島東岸的公眾沙灘，由北社一帶下來可接到灘的北段。香港旅遊發展局稱晴天可眺港島南區；華人廟宇委員會亦記太平清醮醮場設於東灣。"
      }
    ],
    path: [
      [114.02834, 22.20858],
      [114.0289, 22.2087],
      [114.029, 22.21],
      [114.0287, 22.2112],
      [114.0282, 22.212],
      [114.02786, 22.21235],
      [114.02756, 22.21295],
      [114.02845, 22.21455],
      [114.02965, 22.21605],
      [114.03056, 22.21707],
      [114.02985, 22.21615],
      [114.0291, 22.2149],
      [114.0286, 22.2132],
      [114.0288, 22.212],
      [114.0294, 22.2112]
    ]
  },
  {
    id: "east",
    theme: "海岸與石刻",
    name: "東岸石徑",
    area: "東灣至東南岸",
    duration: "約 2 小時",
    color: "#d4a24a",
    blurb: "橫過啞鈴桿到東灣，沿海岸看石刻與觀音灣，再接上俗稱小長城的石徑。石刻現時或無直達小徑，請依現場告示。",
    stops: [
      {
        name: "長洲渡輪碼頭",
        lng: 114.02834,
        lat: 22.20858,
        text: "路線由新興海傍街的渡輪碼頭起步，向東橫過島中央的窄腰，即香港旅遊發展局所說的啞鈴桿，便到東灣。"
      },
      {
        name: "東灣泳灘",
        lng: 114.02925,
        lat: 22.21035,
        text: "東灣是碼頭以東的公眾泳灘，呈彎月形。香港旅遊發展局介紹，晴天可從這裡眺望港島南區，再向南走可接到石刻所在的一段岸線。"
      },
      {
        name: "長洲石刻",
        lng: 114.03268,
        lat: 22.20783,
        text: "位於連島沙洲東南部、華威酒店對下，東灣與觀音灣之間。古物古蹟辦事處記：1970年由地質學家發現，1982年列為法定古蹟，紋飾是曲線環繞小凹槽的兩組圖案。辦事處現時備註未有路徑直達，到訪前請再查最新說明。"
      },
      {
        name: "關公忠義亭",
        lng: 114.03196,
        lat: 22.20611,
        text: "觀音灣路山丘上的亭廟，主祀關公，位置在石刻與觀音灣之間偏內陸。建造年份這次未核對，不作記述。"
      },
      {
        name: "觀音灣泳灘",
        lng: 114.0337,
        lat: 22.20725,
        text: "東灣以南的海灣。香港旅遊發展局介紹這裡是長洲滑浪風帆中心所在，也是俗稱小長城的郊遊徑起步處。"
      },
      {
        name: "觀音廟",
        lng: 114.03482,
        lat: 22.20643,
        text: "明暉路上、靠近觀音灣的一座觀音廟，可當作由沙灘轉上南岸步道時的地標。公開資料對建造年份說法不一，此站不寫年份。"
      },
      {
        name: "小長城",
        lng: 114.03752,
        lat: 22.20777,
        text: "屬長洲家樂徑的一段海岸石徑。香港旅遊發展局記全長約850米，1997年完工，石砌欄杆形似長城，沿島的東南岸而建，途中可望海，亦有形狀特別的岩石。"
      }
    ],
    path: [
      [114.02834, 22.20858],
      [114.0289, 22.2087],
      [114.02925, 22.21035],
      [114.03035, 22.20935],
      [114.03145, 22.20845],
      [114.03268, 22.20783],
      [114.03225, 22.20715],
      [114.03196, 22.20611],
      [114.0329, 22.20665],
      [114.0337, 22.20725],
      [114.0343, 22.20685],
      [114.03482, 22.20643],
      [114.0357, 22.20675],
      [114.03665, 22.20725],
      [114.03752, 22.20777]
    ]
  },
  {
    id: "west",
    theme: "西岸與岩洞",
    name: "西灣尋洞",
    area: "街市至西南岸",
    duration: "約 2 小時",
    color: "#7f9a78",
    blurb: "自碼頭經街市與大石口，沿西岸到天后廟與張保仔洞。洞內濕滑昏暗，只宜在有準備時進入。",
    stops: [
      {
        name: "長洲渡輪碼頭",
        lng: 114.02834,
        lat: 22.20858,
        text: "仍由新興海傍街的渡輪碼頭出發，這次不向東灣，而向南進入市集，再轉西南岸。"
      },
      {
        name: "長洲街市",
        lng: 114.02831,
        lat: 22.20683,
        text: "大興堤路的街市，在碼頭以南的市集地帶。續向西南，可接到往西灣與張保仔洞的路。"
      },
      {
        name: "大石口",
        lng: 114.02653,
        lat: 22.20381,
        text: "島西南岸的地名。沿西岸往張保仔洞會經過這一帶。座標依公開地圖的地名標註，屬約數，不是某一座建築物的正門。"
      },
      {
        name: "西灣天后廟",
        lng: 114.01892,
        lat: 22.20143,
        text: "張保仔路旁、西灣岸邊的天后廟，往張保仔洞的步道會經過附近。廟的建造年份這次未寫入。"
      },
      {
        name: "張保仔洞",
        lng: 114.01753,
        lat: 22.20042,
        text: "島西南的天然岩洞。公開記述指：相傳清代海盜張保仔曾在此藏寶，但洞內並未發現寶藏。洞深約10米，通道約90米，地面濕滑、光線昏暗，入洞宜備手電筒。"
      }
    ],
    path: [
      [114.02834, 22.20858],
      [114.0289, 22.2087],
      [114.0291, 22.2084],
      [114.0289, 22.2076],
      [114.02831, 22.20683],
      [114.02755, 22.20535],
      [114.02653, 22.20381],
      [114.0244, 22.20295],
      [114.0222, 22.2022],
      [114.0212, 22.2001],
      [114.02, 22.20005],
      [114.0192, 22.201],
      [114.01892, 22.20143],
      [114.01815, 22.20085],
      [114.01753, 22.20042]
    ]
  }
];

const routesEl = document.getElementById("routes");
const detailEl = document.getElementById("detail");
const statusEl = document.getElementById("status");

let map;
let markers = [];
let activeRoute = null;
let activeStop = -1;
let styleIndex = 0;
let styleReady = false;

function showStatus(message) {
  statusEl.hidden = !message;
  statusEl.textContent = message || "";
}

function formatCoord(stop) {
  return `約 ${stop.lat.toFixed(4)}°N，${stop.lng.toFixed(4)}°E`;
}

function renderList() {
  routesEl.innerHTML = "";
  ROUTES.forEach((route) => {
    const card = document.createElement("article");
    card.className = "route" + (activeRoute && activeRoute.id === route.id ? " active" : "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "route-main";
    button.setAttribute("aria-pressed", activeRoute && activeRoute.id === route.id ? "true" : "false");
    button.innerHTML = `
      <p class="route-theme">${route.theme}</p>
      <h2>${route.name}</h2>
      <p class="route-facts">${route.area} · ${route.duration} · ${route.stops.length} 站</p>
      <p class="route-blurb">${route.blurb}</p>
    `;
    button.addEventListener("click", () => selectRoute(route.id));
    card.appendChild(button);

    const list = document.createElement("ol");
    list.className = "stops";
    route.stops.forEach((stop, index) => {
      const item = document.createElement("li");
      const stopButton = document.createElement("button");
      stopButton.type = "button";
      stopButton.className = "stop-btn" + (activeRoute && activeRoute.id === route.id && activeStop === index ? " active" : "");
      stopButton.innerHTML = `<span class="stop-no" style="background:${route.color}">${index + 1}</span><span>${stop.name}</span>`;
      stopButton.addEventListener("click", () => selectRoute(route.id, index));
      item.appendChild(stopButton);
      list.appendChild(item);
    });
    card.appendChild(list);
    routesEl.appendChild(card);
  });

  const note = document.createElement("p");
  note.className = "fine";
  note.textContent = "站點座標為約數，連線只表示步行順序，不是官方步道。船期、泳灘與古蹟通道請以現場及主管部門最新公布為準。";
  routesEl.appendChild(note);
}

function clearMarkers() {
  markers.forEach((marker) => marker.remove());
  markers = [];
}

function drawRoute(route) {
  const data = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: route.path }
  };
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
      paint: { "line-color": route.color, "line-width": 4.2 }
    });
  }
  map.setPaintProperty("route-line", "line-color", route.color);
}

function addMarkers(route) {
  clearMarkers();
  route.stops.forEach((stop, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "pin" + (index === activeStop ? " active" : "");
    el.style.setProperty("--pin", route.color);
    el.innerHTML = `<span>${index + 1}</span>`;
    el.setAttribute("aria-label", stop.name);
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      focusStop(index);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([stop.lng, stop.lat])
      .addTo(map);
    markers.push(marker);
  });
}

function padding() {
  const narrow = window.innerWidth <= 820;
  if (narrow) return { top: 150, bottom: 280, left: 24, right: 24 };
  return { top: 70, bottom: 70, left: 450, right: detailEl.hidden ? 60 : 400 };
}

function frameRoute(route) {
  const bounds = route.path.reduce(
    (box, coord) => box.extend(coord),
    new maplibregl.LngLatBounds(route.path[0], route.path[0])
  );
  map.fitBounds(bounds, {
    padding: padding(),
    pitch: 58,
    bearing: HOME.bearing,
    duration: 1100,
    maxZoom: 15.4
  });
}

function openDetail(route, index) {
  const stop = route.stops[index];
  detailEl.hidden = false;
  document.getElementById("detail-kicker").textContent = `${route.name} · 第 ${index + 1} 站`;
  document.getElementById("detail-name").textContent = stop.name;
  document.getElementById("detail-text").textContent = stop.text;
  document.getElementById("detail-meta").textContent = formatCoord(stop) + " · 只收錄已核對的公開記述";
}

function focusStop(index) {
  if (!activeRoute) return;
  activeStop = index;
  openDetail(activeRoute, index);
  renderList();
  addMarkers(activeRoute);
  const stop = activeRoute.stops[index];
  map.flyTo({
    center: [stop.lng, stop.lat],
    zoom: 16.4,
    pitch: 66,
    bearing: -24,
    offset: window.innerWidth > 820 ? [40, 0] : [0, 40],
    duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1300,
    essential: true
  });
}

function selectRoute(id, stopIndex) {
  const route = ROUTES.find((item) => item.id === id);
  if (!route || !styleReady) return;
  const changed = !activeRoute || activeRoute.id !== route.id;
  activeRoute = route;
  if (typeof stopIndex === "number") {
    activeStop = stopIndex;
    openDetail(route, stopIndex);
  } else if (changed) {
    activeStop = -1;
    detailEl.hidden = true;
  }
  renderList();
  drawRoute(route);
  addMarkers(route);
  if (typeof stopIndex === "number") focusStop(stopIndex);
  else frameRoute(route);
}

function goHome() {
  activeRoute = null;
  activeStop = -1;
  detailEl.hidden = true;
  clearMarkers();
  if (map.getSource("route")) {
    map.getSource("route").setData({ type: "FeatureCollection", features: [] });
  }
  renderList();
  map.flyTo({ ...HOME, duration: 1000, essential: true });
}

function enableTerrain() {
  try {
    if (!map.getSource("terrain-dem")) {
      map.addSource("terrain-dem", {
        type: "raster-dem",
        tiles: [TERRAIN_TILES],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15
      });
    }
    map.setTerrain({ source: "terrain-dem", exaggeration: 1.85 });
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
    document.getElementById("map-note").textContent = "已開啟地形與傾斜鏡頭；建築立體見於較大比例";
  } catch (error) {
    document.getElementById("map-note").textContent = "地形圖磚未能載入，仍以傾斜鏡頭觀看長洲";
  }
}

function boot(index) {
  styleIndex = index;
  styleReady = false;
  const entry = STYLES[index];
  map = new maplibregl.Map({
    container: "map",
    style: entry.url,
    center: HOME.center,
    zoom: HOME.zoom,
    pitch: HOME.pitch,
    bearing: HOME.bearing,
    maxPitch: 72,
    minZoom: 13,
    maxBounds: [[113.99, 22.175], [114.065, 22.238]],
    attributionControl: true,
    localIdeographFontFamily: "'Noto Sans TC', 'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif",
    // 代理模式下的保險：即使樣式內有漏改的網址，也轉到本機代理。
    transformRequest: entry.proxied ? (url) => ({ url: toProxy(url) }) : undefined
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

  let failedOver = false;
  const failOver = (reason) => {
    if (styleReady || failedOver) return;
    failedOver = true;
    clearTimeout(timer);
    console.warn("[長洲立體步道] 樣式失敗：" + entry.label + "（" + reason + "）");
    map.remove();
    if (styleIndex < STYLES.length - 1) {
      showStatus("地圖樣式未能載入，改用備用底圖……");
      boot(styleIndex + 1);
    } else {
      showStatus("所有地圖樣式都未能載入。請確認網絡，或在資料夾執行 python3 serve.py 後開啟 http://127.0.0.1:8765/。");
    }
  };
  const timer = setTimeout(() => failOver("逾時 " + STYLE_TIMEOUT_MS / 1000 + " 秒"), STYLE_TIMEOUT_MS);

  map.on("error", (event) => {
    if (event && (event.sourceId || event.tile)) return; // 單一圖磚失敗不換樣式
    const message = String(event && event.error ? event.error.message : event);
    // 樣式未載入前的任何錯誤（連線被斷、404、樣式解析失敗）都轉用下一個樣式。
    if (!styleReady && !map.isStyleLoaded()) failOver(message);
  });

  map.on("load", () => {
    styleReady = true;
    clearTimeout(timer);
    showStatus("");
    enableTerrain();
    if (proxyMode && entry.proxied) {
      document.getElementById("map-note").textContent += " · 經本機代理載入圖磚";
    }
    selectRoute(ROUTES[0].id);
  });
}

document.getElementById("detail-close").addEventListener("click", () => {
  detailEl.hidden = true;
  activeStop = -1;
  renderList();
  if (activeRoute) addMarkers(activeRoute);
});

document.getElementById("reset-view").addEventListener("click", goHome);
window.addEventListener("resize", () => map && map.resize());

renderList();

if (typeof maplibregl === "undefined") {
  showStatus("地圖程式庫未能載入。請確認可以連接網絡後重新開啟。");
} else {
  detectProxy().then((ok) => {
    proxyMode = ok;
    if (ok) {
      // 先走本機代理，最後才嘗試直連。
      STYLES = DIRECT_STYLES.map((s) => ({ url: toProxy(s.url), label: s.label + "（本機代理）", proxied: true }))
        .concat(DIRECT_STYLES);
      TERRAIN_TILES = toProxy(DIRECT_TERRAIN);
    }
    window.__ccw = { proxyMode, styles: STYLES.map((s) => s.url), terrain: TERRAIN_TILES };
    boot(0);
  });
}

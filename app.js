/* 長洲立體步道
   站點座標取自公開地圖與維基條目，屬約數，路線是站與站的步行示意，不是官方步道軌跡。
   記述只採用已核對的公開資料；未能核對的年份與故事不寫。 */

const HOME = {
  center: [114.029, 22.208],
  zoom: 14.7,
  pitch: 62,
  bearing: -32,
  mobileZoom: 13.9,
  mobilePitch: 52
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
  },
  {
    "id": "stfrancis",
    "theme": "郊野學園 · 到訪路線",
    "name": "往聖方濟校園",
    "area": "碼頭至芝麻坑路",
    "duration": "約 20–25 分鐘（約 1.4 公里）",
    "color": "#4fa3c7",
    "blurb": "跟隨明愛陳震夏郊野學園的到訪路線圖，由碼頭經東灣、黑排路與明暉路，走到芝麻坑路的聖方濟校園。路徑按開放街圖的道路繪畫。",
    "credit": "相片及路線來源：明愛陳震夏郊野學園路線圖（Route to St. Francis Campus）",
    "stops": [
      {
        "name": "長洲渡輪碼頭",
        "lng": 114.02834,
        "lat": 22.2086,
        "text": "背向渡輪碼頭向右行入中央廣場。",
        "en": "Back to the ferry pier, turn right, then turn into the Centrium."
      },
      {
        "name": "東灣路",
        "lng": 114.02943,
        "lat": 22.2086,
        "text": "沿東灣路往海灘方向行。",
        "en": "Walk along Tung Wan Road towards the beach."
      },
      {
        "name": "東灣海灘（長洲東堤路口）",
        "lng": 114.03094,
        "lat": 22.209,
        "text": "沿海灘往東行。",
        "en": "Walk eastwards along the beach."
      },
      {
        "name": "直升機坪・黑排路",
        "lng": 114.03339,
        "lat": 22.20782,
        "text": "經過直升機坪轉入黑排路。",
        "en": "Walk pass Helicopter Pad, turn into Hak Pai Road."
      },
      {
        "name": "觀音灣泳灘更衣室",
        "lng": 114.03408,
        "lat": 22.20721,
        "text": "經過觀音灣泳灘更衣室，在分岔路轉入斜路。",
        "en": "Go pass shower facilities, turn right and go uphill.",
        "photo": {
          "src": "images/st-francis/05-kwun-yam-beach-showers.jpg",
          "alt": "觀音灣泳灘更衣室旁的路，左邊是沙灘與枱櫈",
          "w": 660,
          "h": 436
        },
        "credit": "相片及路線來源：明愛陳震夏郊野學園路線圖（Route to St. Francis Campus）"
      },
      {
        "name": "觀音灣變電站・明暉路口",
        "lng": 114.03472,
        "lat": 22.20623,
        "text": "在觀音灣變電站轉左，在十字路口轉入明暉路。",
        "en": "Facing Kwun Yam Wan Substation, turn left to crossroad. Head to Ming Fai Road and walk uphill.",
        "photo": {
          "src": "images/st-francis/06-substation-ming-fai-road.jpg",
          "alt": "明暉路口一帶的上坡路，左邊有綠瓦紅柱的建築",
          "w": 623,
          "h": 351
        },
        "credit": "相片及路線來源：明愛陳震夏郊野學園路線圖（Route to St. Francis Campus）"
      },
      {
        "name": "明暉路垃圾站",
        "lng": 114.03629,
        "lat": 22.20597,
        "text": "沿明暉路直行，經過垃圾站。",
        "en": "Walk along Ming Fai Road, pass the Refuse Collection Point.",
        "approx": true
      },
      {
        "name": "芝麻坑路分岔口",
        "lng": 114.03725,
        "lat": 22.20564,
        "text": "在分岔路口沿紅色磚路一直行。",
        "en": "At the junction, follow the brick pavement to our Campus.",
        "photo": {
          "src": "images/st-francis/08-brick-pavement-junction.jpg",
          "alt": "分岔路口，前方是通往校園的紅色磚路",
          "w": 535,
          "h": 301
        },
        "credit": "相片及路線來源：明愛陳震夏郊野學園路線圖（Route to St. Francis Campus）"
      },
      {
        "name": "聖方濟校園",
        "lng": 114.03746,
        "lat": 22.20748,
        "text": "明愛陳震夏郊野學園聖方濟校園，即本路線終點。地址：香港長洲芝麻坑路三十九號。電話：2981 1899。",
        "en": "Caritas Chan Chun Ha Field Studies Centre, St. Francis Campus. 39 Chi Ma Hang Road, Cheung Chau, N.T., H.K. Tel: 2981 1899.",
        "photo": {
          "src": "images/st-francis/09-campus.jpg",
          "alt": "聖方濟校園建築（取自路線圖上的小圖）",
          "w": 366,
          "h": 140,
          "note": "取自路線圖上的小圖，解像度較低"
        },
        "credit": "相片及路線來源：明愛陳震夏郊野學園路線圖（Route to St. Francis Campus）"
      }
    ],
    "path": [
      [
        114.028382,
        22.208606
      ],
      [
        114.028387,
        22.208576
      ],
      [
        114.028727,
        22.208622
      ],
      [
        114.028749,
        22.208388
      ],
      [
        114.02903,
        22.208424
      ],
      [
        114.029031,
        22.208398
      ],
      [
        114.029186,
        22.208414
      ],
      [
        114.029456,
        22.208444
      ],
      [
        114.029449,
        22.208537
      ],
      [
        114.029432,
        22.208602
      ],
      [
        114.02943,
        22.208602
      ],
      [
        114.029432,
        22.208602
      ],
      [
        114.029662,
        22.208606
      ],
      [
        114.029788,
        22.208619
      ],
      [
        114.029898,
        22.20865
      ],
      [
        114.030154,
        22.20871
      ],
      [
        114.030223,
        22.208727
      ],
      [
        114.030513,
        22.208835
      ],
      [
        114.030722,
        22.208909
      ],
      [
        114.03082,
        22.208911
      ],
      [
        114.030936,
        22.209004
      ],
      [
        114.03094,
        22.209
      ],
      [
        114.031268,
        22.20865
      ],
      [
        114.031428,
        22.208486
      ],
      [
        114.031819,
        22.208185
      ],
      [
        114.032196,
        22.207918
      ],
      [
        114.032335,
        22.207951
      ],
      [
        114.032381,
        22.207933
      ],
      [
        114.032563,
        22.207923
      ],
      [
        114.032655,
        22.207914
      ],
      [
        114.032765,
        22.207847
      ],
      [
        114.03283,
        22.207836
      ],
      [
        114.032902,
        22.207825
      ],
      [
        114.033029,
        22.207853
      ],
      [
        114.03307,
        22.207887
      ],
      [
        114.033129,
        22.207887
      ],
      [
        114.033185,
        22.207856
      ],
      [
        114.033314,
        22.207867
      ],
      [
        114.033389,
        22.207818
      ],
      [
        114.03342,
        22.207784
      ],
      [
        114.033397,
        22.20774
      ],
      [
        114.033372,
        22.207721
      ],
      [
        114.033362,
        22.207688
      ],
      [
        114.03336,
        22.207626
      ],
      [
        114.033373,
        22.207568
      ],
      [
        114.033417,
        22.207496
      ],
      [
        114.033518,
        22.207388
      ],
      [
        114.033585,
        22.207346
      ],
      [
        114.03366,
        22.207317
      ],
      [
        114.033779,
        22.207328
      ],
      [
        114.033809,
        22.207337
      ],
      [
        114.033941,
        22.207275
      ],
      [
        114.03408,
        22.207213
      ],
      [
        114.034082,
        22.207212
      ],
      [
        114.034127,
        22.207175
      ],
      [
        114.034224,
        22.207107
      ],
      [
        114.034427,
        22.207024
      ],
      [
        114.034422,
        22.206927
      ],
      [
        114.034419,
        22.206846
      ],
      [
        114.034442,
        22.206769
      ],
      [
        114.034522,
        22.206713
      ],
      [
        114.034589,
        22.206675
      ],
      [
        114.034609,
        22.206626
      ],
      [
        114.034559,
        22.206529
      ],
      [
        114.034497,
        22.206408
      ],
      [
        114.034491,
        22.206336
      ],
      [
        114.034537,
        22.206289
      ],
      [
        114.034599,
        22.206254
      ],
      [
        114.034663,
        22.206226
      ],
      [
        114.034673,
        22.206227
      ],
      [
        114.03472,
        22.206232
      ],
      [
        114.034725,
        22.206232
      ],
      [
        114.034816,
        22.206242
      ],
      [
        114.034937,
        22.206243
      ],
      [
        114.03496,
        22.206214
      ],
      [
        114.035064,
        22.205995
      ],
      [
        114.035122,
        22.205961
      ],
      [
        114.035149,
        22.205945
      ],
      [
        114.03529,
        22.205949
      ],
      [
        114.035489,
        22.205954
      ],
      [
        114.035508,
        22.205959
      ],
      [
        114.035836,
        22.20604
      ],
      [
        114.035866,
        22.206038
      ],
      [
        114.036086,
        22.206021
      ],
      [
        114.036106,
        22.206016
      ],
      [
        114.036289,
        22.205974
      ],
      [
        114.036291,
        22.205973
      ],
      [
        114.03663,
        22.205888
      ],
      [
        114.036651,
        22.205873
      ],
      [
        114.036973,
        22.205658
      ],
      [
        114.03725,
        22.205643
      ],
      [
        114.037546,
        22.206041
      ],
      [
        114.037609,
        22.206137
      ],
      [
        114.037671,
        22.206246
      ],
      [
        114.037815,
        22.206437
      ],
      [
        114.037828,
        22.206515
      ],
      [
        114.037834,
        22.206596
      ],
      [
        114.037753,
        22.206907
      ],
      [
        114.037732,
        22.206998
      ],
      [
        114.037705,
        22.207115
      ],
      [
        114.037595,
        22.207299
      ],
      [
        114.03746,
        22.20748
      ]
    ]
  }
];

const routesEl = document.getElementById("routes");
const detailEl = document.getElementById("detail");
const statusEl = document.getElementById("status");
const appEl = document.getElementById("app");
const sheetEl = document.getElementById("stack");
const sheetBody = document.getElementById("sheet-body");
const chipsEl = document.getElementById("chips");
const mstopsEl = document.getElementById("mstops");
const handleEl = document.getElementById("sheet-handle");
const mastEl = document.getElementById("mast");
const closeBtn = document.getElementById("detail-close");

/* 與 styles.css 的手機斷點一致 */
const MOBILE_MQ = window.matchMedia("(max-width: 820px), (max-height: 520px) and (orientation: landscape) and (max-width: 1024px)");
const LANDSCAPE_MQ = window.matchMedia("(max-height: 520px) and (orientation: landscape) and (max-width: 1024px)");
const isMobile = () => MOBILE_MQ.matches;
const isLandscapeMobile = () => LANDSCAPE_MQ.matches;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let navControl = null;
let attribControl = null;
let sheetState = "collapsed";

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
      <p class="route-blurb">${route.blurb}</p>${route.credit ? `<p class="route-credit">${route.credit}</p>` : ""}
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
      const thumb = stop.photo ? `<img class="stop-thumb" src="${stop.photo.src}" alt="" loading="lazy" />` : "";
      stopButton.className += stop.photo ? " has-photo" : "";
      stopButton.innerHTML = `<span class="stop-no" style="background:${route.color}">${index + 1}</span><span class="stop-name">${stop.name}</span>${thumb}`;
      stopButton.addEventListener("click", () => selectRoute(route.id, index));
      item.appendChild(stopButton);
      list.appendChild(item);
    });
    card.appendChild(list);
    routesEl.appendChild(card);
  });

  renderMobile();

  const note = document.createElement("p");
  note.className = "fine";
  note.textContent = "站點座標為約數。北社山海、東岸石徑、西灣尋洞的連線只表示步行順序；往聖方濟校園一線按開放街圖道路繪畫。兩者都不是官方步道軌跡。船期、泳灘與古蹟通道請以現場及主管部門最新公布為準。";
  routesEl.appendChild(note);
}


const FINE_NOTE = "站點座標為約數。北社山海、東岸石徑、西灣尋洞的連線只表示步行順序；往聖方濟校園一線按開放街圖道路繪畫。兩者都不是官方步道軌跡。船期、泳灘與古蹟通道請以現場及主管部門最新公布為準。";

/* 手機：橫向路線膠囊 + 目前路線的站點列表 */
function renderMobile() {
  document.getElementById("mast-route").textContent = activeRoute
    ? `${activeRoute.name} · ${activeRoute.stops.length} 站 · ${activeRoute.duration.replace(/（.*）/, "")}`
    : "選一條路線開始";

  chipsEl.innerHTML = "";
  ROUTES.forEach((route) => {
    const chip = document.createElement("button");
    chip.type = "button";
    const on = activeRoute && activeRoute.id === route.id;
    chip.className = "chip" + (on ? " active" : "");
    chip.setAttribute("aria-pressed", on ? "true" : "false");
    chip.style.setProperty("--chip", route.color);
    chip.innerHTML = `<span class="chip-dot" style="background:${route.color}"></span><span class="chip-name">${route.name}</span><span class="chip-facts">${route.duration.replace(/（.*）/, "")} · ${route.stops.length} 站</span>`;
    chip.addEventListener("click", () => {
      // 先展開抽屜，再按新的抽屜高度框住整條路線
      if (sheetState === "collapsed") setSheet("half", { recenter: false });
      selectRoute(route.id);
    });
    chipsEl.appendChild(chip);
  });

  mstopsEl.innerHTML = "";
  if (!activeRoute) return;
  const route = activeRoute;
  const blurb = document.createElement("p");
  blurb.className = "route-blurb";
  blurb.textContent = route.blurb;
  mstopsEl.appendChild(blurb);
  if (route.credit) {
    const credit = document.createElement("p");
    credit.className = "route-credit";
    credit.textContent = route.credit;
    mstopsEl.appendChild(credit);
  }
  const list = document.createElement("ol");
  route.stops.forEach((stop, index) => {
    const item = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "stop-btn" + (activeStop === index ? " active" : "") + (stop.photo ? " has-photo" : "");
    const thumb = stop.photo ? `<img class="stop-thumb" src="${stop.photo.src}" alt="" loading="lazy" />` : "";
    b.innerHTML = `<span class="stop-no" style="background:${route.color}">${index + 1}</span><span class="stop-name">${stop.name}</span>${thumb}`;
    b.addEventListener("click", () => selectRoute(route.id, index));
    item.appendChild(b);
    list.appendChild(item);
  });
  mstopsEl.appendChild(list);
  const fine = document.createElement("p");
  fine.className = "fine";
  fine.textContent = FINE_NOTE;
  mstopsEl.appendChild(fine);
}

/* ---------- 底部抽屜 ---------- */
function sheetHeights() {
  const vh = window.innerHeight;
  const handle = handleEl.offsetHeight || 24;
  const collapsed = Math.round(handle + mastEl.offsetHeight + 2);
  const landscape = isLandscapeMobile();
  return {
    collapsed,
    half: Math.max(collapsed + 120, Math.round(vh * (landscape ? 0.62 : 0.45))),
    full: Math.round(vh - (landscape ? 8 : Math.max(56, vh * 0.1)))
  };
}

function setSheet(state, opts = {}) {
  if (!isMobile()) return;
  sheetState = state;
  const h = sheetHeights()[state];
  sheetEl.style.setProperty("--sheet-h", h + "px");
  sheetEl.dataset.sheet = state;
  handleEl.setAttribute("aria-expanded", state === "collapsed" ? "false" : "true");
  if (state === "collapsed") sheetBody.scrollTop = 0;
  if (opts.recenter !== false) recenterForSheet(h);
}

/* 抽屜高度改變後，讓目前站點或路線留在可見的地圖範圍中央 */
function recenterForSheet(h) {
  if (!map || !styleReady) return;
  const pad = mobilePadding(h);
  if (activeRoute && activeStop >= 0) {
    const s = activeRoute.stops[activeStop];
    map.easeTo({ center: [s.lng, s.lat], padding: pad, duration: reducedMotion() ? 0 : 450 });
  } else {
    map.easeTo({ padding: pad, duration: reducedMotion() ? 0 : 450 });
  }
}

function mobilePadding(sheetH) {
  const h = typeof sheetH === "number" ? sheetH : sheetHeights()[sheetState];
  const w = window.innerWidth;
  if (isLandscapeMobile()) {
    const expanded = sheetState !== "collapsed";
    const sw = sheetEl.getBoundingClientRect().width || Math.min(420, w * 0.52);
    return { top: 16, bottom: expanded ? 16 : h + 12, left: expanded ? sw + 16 : 16, right: 64 };
  }
  return { top: 64, bottom: h + 16, left: 16, right: 56 };
}

function initSheetDrag() {
  let startY = 0, startH = 0, lastY = 0, lastT = 0, vel = 0, moved = false, active = false;
  const begin = (e) => {
    if (!isMobile()) return;
    if (e.target.closest && e.target.closest("button:not(#sheet-handle)")) return;
    active = true; moved = false;
    startY = lastY = e.clientY; lastT = performance.now(); vel = 0;
    startH = sheetEl.getBoundingClientRect().height;
    sheetEl.classList.add("dragging");
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!active) return;
    const dy = e.clientY - startY;
    if (Math.abs(dy) > 6) moved = true;
    const now = performance.now();
    vel = (e.clientY - lastY) / Math.max(1, now - lastT); // px/ms，正值 = 往下
    lastY = e.clientY; lastT = now;
    const hs = sheetHeights();
    const h = Math.min(hs.full, Math.max(hs.collapsed, startH - dy));
    sheetEl.style.setProperty("--sheet-h", h + "px");
  };
  const end = () => {
    if (!active) return;
    active = false;
    sheetEl.classList.remove("dragging");
    const order = ["collapsed", "half", "full"];
    if (!moved) {
      // 輕按：收起 ↔ 半開；全開時回到半開
      setSheet(sheetState === "collapsed" ? "half" : sheetState === "full" ? "half" : "collapsed");
      return;
    }
    const h = sheetEl.getBoundingClientRect().height;
    const hs = sheetHeights();
    let target;
    if (vel < -0.5) target = order[Math.min(2, order.indexOf(nearest(h, hs)) + 1)];
    else if (vel > 0.5) target = order[Math.max(0, order.indexOf(nearest(h, hs)) - 1)];
    else target = nearest(h, hs);
    if (sheetEl.dataset.view === "detail" && target === "full") target = "half";
    setSheet(target);
  };
  const nearest = (h, hs) => Object.keys(hs).reduce((a, b) => (Math.abs(hs[b] - h) < Math.abs(hs[a] - h) ? b : a));
  [handleEl, mastEl].forEach((el) => {
    el.addEventListener("pointerdown", begin);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });
}

/* 手機 / 桌面切換：移動資料卡位置、重新放置地圖控制 */
function applyMode() {
  const mobile = isMobile();
  if (mobile && detailEl.parentElement !== sheetBody) sheetBody.appendChild(detailEl);
  if (!mobile && detailEl.parentElement !== appEl) appEl.insertBefore(detailEl, document.querySelector(".map-tools"));
  closeBtn.textContent = mobile ? "‹ 站點列表" : "關閉";
  closeBtn.setAttribute("aria-label", mobile ? "返回站點列表" : "關閉站點資料");
  sheetEl.dataset.view = !detailEl.hidden ? "detail" : "list";
  if (mobile) {
    setSheet(sheetState, { recenter: false });
  } else {
    sheetEl.style.removeProperty("--sheet-h");
  }
  placeControls();
}

function placeControls() {
  if (!map) return;
  const mobile = isMobile();
  if (navControl) map.removeControl(navControl);
  if (attribControl) map.removeControl(attribControl);
  navControl = new maplibregl.NavigationControl({ visualizePitch: true });
  // 與 MapLibre 預設版權控制相同的設定，桌面外觀不變
  attribControl = new maplibregl.AttributionControl({
    compact: true,
    customAttribution: '<a href="https://maplibre.org/" target="_blank">MapLibre</a>'
  });
  // bottom-* 角落會把新控制插到最前，所以桌面先加版權、後加導航（與原本一致：導航在上）
  if (mobile) {
    map.addControl(navControl, "top-right");
    map.addControl(attribControl, "top-right");
    // 手機上版權說明預設收起成 (i)，按一下展開，避免遮住地圖
    const collapseAttrib = () => {
      const c = attribControl && attribControl._container;
      if (c) { c.classList.remove("maplibregl-compact-show"); c.removeAttribute("open"); }
    };
    collapseAttrib();
    map.once("idle", collapseAttrib);
  } else {
    map.addControl(attribControl, "bottom-right");
    map.addControl(navControl, "bottom-right");
  }
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
    el.className = "pin-wrap" + (index === activeStop ? " active" : "");
    el.style.setProperty("--pin", route.color);
    // MapLibre 會改寫外層的 transform，所以旋轉只放在內層
    el.innerHTML = `<span class="pin"><span>${index + 1}</span></span>`;
    el.setAttribute("aria-label", stop.name);
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      focusStop(index);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom", opacity: "1", opacityWhenCovered: "0.9" })
      .setLngLat([stop.lng, stop.lat])
      .addTo(map);
    markers.push(marker);
  });
}

function padding() {
  if (isMobile()) return mobilePadding();
  return { top: 70, bottom: 70, left: 450, right: detailEl.hidden ? 60 : 400 };
}

function frameRoute(route) {
  const bounds = route.path.reduce(
    (box, coord) => box.extend(coord),
    new maplibregl.LngLatBounds(route.path[0], route.path[0])
  );
  map.fitBounds(bounds, {
    padding: padding(),
    pitch: isMobile() ? 52 : 58,
    bearing: HOME.bearing,
    duration: reducedMotion() ? 0 : 1100,
    maxZoom: 15.4
  });
}

function openDetail(route, index) {
  const stop = route.stops[index];
  detailEl.hidden = false;
  sheetEl.dataset.view = "detail";
  if (isMobile()) {
    sheetBody.scrollTop = 0;
    if (sheetState !== "half") setSheet("half", { recenter: false });
  }
  document.getElementById("detail-kicker").textContent = `${route.name} · 第 ${index + 1} 站`;
  document.getElementById("detail-name").textContent = stop.name;
  document.getElementById("detail-text").textContent = stop.text;

  const en = document.getElementById("detail-en");
  en.hidden = !stop.en;
  en.textContent = stop.en || "";

  // 任何站點都可帶一張相片：photo: { src, alt, w, h, note }，credit 為出處
  const figure = document.getElementById("detail-photo");
  const img = document.getElementById("detail-img");
  figure.classList.remove("expanded");
  if (stop.photo) {
    img.src = stop.photo.src;
    img.alt = stop.photo.alt || stop.name;
    if (stop.photo.w && stop.photo.h) {
      img.width = stop.photo.w;
      img.height = stop.photo.h;
    }
    const parts = [stop.photo.note, stop.credit || route.credit].filter(Boolean);
    document.getElementById("detail-caption").textContent = parts.join(" · ");
    figure.hidden = false;
  } else {
    img.removeAttribute("src");
    figure.hidden = true;
  }

  const source = route.credit
    ? (stop.approx ? "位置按路線圖估計，屬約數" : "座標取自開放街圖，屬約數") + " · 指示文字取自路線圖"
    : "只收錄已核對的公開記述";
  document.getElementById("detail-meta").textContent = formatCoord(stop) + " · " + source;
}

function focusStop(index) {
  if (!activeRoute) return;
  activeStop = index;
  openDetail(activeRoute, index);
  renderList();
  addMarkers(activeRoute);
  const stop = activeRoute.stops[index];
  const mobile = isMobile();
  const camera = {
    center: [stop.lng, stop.lat],
    zoom: mobile ? 16.1 : 16.4,
    pitch: mobile ? 56 : 66,
    bearing: -24,
    duration: reducedMotion() ? 0 : 1300,
    essential: true
  };
  // 手機：以抽屜高度作 padding，讓標記落在可見地圖的中央
  if (mobile) camera.padding = mobilePadding(sheetHeights().half);
  else camera.offset = [40, 0];
  map.flyTo(camera);
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
    sheetEl.dataset.view = "list";
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
  sheetEl.dataset.view = "list";
  const home = isMobile() ? { ...HOME, zoom: HOME.mobileZoom, pitch: HOME.mobilePitch, padding: mobilePadding() } : HOME;
  map.flyTo({ ...home, duration: reducedMotion() ? 0 : 1000, essential: true });
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
    map.setTerrain({ source: "terrain-dem", exaggeration: isMobile() ? 1.45 : 1.85 });
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
  const mobile = isMobile();
  map = new maplibregl.Map({
    container: "map",
    style: entry.url,
    center: HOME.center,
    zoom: mobile ? HOME.mobileZoom : HOME.zoom,
    pitch: mobile ? HOME.mobilePitch : HOME.pitch,
    bearing: HOME.bearing,
    maxPitch: mobile ? 65 : 72,
    // 手機：限制像素比，減輕 GPU 負擔
    pixelRatio: mobile ? Math.min(window.devicePixelRatio || 1, 2) : undefined,
    minZoom: 13,
    maxBounds: [[113.99, 22.175], [114.065, 22.238]],
    attributionControl: false,
    localIdeographFontFamily: "'Noto Sans TC', 'PingFang TC', 'Noto Sans CJK TC', 'Microsoft JhengHei', sans-serif",
    // 代理模式下的保險：即使樣式內有漏改的網址，也轉到本機代理。
    transformRequest: entry.proxied ? (url) => ({ url: toProxy(url) }) : undefined
  });
  navControl = null;
  attribControl = null;
  placeControls();

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

document.getElementById("detail-photo").addEventListener("click", (e) => {
  if (!isMobile()) return;
  e.currentTarget.classList.toggle("expanded");
});

closeBtn.addEventListener("click", () => {
  detailEl.hidden = true;
  sheetEl.dataset.view = "list";
  activeStop = -1;
  renderList();
  if (activeRoute) addMarkers(activeRoute);
});

document.getElementById("reset-view").addEventListener("click", goHome);
window.addEventListener("resize", () => {
  if (map) map.resize();
  if (isMobile()) setSheet(sheetState, { recenter: false });
});
MOBILE_MQ.addEventListener("change", applyMode);
LANDSCAPE_MQ.addEventListener("change", applyMode);

renderList();
initSheetDrag();
applyMode();

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

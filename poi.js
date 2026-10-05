/* 服務設施：公廁（紫）、食店（藍）（取自 OpenFreeMap 向量圖磚內的開放街圖 POI），可各自顯示／隱藏 */
const KINDS = {
  toilets: {
    label: "公廁", color: "#7b4fd6",
    filter: ["any", ["==", ["get", "class"], "toilets"], ["==", ["get", "subclass"], "toilets"]]
  },
  food: {
    label: "食店", color: "#2b7de9",
    filter: ["in", ["get", "subclass"], ["literal", ["restaurant", "cafe", "fast_food", "food_court", "ice_cream", "bakery"]]]
  }
};
const state = { toilets: false, food: false };
const bound = new WeakSet();

function ensure(map, key) {
  const k = KINDS[key];
  const id = "svc-" + key;
  if (!map.getSource("openmaptiles")) return;
  if (!map.getLayer(id)) {
    map.addLayer({
      id, type: "circle", source: "openmaptiles", "source-layer": "poi", minzoom: 14, filter: k.filter,
      paint: {
        "circle-color": k.color,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 4, 17, 8],
        "circle-stroke-color": "#fff", "circle-stroke-width": 2
      }
    });
    map.addLayer({
      id: id + "-label", type: "symbol", source: "openmaptiles", "source-layer": "poi", minzoom: 16.5, filter: k.filter,
      layout: {
        "text-field": ["coalesce", ["get", "name:zh-Hant"], ["get", "name:zh"], ["get", "name"], k.label],
        "text-font": ["Noto Sans Regular"], "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top",
        "text-optional": true
      },
      paint: { "text-color": k.color, "text-halo-color": "#fff", "text-halo-width": 1.4 }
    });
  }
  const vis = state[key] ? "visible" : "none";
  map.setLayoutProperty(id, "visibility", vis);
  map.setLayoutProperty(id + "-label", "visibility", vis);
  if (!bound.has(map)) {
    bound.add(map);
    const ids = Object.keys(KINDS).map((x) => "svc-" + x);
    map.on("click", (e) => {
      const live = ids.filter((x) => map.getLayer(x));
      if (!live.length) return;
      const f = map.queryRenderedFeatures([[e.point.x - 8, e.point.y - 8], [e.point.x + 8, e.point.y + 8]], { layers: live })[0];
      if (!f) return;
      const key = f.layer.id.replace("svc-", "");
      const p = f.properties || {};
      const name = p["name:zh-Hant"] || p["name:zh"] || p.name || KINDS[key].label;
      const el = document.createElement("div");
      el.className = "svc-pop";
      el.textContent = (name === KINDS[key].label ? "" : KINDS[key].label + "：") + name;
      new maplibregl.Popup({ closeButton: false, offset: 10 }).setLngLat(f.geometry.coordinates).setDOMContent(el).addTo(map);
    });
  }
}

/* 每次地圖或底圖重新載入後呼叫 */
export function applyServices(map) {
  if (!map) return;
  try { Object.keys(KINDS).forEach((k) => ensure(map, k)); } catch (e) { /* 樣式未就緒 */ }
}

export function initServices({ getMap, buttons }) {
  Object.entries(buttons).forEach(([key, btn]) => {
    btn.style.setProperty("--svc", KINDS[key].color);
    btn.addEventListener("click", () => {
      state[key] = !state[key];
      btn.setAttribute("aria-pressed", String(state[key]));
      applyServices(getMap());
    });
  });
}

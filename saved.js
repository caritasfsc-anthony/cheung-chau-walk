/* 用家收藏地點：存於本機瀏覽器（localStorage），唔使登入 */
import { esc } from "./map-core.js";

const KEY = "ccw-saved-places-v1";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* 空間不足 */ } };

export function initSaved({ getMap, button, panel }) {
  let list = load();
  let open = false;
  let adding = false;
  let markers = [];
  let boundMap = null;

  function drawMarkers() {
    markers.forEach((m) => m.remove());
    markers = [];
    const map = getMap();
    if (!map) return;
    list.forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "saved-pin";
      el.textContent = "★";
      el.title = p.name;
      el.setAttribute("aria-label", "收藏：" + p.name);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        new maplibregl.Popup({ closeButton: false, offset: 14 }).setLngLat([p.lng, p.lat])
          .setHTML(`<div class="svc-pop">★ ${esc(p.name)}</div>`).addTo(map);
      });
      markers.push(new maplibregl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map));
    });
  }

  function render() {
    button.setAttribute("aria-pressed", String(open));
    panel.hidden = !open;
    if (!open) return;
    panel.innerHTML =
      `<p class="saved-head">我的收藏（只存喺呢部機）</p>` +
      `<button type="button" class="saved-add" data-act="add">${adding ? "撳地圖揀位置…（撳呢度取消）" : "＋ 加地點（之後撳地圖）"}</button>` +
      (list.length
        ? list.map((p, i) => `<div class="saved-row"><button type="button" class="saved-go" data-act="go" data-i="${i}">★ ${esc(p.name)}</button><button type="button" class="saved-del" data-act="del" data-i="${i}" aria-label="刪除 ${esc(p.name)}">✕</button></div>`).join("")
        : `<p class="saved-empty">未有收藏</p>`);
  }

  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const map = getMap();
    const i = Number(b.dataset.i);
    if (b.dataset.act === "add") { adding = !adding; setCursor(); render(); }
    else if (b.dataset.act === "go" && map && list[i]) {
      map.flyTo({ center: [list[i].lng, list[i].lat], zoom: Math.max(map.getZoom(), 17), duration: 1100 });
    } else if (b.dataset.act === "del" && list[i]) {
      if (!confirm(`刪除收藏「${list[i].name}」？`)) return;
      list.splice(i, 1); save(list); drawMarkers(); render();
    }
  });

  function setCursor() {
    const map = getMap();
    if (map) map.getCanvas().style.cursor = adding ? "crosshair" : "";
  }

  function bind() {
    const map = getMap();
    if (!map || map === boundMap) return;
    boundMap = map;
    map.on("click", (e) => {
      if (!adding) return;
      adding = false;
      setCursor();
      const name = (prompt("幫呢個地方改個名：", "我的地點 " + (list.length + 1)) || "").trim();
      if (name) {
        list.push({ name: name.slice(0, 40), lat: +e.lngLat.lat.toFixed(6), lng: +e.lngLat.lng.toFixed(6), t: Date.now() });
        save(list);
        drawMarkers();
      }
      render();
    });
    drawMarkers();
  }

  button.addEventListener("click", () => { bind(); open = !open; if (!open) { adding = false; setCursor(); } render(); });
  // 地圖建立後顯示已收藏的星
  const wait = setInterval(() => { if (getMap()) { clearInterval(wait); bind(); } }, 500);
}

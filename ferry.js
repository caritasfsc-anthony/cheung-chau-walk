/* 新渡輪即時班次（官方 ETA API，每分鐘更新）：顯示船隻位置與預計到達時間 */
import { tiles, toProxy, esc } from "./map-core.js";

const API = "https://www.sunferry.com.hk/eta/?route=";
const ROUTES = ["CCCE", "CECC", "IICHCMUW", "IIMUWCHC"];
const REFRESH_MS = 60000;

export function initFerry({ getMap, button, panel }) {
  let timer = null;
  let markers = [];
  let on = false;

  const clearMarkers = () => { markers.forEach((m) => m.remove()); markers = []; };
  const url = (r) => (tiles.proxyMode ? toProxy(API + r) : API + r);
  const shortRoute = (tc) => String(tc || "").replace(/^橫水渡 - \((.*)\)$/, "$1").replace(/\s*-\s*/, "→");

  async function refresh() {
    let rows = [];
    let stamp = "";
    try {
      const all = await Promise.all(ROUTES.map((r) =>
        fetch(url(r), { cache: "no-store" }).then((res) => res.json()).catch(() => null)));
      all.forEach((j) => {
        if (!j) return;
        stamp = j.generated_timestamp || stamp;
        (j.data || []).forEach((d) => rows.push(d));
      });
    } catch (e) { /* 下次再試 */ }
    if (!on) return;
    const map = getMap();
    clearMarkers();
    if (!rows.length) {
      panel.innerHTML = `<p class="ferry-empty">暫時未有新渡輪即時資料</p>`;
      return;
    }
    rows.sort((a, b) => String(a.depart_time).localeCompare(String(b.depart_time)));
    panel.innerHTML = `<p class="ferry-head">新渡輪即時班次${stamp ? ` · ${esc(stamp.slice(11, 16))} 更新` : ""}</p>` +
      rows.map((d) => {
        const eta = d.eta ? `預計 ${esc(String(d.eta).slice(-5))} 到` : (d.rmk_tc ? esc(d.rmk_tc) : "未開出");
        return `<p class="ferry-row"><b>${esc(shortRoute(d.route_tc))}</b> ${esc(d.depart_time)} 開 · ${eta}</p>`;
      }).join("");
    if (!map) return;
    rows.forEach((d) => {
      const lat = parseFloat(d.lat), lng = parseFloat(d.lng);
      if (!isFinite(lat) || !isFinite(lng)) return;
      const el = document.createElement("div");
      el.className = "ferry-pin";
      el.title = `${shortRoute(d.route_tc)} ${d.depart_time} 開`;
      el.innerHTML = `<span class="ferry-icon">⛴</span><span class="ferry-label">${esc(shortRoute(d.route_tc))}${d.eta ? " " + esc(String(d.eta).slice(-5)) : ""}</span>`;
      markers.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map));
    });
  }

  function set(state) {
    on = state;
    button.setAttribute("aria-pressed", String(on));
    button.textContent = "新渡輪";
    panel.hidden = !on;
    clearInterval(timer);
    timer = null;
    if (on) {
      panel.innerHTML = `<p class="ferry-empty">載入中…</p>`;
      refresh();
      timer = setInterval(refresh, REFRESH_MS);
    } else {
      clearMarkers();
    }
  }
  button.addEventListener("click", () => set(!on));
  document.addEventListener("visibilitychange", () => { if (on && !document.hidden) refresh(); });
}

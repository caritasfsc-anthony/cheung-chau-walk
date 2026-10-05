/* 長洲立體步道：老師後台（登入、我的地圖、新增地圖） */
import {
  watchAuth, signInSchool, signOutUser, friendlyDbError, LIMITS,
  listMyMaps, createMapDoc, saveMapDoc, deleteMapAndPhotos, putPhoto,
  newMapId, newPhotoId, newId, pathToFirestore
} from "./firebase-client.js";
import { BUILTIN_SITE } from "./routes-data.js";
import { compressImage } from "./photo-utils.js";

const $ = (id) => document.getElementById(id);
const els = {
  status: $("status"), signInCard: $("signInCard"), signInBtn: $("signInBtn"), authError: $("authError"),
  userBox: $("userBox"), userName: $("userName"), userEmail: $("userEmail"), signOutBtn: $("signOutBtn"),
  area: $("app-area"), newTitle: $("newTitle"), newBlankBtn: $("newBlankBtn"), newTemplateBtn: $("newTemplateBtn"),
  newProgress: $("newProgress"), mapList: $("mapList")
};

let currentUser = null;
let busy = false;

const setStatus = (text) => { els.status.textContent = text || ""; };
const viewUrl = (id) => new URL("index.html?map=" + encodeURIComponent(id), location.href).href;
const editUrl = (id) => "editor.html?map=" + encodeURIComponent(id);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

function fmtTime(ts) {
  if (!ts || !ts.toDate) return "";
  return ts.toDate().toLocaleString("zh-HK", { dateStyle: "medium", timeStyle: "short" });
}

/* ---------- 登入 ---------- */
els.signInBtn.addEventListener("click", async () => {
  els.authError.textContent = "";
  els.signInBtn.disabled = true;
  const msg = await signInSchool();
  els.signInBtn.disabled = false;
  if (msg) els.authError.textContent = msg;
});
els.signOutBtn.addEventListener("click", () => signOutUser());

setStatus("正在檢查登入狀態…");
watchAuth((user, message) => {
  currentUser = user;
  setStatus("");
  if (!user) {
    els.signInCard.hidden = false;
    els.userBox.hidden = true;
    els.area.hidden = true;
    els.mapList.replaceChildren();
    if (message) els.authError.textContent = message;
    return;
  }
  els.authError.textContent = "";
  els.signInCard.hidden = true;
  els.userBox.hidden = false;
  els.area.hidden = false;
  els.userName.textContent = user.displayName || "";
  els.userEmail.textContent = user.email || "";
  refreshList();
});

/* ---------- 我的地圖 ---------- */
async function refreshList() {
  if (!currentUser) return;
  els.mapList.replaceChildren(el("p", { class: "adm-empty", text: "正在載入地圖…" }));
  try {
    const maps = await listMyMaps(currentUser.uid);
    if (!maps.length) {
      els.mapList.replaceChildren(el("p", { class: "adm-empty", text: "你還未建立任何地圖。可在上方「新增地圖」開始。" }));
      return;
    }
    els.mapList.replaceChildren(...maps.map(mapCard));
  } catch (error) {
    els.mapList.replaceChildren(el("p", { class: "adm-error", text: "載入地圖失敗：" + friendlyDbError(error) }));
  }
}

function mapCard(m) {
  const pubBadge = el("span", { class: "adm-badge " + (m.published ? "is-on" : "is-off"), text: m.published ? "已發佈" : "未發佈" });
  const visBadge = el("span", { class: "adm-badge", text: m.visibility === "public" ? "公開" : "只限學校" });
  const routesCount = (m.routes || []).length;

  const run = async (btn, fn, okMsg) => {
    btn.disabled = true;
    try { await fn(); if (okMsg) setStatus(okMsg); await refreshList(); }
    catch (error) { setStatus("操作失敗：" + friendlyDbError(error)); btn.disabled = false; }
  };

  const pubBtn = el("button", { type: "button", class: "adm-btn", text: m.published ? "取消發佈" : "發佈" });
  pubBtn.addEventListener("click", () => run(pubBtn, () => saveMapDoc(m.id, { published: !m.published }),
    m.published ? `「${m.title}」已取消發佈。` : `「${m.title}」已發佈。`));

  const visSel = el("select", { class: "adm-select", "aria-label": "可見範圍" }, [
    el("option", { value: "school", text: "只限學校" }),
    el("option", { value: "public", text: "公開" })
  ]);
  visSel.value = m.visibility === "public" ? "public" : "school";
  visSel.addEventListener("change", () => run(visSel, () => saveMapDoc(m.id, { visibility: visSel.value }),
    `「${m.title}」可見範圍已改為${visSel.value === "public" ? "公開" : "只限學校"}。`));

  const copyBtn = el("button", { type: "button", class: "adm-btn", text: "複製連結" });
  copyBtn.addEventListener("click", async () => {
    const url = viewUrl(m.id);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("已複製連結：" + url);
    } catch {
      window.prompt("請手動複製以下連結：", url);
    }
  });

  const delBtn = el("button", { type: "button", class: "adm-btn adm-btn-danger", text: "刪除" });
  delBtn.addEventListener("click", () => {
    if (!confirm(`確定刪除「${m.title}」？地圖及其所有相片會永久刪除，無法復原。`)) return;
    run(delBtn, () => deleteMapAndPhotos(m.id), `「${m.title}」已刪除。`);
  });

  return el("article", { class: "adm-card adm-map" }, [
    el("div", { class: "adm-map-head" }, [
      el("h3", { class: "adm-map-title", text: m.title || "未命名地圖" }),
      el("div", { class: "adm-badges" }, [pubBadge, visBadge])
    ]),
    el("p", { class: "adm-meta", text: `${routesCount} 條路線` + (m.updatedAt ? ` · 更新於 ${fmtTime(m.updatedAt)}` : "") }),
    el("div", { class: "adm-row adm-actions" }, [
      el("a", { class: "adm-btn adm-btn-primary", href: editUrl(m.id), text: "編輯" }),
      el("a", { class: "adm-btn", href: viewUrl(m.id), target: "_blank", rel: "noopener", text: "查看" }),
      copyBtn, pubBtn, visSel, delBtn
    ])
  ]);
}

/* ---------- 新增地圖 ---------- */
function readTitle() {
  const title = els.newTitle.value.trim().slice(0, LIMITS.title);
  if (!title) { els.newProgress.textContent = "請先輸入地圖標題。"; els.newTitle.focus(); return null; }
  return title;
}

function setBusy(on) {
  busy = on;
  els.newBlankBtn.disabled = on;
  els.newTemplateBtn.disabled = on;
}

/* 內置路線 → Firestore 格式；需要上載的相片收集在 jobs */
function convertTemplate(mapId) {
  const jobs = [];
  const routes = BUILTIN_SITE.routes.map((r) => {
    const route = {
      id: newId("r"),
      name: r.name || "",
      theme: r.theme || "",
      area: r.area || "",
      duration: r.duration || "",
      color: r.color || "#e25b3a",
      blurb: r.blurb || "",
      stops: (r.stops || []).map((s) => {
        const stop = { id: newId("s"), name: s.name || "", body: s.text || "", lat: s.lat, lng: s.lng };
        if (s.en) stop.bodyEn = s.en;
        if (s.credit) stop.photoCredit = s.credit;
        if (s.photo && s.photo.src) {
          stop.photoId = newPhotoId(mapId);
          jobs.push({ photoId: stop.photoId, src: s.photo.src, name: stop.name });
        }
        return stop;
      })
    };
    if (r.credit) route.credit = r.credit;
    const path = pathToFirestore(r.path);
    if (path && path.length > 1) route.path = path;
    return route;
  });
  return { routes, jobs };
}

async function createMap(fromTemplate) {
  if (busy || !currentUser) return;
  const title = readTitle();
  if (!title) return;
  setBusy(true);
  const mapId = newMapId();
  const failed = [];
  try {
    let routes = [];
    let jobs = [];
    if (fromTemplate) ({ routes, jobs } = convertTemplate(mapId));
    els.newProgress.textContent = "正在建立地圖…";
    await createMapDoc(mapId, currentUser, {
      title,
      description: fromTemplate ? (BUILTIN_SITE.lede || "") : "",
      center: { lat: 22.208, lng: 114.029 },
      zoom: 14.7,
      routes
    });
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      els.newProgress.textContent = `正在複製相片 ${i + 1} / ${jobs.length}…`;
      try {
        const res = await fetch(job.src);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const photo = await compressImage(await res.blob(), { maxDim: 1280, quality: 0.75, maxChars: LIMITS.photoChars });
        await putPhoto(mapId, job.photoId, currentUser.uid, photo);
      } catch (error) {
        console.warn("[老師後台] 相片複製失敗", job.src, error);
        failed.push(job.name);
      }
    }
    if (failed.length) {
      // 移除失敗相片的 photoId，避免地圖指向不存在的相片
      const bad = new Set(jobs.filter((j) => failed.includes(j.name)).map((j) => j.photoId));
      routes.forEach((r) => r.stops.forEach((s) => { if (bad.has(s.photoId)) delete s.photoId; }));
      await saveMapDoc(mapId, { routes });
      els.newProgress.textContent = `地圖已建立，但有 ${failed.length} 張相片未能複製（${failed.join("、")}），可在編輯器補上。即將前往編輯器…`;
      await new Promise((r) => setTimeout(r, 2500));
    } else {
      els.newProgress.textContent = "完成！正在前往編輯器…";
    }
    location.href = editUrl(mapId);
  } catch (error) {
    els.newProgress.textContent = "建立失敗：" + (error && error.code ? friendlyDbError(error) : (error && error.message) || "未知錯誤");
    setBusy(false);
  }
}

els.newBlankBtn.addEventListener("click", () => createMap(false));
els.newTemplateBtn.addEventListener("click", () => createMap(true));
els.newTitle.addEventListener("keydown", (e) => { if (e.key === "Enter") createMap(false); });

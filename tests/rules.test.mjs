// 以 Firestore 模擬器測試 firestore.rules
// 執行：cd tests && npx -y firebase-tools@latest --project demo-ccw emulators:exec --only firestore "npm test"
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment, assertSucceeds, assertFails
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs,
  serverTimestamp, Timestamp
} from "firebase/firestore";

let env;
const school = (uid, extra = {}) => ({
  email: `${uid}@caritasfsc.edu.hk`, email_verified: true,
  firebase: { sign_in_provider: "google.com" }, ...extra
});

function mapData(ownerUid, over = {}) {
  return {
    title: "測試地圖", description: "", ownerUid, ownerEmail: `${ownerUid}@caritasfsc.edu.hk`, ownerName: "老師",
    published: false, visibility: "public", center: { lng: 114.029, lat: 22.208 }, zoom: 14.7,
    routes: [{ id: "r1", name: "路線", stops: [] }],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over
  };
}
const tinyJpeg = "data:image/jpeg;base64," + "A".repeat(200);
function photoData(ownerUid, over = {}) {
  return { ownerUid, dataUrl: tinyJpeg, width: 10, height: 10,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...over };
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-ccw",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const base = (uid, over) => ({ ...mapData(uid, over), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    await setDoc(doc(db, "maps/draft"), base("alice"));
    await setDoc(doc(db, "maps/pub"), base("alice", { published: true, visibility: "public" }));
    await setDoc(doc(db, "maps/schoolOnly"), base("alice", { published: true, visibility: "school" }));
    await setDoc(doc(db, "maps/pub/photos/p1"), { ...photoData("alice"), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    await setDoc(doc(db, "maps/draft/photos/p1"), { ...photoData("alice"), createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  });
});

const alice = () => env.authenticatedContext("alice", school("alice")).firestore();
const bob = () => env.authenticatedContext("bob", school("bob")).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const gmail = () => env.authenticatedContext("eve", { email: "eve@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" } }).firestore();
const unverified = () => env.authenticatedContext("uv", school("uv", { email_verified: false })).firestore();
const lookalike = () => env.authenticatedContext("lk", { email: "x@caritasfsc.edu.hk.evil.com", email_verified: true, firebase: { sign_in_provider: "google.com" } }).firestore();
const passwordUser = () => env.authenticatedContext("pw", school("pw", { firebase: { sign_in_provider: "password" } })).firestore();

test("學校帳戶可建立自己的地圖", async () => {
  await assertSucceeds(setDoc(doc(alice(), "maps/new1"), mapData("alice")));
});
test("非學校帳戶（gmail）不能建立", async () => {
  await assertFails(setDoc(doc(gmail(), "maps/new2"), mapData("eve")));
});
test("電郵未驗證不能建立", async () => {
  await assertFails(setDoc(doc(unverified(), "maps/new3"), mapData("uv")));
});
test("假冒網域（caritasfsc.edu.hk.evil.com）不能建立", async () => {
  await assertFails(setDoc(doc(lookalike(), "maps/new4"), mapData("lk")));
});
test("非 Google 登入（密碼）不能建立", async () => {
  await assertFails(setDoc(doc(passwordUser(), "maps/new5"), mapData("pw")));
});
test("未登入不能建立", async () => {
  await assertFails(setDoc(doc(anon(), "maps/new6"), mapData("x")));
});
test("不能以他人 uid 建立", async () => {
  await assertFails(setDoc(doc(bob(), "maps/new7"), mapData("alice")));
});
test("建立時不能加入未定義欄位", async () => {
  await assertFails(setDoc(doc(alice(), "maps/new8"), { ...mapData("alice"), isAdmin: true }));
});
test("建立時欄位型別錯誤會被拒（published 為字串）", async () => {
  await assertFails(setDoc(doc(alice(), "maps/new9"), mapData("alice", { published: "yes" })));
});
test("標題過長會被拒", async () => {
  await assertFails(setDoc(doc(alice(), "maps/new10"), mapData("alice", { title: "長".repeat(101) })));
});
test("visibility 只可 public / school", async () => {
  await assertFails(setDoc(doc(alice(), "maps/new11"), mapData("alice", { visibility: "everyone" })));
});
test("createdAt 不能偽造", async () => {
  await assertFails(setDoc(doc(alice(), "maps/new12"), mapData("alice", { createdAt: Timestamp.fromDate(new Date("2000-01-01")) })));
});

test("擁有人可更新自己的地圖", async () => {
  await assertSucceeds(updateDoc(doc(alice(), "maps/draft"), { title: "改了", updatedAt: serverTimestamp() }));
});
test("其他老師不能更新", async () => {
  await assertFails(updateDoc(doc(bob(), "maps/draft"), { title: "入侵", updatedAt: serverTimestamp() }));
});
test("其他老師不能刪除", async () => {
  await assertFails(deleteDoc(doc(bob(), "maps/pub")));
});
test("擁有人不能改 ownerUid", async () => {
  await assertFails(updateDoc(doc(alice(), "maps/draft"), { ownerUid: "bob", updatedAt: serverTimestamp() }));
});
test("擁有人不能改 createdAt", async () => {
  await assertFails(updateDoc(doc(alice(), "maps/draft"), { createdAt: Timestamp.now(), updatedAt: serverTimestamp() }));
});
test("更新亦檢查大小（描述 > 2000 字）", async () => {
  await assertFails(updateDoc(doc(alice(), "maps/draft"), { description: "字".repeat(2001), updatedAt: serverTimestamp() }));
});
test("更新不可刪去必要欄位", async () => {
  const { deleteField } = await import("firebase/firestore");
  await assertFails(updateDoc(doc(alice(), "maps/draft"), { title: deleteField(), updatedAt: serverTimestamp() }));
});
test("擁有人可刪除", async () => {
  await assertSucceeds(deleteDoc(doc(alice(), "maps/draft")));
});

test("未登入可讀已發佈的公開地圖", async () => {
  await assertSucceeds(getDoc(doc(anon(), "maps/pub")));
});
test("未登入不能讀未發佈地圖", async () => {
  await assertFails(getDoc(doc(anon(), "maps/draft")));
});
test("其他老師不能讀未發佈地圖", async () => {
  await assertFails(getDoc(doc(bob(), "maps/draft")));
});
test("擁有人可讀自己的未發佈地圖", async () => {
  await assertSucceeds(getDoc(doc(alice(), "maps/draft")));
});
test("未登入不能讀「只限學校」地圖", async () => {
  await assertFails(getDoc(doc(anon(), "maps/schoolOnly")));
});
test("gmail 帳戶不能讀「只限學校」地圖", async () => {
  await assertFails(getDoc(doc(gmail(), "maps/schoolOnly")));
});
test("其他學校帳戶可讀「只限學校」已發佈地圖", async () => {
  await assertSucceeds(getDoc(doc(bob(), "maps/schoolOnly")));
});
test("擁有人可列出自己的地圖", async () => {
  await assertSucceeds(getDocs(query(collection(alice(), "maps"), where("ownerUid", "==", "alice"))));
});
test("不能列出全部地圖（未登入）", async () => {
  await assertFails(getDocs(collection(anon(), "maps")));
});
test("其他老師不能列出別人的地圖", async () => {
  await assertFails(getDocs(query(collection(bob(), "maps"), where("ownerUid", "==", "alice"))));
});

test("未登入可讀公開地圖的相片", async () => {
  await assertSucceeds(getDoc(doc(anon(), "maps/pub/photos/p1")));
});
test("未登入不能讀未發佈地圖的相片", async () => {
  await assertFails(getDoc(doc(anon(), "maps/draft/photos/p1")));
});
test("擁有人可加相片", async () => {
  await assertSucceeds(setDoc(doc(alice(), "maps/draft/photos/p2"), photoData("alice")));
});
test("其他老師不能在別人地圖加相片", async () => {
  await assertFails(setDoc(doc(bob(), "maps/draft/photos/p3"), photoData("bob")));
});
test("不能在不存在的地圖下加相片", async () => {
  await assertFails(setDoc(doc(alice(), "maps/nope/photos/p4"), photoData("alice")));
});
test("相片必須是 JPEG data URL", async () => {
  await assertFails(setDoc(doc(alice(), "maps/draft/photos/p5"), photoData("alice", { dataUrl: "javascript:alert(1)" + "A".repeat(200) })));
});
test("相片過大（> 950000 字元）會被拒", async () => {
  await assertFails(setDoc(doc(alice(), "maps/draft/photos/p6"), photoData("alice", { dataUrl: "data:image/jpeg;base64," + "A".repeat(950000) })));
});
test("接近上限的相片（約 900000 字元）可寫入", async () => {
  await assertSucceeds(setDoc(doc(alice(), "maps/draft/photos/p7"), photoData("alice", { dataUrl: "data:image/jpeg;base64," + "A".repeat(899000) })));
});
test("其他老師不能刪別人的相片", async () => {
  await assertFails(deleteDoc(doc(bob(), "maps/pub/photos/p1")));
});
test("擁有人可列出及刪除自己地圖的相片", async () => {
  await assertSucceeds(getDocs(collection(alice(), "maps/draft/photos")));
  await assertSucceeds(deleteDoc(doc(alice(), "maps/draft/photos/p1")));
});
test("未登入不能列出相片", async () => {
  await assertFails(getDocs(collection(anon(), "maps/pub/photos")));
});
test("其他路徑一律拒絕", async () => {
  await assertFails(setDoc(doc(alice(), "users/alice"), { a: 1 }));
  await assertFails(getDoc(doc(anon(), "users/alice")));
});

test("ownerEmail 必須等於登入電郵", async () => {
  await assertFails(setDoc(doc(alice(), "maps/fakeEmail"), mapData("alice", { ownerEmail: "bob@caritasfsc.edu.hk" })));
});
test("擁有人不能改 ownerEmail", async () => {
  await assertFails(updateDoc(doc(alice(), "maps/draft"), { ownerEmail: "x@caritasfsc.edu.hk", updatedAt: serverTimestamp() }));
});
test("擁有人可發佈並改為只限學校", async () => {
  await assertSucceeds(updateDoc(doc(alice(), "maps/draft"), { published: true, visibility: "school", updatedAt: serverTimestamp() }));
});

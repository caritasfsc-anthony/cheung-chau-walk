#!/usr/bin/env python3
"""長洲立體步道：本地靜態伺服器 + 地圖資源代理（只用 Python 標準庫）。

用法：
    python3 serve.py            # 預設 127.0.0.1:8765
    python3 serve.py --port 9000 --host 0.0.0.0

除了提供本資料夾的靜態檔案，還會把地圖相關的遠端資源經
/proxy/<host>/<path> 轉發，例如：
    /proxy/tiles.openfreemap.org/styles/liberty
    /proxy/s3.amazonaws.com/elevation-tiles-prod/terrarium/14/13409/7151.png
這樣瀏覽器只需連到本機，就算瀏覽器本身連不上圖磚伺服器也能顯示地圖。
樣式與 TileJSON 內的絕對網址會被改寫成本機代理網址。
"""

import argparse
import gzip
import json
import os
import sys
import threading
import time
import urllib.error
import urllib.request
import zlib
from collections import OrderedDict
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))

# 只代理這些主機（及路徑前綴），避免變成任意開放代理。
ALLOWED = {
    "tiles.openfreemap.org": ("/",),
    "s3.amazonaws.com": ("/elevation-tiles-prod/",),
    "unpkg.com": ("/maplibre-gl@",),
    "mapapi.geodata.gov.hk": ("/gs/api/v1.0.0/xyz/",),
    "www.sunferry.com.hk": ("/eta/",),
}
# 會在 JSON 內被改寫成本機代理的主機
REWRITE_HOSTS = ("tiles.openfreemap.org", "s3.amazonaws.com")

UPSTREAM_TIMEOUT = 20
USER_AGENT = "cheung-chau-walk-local-proxy/1.0 (+python stdlib)"

PASS_HEADERS = (
    "Content-Type",
    "Content-Encoding",
    "ETag",
    "Last-Modified",
)


class LRUCache:
    """以位元組總量為上限的簡單記憶體快取。"""

    def __init__(self, max_bytes=256 * 1024 * 1024, ttl=6 * 3600):
        self.max_bytes = max_bytes
        self.ttl = ttl
        self.size = 0
        self.items = OrderedDict()
        self.lock = threading.Lock()

    def get(self, key):
        with self.lock:
            item = self.items.get(key)
            if not item:
                return None
            if time.time() - item["t"] > self.ttl:
                self.size -= len(item["body"])
                del self.items[key]
                return None
            self.items.move_to_end(key)
            return item

    def put(self, key, status, headers, body):
        if len(body) > self.max_bytes // 8:
            return
        with self.lock:
            old = self.items.pop(key, None)
            if old:
                self.size -= len(old["body"])
            self.items[key] = {"t": time.time(), "status": status, "headers": headers, "body": body}
            self.size += len(body)
            while self.size > self.max_bytes and self.items:
                _, ev = self.items.popitem(last=False)
                self.size -= len(ev["body"])


CACHE = LRUCache()


def decode_body(body, encoding):
    encoding = (encoding or "").lower().strip()
    if not encoding or encoding == "identity":
        return body
    if encoding == "gzip":
        return gzip.decompress(body)
    if encoding == "deflate":
        try:
            return zlib.decompress(body)
        except zlib.error:
            return zlib.decompress(body, -zlib.MAX_WBITS)
    raise ValueError("unsupported encoding: " + encoding)


class Handler(SimpleHTTPRequestHandler):
    server_version = "CheungChauWalk/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        if os.environ.get("CCW_QUIET"):
            return
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def end_headers(self):
        # 本機開發：靜態檔不快取，方便更新；代理回應自行設定。
        if not getattr(self, "_proxy_response", False):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/proxy/health":
            return self.send_json(200, {"ok": True, "proxy": "/proxy/<host>/<path>", "hosts": sorted(ALLOWED)})
        if self.path.startswith("/proxy/"):
            return self.handle_proxy(head_only=False)
        return super().do_GET()

    def do_HEAD(self):
        if self.path.startswith("/proxy/"):
            return self.handle_proxy(head_only=True)
        return super().do_HEAD()

    def send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._proxy_response = True
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def local_origin(self):
        host = self.headers.get("Host") or "%s:%s" % self.server.server_address[:2]
        return "http://" + host

    def rewrite_json(self, text):
        origin = self.local_origin()
        for h in REWRITE_HOSTS:
            for scheme in ("https://", "http://"):
                text = text.replace(scheme + h + "/", origin + "/proxy/" + h + "/")
        return text

    def handle_proxy(self, head_only):
        rest = self.path[len("/proxy/"):]
        host, _, path = rest.partition("/")
        path = "/" + path
        prefixes = ALLOWED.get(host)
        if not prefixes or not any(path.startswith(p) for p in prefixes) or ".." in path.split("?")[0]:
            return self.send_json(403, {"ok": False, "error": "host or path not allowed", "host": host})

        url = "https://" + host + path
        cached = CACHE.get(url)
        if cached:
            return self.respond(cached["status"], cached["headers"], cached["body"], head_only, "HIT")

        req = urllib.request.Request(url, headers={
            "User-Agent": USER_AGENT,
            "Accept-Encoding": "gzip",
            "Accept": self.headers.get("Accept", "*/*"),
        })
        try:
            with urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT) as resp:
                status = resp.status
                body = resp.read()
                upstream = resp.headers
        except urllib.error.HTTPError as e:
            status = e.code
            body = e.read() or b""
            upstream = e.headers
        except Exception as e:  # 連線錯誤、逾時
            return self.send_json(502, {"ok": False, "error": str(e), "url": url})

        headers = {k: upstream.get(k) for k in PASS_HEADERS if upstream.get(k)}
        ctype = (headers.get("Content-Type") or "").lower()
        is_json = "json" in ctype or path.split("?")[0].startswith("/styles/") or (
            host == "tiles.openfreemap.org" and path.rstrip("/").count("/") == 1 and not path.endswith(".pbf")
        )
        if is_json and status == 200:
            try:
                raw = decode_body(body, headers.get("Content-Encoding"))
                body = self.rewrite_json(raw.decode("utf-8")).encode("utf-8")
                headers.pop("Content-Encoding", None)
                headers.pop("ETag", None)
                headers["Content-Type"] = "application/json; charset=utf-8"
            except Exception as e:
                sys.stderr.write("json rewrite failed for %s: %s\n" % (url, e))

        if status == 200:
            CACHE.put(url, status, headers, body)
        return self.respond(status, headers, body, head_only, "MISS")

    def respond(self, status, headers, body, head_only, cache_state):
        self._proxy_response = True
        self.send_response(status)
        for k, v in headers.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, max-age=86400" if status == 200 else "no-store")
        self.send_header("X-Proxy-Cache", cache_state)
        self.end_headers()
        if not head_only:
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass


def main():
    ap = argparse.ArgumentParser(description="長洲立體步道本地伺服器")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8765)
    args = ap.parse_args()
    ThreadingHTTPServer.daemon_threads = True
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print("長洲立體步道：http://%s:%d/  （地圖代理：/proxy/<host>/<path>）" % (args.host, args.port), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()

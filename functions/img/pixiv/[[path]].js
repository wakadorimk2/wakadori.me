// i.pximg.net 画像プロキシ（Referer 必須のホットリンク制限を回避）
// オープンプロキシ化防止:
//   - 上流ホストは i.pximg.net 定数固定（クライアント指定不可）
//   - パスはサムネ形式の allowlist 正規表現のみ許可（img-original = フルサイズは不許可）
//   - GET のみ・クエリ拒否・上流ヘッダは透過しない
const PATH_RE =
  /^(c\/\d+x\d+[a-z0-9_]*\/)?(img-master|custom-thumb)\/img\/\d{4}\/\d{2}\/\d{2}\/\d{2}\/\d{2}\/\d{2}\/\d+_p\d+_(square|master|custom)1200\.(jpg|png)$/;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export async function onRequestGet({ request, params, waitUntil }) {
  const path = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  const url = new URL(request.url);
  if (url.search !== "" || path.includes("..") || path.includes("//") || !PATH_RE.test(path)) {
    return new Response("Not found", { status: 404 });
  }

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/img/pixiv/${path}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const upstream = await fetch(`https://i.pximg.net/${path}`, {
    headers: {
      referer: "https://www.pixiv.net/",
      "user-agent": BROWSER_UA,
    },
  });
  if (!upstream.ok) {
    return new Response("Not found", { status: 404 });
  }

  const res = new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") || "image/jpeg",
      "cache-control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

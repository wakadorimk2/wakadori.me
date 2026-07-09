import { json } from "./http.js";

/*
 * 三段フォールバック:
 *   1. Cache API（エッジ、TTL = ttl 秒）
 *   2. fetcher() による生取得（成功時は KV に last-known-good を保存）
 *   3. KV の last-known-good（X-WK-Stale: 1 付き）
 *   4. emptyValue（クライアントは静的表示のまま＝劣化に見えない）
 * KV binding（WK_CACHE）が未設定でも 1→2→4 で動作する。
 */
export async function cachedJson(context, { cacheKeyPath, kvKey, ttl, fetcher, emptyValue }) {
  const { request, env } = context;
  const cache = caches.default;
  const cacheKey = new Request(new URL(cacheKeyPath, request.url));

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let data = null;
  try {
    data = await fetcher();
  } catch (err) {
    // メッセージのみ出力（Cookie 等の秘密情報は fetcher 側でエラーに含めない契約）
    console.error(`fetch failed for ${kvKey}: ${err && err.message}`);
    data = null;
  }

  if (data) {
    const res = json(data, {
      headers: { "cache-control": `public, s-maxage=${ttl}` },
    });
    context.waitUntil(cache.put(cacheKey, res.clone()));
    if (env.WK_CACHE) {
      context.waitUntil(env.WK_CACHE.put(kvKey, JSON.stringify(data)));
    }
    return res;
  }

  if (env.WK_CACHE) {
    const stale = await env.WK_CACHE.get(kvKey);
    if (stale) {
      return json(JSON.parse(stale), {
        headers: {
          "cache-control": "public, s-maxage=300",
          "x-wk-stale": "1",
        },
      });
    }
  }

  return json(emptyValue, {
    headers: { "cache-control": "public, s-maxage=300" },
  });
}

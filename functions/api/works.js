import { cachedJson } from "../_shared/cache.js";

const PIXIV_USER_ID = "75962333";
const WORKS_COUNT = 4;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function pixivHeaders(env) {
  const headers = {
    "user-agent": BROWSER_UA,
    referer: "https://www.pixiv.net/",
    accept: "application/json",
  };
  // 無認証で足りる限り PIXIV_PHPSESSID は未設定運用。値はログ・レスポンスに出さない。
  if (env.PIXIV_PHPSESSID) {
    headers.cookie = `PHPSESSID=${env.PIXIV_PHPSESSID}`;
  }
  return headers;
}

// i.pximg.net の URL を自サイトのプロキシパスへ変換。想定外の形式は null。
function toProxyPath(url) {
  const m = /^https:\/\/i\.pximg\.net\/([\w./-]+)$/.exec(String(url));
  return m ? `/img/pixiv/${m[1]}` : null;
}

async function fetchPixivWorks(env) {
  const headers = pixivHeaders(env);

  const profileRes = await fetch(`https://www.pixiv.net/ajax/user/${PIXIV_USER_ID}/profile/all`, {
    headers,
  });
  if (!profileRes.ok) throw new Error(`pixiv profile/all: ${profileRes.status}`);
  const profile = await profileRes.json();
  if (profile.error || !profile.body || typeof profile.body.illusts !== "object") {
    throw new Error("pixiv profile/all: unexpected shape");
  }

  const ids = Object.keys(profile.body.illusts)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a)
    .slice(0, WORKS_COUNT);
  if (ids.length === 0) {
    return { fetchedAt: new Date().toISOString(), works: [] };
  }

  const query = ids.map((id) => `ids%5B%5D=${id}`).join("&");
  const detailRes = await fetch(
    `https://www.pixiv.net/ajax/user/${PIXIV_USER_ID}/profile/illusts?${query}&work_category=illust&is_first_page=1`,
    { headers },
  );
  if (!detailRes.ok) throw new Error(`pixiv profile/illusts: ${detailRes.status}`);
  const detail = await detailRes.json();
  if (detail.error || !detail.body || typeof detail.body.works !== "object") {
    throw new Error("pixiv profile/illusts: unexpected shape");
  }

  const works = ids
    .map((id) => {
      const work = detail.body.works[String(id)];
      if (!work) return null;
      const thumb = toProxyPath(work.url);
      if (!thumb) return null;
      return {
        id: String(id),
        title: String(work.title || ""),
        thumb,
        link: `https://www.pixiv.net/artworks/${id}`,
        date: String(work.createDate || ""),
      };
    })
    .filter(Boolean);

  return { fetchedAt: new Date().toISOString(), works };
}

export async function onRequestGet(context) {
  return cachedJson(context, {
    cacheKeyPath: "/api/works",
    kvKey: "pixiv:works:v1",
    ttl: 1800,
    fetcher: () => fetchPixivWorks(context.env),
    emptyValue: { fetchedAt: null, works: [] },
  });
}

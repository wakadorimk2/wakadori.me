import { cachedJson } from "../_shared/cache.js";

const GITHUB_USER = "wakadorimk2";
const REPOS_COUNT = 4;

async function fetchGithubRepos(env) {
  const headers = {
    "user-agent": "wakadori.me-portfolio",
    accept: "application/vnd.github+json",
  };
  // 無認証は 60 req/時/IP。枯渇する場合のみ GITHUB_TOKEN（public read の fine-grained PAT）を設定
  if (env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=${REPOS_COUNT}&type=owner`,
    { headers },
  );
  if (!res.ok) throw new Error(`github repos: ${res.status}`);
  const list = await res.json();
  if (!Array.isArray(list)) throw new Error("github repos: unexpected shape");

  return {
    fetchedAt: new Date().toISOString(),
    repos: list.map((repo) => ({
      name: String(repo.name || ""),
      description: String(repo.description || ""),
      url: String(repo.html_url || ""),
      language: String(repo.language || ""),
      pushedAt: String(repo.pushed_at || ""),
    })),
  };
}

export async function onRequestGet(context) {
  return cachedJson(context, {
    cacheKeyPath: "/api/repos",
    kvKey: "github:repos:v1",
    ttl: 1800,
    fetcher: () => fetchGithubRepos(context.env),
    emptyValue: { fetchedAt: null, repos: [] },
  });
}

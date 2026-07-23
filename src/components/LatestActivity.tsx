import { useEffect, useState } from "react";

interface ActivityItem {
  key: string;
  source: "pixiv" | "GitHub";
  title: string;
  href: string;
  date: string;
  detail?: string;
}

interface Props {
  pixivUrl: string;
  githubUrl: string;
}

function validDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function displayDate(value: string) {
  const date = validDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function LatestActivity({ pixivUrl, githubUrl }: Props) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const load = async () => {
      const [worksResult, reposResult] = await Promise.allSettled([
        fetch("/api/works").then((response) => {
          if (!response.ok) throw new Error("works unavailable");
          return response.json();
        }),
        fetch("/api/repos").then((response) => {
          if (!response.ok) throw new Error("repos unavailable");
          return response.json();
        }),
      ]);

      const merged: ActivityItem[] = [];
      if (worksResult.status === "fulfilled" && Array.isArray(worksResult.value.works)) {
        for (const work of worksResult.value.works) {
          merged.push({
            key: `pixiv-${String(work.id)}`,
            source: "pixiv",
            title: String(work.title || "Illustration"),
            href: String(work.link || pixivUrl),
            date: String(work.date || ""),
          });
        }
      }
      if (reposResult.status === "fulfilled" && Array.isArray(reposResult.value.repos)) {
        for (const repo of reposResult.value.repos) {
          merged.push({
            key: `github-${String(repo.name)}`,
            source: "GitHub",
            title: String(repo.name || "Repository"),
            href: String(repo.url || githubUrl),
            date: String(repo.pushedAt || ""),
            detail: String(repo.description || repo.language || ""),
          });
        }
      }

      merged.sort((a, b) => {
        const aTime = validDate(a.date)?.getTime() ?? 0;
        const bTime = validDate(b.date)?.getTime() ?? 0;
        return bTime - aTime;
      });
      setItems(merged.slice(0, 4));
      setStatus(merged.length ? "ready" : "fallback");
    };

    void load();
  }, [githubUrl, pixivUrl]);

  if (status !== "ready") {
    return (
      <div className="activity-fallback" aria-live="polite">
        <p>
          {status === "loading"
            ? "最新の活動を読み込んでいます。"
            : "新しい活動はプロフィールからご覧いただけます。"}
        </p>
        <div className="text-links">
          <a href={pixivUrl} target="_blank" rel="noopener noreferrer">
            pixiv <span aria-hidden="true">↗</span>
          </a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <ol className="activity-list" aria-label="最新の活動">
      {items.map((item) => (
        <li key={item.key}>
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            <span className="activity-list__source">{item.source}</span>
            <strong>{item.title}</strong>
            {item.detail ? <span>{item.detail}</span> : null}
            <time dateTime={item.date}>{displayDate(item.date)}</time>
            <span className="activity-list__arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

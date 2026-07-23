import { useState, type CSSProperties, type PointerEvent } from "react";

export interface GalleryWork {
  slug: string;
  type: "illustration" | "software";
  titleJa: string;
  titleEn: string;
  year: number;
  summary: string;
  cover: string;
  alt: string;
  shape: "portrait" | "landscape" | "square" | "wide";
  note?: string;
}

interface Props {
  works: GalleryWork[];
}

type LightStyle = CSSProperties & {
  "--light-x": string;
  "--light-y": string;
};

export default function CuratedGallery({ works }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [light, setLight] = useState({ x: 50, y: 50 });

  const moveLight = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setLight({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  return (
    <div className="curated-grid">
      {works.map((work, index) => {
        const isActive = active === work.slug;
        const style = {
          "--light-x": `${light.x}%`,
          "--light-y": `${light.y}%`,
        } as LightStyle;

        return (
          <article
            className={`work-card work-card--${work.shape}`}
            data-active={isActive ? "true" : "false"}
            key={work.slug}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setActive(work.slug);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") setActive(null);
            }}
            onPointerMove={moveLight}
            style={style}
          >
            <a
              href={`/works/${work.slug}/`}
              onFocus={() => setActive(work.slug)}
              onBlur={() => setActive(null)}
            >
              <span className="work-card__media">
                <img
                  src={work.cover}
                  alt={work.alt}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
                <span className="work-card__trace" aria-hidden="true">
                  {work.note ?? "work in progress"}
                </span>
              </span>
              <span className="work-card__meta">
                <span className="eyebrow">
                  {work.type === "illustration" ? "Illustration" : "Software"} · {work.year}
                </span>
                <strong>{work.titleJa}</strong>
                <span lang="en">{work.titleEn}</span>
              </span>
            </a>
          </article>
        );
      })}
    </div>
  );
}

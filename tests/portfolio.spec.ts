import { expect, test } from "@playwright/test";

test("keeps the mobile hero balanced and within the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "Covered once across mobile widths.");

  for (const width of [320, 360, 440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const workImage = page.locator(".hero__work > img");
    await expect
      .poll(() =>
        workImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);

    const headingLines = await page.locator(".hero h1").evaluate((heading) => {
      const textNode = heading.firstChild;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return [];

      const lines: Array<{ top: number; text: string }> = [];
      for (let index = 0; index < (textNode.textContent?.length ?? 0); index += 1) {
        const character = textNode.textContent?.at(index) ?? "";
        if (!character.trim()) continue;

        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const top = range.getBoundingClientRect().top;
        const line = lines.find((candidate) => Math.abs(candidate.top - top) < 1);
        if (line) line.text += character;
        else lines.push({ top, text: character });
      }
      return lines.map(({ text }) => text);
    });

    expect(headingLines.length, `${width}px heading lines`).toBeLessThanOrEqual(2);
    expect(headingLines.at(-1)?.length, `${width}px final heading line length`).toBeGreaterThan(2);
    const headingFontSize = await page
      .locator(".hero h1")
      .evaluate((heading) => Number.parseFloat(getComputedStyle(heading).fontSize));
    expect(headingFontSize, `${width}px heading font size`).toBeLessThanOrEqual(48);

    const layout = await page.evaluate(() => {
      const note = document.querySelector<HTMLElement>(".drawn-note--hero");
      const heading = document.querySelector<HTMLElement>(".hero h1");
      const englishCopy = document.querySelector<HTMLElement>('.hero__copy > p[lang="en"]');
      const workImage = document.querySelector<HTMLElement>(".hero__work > img");
      if (!note || !heading || !englishCopy || !workImage) return null;

      const noteRect = note.getBoundingClientRect();
      const overlaps = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        return !(
          noteRect.right <= rect.left ||
          noteRect.left >= rect.right ||
          noteRect.bottom <= rect.top ||
          noteRect.top >= rect.bottom
        );
      };

      return {
        hasHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        imageTop: workImage.getBoundingClientRect().top,
        imageBottom: workImage.getBoundingClientRect().bottom,
        imageWidth: workImage.getBoundingClientRect().width,
        viewportHeight: window.innerHeight,
        headingTop: heading.getBoundingClientRect().top,
        imageObjectFit: getComputedStyle(workImage).objectFit,
        overlapsHeading: overlaps(heading),
        overlapsEnglishCopy: overlaps(englishCopy),
        overlapsWorkImage: overlaps(workImage),
      };
    });

    expect(layout, `${width}px hero elements`).not.toBeNull();
    expect(layout?.hasHorizontalOverflow, `${width}px horizontal overflow`).toBe(false);
    expect(layout?.imageTop, `${width}px KV starts inside the viewport`).toBeGreaterThanOrEqual(0);
    expect(layout?.imageWidth, `${width}px KV has a visible size`).toBeGreaterThan(200);
    expect(
      layout!.imageBottom,
      `${width}px full KV fits in the initial viewport`,
    ).toBeLessThanOrEqual(layout!.viewportHeight);
    expect(layout!.imageBottom, `${width}px KV appears before the copy`).toBeLessThanOrEqual(
      layout!.headingTop,
    );
    await expect(workImage).toHaveAttribute("src", "/images/vayria-kv.png");
    expect(layout?.imageObjectFit, `${width}px image object-fit`).toBe("contain");
    expect(layout?.overlapsHeading, `${width}px note/heading overlap`).toBe(false);
    expect(layout?.overlapsEnglishCopy, `${width}px note/English copy overlap`).toBe(false);
    expect(layout?.overlapsWorkImage, `${width}px note/work image overlap`).toBe(false);
  }

  const heroLink = page.locator(".hero__work");
  await expect(heroLink).toHaveAttribute("href", "#vayria");
  await heroLink.click();
  await expect(page).toHaveURL(/#vayria$/);
  await expect(page.locator("#exhibition-title")).toBeInViewport();
});

test("shows the curated six works and opens a detail page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "絵とコードで、つくる。" }),
  ).toBeVisible();
  const works = page.locator(".work-card");
  await expect(works).toHaveCount(6);
  await expect(works.locator(".work-card__meta strong")).toHaveText([
    "IRyS — Fan Art",
    "AE2 Dashboard",
    "常闇トワ — Fan Art",
    "Enterlight",
    "獅白ぼたん — Fan Art",
    "wakadori.me / Previous UI",
  ]);
  await works.last().scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      works.locator("img").evaluateAll((images) =>
        images.every((image) => {
          const img = image as HTMLImageElement;
          return img.complete && img.naturalWidth > 0;
        }),
      ),
    )
    .toBe(true);

  const mediaSizes = await works.locator(".work-card__media").evaluateAll((media) =>
    media.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { width: bounds.width, area: bounds.width * bounds.height };
    }),
  );
  const widths = mediaSizes.map(({ width }) => width);
  const areas = mediaSizes.map(({ area }) => area);
  expect(Math.max(...widths) / Math.min(...widths)).toBeLessThanOrEqual(1.25);
  expect(Math.max(...areas) / Math.min(...areas)).toBeLessThanOrEqual(2.2);

  const firstWork = works.first().getByRole("link");
  await expect(firstWork).toHaveAttribute("href", /\/works\/.+\//);
  await firstWork.click();
  await expect(page.locator(".work-detail h1")).toBeVisible();
  await expect(page.getByRole("link", { name: /pixiv|GitHub|X/ }).first()).toHaveAttribute(
    "target",
    "_blank",
  );
});

test("reveals the making note for mouse and keyboard focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch opens details directly and has no hover layer.");
  await page.goto("/");
  await expect(page.locator('astro-island[component-url*="CuratedGallery"][ssr]')).toHaveCount(0);
  const firstCard = page.locator(".work-card").first();

  await firstCard.hover();
  await expect(firstCard).toHaveAttribute("data-active", "true");
  await expect(firstCard.locator(".work-card__trace")).toBeVisible();

  await firstCard.getByRole("link").focus();
  await expect(firstCard).toHaveAttribute("data-active", "true");
});

test("keeps quiet fallback links when activity APIs fail", async ({ page }) => {
  await page.route("**/api/{works,repos}", (route) => route.abort());
  await page.goto("/");
  await page.locator("#activity-title").scrollIntoViewIfNeeded();

  await expect(page.locator(".activity-fallback")).toContainText(
    "新しい活動はプロフィールからご覧いただけます。",
  );
  await expect(page.locator(".activity-fallback").getByRole("link")).toHaveCount(2);
});

test("respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await page
    .locator(".work-card__trace")
    .first()
    .evaluate((element) => {
      return getComputedStyle(element).transitionDuration;
    });
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);

  await page.goto("/works/enterlight/");
  await expect(page.locator(".work-process picture source")).toHaveAttribute(
    "media",
    "(prefers-reduced-motion: reduce)",
  );
  await expect(page.locator(".work-process picture source")).toHaveAttribute(
    "srcset",
    "/images/enterlight-cover.webp",
  );
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps works, detail links, and profiles available", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".work-card")).toHaveCount(6);
    await expect(page.locator(".activity-fallback").getByRole("link")).toHaveCount(2);

    await page.locator(".work-card").first().getByRole("link").click();
    await expect(page.locator(".work-detail h1")).toBeVisible();
    await expect(page.locator(".work-info__links a").first()).toHaveAttribute("target", "_blank");
  });
});

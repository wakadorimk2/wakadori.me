import { expect, test } from "@playwright/test";

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

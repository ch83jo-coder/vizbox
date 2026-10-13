import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/", name: "home" },
  { path: "/methodology", name: "methodology" },
  { path: "/guides", name: "guides" },
  { path: "/guides/rental-preparation", name: "guide-rental" },
  { path: "/guides/credit-history", name: "guide-credit" },
  { path: "/privacy", name: "privacy" },
];

for (const { path, name } of PAGES) {
  test(`${name}: 横スクロールなし・画像読み込み・スクリーンショット`, async ({
    page,
  }, testInfo) => {
    // グラフのアニメーションを止めて撮影する（reduced-motion の確認も兼ねる）
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);

    // 遅延読み込みの画像も読み込ませる
    await page.evaluate(async () => {
      for (const img of Array.from(document.images)) img.loading = "eager";
      await Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? null
            : new Promise((resolve) => img.addEventListener("load", resolve)),
        ),
      );
    });

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, "ページ全体の横スクロール").toBeLessThanOrEqual(0);

    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    expect(broken, "読み込めない画像").toEqual([]);

    await page.screenshot({
      path: `test-results/screens/${testInfo.project.name}-${name}.png`,
      fullPage: true,
    });
  });
}

test("入力欄は16px以上、ボタンは44px以上", async ({ page }) => {
  await page.goto("/");
  const inputSizes = await page
    .locator("#simulator input")
    .evaluateAll((inputs) =>
      inputs.map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
  expect(Math.min(...inputSizes)).toBeGreaterThanOrEqual(16);

  const buttonHeights = await page
    .locator("main button:visible, main a.MuiButton-root:visible")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  expect(Math.min(...buttonHeights)).toBeGreaterThanOrEqual(44);
});

import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";

// 主要フローはモバイル（360）とデスクトップ（1440）で確認する
test.beforeEach(({ page: _ }, testInfo) => {
  test.skip(!["360", "1440"].includes(testInfo.project.name));
});

/** React がシミュレーターの入力欄に接続されるまで待つ（ハイドレーション前の入力は初期値に戻るため） */
async function waitForSimulator(page: Page) {
  await page.waitForFunction(() => {
    const input = document.querySelector("#field-currentAge");
    return (
      input !== null &&
      Object.keys(input).some((key) => key.startsWith("__react"))
    );
  });
}

const resultCard = (page: Page, label: string) =>
  page.locator("#simulator section h4", { hasText: label }).locator("..");

test("基本入力 → 結果 → 仮定の変更 → グラフと表", async ({ page }) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByRole("link", { name: "無料でシミュレーション" }).click();
  await expect(page).toHaveURL(/#simulator$/);

  await expect(resultCard(page, "必要資産の目安")).toContainText("8,571万円");
  await expect(resultCard(page, "目標時点の予想資産")).toContainText(
    "6,541万円",
  );
  await expect(resultCard(page, "単純基準を満たす時期")).toContainText(
    "55歳1か月",
  );

  await page.getByLabel("想定利回り（年）").fill("7");
  await expect(resultCard(page, "目標時点の予想資産")).not.toContainText(
    "6,541万円",
  );

  await page.getByRole("button", { name: "名目（将来の円）" }).click();
  await expect(resultCard(page, "必要資産の目安")).toContainText("1億449万円");

  await expect(
    page.locator("#simulator figure svg.recharts-surface"),
  ).toBeVisible();
  await page.getByRole("button", { name: "表", exact: true }).click();
  const table = page.getByRole("table", { name: /1年ごとの資産の推移/ });
  await expect(table).toBeVisible();
  await expect(table.getByRole("rowheader", { name: "95歳" })).toBeVisible();
});

test("誤った入力 → 日本語エラー → 修正", async ({ page }) => {
  await page.goto("/");
  await waitForSimulator(page);
  const expenses = page.getByLabel("現在の月額生活費");
  await expenses.fill("");
  await expect(expenses).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#simulator")).toContainText("入力してください");
  await expect(resultCard(page, "必要資産の目安")).toContainText("—");

  await page.getByLabel("目標リタイア年齢").fill("30");
  await expect(page.locator("#simulator")).toContainText(
    "現在の年齢以上で入力してください",
  );

  await expenses.fill("25");
  await page.getByLabel("目標リタイア年齢").fill("50");
  await expect(expenses).toHaveAttribute("aria-invalid", "false");
  await expect(resultCard(page, "必要資産の目安")).toContainText("8,571万円");
});

test("この端末に保存 → 再読み込みで復元 → 初期化", async ({ page }) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByLabel("現在の月額生活費").fill("30");
  await page.getByRole("button", { name: "この端末に保存" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "保存しました" }),
  ).toBeVisible();

  await page.reload();
  await waitForSimulator(page);
  await expect(page.getByLabel("現在の月額生活費")).toHaveValue("30");
  await expect(
    page.getByText("この端末に保存した条件を読み込みました"),
  ).toBeVisible();

  await page.getByRole("button", { name: "初期化" }).click();
  await expect(page.getByLabel("現在の月額生活費")).toHaveValue("25");
  const stored = await page.evaluate(() =>
    localStorage.getItem("fire-ready:simulator"),
  );
  expect(stored).toBeNull();
});

test("保存しなければ何も残らない・旧形式の保存データは使わない", async ({
  page,
}) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByLabel("現在の月額生活費").fill("31");
  expect(await page.evaluate(() => localStorage.length)).toBe(0);

  await page.evaluate(() =>
    localStorage.setItem(
      "fire-ready:simulator",
      JSON.stringify({ schemaVersion: 0 }),
    ),
  );
  await page.reload();
  await waitForSimulator(page);
  await expect(
    page.getByText("保存データの形式が古いか壊れていた"),
  ).toBeVisible();
  await expect(page.getByLabel("現在の月額生活費")).toHaveValue("25");
});

test("共有：同意 → リンク作成 → 復元・不正なリンク", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByLabel("現在の月額生活費").fill("28");
  await page.getByRole("button", { name: "共有リンクを作成" }).click();

  const dialog = page.getByRole("dialog", { name: "共有リンクを作成" });
  await expect(dialog).toContainText("リンクを知っている人は誰でも");
  await expect(
    dialog.getByRole("button", { name: "リンクを作成" }),
  ).toBeDisabled();
  await dialog.getByLabel("上記を理解したうえでリンクを作成します").check();
  await dialog.getByRole("button", { name: "リンクを作成" }).click();

  const url = await dialog.getByLabel("共有リンク").inputValue();
  expect(url).toMatch(/^http:\/\/localhost:\d+\/#share=v1\.[A-Za-z0-9_-]+$/);

  const shared = await context.newPage();
  await shared.goto(url);
  await waitForSimulator(shared);
  await expect(shared.getByLabel("現在の月額生活費")).toHaveValue("28");
  await expect(
    shared.getByText("共有リンクの条件を表示しています"),
  ).toBeVisible();
  expect(await shared.evaluate(() => localStorage.length)).toBe(0);

  await shared.goto("/#share=v1.broken!!");
  await shared.reload();
  await waitForSimulator(shared);
  await expect(
    shared.getByText("共有リンクを読み込めませんでした"),
  ).toBeVisible();
  await expect(shared.getByLabel("現在の月額生活費")).toHaveValue("25");
});

test("PNG で保存（金額は既定で含めない）", async ({ page }, testInfo) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByRole("button", { name: "画像で保存" }).click();
  const dialog = page.getByRole("dialog", { name: "試算サマリーを画像で保存" });
  await expect(
    dialog.getByLabel("資産・生活費などの金額も含める"),
  ).not.toBeChecked();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("button", { name: "PNGを保存" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^fire-ready-summary-\d{8}\.png$/,
  );
  const saved = `test-results/screens/${testInfo.project.name}-export.png`;
  await download.saveAs(saved);
  const bytes = await readFile(saved);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
});

test("Phase 2 CTA → 準備ページ → プレビューは noindex・未作成テーマは 404", async ({
  page,
}) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.getByRole("link", { name: "FIRE後の生活準備をチェック" }).click();
  await expect(page).toHaveURL(/\/guides$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "FIRE後の生活準備ガイド",
  );

  await page
    .getByRole("link", { name: "FIRE後の賃貸契約に向けた準備" })
    .click();
  await expect(page).toHaveURL(/\/guides\/rental-preparation$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.getByText("プレビュー（未公開）")).toBeVisible();

  const response = await page.goto("/guides/housing-loan");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "ページが見つかりません" }),
  ).toBeVisible();
});

test("キーボード操作：スキップリンク・フォーカス表示", async ({ page }) => {
  await page.goto("/");
  await waitForSimulator(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "本文へスキップ" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();

  await page.getByLabel("現在の年齢").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("目標リタイア年齢")).toBeFocused();

  await page.getByRole("button", { name: "この端末に保存" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await page
    .getByRole("button", { name: "この端末に保存" })
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

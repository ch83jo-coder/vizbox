import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/** 360/390/768/1280/1440 の実画面で確認する */
const VIEWPORTS = [
  { name: "360", width: 360, height: 780, mobile: true },
  { name: "390", width: 390, height: 844, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
  { name: "1440", width: 1440, height: 900, mobile: false },
];

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  webServer: {
    command: `yarn build && yarn start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: VIEWPORTS.map(({ name, width, height, mobile }) => ({
    name,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width, height },
      isMobile: mobile,
      hasTouch: mobile,
    },
  })),
});

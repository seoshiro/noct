import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/3d",
  timeout: 45000,
  expect: { timeout: 7000 },
  use: {
    baseURL:
      process.env.NOCT_3D_URL || "http://127.0.0.1:5180/noct-3d-preview/",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
  },
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "evidence/3d/browser-results.json" }],
  ],
});

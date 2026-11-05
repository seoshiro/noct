import { test, expect, type Page } from "@playwright/test";
const ready = async (p: Page) => {
  await p.waitForFunction(() => window.__NOCT_3D__?.status === "ready");
  await p.waitForTimeout(650);
};
const metric = async (p: Page) => p.evaluate(() => window.__NOCT_3D__!);
test.beforeEach(async ({ page }) => {
  await page.goto("./?lang=en");
  await ready(page);
});
test("EMBER: actual mesh click opens cap, presses head, reveals notes and returns with pose intact", async ({
  page,
}) => {
  const start = await metric(page);
  await page.mouse.click(start.capScreen.x, start.capScreen.y);
  await expect(page.locator(".scene-page")).toHaveAttribute("data-cap", "open");
  await expect.poll(async () => (await metric(page)).cap).toBeGreaterThan(0.98);
  const open = await metric(page);
  await page.mouse.click(open.headScreen.x, open.headScreen.y);
  await expect(page.locator(".scene-page")).toHaveAttribute(
    "data-notes",
    "revealed",
  );
  await page
    .locator("#hero-sculpture")
    .getByRole("button", { name: "Turn left", exact: true })
    .click();
  await page.waitForTimeout(650);
  const pose = await metric(page);
  await page.locator(".hero-choice .text-button").click();
  await expect(page.locator(".note-image")).toBeVisible();
  await expect(page.locator(".detail-notes")).toContainText("Pink pepper");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  await expect(page.locator(".hero-choice .text-button")).toBeFocused();
  const returned = await metric(page);
  expect(returned.instanceId).toBe(start.instanceId);
  expect(returned.yaw).toBeCloseTo(pose.yaw, 2);
  expect(returned.cap).toBeGreaterThan(0.98);
  expect(returned.assetLoads).toBe(1);
});
test("EMBER: drag has inertia, reset converges, rapid cap and spray do not accumulate", async ({
  page,
}) => {
  const hit = page.locator("#hero-sculpture .bottle-touch");
  const box = (await hit.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.61, {
    steps: 20,
  });
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(Math.abs((await metric(page)).yaw)).toBeGreaterThan(0.4);
  await page
    .locator("#hero-sculpture")
    .getByRole("button", { name: "Reset view" })
    .click();
  await expect
    .poll(async () => Math.abs(Math.sin((await metric(page)).yaw)))
    .toBeLessThan(0.01);
  const cap = page.locator("#hero-sculpture .cap-toggle");
  for (let i = 0; i < 7; i++) await cap.click({ force: true });
  await expect(page.locator(".scene-page")).toHaveAttribute("data-cap", "open");
  for (let i = 0; i < 8; i++)
    await page.locator("#hero-sculpture .spray-button").click({ force: true });
  expect((await metric(page)).mistParticles).toBeLessThanOrEqual(48);
  await expect.poll(async () => (await metric(page)).mistParticles).toBe(0);
  await expect(page.locator("canvas")).toHaveCount(1);
});
test("EMBER: volume, cart, language and refresh preserve purchase logic and interaction state", async ({
  page,
}) => {
  await page.locator("#hero-sculpture .cap-toggle").click();
  await page
    .locator(".hero-order .sizes button")
    .filter({ hasText: "100" })
    .click();
  await page.locator(".quick-add").click();
  await expect(page.getByTestId("subtotal")).toHaveText("€168");
  await page
    .getByRole("button", { name: "Increase quantity ember-100", exact: true })
    .click();
  await expect(page.getByTestId("subtotal")).toHaveText("€336");
  await page.keyboard.press("Escape");
  await expect(page.locator(".scene-page")).toHaveAttribute("data-cap", "open");
  const id = (await metric(page)).instanceId;
  await page.getByRole("button", { name: "Switch to Russian" }).click();
  expect((await metric(page)).instanceId).toBe(id);
  await expect(page.locator(".scene-page")).toHaveAttribute("data-cap", "open");
  await page.reload();
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.locator(".bag-trigger").click();
  await expect(page.getByTestId("subtotal")).toContainText("336");
  await page.getByRole("button", { name: "Демо оформления" }).click();
  await expect(page.locator(".demo-complete")).toContainText(
    "Заказ не оформлен",
  );
  await expect(page.locator("input")).toHaveCount(0);
});
test("all three scents share the same scene and three unique samples make one valid set", async ({
  page,
}) => {
  const id = (await metric(page)).instanceId;
  await page.locator("#collection").scrollIntoViewIfNeeded();
  for (const name of ["RAIN", "VEIL", "EMBER"]) {
    await page.getByRole("tab", { name: new RegExp(name) }).click();
    await expect(page.locator(".selection-info h3")).toHaveText(name);
  }
  expect((await metric(page)).instanceId).toBe(id);
  expect((await metric(page)).assetLoads).toBe(1);
  const add = page.getByRole("button", { name: /Add discovery set/ });
  await expect(add).toBeDisabled();
  for (const name of ["EMBER", "RAIN"])
    await page
      .locator(".sample-options button")
      .filter({ hasText: name })
      .click();
  await expect(add).toBeDisabled();
  await page
    .locator(".sample-options button")
    .filter({ hasText: "VEIL" })
    .click();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(page.getByTestId("subtotal")).toHaveText("€18");
  await page.getByRole("button", { name: "Preview checkout" }).click();
  await expect(page.locator(".demo-complete")).toContainText(
    "No order has been placed",
  );
});
test("reduced motion and static fallback keep notes and shopping usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#hero-sculpture .cap-toggle").click();
  await page.locator("#hero-sculpture .spray-button").click();
  await expect(page.locator(".scene-page")).toHaveAttribute(
    "data-notes",
    "revealed",
  );
  expect((await metric(page)).mistParticles).toBe(0);
  await page.goto("./?lang=en&static=1");
  await expect(page.locator(".scene-page")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await expect(page.locator("#hero-sculpture .fallback-bottle")).toBeVisible();
  await page.locator(".quick-add").click();
  await expect(page.getByTestId("subtotal")).toHaveText("€112");
});
test("context loss becomes a usable still view and manual film stops scene rendering", async ({
  page,
}) => {
  await page.locator(".film-strip button").click();
  await expect(page.locator(".separate-film")).toBeVisible();
  expect((await metric(page)).active).toBe(false);
  await page.keyboard.press("Escape");
  await page.evaluate(() => {
    const c = document.querySelector(
      ".bottle-canvas canvas",
    ) as HTMLCanvasElement;
    c.getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.locator(".scene-page")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await page.locator(".bag-trigger").click();
  await expect(page.locator(".empty-cart")).toBeVisible();
});

test("keyboard rotation and fast scroll returns retain the same pose and settle to idle", async ({
  page,
}) => {
  const start = await metric(page);
  await page.locator("#hero-sculpture .bottle-touch").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  const turned = await metric(page);
  expect(turned.yaw).toBeGreaterThan(0.35);
  for (const id of ["discovery", "ritual", "collection", "top"]) {
    await page.evaluate(
      (id) =>
        document.getElementById(id)!.scrollIntoView({ behavior: "instant" }),
      id,
    );
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1000);
  const returned = await metric(page);
  expect(returned.instanceId).toBe(start.instanceId);
  expect(returned.assetLoads).toBe(1);
  expect(returned.yaw).toBeCloseTo(turned.yaw, 2);
  await page.waitForTimeout(450);
  const frames = (await metric(page)).frames;
  await page.waitForTimeout(350);
  expect((await metric(page)).frames).toBe(frames);
});

test("HTML controls follow the bottle between scroll sections without covering it", async ({
  page,
}) => {
  await page.locator("#hero-sculpture .cap-toggle").click();
  for (const selector of [
    "#ritual .note-layers",
    "#collection",
    "#selection-sculpture",
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
    const active = page.locator("[data-bottle-active]");
    await expect(active).toHaveCount(1);
    const touch = (await active.locator(".bottle-touch").boundingBox())!;
    const toolbar = (await active.locator(".bottle-toolbar").boundingBox())!;
    expect(toolbar.y).toBeGreaterThan(touch.y + touch.height);
    expect(toolbar.x).toBeGreaterThan(0);
    await active.locator(".spray-button").click();
  }
  await expect(page.locator(".scene-page")).toHaveAttribute(
    "data-notes",
    "revealed",
  );
});

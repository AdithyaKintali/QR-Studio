import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import fs from "node:fs";
async function download(page) {
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeEnabled();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const d = await event;
  const png = PNG.sync.read(fs.readFileSync(await d.path()));
  let code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!code) {
    const width = 320,
      small = new Uint8ClampedArray(width * width * 4);
    for (let y = 0; y < width; y++)
      for (let x = 0; x < width; x++) {
        const i =
          (Math.floor((y * png.height) / width) * png.width +
            Math.floor((x * png.width) / width)) *
          4;
        small.set(png.data.subarray(i, i + 4), (y * width + x) * 4);
      }
    code = jsQR(small, width, width);
  }
  expect(code, "PNG must decode").toBeTruthy();
  return { data: code.data, png };
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("all five payloads produce scannable downloaded PNGs", async ({
  page,
}) => {
  expect((await download(page)).data).toBe("https://example.com");
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByLabel("Your text").fill("Hello, 世界!");
  expect((await download(page)).data).toBe("Hello, 世界!");
  await page.getByRole("button", { name: "Email", exact: true }).click();
  await page.getByLabel("Email address").fill("hello@example.com");
  await page.getByLabel("Subject (optional)").fill("Hello & welcome");
  expect((await download(page)).data).toBe(
    "mailto:hello@example.com?subject=Hello%20%26%20welcome",
  );
  await page.getByRole("button", { name: "Phone", exact: true }).click();
  await page.getByLabel("Phone number").fill("+1 (415) 555-0123");
  expect((await download(page)).data).toBe("tel:+14155550123");
  await page.getByRole("button", { name: "Wi-Fi", exact: true }).click();
  await page.getByLabel("Network name").fill("Cafe;Guest");
  await page.getByLabel("Network password").fill("pass:word");
  expect((await download(page)).data).toBe(
    "WIFI:T:WPA;S:Cafe\\;Guest;P:pass\\:word;H:false;;",
  );
  await page.getByLabel("Security", { exact: true }).selectOption("nopass");
  expect((await download(page)).data).toBe(
    "WIFI:T:nopass;S:Cafe\\;Guest;H:false;;",
  );
});
test("invalid inputs block downloads and previews", async ({ page }) => {
  await page.getByLabel("Website URL").fill("javascript:alert(1)");
  await expect(page.getByRole("alert")).toContainText("http");
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".qr-preview svg")).toHaveCount(0);
  for (const [type, label, value] of [
    ["Text", "Your text", " "],
    ["Email", "Email address", "bad"],
    ["Phone", "Phone number", "123"],
    ["Wi-Fi", "Network name", ""],
  ]) {
    await page.getByRole("button", { name: type, exact: true }).click();
    await page.getByLabel(label, { exact: true }).fill(value);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download PNG", exact: true }),
    ).toBeDisabled();
  }
});
test("presets, patterns, export dimensions, ECC and warnings", async ({
  page,
}) => {
  for (const name of ["Classic", "Ocean", "Violet", "Midnight"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect((await download(page)).data).toBe("https://example.com");
  }
  for (const name of ["Square", "Rounded", "Dots", "Soft"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect((await download(page)).data).toBe("https://example.com");
  }
  await page.getByRole("tab", { name: "Advanced" }).click();
  await page.getByLabel("Export size").fill("512");
  for (const ecc of ["L", "M", "Q", "H"]) {
    await page
      .getByLabel("Error correction", { exact: true })
      .selectOption(ecc);
    expect((await download(page)).png.width).toBe(512);
  }
  await page.getByLabel("Margin / quiet zone").fill("0");
  await expect(page.locator(".scan-status")).toContainText(
    "at least 4 modules",
  );
  await page.getByLabel("Margin / quiet zone").fill("4");
  await page.getByRole("tab", { name: "Design", exact: true }).click();
  await page.getByLabel("Foreground color", { exact: true }).fill("#eeeeee");
  await expect(page.locator(".scan-status")).toContainText("contrast");
});
test("SVG matches preview and PNG; recent codes survive refresh", async ({
  page,
}) => {
  const { png } = await download(page);
  expect(png.width).toBe(1024);
  await page.getByLabel("Download format").selectOption("svg");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG", exact: true }).click();
  const d = await event;
  const svg = fs.readFileSync(await d.path(), "utf8");
  expect(svg).toContain("<svg");
  expect(svg).toContain('width="1024"');
  // Rasterize the downloaded SVG independently and compare it with PNG pixels.
  const base64 = Buffer.from(svg).toString("base64");
  const rgba = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return Array.from(
      c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
    );
  }, "data:image/svg+xml;base64," + base64);
  expect(Buffer.from(rgba).equals(png.data)).toBe(true);
  await page.reload();
  await expect(page.locator(".recent-card")).toHaveCount(1);
  await page.getByLabel("Website URL").fill("https://different.example");
  await page.locator(".recent-card").click();
  await expect(page.getByLabel("Website URL")).toHaveValue(
    "https://example.com",
  );
  await page.getByRole("button", { name: "Clear all" }).click();
  await page.reload();
  await expect(page.locator(".recent-card")).toHaveCount(0);
});
test("logo upload, scan, SVG embed and removal", async ({ page }) => {
  const logo = new PNG({ width: 50, height: 50 });
  for (let i = 0; i < logo.data.length; i += 4) {
    logo.data[i] = 20;
    logo.data[i + 1] = 90;
    logo.data[i + 2] = 70;
    logo.data[i + 3] = 255;
  }
  await page.getByRole("tab", { name: "Logo", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: PNG.sync.write(logo),
    });
  await expect(page.getByAltText("Uploaded logo")).toBeVisible();
  expect((await download(page)).data).toBe("https://example.com");
  await page.getByRole("tab", { name: "Advanced" }).click();
  await expect(
    page.getByLabel("Error correction", { exact: true }),
  ).toHaveValue("H");
  await expect(
    page.getByLabel("Error correction", { exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Download format").selectOption("svg");
  const e = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  expect(fs.readFileSync(await (await e).path(), "utf8")).toContain(
    "data:image/png",
  );
  await page.getByRole("tab", { name: "Logo", exact: true }).click();
  await page.getByRole("button", { name: "Remove logo" }).click();
  await expect(page.getByAltText("Uploaded logo")).toHaveCount(0);
});
test("responsive layout, theme persistence and clipboard fallback", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.getByRole("button", { name: "Copy image" })).toBeEnabled();
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { write: () => Promise.reject(Error()) },
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Copy image" }).click();
  await expect(page.getByRole("status")).toContainText("download the PNG");
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: "../../work/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "../../work/mobile.png", fullPage: true });
});

test('clipboard copies a PNG and storage failures are reported', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect(page.getByRole('button', { name: 'Copy image' })).toBeEnabled();
  await page.getByRole('button', { name: 'Copy image' }).click();
  await expect(page.getByRole('status')).toHaveText('QR image copied to clipboard');
  expect(await page.evaluate(async () => (await navigator.clipboard.read())[0].types)).toContain('image/png');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; });
  await page.getByRole('button', { name: 'Save to recents' }).click();
  await expect(page.getByRole('status')).toContainText('not saved');
});

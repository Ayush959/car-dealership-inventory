import { test, expect } from "@playwright/test";

for (const viewport of [
  { name: "compact desktop", width: 1000, height: 600 },
  { name: "mobile", width: 390, height: 600 },
]) {
  test(`logout stays reachable on ${viewport.name} and survives reload`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByLabel("Email address").fill("buyer@example.com");
    await page.getByLabel("Password", { exact: true }).fill("BuyerDemo123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
    await expect(page.getByRole("heading", { name: "Your next great drive." })).toBeVisible();

    const logout = page.locator(".topbar").getByRole("button", { name: "Sign out" });
    await expect(logout).toBeInViewport();
    await expect(logout).toHaveText("Sign out");
    await logout.click();

    await expect(page.getByRole("heading", { name: "Good to see you." })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("motorhaus-session"))).toBeNull();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Good to see you." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your next great drive." })).toHaveCount(0);
  });
}

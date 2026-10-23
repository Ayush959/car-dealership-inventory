import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("complete dealership workflow on desktop and mobile", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  fs.mkdirSync("../docs/screenshots", { recursive: true });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good to see you." }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/sign-in.png",
    fullPage: true,
  });
  await page.getByLabel("Email address").fill("admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("AdminDemo123!");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next great drive." }),
  ).toBeVisible();
  await expect(page.locator(".vehicle-card")).toHaveCount(8);
  await page.screenshot({
    path: "../docs/screenshots/inventory-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Search vehicles").fill("porsche");
  await expect(page.locator(".vehicle-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("Maximum price ($)").fill("50000");
  await expect(page.locator(".vehicle-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByRole("button", { name: "Add vehicle", exact: true }).click();
  await page.getByLabel("Make", { exact: true }).fill("Test");
  await page.getByLabel("Model", { exact: true }).fill("Roadster");
  await page.getByLabel("Price (USD)").fill("25000.25");
  await page.getByLabel("Quantity in stock").fill("1");
  await page.getByRole("button", { name: "Save vehicle" }).click();
  const card = page.locator(".vehicle-card").filter({ hasText: "Roadster" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Purchase", exact: true }).click();
  await page.getByRole("button", { name: "Confirm purchase" }).click();
  await expect(
    card.getByRole("button", { name: "Out of stock" }),
  ).toBeDisabled();
  await card.getByRole("button", { name: /Restock/ }).click();
  await page.getByLabel("Units to add").fill("3");
  await page.getByRole("button", { name: "Add stock" }).click();
  await expect(card.getByText("3 in stock")).toBeVisible();
  await card.getByRole("button", { name: /Edit/ }).click();
  await page.getByLabel("Price (USD)").fill("26000.50");
  await page.getByRole("button", { name: "Save vehicle" }).click();
  await expect(card.getByText("$26,000.50")).toBeVisible();
  await card.getByRole("button", { name: /Delete/ }).click();
  await page
    .getByRole("button", { name: "Delete vehicle", exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../docs/screenshots/inventory-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole("button", { name: "Sign out" }).click();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Browser Test");
  await page
    .getByLabel("Email address")
    .fill(`browser-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("BrowserPass123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next great drive." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add vehicle" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /Restock/ })).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your next great drive." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

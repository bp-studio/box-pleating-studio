import { expect, test } from "@playwright/test";

import type { BpsLocale } from "shared/frontend/locale";
import type { Composer } from "vue-i18n";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test.describe("I18n", () => {
	test.use({ locale: "zh-CN" });

	test("Detects user language", async ({ page }) => {
		const locator = page.locator("#divWelcome");
		await expect(locator).toBeVisible();
		await expect(locator).toContainText("欢迎使用");

		const i18nHandle = await page.evaluateHandle<Composer<Record<string, BpsLocale>>>("i18n");
		const emoji = () => page.evaluate(i18n => i18n.messages.value["zh-tw"].emoji(null!), i18nHandle);
		expect(await emoji()).toBe("🇭🇰");
	});

	test("Switch locale", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Settings" }).click();
		await page.getByRole("menuitem", { name: " 首选项", exact: true }).click();
		await page.getByLabel("Language").selectOption("ko");
		await page.getByRole("button", { name: "좋아요" }).click();
		const locator = page.locator("#divWelcome");
		await expect(locator).toContainText("시작");
	});
});

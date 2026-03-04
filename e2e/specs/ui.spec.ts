// Load only the necessary types to avoid conflict with DOM types
///<reference types="node/fs.d.ts"/>

import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";

import type { BpsLocale } from "app/shared/locale";
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
		const emoji = () => page.evaluate(i18n => i18n.messages.value["zh-tw"].emoji!(null!), i18nHandle);
		expect(await emoji()).toBe("🇭🇰");
	});

	test("Switch locale", async ({ page }) => {
		await page.getByRole("menuitem", { name: "Settings" }).click();
		await page.getByRole("menuitem", { name: "首选项", exact: true }).click();
		await page.getByLabel("Language").selectOption("ko");
		await page.getByRole("button", { name: "좋아요" }).click();
		const locator = page.locator("#divWelcome");
		await expect(locator).toContainText("시작");
	});
});

test.describe("Dropzone", () => {
	test("Display and open file", async ({ page }) => {
		const studio = new StudioPage(page);
		await studio.initialized();

		// Display dropzone
		await page.locator("body").dispatchEvent("dragover");
		const locale = JSON.parse(readFileSync("src/locale/en.json", "utf8"));
		const dropzone = page.getByText(locale.message.dropzone);
		await expect(dropzone).toBeVisible();

		// Drop a file
		const sample = readFileSync("test/samples/v04.session.sample.json", "utf8");
		const dataTransfer = await page.evaluateHandle(data => {
			const dt = new DataTransfer();
			const file = new File([data], "sample.json");
			dt.items.add(file);
			return dt;
		}, sample);
		await dropzone.dispatchEvent("drop", { dataTransfer });

		// Confirm file opened
		const locator = page.getByRole("tab");
		await expect(locator).toBeAttached();
	});
});

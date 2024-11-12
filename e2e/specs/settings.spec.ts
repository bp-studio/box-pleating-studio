import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils";

test("Migration from v0.6 settings", async ({ page }) => {
	await page.goto("/");
	await page.evaluate(setLocalStorage);
	await page.reload();
	const studio = new StudioPage(page);
	await studio.initialized();
	const storage = structuredClone(await page.evaluate(() => window.localStorage));
	const settings = JSON.parse(storage.settings);
	expect(settings).toHaveProperty("display");
});

function setLocalStorage(): void {
	localStorage.setItem("build", "1800");
	localStorage.setItem("last_log", "20230928");
	localStorage.setItem("locale", "en");
	localStorage.setItem("session", `{"jsons":[],"open":-1}`);
	localStorage.setItem("settings", `{"autoSave":true,"showDPad":true,"theme":"system","loadSessionOnQueue":false,"hotkey":{"v":{"t":"1","l":"2","zi":"X","zo":"Z"},"m":{"u":"W","d":"S","l":"A","r":"D"},"d":{"ri":"E","rd":"Q","hi":"sW","hd":"sS","wi":"sD","wd":"sA"},"n":{"d":"\\t","cn":"T","cp":"R","pn":"G","pp":"F"}},"showAxialParallel":true,"showGrid":true,"showHinge":true,"showRidge":true,"showLabel":true,"showDot":true,"showStatus":true,"colorScheme":{},"CP":{"reorient":false},"includeHiddenElement":false}`);
}

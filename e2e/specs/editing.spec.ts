import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils";

test.beforeEach(async ({ page }) => {
	await page.goto("/?project=XQAAAQAWFgAAAAAAAAA9iIrGlFOQhqZjfSU05W1sTbrXj2OO2Di07F3wTUuIHKWwWIAvMvK4MTf0rjd48wr67_BKtLQu3oJu1ZudFDoPDctjDeYBW_bLzDqDYH2Rxe8kQARbgAUolfH6STHwi9LwckXk9JYfSZuTX0F-RCohqwJeCAcxyOSTy2wF-WZcbJbUd7A1wbMu0ke1eozEHXz7VCnHPf6hZiHLlYBRzaj6ULRwA5glFyAkwNOHpb3MEf8vdJXp_Gxr93v6cAsV1aB1S1wh2gcHs3YHQ40jSsYfLR_ZgVuHgbRuorMy4_tVAjqoY-E9UN3se6yAkCCuPA2DTJaLOT-Qio6-G9j0K3yTmXyEMpAXIPDMcJ8UVHLN3d_GzU79a3pXiQ1dl0hCI-wcLVo8OX7c1dnxn57OxSUdvaVQknPwxnf-TZsDClyKHMlKU4N1oiMcw1-wTznz9o_glAXDVX6oy0w2qAREJnTTWu5BpX3-jcBTIFrIjjl8xOpKEtyMeWuU_aQ9zvMbBn7jY2ofpkLZurWnYg5M03KynBZbsSjn3jAb-AYaMFEMvtNJCkDe_cJGYxIaH1PcL6eUnrIX6Zeo-yIVfa3C2YEUAJnC-mpJcuNnZlGkrB_6F9ncntXoU9ewRKHWHycfwJFa7sOuErWFLEVIXxzNsCK9hhh8UyFZXcnPOUjRknb1KI_O070zta9OlUJG5naZWH4zF6Qa8n2QIgVtmCX9QkQV-uy1qxP7X8QXKqzGpn56bLJQtV5YNRx6jfsree6QFjRI-EoNbh_T9p5zTiOcEFA1jckucxGEvZJBsbRP0zPimVrxXeRawbvjhmk0y9SoYfJ_NX3QZxwQkZSgbXw3Eg76W4WPY-trAvGN2gn4DafD5W4KbAUnmJumviTdQQWR5nsEM18oqjUNzUUfLFz-ozRIxIwHIY2UoJ2FJRxqFizogkGoESFv3RHtGq6t3he_6KNYd5GMcHWuslM4Zc5UGFwAsRhwoib2ljvRcajEAjtkSl31_fX9kALCHjZx18HcIrR4uosKrt8FQkR0MLppF_O-MoyJ4AEQjWKpFVMf2ho_p7_tsck2-PSa5LbH1MxmWxw6elJ3QhCsIzxWz_upOC3UvqmAu8TUJo7m2R-QqRQcWrmdIkOTrAGKk88VpQ7hLndZClWA2EdZOigFhG_arlLM9WRK8ZQCvjN1E1Q_PM-tyNqxbWMw7GB3iWYmHtD3oLRPbZO8Q9fNmUNY9kWaLKKygiSYv3FOEmTtN2jhdmFuiTqHPwveJKkJC36klBLc-0ReJ4bsAHAI31r0F1s0JO_zlw4tsu4SagO2y27fHes30RDKMxxLsjEQ3JQPf_hUvQtCNwoB__VdCDg");
});

test("Subdivide grid", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	const iptWidth = page.locator("input[type=number]").first();
	await expect(iptWidth).toHaveValue("48");
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Subdivide grid$/ }).click();
	await expect(iptWidth).toHaveValue("96"); // Auto-wait
	await studio.mouse.click(79, 49);
	expect(await studio.getTag()).toBe("r16,20");
	await page.keyboard.press("Control+z");
	await expect(iptWidth).toHaveValue("48"); // Auto-wait
});

test("Rotate", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Rotate right$/ }).click();
	await studio.update();
	await studio.mouse.click(20, 33);
	expect(await studio.getTag()).toBe("f31");
});

test("Flip", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	await page.getByRole("menuitem", { name: "Edit" }).click();
	await page.getByRole("menuitem", { name: /Horizontal flip$/ }).click();
	await studio.update();
	await studio.mouse.click(2, 36);
	expect(await studio.getTag()).toBe("f19");
});

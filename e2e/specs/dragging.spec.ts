import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";
import { NewTree } from "../sample/sample";

import type { Page } from "@playwright/test";
import type { JFlap } from "shared/json";

async function drag(
	studio: StudioPage, from: IPoint, to: IPoint
): Promise<void> {
	await studio.mouse.move(from.x, from.y);
	await studio.page.mouse.down();
	await studio.mouse.move(to.x, to.y, { steps: 5 });
	await studio.page.mouse.up();

	// The update never completes if the Core crashes.
	const error = studio.page.getByText("An internal error occurred");
	await Promise.race([studio.update(), error.waitFor()]);
	await expect(error).toBeHidden();
}

async function getFlap(page: Page, id: number): Promise<JFlap> {
	return await page.evaluate(i => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bp = (window as any).bp;
		const flaps = bp.projects.current.value.design.layout.$flaps;
		return [...flaps].find(f => f.id == i).toJSON();
	}, id);
}

test("Ends the dragging of a new vertex that syncs its flap", async ({ page }) => {
	await page.goto(NewTree);
	const studio = new StudioPage(page);
	await expect(page.getByText("Tree structure view")).toBeInViewport();

	// Dragging vertex 3 also moves flap 3 in dragging mode, which changes the
	// structure of stretch 2,3 and caches its original repository in the Core.
	await drag(studio, { x: 12, y: 10 }, { x: 12, y: 9 });
	expect(await getFlap(page, 3)).toMatchObject({ x: 12, y: 9 });

	// Vertex 1 is on the path between flaps 2 and 3.
	await studio.mouse.click(8, 10);
	expect(await studio.getTag()).toBe("v1");
	await page.getByRole("button", { name: "Delete and join" }).click();
	await studio.update();

	// Dragging flap 3 back restores the original structure of the stretch. If
	// the cache had survived the previous dragging session, it would revive
	// the repository still referring to the deleted vertex 1.
	await page.keyboard.press("2"); // Switch to layout view
	await expect(page.getByRole("contentinfo")).toContainText("Flaps: 3");
	await drag(studio, { x: 12, y: 9 }, { x: 12, y: 10 });
	expect(await getFlap(page, 3)).toMatchObject({ x: 12, y: 10 });
});

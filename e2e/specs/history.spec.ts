import { expect, test } from "@playwright/test";

import { StudioPage } from "../utils/studioPage";
import { GuanYu } from "../sample/sample";

import type { Page } from "@playwright/test";
import type { Draggable } from "client/base/draggable";

test.beforeEach(({ page }) => page.goto(GuanYu));

/** Drags flap 19 from x=46 to x=40 in circles. */
async function dragInCircles(page: Page): Promise<StudioPage> {
	const studio = new StudioPage(page);
	await studio.layoutReady();

	expect(await studio.getCanUndo()).toBe(false);
	await studio.mouse.move(43, 43);
	await studio.mouse.down();
	expect(await studio.getTag()).toBe("f19");
	expect(await studio.getX()).toBe(46);

	// Move the mouse in 3 circles around (27,25) with radius 10
	const cx = 27, cy = 25, r = 10, laps = 3, steps = 36;
	for(let i = 0; i <= steps * laps; i++) {
		const angle = (2 * Math.PI * i) / steps;
		// eslint-disable-next-line no-await-in-loop
		await studio.mouse.move(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
	}
	expect(await studio.getX()).toBe(40);
	expect(await studio.getCanUndo()).toBe(true);
	return studio;
}

test("Dragging session", async ({ page }) => {
	const studio = await dragInCircles(page);
	await studio.mouse.up();

	// Undo dragging, possibly before the updates of the dragging complete
	await page.keyboard.press("Control+z");
	await studio.update();

	// Should restore everything
	expect(await studio.getX()).toBe(46);
	expect(await studio.getCanUndo()).toBe(false);
	expect(await studio.getCanRedo()).toBe(true);
});

test("Undo is ignored during dragging", async ({ page }) => {
	const studio = await dragInCircles(page);

	await page.keyboard.press("Control+z");
	await studio.update();
	expect(await studio.getX()).toBe(40);

	await studio.mouse.up();
	await studio.update();
	expect(await studio.getX()).toBe(40);
	expect(await studio.getCanUndo()).toBe(true);
});

test("Undo right after an update is sent", async ({ page }) => {
	const studio = new StudioPage(page);
	await studio.layoutReady();
	await studio.mouse.move(43, 43);
	await studio.mouse.down();
	expect(await studio.getX()).toBe(46);
	await studio.mouse.move(40, 40);
	await studio.update();

	// Move once more and undo in the same task,
	// so that the undo is requested before the update completes.
	const moved = await page.evaluate(() => {
		const pt = bp.resolveCoordinate({ x: 37, y: 37 });
		const init = { clientX: pt.x, clientY: pt.y };
		document.dispatchEvent(new MouseEvent("mousemove", init));
		document.dispatchEvent(new MouseEvent("mouseup", init));
		const x = (bp.selection.selections[0] as Draggable).$location.x;
		bp.history.undo();
		return x;
	});
	expect(moved).toBe(40);
	await studio.update();
	expect(await studio.getX()).toBe(46);
	expect(await studio.getCanUndo()).toBe(false);
	expect(await studio.getCanRedo()).toBe(true);

	// The whole dragging is redone
	await page.evaluate(() => bp.history.redo());
	await studio.update();
	expect(await studio.getX()).toBe(40);
	expect(await studio.getCanUndo()).toBe(true);
	expect(await studio.getCanRedo()).toBe(false);
});

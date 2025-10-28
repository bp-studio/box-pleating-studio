import { expect } from "@playwright/test";

import type { Draggable } from "client/base/draggable";
import type { JSHandle, Mouse, Page } from "@playwright/test";
import type * as Studio from "client/main";

type BPStudio = typeof Studio;

export class StudioPage {

	/** A {@link Proxy} of {@link Mouse} that translates grid coordinates. */
	public readonly mouse: Mouse;

	constructor(public readonly page: Page) {
		this.mouse = new Proxy(this.page.mouse, {
			get: (target, p, receiver) => {
				if(p == "click" || p == "move") {
					return async (...args: Parameters<Mouse[typeof p]>): Promise<void> => {
						const bpHandle = await this.getHandle();
						const pt = await this.page.evaluate(
							([bp, x, y]) => bp.resolveCoordinate({ x, y }),
							[bpHandle, args[0], args[1]] as const
						);
						// eslint-disable-next-line require-atomic-updates
						args[0] = pt.x; args[1] = pt.y;
						await Reflect.apply(target[p], receiver, args);
					};
				}
				return Reflect.get(target, p, receiver);
			},
		});
	}

	public async initialized(): Promise<void> {
		const menu = this.page.getByRole("menubar");
		await expect(menu).toBeInViewport();
		await expect(menu.getByRole("menuitem").first()).toBeEnabled();
	}

	/** Create a new project and wait for the workspace to be ready. */
	public async newProject(): Promise<void> {
		await this.page.getByRole("menuitem", { name: "File" }).click();
		await this.page.getByRole("menuitem", { name: /New project$/ }).click();
		await expect(this.page.getByRole("tab")).toBeAttached({ timeout: 10000 });
		await expect(this.page.getByText("Tree structure view")).toBeInViewport();
	}

	public async layoutReady(): Promise<void> {
		await expect(this.page.getByRole("tab")).toBeAttached({ timeout: 10000 });
		await expect(this.page.getByText("Layout view")).toBeInViewport();
	}

	/** Wait for the core to complete updating */
	public async update(): Promise<void> {
		const bpHandle = await this.getHandle();
		await this.page.evaluate(
			bp => bp.projects.current.value!.design.$batchUpdateManager.$updateComplete,
			bpHandle
		);
	}

	/** Get the x-coordinate of the location of the selected {@link Draggable}. */
	public async getX(): Promise<number> {
		const bpHandle = await this.getHandle();
		return await this.page.evaluate(
			bp => (bp.selection.selections[0] as Draggable)?.$location.x ?? NaN,
			bpHandle
		);
	}

	public async getTag(): Promise<string | undefined> {
		const bpHandle = await this.getHandle();
		return await this.page.evaluate(
			bp => bp.selection.selections[0]?.$tag,
			bpHandle
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _handle: JSHandle<BPStudio> | undefined;

	private async getHandle(): Promise<JSHandle<BPStudio>> {
		return this._handle ??= await this.page.evaluateHandle<typeof Studio>("bp");
	}
}

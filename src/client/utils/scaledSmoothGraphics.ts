import { SmoothGraphics } from "pixi.js";

import ProjectService from "client/services/projectService";

//=================================================================
/**
 * {@link ScaledSmoothGraphics} is intended to solve the issue addressed in
 * [graphics-smooth#23](https://github.com/pixijs/graphics-smooth/issues/23).
 * The number of segments of a circle in {@link SmoothGraphics} is decided by
 * the radius in local coordinates, so we draw them in a larger scale instead.
 */
//=================================================================
export class ScaledSmoothGraphics extends SmoothGraphics {

	public override circle(x: number, y: number, radius: number): this {
		const s = ProjectService.scale.value;
		this.scale.set(1 / s);
		return super.circle(x * s, y * s, radius * s);
	}

	public override roundRect(
		x: number, y: number, width: number, height: number, radius?: number
	): this {
		const s = ProjectService.scale.value;
		this.scale.set(1 / s);
		const r = radius === undefined ? undefined : radius * s;
		return super.roundRect(x * s, y * s, width * s, height * s, r);
	}
}

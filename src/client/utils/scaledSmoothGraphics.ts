import { SmoothGraphics } from "@pixi/graphics-smooth";

import ProjectService from "client/services/projectService";

//=================================================================
/**
 * {@link ScaledSmoothGraphics} is intended to solve the issue
 * addressed in [graphics-smooth#23](https://github.com/pixijs/graphics-smooth/issues/23).
 * Once that issue is resolved, this class may be dropped and
 * be replaced by {@link SmoothGraphics} directly.
 */
//=================================================================
export class ScaledSmoothGraphics extends SmoothGraphics {

	public override drawCircle(x: number, y: number, radius: number): this {
		const s = ProjectService.scale.value;
		this.scale.set(1 / s);
		return super.drawCircle(x * s, y * s, radius * s);
	}

	public override drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): this {
		const s = ProjectService.scale.value;
		this.scale.set(1 / s);
		return super.drawRoundedRect(x * s, y * s, width * s, height * s, radius * s);
	}
}

import { SmoothGraphics } from "@pixi/graphics-smooth";

import { dist } from "shared/types/geometry";
import { style } from "client/services/styleService";

import type { SmoothGraphicsLike } from "client/utils/contourUtil";
import type { LINE_JOIN } from "@pixi/graphics/lib/const";
import type { Path, Polygon } from "shared/types/geometry";
import type { InvalidJunction } from "core/design/layout/junction/invalidJunction";

const THRESHOLD = 0.4;

//=================================================================
/**
 * Draws an {@link InvalidJunction}.
 */
//=================================================================
export class Junction extends SmoothGraphics {

	public $polygon: Polygon;

	constructor(polygon: Polygon) {
		super();
		this.$polygon = polygon;
		this.alpha = style.junction.alpha;
	}

	public $draw(maxWidth: number, target: SmoothGraphicsLike = this): void {
		const color = style.junction.color;
		target.clear();
		for(const path of this.$polygon) {
			if(!path.length) return;

			// Decide the stroke width based on the narrowness of the shape.
			const narrowness = getNarrowness(path);
			if(narrowness < THRESHOLD) {
				target.lineStyle({
					width: Math.min(2 / narrowness, maxWidth),
					join: "bevel" as LINE_JOIN,
					color,
				});
			} else {
				target.lineStyle(0);
			}

			target.beginFill(color);
			target.moveTo(path[0].x, path[0].y);
			for(let i = 1; i < path.length; i++) {
				const p = path[i];
				if(p.arc) target.arcTo(p.arc.x, p.arc.y, p.x, p.y, p.r!);
				else target.lineTo(p.x, p.y);
			}
			const p = path[0];
			if(p.arc) target.arcTo(p.arc.x, p.arc.y, p.x, p.y, p.r!);
			target.closePath();
			target.endFill();
		}
	}
}

/** Returns the narrowness of the shape for a path consists of two arcs. */
function getNarrowness(path: Path): number {
	if(path.length > 2) return NaN;
	const [p1, p2] = path;
	return dist(p1.arc!, p2.arc!) / dist(p1, p2);
}

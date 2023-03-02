import { SmoothGraphics } from "@pixi/graphics-smooth";

import { dist } from "shared/types/geometry";
import { PIXI } from "client/screen/inspector";
import { style } from "client/services/styleService";

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

	public $draw(maxWidth: number): void {
		this.clear();
		for(const path of this.$polygon) {
			if(!path.length) return;

			// Decide the stroke width based on the narrowness of the shape.
			const narrowness = getNarrowness(path);
			if(narrowness < THRESHOLD) {
				this.lineStyle({
					width: Math.min(2 / narrowness, maxWidth),
					color: style.junction.color,
					join: "bevel" as LINE_JOIN,
				});
			} else {
				this.lineStyle(0);
			}

			this.beginFill(style.junction.color);
			this.moveTo(path[0].x, path[0].y);
			for(let i = 1; i < path.length; i++) {
				const p = path[i];
				if(p.arc) this.arcTo(p.arc.x, p.arc.y, p.x, p.y, p.r!);
				else this.lineTo(p.x, p.y);
			}
			const p = path[0];
			if(p.arc) this.arcTo(p.arc.x, p.arc.y, p.x, p.y, p.r!);
			this.closePath();
			this.endFill();
		}
	}
}

/** Returns the narrowness of the shape for a path consists of two arcs. */
function getNarrowness(path: Path): number {
	if(path.length > 2) return NaN;
	const [p1, p2] = path;
	return dist(p1.arc!, p2.arc!) / dist(p1, p2);
}

if(DEBUG_ENABLED) PIXI.Junction = Junction;

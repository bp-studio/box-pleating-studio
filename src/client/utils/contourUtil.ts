import type { SvgGraphics } from "client/svg/svgGraphics";
import type { Graphics } from "@pixi/graphics";
import type { Contour, ILine, Path } from "shared/types/geometry";
import type { SmoothGraphics } from "@pixi/graphics-smooth";

export type SmoothGraphicsLike = SmoothGraphics | SvgGraphics;
export type GraphicsLike = Graphics | SmoothGraphicsLike;

/** Draw the lines of a contour (no filling) */
export function drawContours(graphics: GraphicsLike, contours: readonly Contour[]): void {
	for(const contour of contours) {
		drawPath(graphics, contour.outer);
		if(contour.inner) {
			for(const inner of contour.inner) drawPath(graphics, inner);
		}
	}
}

/**
 * Fill a contour.
 *
 * The filling API of Pixi consists of low-level methods such as {@link Graphics.beginFill} and {@link Graphics.beginHole}.
 * The premise of these methods is that we have to pair up the outer and inner paths of the polygons explicitly.
 * (There's no need for orientation though, as Pixi will do it itself)
 * Once this premise is met, Pixi will use the library [earcut](https://github.com/mapbox/earcut) to triangulate the polygon,
 * thereby reducing the general filling to triangle filling.
 * Accordingly, the library is super efficient, so probably there's no need to further optimize it.
 */
export function fillContours(graphics: GraphicsLike, contours: readonly Contour[], color: number): void {
	for(const contour of contours) {
		graphics.beginFill(color);
		drawPath(graphics, contour.outer);
		graphics.endFill();
		if(contour.inner) {
			graphics.beginHole();
			for(const inner of contour.inner) {
				drawPath(graphics, inner);
			}
			graphics.endHole();
		}
	}
}

/** Draw a path. */
export function drawPath(graphics: GraphicsLike, path: Path): void {
	if(!path.length) return;
	graphics.moveTo(path[0].x, path[0].y);
	for(let i = 1; i < path.length; i++) {
		graphics.lineTo(path[i].x, path[i].y);
	}
	graphics.closePath();
}

export function drawLines(graphics: GraphicsLike, lines: readonly ILine[]): void {
	for(const l of lines) {
		graphics.moveTo(l[0].x, l[0].y).lineTo(l[1].x, l[1].y);
	}
}

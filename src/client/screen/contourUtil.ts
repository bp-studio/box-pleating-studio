import type { SmoothGraphics } from "@pixi/graphics-smooth";
import type { Graphics } from "pixi.js";
import type { Contour, Path } from "shared/types/geometry";

export type GraphicsLike = Graphics | SmoothGraphics;

export function drawContours(graphics: GraphicsLike, contours: Contour[]): void {
	for(const contour of contours) drawContour(graphics, contour);
}

export function drawContour(graphics: GraphicsLike, contour: Contour): void {
	drawPath(graphics, contour.outer);
	if(contour.inner) {
		for(const inner of contour.inner) drawPath(graphics, inner);
	}
}

export function drawPath(graphics: GraphicsLike, path: Path): void {
	if(!path.length) return;
	graphics.moveTo(path[0].x, path[0].y);
	for(let i = 1; i < path.length; i++) {
		graphics.lineTo(path[i].x, path[i].y);
	}
	graphics.closePath();
}

/**
 * 將輪廓組加以填色。
 *
 * Pixi 採用的填色 API 是由比較低階的 {@link Graphics.beginFill} 和 {@link Graphics.beginHole} 等方法組成的，
 * 這些方法的使用有個前提是我們必須正確地多邊形的外圍其內部的洞配對好
 * （定向倒是不需要，Pixi 自己會做一次）。
 * 有做到這點之後，Pixi 會利用 earcut 程式庫把多邊形加以三角化，
 * 以便把一般的填色問題化簡成對三角形的填色。
 * 該程式庫據稱有極高的效能，所以應該不太需要幫它進一步優化。
 */
export function fillContours(graphics: GraphicsLike, contours: Contour[], color: number): void {
	for(const contour of contours) {
		graphics.beginFill(color);
		drawPath(graphics, contour.isHole ? contour.inner![0] : contour.outer);
		graphics.endFill();

		if(contour.isHole) {
			if(contour.outer.length) {
				graphics.beginHole();
				drawPath(graphics, contour.outer);
				graphics.endHole();
			}
		} else if(contour.inner) {
			graphics.beginHole();
			for(const inner of contour.inner) {
				drawPath(graphics, inner);
			}
			graphics.endHole();
		}
	}
}

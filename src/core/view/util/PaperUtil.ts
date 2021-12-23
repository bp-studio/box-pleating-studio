import { Point, PolyBool } from "bp/math";
import * as paper from "paper";
import type { Line } from "bp/math";

//////////////////////////////////////////////////////////////////
/**
 * 這個靜態類別提供了一些 paper.js 相關的工具。
 */
//////////////////////////////////////////////////////////////////

export namespace PaperUtil {

	/**
	 * 替換掉一個 {@link paper.CompoundPath} 的內容。
	 * @param target 要替換的目標物件
	 * @param source 替換內容的來源
	 * @param clone 是否要將來源複製一份，還是直接代入
	 */
	export function $replaceContent(
		target: paper.CompoundPath, source: paper.PathItem, clone: boolean): void {
		target.removeChildren();
		if(source instanceof paper.CompoundPath) {
			target.copyContent(source);
		} else {
			if(clone) source = source.clone({ insert: false });
			target.addChild(source);
		}
	}

	export function $setRectangleSize(
		rect: paper.Path.Rectangle, width: number, height: number): void {
		rect.segments[1].point.set(width, 0);
		rect.segments[2].point.set(width, height);
		rect.segments[3].point.set(0, height);
	}

	/** 把一個 {@link paper.CompoundPath} 加入指定兩點定義的線段 */
	export function $addLine(
		path: paper.CompoundPath, p1: Point | paper.Point, p2: Point | paper.Point): void {
		if(p1 instanceof Point) p1 = p1.$toPaper();
		if(p2 instanceof Point) p2 = p2.$toPaper();
		path.moveTo(p1);
		path.lineTo(p2);
	}

	/** 把一個 {@link paper.CompoundPath} 的內容替換成傳入的直線陣列組 */
	export function $setLines(path: paper.CompoundPath, ...lines: (readonly Line[])[]): void {
		path.removeChildren();
		for(let set of lines) for(let l of set) PaperUtil.$addLine(path, l.p1, l.p2);
	}

	export function $unite(p1: paper.PathItem, p2: paper.PathItem): paper.PathItem {
		if(p1.isEmpty()) return p2;
		else return p1.unite(p2, { insert: false });
	}

	export const $black = new paper.Color('black');
	export const $red = new paper.Color('red');

	export function $fromShape(shape: PolyBool.Shape): paper.Path[] {
		let poly = PolyBool.toPolygon(shape);
		return poly.regions.map(r => new paper.Path({
			segments: r,
			closed: true,
		}));
	}
}

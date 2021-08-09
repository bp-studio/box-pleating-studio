
interface Polygon {
	regions: PolyBool.Point[][];
	inverted: boolean;
}

namespace PolyBool {

	export type Point = [number, number];
	export type Path = Point[];

	export function compare(shape1: Shape, shape2: Shape): boolean {
		if(!shape1 && shape2) return false;
		return fastCompare(shape1, shape2);
	}

	/** 儲存轉換的路徑便重複比較 */
	const compareCache = new WeakMap<Shape, Path[]>();

	function getCompareRegions(shape: Shape): Path[] {
		let path = compareCache.get(shape);
		if(!path) {
			path = segmentChainer(shape.segments);
			compareCache.set(shape, path);
		}
		return path;
	}

	/**
	 * 新版比較是純粹比較化簡過的多邊形是否頂點集相同，
	 * 這在理論上有可能會出現偽陽結果，但在實務上不可能，
	 * 因為偽陽結果表示兩個多邊形的頂點集相同但是順序上不同，
	 * 但是這邊的實務上不可能出現形狀那麼奇怪的多邊形。
	 *
	 * 新版的比較比較版的速度快了一倍以上。
	 */
	function fastCompare(shape1: Shape, shape2: Shape): boolean {
		let p1 = getCompareRegions(shape1), p2 = getCompareRegions(shape2);
		if(p1.length != p2.length) return false;
		let set = new Set<string>();
		for(let p of p1) set.add(p.toString());
		for(let p of p2) if(!set.has(p.toString())) return false;
		return true;
	}

	// 這個是舊的比較，其原理是完全確定兩個多邊形抵銷之後結果為空。
	// function slowCompare(shape1: Shape, shape2: Shape): boolean {
	// 	let combined = combine(shape1, shape2);
	// 	let xor = SegmentSelector.xor(combined.combined);
	// 	return xor.length == 0;
	// }

	export function union(shapes: Shape[]): Shape {
		let seg = shapes[0];
		for(let i = 1; i < shapes.length; i++) {
			let combined = combine(seg, shapes[i]);
			seg = {
				segments: SegmentSelector.union(combined.combined),
				inverted: combined.inverted1 || combined.inverted2,
			};
		}
		return seg;
	}

	export function difference(shape1: Shape, shape2: Shape): Shape {
		let combined = combine(shape1, shape2);
		return {
			segments: SegmentSelector.difference(combined.combined),
			inverted: combined.inverted1 && !combined.inverted2,
		};
	}

	export interface Shape {
		segments: Segment[];
		inverted: boolean;
	}

	export type compare = 0 | 1 | -1;

	export function toShape(poly: Polygon): Shape {
		const core = new SegmentCore();
		poly.regions.forEach(r => core.addRegion(r));
		const result = {
			segments: core.calculate(poly.inverted),
			inverted: poly.inverted,
		};
		return result;
	}

	export function toPolygon(shape: Shape): Polygon {
		const result = {
			regions: getCompareRegions(shape),
			inverted: shape.inverted,
		};
		return result;
	}

	interface Combined {
		combined: Segment[];
		inverted1: boolean;
		inverted2: boolean;
	}

	function combine(shape1: Shape, shape2: Shape): Combined {
		let i3 = new CombineCore();
		return {
			combined: i3.combine(
				shape1.segments, shape1.inverted,
				shape2.segments, shape2.inverted
			),
			inverted1: shape1.inverted,
			inverted2: shape2.inverted,
		};
	}
}

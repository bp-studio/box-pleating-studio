
interface Polygon {
	regions: PolyBool.Point[][];
	inverted: boolean;
}

namespace PolyBool {

	export type Point = [number, number];
	export type Path = Point[];

	export function compare(shape1: Shape, shape2: Shape): boolean {
		if(!shape1 && shape2) return false;
		let combined = combine(shape1, shape2);
		return SegmentSelector.xor(combined.combined).length == 0;
	}

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
		let i = new SegmentCore();
		poly.regions.forEach(r => i.addRegion(r));
		return {
			segments: i.calculate(poly.inverted),
			inverted: poly.inverted,
		};
	}

	export function toPolygon(shape: Shape): Polygon {
		return {
			regions: segmentChainer(shape.segments),
			inverted: shape.inverted,
		};
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

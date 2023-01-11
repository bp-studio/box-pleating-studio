import { SegmentType } from "./segment";

import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link AALineSegment} 代表一個 axis-aligned 線段。
 */
//=================================================================

export class AALineSegment implements ISegment {

	public readonly $type = SegmentType.AALine;
	public readonly $isHorizontal: boolean;
	public readonly $polygon: number;
	public $start: Readonly<IPoint>;
	public $end: Readonly<IPoint>;

	constructor(start: IPoint, end: IPoint, polygon: number) {
		this.$start = start;
		this.$end = end;
		this.$polygon = polygon;
		this.$isHorizontal = start.y === end.y;
	}

	$subdivide(point: IPoint, oriented: boolean): ISegment {
		let newSegment: ISegment;
		if(oriented) {
			newSegment = new AALineSegment(point, this.$end, this.$polygon);
			this.$end = point;
		} else {
			newSegment = new AALineSegment(this.$start, point, this.$polygon);
			this.$start = point;
		}
		return newSegment;
	}
}

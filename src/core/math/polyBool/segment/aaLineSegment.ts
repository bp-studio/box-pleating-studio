import type { ISegment } from "./segment";

//=================================================================
/**
 * {@link AALineSegment} 代表一個 axis-aligned 線段。
 */
//=================================================================

export class AALineSegment implements ISegment {

	public readonly $isHorizontal: boolean;
	public readonly $polygon: number;
	public $start: IPoint;
	public $end: IPoint;

	constructor(start: IPoint, end: IPoint, polygon: number) {
		this.$start = start;
		this.$end = end;
		this.$polygon = polygon;
		this.$isHorizontal = start.y === end.y;
	}
}

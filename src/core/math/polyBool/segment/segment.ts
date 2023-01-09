
export interface ISegment {
	/** 線段的起點 */
	$start: IPoint;

	/** 線段的終點 */
	$end: IPoint;

	/** 線段所屬的多邊形索引 */
	readonly $polygon: number;
}

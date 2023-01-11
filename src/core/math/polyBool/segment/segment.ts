
export enum SegmentType {
	AALine = 1,
	Arc = 2,
}

export interface ISegment {
	/** 線段類別 */
	$type: SegmentType;

	/** 線段的起點 */
	$start: Readonly<IPoint>;

	/** 線段的終點 */
	$end: Readonly<IPoint>;

	/** 線段所屬的多邊形索引 */
	readonly $polygon: number;

	/**
	 * 在指定的點上細分一個線段，然後傳回切出的新線段
	 * @param point 細分的位置
	 * @param oriented 切出的方向是否跟線段本身的定向一致
	 */
	$subdivide(point: IPoint, oriented: boolean): ISegment;
}

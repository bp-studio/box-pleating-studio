import { minComparator, maxComparator } from "shared/data/heap/mutableHeap";
import { AABBSide } from "./aabbSide";

/** 這個的順序是參考 CSS 當中的順序 */
export enum Side {
	_top,
	_right,
	_bottom,
	_left,
}

const SIDES = [Side._top, Side._right, Side._bottom, Side._left];

//=================================================================
/**
 * {@link AABB}（Axis-Aligned Bounding Box）是一個正交矩形範圍。
 * 它是由四個 {@link AABBSide} 所構成，而其方法大多都是封裝這四個元件的對應方法。
 *
 * 嚴格來說它有兩種情況：自身為最下層 {@link AABB}，此時它的邊界為自變數；
 * 又或者它非最下層 {@link AABB}，此時它的邊界為所有下層 {@link AABB}（加上它們的間距）聯集之結果。
 *
 * 由於 {@link AABBSide} 裡面使用了堆積結構來進行動態更新，
 * 無論下層的 {@link AABB} 如何變更，它都能快速地確保自己更新到了正確的邊界。
 */
//=================================================================

export class AABB {

	private readonly _sides: Record<Side, AABBSide>;

	constructor() {
		this._sides = [
			new AABBSide(maxComparator), // top
			new AABBSide(maxComparator), // right
			new AABBSide(minComparator), // bottom
			new AABBSide(minComparator), // left
		];
	}

	public $intersects(that: AABB, gap: number): boolean {
		return this._sides[Side._left].$value - gap < that._sides[Side._right].$value &&
			this._sides[Side._right].$value + gap > that._sides[Side._left].$value &&
			this._sides[Side._top].$value + gap > that._sides[Side._bottom].$value &&
			this._sides[Side._bottom].$value - gap < that._sides[Side._top].$value;
	}

	public $update(top: number, right: number, bottom: number, left: number): void {
		this._sides[Side._top].$value = top;
		this._sides[Side._right].$value = right;
		this._sides[Side._bottom].$value = bottom;
		this._sides[Side._left].$value = left;
	}

	public $setMargin(m: number): void {
		this._sides[Side._top].$margin = m;
		this._sides[Side._right].$margin = m;
		this._sides[Side._bottom].$margin = -m;
		this._sides[Side._left].$margin = -m;
	}

	public $get(): number[] {
		return [
			this._sides[Side._top].$value,
			this._sides[Side._right].$value,
			this._sides[Side._bottom].$value,
			this._sides[Side._left].$value,
		];
	}

	public $addChild(child: AABB): boolean {
		let updated = false;
		for(const side of SIDES) {
			if(this._sides[side].$addChild(child._sides[side])) {
				updated = true;
			}
		}
		return updated;
	}

	public $removeChild(child: AABB): boolean {
		let updated = false;
		for(const side of SIDES) {
			if(this._sides[side].$removeChild(child._sides[side])) {
				updated = true;
			}
		}
		return updated;
	}

	public $updateChild(child: AABB): boolean {
		let updated = false;
		for(const side of SIDES) {
			if(this._sides[side].$updateChild(child._sides[side])) {
				updated = true;
			}
		}
		return updated;
	}
}

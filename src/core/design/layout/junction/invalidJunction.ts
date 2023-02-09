import { RRIntersection } from "core/math/polyBool/intersection/rrIntersection";

import type { Polygon } from "shared/types/geometry";
import type { ITreeNode } from "core/design/context";
import type { invalidJunctionTask } from "../../tasks/invalidJunction";

const intersection = new RRIntersection();

//=================================================================
/**
 * {@link InvalidJunction} 代表一個非法的重疊。
 */
//=================================================================

export class InvalidJunction {

	/** 第一個角片 */
	public readonly $a: ITreeNode;

	/** 第二個角片 */
	public readonly $b: ITreeNode;

	public readonly $valid = false;

	/** 同樣的非法重疊是否已經被繪製過了 */
	public $processed: boolean = false;

	/** 兩個角片之間的距離 */
	private readonly _dist: number;

	constructor(a: ITreeNode, b: ITreeNode, d: number) {
		this.$a = a;
		this.$b = b;
		this._dist = d - a.$length - b.$length;
	}

	/**
	 * 計算並傳回非法重疊的多邊弧形區域。
	 *
	 * 當然這一段的計算也可以在建構式裡面直接算完，
	 * 但是這邊故意設計成在 {@link invalidJunctionTask} 裡面統一進行，
	 * 以方便觀察這一段的效能。
	 */
	public $getPolygon(): Polygon {
		const A = this.$a.$AABB, B = this.$b.$AABB;
		const result = intersection.$get(A.$toRoundedRect(0), B.$toRoundedRect(this._dist));
		if(this._dist > 0) result.push(...intersection.$get(A.$toRoundedRect(this._dist), B.$toRoundedRect(0)));

		this.$processed = true;
		return result;
	}
}

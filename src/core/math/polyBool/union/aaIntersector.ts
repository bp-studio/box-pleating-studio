import { Intersector } from "../intersector";

import type { StartEvent } from "../event";

//=================================================================
/**
 * {@link AAIntersector} 類別負責處理 AA 線段的交點。
 */
//=================================================================

export class AAIntersector extends Intersector {

	/** 是否檢查同一個多邊形的自我相交 */
	public $checkSelfIntersection: boolean = false;

	/**
	 * 找出邊可能的交點，並且在必要的時候對既有的邊進行細分、加入新的事件。
	 * @param ev1 第一條邊（根據在 {@link _status} 中的順序）
	 * @param ev2 第二條邊（根據在 {@link _status} 中的順序）
	 */
	protected _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		if(!this.$checkSelfIntersection && ev1.$segment.$polygon === ev2.$segment.$polygon) return;
		this._processAALineSegments(ev1, ev2);
	}
}

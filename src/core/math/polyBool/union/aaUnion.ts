import { xyComparator } from "shared/types/geometry";
import { Chainer } from "../chainer/chainer";
import { AALineSegment } from "../segment/aaLineSegment";
import { AAIntersector } from "./aaIntersector";
import { AAEventProvider } from "./aaEventProvider";
import { PolyBool } from "../polyBool";

import type { EndEvent } from "../event";
import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link AAUnion} 類別負責計算一些 {@link Polygon} 的聯集，
 * 其前提是邊全都是 axis-aligned、且其 subpath 都有正確定向。
 *
 * 基於效能考量，這個類別並不會針對這些條件進行檢查，
 * 所以如果輸入條件不符合要求將會產生無法預期的結果。
 */
//=================================================================

export class AAUnion extends PolyBool {

	constructor(checkSelfIntersection: boolean = false, chainer: Chainer | undefined = undefined) {
		super(new AAEventProvider(), AAIntersector, chainer || new Chainer());
		(this._intersector as AAIntersector).$checkSelfIntersection = checkSelfIntersection;
	}

	/** 產生聯集的多邊形 */
	public override $get(...components: Polygon[]): Polygon {
		this._initialize(components);
		return super.$get();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 保護方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 處理一個終點事件 */
	protected _processEnd(event: EndEvent): void {
		const start = event.$other;
		if(!start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 私有方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 初始化；重設一些變數並且載入所有初始的事件 */
	private _initialize(components: Polygon[]): void {
		this._collectedSegments.length = 0;
		for(let i = 0; i < components.length; i++) {
			const c = components[i];
			for(const path of c) {
				for(let j = 0; j < path.length; j++) {
					const p1 = path[j], p2 = path[(j + 1) % path.length];
					const segment = new AALineSegment(p1, p2, i);
					const entering = xyComparator(p1, p2) < 0;
					if(entering) this._addSegment(p1, p2, segment, 1);
					else this._addSegment(p2, p1, segment, -1);
				}
			}
		}
	}
}

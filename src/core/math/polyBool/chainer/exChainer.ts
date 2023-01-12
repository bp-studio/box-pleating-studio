import { Chainer } from "./chainer";

import type { ISegment } from "../segment/segment";
import type { Path } from "shared/types/geometry";

//=================================================================
/**
 * {@link ExChainer} 是膨脹操作專用的 {@link Chainer}，
 * 它同時追蹤產生的每一個多邊形跟原有的多邊形之間的關係。
 */
//=================================================================

export class ExChainer extends Chainer {

	/** 每一條 chain 已知的來源索引之集合 */
	private _temp: Set<number>[] = [];

	protected override _chainToPath(id: number, segment: ISegment): Path {
		const path = super._chainToPath(id, segment);
		path.from = [...this._temp[id]];
		return path;
	}

	protected override _connectChain(head: number, tail: number, segment: ISegment): void {
		super._connectChain(head, tail, segment);
		for(const n of this._temp[tail]) this._temp[head].add(n);
	}

	protected override _append(segment: ISegment, id: number): void {
		super._append(segment, id);
		this._temp[id].add(segment.$polygon);
	}

	protected override _prepend(segment: ISegment, id: number): void {
		super._prepend(segment, id);
		this._temp[id].add(segment.$polygon);
	}

	protected override _createChain(segment: ISegment): void {
		super._createChain(segment);
		this._temp[this._chains] = new Set();
		this._temp[this._chains].add(segment.$polygon);
	}
}

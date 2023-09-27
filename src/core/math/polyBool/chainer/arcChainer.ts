import { Chainer } from "./chainer";
import { SegmentType } from "../segment/segment";

import type { ArcPath, IArcPoint } from "shared/types/geometry";
import type { ISegment } from "../segment/segment";
import type { ArcSegment } from "../segment/arcSegment";

//=================================================================
/**
 * {@link ArcChainer} chains those polygons that might contain {@link ArcSegment}s.
 */
//=================================================================

export class ArcChainer extends Chainer<ArcPath> {

	protected override _chainToPath(id: number, segment: ISegment): ArcPath {
		const path = super._chainToPath(id, segment);
		this._trySetArcSegment(path[0], segment);
		return path;
	}

	protected override _connectChain(head: number, tail: number, segment: ISegment): void {
		this._trySetArcSegment(this._points[this._chainHeads[tail]], segment);
		super._connectChain(head, tail, segment);
	}

	protected override _append(segment: ISegment, id: number): void {
		super._append(segment, id);
		this._trySetArcSegment(this._points[this._chainTails[id]], segment);
	}

	protected override _prepend(segment: ISegment, id: number): void {
		this._trySetArcSegment(this._points[this._chainHeads[id]], segment);
		super._prepend(segment, id);
	}

	protected override _createChain(segment: ISegment): void {
		super._createChain(segment);
		this._trySetArcSegment(this._points[this._length], segment);
	}

	private _trySetArcSegment(p: IArcPoint, segment: ISegment): void {
		if(segment.$type === SegmentType.Arc) {
			p.arc = (segment as ArcSegment).$anchor;
			p.r = (segment as ArcSegment).$radius;
		}
	}
}

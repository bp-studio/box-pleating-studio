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
		_trySetArcSegment(path[0], segment);
		return path;
	}

	/* istanbul ignore next: won't encounter for our use case */
	protected override _connectChain(head: number, tail: number, segment: ISegment): void {
		_trySetArcSegment(this._points[this._chainHeads[tail]], segment);
		super._connectChain(head, tail, segment);
	}

	protected override _append(segment: ISegment, id: number): void {
		super._append(segment, id);
		_trySetArcSegment(this._points[this._chainTails[id]], segment);
	}

	protected override _prepend(segment: ISegment, id: number): void {
		_trySetArcSegment(this._points[this._chainHeads[id]], segment);
		super._prepend(segment, id);
	}

	protected override _createChain(segment: ISegment): void {
		super._createChain(segment);
		_trySetArcSegment(this._points[this._length], segment);
	}
}

function _trySetArcSegment(p: IArcPoint, segment: ISegment): void {
	if(segment.$type === SegmentType.Arc) {
		p.arc = (segment as ArcSegment).$anchor;
		p.r = (segment as ArcSegment).$radius;
	}
}

import { PolyBool } from "../polyBool";
import { RREventProvider } from "./rrEventProvider";
import { RRIntersector } from "./rrIntersector";
import { ArcChainer } from "../../classes/chainer/arcChainer";
import { ArcSegment } from "../../classes/segment/arcSegment";
import { AALineSegment } from "../../classes/segment/aaLineSegment";
import { simpleEndProcessor } from "../../classes/endProcessor";

import type { ArcPath } from "shared/types/geometry";
import type { IRoundedRect } from "./roundedRect";

//=================================================================
/**
 * {@link RRIntersection} calculates the intersection of two {@link IRoundedRect}s.
 */
//=================================================================

export class RRIntersection extends PolyBool<IRoundedRect, ArcPath> {

	protected override readonly _chainer = new ArcChainer();
	protected override readonly _endProcessor = simpleEndProcessor;
	protected override readonly _shouldPickInside = true;

	constructor() {
		super(new RREventProvider(), new RRIntersector());
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _initialize(components: IRoundedRect[]): void {
		for(let i = 0; i < components.length; i++) {
			const { x, y, width: w, height: h, radius: r } = components[i];

			// Add arcs.
			this._addSegment(new ArcSegment({ x, y }, r,
				{ x: x - r, y }, { x, y: y - r }, i), 1);
			this._addSegment(new ArcSegment({ x: x + w, y }, r,
				{ x: x + w, y: y - r }, { x: x + w + r, y }, i), 1);
			this._addSegment(new ArcSegment({ x: x + w, y: y + h }, r,
				{ x: x + w + r, y: y + h }, { x: x + w, y: y + h + r }, i), -1);
			this._addSegment(new ArcSegment({ x, y: y + h }, r,
				{ x, y: y + h + r }, { x: x - r, y: y + h }, i), -1);

			// Add line segments.
			if(w) {
				this._addSegment(new AALineSegment({ x, y: y - r }, { x: x + w, y: y - r }, i), 1);
				this._addSegment(new AALineSegment({ x: x + w, y: y + h + r }, { x, y: y + h + r }, i), -1);
			}
			if(h) {
				this._addSegment(new AALineSegment({ x: x + w + r, y }, { x: x + w + r, y: y + h }, i), 1);
				this._addSegment(new AALineSegment({ x: x - r, y: y + h }, { x: x - r, y }, i), -1);
			}
		}
	}
}

import { Piece } from "./piece";

import type { JAnchor, JGadget, JOverlap } from "shared/json";
import type { Device } from "./device";

//=================================================================
/**
 * {@link Gadget} is a component in a {@link Device} corresponding to a single {@link JOverlap}.
 * It always have four {@link JAnchor}s.
 */
//=================================================================
export class Gadget implements JGadget, ISerializable<JGadget> {

	public pieces: readonly Piece[];
	public offset?: IPoint;
	public anchors?: JAnchor[];

	constructor(data: JGadget) {
		this.pieces = data.pieces.map(p => new Piece(p));
		this.offset = data.offset;
		//this.pieces.forEach(p => p.$offset(this.offset));
		this.anchors = data.anchors;
	}

	public toJSON(): JGadget {
		return this;
	}
}

import { List } from "./List";
import { Epsilon } from "../Epsilon";
import type { Transition, XEvent, compare } from "../types";

function statusCompare(ev1: XEvent, ev2: XEvent): compare {
	let a1 = ev1.seg.start;
	let a2 = ev1.seg.end;
	let b1 = ev2.seg.start;
	let b2 = ev2.seg.end;

	if(Epsilon.$pointsCollinear(a1, b1, b2)) {
		if(Epsilon.$pointsCollinear(a2, b1, b2)) return 1; // eventCompare(true, a1, a2, true, b1, b2);
		return Epsilon.$pointAboveOrOnLine(a2, b1, b2) ? 1 : -1;
	}
	return Epsilon.$pointAboveOrOnLine(a1, b1, b2) ? 1 : -1;
}

/** StatusList */
export class StatusList extends List {

	protected check(ev: XEvent, that: XEvent): compare {
		if(that === ev) return 0;
		return statusCompare(ev, that);
	}

	public findSurrounding(ev: XEvent): Transition {
		return this.findTransition(ev);
	}
}

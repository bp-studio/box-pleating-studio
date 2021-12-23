/* eslint-disable complexity */
/* eslint-disable max-lines-per-function */

import { List } from "./List";
import { Epsilon } from "../Epsilon";
import type { Point, Segment, XEvent, compare } from "../types";

function eventCompare(e1: XEvent, e2: XEvent): compare {
	// compare the selected points first
	let comp = Epsilon.$pointsCompare(e1.pt, e2.pt);
	if(comp !== 0) return comp;	// the selected points are not the same

	// if the non-selected points are the same too, then the segments are equal
	if(Epsilon.$pointsSame(e1.other.pt, e2.other.pt)) return 0;

	// if one is a start and the other isn't, favor the one that isn't the start
	if(e1.isStart !== e2.isStart) return e1.isStart ? 1 : -1;

	// otherwise, we'll have to calculate which one is below the other manually
	// 注意這個部份並非全序比較！（有可能兩個 Event 互相傳回 -1 的結果）
	return Epsilon.$pointAboveOrOnLine(e1.other.pt,
		e2.isStart ? e2.pt : e2.other.pt, // order matters
		e2.isStart ? e2.other.pt : e2.pt
	) ? 1 : -1;
}

/** {@link IntersectionEvent} 專用的 {@link List} */
export class EventList extends List {

	protected check(ev: XEvent, that: XEvent): compare {
		// should ev be inserted before here?
		if(that === ev) return 0;
		return -eventCompare(ev, that) as compare;
	}

	private add(ev: XEvent): void {
		this.findTransition(ev).insert(ev);
	}

	public addSegment(seg: Segment, primary: boolean): XEvent {
		let ev_start: XEvent = {
			isStart: true,
			pt: seg.start,
			seg,
			primary,
			status: null,
		} as XEvent;
		let ev_end: XEvent = {
			isStart: false,
			pt: seg.end,
			seg,
			primary,
			other: ev_start,
			status: null,
		};
		ev_start.other = ev_end;
		this.add(ev_start);
		this.add(ev_end);

		return ev_start;
	}

	private divide(ev: XEvent, pt: Point): XEvent {
		let new_segment = ev.seg.copy(pt);

		// slides an end backwards
		//   (start)------------(end)    to:
		//   (start)---(end)
		this.remove(ev.other);
		ev.seg.end = pt;
		ev.other.pt = pt;
		this.add(ev.other);

		return this.addSegment(new_segment, ev.primary);
	}

	public checkIntersection(ev1: XEvent, ev2: XEvent): false | XEvent {
		// returns the segment equal to ev1, or false if nothing equal

		let seg1 = ev1.seg;
		let seg2 = ev2.seg;
		let a1 = seg1.start;
		let a2 = seg1.end;
		let b1 = seg2.start;
		let b2 = seg2.end;

		let i = Epsilon.$linesIntersect(a1, a2, b1, b2);

		if(i === false) {
			// segments are parallel or coincident

			// if points aren't collinear, then the segments are parallel, so no intersections
			if(!Epsilon.$pointsCollinear(a1, a2, b1)) return false;
			// otherwise, segments are on top of each other somehow (aka coincident)

			if(Epsilon.$pointsSame(a1, b2) || Epsilon.$pointsSame(a2, b1)) return false; // segments touch at endpoints... no intersection

			let a1_equ_b1 = Epsilon.$pointsSame(a1, b1);
			let a2_equ_b2 = Epsilon.$pointsSame(a2, b2);

			if(a1_equ_b1 && a2_equ_b2) return ev2; // segments are exactly equal

			let a1_between = !a1_equ_b1 && Epsilon.$pointBetween(a1, b1, b2);
			let a2_between = !a2_equ_b2 && Epsilon.$pointBetween(a2, b1, b2);

			// handy for debugging:
			// buildLog.log({
			//	a1_equ_b1: a1_equ_b1,
			//	a2_equ_b2: a2_equ_b2,
			//	a1_between: a1_between,
			//	a2_between: a2_between
			// });

			if(a1_equ_b1) {
				if(a2_between) {
					//  (a1)---(a2)
					//  (b1)----------(b2)
					this.divide(ev2, a2);
				} else {
					//  (a1)----------(a2)
					//  (b1)---(b2)
					this.divide(ev1, b2);
				}
				return ev2;
			} else if(a1_between) {
				if(!a2_equ_b2) {
					// make a2 equal to b2
					if(a2_between) {
						//         (a1)---(a2)
						//  (b1)-----------------(b2)
						this.divide(ev2, a2);
					} else {
						//         (a1)----------(a2)
						//  (b1)----------(b2)
						this.divide(ev1, b2);
					}
				}

				//         (a1)---(a2)
				//  (b1)----------(b2)
				this.divide(ev2, a1);
			}
		} else {
			// otherwise, lines intersect at i.pt, which may or may not be between the endpoints

			// is A divided between its endpoints? (exclusive)
			if(i.alongA === 0) {
				if(i.alongB === -1) this.divide(ev1, b1); // yes, at exactly b1
				else if(i.alongB === 0) this.divide(ev1, i.pt); // yes, somewhere between B's endpoints
				else if(i.alongB === 1) this.divide(ev1, b2); // yes, at exactly b2
			}

			// is B divided between its endpoints? (exclusive)
			if(i.alongB === 0) {
				if(i.alongA === -1) this.divide(ev2, a1);// yes, at exactly a1
				else if(i.alongA === 0) this.divide(ev2, i.pt); // yes, somewhere between A's endpoints (exclusive)
				else if(i.alongA === 1) this.divide(ev2, a2); // yes, at exactly a2
			}
		}
		return false;
	}

	public checkBothIntersections(ev: XEvent, above: XEvent | null,
		below: XEvent | null): false | XEvent {
		if(above) {
			let eve = this.checkIntersection(ev, above);
			if(eve) return eve;
		}
		if(below) return this.checkIntersection(ev, below);
		return false;
	}
}

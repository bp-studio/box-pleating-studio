
namespace PolyBool {

	function statusCompare(ev1: Event, ev2: Event): compare {
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

	export class StatusList extends List {

		protected check(ev: Event, that: Event): compare {
			if(that === ev) return 0;
			return statusCompare(ev, that);
		}

		public findSurrounding(ev: Event): Transition {
			return this.findTransition(ev);
		}
	}
}

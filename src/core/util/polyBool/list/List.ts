
namespace PolyBool {

	export interface Event {
		isStart: boolean;
		pt: Point
		seg: Segment;
		primary: boolean;
		other: Event;
		status: Event | null;
	}

	export interface Transition {
		before: Event | null;
		after: Event | null;
		insert(node: Event): Event;
	}

	/** Priority queue */
	export abstract class List {
		public nodes: Event[] = [];

		// public exists(node: T): boolean {
		// 	return this.nodes.includes(node);
		// }

		/** 執行二元搜尋時的比較函數 */
		protected abstract check(ev: Event, that: Event): compare;

		private search(x: Event): number {
			let lo = 0, hi = this.nodes.length;
			while(lo < hi) {
				let mid: number = lo + hi >>> 1;
				let c = this.check(x, this.nodes[mid]);
				if(c > 0) hi = mid;
				else lo = mid + 1;
			}
			return lo;
		};

		public getIndex(node: Event): number {
			// 這邊似乎暫時不能直接使用二元搜尋來直接鎖定元素的位置，
			// 因為目前 EventList.check 的實作並不是全序函數
			return this.nodes.indexOf(node);
		}

		public isEmpty(): boolean {
			return this.nodes.length === 0;
		}

		public getHead(): Event {
			return this.nodes[0];
		}

		public findTransition(node: Event): Transition {
			let i = this.search(node);
			return {
				before: i === 0 ? null : this.nodes[i - 1],
				after: this.nodes[i] || null,
				insert: (n: Event): Event => {
					this.nodes.splice(i, 0, n);
					return n;
				},
			};
		}

		public remove(node: Event): void {
			this.nodes.splice(this.getIndex(node), 1);
		}
	}
}

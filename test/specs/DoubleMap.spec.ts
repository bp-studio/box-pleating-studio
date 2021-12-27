import { assert, expect } from 'chai';

import { DoubleMap } from "bp/class/mapping/DoubleMap";

describe('DoubleMap', () => {

	it('use unordered pair of keys', () => {
		let m = new DoubleMap<string, number>();
		m.set("a", "b", 2);
		assert(m.has("a", "b"));
		assert(m.has("b", "a"));
		expect(m.get("a", "b")).to.equal(2);
	});

	it('could use identical pair as key', () => {
		let m = new DoubleMap<string, number>();
		m.set("a", "a", 2);
		expect(m.size).to.equal(1);
	});

	it('is iterable', () => {
		let m = new DoubleMap<string, number>();
		m.set("a", "b", 2);
		m.set("a", "c", 3);
		m.set("c", "c", 5);
		let n = 1;
		for(let [k1, k2, v] of m) n *= v;
		expect(n).to.equal(30);
	});

	it('supports deleting entry', () => {
		let m = new DoubleMap<string, number>();
		m.set("a", "c", 3);
		m.delete("c", "a");
		assert(!m.has("a", "c"));
		expect(m.size).to.equal(0);
	});

	it('is reactive', () => {
		@shrewd class A {
			public n: number = 0;
			public map: DoubleMap<string, number> = new DoubleMap();

			@shrewd private has(): void {
				if(this.map.has("a")) this.n = 1;
			}
		}

		let a = new A();
		expect(a.n).to.equal(0);

		a.map.set("a", "b", 12);
		Shrewd.commit();
		expect(a.n).to.equal(1);
	});
});

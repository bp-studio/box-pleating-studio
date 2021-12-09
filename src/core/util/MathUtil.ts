
//////////////////////////////////////////////////////////////////
/**
 * 數學運算相關的工具方法。
 */
//////////////////////////////////////////////////////////////////

namespace MathUtil {

	let _guidMap: WeakMap<object, string> = new WeakMap();

	export function $guid(object: object): string {
		let id = _guidMap.get(object);
		if(!id) _guidMap.set(object, id = _guid());
		return id;
	}

	/** 求出整數的最大公因數。 */
	export function $GCD(a: number, b: number): number {
		// 在幾種數值無效的情況中，直接傳回 1 使得相依的程式什麼都不做
		if(typeof a == 'number' && !Number.isSafeInteger(a)) return 1;
		if(typeof b == 'number' && !Number.isSafeInteger(b)) return 1;
		if(a == 0 && b == 0) return 1;

		if(a < 0) a = -a;
		if(b < 0) b = -b;
		while(a && b) {
			a %= b;
			if(a) b %= a;
		}
		return a ? a : b;
	}

	export function $LCM(list: number[]): number {
		let lcm = list[0];
		for(let i = 1; i < list.length; i++) {
			let gcd = $GCD(lcm, list[i]);
			lcm = lcm * list[i] / gcd;
		}
		return lcm;
	}

	/** 把一對有理數進行化簡。 */
	export function $reduce(a: number, b: number): [number, number, number] {
		if(
			typeof a == 'number' &&
			!Number.isInteger(a) || typeof b == 'number' && !Number.isInteger(b)
		) {
			let af = new Fraction(a), bf = new Fraction(b);
			a = Number(af.$numerator * bf.$denominator);
			b = Number(af.$denominator * bf.$numerator);
		}
		let gcd = $GCD(a, b);
		return [a / gcd, b / gcd, gcd];
	}

	/** 把數值 x 朝著 f 指定的方向取下一個整數 */
	export function $int(x: number, f: number): number {
		return f > 0 ? Math.ceil(x) : Math.floor(x);
	}

	/* eslint-disable @typescript-eslint/no-magic-numbers */
	function _guid(): string {
		// @ts-ignore
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
}

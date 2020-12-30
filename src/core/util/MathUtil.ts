
//////////////////////////////////////////////////////////////////
/**
 * 數學運算相關的工具方法。
 */
//////////////////////////////////////////////////////////////////

namespace MathUtil {

	/** 求出整數的最大公因數。 */
	export function GCD<T extends bigint | number>(a: T, b: T): T;
	export function GCD(a: number, b: number): number {
		if(typeof a == 'number' && !Number.isSafeInteger(a)) throw new Error("Not a safe integer: " + a);
		if(typeof b == 'number' && !Number.isSafeInteger(b)) throw new Error("Not a safe integer: " + b);
		if(a == 0 && b == 0) throw new Error("Input cannot be both zero");
		if(a < 0) a = -a;
		if(b < 0) b = -b;
		while(a && b) { a %= b; if(a) b %= a; }
		return a ? a : b;
	}

	export function LCM(list: number[]) {
		let lcm = list[0];
		for(let i = 1; i < list.length; i++) {
			let gcd = GCD(lcm, list[i]);
			lcm = lcm * list[i] / gcd;
		}
		return lcm;
	}

	/** 把一對有理數進行化簡。 */
	export function reduce<T extends bigint | number>(a: T, b: T): [T, T];
	export function reduce(a: number, b: number): [number, number] {
		if(typeof a == 'number' && !Number.isInteger(a) || typeof b == 'number' && !Number.isInteger(b)) {
			let af = new Fraction(a), bf = new Fraction(b);
			a = Number(af.$numerator * bf.$denominator);
			b = Number(af.$denominator * bf.$numerator);
		}
		let gcd = this.GCD(a, b);
		return [a / gcd, b / gcd];
	}

	/** 把數值 x 朝著 f 指定的方向取下一個整數 */
	export function int(x: number, f: number) {
		return f > 0 ? Math.ceil(x) : Math.floor(x);
	}
}

import { $GCD } from "./GCD";
import { Fraction } from "../Fraction";

/** 把一對有理數進行化簡。 */
export function $reduce(a: number, b: number): [number, number, number] {
	if(
		typeof a == 'number' && !Number.isInteger(a) ||
		typeof b == 'number' && !Number.isInteger(b)
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

export * from "./GCD";
export * from "./Guid";

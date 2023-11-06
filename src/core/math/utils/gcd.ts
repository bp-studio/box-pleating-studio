import type { Fraction } from "../fraction";

/**
 * Find the greatest common divider of two numbers.
 * The result is always a positive integer.
 */
export function $GCD(a: number, b: number): Positive {
	if(a == 0 && b == 0) return 1;

	if(a < 0) a = -a;
	if(b < 0) b = -b;
	while(a && b) {
		a %= b;
		if(a) b %= a;
	}
	return (a ? a : b) as Positive;
}

/** Find the least common multiple of give numbers. */
export function $LCM(list: Positive[]): Positive {
	let lcm: number = list[0];
	for(let i = 1; i < list.length; i++) {
		const gcd = $GCD(lcm, list[i]);
		lcm = lcm * list[i] / gcd;
	}
	return lcm as Positive;
}

/**
 * Reduce a pair of integers.
 * Signs will be kept as they were.
 */
export function $reduceInt<A extends number, B extends number>(a: A, b: B): [A, B, Positive] {
	const gcd = $GCD(a, b);
	return [a / gcd as A, b / gcd as B, gcd];
}

/** Reduce a pair of fractions. */
export function $reduce(af: Fraction, bf: Fraction): [number, number, Positive] {
	const a = af.$numerator * bf.$denominator;
	const b = af.$denominator * bf.$numerator;
	const gcd = $GCD(a, b);
	return [a / gcd, b / gcd, gcd];
}

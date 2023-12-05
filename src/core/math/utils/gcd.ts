import type { Fraction } from "../fraction";

/**
 * Find the greatest common divider of two numbers.
 * The result is always a positive integer.
 */
export function gcd(a: number, b: number): Positive {
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
export function lcm(list: Positive[]): Positive {
	let result: number = list[0];
	for(let i = 1; i < list.length; i++) {
		const g = gcd(result, list[i]);
		result = result * list[i] / g;
	}
	return result as Positive;
}

/**
 * Reduce a pair of integers.
 * Signs will be kept as they were.
 */
export function reduceInt<A extends number, B extends number>(a: A, b: B): [A, B, Positive] {
	const g = gcd(a, b);
	return [a / g as A, b / g as B, g];
}

/** Reduce a pair of fractions. */
export function reduce(af: Fraction, bf: Fraction): [number, number, Positive] {
	const a = af.$numerator * bf.$denominator;
	const b = af.$denominator * bf.$numerator;
	const g = gcd(a, b);
	return [a / g, b / g, g];
}

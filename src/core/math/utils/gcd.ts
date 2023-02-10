/** 求出整數的最大公因數。 */
export function $GCD(a: number, b: number): number {
	if(a == 0 && b == 0) return 1;

	if(a < 0) a = -a;
	if(b < 0) b = -b;
	while(a && b) {
		a %= b;
		if(a) b %= a;
	}
	return a ? a : b;
}

/** 求出整數的最小公倍數 */
export function $LCM(list: number[]): number {
	let lcm = list[0];
	for(let i = 1; i < list.length; i++) {
		const gcd = $GCD(lcm, list[i]);
		lcm = lcm * list[i] / gcd;
	}
	return lcm;
}

/** 化簡一對整數 */
export function $reduceInt(a: number, b: number): [number, number, number] {
	const gcd = $GCD(a, b);
	return [a / gcd, b / gcd, gcd];
}

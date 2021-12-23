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

export function $reduceInt(a: number, b: number): [number, number, number] {
	let gcd = $GCD(a, b);
	return [a / gcd, b / gcd, gcd];
}

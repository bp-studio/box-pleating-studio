
export function createArray<T>(length: number, value: T): T[] {
	return Array.from({ length }, _ => value);
}

export function foreachPair<T>(array: T[], action: (a: T, b: T) => void): void {
	const l = array.length;
	for(let i = 0; i < l; i++) {
		for(let j = i + 1; j < l; j++) {
			action(array[i], array[j]);
		}
	}
}

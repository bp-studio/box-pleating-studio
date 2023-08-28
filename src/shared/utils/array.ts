
export function isTypedArray<T extends object>(
	array: unknown[], constructor: Constructor<T>
): array is T[] {
	return array.every(item => item instanceof constructor);
}

export function createArray<T>(length: number, value: T): T[] {
	return Array.from({ length }, _ => value);
}

export function foreachPair<T>(array: readonly T[], action: (a: T, b: T) => void): void {
	const l = array.length;
	for(let i = 0; i < l; i++) {
		for(let j = i + 1; j < l; j++) {
			action(array[i], array[j]);
		}
	}
}

/** Remove duplicate elements (assuming the array is sorted) */
export function distinct<T>(array: T[]): T[] {
	const result: T[] = [];
	for(const item of array) {
		if(result.length === 0 || item !== result[result.length - 1]) {
			result.push(item);
		}
	}
	return result;
}

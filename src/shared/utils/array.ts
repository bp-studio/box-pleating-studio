
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

/** 移除掉重複元素（這邊假定傳入的陣列已經經過排序） */
export function distinct<T>(array: T[]): T[] {
	const result: T[] = [];
	for(const item of array) {
		if(result.length === 0 || item !== result[result.length - 1]) {
			result.push(item);
		}
	}
	return result;
}

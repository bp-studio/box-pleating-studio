
type constructor<T extends object> = new (...args: unknown[]) => T;

function isTypedArray<T extends object>(
	array: unknown[], constructor: constructor<T>
): array is T[] {
	return array.every(item => item instanceof constructor);
}

function selectMany<From, To>(
	array: readonly From[],
	factory: (from: From) => readonly To[]
): To[] {
	let aggregate = (arr: To[], next: From) => {
		arr.push(...factory(next));
		return arr;
	};
	return array.reduce(aggregate, [] as To[]);
}

function sum(array: readonly number[]): number {
	return array.reduce((n, x) => n + x, 0);
}

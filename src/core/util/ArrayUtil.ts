
type constructor<T> = new (...args: unknown[]) => T;

function isTypedArray<T>(array: unknown[], constructor: constructor<T>): array is T[] {
	return array.every(item => item instanceof constructor);
}

function selectMany<From, To>(array: readonly From[], factory: (from: From) => readonly To[]): To[] {
	let aggregate = (array: To[], next: From) => {
		array.push(...factory(next));
		return array;
	};
	return array.reduce(aggregate, [] as To[]);
}

function sum(array: readonly number[]): number {
	return array.reduce((n, x) => n + x, 0);
}

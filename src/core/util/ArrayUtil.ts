
type constructor<T> = new (...args: any[]) => T;

function isTypedArray<T>(array: any[], constructor: constructor<T>): array is T[] {
	return array.every(item => item instanceof constructor);
}

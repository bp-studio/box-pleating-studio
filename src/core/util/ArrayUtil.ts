
type constructor<T> = new (...args: unknown[]) => T;

function isTypedArray<T>(array: unknown[], constructor: constructor<T>): array is T[] {
	return array.every(item => item instanceof constructor);
}

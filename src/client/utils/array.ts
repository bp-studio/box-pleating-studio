
export function isTypedArray<T extends object>(
	array: unknown[], constructor: Constructor<T>
): array is T[] {
	return array.every(item => item instanceof constructor);
}

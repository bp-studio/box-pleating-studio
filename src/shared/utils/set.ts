
interface SetLike<T> {
	values(): IterableIterator<T>;
}

export function getFirst<T>(set: SetLike<T>): T | undefined {
	return set.values().next().value;
}

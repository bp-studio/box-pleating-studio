
type SetLike<T> = Pick<Set<T>, "values">;

export function getFirst<T>(set: SetLike<T>): T | undefined {
	return set.values().next().value;
}


export function fromEntries<K extends string | symbol = string, V = unknown>(iterable: Iterable<[K, V]>): Record<K, V> {
	const result = {} as Record<K, V>;
	for(const e of iterable) result[e[0]] = e[1];
	return result;
}

if(typeof Object.fromEntries === "undefined") {
	Object.fromEntries = fromEntries;
}

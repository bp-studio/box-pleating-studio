
function toMap<S, K, V>(array: readonly S[], keySelector: (source: S) => K, valueSelector: (source: S) => V) {
	let result = new Map<K, V>();
	for(let e of array) result.set(keySelector(e), valueSelector(e));
	return result;
}
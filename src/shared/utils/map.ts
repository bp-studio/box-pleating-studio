
/**
 * A utility function for operating a {@link Map} of {@link Array}s.
 * It returns the array corresponding to the given key, and will create a new array if necessary.
 * @param map The map of arrays.
 * @param key The key to lookup.
 * @param callBack Callback if a new array is created (i.e. the key is new).
 */
export function getOrSetEmptyArray<K, V>(map: Map<K, V[]>, key: K, callBack?: (arr: V[]) => void): V[] {
	let result = map.get(key);
	if(result === undefined) {
		map.set(key, result = []);
		if(callBack) callBack(result);
	}
	return result;
}

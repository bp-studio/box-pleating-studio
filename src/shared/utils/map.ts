
export function getOrSetEmptyArray<K, V>(map: Map<K, V[]>, key: K, callBack?: (arr: V[]) => void): V[] {
	let result = map.get(key);
	if(result === undefined) {
		map.set(key, result = []);
		if(callBack) callBack(result);
	}
	return result;
}

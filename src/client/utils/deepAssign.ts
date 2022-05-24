
/**
 * 深層複製物件的巢狀內容；所有深度的物件都會被建立副本，不會複製參照。
 */
export function deepAssign<T>(target: T, ...sources: RecursivePartial<T>[]): T {
	for(const s of sources) {
		if(!(s instanceof Object)) continue;

		// 這種寫法也一樣適用於 s 是陣列的情況；此時取出來的 keys 就自動會是陣列的各個索引
		const keys = Object.keys(s) as (keyof T)[];

		for(const k of keys) {
			const v = s[k] as T[typeof k];
			if(!(v instanceof Object)) {
				target[k] = v; // 純量類別可以直接複製
			} else if(target[k] instanceof Object && target[k] != v) { // 確定參照不同
				target[k] = deepAssign(target[k], v);
			} else {
				target[k] = clone(v);
			}
		}
	}
	return target;
}

/** 複製一個物件 */
export function clone<T>(source: T): T {
	const r = source instanceof Array ? [] : {};
	return deepAssign(r as T, source);
}

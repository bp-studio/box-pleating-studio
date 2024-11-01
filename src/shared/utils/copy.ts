
// Self-reference will happen if we use Record here,
// so we have to write it out explicitly.
type Store = { [key: string]: Store | unknown };

/**
 * Copy the properties in the source object to the target object,
 * ignoring the properties absent in either of them.
 */
export function deepCopy(target: Store, source: Store): void {
	if(!source) return;
	for(const key in target) {
		const value = target[key];
		if(value instanceof Object) deepCopy(value as Store, source[key] as Store);
		else if(key in source) target[key] = source[key];
	}
}

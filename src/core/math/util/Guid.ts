let _guidMap: WeakMap<object, string> = new WeakMap();

export function $guid(object: object): string {
	let id = _guidMap.get(object);
	if(!id) _guidMap.set(object, id = _guid());
	return id;
}

/* eslint-disable @typescript-eslint/no-magic-numbers */
function _guid(): string {
	// @ts-ignore
	return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

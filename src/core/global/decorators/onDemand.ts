/**
 * 建立一個只有在被呼叫的時候會執行一次然後之後就永遠快取的 getter。
 *
 * 這個會是非 enumerable 的。
 */
function onDemand(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor {
	let getter = desc.get!;
	return {
		get() {
			let record = onDemandMap.get(this);
			if(!record) onDemandMap.set(this, record = {});
			if(name in record) return record[name];
			else return record[name] = getter.apply(this);
		},
		enumerable: false,
		configurable: false,
	};
}

/**
 * 從每個物件實體到對應的值 {@link Record} 的映射
 */
const onDemandMap = new WeakMap<object, Record<string, unknown>>();

/** 宣告一個屬性為非 enumerable */
function nonEnumerable(target: object, name: string): void;
function nonEnumerable(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor;
function nonEnumerable(
	target: object, name: string, desc?: PropertyDescriptor
): PropertyDescriptor | void {
	if(desc) {
		desc.enumerable = false;
		return desc;
	}
	// 這個原理跟 Shrewd 類似，埋下啟動器來自我設置
	Object.defineProperty(target, name, {
		set(value) {
			Object.defineProperty(this, name, {
				value, writable: true, configurable: false,
			});
		},
		configurable: true,
	});
}

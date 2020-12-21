
/** 宣告一個屬性為非 enumerable */
function nonenumerable(target: any, name: string): void;
function nonenumerable(target: any, name: string, desc: PropertyDescriptor): PropertyDescriptor;
function nonenumerable(target: any, name: string, desc?: any) {
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
};

/** action 的選項不應該有 renderer 存在 */
type ActionOption = Omit<Shrewd.IDecoratorOptions<any>, "renderer">;

/**
 * 跟 `@shrewd` 的效果一樣，不過在值即將發生變更的時候會觸發動作。
 */
function action(option: ActionOption): PropertyDecorator;
function action(target: any, name: string): void;
function action(target: any, name?: string): void | PropertyDecorator {
	if(name === undefined) return (obj, name: string) => actionInner(obj, name, target);
	else actionInner(target, name, {});
}
function actionInner(target: any, name: string, option: ActionOption) {
	shrewd({
		validator(this: IDesignObject, v: any) {
			let record = actionMap.get(this);
			if(!record) actionMap.set(this, record = {});
			let result = option.validator?.apply(this, [v]) ?? true;
			if(result) {
				if(name in record && record[name] != v) {
					if(!('design' in this)) debugger;
					this.design.fieldChange(this, name, record[name], v);
				}
				record[name] = v;
			}
			return result;
		}
	})(target, name);
}
const actionMap = new WeakMap<any, Record<string | symbol, any>>();

/**
 * 建立一個只有在被呼叫的時候會執行一次然後之後就永遠快取的 getter。
 *
 * 這個會是非 enumerable 的。
 */
function onDemand(target: any, name: string, desc: PropertyDescriptor): PropertyDescriptor {
	let getter = desc.get!;
	return {
		get() {
			let record = onDemandMap.get(this);
			if(!record) onDemandMap.set(this, record = {});
			if(name in record) return record[name];
			else return record[name] = getter.apply(this);
		},
		enumerable: false,
		configurable: false
	};
};
const onDemandMap = new WeakMap<any, Record<string, any>>();

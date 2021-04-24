
/** 特別用來標注某一項計算屬性經過實驗顯示不用進行比較檢查 */
const noCompare = shrewd;

/** 比較有分順序的陣列 */
function orderedArray(msg?: string): PropertyDecorator;
function orderedArray(target: object, prop: string | symbol): void;
function orderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<unknown> = {
		comparer: (ov: unknown[], nv: unknown[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.array(ov, nv);
			if(diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較不分順序的陣列 */
function unorderedArray(msg?: string): PropertyDecorator;
function unorderedArray(target: object, prop: string | symbol): void;
function unorderedArray(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<unknown> = {
		comparer: (ov: unknown[], nv: unknown[], member) => {
			if(ov === nv) return true;
			let result = Shrewd.comparer.unorderedArray(ov, nv);
			if(diagnose && result && msg) {
				// if(msg=="sheet.independents") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較 PolyBool segment 一致 */
function segment(msg?: string): PropertyDecorator;
function segment(target: object, prop: string | symbol): void;
function segment(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<PolyBool.Segments> = {
		comparer: (ov: PolyBool.Segments, nv: PolyBool.Segments, member) => {
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true
			let result = PolyBool.compare(ov, nv);
			if(diagnose && result && msg) {
				// if(msg == "staticClosure") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return result;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 比較路徑一致 */
function path(msg?: string): PropertyDecorator;
function path(target: object, prop: string | symbol): void;
function path(...p: [object, string | symbol] | [string?]): PropertyDecorator | void {
	let msg = p.length == 2 ? undefined : p[0];
	let option: Shrewd.IDecoratorOptions<Path> = {
		comparer: (ov: Path, nv: Path, member) => {
			(member as any).ov = ov;
			if(ov === nv) return true;
			if(!ov != !nv) return false;
			if(!ov) return true
			if(ov.length != nv.length) return false;
			for(let i = 0; i < ov.length; i++) {
				if(!ov[i].eq(nv[i])) return false;
			}
			if(diagnose && msg) {
				// if(msg == "qc") {
				// 	Shrewd.debug.trigger(member);
				// 	debugger;
				// }
				console.log(msg);
			}
			return true;
		}
	};
	if(p.length == 2) shrewd(option)(...p);
	else return shrewd(option);
}

/** 宣告一個屬性為非 enumerable */
function nonEnumerable(target: object, name: string): void;
function nonEnumerable(target: object, name: string, desc: PropertyDescriptor): PropertyDescriptor;
function nonEnumerable(target: object, name: string, desc?: PropertyDescriptor): PropertyDescriptor | void {
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
type ActionOption = Omit<Shrewd.IDecoratorOptions<unknown>, "renderer">;

/**
 * 跟 `@shrewd` 的效果一樣，不過在值即將發生變更的時候會觸發動作。
 *
 * 所有有註記 `@action` 的屬性都不能夠被改編，
 * 因為必須確保即使程式改版、歷史紀錄仍然能夠被正確移動。
 */
function action(option: ActionOption): PropertyDecorator;
function action(target: ITagObject, name: string): void;
function action(...p: [ActionOption] | [ITagObject, string]): void | PropertyDecorator {
	if(p.length == 1) return (obj, name: string) => actionInner(obj, name, p[0]);
	else actionInner(p[0], p[1], {});
}
function actionInner(target: object, name: string, option: ActionOption) {
	shrewd({
		validator(this: ITagObject, v: unknown) {
			let record = actionMap.get(this);
			if(!record) actionMap.set(this, record = {});
			let result = option.validator?.apply(this, [v]) ?? true;
			if(result) {
				if(name in record && record[name] != v) {
					this.$design.$history.$fieldChange(this, name, record[name], v);
				}
				record[name] = v;
			}
			return result;
		}
	})(target, name);
}
const actionMap = new WeakMap<object, Record<string | symbol, unknown>>();

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
		configurable: false
	};
};
const onDemandMap = new WeakMap<object, Record<string, unknown>>();

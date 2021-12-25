import type { ITagObject } from "bp/content/interface";

/** {@link action @action} 的選項不應該有 renderer 存在 */
type ActionOption = Omit<Shrewd.IDecoratorOptions<unknown>, "renderer">;

/**
 * 跟 {@link shrewd @shrewd} 的效果一樣，不過在值即將發生變更的時候會觸發動作。
 *
 * 所有有註記 {@link action @action} 的屬性都不能夠被改編，
 * 因為必須確保即使程式改版、歷史紀錄仍然能夠被正確移動。
 */
export function action(option: ActionOption): PropertyDecorator;
export function action(target: ITagObject, name: string): void;
export function action(...p: [ActionOption] | [ITagObject, string]): void | PropertyDecorator {
	if(p.length == 1) return (obj, name: string) => actionInner(obj, name, p[0]);
	else actionInner(p[0], p[1], {});
}

/**
 * {@link action @action} 裝飾器的內部實作
 */
function actionInner(target: object, name: string, option: ActionOption): void {
	shrewd({
		validator(this: ITagObject, v: unknown) {
			let record = actionMap.get(this);
			if(!record) actionMap.set(this, record = {});

			// 驗證輸入值有效性
			let valid = option.validator?.apply(this, [v]) ?? true;

			if(valid) {
				if(name in record && record[name] !== v) {
					/** 如果這是一次有效的變更，則產生一個對應的 {@link FieldCommand} */
					this.$design.$history?.$fieldChange(this, name, record[name], v);
				}
				record[name] = v;
			}

			return valid;
		},
	})(target, name);
}

/**
 * 從物件實體到對應的動作 {@link Record} 的映射
 */
const actionMap = new WeakMap<object, Record<string | symbol, unknown>>();

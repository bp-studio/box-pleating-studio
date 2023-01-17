import { watchEffect } from "vue";

import ResumableEffectScope from "client/utils/resumableEffectScope";
import { ACTIVE, Mountable, MOUNTED } from "./mountable";

import type { Container } from "@pixi/display";

//=================================================================
/**
 * {@link View} 是具有視圖的元件。
 */
//=================================================================
export abstract class View extends Mountable {

	/** 元件所包含的所有最上層容器 */
	private readonly _rootContainers: Container[] = [];

	/** 視圖反應作用域 */
	private _drawScope?: ResumableEffectScope;

	constructor(active: boolean = true) {
		super(active);

		this._onDispose(() => {
			this._drawScope?.stop();
			this._rootContainers.forEach(view => view.destroy({ children: true }));
		});

		this.addEventListener(ACTIVE, event => {
			// 各個最上層容器的可見與否取決於活躍狀態。
			this._rootContainers.forEach(view => view.visible = event.state);
		});

		this.addEventListener(MOUNTED, event => {
			// 反應作用域的啟用與否取決於掛載狀態。
			this._drawScope?.toggle(event.state);
		});
	}

	/**
	 * 新增最上層物件；這邊的實作隱約假定對於同一個物件只會呼叫一次。
	 *
	 * 所有的最上層物件都會在 {@link View} 解構的時候跟著自動解構。
	 */
	protected $addRootObject<T extends Container>(object: T, target?: Container): T {
		this._rootContainers.push(object);
		target?.addChild(object);
		return object;
	}

	/**
	 * 註冊一些方法為反應式繪製方法；傳入的方法都會跟 this 綁定。
	 *
	 * 請注意此方法只能呼叫一次。若再次呼叫，會覆寫掉前一次的設置。
	 */
	protected $reactDraw(...actions: Action[]): void {
		this._drawScope ??= new ResumableEffectScope();
		this._drawScope.run(() => {
			for(const action of actions) watchEffect(action.bind(this));
		});
	}
}

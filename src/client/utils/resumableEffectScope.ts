import { effectScope } from "vue";

import type { EffectScope } from "vue";

//=================================================================
/**
 * {@link ResumableEffectScope} 是 Vue 的 {@link EffectScope} 的一個封裝，提供了暫停和恢復的能力。
 */
//=================================================================
export default class ResumableEffectScope {

	private _scope?: EffectScope;
	private _action?: Action;

	/**
	 * 設定反應方法並且開始執行。
	 *
	 * 如果重複呼叫這個方法，新的反應方法會取代掉舊的。
	 */
	public run(action: Action): void {
		this._action = action;
		this.stop();
		this.resume();
	}

	/** 暫停（或停止）反應方法 */
	public stop(): void {
		if(this._scope) {
			this._scope.stop();
			this._scope = undefined;
		}
	}

	/** 恢復執行之前用 {@link run run()} 方法設定的方法 */
	public resume(): void {
		if(!this._scope && this._action) {
			this._scope = effectScope();
			this._scope.run(this._action);
		}
	}

	/** 根據參數的狀態決定啟動與否 */
	public toggle(run: boolean): void {
		if(run) this.resume();
		else this.stop();
	}
}

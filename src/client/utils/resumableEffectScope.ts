import { effectScope } from "vue";

import type { EffectScope } from "vue";

//=================================================================
/**
 * {@link ResumableEffectScope} is a wrapper of the {@link EffectScope} in Vue.
 * It provides the functionality to pause and resume.
 */
//=================================================================
export class ResumableEffectScope {

	private _scope?: EffectScope;
	private _action?: Action;

	/**
	 * Setup a reactive method and start running.
	 *
	 * If called again, new method will overwrite the old one.
	 */
	public run(action: Action): void {
		this._action = action;
		this.stop();
		this.resume();
	}

	/** Pause (or stop) reactivity. */
	public stop(): void {
		if(this._scope) {
			this._scope.stop();
			this._scope = undefined;
		}
	}

	/** Resume those methods previously set by {@link run run()}. */
	public resume(): void {
		if(!this._scope && this._action) {
			this._scope = effectScope();
			this._scope.run(this._action);
		}
	}

	/** Decide to run or not based on the parameter. */
	public toggle(run: boolean): void {
		if(run) this.resume();
		else this.stop();
	}
}

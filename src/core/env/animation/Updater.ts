import { Animator } from "./Animator";
import { PaperWorker } from "./PaperWorker";
import { Diagnose, Settings } from "bp/global";
import { Disposable } from "bp/class";
import type { Studio } from "..";

//////////////////////////////////////////////////////////////////
/**
 * {@link Updater} 負責定時執行 Shrewd 的認可。
 */
//////////////////////////////////////////////////////////////////

export class Updater extends Animator {

	private static readonly _PERIOD = 50;
	private readonly _studio: Studio;

	constructor(studio: Studio) {
		super(() => this.$update(), Updater._PERIOD, false);
		this._studio = studio;
	}

	public $updating: boolean = false;

	public async $update(): Promise<void> {
		if(this.$updating) return;
		this.$updating = true;

		if(DEBUG_ENABLED && Settings.diagnose) Diagnose.init();
		Shrewd.commit();
		if(DEBUG_ENABLED && Settings.diagnose) Diagnose.flush();

		let design = this._studio.$design;
		if(design && !design.$dragging && design.$history) { // dragging 狀態必須在 await 之前進行判讀才會是可靠的
			design.$history.$flush(this._studio.$system.$selection.$items);
		}

		await PaperWorker.$done();
		this._studio.$display.$update();

		let option = this._studio.$option;
		if(option.onUpdate) {
			await option.onUpdate();
			delete option.onUpdate;
		}

		this.$updating = false;

		if(this._studio.$designMap.size == 0) this.$active = false;

		Disposable.$flush();
	}
}

import { View } from "./View";
import type { Control } from "bp/design/class";

//=================================================================
/**
 * {@link ControlView} 是具有選取行為的 {@link View} 的基底類別。
 *
 * 通常這種 {@link View} 在單純被選取的時候並不需要全部重新渲染而只需要簡單修改一些元件的樣式，
 * 因此這個類別單獨定義了抽象 {@link ControlView.$renderSelection $renderSelection()} 方法來讓子類別實作。
 */
//=================================================================

export abstract class ControlView<T extends Control> extends View {

	/** 這個 {@link ControlView} 所對應的 {@link Control} 元件 */
	protected readonly _control: T;

	constructor(control: T) {
		super(control);
		this._control = control;
	}

	@shrewd private _drawSelection(): void {
		this.$mountEvents();
		if(this.$studio) this.$renderSelection(this._control.$selected);
	}

	/** 繼承類別必須實作這個方法，以在選取狀態改變的時候做必要的繪製動作 */
	protected abstract $renderSelection(selected: boolean): void;
}

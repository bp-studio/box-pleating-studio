
//////////////////////////////////////////////////////////////////
/**
 * ControlView 是具有選取行為的 View 的基底類別。
 *
 * 通常這種 View 在單純被選取的時候並不需要全部重新渲染而只需要簡單修改一些元件的樣式，
 * 因此這個類別單獨定義了抽象 renderSelection() 方法來讓子類別實作。
 */
//////////////////////////////////////////////////////////////////

abstract class ControlView<T extends Control> extends View {

	/** 這個 `ControlView` 所對應的 `Control` 元件 */
	protected readonly control: T;

	constructor(control: T) {
		super(control);
		this.control = control;
	}

	@shrewd private drawSelection() {
		this.mountEvents();
		if(this.$studio) this.renderSelection(this.control.selected);
	}

	protected abstract renderSelection(selected: boolean): void;
}

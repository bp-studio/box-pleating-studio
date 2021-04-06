
interface LabeledControl extends ViewedControl {
	view: LabeledView<ViewedControl>;
}

abstract class LabeledView<T extends Control> extends ControlView<T> {

	protected abstract readonly _label: paper.PointText;
	protected abstract readonly _glow: paper.PointText;

	/**
	 * `LabeledView` 要額外實作這個方法來繪製跟比例尺無關的東西。
	 *
	 * 必要的前置檢查已經在底層裡面完成。
	 */
	protected abstract renderUnscaled(): void;

	@shrewd private drawUnscaled() {
		this.mountEvents();
		if(!this.$studio) return;
		this.$studio.display.render();
		this.renderUnscaled();

		let s = 14 * Math.sqrt(this.scale);
		this._label.fontSize = s;
		this._glow.fontSize = s;
	}

	/** 一個 View 的標籤的橫向溢出大小 */
	@shrewd public get overflow(): number {
		if(this.disposed || !this.$studio) return 0;
		this.drawUnscaled();
		let result = 0;
		let w = this.$studio.display.scale * this.control.sheet.width;
		let { left, right } = this._label.bounds;
		if(left < 0) result = -left;
		if(right > w) result = Math.max(result, right - w);
		return Math.ceil(result);
	}
}

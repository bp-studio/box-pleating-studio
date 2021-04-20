
//////////////////////////////////////////////////////////////////
/**
 * `IndependentDraggable` 是一個拖曳行為與其它物件無關的 `Draggable`。
 *
 * 這樣的物件會限定住 `Sheet` 所能縮小的程度。
 */
//////////////////////////////////////////////////////////////////

abstract class IndependentDraggable extends Draggable {

	private _isNew: boolean = true;

	/** 這個物件自從建構以來，Design 是否尚未切換過 Sheet */
	protected get $isNew() { return this._isNew; }
	protected set $isNew(v) { if(!v) this._isNew = v; }

	@shrewd private _watchIsNew() {
		if(this._isNew && this.$sheet != this.$design.sheet) this._isNew = false;
	}

	/**
	 * 物件在 Sheet 上佔據的高度
	 *
	 * @exports
	 */
	public abstract readonly height: number;

	/**
	 * 物件在 Sheet 上佔據的寬度
	 *
	 * @exports
	 */
	public abstract readonly width: number;
}

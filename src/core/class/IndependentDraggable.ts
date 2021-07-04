
//////////////////////////////////////////////////////////////////
/**
 * {@link IndependentDraggable} 是一個拖曳行為與其它物件無關的 {@link Draggable}。
 *
 * 這樣的物件會限定住 {@link Sheet} 所能縮小的程度。
 */
//////////////////////////////////////////////////////////////////

abstract class IndependentDraggable extends Draggable {

	private _isNew: boolean = true;

	/** 這個物件自從建構以來，{@link Design} 是否尚未切換過 {@link Sheet} */
	protected get $isNew(): boolean { return this._isNew; }
	protected set $isNew(v) { if(!v) this._isNew = v; }

	@shrewd private _watchIsNew(): void {
		if(this._isNew && this.$sheet != this.$design.sheet) this._isNew = false;
	}

	/**
	 * 物件在 {@link Sheet} 上佔據的高度
	 *
	 * @exports
	 */
	public abstract readonly height: number;

	/**
	 * 物件在 {@link Sheet} 上佔據的寬度
	 *
	 * @exports
	 */
	public abstract readonly width: number;
}

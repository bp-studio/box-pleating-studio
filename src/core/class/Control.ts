
//////////////////////////////////////////////////////////////////
/**
 * {@link Control} 是一個可以被選取的 {@link SheetObject}。
 */
//////////////////////////////////////////////////////////////////

abstract class Control extends SheetObject implements ITagObject {

	public abstract get $tag(): string;

	/** 是否可以跟另外一個物件一起被多重選取 */
	public $selectableWith(c: Control): boolean { return false; }

	/**
	 * 控制項的拖曳選取基準點；拖曳選取時只要包覆到這個點，就算是選中，
	 * 因此這個基準點通常會是控制項的中心。
	 * 傳回 null 表示這個控制項無法被拖曳選取。
	 */
	public get $dragSelectAnchor(): IPoint | null {
		return null;
	}

	/**
	 * 這個物件被選取的狀態。
	 *
	 * 注意到這個狀態並不直接反應目前 {@link SelectionController} 中被選取的狀態，
	 * 因為即使一個 {@link Control} 被卸載，它的選取狀態仍然會維持著，
	 * 而且 {@link Control.$selected $selected} 和 {@link SelectionController.$items} 存在雙向綁定關係。
	 */
	@shrewd public $selected: boolean = false;

	/**
	 * 傳回物件類別名稱字串。
	 *
	 * 考慮到程式碼最後被 mangle 的可能性，這邊不直接抓取建構子的 name，
	 * 而要求實體繼承類別實作這個值。
	 */
	public abstract get $type(): string;

	/** 切換選取狀態 */
	public $toggle(): void {
		this.$selected = !this.$selected;
	}

	/**
	 * 傳回一個 {@link Control} 是否可以拖曳選取。
	 *
	 * 由於 TypeScript 暫時不支援 this 的 type guard，因此把這個方法定義為靜態方法。
	 */
	public static $isDragSelectable(c: Control): c is DragSelectableControl {
		return c.$dragSelectAnchor != null;
	}
}

interface DragSelectableControl extends Control {
	$dragSelectAnchor: IPoint;
}

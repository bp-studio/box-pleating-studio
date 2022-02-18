import type { JDesign } from "bp/content/json";
import type { ITagObject } from "bp/content/interface";

//=================================================================
/**
 * {@link OptionService} 服務是用來管理 {@link Design} 中元件的初始化設定值。
 */
//=================================================================

export class OptionService {

	/**
	 * 當專案載入進來的時候暫存個別元件屬性的 {@link Map}，
	 * 當元件被反應框架自動生成的時候會去這裡面尋找對應的設定值來自我初始化。
	 */
	private readonly _options: Map<string, object> = new Map();

	constructor(design: JDesign) {
		for(let n of design.tree.nodes) this.set("v" + n.id, n);
		for(let f of design.layout.flaps) this.set("f" + f.id, f);
		for(let s of design.layout.stretches) this.set("s" + s.id, s);
	}

	/**
	 * 取出物件初始化設定。
	 *
	 * 一旦被取出，對應的資料就會同時消滅。
	 */
	public get<T extends object>(target: ITagObject & ISerializable<T>): T | undefined {
		let tag = target.$tag;
		let option = this._options.get(tag);
		this._options.delete(tag);
		return option as T;
	}

	/**
	 * 設定一個指定類別和 id 的、預期會被自動生成的元件的初始設定值。
	 */
	public set(tag: string, option: object): void {
		this._options.set(tag, option);
	}
}

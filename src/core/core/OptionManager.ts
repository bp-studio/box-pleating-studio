
interface OptionMap {
	'vertex': JVertex;
	'flap': JFlap;
	'stretch': JStretch;
}

type OptionType = keyof OptionMap;

//////////////////////////////////////////////////////////////////
/**
 * `OptionManager` 是用來管理 `Design` 中元件的初始化設定值。
 */
//////////////////////////////////////////////////////////////////

class OptionManager {

	/**
	 * 當專案載入進來的時候暫存個別元件屬性的 `Map`，
	 * 當元件被反應框架自動生成的時候會去這裡面尋找對應的設定值來自我初始化。
	 */
	private readonly options: Map<string, any> = new Map();

	constructor(design: JDesign) {
		for(let n of design.tree.nodes) this.set("vertex", n.id, n);
		for(let f of design.layout.flaps) this.set("flap", f.id, f);
		for(let s of design.layout.stretches) this.set("stretch", s.id, s);
	}

	/**
	 * 取出物件初始化設定。
	 * 
	 * 一旦被取出，對應的資料就會同時消滅。
	 */
	public get<T extends OptionType>(type: T, id: string | number): OptionMap[T] | undefined {
		id = type + id;
		let option = this.options.get(id);
		this.options.delete(id);
		return option;
	}

	/**
	 * 設定一個指定類別和 id 的、預期會被自動生成的元件的初始設定值。
	 */
	public set<T extends OptionType>(type: T, id: string | number, option: OptionMap[T]) {
		this.options.set(type + id, option);
	}
}
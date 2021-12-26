import { Design } from "bp/design";
import { Migration } from "bp/content/patches";
import type { JDesign } from "bp/content/json";

//////////////////////////////////////////////////////////////////
/**
 * {@link StudioBase} 類別是 {@link Studio} 的基底類別，
 * 獨立出來以方便注入不同的成員實作以進行測試。
 */
//////////////////////////////////////////////////////////////////

export class StudioBase {

	public readonly $designMap: Map<number, Design> = new Map();

	@shrewd public $design: Design | null = null;

	public $load(json: string | object): Design {
		if(typeof json == "string") json = JSON.parse(json);
		let design = Migration.$process(json as Pseudo<JDesign>);
		return this._tryLoad(design);
	}

	public $create(json: Pseudo<JDesign>): Design {
		json = Object.assign({
			version: Migration.$getCurrentVersion(),
			tree: {
				nodes: [
					{ id: 0, name: "", x: 10, y: 10 },
					{ id: 1, name: "", x: 10, y: 13 },
					{ id: 2, name: "", x: 10, y: 7 },
				],
				edges: [
					{ n1: 0, n2: 1, length: 1 },
					{ n1: 0, n2: 2, length: 1 },
				],
			},
		}, json);
		return this.$restore(json);
	}

	public $restore(json: Pseudo<JDesign>): Design {
		let design = this._designFactory(Migration.$process(json));
		this.$designMap.set(design.id, design);
		return design;
	}

	/** 此方法有防呆 */
	public $select(id: number | null): void {
		if(id != null) {
			let d = this.$designMap.get(id);
			if(d) this.$design = d;
		} else {
			this.$design = null;
		}
	}

	/** 此方法有防呆 */
	public $close(id: number): void {
		let d = this.$designMap.get(id);
		if(d) {
			this.$designMap.delete(id);
			d.$dispose();
		}
	}

	public $closeAll(): void {
		this.$design = null;
		for(let d of this.$designMap.values()) d.$dispose();
		this.$designMap.clear();
	}

	protected _tryLoad(design: RecursivePartial<JDesign>): Design {
		this.$design = this._designFactory(design);
		this.$designMap.set(this.$design.id, this.$design);
		return this.$design;
	}

	protected _designFactory(design: RecursivePartial<JDesign>): Design {
		return new Design(this, design);
	}
}

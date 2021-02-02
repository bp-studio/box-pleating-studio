
interface JDesign {
	title: string;
	description?: string;
	fullscreen: boolean;
	version: string,
	mode: string;
	history?: JHistory;
	layout: {
		sheet: JSheet,
		flaps: JFlap[],
		stretches: JStretch[]
	};
	tree: {
		sheet: JSheet,
		nodes: JVertex[],
		edges: JEdge[]
	};
}

//////////////////////////////////////////////////////////////////
/**
 * `Design` 是包含了樹狀結構以及摺痕圖的一個完整專案單位。
 */
//////////////////////////////////////////////////////////////////

abstract class DesignBase extends Mountable {

	private static _id = 0;

	/** 物件初始設定值 */
	public readonly options: OptionManager;

	/** 管理 Design 的編輯歷史 */
	public readonly history: HistoryManager;

	/** 給 Vue 排序用的 id */
	public readonly id: number = DesignBase._id++;

	protected readonly data: JDesign;

	public abstract readonly tree: Tree;

	protected abstract readonly LayoutSheet: Sheet;

	protected abstract readonly TreeSheet: Sheet;

	constructor(studio: BPStudio, profile: RecursivePartial<JDesign>) {
		super(studio);

		this.data = deepCopy<JDesign>(Migration.getSample(), profile);

		if(this.data.tree.nodes.length < 3) throw new Error("Invalid format.");

		this.options = new OptionManager(this.data);
		this.history = new HistoryManager(this);
	}

	/**
	 * 把 `this.edges.toJSON()` 產出的 `JEdge[]` 做一個排序，
	 * 使得從第一條邊開始逐一加入邊都能維持連通性。
	 *
	 * 雖然現在載入資料的程式也已經做了防呆，但總之還是把這個做上去。
	 */
	protected sortJEdge(): JEdge[] {
		let edges = this.edges.toJSON();
		if(edges.length == 0) return [];
		let nodes = new Set<number>();
		let result: JEdge[] = [];
		while(edges.length) {
			let e = edges.shift()!;
			if(nodes.size == 0 || nodes.has(e.n1) || nodes.has(e.n2)) {
				result.push(e);
				nodes.add(e.n1);
				nodes.add(e.n2);
			} else edges.push(e);
		}
		return result;
	}

	/**
	 * 目前的 `Design` 是否正在拖曳當中。
	 *
	 * 跟 `System._dragging` 的小差異是，前者只有真的發生整數拖曳時才會為真，
	 * 後者則只要滑鼠有微微拖曳就會為真。
	 */
	@shrewd public dragging: boolean = false;

	@shrewd public get isActive(): boolean {
		return (this instanceof Design) && (this.mountTarget as BPStudio).design == this;
	}

	@shrewd public get patternNotFound() {
		return [...this.stretches.values()].some(s => s.isTotallyValid && s.pattern == null);
	}

	protected onDispose(): void {
		this.edges.dispose();
		this.vertices.dispose();
		this.rivers.dispose();
		this.flaps.dispose();
		this.stretches.dispose();
		this.junctions.dispose();
	}

	public readonly edges = new Mapping<TreeEdge, Edge>(
		() => this.tree.edge.values(),
		e => new Edge(this.TreeSheet, this.vertices.get(e.n1)!, this.vertices.get(e.n2)!, e)
	);

	public readonly rivers = new Mapping<TreeEdge, River>(
		() => [...this.tree.edge.values()].filter(e => e.isRiver),
		e => new River(this.LayoutSheet, e)
	);

	public readonly vertices = new Mapping<TreeNode, Vertex>(
		() => this.tree.node.values(),
		n => new Vertex(this.TreeSheet, n)
	);

	public readonly flaps = new Mapping<TreeNode, Flap>(
		() => this.tree.leaf,
		l => new Flap(this.LayoutSheet, l)
	)

	/** 當前所有的 `Flap` 兩兩構成的 Junction */
	public abstract readonly junctions: DoubleMapping<Flap, Junction>;

	@unorderedArray("allJ") public get allJunctions(): readonly Junction[] {
		let result = Array.from(this.junctions.values());
		return result;
	}

	@unorderedArray("vj") public get validJunctions(): readonly Junction[] {
		return this.allJunctions.filter(j => j.isValid);
	}

	/**
	 * 當前所有「活躍」的 `Junction`，亦即實際上會被納入 `Pattern` 計算的那些。
	 *
	 * 這會排除掉被覆蓋的 `Junction`。
	 */
	@unorderedArray("aj") private get activeJunctions(): readonly Junction[] {
		return this.validJunctions.filter(j => !j.isCovered);
	}

	/**
	 * 當前所有的 `Junction` 群組（即 `Team`，雖然這不是程式碼中的類別）。
	 */
	@shrewd public get teams(): Map<string, readonly Junction[]> {
		let arr: Junction[];
		let set = new Set<Junction>(this.activeJunctions);
		let result = new Map<string, Junction[]>();
		function add(junction: Junction) {
			if(!set.has(junction)) return;
			arr.push(junction);
			set.delete(junction);
			for(let j of junction.neighbors) add(j);
		}
		while(set.size > 0) {
			arr = [];
			add(set.values().next().value);
			arr.sort(Junction.sort);
			result.set(Junction.createTeamId(arr, f => f.node.id), arr);
		}
		return result;
	}

	/**
	 * 當前所有對應於 `Team` 的 `Stretch`。
	 *
	 * 之所以這邊要先把 this.junctions 映射到 this.teams 之上、然後再映射到 this.stretches，
	 * 是因為如果直接利用 `GroupMapping` 類別進行映射的話、
	 * 會在判斷 `Stretch` 是否棄置時發生循環參照的問題。
	 */
	public readonly stretches = new Mapping<string, Stretch>(
		() => this.teams.keys(),
		signature => new Stretch(this.LayoutSheet, signature)
	);

	/**
	 * 當前所有的 `Device`。這個列表是用來提供給 CPSheet 的控制項工廠用的。
	 */
	@shrewd protected get devices(): Device[] {
		let result: Device[] = [];
		for(let s of this.stretches.values()) result.push(...s.devices);
		return result;
	}

	@shrewd private get stretchByQuadrant(): ReadonlyMap<Quadrant, Stretch> {
		let result = new Map<Quadrant, Stretch>();
		for(let s of this.stretches.values()) if(s.isActive) {
			for(let o of s.junctions) {
				result.set(o.q1!, s);
				result.set(o.q2!, s);
			}
		}
		return result;
	}

	public getStretchByQuadrant(quadrant: Quadrant): Stretch | null {
		return this.stretchByQuadrant.get(quadrant) ?? null;
	}

	@shrewd public get flapsById(): ReadonlyMap<number, Flap> {
		let result = new Map<number, Flap>();
		for(let f of this.flaps.values()) result.set(f.node.id, f);
		return result;
	}

	@shrewd public get openAnchors(): Map<string, Point[]> {
		let result = new Map<string, Point[]>();
		for(let s of this.activeStretches) {
			let f = s.fx * s.fy;
			for(let d of s.pattern!.devices) {
				for(let a of d.openAnchors) {
					let key = f + "," + (a.x - f * a.y);
					let arr = result.get(key);
					if(!arr) result.set(key, arr = []);
					arr.push(a);
				}
			}
		}
		return result;
	}

	@shrewd private get activeStretches(): Stretch[] {
		return [...this.stretches.values()].filter(s => s.isActive && !!s.pattern);
	}
}

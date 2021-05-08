
//////////////////////////////////////////////////////////////////
/**
 * `BPStudio` 類別是 `Studio` 類別的對外包裝，
 * 終極目標是要將所有的對外介面集中到這個類別裡面來統一管理，
 * 並且隔離這些介面背後對應的實作。
 *
 * 這個類別底下所有的公開成員自動全部都是對外介面，所以不特別註記 @exports。
 * 同時由於無法完全假定呼叫的程式能正確傳入資料型別，
 * 因此原則上對於傳入的參數都應該進行基本的檢查。
 */
//////////////////////////////////////////////////////////////////

class BPStudio {

	private readonly _studio: Studio;

	constructor(selector: string) {
		if(typeof paper != "object") throw new Error("BPStudio requires paper.js.");
		this._studio = new Studio(selector);
	}

	//////////////////////////////////////////////////////////////////
	// 公開子物件
	//////////////////////////////////////////////////////////////////

	public get option(): StudioOptions { return this._studio.$option; }
	public get settings(): DisplaySetting { return this._studio.$display.$settings; }
	public get TreeMaker() { return TreeMaker; }


	//////////////////////////////////////////////////////////////////
	// 存取子
	//////////////////////////////////////////////////////////////////

	public get design(): Design | null { return this._studio.$design; }
	public set design(d) {
		if(d !== null && !(d instanceof Design)) return;
		this._studio.$design = d;
	}

	/** 這是一個偵錯 glitch 用的屬性，正常情況不會用到（參見 Pattern.ts） */
	public get running() { return this._studio.$updater.$updating; }


	//////////////////////////////////////////////////////////////////
	// Design 性質
	//////////////////////////////////////////////////////////////////

	public patternNotFound(design: unknown): boolean {
		if(design instanceof Design) return design.$stretches.$patternNotFound;
		return false;
	}

	public isMinimal(design: unknown): boolean {
		if(design instanceof Design) return design.$tree.$isMinimal;
		return false;
	}


	//////////////////////////////////////////////////////////////////
	// UI 方法
	//////////////////////////////////////////////////////////////////

	/** 除了動畫呼叫之外，跟 tab 有關的操作也會呼叫此方法 */
	public update(): Promise<void> { return this._studio.$updater.$update(); }

	public get selection(): Control[] { return this._studio.$system.$selection.$items; }
	public get draggableSelected(): boolean {
		return this._studio.$system.$selection.$hasDraggable();
	}
	public get isDragging(): boolean { return this._studio.$system.$drag.$on; }
	public dragByKey(key: unknown): void {
		if(typeof key != 'string') return;
		this._studio.$system.$drag.$processKey(key);
	}


	//////////////////////////////////////////////////////////////////
	// 物件導覽
	//////////////////////////////////////////////////////////////////

	/** 傳回物件對應的 `Repository`、若有的話 */
	public getRepository(target: unknown): Repository | null {
		if(target instanceof Device) return target.$pattern.$configuration.$repository;
		else if(target instanceof Stretch) return target.$repository;
		else return null;
	}

	/** 傳回控制項的類別字串 */
	public getType(target: unknown): string | null {
		if(target instanceof Control) return target.$type;
		return null;
	}

	/** 導覽至對偶的控制項 */
	public goToDual(subject: unknown) {
		let design = this._studio.$design;
		if(!design) return;

		if(Array.isArray(subject)) {
			if(isTypedArray(subject, Vertex)) design.$vertices.$toFlap(subject);
			if(isTypedArray(subject, Flap)) design.$flaps.$toVertex(subject);
		} else {
			if(subject instanceof Edge) design.$edges.$toRiver(subject);
			if(subject instanceof River) design.$rivers.$toEdge(subject);
		}
	}

	/** 刪除一個指定的物件，並傳回成功與否 */
	public delete(subject: unknown): boolean {
		let design = this._studio.$design;
		if(!design) return false;

		if(Array.isArray(subject)) {
			if(isTypedArray(subject, Vertex)) return design.$vertices.$delete(subject);
			if(isTypedArray(subject, Flap)) return design.$flaps.$delete(subject);
		} else {
			if(subject instanceof Edge) return subject.$edge.$delete();
			if(subject instanceof River) return subject.$delete();
		}
		return false;
	}

	/** 替物件產生 GUID 並且傳回 */
	public guid(object: unknown): string {
		if(typeof object != 'object' || object === null) return "";
		return MathUtil.$guid(object);
	}

	//////////////////////////////////////////////////////////////////
	// 專案管理
	//////////////////////////////////////////////////////////////////

	public getDesigns(): Design[] { return [...this._studio.$designMap.values()]; }
	public getDesign(id: unknown): Design | undefined {
		if(typeof id == 'number') return this._studio.$designMap.get(id);
		return undefined;
	}
	public create(json: unknown): Design {
		if(json && typeof json == 'object') return this._studio.$create(json as Pseudo<JDesign>);
		throw new Error();
	}
	public restore(json: unknown): Design {
		if(json && typeof json == 'object') return this._studio.$restore(json as Pseudo<JDesign>);
		throw new Error();
	}
	public select(id: unknown): void {
		if(typeof id == 'number' || id === null) this._studio.$select(id as number | null);
	}
	public close(id: unknown): void {
		if(typeof id == 'number') this._studio.$close(id);
	}
	public closeAll(): void { this._studio.$closeAll(); }
	public toBPS(): string { return this._studio.$CreateBpsUrl(); }

	public load(json: unknown): Design | undefined {
		try {
			if(typeof json == 'string' || typeof json == 'object' && json !== null) {
				return this._studio.$load(json);
			}
			return undefined;
		} catch(e) {
			return undefined;
		}
	}


	//////////////////////////////////////////////////////////////////
	// 圖像處理
	//////////////////////////////////////////////////////////////////

	public onBeforePrint(): void { this._studio.$display.$rasterizer.$beforePrint(); }
	public toSVG(): string { return this._studio.$display.$createSvgUrl(); }
	public toPNG(): Promise<string> { return this._studio.$display.$rasterizer.$createPngUrl(); }
	public copyPNG(): Promise<void> { return this._studio.$display.$rasterizer.$copyPNG(); }


	//////////////////////////////////////////////////////////////////
	// 歷史操作
	//////////////////////////////////////////////////////////////////

	public notifySaveAll() { this._studio.$designMap.forEach(d => this.notifySave(d)); }
	public notifySave(design: unknown) {
		if(design instanceof Design) design.$history.$notifySave();
	}
	public isModified(design: unknown): boolean {
		return design instanceof Design ? design.$history.$modified : false;
	}
	public canUndo(design: unknown): boolean {
		return design instanceof Design ? design.$history.$canUndo : false;
	}
	public canRedo(design: unknown): boolean {
		return design instanceof Design ? design.$history.$canRedo : false;
	}
	public undo(design: unknown): void { if(design instanceof Design) design.$history.$undo(); }
	public redo(design: unknown): void { if(design instanceof Design) design.$history.$redo(); }
}

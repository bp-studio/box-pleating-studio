// Level 0
/// <reference path="global/import.ts" />
/// <reference path="global/Decorators.ts" />
/// <reference path="design/layout/Region.ts" />
/// <reference path="class/Disposable.ts" />
/// <reference path="class/math/PolyBool.ts" />
/// <reference path="design/command/Command.ts" />

// Level 1
/// <reference path="design/layout/Piece.ts" />
/// <reference path="design/layout/AddOn.ts" />
/// <reference path="class/mapping/DoubleMap.ts" />
/// <reference path="class/mapping/BaseMapping.ts" />
/// <reference path="class/mapping/DoubleMapping.ts" />
/// <reference path="class/math/Fraction.ts" />
/// <reference path="design/layout/Partitioner.ts" />
/// <reference path="design/helper/RiverHelperBase.ts" />
/// <reference path="design/helper/QuadrantHelper.ts" />
/// <reference path="design/command/FieldCommand.ts" />
/// <reference path="design/command/MoveCommand.ts" />
/// <reference path="design/command/EditCommand.ts" />

// Level 2
/// <reference path="class/mapping/Mapping.ts" />
/// <reference path="class/mapping/GroupMapping.ts" />
/// <reference path="class/Mountable.ts" />
/// <reference path="design/schema/Tree.ts" />
/// <reference path="class/math/Couple.ts" />
/// <reference path="design/layout/Partition.ts" />
/// <reference path="design/helper/RiverHelper.ts" />
/// <reference path="design/containers/JunctionContainer.ts" />

// Level 3
/// <reference path="design/Design.ts" />
/// <reference path="class/SheetObject.ts" />
/// <reference path="design/components/Sheet.ts" />
/// <reference path="design/view/View.ts" />
/// <reference path="design/schema/TreeNode.ts" />
/// <reference path="design/schema/TreeEdge.ts" />
/// <reference path="class/math/Point.ts" />
/// <reference path="class/math/Vector.ts" />
/// <reference path="design/containers/BaseContainer.ts" />

// Level 4
/// <reference path="class/Control.ts" />
/// <reference path="design/components/Quadrant.ts" />
/// <reference path="design/layout/Stretch.ts" />
/// <reference path="design/layout/Pattern.ts" />
/// <reference path="design/layout/Store.ts" />
/// <reference path="design/view/ControlView.ts" />
/// <reference path="design/view/DragSelectView.ts" />
/// <reference path="design/view/SheetView.ts" />
/// <reference path="design/containers/StretchContainer.ts" />
/// <reference path="design/containers/EdgeContainer.ts" />
/// <reference path="design/containers/FlapContainer.ts" />
/// <reference path="design/containers/VertexContainer.ts" />
/// <reference path="env/controllers/CursorController.ts" />

// Level 5
/// <reference path="class/ViewedControl.ts" />
/// <reference path="design/layout/Configuration.ts" />
/// <reference path="design/view/LabeledView.ts" />
/// <reference path="design/view/JunctionView.ts" />
/// <reference path="design/view/RiverView.ts" />

// Level 6
/// <reference path="class/Draggable.ts" />
/// <reference path="design/view/FlapView.ts" />
/// <reference path="design/view/EdgeView.ts" />
/// <reference path="design/view/VertexView.ts" />

// Level 7
/// <reference path="class/IndependentDraggable.ts" />
/// <reference path="design/layout/Device.ts" />

// Level 8
/// <reference path="design/components/Flap.ts" />
/// <reference path="design/components/Vertex.ts" />


//////////////////////////////////////////////////////////////////
/**
 * `BPStudio` 類別是 `Studio` 類別的對外包裝，
 * 終極目標是要將所有的對外介面集中到這個類別裡面來統一管理，
 * 並且隔離這些介面背後對應的實作。
 *
 * 這個類別底下所有的公開成員自動全部都是對外介面，所以不特別註記 @exports。
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
	public set design(d) { this._studio.$design = d; }

	/** 這是一個偵錯 glitch 用的屬性，正常情況不會用到（參見 Pattern.ts） */
	public get running() { return this._studio.$updater.$updating; }


	//////////////////////////////////////////////////////////////////
	// UI 方法
	//////////////////////////////////////////////////////////////////

	/** 除了動畫呼叫之外，跟 tab 有關的操作也會呼叫此方法 */
	public update(): Promise<void> { return this._studio.$updater.$update(); }

	public get selection(): Control[] { return this._studio.$system.$selection.$items; }
	public get draggableSelected(): boolean { return this._studio.$system.$selection.$hasDraggable(); }
	public get isDragging(): boolean { return this._studio.$system.$drag.$on; }
	public dragByKey(key: string): void { this._studio.$system.$drag.processKey(key); }


	//////////////////////////////////////////////////////////////////
	// 物件導覽
	//////////////////////////////////////////////////////////////////

	/** 傳回物件對應的 `Repository`、若有的話 */
	public getRepository(target: any): Repository | null {
		if(target instanceof Device) return target.$pattern.$configuration.$repository;
		else if(target instanceof Stretch) return target.$repository;
		else return null;
	}

	/** 傳回控制項的類別字串 */
	public getType(target: any): string | null {
		if(target instanceof Control) return target.$type;
		return null;
	}


	//////////////////////////////////////////////////////////////////
	// 專案管理
	//////////////////////////////////////////////////////////////////

	public getDesigns(): Design[] { return [...this._studio.$designMap.values()]; }
	public getDesign(id: number): Design | undefined { return this._studio.$designMap.get(id); }
	public load(json: string | object): Design { return this._studio.$load(json); }
	public create(json: any): Design { return this._studio.$create(json); }
	public restore(json: any): Design { return this._studio.$restore(json); }
	public select(id: number | null): void { this._studio.$select(id); }
	public close(id: number): void { this._studio.$close(id); }
	public closeAll(): void { this._studio.$closeAll(); }
	public toBPS(): string { return this._studio.$CreateBpsUrl(); }


	//////////////////////////////////////////////////////////////////
	// 圖像處理
	//////////////////////////////////////////////////////////////////

	public onBeforePrint(): void { this._studio.$display.$rasterizer.$beforePrint(); }
	public toSVG(): string { return this._studio.$display.$rasterizer.$createSvgUrl(); }
	public toPNG(): Promise<string> { return this._studio.$display.$rasterizer.$createPngUrl(); }
	public copyPNG(): Promise<void> { return this._studio.$display.$rasterizer.$copyPNG(); }


	//////////////////////////////////////////////////////////////////
	// 歷史操作
	//////////////////////////////////////////////////////////////////

	public notifySaveAll() { this._studio.$designMap.forEach(d => this.notifySave(d)); }
	public notifySave(design: any) { if(design instanceof Design) design.$history.$notifySave(); }
	public isModified(design: any): boolean { return design instanceof Design ? design.$history.$modified : false; }
	public canUndo(design: any): boolean { return design instanceof Design ? design.$history.$canUndo : false; }
	public canRedo(design: any): boolean { return design instanceof Design ? design.$history.$canRedo : false; }
	public undo(design: any): void { if(design instanceof Design) design.$history.$undo(); }
	public redo(design: any): void { if(design instanceof Design) design.$history.$redo(); }
}

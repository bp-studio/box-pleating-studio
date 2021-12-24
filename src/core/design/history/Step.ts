import { $resolve } from "./commands";
import { nonEnumerable } from "bp/global";
import { Control } from "bp/design/class";
import type { Command } from "./commands";
import type { Design } from "..";
import type { DesignMode, JStep, Memento } from "bp/content/json";
import type { ISerializable } from "bp/global";


//////////////////////////////////////////////////////////////////
/**
 * {@link Step} 代表 {@link HistoryManager} 中的一個操作步驟。
 */
//////////////////////////////////////////////////////////////////

export class Step implements ISerializable<JStep> {

	private static readonly _AUTO_RESET = 1000;

	public static restore(design: Design, json: JStep): Step {
		json.commands = json.commands.map(c => $resolve(design, c));
		return new Step(design, json as JStep<Command>);
	}

	/** 將 {@link Command} 陣列依照簽章排序並且傳回整體簽章 */
	private static signature(commands: readonly Command[]): string {
		let arr = commands.concat();
		arr.sort((a, b) => a.$signature.localeCompare(b.$signature));
		return arr.map(c => c.$signature).join(";");
	}

	private readonly _commands: readonly Command[];
	private readonly _construct: Memento[];
	private readonly _destruct: Memento[];
	private readonly _mode: DesignMode;
	private readonly _before: string[];
	private readonly _after: string[];

	constructor(design: Design, json: JStep<Command>) {
		this._design = design;
		this._signature = Step.signature(json.commands);

		this._commands = json.commands;
		this._construct = json.construct ?? [];
		this._destruct = json.destruct ?? [];
		this._before = json.before;
		this._after = json.after;
		this._mode = json.mode;

		this._reset();
	}

	@nonEnumerable private readonly _design: Design;
	@nonEnumerable private readonly _signature: string;

	/** 已經不允許合併 */
	@nonEnumerable private _fixed: boolean = false;

	@nonEnumerable private _timeout: number;

	/** 重置自動鎖定 */
	private _reset(): void {
		if(this._timeout) clearTimeout(this._timeout);
		if(!this._fixed) this._timeout = window.setTimeout(() => this._fix(), Step._AUTO_RESET);
	}

	/** 自動鎖定自身 */
	private _fix(): void {
		if(this._design.$dragging) this._reset(); // 還在拖曳中的話先不鎖定
		else this._fixed = true;
	}

	public $tryAdd(commands: readonly Command[],
		construct: Memento[], destruct: Memento[]): boolean {
		// 已經操作過的 Step 是無法被合併的
		if(this._fixed) return false;

		// 先確定合併可以執行
		if(Step.signature(commands) != this._signature) return false;
		for(let i = 0; i < commands.length; i++) {
			if(!commands[i].$canAddTo(this._commands[i])) return false;
		}

		// 再正式合併
		for(let i = 0; i < commands.length; i++) {
			commands[i].$addTo(this._commands[i]);
		}
		this._construct.push(...construct);
		this._destruct.push(...destruct);
		this._reset();
		return true;
	}

	/** 這整個 {@link Step} 是否等於什麼都沒做 */
	public get $isVoid(): boolean {
		return this._commands.every(c => c.$isVoid) && this._construct.length == 0 && this._destruct.length == 0;
	}

	public $undo(): void {
		// undo 的時候以相反順序執行
		let com = this._commands.concat().reverse();
		for(let c of com) c.$undo();
		let des = this._destruct.concat().reverse();
		for(let memento of des) this._design.$options.set(...memento);
		this._design.mode = this._mode;
		this._restoreSelection(this._before);
		this._fixed = true;
	}

	public $redo(): void {
		for(let c of this._commands) c.$redo();
		for(let memento of this._construct) this._design.$options.set(...memento);
		this._design.mode = this._mode;
		this._restoreSelection(this._after);
		this._fixed = true;
	}

	public toJSON(): JStep {
		let result: JStep = {
			commands: this._commands,
			construct: this._construct,
			destruct: this._destruct,
			mode: this._mode,
			before: this._before,
			after: this._after,
		};
		if(!this._construct.length) delete result.construct;
		if(!this._destruct.length) delete result.destruct;
		return result;
	}

	private _restoreSelection(tags: string[]): void {
		this._design.sheet.$clearSelection();
		for(let tag of tags) {
			let obj = this._design.$query(tag);
			if(obj instanceof Control) obj.$selected = true;
		}
	}
}

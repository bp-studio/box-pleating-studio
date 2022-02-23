import { nonEnumerable } from "bp/global";
import type { CommandType, JCommand } from "bp/content/json";
import type { IDesignLike } from "bp/content/interface";

export type Typeless<T extends JCommand> = Omit<T, 'type'>;

//=================================================================
/**
 * {@link Command} 類別是使用者編輯操作的基底類別。
 */
//=================================================================

export abstract class Command implements JCommand {

	@nonEnumerable protected readonly _design: IDesignLike;

	/** @exports */
	public abstract readonly type: CommandType;

	/** @exports */
	public readonly tag: string;

	public get $signature(): string { return this.type + ":" + this.tag; }

	constructor(design: IDesignLike, json: Typeless<JCommand>) {
		this._design = design;
		this.tag = json.tag;
	}

	/** 是否這個 {@link Command} 實際上並沒有改變任何東西、可以被當作沒發生 */
	public abstract get $isVoid(): boolean;

	/** 判斷這個 {@link Command} 是否可以被整合至另外一個給定的 {@link Command} 當中 */
	public abstract $canAddTo(command: Command): boolean;

	/** 將這個 {@link Command} 整合至另外一個給定的 {@link Command} 當中 */
	public abstract $addTo(command: Command): void;

	/** 取消這個 {@link Command} 的效果 */
	public abstract $undo(): void;

	/** 重做這個 {@link Command} 的效果 */
	public abstract $redo(): void;
}

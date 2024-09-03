import type { Project } from "client/project/project";
import type { CommandType } from "shared/json/enum";
import type { JCommand } from "shared/json/history";

export type Typeless<T extends JCommand> = Omit<T, "type">;

const projectMap = new WeakMap<Command, Project>();

//=================================================================
/**
 * {@link Command} is the base class for editing operations.
 */
//=================================================================

export abstract class Command implements JCommand {

	public abstract readonly type: CommandType;
	public readonly tag: string;

	protected get _project(): Project { return projectMap.get(this)!; }

	public get $signature(): string { return this.type + ":" + this.tag; }

	constructor(project: Project, json: Typeless<JCommand>) {
		projectMap.set(this, project);
		this.tag = json.tag;
	}

	/** Whether this {@link Command} doesn't actually change anything, and can be ignored. */
	public abstract get $isVoid(): boolean;

	/** Determine if this {@link Command} can be combined into another {@link Command}. */
	public abstract $canAddTo(command: Command): boolean;

	/** Combine this {@link Command} into the given {@link Command}. */
	public abstract $addTo(command: Command): void;

	/** Undo this {@link Command}. */
	public abstract $undo(): Promise<void>;

	/** Redo this {@link Command}. */
	public abstract $redo(): Promise<void>;
}

/** Return the signature of a {@link Command} array. */
export function signature(commands: readonly Command[]): string {
	const arr = commands.concat();
	arr.sort((a, b) => a.$signature.localeCompare(b.$signature));
	return arr.map(c => c.$signature).join(";");
}

import type { CommandType } from "./enum";
import type { DesignMode } from "./project";

export interface JHistory {

	/** Current position */
	index: number;

	/** Position on last saving */
	savedIndex: number;

	/** All history records */
	steps: JStep[];
}

export interface JStep<T extends JCommand = JCommand> {
	commands: readonly T[];
	construct?: Memento[];
	destruct?: Memento[];
	mode: DesignMode;

	/** Tags of selected objects before the step. */
	before: string[];

	/** Tags of selected objects after the step. */
	after: string[];
}

export type Memento = [string, object];

export interface JCommand {
	readonly type: CommandType;

	/**
	 * The tag of the effected object.
	 *
	 * Considering GC, {@link JCommand} doesn't keep the reference of the object.
	 */
	readonly tag: string;
}


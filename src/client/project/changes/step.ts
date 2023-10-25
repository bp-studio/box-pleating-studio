import { Control } from "client/base/control";
import { signature } from "./commands/command";
import { SelectionController } from "client/controllers/selectionController";
import { $resolve } from "./commands/resolve";
import { clone } from "shared/utils/clone";

import type { Command } from "./commands/command";
import type { Project } from "../project";
import type { DesignMode } from "shared/json/project";
import type { JCommand, JStep, Memento } from "shared/json/history";

const AUTO_RESET = 1000;

export enum OperationResult {
	/** The operation completely failed. */
	Failed,
	/** The operation successfully carried some of the {@link Command}s, but not all of them. */
	Partial,
	/** The operation completely succeeded. */
	Success,
}

//=================================================================
/**
 * {@link Step} represents a single entry in the {@link HistoryManager}.
 */
//=================================================================

export class Step implements ISerializable<JStep> {

	/** The current {@link Step} no longer accepts combinations. */
	private _sealed: boolean = false;

	private readonly _project: Project;
	private readonly _signature: string;
	private readonly _commands: readonly Command[];

	/**
	 * {@link Memento}s that represented objects constructed in this {@link Step}
	 * (possibly contains outdated records).
	 */
	private readonly _construct: Memento[];

	/**
	 * {@link Memento}s that represented objects destructed in this {@link Step}
	 * (possibly contains outdated records).
	 */
	private readonly _destruct: Memento[];

	/** The {@link DesignMode} when the operation took place. */
	private readonly _mode: DesignMode;

	/** Tags of objects selected before this {@link Step}. */
	private readonly _before: string[];

	/** Tags of objects selected after this {@link Step}. */
	private readonly _after: string[];

	private _timeout!: number;

	constructor(project: Project, json: JStep<Command>) {
		this._project = project;
		this._signature = signature(json.commands);

		this._commands = json.commands;
		this._construct = json.construct ?? [];
		this._destruct = json.destruct ?? [];
		this._before = json.before;
		this._after = json.after;
		this._mode = json.mode;

		this._reset();
	}

	public toJSON(): JStep<JCommand> {
		return {
			commands: this._commands,
			mode: this._mode,
			before: this._before,
			after: this._after,
			construct: this._construct.length ? clone(this._construct) : undefined,
			destruct: this._destruct.length ? clone(this._destruct) : undefined,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Whether this {@link Step} doesn't actually do anything. */
	public get $isVoid(): boolean {
		return this._commands.every(c => c.$isVoid) && this._construct.length == 0 && this._destruct.length == 0;
	}

	public $tryAdd(commands: readonly Command[],
		construct: Memento[], destruct: Memento[]): boolean {
		if(this._sealed) return false;

		// Check if combining is valid
		if(signature(commands) != this._signature) return false;
		for(let i = 0; i < commands.length; i++) {
			if(!commands[i].$canAddTo(this._commands[i])) return false;
		}

		// Perform combination
		for(let i = 0; i < commands.length; i++) {
			commands[i].$addTo(this._commands[i]);
		}

		// Pay attention that destruction goes first
		for(const memento of destruct) this._tryAddDestruct(memento);
		for(const memento of construct) this._tryAddConstruct(memento);

		this._reset();
		return true;
	}

	public async $redo(): Promise<OperationResult> {
		this._project.design.$addMementos(this._construct);

		let result = OperationResult.Success;
		const firstReject = await runCommandsAsync(this._commands, c => c.$redo());
		if(firstReject == 0) return OperationResult.Failed;
		if(firstReject > 0) {
			(this._commands as Command[]).splice(firstReject);
			result = OperationResult.Partial;
		}

		this._project.design.mode = this._mode;
		this._restoreSelection(this._after);
		this._sealed = true;
		return result;
	}

	public async $undo(): Promise<OperationResult> {
		// undo is performed in opposite ordering
		const memosToReconstruct = this._destruct.toReversed();
		this._project.design.$addMementos(memosToReconstruct);
		const commands = this._commands.toReversed();

		let result = OperationResult.Success;
		const firstReject = await runCommandsAsync(commands, c => c.$undo());
		if(firstReject == 0) return OperationResult.Failed;
		if(firstReject > 0) {
			(this._commands as Command[]).splice(0, this._commands.length - firstReject);
			result = OperationResult.Partial;
		}

		this._project.design.mode = this._mode;
		this._restoreSelection(this._before);
		this._sealed = true;
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Reset auto-sealing */
	private _reset(): void {
		if(this._timeout) clearTimeout(this._timeout);
		if(!this._sealed) this._timeout = setTimeout(() => this._seal(), AUTO_RESET);
	}

	/** Automatically seal self. */
	private _seal(): void {
		if(this._project.$isDragging) this._reset(); // Skip the sealing if we're still dragging.
		else this._sealed = true;
	}

	private _restoreSelection(tags: string[]): void {
		SelectionController.clear();
		for(const tag of tags) {
			const obj = this._project.design.$query(tag);
			if(obj instanceof Control) SelectionController.$toggle(obj, true);
		}
	}

	private _tryAddConstruct(memento: Memento): void {
		let index = this._construct.findIndex(m => m[0] == memento[0]);
		if(index >= 0) this._construct.splice(index, 1);

		// Cancelling existing destruction
		index = this._destruct.findIndex(m =>
			m[0] == memento[0] &&
			JSON.stringify(m[1]) == JSON.stringify(memento[1])
		);
		if(index >= 0) this._destruct.splice(index, 1);
		else this._construct.push(memento);
	}

	private _tryAddDestruct(memento: Memento): void {
		let index = this._destruct.findIndex(m => m[0] == memento[0]);
		if(index >= 0) return;

		// Cancelling existing construction
		index = this._construct.findIndex(m =>
			m[0] == memento[0] &&
			JSON.stringify(m[1]) == JSON.stringify(memento[1])
		);
		if(index >= 0) this._construct.splice(index, 1);
		else this._destruct.push(memento);
	}
}

export function restore(project: Project, json: JStep): Step {
	json.commands = json.commands.map(c => $resolve(project, c));
	return new Step(project, json as JStep<Command>);
}

/**
 * Run {@link Command}s until the first rejection,
 * and return the index of the rejected command,
 * or `-1` if all promises resolved.
 */
async function runCommandsAsync(
	commands: readonly Command[],
	factory: Func<Command, Promise<void>>
): Promise<number> {
	let result = -1;
	async function run(c: Command, i: number): Promise<void> {
		if(result != -1) return;
		try {
			await factory(c);
		} catch {
			if(i < result) result = i;
		}
	}
	await Promise.all(commands.map(run));
	return result;
}

import { Control } from "client/base/control";
import { signature } from "./commands/command";
import { SelectionController } from "client/controllers/selectionController";
import { $resolve } from "./commands/resolve";

import type { Command } from "./commands/command";
import type { Project } from "../project";
import type { DesignMode } from "shared/json/project";
import type { JCommand, JStep, Memento } from "shared/json/history";

const AUTO_RESET = 1000;

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
	private readonly _construct: Memento[];
	private readonly _destruct: Memento[];
	private readonly _mode: DesignMode;
	private readonly _before: string[];
	private readonly _after: string[];
	private _timeout!: Timeout;

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
			commands: [],
			mode: "layout",
			before: [],
			after: [],
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
		this._construct.push(...construct);
		this._destruct.push(...destruct);
		this._reset();
		return true;
	}

	public $redo(): void {
		for(const c of this._commands) c.$redo();
		this._project.design.$addMementos(this._construct);
		this._project.design.mode = this._mode;
		this._restoreSelection(this._after);
		this._sealed = true;
	}

	public $undo(): void {
		// undo is performed in opposite ordering
		const com = this._commands.concat().reverse();
		for(const c of com) c.$undo();

		this._project.design.$addMementos(this._destruct);
		this._project.design.mode = this._mode;
		this._restoreSelection(this._before);
		this._sealed = true;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Reset auto-sealing */
	private _reset(): void {
		if(this._timeout) clearTimeout(this._timeout);
		if(!this._sealed) this._timeout = window.setTimeout(() => this._seal(), AUTO_RESET);
	}

	/** Automatically seal self. */
	private _seal(): void {
		if(this._project.$isDragging) this._reset(); // Skip the sealing if we're still dragging.
		else this._sealed = true;
	}

	private _restoreSelection(tags: string[]): void {
		SelectionController.clear();
		for(const tag of tags) {
			const obj = this._project.design.$query?.(tag);
			if(obj instanceof Control) SelectionController.$toggle(obj, true);
		}
	}
}

export function restore(project: Project, json: JStep): Step {
	json.commands = json.commands.map(c => $resolve(project, c));
	return new Step(project, json as JStep<Command>);
}

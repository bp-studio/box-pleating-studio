import { shallowReactive } from "vue";

import { shallowRef } from "client/shared/decorators";
import { FieldCommand } from "./commands/fieldCommand";
import { Step, restore } from "./step";

import type { Project } from "../project";
import type { ITagObject } from "client/shared/interface";
import type { Command } from "./commands/command";
import type { JHistory, Memento } from "shared/json/history";
import type { Control } from "client/base/control";

const MAX_STEP = 30;

//=================================================================
/**
 * {@link HistoryManager} manages history record of editing operations.
 */
//=================================================================

export default class HistoryManager implements ISerializable<JHistory> {

	/** Current history location. */
	@shallowRef private _index: number = 0;

	/** History location during last file saving. */
	@shallowRef private _savedIndex: number = 0;

	private readonly _project: Project;
	private readonly _steps: Step[] = shallowReactive([]);

	private _queue: Command[] = [];
	private _construct: Memento[] = [];
	private _destruct: Memento[] = [];

	/** Tags of last-known selected {@link Control}s. */
	private _selection?: string[] = [];

	/**
	 * Whether we're navigating the history.
	 * In that case the changes are not recorded.
	 *
	 * The initial value is true, so that the initialization of a {@link Project}
	 * will not create any commands.
	 */
	private _moving: boolean = true;

	constructor(project: Project, json?: JHistory) {
		this._project = project;
		if(json) {
			try {
				this._steps.push(...json.steps.map(s => restore(project, s)));
				this._index = json.index;
				this._savedIndex = json.savedIndex;
			} catch(e) { }
		}
	}

	public toJSON(): JHistory {
		return {
			index: this._index,
			savedIndex: this._savedIndex,
			steps: this._steps.map(s => s.toJSON()),
		};
	}

	public get isModified(): boolean {
		return this._savedIndex != this._index;
	}

	public notifySave(): void {
		this._savedIndex = this._index;
	}

	/**
	 * Handles accumulating operations and gather them into a {@link Step} object.
	 */
	public $flush(): void {
		const selection = this._project.design.sheet.$getSelectedTags();
		if(this._queue.length) {
			const s = this._lastStep;
			if(!s || !s.$tryAdd(this._queue, this._construct, this._destruct)) {
				const step = new Step(this._project, {
					commands: this._queue,
					construct: this._construct,
					destruct: this._destruct,
					mode: this._project.design.mode ?? "layout",
					before: this._selection || selection,
					after: selection,
				});
				if(!step.$isVoid) this._addStep(step);
			} else if(s.$isVoid) {
				this._steps.pop();
				this._index--;
			}
			this._queue = [];
			this._construct = [];
			this._destruct = [];
		}
		this._selection = undefined;
		this._moving = false;
	}

	public $cacheSelection(): void {
		this._selection = this._project.design.sheet.$getSelectedTags();
	}

	public $fieldChange(target: ITagObject, prop: string, oldValue: unknown, newValue: unknown): void {
		if(this._moving) return;
		this._enqueue(FieldCommand.create(target, prop, oldValue, newValue));
		this.$flush();
	}

	public get $canUndo(): boolean {
		return this._index > 0;
	}

	public get $canRedo(): boolean {
		return this._index < this._steps.length;
	}

	public $undo(): void {
		if(this.$canUndo) {
			this._moving = true;
			this._steps[--this._index].$undo();
			this.$flush();
		}
	}

	public $redo(): void {
		if(this.$canRedo) {
			this._moving = true;
			this._steps[this._index++].$redo();
			this.$flush();
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private get _lastStep(): Step | undefined {
		if(this._index == 0 || this._index < this._steps.length) return undefined;
		return this._steps[this._index - 1];
	}

	private _addStep(step: Step): void {
		// Remove all Steps afterwards
		if(this._steps.length > this._index) this._steps.length = this._index;

		// Add a new Step and move the index
		this._steps[this._index++] = step;

		// We keep at most 30 Steps, so get rid of the extras.
		if(this._steps.length > MAX_STEP) {
			this._steps.shift();
			this._index--;
			this._savedIndex--;
		}
	}

	private _enqueue(command: Command): void {
		if(this._moving) return;
		for(const q of this._queue) {
			if(command.$canAddTo(q)) return command.$addTo(q);
		}
		this._queue.push(command);
	}
}

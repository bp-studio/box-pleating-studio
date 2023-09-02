
import { Project } from "client/project/project";
import { Migration } from "client/patches";
import { deepAssign } from "shared/utils/clone";
import ProjectService from "client/services/projectService";

import type { ShallowRef } from "vue";
import type { JProject } from "shared/json";

/** The worker instance that is pre-generated and is standing-by; declared in HTML. */
declare let __worker: Worker | undefined;

/** The URL of the worker. Declared in HTML. */
declare const __worker_src: string;

export interface IProjectController {
	readonly current: ShallowRef<Project | null>;
	get(id: number): Project | undefined;
	create(json: RecursivePartial<JProject>): Promise<Project>;
	open(json: Pseudo<JProject>): Promise<Project>;
	close(proj: Project): void;
}

/**
 * For debugging memory leaks. When in debug mode,
 * it prints a message in the console after the {@link Project} has been garbage collected.
 * If the message fails to appear after closing the project and hitting the GC button,
 * we will then have to figure out what is keeping the reference of the project.
 */
let registry: FinalizationRegistry<number>;
if(DEBUG_ENABLED) {
	registry = new FinalizationRegistry(id => console.log(`Project #${id} GC.`));
}

//=================================================================
/**
 * {@link ProjectController} manages the creation of {@link Project} and the corresponding Core worker.
 */
//=================================================================

export namespace ProjectController {

	const projectMap = new Map<number, Project>();

	export const current = ProjectService.project;

	/** Return the {@link Project} by id. */
	export function get(id: number): Project | undefined {
		return projectMap.get(id);
	}

	/** Return all {@link Project}s. */
	export function all(): Project[] {
		return [...projectMap.values()];
	}

	/** Returns the standing-by worker, or create a new worker. */
	function getOrCreateWorker(): Worker {
		const worker = __worker ? __worker : new Worker(__worker_src);
		__worker = undefined;
		return worker;
	}

	/**
	 * Creates a new {@link Project}.
	 * The passed-in data will be deeply assigned on the template project instead of passing through migration.
	 */
	export function create(json: RecursivePartial<JProject>): Promise<Project> {
		json = deepAssign<RecursivePartial<JProject>>({
			design: {
				layout: {
					// In the old architecture, this part will be determined automatically,
					// but the new architecture has a different order of passing data,
					// so this part is needed from the beginning.
					flaps: [
						{ id: 1, x: 8, y: 10, width: 0, height: 0 },
						{ id: 2, x: 8, y: 6, width: 0, height: 0 },
					],
				},
				tree: {
					nodes: [
						{ id: 0, name: "", x: 10, y: 10 },
						{ id: 1, name: "", x: 10, y: 13 },
						{ id: 2, name: "", x: 10, y: 7 },
					],
					edges: [
						{ n1: 0, n2: 1, length: 1 },
						{ n1: 0, n2: 2, length: 1 },
					],
				},
			},
		}, json);
		return makeProject(json);
	}

	/**
	 * Opens an old project. Passed-in data will go through {@link Migration} and updated to the latest format.
	 */
	export function open(json: Pseudo<JProject>): Promise<Project> {
		return makeProject(Migration.$process(json));
	}

	function makeProject(json: RecursivePartial<JProject>): Promise<Project> {
		const p = new Project(json, getOrCreateWorker());
		// eslint-disable-next-line typescript-compat/compat
		if(DEBUG_ENABLED) registry.register(p, p.id);
		projectMap.set(p.id, p);
		return p.$initialize();
	}

	/**
	 * Close an opened project, releasing the corresponding worker and all its memory.
	 *
	 * If all projects are closed, it creates a new standing-by worker.
	 */
	export function close(proj: Project): void {
		if(DEBUG_ENABLED) console.time("Close project");
		proj.$dispose(); // Disposing must go first
		if(current.value == proj) current.value = null;
		projectMap.delete(proj.id);
		if(projectMap.size == 0) __worker = new Worker(__worker_src);
		if(DEBUG_ENABLED) console.timeEnd("Close project");
	}
}

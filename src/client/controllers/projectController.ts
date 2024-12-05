
import { getNextId, Project } from "client/project/project";
import { Migration } from "client/patches";
import { deepAssign } from "shared/utils/clone";
import ProjectService from "client/services/projectService";
import { isContextLost } from "client/main";

import type { JProject, ProjId } from "shared/json";

function createWorker(): Promise<Worker> {
	// This mechanism of waiting for the worker to get ready is needed only for Safari 11,
	// and can be dropped in the future.
	const worker = new Worker(new URL("core/main.ts", import.meta.url), { name: "core" });
	return new Promise<Worker>(resolve => {
		worker.addEventListener("message", () => resolve(worker), { once: true });
	});
}

/** The worker instance that is pre-generated and is standing-by. */
let __worker: Promise<Worker> | undefined = createWorker();

/// #if DEBUG
/**
 * For debugging memory leaks. When in debug mode,
 * it prints a message in the console after the {@link Project} has been garbage collected.
 * If the message fails to appear after closing the project and hitting the GC button,
 * we will then have to figure out what is keeping the reference of the project.
 *
 * Since we might run the DEBUG mode in BrowserStack,
 * we also need to consider the case where {@link FinalizationRegistry} is not supported.
 */
const registry = typeof FinalizationRegistry == "undefined" ? null :
	// eslint-disable-next-line compat/compat
	new FinalizationRegistry<number>(id => console.log(`Project #${id} GC.`));
/// #endif

//=================================================================
/**
 * {@link ProjectController} manages the creation of {@link Project} and the corresponding Core worker.
 */
//=================================================================

export namespace ProjectController {

	const projectMap = new Map<ProjId, Project>();

	/** A fallback for creating session during context loss. */
	const fallbackMap: Record<ProjId, JProject> = {};

	export const current = ProjectService.project;

	/** Return the {@link Project} by id. */
	export function get(id: ProjId): Project | undefined {
		return projectMap.get(id);
	}

	/** Return all {@link Project}s. */
	export function all(): Project[] {
		return [...projectMap.values()];
	}

	export function getSession(ids: readonly ProjId[]): JProject[] {
		return ids.map(id => projectMap.get(id)?.toJSON(true) ?? fallbackMap[id]);
	}

	/** Returns the standing-by worker, or create a new worker. */
	function getOrCreateWorker(): Promise<Worker> {
		const worker = __worker ? __worker : createWorker();
		__worker = undefined;
		return worker;
	}

	/**
	 * Creates a new {@link Project}.
	 * The passed-in data will be deeply assigned on the template project instead of passing through migration.
	 */
	export function create(json: RecursivePartial<JProject>): Promise<ProjId> {
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
						{ id: 0, name: "", x: 10, y: 10, isNew: true },
						{ id: 1, name: "", x: 10, y: 13, isNew: true },
						{ id: 2, name: "", x: 10, y: 7, isNew: true },
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
	export function open(json: Pseudo<JProject>): Promise<ProjId> {
		return makeProject(Migration.$process(json));
	}

	async function makeProject(json: RecursivePartial<JProject>): Promise<ProjId> {
		// Handling context loss, in which case we don't actually construct
		// a Project instance, but just keep the JSON data for session saving.
		if(isContextLost()) {
			const id = getNextId();
			fallbackMap[id] = deepAssign(Migration.$getSample(), json);
			return id;
		}

		const p = new Project(json, await getOrCreateWorker());
		/// #if DEBUG
		// eslint-disable-next-line typescript-compat/compat
		if(registry) registry.register(p, p.id);
		/// #endif
		projectMap.set(p.id, p);
		await p.$initialize();
		return p.id;
	}

	/**
	 * Close an opened project, releasing the corresponding worker and all its memory.
	 *
	 * If all projects are closed, it creates a new standing-by worker.
	 */
	export function close(proj: Project): void {
		/// #if DEBUG
		console.time("Close project");
		/// #endif

		proj.$destruct(); // Destructing must go first
		if(current.value == proj) current.value = null;
		projectMap.delete(proj.id);
		if(projectMap.size == 0) __worker = createWorker();

		/// #if DEBUG
		console.timeEnd("Close project");
		/// #endif
	}
}

import type { JProject, CoreError, ProjId } from "shared/json";

export interface StudioOptions {
	/** Callback for deprecated formats in the file */
	onDeprecate?: (title?: string) => void;

	/** Callback for workspace refreshing */
	onUpdate?: Action<void | Promise<void>>;

	/** Callback for dragging */
	onDrag?: Action;

	/** Callback for long pressing */
	onLongPress?: Action;

	/** Callback for fatal error. */
	onError?: (id: ProjId, error: CoreError, backup?: JProject) => Promise<void>;
}

export const options: StudioOptions = {};

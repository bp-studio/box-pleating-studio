
interface StudioOptions {
	/** Callback for deprecated formats in the file */
	onDeprecate?: (title?: string) => void;

	/** Callback for workspace refreshing */
	onUpdate?: Action<void | Promise<void>>;

	/** Callback for dragging */
	onDrag?: Action;

	/** Callback for long pressing */
	onLongPress?: Action;
}

export const options: StudioOptions = {};

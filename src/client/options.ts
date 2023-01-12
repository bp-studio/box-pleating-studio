
interface StudioOptions {
	/** 如果載入的檔案裡面有棄用的格式時要做的事情 */
	onDeprecate?: (title?: string) => void;

	/** 當工作區域刷新的時候要做的事情 */
	onUpdate?: Action<void | Promise<void>>;

	/** 當拖曳發生的時候要做的事情 */
	onDrag?: Action;

	/** 當長壓的時候要做的事情 */
	onLongPress?: Action;
}

export const options: StudioOptions = {};

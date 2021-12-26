/** 提供 App 端串接的各種 API */
export interface StudioOptions {
	/** 如果載入的檔案裡面有棄用的格式時要做的事情 @exports */
	onDeprecate?: (title?: string) => void;

	/** 當工作區域刷新的時候要做的事情 @exports */
	onUpdate?: Action<void | Promise<void>>;

	/** 當拖曳發生的時候要做的事情 @exports */
	onDrag?: Action;

	/** 當長壓的時候要做的事情 @exports */
	onLongPress?: Action;
}


/**
 * 修正官方的 d.ts 缺少或是我自訂的定義
 * 
 * 為了方便管理，一切的 patch 都寫在這個檔案裡面，而不去動官方的定義檔
 */
declare namespace paper {

	interface ToolEvent {
		event: globalThis.MouseEvent | TouchEvent;
	}

	/**
	 * @extends IPoint 雖然然這並不必要，但是嚴謹起見我仍舊宣告 paper.Point 介面繼承了我的 IPoint 介面。
	 */
	interface Point extends IPoint {}
}

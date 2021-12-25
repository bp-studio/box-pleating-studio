import type { IPoint } from "bp/math";
import "shrewd";

declare global {
	const Shrewd: typeof Shrewd;
	const shrewd: typeof Shrewd.shrewd;
	const terminate: typeof Shrewd.terminate;

	/**
	 * 修正 paper.js 官方的 d.ts 缺少或是我自訂的定義
	 *
	 * 為了方便管理，一切的 patch 都寫在這個檔案裡面，而不去動官方的定義檔
	 */
	namespace paper {

		interface ToolEvent {
			event: globalThis.MouseEvent | TouchEvent;
		}

		/**
		 * @extends IPoint 雖然然這並不必要，但是嚴謹起見我仍舊宣告 {@link paper.Point} 介面繼承了我的 {@link IPoint} 介面。
		 */
		interface Point extends IPoint { }
	}
}

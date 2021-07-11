import { Component, Vue } from 'vue-property-decorator';
import { bp } from '../import/BPStudio';

/**
 * 宣告這個類別是為了幫助 TypeScript 的型別檢查，
 * 因為 .ts 檔案沒辦法匯入 .vue 檔案的宣告，
 * 而 BaseComponent 又對 Core 有相依性，
 * 因此把其中相依的部份提取出來變成這個 .ts 基底類別。
 */

@Component
export default class CoreBase extends Vue {

	public initialized: boolean = false;

	public get design(): Design | null {
		if(!this.initialized) return null;
		let t = bp.design ? bp.design.title : null;
		document.title = "Box Pleating Studio" + (t ? " - " + t : "");
		return bp.design;
	}

	public get selections(): Control[] {
		if(!this.initialized) return [];
		return bp.selection;
	}
}

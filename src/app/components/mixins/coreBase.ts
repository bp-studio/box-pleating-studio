import { Component, Vue } from 'vue-property-decorator';
import { Control, Design } from '../import/BPStudio';
import JSZip from 'jszip';

/**
 * 宣告這個類別是為了幫助 TypeScript 的型別檢查，
 * 因為 .ts 檔案沒辦法匯入 .vue 檔案的宣告，
 * 而 BaseComponent 又對 Core 有相依性，
 * 因此把其中相依的部份提取出來變成這個 .ts 基底類別。
 */

declare global {
	export const core: Core;
}

@Component
export default class CoreBase extends Vue {
	public designs: number[] = [];
	public initialized: boolean = false;

	public get design(): Design | null {
		if(!this.initialized) return null;
		let t = bp.design ? bp.design.title : null;
		document.title = defaultTitle + (t ? " - " + t : "");
		return bp.design;
	}

	public get selections(): Control[] {
		if(!this.initialized) return [];
		return bp.selection;
	}

	/////////////////////////////////////////////////////////////////////////////////////////
	// 下載
	/////////////////////////////////////////////////////////////////////////////////////////

	public async getBlob(type: string, design?: Design): Promise<Blob> {
		if(!this.design) throw new Error();
		if(type == 'png') return await bp.toPNG();
		if(type == 'svg') return bp.toSVG();
		if(type == 'bpz') return await this.zip();
		if(type == 'bps') return bp.toBPS(design ? design.id : undefined)!;
		throw new Error();
	}

	public getFilename(type: string, design?: Design): string {
		if(!design) design = this.design || undefined;
		if(!design) return "";
		if(type == "bpz") return this.$t('keyword.workspace').toString();
		else return sanitize(design.title);
	}

	private async zip(): Promise<Blob> {
		await libReady;
		let zip = new JSZip();
		let names = new Set<string>();
		for(let i = 0; i < this.designs.length; i++) {
			let design = bp.getDesign(this.designs[i])!;
			let name = sanitize(design.title);
			if(names.has(name)) {
				let j = 1;
				for(; names.has(name + " (" + j + ")"); j++);
				name = name + " (" + j + ")";
			}
			names.add(name);
			zip.file(name + ".bps", JSON.stringify(design));
		}
		let blob = await zip.generateAsync({
			type: 'blob',
			compression: "DEFLATE",
			compressionOptions: { level: 9 },
		});
		return blob.slice(0, blob.size, "application/bpstudio.workspace+zip");
	}
}

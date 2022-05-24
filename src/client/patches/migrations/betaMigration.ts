import type { JProject, JLayout } from "shared/json";

/**
 * beta 版把原本的 cp 模式改名為 layout 模式，以預留 cp 模式給未來使用，
 * 同時從 beta 版開始加上檔案版本代碼
 */
export default function $process(proj: Pseudo<JProject>): boolean {
	if(proj.mode == "cp") proj.mode = "layout";
	if(proj.cp) {
		const layout = proj.cp as JLayout;
		delete proj.cp;
		if("stretches" in layout) layout.stretches = [];
		proj.layout = layout;
	}
	return true;
}

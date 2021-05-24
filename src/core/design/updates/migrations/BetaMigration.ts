
/**
 * beta 版把原本的 cp 模式改名為 layout 模式，以預留 cp 模式給未來使用，
 * 同時從 beta 版開始加上檔案版本代碼
 */
namespace BetaMigration {

	export function $process(design: Pseudo<JDesign>): boolean {
		if(design.mode as unknown == "cp") design.mode = "layout";
		if(design.cp) {
			design.layout = design.cp as JLayout;
			delete design.cp;
			if('stretches' in design.layout!) design.layout!.stretches = [];
		}
		return true;
	}
}

import FileUtility from "app/utils/fileUtility";
import Studio from "./studioService";
import Workspace from "./workspaceService";
import Settings from "./settingService";
import Zip from "app/utils/zip";

import type { Project } from "client/project/project";

//=================================================================
/**
 * {@link ExportService} generates the {@link Blob}s for exporting.
 */
//=================================================================
namespace ExportService {

	export function toBPS(proj: Project): Promise<Blob> {
		const json = JSON.stringify(proj.toJSON());
		return Promise.resolve(new Blob([json], { type: "application/bpstudio.project+json" }));
	}

	export function getBlob(type: string, proj?: Project): Promise<Blob> {
		proj ??= Studio.project ?? undefined;
		if(!proj) throw new Error();
		if(type == "png") return Studio.png(proj);
		if(type == "svg") return Studio.svg(proj, Settings.tools.SVG.includeHiddenElement);
		if(type == "bpz") return zip();
		if(type == "bps") return toBPS(proj);
		throw new Error();
	}

	export function getFilename(type: string, project?: Project): string {
		if(!project) project = Studio.project ?? undefined;
		if(!project) return "";
		if(type == "bpz") return i18n.t("keyword.workspace").toString();
		else return FileUtility.sanitize(project.design.title);
	}

	function zip(): Promise<Blob> {
		const names = new Set<string>();
		const files: Record<string, string> = {};
		for(const project of Workspace.projects.value) {
			let name = FileUtility.sanitize(project.design.title);
			if(names.has(name)) {
				let j = 1;
				while(names.has(name + " (" + j + ")")) j++;
				name = name + " (" + j + ")";
			}
			names.add(name);
			files[name + ".bps"] = JSON.stringify(project);
		}
		return Zip.compress(files);
	}
}

export default ExportService;

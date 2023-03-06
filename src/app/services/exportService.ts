import FileUtility from "app/utils/fileUtility";
import Lib from "./libService";
import Studio from "./studioService";
import Workspace from "./workspaceService";

import type jsZip from "jszip";
import type { Project } from "client/project/project";

declare const JSZip: typeof jsZip;

namespace ExportService {

	export function toBPS(proj: Project): Promise<Blob> {
		//TODO
		return Promise.resolve(new Blob([""], { type: "application/bpstudio.project+json" }));
	}

	export function toSVG(proj: Project): Promise<Blob> {
		return Studio.svg(proj);
	}

	export function toPNG(proj: Project): Promise<Blob> {
		return Studio.png(proj);
	}

	export function getBlob(type: string, proj?: Project): Promise<Blob> {
		proj ??= Studio.project ?? undefined;
		if(!proj) throw new Error();
		if(type == "png") return toPNG(proj);
		if(type == "svg") return toSVG(proj);
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

	async function zip(): Promise<Blob> {
		await Lib.ready;
		const jsZip = new JSZip();
		const names = new Set<string>();
		for(const project of Workspace.projects) {
			let name = FileUtility.sanitize(project.design.title);
			if(names.has(name)) {
				let j = 1;
				for(; names.has(name + " (" + j + ")"); j++);
				name = name + " (" + j + ")";
			}
			names.add(name);
			jsZip.file(name + ".bps", JSON.stringify(project));
		}
		const blob = await jsZip.generateAsync({
			type: "blob",
			compression: "DEFLATE",
			compressionOptions: { level: 9 },
		});
		return blob.slice(0, blob.size, "application/bpstudio.workspace+zip");
	}
}

export default ExportService;

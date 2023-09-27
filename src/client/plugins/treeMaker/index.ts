import { TreeMakerParser } from "./treeMakerParser";
import { TreeMakerVisitor } from "./treeMakerVisitor";
import { t } from "../i18n";

import type { JProject } from "shared/json";

export function treeMaker(title: string, data: string): JProject {
	try {
		const v = new TreeMakerVisitor(data);
		const { $result } = new TreeMakerParser(v);
		$result.design.title = title;
		return $result;
	} catch(e) {
		if(typeof e == "string") throw new Error(e);
		else throw new Error(t("plugin.TreeMaker.invalid"));
	}
}

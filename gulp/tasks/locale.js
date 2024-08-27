const $ = require("../utils/proxy");
const gulp = require("gulp");

const newer = require("../utils/newer");
const config = require("../config.json");
const order = require("../plugins/order");

function compile(t) {
	if(t.includes("{")) {
		t = t.replace(/\{(\d+)\}/g, "\",i(l($1)),\"");
		return "({normalize:n,interpolate:i,list:l})=>n([\"" + t + "\"])";
	}
	return `_=>"${t}"`;
}

gulp.task("locale", () => gulp.src(config.src.locale + "/*.json")
	.pipe(newer({
		dest: config.src.app + "/gen/locale.ts",
		extra: [__filename, "../plugins/order.js"],
	}))
	.pipe(order("en.json"))
	.pipe(gulp.dest(config.src.locale))
	.pipe($.through2((content, file) => `"${file.stem.toLowerCase()}": ${content},`))
	.pipe($.concat("locale.ts"))
	.pipe($.through2(content => {
		content = content.replace(/"((?:[^"\\]|\\.)+)"(.)/gs, ($0, $1, $2) => {
			if($2 == "]" || $2 == ":") return $0;
			return compile($1) + $2;
		});
		return `import type { BpsLocale } from "shared/frontend/locale";\n\nexport default {${content}} as Record<string, BpsLocale>;`;
	}))
	.pipe(gulp.dest(config.src.app + "/gen")));

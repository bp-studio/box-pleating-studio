const gulp = require("gulp");
const iff = require("gulp-if");
const through2 = require("gulp-through2");

const newer = require("../utils/newer");
const { esbuild, extra: ext } = require("../utils/esbuild");
const config = require("../config.json");
const path = require("path");

const extra = [__filename, ext, "gulp/utils/esbuild.js", config.src.app + "/**/*", config.src.shared + "/**/*"];

function esb(options) {
	return esbuild(Object.assign({}, {
		outfile: "main.js",
		globalName: "app",
		tsconfig: config.src.app + "/tsconfig.json",
	}, options || {}));
}

gulp.task("appDebug", () =>
	gulp.src(config.src.app + "/main.ts")
		.pipe(newer({
			dest: config.dest.debug + "/main.js",
			extra,
		}))
		.pipe(esb({
			define: {
				"__VUE_OPTIONS_API__": "false",
				"__VUE_PROD_DEVTOOLS__": "false",
			},
			sourcemap: true,
			sourcesContent: false,
			sourceRoot: "../../",
		}))
		.pipe(iff(f => f.basename == "main.js.map" || f.basename == "main.css.map", through2(content => {
			// 修正 Vue plugin 的 sourcemap 相對路徑輸出
			const json = JSON.parse(content);
			const root = path.resolve(".").replace(/\\/g, "/") + "/";
			for(const i in json.sources) {
				json.sources[i] = json.sources[i]
					.replace(/^vue-style:(.+)\?.+$/, "$1")
					.replace(/\\/g, "/")
					.replace(root, "");
			}
			for(let i = 0; i < json.sources.length; i++) {
				if(json.sources[i - 1]?.endsWith(json.sources[i])) {
					json.sources[i] = json.sources[i - 1];
				} else if(json.sources[i + 1]?.endsWith(json.sources[i])) {
					json.sources[i] = json.sources[i + 1];
				}
			}
			return JSON.stringify(json);
		})))
		.pipe(gulp.dest(config.dest.debug))
);

gulp.task("appDist", () =>
	gulp.src(config.src.app + "/main.ts")
		.pipe(newer({
			dest: config.dest.dist + "/main.js",
			extra,
		}))
		.pipe(esb({ minify: true }))
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task("app", gulp.parallel("appDebug", "appDist"));

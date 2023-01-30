const all = require("gulp-all");
const filter = require("gulp-filter");
const fs = require("fs");
const gulp = require("gulp");
const gulpIf = require("gulp-if");
const replace = require("gulp-replace");
const terser = require("gulp-terser");

const newer = require("../utils/newer");
const config = require("../config.json");

const buildLog = require("./static/log");
const buildIcon = require("./static/icon");

const libDest = config.dest.dist + "/lib";

const { purge } = require("../utils/purge");
const fontAwesome = require("../plugins/fontAwesome");

/** 一個給定的 js 檔案是否有 min 或者 prod 的版本 */
function hasMin(file) {
	return fs.existsSync(file.path.replace(/js$/, "min.js")) || fs.existsSync(file.path.replace(/js$/, "prod.js"));
}

/** 複製 debug 資源 */
const copyDebugStatic = () => gulp.src([
	"*.js",
	"*.js.map",
], { cwd: config.src.lib })
	.pipe(filter(file => {
		// 選取具有 min 版本的 .js 檔案
		if(file.extname != ".js") return true;
		return hasMin(file);
	}))
	.pipe(newer(config.dest.debug + "/lib")) // 採用 1:1 比對目標的策略
	.pipe(gulp.dest(config.dest.debug + "/lib"));

/** 複製靜態資源 */
const copyStatic = () => gulp.src([
	"**/*",

	// 「.」開頭的檔案需要另外指定
	".htaccess",
	".well-known/**/*",

	// 不包含下列檔案
	"!**/README.md",

	// 底下這些檔案都會另外建置，所以不當作靜態資源來複製
	"!index.htm",
	"!log/*",
	"!assets/bps/**/*",
], { cwd: config.src.public, base: config.src.public })
	.pipe(newer(config.dest.dist)) // 採用 1:1 比對目標的策略
	.pipe(gulpIf(file => file.extname == ".js", terser({
		compress: {
			drop_debugger: false,
		},
	})))
	.pipe(gulp.dest(config.dest.dist));

/** 複製程式庫 */
const copyLib = () => gulp.src([
	"**/*",

	// 不包含下列檔案
	"!**/README.md",
	"!**/tsconfig.json",

	// 底下這些檔案都會另外建置，所以不當作靜態資源來複製
	"!**/*.ts",
	"!**/*.scss",
	"!**/*.css",
	"!**/*.js.map",
], { cwd: config.src.lib })
	.pipe(filter(file => {
		// 過濾掉具有 min 版本的 .js 檔案
		if(file.extname != ".js") return true;
		return !hasMin(file);
	}))
	.pipe(gulpIf(file => file.extname == ".js",
		replace(/\s+\/\/# sourceMappingURL=.+?$/ms, "") // 刪除 sourcemap
	))
	.pipe(newer(libDest)) // 採用 1:1 比對目標的策略
	.pipe(gulp.dest(libDest));

/** 建置精簡的 FontAwesome 字型 */
const faSrc = "node_modules/@fortawesome/fontawesome-free";
const faTarget = libDest + "/font-awesome";
const subsetFontAwesome = () =>
	gulp.src(config.src.app + "/vue/**/*.vue")
		.pipe(fontAwesome())
		.pipe(gulp.dest(faTarget + "/webfonts"));

/** 淨化 FontAwesome 的 css */
const purgeFontAwesome = () => {
	let stream = gulp.src(faSrc + "/css/all.min.css", { base: faSrc });
	stream = purge(stream);
	return stream
		.pipe(replace(/src:url\([^)]+eot\);/g, ""))
		.pipe(replace(/url\([^)]+(iefix|woff|fontawesome)\) format\([^)]+\),?/g, ""))
		.pipe(replace(/,\}/g, "}"))
		.pipe(gulp.dest(faTarget));
};

gulp.task("static", () => {
	const tasks = [
		buildIcon(),
		buildLog(),
		copyDebugStatic(),
		copyStatic(),
		copyLib(),
	];
	// 只有初次的時候會自動執行 FontAwesome 建置，
	// 其餘在必要的時候再手動執行 fa 工作，以增進效能。
	if(!fs.existsSync(faTarget)) {
		tasks.push(
			purgeFontAwesome(),
			subsetFontAwesome()
		);
	}
	return all(tasks);
});

gulp.task("fa", () => all(
	purgeFontAwesome(),
	subsetFontAwesome()
));

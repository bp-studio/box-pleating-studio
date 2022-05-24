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

const { purge, extra } = require("../utils/purge");

/**
 * 個別淨化一個 lib 的 CSS 檔案
 *
 * 當 lib 自己有更新、或者比較對象有更新的時候都要重新執行淨化，
 * 所以針對每一個檔案都要自己產一組 stream。
 */
function makePurge(path) {
	let stream = gulp.src(config.src.lib + path, { base: config.src.lib })
		.pipe(newer({
			dest: libDest + path,
			extra,
		}));
	stream = purge(stream);
	return stream.pipe(gulp.dest(libDest));
}

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

gulp.task("static", () => all(
	makePurge("/font-awesome/css/all.min.css"),
	buildIcon(),
	buildLog(),
	copyDebugStatic(),
	copyStatic(),
	copyLib()
));

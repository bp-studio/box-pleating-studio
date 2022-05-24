// 修改 path 套件的輸出方式
const path = require("path");
const rel = path.relative;
path.relative = function(from, to) {
	return rel(from, to).replace(/\\/g, "/");
};

// 載入一切相依性

const gulp = require("gulp");
const requireDir = require("require-dir");
const seriesIf = require("./gulp/utils/seriesIf");

requireDir("./gulp/tasks");

gulp.task("share", gulp.parallel(
	"static",
	"lib",
	"donate",
	"locale"
));

// 執行一切建置（除了 HTML 和 ServiceWorker 以外）
gulp.task("build", gulp.parallel(
	"share",
	"client",
	"core",
	"app"
));

gulp.task("buildDebug", gulp.parallel(
	"share",
	"clientDebug",
	"coreDebug",
	"appDebug"
));

gulp.task("buildDist", gulp.parallel(
	"share",
	"clientDist",
	"coreDist",
	"appDist"
));

gulp.task("update", gulp.series(
	"version",
	"html",
	"sw"
));

gulp.task("deployDev", gulp.series(
	"buildDist",
	"update",
	"uploadDev"
));

gulp.task("deployPub", () => seriesIf(
	async () => {
		const inquirer = (await import("inquirer")).default;
		const answers = await inquirer.prompt([{
			type: "confirm",
			message: "請記得在發布之前更新版本號、加入更新 log、並適度修改 README.md。確定發布到正式版？",
			name: "ok",
			default: false,
		}]);
		return answers.ok;
	},
	"buildDist",
	"update",
	"uploadPub"
));

// 清除一切建置檔案
gulp.task("clean", async () => {
	const del = (await import("del")).deleteAsync;
	del("build");
});

// 預設建置，會建置到可以在本地執行的程度；
// 在 VS Code 裡面按下 F5 預設就會執行這個建置動作
gulp.task("default", gulp.parallel("html", "buildDebug"));

/* Uncomment the following to diagnose startup performance. */
// let requireCount = 0;
// const Module = require("module");
// const oldRequire = Module.prototype.require;
// Module.prototype.require = function(...args) {
// 	requireCount++;
// 	return oldRequire.apply(this, args);
// };
// console.time("startup");

// modify the way `path` outputs
const path = require("path");
const rel = path.relative;
path.relative = function(from, to) {
	return rel(from, to).replace(/\\/g, "/");
};

// Load all dependencies
const gulp = require("gulp");
const requireDir = require("require-dir");
const seriesIf = require("./gulp/utils/seriesIf");

requireDir("./gulp/tasks");

gulp.task("share", gulp.series(
	gulp.parallel(
		"static",
		"lib",
		"donate",
		"locale"
	),
	"link"
));

// Run all builds (except HTML and ServiceWorker)
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

gulp.task("deployQa", gulp.series(
	"buildDist",
	"update",
	"uploadQa"
));

gulp.task("deployDQ", gulp.series(
	"buildDist",
	"update",
	gulp.parallel(
		"uploadDev",
		"uploadQa"
	)
));

const deployMsg = `Before releasing, please check the following steps:
1. Check if there's unresolved fatal error report.
2. Consider updating dependencies.
3. Update the version number in package.json, and add update logs.
4. Edit README.md if needed.
5. Add relevant tests, and make sure that new codes are covered.
6. Deploy to DEV at least once to ensure there's no major building error.
Are you sure you want to deploy?"`;

gulp.task("deployPub", () => seriesIf(
	async () => {
		const inquirer = (await import("inquirer")).default;
		const answers = await inquirer.prompt([{
			type: "confirm",
			message: deployMsg,
			name: "ok",
			default: false,
		}]);
		return answers.ok;
	},
	"buildDist",
	"update",
	"uploadPub"
));

// Clear all built files
gulp.task("clean", async () => {
	const del = (await import("del")).deleteAsync;
	del("build");
});

// The default build. It will build to the point that it can be run locally.
// Press F5 in VS Code will execute this task by default.
gulp.task("default", gulp.parallel("html", "buildDebug"));

// console.log("Require count", requireCount);
// console.timeEnd("startup");

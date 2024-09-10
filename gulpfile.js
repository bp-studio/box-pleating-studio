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
const seriesIf = require("./gulp/utils/seriesIf");
const { exec } = require("child_process");

require("./gulp/tasks/ftp.js");
require("./gulp/tasks/html.js");
require("./gulp/tasks/locale.js");
require("./gulp/tasks/static.js");
require("./gulp/tasks/tool.js");

// Run all builds
gulp.task("build", gulp.parallel(
	"static",
	"donate",
	"locale",
	"html"
));

gulp.task("rsbuild", cb => exec("pnpm rsbuild build", cb));

gulp.task("buildDist", gulp.series(
	gulp.parallel("build", "version"),
	"rsbuild"
));

gulp.task("deployDev", gulp.series(
	"buildDist",
	"uploadDev",
	"cleanDev"
));

gulp.task("deployQa", gulp.series(
	"buildDist",
	"uploadQa",
	"cleanQa"
));

gulp.task("deployDQ", gulp.series(
	"buildDist",
	gulp.parallel(
		gulp.series("uploadDev", "cleanDev"),
		gulp.series("uploadQa", "cleanQa")
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
	"uploadPub",
	"cleanPub"
));

// Clear all built files
gulp.task("clean", async () => {
	const del = (await import("del")).deleteAsync;
	del("build");
});

// The default build. It will build to the point that it can be run locally.
// Press F5 in VS Code will execute this task by default.
gulp.task("default", gulp.series("build"));

// console.log("Require count", requireCount);
// console.timeEnd("startup");

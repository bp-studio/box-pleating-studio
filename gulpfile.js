// modify the way `path` outputs
import path from "path";
const rel = path.relative;
path.relative = function(from, to) {
	return rel(from, to).replace(/\\/g, "/");
};

// Load all dependencies
import { exec } from "child_process";
import gulp from "gulp";
import seriesIf from "./gulp/utils/seriesIf.js";

import "./gulp/tasks/ftp.js";
import "./gulp/tasks/locale.js";
import "./gulp/tasks/static.js";

export const rsbuild = cb => exec("pnpm rsbuild build", cb);

export const buildDist = gulp.series(
	gulp.parallel("static", "version"),
	rsbuild
);

export const deployDev = gulp.series(
	buildDist,
	"uploadDev",
	"cleanDev"
);

export const deployQa = gulp.series(
	buildDist,
	"uploadQa",
	"cleanQa"
);

export const deployDQ = gulp.series(
	buildDist,
	gulp.parallel(
		gulp.series("uploadDev", "cleanDev"),
		gulp.series("uploadQa", "cleanQa")
	)
);

const deployMsg = `Before releasing, please check the following steps:
1. Check if there's unresolved fatal error report.
2. Consider updating dependencies.
3. Update the version number in package.json, and add update logs.
4. Edit README.md if needed.
5. Add GA tracking to new functionalities.
6. Add relevant tests, and make sure that new codes are covered.
Are you sure you want to deploy?"`;

export const deployPub = () => seriesIf(
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
	buildDist,
	"uploadPub",
	"cleanPubInternal_"
);

// Clear all built files
export const clean = async () => {
	const del = (await import("del")).deleteAsync;
	del("build");
};

// The default build.
export default gulp.series("static");

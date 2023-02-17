const ftp = require("vinyl-ftp");
const gulp = require("gulp");
const gulpIf = require("gulp-if");
const lazypipe = require("lazypipe");
const log = require("fancy-log");
const replace = require("gulp-replace");

const config = require("../config.json");
const seriesIf = require("../utils/seriesIf");

function connect() {
	const options = require(process.cwd() + "/.vscode/ftp.json"); // This file is not in the repo, of course
	options.log = log;
	return ftp.create(options);
}

function cleanFactory(folder) {
	const conn = connect();
	return conn.clean(`/public_html/${folder}/**/*.*`, config.dest.dist);
}

function ftpFactory(folder, additionalGlobs, pipeFactory) {
	const conn = connect();
	const globs = [
		config.dest.dist + "/**/*",
		"!**/debug.log",
	].concat(additionalGlobs);

	const base = `/public_html/${folder}`;
	const pipe = gulp.src(globs, { base: config.dest.dist, buffer: false });
	return (pipeFactory ? pipeFactory(pipe) : pipe)
		.pipe(conn.newer(base))
		.pipe(conn.dest(base));
}

gulp.task("cleanPub", () => seriesIf(
	async () => {
		const inquirer = (await import("inquirer")).default;
		const answers = await inquirer.prompt([{
			type: "confirm",
			message: "Are you sure you want to cleanup the remote distribution folder? Be certain that the deploying is done.",
			name: "ok",
			default: false,
		}]);
		return answers.ok;
	},
	() => cleanFactory("bp")
));
gulp.task("uploadPub", () => ftpFactory("bp", [config.dest.dist + "/.htaccess"]));

const devPipe = lazypipe()
	.pipe(() => replace('<script async src="https://www.googletagmanager.com' +
		'/gtag/js?id=G-GG1TEZGBCQ"></script>', ""))
	// It is better to make the default title the same as in the manifest for Chrome PWA,
	// or there will be additional prefix on display.
	.pipe(() => replace("<title>Box Pleating Studio</title>", "<title>BP Studio DEV</title>"));

gulp.task("cleanDev", () => cleanFactory("bp-dev"));
gulp.task("uploadDev", () => ftpFactory("bp-dev", [`!${config.dest.dist}/manifest.json`], pipe => pipe
	.pipe(gulpIf(file => file.basename == "index.htm", devPipe()))
));

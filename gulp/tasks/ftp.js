const $ = require("../utils/proxy");
const gulp = require("gulp");

const config = require("../config.json");
const seriesIf = require("../utils/seriesIf");

// This file is not in the repo, of course
const ftpConfig = require(process.cwd() + "/.vscode/ftp.json");

function connect() {
	const ftp = require("vinyl-ftp");
	const log = require("fancy-log");
	const options = ftpConfig.ftp;
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

gulp.task("cleanDev", () => cleanFactory(ftpConfig.dev.folder));
gulp.task("uploadDev", () => {
	const lazypipe = require("lazypipe");
	const devHtmlPipe = lazypipe()
		.pipe(() => $.replace('<script async src="https://www.googletagmanager.com' +
			'/gtag/js?id=G-GG1TEZGBCQ"></script>', ""))
		// It is better to make the default title the same as in the manifest for Chrome PWA,
		// or there will be additional prefix on display.
		.pipe(() => $.replace("<title>Box Pleating Studio</title>", "<title>BP Studio DEV</title>"));

	const devManifestPipe = lazypipe()
		.pipe(() => $.replace(/\/\/bpstudio\./g, `//${ftpConfig.dev.subdomain}.`))
		.pipe(() => $.replace(/Box Pleating Studio/g, "BP Studio DEV"));

	return ftpFactory(ftpConfig.dev.folder, [], pipe => pipe
		.pipe($.if(file => file.basename == "index.htm", devHtmlPipe()))
		.pipe($.if(file => file.basename == "manifest.json", devManifestPipe()))
	);
});

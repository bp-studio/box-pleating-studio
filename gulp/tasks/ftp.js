const $ = require("../utils/proxy");
const gulp = require("gulp");

const config = require("../config.json");
const seriesIf = require("../utils/seriesIf");

// This file is not in the repo, of course
/** @type {import("../../.vscode/ftp.json")} */
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

/**
 * @param {"qa"|"dev"} id
 */
function taskFactory(id) {
	const name = id.replace(/^\w/, a => a.toUpperCase());
	gulp.task("clean" + name, () => cleanFactory(ftpConfig[id].folder));
	gulp.task("upload" + name, () => {
		const lazypipe = require("lazypipe");
		const htmlPipe = lazypipe()
			.pipe(() => $.replace('<script async src="https://www.googletagmanager.com' +
				'/gtag/js?id=G-GG1TEZGBCQ"></script>', ""))
			.pipe(() => $.replace("<title>Box Pleating Studio</title>", `<title>${ftpConfig[id].title}</title>`));

		const manifestPipe = lazypipe()
			.pipe(() => $.replace(/\/\/bpstudio\./g, `//${ftpConfig[id].subdomain}.`))
			.pipe(() => $.replace(/Box Pleating Studio/g, ftpConfig[id].title));

		return ftpFactory(ftpConfig[id].folder, [], pipe => pipe
			.pipe($.if(file => file.basename == "index.htm", htmlPipe()))
			.pipe($.if(file => file.basename == "manifest.json", manifestPipe()))
		);
	});
}

taskFactory("dev");
taskFactory("qa");

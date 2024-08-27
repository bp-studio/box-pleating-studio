const $ = require("../utils/proxy");
const gulp = require("gulp");
const { createHash } = require("node:crypto");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const config = require("../config.json");
const seriesIf = require("../utils/seriesIf");

// This file is not in the repo, of course
const ftpConfigPath = process.cwd() + "/.vscode/ftp.json";

/** @type {import("../../.vscode/ftp.json")|null} */
const ftpConfig = existsSync(ftpConfigPath) ? require(ftpConfigPath) : null;

function configGuard() {
	if(!ftpConfig) throw new Error("The repo is not figured with FTP. This operation is for maintainers only.");
	return true;
}

function compare(findCacheDirectory, tag) {
	const cacheDir = findCacheDirectory({ name: "smart-ftp", create: true });
	const cache = `${cacheDir}/${tag}.json`;
	const records = existsSync(cache) ? JSON.parse(readFileSync(cache)) : [];
	const map = new Map();
	for(const record of records) map.set(record.path, record.hash);
	records.length = 0;
	return $.through2({
		transform(content, file, encoding) {
			const md5 = createHash("md5");
			md5.update(file.contents);
			const hash = md5.digest("hex");
			records.push({ path: file.relative, hash });
			if(map.get(file.relative) === hash) return null;
		},
		flushEmptyList: true,
		flush(files) {
			writeFileSync(cache, JSON.stringify(records));
		},
	});
}

function connect() {
	const ftp = require("vinyl-ftp");
	const log = require("fancy-log");
	const options = ftpConfig.ftp;
	options.log = log;
	return ftp.create(options);
}

/**
 * @param {string} folder
 */
function cleanFactory(folder) {
	const conn = connect();
	return conn.clean(`/public_html/${folder}/**/*.*`, config.dest.dist);
}

/**
 * @param {NodeJS.ReadWriteStream} stream
 * @returns {Promise<void>}
 */
function streamToPromise(stream) {
	return new Promise(resolve => {
		stream.on("end", resolve);
	});
}

/**
 * @param {string} folder
 * @param {string[]} additionalGlobs
 * @param {(stream: NodeJS.ReadWriteStream) => NodeJS.ReadWriteStream} pipeFactory
 */
async function ftpFactory(folder, additionalGlobs, pipeFactory) {
	const findCacheDirectory = (await import("find-cache-dir")).default;
	const conn = connect();
	const sw = config.dest.dist + "/sw.js";
	const globs = [
		config.dest.dist + "/**/*",
		"!" + sw,
		"!**/debug.log",
	].concat(additionalGlobs);

	const base = `/public_html/${folder}`;
	const pipe = gulp.src(globs, {
		base: config.dest.dist,
		dot: true, // for .htaccess
		encoding: false, // Gulp v5
	});
	await streamToPromise(
		(pipeFactory ? pipeFactory(pipe) : pipe)
			.pipe(compare(findCacheDirectory, "bpstudio"))
			.pipe(conn.dest(base))
	);

	// Ensure that sw.js is uploaded last, to avoid inconsistent update.
	await streamToPromise(
		gulp.src(sw, { base: config.dest.dist })
			.pipe(conn.dest(base))
	);
}

gulp.task("cleanPub", () => configGuard() && seriesIf(
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
gulp.task("uploadPub", () => configGuard() && ftpFactory("bp", [
	"!**/vue.runtime.global.js", // exclude for production
]));

/**
 * @param {"qa"|"dev"} id
 */
function taskFactory(id) {
	const name = id.replace(/^\w/, a => a.toUpperCase());
	gulp.task("clean" + name, () => configGuard() && cleanFactory(ftpConfig[id].folder));
	gulp.task("upload" + name, () => {
		configGuard();
		const lazypipe = require("lazypipe");
		const htmlPipe = lazypipe()
			.pipe(() => $.replace('<script async src="https://www.googletagmanager.com' +
				'/gtag/js?id=G-GG1TEZGBCQ"></script>', ""))
			.pipe(() => $.replace("<title>Box Pleating Studio</title>", `<title>${ftpConfig[id].title}</title>`));

		const manifestPipe = lazypipe()
			.pipe(() => $.replace(/\/\/bpstudio\./g, `//${ftpConfig[id].subdomain}.`))
			.pipe(() => $.replace(/Box Pleating Studio/g, ftpConfig[id].title));

		const htaccessPipe = lazypipe()
			.pipe(() => $.replace(/!bpstudio\./g, `!${ftpConfig[id].subdomain}.`));

		return ftpFactory(
			ftpConfig[id].folder,
			["!**/vue.runtime.global.prod.js"], // exclude for debug
			pipe => pipe
				.pipe($.if(file => file.basename == "index.htm", htmlPipe()))
				.pipe($.if(file => file.basename == "manifest.json", manifestPipe()))
				.pipe($.if(file => file.basename == ".htaccess", htaccessPipe()))
		);
	});
}

taskFactory("dev");
taskFactory("qa");

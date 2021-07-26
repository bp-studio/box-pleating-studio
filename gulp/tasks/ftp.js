let ftp = require('vinyl-ftp');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let inquirer = require('inquirer');
let log = require('fancy-log');
let replace = require('gulp-replace');

let seriesIf = require('../utils/seriesIf');

function connect() {
	let options = require('../../.vscode/ftp.json'); // This file is not in the repo, of course
	options.log = log;
	return ftp.create(options);
}

function cleanFactory(folder) {
	let conn = connect();
	return conn.clean(`/public_html/${folder}/**/*.*`, './build/dist');
}

function ftpFactory(folder, g, p) {
	let conn = connect();
	let globs = [
		'build/dist/**/*',
		'!**/debug.log',
	].concat(g);

	let base = `/public_html/${folder}`;
	let pipe = gulp.src(globs, { base: './build/dist', buffer: false });
	return (p ? p(pipe) : pipe)
		.pipe(conn.newer(base))
		.pipe(conn.dest(base));
}

gulp.task('cleanPub', () => seriesIf(
	async () => {
		let answers = await inquirer.prompt([{
			type: 'confirm',
			message: '確定要清理正式版遠端資料夾？請確定已經執行過正式版發布。',
			name: 'ok',
			default: false,
		}]);
		return answers.ok;
	},
	() => cleanFactory('bp')
));
gulp.task('uploadPub', () => ftpFactory('bp', ['build/dist/.htaccess']));

gulp.task('cleanDev', () => cleanFactory('bp-dev'));
gulp.task('uploadDev', () => ftpFactory('bp-dev', ['!build/dist/manifest.json'], pipe => pipe
	.pipe(gulpIf(
		file => file.basename == "index.htm",
		replace('<script async src="https://www.googletagmanager.com' +
			'/gtag/js?id=G-GG1TEZGBCQ"></script>', "")
	))
));

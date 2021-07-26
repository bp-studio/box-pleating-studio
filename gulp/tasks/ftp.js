const ftp = require('vinyl-ftp');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const inquirer = require('inquirer');
const log = require('fancy-log');
const replace = require('gulp-replace');

const config = require('../config.json');
const seriesIf = require('../utils/seriesIf');

function connect() {
	let options = require(process.cwd() + '/.vscode/ftp.json'); // This file is not in the repo, of course
	options.log = log;
	return ftp.create(options);
}

function cleanFactory(folder) {
	let conn = connect();
	return conn.clean(`/public_html/${folder}/**/*.*`, config.dest.dist);
}

function ftpFactory(folder, g, p) {
	let conn = connect();
	let globs = [
		config.dest.dist + '/**/*',
		'!**/debug.log',
	].concat(g);

	let base = `/public_html/${folder}`;
	let pipe = gulp.src(globs, { base: config.dest.dist, buffer: false });
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
gulp.task('uploadPub', () => ftpFactory('bp', [config.dest.dist + '/.htaccess']));

gulp.task('cleanDev', () => cleanFactory('bp-dev'));
gulp.task('uploadDev', () => ftpFactory('bp-dev', [`!${config.dest.dist}/manifest.json`], pipe => pipe
	.pipe(gulpIf(
		file => file.basename == "index.htm",
		replace('<script async src="https://www.googletagmanager.com' +
			'/gtag/js?id=G-GG1TEZGBCQ"></script>', "")
	))
));

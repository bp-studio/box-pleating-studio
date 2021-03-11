let ftp = require('vinyl-ftp');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let log = require('fancy-log');
let replace = require('gulp-replace');

function connect() {
	let options = require('../../.vscode/ftp-pub.json'); // This file is not in the repo, of course
	options.log = log;
	return ftp.create(options);
}

function cleanFactory(folder) {
	let conn = connect();
	return conn.clean(`/public_html/${folder}/**/*.*`, './dist');
}

function ftpFactory(folder, g, p) {
	let conn = connect();
	let globs = [
		'dist/**/*',
		'!**/debug.log',
	].concat(g);

	let base = `/public_html/${folder}`;
	let pipe = gulp.src(globs, { base: './dist', buffer: false });
	return (p ? p(pipe) : pipe)
		.pipe(conn.newer(base))
		.pipe(conn.dest(base));
};

gulp.task('cleanPub', () => cleanFactory('bp'));
gulp.task('uploadPub', () => ftpFactory('bp', ['dist/.htaccess']));

gulp.task('cleanDev', () => cleanFactory('bp-dev'));
gulp.task('uploadDev', () => ftpFactory('bp-dev', ['!dist/manifest.json'], pipe => pipe.
	pipe(gulpIf(
		file => file.basename == "index.htm",
		replace('<script async src="https://www.googletagmanager.com/gtag/js?id=G-GG1TEZGBCQ"></script>', "")
	))
));

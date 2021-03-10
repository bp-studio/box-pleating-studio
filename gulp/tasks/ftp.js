let ftp = require('vinyl-ftp');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let log = require('fancy-log');
let replace = require('gulp-replace');

const ftpFactory = (folder, g, p) => function() {
	let options = require('../../.vscode/ftp-pub.json'); // This file is not in the repo, of course
	options.log = log;
	let conn = ftp.create(options);
	let globs = [
		'dist/**/*',
		'!**/debug.log',
	].concat(g);
	let pipe = gulp.src(globs, { base: './dist', buffer: false });
	return (p ? p(pipe) : pipe)
		.pipe(conn.newer(`/public_html/${folder}`))
		.pipe(conn.dest(`/public_html/${folder}`));
};

gulp.task('uploadPub', ftpFactory('bp', ['dist/.htaccess']));

gulp.task('uploadDev', ftpFactory('bp-dev', ['!dist/manifest.json'], pipe => pipe.
	pipe(gulpIf(
		file => file.basename == "index.htm",
		replace('<script async src="https://www.googletagmanager.com/gtag/js?id=G-GG1TEZGBCQ"></script>', "")
	))
));

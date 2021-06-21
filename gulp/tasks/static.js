const all = require('gulp-all');
const cleanCss = require('gulp-clean-css');
const filter = require('gulp-filter');
const fs = require('fs');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const ifAnyNewer = require('gulp-if-any-newer');
const newer = require('gulp-newer');
const purge = require('gulp-purgecss');

const config = require('../config.json');
const log2 = require('../plugins/log');
const woff2 = require('../plugins/woff2');

// 這邊必須指定副檔名，否則資料夾也會被比進去
const compare = [
	config.src.app + '/**/*.vue',
	config.src.app + '/**/*.css',
	config.src.donate + '**/*.vue',
	config.src.public + '*.htm',
];

/**
 * 個別淨化一個 lib 的 CSS 檔案
 *
 * 當 lib 自己有更新、或者比較對象有更新的時候都要重新執行淨化，
 * 所以針對每一個檔案都要自己產一組 stream。
 */
function makePurge(path) {
	const libSrc = config.src.public + '/lib/';
	const libDest = config.dest.dist + '/lib/';
	return gulp.src(libSrc + path, { base: libSrc })
		.pipe(newer({
			dest: libDest + path,
			extra: compare.concat([__filename]),
		}))
		.pipe(purge({
			content: compare,
			safelist: {
				standard: [/backdrop/], // for Bootstrap Modal
				variables: ['--bs-primary'],
			},
			fontFace: true, // for Font Awesome
			variables: true, // for Bootstrap
		}))
		.pipe(gulp.dest(libDest));
}

// eslint-disable-next-line max-lines-per-function
gulp.task('static', () => all(
	// 淨化 lib CSS
	makePurge('bootstrap/bootstrap.min.css'),
	makePurge('font-awesome/css/all.min.css'),

	// 建置 BPS 圖示集
	gulp.src(config.src.public + '/assets/bps/**/*')
		.pipe(ifAnyNewer(config.dest.dist + '/assets/bps'))
		.pipe(woff2('bps'))
		.pipe(gulpIf(file => file.extname == ".css", cleanCss()))
		.pipe(gulp.dest(config.dest.dist + '/assets/bps')),

	// 建置更新 log
	gulp.src(config.src.public + '/log/*.md')
		.pipe(ifAnyNewer('build/dist/log'))
		.pipe(log2('log.js'))
		.pipe(gulp.dest('build/dist/log')),

	// 複製 debug 資源
	gulp.src([
		'lib/*.js',
		'lib/*.js.map',
	], { cwd: config.src.public })
		.pipe(filter(file => {
			// 選取具有 min 版本的 .js 檔案
			if(file.extname != ".js") return true;
			return fs.existsSync(file.path.replace(/js$/, "min.js"));
		}))
		.pipe(newer(config.dest.debug + '/lib')) // 採用 1:1 比對目標的策略
		.pipe(gulp.dest(config.dest.debug + '/lib')),

	// 複製靜態資源
	gulp.src([
		'**/*',
		'.htaccess', // 這種檔案需要另外指定

		// 不包含註解檔案
		'!**/README.md',

		// 底下這些檔案都會另外建置，所以不當作靜態資源來複製
		'!index.htm',
		'!log/*',
		'!assets/bps/**/*',
		'!lib/**/*.css',
		'!**/*.js.map',
	], { cwd: config.src.public })
		.pipe(filter(file => {
			// 過濾掉具有 min 版本的 .js 檔案
			if(file.extname != ".js") return true;
			return !fs.existsSync(file.path.replace(/js$/, "min.js"));
		}))
		.pipe(newer(config.dest.dist)) // 採用 1:1 比對目標的策略
		.pipe(gulp.dest(config.dest.dist))
));

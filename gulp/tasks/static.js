let fs = require('fs');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let all = require('gulp-all');
let ifAnyNewer = require('gulp-if-any-newer');
let newer = require('gulp-newer');
let filter = require('gulp-filter');
let cleanCss = require('gulp-clean-css');
let purify = require('gulp-purifycss');

let log2 = require('../plugins/log');
let woff2 = require('../plugins/woff2');

const compare = 'src/app/components/**/*.vue'; // 這邊必須指定副檔名，否則好像資料夾也會被比進去

/**
 * 個別淨化一個 lib 的 CSS 檔案
 *
 * 當 lib 自己有更新、或者比較對象有更新的時候都要重新執行淨化，
 * 所以針對每一個檔案都要自己產一組 stream。
 */
function makePurify(path) {
	return gulp.src(`public/lib/${path}`, { base: 'public/lib' })
		.pipe(newer({
			dest: `dist/lib/${path}`,
			extra: compare
		}))
		.pipe(purify([compare], { minify: true }))
		.pipe(gulp.dest('dist/lib'))
}

gulp.task('static', () => all(
	// 淨化 lib CSS
	makePurify('bootstrap/bootstrap.min.css'),
	makePurify('font-awesome/css/all.min.css'),

	// 建置 BPS 圖示集
	gulp.src('public/assets/bps/**/*')
		.pipe(ifAnyNewer("dist/assets/bps"))
		.pipe(woff2())
		.pipe(gulpIf(file => file.extname == ".css", cleanCss()))
		.pipe(gulp.dest('dist/assets/bps')),

	// 建置更新 log
	gulp.src('public/log/*.md')
		.pipe(ifAnyNewer("dist/log"))
		.pipe(log2('log.js'))
		.pipe(gulp.dest('dist/log')),

	// 複製 debug 資源
	gulp.src([
		'public/lib/*.js',
		'public/lib/*.js.map',
	])
		.pipe(filter(file => {
			// 選取具有 min 版本的 .js 檔案
			if(file.extname != ".js") return true;
			return fs.existsSync(file.path.replace(/js$/, "min.js"));
		}))
		.pipe(newer("debug/lib")) // 採用 1:1 比對目標的策略
		.pipe(gulp.dest('debug/lib')),

	// 複製靜態資源
	gulp.src([
		'public/**/*',
		'public/.htaccess', // 這種檔案需要另外指定
		// 底下這些檔案都會另外建置，所以不當作靜態資源來複製
		'!public/index.htm',
		'!public/log/*',
		'!public/assets/bps/**/*',
		'!public/lib/**/*.css',
		'!**/*.js.map'
	])
		.pipe(filter(file => {
			// 過濾掉具有 min 版本的 .js 檔案
			if(file.extname != ".js") return true;
			return !fs.existsSync(file.path.replace(/js$/, "min.js"));
		}))
		.pipe(newer("dist")) // 採用 1:1 比對目標的策略
		.pipe(gulp.dest('dist'))
));

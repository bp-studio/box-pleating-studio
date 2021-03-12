let all = require('gulp-all');
let gulp = require('gulp');
let replace = require('gulp-replace');
let sourcemaps = require('gulp-sourcemaps');

// 本地更新 Shrewd 模組
gulp.task('shrewd', () => all(
	// 正式版
	gulp.src("../shrewd/dist/shrewd.min.js")
		.pipe(replace(/\/\/#.+?\n/, ""))
		.pipe(gulp.dest('dist/lib'))
		.pipe(gulp.dest('public/lib')),

	// 偵錯版
	gulp.src("../shrewd/dist/shrewd.js")
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../../../shrewd/src' }))
		.pipe(gulp.dest('debug/lib')),

	// 定義檔
	gulp.src("../shrewd/dist/*.d.ts")
		.pipe(gulp.dest('src/core/global'))
));

let all = require('gulp-all');
let gulp = require('gulp');
let htmlMin = require('gulp-html-minifier-terser');
let newer = require('gulp-newer');
let replace = require('gulp-replace');

let debug = require('../plugins/debug');
let htmlMinOption = require('../html.json');

gulp.task('version', () =>
	gulp.src('public/index.htm')
		.pipe(replace(/app_version: "(\d+)"/, (a, b) => `app_version: "${Number(b) + 1}"`))
		.pipe(gulp.dest('public'))
);

gulp.task('html', () => all(
	// 偵錯版
	gulp.src('public/index.htm')
		.pipe(newer('debug'))
		.pipe(debug())
		.pipe(gulp.dest('debug')),

	// 正式版
	gulp.src('public/index.htm')
		.pipe(newer('dist'))
		.pipe(htmlMin(htmlMinOption))
		// 避免 VS Code Linter 出錯
		.pipe(replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest('dist'))
));

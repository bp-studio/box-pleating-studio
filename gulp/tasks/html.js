const all = require('gulp-all');
const gulp = require('gulp');
const htmlMin = require('gulp-html-minifier-terser');
const newer = require('gulp-newer');
const replace = require('gulp-replace');

const config = require('../config.json');
const debug = require('../plugins/debug');
const htmlMinOption = require('../html.json');

gulp.task('version', () =>
	gulp.src(config.src.public + '/index.htm')
		.pipe(replace(/app_version: "(\d+)"/, (a, b) => `app_version: "${Number(b) + 1}"`))
		.pipe(gulp.dest(config.src.public))
);

gulp.task('html', () => all(
	// 偵錯版
	gulp.src(config.src.public + '/index.htm')
		.pipe(newer({
			dest: config.dest.debug + '/index.htm',
			extra: [__filename, 'gulp/plugins/debug.js'],
		}))
		.pipe(debug())
		.pipe(gulp.dest(config.dest.debug)),

	// 正式版
	gulp.src(config.src.public + '/index.htm')
		.pipe(newer({
			dest: config.dest.dist + '/index.htm',
			extra: __filename,
		}))
		.pipe(htmlMin(htmlMinOption))
		// 避免 VS Code Linter 出錯
		.pipe(replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
		.pipe(gulp.dest(config.dest.dist))
));

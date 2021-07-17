const all = require('gulp-all');
const gulp = require('gulp');
const path = require('path');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');

const config = require('../config.json');
const shrewdDir = "../shrewd";
const lib = config.dest.debug + "/lib";
const srcRoot = path.relative(lib, path.resolve(process.cwd(), shrewdDir));

// 本地更新 Shrewd 模組
gulp.task('shrewd', () => all(
	// 正式版
	gulp.src(shrewdDir + "/dist/shrewd.min.js")
		.pipe(replace(/\/\/#.+?\n/, ""))
		.pipe(gulp.dest(config.dest.dist + '/lib'))
		.pipe(gulp.dest(config.src.lib)),

	// 偵錯版
	gulp.src(shrewdDir + "/dist/shrewd.js")
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: srcRoot + '/src' }))
		.pipe(gulp.dest(config.src.lib)),

	// 定義檔
	gulp.src(shrewdDir + "/dist/*.d.ts")
		.pipe(gulp.dest(config.src.core + '/global/vendor'))
));

const gulp = require('gulp');
const newer = require('gulp-newer');
const terser = require('gulp-terser');
const ts = require('gulp-typescript');

const config = require('../config.json');
const projWorker = ts.createProject(config.src.worker + '/tsconfig.json');

gulp.task('worker', () =>
	projWorker.src()
		.pipe(newer({ dest: config.dest.dist, ext: '.js' })) // 1:1 策略
		.pipe(projWorker())
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist))
);

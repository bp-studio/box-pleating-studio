let all = require('gulp-all');
let gulp = require('gulp');
let newer = require('gulp-newer');
let sourcemaps = require('gulp-sourcemaps');
let ts = require('gulp-typescript');
let wrap = require('@makeomatic/gulp-wrap-js');

let projTest = ts.createProject('src/test/tsconfig.json');

gulp.task('buildTest', () => all(
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrap("let Shrewd=require('../dist/lib/shrewd.min.js');%= body %"))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../' }))
		.pipe(gulp.dest('build/test')),
	gulp.src('src/test/samples/**')
		.pipe(newer("build/test/"))
		.pipe(gulp.dest('build/test/'))
));

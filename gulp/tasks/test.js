const all = require('gulp-all');
const gulp = require('gulp');
const newer = require('gulp-newer');
const path = require('path');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const wrap = require('@makeomatic/gulp-wrap-js');

const config = require('../config.json');
const projTest = ts.createProject(config.src.test + '/tsconfig.json');
const rel = path.relative(config.dest.test, config.dest.dist);

gulp.task('buildTest', () => all(
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrap(`const Shrewd=require('${rel}/lib/shrewd.min.js');%= body %`))
		.pipe(sourcemaps.write('.', {
			includeContent: false,
			sourceRoot: path.relative(config.dest.test, config.src.test),
		}))
		.pipe(gulp.dest(config.dest.test)),
	gulp.src(config.src.test + '/samples/**')
		.pipe(newer(config.dest.test))
		.pipe(gulp.dest(config.dest.test))
));

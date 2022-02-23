const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const newer = require('gulp-newer');
const sass = require('sass');

const config = require('../config.json');

/**
 * 建置黑暗主題
 */
gulp.task('theme', () =>
	gulp.src(config.src.theme + '/darkmode.scss')
		.pipe(newer(config.dest.dist + '/darkmode.css'))
		.pipe(gulpSass(sass)({
			outputStyle: 'compressed',
		}))
		.pipe(gulp.dest(config.dest.dist))
);

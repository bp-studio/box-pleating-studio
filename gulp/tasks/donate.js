const all = require('gulp-all');
const gulp = require('gulp');
const htmlMin = require('gulp-html-minifier-terser');
const newer = require('gulp-newer');
const terser = require('gulp-terser');

const config = require('../config.json');
const vue = require('../plugins/vue');
const htmlMinOption = require('../html.json');

gulp.task('donate', () => all(
	// Vue
	gulp.src(['main.vue', 'main.js'], { cwd: config.src.donate })
		.pipe(newer({
			dest: config.dest.dist + '/donate.js',
			extra: __filename,
		}))
		.pipe(vue('donate.js'))
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist)),

	// Html
	gulp.src(config.src.public + '/donate.htm')
		.pipe(newer({
			dest: config.dest.dist + '/donate.htm',
			extra: __filename,
		}))
		.pipe(htmlMin(htmlMinOption))
		.pipe(gulp.dest(config.dest.dist))
));

let concat = require('gulp-concat');
let gulp = require('gulp');
let htmlMin = require('gulp-html-minifier-terser');
let newer = require('gulp-newer');
let terser = require('gulp-terser');
let all = require('gulp-all');

let vue = require('../plugins/vue');
let htmlMinOption = require('../html.json');

gulp.task('donate', () => all(
	gulp.src([
		'src/donate/main.vue',
		'src/donate/main.js',
	])
		.pipe(newer("dist/donate.js"))
		.pipe(vue())
		.pipe(concat('donate.js'))
		.pipe(terser())
		.pipe(gulp.dest('dist')),
	gulp.src('src/donate/donate.htm')
		.pipe(newer("dist"))
		.pipe(htmlMin(htmlMinOption))
		.pipe(gulp.dest('dist'))
));

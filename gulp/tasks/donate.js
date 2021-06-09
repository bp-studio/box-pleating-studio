let all = require('gulp-all');
let gulp = require('gulp');
let htmlMin = require('gulp-html-minifier-terser');
let newer = require('gulp-newer');
let terser = require('gulp-terser');

let vue = require('../plugins/vue');
let htmlMinOption = require('../html.json');

gulp.task('donate', () => all(
	// Vue
	gulp.src(['src/donate/main.vue', 'src/donate/main.js'])
		.pipe(newer({
			dest: 'build/dist/donate.js',
			extra: __filename,
		}))
		.pipe(vue('donate.js'))
		.pipe(terser())
		.pipe(gulp.dest('build/dist')),

	// Html
	gulp.src('src/public/donate.htm')
		.pipe(newer({
			dest: 'build/dist/donate.htm',
			extra: __filename,
		}))
		.pipe(htmlMin(htmlMinOption))
		.pipe(gulp.dest('build/dist'))
));

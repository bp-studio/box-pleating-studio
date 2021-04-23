let cleanCss = require('gulp-clean-css');
let concat = require('gulp-concat');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let lazypipe = require('lazypipe');
let newer = require('gulp-newer');
let terser = require('gulp-terser');
let wrap = require('@makeomatic/gulp-wrap-js');

let i18n = require('../plugins/i18n');
let order = require('../plugins/order');
let vue = require('../plugins/vue');

let terserOption = require('../terser.json');

let jsPipe = lazypipe()
	.pipe(() => wrap("if(!err&&!wErr) { %= body % }"))
	.pipe(() => gulp.dest('debug/'))
	.pipe(() => terser(terserOption));

gulp.task('app', () =>
	gulp.src([
		'src/app/css/*.css',
		'src/app/header.js',
		'src/app/components/mixins/*.ts',
		'src/app/components/**/*.vue',
		'src/app/footer.js'
	])
		.pipe(newer({
			dest: 'dist/main.js',
			extra: __filename
		}))
		.pipe(vue('main.js', 'main.css'))
		.pipe(gulpIf(file => file.extname == ".js", jsPipe(), cleanCss()))
		.pipe(gulp.dest('dist/'))
);

gulp.task('locale', () =>
	gulp.src('src/locale/*.json')
		.pipe(newer({
			dest: 'dist/locale.js',
			extra: __filename
		}))
		.pipe(order('en.json'))
		.pipe(gulp.dest('src/locale/'))
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrap("let locale={};%= body %"))
		.pipe(terser())
		.pipe(gulp.dest('dist/'))
);

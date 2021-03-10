let cleanCss = require('gulp-clean-css');
let concat = require('gulp-concat');
let gulp = require('gulp');
let newer = require('gulp-newer');
let terser = require('gulp-terser');
let wrap = require('gulp-wrap');

let i18n = require('../plugins/i18n');
let order = require('../plugins/order');
let vue = require('../plugins/vue');

let terserOption = require('../terser.json');

gulp.task('app', () =>
	gulp.src([
		'src/app/header.js',
		'src/app/components/mixins/*.ts',
		'src/app/components/**/*.vue',
		'src/app/footer.js'
	])
		.pipe(newer("dist/main.js"))
		.pipe(vue())
		.pipe(concat('main.js'))
		.pipe(wrap("if(!err&&!wErr) { <%= contents %> }",))
		.pipe(gulp.dest('debug/'))
		.pipe(terser(terserOption))
		.pipe(gulp.dest('dist/'))
);

gulp.task('locale', () =>
	gulp.src('src/locale/*.json')
		.pipe(newer("dist/locale.js"))
		.pipe(order('en.json'))
		.pipe(gulp.dest('src/locale/'))
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrap("let locale={};<%= contents %>"))
		.pipe(terser())
		.pipe(gulp.dest('dist/'))
);

gulp.task('css', () =>
	gulp.src('src/app/css/*.css')
		.pipe(newer("dist/main.css"))
		.pipe(concat('main.css'))
		.pipe(cleanCss())
		.pipe(gulp.dest('dist'))
);

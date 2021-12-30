const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const lazypipe = require('lazypipe');
const newer = require('gulp-newer');
const terser = require('gulp-terser');
const wrap = require('@makeomatic/gulp-wrap-js');

const config = require('../config.json');
const i18n = require('../plugins/i18n');
const order = require('../plugins/order');
const vue = require('../plugins/vue');

const jsPipe = lazypipe()
	.pipe(() => wrap("if(errMgr.ok()) { %= body % }"))
	.pipe(() => gulp.dest(config.dest.debug))
	.pipe(() => terser({
		ecma: 2019,
		compress: {
			drop_debugger: false,
		},
	}));

gulp.task('app', () =>
	gulp.src([
		'css/*.css',
		'header.js',
		'**/*.ts',
		'components/**/*.vue',
		'!**/*.d.ts',
	], { cwd: config.src.app })
		.pipe(newer({
			dest: config.dest.dist + '/main.js',
			extra: __filename,
		}))
		.pipe(vue('main.js', 'main.css'))
		.pipe(gulpIf(file => file.extname == ".js", jsPipe(), cleanCss()))
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task('locale', () =>
	gulp.src(config.src.locale + '/*.json')
		.pipe(newer({
			dest: config.dest.dist + '/locale.js',
			extra: __filename,
		}))
		.pipe(order('en.json'))
		.pipe(gulp.dest(config.src.locale))
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrap("const locale={};%= body %"))
		.pipe(terser())
		.pipe(gulp.dest(config.dest.dist))
);

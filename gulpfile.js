let gulp = require('gulp');
let ts = require('gulp-typescript');
let wrapJS = require("gulp-wrap-js");
let wrap = require("gulp-wrap");
let ifAnyNewer = require('gulp-if-any-newer');
let sourcemaps = require('gulp-sourcemaps');
let concat = require('gulp-concat');
let terser = require('gulp-terser');
let ftp = require('vinyl-ftp');
let log = require('fancy-log');

let workbox = require('./.vscode/workbox');
let log2 = require('./.vscode/log');
let vue = require('./.vscode/vue');
let i18n = require('./.vscode/i18n');

let projCore = ts.createProject('src/core/tsconfig.json');
let projService = ts.createProject('src/service/tsconfig.json');
let projTest = ts.createProject('test/tsconfig.json');

let terserOption = {
	ecma: 2019,
	compress: {
		drop_console: false,
		drop_debugger: false
	}
};

// 更新模組
gulp.task('update', () => (
	gulp.src("../shrewd/dist/shrewd.min.js")
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../../shrewd/src' }))
		.pipe(gulp.dest('dist/')),
	gulp.src("../shrewd/dist/*.d.ts")
		.pipe(gulp.dest('src/core/global'))
));

gulp.task('buildCore', () =>
	projCore.src()
		.pipe(ifAnyNewer("dist", { filter: 'bpstudio.js' }))
		.pipe(sourcemaps.init())
		.pipe(projCore())
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildCorePub', () =>
	projCore.src()
		.pipe(projCore())
		.pipe(wrap(
			`(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.BPStudio=factory();}}(this,function(){ <%= contents %> ;return BPStudio;}));`
		))
		.pipe(terser(Object.assign({}, terserOption, { mangle: true })))
		.pipe(gulp.dest('dist/')),
);

gulp.task('buildService', () =>
	projService.src()
		.pipe(projService())
		.pipe(workbox({
			globDirectory: 'dist',
			globPatterns: ['**/*.htm', '**/*.js', '**/*.css', '**/*.woff2', '**/bps.*', 'manifest.json'],
			globIgnores: ['sw.js']
		}))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildTest', () =>
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrapJS("let Shrewd=require('../dist/Shrewd.js');%= body %"))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest('test/'))
);

gulp.task('buildApp', () =>
	gulp.src([
		'src/app/header.js',
		'src/app/components/mixins/*.ts',
		'src/app/components/**/*.vue',
		'src/app/footer.js'
	])
		.pipe(vue())
		.pipe(concat('main.js'))
		.pipe(wrap("if(!err&&!wErr) { <%= contents %> }",))
		.pipe(terser(terserOption))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildLog', () =>
	gulp.src('dist/log/*.md')
		.pipe(log2('log.js'))
		.pipe(gulp.dest('dist/log'))
);

gulp.task('buildLocale', () =>
	gulp.src('src/locale/*.json')
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrap("let locale={};<%= contents %>"))
		.pipe(terser())
		.pipe(gulp.dest('dist/'))
)

gulp.task('buildDonate', () =>
	gulp.src([
		'src/donate/main.vue',
		'src/donate/main.js',
	])
		.pipe(vue())
		.pipe(concat('donate.js'))
		.pipe(terser())
		.pipe(gulp.dest('dist/'))
);

const ftpFactory = (folder, g) => function() {
	let options = require('./.vscode/ftp-pub.json');
	options.log = log;
	let conn = ftp.create(options);
	var globs = [
		'dist/**/*',
		'!**/*.map',
		'!**/debug.log'
	];
	if(g) globs = globs.concat(g);
	return gulp.src(globs, { base: './dist', buffer: false })
		.pipe(conn.newer(`/public_html/${folder}`))
		.pipe(conn.dest(`/public_html/${folder}`));
};

gulp.task('uploadPub', ftpFactory('bp', ['dist/.htaccess']));

gulp.task('uploadDev', ftpFactory('bp-dev', ['!dist/manifest.json']));

gulp.task('deployDev', gulp.series(
	'buildService',
	'uploadDev'
));

gulp.task('deployPub', gulp.series(
	'buildCorePub',
	'buildLog',
	'buildService',
	'uploadPub'
));

gulp.task('default', gulp.series('buildCore'));

let cleanCss = require('gulp-clean-css');
let concat = require('gulp-concat');
let fs = require('fs');
let ftp = require('vinyl-ftp');
let gulp = require('gulp');
let gulpIf = require('gulp-if');
let htmlMin = require('gulp-html-minifier-terser');
let ifAnyNewer = require('gulp-if-any-newer');
let log = require('fancy-log');
let replace = require('gulp-replace');
let sourcemaps = require('gulp-sourcemaps');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');
let workbox = require('gulp-workbox');
let wrap = require("gulp-wrap");
let wrapJS = require("gulp-wrap-js");

let debug = require('./gulp/debug');
let i18n = require('./gulp/i18n');
let log2 = require('./gulp/log');
let vue = require('./gulp/vue');
let woff2 = require('./gulp/woff2');

let projCore = ts.createProject('src/core/tsconfig.json');
let projService = ts.createProject('src/service/tsconfig.json');
let projWorker = ts.createProject('src/worker/tsconfig.json');
let projTest = ts.createProject('test/tsconfig.json');

let terserOption = {
	ecma: 2019,
	compress: {
		drop_console: false,
		drop_debugger: false
	}
};
let htmlMinOption = {
	collapseWhitespace: true,
	removeComments: true,
	minifyJS: true
};

// 更新模組
gulp.task('shrewd', () => (
	gulp.src("../shrewd/dist/shrewd.min.js")
		.pipe(replace(/\/\/#.+?\n/, ""))
		.pipe(gulp.dest('dist/')),
	gulp.src("../shrewd/dist/shrewd.js")
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../../shrewd/src' }))
		.pipe(gulp.dest('debug/')),
	gulp.src("../shrewd/dist/*.d.ts")
		.pipe(gulp.dest('src/core/global'))
));

gulp.task('buildCore', () =>
	projCore.src()
		.pipe(ifAnyNewer("debug", { filter: 'bpstudio.js' }))
		.pipe(sourcemaps.init())
		.pipe(projCore())
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('debug/'))
);

gulp.task('buildCorePub', () =>
	gulp.src("debug/bpstudio.js")
		.pipe(ifAnyNewer("dist", { filter: 'bpstudio.js' }))
		.pipe(wrap(
			`(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.BPStudio=factory();}}(this,function(){ <%= contents %> ;return BPStudio;}));`
		))
		.pipe(terser(Object.assign({}, terserOption, { mangle: true })))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildWorker', () =>
	projWorker.src()
		.pipe(projWorker())
		.pipe(terser())
		.pipe(gulp.dest('dist/lib'))
);

gulp.task('buildService', () => {
	// 找出最後一個 log
	let dir = fs.opendirSync("dist/log"), file, lastLog;
	while((file = dir.readSync()) && file.isFile()) {
		let [stem, ext] = file.name.split('.');
		if(ext == "md" && (!lastLog || stem > lastLog)) lastLog = stem;
	}
	dir.closeSync();

	return projService.src()
		.pipe(projService())
		.pipe(workbox({
			globDirectory: 'dist',
			globPatterns: [
				'**/*.htm',
				'**/*.js',
				'**/*.css',
				'**/*.woff2',
				'manifest.json',
				'assets/icon/icon-32.png',
				'assets/icon/icon-192.png',
				`log/${lastLog}.md`
			],
			globIgnores: ['sw.js']
		}))
		.pipe(terser())
		.pipe(gulp.dest('dist/'));
});

gulp.task('buildTest', () =>
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrapJS("let Shrewd=require('../dist/shrewd.min.js');%= body %"))
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
		.pipe(ifAnyNewer("dist", { filter: 'main.js' }))
		.pipe(vue())
		.pipe(concat('main.js'))
		.pipe(wrap("if(!err&&!wErr) { <%= contents %> }",))
		.pipe(gulp.dest('debug/'))
		.pipe(terser(terserOption))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildLog', () =>
	gulp.src('dist/log/*.md')
		.pipe(ifAnyNewer("dist/log", { filter: 'log.js' }))
		.pipe(log2('log.js'))
		.pipe(gulp.dest('dist/log'))
);

gulp.task('buildLocale', () =>
	gulp.src('src/locale/*.json')
		.pipe(ifAnyNewer("dist", { filter: 'locale.js' }))
		.pipe(i18n())
		.pipe(concat('locale.js'))
		.pipe(wrap("let locale={};<%= contents %>"))
		.pipe(terser())
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildDonate', () =>
	gulp.src([
		'src/donate/main.vue',
		'src/donate/main.js',
	])
		.pipe(ifAnyNewer("dist", { filter: 'donate.js' }))
		.pipe(vue())
		.pipe(concat('donate.js'))
		.pipe(terser())
		.pipe(gulp.dest('dist/')),
	gulp.src('src/donate/donate.htm')
		.pipe(ifAnyNewer("dist", { filter: 'donate.htm' }))
		.pipe(htmlMin(htmlMinOption))
		.pipe(gulp.dest('dist/'))
);

gulp.task('buildNumber', () =>
	gulp.src('src/app/index.htm')
		.pipe(replace(/app_version: "(\d+)"/, (a, b) => `app_version: "${Number(b) + 1}"`))
		.pipe(gulp.dest('src/app'))
);

gulp.task('buildHtmlDev', () => gulp.src('src/app/index.htm')
	.pipe(debug())
	.pipe(gulp.dest('debug'))
);

gulp.task('buildHtmlPub', () => gulp.src('src/app/index.htm')
	.pipe(htmlMin(htmlMinOption))
	// 避免 VS Code Linter 出錯
	.pipe(replace(/<script>(.+?)<\/script>/g, "<script>$1;</script>"))
	.pipe(gulp.dest('dist'))
);

gulp.task('buildHtml', gulp.series(
	'buildHtmlDev',
	'buildHtmlPub'
));

gulp.task('buildCss', () =>
	gulp.src('src/app/css/*.css')
		.pipe(ifAnyNewer("dist", { filter: 'main.css' }))
		.pipe(concat('main.css'))
		.pipe(cleanCss())
		.pipe(gulp.dest('dist'))
);

gulp.task('buildFont', () =>
	gulp.src('dist/assets/bps/fonts/bps.ttf')
		.pipe(woff2())
		.pipe(gulp.dest('dist/assets/bps/fonts')),
	gulp.src('dist/assets/bps/style.css')
		.pipe(replace(
			/(src:\n(\s+))(url\('fonts\/bps.ttf\?(......)'\) format\('truetype'\))/,
			"$1url('fonts/bps.woff2?$4') format('woff2'),\n$2$3"
		))
		.pipe(gulp.dest('dist/assets/bps'))
);

const ftpFactory = (folder, g, p) => function() {
	let options = require('./.vscode/ftp-pub.json');
	options.log = log;
	let conn = ftp.create(options);
	let globs = [
		'dist/**/*',
		'!**/debug.log',
	].concat(g);
	let pipe = gulp.src(globs, { base: './dist', buffer: false });
	return (p ? p(pipe) : pipe)
		.pipe(conn.newer(`/public_html/${folder}`))
		.pipe(conn.dest(`/public_html/${folder}`));
};

gulp.task('uploadPub', ftpFactory('bp', ['dist/.htaccess']));

gulp.task('uploadDev', ftpFactory('bp-dev', ['!dist/manifest.json'], pipe => pipe.
	pipe(gulpIf(
		file => file.basename == "index.htm",
		replace('<script async src="https://www.googletagmanager.com/gtag/js?id=G-GG1TEZGBCQ"></script>', "")
	))
));

gulp.task('buildAll', gulp.series(
	'buildCore',
	'buildCorePub',
	'buildCss',
	'buildApp',
	'buildLog',
));

gulp.task('update', gulp.series(
	'buildNumber',
	'buildHtml',
	'buildService'
));

gulp.task('deployDev', gulp.series(
	'buildAll',
	'update',
	'uploadDev'
));

gulp.task('deployPub', gulp.series(
	'buildAll',
	'update',
	'uploadPub'
));

gulp.task('default', gulp.series('buildCore'));

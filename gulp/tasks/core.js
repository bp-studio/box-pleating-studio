let gulp = require('gulp');
let newer = require('gulp-newer');
let replace = require('gulp-replace');
let sourcemaps = require('gulp-sourcemaps');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');
let wrap = require('@makeomatic/gulp-wrap-js');

let coreConfig = 'src/core/tsconfig.json';
let projCoreDev = ts.createProject(coreConfig);
let projCorePub = ts.createProject(coreConfig);
let projTest = ts.createProject('test/tsconfig.json');

let terserOption = require('../terser.json');

function createTemplate(debugEnabled) {
	return `
		(function(root, factory){
			if(typeof define === 'function' && define.amd) {
				define([],factory);
			} else if(typeof exports === 'object') {
				module.exports = factory();
			} else {
				root.BPStudio = factory();
			}
		}(this, function(){
			const debugEnabled = ${debugEnabled};
			%= body %
			return BPStudio;
		}));
	`;
}

gulp.task('coreDev', () =>
	projCoreDev.src()
		.pipe(newer({
			dest: 'debug/bpstudio.js',
			extra: [__filename, coreConfig],
		}))
		.pipe(sourcemaps.init())
		.pipe(projCoreDev())
		.pipe(wrap(createTemplate(true)))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('debug'))
);

gulp.task('corePub', () =>
	projCorePub.src()
		.pipe(newer({
			dest: 'dist/bpstudio.js',
			extra: [__filename, coreConfig],
		}))
		.pipe(projCorePub())
		.pipe(wrap(createTemplate(false))) // string will all use '' after this step
		.pipe(replace(/('[$_][a-z0-9]+')/gi, '$$$$$$$$[$1]')) // Prepare decorator mangling
		.pipe(terser(Object.assign({}, terserOption, {
			mangle: { properties: { regex: /^[$_]/ } },
		})))
		.pipe(replace(/\$\$\$\$\.([a-z$_][a-z$_0-9]*)/gi, "'$1'")) // Restore
		.pipe(gulp.dest('dist'))
);

gulp.task('core', gulp.parallel('coreDev', 'corePub'));

gulp.task('buildTest', () =>
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrap("let Shrewd=require('../public/lib/shrewd.min.js');%= body %"))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest('test'))
);

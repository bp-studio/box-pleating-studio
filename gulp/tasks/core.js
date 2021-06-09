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


const template = `
	(function(root, factory){
		if(typeof define === 'function' && define.amd) {
			define([],factory);
		} else if(typeof exports === 'object') {
			module.exports = factory();
		} else {
			root.BPStudio = factory();
		}
	}(this, function(){
		%= body %
		return BPStudio;
	}));
`;

gulp.task('coreDev', () =>
	projCoreDev.src()
		.pipe(newer({
			dest: 'build/debug/bpstudio.js',
			extra: [__filename, coreConfig],
		}))
		.pipe(sourcemaps.init())
		.pipe(projCoreDev())
		.pipe(wrap(template))
		.pipe(terser({
			ecma: 2019,
			compress: {
				defaults: false,
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: true,
				},
			},
			mangle: false,
			format: { beautify: true },
		}))
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('build/debug'))
);

gulp.task('corePub', () =>
	projCorePub.src()
		.pipe(newer({
			dest: 'build/dist/bpstudio.js',
			extra: [__filename, coreConfig],
		}))
		.pipe(projCorePub())
		.pipe(wrap(template)) // string will all use '' after this step
		.pipe(replace(/('[$_][a-z0-9]+')/gi, '$$$$$$$$[$1]')) // Prepare decorator mangling
		.pipe(terser({
			ecma: 2019,
			compress: {
				drop_debugger: false,
				global_defs: {
					DEBUG_ENABLED: false,
				},
			},
			mangle: { properties: { regex: /^[$_]/ } },
		}))
		.pipe(replace(/\$\$\$\$\.([a-z$_][a-z$_0-9]*)/gi, "'$1'")) // Restore
		.pipe(gulp.dest('build/dist'))
);

gulp.task('core', gulp.parallel('coreDev', 'corePub'));

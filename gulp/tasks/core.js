const gulp = require('gulp');
const newer = require('gulp-newer');
const path = require('path');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const ts = require('gulp-typescript');
const wrap = require('@makeomatic/gulp-wrap-js');

const config = require('../config.json');
const coreConfig = config.src.core + '/tsconfig.json';
const projCoreDev = ts.createProject(coreConfig);
const projCorePub = ts.createProject(coreConfig);

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
			dest: config.dest.debug + '/bpstudio.js',
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
		.pipe(sourcemaps.write('.', {
			includeContent: false,
			sourceRoot: path.relative(config.dest.debug, config.src.core),
		}))
		.pipe(gulp.dest(config.dest.debug))
);

gulp.task('corePub', () =>
	projCorePub.src()
		.pipe(newer({
			dest: config.dest.dist + '/bpstudio.js',
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
		.pipe(gulp.dest(config.dest.dist))
);

gulp.task('core', gulp.parallel('coreDev', 'corePub'));

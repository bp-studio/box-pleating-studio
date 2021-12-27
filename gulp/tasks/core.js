const esb = require('gulp-esbuild');
const exg = require('esbuild-plugin-external-global');
const gulp = require('gulp');
const newer = require('gulp-newer');
const path = require('path');
const replace = require('gulp-replace');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const wrap = require('@makeomatic/gulp-wrap-js');

const config = require('../config.json');

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
		const { shrewd, terminate } = Shrewd;
		%= body %
		return BPStudio.BPStudio;
	}));
`;

gulp.task('coreDev', () =>
	gulp.src(config.src.core + '/BPStudio.ts')
		.pipe(newer({
			dest: config.dest.debug + '/bpstudio.js',
			extra: [__filename, config.src.core + '/**/*'],
		}))
		.pipe(esb({
			outfile: 'bpstudio.js',
			bundle: true,
			sourcemap: 'inline', // for continuing with gulp-sourcemaps
			globalName: 'BPStudio',
			external: ['paper'],
			resolveExtensions: ['.ts', '.d.ts'],
			plugins: [
				exg.externalGlobalPlugin({
					'paper': 'paper',
				}),
			],
		}))
		.pipe(sourcemaps.init({ loadMaps: true }))
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
			format: {
				beautify: true,
				comments: true,
			},
		}))
		.pipe(sourcemaps.write('.', {
			includeContent: false,
			sourceRoot: path.relative(config.dest.debug, "."),
		}))
		.pipe(gulp.dest(config.dest.debug))
);

gulp.task('corePub', () =>
	gulp.src(config.src.core + '/BPStudio.ts')
		.pipe(newer({
			dest: config.dest.dist + '/bpstudio.js',
			extra: [__filename, config.src.core + '/**/*'],
		}))
		.pipe(esb({
			outfile: 'bpstudio.js',
			bundle: true,
			// no sourcemap
			globalName: 'BPStudio',
			external: ['paper'],
			resolveExtensions: ['.ts', '.d.ts'],
			plugins: [
				exg.externalGlobalPlugin({
					'paper': 'paper',
				}),
			],
		}))
		.pipe(wrap(template))
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

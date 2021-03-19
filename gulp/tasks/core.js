let gulp = require('gulp');
let newer = require('gulp-newer');
let sourcemaps = require('gulp-sourcemaps');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');
let wrap = require('gulp-wrap');
let wrapJS = require('gulp-wrap-js');

let projCore = ts.createProject('src/core/tsconfig.json');
let projTest = ts.createProject('test/tsconfig.json');

let terserOption = require('../terser.json');

gulp.task('coreDev', () =>
	projCore.src()
		.pipe(newer({
			dest: 'debug/bpstudio.js',
			extra: __filename
		}))
		.pipe(sourcemaps.init())
		.pipe(projCore())
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '../src/core' }))
		.pipe(gulp.dest('debug'))
);

gulp.task('corePub', () =>
	gulp.src("debug/bpstudio.js")
		.pipe(newer({
			dest: 'dist/bpstudio.js',
			extra: __filename
		}))
		.pipe(wrap(
			`(function(root,factory){if(typeof define==='function'&&define.amd)
			{define([],factory);}else if(typeof exports==='object'){module.exports=factory();}
			else{root.BPStudio=factory();}}(this,function(){ <%= contents %> ;return BPStudio;}));`
		))
		.pipe(terser(Object.assign({}, terserOption, { mangle: true })))
		.pipe(gulp.dest('dist'))
);

gulp.task('core', gulp.series('coreDev', 'corePub'));

gulp.task('buildTest', () =>
	projTest.src()
		.pipe(sourcemaps.init())
		.pipe(projTest())
		.pipe(wrapJS("let Shrewd=require('../dist/shrewd.min.js');%= body %"))
		.pipe(sourcemaps.write('.', { includeContent: false }))
		.pipe(gulp.dest('test'))
);

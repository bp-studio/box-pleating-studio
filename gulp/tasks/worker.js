let gulp = require('gulp');
let newer = require('gulp-newer');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');

let projWorker = ts.createProject('src/worker/tsconfig.json');

gulp.task('worker', () =>
	projWorker.src()
		.pipe(newer({ dest: 'dist', ext: '.js' }))
		.pipe(projWorker())
		.pipe(terser())
		.pipe(gulp.dest('dist'))
);

let gulp = require('gulp');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');

let projWorker = ts.createProject('src/worker/tsconfig.json');

gulp.task('worker', () =>
	projWorker.src()
		.pipe(projWorker())
		.pipe(terser())
		.pipe(gulp.dest('dist'))
);

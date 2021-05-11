let fs = require('fs');
let gulp = require('gulp');
let terser = require('gulp-terser');
let ts = require('gulp-typescript');
let workbox = require('gulp-workbox');

let projService = ts.createProject('src/service/tsconfig.json');

gulp.task('sw', () => {
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
				`log/${lastLog}.md`, // 只有最後一個 log 會被 precache
			],
			globIgnores: ['sw.js'],
		}))
		.pipe(terser())
		.pipe(gulp.dest('dist/'));
});

const fs = require('fs');
const gulp = require('gulp');
const terser = require('gulp-terser');
const ts = require('gulp-typescript');
const workbox = require('gulp-workbox');

const config = require('../config.json');
const projService = ts.createProject(config.src.sw + '/tsconfig.json');

gulp.task('sw', () => {
	// 找出最後一個 log
	let dir = fs.opendirSync(config.dest.dist + '/log'), file, lastLog;
	while((file = dir.readSync()) && file.isFile()) {
		let [stem, ext] = file.name.split('.');
		if(ext == "md" && (!lastLog || stem > lastLog)) lastLog = stem;
	}
	dir.closeSync();

	return projService.src()
		.pipe(projService())
		.pipe(workbox({
			globDirectory: config.dest.dist,
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
		.pipe(gulp.dest(config.dest.dist));
});

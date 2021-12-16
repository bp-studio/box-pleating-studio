const cleanCss = require('gulp-clean-css');
const gulp = require('gulp');
const gulpIf = require('gulp-if');
const newer = require('gulp-newer');

const config = require('../../config.json');
const woff2 = require('../../plugins/woff2');

/** 建置 BPS 圖示集 */
module.exports = () => gulp.src(config.src.public + '/assets/bps/**/*')
	.pipe(newer({
		dest: config.dest.dist + '/assets/bps/style.css',
		extra: [__filename, 'gulp/plugins/woff2.js'],
	}))
	.pipe(woff2('bps'))
	.pipe(gulpIf(file => file.extname == ".css", cleanCss()))
	.pipe(gulp.dest(config.dest.dist + '/assets/bps'));

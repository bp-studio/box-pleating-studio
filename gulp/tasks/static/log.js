const gulp = require('gulp');
const gulpIf = require('gulp-if');
const newer = require('gulp-newer');
const terser = require('gulp-terser');

const config = require('../../config.json');
const log = require('../../plugins/log');

const libs = [
	'font-awesome/css/all.min.css',
	'sortable.min.js',
	'vuedraggable.min.js',
	'bootstrap/popper.min.js',
	'bootstrap/bootstrap.min.js',
	'vue-clipboard.min.js',
	'jszip.min.js',
	'lzma_worker-min.js',
	'marked.min.js',
];

/** 建置更新 log */
module.exports = () => gulp.src(config.src.log + '/*.md')
	.pipe(newer({
		dest: config.dest.dist + '/log/log.js',
		extra: [__filename, 'gulp/plugins/log.js'],
	}))
	.pipe(log('log.js', libs))
	.pipe(gulpIf(file => file.extname == ".js", terser()))
	.pipe(gulp.dest(config.dest.dist + '/log'));

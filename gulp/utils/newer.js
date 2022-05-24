const gulpIf = require("gulp-if");
const gulpNewer = require("gulp-newer");
const yargs = require("yargs");

/**
 * Behaves the same way as gulp-newer, unless using `--force` argument.
 */
module.exports = function(...args) {
	return gulpIf(!yargs.argv.force, gulpNewer(...args));
};

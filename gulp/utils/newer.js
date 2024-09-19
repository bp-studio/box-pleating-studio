const iif = require("gulp-if");
const newer = require("gulp-newer");
const yargs = require("yargs");

/**
 * Behaves the same way as gulp-newer, unless using `--force` argument.
 */
module.exports = function(...args) {
	return iif(!yargs.argv.force, newer(...args));
};

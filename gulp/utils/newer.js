const $ = require("./proxy");
const yargs = require("yargs");

/**
 * Behaves the same way as gulp-newer, unless using `--force` argument.
 */
module.exports = function(...args) {
	return $.if(!yargs.argv.force, $.newer(...args));
};

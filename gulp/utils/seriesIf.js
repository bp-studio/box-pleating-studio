const gulp = require("gulp");

module.exports = function(predicate, ...tasks) {
	return (async () => {
		const result = await predicate();
		if(result) {
			await new Promise(cb => {
				gulp.series(...tasks)(cb);
			});
		}
	})();
};

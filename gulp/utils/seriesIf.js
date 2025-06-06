import gulp from "gulp";

export default function(predicate, ...tasks) {
	return (async () => {
		const result = await predicate();
		if(result) {
			await new Promise(cb => {
				gulp.series(...tasks)(cb);
			});
		}
	})();
};

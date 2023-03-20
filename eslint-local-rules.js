
module.exports = {
	"ascii-comments": {
		meta: {
			type: "layout",
			docs: {
				description: "Comments should use ASCII characters only.",
			},
		},
		create(context) {
			const sourceCode = context.getSourceCode();
			return {
				Program() {
					for(const comment of sourceCode.getAllComments()) {
						const match = (/[^\s!-~]+/m).exec(comment.value);
						if(match) {
							debugger;
							const start = comment.range[0];
							context.report({
								loc: {
									start: sourceCode.getLocFromIndex(start + 2 + match.index),
									end: sourceCode.getLocFromIndex(start + 2 + match.index + match[0].length),
								},
								message: "Comments should use ASCII characters only.",
							});
						}
					}
				},
			};
		},
	},
};

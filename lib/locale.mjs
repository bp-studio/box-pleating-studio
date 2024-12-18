
function compile(t) {
	if(t.includes("{")) {
		t = t.replace(/\{(\d+)\}/g, "\",i(l($1)),\"");
		return "({normalize:n,interpolate:i,list:l})=>n([\"" + t + "\"])";
	}
	return `_=>"${t}"`;
}

/**
 * Locale loader
 * @type {import("@rspack/core").LoaderDefinitionFunction}
 */
export default function(content, map, meta) {
	return "export default " + content.replace(/"((?:[^"\\]|\\.)+)"(.)/gs, ($0, $1, $2) => {
		if($2 == "]" || $2 == ":") return $0;
		return compile($1) + $2;
	});
};

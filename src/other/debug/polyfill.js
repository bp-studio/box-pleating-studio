(function() {
	// fetch
	const org_fetch = fetch;
	fetch = function(url) {
		if(url.startsWith("h") || url.startsWith("blob")) {
			return org_fetch(url);
		} else {
			return new Promise(resolve => {
				const oReq = new XMLHttpRequest();
				oReq.addEventListener("load", e =>
					resolve({
						text: () => e.target.responseText,
					})
				);
				oReq.open("GET", url);
				oReq.send();
			});
		}
	};
})();

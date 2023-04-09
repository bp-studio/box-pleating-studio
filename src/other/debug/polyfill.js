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

	// broadcast channel
	const bc = new BroadcastChannel("bp_channel");
	let res;
	bc.onmessage = function(event) {
		if(typeof event.data == "number") {
			if(event.data > app.id) bc.postMessage([event.data]);
		} else if(event.data[0] == app.id) { res(false); }
	};
	window.checkWithBC = function() {
		return new Promise(resolve => {
			res = resolve;
			bc.postMessage(app.id);
			setTimeout(() => res(true), 0);
		});
	};
})();

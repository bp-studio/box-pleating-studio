/* eslint-disable prefer-promise-reject-errors */

///////////////////////////////////////////////////
// Service Worker 溝通
///////////////////////////////////////////////////

function callService(data: unknown): Promise<unknown> {
	return new Promise((resolve, reject) => {
		if('serviceWorker' in navigator) {
			navigator.serviceWorker.getRegistration('/').then(reg => {
				if(!reg) return;
				if(!reg.active) return reject(); // Safari 在第一次執行的時候可能會進到這裡
				let channel = new MessageChannel();
				channel.port1.onmessage = event => resolve(event.data);
				reg.active.postMessage(data, [channel.port2]);
			}, () => reject());
		} else {
			reject();
		}
	});
}

if('serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', event => {
		if(event.data == "id") event.ports[0].postMessage(core.id);
	});
}

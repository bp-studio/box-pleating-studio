export function sleep(ms?: number): Promise<void> {
	return new Promise(res => {
		setTimeout(res, ms || 0);
	});
}

const channel = new MessageChannel();

export function doEvents(): Promise<void> {
	return new Promise(resolve => {
		channel.port1.onmessage = () => resolve();
		channel.port2.postMessage(null);
	});
}

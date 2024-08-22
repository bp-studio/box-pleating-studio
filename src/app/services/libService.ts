
//=================================================================
/**
 * {@link LibService} manages the loading of non-critical libraries.
 */
//=================================================================
namespace LibService {

	const resolver = Promise.withResolvers<void>();
	const libResolve: Action = resolver.resolve;

	/** Wait for all non-critical libraries to load */
	export const ready = resolver.promise;

	/** Load non-critical libraries */
	export function load(): Promise<void> {
		const loading = [];
		for(const lib of libs) {
			if(lib.endsWith("js")) loading.push(loadScript(lib));
			else loading.push(loadStylesheet(lib));
		}
		return Promise.all(loading).then(libResolve);
	}

	function loadStylesheet(href: string): Promise<void> {
		return new Promise(resolve => {
			const link = document.createElement("link");
			link.rel = "stylesheet";
			link.href = href;
			link.onload = () => resolve();
			link.onerror = () => {
				errMgr.setResErr(href);
				resolve(); // Resolve normally
			};
			document.head.appendChild(link);
		});
	}

	export function loadScript(src: string): Promise<void> {
		return new Promise(resolve => {
			const script = document.createElement("script");
			script.src = src;
			script.async = false;
			script.onload = () => resolve(); // At this moment the script will have been executed
			script.onerror = () => {
				errMgr.setResErr(src);
				resolve(); // Resolve normally
			};
			document.head.appendChild(script);
		});
	}
}

export default LibService;

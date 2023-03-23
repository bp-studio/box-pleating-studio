import { Application } from "@pixi/app";
import { isWebGLSupported } from "@pixi/utils";

export function usePixiApp(width: number, height: number): Application {
	try {
		return new Application({
			width,
			height,
			antialias: true, // We still need this for drawing texts
			// Start the app regardless whether there's an opened project.
			// This improves the displaying speed of the first open project.
			autoStart: true,
			premultipliedAlpha: false,

			// Floating number devicePixelRatio could cause the grid to appear glitchy,
			// so taking the floor of it is good enough. This approach results in good visuals
			// in both desktops and mobiles.
			resolution: Math.floor(devicePixelRatio),
			autoDensity: true,
		});
	} catch(e) {
		// Double check if the error is caused by WebGL initialization.
		// The method caches the result internally,
		// so there's no additional cost of calling it again.
		if(isWebGLSupported()) throw e;

		errMgr.setCustomError(
			i18n.t("message.webGL.title"),
			i18n.t("message.webGL.body")
		);
	}
}

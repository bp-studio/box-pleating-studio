// Polyfills
import "shared/polyfill/globalThis"; // For Safari < 12.1, used in Client
import "shared/polyfill/eventTarget"; // For Safari < 14, used in Client
import "shared/polyfill/flatMap"; // For Safari < 12, used in VueDraggable
import "shared/polyfill/toReversed"; // Used in Client
import "shared/polyfill/withResolvers";

import "lib/bootstrap/bootstrap.scss";
import "temp/bps/style.css";
import "app/style/main.scss";
import "temp/font-awesome/css/all.min.css";

// Disable native mouse wheel zooming
document.addEventListener(
	"wheel",
	(event: WheelEvent) => {
		if(event.ctrlKey || event.metaKey) event.preventDefault();
	},
	{
		passive: false, // To silence console warning
		capture: true, // To prioritize the handler
	}
);

errMgr.end();
if(errMgr.ok()) import("./init");

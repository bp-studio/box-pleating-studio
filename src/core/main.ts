
// Polyfills
import "shared/polyfill/toReversed";
import "shared/polyfill/flatMap";

import { getAction } from "./routes/routes";
import { State } from "./service/state";
import { UpdateResult } from "./service/updateResult";

import type { CoreError } from "shared/json";
import type { CoreResponse, CoreRequest } from "core/routes";

//=================================================================
/**
 * Handles the requests coming from the Client.
 *
 * For the moment all controller/action runs synchronously,
 * but asynchronous actions can be easily supported if needed.
 */
//=================================================================
onmessage = function(event: MessageEvent): void {
	if(!event.ports[0]) return;

	const request = event.data as CoreRequest;
	let response: CoreResponse;
	try {
		// Uncomment the next line to mock fatal error.
		// if(Math.random() < 0.1) throw new Error("Test error");

		// Get the route corresponding the the request.
		const action = getAction(request);

		// Execute the request.
		const result = action(...request.value);

		if(result !== undefined) {
			// If the request has a specific returned value, return it.
			response = { value: result };
		} else {
			// Otherwise we will return the UpdateModel by default.
			response = { update: UpdateResult.$flush() };
		}
	} catch(e: unknown) {
		debugger;
		const error = (e instanceof Error ?
			{ message: e.message, coreTrace: e.stack || "" } :
			{ message: "Unknown error", coreTrace: "" }) as CoreError;
		response = { error };
	}
	event.ports[0].postMessage(response);
};

// Signify that the worker is ready. This is needed in Safari 11,
// otherwise the main thread might post message before the worker is ready.
postMessage(null);

export { State as Data };

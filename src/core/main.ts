import { getAction } from "./routes/routes";
import { State } from "./service/state";

import type { StudioResponse, IStudioRequest } from "core/routes";

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

	const request = event.data as IStudioRequest;
	let response: StudioResponse;
	try {
		// Get the route corresponding the the request.
		const action = getAction(request);

		// Execute the request.
		const result = action(...request.value);

		if(result !== undefined) {
			// If the request has a specific returned value, return it.
			response = { value: result };
		} else {
			// Otherwise we will return the UpdateModel by default.
			const update = State.$updateResult;
			State.$resetResult();
			response = { update };
		}
	} catch(e: unknown) {
		debugger;
		response = { error: e instanceof Error ? e.message : "Unknown error" };
	}

	event.ports[0].postMessage(response);
};

export { State };

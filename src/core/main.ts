import { getAction } from "./routes/routes";
import { Design } from "./design/design";
import { State } from "./service/state";

import type { StudioResponse, IStudioRequestBase } from "core/routes";

onmessage = async function(event: MessageEvent): Promise<void> {
	if(!event.ports[0]) return;

	const request = event.data as IStudioRequestBase;
	let response: StudioResponse;
	try {
		// Get the route corresponding the the request.
		const action = getAction(request);

		// Execute the request. Result could be a Promise or not.
		const result = await action(...request.value);

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

export { Design };

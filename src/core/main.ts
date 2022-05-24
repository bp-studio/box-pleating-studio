import Processor from "core/service/processor";
import Routes from "./routes/routes";
import { Design } from "./design/design";

import type { StudioResponse, IStudioRequestBase } from "core/routes";

onmessage = async function(event: MessageEvent): Promise<void> {
	if(event.ports[0]) {
		// 第一階段快速回應
		let response: StudioResponse;
		try {
			response = { value: main(event.data) };
		} catch(e: unknown) {
			response = { error: e instanceof Error ? e.message : "unknown error" };
		}
		event.ports[0].postMessage(response);

		// 開始執行工作
		const updates = await Processor.$runTask();

		// 傳回真正的結果
		if(updates) postMessage(updates);
	}
};

function main(request: IStudioRequestBase): unknown {
	if(request.controller in Routes) return route(Routes[request.controller], request);
	throw new Error(`Unknown controller: ${request.controller}`);
}

function route(controller: Record<string, unknown>, request: IStudioRequestBase): unknown {
	const action = controller[request.action];
	if(typeof action == "function") return action(...request.value);
	throw new Error(`Unknown action: ${request.controller}.${request.action}`);
}

export { Design, Processor };

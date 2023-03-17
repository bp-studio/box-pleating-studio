import type { JCommand, JStep } from "shared/json/history";

//=================================================================
/**
 * {@link Step} represents a single entry in the {@link HistoryManager}.
 */
//=================================================================


export class Step implements ISerializable<JStep> {

	public toJSON(): JStep<JCommand> {
		return {
			commands: [],
			mode: "layout",
			before: [],
			after: [],
		};
	}
}

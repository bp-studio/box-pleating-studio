import type { JCommand, JStep } from "shared/json/history";

//=================================================================
/**
 * {@link Step} represents a single entry in the {@link HistoryManager}.
 */
//=================================================================


export class Step implements ISerializable<JStep> {

	toJSON(): JStep<JCommand> {
		throw new Error("Method not implemented.");
	}
}

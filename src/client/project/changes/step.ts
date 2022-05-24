import type { JCommand, JStep } from "shared/json/history";

//=================================================================
/**
 * {@link Step} 代表 {@link HistoryManager} 中的一個操作步驟。
 */
//=================================================================


export class Step implements ISerializable<JStep> {

	toJSON(): JStep<JCommand> {
		throw new Error("Method not implemented.");
	}
}

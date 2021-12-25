import { EditCommand } from "./EditCommand";
import { FieldCommand } from "./FieldCommand";
import { MoveCommand } from "./MoveCommand";
import { CommandType } from "bp/content/json";
import type { JCommand } from "bp/content/json";
import type { Command } from "./Command";
import type { JEditCommand } from "./EditCommand";
import type { JFieldCommand } from "./FieldCommand";
import type { JMoveCommand } from "./MoveCommand";
import type { IDesignLike } from "bp/content/interface";

/** 將一個 {@link JCommand} 還原成 {@link Command} 物件實體 */
export function $resolve(design: IDesignLike, c: JCommand): Command {
	if(c.type == CommandType.field) return new FieldCommand(design, c as JFieldCommand);
	if(c.type == CommandType.move) return new MoveCommand(design, c as JMoveCommand);
	if(c.type == CommandType.add || c.type == CommandType.remove) {
		return new EditCommand(design, c as JEditCommand);
	}
	throw new Error();
}

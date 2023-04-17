import { FieldCommand } from "./fieldCommand";
import { CommandType } from "shared/json/enum";

import type { JFieldCommand } from "./fieldCommand";
import type { Project } from "client/project/project";
import type { JCommand } from "shared/json/history";
import type { Command } from "./command";

/** Restore a {@link JCommand} back to a {@link Command} instance. */
export function $resolve(project: Project, c: JCommand): Command {
	if(c.type == CommandType.field) return new FieldCommand(project, c as JFieldCommand);
	// if(c.type == CommandType.move) return new MoveCommand(design, c as JMoveCommand);
	// if(c.type == CommandType.add || c.type == CommandType.remove) {
	// 	return new EditCommand(design, c as JEditCommand);
	// }
	throw new Error();
}

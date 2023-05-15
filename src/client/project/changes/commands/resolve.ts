import { FieldCommand } from "./fieldCommand";
import { CommandType } from "shared/json/enum";
import { MoveCommand } from "./moveCommand";
import { EditCommand } from "./editCommand";

import type { JEditCommand } from "./editCommand";
import type { JMoveCommand } from "./moveCommand";
import type { JFieldCommand } from "./fieldCommand";
import type { Project } from "client/project/project";
import type { JCommand } from "shared/json/history";
import type { Command } from "./command";

/** Restore a {@link JCommand} back to a {@link Command} instance. */
export function $resolve(project: Project, c: JCommand): Command {
	if(c.type == CommandType.field) return new FieldCommand(project, c as JFieldCommand);
	if(c.type == CommandType.move) return new MoveCommand(project, c as JMoveCommand);
	if(c.type == CommandType.edit) return new EditCommand(project, c as JEditCommand);
	throw new Error();
}

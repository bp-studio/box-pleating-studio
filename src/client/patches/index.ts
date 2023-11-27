import BetaMigration from "./migrations/betaMigration";
import Rc0Migration from "./migrations/rc0Migration";
import Rc1Migration from "./migrations/rc1Migration";
import TrivialMigration from "./migrations/trivialMigration";
import ProjectMigration from "./migrations/projectMigration";
import { Migration } from "./migration";

// These version formats were never publicly released,
// therefore it should be OK to remove these migrations in the future.
Migration.$add(BetaMigration, "beta");
Migration.$add(Rc0Migration, "rc0");
Migration.$add(Rc1Migration, "rc1");

/**
 * Version 0 is identical as rc1. We change the version code just for the record.
 * This is the first publicly released format.
 */
Migration.$add(TrivialMigration, "0");

/**
 * Version 0.4 is completely downward compatible to version 0,
 * so we don't need to modify anything. All difference will be ignored.
 * The differences include there's an additional `history` (not included in file saving),
 * deprecate `fullscreen`, change `scale` to `zoom` (not included in file saving)
 */
Migration.$add(TrivialMigration, "0.4");

/** Version 0.6 separates `design` from the rest. */
Migration.$add(ProjectMigration, "0.6");

export { Migration };

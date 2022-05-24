import BetaMigration from "./migrations/betaMigration";
import Rc0Migration from "./migrations/rc0Migration";
import Rc1Migration from "./migrations/rc1Migration";
import TrivialMigration from "./migrations/trivialMigration";
import ProjectMigration from "./migrations/projectMigration";
import { Migration } from "./migration";

Migration.$add(BetaMigration, "beta");
Migration.$add(Rc0Migration, "rc0");
Migration.$add(Rc1Migration, "rc1");

// 版本 0 與 rc1 完全相同，純粹為了紀念發行而改變號碼
Migration.$add(TrivialMigration, "0");

// 版本 0.4 完全向下相容於版本 0，並不需要作任何修改；所有不同的地方都會自動被忽略
// 差別包括多了 history（不存檔）、棄用 fullscreen、scale 改成 zoom（不存檔）
Migration.$add(TrivialMigration, "0.4");

// 版本 0.6 將 design 的層次分離出來
Migration.$add(ProjectMigration, "0.6");

export { Migration };

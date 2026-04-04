import 'reflect-metadata';
import { Todo } from '../todo/todo.entity';
import { GithubTool } from '../github-tool/entities/github-tool.entity';
import { CollectionRecord } from '../github-tool/entities/collection-record.entity';
import { FocusConfig } from '../github-tool/entities/focus-config.entity';
import { SystemConfig } from '../system-config/system-config.entity';
import { UserAccount } from '../auth/user.entity';
import { createAppDataSource } from './typeorm.config';

async function runMigrations() {
  const dataSource = createAppDataSource([
    Todo,
    GithubTool,
    CollectionRecord,
    FocusConfig,
    SystemConfig,
    UserAccount,
  ]);

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});

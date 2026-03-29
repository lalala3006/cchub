import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoModule } from './todo/todo.module';
import { Todo } from './todo/todo.entity';
import { GithubTool } from './github-tool/entities/github-tool.entity';
import { CollectionRecord } from './github-tool/entities/collection-record.entity';
import { FocusConfig } from './github-tool/entities/focus-config.entity';
import { GithubToolModule } from './github-tool/github-tool.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH || './database.sqlite',
      entities: [Todo, GithubTool, CollectionRecord, FocusConfig],
      synchronize: true,
    }),
    TodoModule,
    GithubToolModule,
  ],
})
export class AppModule {}

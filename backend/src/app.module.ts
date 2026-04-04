import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoModule } from './todo/todo.module';
import { Todo } from './todo/todo.entity';
import { GithubTool } from './github-tool/entities/github-tool.entity';
import { CollectionRecord } from './github-tool/entities/collection-record.entity';
import { FocusConfig } from './github-tool/entities/focus-config.entity';
import { GithubToolModule } from './github-tool/github-tool.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { SystemConfig } from './system-config/system-config.entity';
import { LlmModule } from './llm/llm.module';
import { AuthModule } from './auth/auth.module';
import { UserAccount } from './auth/user.entity';
import { getTypeOrmOptions } from './database/typeorm.config';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmOptions([Todo, GithubTool, CollectionRecord, FocusConfig, SystemConfig, UserAccount])),
    AuthModule,
    TodoModule,
    GithubToolModule,
    SystemConfigModule,
    LlmModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

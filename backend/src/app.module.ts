import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoModule } from './todo/todo.module';
import { Todo } from './todo/todo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: '/Users/lalala/Desktop/ccHub/backend/database.sqlite',
      entities: [Todo],
      synchronize: true,
    }),
    TodoModule,
  ],
})
export class AppModule {}

import path from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, EntitySchema, EntityTarget } from 'typeorm';

type AppEntity = string | Function | EntitySchema;

export function getTypeOrmOptions(entities: EntityTarget<unknown>[]): TypeOrmModuleOptions {
  return {
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './database.sqlite',
    entities: entities as AppEntity[],
    synchronize: false,
    migrationsRun: false,
    migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  };
}

export function createAppDataSource(entities: EntityTarget<unknown>[]) {
  const options: DataSourceOptions = {
    ...(getTypeOrmOptions(entities) as DataSourceOptions),
  };

  return new DataSource(options);
}

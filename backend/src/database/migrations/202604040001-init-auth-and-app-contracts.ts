import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAuthAndAppContracts2026040400011 implements MigrationInterface {
  name = 'InitAuthAndAppContracts2026040400011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "todo" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "title" varchar NOT NULL,
        "description" varchar,
        "status" varchar NOT NULL DEFAULT ('pending'),
        "priority" varchar NOT NULL DEFAULT ('medium'),
        "order" integer NOT NULL DEFAULT (0),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "github_tool" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "fullName" varchar NOT NULL,
        "url" varchar NOT NULL,
        "description" varchar,
        "stars" integer NOT NULL DEFAULT (0),
        "language" varchar,
        "avatarUrl" varchar(500),
        "descriptionCn" text,
        "fetchedAt" datetime NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_4532ebdda0fa31977b5e14f72cd" UNIQUE ("fullName")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "collection_record" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "toolId" integer NOT NULL,
        "status" text NOT NULL DEFAULT ('unread'),
        "isHidden" boolean NOT NULL DEFAULT (0),
        "statusChangedAt" datetime NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_c6b98699d097545d1aeb0550cd4"
          FOREIGN KEY ("toolId") REFERENCES "github_tool" ("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "focus_config" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "keyword" varchar NOT NULL,
        "weight" integer NOT NULL DEFAULT (5),
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_config" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "key" varchar(255) NOT NULL,
        "value" varchar(500) NOT NULL,
        "category" varchar(50) NOT NULL DEFAULT ('llm'),
        CONSTRAINT "UQ_eedd3cd0f227c7fb5eff2204e93" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_account" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar NOT NULL,
        "passwordHash" text NOT NULL,
        "displayName" varchar,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_user_account_username" UNIQUE ("username")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_account"`);
  }
}

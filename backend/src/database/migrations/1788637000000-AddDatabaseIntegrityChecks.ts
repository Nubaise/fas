import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatabaseIntegrityChecks1788637000000
  implements MigrationInterface
{
  name = 'AddDatabaseIntegrityChecks1788637000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      ADD CONSTRAINT "CHK_availability_schedules_time_range"
      CHECK ("start_time" < "end_time")
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      ADD CONSTRAINT "CHK_availability_schedules_slot_duration"
      CHECK ("slot_duration" IN (15, 30, 45, 60))
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_exceptions"
      ADD CONSTRAINT "CHK_availability_exceptions_time_range"
      CHECK (
        ("start_time" IS NULL AND "end_time" IS NULL)
        OR
        ("start_time" IS NOT NULL AND "end_time" IS NOT NULL AND "start_time" < "end_time")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "CHK_appointments_time_range"
      CHECK ("start_time" < "end_time")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "CHK_appointments_time_range"
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_exceptions"
      DROP CONSTRAINT "CHK_availability_exceptions_time_range"
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      DROP CONSTRAINT "CHK_availability_schedules_slot_duration"
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      DROP CONSTRAINT "CHK_availability_schedules_time_range"
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1788636224814 implements MigrationInterface {
  name = 'CreateAppointments1788636224814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "availability_schedules" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "faculty_id" uuid NOT NULL,
        "day_of_week" smallint NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "slot_duration" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cfb5fcd683ea4ea6bec3183a216" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "availability_exceptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "faculty_id" uuid NOT NULL,
        "date" date NOT NULL,
        "start_time" TIME,
        "end_time" TIME,
        "reason" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_f5a89a7a6221bc93b517a13351f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."appointments_status_enum"
      AS ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED')
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "student_id" uuid NOT NULL,
        "faculty_id" uuid NOT NULL,
        "start_time" TIMESTAMP NOT NULL,
        "end_time" TIMESTAMP NOT NULL,
        "reason" text NOT NULL,
        "status" "public"."appointments_status_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "btree_gist"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "EXC_appointments_faculty_active_overlap"
      EXCLUDE USING gist (
        "faculty_id" WITH =,
        tsrange("start_time", "end_time", '[)') WITH &&
      )
      WHERE ("status" IN ('PENDING', 'CONFIRMED'))
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notification_jobs_status_enum"
      AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "notification_jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" character varying NOT NULL,
        "recipient_id" uuid NOT NULL,
        "payload" jsonb NOT NULL,
        "status" "public"."notification_jobs_status_enum" NOT NULL,
        "attempts" integer NOT NULL DEFAULT '0',
        "available_at" TIMESTAMP NOT NULL,
        "processed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_a9069c02b999ccf3a03b5e7bda9" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      ADD CONSTRAINT "FK_6086c16689f9258a8ba957226ff"
      FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_exceptions"
      ADD CONSTRAINT "FK_35ab140a185ee40bc5144600bd0"
      FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "FK_d62d6bb36d87c9ad5eddfabc098"
      FOREIGN KEY ("student_id") REFERENCES "students"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "FK_11e20e5e2867a2110f3125f321f"
      FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_jobs"
      ADD CONSTRAINT "FK_bcf434ab7441c4295758dcf168c"
      FOREIGN KEY ("recipient_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications"
      DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_jobs"
      DROP CONSTRAINT "FK_bcf434ab7441c4295758dcf168c"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "FK_11e20e5e2867a2110f3125f321f"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "FK_d62d6bb36d87c9ad5eddfabc098"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
      DROP CONSTRAINT "EXC_appointments_faculty_active_overlap"
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_exceptions"
      DROP CONSTRAINT "FK_35ab140a185ee40bc5144600bd0"
    `);

    await queryRunner.query(`
      ALTER TABLE "availability_schedules"
      DROP CONSTRAINT "FK_6086c16689f9258a8ba957226ff"
    `);

    await queryRunner.query(`DROP TABLE "notifications"`);

    await queryRunner.query(`DROP TABLE "notification_jobs"`);

    await queryRunner.query(`
      DROP TYPE "public"."notification_jobs_status_enum"
    `);

    await queryRunner.query(`DROP TABLE "appointments"`);

    await queryRunner.query(`
      DROP TYPE "public"."appointments_status_enum"
    `);

    await queryRunner.query(`DROP TABLE "availability_exceptions"`);

    await queryRunner.query(`DROP TABLE "availability_schedules"`);
  }
}

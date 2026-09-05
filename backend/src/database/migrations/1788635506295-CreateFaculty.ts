import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFaculty1788635506295 implements MigrationInterface {
    name = 'CreateFaculty1788635506295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "faculty" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "employee_number" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "department_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_715a89963f3f4ce9a1dcb88f348" UNIQUE ("employee_number"), CONSTRAINT "REL_8bfeeeb1ddee46f095f5181f8c" UNIQUE ("user_id"), CONSTRAINT "PK_635ca3484f9c747b6635a494ad9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "faculty" ADD CONSTRAINT "FK_8bfeeeb1ddee46f095f5181f8cc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "faculty" ADD CONSTRAINT "FK_008d2d8e1cfff7ed33b6c4029bf" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faculty" DROP CONSTRAINT "FK_008d2d8e1cfff7ed33b6c4029bf"`);
        await queryRunner.query(`ALTER TABLE "faculty" DROP CONSTRAINT "FK_8bfeeeb1ddee46f095f5181f8cc"`);
        await queryRunner.query(`DROP TABLE "faculty"`);
    }

}

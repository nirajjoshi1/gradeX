-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropIndex
DROP INDEX "TeacherAssignment_teacherId_classId_subjectId_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "schoolId" DROP NOT NULL;

ALTER TABLE "TeacherAssignment" ADD COLUMN "sectionId" TEXT;

ALTER TABLE "TeacherAssignment" DROP CONSTRAINT IF EXISTS "TeacherAssignment_teacherId_classId_subjectId_key";
DROP INDEX IF EXISTS "TeacherAssignment_schoolId_classId_subjectId_idx";

ALTER TABLE "TeacherAssignment"
ADD CONSTRAINT "TeacherAssignment_sectionId_fkey"
FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "TeacherAssignment_schoolId_classId_sectionId_subjectId_idx"
ON "TeacherAssignment"("schoolId", "classId", "sectionId", "subjectId");

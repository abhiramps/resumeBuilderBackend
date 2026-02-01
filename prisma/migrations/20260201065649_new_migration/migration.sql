-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" TEXT;

-- CreateIndex
CREATE INDEX "resumes_user_id_deleted_at_idx" ON "resumes"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "resumes_user_id_updated_at_idx" ON "resumes"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "resumes_user_id_status_deleted_at_idx" ON "resumes"("user_id", "status", "deleted_at");

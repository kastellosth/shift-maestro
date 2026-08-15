/*
  Warnings:

  - A unique constraint covering the columns `[date,jobId,shiftGroupId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Assignment_date_jobId_shiftGroupId_key" ON "Assignment"("date", "jobId", "shiftGroupId");

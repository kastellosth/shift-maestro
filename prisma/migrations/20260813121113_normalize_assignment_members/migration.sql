/*
  Warnings:

  - You are about to drop the column `employee1Id` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `employee2Id` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `fatigue` on the `Assignment` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "AssignmentMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AssignmentMember_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssignmentMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "shiftGroupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_shiftGroupId_fkey" FOREIGN KEY ("shiftGroupId") REFERENCES "ShiftGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("createdAt", "date", "id", "jobId", "shiftGroupId") SELECT "createdAt", "date", "id", "jobId", "shiftGroupId" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentMember_assignmentId_employeeId_key" ON "AssignmentMember"("assignmentId", "employeeId");

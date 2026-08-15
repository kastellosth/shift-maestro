-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "requiredPeople" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Job" ("difficulty", "id", "key", "label", "requiredPeople") SELECT "difficulty", "id", "key", "label", "requiredPeople" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_key_key" ON "Job"("key");
CREATE TABLE "new_ShiftGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ShiftGroup" ("difficulty", "id", "label", "name") SELECT "difficulty", "id", "label", "name" FROM "ShiftGroup";
DROP TABLE "ShiftGroup";
ALTER TABLE "new_ShiftGroup" RENAME TO "ShiftGroup";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

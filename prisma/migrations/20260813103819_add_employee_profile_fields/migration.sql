-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "company" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "esso" TEXT,
    "essoEntryDate" DATETIME,
    "iClass" TEXT,
    "armed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT
);
INSERT INTO "new_Employee" ("company", "id", "name", "score", "surname") SELECT "company", "id", "name", "score", "surname" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

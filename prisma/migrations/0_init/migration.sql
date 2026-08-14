-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee1Id" TEXT NOT NULL,
    "employee2Id" TEXT,
    "jobId" TEXT NOT NULL,
    "shiftGroupId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "fatigue" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("shiftGroupId") REFERENCES "ShiftGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("employee2Id") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("employee1Id") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "company" INTEGER NOT NULL,
    "score" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "requiredPeople" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ShiftGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_key_key" ON "Job"("key" ASC);

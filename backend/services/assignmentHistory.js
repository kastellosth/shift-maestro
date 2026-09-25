const prisma = require("../lib/prisma");

// Scoped to one employee - used by the "view this person's history" modal.
async function getEmployeeAssignmentHistory(employeeId) {
  return prisma.assignmentMember.findMany({
    where: {
      employeeId,
    },
    include: {
      assignment: {
        include: {
          job: true,
          shiftGroup: true,
        },
      },
    },
    orderBy: {
      assignment: {
        date: "desc",
      },
    },
  });
}

// Every employee - used by the scheduler to rank fatigue/recent workload
// across the whole pool before generating a schedule.
async function getAllAssignmentHistory() {
  return prisma.assignmentMember.findMany({
    include: {
      assignment: {
        include: {
          job: true,
          shiftGroup: true,
        },
      },
    },
    orderBy: {
      assignment: {
        date: "desc",
      },
    },
  });
}

module.exports = {
  getEmployeeAssignmentHistory,
  getAllAssignmentHistory,
};
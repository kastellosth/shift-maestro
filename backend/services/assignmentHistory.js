const prisma = require("../lib/prisma");

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

module.exports = {
  getEmployeeAssignmentHistory,
};
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const members = await prisma.assignmentMember.findMany({
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

    const history = {};

    for (const member of members) {
      const employeeId = member.employeeId;

      if (!history[employeeId]) {
        history[employeeId] = [];
      }

      history[employeeId].push({
        assignmentId: member.assignment.id,
        date: member.assignment.date,
        job: member.assignment.job,
        shiftGroup:
          member.assignment.shiftGroup,
        pinned: member.pinned,
      });
    }

    return res.json(history);
  } catch (error) {
    console.error(
      "Failed to fetch assignment history:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch assignment history",
    });
  }
});

module.exports = router;
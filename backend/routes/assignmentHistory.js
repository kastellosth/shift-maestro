const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/assignment-history
 *
 * Returns completed/persisted assignment history grouped by employee.
 *
 * Shape:
 * {
 *   employeeId: [
 *     {
 *       assignmentId,
 *       date,
 *       job,
 *       shiftGroup
 *     }
 *   ]
 * }
 */
router.get("/", async (req, res) => {
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
        shiftGroup: member.assignment.shiftGroup,
      });
    }

    return res.json(history);
  } catch (err) {
    console.error(
      "Failed to fetch assignment history:",
      err
    );

    return res.status(500).json({
      error: "Failed to fetch assignment history",
    });
  }
});

module.exports = router;
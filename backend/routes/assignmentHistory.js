const express = require("express");
const {
  getEmployeeAssignmentHistory,
  getAllAssignmentHistory,
} = require("../services/assignmentHistory");

const router = express.Router();

function toHistoryEntry(member) {
  return {
    assignmentId: member.assignment.id,
    date: member.assignment.date,
    job: member.assignment.job,
    shiftGroup: member.assignment.shiftGroup,
    pinned: member.pinned,
  };
}

router.get("/", async (_req, res) => {
  try {
    const members = await getAllAssignmentHistory();

    const history = {};

    for (const member of members) {
      const employeeId = member.employeeId;

      if (!history[employeeId]) {
        history[employeeId] = [];
      }

      history[employeeId].push(toHistoryEntry(member));
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

router.get("/:employeeId", async (req, res) => {
  try {
    const members = await getEmployeeAssignmentHistory(
      req.params.employeeId
    );

    return res.json(members.map(toHistoryEntry));
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
const express = require("express");
const {
  getEmployeeAssignmentHistory,
} = require("../services/assignmentHistory");

const router = express.Router();

router.get("/:employeeId", async (req, res) => {
  try {
    const members = await getEmployeeAssignmentHistory(
      req.params.employeeId
    );

    const history = members.map((member) => ({
      assignmentId: member.assignment.id,
      date: member.assignment.date,
      job: member.assignment.job,
      shiftGroup: member.assignment.shiftGroup,
      pinned: member.pinned,
    }));

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
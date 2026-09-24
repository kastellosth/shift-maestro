const express = require("express");
const prisma = require("../lib/prisma");
const {
  finalizeScheduleSchema,
} = require("../validation/assignment");

const router = express.Router();

function normalizeScheduleDate(value) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}


router.post("/", async (req, res) => {
  try {
    const result = finalizeScheduleSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid schedule data",
        details: result.error.issues,
      });
    }

    const { date, assignments } = result.data;

    const assignmentDate =
      normalizeScheduleDate(date);

    const employeeIds = assignments.flatMap((assignment) =>
      assignment.members.map((member) => member.employeeId)
    );

    if (new Set(employeeIds).size !== employeeIds.length) {
      return res.status(400).json({
        error: "An employee cannot appear more than once in a schedule",
      });
    }

    const existingAssignment =
      await prisma.assignment.findFirst({
        where: {
          date: assignmentDate,
        },
      });

    if (existingAssignment) {
      return res.status(409).json({
        error:
          "A schedule has already been finalized for this date",
      });
    }

    const slotKeys = assignments.map(
      (assignment) =>
        `${assignment.jobId}:${assignment.shiftGroupId}`
    );

    if (new Set(slotKeys).size !== slotKeys.length) {
      return res.status(400).json({
        error: "Schedule contains duplicate job/shift assignments",
      });
    }

    const jobIds = [
      ...new Set(
        assignments.map((assignment) => assignment.jobId)
      ),
    ];

    const jobs = await prisma.job.findMany({
      where: {
        id: {
          in: jobIds,
        },
      },
    });

    const jobsById = new Map(
      jobs.map((job) => [job.id, job])
    );

    for (const assignment of assignments) {
      const job = jobsById.get(assignment.jobId);

      if (!job) {
        return res.status(400).json({
          error: `Job does not exist: ${assignment.jobId}`,
        });
      }

      if (assignment.members.length !== job.requiredPeople) {
        return res.status(400).json({
          error:
            `Job "${job.label}" requires ` +
            `${job.requiredPeople} employee(s), ` +
            `but ${assignment.members.length} were provided`,
        });
      }
    }

    const createdAssignments = await prisma.$transaction(
      assignments.map((assignment) =>
        prisma.assignment.create({
          data: {
            date: assignmentDate,

            job: {
              connect: {
                id: assignment.jobId,
              },
            },

            shiftGroup: {
              connect: {
                id: assignment.shiftGroupId,
              },
            },

            members: {
              create: assignment.members.map((member) => ({
                employee: {
                  connect: {
                    id: member.employeeId,
                  },
                },

                pinned: member.pinned,
              })),
            },
          },

          include: {
            job: true,
            shiftGroup: true,
            members: true,
          },
        })
      )
    );

    return res.status(201).json({
      created: createdAssignments.length,
      assignments: createdAssignments,
    });
  } catch (err) {
    console.error("Failed to finalize schedule:", err);



    if (err.code === "P2025") {
      return res.status(400).json({
        error:
          "Schedule contains an employee, job, or shift group that does not exist",
      });
    }
    if (err.code === "P2002") {
      return res.status(409).json({
        error:
          "This job and shift have already been finalized for this date",
      });
    }

    return res.status(500).json({
      error: "Failed to finalize schedule",
    });
  }
});

module.exports = router;
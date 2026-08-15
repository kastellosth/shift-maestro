const express = require("express");
const prisma = require("../lib/prisma");
const {
  configSchema,
} = require("../validation/config");

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// GET /api/config
//
// Returns ONLY the active jobs and shifts.
// Historical/inactive catalogue entries stay in the database
// but are not shown in Config or used by the scheduler.
// ─────────────────────────────────────────────────────────────

router.get("/", async (_req, res) => {
  try {
    const [jobs, shifts] = await Promise.all([
      prisma.job.findMany({
        where: {
          active: true,
        },
        orderBy: {
          label: "asc",
        },
      }),

      prisma.shiftGroup.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return res.json({
      jobs,
      shifts,
    });
  } catch (err) {
    console.error(
      "Failed to fetch scheduling config:",
      err
    );

    return res.status(500).json({
      error: "Failed to fetch scheduling config",
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/config
//
// Saves the complete ACTIVE catalogue.
//
// Important:
// We do NOT physically delete old jobs/shifts.
//
// Instead:
//   1. Mark current catalogue inactive.
//   2. Upsert submitted catalogue as active.
//
// This preserves historical Assignment relationships.
// ─────────────────────────────────────────────────────────────

router.put("/", async (req, res) => {
  try {
    // ── 1. Validate request ──────────────────────────────

    const result = configSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid scheduling config",
        details: result.error.issues,
      });
    }

    const {
      jobs,
      shifts,
    } = result.data;

    // ── 2. Save atomically ───────────────────────────────

    await prisma.$transaction(async (tx) => {
      // First deactivate all currently active jobs.
      //
      // Jobs omitted from the submitted Config will
      // therefore remain inactive.

      await tx.job.updateMany({
        where: {
          active: true,
        },
        data: {
          active: false,
        },
      });

      // Same for shifts.

      await tx.shiftGroup.updateMany({
        where: {
          active: true,
        },
        data: {
          active: false,
        },
      });

      // ── 3. Upsert submitted jobs ───────────────────────
      //
      // Anything still present in Config becomes active.

      for (const job of jobs) {
        await tx.job.upsert({
          where: {
            id: job.id,
          },

          update: {
            key: job.key,
            label: job.label,
            difficulty: job.difficulty,
            requiredPeople: job.requiredPeople,
            active: true,
          },

          create: {
            ...job,
            active: true,
          },
        });
      }

      // ── 4. Upsert submitted shifts ─────────────────────

      for (const shift of shifts) {
        await tx.shiftGroup.upsert({
          where: {
            id: shift.id,
          },

          update: {
            name: shift.name,
            label: shift.label,
            difficulty: shift.difficulty,
            active: true,
          },

          create: {
            ...shift,
            active: true,
          },
        });
      }
    });

    // ── 5. Return fresh active catalogue ─────────────────
    //
    // Do NOT return inactive historical rows.

    const [savedJobs, savedShifts] =
      await Promise.all([
        prisma.job.findMany({
          where: {
            active: true,
          },
          orderBy: {
            label: "asc",
          },
        }),

        prisma.shiftGroup.findMany({
          where: {
            active: true,
          },
          orderBy: {
            name: "asc",
          },
        }),
      ]);

    return res.json({
      jobs: savedJobs,
      shifts: savedShifts,
    });
  } catch (err) {
    console.error(
      "Failed to save scheduling config:",
      err
    );

    // Prisma unique constraint error.
    //
    // For example:
    // two jobs attempting to use the same unique key.

    if (err.code === "P2002") {
      return res.status(409).json({
        error:
          "A job key or other unique value already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to save scheduling config",
    });
  }
});

module.exports = router;
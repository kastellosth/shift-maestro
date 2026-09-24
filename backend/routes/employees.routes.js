const express = require("express");
const {
  employeeInputSchema,
  employeeUpdateSchema,
} = require("../validation/employee");

const router = express.Router();
const prisma = require("../lib/prisma");


router.get("/", async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});


router.post("/", async (req, res) => {
  try {
    const rawEmployees = Array.isArray(req.body)
      ? req.body
      : req.body.employees;

    if (!Array.isArray(rawEmployees)) {
      return res.status(400).json({
        error: "Expected an array of employees",
      });
    }

    const parsedEmployees = [];

    for (const employee of rawEmployees) {
      const result = employeeInputSchema.safeParse(employee);

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid employee data",
          details: result.error.issues,
        });
      }

      parsedEmployees.push(result.data);
    }

    await prisma.employee.createMany({
      data: parsedEmployees.map((employee) => ({
        name: employee.name,
        surname: employee.surname,
        company: employee.company,

        
        score: 0,

        esso: employee.esso ?? null,

        essoEntryDate: employee.essoEntryDate
          ? new Date(employee.essoEntryDate)
          : null,

        iClass: employee.iClass ?? null,
        armed: employee.armed,
        notes: employee.notes ?? null,
      })),
    });

    return res.status(201).json({
      created: parsedEmployees.length,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to save employees",
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const result = employeeUpdateSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid employee data",
        details: result.error.issues,
      });
    }

    const employee = result.data;

    const updated = await prisma.employee.update({
      where: {
        id: req.params.id,
      },

      data: {
        ...(employee.name !== undefined && {
          name: employee.name,
        }),

        ...(employee.surname !== undefined && {
          surname: employee.surname,
        }),

        ...(employee.company !== undefined && {
          company: employee.company,
        }),

        ...(employee.esso !== undefined && {
          esso: employee.esso,
        }),

        ...(employee.essoEntryDate !== undefined && {
          essoEntryDate: employee.essoEntryDate
            ? new Date(employee.essoEntryDate)
            : null,
        }),

        ...(employee.iClass !== undefined && {
          iClass: employee.iClass,
        }),

        ...(employee.armed !== undefined && {
          armed: employee.armed,
        }),

        ...(employee.notes !== undefined && {
          notes: employee.notes,
        }),
      },
    });

    return res.json(updated);
  } catch (err) {
    if (err.code === "P2025") {
  return res.status(404).json({
    error: "Employee not found",
  });
}
    console.error(err);

    return res.status(500).json({
      error: "Failed to update employee",
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id },
    });

    return res.json({ ok: true });
  } catch (err) {
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "Employee not found",
    });
  }

  console.error(err);

  return res.status(500).json({
    error: "Failed to update employee",
  });
}
});

module.exports = router;
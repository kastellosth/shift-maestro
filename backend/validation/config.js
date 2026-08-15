const { z } = require("zod");

const jobSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  difficulty: z.number().int().min(1),
  requiredPeople: z.number().int().min(1),
});

const shiftSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  difficulty: z.number().int().min(1),
});

const configSchema = z
  .object({
    jobs: z.array(jobSchema).min(1),
    shifts: z.array(shiftSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const jobKeys = data.jobs.map((job) => job.key);

    if (new Set(jobKeys).size !== jobKeys.length) {
      ctx.addIssue({
        code: "custom",
        path: ["jobs"],
        message: "Job keys must be unique",
      });
    }

    const shiftNames = data.shifts.map((shift) => shift.name);

    if (new Set(shiftNames).size !== shiftNames.length) {
      ctx.addIssue({
        code: "custom",
        path: ["shifts"],
        message: "Shift names must be unique",
      });
    }
  });

module.exports = {
  configSchema,
};
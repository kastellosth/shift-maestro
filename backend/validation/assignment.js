const { z } = require("zod");

const assignmentMemberInputSchema = z.object({
  employeeId: z.string().min(1),
  pinned: z.boolean().default(false),
});

const assignmentInputSchema = z.object({
  jobId: z.string().min(1),
  shiftGroupId: z.string().min(1),

  members: z
    .array(assignmentMemberInputSchema)
    .min(1),
});

const finalizeScheduleSchema = z.object({
  date: z.string().datetime(),

  assignments: z
    .array(assignmentInputSchema)
    .min(1),
});

module.exports = {
  assignmentMemberInputSchema,
  assignmentInputSchema,
  finalizeScheduleSchema,
};
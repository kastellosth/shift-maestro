const { z } = require("zod");
const express = require("express");


const employeeInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  surname: z.string().trim().min(1, "Surname is required"),

  company: z.coerce.number().int().min(1),

  esso: z.enum(["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ"]).nullable().optional(),

  essoEntryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "essoEntryDate must be in YYYY-MM-DD format")
    .refine((v) => !isNaN(new Date(v).getTime()), "essoEntryDate is not a valid date")
    .nullable()
    .optional(),

  iClass: z.enum(["I1", "I2", "I3", "I4", "I5"]).nullable().optional(),

  armed: z.boolean().default(false),

  notes: z.string().trim().nullable().optional(),
});

const employeeUpdateSchema = employeeInputSchema.partial();

module.exports = {
  employeeInputSchema,
  employeeUpdateSchema,
};
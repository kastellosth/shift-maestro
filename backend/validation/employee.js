const { z } = require("zod");
const express = require("express");


const employeeInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  surname: z.string().trim().min(1, "Surname is required"),

  company: z.coerce.number().int().min(1),

  esso: z.enum(["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ"]).nullable().optional(),

  essoEntryDate: z.string().nullable().optional(),

  iClass: z.enum(["I1", "I2", "I3", "I4", "I5"]).nullable().optional(),

  armed: z.boolean().default(false),

  notes: z.string().trim().nullable().optional(),
});

const employeeUpdateSchema = employeeInputSchema.partial();

module.exports = {
  employeeInputSchema,
  employeeUpdateSchema,
};
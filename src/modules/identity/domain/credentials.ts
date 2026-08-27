import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(10).max(128).regex(/[a-z]/, "Incluye una minúscula").regex(/[A-Z]/, "Incluye una mayúscula").regex(/\d/, "Incluye un número"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(128),
});

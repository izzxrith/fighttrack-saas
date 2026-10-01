import { z } from "zod";
import { nameField, emailField } from "./sanitize";

// Passwords are never trimmed or normalized: changing them would change what
// the user typed. bcrypt only reads the first 72 bytes, so cap at 72 bytes.
const passwordField = z
  .string({ required_error: "Password is required." })
  .min(10, "Password needs at least 10 characters.")
  .refine((v) => new TextEncoder().encode(v).length <= 72, "Password is too long.");

export const signupSchema = z.object({
  gymName: nameField("Gym name", 2, 80),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password.").max(200),
});

export const createFighterSchema = z.object({
  email: emailField,
  password: passwordField,
  weightClass: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(30, "Weight class is too long."))
    .optional(),
  stance: z
    .enum(["Orthodox", "Southpaw", "Switch"], {
      errorMap: () => ({ message: "Stance must be Orthodox, Southpaw, or Switch." }),
    })
    .optional(),
});
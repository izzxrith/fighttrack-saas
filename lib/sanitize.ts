import { z } from "zod";

// Zero-width and bidi-override characters can be used to spoof text.
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const CONTROL_KEEP_NEWLINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/** Single-line text: names, emails. */
export function cleanLine(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(CONTROL, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Multi-line text : notes. Keeps line breaks, drops the rest. */
export function cleanNote(input: string): string {
  return input
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(CONTROL_KEEP_NEWLINE, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const nameField = (label: string, min: number, max: number) =>
  z
    .string({ required_error: `${label} is required.` })
    .transform(cleanLine)
    .pipe(
      z
        .string()
        .min(min, `${label} needs at least ${min} characters.`)
        .max(max, `${label} can't be longer than ${max} characters.`)
        .regex(/^[^<>]*$/, `${label} can't contain < or >.`)
    );

export const noteField = (max: number) =>
  z
    .string()
    .transform(cleanNote)
    .pipe(z.string().max(max, `Notes can't be longer than ${max} characters.`));

export const emailField = z
  .string({ required_error: "Email is required." })
  .transform((v) => cleanLine(v).toLowerCase())
  .pipe(
    z
      .string()
      .max(254, "That email is too long.")
      .email("Enter a valid email address, like coach@yourgym.com.")
  );
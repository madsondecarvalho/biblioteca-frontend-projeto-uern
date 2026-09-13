import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const bookSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  authorId: z.coerce.number().int().min(1, "Autor é obrigatório"),
  year: z.coerce
    .number()
    .int("Ano inválido")
    .min(0, "Ano inválido")
    .max(new Date().getFullYear() + 1, "Ano inválido"),
  categoryId: z
    .union([z.coerce.number().int().min(1), z.nan(), z.null(), z.undefined()])
    .transform((v) => (typeof v === "number" && Number.isNaN(v) ? undefined : v))
    .optional()
    .nullable(),
});
export type BookForm = z.infer<typeof bookSchema>;

export const authorSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});
export type AuthorForm = z.infer<typeof authorSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});
export type CategoryForm = z.infer<typeof categorySchema>;

export const copySchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  bookId: z.coerce.number().int().min(1, "Livro é obrigatório"),
  status: z
    .enum(["AVAILABLE", "BORROWED", "MAINTENANCE", "LOST", "RESERVED"])
    .default("AVAILABLE"),
});
export type CopyForm = z.infer<typeof copySchema>;

export const userCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["user", "admin"]).default("user"),
});
export type UserCreateForm = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .optional()
    .or(z.literal("")),
  role: z.enum(["user", "admin"]).optional(),
});
export type UserUpdateForm = z.infer<typeof userUpdateSchema>;

export const reservationSchema = z.object({
  copyId: z.coerce.number().int().min(1, "Cópia é obrigatória"),
});
export type ReservationForm = z.infer<typeof reservationSchema>;

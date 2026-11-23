import { z } from 'zod';

export function parse<T extends z.ZodType>(schema: T, fd: FormData): z.infer<T> {
  const r = schema.safeParse(Object.fromEntries(fd));
  if (!r.success) throw new Error(r.error.issues[0].message);
  return r.data;
}

export const opt = z.string().trim().optional().transform((v) => v || null);
export const bool = z.string().optional().transform((v) => v === 'on');
export const int = z.coerce.number().int().min(0).default(0);

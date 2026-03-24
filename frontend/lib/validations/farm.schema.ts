import { z } from 'zod';

// ================================================================
// Farm Creation Schema
// ================================================================

export const createFarmSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم المزرعة مطلوب')
    .min(2, 'يجب أن يتكون اسم المزرعة من حرفين على الأقل'),
  address: z.string().optional(),
  type: z.string().optional(),
});

export type CreateFarmFormData = z.infer<typeof createFarmSchema>;

// ================================================================
// Group Creation Schema
// ================================================================

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'اسم المجموعة مطلوب')
    .min(2, 'يجب أن يتكون اسم المجموعة من حرفين على الأقل'),
  type: z.string().min(1, 'نوع الحيوان مطلوب'),
  breed: z.string().min(1, 'السلالة مطلوبة'),
  arrival_date: z.string().min(1, 'تاريخ الوصول مطلوب'),
  initial_quantity: z.coerce
    .number()
    .int('يجب أن يكون عدد صحيح')
    .positive('يجب أن يكون أكبر من صفر'),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

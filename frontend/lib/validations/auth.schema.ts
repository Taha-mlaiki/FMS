import { z } from 'zod';

// ================================================================
// Login Schema
// ================================================================
// The user can log in with EITHER email OR phone number.
// We use a discriminated union via the "method" field.
// ================================================================

export const loginWithEmailSchema = z.object({
  method: z.literal('email'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, 'Password is required'),
});

export const loginWithPhoneSchema = z.object({
  method: z.literal('phone'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?\d{8,15}$/, 'Please enter a valid phone number'),
  password: z.string().min(1, 'Password is required'),
});

export const loginSchema = z.discriminatedUnion('method', [
  loginWithEmailSchema,
  loginWithPhoneSchema,
]);

export type LoginFormData = z.infer<typeof loginSchema>;

// ================================================================
// Register Schema
// ================================================================
// fullName is required. At least one of email or phone must be provided.
// Role is required (worker or owner). Password + confirm must match.
// ================================================================

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Full name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email({ message: 'Please enter a valid email address' }),
    phone: z
      .string()
      .regex(/^\+?\d{8,15}$/, 'Please enter a valid phone number')
      .or(z.literal('')),
    role: z.enum(['worker', 'owner'], {
      message: 'Please select a role',
    }),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// ================================================================
// Register Step Schemas (for per-step validation in the wizard)
// ================================================================

/** Step 1 – Personal Info */
export const registerStep1Schema = z.object({
  fullName: z
    .string()
    .min(1, 'الاسم الكامل مطلوب')
    .min(2, 'يجب أن يتكون الاسم من حرفين على الأقل'),
  role: z.enum(['worker', 'owner'], {
    message: 'يرجى اختيار نوع الحساب',
  }),
});

/** Step 2 – Contact Info (at least one of email/phone) */
export const registerStep2Schema = z.object({
  email: z
    .string()
    .min(1, 'البريد الإلكتروني مطلوب')
    .email({ message: 'يرجى إدخال بريد إلكتروني صالح' }),
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, 'يرجى إدخال رقم جوال صالح')
    .or(z.literal('')),
});

/** Step 3 – Password */
export const registerStep3Schema = z
  .object({
    password: z
      .string()
      .min(1, 'كلمة المرور مطلوبة')
      .min(6, 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

/** The fields each step owns (used by trigger()) */
export const REGISTER_STEP_FIELDS: Record<number, (keyof RegisterFormData)[]> =
  {
    0: ['fullName', 'role'],
    1: ['email', 'phone'],
    2: ['password', 'confirmPassword'],
  };

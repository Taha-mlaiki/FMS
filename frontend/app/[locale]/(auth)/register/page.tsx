'use client';

import { useState, useMemo, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import {
  registerSchema,
  type RegisterFormData,
} from '@/lib/validations/auth.schema';
import { useRegister } from '@/lib/hooks/use-auth';
import { useCheckEmailAvailability } from '@/lib/hooks/api/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function getPasswordStrength(
  password: string,
  labels: { weak: string; fair: string; good: string; strong: string },
): {
  level: number;
  label: string;
  color: string;
} {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: labels.weak, color: '#E76F51' };
  if (score === 2) return { level: 2, label: labels.fair, color: '#F4A261' };
  if (score === 3) return { level: 3, label: labels.good, color: '#FDDCB5' };
  return { level: 4, label: labels.strong, color: '#2D6A4F' };
}

function RegisterPageContent() {
  const t = useTranslations('auth.register');
  const tv = useTranslations('auth.validation');
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get('inviteToken');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister({ invitationToken });
  const checkEmailAvailability = useCheckEmailAvailability();

  const strengthLabels = useMemo(
    () => ({
      weak: t('passwordStrength.weak'),
      fair: t('passwordStrength.fair'),
      good: t('passwordStrength.good'),
      strong: t('passwordStrength.strong'),
    }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: undefined,
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');
  const strength = useMemo(
    () => getPasswordStrength(watchedPassword || '', strengthLabels),
    [watchedPassword, strengthLabels],
  );
  const isLoading = registerMutation.isPending;

  async function handleEmailBlur() {
    const email = getValues('email')?.trim();
    if (!email) return;

    const validEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!validEmail) return;

    try {
      const result = await checkEmailAvailability.mutateAsync(email);
      if (!result.available) {
        setError('email', {
          type: 'manual',
          message: t('emailAlreadyRegistered'),
        });
        return;
      }

      if (errors.email?.type === 'manual') {
        clearErrors('email');
      }
    } catch {
      // Do not block form submit if availability check request fails.
    }
  }

  function onSubmit(data: RegisterFormData) {
    registerMutation.mutate(data);
  }

  const inputBaseClass = 'h-12 pr-10 pl-4 rounded-[10px] text-[15px] border';
  const inputStyle = { backgroundColor: '#F0EDE4', color: '#2C2A24' };

  function getInputBorderClass(hasError: boolean) {
    return hasError
      ? 'border-[#E76F51] focus-visible:ring-[#E76F51]'
      : 'border-[#E4E0D8] focus-visible:ring-[#2D6A4F]';
  }

  return (
    <div className="page-enter">
      {/* Heading */}
      <h2
        className="font-display text-[32px] leading-[1.2]"
        style={{ color: '#2C2A24' }}
      >
        {t('title')}
      </h2>
      <p className="text-[15px] mt-2" style={{ color: '#5C5852' }}>
        {t('subtitle')}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            className="text-[13px] font-medium"
            style={{ color: '#5C5852' }}
          >
            {t('fullNameLabel')}
          </label>
          <div className="relative">
            <User
              className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: '#9C9890' }}
            />
            <Input
              placeholder={t('fullNamePlaceholder')}
              className={`${inputBaseClass} ${getInputBorderClass(!!errors.fullName)} text-right`}
              style={inputStyle}
              disabled={isLoading}
              {...register('fullName')}
            />
          </div>
          {errors.fullName && (
            <p
              className="flex items-center gap-1 text-[13px]"
              style={{ color: '#E76F51' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            className="text-[13px] font-medium"
            style={{ color: '#5C5852' }}
          >
            {t('emailLabel')}
          </label>
          <div className="relative">
            <Mail
              className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: '#9C9890' }}
            />
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              className={`${inputBaseClass} ${getInputBorderClass(!!errors.email)} text-left`}
              style={inputStyle}
              dir="ltr"
              disabled={isLoading}
              {...register('email', {
                onBlur: () => {
                  void handleEmailBlur();
                },
              })}
            />
          </div>
          {checkEmailAvailability.isPending && !errors.email && (
            <p className="text-[12px]" style={{ color: '#9C9890' }}>
              {t('checkingEmail')}
            </p>
          )}
          {errors.email && (
            <p
              className="flex items-center gap-1 text-[13px]"
              style={{ color: '#E76F51' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label
            className="text-[13px] font-medium"
            style={{ color: '#5C5852' }}
          >
            {t('roleLabel')}
          </label>
          <Select
            onValueChange={(value) =>
              setValue('role', value as 'worker' | 'owner', {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              className="w-full h-12 rounded-[10px] text-[15px] border border-[#E4E0D8] focus:ring-[#2D6A4F]"
              style={inputStyle}
              disabled={isLoading}
            >
              <SelectValue placeholder={t('rolePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">{t('roleOwner')}</SelectItem>
              <SelectItem value="worker">{t('roleWorker')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p
              className="flex items-center gap-1 text-[13px]"
              style={{ color: '#E76F51' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            className="text-[13px] font-medium"
            style={{ color: '#5C5852' }}
          >
            {t('passwordLabel')}
          </label>
          <div className="relative">
            <Lock
              className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: '#9C9890' }}
            />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`${inputBaseClass} pl-10 ${getInputBorderClass(!!errors.password)} text-left`}
              style={inputStyle}
              dir="ltr"
              disabled={isLoading}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: '#9C9890' }}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
          {/* Password Strength Bar */}
          {watchedPassword && (
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4].map((seg) => (
                <div
                  key={seg}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      seg <= strength.level ? strength.color : '#E4E0D8',
                  }}
                />
              ))}
              <span
                className="text-[11px] mr-2 font-medium"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
          {errors.password && (
            <p
              className="flex items-center gap-1 text-[13px]"
              style={{ color: '#E76F51' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            className="text-[13px] font-medium"
            style={{ color: '#5C5852' }}
          >
            {t('confirmPasswordLabel')}
          </label>
          <div className="relative">
            <Lock
              className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
              style={{ color: '#9C9890' }}
            />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('confirmPasswordPlaceholder')}
              className={`${inputBaseClass} pl-10 ${getInputBorderClass(!!errors.confirmPassword)} text-left`}
              style={inputStyle}
              dir="ltr"
              disabled={isLoading}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: '#9C9890' }}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              className="flex items-center gap-1 text-[13px]"
              style={{ color: '#E76F51' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <Button
          type="submit"
          className="w-full h-12 rounded-[10px] text-[15px] font-semibold transition-all duration-200 cursor-pointer mt-4 hover:bg-[#1B4332]"
          style={{
            backgroundColor: '#2D6A4F',
            color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(45,106,79,0.15)',
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('submitButton')
          )}
        </Button>
      </form>

      {/* Login link */}
      <div className="mt-6 text-center">
        <p className="text-[14px]" style={{ color: '#5C5852' }}>
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium hover:underline underline-offset-4 transition-colors"
            style={{ color: '#2D6A4F' }}
          >
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: '#2D6A4F' }}
          />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}

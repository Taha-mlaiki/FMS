'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Phone,
} from 'lucide-react';

import {
  loginWithEmailSchema,
  loginWithPhoneSchema,
  type LoginFormData,
} from '@/lib/validations/auth.schema';
import { useLogin } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';

type LoginMethod = 'email' | 'phone';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const [method, setMethod] = useState<LoginMethod>('email');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const emailForm = useForm<Extract<LoginFormData, { method: 'email' }>>({
    resolver: zodResolver(loginWithEmailSchema),
    defaultValues: { method: 'email', email: '', password: '' },
  });

  const phoneForm = useForm<Extract<LoginFormData, { method: 'phone' }>>({
    resolver: zodResolver(loginWithPhoneSchema),
    defaultValues: { method: 'phone', phone: '', password: '' },
  });

  const isLoading = loginMutation.isPending;

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  return (
    <div className="page-enter">
      {/* Heading */}
      <h2
        className="font-display text-[34px] leading-[1.2]"
        style={{ color: '#2C2A24' }}
      >
        {t('title')}
      </h2>
      <p className="text-[15px] mt-2" style={{ color: '#5C5852' }}>
        {t('subtitle')}
      </p>

      {/* Tab switcher */}
      <div
        className="mt-8 flex rounded-[10px] p-1 h-10"
        style={{ backgroundColor: '#F0EDE4' }}
      >
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex-1 rounded-[8px] text-[14px] font-medium transition-all duration-200 cursor-pointer ${
            method === 'email'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'text-[#5C5852] hover:text-[#2C2A24]'
          }`}
        >
          {t('emailTab')}
        </button>
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex-1 rounded-[8px] text-[14px] font-medium transition-all duration-200 cursor-pointer ${
            method === 'phone'
              ? 'bg-[#2D6A4F] text-white shadow-sm'
              : 'text-[#5C5852] hover:text-[#2C2A24]'
          }`}
        >
          {t('phoneTab')}
        </button>
      </div>

      {/* Email Form */}
      {method === 'email' && (
        <form
          onSubmit={emailForm.handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
        >
          {/* Email Field */}
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
                className={`h-12 pr-10 pl-4 rounded-[10px] text-[15px] text-left border ${
                  emailForm.formState.errors.email
                    ? 'border-[#E76F51] focus-visible:ring-[#E76F51]'
                    : 'border-[#E4E0D8] focus-visible:ring-[#2D6A4F]'
                }`}
                style={{ backgroundColor: '#F0EDE4', color: '#2C2A24' }}
                dir="ltr"
                disabled={isLoading}
                {...emailForm.register('email')}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p
                className="flex items-center gap-1 text-[13px]"
                style={{ color: '#E76F51' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
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
                placeholder="••••••••••"
                className={`h-12 pr-10 pl-10 rounded-[10px] text-[15px] text-left border ${
                  emailForm.formState.errors.password
                    ? 'border-[#E76F51] focus-visible:ring-[#E76F51]'
                    : 'border-[#E4E0D8] focus-visible:ring-[#2D6A4F]'
                }`}
                style={{ backgroundColor: '#F0EDE4', color: '#2C2A24' }}
                dir="ltr"
                disabled={isLoading}
                {...emailForm.register('password')}
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
            {emailForm.formState.errors.password && (
              <p
                className="flex items-center gap-1 text-[13px]"
                style={{ color: '#E76F51' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {emailForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Sign In Button */}
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
      )}

      {/* Phone Form */}
      {method === 'phone' && (
        <form
          onSubmit={phoneForm.handleSubmit(onSubmit)}
          className="mt-8 space-y-5"
        >
          {/* Phone Field */}
          <div className="space-y-1.5">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('phoneLabel')}
            </label>
            <div className="relative">
              <Phone
                className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                style={{ color: '#9C9890' }}
              />
              <Input
                type="tel"
                placeholder="+1234567890"
                className={`h-12 pr-10 pl-4 rounded-[10px] text-[15px] text-left border ${
                  phoneForm.formState.errors.phone
                    ? 'border-[#E76F51] focus-visible:ring-[#E76F51]'
                    : 'border-[#E4E0D8] focus-visible:ring-[#2D6A4F]'
                }`}
                style={{ backgroundColor: '#F0EDE4', color: '#2C2A24' }}
                dir="ltr"
                disabled={isLoading}
                {...phoneForm.register('phone')}
              />
            </div>
            {phoneForm.formState.errors.phone && (
              <p
                className="flex items-center gap-1 text-[13px]"
                style={{ color: '#E76F51' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Password Field */}
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
                placeholder="••••••••••"
                className={`h-12 pr-10 pl-10 rounded-[10px] text-[15px] text-left border ${
                  phoneForm.formState.errors.password
                    ? 'border-[#E76F51] focus-visible:ring-[#E76F51]'
                    : 'border-[#E4E0D8] focus-visible:ring-[#2D6A4F]'
                }`}
                style={{ backgroundColor: '#F0EDE4', color: '#2C2A24' }}
                dir="ltr"
                disabled={isLoading}
                {...phoneForm.register('password')}
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
            {phoneForm.formState.errors.password && (
              <p
                className="flex items-center gap-1 text-[13px]"
                style={{ color: '#E76F51' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {phoneForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Sign In Button */}
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
      )}

      {/* Register link */}
      <div className="mt-6 text-center">
        <p className="text-[14px]" style={{ color: '#5C5852' }}>
          {t('noAccount')}{' '}
          <Link
            href="/register"
            className="font-medium hover:underline underline-offset-4 transition-colors"
            style={{ color: '#2D6A4F' }}
          >
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}

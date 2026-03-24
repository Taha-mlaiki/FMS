'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  useAuthProfile,
  useChangePassword,
  useUpdateProfile,
} from '@/lib/hooks/api/use-auth';
import { useAuthStore } from '@/lib/stores/auth.store';

/* ── Password Strength ── */
function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthColors = ['#E76F51', '#F4A261', '#FDDCB5', '#2D6A4F'];

function getApiErrorMessage(
  error: unknown,
  fallback: string,
  statusMessages?: { 401?: string; 403?: string },
): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const maybeError = error as {
    response?: { data?: { message?: string | string[] }; status?: number };
  };

  const message = maybeError.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message[0] ?? fallback;
  }
  if (typeof message === 'string' && message.trim()) return message;

  switch (maybeError.response?.status) {
    case 401:
      return statusMessages?.[401] ?? fallback;
    case 403:
      return statusMessages?.[403] ?? fallback;
    default:
      return fallback;
  }
}

/* ── Page ── */
export default function ProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');

  const profileQuery = useAuthProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const setUser = useAuthStore((state) => state.setUser);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const profile = profileQuery.data;

  const displayName = useMemo(() => {
    if (!profile) return tc('user');
    const joinedName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    return (
      profile.full_name?.trim() || joinedName || profile.email || tc('user')
    );
  }, [profile, tc]);

  const initials = displayName.trim().charAt(0) || 'م';
  const roleLabel = profile?.role === 'OWNER' ? tc('owner') : tc('worker');

  const statusMessages = useMemo(
    () => ({
      401: te('sessionExpired'),
      403: te('noPermission'),
    }),
    [te],
  );

  useEffect(() => {
    if (!profile) return;

    const nextFullName =
      profile.full_name?.trim() ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();

    setFullName(nextFullName || '');
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');
  }, [profile]);

  const strength = getPasswordStrength(newPassword);

  const handleSaveProfile = async () => {
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      toast.error(t('validation.nameRequired'));
      return;
    }

    try {
      const updated = await updateProfileMutation.mutateAsync({
        full_name: trimmedFullName,
      });

      setUser({
        id: updated.id,
        email: updated.email,
        first_name: updated.first_name,
        last_name: updated.last_name,
        full_name: updated.full_name,
        phone: updated.phone,
        avatar_url: updated.avatar_url,
        role: updated.role,
      });

      toast.success(t('toast.saveSuccess'));
    } catch (error) {
      toast.error(t('toast.saveError'), {
        description: getApiErrorMessage(
          error,
          te('tryAgain'),
          statusMessages,
        ),
      });
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error(t('validation.currentPasswordRequired'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('validation.newPasswordMin'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success(t('toast.passwordSuccess'));
    } catch (error) {
      toast.error(t('toast.passwordError'), {
        description: getApiErrorMessage(
          error,
          te('tryAgain'),
          statusMessages,
        ),
      });
    }
  };

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center">
        <div
          className="flex items-center gap-2 text-[14px]"
          style={{ color: '#5C5852' }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('loading')}
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div
        className="rounded-[16px] p-6"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <h2 className="font-display text-[24px]" style={{ color: '#2C2A24' }}>
          {t('loadError')}
        </h2>
        <p className="text-[14px] mt-2" style={{ color: '#5C5852' }}>
          {getApiErrorMessage(
            profileQuery.error,
            te('tryAgain'),
            statusMessages,
          )}
        </p>
        <button
          onClick={() => profileQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium text-white"
          style={{ backgroundColor: '#2D6A4F' }}
        >
          <RefreshCw className="w-4 h-4" />
          {tc('retry')}
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center page-enter"
      style={{ paddingTop: '24px', paddingBottom: '48px' }}
    >
      <div className="w-full max-w-[640px]">
        <div
          className="rounded-[24px] overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow:
              '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col items-center justify-center py-8"
            style={{ backgroundColor: '#0D2818', minHeight: '120px' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-display text-[24px] text-white mb-3"
              style={{ backgroundColor: '#2D6A4F' }}
            >
              {initials}
            </div>
            <h1 className="font-display text-[22px] text-white">
              {displayName}
            </h1>
            <div className="flex gap-2 mt-2">
              <span
                className="text-[11px] font-semibold px-3 py-0.5 rounded-full"
                style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
              >
                {roleLabel} — {t('personalAccount')}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-8">
            {/* Personal Information */}
            <div className="space-y-5">
              <h2
                className="font-display text-[20px]"
                style={{ color: '#2C2A24' }}
              >
                {t('personalInfo')}
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('fullName')}
                  </label>
                  <input
                    className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none transition-colors"
                    style={{
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #E4E0D8',
                      color: '#2C2A24',
                    }}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('email')}
                  </label>
                  <div className="relative">
                    <input
                      className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none transition-colors"
                      style={{
                        backgroundColor: '#F0EDE4',
                        border: '1px solid #E4E0D8',
                        color: '#2C2A24',
                      }}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled
                    />
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
                    >
                      {t('verified')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('phone')}
                  </label>
                  <input
                    className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none transition-colors"
                    style={{
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #E4E0D8',
                      color: '#2C2A24',
                    }}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="05XXXXXXXX"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => void handleSaveProfile()}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200"
                    style={{ backgroundColor: '#2D6A4F' }}
                  >
                    <Save className="w-4 h-4" />
                    {updateProfileMutation.isPending
                      ? tc('saving')
                      : tc('saveChanges')}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #E4E0D8' }} />

            {/* Change Password */}
            <div className="space-y-5">
              <h2
                className="font-display text-[20px]"
                style={{ color: '#2C2A24' }}
              >
                {t('changePassword')}
              </h2>

              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('currentPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                      style={{ color: '#9C9890' }}
                    />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      className="w-full h-[48px] pr-10 pl-10 rounded-[10px] text-[15px] outline-none transition-colors"
                      style={{
                        backgroundColor: '#F0EDE4',
                        border: '1px solid #E4E0D8',
                        color: '#2C2A24',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showCurrentPassword ? (
                        <EyeOff
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      ) : (
                        <Eye
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('newPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                      style={{ color: '#9C9890' }}
                    />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-[48px] pr-10 pl-10 rounded-[10px] text-[15px] outline-none transition-colors"
                      style={{
                        backgroundColor: '#F0EDE4',
                        border: '1px solid #E4E0D8',
                        color: '#2C2A24',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      ) : (
                        <Eye
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      )}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPassword.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-[4px] flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor:
                              i < strength
                                ? strengthColors[strength - 1]
                                : '#E4E0D8',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <label
                    className="text-[13px] font-medium"
                    style={{ color: '#5C5852' }}
                  >
                    {t('confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                      style={{ color: '#9C9890' }}
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      className="w-full h-[48px] pr-10 pl-10 rounded-[10px] text-[15px] outline-none transition-colors"
                      style={{
                        backgroundColor: '#F0EDE4',
                        border: '1px solid #E4E0D8',
                        color: '#2C2A24',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      ) : (
                        <Eye
                          className="w-[18px] h-[18px]"
                          style={{ color: '#9C9890' }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => void handleChangePassword()}
                    disabled={changePasswordMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200"
                    style={{ backgroundColor: '#2D6A4F' }}
                  >
                    <Lock className="w-4 h-4" />
                    {changePasswordMutation.isPending
                      ? tc('updating')
                      : t('updatePassword')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

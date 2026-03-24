'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Mail, Info, Loader2 } from 'lucide-react';
import { useMockActionFeedback } from '@/lib/hooks/use-mock-action-feedback';

/* ── D7 — Invite Member Modal ── */

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (email: string) => void;
  isPending?: boolean;
}

export function InviteMemberModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: InviteMemberModalProps) {
  const t = useTranslations('workers');
  const [email, setEmail] = useState('');
  const { runMockAction, pendingActions } = useMockActionFeedback();
  const isSending = !!isPending || !!pendingActions['invite-member'];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-[440px] rounded-[24px] overflow-hidden page-enter"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: '#0D2818' }}
        >
          <h2 className="font-display text-[22px] text-white">{t('inviteMember')}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              className="text-[13px] font-medium"
              style={{ color: '#5C5852' }}
            >
              {t('email')}
            </label>
            <div className="relative">
              <Mail
                className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                style={{ color: '#9C9890' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full h-[48px] pr-10 pl-4 rounded-[10px] text-[15px] outline-none"
                style={{
                  backgroundColor: '#F0EDE4',
                  border: '1px solid #E4E0D8',
                  color: '#2C2A24',
                }}
                dir="ltr"
              />
            </div>
          </div>

          {/* Role — display only */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label
                className="text-[13px] font-medium"
                style={{ color: '#5C5852' }}
              >
                {t('role')}
              </label>
              <div className="relative group">
                <Info
                  className="w-3.5 h-3.5 cursor-help"
                  style={{ color: '#9C9890' }}
                />
                <div
                  className="absolute bottom-full right-0 mb-1 w-[200px] p-2 rounded-[8px] text-[12px] hidden group-hover:block z-10"
                  style={{
                    backgroundColor: '#2C2A24',
                    color: '#FAFAF7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {t('cannotInviteOwners')}
                </div>
              </div>
            </div>
            <div
              className="h-[48px] px-4 rounded-[10px] flex items-center text-[15px]"
              style={{
                backgroundColor: '#F0EDE4',
                border: '1px solid #E4E0D8',
                color: '#9C9890',
              }}
            >
              <span
                className="text-[12px] font-semibold px-3 py-0.5 rounded-full"
                style={{ backgroundColor: '#E4E0D8', color: '#5C5852' }}
              >
                {t('workerRole')}
              </span>
            </div>
          </div>

          {/* Expiry note */}
          <p className="text-[12px]" style={{ color: '#9C9890' }}>
            {t('inviteExpiry')}
          </p>

          {/* Submit */}
          <button
            onClick={async () => {
              if (!email) return;

              const ok = await runMockAction({
                actionKey: 'invite-member',
                successTitle: t('inviteSentSuccess'),
                successDescription: t('inviteSentDescription', { email }),
                errorTitle: t('inviteSentError'),
                errorDescription: t('inviteSentErrorDescription'),
              });

              if (ok) {
                onSubmit?.(email);
                onClose();
              }
            }}
            disabled={!email || isSending}
            className="w-full h-[48px] rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('sendInvite')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { listFarms } from '@/lib/api/farm';
import {
  useAcceptInvitation,
  useInvitation,
} from '@/lib/hooks/api/use-invitations';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';

type InvitationDetails = {
  farmName?: string;
  inviterName?: string;
  role?: string;
  expiresAt?: string;
  status?: string;
  farm_id?: string;
  farmId?: string;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-10">
      <div className="mb-4 flex justify-center">
        <div
          className="h-12 w-12 rounded-full skeleton-pulse"
          style={{ backgroundColor: '#E4E0D8' }}
        />
      </div>
      {[80, 60, 40].map((width) => (
        <div
          key={width}
          className="mx-auto h-3 rounded-full skeleton-pulse"
          style={{ width: `${width}%`, backgroundColor: '#F0EDE4' }}
        />
      ))}
    </div>
  );
}

const PAGE_LOAD_TIME = Date.now();

export default function InviteTokenPage() {
  const t = useTranslations('invite');
  const params = useParams();
  const router = useRouter();

  const token = String(params?.token ?? '');
  const accessToken = useAuthStore((state) => state.accessToken);
  const invitationQuery = useInvitation(token || null);
  const acceptInvitation = useAcceptInvitation();

  const invitation = (invitationQuery.data ?? {}) as InvitationDetails;

  function formatRemainingTime(expiresAt?: string): string {
    if (!expiresAt) return t('timeUndefined');

    const target = new Date(expiresAt).getTime();
    const diffMs = target - PAGE_LOAD_TIME;
    if (diffMs <= 0) return t('expired');

    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hours < 24) return `${hours} ${t('hours')}`;
    return `${Math.ceil(hours / 24)} ${t('days')}`;
  }

  const isExpired =
    invitation.status === 'EXPIRED' ||
    formatRemainingTime(invitation.expiresAt) === t('expired');

  const roleLabel = useMemo(() => {
    if (invitation.role === 'OWNER') return 'OWNER';
    if (invitation.role === 'WORKER') return 'WORKER';
    return invitation.role || 'MEMBER';
  }, [invitation.role]);

  const canAccept = Boolean(
    !invitationQuery.isLoading && !invitationQuery.isError && !isExpired,
  );
  const acceptButtonLabel = accessToken
    ? t('acceptInvitation')
    : t('createAccountAndAccept');

  async function handleAccept() {
    if (!accessToken) {
      router.push(`/register?inviteToken=${encodeURIComponent(token)}`);
      return;
    }

    try {
      const payload = await acceptInvitation.mutateAsync(token);
      const farms = await listFarms().catch(() => []);

      useAuthStore.getState().setFarms(
        farms.map((farm) => ({
          id: farm.id,
          name: farm.name,
          location: farm.location ?? farm.address,
          address: farm.address ?? farm.location,
          schema_name: farm.schemaName,
          status: farm.status,
          created_at: farm.createdAt,
          role: farm.role,
        })),
      );

      const targetFarmId =
        payload?.farmId ||
        payload?.farm_id ||
        invitation.farmId ||
        invitation.farm_id ||
        farms[0]?.id ||
        null;
      if (targetFarmId) {
        const selectedFarm = farms.find((farm) => farm.id === targetFarmId);
        usePreferencesStore.getState().setLastActiveFarmId(targetFarmId);
        useAuthStore
          .getState()
          .setActiveFarm(targetFarmId, selectedFarm?.role ?? 'WORKER');
      }

      toast.success(t('welcomeToFarm', { farmName: invitation.farmName ?? t('defaultFarmName') }));
      router.push('/worker/dashboard');
    } catch {
      toast.error(t('acceptError'), {
        description: t('acceptErrorDescription'),
      });
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      dir="rtl"
      style={{ backgroundColor: '#F0EDE4' }}
    >
      <div className="w-full max-w-[480px]">
        <div
          className="overflow-hidden rounded-[24px] bg-white"
          style={{
            boxShadow:
              '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
          }}
        >
          {invitationQuery.isLoading ? <LoadingSkeleton /> : null}

          {canAccept ? (
            <>
              <div
                className="flex h-20 items-center justify-center"
                style={{ backgroundColor: '#0D2818' }}
              >
                <span className="text-[32px]">🌿</span>
              </div>

              <div className="space-y-5 p-10">
                <div className="space-y-2 text-center">
                  <p className="text-[14px]" style={{ color: '#9C9890' }}>
                    {t('invitedToJoin')}
                  </p>
                  <h1
                    className="font-display text-[28px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {invitation.farmName || t('defaultFarmName')}
                  </h1>
                  <span className="inline-flex rounded-full bg-[#D8F3DC] px-3 py-1 text-[12px] font-semibold uppercase text-[#1B4332]">
                    {roleLabel}
                  </span>
                  <p className="text-[13px]" style={{ color: '#9C9890' }}>
                    {t('invitedBy', { name: invitation.inviterName || t('defaultUser') })}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #E4E0D8' }} />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: '#5C5852' }}
                    >
                      {t('accountStatus')}
                    </p>
                    <div className="relative">
                      <Mail
                        className="absolute top-1/2 right-3 h-[18px] w-[18px] -translate-y-1/2"
                        style={{ color: '#9C9890' }}
                      />
                      <input
                        type="text"
                        readOnly
                        value={
                          accessToken
                            ? t('loggedIn')
                            : t('loginRequired')
                        }
                        className="h-[48px] w-full rounded-[10px] border px-4 pr-10 text-[15px] outline-none"
                        style={{
                          backgroundColor: '#F0EDE4',
                          borderColor: '#E4E0D8',
                          color: '#2C2A24',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleAccept()}
                    disabled={acceptInvitation.isPending}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: '#2D6A4F' }}
                  >
                    {acceptInvitation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      acceptButtonLabel
                    )}
                  </button>
                </div>

                <p
                  className="text-center text-[12px]"
                  style={{ color: '#9C9890' }}
                >
                  {t('expiresIn', { time: formatRemainingTime(invitation.expiresAt) })}
                </p>
              </div>
            </>
          ) : null}

          {(invitationQuery.isError || isExpired) &&
          !invitationQuery.isLoading ? (
            <div className="space-y-4 p-10 text-center">
              <span className="text-[48px]">⚠</span>
              <h2
                className="font-display text-[22px]"
                style={{ color: '#2C2A24' }}
              >
                {t('expiredTitle')}
              </h2>
              <p className="text-[15px]" style={{ color: '#5C5852' }}>
                {t('expiredDescription')}
              </p>
              <Link
                href="/login"
                className="inline-flex rounded-[10px] border px-5 py-2.5 text-[14px] font-medium"
                style={{ color: '#2D6A4F', borderColor: '#2D6A4F' }}
              >
                {t('backToLogin')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import {
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  Building2,
  User,
} from 'lucide-react';

import {
  listInvitations,
  acceptInvitation,
  rejectInvitation,
} from '@/lib/api/auth';
import { listFarms } from '@/lib/api/farm';
import { setUserRoleCookie } from '@/lib/auth-role-cookie';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';

export default function InvitationsPage() {
  const t = useTranslations('invitations');
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: listInvitations,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: async (response) => {
      const farms = await listFarms().catch(() => []);
      const res = response as { farmId?: string; farm_id?: string; role?: string } | undefined;
      const acceptedFarmId = res?.farmId ?? res?.farm_id ?? null;
      const selectedFarm = farms.find((farm) => farm.id === acceptedFarmId);

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

      if (acceptedFarmId) {
        const resolvedRole = selectedFarm?.role ?? res?.role ?? 'WORKER';
        useAuthStore.getState().setActiveFarm(acceptedFarmId, resolvedRole);
        usePreferencesStore.getState().setLastActiveFarmId(acceptedFarmId);
        setUserRoleCookie(resolvedRole);
      }

      toast.success(t('acceptSuccess'));
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      // Also invalidate farms list since user joined a new farm
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['owned-farms'] });
      router.push('/worker/dashboard');
    },
    onError: (error) => {
      toast.error(t('acceptError'));
      console.error(error);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectInvitation,
    onSuccess: () => {
      toast.success(t('rejectSuccess'));
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error) => {
      toast.error(t('rejectError'));
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-lg">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-900">
          {t('loadErrorTitle')}
        </h3>
        <p className="text-red-600 mt-2">{t('loadErrorDesc')}</p>
      </div>
    );
  }

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === 'PENDING') ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Badge variant="secondary" className="px-4 py-1">
          {pendingInvitations.length} {t('pending')}
        </Badge>
      </div>

      {pendingInvitations.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t('noInvitationsTitle')}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              {t('noInvitationsDesc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">
                      {invitation.farmName}
                    </h3>
                    <Badge>{invitation.role}</Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>
                        {t('invitedBy')}{' '}
                        <span className="font-medium text-foreground">
                          {invitation.inviterName}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {t('sent')}{' '}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0">
                  <Button
                    variant="outline"
                    onClick={() => rejectMutation.mutate(invitation.token)}
                    disabled={
                      acceptMutation.isPending || rejectMutation.isPending
                    }
                    className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {t('reject')}
                  </Button>
                  <Button
                    onClick={() => acceptMutation.mutate(invitation.token)}
                    disabled={
                      acceptMutation.isPending || rejectMutation.isPending
                    }
                    className="flex-1 sm:flex-none gap-2"
                  >
                    {acceptMutation.isPending ? (
                      t('accepting')
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {t('accept')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

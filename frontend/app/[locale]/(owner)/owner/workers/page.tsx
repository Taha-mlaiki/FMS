'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MailPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ListMembersResponse,
  MemberStatus,
  MemberRow,
  useInviteMember,
  useMembers,
} from '@/lib/hooks/api/use-workers';
import { usePermission } from '@/lib/hooks/use-permission';

const PAGE_SIZE = 10;

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const maybeError = error as {
    response?: { data?: { message?: string | string[] } };
  };

  const message = maybeError.response?.data?.message;
  if (Array.isArray(message) && message.length > 0) {
    return message[0] ?? fallback;
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function normalizeResponse(
  payload: unknown,
  fallbackPage: number,
): Required<ListMembersResponse> {
  const source = payload as { data?: unknown };
  const baseRaw = source?.data ?? payload;
  const base =
    typeof baseRaw === 'object' && baseRaw !== null
      ? (baseRaw as ListMembersResponse)
      : ({} as ListMembersResponse);

  const members = Array.isArray(base?.members) ? base.members : [];
  const total = typeof base?.total === 'number' ? base.total : members.length;
  const page = typeof base?.page === 'number' ? base.page : fallbackPage;
  const limit = typeof base?.limit === 'number' ? base.limit : PAGE_SIZE;

  return {
    members,
    total,
    page,
    limit,
  };
}

function getDisplayName(
  member: MemberRow,
  pendingLabel: string,
  workerLabel: string,
): string {
  const fullName = [member.firstName, member.lastName]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .trim();

  if (fullName.length > 0) return fullName;
  if ((member.status ?? 'pending') === 'pending') return pendingLabel;
  return workerLabel;
}

function formatJoinDate(dateValue?: string): string {
  if (!dateValue) return '-';

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '-';

  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export default function WorkersPage() {
  const t = useTranslations('workers');
  const tc = useTranslations('common');

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const canInviteMember = usePermission('invite:member');
  const inviteMember = useInviteMember();

  const statusStyles: Record<
    'pending' | 'active' | 'inactive',
    { label: string; className: string }
  > = {
    pending: {
      label: t('statusLabels.pending'),
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    active: {
      label: t('statusLabels.active'),
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    inactive: {
      label: t('statusLabels.inactive'),
      className: 'bg-slate-200 text-slate-700 border-slate-300',
    },
  };

  const workersQuery = useMembers({
    page,
    limit: PAGE_SIZE,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const normalized = useMemo(
    () => normalizeResponse(workersQuery.data, page),
    [workersQuery.data, page],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(normalized.total / normalized.limit),
  );
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const rows = normalized.members.filter(
    (member) => String(member.role ?? '').toUpperCase() !== 'OWNER',
  );

  const handleInviteSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    if (!inviteEmail.trim()) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    try {
      await inviteMember.mutateAsync({
        email: inviteEmail.trim(),
        role: 'WORKER',
      });
      toast.success(t('toast.inviteSuccess'));
      setInviteEmail('');
      setIsInviteOpen(false);
    } catch (error) {
      toast.error(t('toast.inviteError'), {
        description: getApiErrorMessage(error, t('loadError')),
      });
    }
  };

  return (
    <section className="space-y-6">
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: '#E4E0D8', backgroundColor: '#FFFFFF' }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl" style={{ color: '#2C2A24' }}>
              {t('title')}
            </h2>
            <p className="text-sm" style={{ color: '#5C5852' }}>
              {t('totalWorkers')}: {normalized.total}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | MemberStatus) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-42.5 bg-white">
                <SelectValue placeholder={t('filterStatus')} />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">{t('allStatuses')}</SelectItem>
                <SelectItem value="pending">
                  {t('statusLabels.pending')}
                </SelectItem>
                <SelectItem value="active">
                  {t('statusLabels.active')}
                </SelectItem>
                <SelectItem value="inactive">
                  {t('statusLabels.inactive')}
                </SelectItem>
              </SelectContent>
            </Select>

            {canInviteMember && (
              <Button type="button" onClick={() => setIsInviteOpen(true)}>
                <MailPlus className="h-4 w-4" />
                {t('inviteWorker')}
              </Button>
            )}

            {workersQuery.isFetching && !workersQuery.isLoading && (
              <span className="inline-flex items-center gap-2 text-sm text-[#5C5852]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc('refreshing')}
              </span>
            )}
          </div>
        </div>

        <div
          className="overflow-x-auto rounded-xl border"
          style={{ borderColor: '#EFEAE0' }}
        >
          <table className="w-full min-w-190 text-right">
            <thead style={{ backgroundColor: '#FAFAF7' }}>
              <tr className="border-b" style={{ borderColor: '#EFEAE0' }}>
                <th className="px-4 py-3 text-sm font-semibold text-[#2C2A24]">
                  {t('tableHeaders.worker')}
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-[#2C2A24]">
                  {t('tableHeaders.email')}
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-[#2C2A24]">
                  {t('tableHeaders.phone')}
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-[#2C2A24]">
                  {t('tableHeaders.status')}
                </th>
                <th className="px-4 py-3 text-sm font-semibold text-[#2C2A24]">
                  {t('tableHeaders.joinDate')}
                </th>
              </tr>
            </thead>
            <tbody>
              {workersQuery.isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-[#5C5852]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading')}
                    </span>
                  </td>
                </tr>
              )}

              {!workersQuery.isLoading && workersQuery.isError && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-red-600"
                  >
                    {getApiErrorMessage(workersQuery.error, t('loadError'))}
                  </td>
                </tr>
              )}

              {!workersQuery.isLoading &&
                !workersQuery.isError &&
                rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-[#5C5852]"
                    >
                      {t('noWorkersMatch')}
                    </td>
                  </tr>
                )}

              {!workersQuery.isLoading &&
                !workersQuery.isError &&
                rows.map((member, index) => {
                  const status = member.status ?? 'pending';
                  const style = statusStyles[status];

                  return (
                    <tr
                      key={`${member.userId || member.email || 'row'}-${index}`}
                      className="border-b last:border-0"
                      style={{ borderColor: '#EFEAE0' }}
                    >
                      <td className="px-4 py-3 text-sm text-[#2C2A24]">
                        {getDisplayName(
                          member,
                          t('pendingInvitation'),
                          t('tableHeaders.worker'),
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5C5852]">
                        {member.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5C5852]">
                        {member.phone || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={style.className}>{style.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#5C5852]">
                        {status === 'pending'
                          ? '-'
                          : formatJoinDate(member.joinDate || member.joinedAt)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5C5852]">
            {tc('page', { current: page, total: totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!canGoPrevious || workersQuery.isLoading}
            >
              <ChevronRight className="h-4 w-4" />
              {tc('previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={!canGoNext || workersQuery.isLoading}
            >
              {tc('next')}
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('inviteDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleInviteSubmit}>
            <div className="space-y-2">
              <Label htmlFor="invite-worker-email">
                {t('inviteDialog.emailLabel')}
              </Label>
              <Input
                id="invite-worker-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="worker@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('inviteDialog.roleLabel')}</Label>
              <Input value={t('inviteDialog.roleValue')} disabled />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MailPlus className="w-4 h-4" />
                )}
                {t('inviteDialog.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

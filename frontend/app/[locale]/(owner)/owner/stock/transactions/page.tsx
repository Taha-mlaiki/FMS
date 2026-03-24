'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Loader2, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { PermissionDenied } from '@/components/ui/permission-denied';
import {
  useStockMaterials,
  useStockTransactions,
  useUpdateStockTransaction,
} from '@/lib/hooks/api/use-stock';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { usePermission } from '@/lib/hooks/use-permission';
import { useTranslations } from 'next-intl';

/* ── Helpers ── */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatCurrency(value: number, currencyLabel: string): string {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currencyLabel}`;
}

function toDisplayDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/* ── Types ── */
type TransactionType = 'purchase' | 'consumption' | 'damage' | 'adjustment';

type ApiTransaction = {
  id: string;
  material_id?: string;
  type?: string;
  quantity?: number;
  unit_cost?: number;
  total_cost?: number;
  quantity_before?: number;
  quantity_after?: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
};

type ApiMaterial = {
  id: string;
  name?: string;
};

type TransactionsResponse = {
  transactions?: ApiTransaction[];
  total?: number;
};

type MaterialsResponse = {
  materials?: ApiMaterial[];
  total?: number;
};

type TransactionFormState = {
  materialId: string;
  type: TransactionType;
  quantity: string;
  unitCost: string;
  notes: string;
};

const PAGE_SIZE = 25;

const defaultTransactionForm: TransactionFormState = {
  materialId: '',
  type: 'purchase',
  quantity: '',
  unitCost: '',
  notes: '',
};

const typeStyleColors: Record<TransactionType, { bg: string; color: string }> = {
  purchase: { bg: '#D8F3DC', color: '#1B4332' },
  consumption: { bg: '#FEF3C7', color: '#92400E' },
  damage: { bg: '#FFE4E6', color: '#991B1B' },
  adjustment: { bg: '#F0EDE4', color: '#5C5852' },
};

function normalizeTransactions(payload: unknown): { transactions: ApiTransaction[]; total: number } {
  if (typeof payload !== 'object' || payload === null) return { transactions: [], total: 0 };
  const source = payload as TransactionsResponse;
  const transactions = Array.isArray(source.transactions) ? source.transactions : [];
  const total = typeof source.total === 'number' && Number.isFinite(source.total) ? source.total : transactions.length;
  return { transactions, total };
}

function normalizeMaterials(payload: unknown): ApiMaterial[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const source = payload as MaterialsResponse;
  return Array.isArray(source.materials) ? source.materials : [];
}

function getTransactionType(value?: string): TransactionType {
  const normalized = value?.toLowerCase();
  if (
    normalized === 'purchase' ||
    normalized === 'consumption' ||
    normalized === 'damage' ||
    normalized === 'adjustment'
  ) {
    return normalized;
  }
  return 'adjustment';
}

function getMaterialName(materials: ApiMaterial[], materialId?: string): string {
  if (!materialId) return '-';
  const found = materials.find((m) => m.id === materialId);
  return found?.name || `#${materialId.slice(0, 8)}`;
}

/* ── Page ── */
export default function StockTransactionsPage() {
  const t = useTranslations('stock');
  const tc = useTranslations('common');

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormState>(defaultTransactionForm);

  const { isOwner } = useFarmContext();
  const canCreateTransaction = usePermission('create:transaction');

  const transactionsQuery = useStockTransactions({ limit, offset: 0 });
  const materialsQuery = useStockMaterials({ limit: 200 });
  const updateStockTransaction = useUpdateStockTransaction();

  const { transactions, total } = normalizeTransactions(transactionsQuery.data);
  const materials = normalizeMaterials(materialsQuery.data);
  const isLoading = transactionsQuery.isLoading;
  const isError = transactionsQuery.isError;
  const canLoadMore = transactions.length < total;

  /* ── Translated lookup maps (must be inside component) ── */
  const transactionTypeOptions: Array<{ value: TransactionType; label: string }> = [
    { value: 'purchase', label: t('transactionTypesFull.purchase') },
    { value: 'consumption', label: t('transactionTypesFull.consumption') },
    { value: 'damage', label: t('transactionTypesFull.damage') },
    { value: 'adjustment', label: t('transactionTypesFull.adjustment') },
  ];

  const typeStyles: Record<TransactionType, { bg: string; color: string; label: string }> = {
    purchase: { ...typeStyleColors.purchase, label: t('transactionTypes.purchase') },
    consumption: { ...typeStyleColors.consumption, label: t('transactionTypes.consumption') },
    damage: { ...typeStyleColors.damage, label: t('transactionTypes.damage') },
    adjustment: { ...typeStyleColors.adjustment, label: t('transactionTypes.adjustment') },
  };

  function getApiErrorMessage(error: unknown): string {
    const fallback = t('loadError');
    if (typeof error !== 'object' || error === null) return fallback;
    const maybeError = error as {
      response?: { data?: { message?: string | string[] }; status?: number };
    };
    const message = maybeError.response?.data?.message;
    if (Array.isArray(message) && message.length > 0) return message[0] ?? fallback;
    if (typeof message === 'string' && message.trim()) return message;
    switch (maybeError.response?.status) {
      case 401: return t('sessionExpired');
      case 403: return t('noPermission');
      case 404: return t('notFound');
      default: return fallback;
    }
  }

  const errorMessage = getApiErrorMessage(transactionsQuery.error);

  if (!isOwner) {
    return <PermissionDenied />;
  }

  const openEditModal = (tx: ApiTransaction) => {
    setEditingTransactionId(tx.id);
    setForm({
      materialId: tx.material_id ?? '',
      type: getTransactionType(tx.type),
      quantity: String(tx.quantity ?? ''),
      unitCost: String(tx.unit_cost ?? ''),
      notes: tx.notes ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTransactionId) return;

    const quantity = Number(form.quantity);
    const unitCost = form.unitCost.trim() === '' ? undefined : Number(form.unitCost);

    if (!form.materialId) { toast.error(t('materialRequired')); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { toast.error(t('quantityRequired')); return; }
    if (typeof unitCost === 'number' && (!Number.isFinite(unitCost) || unitCost < 0)) {
      toast.error(t('unitCostInvalid'));
      return;
    }

    try {
      await updateStockTransaction.mutateAsync({
        id: editingTransactionId,
        data: {
          material_id: form.materialId,
          type: form.type.toUpperCase(),
          quantity,
          unit_cost: unitCost,
          notes: form.notes.trim() || undefined,
        },
        method: 'PATCH',
      });
      toast.success(t('updateTransactionSuccess'));
      setIsEditModalOpen(false);
      setEditingTransactionId(null);
      setForm(defaultTransactionForm);
    } catch (error) {
      toast.error(t('updateTransactionError'), { description: getApiErrorMessage(error) });
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 mx-4 sm:mx-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#2D6A4F' }} />
        <p className="text-[14px]" style={{ color: '#5C5852' }}>
          {t('loading')}
        </p>
      </div>
    );
  }

  /* ── Error ── */
  if (isError) {
    return (
      <div
        className="rounded-2xl p-8 mx-4 sm:mx-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <h2 className="font-display text-[22px]" style={{ color: '#E76F51' }}>
          {t('loadError')}
        </h2>
        <p className="text-[14px] mt-2" style={{ color: '#5C5852' }}>
          {errorMessage}
        </p>
        <Button
          onClick={() => void transactionsQuery.refetch()}
          className="mt-4 rounded-xl h-10 px-4"
          style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          {tc('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]" style={{ color: '#9C9890' }}>
        <Link href="/owner/stock" className="hover:underline" style={{ color: '#2D6A4F' }}>
          {t('stockBreadcrumb')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        <span style={{ color: '#2C2A24' }}>{t('transactionsTitle')}</span>
      </div>

      {/* ── Desktop: Table View (hidden on mobile) ── */}
      <div
        className="hidden md:block rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_1fr_0.6fr] gap-3 px-5 py-3 text-[12px] uppercase font-medium tracking-wide"
          style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid #F0EDE4', color: '#9C9890' }}
        >
          <span>{t('dateColumn')}</span>
          <span>{t('materialColumn')}</span>
          <span>{t('typeColumn')}</span>
          <span>{t('quantityColumn')}</span>
          <span>{t('unitCostColumn')}</span>
          <span>{t('totalCost')}</span>
          <span>{t('notesColumn')}</span>
          <span>{t('actionsColumn')}</span>
        </div>

        {transactions.length === 0 && (
          <div className="px-5 py-12 text-center" style={{ color: '#9C9890' }}>
            {t('noTransactions')}
          </div>
        )}

        {transactions.map((tx) => {
          const normalizedType = getTransactionType(tx.type);
          const style = typeStyles[normalizedType];
          const quantity = Number(tx.quantity ?? 0);
          const unitCost = Number(tx.unit_cost ?? 0);
          const totalCost = Number(tx.total_cost ?? 0);
          const isIncrease = normalizedType === 'purchase' || normalizedType === 'adjustment';

          return (
            <div
              key={tx.id}
              className="grid grid-cols-[1fr_1.2fr_0.7fr_0.8fr_0.8fr_0.8fr_1fr_0.6fr] gap-3 px-5 py-3 items-center hover:bg-[#FAFAF7] transition-colors"
              style={{ borderBottom: '1px solid #F0EDE4' }}
            >
              <span className="text-[12px]" style={{ color: '#9C9890' }}>
                {toDisplayDateTime(tx.created_at)}
              </span>
              <span className="text-[13px] font-medium truncate" style={{ color: '#2C2A24' }}>
                {getMaterialName(materials, tx.material_id)}
              </span>
              <span
                className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full w-fit"
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                {style.label}
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{
                  color: isIncrease ? '#2D6A4F' : '#E76F51',
                  fontVariantNumeric: 'tabular-nums',
                }}
                dir="ltr"
              >
                {isIncrease ? `+${formatNumber(quantity)}` : `-${formatNumber(quantity)}`}
              </span>
              <span className="text-[12px]" style={{ color: '#5C5852', fontVariantNumeric: 'tabular-nums' }} dir="ltr">
                {unitCost > 0 ? formatCurrency(unitCost, tc('currency')) : '\u2014'}
              </span>
              <span className="text-[12px]" style={{ color: '#5C5852', fontVariantNumeric: 'tabular-nums' }} dir="ltr">
                {totalCost > 0 ? formatCurrency(totalCost, tc('currency')) : '\u2014'}
              </span>
              <span className="text-[12px] truncate" style={{ color: '#9C9890' }}>
                {tx.notes || '\u2014'}
              </span>
              <button
                type="button"
                onClick={() => openEditModal(tx)}
                disabled={!canCreateTransaction}
                className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ color: '#5C5852' }}
              >
                <Pencil className="w-3.5 h-3.5" />
                {tc('edit')}
              </button>
            </div>
          );
        })}

        {canLoadMore && (
          <div className="px-5 py-4 text-center" style={{ borderTop: '1px solid #F0EDE4' }}>
            <button
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              className="text-[14px] font-medium hover:underline cursor-pointer"
              style={{ color: '#2D6A4F' }}
            >
              {t('loadMore', { count: PAGE_SIZE })}
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile: Card View (hidden on desktop) ── */}
      <div className="md:hidden space-y-3">
        {transactions.length === 0 && (
          <div
            className="rounded-2xl px-5 py-12 text-center"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#9C9890',
              boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
            }}
          >
            {t('noTransactions')}
          </div>
        )}

        {transactions.map((tx) => {
          const normalizedType = getTransactionType(tx.type);
          const style = typeStyles[normalizedType];
          const quantity = Number(tx.quantity ?? 0);
          const unitCost = Number(tx.unit_cost ?? 0);
          const totalCost = Number(tx.total_cost ?? 0);
          const isIncrease = normalizedType === 'purchase' || normalizedType === 'adjustment';

          return (
            <div
              key={tx.id}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              {/* Row 1: Type badge + quantity + edit */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="text-[16px] font-bold"
                    style={{
                      color: isIncrease ? '#2D6A4F' : '#E76F51',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    dir="ltr"
                  >
                    {isIncrease ? '+' : '-'}{formatNumber(quantity)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(tx)}
                  disabled={!canCreateTransaction}
                  className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ color: '#5C5852' }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {tc('edit')}
                </button>
              </div>

              {/* Row 2: Material name */}
              <p className="text-[14px] font-medium mt-2" style={{ color: '#2C2A24' }}>
                {getMaterialName(materials, tx.material_id)}
              </p>

              {/* Row 3: Date + costs */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="text-[12px]" style={{ color: '#9C9890' }}>
                  {toDisplayDateTime(tx.created_at)}
                </span>
                {unitCost > 0 && (
                  <span className="text-[12px]" style={{ color: '#5C5852' }} dir="ltr">
                    {t('unitCostColumn')}: {formatCurrency(unitCost, tc('currency'))}
                  </span>
                )}
                {totalCost > 0 && (
                  <span className="text-[12px] font-medium" style={{ color: '#2C2A24' }} dir="ltr">
                    {t('totalCost')}: {formatCurrency(totalCost, tc('currency'))}
                  </span>
                )}
              </div>

              {/* Row 4: Notes */}
              {tx.notes && (
                <p className="text-[12px] mt-2 leading-relaxed" style={{ color: '#9C9890' }}>
                  {tx.notes}
                </p>
              )}
            </div>
          );
        })}

        {canLoadMore && (
          <div className="text-center py-2">
            <button
              onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              className="text-[14px] font-medium hover:underline cursor-pointer"
              style={{ color: '#2D6A4F' }}
            >
              {t('loadMore', { count: PAGE_SIZE })}
            </button>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingTransactionId(null);
            setForm(defaultTransactionForm);
          }
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px]">{t('editTransaction')}</DialogTitle>
            <DialogDescription>
              {t('editTransactionDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-transaction-material">{t('selectMaterial')}</Label>
              <select
                id="edit-transaction-material"
                value={form.materialId}
                onChange={(e) => setForm((prev) => ({ ...prev, materialId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('selectMaterial')}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || `#${m.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-type">{t('transactionType')}</Label>
                <select
                  id="edit-transaction-type"
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as TransactionType }))}
                  className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {transactionTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-quantity">{t('quantityLabel')}</Label>
                <Input
                  id="edit-transaction-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-unit-cost">{t('unitCost')}</Label>
              <Input
                id="edit-transaction-unit-cost"
                type="number"
                min="0"
                step="0.01"
                dir="ltr"
                value={form.unitCost}
                onChange={(e) => setForm((prev) => ({ ...prev, unitCost: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-notes">{t('notesLabel')}</Label>
              <Textarea
                id="edit-transaction-notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('notesPlaceholder')}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                className="hover:bg-[#1B4332]"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                disabled={updateStockTransaction.isPending}
              >
                {updateStockTransaction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  tc('save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

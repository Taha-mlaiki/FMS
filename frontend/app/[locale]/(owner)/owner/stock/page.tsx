'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  AlertTriangle,
  Package,
  TrendingDown,
  Loader2,
  RefreshCw,
  Pencil,
  ChevronLeft,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
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
import {
  useCreateStockMaterial,
  useCreateStockTransaction,
  useStockTransactions,
  useStockAlerts,
  useStockMaterials,
  useUpdateStockMaterial,
  useUpdateStockTransaction,
} from '@/lib/hooks/api/use-stock';
import { useFarmContext } from '@/lib/hooks/use-farm-context';
import { usePermission } from '@/lib/hooks/use-permission';
import { useTranslations } from 'next-intl';

/* ── Helpers ── */
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
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
type Category = 'all' | 'feed' | 'vaccine' | 'medicine' | 'equipment' | 'other';
type StockStatus = 'ok' | 'low' | 'critical';

type ApiMaterial = {
  id: string;
  farm_id?: string;
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  min_threshold?: number;
  is_low_stock?: boolean;
  created_at?: string;
  updated_at?: string;
};

type MaterialModalMode = 'create' | 'edit';
type TransactionModalMode = 'create' | 'edit';

type MaterialFormState = {
  name: string;
  category: string;
  quantity: string;
  unit: string;
  minThreshold: string;
};

type TransactionFormState = {
  materialId: string;
  type: 'purchase' | 'consumption' | 'damage' | 'adjustment';
  quantity: string;
  unitCost: string;
  notes: string;
};

type ApiTransaction = {
  id: string;
  material_id?: string;
  type?: string;
  quantity?: number;
  unit_cost?: number;
  notes?: string;
  created_at?: string;
};

type ApiAlert = {
  material_id?: string;
  severity?: string;
};

type MaterialsResponse = {
  materials?: ApiMaterial[];
  total?: number;
};

type AlertsResponse = {
  items?: ApiAlert[];
  alerts?: ApiAlert[];
  count?: number;
};

type TransactionsResponse = {
  transactions?: ApiTransaction[];
  total?: number;
};

const categoryIcons: Record<Exclude<Category, 'all'>, string> = {
  feed: '\uD83C\uDF3E',
  vaccine: '\uD83D\uDC89',
  medicine: '\uD83D\uDC8A',
  equipment: '\uD83D\uDD27',
  other: '\uD83D\uDCE6',
};

const defaultMaterialForm: MaterialFormState = {
  name: '',
  category: 'feed',
  quantity: '',
  unit: 'kg',
  minThreshold: '',
};

const defaultTransactionForm: TransactionFormState = {
  materialId: '',
  type: 'purchase',
  quantity: '',
  unitCost: '',
  notes: '',
};

const statusColors: Record<
  StockStatus,
  { bg: string; color: string; dot: string }
> = {
  ok: { bg: '#D8F3DC', color: '#1B4332', dot: '#2D6A4F' },
  low: { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  critical: { bg: '#FFE4E6', color: '#991B1B', dot: '#EF4444' },
};

const txTypeColors: Record<string, { bg: string; color: string }> = {
  purchase: { bg: '#D8F3DC', color: '#1B4332' },
  consumption: { bg: '#FEF3C7', color: '#92400E' },
  damage: { bg: '#FFE4E6', color: '#991B1B' },
  adjustment: { bg: '#F0EDE4', color: '#5C5852' },
};

function normalizeMaterials(payload: unknown): { materials: ApiMaterial[]; total: number } {
  if (typeof payload !== 'object' || payload === null) return { materials: [], total: 0 };
  const source = payload as MaterialsResponse;
  const materials = Array.isArray(source.materials) ? source.materials : [];
  const total = typeof source.total === 'number' && Number.isFinite(source.total) ? source.total : materials.length;
  return { materials, total };
}

function normalizeAlerts(payload: unknown): { items: ApiAlert[]; count: number } {
  if (typeof payload !== 'object' || payload === null) return { items: [], count: 0 };
  const source = payload as AlertsResponse;
  const items = Array.isArray(source.items) ? source.items : Array.isArray(source.alerts) ? source.alerts : [];
  const count = typeof source.count === 'number' && Number.isFinite(source.count) ? source.count : items.length;
  return { items, count };
}

function normalizeTransactions(payload: unknown): { transactions: ApiTransaction[]; total: number } {
  if (typeof payload !== 'object' || payload === null) return { transactions: [], total: 0 };
  const source = payload as TransactionsResponse;
  const transactions = Array.isArray(source.transactions) ? source.transactions : [];
  const total = typeof source.total === 'number' && Number.isFinite(source.total) ? source.total : transactions.length;
  return { transactions, total };
}

function getStockStatus(material: ApiMaterial): StockStatus {
  const quantity = typeof material.quantity === 'number' ? material.quantity : 0;
  const threshold = typeof material.min_threshold === 'number' ? material.min_threshold : 0;
  if (material.is_low_stock || quantity <= threshold) {
    if (quantity <= 0 || quantity <= threshold * 0.5) return 'critical';
    return 'low';
  }
  return 'ok';
}

function getCategoryIcon(rawCategory?: string): string {
  const normalized = (rawCategory ?? '').toLowerCase();
  return categoryIcons[normalized as Exclude<Category, 'all'>] ?? '\uD83D\uDCE6';
}

/* ── Page ── */
export default function StockPage() {
  const t = useTranslations('stock');
  const tc = useTranslations('common');

  const [category, setCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [materialModalMode, setMaterialModalMode] = useState<MaterialModalMode>('create');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<MaterialFormState>(defaultMaterialForm);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalMode, setTransactionModalMode] = useState<TransactionModalMode>('create');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactionForm, setTransactionForm] = useState<TransactionFormState>(defaultTransactionForm);

  const { isWorker } = useFarmContext();
  const canManageStock = usePermission('manage:stock');
  const canCreateTransaction = usePermission('create:transaction');

  const createStockMaterial = useCreateStockMaterial();
  const updateStockMaterial = useUpdateStockMaterial();
  const createStockTransaction = useCreateStockTransaction();
  const updateStockTransaction = useUpdateStockTransaction();

  /* ── Translated lookup maps (must be inside component) ── */
  const categoryLabels: Record<Category, string> = {
    all: t('categories.all'),
    feed: t('categories.feed'),
    vaccine: t('categories.vaccine'),
    medicine: t('categories.medicine'),
    equipment: t('categories.equipment'),
    other: t('categories.other'),
  };

  const materialCategoryOptions = [
    { value: 'feed', label: t('categories.feed') },
    { value: 'vaccine', label: t('categories.vaccine') },
    { value: 'medicine', label: t('categories.medicine') },
    { value: 'equipment', label: t('categories.equipment') },
    { value: 'other', label: t('categories.other') },
  ];

  const unitOptions = [
    { value: 'kg', label: t('units.kg') },
    { value: 'litre', label: t('units.litre') },
    { value: 'piece', label: t('units.piece') },
    { value: 'dose', label: t('units.dose') },
    { value: 'box', label: t('units.box') },
  ];

  const transactionTypeOptions: Array<{
    value: TransactionFormState['type'];
    label: string;
    desc: string;
  }> = [
    { value: 'purchase', label: t('transactionTypes.purchase'), desc: t('transactionTypeDescriptions.purchase') },
    { value: 'consumption', label: t('transactionTypes.consumption'), desc: t('transactionTypeDescriptions.consumption') },
    { value: 'damage', label: t('transactionTypes.damage'), desc: t('transactionTypeDescriptions.damage') },
    { value: 'adjustment', label: t('transactionTypes.adjustment'), desc: t('transactionTypeDescriptions.adjustment') },
  ];

  const statusConfig: Record<StockStatus, { bg: string; color: string; label: string; dot: string }> = {
    ok: { ...statusColors.ok, label: t('statusLabels.ok') },
    low: { ...statusColors.low, label: t('statusLabels.low') },
    critical: { ...statusColors.critical, label: t('statusLabels.critical') },
  };

  const txTypeConfig: Record<string, { bg: string; color: string; label: string }> = {
    purchase: { ...txTypeColors.purchase, label: t('transactionTypes.purchase') },
    consumption: { ...txTypeColors.consumption, label: t('transactionTypes.consumption') },
    damage: { ...txTypeColors.damage, label: t('transactionTypes.damage') },
    adjustment: { ...txTypeColors.adjustment, label: t('transactionTypes.adjustment') },
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

  function getCategoryLabel(rawCategory?: string): string {
    const normalized = (rawCategory ?? '').toLowerCase();
    if (normalized in categoryLabels) return categoryLabels[normalized as Category];
    return rawCategory || t('categories.other');
  }

  function getTransactionTypeLabel(type?: string): string {
    return txTypeConfig[type?.toLowerCase() ?? '']?.label ?? t('transactionTypes.adjustment');
  }

  function getUnitLabel(unit?: string): string {
    const found = unitOptions.find((u) => u.value === unit);
    return found?.label ?? unit ?? '-';
  }

  const materialsQuery = useStockMaterials(
    category === 'all' ? { limit: 200 } : { category, limit: 200 },
  );
  const materialsSummaryQuery = useStockMaterials({ limit: 200 });
  const alertsQuery = useStockAlerts();
  const transactionsQuery = useStockTransactions({ limit: 5, offset: 0 });

  const { materials } = normalizeMaterials(materialsQuery.data);
  const summaryMaterials = normalizeMaterials(materialsSummaryQuery.data).materials;
  const alerts = normalizeAlerts(alertsQuery.data);
  const recentTransactions = normalizeTransactions(transactionsQuery.data).transactions;
  const criticalCount = alerts.items.filter((a) => a.severity?.toLowerCase() === 'critical').length;
  const lowCount = alerts.count;

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.trim().toLowerCase();
    return materials.filter(
      (m) =>
        (m.name ?? '').toLowerCase().includes(q) ||
        (m.category ?? '').toLowerCase().includes(q),
    );
  }, [materials, searchQuery]);

  const isLoading = materialsQuery.isLoading || materialsSummaryQuery.isLoading || alertsQuery.isLoading;
  const isError = materialsQuery.isError || materialsSummaryQuery.isError || alertsQuery.isError;
  const errorMessage = materialsQuery.isError
    ? getApiErrorMessage(materialsQuery.error)
    : materialsSummaryQuery.isError
      ? getApiErrorMessage(materialsSummaryQuery.error)
      : getApiErrorMessage(alertsQuery.error);

  /* ── Modal Handlers ── */
  const openCreateMaterialModal = () => {
    setMaterialModalMode('create');
    setEditingMaterialId(null);
    setMaterialForm(defaultMaterialForm);
    setIsMaterialModalOpen(true);
  };

  const openEditMaterialModal = (material: ApiMaterial) => {
    setMaterialModalMode('edit');
    setEditingMaterialId(material.id);
    setMaterialForm({
      name: material.name ?? '',
      category: material.category?.toLowerCase() || 'other',
      quantity: String(material.quantity ?? ''),
      unit: material.unit ?? 'kg',
      minThreshold: String(material.min_threshold ?? ''),
    });
    setIsMaterialModalOpen(true);
  };

  const openCreateTransactionModal = (materialId?: string) => {
    setTransactionModalMode('create');
    setEditingTransactionId(null);
    setTransactionForm({ ...defaultTransactionForm, materialId: materialId ?? '' });
    setIsTransactionModalOpen(true);
  };

  const openEditTransactionModal = (transaction: ApiTransaction) => {
    setTransactionModalMode('edit');
    setEditingTransactionId(transaction.id);
    const normalizedType = transaction.type?.toLowerCase();
    setTransactionForm({
      materialId: transaction.material_id ?? '',
      type:
        normalizedType === 'purchase' || normalizedType === 'consumption' || normalizedType === 'damage' || normalizedType === 'adjustment'
          ? (normalizedType as TransactionFormState['type'])
          : 'adjustment',
      quantity: String(transaction.quantity ?? ''),
      unitCost: String(transaction.unit_cost ?? ''),
      notes: transaction.notes ?? '',
    });
    setIsTransactionModalOpen(true);
  };

  const handleMaterialSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(materialForm.quantity);
    const minThreshold = Number(materialForm.minThreshold);

    if (!materialForm.name.trim()) { toast.error(t('nameRequired')); return; }
    if (!Number.isFinite(quantity) || quantity < 0) { toast.error(t('quantityRequired')); return; }
    if (!Number.isFinite(minThreshold) || minThreshold < 0) { toast.error(t('thresholdRequired')); return; }

    const payload = {
      name: materialForm.name.trim(),
      category: materialForm.category,
      quantity,
      unit: materialForm.unit,
      min_threshold: minThreshold,
    };

    try {
      if (materialModalMode === 'edit' && editingMaterialId) {
        await updateStockMaterial.mutateAsync({ id: editingMaterialId, data: payload });
        toast.success(t('updateMaterialSuccess'));
      } else {
        await createStockMaterial.mutateAsync(payload);
        toast.success(t('addMaterialSuccess'));
      }
      setIsMaterialModalOpen(false);
      setMaterialForm(defaultMaterialForm);
      setEditingMaterialId(null);
    } catch (error) {
      toast.error(materialModalMode === 'edit' ? t('updateMaterialError') : t('addMaterialError'), { description: getApiErrorMessage(error) });
    }
  };

  const handleTransactionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(transactionForm.quantity);
    const unitCost = transactionForm.unitCost.trim() === '' ? undefined : Number(transactionForm.unitCost);

    if (!transactionForm.materialId) { toast.error(t('materialRequired')); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { toast.error(t('quantityRequired')); return; }
    if (typeof unitCost === 'number' && (!Number.isFinite(unitCost) || unitCost < 0)) {
      toast.error(t('unitCostInvalid'));
      return;
    }

    const payload = {
      material_id: transactionForm.materialId,
      type: transactionForm.type.toUpperCase(),
      quantity,
      unit_cost: unitCost,
      notes: transactionForm.notes.trim() || undefined,
    };

    try {
      if (transactionModalMode === 'edit' && editingTransactionId) {
        await updateStockTransaction.mutateAsync({ id: editingTransactionId, data: payload, method: 'PATCH' });
        toast.success(t('updateTransactionSuccess'));
      } else {
        await createStockTransaction.mutateAsync(payload);
        toast.success(t('addTransactionSuccess'));
      }
      setIsTransactionModalOpen(false);
      setTransactionForm(defaultTransactionForm);
      setEditingTransactionId(null);
      setTransactionModalMode('create');
    } catch (error) {
      toast.error(
        transactionModalMode === 'edit' ? t('updateTransactionError') : t('addTransactionError'),
        { description: getApiErrorMessage(error) },
      );
    }
  };

  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-0">
        {/* Skeleton summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((k) => (
            <div
              key={k}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div className="h-4 w-24 rounded-full" style={{ backgroundColor: '#E4E0D8' }} />
              <div className="mt-3 h-8 w-20 rounded-full" style={{ backgroundColor: '#F0EDE4' }} />
            </div>
          ))}
        </div>
        {/* Skeleton material cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <div
              key={k}
              className="rounded-2xl p-5"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
              }}
            >
              <div className="h-4 w-32 rounded-full" style={{ backgroundColor: '#E4E0D8' }} />
              <div className="mt-3 h-3 w-20 rounded-full" style={{ backgroundColor: '#F0EDE4' }} />
              <div className="mt-2 h-3 w-full rounded-full" style={{ backgroundColor: '#F0EDE4' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (isError) {
    return (
      <div
        className="rounded-2xl p-8 mx-4 sm:mx-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <div className="flex items-center gap-2" style={{ color: '#E76F51' }}>
          <AlertTriangle className="w-5 h-5" />
          <h2 className="font-display text-[22px]">{t('loadError')}</h2>
        </div>
        <p className="text-[14px] mt-2" style={{ color: '#5C5852' }}>
          {errorMessage}
        </p>
        <Button
          onClick={() => {
            void materialsQuery.refetch();
            void materialsSummaryQuery.refetch();
            void alertsQuery.refetch();
          }}
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
      {/* ── Top Actions (mobile-responsive) ── */}
      {!isWorker && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Link href="/owner/stock/transactions" className="sm:order-1">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl h-11 px-5 text-[14px] font-medium cursor-pointer"
              style={{ borderColor: '#E4E0D8', color: '#5C5852' }}
            >
              {t('transactionsTitle')}
            </Button>
          </Link>
          <Button
            variant="outline"
            className="sm:order-2 rounded-xl h-11 px-5 text-[14px] font-medium cursor-pointer"
            style={{ borderColor: '#E4E0D8', color: '#5C5852' }}
            onClick={openCreateMaterialModal}
            disabled={!canManageStock}
          >
            <Plus className="w-4 h-4 ml-2" />
            {t('addMaterial')}
          </Button>
          <Button
            className="sm:order-3 rounded-xl h-11 px-5 text-[14px] font-semibold hover:bg-[#1B4332] cursor-pointer"
            style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
            onClick={() => openCreateTransactionModal()}
            disabled={!canCreateTransaction || summaryMaterials.length === 0}
          >
            <Plus className="w-4 h-4 ml-2" />
            {t('newTransaction')}
          </Button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#EBF5EE' }}
          >
            <Package className="w-6 h-6" style={{ color: '#2D6A4F' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-wide" style={{ color: '#9C9890' }}>
              {t('totalMaterials')}
            </p>
            <p
              className="font-display text-[28px] leading-none mt-1"
              style={{ color: '#2C2A24', fontVariantNumeric: 'tabular-nums' }}
              dir="ltr"
            >
              {formatNumber(summaryMaterials.length)}
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: lowCount > 0 ? '#FEF3C7' : '#EBF5EE' }}
          >
            <TrendingDown
              className="w-6 h-6"
              style={{ color: lowCount > 0 ? '#F59E0B' : '#2D6A4F' }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-wide" style={{ color: '#9C9890' }}>
              {t('lowStockAlerts')}
            </p>
            <p
              className="font-display text-[28px] leading-none mt-1"
              style={{
                color: lowCount > 0 ? '#F59E0B' : '#2D6A4F',
                fontVariantNumeric: 'tabular-nums',
              }}
              dir="ltr"
            >
              {formatNumber(lowCount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Low-Stock Banner ── */}
      {criticalCount > 0 && (
        <div
          className="flex items-start sm:items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#FEF3C7', borderRight: '4px solid #EF4444' }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" style={{ color: '#EF4444' }} />
          <p className="text-[14px] flex-1" style={{ color: '#2C2A24' }}>
            <strong>{formatNumber(criticalCount)} {t('criticalMaterialCount')}</strong>
            {isWorker ? ` - ${t('contactOwner')}` : ''}
          </p>
        </div>
      )}

      {/* ── Category Filter + Search ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category pills -- scrollable on mobile */}
        <div
          className="flex overflow-x-auto rounded-xl p-1 flex-shrink-0 no-scrollbar"
          style={{ backgroundColor: '#F0EDE4' }}
        >
          {(Object.entries(categoryLabels) as [Category, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                category === key ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-[#5C5852] hover:text-[#2C2A24]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#9C9890' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-9 pr-10 pl-4 rounded-lg text-[13px] outline-none transition-colors"
            style={{
              backgroundColor: '#F0EDE4',
              border: '1px solid transparent',
              color: '#2C2A24',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2D6A4F'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
        </div>

        {materialsQuery.isFetching && (
          <div className="flex items-center gap-2 text-[12px] self-center" style={{ color: '#9C9890' }}>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('refreshing')}
          </div>
        )}
      </div>

      {/* ── Materials -- Card Grid (responsive) ── */}
      {filteredMaterials.length === 0 && (
        <EmptyState
          title={t('noMaterials')}
          description={
            isWorker
              ? t('noMaterialsDescriptionWorker')
              : t('noMaterialsDescription')
          }
          icon={<Package className="h-10 w-10" style={{ color: '#9C9890' }} />}
          action={
            !isWorker && canManageStock ? (
              <Button
                onClick={openCreateMaterialModal}
                className="rounded-xl h-10 px-4 text-[13px] font-semibold cursor-pointer"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
              >
                <Plus className="w-4 h-4 ml-2" />
                {t('addMaterial')}
              </Button>
            ) : undefined
          }
        />
      )}

      {filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => {
            const status = statusConfig[getStockStatus(material)];
            const quantity = material.quantity ?? 0;
            const threshold = material.min_threshold ?? 0;
            const progressPct = threshold > 0 ? Math.min((quantity / (threshold * 3)) * 100, 100) : 100;

            return (
              <div
                key={material.id}
                className="rounded-2xl overflow-hidden transition-shadow hover:shadow-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
                }}
              >
                {/* Card Header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[22px] flex-shrink-0">{getCategoryIcon(material.category)}</span>
                      <div className="min-w-0">
                        <h3
                          className="text-[15px] font-semibold truncate"
                          style={{ color: '#2C2A24' }}
                        >
                          {material.name || t('unnamedMaterial')}
                        </h3>
                        <p className="text-[12px] mt-0.5" style={{ color: '#9C9890' }}>
                          {getCategoryLabel(material.category)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: status.dot }}
                      />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Quantity + Progress */}
                <div className="px-5 pb-3">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-display text-[32px] leading-none"
                      style={{ color: '#2C2A24', fontVariantNumeric: 'tabular-nums' }}
                      dir="ltr"
                    >
                      {formatNumber(quantity)}
                    </span>
                    <span className="text-[14px]" style={{ color: '#9C9890' }}>
                      {getUnitLabel(material.unit)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full h-1.5 rounded-full" style={{ backgroundColor: '#F0EDE4' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: status.dot,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px]" style={{ color: '#9C9890' }}>
                      {t('threshold')}: {formatNumber(threshold)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                {!isWorker && (
                  <div
                    className="flex items-center gap-1 px-5 py-3"
                    style={{ borderTop: '1px solid #F0EDE4', backgroundColor: '#FAFAF7' }}
                  >
                    <button
                      type="button"
                      onClick={() => openEditMaterialModal(material)}
                      disabled={!canManageStock}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#F0EDE4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ color: '#5C5852' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {tc('edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateTransactionModal(material.id)}
                      disabled={!canCreateTransaction}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors hover:bg-[#EBF5EE] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      style={{ color: '#2D6A4F' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('transaction')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ backgroundColor: '#FAFAF7', borderBottom: '1px solid #F0EDE4' }}
        >
          <h3 className="text-[14px] font-semibold" style={{ color: '#2C2A24' }}>
            {t('recentTransactions')}
          </h3>
          {!isWorker && (
            <Link
              href="/owner/stock/transactions"
              className="flex items-center gap-1 text-[12px] font-medium hover:underline"
              style={{ color: '#2D6A4F' }}
            >
              {t('viewAll')}
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {transactionsQuery.isLoading && (
          <div className="px-5 py-8 flex items-center justify-center gap-2 text-[13px]" style={{ color: '#9C9890' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('loadingRecentTransactions')}
          </div>
        )}

        {transactionsQuery.isError && (
          <div className="px-5 py-6 text-[13px]" style={{ color: '#E76F51' }}>
            {t('recentTransactionsError')}
          </div>
        )}

        {!transactionsQuery.isLoading && !transactionsQuery.isError && recentTransactions.length === 0 && (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#9C9890' }}>
            {t('noTransactions')}
          </div>
        )}

        {!transactionsQuery.isLoading && !transactionsQuery.isError && recentTransactions.length > 0 && (
          <div className="divide-y" style={{ borderColor: '#F0EDE4' }}>
            {recentTransactions.map((tx) => {
              const txStyle = txTypeConfig[tx.type?.toLowerCase() ?? ''] ?? txTypeConfig.adjustment;
              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3 hover:bg-[#FAFAF7] transition-colors"
                >
                  {/* Type badge + date */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: txStyle.bg, color: txStyle.color }}
                    >
                      {txStyle.label}
                    </span>
                    <span className="text-[12px] whitespace-nowrap" style={{ color: '#9C9890' }}>
                      {toDisplayDateTime(tx.created_at)}
                    </span>
                  </div>

                  {/* Quantity + notes */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="text-[14px] font-semibold flex-shrink-0"
                      style={{
                        color:
                          tx.type?.toLowerCase() === 'purchase' ? '#2D6A4F' : '#E76F51',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      dir="ltr"
                    >
                      {tx.type?.toLowerCase() === 'purchase' ? '+' : '-'}
                      {formatNumber(tx.quantity ?? 0)}
                    </span>
                    <span className="text-[12px] truncate" style={{ color: '#9C9890' }}>
                      {tx.notes || t('noNotes')}
                    </span>
                  </div>

                  {/* Edit button */}
                  {!isWorker && (
                    <button
                      type="button"
                      onClick={() => openEditTransactionModal(tx)}
                      disabled={!canCreateTransaction}
                      className="flex items-center gap-1 text-[12px] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer self-end sm:self-center"
                      style={{ color: '#5C5852' }}
                    >
                      <Pencil className="w-3 h-3" />
                      {tc('edit')}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Modal */}
      <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
        <DialogContent dir="rtl" className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px]">
              {materialModalMode === 'edit' ? t('editMaterial') : t('createMaterialTitle')}
            </DialogTitle>
            <DialogDescription>
              {materialModalMode === 'edit'
                ? t('editMaterialDescription')
                : t('createMaterialDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMaterialSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="material-name">
                {t('materialName')} <span style={{ color: '#E76F51' }}>*</span>
              </Label>
              <Input
                id="material-name"
                value={materialForm.name}
                onChange={(e) => setMaterialForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('materialNamePlaceholder')}
              />
            </div>

            {/* Category + Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-category">{t('category')}</Label>
                <select
                  id="material-category"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {materialCategoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-unit">{t('unitLabel')}</Label>
                <select
                  id="material-unit"
                  value={materialForm.unit}
                  onChange={(e) => setMaterialForm((prev) => ({ ...prev, unit: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  {unitOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity + Threshold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-quantity">
                  {t('initialQuantity')} <span style={{ color: '#E76F51' }}>*</span>
                </Label>
                <Input
                  id="material-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-min-threshold">
                  {t('minThreshold')} <span style={{ color: '#E76F51' }}>*</span>
                </Label>
                <Input
                  id="material-min-threshold"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  value={materialForm.minThreshold}
                  onChange={(e) => setMaterialForm((prev) => ({ ...prev, minThreshold: e.target.value }))}
                />
                <p className="text-[11px]" style={{ color: '#9C9890' }}>
                  {t('thresholdHint')}
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsMaterialModalOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                className="hover:bg-[#1B4332]"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                disabled={createStockMaterial.isPending || updateStockMaterial.isPending}
              >
                {createStockMaterial.isPending || updateStockMaterial.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : materialModalMode === 'edit' ? (
                  tc('save')
                ) : (
                  t('addMaterial')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Modal */}
      <Dialog
        open={isTransactionModalOpen}
        onOpenChange={(open) => {
          setIsTransactionModalOpen(open);
          if (!open) {
            setTransactionModalMode('create');
            setEditingTransactionId(null);
            setTransactionForm(defaultTransactionForm);
          }
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px]">
              {transactionModalMode === 'edit' ? t('editTransaction') : t('createTransactionTitle')}
            </DialogTitle>
            <DialogDescription>
              {transactionModalMode === 'edit'
                ? t('editTransactionDescription')
                : t('createTransactionDescription')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransactionSubmit} className="space-y-4">
            {/* Material select */}
            <div className="space-y-2">
              <Label htmlFor="transaction-material">
                {t('selectMaterial')} <span style={{ color: '#E76F51' }}>*</span>
              </Label>
              <select
                id="transaction-material"
                value={transactionForm.materialId}
                onChange={(e) => setTransactionForm((prev) => ({ ...prev, materialId: e.target.value }))}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="">{t('selectMaterial')}</option>
                {summaryMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || `#${m.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction type -- 2x2 grid */}
            <div className="space-y-2">
              <Label>{t('transactionType')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {transactionTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransactionForm((prev) => ({ ...prev, type: opt.value }))}
                    className="flex flex-col items-start gap-0.5 p-3 rounded-xl cursor-pointer transition-all text-right"
                    style={{
                      backgroundColor:
                        transactionForm.type === opt.value
                          ? (txTypeColors[opt.value]?.bg ?? '#F0EDE4')
                          : '#F0EDE4',
                      border:
                        transactionForm.type === opt.value
                          ? '2px solid #2D6A4F'
                          : '2px solid transparent',
                    }}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: '#2C2A24' }}>
                      {opt.label}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9C9890' }}>
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Unit Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-quantity">
                  {t('quantityLabel')} <span style={{ color: '#E76F51' }}>*</span>
                </Label>
                <Input
                  id="transaction-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-unit-cost">{t('unitCost')}</Label>
                <Input
                  id="transaction-unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  placeholder={tc('currency')}
                  value={transactionForm.unitCost}
                  onChange={(e) => setTransactionForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="transaction-notes">{t('notesLabel')}</Label>
              <Textarea
                id="transaction-notes"
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('notesPlaceholder')}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2 flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTransactionModalOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                className="hover:bg-[#1B4332]"
                style={{ backgroundColor: '#2D6A4F', color: '#FFFFFF' }}
                disabled={createStockTransaction.isPending || updateStockTransaction.isPending}
              >
                {createStockTransaction.isPending || updateStockTransaction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {transactionModalMode === 'edit' ? t('updating') : t('registering')}
                  </>
                ) : transactionModalMode === 'edit' ? (
                  tc('save')
                ) : (
                  t('addTransaction')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

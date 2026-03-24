'use client';

import { useMemo, useState } from 'react';
import {
  X,
  Check,
  SkipForward,
  Clock,
  Calendar,
  Users,
  Layers,
  FileText,
  Package,
  Minus,
  Plus,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/* ── Types ── */

type TaskStatus = 'todo' | 'doing' | 'completed' | 'skipped';

const statusConfig: Record<
  TaskStatus,
  { bg: string; color: string; label: string }
> = {
  todo: { bg: '#F0EDE4', color: '#5C5852', label: 'قيد الانتظار' },
  doing: { bg: '#FFF4EF', color: '#E76F51', label: 'قيد التنفيذ' },
  completed: { bg: '#D8F3DC', color: '#1B4332', label: 'مكتمل' },
  skipped: { bg: '#E4E0D8', color: '#5C5852', label: 'تم التخطي' },
};

interface MaterialItem {
  material_id?: string;
  materialId?: string;
  material_name?: string;
  materialName?: string;
  quantity: number;
  unit: string;
}

interface TaskOccurrence {
  id: string;
  title: string;
  status: TaskStatus;
  scheduledDate: string;
  scheduledTime: string;
  categoryName?: string;
  categoryColor?: string;
  description?: string;
  groups: { id: string; name: string }[];
  workers: { id?: string; name: string; initial: string }[];
  materials?: MaterialItem[];
  report_id?: string;
  completedBy?: string;
  completedAt?: string;
  skipNote?: string;
}

interface CompleteTaskPayload {
  notes?: string;
  report: {
    title: string;
    description: string;
    type: string;
    severity: string;
    group_id?: string;
  };
  materials_used?: Array<{ material_id: string; quantity: number }>;
}

interface SkipTaskPayload {
  reason?: string;
}

interface TaskOccurrenceDetailModalProps {
  open: boolean;
  onClose: () => void;
  task?: TaskOccurrence;
  isLoading?: boolean;
  isCompleting?: boolean;
  isSkipping?: boolean;
  canComplete?: boolean;
  canSkip?: boolean;
  onComplete?: (payload: CompleteTaskPayload) => Promise<boolean> | boolean;
  onSkip?: (payload: SkipTaskPayload) => Promise<boolean> | boolean;
}

const REPORT_TYPES = [
  { value: 'maintenance', label: 'صيانة' },
  { value: 'observation', label: 'ملاحظة' },
  { value: 'incident', label: 'حادث' },
  { value: 'other', label: 'أخرى' },
];

const REPORT_SEVERITIES = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
];

export function TaskOccurrenceDetailModal({
  open,
  onClose,
  task,
  isLoading = false,
  isCompleting = false,
  isSkipping = false,
  canComplete = true,
  canSkip = true,
  onComplete,
  onSkip,
}: Readonly<TaskOccurrenceDetailModalProps>) {
  // Notes / skip
  const [notes, setNotes] = useState('');
  const [isSkipConfirmOpen, setIsSkipConfirmOpen] = useState(false);

  // Report form state
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState('maintenance');
  const [reportSeverity, setReportSeverity] = useState('low');

  // Materials adjustment
  const [materialQuantities, setMaterialQuantities] = useState<
    Record<string, number>
  >({});

  const normalizedMaterials = useMemo(() => {
    if (!task?.materials) return [];
    return task.materials.map((m) => {
      const id = m.material_id ?? m.materialId ?? '';
      const name = m.material_name ?? m.materialName ?? '';
      const adjusted = materialQuantities[id];
      return {
        material_id: id,
        material_name: name,
        quantity: adjusted ?? m.quantity,
        unit: m.unit,
        original: m.quantity,
      };
    });
  }, [task?.materials, materialQuantities]);

  const isEditable = task?.status === 'todo' || task?.status === 'doing';

  const handleComplete = async () => {
    if (!onComplete || !isEditable || !canComplete) return;

    const finalReportTitle = reportTitle.trim() || `تقرير: ${task?.title ?? ''}`;

    const materialsUsed = normalizedMaterials
      .filter((m) => m.quantity > 0)
      .map((m) => ({
        material_id: m.material_id,
        quantity: m.quantity,
      }));

    const accepted = await Promise.resolve(
      onComplete({
        notes: notes.trim() || undefined,
        report: {
          title: finalReportTitle,
          description: reportDescription.trim() || notes.trim() || '',
          type: reportType,
          severity: reportSeverity,
        },
        materials_used: materialsUsed.length > 0 ? materialsUsed : undefined,
      }),
    );
    if (accepted !== false) onClose();
  };

  const handleSkip = async () => {
    setIsSkipConfirmOpen(true);
  };

  const handleSkipConfirm = async () => {
    if (!onSkip || !isEditable || !canSkip) return;
    const accepted = await Promise.resolve(
      onSkip({ reason: notes.trim() || undefined }),
    );
    if (accepted !== false) {
      setIsSkipConfirmOpen(false);
      onClose();
    }
  };

  if (!open || !task) return null;

  const st = statusConfig[task.status] ?? statusConfig.todo;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        dir="rtl"
      >
        <button
          type="button"
          aria-label="إغلاق نافذة التفاصيل"
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
        <div
          className="relative w-full max-h-[92dvh] overflow-hidden rounded-t-[20px] page-enter sm:max-w-[600px] sm:rounded-[20px]"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow:
              '0 8px 32px rgba(15,14,12,0.18), 0 2px 8px rgba(15,14,12,0.08)',
          }}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                  {task.categoryName && (
                    <span
                      className="inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm uppercase tracking-widest"
                      style={{ 
                        backgroundColor: task.categoryColor ? `${task.categoryColor}15` : '#F0F0F0',
                        color: task.categoryColor || '#666',
                        borderColor: task.categoryColor ? `${task.categoryColor}30` : '#E0E0E0'
                      }}
                    >
                      {task.categoryName}
                    </span>
                  )}
                </div>
                <h2
                  className="text-[22px] font-black leading-tight tracking-tight mt-1"
                  style={{ color: '#2C2A24' }}
                >
                  {task.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer p-1 rounded-lg hover:bg-[#F0EDE4] transition-colors"
                style={{ color: '#9C9890' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <div
                className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#F9F8F5', color: '#5C5852' }}
              >
                <Calendar className="w-3.5 h-3.5" />
                {task.scheduledDate}
              </div>
              <div
                className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: '#F9F8F5', color: '#5C5852' }}
              >
                <Clock className="w-3.5 h-3.5" />
                {task.scheduledTime}
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className="max-h-[calc(92dvh-210px)] space-y-4 overflow-y-auto px-6 py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ borderTop: '1px solid #F0EDE4' }}
          >
            {/* Description */}
            {task.description && (
              <div
                className="rounded-xl p-3.5"
                style={{ backgroundColor: '#F9F8F5' }}
              >
                <p
                  className="text-[13px] leading-relaxed"
                  style={{ color: '#5C5852' }}
                >
                  {task.description}
                </p>
              </div>
            )}

            {/* Groups & Workers */}
            {(task.groups.length > 0 || task.workers.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {task.groups.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5" style={{ color: '#9C9890' }} />
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#9C9890' }}>المجموعات</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {task.groups.map((g, index) => (
                        <span key={g.id || index} className="text-[11px] font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}>{g.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {task.workers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5" style={{ color: '#9C9890' }} />
                      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#9C9890' }}>العمال</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {task.workers.map((w) => (
                        <div key={w.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: '#F0EDE4' }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#2D6A4F' }}>{w.initial}</div>
                          <span className="text-[11px] font-medium" style={{ color: '#5C5852' }}>{w.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Report form (only for editable tasks) ── */}
            {isEditable && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: '#FFF8F0', border: '1px solid #F4A261' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" style={{ color: '#F4A261' }} />
                  <h4 className="text-[14px] font-semibold" style={{ color: '#2C2A24' }}>
                    التقرير <span className="text-[11px] font-normal" style={{ color: '#9C9890' }}>(مطلوب عند الإنهاء)</span>
                  </h4>
                </div>

                {/* Report title */}
                <input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={`تقرير: ${task.title}`}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E0D8', color: '#2C2A24' }}
                  disabled={isCompleting}
                />

                {/* Report description */}
                <textarea
                  rows={2}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="وصف التقرير..."
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none resize-none"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E0D8', color: '#2C2A24' }}
                  disabled={isCompleting}
                />

                {/* Type & Severity in one row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] mb-1 font-medium" style={{ color: '#9C9890' }}>النوع</p>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E0D8', color: '#2C2A24' }}
                      disabled={isCompleting}
                    >
                      {REPORT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] mb-1 font-medium" style={{ color: '#9C9890' }}>الخطورة</p>
                    <select
                      value={reportSeverity}
                      onChange={(e) => setReportSeverity(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
                      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E0D8', color: '#2C2A24' }}
                      disabled={isCompleting}
                    >
                      {REPORT_SEVERITIES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Materials adjustment ── */}
            {isEditable && normalizedMaterials.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: '#F0F7FF', border: '1px solid #93C5FD' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  <h4 className="text-[14px] font-semibold" style={{ color: '#2C2A24' }}>
                    المواد المستخدمة
                  </h4>
                </div>
                {normalizedMaterials.map((m) => (
                  <div
                    key={m.material_id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: '#FFFFFF' }}
                  >
                    <span className="text-[13px] font-medium" style={{ color: '#2C2A24' }}>
                      {m.material_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMaterialQuantities((prev) => ({
                            ...prev,
                            [m.material_id]: Math.max(0, m.quantity - 1),
                          }))
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: '#F0EDE4' }}
                        disabled={isCompleting}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={m.quantity}
                        onChange={(e) =>
                          setMaterialQuantities((prev) => ({
                            ...prev,
                            [m.material_id]: Math.max(
                              0,
                              Number(e.target.value) || 0,
                            ),
                          }))
                        }
                        className="w-16 h-8 text-center rounded-md text-[13px] font-mono outline-none"
                        style={{ border: '1px solid #E4E0D8', color: '#2C2A24' }}
                        dir="ltr"
                        disabled={isCompleting}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMaterialQuantities((prev) => ({
                            ...prev,
                            [m.material_id]: m.quantity + 1,
                          }))
                        }
                        className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: '#F0EDE4' }}
                        disabled={isCompleting}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-[11px]" style={{ color: '#9C9890' }}>
                        {m.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed info */}
            {task.status === 'completed' && (
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#D8F3DC' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#2D6A4F' }}>
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#1B4332' }}>
                    تم الإنجاز{task.completedBy ? ` بواسطة ${task.completedBy}` : ''}
                  </p>
                  {task.completedAt && (
                    <p className="text-[11px]" style={{ color: '#2D6A4F' }}>{task.completedAt}</p>
                  )}
                  {task.report_id && (
                    <p className="text-[11px] mt-1" style={{ color: '#2D6A4F' }}>
                      تم إنشاء تقرير مرتبط
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Skipped info */}
            {task.status === 'skipped' && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#F0EDE4' }}>
                <p className="text-[13px] font-medium" style={{ color: '#5C5852' }}>تم تخطي المهمة</p>
                {task.skipNote && (
                  <p className="text-[12px] mt-1" style={{ color: '#9C9890' }}>السبب: {task.skipNote}</p>
                )}
              </div>
            )}

            {/* Notes */}
            {isEditable && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#9C9890' }}>ملاحظات</p>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                  style={{ backgroundColor: '#F9F8F5', border: '1px solid #E4E0D8', color: '#2C2A24' }}
                  placeholder="أضف ملاحظات..."
                  disabled={isCompleting || isSkipping}
                />
              </div>
            )}

            {isLoading && (
              <p className="text-[12px]" style={{ color: '#9C9890' }}>جاري تحميل تفاصيل المهمة...</p>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-2 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            style={{ borderTop: '1px solid #F0EDE4' }}
          >
            {isEditable ? (
              <>
                <button
                  onClick={handleSkip}
                  disabled={!canSkip || isSkipping || isCompleting}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#FFF4EF] disabled:opacity-50"
                  style={{ color: '#E76F51' }}
                >
                  <SkipForward className="w-4 h-4" />
                  {isSkipping ? 'جارٍ التخطي...' : 'تخطي'}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canComplete || isCompleting || isSkipping}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold cursor-pointer transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2D6A4F' }}
                >
                  <Check className="w-4 h-4" />
                  {isCompleting ? 'جارٍ الحفظ...' : 'إنهاء المهمة'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors hover:bg-[#F0EDE4]"
                style={{ color: '#5C5852', border: '1px solid #E4E0D8' }}
              >
                إغلاق
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isSkipConfirmOpen}
        title="تأكيد تخطي المهمة"
        description="هل أنت متأكد من تخطي هذه المهمة؟ يمكن إضافة السبب في الملاحظات."
        confirmLabel={isSkipping ? 'جارٍ التخطي...' : 'تأكيد التخطي'}
        cancelLabel="إلغاء"
        confirmVariant="danger"
        isLoading={isSkipping}
        onOpenChange={setIsSkipConfirmOpen}
        onConfirm={handleSkipConfirm}
      />
    </>
  );
}

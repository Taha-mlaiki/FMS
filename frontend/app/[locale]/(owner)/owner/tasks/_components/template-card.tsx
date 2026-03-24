'use client';

import {
  Calendar,
  Clock,
  Edit2,
  Layers,
  Repeat,
  Trash2,
  Users,
  Pause,
  Play,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

/* ── Types ── */

export type TemplateCardData = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  category_name?: string;
  categoryName?: string;
  category_color?: string;
  categoryColor?: string;
  category_id?: string;
  priority?: string;
  time_of_day?: string;
  timeOfDay?: string;
  is_active?: boolean;
  isActive?: boolean;
  workers?: Array<{ id: string; name: string }>;
  groups?: Array<{ id: string; name: string }>;
  recurrence?: string;
  scheduled_date?: string;
  scheduledDate?: string;
  created_at?: string;
  createdAt?: string;
};

type Props = {
  template: TemplateCardData;
  onEdit?: (template: TemplateCardData) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  canEdit?: boolean;
};

/* ── Constants (non-translatable) ── */

const categoryColors: Record<string, { bg: string; text: string }> = {
  feeding: { bg: '#FFF4EF', text: '#E76F51' },
  cleaning: { bg: '#EEF7FF', text: '#3B82F6' },
  vaccination: { bg: '#FEF9E7', text: '#D4A017' },
  health_check: { bg: '#F0FAF3', text: '#2D6A4F' },
  maintenance: { bg: '#F5F3FF', text: '#7C3AED' },
  general: { bg: '#F0EDE4', text: '#5C5852' },
};

const priorityColorMap: Record<string, string> = {
  low: '#9C9890',
  medium: '#F4A261',
  high: '#E76F51',
  critical: '#DC2626',
};

const recurrenceColors: Record<string, { bg: string; text: string }> = {
  daily: { bg: '#D8F3DC', text: '#1B4332' },
  weekly: { bg: '#EEF7FF', text: '#1E40AF' },
  monthly: { bg: '#F5F3FF', text: '#5B21B6' },
  yearly: { bg: '#FEF9E7', text: '#D4A017' },
  specific_dates: { bg: '#F0EDE4', text: '#5C5852' },
  once: { bg: '#F0EDE4', text: '#5C5852' },
};

/* ── Helpers ── */

function getRecurrenceType(t: TemplateCardData): string {
  return t.recurrence || 'daily';
}

function getTime(t: TemplateCardData): string {
  const raw = t.time_of_day ?? t.timeOfDay;
  if (!raw) return '--:--';
  return raw.slice(0, 5);
}

function getIsActive(t: TemplateCardData): boolean {
  return t.is_active ?? t.isActive ?? true;
}

function getWorkerCount(t: TemplateCardData): number {
  return (t.workers || []).length;
}

function getGroupCount(t: TemplateCardData): number {
  return (t.groups || []).length;
}

/* ── Component ── */

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleActive,
  canEdit = true,
}: Readonly<Props>) {
  const t = useTranslations('tasks.templates');

  const categoryLabels: Record<string, string> = {
    feeding: t('categoryFeeding'),
    cleaning: t('categoryCleaning'),
    vaccination: t('categoryVaccination'),
    health_check: t('categoryHealthCheck'),
    maintenance: t('categoryMaintenance'),
    general: t('categoryGeneral'),
  };

  const recurrenceLabels: Record<string, string> = {
    daily: t('recurrenceDaily'),
    weekly: t('recurrenceWeeklyLabel'),
    monthly: t('recurrenceMonthlyLabel'),
    yearly: t('recurrenceYearly') ?? 'سنوي',
    specific_dates: t('recurrenceOnceSingle'),
    once: t('recurrenceOnceSingle'),
  };

  const priorityLabels: Record<string, string> = {
    low: t('priorityLow'),
    medium: t('priorityMedium'),
    high: t('priorityHigh'),
    critical: t('priorityCritical'),
  };

  function getRecurrenceSummary(tmpl: TemplateCardData): string {
    const type = tmpl.recurrence || 'daily';
    return recurrenceLabels[type] ?? type;
  }

  const recType = getRecurrenceType(template);
  const isActive = getIsActive(template);
  const categoryName = template.category_name || template.categoryName || template.category || '';
  const categoryColor = template.category_color || template.categoryColor || '';
  const priority = template.priority ?? 'medium';
  const catColor = categoryColors[categoryName.toLowerCase()] ?? categoryColors.general;
  const priColor = priorityColorMap[priority] ?? priorityColorMap.medium;
  const priLabel = priorityLabels[priority] ?? priorityLabels.medium;
  const recColor = recurrenceColors[recType] ?? recurrenceColors.daily;

  return (
    <div
      className={`rounded-2xl transition-all duration-500 blueprint-enter group relative overflow-hidden board-card ${
        !isActive ? 'opacity-50 grayscale' : 'hover:shadow-xl hover:-translate-y-1'
      }`}
      style={{
        backgroundColor: '#FAFCFF',
        border: `2px ${isActive ? 'solid' : 'dashed'} ${isActive ? '#C7D2FE' : '#9C9890'}`,
        backgroundImage: 'radial-gradient(#C7D2FE 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Blueprint Corner Icon (Decoration) */}
      <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 group-hover:rotate-45">
        <Repeat className="w-24 h-24" />
      </div>

      {/* Header */}
      <div className="px-6 pt-6 pb-4 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
               <div
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-125"
                style={{ backgroundColor: priColor }}
                title={priLabel}
              />
              <h3
                className="text-[18px] font-black text-neutral-800 tracking-tight truncate group-hover:text-brand-700 transition-colors"
              >
                {template.title}
              </h3>
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-black px-3.5 py-1.5 rounded-xl border shadow-sm backdrop-blur-sm transition-all hover:scale-105"
                style={{
                   backgroundColor: `${recColor.bg}CC`,
                   color: recColor.text,
                   borderColor: `${recColor.text}30`
                }}
              >
                <Repeat className="w-3.5 h-3.5" />
                {recurrenceLabels[recType] ?? recType}
              </span>

              {categoryName && (
                <span
                  className="text-[11px] font-black px-3.5 py-1.5 rounded-xl border shadow-sm backdrop-blur-sm transition-all hover:scale-105"
                  style={{
                    backgroundColor: categoryColor ? `${categoryColor}15` : `${catColor.bg}CC`,
                    color: categoryColor || catColor.text,
                    borderColor: categoryColor ? `${categoryColor}30` : `${catColor.text}30`
                  }}
                >
                  {categoryLabels[categoryName.toLowerCase()] ?? categoryName}
                </span>
              )}

              {!isActive && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-black px-3.5 py-1.5 rounded-xl bg-neutral-100 text-neutral-500 border border-neutral-200"
                >
                  <Pause className="w-3.5 h-3.5" />
                  {t('paused')}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex items-center gap-1.5 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-lg group-hover:bg-white/80 transition-all">
              <button
                type="button"
                onClick={() => onToggleActive?.(template.id, !isActive)}
                className="p-2.5 rounded-xl hover:bg-white transition-all cursor-pointer group/action hover:shadow-sm"
                title={isActive ? t('pauseTask') : t('activateTask')}
              >
                {isActive ? (
                  <Pause className="w-4 h-4 text-amber-500" />
                ) : (
                  <Play className="w-4 h-4 text-brand-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(template)}
                className="p-2.5 rounded-xl hover:bg-white transition-all cursor-pointer hover:shadow-sm"
                title={t('editBtn')}
              >
                <Edit2 className="w-4 h-4 text-indigo-500" />
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(template.id)}
                className="p-2.5 rounded-xl hover:bg-red-50 transition-all cursor-pointer hover:shadow-sm"
                title={t('deleteBtn')}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {template.description && (
          <div className="mt-4 relative bg-white/30 p-3 rounded-2xl border border-white/40">
            <p
              className="text-[13px] leading-relaxed text-neutral-600 italic line-clamp-2"
            >
              {template.description}
            </p>
          </div>
        )}
      </div>

      {/* Assignment Details */}
      {(getWorkerCount(template) > 0 || getGroupCount(template) > 0) && (
        <div className="px-6 pb-4 pt-1 flex flex-col gap-3 relative z-10">
          {template.groups && template.groups.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
               <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{t('groupsLabel') ?? 'Groups'}:</span>
               {template.groups.map(g => (
                 <span key={g.id} className="text-[11px] px-3 py-1 rounded-xl bg-brand-500/10 text-brand-700 border border-brand-500/20 font-bold transition-all hover:scale-105 hover:bg-brand-500/20">
                   {g.name}
                 </span>
               ))}
            </div>
          )}
          {template.workers && template.workers.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
               <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{t('workersLabel') ?? 'Workers'}:</span>
               {template.workers.map(w => (
                 <div key={w.id} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-700 border border-blue-500/20 font-bold transition-all hover:scale-105 hover:bg-blue-500/20">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-[8px] text-white flex items-center justify-center font-black">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{w.name}</span>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-6 py-4 flex items-center gap-6 flex-wrap border-t border-brand-100/50 bg-white/60 backdrop-blur-md relative z-10"
      >
        <div className="flex items-center gap-2 group/time">
          <Clock className="w-4.5 h-4.5 text-brand-500 transition-transform group-hover/time:rotate-12" />
          <span className="text-[13px] font-mono font-black text-neutral-700">
            {getTime(template)}
          </span>
        </div>

        <div className="flex items-center gap-2 group/cal">
          <Calendar className="w-4.5 h-4.5 text-indigo-500 transition-transform group-hover/cal:-rotate-12" />
          <span className="text-[13px] font-bold text-neutral-600">
            {getRecurrenceSummary(template)}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          {getWorkerCount(template) > 0 && (
            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20 shadow-sm transition-all hover:bg-blue-500/20">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-[12px] font-black text-blue-700">
                {getWorkerCount(template)}
              </span>
            </div>
          )}

          {getGroupCount(template) > 0 && (
            <div className="flex items-center gap-2 bg-brand-500/10 px-3 py-1 rounded-xl border border-brand-500/20 shadow-sm transition-all hover:bg-brand-500/20">
              <Layers className="w-4 h-4 text-brand-600" />
              <span className="text-[12px] font-black text-brand-700">
                {getGroupCount(template)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';

/* ── Global Loading/Error States ── */

/* ── Table Skeleton ── */
export function TableSkeleton({
  cols = 5,
  rows = 5,
}: {
  cols?: number;
  rows?: number;
}) {
  const colWidths = ['40%', '25%', '15%', '12%', '8%'];

  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow:
          '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
      }}
    >
      {/* Header skeleton */}
      <div
        className="flex gap-3 px-5 py-3"
        style={{ backgroundColor: '#F0EDE4' }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full skeleton-pulse"
            style={{
              width: colWidths[i % colWidths.length],
              backgroundColor: '#E4E0D8',
            }}
          />
        ))}
      </div>

      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-3 px-5 py-4 items-center"
          style={{ borderBottom: '1px solid #F0EDE4', minHeight: '52px' }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-3 rounded-full skeleton-pulse"
              style={{
                width: colWidths[colIdx % colWidths.length],
                backgroundColor: '#F0EDE4',
                animationDelay: `${(rowIdx * cols + colIdx) * 60}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Card Grid Skeleton ── */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[16px] overflow-hidden"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow:
              '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          {/* Card header block */}
          <div
            className="h-[80px] skeleton-pulse"
            style={{
              backgroundColor: '#1B4332',
              animationDelay: `${i * 80}ms`,
            }}
          />
          {/* Card body */}
          <div className="p-6 space-y-3">
            <div
              className="h-8 rounded-full skeleton-pulse"
              style={{
                width: '60%',
                backgroundColor: '#F0EDE4',
                animationDelay: `${i * 80 + 100}ms`,
              }}
            />
            <div
              className="h-3 rounded-full skeleton-pulse"
              style={{
                width: '80%',
                backgroundColor: '#F0EDE4',
                animationDelay: `${i * 80 + 150}ms`,
              }}
            />
            <div
              className="h-3 rounded-full skeleton-pulse"
              style={{
                width: '50%',
                backgroundColor: '#F0EDE4',
                animationDelay: `${i * 80 + 200}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card Skeleton ── */
export function KpiCardSkeleton() {
  return (
    <div
      className="rounded-[20px] p-6 space-y-4"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #F0EDE4',
      }}
    >
      <div className="flex justify-between items-start">
        <div
          className="w-12 h-12 rounded-2xl skeleton-pulse"
          style={{ backgroundColor: '#F0EDE4' }}
        />
        <div
          className="w-16 h-6 rounded-full skeleton-pulse"
          style={{ backgroundColor: '#F8F9FA' }}
        />
      </div>
      <div className="space-y-2">
        <div
          className="h-3 rounded-full skeleton-pulse"
          style={{ width: '40%', backgroundColor: '#F0EDE4' }}
        />
        <div
          className="h-8 rounded-full skeleton-pulse"
          style={{ width: '60%', backgroundColor: '#F0EDE4' }}
        />
      </div>
    </div>
  );
}

/* ── Inline API Error ── */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const t = useTranslations('states');
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] p-3"
      style={{
        backgroundColor: '#FFF1F1',
        borderRight: '3px solid #E76F51',
      }}
    >
      <span className="text-[16px]">⚠</span>
      <p className="text-[14px] flex-1" style={{ color: '#E76F51' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[13px] font-medium underline cursor-pointer"
          style={{ color: '#E76F51' }}
        >
          {t('retry')}
        </button>
      )}
    </div>
  );
}

/* ── Permission Denied State ── */
export function PermissionDenied() {
  const t = useTranslations('states');
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <span className="text-[48px]" style={{ color: '#E4E0D8' }}>
        🔒
      </span>
      <h2 className="font-display text-[22px]" style={{ color: '#9C9890' }}>
        {t('permissionDenied')}
      </h2>
    </div>
  );
}

/* ── 404 Farm Not Found ── */
export function FarmNotFound() {
  const t = useTranslations('states');
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <span className="text-[48px]">🌾</span>
      <h2 className="font-display text-[22px]" style={{ color: '#5C5852' }}>
        {t('farmNotFound')}
      </h2>
    </div>
  );
}

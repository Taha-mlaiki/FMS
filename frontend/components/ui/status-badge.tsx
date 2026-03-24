import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClassMap: Record<StatusTone, string> = {
  success: 'bg-[#D8F3DC] text-[#1B4332] border-[#B7E4C7]',
  warning: 'bg-[#FDDCB5] text-[#7A5C00] border-[#F4A261]',
  danger: 'bg-[#FFE4E6] text-[#E76F51] border-[#F8C9CC]',
  info: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
  neutral: 'bg-[#E4E0D8] text-[#5C5852] border-[#D6D0C6]',
};

export function StatusBadge({
  label,
  tone = 'neutral',
  className,
}: Readonly<{
  label: string;
  tone?: StatusTone;
  className?: string;
}>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        toneClassMap[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

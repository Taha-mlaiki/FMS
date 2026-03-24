import { cn } from '@/lib/utils';

export function SkeletonTable({
  cols = 5,
  rows = 5,
  className,
}: Readonly<{
  cols?: number;
  rows?: number;
  className?: string;
}>) {
  const colWidths = ['40%', '25%', '15%', '12%', '8%'];

  return (
    <div
      className={cn('overflow-hidden rounded-[16px] bg-white', className)}
      style={{
        boxShadow:
          '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
      }}
    >
      <div
        className="flex gap-3 px-5 py-3"
        style={{ backgroundColor: '#F0EDE4' }}
      >
        {Array.from({ length: cols }).map((_, idx) => (
          <div
            key={`head-${idx}`}
            className="h-3 rounded-full skeleton-pulse"
            style={{
              width: colWidths[idx % colWidths.length],
              backgroundColor: '#E4E0D8',
            }}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={`row-${row}`}
          className="flex min-h-[52px] items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid #F0EDE4' }}
        >
          {Array.from({ length: cols }).map((_, col) => (
            <div
              key={`cell-${row}-${col}`}
              className="h-3 rounded-full skeleton-pulse"
              style={{
                width: colWidths[col % colWidths.length],
                backgroundColor: '#F0EDE4',
                animationDelay: `${(row * cols + col) * 60}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

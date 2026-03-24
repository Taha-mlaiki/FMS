import { cn } from '@/lib/utils';

export function SkeletonCards({
  count = 6,
  className,
}: Readonly<{
  count?: number;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`card-${index}`}
          className="overflow-hidden rounded-[16px] bg-white"
          style={{
            boxShadow:
              '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
          }}
        >
          <div
            className="h-[80px] skeleton-pulse"
            style={{
              backgroundColor: '#1B4332',
              animationDelay: `${index * 80}ms`,
            }}
          />
          <div className="space-y-3 p-6">
            <div
              className="h-8 w-[60%] rounded-full skeleton-pulse"
              style={{
                backgroundColor: '#F0EDE4',
                animationDelay: `${index * 80 + 100}ms`,
              }}
            />
            <div
              className="h-3 w-[80%] rounded-full skeleton-pulse"
              style={{
                backgroundColor: '#F0EDE4',
                animationDelay: `${index * 80 + 150}ms`,
              }}
            />
            <div
              className="h-3 w-[50%] rounded-full skeleton-pulse"
              style={{
                backgroundColor: '#F0EDE4',
                animationDelay: `${index * 80 + 200}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

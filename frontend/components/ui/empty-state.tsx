import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Readonly<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[16px] bg-white px-6 py-12 text-center',
        className,
      )}
      style={{
        boxShadow:
          '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
      }}
    >
      {icon ? <div className="mb-3">{icon}</div> : null}
      <h3 className="font-display text-[22px]" style={{ color: '#5C5852' }}>
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-[14px]" style={{ color: '#9C9890' }}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

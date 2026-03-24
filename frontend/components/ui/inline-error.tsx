import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function InlineError({
  message,
  onRetry,
  className,
}: Readonly<{
  message: string;
  onRetry?: () => void;
  className?: string;
}>) {
  const t = useTranslations('common');

  return (
    <div
      className={className ?? 'flex items-center gap-3 rounded-[10px] p-3'}
      style={{
        backgroundColor: '#FFF1F1',
        borderRight: '3px solid #E76F51',
      }}
    >
      <span className="text-[16px]">⚠</span>
      <p className="flex-1 text-[14px]" style={{ color: '#E76F51' }}>
        {message}
      </p>
      {onRetry ? (
        <Button
          type="button"
          variant="ghost"
          className="h-auto px-2 py-1 text-[13px] font-medium underline"
          style={{ color: '#E76F51' }}
          onClick={onRetry}
        >
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function PermissionDenied({
  title,
  description,
}: Readonly<{
  title?: string;
  description?: string;
}>) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-24">
      <span className="text-[48px]" style={{ color: '#E4E0D8' }}>
        🔒
      </span>
      <h2 className="font-display text-[22px]" style={{ color: '#9C9890' }}>
        {title}
      </h2>
      {description ? (
        <p className="text-[14px]" style={{ color: '#9C9890' }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '0.75rem',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

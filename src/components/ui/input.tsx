import * as React from 'react';
import { cn } from './utils';

function Input({ className, type = 'text', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const style: React.CSSProperties = { borderRadius: 6 };

  return (
    <input
      type={type}
      style={style}
      className={cn('w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white', className)}
      {...props}
    />
  );
}

export { Input };

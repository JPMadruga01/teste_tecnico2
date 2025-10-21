import * as React from 'react';
import { cn } from './utils';

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const style: React.CSSProperties = { borderRadius: 6 };

  return (
    <textarea
      style={style}
      className={cn('w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white', className)}
      {...props}
    />
  );
}

export { Textarea };

"use client";
import * as React from 'react';
import { cn } from './utils';

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  // prefer block layout for form labels above inputs
  const style: React.CSSProperties = { display: 'block' };

  return (
    <label style={style} className={cn('block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
    </label>
  );
}

export { Label };

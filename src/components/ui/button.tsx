"use client";
import React from 'react';
import { cn } from './utils';

export function Button({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  // Use Tailwind-first classes; fallback inline style kept minimal for non-Tailwind fallback
  const fallbackStyle: React.CSSProperties = {
    borderRadius: 6,
  };

  // Default base classes. Consumers can pass 'btn-primary' to get primary gradient style.
  const base = 'w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm';

  return (
    <button
      style={fallbackStyle}
      className={cn(base, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export const buttonVariants = () => '';

export default Button;

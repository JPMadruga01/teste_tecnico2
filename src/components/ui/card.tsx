import * as React from 'react';
import { cn } from './utils';

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const style: React.CSSProperties = { borderRadius: 8 };

  return (
    <div style={style} className={cn('bg-white rounded-md shadow-sm p-6 border border-gray-100', className)} {...props}>
      {children}
    </div>
  );
}

export { Card };

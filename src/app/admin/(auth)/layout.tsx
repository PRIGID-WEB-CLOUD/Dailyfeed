
import type { ReactNode } from 'react';

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
      {children}
    </div>
  );
}


import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  // This is now a simple passthrough layout for the /admin segment.
  // Protection is handled within the (protected) route group.
  return <>{children}</>;
}

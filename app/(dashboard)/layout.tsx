'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}

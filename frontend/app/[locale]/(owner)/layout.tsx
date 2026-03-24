'use client';

import { Sidebar } from './_components/sidebar';
import { Topbar } from './_components/topbar';
import { useUiStore } from '@/lib/stores/ui.store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF7]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

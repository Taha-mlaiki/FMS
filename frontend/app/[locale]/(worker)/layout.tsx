import { WorkerSidebar } from '@/components/worker/worker-sidebar';
import { WorkerBottomTabBar } from '@/components/worker/worker-bottom-tab-bar';
import { WorkerTopbar } from '@/components/worker/worker-topbar';

export default function WorkerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF7]">
      <WorkerSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <WorkerTopbar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 page-enter md:p-8 md:pb-8">
          {children}
        </main>
        <WorkerBottomTabBar />
      </div>
    </div>
  );
}

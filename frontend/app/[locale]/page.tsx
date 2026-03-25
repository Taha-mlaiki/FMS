'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { TaskManagement } from '@/components/landing/TaskManagement';
import { StockSection } from '@/components/landing/StockSection';
import { Stats } from '@/components/landing/Stats';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <TaskManagement />
        <StockSection />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

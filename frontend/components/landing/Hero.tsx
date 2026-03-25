'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowRight, Play, Sprout, BarChart3, Package } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

function FloatingCard({
  icon: Icon,
  label,
  delay,
  className,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
  className: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className={`absolute hidden lg:flex items-center gap-2 rounded-xl bg-white/90 dark:bg-card/90 backdrop-blur-sm px-4 py-2.5 shadow-lg border border-border/50 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/50">
          <Icon className="h-4 w-4 text-brand-500" />
        </div>
      </motion.div>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

export function Hero() {
  const t = useTranslations('landing.hero');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-20 start-10 h-72 w-72 rounded-full bg-brand-300/10 blur-3xl" />
      <div className="absolute bottom-20 end-10 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #2d6a4f 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-start">
            <AnimatedSection direction="up" delay={0.1}>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-700/30 mb-6">
                <Sprout className="h-3.5 w-3.5" />
                {t('badge')}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.2}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-foreground">
                {t('title1')}{' '}
                <span className="gradient-text">{t('titleHighlight')}</span>
                <br />
                {t('title2')}
              </h1>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.3}>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('description')}
              </p>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.4}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]"
                >
                  {t('cta')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
                </Link>
                <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white/50 dark:bg-card/50 px-6 text-sm font-semibold text-foreground transition-all hover:bg-white hover:shadow-md active:scale-[0.98]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/10">
                    <Play className="h-3 w-3 text-brand-500 ms-0.5" />
                  </div>
                  {t('secondaryCta')}
                </button>
              </div>
            </AnimatedSection>

            {/* Mini stats row */}
            <AnimatedSection direction="up" delay={0.5}>
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start">
                {[
                  { label: t('stat1Label'), value: t('stat1Value') },
                  { label: t('stat2Label'), value: t('stat2Value') },
                  { label: t('stat3Label'), value: t('stat3Value') },
                ].map((stat) => (
                  <div key={stat.label} className="text-center lg:text-start">
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Hero visual */}
          <AnimatedSection direction="left" delay={0.3} className="relative">
            <div className="relative">
              {/* Main dashboard image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/10 border border-border/50"
              >
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&h=960&fit=crop&q=80"
                  alt="SmartKouri Dashboard"
                  width={700}
                  height={480}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </motion.div>

              {/* Floating elements */}
              <FloatingCard
                icon={BarChart3}
                label={t('stat1Label')}
                delay={1.0}
                className="-top-4 -start-4 z-10"
              />
              <FloatingCard
                icon={Package}
                label={t('stat2Label')}
                delay={1.2}
                className="-bottom-4 -end-4 z-10"
              />

              {/* Decorative ring */}
              <div className="absolute -top-6 -end-6 h-24 w-24 rounded-full border-2 border-brand-300/20 -z-10" />
              <div className="absolute -bottom-8 -start-8 h-32 w-32 rounded-full border-2 border-amber-500/10 -z-10" />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

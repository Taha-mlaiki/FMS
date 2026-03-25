'use client';

import { useTranslations } from 'next-intl';
import { Eye, CalendarClock, BarChart3, Package, Users, Smartphone } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from './AnimatedSection';

const featureIcons = [Eye, CalendarClock, BarChart3, Package, Users, Smartphone];

const featureColors = [
  'bg-brand-100 dark:bg-brand-900/40 text-brand-500',
  'bg-amber-200/50 dark:bg-amber-700/20 text-amber-700 dark:text-amber-500',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  'bg-brand-100 dark:bg-brand-900/40 text-brand-500',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
];

export function Features() {
  const t = useTranslations('landing.features');

  const features = Array.from({ length: 6 }, (_, i) => ({
    icon: featureIcons[i],
    color: featureColors[i],
    title: t(`feature${i + 1}Title`),
    desc: t(`feature${i + 1}Desc`),
  }));

  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 start-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-40 end-0 h-80 w-80 rounded-full bg-brand-300/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <AnimatedSection direction="up">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-700/30 mb-4">
              {t('badge')}
            </div>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={0.1}>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              {t('title')}
            </h2>
          </AnimatedSection>
          <AnimatedSection direction="up" delay={0.2}>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
          </AnimatedSection>
        </div>

        {/* Feature grid */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-brand-300/50 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1">
                {/* Icon */}
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4 transition-transform group-hover:scale-110`}>
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>

                {/* Hover gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

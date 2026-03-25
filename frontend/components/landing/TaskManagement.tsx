'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function TaskManagement() {
  const t = useTranslations('landing.tasks');

  const points = [t('point1'), t('point2'), t('point3'), t('point4')];

  return (
    <section id="tasks" className="relative py-24 lg:py-32 overflow-hidden bg-secondary/30">
      {/* Background accent */}
      <div className="absolute top-0 start-0 h-full w-1/3 bg-gradient-to-r from-brand-500/[0.02] to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Image */}
          <AnimatedSection direction="right" className="relative order-2 lg:order-1">
            <div className="relative">
              <motion.div
                whileInView={{ rotate: [0, -1, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/10 border border-border/50"
              >
                <Image
                  src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1200&h=840&fit=crop&q=80"
                  alt="Task Management Interface"
                  width={600}
                  height={420}
                  className="w-full h-auto object-cover"
                />
              </motion.div>

              {/* Floating status card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -end-3 top-8 hidden lg:flex items-center gap-2 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg border border-border/50"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-success/10">
                    <CheckCircle2 className="h-4 w-4 text-status-success" />
                  </div>
                </motion.div>
                <div>
                  <div className="text-xs font-semibold text-foreground">12 Tasks</div>
                  <div className="text-[10px] text-muted-foreground">Completed today</div>
                </div>
              </motion.div>

              {/* Decorative dots */}
              <div className="absolute -bottom-4 -start-4 grid grid-cols-4 gap-2 opacity-20">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <AnimatedSection direction="up">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-900/30 px-4 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-700/30 mb-4">
                <Sparkles className="h-3.5 w-3.5" />
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

            <div className="mt-8 space-y-4">
              {points.map((point, i) => (
                <AnimatedSection key={i} direction="up" delay={0.3 + i * 0.1}>
                  <div className="flex items-start gap-3 group">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 transition-colors group-hover:bg-brand-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                    </div>
                    <span className="text-sm text-foreground leading-relaxed">{point}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

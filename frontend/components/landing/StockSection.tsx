'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CheckCircle2, Package, AlertTriangle } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function StockSection() {
  const t = useTranslations('landing.stock');

  const points = [t('point1'), t('point2'), t('point3'), t('point4')];

  return (
    <section id="stock" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div>
            <AnimatedSection direction="up">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-200/30 dark:bg-amber-700/20 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-500 border border-amber-200/50 dark:border-amber-700/30 mb-4">
                <Package className="h-3.5 w-3.5" />
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
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <span className="text-sm text-foreground leading-relaxed">{point}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <AnimatedSection direction="left" className="relative">
            <div className="relative">
              <motion.div
                whileInView={{ rotate: [0, 1, 0] }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-border/50"
              >
                <Image
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=840&fit=crop&q=80"
                  alt="Stock Management"
                  width={600}
                  height={420}
                  className="w-full h-auto object-cover"
                />
              </motion.div>

              {/* Alert floating card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -start-3 bottom-8 hidden lg:flex items-center gap-2 rounded-xl bg-white/95 dark:bg-card/95 backdrop-blur-sm px-4 py-3 shadow-lg border border-border/50"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-warning/10">
                    <AlertTriangle className="h-4 w-4 text-status-warning" />
                  </div>
                </motion.div>
                <div>
                  <div className="text-xs font-semibold text-foreground">Low Stock</div>
                  <div className="text-[10px] text-muted-foreground">3 items need reorder</div>
                </div>
              </motion.div>

              {/* Decorative ring */}
              <div className="absolute -top-6 -end-6 h-28 w-28 rounded-full border-2 border-amber-500/10 -z-10" />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { motion } from 'framer-motion';

export function CTA() {
  const t = useTranslations('landing.cta');

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection direction="up" scale>
          <div className="relative rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-10 sm:p-16 shadow-xl">
            {/* Decorative corner dots */}
            <div className="absolute top-4 start-4 h-2 w-2 rounded-full bg-brand-500/30" />
            <div className="absolute top-4 end-4 h-2 w-2 rounded-full bg-brand-500/30" />
            <div className="absolute bottom-4 start-4 h-2 w-2 rounded-full bg-brand-500/30" />
            <div className="absolute bottom-4 end-4 h-2 w-2 rounded-full bg-brand-500/30" />

            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 mb-6"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <MessageSquare className="h-8 w-8 text-brand-500" />
              </motion.div>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
              {t('title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.98]"
              >
                {t('button')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180" />
              </Link>
              <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white/50 dark:bg-card/50 px-8 text-sm font-semibold text-foreground transition-all hover:bg-white hover:shadow-md active:scale-[0.98]">
                {t('secondaryButton')}
              </button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

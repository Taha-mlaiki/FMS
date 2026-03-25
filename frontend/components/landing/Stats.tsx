'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Tractor, ListChecks, Wifi, HeadphonesIcon } from 'lucide-react';

const statIcons = [Tractor, ListChecks, Wifi, HeadphonesIcon];

function AnimatedCounter({
  target,
  suffix,
  inView,
}: {
  target: number;
  suffix: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Ease-out curve
      const progress = 1 - Math.pow(1 - step / steps, 3);
      current = Math.min(target * progress, target);
      setCount(current);

      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [inView, target]);

  const display =
    target >= 1000
      ? `${Math.floor(count / 1000)}${count >= 1000 ? ',' : ''}${String(Math.floor(count % 1000)).padStart(count >= 1000 ? 3 : 0, '0')}`
      : target % 1 !== 0
        ? count.toFixed(1)
        : Math.floor(count).toString();

  return (
    <span>
      {target >= 10000
        ? new Intl.NumberFormat().format(Math.floor(count))
        : target % 1 !== 0
          ? count.toFixed(1)
          : Math.floor(count)}
      {suffix}
    </span>
  );
}

export function Stats() {
  const t = useTranslations('landing.stats');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const stats = Array.from({ length: 4 }, (_, i) => ({
    icon: statIcons[i],
    value: parseFloat(t(`stat${i + 1}Value`)),
    suffix: t(`stat${i + 1}Suffix`),
    label: t(`stat${i + 1}Label`),
  }));

  return (
    <section id="about" className="relative py-20 overflow-hidden bg-brand-900">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(82,183,136,0.15),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(244,162,97,0.08),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {t('title')}
          </h2>
        </motion.div>

        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center group"
            >
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 mb-4 transition-all group-hover:bg-white/15 group-hover:scale-110">
                <stat.icon className="h-7 w-7 text-brand-300" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix}
                  inView={inView}
                />
              </div>
              <div className="text-sm text-brand-100/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

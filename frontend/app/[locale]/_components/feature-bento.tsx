'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function FeatureBento() {
    const t = useTranslations('landing.features');

    return (
        <section className="py-24 bg-white text-zinc-900 border-b border-zinc-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-zinc-600 text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1: Flock Management (Spans 2 columns) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm"
                    >
                        <div className="relative z-10 mb-8 md:w-2/3">
                            <h3 className="text-xl font-semibold mb-2">{t('flockMonitoringTitle')}</h3>
                            <p className="text-zinc-600">{t('flockMonitoringDescription')}</p>
                        </div>
                        {/* Real Image rather than abstract UI */}
                        <div className="h-64 rounded-lg bg-white border border-zinc-200 flex flex-col relative z-10 group-hover:translate-y-[-4px] transition-transform duration-500 overflow-hidden shadow-md">
                            <Image
                                src="/images/healthy_flock.png"
                                alt="Healthy Flock"
                                fill
                                quality={100}
                                className="object-cover"
                            />
                        </div>
                        {/* Background flare */}
                        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
                    </motion.div>

                    {/* Feature 2: Tasks */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm"
                    >
                        <div className="relative z-10 mb-8">
                            <h3 className="text-xl font-semibold mb-2">{t('tasksTitle')}</h3>
                            <p className="text-zinc-600 text-sm">{t('tasksDescription')}</p>
                        </div>
                        <div className="h-64 w-full rounded-lg bg-white border border-zinc-200 flex gap-2 overflow-hidden relative z-10 group-hover:translate-y-[-4px] transition-transform duration-500 shadow-md">
                            {/* Real Image Task Mockup */}
                            <Image
                                src="/images/team_planning.png"
                                alt="Team Planning"
                                fill
                                quality={100}
                                className="object-cover"
                            />
                        </div>
                    </motion.div>

                    {/* Feature 3: Inventory & Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm"
                    >
                        <div className="relative z-10 mb-8">
                            <h3 className="text-xl font-semibold mb-2">{t('feedTrackingTitle')}</h3>
                            <p className="text-zinc-600 text-sm">{t('feedTrackingDescription')}</p>
                        </div>
                        <div className="h-64 rounded-lg bg-white border border-zinc-200 flex items-end justify-center relative z-10 overflow-hidden group-hover:translate-y-[-4px] transition-transform duration-500 shadow-md">
                            {/* Real Image Silo */}
                            <Image
                                src="/images/feed_storage.png"
                                alt="Feed Silos"
                                fill
                                quality={100}
                                className="object-cover"
                            />
                        </div>
                    </motion.div>

                    {/* Feature 4: Egg Production (Spans 2 columns) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm"
                    >
                        <div className="relative z-10 mb-8 md:w-2/3">
                            <h3 className="text-xl font-semibold mb-2">{t('productionTrackingTitle')}</h3>
                            <p className="text-zinc-600">{t('productionTrackingDescription')}</p>
                        </div>
                        <div className="h-64 w-full rounded-lg bg-white border border-zinc-200 relative z-10 group-hover:translate-y-[-4px] transition-transform duration-500 flex items-end justify-between overflow-hidden shadow-md">
                            {/* Real Image Chart Mockup */}
                            <Image
                                src="/images/organized_eggs.png"
                                alt="Organized Eggs"
                                fill
                                quality={100}
                                className="object-cover object-bottom"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

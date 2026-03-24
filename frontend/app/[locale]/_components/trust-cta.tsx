'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function TrustCTA() {
    const t = useTranslations('landing.trustCta');

    return (
        <section className="py-32 bg-white text-zinc-900 border-b border-zinc-200 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="flex flex-col items-center text-center">



                    {/* Final CTA Board */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="w-full rounded-3xl bg-emerald-50 border border-emerald-100 p-8 md:p-16 relative overflow-hidden shadow-xl"
                    >
                        {/* Subtle Glow effect behind the CTA for light mode */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg bg-emerald-200/40 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-emerald-950 tracking-tight">
                                {t('title')}
                            </h2>
                            <p className="text-emerald-800/80 text-lg mb-10 text-center">
                                {t('description')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <Link href="/register" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2">
                                        {t('startFreeTrial')}
                                        <ArrowRight className="h-5 w-5 transform rotate-180" />
                                    </Button>
                                </Link>
                                <Link href="#" className="w-full sm:w-auto">
                                    <Button size="lg" variant="outline" className="w-full h-14 px-8 text-base rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors bg-white">
                                        {t('bookDemo')}
                                    </Button>
                                </Link>
                            </div>

                            <p className="text-emerald-600/70 text-sm mt-8">
                                {t('noCreditCard')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
            <footer className="mt-32 border-t border-zinc-900 py-12 text-center text-zinc-600 text-sm">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4 max-w-6xl">
                    <div className="mb-4 md:mb-0">
                        <span className="font-bold text-zinc-300">Mzra3ti</span> &copy; {new Date().getFullYear()}
                    </div>
                    <div className="flex gap-6">
                        <Link href="/login" className="hover:text-zinc-300 transition-colors">{t('footerLogin')}</Link>
                        <Link href="/register" className="hover:text-zinc-300 transition-colors">{t('footerRegister')}</Link>
                    </div>
                </div>
            </footer>
        </section>
    );
}

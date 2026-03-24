'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function ProblemSolution() {
    const t = useTranslations('landing.problemSolution');

    return (
        <section className="py-24 bg-white text-zinc-900 border-b border-zinc-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('title')} <br className="hidden md:block" />
                        <span className="text-zinc-500">{t('titleHighlight')}</span>
                    </h2>
                    <p className="text-zinc-600 text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-stretch pt-12">
                    {/* Problem Side */}
                    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm flex flex-col overflow-hidden group hover:shadow-md transition-shadow duration-500">
                        {/* Image Header */}
                        <div className="relative w-full h-64 overflow-hidden bg-zinc-100">
                            <Image src="/images/messy_papers.png" alt="Messy Papers" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                        </div>
                        {/* Content */}
                        <div className="p-8 flex flex-col flex-grow bg-zinc-50 border-t border-zinc-100">
                            <div className="text-red-600 text-sm font-bold tracking-wide mb-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                {t('oldWay')}
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-zinc-900 tracking-tight">{t('oldWayTitle')}</h3>
                            <p className="text-zinc-600 leading-relaxed text-base">
                                {t('oldWayDescription')}
                            </p>
                        </div>
                    </div>

                    {/* Solution Side */}
                    <div className="rounded-3xl border border-emerald-200 bg-white shadow-lg flex flex-col overflow-hidden group hover:shadow-xl transition-shadow duration-500 md:-translate-y-4">
                        {/* Image Header */}
                        <div className="relative w-full h-64 overflow-hidden bg-emerald-100">
                            <Image src="/images/smart_farm.png" alt="Smart Farm" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent pointer-events-none" />
                        </div>
                        {/* Content */}
                        <div className="p-8 flex flex-col flex-grow bg-emerald-50/80 border-t border-emerald-100">
                            <div className="text-emerald-700 text-sm font-bold tracking-wide mb-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                {t('newWay')}
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-emerald-950 tracking-tight">{t('newWayTitle')}</h3>
                            <p className="text-emerald-800/80 leading-relaxed text-base">
                                {t('newWayDescription')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

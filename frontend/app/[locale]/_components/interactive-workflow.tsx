'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function InteractiveWorkflow() {
    const t = useTranslations('landing.workflow');
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            id: 1,
            title: t('step1Title'),
            description: t('step1Description'),
            color: "bg-blue-500 text-white",
            mockup: (
                <div className="relative w-full h-full">
                    <Image src="/images/team_planning.png" alt="Team Planning" fill className="object-cover rounded-b-xl" />
                </div>
            )
        },
        {
            id: 2,
            title: t('step2Title'),
            description: t('step2Description'),
            color: "bg-amber-500 text-white",
            mockup: (
                <div className="relative w-full h-full">
                    <Image src="/images/worker_inspection.png" alt="Worker Inspection" fill className="object-cover rounded-b-xl" />
                </div>
            )
        },
        {
            id: 3,
            title: t('step3Title'),
            description: t('step3Description'),
            color: "bg-emerald-500 text-white",
            mockup: (
                <div className="relative w-full h-full">
                    <Image src="/images/smart_farm.png" alt="Smart Farm" fill className="object-cover rounded-b-xl" />
                </div>
            )
        }
    ];

    return (
        <section className="py-24 bg-zinc-50 text-zinc-900 border-b border-zinc-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('title')}
                    </h2>
                    <p className="text-zinc-600 text-lg max-w-2xl mx-auto">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Stepper controls */}
                    <div className="flex flex-col gap-6">
                        {steps.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => setActiveStep(idx)}
                                className={`text-left p-6 rounded-2xl border transition-all duration-300 ${activeStep === idx
                                    ? 'bg-white border-zinc-200 shadow-md scale-[1.02]'
                                    : 'bg-zinc-100 border-transparent hover:bg-zinc-200/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4 mb-2">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${activeStep === idx ? step.color : 'bg-zinc-200 text-zinc-500'
                                        }`}>
                                        {step.id}
                                    </div>
                                    <h3 className={`text-xl font-semibold ${activeStep === idx ? 'text-zinc-900' : 'text-zinc-500'}`}>
                                        {step.title}
                                    </h3>
                                </div>
                                <p className={`pr-12 ${activeStep === idx ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                    {step.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Interactive Mockup display */}
                    <div className="rounded-2xl border border-zinc-200 bg-white p-2 h-[400px] shadow-lg relative overflow-hidden flex flex-col">
                        {/* Mockup Top Bar */}
                        <div className="h-10 bg-zinc-100 border-b border-zinc-200 rounded-t-xl flex items-center px-4 gap-2">
                            <div className="h-3 w-3 rounded-full bg-zinc-300" />
                            <div className="h-3 w-3 rounded-full bg-zinc-300" />
                            <div className="h-3 w-3 rounded-full bg-zinc-300" />
                        </div>
                        {/* Dynamic Mockup Content Container */}
                        <div className="flex-1 bg-zinc-50/50 rounded-b-xl relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0"
                                >
                                    {steps[activeStep].mockup}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

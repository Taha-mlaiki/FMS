'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from './logo';

export function HeroSection() {
    const t = useTranslations('hero');
    const [activeCard, setActiveCard] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveCard((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const cardPositions = [
        { y: -80, rotateX: 35, rotateZ: 2, scale: 1.05, zIndex: 30 }, // Top
        { y: 20, rotateX: 45, rotateZ: -5, scale: 1, zIndex: 20 },    // Middle
        { y: 120, rotateX: 55, rotateZ: -12, scale: 0.95, zIndex: 10 } // Bottom
    ];
    return (
        <section className="relative w-full min-h-screen overflow-hidden bg-zinc-50 font-sans flex items-center justify-center pt-20 pb-32">
            {/* Background Ambient Glows (Light Mode) */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/40 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none" />

            {/* Giant Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                <h1 className="text-[18vw] font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-zinc-200 to-zinc-50 tracking-tighter mix-blend-multiply opacity-80 uppercase">
                    Mzra3ti
                </h1>
            </div>

            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            {/* Top Nav/Logo placement block */}
            <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-4 lg:px-12 z-50">
                <div className="flex gap-8 text-sm font-medium text-zinc-500">
                    <span className="cursor-pointer hover:text-zinc-900 pointer-events-auto transition-colors">{t('business')}</span>
                    <span className="cursor-pointer hover:text-zinc-900 pointer-events-auto transition-colors">{t('aboutUs')}</span>
                </div>
                <Logo />
                <div className="flex gap-8 text-sm font-medium text-zinc-500 items-center">
                    <Link href="/login" className="cursor-pointer hover:text-zinc-900 pointer-events-auto transition-colors">{t('login')}</Link>
                    <Link href="/register" className="cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 px-4 py-2 rounded-full pointer-events-auto transition-colors">{t('getStarted')}</Link>
                </div>
            </div>
            <div className="container mt-20 mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex flex-col justify-between">


                {/* Main Content Area */}
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-24 lg:mt-0 lg:absolute lg:inset-0 lg:px-12 xl:px-24">

                    {/* Left Column (Text & Reviews) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full lg:w-[25%] flex flex-col items-center lg:items-start text-center lg:text-left z-20 mb-16 lg:mb-0 mt-32 lg:mt-48"
                    >
                        <p className="text-xl lg:text-2xl text-zinc-800 font-medium leading-snug mb-24 max-w-xs drop-shadow-sm">
                            {t('tagline')}
                        </p>

                        <div className="flex flex-col items-center lg:items-start gap-3">
                            <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-full border-2 border-zinc-50 bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-900">A</div>
                                <div className="w-10 h-10 rounded-full border-2 border-zinc-50 bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-900">J</div>
                                <div className="w-10 h-10 rounded-full border-2 border-zinc-50 bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-900">M</div>
                            </div>
                            <div>
                                <div className="flex items-center text-amber-500 mb-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <div className="text-sm font-medium text-zinc-500">{t('rating')}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Center Column (Floating Cards) */}
                    <div className="w-full lg:w-[50%] h-[500px] lg:h-[700px] relative flex items-center justify-center perspective-[2000px] z-10">
                        {/* Bottom Card (Cow Theme) */}
                        <motion.div
                            initial={cardPositions[2]}
                            animate={cardPositions[(2 - activeCard + 3) % 3]}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                            className="absolute w-[300px] h-[450px] sm:w-[350px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 bg-white p-6 flex flex-col shadow-zinc-300/80 shadow-[0_30px_60px_-15px]"
                        >
                            <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                                <Image
                                    src="/images/real_cow.png"
                                    alt="Premium Dairy Cow"
                                    fill
                                    quality={100}
                                    className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="relative z-10 mt-auto flex justify-between items-end w-full">
                                <div className="font-bold text-2xl text-white tracking-wider drop-shadow-md">{t('cattleHealth')}</div>
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <div className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Middle Card (Chicken Theme) */}
                        <motion.div
                            initial={cardPositions[1]}
                            animate={cardPositions[(1 - activeCard + 3) % 3]}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                            className="absolute w-[300px] h-[450px] sm:w-[350px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 bg-white p-6 flex flex-col shadow-zinc-300/80 shadow-[0_30px_60px_-15px]"
                        >
                            <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                                <Image
                                    src="/images/real_chicken.png"
                                    alt="Healthy Free Range Chicken"
                                    fill
                                    quality={100}
                                    className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            </div>
                            <div className="relative z-10 mt-auto flex justify-between items-end w-full">
                                <div className="font-bold text-2xl text-white tracking-wider drop-shadow-md">{t('flockHealth')}</div>
                                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Top Card (Egg Theme) */}
                        <motion.div
                            initial={cardPositions[0]}
                            animate={cardPositions[(0 - activeCard + 3) % 3]}
                            transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                            className="absolute w-[300px] h-[450px] sm:w-[350px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 bg-white p-8 flex flex-col shadow-zinc-400/80 shadow-[0_40px_80px_-20px]"
                        >
                            <div className="absolute top-6 left-6 w-12 h-8 rounded border border-white/40 bg-white/30 backdrop-blur-md flex items-center justify-center z-10 shadow-sm">
                                <span className="text-zinc-900 text-xs font-bold drop-shadow-sm">PRO</span>
                            </div>
                            <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                                <Image
                                    src="/images/real_egg.png"
                                    alt="Premium Organic Egg"
                                    fill
                                    quality={100}
                                    className="object-cover opacity-95 transition-transform duration-700 hover:scale-105"
                                />
                                {/* Gradient overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            </div>
                            <div className="relative z-10 mt-auto w-full">
                                <div className="text-white/90 text-sm font-semibold mb-1 tracking-widest uppercase drop-shadow-md">{t('dailyTargetProduction')}</div>
                                <div className="font-bold text-4xl text-white tracking-widest drop-shadow-lg" dir="ltr">12,450</div>
                                <div className="font-medium text-lg text-white/80 mt-1 drop-shadow-md">{t('valleyFarms')}</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column (Text & Widget) */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="w-full lg:w-[25%] flex flex-col items-center lg:items-end text-center lg:text-right mt-16 lg:mt-32 z-20"
                    >
                        <p className="text-lg lg:text-xl text-zinc-600 font-medium leading-relaxed mb-16 lg:mb-32 max-w-xs drop-shadow-sm">
                            {t('description')}
                        </p>

                        {/* Data Widget Popout */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="w-64 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200 p-6 shadow-xl relative lg:absolute lg:bottom-12 lg:left-12 xl:left-24"
                        >
                            {/* Connective Line (Only visible on desktop pointing to cards) */}
                            <div className="hidden lg:block absolute -right-16 top-1/2 w-16 border-t border-dashed border-zinc-300 pointer-events-none" />

                            <div className="text-zinc-500 text-sm mb-1 text-right font-medium">{t('production')}</div>
                            <div className="text-3xl font-bold text-zinc-900 text-right mb-1" dir="ltr">98.5<span className="text-xl text-zinc-400 font-medium">%</span></div>
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit text-xs font-semibold mb-6 mr-auto" dir="ltr">
                                2.1% ↑
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-zinc-600 font-medium">{t('barnA')}</span>
                                    </div>
                                    <span className="text-zinc-900 font-bold" dir="ltr">99.2%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <span className="text-zinc-600 font-medium">{t('barnB')}</span>
                                    </div>
                                    <span className="text-zinc-900 font-bold" dir="ltr">97.8%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        <span className="text-zinc-600 font-medium">{t('barnC')}</span>
                                    </div>
                                    <span className="text-zinc-900 font-bold" dir="ltr">96.5%</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}

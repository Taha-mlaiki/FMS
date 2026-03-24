import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LogoProps {
    className?: string;
    light?: boolean;
}

export function Logo({ className = "", light = false }: LogoProps) {
    const t = useTranslations('landing.logo');
    const textColor = light ? "text-white" : "text-zinc-900";

    return (
        <Link href="/" className={`flex items-center gap-2.5 group pointer-events-auto ${className}`}>
            <div className="relative flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                <svg className="w-9 h-9 shadow-md rounded-xl" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="12" fill="url(#mzra3ti_grad)" />
                    {/* Cow / Animal Left */}
                    <path d="M13 28C13 28 12 18 19 18C26 18 25 28 25 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    {/* Chicken / Bird Right */}
                    <path d="M22 28C22 28 24 16 31 16C37 16 36 24 36 28" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
                    <path d="M11 28L38 28" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    {/* Eyes */}
                    <circle cx="18" cy="22" r="1.5" fill="white" />
                    <circle cx="31" cy="20" r="1.5" fill="#A7F3D0" />
                    <defs>
                        <linearGradient id="mzra3ti_grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#10B981" />
                            <stop offset="1" stopColor="#047857" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <div className="flex flex-col">
                <span className={`font-bold text-xl leading-none tracking-tight flex items-center gap-1.5 ${textColor}`}>
                    <span className="text-emerald-500 font-extrabold tracking-tighter">Mzra3ti</span>
                </span>
                <span className="text-[11px] font-semibold text-zinc-400 mt-1 uppercase tracking-widest leading-none">{t('subtitle')}</span>
            </div>
        </Link>
    );
}

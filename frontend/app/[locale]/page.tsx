'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Footprints, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight,
  TrendingUp as TrendingUpIcon,
  Check,
  Bell,
  Info,
  Layers,
  Activity,
  Droplets,
  Calendar,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';

export default function RootPage() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#2D2D2D] selection:bg-[#B7E4C7] selection:text-[#1B4332]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl flex items-center justify-between px-6 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1B4332] rounded-xl flex items-center justify-center">
                <LayoutDashboard className="text-[#B7E4C7] w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#1B4332]">{t('logo')}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-sm font-semibold hover:text-[#1B4332] transition-colors">{t('nav.dashboard')}</Link>
              <Link href="/tasks" className="text-sm font-semibold hover:text-[#1B4332] transition-colors">{t('nav.tasks')}</Link>
              <Link href="/groups" className="text-sm font-semibold hover:text-[#1B4332] transition-colors">{t('nav.animals')}</Link>
              <Link href="/stock" className="text-sm font-semibold hover:text-[#1B4332] transition-colors">{t('nav.stock')}</Link>
              <Link href="/reports" className="text-sm font-semibold hover:text-[#1B4332] transition-colors">{t('nav.analytics')}</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-[#1B4332] hover:bg-white/50 rounded-xl transition-all">
                {t('loginButton')}
              </Link>
              <Link href="/register" className="px-5 py-2.5 text-sm font-bold bg-[#1B4332] text-white rounded-xl hover:shadow-lg hover:shadow-[#1B4332]/20 transition-all">
                {t('registerButton')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B7E4C7]/30 text-[#1B4332] rounded-full text-xs font-bold mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#1B4332] animate-pulse"></span>
                Now 100% Free
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6">
                {t('hero.title').split(t('hero.highlight'))[0]}
                <span className="gradient-text">{t('hero.highlight')}</span>
              </h1>
              <p className="text-lg sm:text-xl text-[#2D2D2D]/70 mb-10 max-w-xl leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="glass-card bg-[#1B4332] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all group">
                  {t('hero.ctaPrimary')}
                  <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </Link>
                <Link href="#features" className="glass-card px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white transition-all">
                  {t('hero.ctaSecondary')}
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="glass-card rounded-[2.5rem] p-3 shadow-2xl relative z-10">
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-inner">
                  <Image 
                    src="/images/landing/hero-visual.png" 
                    alt="Smart Farm Visual" 
                    fill 
                    unoptimized
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/40 to-transparent"></div>
                  
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="glass-card p-4 rounded-2xl backdrop-blur-xl bg-white/40 border-white/40">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mb-1">{t('hero.accent.label')}</h3>
                          <p className="text-xl font-extrabold">{t('hero.accent.value')}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#1B4332] rounded-xl flex items-center justify-center">
                          <TrendingUpIcon className="text-[#B7E4C7] w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex items-end gap-1 h-12">
                        {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#1B4332]/60 rounded-sm" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Element */}
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-3xl shadow-xl z-20 animate-float hidden sm:block bg-white/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1B4332] rounded-2xl flex items-center justify-center">
                    <CheckSquare className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold">24</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Tasks Completed</p>
                  </div>
                </div>
              </div>

              {/* Decorative Blur */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#B7E4C7]/40 blur-3xl rounded-full -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Visibility */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="glass-card p-3 rounded-[2.5rem] shadow-xl relative z-10 bg-white/50">
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-[#f3f4f0]">
                    <Image 
                      src="/images/landing/analytics-preview.png" 
                      alt="Analytics Preview" 
                      fill 
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1B4332]/20 to-transparent"></div>
                  </div>
                </div>

                {/* Floating Stats Cards */}
                <div className="absolute -top-10 -right-6 glass-card p-5 rounded-2xl shadow-lg z-20 animate-float hidden sm:block bg-white/90">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-[#B7E4C7]/30 rounded-lg flex items-center justify-center">
                      <Activity className="text-[#1B4332] w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{t('visibility.overview.title')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-32 bg-[#f3f4f0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1B4332] w-3/4"></div>
                    </div>
                    <div className="h-1.5 w-24 bg-[#f3f4f0] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1B4332] w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-8 -left-6 glass-card p-6 rounded-3xl shadow-lg z-20 hidden sm:block bg-[#1B4332] text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="text-[#B7E4C7] w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded-md">{t('visibility.overview.live')}</span>
                  </div>
                  <p className="text-2xl font-black">1.2k</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase">{t('visibility.overview.items.eggs')}</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block py-1 text-xs font-bold tracking-widest text-[#1B4332] uppercase mb-4">{t('visibility.tag')}</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                {t('visibility.title')}
              </h2>
              <p className="text-lg text-[#2D2D2D]/70 mb-8 leading-relaxed">
                {t('visibility.description')}
              </p>
              <ul className="space-y-4">
                {t.raw('visibility.features').map((feature: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 font-semibold">
                    <div className="w-6 h-6 bg-[#B7E4C7] rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#1B4332]" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tasks - Workflow */}
      <section className="py-24 bg-[#1B4332] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#B7E4C7]/5 -skew-x-12 transform translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block py-1 text-xs font-bold tracking-widest text-[#B7E4C7] uppercase mb-4">{t('tasks.tag')}</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                {t('tasks.title')}
              </h2>
              <p className="text-lg text-white/70 mb-10 leading-relaxed">
                {t('tasks.description')}
              </p>
              
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#B7E4C7] rounded-xl flex items-center justify-center">
                      <Droplets className="text-[#1B4332] w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{t('tasks.items.water.title')}</h4>
                      <p className="text-xs opacity-60 font-medium">{t('tasks.items.water.subtitle')}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10 opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Info className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">{t('tasks.items.feed.title')}</h4>
                      <p className="text-xs opacity-60 font-medium">{t('tasks.items.feed.subtitle')}</p>
                    </div>
                  </div>
                  <div className="w-6 h-6 bg-[#B7E4C7] rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#1B4332]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="glass-card bg-white/10 border-white/20 p-3 rounded-[3rem] shadow-2xl relative">
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-white/5">
                  <Image 
                    src="/images/landing/poultry-operations.png" 
                    alt="Operations" 
                    fill 
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/60 to-transparent"></div>
                </div>

                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-[85%] glass-card bg-white/20 backdrop-blur-2xl border-white/30 p-6 rounded-3xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#B7E4C7] rounded-xl">
                      <Bell className="text-[#1B4332] w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{t('tasks.notification.title')}</span>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed">
                    {t('tasks.notification.content')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock - Management */}
      <section className="py-24 bg-[#f3f4f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="glass-card bg-white p-3 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-[#e5e7eb]">
                  <Image 
                    src="/images/landing/feed-management.png" 
                    alt="Stock Management" 
                    fill 
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-extrabold">{t('stock.inventory.title')}</h3>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-xs">AI</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="p-4 bg-orange-500/90 backdrop-blur-md rounded-2xl flex items-center justify-between border border-orange-400">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="text-white w-5 h-5" />
                          <div>
                            <h4 className="font-bold text-xs">{t('stock.inventory.items.feed')}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{t('stock.inventory.alert')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm">{t('stock.inventory.items.feedStock')}</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-[#B7E4C7] text-[#1B4332] py-4 rounded-2xl font-black text-sm hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg">
                      <ShoppingCart className="w-5 h-5" />
                      {t('stock.inventory.orderBtn')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#B7E4C7]/20 blur-[80px] rounded-full -z-10"></div>
            </div>

            <div>
              <span className="inline-block py-1 text-xs font-bold tracking-widest text-[#1B4332] uppercase mb-4">{t('stock.tag')}</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                {t('stock.title')}
              </h2>
              <p className="text-lg text-[#2D2D2D]/70 mb-10 leading-relaxed">
                {t('stock.description')}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-3xl hover:bg-white transition-all cursor-default bg-white/50 border-white/20">
                  <div className="w-12 h-12 bg-[#1B4332] rounded-2xl flex items-center justify-center mb-6">
                    <TrendingUpIcon className="text-white w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-xl mb-3">{t('stock.features.patterns.title')}</h4>
                  <p className="text-sm opacity-60 leading-relaxed font-medium">
                    {t('stock.features.patterns.description')}
                  </p>
                </div>
                <div className="glass-card p-6 rounded-3xl hover:bg-white transition-all cursor-default bg-white/50 border-white/20">
                  <div className="w-12 h-12 bg-[#B7E4C7] rounded-2xl flex items-center justify-center mb-6">
                    <Calendar className="text-[#1B4332] w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-xl mb-3">{t('stock.features.reorder.title')}</h4>
                  <p className="text-sm opacity-60 leading-relaxed font-medium">
                    {t('stock.features.reorder.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card bg-[#1B4332] text-white p-12 sm:p-20 rounded-[3rem] shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
            <h2 className="text-4xl sm:text-6xl font-extrabold mb-8 leading-tight relative">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-[#B7E4C7]/80 mb-12 max-w-2xl mx-auto leading-relaxed relative">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative">
              <Link href="/register" className="bg-[#B7E4C7] text-[#1B4332] px-10 py-5 rounded-2xl font-black text-lg hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-lg">
                {t('hero.ctaPrimary')}
              </Link>
              <div className="text-sm font-bold opacity-60 mt-4 sm:mt-0 sm:ml-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B7E4C7]"></span>
                {t('cta.footer')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 border-t border-[#f3f4f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#1B4332] rounded-lg rotate-12 flex items-center justify-center">
                  <Footprints className="text-[#B7E4C7] w-5 h-5 -rotate-12" />
                </div>
                <span className="text-xl font-black tracking-tighter text-[#1B4332]">{t('logo')}</span>
              </div>
              <p className="text-[#2D2D2D]/60 font-medium leading-relaxed max-w-xs mb-8">
                {t('footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6">{t('footer.product')}</h4>
              <ul className="space-y-4 text-sm font-bold text-[#2D2D2D]/60">
                <li><Link href="/features" className="hover:text-[#1B4332]">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[#1B4332]">Pricing</Link></li>
                <li><Link href="/mobile" className="hover:text-[#1B4332]">Mobile App</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6">{t('footer.company')}</h4>
              <ul className="space-y-4 text-sm font-bold text-[#2D2D2D]/60">
                <li><Link href="/about" className="hover:text-[#1B4332]">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#1B4332]">Contact</Link></li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-1">
              <h4 className="font-black text-sm uppercase tracking-widest mb-6">{t('footer.subscribe')}</h4>
              <p className="text-xs font-bold text-[#2D2D2D]/40 mb-4">{t('footer.subscribeDesc')}</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email" className="bg-[#f3f4f0] border-none rounded-xl px-4 py-2 text-sm w-full font-bold focus:ring-2 ring-[#B7E4C7] outline-none" />
                <button className="p-2 bg-[#1B4332] text-white rounded-xl">
                  <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#f3f4f0] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest opacity-40">
            <p>{t('footer.copyright')}</p>
            <div className="flex gap-8">
              <Link href="/privacy">{t('footer.privacy')}</Link>
              <Link href="/terms">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

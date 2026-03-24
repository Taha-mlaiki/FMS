'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';

import {
  createFarmSchema,
  type CreateFarmFormData,
} from '@/lib/validations/farm.schema';
import { useCreateFarm } from '@/lib/hooks/use-farm';
import { listFarms } from '@/lib/api/farm';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePreferencesStore } from '@/lib/stores/preferences.store';

// ================================================================
// Onboarding Page — 2-Step Centered Card (Organic Precision)
// ================================================================

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const [step, setStep] = useState<1 | 2>(1);
  const createFarmMutation = useCreateFarm();

  const form = useForm<CreateFarmFormData>({
    resolver: zodResolver(createFarmSchema),
    defaultValues: { name: '', address: '', type: '' },
  });

  /* Step 1 → Step 2 */
  async function handleContinue() {
    const valid = await form.trigger('name');
    if (valid) setStep(2);
  }

  /* Step 2 → Create farm */
  async function handleCreate() {
    const data = form.getValues();
    let created;

    try {
      created = await createFarmMutation.mutateAsync(data);
    } catch {
      return;
    }

    const farms = await listFarms().catch(() => []);
    const fallbackFarm = created?.farm
      ? {
          id: created.farm.id,
          name: created.farm.name,
          location: created.farm.address,
          address: created.farm.address,
          schemaName: created.farm.schemaName,
          status: created.farm.status,
          createdAt: created.farm.createdAt,
          role: 'OWNER' as const,
        }
      : null;
    const effectiveFarms =
      farms.length > 0 ? farms : fallbackFarm ? [fallbackFarm] : [];
    const newFarmId =
      created?.farm?.id ??
      effectiveFarms.find((farm) => farm.name === data.name)?.id;

    if (newFarmId) {
      const targetFarm = effectiveFarms.find((farm) => farm.id === newFarmId);
      usePreferencesStore.getState().setLastActiveFarmId(newFarmId);
      useAuthStore.getState().setFarms(
        effectiveFarms.map((farm) => ({
          id: farm.id,
          name: farm.name,
          location: farm.location ?? farm.address,
          address: farm.address ?? farm.location,
          schema_name: farm.schemaName,
          status: farm.status,
          created_at: farm.createdAt,
          role: farm.role,
        })),
      );
      useAuthStore.getState().setActiveFarm(newFarmId, targetFarm?.role);
    }

    router.push('/owner/dashboard');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      dir="rtl"
      style={{ backgroundColor: '#FAFAF7' }}
    >
      {/* Top bar – logo only */}
      <div className="fixed top-0 right-0 left-0 h-[56px] flex items-center justify-center">
        <span className="font-display text-[22px]" style={{ color: '#0D2818' }}>
          🌿 FMS
        </span>
      </div>

      {/* Step indicator — 2 dots */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-[10px] h-[10px] rounded-full transition-colors"
          style={{ backgroundColor: '#2D6A4F' }}
        />
        <div
          className="w-[40px] h-[1px]"
          style={{ backgroundColor: '#E4E0D8' }}
        />
        <div
          className="w-[10px] h-[10px] rounded-full transition-colors"
          style={{
            backgroundColor: step === 2 ? '#2D6A4F' : 'transparent',
            border: step === 2 ? 'none' : '2px solid #E4E0D8',
          }}
        />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[520px] rounded-[24px] overflow-hidden page-enter"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow:
            '0 1px 3px rgba(15,14,12,0.06), 0 4px 16px rgba(15,14,12,0.06)',
        }}
      >
        <div className="p-10">
          {/* ── Step 1 — Farm Details ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h1
                  className="font-display text-[28px] mb-2"
                  style={{ color: '#2C2A24' }}
                >
                  {t('step1Title')}
                </h1>
                <p className="text-[15px]" style={{ color: '#5C5852' }}>
                  {t('step1Subtitle')}
                </p>
              </div>

              {/* Farm Name */}
              <div className="space-y-2">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('farmNameLabel')} <span style={{ color: '#E76F51' }}>*</span>
                </label>
                <input
                  placeholder={t('farmNamePlaceholder')}
                  className="w-full h-[48px] px-4 rounded-[10px] text-[15px] outline-none transition-colors"
                  style={{
                    backgroundColor: '#F0EDE4',
                    border: `1px solid ${form.formState.errors.name ? '#E76F51' : '#E4E0D8'}`,
                    color: '#2C2A24',
                  }}
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-[13px]" style={{ color: '#E76F51' }}>
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label
                  className="text-[13px] font-medium"
                  style={{ color: '#5C5852' }}
                >
                  {t('locationLabel')}{' '}
                  <span className="text-[11px]" style={{ color: '#9C9890' }}>
                    ({t('optional')})
                  </span>
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
                    style={{ color: '#9C9890' }}
                  />
                  <input
                    placeholder={t('locationPlaceholder')}
                    className="w-full h-[48px] pr-10 pl-4 rounded-[10px] text-[15px] outline-none transition-colors"
                    style={{
                      backgroundColor: '#F0EDE4',
                      border: '1px solid #E4E0D8',
                      color: '#2C2A24',
                    }}
                    {...form.register('address')}
                  />
                </div>
              </div>

              {/* Continue button */}
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-[48px] rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#2D6A4F' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1B4332';
                  e.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(45,106,79,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D6A4F';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {t('continue')}
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2 — Confirmation ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h1
                  className="font-display text-[28px] mb-2"
                  style={{ color: '#2C2A24' }}
                >
                  {t('step2Title')}
                </h1>
              </div>

              {/* Summary card */}
              <div
                className="rounded-[16px] p-5 space-y-3"
                style={{ backgroundColor: '#F0EDE4' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[20px]">🌿</span>
                  <span
                    className="font-display text-[22px]"
                    style={{ color: '#2C2A24' }}
                  >
                    {form.getValues('name')}
                  </span>
                </div>
                <p
                  className="text-[14px]"
                  style={{
                    color: form.getValues('address') ? '#5C5852' : '#9C9890',
                  }}
                >
                  {form.getValues('address') || t('noLocation')}
                </p>
              </div>

              {/* Role badge */}
              <div className="flex items-center gap-2">
                <span className="text-[14px]" style={{ color: '#5C5852' }}>
                  {t('yourRole')}
                </span>
                <span
                  className="text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: '#D8F3DC', color: '#1B4332' }}
                >
                  {t('owner')}
                </span>
              </div>

              {/* Create Farm button */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={createFarmMutation.isPending}
                className="w-full h-[48px] rounded-[10px] text-white text-[15px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: '#2D6A4F' }}
                onMouseEnter={(e) => {
                  if (!createFarmMutation.isPending) {
                    e.currentTarget.style.backgroundColor = '#1B4332';
                    e.currentTarget.style.boxShadow =
                      '0 4px 20px rgba(45,106,79,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2D6A4F';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {createFarmMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('createFarm')
                )}
              </button>

              {/* Go back */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-[14px] font-medium cursor-pointer"
                style={{ color: '#2D6A4F' }}
              >
                {t('goBack')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

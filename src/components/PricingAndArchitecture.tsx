import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Database,
  Lock,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { Language, PlanTier, SubscriptionPlanConfig } from '../types';
import { translations } from '../i18n';
import { FIRESTORE_COLLECTIONS_SCHEMA, FIRESTORE_RULES_REFERENCE } from '../utils/security';

interface PricingViewProps {
  lang: Language;
  plans: SubscriptionPlanConfig[];
  currentUserPlan?: PlanTier;
  onSelectPlanForDemoUser?: (planId: PlanTier) => void;
  onSimulateWebhookCheck: (planId: PlanTier) => void;
  demoWebhookMessage: string | null;
}

export const PricingView: React.FC<PricingViewProps> = ({
  lang,
  plans,
  currentUserPlan,
  onSelectPlanForDemoUser,
  onSimulateWebhookCheck,
  demoWebhookMessage,
}) => {
  const t = translations[lang];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {lang === 'uz'
            ? 'Tariflar: Pro Obuna ($5/oy yoki $55/yil) va Employer Pro ($44/oy)'
            : lang === 'ru'
            ? 'Тарифы: Pro Подписка ($5/мес или $55/год) и Employer Pro ($44/мес)'
            : 'Subscription Plans: Pro ($5/mo or $55/yr) & Employer Pro ($44/mo)'}
        </h1>
        <p className="text-sm text-slate-600">
          {lang === 'uz'
            ? 'Ish beruvchilarning to‘g‘ridan-to‘g‘ri telefon raqamlari va Telegram manzillari faqat Pro obunachilar uchun ochiladi.'
            : 'Direct employer phone numbers and Telegram contacts are unlocked exclusively for Pro subscribers.'}
        </p>
      </div>

      {/* Honest Demo Payment Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <div className="font-semibold">{t.paymentDemoNotice}</div>
          <p>
            Sinov rejimida Pro obunachilar uchun telefon raqam va Telegram ochilishini tekshirib ko‘rish uchun quyidagi “Sinov uchun Pro rejimni yoqish” tugmasidan foydalanishingiz mumkin.
          </p>
        </div>
      </div>

      {demoWebhookMessage && (
        <div className="p-4 bg-slate-900 text-white rounded-xl text-xs font-mono flex items-center justify-between">
          <span>{demoWebhookMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const title = lang === 'uz' ? plan.nameUz : lang === 'ru' ? plan.nameRu : plan.nameEn;
          const audience =
            lang === 'uz'
              ? plan.targetAudienceUz
              : lang === 'ru'
              ? plan.targetAudienceRu
              : plan.targetAudienceEn;
          const isCurrent = currentUserPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-xl p-6 flex flex-col justify-between space-y-6 ${
                isCurrent ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="text-xs text-slate-500">{audience}</div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    ${plan.priceMonthlyUsd}
                    <span className="text-xs font-normal text-slate-500"> / oyiga</span>
                  </div>
                  {plan.priceYearlyUsd > 0 && (
                    <div className="text-xs font-semibold text-blue-700 font-mono tabular-nums mt-0.5">
                      Yillik obuna: ${plan.priceYearlyUsd} / yiliga
                    </div>
                  )}
                  <div className="text-xs font-mono text-slate-500 tabular-nums mt-0.5">
                    {plan.priceMonthlyUzs.toLocaleString('en-US')} UZS / oy
                  </div>
                </div>

                <ul className="space-y-2.5 pt-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Telefon va Telegram:{' '}
                      <strong>
                        {plan.id === 'pro-seeker' || plan.id === 'employer-pro'
                          ? 'Ochiq (Ko‘rinadi)'
                          : 'Berkitilgan'}
                      </strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Vakansiya limiti: <strong className="font-mono">{plan.jobPostLimit} ta</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Tavsiya (Featured):{' '}
                      <strong>{plan.featuredIncluded ? 'Kiritilgan' : 'Kiritilmagan'}</strong>
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                {onSelectPlanForDemoUser && (
                  <button
                    onClick={() => onSelectPlanForDemoUser(plan.id)}
                    className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCurrent ? 'Joriy faol rejim (Sinov)' : 'Sinov uchun ushbu tarifni yoqish'}
                  </button>
                )}
                <button
                  onClick={() => onSimulateWebhookCheck(plan.id)}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {t.simulateCheckout}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ArchitectureViewProps {
  lang: Language;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ lang }) => {
  const [showRules, setShowRules] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {lang === 'uz'
            ? 'Tizim Arxitekturasi, Firebase Sozlash va Xavfsizlik Qoidalari'
            : lang === 'ru'
            ? 'Архитектура Системы, Настройка Firebase и Правила Безопасности'
            : 'System Architecture, Firebase Setup & Security Rules'}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl">
          {lang === 'uz'
            ? 'Ushbu bo‘limda 10 ta Firestore ma’lumotlar to‘plami (collections), RBAC xavfsizlik qoidalari va haqiqiy Firebase loyihasini ulash hamda deployment qilish bo‘yicha texnik yo‘riqnoma keltirilgan.'
            : 'Complete technical specification of the 10 Firestore collections, RBAC security rules, and production deployment steps.'}
        </p>
      </div>

      {/* 10 Collections Schema Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Cloud Firestore Ma’lumotlar Modeli (10 ta To‘plam)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Strict Schema + RBAC</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">To‘plam (Collection)</th>
                <th className="py-3 px-4">Asosiy Maydonlar</th>
                <th className="py-3 px-4">Ruxsat va Xavfsizlik Siyosati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {FIRESTORE_COLLECTIONS_SCHEMA.map((col) => (
                <tr key={col.name} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-blue-700">/{col.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{col.keys}</td>
                  <td className="py-3 px-4 text-slate-700">{col.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Rules & Setup Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Firebase ulash va Ishga tushirish tartibi
              </h3>
            </div>
            <ol className="space-y-3 text-xs text-slate-700 list-decimal pl-4 leading-relaxed">
              <li>
                <strong>Firebase loyiha yaratish:</strong>{' '}
                <span className="font-mono">console.firebase.google.com</span> orqali yangi loyiha oching va{' '}
                <strong>Authentication</strong> (Email/Password hamda Google) va{' '}
                <strong>Cloud Firestore</strong> xizmatlarini yoqing.
              </li>
              <li>
                <strong>Konfiguratsiya:</strong> Loyiha ildizida{' '}
                <span className="font-mono">firebase-applet-config.json</span> faylini joylashtiring (faqat ommaviy SDK identifikatorlari, maxfiy server kalitlari frontendga yozilmaydi).
              </li>
              <li>
                <strong>Xavfsizlik qoidalarini yuklash:</strong> O‘ng tomondagi{' '}
                <span className="font-mono">firestore.rules</span> qoidalarini Firebase Console yoki{' '}
                <span className="font-mono">firebase deploy --only firestore:rules</span> orqali joylashtiring.
              </li>
              <li>
                <strong>Mahalliy ishga tushirish va Build:</strong>{' '}
                <span className="font-mono">npm install && npm run dev</span> (Port 3000), production uchun{' '}
                <span className="font-mono">npm run build</span>.
              </li>
            </ol>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Himoyalangan Xavfsizlik Qatlamlari
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
              <li>Oddiy foydalanuvchi o‘ziga <span className="font-mono">admin</span> rolini yoki <span className="font-mono">verified: true</span> belgisini bera olmaydi.</li>
              <li>Barcha matn maydonlari XSS (<span className="font-mono">&lt;script&gt;</span>) va zararli teglardan tozalanadi.</li>
              <li>Oldindan to‘lov so‘rovchi firibgarlik iboralari avtomatik bloklanadi.</li>
              <li>Bitta foydalanuvchi bitta vakansiyaga takroriy ariza yuborishdan himoyalangan.</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>firestore.rules (Zero-Trust RBAC)</span>
              </div>
              <button
                onClick={() => setShowRules(!showRules)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {showRules ? 'Yashirish' : 'Ko‘rsatish'}
              </button>
            </div>
            {showRules && (
              <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[420px]">
                {FIRESTORE_RULES_REFERENCE}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

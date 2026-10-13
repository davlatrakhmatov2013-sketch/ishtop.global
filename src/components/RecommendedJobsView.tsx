import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Bot,
  CheckCircle2,
  EyeOff,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  ApplicationRecord,
  CareerPreferences,
  JobMatchRecommendation,
  JobRecord,
  Language,
  SavedJobRecord,
  UserRecord,
} from '../types';
import { translations } from '../i18n';
import { computeDeterministicJobRecommendations } from '../utils/aiRecommender';

interface RecommendedJobsViewProps {
  lang: Language;
  jobs: JobRecord[];
  user: UserRecord | null;
  preferences?: CareerPreferences;
  savedJobs: SavedJobRecord[];
  applications: ApplicationRecord[];
  onOpenJob: (job: JobRecord) => void;
  onToggleSaveJob: (jobId: string) => void;
  onDismissJob: (jobId: string) => void;
  onRestoreDismissedJobs: () => void;
  onOpenOnboardingModal: () => void;
}

export const RecommendedJobsView: React.FC<RecommendedJobsViewProps> = ({
  lang,
  jobs,
  user,
  preferences,
  savedJobs,
  applications,
  onOpenJob,
  onToggleSaveJob,
  onDismissJob,
  onRestoreDismissedJobs,
  onOpenOnboardingModal,
}) => {
  const t = translations[lang];
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [aiInsightsMap, setAiInsightsMap] = useState<Record<string, string>>({});
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'ready' | 'fallback'>('idle');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(50);

  const baseRecommendations: JobMatchRecommendation[] = useMemo(() => {
    return computeDeterministicJobRecommendations(jobs, user, preferences, lang);
  }, [jobs, user, preferences, lang, refreshSeed]);

  const visibleRecommendations = useMemo(() => {
    return baseRecommendations.filter((rec) => rec.score >= minScoreFilter);
  }, [baseRecommendations, minScoreFilter]);

  const requestServerAiInsights = async () => {
    if (baseRecommendations.length === 0) return;
    setAiStatus('loading');
    try {
      const topCandidates = baseRecommendations.slice(0, 10).map((rec) => {
        const j = jobs.find((item) => item.id === rec.jobId);
        return {
          id: j?.id,
          title: j?.title,
          category: j?.category,
          city: j?.city,
          country: j?.country,
          skills: j?.skills,
          workMode: j?.workMode,
          salaryMin: j?.salaryMin,
          salaryMax: j?.salaryMax,
          currency: j?.currency,
        };
      });

      const primaryResume = user?.resumes?.find((r) => r.isPrimary) || user?.resumes?.[0];

      const response = await fetch('/api/ai-recommend-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang,
          userProfile: {
            title: primaryResume?.professionalTitle || user?.title || 'Mutaxassis',
            skills: primaryResume?.skills || user?.skills || [],
            sectors: preferences?.sectors || user?.careerPreferences?.sectors || [],
            country: preferences?.country || user?.careerPreferences?.country || 'O‘zbekiston',
            city: preferences?.city || user?.careerPreferences?.city || 'Toshkent',
            experienceCount: primaryResume?.experience?.length || user?.experience?.length || 0,
            languages:
              primaryResume?.languages?.map((l) => l.language) ||
              user?.languages?.map((l) => l.language) || ['O‘zbek', 'Rus'],
          },
          candidateJobs: topCandidates,
        }),
      });

      if (!response.ok) {
        setAiStatus('fallback');
        return;
      }

      const data = await response.json();
      if (Array.isArray(data.recommendations)) {
        const nextMap: Record<string, string> = {};
        for (const item of data.recommendations) {
          if (item.jobId && item.aiInsight) {
            nextMap[item.jobId] = item.aiInsight;
          }
        }
        setAiInsightsMap(nextMap);
        setAiStatus('ready');
      } else {
        setAiStatus('fallback');
      }
    } catch {
      setAiStatus('fallback');
    }
  };

  useEffect(() => {
    requestServerAiInsights();
  }, [lang, refreshSeed, user?.id]);

  const formatJobSalary = (job: JobRecord) => {
    const periodLabel =
      job.salaryPeriod === 'daily'
        ? 'Kunlik'
        : job.salaryPeriod === 'hourly'
        ? 'Soatlik'
        : 'Oylik';
    if (job.isNegotiable || (!job.salaryMin && !job.salaryMax)) {
      return `${t.negotiable} (${periodLabel})`;
    }
    const fmt = (n?: number) => (n ? n.toLocaleString('en-US') : '');
    if (job.salaryMin && job.salaryMax) {
      return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)} ${job.currency} (${periodLabel})`;
    }
    if (job.salaryMin) return `${fmt(job.salaryMin)}+ ${job.currency} (${periodLabel})`;
    return `${fmt(job.salaryMax)} ${job.currency} (${periodLabel})`;
  };

  const dismissedCount = user?.dismissedJobIds?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>
              {lang === 'ru'
                ? '1-МОДУЛЬ: ИИ-ПОДБОР ВАКАНСИЙ И СОВМЕСТИМОСТЬ'
                : lang === 'en'
                ? 'MODULE 1: AI JOB MATCHING & COMPATIBILITY ENGINE'
                : '1-MODUL: AI YORDAMIDA SIZGA MOS VAKANSIYALAR'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {lang === 'ru'
              ? 'Подходящие вам вакансии'
              : lang === 'en'
              ? 'Jobs Recommended For You'
              : 'Sizga mos ishlar'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {lang === 'ru'
              ? 'Рекомендации основаны исключительно на реальных активных вакансиях базы данных с учетом вашей профессии, навыков, резюме, опыта, региона и желаемой зарплаты.'
              : lang === 'en'
              ? 'Grounded strictly on active, verified database listings matched against your selected sectors, skills, resume, experience, location, and salary criteria.'
              : 'Tavsiyalar faqat ma’lumotlar bazasidagi haqiqiy va faol vakansiyalardan tanlangan kasbingiz, rezyumengiz, ko‘nikmalaringiz, tajribangiz hamda hudud tanlovingiz asosida hisoblandi.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenOnboardingModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {lang === 'ru'
                ? 'Изменить сферу и регион'
                : lang === 'en'
                ? 'Change Sector & Location'
                : 'Kasb va hudud tanlovini o‘zgartirish'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRefreshSeed((s) => s + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiStatus === 'loading' ? 'animate-spin' : ''}`} />
            <span>
              {lang === 'ru'
                ? 'Обновить рекомендации'
                : lang === 'en'
                ? 'Refresh Recommendations'
                : 'Tavsiyalarni yangilash'}
            </span>
          </button>
        </div>
      </div>

      {/* Matching Algorithm Status & Filter Bar */}
      <div className="bg-slate-900 text-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <Bot className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            {aiStatus === 'loading'
              ? 'Serverdagi AI model nomzod profili va vakansiyalar mosligini tahlil qilmoqda...'
              : aiStatus === 'ready'
              ? 'AI + Qoidalar algoritmi faol: barcha vakansiyalar bazadagi haqiqiy ID orqali tasdiqlandi.'
              : 'Aqlli moslik algoritmi faol: kasb, ko‘nikma, tajriba, maosh va hudud mezonlari bo‘yicha saralandi.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Minimal moslik:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-xs font-mono"
            >
              <option value={50}>50%+ (Barcha moslar)</option>
              <option value={65}>65%+ (Yaxshi moslik)</option>
              <option value={80}>80%+ (Eng yuqori moslik)</option>
            </select>
          </div>

          {dismissedCount > 0 && (
            <button
              type="button"
              onClick={onRestoreDismissedJobs}
              className="text-blue-300 hover:text-white underline cursor-pointer"
            >
              Yashirilgan ishlarni qaytarish ({dismissedCount})
            </button>
          )}
        </div>
      </div>

      {/* Recommendations List or Empty State */}
      {visibleRecommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <div className="text-base font-bold text-slate-900">
            {lang === 'ru'
              ? 'Пока подходящих вам вакансий не найдено. Попробуйте изменить фильтры'
              : lang === 'en'
              ? 'No matching jobs found for your current criteria. Try adjusting your filters'
              : 'Hozircha sizga mos vakansiya topilmadi. Filtrlaringizni o‘zgartirib ko‘ring'}
          </div>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            {lang === 'ru'
              ? 'Мы никогда не создаем поддельные вакансии. Вы можете расширить выбранные сферы, изменить минимальный порог совместимости или сбросить скрытые вакансии.'
              : lang === 'en'
              ? 'We never fabricate fake listings. Expand your selected career sectors, lower the match threshold, or update your resume skills.'
              : 'Platforma hech qachon soxta vakansiya o‘ylab topmaydi. Kasb va hudud tanlovini kengaytiring yoki minimal moslik foizini pasaytiring.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenOnboardingModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Kasb va hudud tanlovini o‘zgartirish
            </button>
            {minScoreFilter > 50 && (
              <button
                type="button"
                onClick={() => setMinScoreFilter(50)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                50%+ mos ishlarni ko‘rsatish
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleRecommendations.map((rec) => {
            const job = jobs.find((j) => j.id === rec.jobId);
            if (!job) return null;

            const isSaved = savedJobs.some(
              (s) => s.userId === user?.id && s.jobId === job.id
            );
            const hasApplied = applications.some(
              (a) => a.seekerId === user?.id && a.jobId === job.id
            );
            const aiNote = aiInsightsMap[job.id];

            return (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-mono font-bold px-2.5 py-0.5 rounded border ${
                          rec.score >= 80
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                      >
                        {rec.score}% Moslik
                      </span>
                      <span className="text-slate-500">{job.category}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">ID: {job.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">Muddat: {job.deadline}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenJob(job)}
                      className="text-lg font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                    >
                      {job.title}
                    </button>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                      <span className="font-semibold">{job.companyName}</span>
                      <span>·</span>
                      {job.companyVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {t.verifiedCompany}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {t.unverifiedCompany}
                        </span>
                      )}
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {job.city}, {job.country} ({job.exactAddress})
                      </span>
                    </div>
                  </div>

                  <div className="md:text-right shrink-0">
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                      {formatJobSalary(job)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {job.workMode === 'remote'
                        ? t.modeRemote
                        : job.workMode === 'hybrid'
                        ? t.modeHybrid
                        : t.modeOnsite}{' '}
                      · {job.workLanguage}
                    </div>
                  </div>
                </div>

                {/* Why this job matches the seeker */}
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Nima sababdan sizga mos:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-800">
                    {rec.reasons.map((r, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 font-medium">
                        <span className="text-blue-600">•</span> {r}
                      </span>
                    ))}
                  </div>
                  {aiNote && (
                    <div className="pt-1.5 border-t border-blue-200/70 text-xs text-slate-700 flex items-start gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>AI Xulosasi:</strong> {aiNote}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
                    {job.skills.slice(0, 4).map((skill, idx) => (
                      <React.Fragment key={skill}>
                        <span>{skill}</span>
                        {idx < Math.min(job.skills.length, 4) - 1 && (
                          <span className="text-slate-300">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDismissJob(job.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                      title="Qiziq bo‘lmagan ishni yashirish"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Qiziq emas (Yashirish)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSaveJob(job.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                        isSaved
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSaved ? t.savedJob : t.saveJob}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenJob(job)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      {hasApplied ? t.appliedAlready : 'Tafsilotlar va Ariza yuborish'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

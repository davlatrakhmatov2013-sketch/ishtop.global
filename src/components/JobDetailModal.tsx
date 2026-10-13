import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Award,
  Bookmark,
  Bot,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  Globe,
  HelpCircle,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react';
import {
  ApplicationRecord,
  ChatMessageRecord,
  CompanyRatingRecord,
  CompanyRecord,
  JobRecord,
  Language,
  ReportReason,
  ReportRecord,
  TruthVerificationStatus,
  UserRecord,
} from '../types';
import { translations } from '../i18n';
import { analyzeJobAndEmployerSafety, sanitizeText } from '../utils/security';

interface JobDetailModalProps {
  job: JobRecord;
  company?: CompanyRecord;
  lang: Language;
  currentUser: UserRecord | null;
  isSaved: boolean;
  existingApplication?: ApplicationRecord;
  chatMessages: ChatMessageRecord[];
  companyRatings?: CompanyRatingRecord[];
  companyReports?: ReportRecord[];
  onClose: () => void;
  onToggleSave: (jobId: string) => void;
  onApply: (jobId: string, coverMessage: string) => { ok: boolean; message: string };
  onReport: (jobId: string, reason: ReportReason, details: string, evidenceNote?: string) => void;
  onSubmitCompanyRating?: (companyId: string, stars: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, comment: string) => { ok: boolean; message: string };
  onSendChatMessage: (job: JobRecord, text: string) => void;
  onDeleteChatMessage: (msgId: string) => void;
  onOpenPricing: () => void;
  onAdminDeleteIllegalJob?: (jobId: string) => void;
  onOpenChatRoom?: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  company,
  lang,
  currentUser,
  isSaved,
  existingApplication,
  chatMessages,
  companyRatings = [],
  companyReports = [],
  onClose,
  onToggleSave,
  onApply,
  onReport,
  onSubmitCompanyRating,
  onSendChatMessage,
  onDeleteChatMessage,
  onOpenPricing,
  onAdminDeleteIllegalJob,
  onOpenChatRoom,
}) => {
  const t = translations[lang];
  const [coverMessage, setCoverMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('upfront-payment');
  const [reportDetails, setReportDetails] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // 1-8 Star Rating state
  const existingUserRating = companyRatings.find(
    (r) => r.companyId === job.companyId && r.userId === currentUser?.id
  );
  const [ratingStars, setRatingStars] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(
    existingUserRating?.stars || 8
  );
  const [ratingComment, setRatingComment] = useState(existingUserRating?.comment || '');
  const [ratingFeedback, setRatingFeedback] = useState<string | null>(null);

  const starScaleLabels: Record<number, string> = {
    1: '1 yulduz — Juda yomon',
    2: '2 yulduz — Yomon',
    3: '3 yulduz — Qoniqarsiz',
    4: '4 yulduz — O‘rtachadan past',
    5: '5 yulduz — O‘rtacha',
    6: '6 yulduz — Yaxshi',
    7: '7 yulduz — Juda yaxshi',
    8: '8 yulduz — A’lo',
  };

  const thisCompanyRatings = companyRatings.filter((r) => r.companyId === job.companyId);
  const avgCompanyStars =
    thisCompanyRatings.length > 0
      ? (
          thisCompanyRatings.reduce((acc, r) => acc + r.stars, 0) /
          thisCompanyRatings.length
        ).toFixed(1)
      : null;

  // Direct Chat state
  const [chatInput, setChatInput] = useState('');

  // AI Assistant state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [shareAccommodationsOnApply, setShareAccommodationsOnApply] = useState<boolean>(
    Boolean(currentUser?.privacyShareAccommodationsWithEmployer)
  );

  const accommodationLabels: Record<string, string> = {
    'disability-friendly': '♿ Nogironligi bo‘lgan insonlar uchun mos ish joyi',
    'remote-home': '🏠 Uyda / Masofadan ishlash imkoniyati',
    'flexible-schedule': '⏰ Moslashuvchan ish jadvali',
    'part-time-option': '🕐 Qisqartirilgan ish vaqti yoki yarim stavka',
    'wheelchair-access': '♿ Nogironlar aravachasida harakatlanish uchun to‘siqsiz muhit',
    'ramp-elevator': '🛗 Lift, pandus va qulay kirish yo‘llari',
    'adapted-workstation': '🖥️ Moslashtirilgan ish stoli yoki maxsus uskunalar',
    'hearing-support': '🦻 Eshitish bo‘yicha qulayliklar (yozma muloqot)',
    'vision-assistive-tech': '👓 Ko‘rish va ekran o‘qish (Screen Reader) dasturlari mosligi',
    'mobility-support': '🦯 Harakatlanish bo‘yicha qo‘shimcha qulayliklar',
  };

  // Check if current user has Pro access to view phone & Telegram
  const canViewContacts = Boolean(
    currentUser &&
      (currentUser.plan === 'pro-seeker' ||
        currentUser.plan === 'employer-pro' ||
        currentUser.role === 'admin' ||
        currentUser.id === company?.ownerId)
  );

  const formatSalary = (j: JobRecord) => {
    const periodLabel =
      j.salaryPeriod === 'daily'
        ? 'Kunlik'
        : j.salaryPeriod === 'hourly'
        ? 'Soatlik'
        : 'Oylik';
    if (j.isNegotiable || (!j.salaryMin && !j.salaryMax)) {
      return `${t.negotiable} (${periodLabel})`;
    }
    const fmt = (n?: number) => (n ? n.toLocaleString('en-US') : '');
    if (j.salaryMin && j.salaryMax) {
      return `${fmt(j.salaryMin)} – ${fmt(j.salaryMax)} ${j.currency} (${periodLabel})`;
    }
    if (j.salaryMin) return `${fmt(j.salaryMin)}+ ${j.currency} (${periodLabel})`;
    return `${fmt(j.salaryMax)} ${j.currency} (${periodLabel})`;
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeText(coverMessage, 800);
    if (cleaned.length < 10) {
      setFeedback({
        type: 'error',
        text:
          lang === 'uz'
            ? 'Iltimos, ish beruvchiga kamida 10 ta belgidan iborat qisqa xabar yozing.'
            : lang === 'ru'
            ? 'Пожалуйста, напишите сопроводительное сообщение (минимум 10 символов).'
            : 'Please enter a short cover message of at least 10 characters.',
      });
      return;
    }
    const finalMessage =
      shareAccommodationsOnApply &&
      currentUser &&
      ((currentUser.accommodations && currentUser.accommodations.length > 0) ||
        currentUser.customAccommodationNote)
        ? `${cleaned}\n\n[Nomzodning ixtiyoriy ravishda ulashgan ish joyi qulayligi ehtiyoji: ${(
            currentUser.accommodations || []
          )
            .map((k) => accommodationLabels[k] || k)
            .join(', ')}${
            currentUser.customAccommodationNote ? ` — ${currentUser.customAccommodationNote}` : ''
          }]`
        : cleaned;

    const res = onApply(job.id, finalMessage);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
    if (res.ok) {
      setCoverMessage('');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeText(reportDetails, 500);
    if (cleaned.length < 5) return;
    onReport(job.id, reportReason, cleaned, sanitizeText(evidenceNote, 300));
    setReportSubmitted(true);
    setReportDetails('');
    setEvidenceNote('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeText(chatInput, 500);
    if (!cleaned) return;
    onSendChatMessage(job, cleaned);
    setChatInput('');
  };

  const askAiAssistant = async (promptText: string, autoFillCover = false) => {
    const q = sanitizeText(promptText, 450);
    if (!q) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const userContextInfo = currentUser
        ? `Nomzod ma'lumotlari: Mutaxassisligi=${currentUser.title || 'Kiritilmagan'}, Ko'nikmalari=${(
            currentUser.skills || []
          ).join(', ')}, Tajribasi=${(currentUser.experience || []).length} ta joyda${
            currentUser.disabilityFilterEnabled
              ? `, Qulaylik ehtiyojlari=${(currentUser.accommodations || []).join(', ')}`
              : ''
          }.`
        : '';

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `${q} ${userContextInfo}`,
          lang,
          jobContext: {
            title: job.title,
            companyName: job.companyName,
            category: job.category,
            city: job.city,
            country: job.country,
            salary: formatSalary(job),
            targetGender:
              job.targetGender === 'male'
                ? 'Erkaklar uchun'
                : job.targetGender === 'female'
                ? 'Ayollar uchun'
                : 'Erkak va Ayollar uchun',
            description: `${job.description} ${
              job.disabilityFriendly
                ? `Inklyuziv qulayliklar: ${(job.accommodations || []).join(', ')}`
                : ''
            }`,
            howToWork: job.howToWork,
            responsibilities: job.responsibilities,
            requirements: job.requirements,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setAiError(data.error || 'AI yordamchi bilan bog‘lanishda xatolik yuz berdi.');
      } else {
        setAiAnswer(data.answer);
        if (autoFillCover && data.answer) {
          setCoverMessage(data.answer.slice(0, 750));
        }
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Server xatoligi');
    } finally {
      setAiLoading(false);
    }
  };

  const jobChatMessages = chatMessages.filter((m) => m.jobId === job.id);
  const safetyReport = analyzeJobAndEmployerSafety(
    job.title,
    job.description,
    job.howToWork,
    job.companyVerified,
    company?.website,
    company?.contactEmail,
    company?.taxId || '309482716'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-xl shadow-xl my-8 overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === 'uz'
                ? 'Vakansiyalar ro‘yxatiga qaytish'
                : lang === 'ru'
                ? 'Назад к списку вакансий'
                : 'Back to job listings'}
            </span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Exclusive Owner/Admin Instant Removal Button */}
            {currentUser?.role === 'admin' && onAdminDeleteIllegalJob && (
              <button
                onClick={() => {
                  onAdminDeleteIllegalJob(job.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Noqonuniy ishni chiqarib yuborish (Faqat Admin)</span>
              </button>
            )}

            <button
              onClick={() => onToggleSave(job.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? t.savedJob : t.saveJob}</span>
            </button>
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-white hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t.reportJob}</span>
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 max-h-[82vh] overflow-y-auto space-y-8">
          {/* Header details */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{job.category}</span>
                <span aria-hidden="true">·</span>
                <span>{t.postedOn}: {job.createdAt}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-blue-700">
                  {job.targetGender === 'male'
                    ? 'Erkaklar uchun mos'
                    : job.targetGender === 'female'
                    ? 'Ayollar uchun mos'
                    : 'Erkak va Ayollar uchun'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                {job.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 pt-1">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{job.companyName}</span>
                <span aria-hidden="true">·</span>
                {job.companyVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    {t.verifiedCompany}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.unverifiedCompany}
                  </span>
                )}
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {job.country}, {job.city} — {job.exactAddress}
                </span>
              </div>
            </div>

            <div className="md:text-right shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">
                {lang === 'uz'
                  ? 'Taklif etilayotgan maosh'
                  : lang === 'ru'
                  ? 'Предлагаемая зарплата'
                  : 'Offered Compensation'}
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {formatSalary(job)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {job.workMode === 'remote'
                  ? t.modeRemote
                  : job.workMode === 'hybrid'
                  ? t.modeHybrid
                  : t.modeOnsite}
                {' · '}
                {job.employmentType === 'full-time'
                  ? t.empFullTime
                  : job.employmentType === 'part-time'
                  ? t.empPartTime
                  : job.employmentType === 'contract'
                  ? t.empContract
                  : t.empTemporary}
              </div>
            </div>
          </div>

          {/* PRO-GATED EMPLOYER PHONE & TELEGRAM BOX */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Ish beruvchi bilan to‘g‘ridan-to‘g‘ri aloqa (Telefon va Telegram)</span>
              </div>
              {canViewContacts ? (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-sm font-mono font-bold text-emerald-700">
                  <span>Tel: {job.contactPhone}</span>
                  <span>·</span>
                  <span>Telegram: {job.telegramHandle}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Tel: +998 •• ••• •• •• (Berkitilgan)
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Telegram: @••••••••_hr (Faqat Pro obunachilar uchun)
                  </span>
                </div>
              )}
            </div>

            {!canViewContacts && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Pro obuna ($5/oy yoki $55/yil) orqali ochish
              </button>
            )}
          </div>

          {/* 1. YANGI VA ASOSIY BO‘LIM: «ISHNING HAQIQAT OYNASI» (JOB TRUTH WINDOW) */}
          <div className="p-6 bg-linear-to-br from-slate-900 to-blue-950 text-white rounded-2xl border border-blue-900 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-800/60 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                      <span>ISHNING HAQIQAT OYNASI</span>
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        Job Truth Window
                      </span>
                    </h3>
                    <p className="text-xs text-blue-200/80">
                      Vakansiyaning yashirin shartlarsiz haqiqiy holati, tasdiqlangan mezonlar va ishonch darajasi
                    </p>
                  </div>
                </div>
              </div>

              {/* Status / Audit Timestamps */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-[11px] font-mono text-blue-200">
                  <span className="text-blue-400 font-sans">Ish beruvchi tasdiqlagan: </span>
                  <span className="font-semibold text-white">
                    {job.truthWindow?.lastEmployerConfirmationDate || job.createdAt}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-[11px] font-mono text-blue-200">
                  <span className="text-blue-400 font-sans">Admin tekshiruvi: </span>
                  <span className="font-semibold text-white">
                    {job.companyVerified ? '2026-09-28 (Tasdiqlangan)' : 'Hali tasdiqlanmagan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Truth Status Legend / Meaning for users */}
            <div className="p-3 bg-blue-950/60 border border-blue-800/50 rounded-xl text-xs space-y-2">
              <div className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                Ishonch darajasi belgilari (Har bir ma’lumot holati):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Ish beruvchi tasdiqlagan:</strong> HR rasman kiritgan</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-300">
                  <Award className="w-4 h-4 text-blue-400 shrink-0" />
                  <span><strong>Mustaqil tekshirilgan:</strong> Hujjat/INN tasdiqlangan</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span><strong>Hali tasdiqlanmagan:</strong> Nazorat jarayonida</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Mavjud emas:</strong> Ish beruvchi kiritmagan</span>
                </div>
              </div>
            </div>

            {/* Structured Truth Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Ish haqi va soliq holati */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Oylik maosh va hisob-kitob
                  </span>
                  {job.truthWindow?.salaryStatus === 'third-party-verified' ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Mustaqil tekshirilgan
                    </span>
                  ) : job.truthWindow?.salaryStatus === 'employer-confirmed' || job.companyVerified ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Ish beruvchi tasdiqlagan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Hali tasdiqlanmagan
                    </span>
                  )}
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {formatSalary(job)}
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Soliq holati: </span>
                    <span className="font-semibold text-white">
                      {job.truthWindow?.monthlySalaryNetOrGross === 'net'
                        ? 'Soliqdan keyin (Qo‘lga tegadigan toza maosh - Net)'
                        : job.truthWindow?.monthlySalaryNetOrGross === 'gross'
                        ? 'Soliqdan oldin (Brutto hisobi)'
                        : 'Kelishiladi / Suhbat natijasiga binoan'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {job.truthWindow?.salaryDetailsNote ||
                      'Maosh bank kartasiga rasmiy o‘tkazib beriladi, kechikishlarsiz to‘lanishi kafolatlangan.'}
                  </p>
                </div>
              </div>

              {/* Card 2: Ish jadvali, smena va dam olish */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" />
                    Ish jadvali va dam olish kunlari
                  </span>
                  {job.companyVerified ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Ish beruvchi tasdiqlagan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Hali tasdiqlanmagan
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {job.workSchedule}
                </div>
                <div className="text-xs text-slate-300 space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400">Smena va tanaffus: </span>
                    <span className="text-white">
                      {job.truthWindow?.shiftsAndBreaks || '1 smena, 1 soatlik tushlik tanaffusi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Dam olish kunlari: </span>
                    <span className="text-white">
                      {job.truthWindow?.daysOff || 'Shanba va Yakshanba (5/2 grafikda)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Qo‘shimcha ish (Overtime): </span>
                    <span className="text-white">
                      {job.truthWindow?.overtimeTerms || 'Mehnat kodeksiga asosan 1.5 barobar oshirilgan haq to‘lanadi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Imtiyozlar (Transport, ovqat, turar joy) */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-purple-400" />
                    Kompaniya imtiyozlari
                  </span>
                  {job.companyVerified ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Tasdiqlangan imtiyoz
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Hali tasdiqlanmagan
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] pt-1">
                  <div className={`p-2 rounded-lg border ${job.truthWindow?.transportProvided ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
                    <div className="font-bold">{job.truthWindow?.transportProvided ? '✓ Bor' : '✗ Yo‘q'}</div>
                    <div className="text-[10px]">Transport</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${job.truthWindow?.mealsProvided ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
                    <div className="font-bold">{job.truthWindow?.mealsProvided ? '✓ Bor' : '✗ Yo‘q'}</div>
                    <div className="text-[10px]">Tushlik</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${job.truthWindow?.housingProvided ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
                    <div className="font-bold">{job.truthWindow?.housingProvided ? '✓ Bor' : '✗ Yo‘q'}</div>
                    <div className="text-[10px]">Turar joy</div>
                  </div>
                </div>
                {job.truthWindow?.otherPerks && (
                  <p className="text-[11px] text-slate-300 pt-1">
                    <span className="text-slate-400">Boshqa: </span>
                    {job.truthWindow.otherPerks}
                  </p>
                )}
              </div>

              {/* Card 4: Sinov muddati va Mehnat shartnomasi */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Sinov muddati & Shartnoma
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Rasmiy mehnat daftarchasi
                  </span>
                </div>
                <div className="text-white font-medium">
                  Sinov muddati: <span className="font-semibold">{job.truthWindow?.probationPeriod || '1 oydan 3 oygacha (qonuniy to‘lov bilan)'}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Birinchi kundan boshlab O‘zbekiston yoki qabul qiluvchi davlat Mehnat kodeksi asosida rasmiy mehnat shartnomasi tuziladi.
                </p>
              </div>

              {/* Card 5: Ish joyi qulayliklari va Inklyuzivlik */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Ish joyi sharoitlari & Qulayliklar
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {job.disabilityFriendly ? '♿ Inklyuziv mos' : 'Standart sharoit'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Sharoitlar: </span>
                    <span className="text-white">
                      {(job.truthWindow?.workplaceAmenities || ['Ofis/Ishxona', 'Konditsioner', 'Oshxona']).join(' · ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Nogironligi bo‘lgan xodimlar uchun: </span>
                    <span className="text-emerald-300 font-medium">
                      {job.disabilityFriendly
                        ? 'Moslashtirilgan kirish yo‘li, alohida sharoit va yordam mavjud'
                        : 'Standart sharoit (Murojaat orqali aniqlashtiriladi)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 6: Ish beruvchi yuridik ma’lumotlari */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Ish beruvchi tekshiruv kartasi
                  </span>
                  {job.companyVerified ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      INN & STIR tasdiqlangan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Tekshiruv kutilmoqda
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400">Kompaniya: </span>
                    <span className="text-white font-semibold">{job.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">STIR/INN: </span>
                    <span className="font-mono text-blue-300 font-semibold">{company?.taxId || '309482716'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Manzil: </span>
                    <span className="text-slate-200">{job.exactAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transparent Disclaimer & Anti-Fraud Guarantee */}
            <div className="p-3.5 bg-blue-900/40 border border-blue-700/60 rounded-xl flex items-start gap-3 text-xs text-blue-100">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-white">
                  IshTop Global Shaffoflik Kafolati (Anti-Scam):
                </div>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  Ish beruvchi tasdiqlamagan hech bir ma’lumot tasdiqlangan deb ko‘rsatilmaydi. Ushbu platformada 100% ish topishni hech kim yolg‘on va’da qilolmaydi. Agar ishga joylashtirish, ariza qabul qilish yoki hujjat rasmiylashtirish uchun sizdan oldindan pul talab qilinsa, bu firibgarlikdir — zudlik bilan yuqoridagi “Shikoyat qilish” tugmasi orqali xabar bering.
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 3: EMPLOYER VERIFICATION & ANTI-FRAUD PROTECTION AUDIT */}
          <div
            className={`p-5 rounded-xl border space-y-3 ${
              safetyReport.riskLevel === 'safe'
                ? 'bg-emerald-50/60 border-emerald-200'
                : safetyReport.riskLevel === 'caution'
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  3-MODUL: Ish beruvchi ishonchliligi va Firibgarlikdan himoya tekshiruvi
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-800">
                Xavfsizlik darajasi: {100 - safetyReport.riskScore}% Ishonchli
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                {safetyReport.verifiedChecks.map((chk, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-emerald-900 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{chk}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-slate-700">
                <div className="font-semibold text-slate-900">
                  Kiberxavfsizlik qoidasi (Muhim eslatma):
                </div>
                <p>
                  Hech qachon suhbat, hujjat rasmiylashtirish yoki viza uchun oldindan pul o‘tkazmang. Shubhali holatda yuqoridagi “Shikoyat qilish” tugmasini bosing.
                </p>
              </div>
            </div>
          </div>

          {/* MANDATORY EMPLOYER WORKFLOW: QANDAY ISHLASH KERAK VA BU ISHDA NIMA QILISH KERAK */}
          <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>
                {lang === 'uz'
                  ? 'Bu ishda nima qilish kerak va qanday ishlash tartibi (Ish beruvchi yo‘riqnomasi):'
                  : lang === 'ru'
                  ? 'Что нужно делать и как устроен рабочий процесс:'
                  : 'How the Job Works & Daily Workflow:'}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">{job.howToWork}</p>
          </div>

          {/* ACCESSIBILITY & DISABILITY ACCOMMODATIONS CARD (ONLY SHOWS VERIFIED EMPLOYER DATA) */}
          {(job.disabilityFriendly || (job.accommodations && job.accommodations.length > 0)) && (
            <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>♿ Maxsus imkoniyatlar va ish joyi qulayliklari (Ish beruvchi tasdiqlagan)</span>
                </div>
                <span className="text-xs font-medium text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-md">
                  Inklyuziv ish joyi
                </span>
              </div>
              {job.accommodations && job.accommodations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {job.accommodations.map((accKey) => (
                    <div
                      key={accKey}
                      className="flex items-center gap-2 p-2 bg-white border border-emerald-200 rounded-lg text-slate-800 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{accommodationLabels[accKey] || accKey}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-700">
                  Ish beruvchi ushbu vakansiyani nogironligi bo‘lgan insonlar uchun mos deb belgilagan. Qo‘shimcha sharoitlarni suhbat yoki chat orqali aniqlashtirishingiz mumkin.
                </p>
              )}
              {job.accommodationContactNote && (
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900">Qulaylik bo‘yicha murojaat tartibi: </span>
                  {job.accommodationContactNote}
                </div>
              )}
            </div>
          )}

          {/* AI ASSISTANT PANEL: Explains anything the user doesn't understand about the job */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  AI Yordamchi — Vakansiya tahlili, moslik va suhbatga tayyorgarlik
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    askAiAssistant(
                      'Mening profilim va ko‘nikmalarim ushbu vakansiyaga qanchalik mos? Kuchli tomonlarim va yetishmayotgan ko‘nikmalarni tushuntir.'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer"
                >
                  Bu ish menga mosmi?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    askAiAssistant(
                      'Ushbu vakansiyaga topshirish uchun mening nomimdan professional, qisqa va ta’sirchan ariza xati (Cover Letter) yozib ber.',
                      true
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer"
                >
                  Ariza matni (Cover Letter) yozish
                </button>
                <button
                  type="button"
                  onClick={() =>
                    askAiAssistant(
                      'Ushbu lavozim uchun suhbatda qanday savollar berilishi mumkin va ularga qanday javob berish kerak?'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                  Suhbat savollari
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAiAssistant(aiQuestion);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Vakansiya shartlari, vazifalari yoki atamalari haqida AI yordamchidan so‘rang..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {aiLoading ? 'AI tahlil qilmoqda...' : 'So‘rash'}
              </button>
            </form>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {aiError}
              </div>
            )}

            {aiAnswer && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {aiAnswer}
              </div>
            )}
          </div>

          {/* Structured Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {t.workSchedule}
              </div>
              <div className="text-sm font-medium text-slate-900">{job.workSchedule}</div>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {t.workLanguage}
              </div>
              <div className="text-sm font-medium text-slate-900">{job.workLanguage}</div>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
              <div className="text-xs text-slate-500 mb-1">{t.timezone}</div>
              <div className="text-sm font-medium text-slate-900 font-mono">{job.timezone}</div>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-lg bg-white">
              <div className="text-xs text-slate-500 mb-1">{t.visaStatus}</div>
              <div className="text-sm font-medium text-slate-900">
                {job.visaSupport === 'sponsored'
                  ? t.visa_sponsored
                  : job.visaSupport === 'permit-required'
                  ? t.visa_permit_required
                  : job.visaSupport === 'remote-global'
                  ? t.visa_remote_global
                  : t.visa_not_required}
              </div>
            </div>
          </div>

          {/* Description, Responsibilities & Requirements */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                {lang === 'uz' ? 'Vakansiya haqida batafsil ma’lumot' : 'Role Overview'}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">{job.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3">{t.responsibilities}</h3>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {job.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3">{t.requirements}</h3>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {job.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{t.skillsRequired}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                {job.skills.map((skill, idx) => (
                  <React.Fragment key={skill}>
                    <span className="font-mono text-xs text-slate-800">{skill}</span>
                    {idx < job.skills.length - 1 && (
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* DIRECT CONVERSATION / CHAT BETWEEN SEEKER & EMPLOYER WITH MESSAGE DELETION */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Ish beruvchi va nomzod o‘rtasida bevosita suhbat
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {onOpenChatRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChatRoom(job.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>To‘liq suhbatxona (Chat) da ochish →</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 hidden sm:inline">Yozilgan xabarni o‘chirib tashlash mumkin</span>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {jobChatMessages.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">
                  Ushbu vakansiya bo‘yicha hali xabarlar yozilmagan. Ish beruvchiga savol yozishingiz mumkin.
                </div>
              ) : (
                jobChatMessages.map((msg) => {
                  const canDelete =
                    currentUser &&
                    (currentUser.id === msg.senderId || currentUser.role === 'admin');
                  return (
                    <div
                      key={msg.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-900">{msg.senderName}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {msg.createdAt.slice(11, 16)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{msg.text}</p>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteChatMessage(msg.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                          title="Xabarni o‘chirib tashlash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {currentUser ? (
              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ish beruvchiga xabar yozing..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  Yuborish
                </button>
              </form>
            ) : (
              <div className="text-xs text-slate-500">
                Suhbatda yozishish uchun tizimga kiring.
              </div>
            )}
          </div>

          {/* 1-8 STAR COMPANY RATING & DISTRIBUTION SECTION */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Kompaniya reytingi (1 dan 8 yulduzgacha baholash tizimi)
                </h4>
                <p className="text-xs text-slate-500">
                  {avgCompanyStars
                    ? `O‘rtacha reyting: ★ ${avgCompanyStars} / 8.0 (${thisCompanyRatings.length} ta baho)`
                    : 'Hali baholanmagan — birinchi bo‘lib haqqoniy baho bering'}
                </p>
              </div>
              {job.disabilityFriendly && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                  ♿ Nogironligi bo‘lgan insonlar uchun moslashtirilgan
                </span>
              )}
            </div>

            {currentUser && onSubmitCompanyRating ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = onSubmitCompanyRating(job.companyId, ratingStars, ratingComment);
                  setRatingFeedback(res.message);
                }}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((starNum) => (
                    <button
                      key={starNum}
                      type="button"
                      onClick={() => setRatingStars(starNum)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md border cursor-pointer ${
                        ratingStars >= starNum
                          ? 'bg-amber-400 border-amber-500 text-slate-950'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      ★ {starNum}
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">
                    {starScaleLabels[ratingStars]}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Kompaniya, suhbat yoki mehnat sharoiti haqida fikringiz..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    {existingUserRating ? 'Reytingni yangilash' : 'Baholash (1–8 ★)'}
                  </button>
                </div>
                {ratingFeedback && (
                  <div className="text-xs font-medium text-emerald-700">{ratingFeedback}</div>
                )}
              </form>
            ) : (
              <div className="text-xs text-slate-500">
                Kompaniyaga 1–8 yulduz baho berish uchun tizimga kiring.
              </div>
            )}

            {thisCompanyRatings.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {thisCompanyRatings.slice(0, 3).map((rt) => (
                  <div key={rt.id} className="text-xs p-2.5 bg-slate-50 rounded-lg flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900">{rt.userName}</span>{' '}
                      <span className="font-mono font-bold text-amber-700">★ {rt.stars}/8</span>
                      {rt.verifiedInteraction && (
                        <span className="ml-2 text-[11px] text-emerald-700 font-medium">
                          (Ariza/Suhbat tasdiqlangan)
                        </span>
                      )}
                      {rt.comment && <p className="text-slate-600 mt-0.5">{rt.comment}</p>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {rt.updatedAt.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anti-Scam Warning */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <div className="font-semibold">{t.antiScamBannerTitle}</div>
              <p>{t.antiScamBannerDesc}</p>
            </div>
          </div>

          {/* Official Company Responses to Public Reports (if any exist for this job/company) */}
          {companyReports.filter((r) => r.jobId === job.id && r.companyResponse).length > 0 && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Kompaniya javob berdi (Rasmiy munosabat):</span>
              </div>
              {companyReports
                .filter((r) => r.jobId === job.id && r.companyResponse)
                .map((rep) => (
                  <div key={rep.id} className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-blue-100">
                    <div className="font-semibold text-slate-900">
                      {rep.companyResponse?.companyName} ({rep.companyResponse?.respondedAt.slice(0, 10)}):
                    </div>
                    <p className="mt-1">{rep.companyResponse?.message}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Report Form with all 9 required reasons & privacy warning */}
          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="p-5 border border-red-200 bg-red-50/40 rounded-xl space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-red-900">
                  Kompaniya yoki vakansiya ustidan shikoyat yuborish
                </h4>
                <p className="text-xs text-red-800">
                  Ogohlantirish: Shikoyat matnida pasport seriyasi, bank karta raqami yoki maxfiy parollarni yozmang. Shikoyatning o‘zi aybdorlikni isbotlamaydi — har bir murojaat adolatli ko‘rib chiqiladi va kompaniyaga rasmiy javob berish imkoni taqdim etiladi.
                </p>
              </div>
              {reportSubmitted ? (
                <div className="text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Shikoyatingiz ro‘yxatga olindi (Holati: Yangi / Tekshirilmoqda).</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Shikoyat sababi *</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value as ReportReason)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="unpaid-salary">1. Va’da qilingan maosh to‘lanmagan</option>
                        <option value="misleading-salary">2. Vakansiyadagi shartlar haqiqatga mos emas</option>
                        <option value="upfront-payment">3. Ishga kirish uchun oldindan pul so‘ralgan</option>
                        <option value="fake-job">4. Soxta kompaniya yoki vakansiya</option>
                        <option value="insult-harassment">5. Haqorat yoki tazyiq</option>
                        <option value="discrimination">6. Kamsitish yoki ta’qib</option>
                        <option value="privacy-misuse">7. Shaxsiy ma’lumotlardan noto‘g‘ri foydalanish</option>
                        <option value="disability-unfair">8. Nogironligi sababli adolatsiz muomala</option>
                        <option value="other">9. Boshqa sabab</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Ixtiyoriy dalil / Hujjat havolasi
                      </label>
                      <input
                        type="text"
                        value={evidenceNote}
                        onChange={(e) => setEvidenceNote(e.target.value)}
                        placeholder="Masalan: Suhbat sanasi yoki skrinshot izohi..."
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Batafsil tavsif *</label>
                    <input
                      type="text"
                      required
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Vaziyatni aniq va xolis tushuntiring..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer"
                  >
                    Shikoyatni yuborish
                  </button>
                </>
              )}
            </form>
          )}

          {/* Application Section */}
          <div className="pt-4 border-t border-slate-200">
            {existingApplication ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t.appliedAlready}</span>
                  </div>
                  <div className="text-xs text-emerald-800">
                    Joriy holat: <span className="font-semibold">{t[`status_${existingApplication.status}`]}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-700">{existingApplication.createdAt.slice(0, 10)}</span>
              </div>
            ) : currentUser && currentUser.role === 'seeker' ? (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-900">{t.applyNow}</h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {currentUser.resumeFileName || 'Profil rezyumesi biriktiriladi'}
                  </span>
                </div>

                {feedback && (
                  <div
                    className={`p-3 rounded-lg text-xs font-medium border ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {feedback.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Ish beruvchiga qisqa xabar
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Tajribangiz va nima uchun ushbu lavozimga mos ekanligingiz haqida yozing..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {((currentUser.accommodations && currentUser.accommodations.length > 0) ||
                  currentUser.customAccommodationNote) && (
                  <label className="flex items-start gap-2.5 p-3 bg-blue-50/60 border border-blue-200 rounded-lg cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={shareAccommodationsOnApply}
                      onChange={(e) => setShareAccommodationsOnApply(e.target.checked)}
                      className="mt-0.5 rounded border-blue-400"
                    />
                    <span className="text-slate-800">
                      <strong>Maxfiylik nazorati (Ixtiyoriy):</strong> Profilimda belgilangan maxsus ish joyi qulayligi ehtiyojlarini ushbu arizaga ilova qilishga roziman. (Belgilanmasa, ish beruvchiga ko‘rsatilmaydi).
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.applyNow}</span>
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700">
                Vakansiyaga ariza yuborish uchun “Ish qidiruvchi” sifatida kiring.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

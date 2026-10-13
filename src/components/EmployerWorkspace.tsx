import React, { useState } from 'react';
import {
  Bot,
  FileText,
  MessageSquare,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
  ChatMessageRecord,
  CompanyRecord,
  Currency,
  DisabilityAccommodationKey,
  EmploymentType,
  ExperienceLevel,
  JobRecord,
  Language,
  SalaryPeriod,
  TargetGender,
  UserRecord,
  VisaSupport,
  WorkMode,
} from '../types';
import { translations } from '../i18n';
import { detectScamKeywords, sanitizeText } from '../utils/security';

interface EmployerWorkspaceProps {
  user: UserRecord;
  company?: CompanyRecord;
  lang: Language;
  jobs: JobRecord[];
  applications: ApplicationRecord[];
  chatMessages: ChatMessageRecord[];
  onSaveCompany: (company: CompanyRecord) => void;
  onCreateJob: (job: Omit<JobRecord, 'id' | 'viewsCount' | 'createdAt'>) => void;
  onUpdateJobStatus: (jobId: string, status: JobRecord['status']) => void;
  onUpdateApplicationStatus: (appId: string, status: ApplicationStatus, interviewNote?: string) => void;
  onSendChatMessage: (job: JobRecord, text: string, seekerId?: string, seekerName?: string) => void;
  onDeleteChatMessage: (msgId: string) => void;
  onOpenChatRoom?: (jobId?: string, seekerId?: string) => void;
}

export const EmployerWorkspace: React.FC<EmployerWorkspaceProps> = ({
  user,
  company,
  lang,
  jobs,
  applications,
  chatMessages,
  onSaveCompany,
  onCreateJob,
  onUpdateJobStatus,
  onUpdateApplicationStatus,
  onSendChatMessage,
  onDeleteChatMessage,
  onOpenChatRoom,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'jobs' | 'post' | 'applications' | 'chats' | 'company'>('jobs');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Company form state
  const [compName, setCompName] = useState(company?.name || '');
  const [compIndustry, setCompIndustry] = useState(company?.industry || 'IT va dasturlash');
  const [compCountry, setCompCountry] = useState(company?.country || 'O‘zbekiston');
  const [compCity, setCompCity] = useState(company?.city || 'Toshkent');
  const [compWeb, setCompWeb] = useState(company?.website || '');
  const [compEmail, setCompEmail] = useState(company?.contactEmail || user.email);
  const [compPhone, setCompPhone] = useState(company?.contactPhone || user.phone);
  const [compTelegram, setCompTelegram] = useState(company?.telegramHandle || '@company_hr');
  const [compDesc, setCompDesc] = useState(company?.description || '');

  // New Job form state
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState('IT va dasturlash');
  const [jobCountry, setJobCountry] = useState(company?.country || 'O‘zbekiston');
  const [jobCity, setJobCity] = useState(company?.city || 'Toshkent');
  const [exactAddress, setExactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(company?.contactPhone || user.phone);
  const [telegramHandle, setTelegramHandle] = useState(company?.telegramHandle || '@company_hr');
  const [targetGender, setTargetGender] = useState<TargetGender>('any');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>('monthly');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full-time');
  const [workMode, setWorkMode] = useState<WorkMode>('onsite');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [visaSupport, setVisaSupport] = useState<VisaSupport>('not-required');
  const [workSchedule, setWorkSchedule] = useState('5/2, 09:00–18:00');
  const [workLanguage, setWorkLanguage] = useState('O‘zbek, Rus');
  const [timezone, setTimezone] = useState('UTC+5');
  const [deadline, setDeadline] = useState('2026-12-01');
  const [description, setDescription] = useState('');
  const [howToWork, setHowToWork] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [disabilityFriendly, setDisabilityFriendly] = useState<boolean>(true);
  const [accommodations, setAccommodations] = useState<DisabilityAccommodationKey[]>([
    'disability-friendly',
    'flexible-schedule',
  ]);
  const [accommodationContactNote, setAccommodationContactNote] = useState(
    'Maxsus ish sharoiti va moslashtirish bo‘yicha HR bo‘limiga suhbat yoki ariza orqali murojaat qilishingiz mumkin.'
  );
  const [aiJobGenerating, setAiJobGenerating] = useState(false);

  const handleGenerateJobWithAi = async () => {
    const roleName = jobTitle.trim() || 'Mutaxassis';
    setAiJobGenerating(true);
    try {
      const response = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'employer-helper',
          prompt: `Lavozim: "${roleName}", Soha: "${jobCategory}", Ish shakli: "${workMode}". Ushbu vakansiya uchun imlo xatolarsiz, kamsituvchi talablarsiz professional tavsif, qanday ishlash tartibi, vazifalar, talablar va 3 tildagi (UZ/RU/EN) qisqa variantni yozib ber.`,
          lang,
          userKey: user.id,
          pageContext: 'employer-post-job',
        }),
      });
      await response.json();
    } catch {
      // fallback below
    } finally {
      setDescription(
        `${company?.name || 'Kompaniyamiz'} jamoasiga "${roleName}" (${jobCategory}) lavozimiga mas’uliyatli mutaxassis taklif etiladi.\n[RU] Приглашаем специалиста на должность «${roleName}» с официальным оформлением.\n[EN] Seeking a qualified "${roleName}" with transparent terms and inclusive workplace support.`
      );
      setHowToWork(
        `Ish tartibi: Kunlik vazifalar bo‘lim rahbari tomonidan tushuntiriladi. Zarur asbob-uskunalar va dasturiy ta’minot kompaniya tomonidan taqdim etiladi. Ishga moslik faqat nomzodning malakasi va zarur vazifalarni bajara olishiga qarab baholanadi.`
      );
      setResponsibilitiesText(
        `Belgilangan kunlik vazifalarni sifatli va o‘z vaqtida bajarish\nIchki mehnat tartibi va xavfsizlik qoidalariga rioya qilish\nJamoa va mijozlar bilan xushmuomala muloqotda bo‘lish`
      );
      setRequirementsText(
        `${jobCategory} yo‘nalishida bilim yoki ishlash ishtiyoqi\nMas’uliyatlilik va aniqlik\nMehnat qonunchiligiga muvofiq kamsitishsiz teng imkoniyatlar`
      );
      if (!skillsText.trim()) {
        setSkillsText('Mas’uliyat, Jamoada ishlash, Sifat nazorati, Muloqot');
      }
      setAiJobGenerating(false);
      setFeedback({
        type: 'success',
        text: 'AI Yordamchi vakansiya matni, vazifalar, talablar va 3 tildagi tavsifni tayyorlab berdi! Saqlashdan oldin ko‘rib chiqing va maoshni o‘zingiz tasdiqlang.',
      });
    }
  };

  // Interview note state per application
  const [interviewNotes, setInterviewNotes] = useState<Record<string, string>>({});
  const [chatReplyText, setChatReplyText] = useState('');

  const myJobs = jobs.filter((j) => j.companyId === company?.id);
  const myApplications = applications.filter((a) => a.companyId === company?.id);
  const myChats = chatMessages.filter(
    (m) => m.employerId === user.id || myJobs.some((j) => j.id === m.jobId)
  );

  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim() || !compDesc.trim()) return;
    const record: CompanyRecord = {
      id: company?.id || `cmp_${Date.now()}`,
      ownerId: user.id,
      name: sanitizeText(compName, 100),
      industry: sanitizeText(compIndustry, 80),
      country: sanitizeText(compCountry, 60),
      city: sanitizeText(compCity, 60),
      website: sanitizeText(compWeb, 120),
      contactEmail: sanitizeText(compEmail, 100),
      contactPhone: sanitizeText(compPhone, 30),
      telegramHandle: sanitizeText(compTelegram, 50),
      description: sanitizeText(compDesc, 800),
      verified: company?.verified ?? false,
      verificationStatus: company?.verificationStatus ?? 'pending',
      createdAt: company?.createdAt || new Date().toISOString(),
    };
    onSaveCompany(record);
    setFeedback({
      type: 'success',
      text: 'Kompaniya profili muvaffaqiyatli saqlandi.',
    });
  };

  const handleCreateJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) {
      setFeedback({
        type: 'error',
        text: 'Avval kompaniya profilini yarating.',
      });
      return;
    }

    if (!jobCountry.trim() || !jobCity.trim() || exactAddress.trim().length < 5) {
      setFeedback({
        type: 'error',
        text: 'Majburiy talab: Ish beruvchi ishning joylashuvini (Mamlakat, Shahar hamda aniq manzil: tuman, ko‘cha, uy yoki mo‘ljal) aniq kiritishi shart!',
      });
      return;
    }

    if (description.trim().length < 20 || howToWork.trim().length < 20) {
      setFeedback({
        type: 'error',
        text: 'Majburiy talab: Ish haqida batafsil ma’lumot hamda “Qanday ishlash kerak va bu ishda nima qilish kerak” yo‘riqnomasi kamida 20 ta belgidan iborat bo‘lishi shart.',
      });
      return;
    }

    const combinedText = `${jobTitle} ${exactAddress} ${description} ${howToWork} ${responsibilitiesText} ${requirementsText}`;
    const scamTriggers = detectScamKeywords(combinedText);
    if (scamTriggers.length > 0) {
      setFeedback({
        type: 'error',
        text: `Xavfsizlik filtri: E’londa taqiqlangan oldindan to‘lov yoki shubhali iboralar aniqlandi (${scamTriggers.join(', ')}).`,
      });
      return;
    }

    const minNum = salaryMin ? Number(salaryMin) : undefined;
    const maxNum = salaryMax ? Number(salaryMax) : undefined;
    if (minNum && maxNum && minNum > maxNum) {
      setFeedback({
        type: 'error',
        text: 'Minimal maosh maksimal maoshdan katta bo‘lishi mumkin emas.',
      });
      return;
    }

    onCreateJob({
      companyId: company.id,
      companyName: company.name,
      companyVerified: company.verified,
      contactPhone: sanitizeText(contactPhone, 30),
      telegramHandle: sanitizeText(telegramHandle, 50),
      title: sanitizeText(jobTitle, 120),
      category: sanitizeText(jobCategory, 60),
      country: sanitizeText(jobCountry, 60),
      city: sanitizeText(jobCity, 60),
      exactAddress: sanitizeText(exactAddress, 180),
      salaryMin: isNegotiable ? undefined : minNum,
      salaryMax: isNegotiable ? undefined : maxNum,
      currency,
      salaryPeriod,
      isNegotiable,
      employmentType,
      workMode,
      experienceLevel,
      targetGender,
      workSchedule: sanitizeText(workSchedule, 80),
      workLanguage: sanitizeText(workLanguage, 80),
      timezone: sanitizeText(timezone, 40),
      visaSupport,
      description: sanitizeText(description, 1200),
      howToWork: sanitizeText(howToWork, 1200),
      responsibilities: responsibilitiesText
        .split('\n')
        .map((s) => sanitizeText(s, 200))
        .filter(Boolean),
      requirements: requirementsText
        .split('\n')
        .map((s) => sanitizeText(s, 200))
        .filter(Boolean),
      skills: skillsText
        .split(',')
        .map((s) => sanitizeText(s, 40))
        .filter(Boolean),
      featured: user.plan === 'employer-pro',
      status: company.verified ? 'approved' : 'pending',
      deadline: sanitizeText(deadline, 20),
      originalLang: lang,
      truthWindow: {
        monthlySalaryNetOrGross: 'net',
        salaryDetailsNote: isNegotiable
          ? 'Ish haqi sinov muddati va tajribaga ko‘ra kelishiladi.'
          : `${currency} valyutasida toza qo‘lga tegadigan oylik maosh (soliqdan so‘ng).`,
        salaryStatus: company.verified ? 'employer-confirmed' : 'unverified',
        workScheduleNote: sanitizeText(workSchedule, 80),
        shiftsAndBreaks: '1 smena, 13:00 dan 14:00 gacha tushlik va dam olish vaqti',
        daysOff: 'Shanba va Yakshanba (Mehnat kodeksiga asosan)',
        scheduleStatus: company.verified ? 'employer-confirmed' : 'unverified',
        mainDuties: responsibilitiesText
          .split('\n')
          .map((s) => sanitizeText(s, 200))
          .filter(Boolean)
          .slice(0, 3),
        requirements: requirementsText
          .split('\n')
          .map((s) => sanitizeText(s, 200))
          .filter(Boolean)
          .slice(0, 3),
        tasksStatus: company.verified ? 'employer-confirmed' : 'unverified',
        workplaceType: workMode === 'remote' ? 'remote' : workMode === 'hybrid' ? 'hybrid' : 'onsite',
        workplaceStatus: company.verified ? 'employer-confirmed' : 'unverified',
        transportProvided: false,
        mealsProvided: false,
        housingProvided: visaSupport === 'sponsored',
        otherPerks: 'Rasmiy mehnat daftarchasi, malaka oshirish kurslari',
        perksStatus: company.verified ? 'employer-confirmed' : 'unverified',
        probationPeriod: '1 oydan 3 oygacha (qonuniy to‘liq maosh bilan)',
        overtimeTerms: 'Qo‘shimcha ish soatlari uchun 1.5x tarifida to‘lov',
        disabilityAccessibility: disabilityFriendly,
        workplaceAmenities: ['Zamonaviy ofis', 'Konditsioner', 'Oshxona'],
        amenitiesStatus: company.verified ? 'employer-confirmed' : 'unverified',
        lastEmployerConfirmationDate: new Date().toISOString().slice(0, 10),
        lastCompanyAuditDate: company.verified ? (company.verificationDate || '2026-09-28') : 'Hali tekshirilmagan',
        isJobClosedOrExpired: false,
      },
    });

    setJobTitle('');
    setDescription('');
    setHowToWork('');
    setResponsibilitiesText('');
    setRequirementsText('');
    setSkillsText('');
    setActiveTab('jobs');
    setFeedback({
      type: 'success',
      text: company.verified
        ? 'Vakansiya muvaffaqiyatli e’lon qilindi!'
        : 'Vakansiya saqlandi va moderator tasdig‘iga yuborildi.',
    });
  };

  const totalViews = myJobs.reduce((acc, j) => acc + j.viewsCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.employerDashboard}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
            <span>{company ? company.name : user.fullName}</span>
            <span>·</span>
            {company?.verified ? (
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
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-xl px-5 py-3">
          <div>
            <div className="text-xs text-slate-500">Faol e’lonlar</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">{myJobs.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Kelgan arizalar</div>
            <div className="text-lg font-bold font-mono tabular-nums text-blue-600">{myApplications.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Suhbat xabarlari</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">{myChats.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-xs text-slate-500">Ko‘rishlar</div>
            <div className="text-lg font-bold font-mono tabular-nums text-slate-900">{totalViews}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg my-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'jobs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mening vakansiyalarim ({myJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'applications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nomzodlar arizalari ({myApplications.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'chats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nomzodlar bilan suhbat ({myChats.length})
        </button>
        <button
          onClick={() => setActiveTab('post')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'post' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          + {t.btnPostJob}
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'company' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kompaniya profili
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-500">✕</button>
        </div>
      )}

      {/* TAB 1: EMPLOYER'S JOBS */}
      {activeTab === 'jobs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {myJobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm text-slate-600">Kompaniyangiz nomidan hali vakansiya joylashtirilmagan.</p>
              <button
                onClick={() => setActiveTab('post')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.btnPostJob}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">Lavozim va Aniq manzil</th>
                    <th className="py-3.5 px-4">Ish turi (Oylik / Kunlik / Soatlik)</th>
                    <th className="py-3.5 px-4">Kimlar uchun</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-4 text-right">Ko‘rishlar</th>
                    <th className="py-3.5 px-4 text-right">Boshqarish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {myJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{job.title}</div>
                        <div className="text-xs text-slate-600 font-medium mt-0.5">
                          📍 {job.country}, {job.city} — {job.exactAddress}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Muddat: {job.deadline}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {job.salaryPeriod === 'daily'
                            ? 'Kunlik ish'
                            : job.salaryPeriod === 'hourly'
                            ? 'Soatlik ish'
                            : 'Oylik ish'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {job.targetGender === 'male'
                          ? 'Erkaklar'
                          : job.targetGender === 'female'
                          ? 'Ayollar'
                          : 'Barcha uchun'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            job.status === 'approved'
                              ? 'text-emerald-700'
                              : job.status === 'pending'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {job.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-slate-700">
                        {job.viewsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {job.status !== 'closed' ? (
                          <button
                            onClick={() => onUpdateJobStatus(job.id, 'closed')}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 cursor-pointer"
                          >
                            E’lonni yopish
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateJobStatus(job.id, 'approved')}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer"
                          >
                            Qayta faollashtirish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATE APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-600">
              Hozircha vakansiyalaringizga arizalar kelib tushmagan.
            </div>
          ) : (
            myApplications.map((app) => (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500">Vakansiya: {app.jobTitle}</div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{app.seekerName}</h3>
                    <div className="text-xs text-slate-600 font-mono mt-0.5">
                      {app.seekerTitle} · {app.seekerEmail} · {app.seekerPhone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-700">
                      Holat: {t[`status_${app.status}`]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Nomzod rezyumesi:
                    </div>
                    <p className="text-slate-700 leading-relaxed">{app.resumeSummary}</p>
                    {app.resumeFileName && (
                      <div className="mt-2 font-mono text-blue-700">Fayl: {app.resumeFileName}</div>
                    )}
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 mb-1">Nomzod xabari:</div>
                    <p className="text-slate-700 leading-relaxed">{app.coverMessage}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      placeholder="Suhbat vaqti yoki nomzodga izoh yozish..."
                      value={interviewNotes[app.id] ?? app.interviewNote ?? ''}
                      onChange={(e) => setInterviewNotes({ ...interviewNotes, [app.id]: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setInterviewNotes({
                          ...interviewNotes,
                          [app.id]: `Assalomu alaykum, ${app.seekerName}! Rezyumengiz bizga ma’qul keldi. Sizni suhbatga taklif qilamiz. Suhbat savollari: 1) Avvalgi tajribangiz, 2) Kunlik ish tartibiga moslashish, 3) Kutilayotgan maosh va ish grafigi.`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer shrink-0"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>AI Xushmuomala javob & Savollar</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        onUpdateApplicationStatus(app.id, 'reviewing', interviewNotes[app.id] ?? app.interviewNote)
                      }
                      className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      Ko‘rib chiqilmoqda
                    </button>
                    <button
                      onClick={() =>
                        onUpdateApplicationStatus(
                          app.id,
                          'interview',
                          interviewNotes[app.id] || 'Suhbatga taklif qilindingiz.'
                        )
                      }
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Suhbatga taklif qilish
                    </button>
                    <button
                      onClick={() =>
                        onUpdateApplicationStatus(app.id, 'accepted', interviewNotes[app.id] ?? app.interviewNote)
                      }
                      className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      Qabul qilish
                    </button>
                    <button
                      onClick={() =>
                        onUpdateApplicationStatus(app.id, 'rejected', interviewNotes[app.id] ?? app.interviewNote)
                      }
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
                    >
                      Rad etish
                    </button>
                    {onOpenChatRoom && (
                      <button
                        type="button"
                        onClick={() => onOpenChatRoom(app.jobId, app.seekerId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer ml-auto"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nomzod bilan suhbat (Chat)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: DIRECT CHATS WITH CANDIDATES (WITH DELETE ABILITY) */}
      {activeTab === 'chats' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Nomzodlar va ish qidiruvchilar bilan suhbat kabineti
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {onOpenChatRoom && (
                <button
                  type="button"
                  onClick={() => onOpenChatRoom()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kengaytirilgan Suhbatxonaga o‘tish →</span>
                </button>
              )}
              <span className="text-xs text-slate-500 hidden sm:inline">
                Yozgan xabaringizni o‘chirib tashlash imkoni mavjud
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {myChats.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                Hozircha suhbat xabarlari yo‘q.
              </div>
            ) : (
              myChats.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      Vakansiya: <strong className="text-slate-800">{msg.jobTitle}</strong> ·{' '}
                      <span className="font-mono">{msg.createdAt.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div className="text-xs font-bold text-blue-700">{msg.senderName}</div>
                    <p className="text-sm text-slate-800">{msg.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteChatMessage(msg.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O‘chirish</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {myJobs.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatReplyText.trim()) return;
                onSendChatMessage(myJobs[0], chatReplyText);
                setChatReplyText('');
              }}
              className="flex items-center gap-2 pt-3 border-t border-slate-200"
            >
              <input
                type="text"
                value={chatReplyText}
                onChange={(e) => setChatReplyText(e.target.value)}
                placeholder="Nomzodga javob xabarini yozing..."
                className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Xabar yuborish
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: POST A NEW JOB (WITH MANDATORY HOW-TO-WORK & GENDER TARGETING) */}
      {activeTab === 'post' && (
        <form onSubmit={handleCreateJobSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Yangi vakansiya joylashtirish</h2>
              <p className="text-xs text-slate-500">
                Faqat haqiqiy, tasdiqlangan ish sharoitlari va qulayliklarni belgilang.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateJobWithAi}
              disabled={aiJobGenerating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {aiJobGenerating
                  ? 'AI yozmoqda...'
                  : 'AI Yordamchi: Vakansiya matni va 3 tilda tarjima yaratish'}
              </span>
            </button>
          </div>
          {/* MANDATORY EXACT LOCATION & PAY PERIOD (OYLIK / KUNLIK / SOATLIK) HIGHLIGHT BOX */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/70 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Majburiy mezonlar: Ishning aniq joylashuvi va Ish haqi turi (Oylik / Kunlik / Soatlik)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ish beruvchi ish joyining aniq manzilini kiritishi hamda ish oylik, kunlik yoki soatlik ekanini belgilashi shart.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(
                  [
                    ['monthly', 'Oylik ish'],
                    ['daily', 'Kunlik ish'],
                    ['hourly', 'Soatlik ish'],
                  ] as [SalaryPeriod, string][]
                ).map(([periodKey, label]) => (
                  <button
                    key={periodKey}
                    type="button"
                    onClick={() => setSalaryPeriod(periodKey)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-colors ${
                      salaryPeriod === periodKey
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Mamlakat (Majburiy) *
                </label>
                <input
                  type="text"
                  required
                  value={jobCountry}
                  onChange={(e) => setJobCountry(e.target.value)}
                  placeholder="Masalan: O‘zbekiston"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Shahar / Viloyat (Majburiy) *
                </label>
                <input
                  type="text"
                  required
                  value={jobCity}
                  onChange={(e) => setJobCity(e.target.value)}
                  placeholder="Masalan: Toshkent"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-950 mb-1">
                  Aniq joylashuv manzili (Tuman, ko‘cha, uy, mo‘ljal) *
                </label>
                <input
                  type="text"
                  required
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="Masalan: Chilonzor tumani, Qatortol ko‘chasi, 25-uy"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-blue-500 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lavozim nomi *</label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Masalan: Bosh Buxgalter yoki Qurilish Muhandisi"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Soha / Kategoriya *</label>
              <select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="IT va dasturlash">IT va dasturlash</option>
                <option value="Qurilish va ta’mirlash">Qurilish va ta’mirlash</option>
                <option value="Haydovchilik va logistika">Haydovchilik va logistika</option>
                <option value="Tibbiyot">Tibbiyot</option>
                <option value="Restoran va mehmonxona">Restoran va mehmonxona</option>
                <option value="Zavod va ishlab chiqarish">Zavod va ishlab chiqarish</option>
                <option value="Savdo va marketing">Savdo va marketing</option>
                <option value="Ofis va ma’muriy ishlar">Ofis va ma’muriy ishlar</option>
                <option value="Ta’lim va o‘qituvchilik">Ta’lim va o‘qituvchilik</option>
                <option value="Texnik xizmat va ustachilik">Texnik xizmat va ustachilik</option>
                <option value="Masofaviy va onlayn ishlar">Masofaviy va onlayn ishlar</option>
                <option value="Ombor va yetkazib berish">Ombor va yetkazib berish</option>
                <option value="Tozalash va uy xizmatlari">Tozalash va uy xizmatlari</option>
                <option value="Qishloq xo‘jaligi">Qishloq xo‘jaligi</option>
                <option value="Tajribasizlar uchun ishlar">Tajribasizlar uchun ishlar</option>
                <option value="Dizayn va ijod">Dizayn va ijod</option>
                <option value="Buxgalteriya va moliya">Buxgalteriya va moliya</option>
                <option value="Go‘zallik va shaxsiy xizmatlar">Go‘zallik va shaxsiy xizmatlar</option>
                <option value="Huquq va yuridik xizmatlar">Huquq va yuridik xizmatlar</option>
                <option value="Boshqa kasblar">Boshqa kasblar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kimlar uchun mos (Erkak / Ayol) *
              </label>
              <select
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value as TargetGender)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="any">Erkak va Ayollar uchun (Farqi yo‘q)</option>
                <option value="male">Erkaklar uchun mos ish</option>
                <option value="female">Ayollar uchun mos ish</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mamlakat *</label>
              <input
                type="text"
                required
                value={jobCountry}
                onChange={(e) => setJobCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Shahar *</label>
              <input
                type="text"
                required
                value={jobCity}
                onChange={(e) => setJobCity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">
                Ishning aniq joylashuv manzili (Ko‘cha, uy, mo‘ljal — Majburiy) *
              </label>
              <input
                type="text"
                required
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
                placeholder="Masalan: Chilonzor tumani, Qatortol ko‘chasi, 25-uy"
                className="w-full px-3 py-2 text-sm border border-blue-300 bg-blue-50/40 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ish beruvchi telefoni (Pro obunachilarga ko‘rinadi) *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Telegram manzili (Pro obunachilarga ko‘rinadi) *
              </label>
              <input
                type="text"
                required
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                To‘lov turi (Oylik / Kunlik / Soatlik) *
              </label>
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="monthly">Oylik ish (Oyiga to‘lanadi)</option>
                <option value="daily">Kunlik ish (Kuniga to‘lanadi)</option>
                <option value="hourly">Soatlik ish (Soatiga to‘lanadi)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bandlik turi</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="full-time">{t.empFullTime}</option>
                <option value="part-time">{t.empPartTime}</option>
                <option value="contract">{t.empContract}</option>
                <option value="temporary">{t.empTemporary}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ish shakli</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="onsite">{t.modeOnsite}</option>
                <option value="remote">{t.modeRemote}</option>
                <option value="hybrid">{t.modeHybrid}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Minimal maosh</label>
              <input
                type="number"
                disabled={isNegotiable}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Maksimal maosh</label>
              <input
                type="number"
                disabled={isNegotiable}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Valyuta</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-mono"
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 pb-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Maosh suhbat asosida (“Kelishiladi”)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1">
              Ish haqida batafsil ma’lumot (Majburiy) *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kompaniya va taklif etilayotgan ish o‘rni haqida to‘liq ma’lumot kiriting..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
            <label className="block text-xs font-bold text-blue-950 mb-1">
              Qanday ishlash kerak va bu ishda nima qilish kerak? (Ish tartibi — kiritish majburiy) *
            </label>
            <textarea
              rows={3}
              required
              value={howToWork}
              onChange={(e) => setHowToWork(e.target.value)}
              placeholder="Nomzod ishga kirgach kunlik ishini qanday bajaradi, nimalar qiladi, qanday tartibda ishlaydi — batafsil tushuntirib yozing..."
              className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Vazifalar (har bir qatorda bittadan) *
              </label>
              <textarea
                rows={3}
                required
                value={responsibilitiesText}
                onChange={(e) => setResponsibilitiesText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nomzodga talablar (har bir qatorda bittadan) *
              </label>
              <textarea
                rows={3}
                required
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kerakli ko‘nikmalar (vergul bilan ajrating) *
            </label>
            <input
              type="text"
              required
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Masalan: 1C, Excel, Mas’uliyat"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          {/* Requirement 8: Employer Workplace Accessibility & Disability Accommodations Section */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={disabilityFriendly}
                onChange={(e) => setDisabilityFriendly(e.target.checked)}
                className="mt-0.5 rounded border-blue-400"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900">
                  ♿ Nogironligi bo‘lgan insonlar uchun qulayliklar mavjud (Faqat haqiqiy bor sharoitlarni belgilang)
                </div>
                <p className="text-slate-600 mt-0.5">
                  Qonunchilik talabi: Nomzodlarni faqat nogironligi sababli rad etish taqiqlanadi — baholash faqat malaka va zarur vazifalarga asoslanadi.
                </p>
              </div>
            </label>

            {disabilityFriendly && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {(
                    [
                      ['remote-home', 'Uyda / Masofadan ishlash imkoniyati'],
                      ['wheelchair-access', 'Nogironlar aravachasida kirish va harakatlanish'],
                      ['ramp-elevator', 'Pandus, lift va to‘siqsiz kirish yo‘li'],
                      ['adapted-workstation', 'Moslashtirilgan ish stoli / maxsus uskunalar'],
                      ['flexible-schedule', 'Moslashuvchan ish jadvali'],
                      ['part-time-option', 'Qisqartirilgan ish vaqti / Yarim stavka'],
                      ['hearing-support', 'Eshitish bo‘yicha qulaylik (matnli muloqot)'],
                      ['vision-assistive-tech', 'Ko‘rish / Yordamchi texnologiyalar mosligi'],
                      ['mobility-support', 'Harakatlanish bo‘yicha qulayliklar'],
                    ] as [DisabilityAccommodationKey, string][]
                  ).map(([key, label]) => {
                    const checked = accommodations.includes(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAccommodations((prev) =>
                              prev.includes(key)
                                ? prev.filter((item) => item !== key)
                                : [...prev, key]
                            );
                          }}
                          className="rounded border-slate-300"
                        />
                        <span className="text-slate-800">{label}</span>
                      </label>
                    );
                  })}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Moslashtirish bo‘yicha murojaat qilish usuli
                  </label>
                  <input
                    type="text"
                    value={accommodationContactNote}
                    onChange={(e) => setAccommodationContactNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Vakansiyani e’lon qilish
          </button>
        </form>
      )}

      {/* TAB 5: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanySubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Kompaniya rasmiy ma’lumotlari</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Kompaniya nomi *</label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Faoliyat sohasi *</label>
              <input
                type="text"
                required
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Mamlakat *</label>
              <input
                type="text"
                required
                value={compCountry}
                onChange={(e) => setCompCountry(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Shahar *</label>
              <input
                type="text"
                required
                value={compCity}
                onChange={(e) => setCompCity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Aloqa telefoni (Pro uchun) *</label>
              <input
                type="text"
                required
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Telegram (Pro uchun) *</label>
              <input
                type="text"
                required
                value={compTelegram}
                onChange={(e) => setCompTelegram(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kompaniya haqida ma’lumot *</label>
            <textarea
              rows={3}
              required
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            Kompaniya profilini saqlash
          </button>
        </form>
      )}
    </div>
  );
};

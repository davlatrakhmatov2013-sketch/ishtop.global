import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Filter,
  Menu,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ApplicationRecord,
  ApplicationStatus,
  AuditLogRecord,
  CareerPreferences,
  ChatMessageRecord,
  CompanyRecord,
  Currency,
  EmploymentType,
  ExperienceLevel,
  JobRecord,
  Language,
  NotificationRecord,
  PlanTier,
  ReportRecord,
  SalaryPeriod,
  SavedJobRecord,
  SubscriptionPlanConfig,
  TargetGender,
  UserGender,
  UserRecord,
  WorkMode,
} from './types';
import { translations } from './i18n';
import {
  initialApplications,
  initialAuditLogs,
  initialChatMessages,
  initialCompanies,
  initialJobs,
  initialNotifications,
  initialPlans,
  initialReports,
  initialUsers,
} from './data/initialData';
import { JOB_SECTORS } from './data/sectors';
import { JobDetailModal } from './components/JobDetailModal';
import { SeekerWorkspace } from './components/SeekerWorkspace';
import { EmployerWorkspace } from './components/EmployerWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';
import { ArchitectureView, PricingView } from './components/PricingAndArchitecture';
import { AuthModal } from './components/AuthModal';
import { OnboardingFlow } from './components/OnboardingFlow';
import { RecommendedJobsView } from './components/RecommendedJobsView';
import { AiCareerAdvisorView } from './components/AiCareerAdvisorView';
import { GlobalAiWidget } from './components/GlobalAiWidget';
import { ChatRoomView } from './components/ChatRoomView';

type ActivePage =
  | 'home'
  | 'jobs'
  | 'recommended'
  | 'ai-advisor'
  | 'chat'
  | 'companies'
  | 'pricing'
  | 'architecture'
  | 'cabinet'
  | 'legal';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function doesJobMatchSectors(job: JobRecord, sectorIds: string[]): boolean {
  if (!sectorIds || sectorIds.length === 0 || sectorIds.length === JOB_SECTORS.length) {
    return true;
  }
  const jobCatLower = job.category.toLowerCase();
  const jobTitleLower = job.title.toLowerCase();
  const jobSkillsLower = job.skills.map((s) => s.toLowerCase()).join(' ');

  return sectorIds.some((secId) => {
    if (secId === 'sec_remote' && job.workMode === 'remote') return true;
    if (secId === 'sec_no_exp' && job.experienceLevel === 'no-experience') return true;

    const sectorDef = JOB_SECTORS.find((s) => s.id === secId);
    if (!sectorDef) return false;

    return sectorDef.keywords.some(
      (kw) =>
        jobCatLower.includes(kw) ||
        jobTitleLower.includes(kw) ||
        jobSkillsLower.includes(kw)
    );
  });
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => loadFromStorage<Language>('ishtop_lang', 'uz'));
  const t = translations[lang];

  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Collections State in Local Sandbox (v3 keys ensure 112+ companies & 520+ jobs load)
  const [users, setUsers] = useState<UserRecord[]>(() =>
    loadFromStorage('ishtop_users_v3', initialUsers)
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    loadFromStorage('ishtop_current_user_v3', 'usr_seeker_1')
  );
  const [isAdminPasswordVerified, setIsAdminPasswordVerified] = useState<boolean>(false);
  const [companies, setCompanies] = useState<CompanyRecord[]>(() =>
    loadFromStorage('ishtop_companies_v3', initialCompanies)
  );
  const [jobs, setJobs] = useState<JobRecord[]>(() =>
    loadFromStorage('ishtop_jobs_v3', initialJobs)
  );
  const [applications, setApplications] = useState<ApplicationRecord[]>(() =>
    loadFromStorage('ishtop_applications_v3', initialApplications)
  );
  const [chatMessages, setChatMessages] = useState<ChatMessageRecord[]>(() =>
    loadFromStorage('ishtop_chats_v3', initialChatMessages)
  );
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>(() =>
    loadFromStorage('ishtop_saved_jobs_v3', [
      { id: 'sv_1', userId: 'usr_seeker_1', jobId: 'job_1001', createdAt: '2026-10-07T10:00:00Z' },
    ])
  );
  const [notifications, setNotifications] = useState<NotificationRecord[]>(() =>
    loadFromStorage('ishtop_notifications_v3', initialNotifications)
  );
  const [reports, setReports] = useState<ReportRecord[]>(() =>
    loadFromStorage('ishtop_reports_v3', initialReports)
  );
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>(() =>
    loadFromStorage('ishtop_plans_v3', initialPlans)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(() =>
    loadFromStorage('ishtop_audit_logs_v3', initialAuditLogs)
  );

  // Guest / First-Entry Career Preferences & Onboarding Modal State
  const [guestPreferences, setGuestPreferences] = useState<CareerPreferences | undefined>(() =>
    loadFromStorage<CareerPreferences | undefined>('ishtop_guest_prefs', undefined)
  );
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() =>
    loadFromStorage<boolean>('ishtop_onboarding_seen_v1', false)
  );
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(() => {
    const seen = loadFromStorage<boolean>('ishtop_onboarding_seen_v1', false);
    return !seen;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('ishtop_lang', JSON.stringify(lang));
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('ishtop_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ishtop_current_user_v3', JSON.stringify(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('ishtop_companies_v3', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('ishtop_jobs_v3', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('ishtop_applications_v3', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('ishtop_chats_v3', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('ishtop_saved_jobs_v3', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem('ishtop_notifications_v3', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ishtop_reports_v3', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('ishtop_plans_v3', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('ishtop_audit_logs_v3', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    if (guestPreferences) {
      localStorage.setItem('ishtop_guest_prefs', JSON.stringify(guestPreferences));
    }
  }, [guestPreferences]);

  useEffect(() => {
    localStorage.setItem('ishtop_onboarding_seen_v1', JSON.stringify(hasSeenOnboarding));
  }, [hasSeenOnboarding]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  // Active Career Preferences (from logged-in user profile OR temporary guest storage)
  const activePreferences: CareerPreferences | undefined =
    currentUser?.careerPreferences || guestPreferences;

  // Selected Job for Modal
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  // Search & Filter states (initialized from saved preferences if available)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    () => activePreferences?.sectors || []
  );
  const [filterCountry, setFilterCountry] = useState<string>(
    () => activePreferences?.country || 'all'
  );
  const [filterCity, setFilterCity] = useState<string>(
    () => activePreferences?.city || 'all'
  );
  const [filterCurrency, setFilterCurrency] = useState<'all' | Currency>('all');
  const [filterMinSalary, setFilterMinSalary] = useState<string>(
    () => (activePreferences?.salaryMin ? String(activePreferences.salaryMin) : '')
  );
  const [filterMaxSalary, setFilterMaxSalary] = useState<string>(
    () => (activePreferences?.salaryMax ? String(activePreferences.salaryMax) : '')
  );
  const [filterType, setFilterType] = useState<'all' | EmploymentType>(
    () => activePreferences?.employmentType || 'all'
  );
  const [filterMode, setFilterMode] = useState<'all' | WorkMode>(
    () => activePreferences?.workMode || 'all'
  );
  const [filterExp, setFilterExp] = useState<'all' | ExperienceLevel>(
    () => activePreferences?.experienceLevel || 'all'
  );
  const [filterGender, setFilterGender] = useState<'all' | UserGender>(
    () => activePreferences?.gender || 'all'
  );
  const [filterSalaryPeriod, setFilterSalaryPeriod] = useState<'all' | SalaryPeriod>('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterLang, setFilterLang] = useState('all');
  const [filterVerifiedEmployerOnly, setFilterVerifiedEmployerOnly] = useState<boolean>(false);
  const [filterScheduleType, setFilterScheduleType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'salary'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Demo webhook message
  const [demoWebhookMessage, setDemoWebhookMessage] = useState<string | null>(null);

  const appendAuditLog = (action: string, targetId: string, details: string) => {
    if (!currentUser) return;
    const entry: AuditLogRecord = {
      id: `aud_${Date.now()}`,
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Apply completed onboarding preferences to both filters and database/guest storage
  const handleCompleteOnboarding = (prefs: CareerPreferences) => {
    setGuestPreferences(prefs);
    setHasSeenOnboarding(true);
    setShowOnboardingModal(false);

    // Sync to active filter controls
    setSelectedSectors(prefs.sectors);
    if (prefs.gender) {
      setFilterGender(prefs.gender);
    }
    setFilterCountry(prefs.country);
    setFilterCity(prefs.city);
    setFilterMinSalary(prefs.salaryMin ? String(prefs.salaryMin) : '');
    setFilterMaxSalary(prefs.salaryMax ? String(prefs.salaryMax) : '');
    setFilterCurrency(prefs.salaryMin || prefs.salaryMax ? prefs.currency : 'all');
    setFilterMode(prefs.workMode);
    setFilterType(prefs.employmentType);
    setFilterExp(prefs.experienceLevel);
    setCurrentPage(1);

    // Persist in user profile database record if logged in
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? { ...u, gender: prefs.gender || u.gender, careerPreferences: prefs }
            : u
        )
      );
      appendAuditLog(
        'CAREER_PREFERENCES_SAVED',
        currentUser.id,
        `Saved ${prefs.sectors.length} sectors, gender=${prefs.gender}, country=${prefs.country}`
      );
    }

    setActivePage('jobs');
  };

  const handleSkipOnboardingLater = () => {
    setHasSeenOnboarding(true);
    setShowOnboardingModal(false);
  };

  // Distinct countries & cities for filters
  const availableCountries = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.country))),
    [jobs]
  );
  const availableCities = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .filter((j) => filterCountry === 'all' || j.country === filterCountry)
            .map((j) => j.city)
        )
      ),
    [jobs, filterCountry]
  );

  // Combined Filtered Jobs
  const approvedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'approved'),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    return approvedJobs
      .filter((job) => {
        if (!doesJobMatchSectors(job, selectedSectors)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = job.companyName.toLowerCase().includes(q);
          const matchSkill = job.skills.some((s) => s.toLowerCase().includes(q));
          const matchCategory = job.category.toLowerCase().includes(q);
          if (!matchTitle && !matchCompany && !matchSkill && !matchCategory) return false;
        }
        if (filterGender !== 'all') {
          if (job.targetGender !== 'any' && job.targetGender !== filterGender) {
            return false;
          }
        }
        if (filterSalaryPeriod !== 'all' && job.salaryPeriod !== filterSalaryPeriod) {
          return false;
        }
        if (filterCountry !== 'all' && job.country !== filterCountry) return false;
        if (filterCity !== 'all' && job.city !== filterCity) return false;
        if (filterCurrency !== 'all' && job.currency !== filterCurrency) return false;
        if (filterType !== 'all' && job.employmentType !== filterType) return false;
        if (filterMode !== 'all' && job.workMode !== filterMode) return false;
        if (filterExp !== 'all' && job.experienceLevel !== filterExp) return false;
        if (filterCompany !== 'all' && job.companyId !== filterCompany) return false;
        if (filterLang !== 'all' && !job.workLanguage.toLowerCase().includes(filterLang.toLowerCase())) {
          return false;
        }
        if (filterVerifiedEmployerOnly && !job.companyVerified) {
          return false;
        }
        if (filterScheduleType !== 'all') {
          if (filterScheduleType === 'flexible' && !job.workSchedule.toLowerCase().includes('moslashuvchan')) {
            return false;
          }
          if (filterScheduleType === 'standard' && !job.workSchedule.toLowerCase().includes('09:00')) {
            return false;
          }
        }
        if (filterMinSalary && job.salaryMax && job.salaryMax < Number(filterMinSalary)) {
          return false;
        }
        if (filterMaxSalary && job.salaryMin && job.salaryMin > Number(filterMaxSalary)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'salary') {
          return (b.salaryMax || 0) - (a.salaryMax || 0);
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [
    approvedJobs,
    selectedSectors,
    searchQuery,
    filterGender,
    filterSalaryPeriod,
    filterCountry,
    filterCity,
    filterCurrency,
    filterType,
    filterMode,
    filterExp,
    filterCompany,
    filterLang,
    filterVerifiedEmployerOnly,
    filterScheduleType,
    filterMinSalary,
    filterMaxSalary,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSectors([]);
    setFilterGender('all');
    setFilterSalaryPeriod('all');
    setFilterCountry('all');
    setFilterCity('all');
    setFilterCurrency('all');
    setFilterMinSalary('');
    setFilterMaxSalary('');
    setFilterType('all');
    setFilterMode('all');
    setFilterExp('all');
    setFilterCompany('all');
    setFilterLang('all');
    setFilterVerifiedEmployerOnly(false);
    setFilterScheduleType('all');
    setCurrentPage(1);
  };

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
    return `${fmt(job.salaryMax)} ${jCurrency(job)} (${periodLabel})`;
  };

  function jCurrency(job: JobRecord) {
    return job.currency;
  }

  const [selectedChatJobId, setSelectedChatJobId] = useState<string | null>(null);
  const [selectedChatSeekerId, setSelectedChatSeekerId] = useState<string | null>(null);

  const handleOpenChat = (jobId?: string, seekerId?: string) => {
    if (jobId) setSelectedChatJobId(jobId);
    if (seekerId) setSelectedChatSeekerId(seekerId);
    setActivePage('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendChatMessage = (
    jobId: string,
    jobTitle: string,
    companyName: string,
    text: string,
    employerId = 'usr_employer_1',
    seekerId?: string,
    seekerName?: string
  ) => {
    if (!text.trim()) return;
    const effectiveUser =
      currentUser ||
      users.find((u) => u.role === 'seeker') ||
      users[0];

    const msg: ChatMessageRecord = {
      id: `msg_${Date.now()}`,
      jobId,
      jobTitle,
      seekerId: seekerId || (effectiveUser.role === 'seeker' ? effectiveUser.id : 'usr_seeker_1'),
      seekerName:
        seekerName || (effectiveUser.role === 'seeker' ? effectiveUser.fullName : 'Nomzod'),
      employerId,
      companyName,
      senderId: effectiveUser.id,
      senderName: effectiveUser.fullName,
      senderRole: effectiveUser.role,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, msg]);
  };

  const handleDeleteChatMessage = (msgId: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const handleOpenJob = (job: JobRecord) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, viewsCount: j.viewsCount + 1 } : j))
    );
    setSelectedJobId(job.id);
  };

  const handleToggleSaveJob = (jobId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    const exists = savedJobs.find(
      (s) => s.userId === currentUser.id && s.jobId === jobId
    );
    if (exists) {
      setSavedJobs((prev) => prev.filter((s) => s.id !== exists.id));
    } else {
      setSavedJobs((prev) => [
        ...prev,
        {
          id: `sv_${Date.now()}`,
          userId: currentUser.id,
          jobId,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleApplyToJob = (jobId: string, coverMessage: string): { ok: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'seeker') {
      return {
        ok: false,
        message: 'Faqat ro‘yxatdan o‘tgan ish qidiruvchilar ariza yubora oladi.',
      };
    }

    const duplicate = applications.find(
      (a) => a.jobId === jobId && a.seekerId === currentUser.id
    );
    if (duplicate) {
      return {
        ok: false,
        message: 'Siz ushbu vakansiyaga allaqachon ariza yuborgansiz (Takroriy ariza bloklandi).',
      };
    }

    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) {
      return { ok: false, message: 'Vakansiya topilmadi.' };
    }

    const newApp: ApplicationRecord = {
      id: `app_${Date.now()}`,
      jobId: targetJob.id,
      jobTitle: targetJob.title,
      companyId: targetJob.companyId,
      companyName: targetJob.companyName,
      seekerId: currentUser.id,
      seekerName: currentUser.fullName,
      seekerEmail: currentUser.email,
      seekerPhone: currentUser.phone,
      seekerTitle: currentUser.title || 'Mutaxassis',
      resumeSummary: `${currentUser.bio || ''} | Ko‘nikmalar: ${currentUser.skills.join(', ')}`,
      resumeFileName: currentUser.resumeFileName,
      coverMessage,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);
    appendAuditLog('APPLICATION_SUBMITTED', targetJob.id, `${currentUser.email} applied to ${targetJob.title}`);

    return {
      ok: true,
      message:
        lang === 'uz'
          ? 'Arizangiz va rezyumengiz ish beruvchiga muvaffaqiyatli yuborildi!'
          : lang === 'ru'
          ? 'Ваш отклик и резюме успешно отправлены работодателю!'
          : 'Your application and resume have been submitted!',
    };
  };

  const handleReportJob = (
    jobId: string,
    reason: ReportRecord['reason'],
    details: string
  ) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;
    const newReport: ReportRecord = {
      id: `rep_${Date.now()}`,
      jobId,
      jobTitle: targetJob.title,
      reporterId: currentUser?.id || 'guest',
      reporterEmail: currentUser?.email || 'anonymous@ishtop.uz',
      reason,
      details,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    appendAuditLog('JOB_REPORTED', jobId, `Reason: ${reason}`);
  };

  const handleDismissJob = (jobId: string) => {
    if (!currentUser) return;
    const currentDismissed = currentUser.dismissedJobIds || [];
    if (currentDismissed.includes(jobId)) return;
    const updated = { ...currentUser, dismissedJobIds: [...currentDismissed, jobId] };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const handleRestoreDismissedJobs = () => {
    if (!currentUser) return;
    const updated = { ...currentUser, dismissedJobIds: [] };
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (Nav Links) — Zone 3 (Primary CTA) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setActivePage('home')}
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.brand}
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActivePage('jobs')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'jobs' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {t.navJobs}
            </button>
            <button
              onClick={() => setActivePage('recommended')}
              className={`inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'recommended' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <span>{t.navRecommendations}</span>
            </button>
            <button
              onClick={() => setActivePage('ai-advisor')}
              className={`inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'ai-advisor' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <span>{t.navAiAdvisor}</span>
            </button>
            <button
              onClick={() => {
                setActivePage('chat');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'chat' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.navChat}</span>
              {chatMessages.length > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePage('companies')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'companies' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {t.navCompanies}
            </button>
            <button
              onClick={() => setActivePage('pricing')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'pricing' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {t.navPricing}
            </button>
            <button
              onClick={() => setActivePage('architecture')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'architecture' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {t.navArchitecture}
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true);
                } else {
                  setActivePage('cabinet');
                }
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'cabinet' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              {t.navCabinet}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <button
                onClick={() => setActivePage('cabinet')}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {currentUser.role === 'seeker'
                  ? t.roleSeeker
                  : currentUser.role === 'employer'
                  ? t.roleEmployer
                  : t.roleAdmin}
                {' · '}
                {currentUser.fullName.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.btnSignIn}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setActivePage('jobs');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700"
            >
              {t.navJobs}
            </button>
            <button
              onClick={() => {
                setActivePage('recommended');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-blue-700 font-semibold"
            >
              ✨ {t.navRecommendations}
            </button>
            <button
              onClick={() => {
                setActivePage('ai-advisor');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-blue-700 font-semibold"
            >
              🤖 {t.navAiAdvisor}
            </button>
            <button
              onClick={() => {
                setActivePage('chat');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-blue-700 font-semibold flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>{t.navChat}</span>
              </span>
              {chatMessages.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActivePage('companies');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700"
            >
              {t.navCompanies}
            </button>
            <button
              onClick={() => {
                setActivePage('pricing');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700"
            >
              {t.navPricing}
            </button>
            <button
              onClick={() => {
                setActivePage('architecture');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700"
            >
              {t.navArchitecture}
            </button>
            <button
              onClick={() => {
                setActivePage('cabinet');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-sm font-medium text-blue-600"
            >
              {t.navCabinet}
            </button>
          </div>
        )}
      </header>

      {/* Secondary Workspace Toolbar below the header: Language Switcher + Role Switcher + Sector Onboarding Trigger */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <button
              onClick={() => setShowOnboardingModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>{t.btnEditPreferences}</span>
              {selectedSectors.length > 0 && (
                <span className="font-mono text-white">({selectedSectors.length})</span>
              )}
            </button>
            <span className="hidden lg:inline text-slate-400 line-clamp-1">
              {t.dataSourceBanner}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            {/* Quick Role Switcher for testing all 3 user roles */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden sm:inline">{t.demoSwitchRole}:</span>
              <button
                onClick={() => {
                  setCurrentUserId('usr_seeker_1');
                  setActivePage('cabinet');
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  currentUser?.role === 'seeker'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                1. {t.roleSeeker}
              </button>
              <button
                onClick={() => {
                  setCurrentUserId('usr_employer_1');
                  setActivePage('cabinet');
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  currentUser?.role === 'employer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                2. {t.roleEmployer}
              </button>
              <button
                onClick={() => {
                  setCurrentUserId('usr_admin_1');
                  setActivePage('cabinet');
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                  currentUser?.role === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                3. {t.roleAdmin}
              </button>
            </div>

            {/* Trilingual Switcher: O'zbek / Русский / English */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md">
              {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase cursor-pointer ${
                    lang === l ? 'bg-white text-slate-900 font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {currentUser && (
              <button
                onClick={() => setCurrentUserId(null)}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                {t.btnSignOut}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1">
        {/* HOME PAGE */}
        {activePage === 'home' && (
          <div>
            {/* Hero Section with Search Engine */}
            <section className="bg-white border-b border-slate-200 py-12 lg:py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="max-w-3xl space-y-4">
                  <div className="text-xs font-semibold text-blue-600 tracking-wide">
                    {t.heroKicker}
                  </div>
                  <h1
                    className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    {t.heroTitle}
                  </h1>
                  <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                    {t.heroDesc}
                  </p>

                  {/* Primary Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setActivePage('jobs')}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {t.btnSearch}
                    </button>
                    <button
                      onClick={() => setShowOnboardingModal(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{t.onboardingTitle}</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUserId('usr_seeker_1');
                        setActivePage('cabinet');
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {t.btnCreateResume}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUserId('usr_employer_1');
                        setActivePage('cabinet');
                      }}
                      className="px-5 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {t.btnPostJob}
                    </button>
                  </div>
                </div>

                {/* Large Search & Filter Box */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <select
                        value={filterCountry}
                        onChange={(e) => {
                          setFilterCountry(e.target.value);
                          setFilterCity('all');
                        }}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="all">{t.allCountries}</option>
                        {availableCountries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value as any)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="all">{t.allModes}</option>
                        <option value="onsite">{t.modeOnsite}</option>
                        <option value="remote">{t.modeRemote}</option>
                        <option value="hybrid">{t.modeHybrid}</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        onClick={() => setActivePage('jobs')}
                        className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        {t.btnSearch}
                      </button>
                    </div>
                  </div>

                  {/* Secondary Filter Row: Min/Max Salary, Salary Period (Oylik/Kunlik/Soatlik), Gender */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    <input
                      type="number"
                      value={filterMinSalary}
                      onChange={(e) => setFilterMinSalary(e.target.value)}
                      placeholder={t.minSalary}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      value={filterMaxSalary}
                      onChange={(e) => setFilterMaxSalary(e.target.value)}
                      placeholder={t.maxSalary}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                    <select
                      value={filterSalaryPeriod}
                      onChange={(e) => setFilterSalaryPeriod(e.target.value as any)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="all">To‘lov: Oylik / Kunlik / Soatlik</option>
                      <option value="monthly">Oylik ishlar</option>
                      <option value="daily">Kunlik ishlar</option>
                      <option value="hourly">Soatlik ishlar</option>
                    </select>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value as any)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="all">Jinsi: Erkak va Ayol</option>
                      <option value="male">Erkaklar uchun mos</option>
                      <option value="female">Ayollar uchun mos</option>
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="all">{t.allTypes}</option>
                      <option value="full-time">{t.empFullTime}</option>
                      <option value="part-time">{t.empPartTime}</option>
                      <option value="contract">{t.empContract}</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured & Latest Opportunities */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
              {/* Featured Jobs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{t.featuredJobs}</h2>
                  <button
                    onClick={() => setActivePage('jobs')}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Barchasini ko‘rish ({approvedJobs.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {approvedJobs
                    .filter((j) => j.featured)
                    .map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleOpenJob(job)}
                        className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors cursor-pointer space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate max-w-[70%]">
                            {job.category} · {job.city}, {job.country} ({job.exactAddress})
                          </span>
                          <span className="font-mono tabular-nums">{job.createdAt}</span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                          <span className="font-semibold">{job.companyName}</span>
                          <span aria-hidden="true">·</span>
                          {job.companyVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {t.verifiedCompany}
                            </span>
                          ) : (
                            <span className="text-amber-700">{t.unverifiedCompany}</span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {job.salaryPeriod === 'daily'
                              ? 'Kunlik'
                              : job.salaryPeriod === 'hourly'
                              ? 'Soatlik'
                              : 'Oylik'}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                            {formatJobSalary(job)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {job.workMode === 'remote'
                              ? t.modeRemote
                              : job.workMode === 'hybrid'
                              ? t.modeHybrid
                              : t.modeOnsite}
                            {' · '}
                            {job.visaSupport === 'sponsored' ? t.visa_sponsored : job.timezone}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Remote & International Jobs */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{t.remoteJobs}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {approvedJobs
                    .filter((j) => j.workMode === 'remote' || j.country !== 'O‘zbekiston')
                    .map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleOpenJob(job)}
                        className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-600 transition-colors cursor-pointer flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="text-xs text-slate-500">
                            {job.country} · {job.city} ({job.exactAddress}) · {job.timezone}
                          </div>
                          <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>{job.companyName}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {job.salaryPeriod === 'daily'
                                ? 'Kunlik'
                                : job.salaryPeriod === 'hourly'
                                ? 'Soatlik'
                                : 'Oylik'}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-sm font-bold font-mono tabular-nums text-blue-700">
                            {formatJobSalary(job)}
                          </span>
                          <span className="text-xs text-slate-500">{job.workLanguage}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* All 20 Sectors Quick Directory */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{t.popularCategories} (20)</h2>
                  <button
                    onClick={() => setShowOnboardingModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    {t.btnEditPreferences} →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {JOB_SECTORS.map((sec) => {
                    const count = approvedJobs.filter((j) =>
                      doesJobMatchSectors(j, [sec.id])
                    ).length;
                    const isSelected = selectedSectors.includes(sec.id);
                    return (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setSelectedSectors([sec.id]);
                          setCurrentPage(1);
                          setActivePage('jobs');
                        }}
                        className={`p-3.5 border rounded-xl text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600'
                            : 'bg-white border-slate-200 hover:border-blue-600'
                        }`}
                      >
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {String(sec.number).padStart(2, '0')}. {sec.label[lang]}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-1 tabular-nums">
                          {count} {lang === 'uz' ? 'ta vakansiya' : lang === 'ru' ? 'вакансий' : 'jobs'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified Employer Companies Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{t.verifiedEmployers}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {companies.map((comp) => (
                    <div
                      key={comp.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-900">{comp.name}</h3>
                        {comp.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                            <ShieldCheck className="w-4 h-4" />
                            {t.verifiedCompany}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700">{t.unverifiedCompany}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {comp.industry} · {comp.city}, {comp.country}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{comp.description}</p>
                      <button
                        onClick={() => {
                          setFilterCompany(comp.id);
                          setActivePage('jobs');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Kompaniya vakansiyalarini ko‘rish →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Fraud Protection Callout */}
              <div className="p-6 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{t.antiScamBannerTitle}</h3>
                    <p className="text-xs text-slate-600 max-w-3xl">{t.antiScamBannerDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePage('architecture')}
                  className="px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Xavfsizlik qoidalarini ko‘rish
                </button>
              </div>
            </section>
          </div>
        )}

        {/* JOBS SEARCH & FILTER PAGE */}
        {activePage === 'jobs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Active Selected Sectors Banner */}
            {selectedSectors.length > 0 && (
              <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>
                      {t.savedPreferencesBanner} ({selectedSectors.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                    {selectedSectors.map((secId, idx) => {
                      const sec = JOB_SECTORS.find((s) => s.id === secId);
                      if (!sec) return null;
                      return (
                        <React.Fragment key={secId}>
                          <span className="font-medium">{sec.label[lang]}</span>
                          {idx < selectedSectors.length - 1 && (
                            <span className="text-slate-300">·</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowOnboardingModal(true)}
                    className="px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t.btnEditPreferences}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSectors([]);
                      setCurrentPage(1);
                    }}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {t.btnShowAllAvailableJobs}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Filter Sidebar */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span>Kengaytirilgan filtrlar</span>
                    </div>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      {t.btnReset}
                    </button>
                  </div>

                  {/* Button to open 20 Sectors selector */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowOnboardingModal(true)}
                      className="w-full py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center justify-between cursor-pointer"
                    >
                      <span>{t.onboardingTitle}</span>
                      <span className="font-mono">
                        {selectedSectors.length > 0 ? `${selectedSectors.length}/20` : 'Barchasi'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kasb, lavozim yoki ko‘nikma
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t.searchPlaceholder}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Mamlakat</label>
                      <select
                        value={filterCountry}
                        onChange={(e) => {
                          setFilterCountry(e.target.value);
                          setFilterCity('all');
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="all">{t.allCountries}</option>
                        {availableCountries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Shahar</label>
                      <select
                        value={filterCity}
                        onChange={(e) => {
                          setFilterCity(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="all">{t.allCities}</option>
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t.minSalary}</label>
                      <input
                        type="number"
                        value={filterMinSalary}
                        onChange={(e) => {
                          setFilterMinSalary(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t.maxSalary}</label>
                      <input
                        type="number"
                        value={filterMaxSalary}
                        onChange={(e) => {
                          setFilterMaxSalary(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{t.currency}</label>
                      <select
                        value={filterCurrency}
                        onChange={(e) => {
                          setFilterCurrency(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-mono"
                      >
                        <option value="all">Barchasi</option>
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        To‘lov turi (Oylik/Kunlik/Soatlik)
                      </label>
                      <select
                        value={filterSalaryPeriod}
                        onChange={(e) => {
                          setFilterSalaryPeriod(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        <option value="all">Barchasi (Oylik/Kunlik/Soatlik)</option>
                        <option value="monthly">Oylik ishlar</option>
                        <option value="daily">Kunlik ishlar</option>
                        <option value="hourly">Soatlik ishlar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Kimlar uchun (Erkak / Ayol)
                      </label>
                      <select
                        value={filterGender}
                        onChange={(e) => {
                          setFilterGender(e.target.value as any);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        <option value="all">Erkak va Ayollar uchun</option>
                        <option value="male">Erkaklar uchun mos</option>
                        <option value="female">Ayollar uchun mos</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterVerifiedEmployerOnly}
                          onChange={(e) => {
                            setFilterVerifiedEmployerOnly(e.target.checked);
                            setCurrentPage(1);
                          }}
                          className="rounded border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>Faqat tasdiqlangan ish beruvchilar</span>
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        INN tasdiqlangan
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Ish jadvali bo‘yicha filtr:
                      </label>
                      <select
                        value={filterScheduleType}
                        onChange={(e) => {
                          setFilterScheduleType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        <option value="all">Barcha ish jadvallari</option>
                        <option value="standard">Standart grafik (5/2, 09:00–18:00)</option>
                        <option value="flexible">Moslashuvchan / Erkin grafik</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Ish shakli</label>
                    <select
                      value={filterMode}
                      onChange={(e) => {
                        setFilterMode(e.target.value as any);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">{t.allModes}</option>
                      <option value="onsite">{t.modeOnsite}</option>
                      <option value="remote">{t.modeRemote}</option>
                      <option value="hybrid">{t.modeHybrid}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Bandlik turi</label>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value as any);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">{t.allTypes}</option>
                      <option value="full-time">{t.empFullTime}</option>
                      <option value="part-time">{t.empPartTime}</option>
                      <option value="contract">{t.empContract}</option>
                      <option value="temporary">{t.empTemporary}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Tajriba darajasi</label>
                    <select
                      value={filterExp}
                      onChange={(e) => {
                        setFilterExp(e.target.value as any);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="all">{t.allExperience}</option>
                      <option value="no-experience">{t.expNone}</option>
                      <option value="junior">{t.expJunior}</option>
                      <option value="mid">{t.expMid}</option>
                      <option value="senior">{t.expSenior}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Kompaniya</label>
                      <select
                        value={filterCompany}
                        onChange={(e) => {
                          setFilterCompany(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="all">Barchasi</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Ish tili</label>
                      <select
                        value={filterLang}
                        onChange={(e) => {
                          setFilterLang(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="all">{t.allLanguages}</option>
                        <option value="O‘zbek">O‘zbek</option>
                        <option value="Ingliz">Ingliz / English</option>
                        <option value="Rus">Rus / Русский</option>
                        <option value="Nemis">Nemis / Deutsch</option>
                      </select>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Job Listings Column */}
              <div className="lg:col-span-8 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-slate-900">
                    Topilgan vakansiyalar:{' '}
                    <span className="font-mono text-blue-600 tabular-nums">{filteredJobs.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Saralash:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="newest">{t.sortByNewest}</option>
                      <option value="salary">{t.sortBySalary}</option>
                    </select>
                  </div>
                </div>

                {paginatedJobs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
                    <div className="text-base font-bold text-slate-900">
                      {selectedSectors.length > 0 ? t.noJobsInSelectedSector : t.noJobsFound}
                    </div>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                      {selectedSectors.length > 0 ? t.noJobsInSelectedSectorSub : t.noJobsFoundSub}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setShowOnboardingModal(true)}
                        className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        {t.btnExploreOtherSectors}
                      </button>
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        {t.btnShowAllAvailableJobs}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedJobs.map((job) => {
                      const isSaved = savedJobs.some(
                        (s) => s.userId === currentUser?.id && s.jobId === job.id
                      );
                      const hasApplied = applications.some(
                        (a) => a.seekerId === currentUser?.id && a.jobId === job.id
                      );

                      return (
                        <div
                          key={job.id}
                          className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-600 transition-colors space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{job.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{job.createdAt}</span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono">Muddat: {job.deadline}</span>
                              </div>
                              <button
                                onClick={() => handleOpenJob(job)}
                                className="text-lg font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                              >
                                {job.title}
                              </button>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                                <span className="font-semibold">{job.companyName}</span>
                                <span aria-hidden="true">·</span>
                                {job.companyVerified ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {t.verifiedCompany}
                                  </span>
                                ) : (
                                  <span className="text-amber-700">{t.unverifiedCompany}</span>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-slate-800">
                                  📍 {job.city}, {job.country} — {job.exactAddress}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  {job.salaryPeriod === 'daily'
                                    ? 'Kunlik ish'
                                    : job.salaryPeriod === 'hourly'
                                    ? 'Soatlik ish'
                                    : 'Oylik ish'}
                                </span>
                                {job.disabilityFriendly && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                                      ♿ Moslashtirilgan
                                    </span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-700 font-semibold">
                                  {job.targetGender === 'male'
                                    ? 'Erkaklar uchun'
                                    : job.targetGender === 'female'
                                    ? 'Ayollar uchun'
                                    : 'Erkak va Ayol'}
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right shrink-0">
                              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                                {formatJobSalary(job)}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {job.workMode === 'remote'
                                  ? t.modeRemote
                                  : job.workMode === 'hybrid'
                                  ? t.modeHybrid
                                  : t.modeOnsite}
                                {' · '}
                                {job.workLanguage}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>

                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
                              {job.skills.slice(0, 4).map((s, i) => (
                                <React.Fragment key={s}>
                                  <span>{s}</span>
                                  {i < Math.min(job.skills.length, 4) - 1 && (
                                    <span className="text-slate-300">·</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenJob(job)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-900/40 text-blue-950 bg-blue-100/70 hover:bg-blue-200/80 cursor-pointer shadow-2xs"
                                title="Vakansiyaning yashirin shartlarsiz haqiqiy holati va tasdiqlangan mezonlarini ko‘rish"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                                <span>Haqiqat Oynasi</span>
                              </button>
                              <button
                                onClick={() => handleOpenChat(job.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 cursor-pointer"
                                title="Ish beruvchi bilan bevosita suhbatlashish"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                              </button>
                              <button
                                onClick={() => handleToggleSaveJob(job.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                                  isSaved
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {isSaved ? t.savedJob : t.saveJob}
                              </button>
                              <button
                                onClick={() => handleOpenJob(job)}
                                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                              >
                                {hasApplied ? t.appliedAlready : t.applyNow}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-slate-500 font-mono">
                      Sahifa {currentPage} / {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        ← Oldingi
                      </button>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        Keyingi →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDED JOBS (AI MATCHES) PAGE */}
        {activePage === 'recommended' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <RecommendedJobsView
              lang={lang}
              jobs={jobs}
              user={currentUser}
              preferences={activePreferences}
              savedJobs={savedJobs}
              applications={applications}
              onOpenJob={handleOpenJob}
              onToggleSaveJob={handleToggleSaveJob}
              onDismissJob={handleDismissJob}
              onRestoreDismissedJobs={handleRestoreDismissedJobs}
              onOpenOnboardingModal={() => setShowOnboardingModal(true)}
            />
          </div>
        )}

        {/* DEDICATED AI CAREER ADVISOR PAGE */}
        {activePage === 'ai-advisor' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AiCareerAdvisorView
              lang={lang}
              jobs={jobs}
              user={currentUser}
              preferences={activePreferences}
              savedJobs={savedJobs}
              applications={applications}
              onOpenJob={handleOpenJob}
              onToggleSaveJob={handleToggleSaveJob}
              onOpenOnboardingModal={() => setShowOnboardingModal(true)}
              onNavigateToResumes={() => {
                setActivePage('cabinet');
              }}
            />
          </div>
        )}

        {/* DEDICATED CHATROOM PAGE (ISH BERUVCHI VA NOMZOD SUHBATXONASI) */}
        {activePage === 'chat' && (
          <ChatRoomView
            currentUser={currentUser}
            users={users}
            jobs={approvedJobs}
            companies={companies}
            applications={applications}
            chatMessages={chatMessages}
            onSendMessage={handleSendChatMessage}
            onDeleteMessage={handleDeleteChatMessage}
            onOpenJob={handleOpenJob}
            onSwitchUser={(targetUser) => {
              setCurrentUserId(targetUser.id);
            }}
            initialJobId={selectedChatJobId}
            initialSeekerId={selectedChatSeekerId}
            lang={lang}
            onBackToJobs={() => setActivePage('jobs')}
          />
        )}

        {/* COMPANIES DIRECTORY PAGE */}
        {activePage === 'companies' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.verifiedEmployers}</h1>
              <p className="text-sm text-slate-600 mt-1">
                Har bir kompaniya STIR/INN va rasmiy korporativ domen orqali moderator tekshiruvidan o‘tadi.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {companies.map((c) => {
                const companyJobsCount = approvedJobs.filter((j) => j.companyId === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                        {c.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <ShieldCheck className="w-4 h-4" />
                            {t.verifiedCompany}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="w-4 h-4" />
                            {t.unverifiedCompany}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.industry} · {c.city}, {c.country}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500">
                        Faol vakansiyalar: {companyJobsCount}
                      </span>
                      <button
                        onClick={() => {
                          setFilterCompany(c.id);
                          setActivePage('jobs');
                        }}
                        className="font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Vakansiyalarni ko‘rish →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRICING PAGE */}
        {activePage === 'pricing' && (
          <PricingView
            lang={lang}
            plans={plans}
            currentUserPlan={currentUser?.plan}
            onSelectPlanForDemoUser={(planId: PlanTier) => {
              if (!currentUser) {
                setAuthModalOpen(true);
                return;
              }
              setUsers((prev) =>
                prev.map((u) => (u.id === currentUser.id ? { ...u, plan: planId } : u))
              );
              setDemoWebhookMessage(
                `Sizning hisobingiz uchun "${planId}" tarifi sinov (Sandbox) rejimida faollashtirildi! Endi vakansiyalarda berkitilgan ish beruvchi telefon raqami va Telegram manzili sizga ko‘rinadi.`
              );
            }}
            demoWebhookMessage={demoWebhookMessage}
            onSimulateWebhookCheck={(planId: PlanTier) => {
              setDemoWebhookMessage(
                `[DEMO WEBHOOK CHECK]: Plan "${planId}" tanlandi. To‘lov provayderi ulanmaganligi sababli haqiqiy to‘lov amalga oshirilmadi.`
              );
            }}
          />
        )}

        {/* SYSTEM & SECURITY ARCHITECTURE PAGE */}
        {activePage === 'architecture' && <ArchitectureView lang={lang} />}

        {/* ROLE-BASED WORKSPACE CABINET */}
        {activePage === 'cabinet' && (
          <>
            {!currentUser ? (
              <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Kabinetga kirish uchun tizimga kiring</h2>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg cursor-pointer"
                >
                  {t.btnSignIn}
                </button>
              </div>
            ) : currentUser.role === 'seeker' ? (
              <SeekerWorkspace
                user={currentUser}
                lang={lang}
                applications={applications.filter((a) => a.seekerId === currentUser.id)}
                savedJobs={jobs.filter((j) =>
                  savedJobs.some((s) => s.userId === currentUser.id && s.jobId === j.id)
                )}
                notifications={notifications.filter((n) => n.userId === currentUser.id)}
                chatMessages={chatMessages.filter(
                  (m) => m.seekerId === currentUser.id || m.senderId === currentUser.id
                )}
                onUpdateUser={(updated) => {
                  setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
                  if (updated.gender) {
                    setFilterGender(updated.gender);
                  }
                }}
                onSelectJob={(job) => handleOpenJob(job)}
                onRemoveSavedJob={(jobId) => handleToggleSaveJob(jobId)}
                onMarkNotificationsRead={() => {
                  setNotifications((prev) =>
                    prev.map((n) => (n.userId === currentUser.id ? { ...n, read: true } : n))
                  );
                }}
                onOpenOnboardingModal={() => setShowOnboardingModal(true)}
                onSendChatMessage={(jobId, jobTitle, companyName, text) =>
                  handleSendChatMessage(jobId, jobTitle, companyName, text)
                }
                onDeleteChatMessage={handleDeleteChatMessage}
                onOpenChatRoom={handleOpenChat}
              />
            ) : currentUser.role === 'employer' ? (
              <EmployerWorkspace
                user={currentUser}
                company={companies.find((c) => c.id === currentUser.companyId || c.ownerId === currentUser.id)}
                lang={lang}
                jobs={jobs}
                applications={applications}
                chatMessages={chatMessages}
                onSaveCompany={(savedComp) => {
                  setCompanies((prev) => {
                    const exists = prev.some((c) => c.id === savedComp.id);
                    return exists
                      ? prev.map((c) => (c.id === savedComp.id ? savedComp : c))
                      : [...prev, savedComp];
                  });
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === currentUser.id ? { ...u, companyId: savedComp.id } : u
                    )
                  );
                  appendAuditLog('COMPANY_UPDATED', savedComp.id, `Updated company ${savedComp.name}`);
                }}
                onCreateJob={(newJobData) => {
                  const created: JobRecord = {
                    ...newJobData,
                    id: `job_${Date.now()}`,
                    viewsCount: 1,
                    createdAt: new Date().toISOString().slice(0, 10),
                  };
                  setJobs((prev) => [created, ...prev]);
                  appendAuditLog('JOB_CREATED', created.id, `Created job ${created.title}`);
                }}
                onUpdateJobStatus={(jobId, status) => {
                  setJobs((prev) =>
                    prev.map((j) => (j.id === jobId ? { ...j, status } : j))
                  );
                }}
                onUpdateApplicationStatus={(appId, status: ApplicationStatus, interviewNote?: string) => {
                  const targetApp = applications.find((a) => a.id === appId);
                  setApplications((prev) =>
                    prev.map((a) =>
                      a.id === appId
                        ? { ...a, status, interviewNote, updatedAt: new Date().toISOString() }
                        : a
                    )
                  );
                  if (targetApp) {
                    setNotifications((prev) => [
                      {
                        id: `notif_${Date.now()}`,
                        userId: targetApp.seekerId,
                        title: `Ariza holati yangilandi: ${targetApp.jobTitle}`,
                        message: `${targetApp.companyName}: Arizangiz holati "${t[`status_${status}`]}" ga o‘zgardi. ${
                          interviewNote || ''
                        }`,
                        read: false,
                        createdAt: new Date().toISOString(),
                      },
                      ...prev,
                    ]);
                  }
                }}
                onSendChatMessage={(job, text, seekerId, seekerName) =>
                  handleSendChatMessage(
                    job.id,
                    job.title,
                    job.companyName,
                    text,
                    currentUser.id,
                    seekerId,
                    seekerName
                  )
                }
                onDeleteChatMessage={handleDeleteChatMessage}
                onOpenChatRoom={handleOpenChat}
              />
            ) : (
              <AdminWorkspace
                currentUser={currentUser}
                isAdminPasswordVerified={isAdminPasswordVerified}
                onVerifyAdminPassword={(pwd: string) => {
                  if (pwd.trim() === 'davlat') {
                    setIsAdminPasswordVerified(true);
                    return true;
                  }
                  return false;
                }}
                lang={lang}
                users={users}
                companies={companies}
                jobs={jobs}
                reports={reports}
                plans={plans}
                auditLogs={auditLogs}
                onToggleUserBlock={(uid) => {
                  setUsers((prev) =>
                    prev.map((u) =>
                      u.id === uid
                        ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' }
                        : u
                    )
                  );
                  appendAuditLog('USER_STATUS_TOGGLED', uid, 'Toggled user active/blocked state');
                }}
                onVerifyCompany={(compId, verified) => {
                  setCompanies((prev) =>
                    prev.map((c) =>
                      c.id === compId
                        ? {
                            ...c,
                            verified,
                            verificationStatus: verified ? 'verified' : 'unverified',
                          }
                        : c
                    )
                  );
                  setJobs((prev) =>
                    prev.map((j) =>
                      j.companyId === compId ? { ...j, companyVerified: verified } : j
                    )
                  );
                  appendAuditLog('COMPANY_VERIFICATION', compId, `Set verified=${verified}`);
                }}
                onModerateJob={(jobId, action) => {
                  if (action === 'delete') {
                    setJobs((prev) => prev.filter((j) => j.id !== jobId));
                    appendAuditLog('JOB_DELETED', jobId, 'Deleted illegal job listing');
                  } else {
                    setJobs((prev) =>
                      prev.map((j) => (j.id === jobId ? { ...j, status: action } : j))
                    );
                    appendAuditLog('JOB_MODERATED', jobId, `Set status=${action}`);
                  }
                }}
                onResolveReport={(repId, status) => {
                  setReports((prev) =>
                    prev.map((r) => (r.id === repId ? { ...r, status } : r))
                  );
                  appendAuditLog('REPORT_REVIEWED', repId, `Report marked as ${status}`);
                }}
                onUpdatePlanPrice={(planId, usd, yearlyUsd, uzs, jobLimit) => {
                  setPlans((prev) =>
                    prev.map((p) =>
                      p.id === planId
                        ? {
                            ...p,
                            priceMonthlyUsd: usd,
                            priceYearlyUsd: yearlyUsd,
                            priceMonthlyUzs: uzs,
                            jobPostLimit: jobLimit,
                          }
                        : p
                    )
                  );
                  appendAuditLog(
                    'PLAN_UPDATED',
                    planId,
                    `USD=${usd}/mo, Yearly=${yearlyUsd}/yr, UZS=${uzs}, limit=${jobLimit}`
                  );
                }}
              />
            )}
          </>
        )}

        {/* LEGAL, PRIVACY & HELP PAGE */}
        {activePage === 'legal' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h1 className="text-xl font-bold text-slate-900">{t.privacyPolicy}</h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                IshTop Global foydalanuvchilarning shaxsiy ma’lumotlarini (telefon raqami, elektron pochta, rezyume) ruxsatsiz uchinchi shaxslarga bermaydi. Ish qidiruvchi profilidagi ma’lumotlar faqat u ariza topshirgan kompaniya vakiliga ko‘rsatiladi. Foydalanuvchi istalgan vaqtda o‘z ma’lumotlarini JSON formatida yuklab olishi yoki hisobini butunlay o‘chirishni so‘rashi mumkin.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h2 className="text-xl font-bold text-slate-900">{t.termsOfUse} & {t.helpCenter}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Platformada soxta vakansiyalar joylashtirish, nomzodlardan oldindan to‘lov (hujjat, suhbat yoki viza uchun) talab qilish qat’iyan taqiqlanadi. Bunday e’lonlar kiberxavfsizlik filtri va administratorlar tomonidan darhol bloklanadi.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FIRST-ENTRY & PROFILE ONBOARDING MODAL */}
      {showOnboardingModal && (
        <OnboardingFlow
          lang={lang}
          initialPreferences={activePreferences}
          availableCountries={availableCountries}
          availableCities={availableCities}
          onChangeLang={setLang}
          onComplete={handleCompleteOnboarding}
          onSkipLater={handleSkipOnboardingLater}
        />
      )}

      {/* JOB DETAIL MODAL */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          company={companies.find((c) => c.id === selectedJob.companyId)}
          lang={lang}
          currentUser={currentUser}
          isSaved={savedJobs.some(
            (s) => s.userId === currentUser?.id && s.jobId === selectedJob.id
          )}
          existingApplication={applications.find(
            (a) => a.seekerId === currentUser?.id && a.jobId === selectedJob.id
          )}
          chatMessages={chatMessages}
          onClose={() => setSelectedJobId(null)}
          onToggleSave={handleToggleSaveJob}
          onApply={handleApplyToJob}
          onReport={handleReportJob}
          onSendChatMessage={(job, text) =>
            handleSendChatMessage(job.id, job.title, job.companyName, text)
          }
          onDeleteChatMessage={handleDeleteChatMessage}
          onOpenPricing={() => setActivePage('pricing')}
          onAdminDeleteIllegalJob={(jobId) => {
            if (currentUser?.role === 'admin' && isAdminPasswordVerified) {
              setJobs((prev) => prev.filter((j) => j.id !== jobId));
              appendAuditLog('ILLEGAL_JOB_EXPELLED', jobId, 'Admin expelled illegal job');
            }
          }}
          onOpenChatRoom={handleOpenChat}
        />
      )}

      {/* AUTH MODAL — Automatically links guest career preferences to user profile upon login/registration */}
      {authModalOpen && (
        <AuthModal
          lang={lang}
          users={users}
          onClose={() => setAuthModalOpen(false)}
          onSuccessLogin={(u) => {
            if (guestPreferences && !u.careerPreferences) {
              const updatedUser = { ...u, careerPreferences: guestPreferences };
              setUsers((prev) => prev.map((item) => (item.id === u.id ? updatedUser : item)));
            }
            setCurrentUserId(u.id);
          }}
          onRegisterUser={(newUser) => {
            const withPrefs: UserRecord = guestPreferences
              ? { ...newUser, careerPreferences: guestPreferences }
              : newUser;
            setUsers((prev) => [...prev, withPrefs]);
            setCurrentUserId(withPrefs.id);
          }}
        />
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <div className="font-bold text-slate-900">{t.brand}</div>
            <p>{t.aboutFooter}</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => setActivePage('legal')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t.privacyPolicy}
            </button>
            <button
              onClick={() => setActivePage('legal')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t.termsOfUse}
            </button>
            <button
              onClick={() => setActivePage('architecture')}
              className="hover:text-slate-900 cursor-pointer"
            >
              {t.navArchitecture}
            </button>
          </div>
        </div>
      </footer>

      {/* GLOBAL FLOATING AI COPILOT WIDGET IN BOTTOM-RIGHT CORNER (ACTIVE ACROSS ALL PAGES) */}
      <GlobalAiWidget
        lang={lang}
        activePage={activePage}
        currentUser={currentUser}
        preferences={activePreferences}
        jobs={approvedJobs}
        companies={companies}
        applications={applications}
        onOpenJob={handleOpenJob}
        onNavigatePage={(p: any) => setActivePage(p)}
      />
    </div>
  );
}

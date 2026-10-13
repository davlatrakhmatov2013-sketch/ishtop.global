import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Download,
  FileText,
  MessageSquare,
  Plus,
  Printer,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ApplicationRecord,
  ChatMessageRecord,
  DisabilityAccommodationKey,
  EducationItem,
  ExperienceItem,
  JobRecord,
  Language,
  NotificationRecord,
  UserGender,
  UserRecord,
} from '../types';
import { translations } from '../i18n';
import { isValidInternationalPhone, sanitizeText } from '../utils/security';
import { JOB_SECTORS } from '../data/sectors';
import { ResumeBuilderSection } from './ResumeBuilderSection';

interface SeekerWorkspaceProps {
  user: UserRecord;
  lang: Language;
  applications: ApplicationRecord[];
  savedJobs: JobRecord[];
  notifications: NotificationRecord[];
  chatMessages: ChatMessageRecord[];
  onUpdateUser: (updated: UserRecord) => void;
  onSelectJob: (job: JobRecord) => void;
  onRemoveSavedJob: (jobId: string) => void;
  onMarkNotificationsRead: () => void;
  onOpenOnboardingModal: () => void;
  onSendChatMessage: (jobId: string, jobTitle: string, companyName: string, text: string) => void;
  onDeleteChatMessage: (msgId: string) => void;
  onOpenChatRoom?: (jobId?: string) => void;
}

export const SeekerWorkspace: React.FC<SeekerWorkspaceProps> = ({
  user,
  lang,
  applications,
  savedJobs,
  notifications,
  chatMessages,
  onUpdateUser,
  onSelectJob,
  onRemoveSavedJob,
  onMarkNotificationsRead,
  onOpenOnboardingModal,
  onSendChatMessage,
  onDeleteChatMessage,
  onOpenChatRoom,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'resumes' | 'profile' | 'applications' | 'chats' | 'saved' | 'notifications' | 'privacy'>('resumes');

  const [fullName, setFullName] = useState(user.fullName);
  const [gender, setGender] = useState<UserGender>(user.gender || 'male');
  const [age, setAge] = useState<string>(user.age ? String(user.age) : '24');
  const [disabilityFilterEnabled, setDisabilityFilterEnabled] = useState<boolean>(
    Boolean(user.disabilityFilterEnabled)
  );
  const [accommodations, setAccommodations] = useState<DisabilityAccommodationKey[]>(
    user.accommodations || []
  );
  const [customAccommodationNote, setCustomAccommodationNote] = useState<string>(
    user.customAccommodationNote || ''
  );
  const [title, setTitle] = useState(user.title || '');
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(user.bio || '');
  const [skillsInput, setSkillsInput] = useState(user.skills.join(', '));
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chatText, setChatText] = useState('');

  // Experience & Education add state
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [eduInst, setEduInst] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduYear, setEduYear] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidInternationalPhone(phone)) {
      setStatusMsg({
        type: 'error',
        text:
          lang === 'uz'
            ? 'Xalqaro telefon raqami formati noto‘g‘ri (masalan: +998 90 123 45 67).'
            : lang === 'ru'
            ? 'Неверный формат международного номера телефона.'
            : 'Invalid international phone format.',
      });
      return;
    }

    const updatedSkills = skillsInput
      .split(',')
      .map((s) => sanitizeText(s, 40))
      .filter(Boolean)
      .slice(0, 15);

    onUpdateUser({
      ...user,
      fullName: sanitizeText(fullName, 80),
      gender,
      age: age ? Number(age) : undefined,
      disabilityFilterEnabled,
      accommodations,
      customAccommodationNote: sanitizeText(customAccommodationNote, 200),
      title: sanitizeText(title, 100),
      phone: sanitizeText(phone, 25),
      location: sanitizeText(location, 80),
      bio: sanitizeText(bio, 600),
      skills: updatedSkills,
    });

    setStatusMsg({
      type: 'success',
      text:
        lang === 'uz'
          ? 'Profil va rezyume ma’lumotlari muvaffaqiyatli saqlandi.'
          : lang === 'ru'
          ? 'Данные профиля и резюме сохранены.'
          : 'Profile and resume details saved.',
    });
  };

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany.trim() || !expRole.trim()) return;
    const newItem: ExperienceItem = {
      id: `exp_${Date.now()}`,
      company: sanitizeText(expCompany, 80),
      role: sanitizeText(expRole, 80),
      period: sanitizeText(expPeriod || '2024 — 2026', 40),
      description: sanitizeText(expDesc, 300),
    };
    onUpdateUser({
      ...user,
      experience: [newItem, ...user.experience],
    });
    setExpCompany('');
    setExpRole('');
    setExpPeriod('');
    setExpDesc('');
  };

  const handleAddEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInst.trim() || !eduDegree.trim()) return;
    const newItem: EducationItem = {
      id: `edu_${Date.now()}`,
      institution: sanitizeText(eduInst, 100),
      degree: sanitizeText(eduDegree, 100),
      year: sanitizeText(eduYear || '2020 — 2024', 30),
    };
    onUpdateUser({
      ...user,
      education: [newItem, ...user.education],
    });
    setEduInst('');
    setEduDegree('');
    setEduYear('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setStatusMsg({
        type: 'error',
        text:
          lang === 'uz'
            ? 'Xavfsizlik tekshiruvi: Faqat PDF yoki DOCX formatidagi rezyume fayllariga ruxsat beriladi.'
            : lang === 'ru'
            ? 'Проверка безопасности: Разрешены только файлы PDF или DOCX.'
            : 'Security check: Only PDF or DOCX resume files are permitted.',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({
        type: 'error',
        text:
          lang === 'uz'
            ? 'Fayl hajmi 5 MB dan oshmasligi kerak.'
            : lang === 'ru'
            ? 'Размер файла не должен превышать 5 МБ.'
            : 'File size must not exceed 5 MB.',
      });
      return;
    }
    onUpdateUser({
      ...user,
      resumeFileName: sanitizeText(file.name, 80),
      resumeFileSize: file.size,
    });
    setStatusMsg({
      type: 'success',
      text: `${file.name} (${Math.round(file.size / 1024)} KB) xavfsiz tekshiruvdan o‘tdi va biriktirildi.`,
    });
  };

  const handleExportPersonalData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'IshTop Global',
      userProfile: user,
      submittedApplications: applications,
      savedJobIds: savedJobs.map((j) => j.id),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ishtop_personal_data_${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintResume = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.seekerDashboard}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {user.fullName} · <span className="font-mono text-xs">{user.email}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintResume}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.downloadResumePdf}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg my-6 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('resumes')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'resumes' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mening rezyumelarim ({user.resumes?.length || 1})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.tabProfile}
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'applications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.tabApplications} ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'chats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ish beruvchi bilan suhbat ({chatMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.tabSaved} ({savedJobs.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('notifications');
            onMarkNotificationsRead();
          }}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.tabNotifications} ({notifications.filter((n) => !n.read).length})
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t.tabPrivacy}
        </button>
      </div>

      {statusMsg && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs font-medium flex items-center justify-between no-print ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-500 hover:text-slate-800 ml-4">
            ✕
          </button>
        </div>
      )}

      {/* TAB 0: MENING REZYUMELARIM (MULTI-RESUME BUILDER & PDF) */}
      {activeTab === 'resumes' && (
        <ResumeBuilderSection user={user} lang={lang} onUpdateUser={onUpdateUser} />
      )}

      {/* TAB 1: PROFILE & RESUME BUILDER */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8 no-print">
            {/* Career Sectors & Onboarding Preferences Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {lang === 'uz'
                      ? 'Tanlangan ish sohalari va qidiruv mezonlari'
                      : lang === 'ru'
                      ? 'Выбранные сферы работы и параметры поиска'
                      : 'Selected Career Sectors & Preferences'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'uz'
                      ? 'Profilingizga biriktirilgan ish yo‘nalishlari va maosh/hudud talablari.'
                      : lang === 'ru'
                      ? 'Привязанные к вашему профилю направления и предпочтения.'
                      : 'Career sectors and location/salary preferences linked to your profile.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenOnboardingModal}
                  className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.btnEditPreferences}
                </button>
              </div>

              {user.careerPreferences && user.careerPreferences.sectors.length > 0 ? (
                <div className="pt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-800">
                    {user.careerPreferences.sectors.map((secId, idx) => {
                      const found = JOB_SECTORS.find((s) => s.id === secId);
                      if (!found) return null;
                      return (
                        <React.Fragment key={secId}>
                          <span>{found.label[lang]}</span>
                          {idx < user.careerPreferences!.sectors.length - 1 && (
                            <span className="text-slate-300">·</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="text-xs font-mono text-slate-500">
                    {user.careerPreferences.country !== 'all'
                      ? user.careerPreferences.country
                      : t.allCountries}{' '}
                    ·{' '}
                    {user.careerPreferences.city !== 'all'
                      ? user.careerPreferences.city
                      : t.allCities}{' '}
                    ·{' '}
                    {user.careerPreferences.workMode !== 'all'
                      ? user.careerPreferences.workMode
                      : t.allModes}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 pt-1">
                  {lang === 'uz'
                    ? 'Hozircha aniq soha tanlanmagan (Barcha vakansiyalar ko‘rsatilmoqda).'
                    : lang === 'ru'
                    ? 'Конкретная сфера не выбрана (Отображаются все вакансии).'
                    : 'No specific sector selected yet (Showing all available jobs).'}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">
                {lang === 'uz' ? 'Asosiy shaxsiy va kasbiy ma’lumotlar' : lang === 'ru' ? 'Основные личные и профессиональные данные' : 'Primary Personal & Professional Information'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'uz' ? 'To‘liq ism-sharif' : lang === 'ru' ? 'ФИО' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'uz' ? 'Mutaxassislik / Lavozim' : lang === 'ru' ? 'Желаемая должность' : 'Professional Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'uz' ? 'Xalqaro telefon raqami' : lang === 'ru' ? 'Телефон (международный)' : 'International Phone'}
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'uz' ? 'Shahar va Mamlakat' : lang === 'ru' ? 'Город и Страна' : 'City & Country'}
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jinsingiz (Erkak / Ayol / Ko‘rsatishni istamayman)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as UserGender)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                    <option value="prefer_not_to_say">Ko‘rsatishni istamayman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Yoshingiz (Mehnat qonunchiligi me’yori uchun)
                  </label>
                  <input
                    type="number"
                    min={14}
                    max={85}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Separate Confidential Disability & Workplace Accommodations Section */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disabilityFilterEnabled}
                    onChange={(e) => setDisabilityFilterEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-blue-400"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">
                      ♿ Nogironligi bo‘lgan insonlar uchun mos ishlarni ko‘rsatish (Ixtiyoriy)
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Tibbiy tashxis yoki hujjat talab qilinmaydi. Ushbu ma’lumot maxfiy saqlanadi va roziligingizsiz ish beruvchiga oshkor etilmaydi.
                    </p>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {(
                    [
                      ['remote-home', 'Masofadan / Uyda ishlash'],
                      ['flexible-schedule', 'Moslashuvchan ish jadvali'],
                      ['part-time-option', 'Yarim stavka ishlash'],
                      ['wheelchair-access', 'Nogironlar aravachasi uchun qulay ish joyi'],
                      ['ramp-elevator', 'Pandus yoki lift mavjudligi'],
                      ['adapted-workstation', 'Maxsus uskunalar / moslashtirilgan ish joyi'],
                      ['hearing-support', 'Eshitish imkoniyati cheklanganlar uchun sharoit'],
                      ['vision-assistive-tech', 'Ko‘rish uchun yordamchi texnologiyalar'],
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
                  <input
                    type="text"
                    value={customAccommodationNote}
                    onChange={(e) => setCustomAccommodationNote(e.target.value)}
                    placeholder="Boshqa kerakli qulayliklar (ixtiyoriy)..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'uz' ? 'Ko‘nikmalar (vergul bilan ajrating)' : lang === 'ru' ? 'Навыки (через запятую)' : 'Key Skills (comma separated)'}
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'uz' ? 'Qisqacha professional tavsif' : lang === 'ru' ? 'Краткое резюме о себе' : 'Professional Summary'}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                {lang === 'uz' ? 'O‘zgarishlarni saqlash' : lang === 'ru' ? 'Сохранить изменения' : 'Save Profile Changes'}
              </button>
            </form>

            {/* Safe Resume File Upload */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>
                  {lang === 'uz' ? 'Rezyume faylini xavfsiz yuklash (PDF / DOCX, maks. 5MB)' : lang === 'ru' ? 'Безопасная загрузка файла резюме (PDF / DOCX)' : 'Secure Resume File Attachment (PDF / DOCX, max 5MB)'}
                </span>
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="text-xs text-slate-600">
                  {user.resumeFileName ? (
                    <span className="font-mono text-slate-900 font-medium">
                      Biriktirilgan fayl: {user.resumeFileName}
                    </span>
                  ) : (
                    <span>Hozircha fayl yuklanmagan</span>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? 'Fayl tanlash' : lang === 'ru' ? 'Выбрать файл' : 'Choose File'}</span>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Add Work Experience */}
            <form onSubmit={handleAddExperience} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'uz' ? 'Ish tajribasini qo‘shish' : lang === 'ru' ? 'Добавить опыт работы' : 'Add Work Experience'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={lang === 'uz' ? 'Kompaniya nomi' : 'Company'}
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder={lang === 'uz' ? 'Lavozim' : 'Role'}
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder={lang === 'uz' ? 'Davr (2022 - 2025)' : 'Period'}
                  value={expPeriod}
                  onChange={(e) => setExpPeriod(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <input
                type="text"
                placeholder={lang === 'uz' ? 'Asosiy natijalar va vazifalar...' : 'Key achievements and responsibilities...'}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Tajriba qo‘shish' : lang === 'ru' ? 'Добавить опыт' : 'Add Experience'}</span>
              </button>
            </form>

            {/* Add Education */}
            <form onSubmit={handleAddEducation} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === 'uz' ? 'Ta’lim ma’lumotlarini qo‘shish' : lang === 'ru' ? 'Добавить образование' : 'Add Education'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder={lang === 'uz' ? 'OTM / Muassasa' : 'Institution'}
                  value={eduInst}
                  onChange={(e) => setEduInst(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  required
                  placeholder={lang === 'uz' ? 'Yo‘nalish va daraja' : 'Degree'}
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder={lang === 'uz' ? 'Yillar (2018 - 2022)' : 'Years'}
                  value={eduYear}
                  onChange={(e) => setEduYear(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Ta’lim qo‘shish' : lang === 'ru' ? 'Добавить ВУЗ' : 'Add Education'}</span>
              </button>
            </form>
          </div>

          {/* Printable Live CV Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
                  <p className="text-sm font-medium text-blue-700 mt-0.5">{user.title}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {user.location} · {user.phone} · {user.email}
                  </p>
                </div>
              </div>

              {user.bio && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    {lang === 'uz' ? 'Profil haqida' : lang === 'ru' ? 'О специалисте' : 'Profile Summary'}
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{user.bio}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {lang === 'uz' ? 'Ko‘nikmalar' : lang === 'ru' ? 'Навыки' : 'Skills'}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-800">
                  {user.skills.map((s, idx) => (
                    <React.Fragment key={s}>
                      <span>{s}</span>
                      {idx < user.skills.length - 1 && <span className="text-slate-300">·</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {lang === 'uz' ? 'Ish tajribasi' : lang === 'ru' ? 'Опыт работы' : 'Work Experience'}
                </h4>
                <div className="space-y-4">
                  {user.experience.map((exp) => (
                    <div key={exp.id} className="border-b border-slate-100 pb-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">{exp.role}</span>
                        <span className="text-xs font-mono text-slate-500">{exp.period}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{exp.company}</div>
                      <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {lang === 'uz' ? 'Ta’lim' : lang === 'ru' ? 'Образование' : 'Education'}
                </h4>
                <div className="space-y-3">
                  {user.education.map((edu) => (
                    <div key={edu.id} className="flex items-start justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{edu.institution}</div>
                        <div className="text-slate-600">{edu.degree}</div>
                      </div>
                      <span className="font-mono text-slate-500">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMITTED APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-medium text-slate-800">
                {lang === 'uz' ? 'Hozircha hech qanday vakansiyaga ariza yubormagansiz.' : lang === 'ru' ? 'Вы еще не отправляли отклики.' : 'You have not submitted any job applications yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Vakansiya va Kompaniya' : 'Role & Company'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Yuborilgan sana' : 'Submitted Date'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Holati' : 'Status'}</th>
                    <th className="py-3.5 px-4">{lang === 'uz' ? 'Ish beruvchi xabari' : 'Employer Note'}</th>
                    <th className="py-3.5 px-4 text-right">Muloqot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{app.jobTitle}</div>
                        <div className="text-xs text-slate-500">{app.companyName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums">
                        {app.createdAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            app.status === 'accepted' || app.status === 'interview'
                              ? 'text-emerald-700'
                              : app.status === 'rejected'
                              ? 'text-red-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {t[`status_${app.status}`]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {app.interviewNote || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onOpenChatRoom && (
                          <button
                            type="button"
                            onClick={() => onOpenChatRoom(app.jobId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Suhbat (Chat)</span>
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

      {/* TAB 2.5: DIRECT CHATS WITH EMPLOYERS */}
      {activeTab === 'chats' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Ish beruvchilar bilan suhbat kabineti
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
                Yozgan xabaringizni istalgan vaqtda o‘chirib tashlashingiz mumkin
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <div className="text-xs text-slate-500 py-8 text-center">
                Hozircha yozishmalar yo‘q. Istalgan vakansiya ichidan yoki shu yerdan xabar yozishingiz mumkin.
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      Kompaniya: <strong className="text-slate-800">{msg.companyName}</strong> ({msg.jobTitle}) ·{' '}
                      <span className="font-mono">{msg.createdAt.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div className="text-xs font-bold text-blue-700">{msg.senderName}</div>
                    <p className="text-sm text-slate-800">{msg.text}</p>
                  </div>
                  {msg.senderId === user.id && (
                    <button
                      type="button"
                      onClick={() => onDeleteChatMessage(msg.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O‘chirish</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatText.trim()) return;
              const defaultJobId = chatMessages[0]?.jobId || 'job_1001';
              const defaultJobTitle = chatMessages[0]?.jobTitle || 'Vakansiya bo‘yicha suhbat';
              const defaultComp = chatMessages[0]?.companyName || 'SilkRoad FinTech & Cloud';
              onSendChatMessage(defaultJobId, defaultJobTitle, defaultComp, chatText);
              setChatText('');
            }}
            className="flex items-center gap-2 pt-3 border-t border-slate-200"
          >
            <input
              type="text"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Ish beruvchiga xabar yozing..."
              className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              Yuborish
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SAVED JOBS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-600">
              {lang === 'uz' ? 'Saqlangan vakansiyalar ro‘yxati bo‘sh.' : lang === 'ru' ? 'Список сохраненных вакансий пуст.' : 'No saved jobs yet.'}
            </div>
          ) : (
            savedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <button
                    onClick={() => onSelectJob(job)}
                    className="text-base font-semibold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                  >
                    {job.title}
                  </button>
                  <div className="text-xs text-slate-500 mt-1">
                    {job.companyName} · {job.city}, {job.country}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectJob(job)}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    {lang === 'uz' ? 'Ko‘rish' : 'View'}
                  </button>
                  <button
                    onClick={() => onRemoveSavedJob(job.id)}
                    className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-600">
              {lang === 'uz' ? 'Bildirishnomalar yo‘q.' : 'No notifications.'}
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">{n.createdAt.slice(0, 10)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: PRIVACY, DATA EXPORT & ACCOUNT DELETION */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {lang === 'uz' ? 'Shaxsiy ma’lumotlar maxfiyligi va GDPR/O‘zR Qonunchiligi huquqlari' : 'Personal Data Privacy & Export Controls'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {lang === 'uz'
                  ? 'Rezyume va aloqa ma’lumotlaringiz faqat siz ariza yuborgan ish beruvchi kompaniyalarga ko‘rinadi.'
                  : 'Your contact details and CV are strictly isolated to verified employers you apply to.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-y border-slate-200">
            <div>
              <div className="text-sm font-medium text-slate-900">
                {lang === 'uz' ? 'Tasdiqlangan ish beruvchilar uchun profilni ochiq qilish' : 'Allow verified employers to view profile summary'}
              </div>
              <div className="text-xs text-slate-500">
                {user.privacyShowProfile ? 'Faol (Ish beruvchilar ko‘ra oladi)' : 'Yopiq (Faqat ariza yuborilganda ko‘rinadi)'}
              </div>
            </div>
            <button
              onClick={() => onUpdateUser({ ...user, privacyShowProfile: !user.privacyShowProfile })}
              className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {user.privacyShowProfile ? 'Yopiq qilish' : 'Ochiq qilish'}
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-slate-200">
            <div>
              <div className="text-sm font-medium text-slate-900">
                ♿ Maxsus imkoniyatlar va ish joyi qulayligi ehtiyojlari maxfiyligi
              </div>
              <div className="text-xs text-slate-500">
                {user.privacyShareAccommodationsWithEmployer
                  ? 'Ariza yuborilganda ish beruvchiga qulaylik ehtiyojlari avtomatik biriktiriladi'
                  : 'Maxfiy saqlanadi (Faqat siz o‘zingiz ruxsat bergan arizalarda ko‘rsatiladi)'}
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateUser({
                  ...user,
                  privacyShareAccommodationsWithEmployer:
                    !user.privacyShareAccommodationsWithEmployer,
                })
              }
              className="px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {user.privacyShareAccommodationsWithEmployer
                ? 'Maxfiy (Yopiq) qilish'
                : 'Ariza bilan ulashishni yoqish'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleExportPersonalData}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportDataJson}</span>
            </button>

            <button
              onClick={() => {
                onUpdateUser({ ...user, status: 'deletion-requested' });
                setStatusMsg({
                  type: 'success',
                  text:
                    lang === 'uz'
                      ? 'Hisobni o‘chirish so‘rovi qayd etildi. Administrator tomonidan 24 soat ichida barcha shaxsiy ma’lumotlar o‘chiriladi.'
                      : 'Account deletion request logged.',
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {user.status === 'deletion-requested'
                  ? 'O‘chirish so‘rovi yuborilgan'
                  : t.requestDeleteAccount}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

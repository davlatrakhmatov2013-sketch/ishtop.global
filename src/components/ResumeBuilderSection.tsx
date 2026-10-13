import React, { useState } from 'react';
import {
  Award,
  Bot,
  CheckCircle2,
  Copy,
  FileText,
  FolderGit2,
  Globe,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CertificateItem,
  EducationItem,
  EmploymentType,
  ExperienceItem,
  Language,
  LanguageSkillItem,
  ProjectItem,
  ResumeDocument,
  ResumeTemplateStyle,
  UserRecord,
  WorkMode,
} from '../types';
import { sanitizeText } from '../utils/security';

interface ResumeBuilderSectionProps {
  user: UserRecord;
  lang: Language;
  onUpdateUser: (updated: UserRecord) => void;
}

function buildDefaultResume(user: UserRecord): ResumeDocument {
  const parts = (user.location || 'Toshkent, O‘zbekiston').split(',');
  const city = (parts[0] || 'Toshkent').trim();
  const country = (parts[1] || 'O‘zbekiston').trim();

  return {
    id: `res_${Date.now()}`,
    userId: user.id,
    resumeTitle: `${user.title || 'Mutaxassis'} — Asosiy Rezyume`,
    template: 'modern',
    isPrimary: true,
    fullName: user.fullName,
    professionalTitle: user.title || 'Mutaxassis',
    summary:
      user.bio ||
      'Maqsadga intiluvchan, mas’uliyatli va zamonaviy kasbiy ko‘nikmalarga ega mutaxassis.',
    email: user.email,
    phone: user.phone,
    telegram: user.telegram || '@ishtop_nomzod',
    country,
    city,
    desiredWorkMode: user.careerPreferences?.workMode === 'remote' ? 'remote' : 'onsite',
    desiredEmploymentType: 'full-time',
    skills: user.skills.length > 0 ? user.skills : ['Mas’uliyat', 'Jamoada ishlash', 'MS Office'],
    languages: user.languages || [
      { id: 'lng_1', language: 'O‘zbek tili', level: 'Ona tili / Mukammal (C2)' },
      { id: 'lng_2', language: 'Rus tili', level: 'Yuqori (C1)' },
      { id: 'lng_3', language: 'Ingliz tili', level: 'O‘rta (B1-B2)' },
    ],
    experience: user.experience || [],
    education: user.education || [],
    certificates: user.certificates || [
      {
        id: 'cert_1',
        name: 'Kasbiy Malaka va Xavfsizlik Sertifikati',
        issuer: 'O‘zbekiston Malaka Markazi',
        year: '2025',
      },
    ],
    projects: user.projects || [
      {
        id: 'prj_1',
        title: 'Ish unumdorligini 35% ga oshirish loyihasi',
        description: 'Jarayonlarni avtomatlashtirish va sifat nazoratini yo‘lga qo‘yish.',
      },
    ],
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export const ResumeBuilderSection: React.FC<ResumeBuilderSectionProps> = ({
  user,
  lang,
  onUpdateUser,
}) => {
  const resumes: ResumeDocument[] =
    user.resumes && user.resumes.length > 0 ? user.resumes : [buildDefaultResume(user)];

  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0].id);
  const activeResume =
    resumes.find((r) => r.id === selectedResumeId) || resumes[0];

  const [resumeTitle, setResumeTitle] = useState(activeResume.resumeTitle);
  const [template, setTemplate] = useState<ResumeTemplateStyle>(activeResume.template);
  const [fullName, setFullName] = useState(activeResume.fullName);
  const [professionalTitle, setProfessionalTitle] = useState(activeResume.professionalTitle);
  const [summary, setSummary] = useState(activeResume.summary);
  const [email, setEmail] = useState(activeResume.email);
  const [phone, setPhone] = useState(activeResume.phone);
  const [telegram, setTelegram] = useState(activeResume.telegram || '');
  const [country, setCountry] = useState(activeResume.country);
  const [city, setCity] = useState(activeResume.city);
  const [desiredWorkMode, setDesiredWorkMode] = useState<WorkMode>(activeResume.desiredWorkMode);
  const [desiredEmploymentType, setDesiredEmploymentType] = useState<EmploymentType>(
    activeResume.desiredEmploymentType
  );
  const [skillsInput, setSkillsInput] = useState(activeResume.skills.join(', '));
  const [languages, setLanguages] = useState<LanguageSkillItem[]>(activeResume.languages);
  const [experience, setExperience] = useState<ExperienceItem[]>(activeResume.experience);
  const [education, setEducation] = useState<EducationItem[]>(activeResume.education);
  const [certificates, setCertificates] = useState<CertificateItem[]>(activeResume.certificates);
  const [projects, setProjects] = useState<ProjectItem[]>(activeResume.projects);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // AI Resume & Cover Letter Copilot states (requires user review & confirmation before applying)
  const [aiTargetJobTitle, setAiTargetJobTitle] = useState('');
  const [aiProposedSummary, setAiProposedSummary] = useState<string | null>(null);
  const [aiProposedSkills, setAiProposedSkills] = useState<string | null>(null);
  const [aiCoverLetter, setAiCoverLetter] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateAiResumeImprovements = async () => {
    setAiGenerating(true);
    const currentSkillsList = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const response = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'resume-cv',
          prompt: `Mutaxassislik: ${professionalTitle}. Maqsadli vakansiya: ${
            aiTargetJobTitle || professionalTitle
          }. Joriy tanishtiruv: ${summary}. Ko‘nikmalar: ${skillsInput}. Iltimos, ushbu ma’lumotlarni imlo va uslub jihatidan tekshirib, professional CV Summary hamda ish beruvchi uchun Motivatsion xat tayyorlab ber (foydalanuvchi aytmagan diplom yoki tajribani qo‘shma).`,
          lang,
          userKey: user.id,
          pageContext: 'cabinet-resumes',
          resumeContext: {
            fullName,
            professionalTitle,
            skills: currentSkillsList,
            experienceCount: experience.length,
            educationCount: education.length,
          },
        }),
      });
      const data = await response.json();
      const targetRole = aiTargetJobTitle.trim() || professionalTitle || 'Mutaxassis';
      const fallbackSummary = `${fullName} — ${targetRole} yo‘nalishida mas’uliyatli va amaliy ko‘nikmalarga (${
        currentSkillsList.join(', ') || 'kasbiy mahorat'
      }) ega mutaxassis. Vazifalarni belgilangan muddatda, sifat standartlariga to‘liq rioya qilgan holda bajarish va jamoa samaradorligini oshirishga yo‘naltirilgan.`;

      const fallbackCover = `Hurmatli ish beruvchi!\n\nKompaniyangizdagi "${targetRole}" vakansiyasi bo‘yicha o‘z rezyumemni taqdim etmoqdaman. Mening asosiy ko‘nikmalarim (${
        currentSkillsList.join(', ') || 'intizom va mas’uliyat'
      }) hamda amaliy tajribam sizning e’loningizda ko‘rsatilgan kunlik ish tartibi va vazifalarni sifatli bajarishga to‘liq mos keladi.\n\nSuhbat jarayonida o‘z malakamni amalda ko‘rsatishga tayyorman.\n\nHurmat bilan,\n${fullName}\nTel: ${phone}`;

      setAiProposedSummary(data.draftText || fallbackSummary);
      setAiProposedSkills(
        Array.from(new Set([...currentSkillsList, 'Mas’uliyat', 'Jamoada ishlash', 'Sifat nazorati'])).join(', ')
      );
      setAiCoverLetter(data.reply ? `${data.reply}\n\n---\n${fallbackCover}` : fallbackCover);
    } catch {
      const targetRole = aiTargetJobTitle.trim() || professionalTitle || 'Mutaxassis';
      setAiProposedSummary(
        `${fullName} — ${targetRole} sohasida aniq natijaga ishlaydigan, intizomli va zamonaviy ko‘nikmalarga (${skillsInput}) ega mutaxassis.`
      );
      setAiProposedSkills(skillsInput);
      setAiCoverLetter(
        `Assalomu alaykum! "${targetRole}" vakansiyasi bo‘yicha nomzodimni ko‘rib chiqishingizni so‘rayman. Ko‘nikmalarim: ${skillsInput}. Hurmat bilan, ${fullName} (${phone}).`
      );
    } finally {
      setAiGenerating(false);
    }
  };

  // Add item sub-inputs
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [eduInst, setEduInst] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduYear, setEduYear] = useState('');

  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('');

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');

  const [langName, setLangName] = useState('');
  const [langLevel, setLangLevel] = useState<LanguageSkillItem['level']>('O‘rta (B1-B2)');

  const loadResumeIntoEditor = (doc: ResumeDocument) => {
    setSelectedResumeId(doc.id);
    setResumeTitle(doc.resumeTitle);
    setTemplate(doc.template);
    setFullName(doc.fullName);
    setProfessionalTitle(doc.professionalTitle);
    setSummary(doc.summary);
    setEmail(doc.email);
    setPhone(doc.phone);
    setTelegram(doc.telegram || '');
    setCountry(doc.country);
    setCity(doc.city);
    setDesiredWorkMode(doc.desiredWorkMode);
    setDesiredEmploymentType(doc.desiredEmploymentType);
    setSkillsInput(doc.skills.join(', '));
    setLanguages(doc.languages);
    setExperience(doc.experience);
    setEducation(doc.education);
    setCertificates(doc.certificates);
    setProjects(doc.projects);
  };

  const handleSaveCurrentResume = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanedSkills = skillsInput
      .split(',')
      .map((s) => sanitizeText(s, 40))
      .filter(Boolean);

    const updatedDoc: ResumeDocument = {
      ...activeResume,
      resumeTitle: sanitizeText(resumeTitle || 'Mening Rezyumem', 80),
      template,
      fullName: sanitizeText(fullName, 80),
      professionalTitle: sanitizeText(professionalTitle, 100),
      summary: sanitizeText(summary, 800),
      email: sanitizeText(email, 80),
      phone: sanitizeText(phone, 30),
      telegram: sanitizeText(telegram, 40),
      country: sanitizeText(country, 60),
      city: sanitizeText(city, 60),
      desiredWorkMode,
      desiredEmploymentType,
      skills: cleanedSkills,
      languages,
      experience,
      education,
      certificates,
      projects,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const nextResumes = resumes.some((r) => r.id === updatedDoc.id)
      ? resumes.map((r) => (r.id === updatedDoc.id ? updatedDoc : r))
      : [...resumes, updatedDoc];

    onUpdateUser({
      ...user,
      fullName: updatedDoc.fullName,
      title: updatedDoc.professionalTitle,
      bio: updatedDoc.summary,
      phone: updatedDoc.phone,
      location: `${updatedDoc.city}, ${updatedDoc.country}`,
      skills: updatedDoc.skills,
      languages: updatedDoc.languages,
      experience: updatedDoc.experience,
      education: updatedDoc.education,
      certificates: updatedDoc.certificates,
      projects: updatedDoc.projects,
      resumes: nextResumes,
    });

    setSavedNotice(
      lang === 'ru'
        ? 'Резюме успешно сохранено и синхронизировано с ИИ-подбором!'
        : lang === 'en'
        ? 'Resume saved and synced with AI job matcher!'
        : 'Rezyume saqlandi va AI mos ish topish tizimi bilan bog‘landi!'
    );
  };

  const handleCreateNewResumeVariant = () => {
    const newVariant: ResumeDocument = {
      ...buildDefaultResume(user),
      id: `res_${Date.now()}`,
      resumeTitle: `Yangi Rezyume Varianti #${resumes.length + 1}`,
      isPrimary: false,
    };
    const nextResumes = [...resumes, newVariant];
    onUpdateUser({ ...user, resumes: nextResumes });
    loadResumeIntoEditor(newVariant);
  };

  const handleDeleteResumeVariant = (id: string) => {
    if (resumes.length <= 1) return;
    const nextResumes = resumes.filter((r) => r.id !== id);
    onUpdateUser({ ...user, resumes: nextResumes });
    loadResumeIntoEditor(nextResumes[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Multiple Resumes Switcher + PDF Print CTA */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            2-MODUL: MENING REZYUMELARIM VA PDF GENERATOR
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Professional Rezyume Muharriri ({resumes.length} ta rezyume)
          </h2>
          <p className="text-xs text-slate-500">
            Shaxsni tasdiqlovchi hujjat (pasport/ID), tug‘ilgan sana yoki uy manzilini kiritish talab etilmaydi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNewResumeVariant}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>+ Yangi rezyume yaratish</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveCurrentResume()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Rezyumeni saqlash</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSaveCurrentResume();
              setTimeout(() => window.print(), 100);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF shaklida yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Saved Resumes Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 no-print">
        {resumes.map((r) => (
          <div
            key={r.id}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium ${
              r.id === activeResume.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <button
              type="button"
              onClick={() => loadResumeIntoEditor(r)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{r.resumeTitle}</span>
            </button>
            {resumes.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteResumeVariant(r.id)}
                className="opacity-80 hover:opacity-100 cursor-pointer ml-1"
                title="Rezyumeni o‘chirish"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {savedNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center justify-between no-print">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {savedNotice}
          </span>
          <button onClick={() => setSavedNotice(null)} className="text-slate-500">
            ✕
          </button>
        </div>
      )}

      {/* AI RESUME & COVER LETTER ASSISTANT (With User Confirmation Before Saving) */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>AI YORDAMIDA CV TAKOMILLASHTIRISH VA MOTIVATSION XAT YOZISH</span>
            </div>
            <p className="text-xs text-slate-600">
              AI siz aytmagan ish tajribasi, diplom yoki sertifikatlarni to‘qib chiqarmaydi. Taklif etilgan o‘zgarishlarni ko‘rib chiqib, tasdiqlaganingizdan so‘nggina rezyumega qo‘shiladi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              type="text"
              value={aiTargetJobTitle}
              onChange={(e) => setAiTargetJobTitle(e.target.value)}
              placeholder="Qaysi vakansiyaga moslash kerak? (ixtiyoriy)"
              className="px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleGenerateAiResumeImprovements}
              disabled={aiGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {aiGenerating
                  ? 'AI tahlil qilmoqda...'
                  : 'AI bilan CV va Motivatsion xat tayyorlash'}
              </span>
            </button>
          </div>
        </div>

        {(aiProposedSummary || aiCoverLetter) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-200">
            {aiProposedSummary && (
              <div className="bg-white border border-blue-200 rounded-lg p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  1. AI taklif etgan CV qisqacha tanishtiruvi (Imlo tekshirilgan):
                </div>
                <textarea
                  rows={4}
                  value={aiProposedSummary}
                  onChange={(e) => setAiProposedSummary(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAiProposedSummary(null)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSummary(aiProposedSummary);
                      if (aiProposedSkills) setSkillsInput(aiProposedSkills);
                      setSavedNotice(
                        'AI taklif etgan tanishtiruv matni tasdiqlandi! Endi "Rezyumeni saqlash" tugmasini bosing.'
                      );
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                  >
                    ✓ Tasdiqlash va Rezyumega qo‘llash
                  </button>
                </div>
              </div>
            )}

            {aiCoverLetter && (
              <div className="bg-white border border-blue-200 rounded-lg p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  2. Ish beruvchiga yuborish uchun Motivatsion xat (Cover Letter):
                </div>
                <textarea
                  rows={4}
                  value={aiCoverLetter}
                  onChange={(e) => setAiCoverLetter(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(aiCoverLetter);
                      setSavedNotice('Motivatsion xat nusxalandi! Ariza yuborishda foydalanishingiz mumkin.');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Motivatsion xatni nusxalash
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FULL RESUME EDITOR */}
        <div className="lg:col-span-7 space-y-6 no-print">
          {/* 1. Basic & Contact Details */}
          <form
            onSubmit={handleSaveCurrentResume}
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                1. Asosiy ma’lumotlar, hudud va aloqa
              </h3>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as ResumeTemplateStyle)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="modern">Shablon: Modern Clean</option>
                <option value="classic">Shablon: Classic Academic</option>
                <option value="executive">Shablon: Executive Bold</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rezyume nomi (Saqlash uchun)
                </label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ism va familiya *
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
                  Kasbiy lavozim *
                </label>
                <input
                  type="text"
                  required
                  value={professionalTitle}
                  onChange={(e) => setProfessionalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telefon raqami *
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
                  Elektron pochta *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Telegram (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mamlakat *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shahar *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Istalgan ish shakli
                </label>
                <select
                  value={desiredWorkMode}
                  onChange={(e) => setDesiredWorkMode(e.target.value as WorkMode)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="onsite">Ofisda / Korxonada</option>
                  <option value="remote">Masofaviy (Remote)</option>
                  <option value="hybrid">Gibrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Istalgan bandlik turi
                </label>
                <select
                  value={desiredEmploymentType}
                  onChange={(e) => setDesiredEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="full-time">To‘liq stavka</option>
                  <option value="part-time">Yarim stavka</option>
                  <option value="contract">Loyiha / Shartnoma</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Qisqa professional tavsif (Summary)
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kasbiy ko‘nikmalar (vergul bilan ajrating)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Rezyume o‘zgarishlarini saqlash
            </button>
          </form>

          {/* 2. Work Experience Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              2. Ish tajribasi (Kompaniya nomi va ishlagan sanalar)
            </h3>

            <div className="space-y-2">
              {experience.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                >
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">
                      {exp.role} — {exp.company}
                    </div>
                    <div className="font-mono text-slate-500">{exp.period}</div>
                    <p className="text-slate-700 mt-1">{exp.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExperience(experience.filter((i) => i.id !== exp.id))}
                    className="text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <input
                type="text"
                placeholder="Kompaniya nomi"
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Lavozim"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Sanalar (2022 - 2026)"
                value={expPeriod}
                onChange={(e) => setExpPeriod(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Bajarilgan vazifalar va yutuqlar..."
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  if (!expCompany.trim() || !expRole.trim()) return;
                  setExperience([
                    {
                      id: `exp_${Date.now()}`,
                      company: sanitizeText(expCompany, 80),
                      role: sanitizeText(expRole, 80),
                      period: sanitizeText(expPeriod || '2024 - 2026', 40),
                      description: sanitizeText(expDesc, 300),
                    },
                    ...experience,
                  ]);
                  setExpCompany('');
                  setExpRole('');
                  setExpPeriod('');
                  setExpDesc('');
                }}
                className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Qo‘shish
              </button>
            </div>
          </div>

          {/* 3. Education & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">3. Ta’lim</h3>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{edu.institution}</div>
                      <div className="text-slate-600">
                        {edu.degree} ({edu.year})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEducation(education.filter((i) => i.id !== edu.id))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="OTM / Kollej / Maktab"
                value={eduInst}
                onChange={(e) => setEduInst(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yo‘nalish / Daraja"
                  value={eduDegree}
                  onChange={(e) => setEduDegree(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Yil"
                  value={eduYear}
                  onChange={(e) => setEduYear(e.target.value)}
                  className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!eduInst.trim() || !eduDegree.trim()) return;
                  setEducation([
                    ...education,
                    {
                      id: `edu_${Date.now()}`,
                      institution: sanitizeText(eduInst, 80),
                      degree: sanitizeText(eduDegree, 80),
                      year: sanitizeText(eduYear || '2024', 20),
                    },
                  ]);
                  setEduInst('');
                  setEduDegree('');
                  setEduYear('');
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                + Ta’lim qo‘shish
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>4. Biladigan tillar</span>
              </h3>
              <div className="space-y-2">
                {languages.map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong>{l.language}</strong> — {l.level}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLanguages(languages.filter((i) => i.id !== l.id))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Til nomi (masalan: Ingliz tili)"
                value={langName}
                onChange={(e) => setLangName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={langLevel}
                onChange={(e) => setLangLevel(e.target.value as LanguageSkillItem['level'])}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Boshlang‘ich (A1-A2)">Boshlang‘ich (A1-A2)</option>
                <option value="O‘rta (B1-B2)">O‘rta (B1-B2)</option>
                <option value="Yuqori (C1)">Yuqori (C1)</option>
                <option value="Ona tili / Mukammal (C2)">Ona tili / Mukammal (C2)</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!langName.trim()) return;
                  setLanguages([
                    ...languages,
                    {
                      id: `lng_${Date.now()}`,
                      language: sanitizeText(langName, 40),
                      level: langLevel,
                    },
                  ]);
                  setLangName('');
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                + Til qo‘shish
              </button>
            </div>
          </div>

          {/* 4. Certificates & Projects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                <span>5. Sertifikatlar</span>
              </h3>
              <div className="space-y-2">
                {certificates.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-slate-500">
                        {c.issuer} ({c.year})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertificates(certificates.filter((i) => i.id !== c.id))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Sertifikat nomi"
                value={certName}
                onChange={(e) => setCertName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Bergan tashkilot"
                  value={certIssuer}
                  onChange={(e) => setCertIssuer(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Yil"
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value)}
                  className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!certName.trim()) return;
                  setCertificates([
                    ...certificates,
                    {
                      id: `cert_${Date.now()}`,
                      name: sanitizeText(certName, 80),
                      issuer: sanitizeText(certIssuer || 'Xalqaro markaz', 60),
                      year: sanitizeText(certYear || '2025', 15),
                    },
                  ]);
                  setCertName('');
                  setCertIssuer('');
                  setCertYear('');
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                + Sertifikat qo‘shish
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                <span>6. Loyihalar va yutuqlar</span>
              </h3>
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-slate-600">{p.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProjects(projects.filter((i) => i.id !== p.id))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Loyiha yoki yutuq nomi"
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Natija va qisqacha tavsif"
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  if (!projTitle.trim()) return;
                  setProjects([
                    ...projects,
                    {
                      id: `prj_${Date.now()}`,
                      title: sanitizeText(projTitle, 80),
                      description: sanitizeText(projDesc, 200),
                    },
                  ]);
                  setProjTitle('');
                  setProjDesc('');
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                + Loyiha / Yutuq qo‘shish
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRINTABLE A4 PDF PREVIEW */}
        <div className="lg:col-span-5">
          <div
            className={`bg-white border rounded-xl p-6 sm:p-8 space-y-5 sticky top-6 ${
              template === 'executive'
                ? 'border-slate-900 shadow-md'
                : template === 'classic'
                ? 'border-slate-300'
                : 'border-blue-200 shadow-sm'
            }`}
          >
            <div
              className={`pb-4 border-b ${
                template === 'executive' ? 'border-slate-900' : 'border-slate-200'
              }`}
            >
              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <div className="text-sm font-semibold text-blue-700 mt-0.5">
                {professionalTitle}
              </div>
              <div className="text-xs font-mono text-slate-600 mt-1.5 space-y-0.5">
                <div>
                  {city}, {country} ·{' '}
                  {desiredWorkMode === 'remote'
                    ? 'Masofaviy'
                    : desiredWorkMode === 'hybrid'
                    ? 'Gibrid'
                    : 'Ofisda'}{' '}
                  ({desiredEmploymentType})
                </div>
                <div>
                  {phone} · {email} {telegram ? `· ${telegram}` : ''}
                </div>
              </div>
            </div>

            {summary && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Professional Tavsif
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
              </div>
            )}

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Kasbiy Ko‘nikmalar
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-800">
                {skillsInput
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s, idx, arr) => (
                    <React.Fragment key={idx}>
                      <span>{s}</span>
                      {idx < arr.length - 1 && <span className="text-slate-300">·</span>}
                    </React.Fragment>
                  ))}
              </div>
            </div>

            {experience.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Ish Tajribasi
                </h4>
                <div className="space-y-3">
                  {experience.map((exp) => (
                    <div key={exp.id} className="text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{exp.role}</span>
                        <span className="font-mono font-normal text-slate-500">{exp.period}</span>
                      </div>
                      <div className="font-medium text-blue-700">{exp.company}</div>
                      <p className="text-slate-600 mt-0.5">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Ta’lim
                </h4>
                <div className="space-y-2">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex items-start justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{edu.institution}</div>
                        <div className="text-slate-600">{edu.degree}</div>
                      </div>
                      <span className="font-mono text-slate-500">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Biladigan Tillar
                </h4>
                <div className="space-y-1 text-xs text-slate-700">
                  {languages.map((l) => (
                    <div key={l.id} className="flex items-center justify-between">
                      <span className="font-semibold">{l.language}</span>
                      <span className="text-slate-500">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {certificates.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Sertifikatlar
                </h4>
                <div className="space-y-1.5 text-xs">
                  {certificates.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">
                        {c.name} ({c.issuer})
                      </span>
                      <span className="font-mono text-slate-500">{c.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Loyihalar va Yutuqlar
                </h4>
                <div className="space-y-2 text-xs">
                  {projects.map((p) => (
                    <div key={p.id}>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="text-slate-600">{p.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

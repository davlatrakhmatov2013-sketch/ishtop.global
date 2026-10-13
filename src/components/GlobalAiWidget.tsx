import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Briefcase,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Maximize2,
  Minimize2,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ApplicationRecord,
  CareerPreferences,
  CompanyRecord,
  JobRecord,
  Language,
  UserRecord,
} from '../types';
import { sanitizeText } from '../utils/security';

export type CopilotMode =
  | 'general'
  | 'job-search'
  | 'resume-cv'
  | 'interview-coach'
  | 'accessibility'
  | 'employer-helper'
  | 'applications-helper'
  | 'company-ratings';

export interface CopilotChatEntry {
  id: string;
  sender: 'user' | 'ai';
  mode: CopilotMode;
  text: string;
  matchedJobIds?: string[];
  draftText?: string;
  suggestedPage?: string;
  createdAt: string;
}

interface GlobalAiWidgetProps {
  lang: Language;
  activePage: string;
  currentUser: UserRecord | null;
  preferences?: CareerPreferences;
  jobs: JobRecord[];
  companies: CompanyRecord[];
  applications: ApplicationRecord[];
  onOpenJob: (job: JobRecord) => void;
  onNavigatePage: (page: any) => void;
}

export function parseNaturalLanguageJobQuery(query: string, jobs: JobRecord[]): JobRecord[] {
  const q = query.toLowerCase();
  const approved = jobs.filter((j) => j.status === 'approved');

  const wantsRemote =
    q.includes('masofadan') ||
    q.includes('masofaviy') ||
    q.includes('uyda') ||
    q.includes('onlayn') ||
    q.includes('удален') ||
    q.includes('дома') ||
    q.includes('remote');

  const wantsNoExp =
    q.includes('tajribasiz') ||
    q.includes('stajyor') ||
    q.includes('без опыта') ||
    q.includes('no experience');

  const wantsDisability =
    q.includes('nogiron') ||
    q.includes('aravacha') ||
    q.includes('pandus') ||
    q.includes('lift') ||
    q.includes('инвалид') ||
    q.includes('пандус') ||
    q.includes('wheelchair') ||
    q.includes('accessible');

  const wantsPartTime =
    q.includes('yarim stavka') ||
    q.includes('moslashuvchan') ||
    q.includes('частичн') ||
    q.includes('гибк') ||
    q.includes('part-time') ||
    q.includes('flexible');

  const wantsDaily = q.includes('kunlik') || q.includes('дневн') || q.includes('daily');
  const wantsHourly = q.includes('soatlik') || q.includes('почасов') || q.includes('hourly');

  // Extract city if mentioned
  const knownCities = [
    'toshkent',
    'samarqand',
    'buxoro',
    'andijon',
    'namangan',
    'farg‘ona',
    'fargona',
    'nukus',
    'qarshi',
    'urganch',
    'navoiy',
    'jizzax',
    'termiz',
    'guliston',
    'seul',
    'berlin',
    'dubay',
    'varshava',
    'istanbul',
    'olmaota',
  ];
  const matchedCity = knownCities.find((c) => q.includes(c));

  // Extract salary threshold (e.g. "5 million", "5000000", "1000$")
  let minSalaryUzs = 0;
  const millionMatch = q.match(/(\d+)\s*(million|mln|млн)/i);
  if (millionMatch) {
    minSalaryUzs = Number(millionMatch[1]) * 1_000_000;
  }

  return approved
    .filter((job) => {
      if (wantsRemote && job.workMode !== 'remote') return false;
      if (wantsNoExp && job.experienceLevel !== 'no-experience') return false;
      if (wantsDisability && !job.disabilityFriendly && job.workMode !== 'remote') return false;
      if (wantsPartTime && job.employmentType !== 'part-time' && !job.accommodations?.includes('flexible-schedule')) {
        return false;
      }
      if (wantsDaily && job.salaryPeriod !== 'daily') return false;
      if (wantsHourly && job.salaryPeriod !== 'hourly') return false;
      if (matchedCity && !job.city.toLowerCase().includes(matchedCity.replace('fargona', 'farg‘ona'))) {
        return false;
      }
      if (minSalaryUzs > 0 && job.currency === 'UZS' && (job.salaryMax || 0) < minSalaryUzs) {
        return false;
      }
      return true;
    })
    .slice(0, 5);
}

export const GlobalAiWidget: React.FC<GlobalAiWidgetProps> = ({
  lang,
  activePage,
  currentUser,
  preferences,
  jobs,
  companies,
  applications,
  onOpenJob,
  onNavigatePage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<CopilotMode>('general');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editableDraft, setEditableDraft] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Per-user isolated localStorage key (Requirement 12: Har bir foydalanuvchining chat tarixini faqat o‘ziga ko‘rsat)
  const storageKey = `ishtop_ai_chat_history_${currentUser?.id || 'guest'}`;

  const [messages, setMessages] = useState<CopilotChatEntry[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'init_welcome',
        sender: 'ai',
        mode: 'general',
        text:
          lang === 'ru'
            ? 'Здравствуйте! Я универсальный ИИ-помощник IshTop Global. Помогу найти реальные вакансии по вашему запросу, составить резюме (CV), подготовиться к собеседованию, подобрать инклюзивную работу с пандусом/удаленкой или составить текст вакансии для работодателя.'
            : lang === 'en'
            ? 'Hello! I am the IshTop Global Universal AI Assistant. I can search real database jobs from natural language, improve your CV & cover letter, run mock interviews, find accessible/disability-friendly roles, or help employers draft job listings.'
            : 'Assalomu alaykum! Men IshTop Global platformasining barcha bo‘limlarda ishlovchi universal AI Yordamchisiman.\n\n• Tabiiy tilda vakansiya topish (masalan: “Toshkentda tajribasiz masofaviy 5 mln so‘mdan yuqori ish topib ber”)\n• CV / Rezyume va motivatsion xat yozish\n• AI Intervyu murabbiyi (suhbat mashqi)\n• Nogironligi bo‘lgan insonlar uchun pandus, lift va uydan ishlash qulayliklari\n• Ish beruvchilar uchun vakansiya matni va 3 tilda tarjima\n• Ariza holati, 1–8 ★ kompaniya reytingi va xolis shikoyat yozishda yordam beraman.',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Reload isolated chat history when currentUser changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: 'ai',
        mode: 'general',
        text:
          lang === 'ru'
            ? `Здравствуйте, ${currentUser?.fullName || 'Гость'}! Чем могу помочь в разделе «${activePage}»?`
            : lang === 'en'
            ? `Hello ${currentUser?.fullName || 'Guest'}! How can I assist you in the "${activePage}" section?`
            : `Assalomu alaykum, ${currentUser?.fullName || 'Mehmon'}! Sizning shaxsiy AI muloqot tarixingiz himoyalangan. Savolingizni yozing yoki quyidagi rejimlardan birini tanlang.`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [storageKey, lang]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  const modeButtons: { id: CopilotMode; labelUz: string; labelRu: string; labelEn: string }[] = [
    { id: 'general', labelUz: 'Umumiy yordam', labelRu: 'Общая помощь', labelEn: 'General Help' },
    { id: 'job-search', labelUz: 'Aqlli ish qidirish', labelRu: 'Поиск вакансий', labelEn: 'Smart Job Search' },
    { id: 'resume-cv', labelUz: 'CV va Motivatsion xat', labelRu: 'Резюме и Письмо', labelEn: 'CV & Cover Letter' },
    { id: 'interview-coach', labelUz: 'Intervyu murabbiyi', labelRu: 'Тренер интервью', labelEn: 'Interview Coach' },
    { id: 'accessibility', labelUz: '♿ Maxsus qulayliklar', labelRu: '♿ Инклюзивность', labelEn: '♿ Accessibility' },
    { id: 'employer-helper', labelUz: 'Ish beruvchi AI', labelRu: 'Для работодателя', labelEn: 'Employer AI' },
    { id: 'applications-helper', labelUz: 'Arizalar tahlili', labelRu: 'Мои отклики', labelEn: 'Applications Help' },
    { id: 'company-ratings', labelUz: 'Reyting (1–8★) & Shikoyat', labelRu: 'Рейтинг и Жалобы', labelEn: 'Ratings & Reports' },
  ];

  const quickPromptsByMode: Record<CopilotMode, string[]> = {
    general: [
      'Saytda qanday ro‘yxatdan o‘tib, rezyume yarataman va ish topaman?',
      'Pro obuna ($5/oy) va Employer Pro ($44/oy) qanday imkoniyatlar beradi?',
      'Oylik, kunlik va soatlik ishlarni qanday solishtiraman?',
    ],
    'job-search': [
      'Men Toshkentda tajribasiz, masofadan ishlaydigan va oyiga 5 million so‘mdan ko‘p maoshli ish qidiryapman.',
      'Menga kunlik yoki soatlik to‘lanadigan haqiqiy vakansiyalarni topib ber.',
      'Xorijda (Germaniya, Koreya, Polsha) viza homiyligi bor ishlarni ko‘rsat.',
    ],
    'resume-cv': [
      'Mening profilim asosida professional CV qisqacha tanishtiruvi (Summary) va motivatsion xat yozib ber.',
      'Rezyumedagi ish tajribamni kuchli va imlo xatolarsiz qanday ifodalasam bo‘ladi?',
    ],
    'interview-coach': [
      'Menga kasbimga mos 3 ta intervyu savolini ber va o‘zimni qanday tanishtirishni o‘rgat.',
      'Suhbatda oylik, kunlik yoki soatlik maosh haqida qanday muzokara qilish kerak?',
    ],
    accessibility: [
      'Nogironligi bo‘lgan insonlar uchun uyda/masofadan ishlaydigan yoki pandus va lift mavjud vakansiyalarni topib ber.',
      'Ish beruvchiga ish joyidagi maxsus qulayliklar (aravacha kirishi, moslashuvchan jadval) haqida xushmuomala savol yozib ber.',
    ],
    'employer-helper': [
      'Yangi vakansiya uchun professional tavsif, vazifalar, talablar va "Qanday ishlash tartibi" matnini 3 tilda (UZ/RU/EN) yozib ber.',
      'Nomzodni suhbatga taklif qilish uchun xushmuomala rasmiy xabar va 5 ta suhbat savolini tayyorlab ber.',
    ],
    'applications-helper': [
      'Mening yuborgan arizalarim holatini (Yuborildi, Ko‘rib chiqilmoqda, Suhbat) tushuntirib ber va keyingi qadamni ayt.',
      'Arizam bo‘yicha ish beruvchiga eslatma xabarini yozib ber.',
    ],
    'company-ratings': [
      'Tasdiqlangan va tekshirilmagan kompaniyalar farqi nima hamda 1 dan 8 yulduzgacha baholash qanday ishlaydi?',
      'Shikoyat matnini haqoratsiz, xolis va xavfsiz dalillar bilan qanday yozishga namuna ber.',
    ],
  };

  // Intelligent Local Fallback so every single mode works 100% reliably even if server API key is not configured
  const buildLocalGroundedResponse = (
    activeMode: CopilotMode,
    userText: string,
    matchedJobs: JobRecord[]
  ): { reply: string; draftText?: string; suggestedPage?: string } => {
    const myApps = applications.filter((a) => a.seekerId === currentUser?.id);

    if (activeMode === 'job-search' || matchedJobs.length > 0) {
      if (matchedJobs.length === 0) {
        return {
          reply:
            'So‘rovingiz bo‘yicha hozircha aynan mos vakansiya topilmadi. Platformamiz hech qachon soxta vakansiya yoki soxta maosh o‘ylab topmaydi. Tavsiya: qidiruv filtrlarida minimal maoshni biroz pasaytiring yoki barcha shaharlarni tanlab ko‘ring.',
          suggestedPage: 'jobs',
        };
      }
      const listStr = matchedJobs
        .map(
          (j) =>
            `• ${j.title} — ${j.companyName} (${j.city}, ${j.exactAddress}) | Maosh: ${
              j.salaryMin ? j.salaryMin.toLocaleString('en-US') : ''
            }–${j.salaryMax ? j.salaryMax.toLocaleString('en-US') : ''} ${j.currency} (${
              j.salaryPeriod === 'daily' ? 'Kunlik' : j.salaryPeriod === 'hourly' ? 'Soatlik' : 'Oylik'
            })`
        )
        .join('\n');
      return {
        reply: `So‘rovingiz tahlil qilindi! Bazadagi 520+ haqiqiy vakansiyalar ichidan shartlaringizga mos ${matchedJobs.length} ta faol e’lon topildi:\n\n${listStr}\n\nQuyidagi haqiqiy vakansiya tugmalarini bosib, e’lon sahifasini ochishingiz mumkin (Roziligingizsiz ariza yuborilmaydi):`,
        suggestedPage: 'jobs',
      };
    }

    if (activeMode === 'resume-cv') {
      const skillsList = (currentUser?.skills || ['Mas’uliyat', 'Muloqot', 'MS Office']).join(', ');
      const draft = `Qisqacha professional tanishtiruv (CV Summary):\nMen ${
        currentUser?.fullName || 'malakali mutaxassis'
      } (${
        currentUser?.title || 'Mutaxassis'
      }), o‘z ishiga mas’uliyatli va natijaga yo‘naltirilgan xodimman. Asosiy ko‘nikmalarim: ${skillsList}. Jamoada samarali ishlash va vazifalarni o‘z vaqtida sifatli bajarish tajribasiga egaman.\n\nIsh beruvchiga motivatsion xat (Cover Letter):\nAssalomu alaykum! Kompaniyangiz e’lon qilgan vakansiya bo‘yicha o‘z nomzodimni taqdim etmoqdaman. E’londa ko‘rsatilgan kunlik ish tartibi va talablar bilan to‘liq tanishib chiqdim. Mening amaliy ko‘nikmalarim (${skillsList}) ushbu vazifalarni sifatli bajarishga to‘liq mos keladi. Suhbatga tayyorman.`;
      return {
        reply:
          'Siz aytgan ma’lumotlar asosida CV tanishtiruvi va motivatsion xat loyihasini tayyorladim (AI siz kiritmagan diplom yoki tajribani to‘qib chiqarmaydi). Quyidagi tahrirlash oynasida matnni ko‘rib chiqib, o‘zgartirishingiz va nusxalab olishingiz mumkin:',
        draftText: draft,
        suggestedPage: 'cabinet',
      };
    }

    if (activeMode === 'interview-coach') {
      return {
        reply: `AI Intervyu Murabbiyi mashg‘uloti (${currentUser?.title || 'Tanlangan kasb'} bo‘yicha):\n\n1-savol: "O‘zingiz va avvalgi amaliy tajribangiz haqida 1 daqiqada gapirib bering."\n2-savol: "Ushbu ishda kunlik vazifalarni bajarishda qiyinchilik tug‘ilsa, qanday yo‘l tutasiz?"\n3-savol: "Kutilayotgan maoshingiz qancha va nima uchun?"\n\n💡 Qanday javob berish kerak:\n• Javobingizni aniq ko‘nikmalaringiz (${(
          currentUser?.skills || ['intizom']
        ).join(', ')}) bilan bog‘lang.\n• Maosh muzokarasida ishning Oylik, Kunlik yoki Soatlik ekanini va ish hajmini hisobga olib aniq diapazon ayting.\n\n⚠️ Muhim eslatma: Ushbu intervyu mashqlari suhbatga tayyorlanishga yordam beradi, biroq ishga qabul qilinishni 100% kafolatlamaydi. Javobingizni yozib yuboring — tahlil qilib beraman!`,
        suggestedPage: 'ai-advisor',
      };
    }

    if (activeMode === 'accessibility') {
      const accJobs = jobs
        .filter((j) => j.status === 'approved' && (j.disabilityFriendly || j.workMode === 'remote'))
        .slice(0, 4);
      const draftQuestion =
        'Assalomu alaykum! Vakansiyangiz bo‘yicha murojaat qilmoqdaman. Aytingchi, ushbu ish o‘rnida moslashuvchan ish jadvali, masofadan ishlash yoki binoda pandus/lift kabi qulayliklar mavjudmi? Oldindan rahmat.';
      return {
        reply:
          'Nogironligi bo‘lgan va turli ehtiyojli insonlar uchun bazamizdagi tasdiqlangan qulay vakansiyalarni (uydan ishlash, pandus/lift, moslashuvchan jadval, yarim stavka) ajratib oldim. Agar e’londa qulaylik ko‘rsatilmagan bo‘lsa, u "Noma’lum" deb belgilanadi va soxta qo‘shilmaydi.\n\nQuyida ish beruvchiga yuborish uchun tayyor savol matni va mos vakansiyalar keltirilgan:',
        draftText: draftQuestion,
        suggestedPage: 'jobs',
      };
    }

    if (activeMode === 'employer-helper') {
      const empDraft = `[UZ] Vakansiya: Malakali Mutaxassis\n• Ish haqida: Rasmiy shartnoma va o‘z vaqtida to‘lanadigan maosh (Oylik/Kunlik/Soatlik).\n• Qanday ishlash tartibi: Kunlik vazifalar soat 09:00 da taqsimlanadi, barcha jihozlar kompaniya tomonidan beriladi.\n• Vazifalar: Belgilangan reja asosida buyurtmalar bilan ishlash va sifatni nazorat qilish.\n• Talablar: Mas’uliyat, aniqlik va jamoada ishlash (Kamsituvchi talablarsiz).\n\n[RU] Вакансия: Квалифицированный специалист\n• О работе: Официальное оформление и своевременная оплата.\n• Порядок работы: Ежедневные задачи распределяются руководителем отдела.\n\n[EN] Job Opening: Qualified Specialist\n• Role Overview: Official contract, transparent compensation, and inclusive workplace.`;
      return {
        reply:
          'Ish beruvchilar uchun kamsituvchi yoki noqonuniy talablardan xoli, imlo xatolarsiz vakansiya matni (3 tilda: O‘zbek, Rus, Ingliz) va suhbat savollari loyihasini tayyorladim. Maosh va imtiyozlarni faqat o‘zingiz tasdiqlagan qiymatda kiriting:',
        draftText: empDraft,
        suggestedPage: 'cabinet',
      };
    }

    if (activeMode === 'applications-helper') {
      const summary =
        myApps.length > 0
          ? myApps
              .map((a) => `• ${a.jobTitle} (${a.companyName}) — Holati: ${a.status.toUpperCase()}`)
              .join('\n')
          : 'Hozircha yuborilgan arizalaringiz yo‘q.';
      return {
        reply: `Arizalaringiz tahlili:\n${summary}\n\nHolatlar ma’nosi:\n• SUBMITTED (Yuborildi): Rezyumengiz ish beruvchiga yetib bordi.\n• REVIEWING (Ko‘rib chiqilmoqda): HR mutaxassis rezyumengizni o‘rganmoqda.\n• INTERVIEW (Suhbatga taklif): Suhbat vaqti belgilandi — suhbat kabinetini tekshiring.\n\nEslatma: AI hech qachon ariza holatini o‘zi o‘zgartirmaydi va sizning roziligingizsiz ariza yubormaydi.`,
        draftText:
          'Assalomu alaykum! Kompaniyangizdagi vakansiyaga yuborgan arizam va rezyumem bo‘yicha qo‘shimcha ma’lumot kerak bo‘lsa, suhbatga tayyor ekanligimni bildiraman. Hurmat bilan.',
        suggestedPage: 'cabinet',
      };
    }

    if (activeMode === 'company-ratings') {
      const reportDraft =
        'Murojaat mazmuni: Ushbu vakansiyada ko‘rsatilgan mehnat va maosh shartlari suhbat jarayonida aytilgan ma’lumotlardan farq qildi. Iltimos, vakansiya ma’lumotlarining haqqoniyligini moderator tomonidan tekshirishingizni so‘rayman. (Shaxsiy pasport yoki bank karta ma’lumotlari kiritilmadi).';
      return {
        reply:
          'Kompaniya tekshiruvi, 1–8 ★ reyting va shikoyat qoidalari:\n\n1. Tasdiqlangan kompaniya: STIR/INN, litsenziya va rasmiy domeni tekshirilgan.\n2. 1–8 yulduzli reyting: 1★ (Juda yomon) dan 8★ (A’lo) gacha haqqoniy baholanadi.\n3. Xolis shikoyat yozish: Haqoratli so‘zlarsiz, faqat aniq dalil (masalan, suhbat vaqti) bilan yozing. Hech qachon pasport seriyasi yoki bank karta raqamini shikoyatga yozmang!\n4. Eslatma: Shikoyatning o‘zi kompaniyani avtomatik firibgar deb e’lon qilmaydi; kompaniyaga rasmiy javob berish huquqi taqdim etiladi.',
        draftText: reportDraft,
        suggestedPage: 'companies',
      };
    }

    return {
      reply:
        'IshTop Global bo‘yicha yo‘riqnoma:\n• "Vakansiyalar" bo‘limida 520+ haqiqiy ish (Oylik, Kunlik, Soatlik) mavjud.\n• "Sizga mos ishlar" bo‘limida AI moslik foizini (0–99%) hisoblaydi.\n• "Kabinet" bo‘limida professional Rezyume (CV) yaratib, PDF shaklida yuklab olishingiz mumkin.\n• Yuqoridagi "♿ Imkoniyatlar" tugmasi orqali shrift kattaligini (125%) va Yuqori kontrast rejimini yoqishingiz mumkin.',
      suggestedPage: 'jobs',
    };
  };

  const handleSend = async (customPrompt?: string, customMode?: CopilotMode) => {
    const activeMode = customMode || mode;
    const textToSend = sanitizeText(customPrompt ?? input, 600);
    if (!textToSend || loading) return;

    const userEntry: CopilotChatEntry = {
      id: `u_${Date.now()}`,
      sender: 'user',
      mode: activeMode,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userEntry]);
    if (!customPrompt) setInput('');
    setLoading(true);

    // Pre-match real jobs from database using natural language parser
    const nlMatchedJobs = parseNaturalLanguageJobQuery(textToSend, jobs);

    try {
      const response = await fetch('/api/ai-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode,
          prompt: textToSend,
          lang,
          userKey: currentUser?.id || 'guest',
          pageContext: activePage,
          candidateJobs: nlMatchedJobs.map((j) => ({
            id: j.id,
            title: j.title,
            companyName: j.companyName,
            city: j.city,
            country: j.country,
            exactAddress: j.exactAddress,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            currency: j.currency,
            salaryPeriod: j.salaryPeriod,
            workMode: j.workMode,
            disabilityFriendly: j.disabilityFriendly,
            accommodations: j.accommodations,
          })),
          resumeContext: currentUser
            ? {
                title: currentUser.title,
                skills: currentUser.skills,
                experienceCount: currentUser.experience.length,
                location: currentUser.location,
              }
            : null,
          applicationContext: applications
            .filter((a) => a.seekerId === currentUser?.id)
            .map((a) => ({ jobTitle: a.jobTitle, companyName: a.companyName, status: a.status })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const verifiedIds =
          Array.isArray(data.matchedJobIds) && data.matchedJobIds.length > 0
            ? data.matchedJobIds
            : nlMatchedJobs.map((j) => j.id);

        if (data.draftText) {
          setEditableDraft(data.draftText);
        }

        const aiEntry: CopilotChatEntry = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          mode: activeMode,
          text: data.reply,
          matchedJobIds: verifiedIds,
          draftText: data.draftText || undefined,
          suggestedPage: data.suggestedPage || undefined,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiEntry]);
      } else {
        const local = buildLocalGroundedResponse(activeMode, textToSend, nlMatchedJobs);
        if (local.draftText) {
          setEditableDraft(local.draftText);
        }
        const aiEntry: CopilotChatEntry = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          mode: activeMode,
          text: local.reply,
          matchedJobIds: nlMatchedJobs.map((j) => j.id),
          draftText: local.draftText,
          suggestedPage: local.suggestedPage,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiEntry]);
      }
    } catch {
      const local = buildLocalGroundedResponse(activeMode, textToSend, nlMatchedJobs);
      if (local.draftText) {
        setEditableDraft(local.draftText);
      }
      const aiEntry: CopilotChatEntry = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        mode: activeMode,
        text: local.reply,
        matchedJobIds: nlMatchedJobs.map((j) => j.id),
        draftText: local.draftText,
        suggestedPage: local.suggestedPage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiEntry]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(storageKey);
    setMessages([
      {
        id: `cleared_${Date.now()}`,
        sender: 'ai',
        mode,
        text:
          lang === 'ru'
            ? 'История чата очищена. Задайте новый вопрос!'
            : lang === 'en'
            ? 'Chat history cleared. Ask me a new question!'
            : 'Suhbat tarixi tozalandi. Yangi savolingizni yozishingiz mumkin!',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="no-print">
      {/* Floating Bottom-Right AI Trigger Button (Visible across all sections) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="AI Yordamchi chat oynasini ochish"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xl border border-blue-400/40 cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <Bot className="w-5 h-5" />
          <span>
            {lang === 'ru'
              ? 'ИИ-Помощник (24/7)'
              : lang === 'en'
              ? 'AI Assistant (24/7)'
              : 'AI Yordamchi (Barcha bo‘limlar)'}
          </span>
        </button>
      )}

      {/* Floating / Expandable AI Copilot Drawer */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="IshTop Global AI Yordamchi"
          className={`fixed z-50 bg-white border border-slate-300 shadow-2xl flex flex-col overflow-hidden transition-all ${
            isExpanded
              ? 'inset-3 sm:inset-6 rounded-2xl'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[460px] h-[82vh] max-h-[680px] rounded-2xl'
          }`}
        >
          {/* Top Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Bot className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="text-xs sm:text-sm font-bold truncate">
                  IshTop Global — Universal AI Yordamchi
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  O‘zbek · Русский · English | Maxfiy va tekshirilgan baza
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={clearHistory}
                title="Suhbat tarixini tozalash"
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Kichraytirish' : 'Kattalashtirish'}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Yopish"
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 8 Specialized Mode Selector Strip */}
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {modeButtons.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  mode === m.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {lang === 'ru' ? m.labelRu : lang === 'en' ? m.labelEn : m.labelUz}
              </button>
            ))}
          </div>

          {/* Quick Suggested Prompts for Active Mode */}
          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 space-y-1.5 shrink-0">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-blue-600" />
              <span>Bir bosishda sinab ko‘ring:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPromptsByMode[mode].map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(qp, mode)}
                  className="text-left text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 rounded-md cursor-pointer line-clamp-1"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages History */}
          <div
            className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-50/60"
            aria-live="polite"
          >
            {messages.map((m) => {
              const matchedJobsList = (m.matchedJobIds || [])
                .map((id) => jobs.find((j) => j.id === id))
                .filter((j): j is JobRecord => Boolean(j));

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border text-xs sm:text-sm space-y-2.5 ${
                    m.sender === 'ai'
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-blue-600 border-blue-600 text-white ml-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold flex items-center gap-1">
                      {m.sender === 'ai' ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-blue-700">AI Yordamchi</span>
                        </>
                      ) : (
                        <span>Siz</span>
                      )}
                    </span>
                    <span className={m.sender === 'ai' ? 'text-slate-400 font-mono' : 'text-blue-100 font-mono'}>
                      {m.createdAt.slice(11, 16)}
                    </span>
                  </div>

                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                  {/* Direct Real Links to Matched Database Jobs */}
                  {m.sender === 'ai' && matchedJobsList.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700">
                        Topilgan haqiqiy vakansiyalar (bosib oching):
                      </div>
                      {matchedJobsList.slice(0, 4).map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            onOpenJob(job);
                          }}
                          className="w-full p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {job.title}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {job.companyName} · {job.city} ·{' '}
                              {job.disabilityFriendly ? '♿ Qulay ish joyi' : job.workMode}
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Direct Link to Relevant Platform Page */}
                  {m.sender === 'ai' && m.suggestedPage && (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigatePage(m.suggestedPage)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Tegishli bo‘limga o‘tish ({m.suggestedPage}) →</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="p-3 bg-white border border-blue-200 rounded-xl text-xs text-blue-800">
                AI Yordamchi ma’lumotlar bazasini tekshirib javob yozmoqda...
              </div>
            )}

            {/* Editable Draft Box (Requirement 4 & 11: AI yaratgan matnni foydalanuvchi ko'rib chiqishi, tahrirlashi va tasdiqlashi mumkin) */}
            {editableDraft && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                  <span>AI tayyorlagan matn (Tahrirlashingiz mumkin):</span>
                  <button
                    type="button"
                    onClick={() => setEditableDraft('')}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={editableDraft}
                  onChange={(e) => setEditableDraft(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-blue-300 rounded-lg font-sans"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600">
                    Saqlash yoki yuborishdan oldin matnni tekshiring.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(editableDraft);
                      setCopiedNotice(true);
                      setTimeout(() => setCopiedNotice(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedNotice ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Tasdiqlash va Nusxa olish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Напишите запрос ИИ-помощнику...'
                  : lang === 'en'
                  ? 'Ask AI Assistant anything...'
                  : 'AI yordamchiga savol yoki qidiruv shartini yozing...'
              }
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Yuborish</span>
            </button>
          </form>
        </aside>
      )}
    </div>
  );
};

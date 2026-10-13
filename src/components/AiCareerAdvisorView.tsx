import React, { useMemo, useState } from 'react';
import {
  Bot,
  Briefcase,
  CheckCircle2,
  Compass,
  FileText,
  HelpCircle,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ApplicationRecord,
  CareerPreferences,
  JobRecord,
  Language,
  SavedJobRecord,
  UserRecord,
} from '../types';
import { translations } from '../i18n';
import { JOB_SECTORS } from '../data/sectors';
import { computeDeterministicJobRecommendations } from '../utils/aiRecommender';
import { sanitizeText } from '../utils/security';

export interface AiAdviceMessage {
  id: string;
  sender: 'user' | 'ai';
  topic: string;
  text: string;
  createdAt: string;
}

interface AiCareerAdvisorViewProps {
  lang: Language;
  jobs: JobRecord[];
  user: UserRecord | null;
  preferences?: CareerPreferences;
  savedJobs: SavedJobRecord[];
  applications: ApplicationRecord[];
  onOpenJob: (job: JobRecord) => void;
  onToggleSaveJob: (jobId: string) => void;
  onOpenOnboardingModal: () => void;
  onNavigateToResumes?: () => void;
}

type AdvisorTopicKey =
  | 'career-choice'
  | 'resume-improve'
  | 'interview-prep'
  | 'salary-negotiation'
  | 'disability-support'
  | 'anti-fraud-safety'
  | 'workflow-guide';

export const AiCareerAdvisorView: React.FC<AiCareerAdvisorViewProps> = ({
  lang,
  jobs,
  user,
  preferences,
  savedJobs,
  applications,
  onOpenJob,
  onToggleSaveJob,
  onOpenOnboardingModal,
  onNavigateToResumes,
}) => {
  const t = translations[lang];
  const [selectedTopic, setSelectedTopic] = useState<AdvisorTopicKey>('career-choice');
  const [questionInput, setQuestionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const primaryResume = user?.resumes?.find((r) => r.isPrimary) || user?.resumes?.[0];
  const activeSectors = preferences?.sectors || user?.careerPreferences?.sectors || [];

  const sectorNames = useMemo(() => {
    if (!activeSectors.length) {
      return lang === 'ru'
        ? 'Все сферы'
        : lang === 'en'
        ? 'All sectors'
        : 'Barcha sohalar';
    }
    return activeSectors
      .map((id) => JOB_SECTORS.find((s) => s.id === id)?.label[lang])
      .filter(Boolean)
      .join(', ');
  }, [activeSectors, lang]);

  // Real matching jobs from DB for grounded advice
  const topMatchingJobs = useMemo(() => {
    const recs = computeDeterministicJobRecommendations(jobs, user, preferences, lang);
    return recs.slice(0, 6).map((r) => {
      const job = jobs.find((j) => j.id === r.jobId)!;
      return { rec: r, job };
    }).filter((item) => Boolean(item.job));
  }, [jobs, user, preferences, lang]);

  const advisorTopics: {
    key: AdvisorTopicKey;
    title: string;
    subtitle: string;
    defaultPrompt: string;
  }[] = [
    {
      key: 'career-choice',
      title:
        lang === 'ru'
          ? '1. Выбор профессии и подходящих вакансий'
          : lang === 'en'
          ? '1. Career Path & Matching Jobs Advice'
          : '1. Kasb tanlash va sizga mos ishlar maslahati',
      subtitle:
        lang === 'ru'
          ? 'Какие вакансии подходят вашему опыту, полу, возрасту и навыкам'
          : lang === 'en'
          ? 'Which roles best fit your skills, experience, age, and preferences'
          : 'Ko‘nikmalaringiz, tajribangiz, yoshingiz va tanlagan sohangizga qaysi ishlar eng mos?',
      defaultPrompt:
        'Mening profilim, ko‘nikmalarim va tanlagan sohalarimga qarab qaysi kasb va vakansiyalar menga eng mos keladi? Ish topishni tezlashtirish uchun nima qilishim kerak?',
    },
    {
      key: 'resume-improve',
      title:
        lang === 'ru'
          ? '2. Улучшение резюме (CV)'
          : lang === 'en'
          ? '2. Resume & CV Improvement'
          : '2. Rezyumeni kuchaytirish va xatolarni tuzatish',
      subtitle:
        lang === 'ru'
          ? 'Как написать резюме, чтобы работодатель пригласил на интервью'
          : lang === 'en'
          ? 'How to structure your resume so employers invite you to interview'
          : 'Ish beruvchi rezyumengizni tanlab olishi uchun nimalarni qo‘shish kerak?',
      defaultPrompt:
        'Mening hozirgi rezyume va ko‘nikmalarimni tahlil qilib ber. Ish beruvchilar e’tiborini tortish uchun rezyumemga qanday ko‘nikmalar va tavsiflarni qo‘shishim kerak?',
    },
    {
      key: 'interview-prep',
      title:
        lang === 'ru'
          ? '3. Подготовка к собеседованию'
          : lang === 'en'
          ? '3. Job Interview Preparation'
          : '3. Suhbatdan (Intervyudan) muvaffaqiyatli o‘tish',
      subtitle:
        lang === 'ru'
          ? 'Частые вопросы работодателей и правильные ответы'
          : lang === 'en'
          ? 'Common employer questions and strong answers'
          : 'Ish beruvchi beradigan eng muhim savollar va ularga qanday javob berish kerak?',
      defaultPrompt:
        'Ishga kirish suhbatida (intervyuda) ish beruvchilar eng ko‘p beradigan 5 ta savol va ularga qanday ishonchli javob berish bo‘yicha amaliy maslahat ber.',
    },
    {
      key: 'salary-negotiation',
      title:
        lang === 'ru'
          ? '4. Переговоры о зарплате (Месячная / Дневная / Почасовая)'
          : lang === 'en'
          ? '4. Salary Negotiation (Monthly / Daily / Hourly)'
          : '4. Maosh bo‘yicha kelishish (Oylik / Kunlik / Soatlik)',
      subtitle:
        lang === 'ru'
          ? 'Как обсудить достойную оплату труда и график'
          : lang === 'en'
          ? 'How to negotiate fair pay and work schedule'
          : 'Oylik, kunlik yoki soatlik ishlarda haqqoniy maosh so‘rash va shartnoma tuzish sirlari',
      defaultPrompt:
        'Mening sohamda oylik, kunlik va soatlik ishlarda maoshni qanday to‘g‘ri kelishish kerak? Ish boshlashdan oldin ish beruvchi bilan qaysi to‘lov shartlarini aniqlashtirib olish zarur?',
    },
    {
      key: 'workflow-guide',
      title:
        lang === 'ru'
          ? '5. Как работать на новом месте (Порядок работы)'
          : lang === 'en'
          ? '5. First Days on the Job & Daily Workflow'
          : '5. Ishda nima qilish kerak va qanday ishlash tartibi',
      subtitle:
        lang === 'ru'
          ? 'Адаптация в первые дни и выполнение обязанностей'
          : lang === 'en'
          ? 'Adapting in your first week and mastering daily duties'
          : 'Yangi ishga kirganda birinchi kunlardan o‘zini ko‘rsatish va ish tartibini tez o‘rganish',
      defaultPrompt:
        'Yangi ishga qabul qilinganda birinchi haftada ish tartibini tez o‘rganish, xatolarga yo‘l qo‘ymaslik va jamoaga moslashish uchun qanday maslahatlar berasan?',
    },
    {
      key: 'disability-support',
      title:
        lang === 'ru'
          ? '6. Инклюзивная работа (Для людей с инвалидностью)'
          : lang === 'en'
          ? '6. Inclusive & Accessible Jobs Advice'
          : '6. Nogironligi bo‘lgan insonlar uchun qulay ishlar maslahati',
      subtitle:
        lang === 'ru'
          ? 'Удаленная работа, гибкий график и специальные условия'
          : lang === 'en'
          ? 'Remote roles, flexible schedules, and workplace accommodations'
          : 'Uyda/masofadan ishlash, pandus/liftli ofislar va moslashuvchan ish jadvali bo‘yicha tavsiyalar',
      defaultPrompt:
        'Nogironligi bo‘lgan yoki harakatlanishi cheklangan insonlar uchun uyda/masofadan ishlash, yarim stavka yoki moslashtirilgan ish joylarini topish bo‘yicha maslahat ber va bazadagi mos vakansiyalarni ko‘rsat.',
    },
    {
      key: 'anti-fraud-safety',
      title:
        lang === 'ru'
          ? '7. Защита от мошенников и безопасность'
          : lang === 'en'
          ? '7. Anti-Fraud & Safe Job Search'
          : '7. Firibgarlardan himoyalanish va xavfsiz ish topish',
      subtitle:
        lang === 'ru'
          ? 'Как распознать фальшивые вакансии и требование предоплаты'
          : lang === 'en'
          ? 'How to spot fake job offers and illegal upfront fee scams'
          : 'Soxta vakansiyalarni, oldindan pul so‘raydigan firibgarlarni qanday aniqlash mumkin?',
      defaultPrompt:
        'Ish qidirishda firibgarlarga aldanib qolmaslik uchun nimalarga e’tibor berish kerak? Qanday belgilar ish beruvchining soxta ekanligini bildiradi?',
    },
  ];

  // Built-in instant intelligent fallback generator so the user ALWAYS gets rich, personalized career advice even if offline or API key is missing
  const buildLocalPersonalizedAdvice = (topicKey: AdvisorTopicKey, questionText: string): string => {
    const seekerName = user?.fullName || 'Hurmatli ish qidiruvchi';
    const seekerTitle = primaryResume?.professionalTitle || user?.title || 'Mutaxassis';
    const seekerSkills = (primaryResume?.skills || user?.skills || ['Mas’uliyat', 'Muloqot']).join(', ');
    const sampleTitles = topMatchingJobs
      .slice(0, 3)
      .map((item) => `• ${item.job.title} (${item.job.companyName} — ${item.job.city}, ${item.rec.score}% moslik)`)
      .join('\n');

    if (topicKey === 'resume-improve') {
      return `${seekerName}, sizning "${seekerTitle}" bo‘yicha rezyumengizni kuchaytirish uchun AI Yordamchi tavsiyalari:\n\n1. Aniq natijalarni yozing: Ish tajribangizda faqat vazifalarni emas, balki erishgan natijalaringizni raqamlar bilan ko‘rsating.\n2. Ko‘nikmalar bloki: Hozirgi ko‘nikmalaringiz (${seekerSkills}) qatoriga zamonaviy dasturlar va xorijiy tillarni darajasi bilan (masalan, B2/C1) kiriting.\n3. Ish tartibiga moslik: Har bir vakansiyaning "Bu ishda nima qilish kerak" qismini o‘qib, rezyumengizning qisqacha tavsifini (Summary) o‘sha talablarga moslashtiring.\n4. Kabinetingizdagi "Mening rezyumelarim" bo‘limida tayyor rezyumeni PDF shaklida yuklab olib, arizaga biriktiring.`;
    }

    if (topicKey === 'interview-prep') {
      return `${seekerName}, suhbatdan (intervyudan) muvaffaqiyatli o‘tish uchun 5 ta oltin qoida:\n\n1. Kompaniya va manzilni tekshiring: Suhbatga borishdan oldin vakansiyadagi aniq joylashuv manzili va kompaniya reytingini (1–8 ★) ko‘zdan kechiring.\n2. "O‘zingiz haqingizda gapirib bering" savoliga 60 soniyalik aniq javob tayyorlang: mutaxassisligingiz (${seekerTitle}), asosiy ko‘nikmalaringiz (${seekerSkills}) va nima uchun aynan shu kompaniyani tanlaganingizni ayting.\n3. Ish tartibini so‘rang: Suhbatda "Kunlik ish jarayoni qanday tashkil etilgan?", "Sinov muddati qancha va qanday baholanadi?" deb so‘rash sizning jiddiy nomzod ekanligingizni ko‘rsatadi.\n4. Suhbatga 10–15 daqiqa oldin yetib boring yoki onlayn suhbat bo‘lsa aloqa sifatini oldindan tekshiring.`;
    }

    if (topicKey === 'salary-negotiation') {
      return `${seekerName}, Oylik, Kunlik va Soatlik ishlarda maoshni to‘g‘ri kelishish bo‘yicha maslahatlar:\n\n1. To‘lov turini aniqlashtiring: Vakansiya oylikmi, kunlikmi yoki soatlik — ish boshlashdan oldin aniq kelishib oling.\n2. Kunlik va soatlik ishlarda: Har kuni yoki har hafta yakunida to‘lov qanday usulda (naqd yoki bank kartasiga) to‘lanishini hamda qo‘shimcha ish soatlari (overtime) qanday hisoblanishini so‘rang.\n3. Oylik ishlarda: Rasmiy mehnat shartnomasi tuzilishi, maosh beriladigan aniq sanalar va bonus tizimini suhbat chog‘ida kelishib oling.\n4. O‘z qiymatingizni asoslang: Ko‘nikmalaringiz (${seekerSkills}) kompaniyaga qanday foyda keltirishini tushuntirib, bozor darajasidagi maoshni so‘rang.`;
    }

    if (topicKey === 'disability-support') {
      return `${seekerName}, nogironligi bo‘lgan insonlar uchun qulay va xavfsiz ish topish bo‘yicha tavsiyalar:\n\n1. Maxsus filtrni yoqing: Profilingizda yoki qidiruvda "♿ Nogironligi bo‘lgan insonlar uchun mos ishlar" filtrini yoqsangiz, tizim masofadan (uydan) bajariladigan, moslashuvchan grafikli hamda pandus/liftga ega ofis ishlarini birinchi o‘ringa chiqaradi.\n2. Tibbiy hujjat talab qilinmaydi: Platformada ushbu belgi faqat sizga qulay sharoitli ishlarni topish uchun xizmat qiladi va roziligingizsiz oshkor etilmaydi.\n3. Kamsitishga yo‘l qo‘yilmaydi: Agar biror ish beruvchi adolatsiz munosabatda bo‘lsa, vakansiya ichidagi "Shikoyat qilish" tugmasi orqali "8. Nogironligi sababli adolatsiz muomala" bandini tanlab xabar bering.`;
    }

    if (topicKey === 'anti-fraud-safety') {
      return `${seekerName}, kiberxavfsizlik va firibgarlardan himoyalanish bo‘yicha eng muhim qoidalar:\n\n1. HECH QACHON OLDINDAN PUL TO‘LAMANG: Qonuniy ish beruvchi rezyume ko‘rib chiqish, suhbatdan o‘tkazish, tibbiy daftar, forma yoki viza uchun nomzoddan oldindan to‘lov so‘ramaydi.\n2. "Tasdiqlangan kompaniya" belgisiga qarang: STIR/INN va rasmiy domeni tekshirilgan hamda yuqori reytingga (6–8 ★) ega kompaniyalarni tanlang.\n3. Aniq manzilni tekshiring: IshTop Global’da har bir ish beruvchi ko‘cha, uy va mo‘ljalni kiritishi shart. Manzili noaniq yoki faqat ko‘chada uchrashishni taklif qiladigan e’lonlardan ehtiyot bo‘ling.\n4. Pasport va karta kodlarini bermang: SMS kodlar va bank kartangizning maxfiy raqamlarini hech kimga yubormang.`;
    }

    return `${seekerName}, savolingiz ("${questionText}") bo‘yicha shaxsiy karyera maslahati:\n\n• Tanlangan yo‘nalishingiz: ${sectorNames}\n• Sizning mutaxassisligingiz va ko‘nikmalaringiz: ${seekerTitle} (${seekerSkills})\n\nAmaliy qadamlar:\n1. Rezyumengizni to‘liq to‘ldiring va aniq ko‘nikmalarni kiriting.\n2. Vakansiya topshirishdan oldin ish beruvchi yozgan "Qanday ishlash kerak va bu ishda nima qilish kerak" yo‘riqnomasini diqqat bilan o‘qing.\n3. Ish beruvchiga ariza yuborayotganda kamida 2–3 jumlada nima uchun aynan siz ushbu ishni sifatli bajara olishingizni yozing.\n\nHozir bazada sizga eng mos keladigan haqiqiy vakansiyalar:\n${sampleTitles || '• Barcha 520+ vakansiyalar ro‘yxatidan filtrlarni sozlab tanlashingiz mumkin.'}`;
  };

  const [messages, setMessages] = useState<AiAdviceMessage[]>(() => [
    {
      id: 'welcome_ai_msg',
      sender: 'ai',
      topic: 'Karyera va Ish topish maslahatchisi',
      text:
        lang === 'ru'
          ? `Здравствуйте, ${user?.fullName || 'Соискатель'}! Я ваш персональный ИИ-помощник IshTop Global. Я проанализировал ваш профиль, навыки (${(user?.skills || []).join(', ') || 'не указаны'}) и выбранные сферы (${sectorNames}). Выберите тему консультации выше или задайте любой вопрос о поиске работы, резюме, собеседовании, зарплате или безопасности!`
          : lang === 'en'
          ? `Hello ${user?.fullName || 'Job Seeker'}! I am your dedicated IshTop Global AI Career Advisor. I have analyzed your profile, skills (${(user?.skills || []).join(', ') || 'none listed'}), and selected sectors (${sectorNames}). Pick a consultation topic or ask me anything about job hunting, resumes, interviews, salary negotiation, or safety!`
          : `Assalomu alaykum, ${user?.fullName || 'Hurmatli ish qidiruvchi'}! Men IshTop Global platformasining maxsus “AI Yordamchi va Karyera Maslahatchisi”man.\n\nSizning profilingiz, ko‘nikmalaringiz (${(user?.skills || []).join(', ') || 'kiritilmagan'}) va tanlagan sohalaringizni (${sectorNames}) tahlil qildim. Yuqoridagi yo‘nalishlardan birini tanlang yoki ish topish, rezyume, suhbatdan o‘tish, maosh kelishish va xavfsizlik bo‘yicha istalgan savolingizni yozing — sizga batafsil maslahat beraman!`,
      createdAt: new Date().toISOString(),
    },
  ]);

  const askCareerAdvisor = async (promptText: string, topicKey: AdvisorTopicKey = selectedTopic) => {
    const cleaned = sanitizeText(promptText, 600);
    if (!cleaned || loading) return;

    const topicObj = advisorTopics.find((item) => item.key === topicKey);
    const topicTitle = topicObj ? topicObj.title : 'AI Maslahat';

    const userMsg: AiAdviceMessage = {
      id: `usr_msg_${Date.now()}`,
      sender: 'user',
      topic: topicTitle,
      text: cleaned,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestionInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai-career-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleaned,
          topic: topicTitle,
          lang,
          seekerContext: {
            fullName: user?.fullName || 'Ish qidiruvchi',
            title: primaryResume?.professionalTitle || user?.title || 'Mutaxassis',
            age: user?.age || preferences?.age || 24,
            gender: user?.gender || preferences?.gender || 'prefer_not_to_say',
            disabilityFilterEnabled:
              user?.disabilityFilterEnabled || preferences?.disabilityFriendlyOnly || false,
            accommodations: user?.accommodations || preferences?.accommodations || [],
            location: user?.location || 'Toshkent, O‘zbekiston',
            selectedSectors: sectorNames,
            skills: primaryResume?.skills || user?.skills || [],
            experienceCount: primaryResume?.experience?.length || user?.experience?.length || 0,
            languages:
              primaryResume?.languages?.map((l) => `${l.language} (${l.level})`) ||
              user?.languages?.map((l) => `${l.language} (${l.level})`) ||
              ['O‘zbek', 'Rus'],
          },
          sampleJobs: topMatchingJobs.map(({ job, rec }) => ({
            id: job.id,
            title: job.title,
            companyName: job.companyName,
            city: job.city,
            country: job.country,
            exactAddress: job.exactAddress,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            salaryPeriod: job.salaryPeriod,
            workMode: job.workMode,
            matchScore: rec.score,
          })),
        }),
      });

      const data = await response.json();
      const adviceText =
        response.ok && data.advice
          ? data.advice
          : buildLocalPersonalizedAdvice(topicKey, cleaned);

      const aiMsg: AiAdviceMessage = {
        id: `ai_msg_${Date.now()}`,
        sender: 'ai',
        topic: topicTitle,
        text: adviceText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackAdvice = buildLocalPersonalizedAdvice(topicKey, cleaned);
      const aiMsg: AiAdviceMessage = {
        id: `ai_msg_${Date.now()}`,
        sender: 'ai',
        topic: topicTitle,
        text: fallbackAdvice,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
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
    return `${fmt(job.salaryMax)} ${job.currency} (${periodLabel})`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Hero Header of AI Yordamchi Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            <span>
              {lang === 'ru'
                ? 'ИИ-ПОМОЩНИК И КАРЬЕРНЫЙ КОНСУЛЬТАНТ'
                : lang === 'en'
                ? 'AI ASSISTANT & CAREER ADVISOR FOR JOB SEEKERS'
                : 'ISH QIDIRUVCHILAR UCHUN MAXSUS AI YORDAMCHI VA KARYERA MASLAHATCHISI'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {lang === 'ru'
              ? 'ИИ-Помощник: Персональные советы соискателю'
              : lang === 'en'
              ? 'AI Assistant: Personalized Career & Job Search Advice'
              : 'AI Yordamchi — Ish qidiruvchiga shaxsiy maslahat va yo‘riqnoma'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {lang === 'ru'
              ? 'Не знаете, какую работу выбрать, как улучшить резюме, пройти собеседование, договориться о зарплате или защититься от мошенников? Выберите направление ниже или задайте свой вопрос ИИ-помощнику.'
              : lang === 'en'
              ? 'Need advice on choosing the right job, improving your resume, passing interviews, negotiating monthly/daily/hourly pay, or staying safe from scams? Select a topic below or ask your question directly.'
              : 'Qaysi ishni tanlashni bilmayapsizmi? Ish shartlariga tushunmadingizmi, rezyumeni kuchaytirish, suhbatdan o‘tish, maoshni kelishish (oylik/kunlik/soatlik) yoki firibgarlardan himoyalanish bo‘yicha maslahat kerakmi? AI Yordamchi sizga batafsil tushuntirib beradi.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenOnboardingModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Soha va hudud tanlovini o‘zgartirish</span>
          </button>
          {onNavigateToResumes && (
            <button
              type="button"
              onClick={onNavigateToResumes}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rezyume muharririga o‘tish</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 7 Structured Advice Topics & Seeker Profile Snapshot */}
        <div className="lg:col-span-5 space-y-6">
          {/* Seeker Context Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI tahlil qilayotgan profilingiz</span>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-semibold">Faol</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div>
                <span className="text-slate-500">Ism va Mutaxassislik:</span>{' '}
                <strong className="text-slate-900">
                  {user?.fullName || 'Mehmon foydalanuvchi'} ({primaryResume?.professionalTitle || user?.title || 'Ish qidiruvchi'})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Tanlangan sohalar:</span>{' '}
                <span className="font-medium text-blue-700">{sectorNames}</span>
              </div>
              <div>
                <span className="text-slate-500">Ko‘nikmalar:</span>{' '}
                <span className="font-mono text-slate-800">
                  {(primaryResume?.skills || user?.skills || []).join(', ') || 'Kiritilmagan'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Joylashuv:</span>{' '}
                <span>{user?.location || 'Toshkent, O‘zbekiston'}</span>
              </div>
            </div>
          </div>

          {/* 7 One-Click Consultation Topics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900">
              Maslahat yo‘nalishini tanlang (1 bosishda AI tahlili):
            </div>
            <div className="space-y-2">
              {advisorTopics.map((item) => {
                const isSelected = selectedTopic === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(item.key);
                      askCareerAdvisor(item.defaultPrompt, item.key);
                    }}
                    disabled={loading}
                    className={`w-full p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600'
                        : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{item.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Career Advisor Conversation & Grounded Job Matches */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-bold">
                    IshTop Global — AI Maslahatchi Muloqot Oynasi
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Ish qidiruvchiga kasbiy yo‘nalish, suhbat, rezyume va xavfsizlik bo‘yicha yordam
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  askCareerAdvisor(
                    advisorTopics.find((t) => t.key === selectedTopic)?.defaultPrompt ||
                      'Menga ish topish bo‘yicha maslahat ber',
                    selectedTopic
                  )
                }
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Qayta maslahat olish</span>
              </button>
            </div>

            {/* Quick Prompt Buttons */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Tezkor savollar:
              </span>
              <button
                type="button"
                onClick={() =>
                  askCareerAdvisor(
                    'Tajribasiz bo‘lsam qaysi sohalardan ish boshlaganim ma’qul va qanday o‘rganaman?',
                    'career-choice'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer"
              >
                Tajribasiz qanday ish topaman?
              </button>
              <button
                type="button"
                onClick={() =>
                  askCareerAdvisor(
                    'Kunlik va soatlik ishlarda ish haqini o‘z vaqtida olish uchun nimalarga e’tibor berish kerak?',
                    'salary-negotiation'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Kunlik/soatlik ishda nimaga e’tibor beray?
              </button>
              <button
                type="button"
                onClick={() =>
                  askCareerAdvisor(
                    'Xorijda yoki masofaviy ishlash uchun rezyumeni qanday tayyorlash kerak?',
                    'resume-improve'
                  )
                }
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                Masofaviy ishga rezyume tayyorlash
              </button>
            </div>

            {/* Messages Feed */}
            <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    msg.sender === 'ai'
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-blue-600 border-blue-600 text-white ml-auto max-w-xl'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold">
                      {msg.sender === 'ai' ? (
                        <>
                          <Bot className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700">AI Yordamchi ({msg.topic})</span>
                        </>
                      ) : (
                        <span>Sizning savolingiz</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[11px] ${
                          msg.sender === 'ai' ? 'text-slate-400' : 'text-blue-100'
                        }`}
                      >
                        {msg.createdAt.slice(11, 16)}
                      </span>
                      {messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          className={`p-1 rounded cursor-pointer ${
                            msg.sender === 'ai'
                              ? 'text-slate-400 hover:text-red-600'
                              : 'text-blue-200 hover:text-white'
                          }`}
                          title="Xabarni o‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="p-4 bg-white border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>
                    AI Yordamchi profilingiz va vakansiyalarni tahlil qilib, shaxsiy maslahat tayyorlamoqda...
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                askCareerAdvisor(questionInput, selectedTopic);
              }}
              className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="AI Yordamchidan ish topish, suhbat, maosh yoki ish shartlari haqida so‘rang..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={loading || !questionInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Maslahat olish</span>
              </button>
            </form>
          </div>

          {/* Grounded Real Database Jobs Recommended by AI Advisor */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>AI Yordamchi sizga tavsiya etayotgan haqiqiy vakansiyalar</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faqat ma’lumotlar bazasidagi tasdiqlangan va faol vakansiyalar (Soxta ishlar yo‘q)
                </p>
              </div>
            </div>

            {topMatchingJobs.length === 0 ? (
              <div className="text-xs text-slate-500 py-4">
                Hozircha tanlangan mezonlar bo‘yicha vakansiyalar topilmadi. Sohalarni kengaytirib ko‘ring.
              </div>
            ) : (
              <div className="space-y-3">
                {topMatchingJobs.slice(0, 4).map(({ job, rec }) => {
                  const isSaved = savedJobs.some(
                    (s) => s.userId === user?.id && s.jobId === job.id
                  );
                  const hasApplied = applications.some(
                    (a) => a.seekerId === user?.id && a.jobId === job.id
                  );

                  return (
                    <div
                      key={job.id}
                      className="p-4 border border-slate-200 rounded-xl hover:border-blue-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-emerald-700">
                            {rec.score}% Moslik
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">{job.category}</span>
                          <span className="text-slate-300">·</span>
                          {job.companyVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {job.companyName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {job.companyName}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenJob(job)}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                        >
                          {job.title}
                        </button>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            {job.city}, {job.country} ({job.exactAddress})
                          </span>
                          <span>·</span>
                          <span className="font-mono font-semibold text-slate-900">
                            {formatJobSalary(job)}
                          </span>
                        </div>

                        <div className="text-[11px] text-blue-800 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{rec.reasons.slice(0, 2).join(' · ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleSaveJob(job.id)}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          {isSaved ? t.savedJob : t.saveJob}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenJob(job)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                        >
                          {hasApplied ? t.appliedAlready : 'Ko‘rish va Ariza'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

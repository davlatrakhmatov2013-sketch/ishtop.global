import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const { question, jobContext, lang } = req.body;
      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'Question is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error:
            lang === 'ru'
              ? 'Ключ GEMINI_API_KEY не настроен на сервере.'
              : lang === 'en'
              ? 'GEMINI_API_KEY is not configured on the server.'
              : 'Serverda GEMINI_API_KEY sozlanmagan.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction =
        lang === 'ru'
          ? 'Ты профессиональный ИИ-помощник платформы поиска работы IshTop Global. Четко, понятно и дружелюбно объясняй соискателям суть вакансии, как выполняется работа (порядок работы), обязанности, условия, требования к полу/опыту и безопасность (никогда не платить предоплату).'
          : lang === 'en'
          ? 'You are the professional AI Career & Job Assistant on IshTop Global. Clearly and concisely explain the job role, step-by-step workflow (how the job is performed), requirements, gender/experience fit, and safety rules (never pay upfront fees).'
          : 'Sen IshTop Global ish qidirish platformasining professional AI yordamchisisan. Ish qidiruvchiga vakansiya haqida, bu ishda nima qilish kerakligi, qanday ishlash tartibi (workflow), talablar, jins/tajriba mosligi va xavfsizlik qoidalarini (hech qachon oldindan pul to‘lamaslik) sodda, tushunarli va aniq tilda tushuntirib ber.';

      const prompt = jobContext
        ? `Vakansiya ma'lumotlari:\nLavozim: ${jobContext.title}\nKompaniya: ${jobContext.companyName}\nSoha: ${jobContext.category}\nJoylashuv: ${jobContext.city}, ${jobContext.country}\nMaosh: ${jobContext.salary}\nKimlar uchun (Jins): ${jobContext.targetGender}\nIsh haqida: ${jobContext.description}\nQanday ishlash kerak va nima qilish kerak (Ish tartibi): ${jobContext.howToWork}\nVazifalar: ${(jobContext.responsibilities || []).join('; ')}\nTalablar: ${(jobContext.requirements || []).join('; ')}\n\nFoydalanuvchi savoli: ${question}`
        : `Foydalanuvchi savoli: ${question}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      res.json({ answer: response.text || '' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // Server-side AI Job Recommendation Reasoning (strictly grounded on existing DB jobIds)
  app.post('/api/ai-recommend-jobs', async (req, res) => {
    try {
      const { userProfile, candidateJobs, lang } = req.body;
      if (!Array.isArray(candidateJobs) || candidateJobs.length === 0) {
        res.json({ recommendations: [] });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'AI kaliti sozlanmagan, deterministik algoritm natijalari ishlatilmoqda.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const allowedIds = new Set<string>(candidateJobs.map((j: any) => String(j.id)));

      const systemInstruction =
        lang === 'ru'
          ? 'Ты ИИ-система подбора вакансий IshTop Global. Используй ТОЛЬКО переданные вакансии из базы данных (по их точному jobId). Никогда не придумывай новые вакансии. Для каждой подходящей вакансии кратко объясни персональную причину совместимости с профилем и резюме кандидата.'
          : lang === 'en'
          ? 'You are the IshTop Global AI Career Matcher. Evaluate ONLY the provided database jobs by their exact jobId. Never invent jobs, salaries, or companies. Provide a concise personalized explanation for why each job matches the candidate.'
          : 'Sen IshTop Global platformasining AI vakansiya tavsiya tizimisan. Faqatgina bazadan yuborilgan haqiqiy vakansiyalarni (ularning aniq jobId identifikatori bo‘yicha) tahlil qil. Hech qachon mavjud bo‘lmagan vakansiya, maosh yoki kompaniya o‘ylab topma. Har bir vakansiya nomzodning rezyumesi, ko‘nikmalari va tanlovlariga nima uchun mos ekanini 1-2 jumlada aniq tushuntirib ber.';

      const prompt = `Nomzod profili va rezyumesi:\n${JSON.stringify(
        userProfile
      )}\n\nMa'lumotlar bazasidagi haqiqiy vakansiyalar ro'yxati:\n${JSON.stringify(
        candidateJobs.slice(0, 12)
      )}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    jobId: { type: Type.STRING },
                    aiInsight: { type: Type.STRING },
                  },
                  required: ['jobId', 'aiInsight'],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"items":[]}');
      // Strict ID verification: Discard any jobId not in the real database candidate list
      const verifiedItems = (parsed.items || []).filter(
        (item: any) => item && typeof item.jobId === 'string' && allowedIds.has(item.jobId)
      );

      res.json({ recommendations: verifiedItems });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // Dedicated AI Career Advisor Endpoint for Job Seekers ("AI Yordamchi" section)
  app.post('/api/ai-career-advisor', async (req, res) => {
    try {
      const { message, topic, seekerContext, sampleJobs, lang } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error:
            lang === 'ru'
              ? 'Ключ GEMINI_API_KEY не настроен на сервере.'
              : lang === 'en'
              ? 'GEMINI_API_KEY is not configured on the server.'
              : 'Serverda GEMINI_API_KEY sozlanmagan.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction =
        lang === 'ru'
          ? 'Ты персональный ИИ-помощник и карьерный консультант платформы IshTop Global для соискателей. Дай конкретные, практичные и честные советы по выбору профессии, улучшению резюме, подготовке к собеседованию, переговорам о зарплате (месячной, дневной или почасовой), трудовым правам, условиям для людей с инвалидностью и защите от мошенников (никогда не платить предоплату). Опирайся на профиль кандидата и реальные вакансии из базы данных. Никогда не выдумывай несуществующие вакансии или компании.'
          : lang === 'en'
          ? 'You are the dedicated AI Career Advisor ("AI Yordamchi") on IshTop Global for job seekers. Provide structured, practical, and honest career advice covering profession choice, resume improvement, interview preparation, salary negotiation (monthly, daily, or hourly), labor rights, disability workplace accommodations, and anti-scam safety (never pay upfront fees). Ground your advice in the seeker profile and real database jobs provided. Never invent fake jobs or companies.'
          : 'Sen IshTop Global platformasining ish qidiruvchilar uchun maxsus “AI Yordamchi va Karyera Maslahatchisi”san. Ish qidiruvchiga kasb va soha tanlash, rezyumeni kuchaytirish, suhbatdan (intervyudan) muvaffaqiyatli o‘tish, maosh bo‘yicha kelishish (oylik, kunlik, soatlik), yosh va mehnat qonunchiligi me’yorlari, nogironligi bo‘lgan insonlar uchun qulay ishlarni topish hamda firibgarlardan himoyalanish (hech qachon viza, hujjat yoki suhbat uchun oldindan pul to‘lamaslik) bo‘yicha aniq, amaliy va tushunarli maslahatlar ber. Javobda foydalanuvchining profil ma’lumotlari va bazadagi haqiqiy vakansiyalarga tayan. Hech qachon mavjud bo‘lmagan soxta vakansiya yoki kompaniya o‘ylab topma.';

      const prompt = `Tanlangan maslahat yo'nalishi: ${topic || 'Umumiy karyera maslahati'}
Ish qidiruvchi profili:
${JSON.stringify(seekerContext || {}, null, 2)}

Bazadagi mos haqiqiy vakansiyalar namunasi (agar kerak bo'lsa ularni misol qilib keltir):
${JSON.stringify((sampleJobs || []).slice(0, 6), null, 2)}

Ish qidiruvchining savoli yoki murojaati:
${message}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.35,
        },
      });

      res.json({ advice: response.text || '' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // Simple server-side per-IP / per-session rate limiter & cost control
  const aiRateLimitMap = new Map<string, { count: number; windowStart: number; lastPrompt: string }>();

  function checkRateLimitAndDedup(key: string, promptText: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const record = aiRateLimitMap.get(key);
    if (!record || now - record.windowStart > 60_000) {
      aiRateLimitMap.set(key, { count: 1, windowStart: now, lastPrompt: promptText });
      return { allowed: true };
    }
    if (record.count >= 25) {
      return {
        allowed: false,
        reason: 'So‘rovlar soni me’yordan oshdi (1 daqiqada maks. 25 ta so‘rov). Iltimos, biroz kutib qayta urinib ko‘ring.',
      };
    }
    record.count += 1;
    record.lastPrompt = promptText;
    return { allowed: true };
  }

  // Server-side Admin Verification Endpoint
  app.post('/api/admin-verify', (req, res) => {
    const { password } = req.body;
    if (typeof password === 'string' && password.trim() === 'davlat') {
      res.json({ verified: true });
    } else {
      res.status(403).json({ verified: false, error: 'Maxfiy parol noto‘g‘ri' });
    }
  });

  // Universal Multi-Mode AI Copilot Endpoint across all sections of IshTop Global
  app.post('/api/ai-copilot', async (req, res) => {
    try {
      const {
        mode,
        prompt,
        lang = 'uz',
        userKey = 'guest',
        pageContext,
        candidateJobs = [],
        resumeContext,
        employerContext,
        applicationContext,
        companyContext,
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'Savol yoki matn kiritilishi shart.' });
        return;
      }

      const rateCheck = checkRateLimitAndDedup(String(userKey), prompt.trim());
      if (!rateCheck.allowed) {
        res.status(429).json({ error: rateCheck.reason });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          fallbackRequired: true,
          error:
            lang === 'ru'
              ? 'Ключ GEMINI_API_KEY не настроен на сервере. Включен локальный интеллектуальный помощник.'
              : lang === 'en'
              ? 'GEMINI_API_KEY is not configured on the server. Local smart assistant fallback is active.'
              : 'Serverda GEMINI_API_KEY sozlanmagan. Mahalliy aqlli yordamchi tizimi ishga tushirildi.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const allowedJobIds = new Set<string>(
        Array.isArray(candidateJobs) ? candidateJobs.map((j: any) => String(j.id)) : []
      );

      const langName =
        lang === 'ru' ? 'русском языке (Russian)' : lang === 'en' ? 'English' : 'o‘zbek tilida (Uzbek)';

      const systemInstruction = `You are the official "IshTop Global AI Yordamchi" (Universal AI Assistant) integrated across all sections of the IshTop Global employment platform.
Respond strictly in ${langName}.
Current section/mode: ${mode || 'general'}.
Active page: ${pageContext || 'home'}.

STRICT ETHICAL, PRIVACY & GROUNDING RULES:
1. NEVER fabricate fake jobs, fake salaries, fake companies, or fake download links. Only reference job IDs that exist in the provided candidateJobs array.
2. Resume & Cover Letter Help: Never invent degrees, certificates, or work experience the user did not state. Always remind the user to review and confirm any generated text before saving.
3. Interview Coach: Ask role-relevant interview questions, critique the user's answer constructively, teach self-introduction and salary negotiation (monthly/daily/hourly), and explicitly state that interview coaching does not guarantee hiring.
4. Disability & Accessibility Support: Help users find remote, flexible, part-time, wheelchair-accessible, ramp/elevator, or adapted-workstation jobs based strictly on verified job data. If workplace accommodations are unknown, explicitly state they are not specified. Never assume a person's capability based on disability.
5. Employer Assistant: Help write clear job descriptions, responsibilities, requirements, polite candidate replies, interview questions, and trilingual translations (UZ/RU/EN). Never invent unconfirmed salaries/benefits, and strictly refuse discriminatory or illegal job requirements.
6. Applications, Companies, Ratings (1-8 stars) & Reports: Explain application statuses, verified vs unverified companies, the 1-8 star rating scale, and how to write objective complaints with safe evidence (never include passport/bank card numbers). Never declare a company a scammer without official verification or decide report outcomes.
7. Site Navigation: Guide users to real platform sections: 'home' (Bosh sahifa), 'jobs' (Vakansiyalar), 'recommended' (Sizga mos ishlar), 'ai-advisor' (AI Yordamchi va Intervyu), 'companies' (Kompaniyalar), 'pricing' (Tariflar), 'cabinet' (Kabinet / Rezyume / Arizalar).`;

      const fullPrompt = `Foydalanuvchi so'rovi: ${prompt.trim()}

Mavjud kontekst:
- Sahifa: ${pageContext || 'home'}
- Rezyume/Profil konteksti: ${resumeContext ? JSON.stringify(resumeContext) : 'Berilmagan'}
- Ish beruvchi konteksti: ${employerContext ? JSON.stringify(employerContext) : 'Berilmagan'}
- Arizalar konteksti: ${applicationContext ? JSON.stringify(applicationContext) : 'Berilmagan'}
- Kompaniya/Reyting konteksti: ${companyContext ? JSON.stringify(companyContext) : 'Berilmagan'}
- Bazadagi mos vakansiyalar (faqat shu ID lardan foydalanish mumkin): ${JSON.stringify(
        Array.isArray(candidateJobs) ? candidateJobs.slice(0, 8) : []
      )}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              matchedJobIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              draftText: { type: Type.STRING },
              suggestedPage: { type: Type.STRING },
              followUpQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['reply'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{"reply":""}');
      const verifiedJobIds = Array.isArray(parsed.matchedJobIds)
        ? parsed.matchedJobIds.filter((id: any) => typeof id === 'string' && allowedJobIds.has(id))
        : [];

      res.json({
        reply: parsed.reply || '',
        matchedJobIds: verifiedJobIds,
        draftText: parsed.draftText || '',
        suggestedPage: parsed.suggestedPage || '',
        followUpQuestions: Array.isArray(parsed.followUpQuestions)
          ? parsed.followUpQuestions.slice(0, 3)
          : [],
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg, fallbackRequired: true });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IshTop Global server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import {
  CareerPreferences,
  JobMatchRecommendation,
  JobRecord,
  Language,
  ResumeDocument,
  UserRecord,
} from '../types';
import { JOB_SECTORS } from '../data/sectors';

function isJobActiveAndNotExpired(job: JobRecord): boolean {
  if (job.status !== 'approved') return false;
  if (!job.deadline) return true;
  // Compare ISO date YYYY-MM-DD
  return job.deadline >= '2026-10-10';
}

export function computeDeterministicJobRecommendations(
  jobs: JobRecord[],
  user: UserRecord | null,
  preferences?: CareerPreferences,
  lang: Language = 'uz'
): JobMatchRecommendation[] {
  const dismissedSet = new Set<string>(user?.dismissedJobIds || []);
  const primaryResume: ResumeDocument | undefined =
    user?.resumes?.find((r) => r.isPrimary) || user?.resumes?.[0];

  const userTitle = (primaryResume?.professionalTitle || user?.title || '').toLowerCase();
  const userSummary = (primaryResume?.summary || user?.bio || '').toLowerCase();
  const userSkills = Array.from(
    new Set([
      ...(user?.skills || []),
      ...(primaryResume?.skills || []),
    ])
  ).map((s) => s.toLowerCase().trim());

  const userLanguages = (
    primaryResume?.languages?.map((l) => l.language) ||
    user?.languages?.map((l) => l.language) ||
    ['O‘zbek', 'Rus']
  ).map((l) => l.toLowerCase());

  const userExperienceCount =
    (primaryResume?.experience?.length || user?.experience?.length || 0);
  const userEducationCount =
    (primaryResume?.education?.length || user?.education?.length || 0);

  const prefSectors = preferences?.sectors || user?.careerPreferences?.sectors || [];
  const prefCountry =
    preferences?.country ||
    user?.careerPreferences?.country ||
    primaryResume?.country ||
    'all';
  const prefCity =
    preferences?.city ||
    user?.careerPreferences?.city ||
    primaryResume?.city ||
    'all';
  const prefMode =
    preferences?.workMode ||
    user?.careerPreferences?.workMode ||
    primaryResume?.desiredWorkMode ||
    'all';
  const prefType =
    preferences?.employmentType ||
    user?.careerPreferences?.employmentType ||
    primaryResume?.desiredEmploymentType ||
    'all';
  const prefGender = preferences?.gender || user?.gender;
  const userAge = preferences?.age || user?.age;
  const disabilityEnabled = Boolean(
    preferences?.disabilityFriendlyOnly ?? user?.disabilityFilterEnabled
  );
  const userAccommodations =
    preferences?.accommodations || user?.accommodations || [];
  const prefMinSal = preferences?.salaryMin || user?.careerPreferences?.salaryMin;

  const activeJobs = jobs.filter(
    (j) => isJobActiveAndNotExpired(j) && !dismissedSet.has(j.id)
  );

  const scored: JobMatchRecommendation[] = [];

  for (const job of activeJobs) {
    // 0. Legal Age & Minor Protection Check
    if (userAge !== undefined && userAge > 0) {
      const reqMinAge = job.minAge || 18;
      if (userAge < 18 && (job.isHazardousForMinors || reqMinAge > userAge)) {
        // Legally prohibited or hazardous for minors — do not recommend
        continue;
      }
      if (userAge < reqMinAge) {
        continue;
      }
    }

    // Gender compatibility (only filter if user explicitly chose male/female; 'prefer_not_to_say' sees all)
    if (
      prefGender &&
      prefGender !== 'prefer_not_to_say' &&
      job.targetGender !== 'any' &&
      job.targetGender !== prefGender
    ) {
      continue;
    }

    // If user explicitly turned on Disability-friendly filter, require disabilityFriendly or remote
    if (disabilityEnabled && !job.disabilityFriendly && job.workMode !== 'remote') {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // Bonus for Disability Accommodations & Inclusive Workplace
    if (disabilityEnabled && job.disabilityFriendly) {
      score += 12;
      reasons.push(
        lang === 'ru'
          ? '♿ Адаптировано для людей с инвалидностью (доступная среда / гибкие условия)'
          : lang === 'en'
          ? '♿ Accessible & inclusive workplace accommodations available'
          : '♿ Nogironligi bo‘lgan insonlar uchun qulay sharoit va moslashtirilgan ish joyi'
      );
    } else if (
      userAccommodations.length > 0 &&
      job.accommodations?.some((acc) => userAccommodations.includes(acc))
    ) {
      score += 10;
      reasons.push(
        lang === 'ru'
          ? 'Включает выбранные вами удобства рабочего места'
          : lang === 'en'
          ? 'Provides your requested workplace accommodations'
          : 'Siz tanlagan ish joyi qulayliklari mavjud'
      );
    }

    if (userAge && userAge < 18 && !job.isHazardousForMinors && (job.minAge || 18) <= userAge) {
      reasons.push(
        lang === 'ru'
          ? `Подходит по возрасту (${userAge} лет) согласно трудовому законодательству`
          : lang === 'en'
          ? `Legally suitable for your age (${userAge}) under labor laws`
          : `Mehnat qonunchiligiga ko‘ra yoshingizga (${userAge} yosh) mos va xavfsiz`
      );
    }

    // 1. Career Sector & Role Title Match (up to 30 pts)
    const jobTitleLower = job.title.toLowerCase();
    const jobCatLower = job.category.toLowerCase();

    let sectorMatched = false;
    if (prefSectors.length > 0) {
      sectorMatched = prefSectors.some((secId) => {
        const secDef = JOB_SECTORS.find((s) => s.id === secId);
        if (!secDef) return false;
        return (
          jobCatLower.includes(secDef.label.uz.toLowerCase()) ||
          secDef.keywords.some((kw) => jobCatLower.includes(kw) || jobTitleLower.includes(kw))
        );
      });
    }

    const titleWords = userTitle
      .split(/[\s,/()-]+/)
      .filter((w) => w.length >= 3);
    const matchedTitleWord = titleWords.find(
      (w) => jobTitleLower.includes(w) || jobCatLower.includes(w)
    );

    if (sectorMatched && matchedTitleWord) {
      score += 30;
      reasons.push(
        lang === 'ru'
          ? `Профессия и сфера («${job.category}») полностью совпадают`
          : lang === 'en'
          ? `Role & sector ("${job.category}") directly match your profile`
          : `Tanlagan kasbingiz va sohangizga («${job.category}») to‘liq mos`
      );
    } else if (sectorMatched) {
      score += 24;
      reasons.push(
        lang === 'ru'
          ? `В выбранной вами сфере: ${job.category}`
          : lang === 'en'
          ? `Matches your selected career sector: ${job.category}`
          : `Tanlagan ish yo‘nalishingizda: ${job.category}`
      );
    } else if (matchedTitleWord) {
      score += 22;
      reasons.push(
        lang === 'ru'
          ? 'Должность соответствует вашему резюме'
          : lang === 'en'
          ? 'Job title aligns with your resume specialization'
          : 'Lavozim rezyumedagi mutaxassisligingizga mos'
      );
    } else if (prefSectors.length === 0) {
      score += 12;
    }

    // 2. Skills Match (up to 25 pts)
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase());
    const matchedSkills = job.skills.filter((js) => {
      const jsl = js.toLowerCase();
      return (
        userSkills.some((us) => jsl.includes(us) || us.includes(jsl)) ||
        userSummary.includes(jsl)
      );
    });

    if (matchedSkills.length >= 2) {
      score += 25;
      reasons.push(
        lang === 'ru'
          ? `Навыки совпадают: ${matchedSkills.slice(0, 3).join(', ')}`
          : lang === 'en'
          ? `Skills match: ${matchedSkills.slice(0, 3).join(', ')}`
          : `Ko‘nikmalaringiz mos: ${matchedSkills.slice(0, 3).join(', ')}`
      );
    } else if (matchedSkills.length === 1) {
      score += 16;
      reasons.push(
        lang === 'ru'
          ? `Совпадает навык: ${matchedSkills[0]}`
          : lang === 'en'
          ? `Matching skill: ${matchedSkills[0]}`
          : `Ko‘nikmangiz mos: ${matchedSkills[0]}`
      );
    } else if (jobSkillsLower.length > 0) {
      score += 6;
    }

    // 3. Location / Country / City Match (up to 15 pts)
    if (prefCountry !== 'all' && job.country === prefCountry) {
      if (prefCity !== 'all' && job.city === prefCity) {
        score += 15;
        reasons.push(
          lang === 'ru'
            ? `В выбранном городе: ${job.city}`
            : lang === 'en'
            ? `In your preferred city: ${job.city}`
            : `Tanlagan hududingizda: ${job.city}, ${job.country}`
        );
      } else {
        score += 12;
        reasons.push(
          lang === 'ru'
            ? `В выбранной стране: ${job.country}`
            : lang === 'en'
            ? `In your selected country: ${job.country}`
            : `Tanlagan mamlakatingizda: ${job.country}`
        );
      }
    } else if (job.workMode === 'remote') {
      score += 13;
      reasons.push(
        lang === 'ru'
          ? 'Удаленная работа (доступна из любого региона)'
          : lang === 'en'
          ? 'Remote work (accessible from your location)'
          : 'Masofaviy ish (istalgan hududdan ishlash mumkin)'
      );
    } else if (prefCountry === 'all') {
      score += 10;
    }

    // 4. Experience & Education Level Match (up to 12 pts)
    if (job.experienceLevel === 'no-experience') {
      score += 12;
      reasons.push(
        lang === 'ru'
          ? 'Опыт не требуется (обучение в процессе работы)'
          : lang === 'en'
          ? 'No prior experience required (training provided)'
          : 'Tajriba talab qilinmaydi (ish jarayonida o‘rgatiladi)'
      );
    } else if (userExperienceCount >= 2 && (job.experienceLevel === 'mid' || job.experienceLevel === 'senior')) {
      score += 12;
      reasons.push(
        lang === 'ru'
          ? 'Ваш опыт работы и образование соответствуют требованиям'
          : lang === 'en'
          ? 'Your work experience & education fit the requirements'
          : 'Ish tajribangiz va ta’lim darajangiz talabga mos'
      );
    } else if (userExperienceCount >= 1 || userEducationCount >= 1) {
      score += 9;
      reasons.push(
        lang === 'ru'
          ? 'Уровень опыта подходит'
          : lang === 'en'
          ? 'Experience level is compatible'
          : 'Tajriba darajangiz talabga mos'
      );
    } else {
      score += 5;
    }

    // 5. Salary Expectations Match (up to 8 pts)
    if (!prefMinSal || (job.salaryMax && job.salaryMax >= prefMinSal) || job.isNegotiable) {
      score += 8;
      if (prefMinSal && job.salaryMax && job.salaryMax >= prefMinSal) {
        reasons.push(
          lang === 'ru'
            ? 'Зарплата соответствует вашим ожиданиям'
            : lang === 'en'
            ? 'Salary meets your target range'
            : 'Maosh siz belgilagan talabga mos'
        );
      }
    }

    // 6. Work Mode & Employment Type Schedule Match (up to 5 pts)
    if (
      (prefMode === 'all' || job.workMode === prefMode) &&
      (prefType === 'all' || job.employmentType === prefType)
    ) {
      score += 5;
      reasons.push(
        lang === 'ru'
          ? 'Подходящий график и формат работы'
          : lang === 'en'
          ? 'Work mode & schedule fit your preference'
          : 'Ish grafigi va shakli tanlovingizga mos'
      );
    }

    // 7. Language Match (up to 5 pts)
    const jobLangsLower = job.workLanguage.toLowerCase();
    const langMatched = userLanguages.some((ul) => jobLangsLower.includes(ul));
    if (langMatched) {
      score += 5;
    }

    const finalScore = Math.min(99, Math.max(35, score));

    if (finalScore >= 48) {
      scored.push({
        jobId: job.id,
        score: finalScore,
        reasons: reasons.slice(0, 4),
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 36);
}

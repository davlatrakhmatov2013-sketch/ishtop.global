import {
  ApplicationRecord,
  AuditLogRecord,
  ChatMessageRecord,
  CompanyRatingRecord,
  CompanyRecord,
  DisabilityAccommodationKey,
  JobRecord,
  NotificationRecord,
  ReportRecord,
  SubscriptionPlanConfig,
  TargetGender,
  UserRecord,
} from '../types';

export const initialUsers: UserRecord[] = [
  {
    id: 'usr_seeker_1',
    email: 'jasur.karimov@example.uz',
    emailVerified: true,
    fullName: 'Jasur Karimov',
    role: 'seeker',
    gender: 'male',
    phone: '+998 90 123 45 67',
    telegram: '@jasur_dev_uz',
    title: 'Senior Full-Stack TypeScript Dasturchi',
    location: 'Toshkent, O‘zbekiston',
    bio: '6 yildan ortiq tajribaga ega veb-dasturchi. Yuqori yuklamali moliyaviy va elektron tijorat tizimlarini ishlab chiqishga ixtisoslashgan.',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'REST API', 'Kiberxavfsizlik'],
    experience: [
      {
        id: 'exp_1',
        company: 'Turon FinTech Solutions',
        role: 'Lead Frontend Engineer',
        period: '2023 — Hozirgacha',
        description: 'To‘lov shlyuzlari va mijozlar kabineti arxitekturasini yaratish, xavfsizlik auditi va jamoani boshqarish.',
      },
      {
        id: 'exp_2',
        company: 'Samarkand Digital Lab',
        role: 'Full-Stack Developer',
        period: '2020 — 2023',
        description: 'Logistika va ombor hisob-kitobi uchun bulutli SaaS platformalarini ishlab chiqish.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'Toshkent Axborot Texnologiyalari Universiteti (TATU)',
        degree: 'Dasturiy injiniring bakalavri',
        year: '2016 — 2020',
      },
    ],
    resumeFileName: 'Jasur_Karimov_CV_2026.pdf',
    resumeFileSize: 248000,
    plan: 'free',
    status: 'active',
    privacyShowProfile: true,
    createdAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'usr_employer_1',
    email: 'hr@silkroad-fintech.uz',
    emailVerified: true,
    fullName: 'Dilnoza Rahimova',
    role: 'employer',
    gender: 'female',
    phone: '+998 71 200 11 22',
    telegram: '@dilnoza_hr_silkroad',
    title: 'HR Bo‘limi Rahbari',
    location: 'Toshkent, O‘zbekiston',
    skills: ['IT Recruiting', 'HR Management'],
    experience: [],
    education: [],
    companyId: 'cmp_1',
    plan: 'employer-pro',
    status: 'active',
    privacyShowProfile: true,
    createdAt: '2026-08-20T09:00:00Z',
  },
  {
    id: 'usr_admin_1',
    email: 'davlatrakhmatov.2013@gmail.com',
    emailVerified: true,
    fullName: 'Sayt Boshqaruvchisi (Mening Kabinetim)',
    role: 'admin',
    gender: 'male',
    phone: '+998 71 000 00 01',
    telegram: '@ishtop_owner',
    title: 'Yagona Sayt Boshqaruvchisi va Asoschisi',
    location: 'Toshkent, O‘zbekiston',
    skills: ['Security Audit', 'Platform Governance', 'Moderation'],
    experience: [],
    education: [],
    plan: 'employer-pro',
    status: 'active',
    privacyShowProfile: false,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

// Deterministic generator for 112 realistic Uzbek & international companies
function buildCompaniesCatalog(): CompanyRecord[] {
  const baseCompanies: CompanyRecord[] = [
    {
      id: 'cmp_1',
      ownerId: 'usr_employer_1',
      name: 'SilkRoad FinTech & Cloud',
      industry: 'IT va dasturlash',
      country: 'O‘zbekiston',
      city: 'Toshkent',
      website: 'https://silkroad-fintech.uz',
      contactEmail: 'careers@silkroad-fintech.uz',
      contactPhone: '+998 71 200 11 22',
      telegramHandle: '@silkroad_hr_uz',
      description: 'Markaziy Osiyo bozori uchun raqamli bank, elektron tijorat va bulutli infratuzilma yechimlarini yaratuvchi texnologik kompaniya.',
      verified: true,
      verificationStatus: 'verified',
      createdAt: '2026-08-20T09:15:00Z',
    },
    {
      id: 'cmp_2',
      ownerId: 'usr_employer_2',
      name: 'Nordic Logistics GmbH',
      industry: 'Haydovchilik va logistika',
      country: 'Germaniya',
      city: 'Berlin',
      website: 'https://nordic-logistics.de',
      contactEmail: 'jobs@nordic-logistics.de',
      contactPhone: '+49 30 901820',
      telegramHandle: '@nordic_logistics_jobs',
      description: 'Yevropa va Markaziy Osiyo o‘rtasida yuk tashish va zanjirli ta’minotni boshqaruvchi xalqaro logistika operatori.',
      verified: true,
      verificationStatus: 'verified',
      createdAt: '2026-09-01T12:00:00Z',
    },
    {
      id: 'cmp_3',
      ownerId: 'usr_employer_3',
      name: 'Samarkand Agro Export MCHJ',
      industry: 'Qishloq xo‘jaligi',
      country: 'O‘zbekiston',
      city: 'Samarqand',
      website: 'https://samagro.uz',
      contactEmail: 'info@samagro.uz',
      contactPhone: '+998 66 233 44 55',
      telegramHandle: '@samagro_export_hr',
      description: 'Qishloq xo‘jaligi mahsulotlarini qayta ishlash va Yaqin Sharq hamda Yevropa davlatlariga eksport qilish korxonasi.',
      verified: true,
      verificationStatus: 'verified',
      createdAt: '2026-10-01T14:30:00Z',
    },
  ];

  const prefixes = [
    'Toshkent', 'Samarqand', 'Buxoro', 'Farg‘ona', 'Andijon', 'Namangan', 'Xorazm', 'Qashqadaryo',
    'Turon', 'Movarounnahr', 'O‘zbegim', 'Orient', 'Navro‘z', 'Baraka', 'EuroAsia', 'GlobalTech',
    'Al-Xorazmiy', 'Registon', 'Zarafshon', 'Amudaryo', 'Sirdaryo', 'Chust', 'Qo‘qon', 'Termiz',
  ];

  const suffixes = [
    { suffix: 'Digital Systems', industry: 'IT va dasturlash' },
    { suffix: 'Stroy Invest MCHJ', industry: 'Qurilish va ta’mirlash' },
    { suffix: 'Trans Logistika', industry: 'Haydovchilik va logistika' },
    { suffix: 'Med Servis Klinikasi', industry: 'Tibbiyot' },
    { suffix: 'Grand Hotel & Plaza', industry: 'Restoran va mehmonxona' },
    { suffix: 'Tekstil Sanoat Zavodi', industry: 'Zavod va ishlab chiqarish' },
    { suffix: 'Savdo & Distribution', industry: 'Savdo va marketing' },
    { suffix: 'Business Consulting', industry: 'Ofis va ma’muriy ishlar' },
    { suffix: 'Xalqaro Ta’lim Akademiyasi', industry: 'Ta’lim va o‘qituvchilik' },
    { suffix: 'Avto Texnik Servis', industry: 'Texnik xizmat va ustachilik' },
    { suffix: 'Cloud Remote Solutions', industry: 'Masofaviy va onlayn ishlar' },
    { suffix: 'Express Ombor & Kuryer', industry: 'Ombor va yetkazib berish' },
    { suffix: 'Eco Clean Xizmati', industry: 'Tozalash va uy xizmatlari' },
    { suffix: 'Agro Klaster MCHJ', industry: 'Qishloq xo‘jaligi' },
    { suffix: 'Yoshlar Karyera Markazi', industry: 'Tajribasizlar uchun ishlar' },
    { suffix: 'Creative Design Studio', industry: 'Dizayn va ijod' },
    { suffix: 'Audit va Buxgalteriya Markazi', industry: 'Buxgalteriya va moliya' },
    { suffix: 'Beauty & Wellness Spa', industry: 'Go‘zallik va shaxsiy xizmatlar' },
    { suffix: 'Lex Yuridik Byurosi', industry: 'Huquq va yuridik xizmatlar' },
    { suffix: 'Universal Servis Guruhi', industry: 'Boshqa kasblar' },
  ];

  const locations = [
    { country: 'O‘zbekiston', city: 'Toshkent', phonePrefix: '+998 71' },
    { country: 'O‘zbekiston', city: 'Samarqand', phonePrefix: '+998 66' },
    { country: 'O‘zbekiston', city: 'Buxoro', phonePrefix: '+998 65' },
    { country: 'O‘zbekiston', city: 'Farg‘ona', phonePrefix: '+998 73' },
    { country: 'O‘zbekiston', city: 'Andijon', phonePrefix: '+998 74' },
    { country: 'O‘zbekiston', city: 'Namangan', phonePrefix: '+998 69' },
    { country: 'Germaniya', city: 'Berlin', phonePrefix: '+49 30' },
    { country: 'BAA', city: 'Dubay', phonePrefix: '+971 4' },
    { country: 'Janubiy Koreya', city: 'Seul', phonePrefix: '+82 2' },
    { country: 'Polsha', city: 'Varshava', phonePrefix: '+48 22' },
    { country: 'Turkiya', city: 'Istanbul', phonePrefix: '+90 212' },
  ];

  for (let i = 4; i <= 112; i++) {
    const pref = prefixes[(i - 4) % prefixes.length];
    const suf = suffixes[(i - 4) % suffixes.length];
    const loc = locations[(i - 4) % locations.length];
    const slug = `${pref.toLowerCase().replace(/[^a-z]/g, '')}_${i}`;
    const isVerified = i % 5 !== 0;

    baseCompanies.push({
      id: `cmp_${i}`,
      ownerId: `usr_emp_${i}`,
      name: `${pref} ${suf.suffix} #${i}`,
      industry: suf.industry,
      country: loc.country,
      city: loc.city,
      website: `https://${slug}.ishtop.uz`,
      contactEmail: `hr@${slug}.ishtop.uz`,
      contactPhone: `${loc.phonePrefix} ${200 + (i % 700)} ${10 + (i % 89)} ${10 + ((i * 3) % 89)}`,
      telegramHandle: `@${slug}_hr`,
      description: `${loc.city} (${loc.country}) hududida "${suf.industry}" yo‘nalishida faoliyat yurituvchi rasmiy ish beruvchi korxona. Xodimlar uchun barcha mehnat sharoitlari va rasmiy shartnoma taqdim etiladi.`,
      verified: isVerified,
      verificationStatus: isVerified ? 'verified' : 'pending',
      createdAt: '2026-09-15T10:00:00Z',
    });
  }

  return baseCompanies;
}

export const initialCompanies: CompanyRecord[] = buildCompaniesCatalog();

// Deterministic generator for 520 jobs across all 20 sectors with mandatory howToWork & targetGender
function buildJobsCatalog(companiesList: CompanyRecord[]): JobRecord[] {
  const sectorTemplates: Array<{
    category: string;
    titles: string[];
    targetGender: TargetGender;
    salaryMinUzs: number;
    salaryMaxUzs: number;
    workMode: JobRecord['workMode'];
    empType: JobRecord['employmentType'];
    exp: JobRecord['experienceLevel'];
    skills: string[];
    description: string;
    howToWork: string;
    responsibilities: string[];
    requirements: string[];
  }> = [
    {
      category: 'IT va dasturlash',
      titles: ['Frontend React Dasturchi', 'Backend Node.js Muhandisi', 'Kiberxavfsizlik Mutaxassisi', 'QA Avtomatlashtirish Muhandisi', 'Mobil Flutter Dasturchi'],
      targetGender: 'any',
      salaryMinUzs: 12000000,
      salaryMaxUzs: 28000000,
      workMode: 'hybrid',
      empType: 'full-time',
      exp: 'mid',
      skills: ['TypeScript', 'React', 'Node.js', 'Git', 'REST API'],
      description: 'Zamonaviy veb va mobil dasturiy ta’minotlarni ishlab chiqish hamda yuqori xavfsizlik standartlarini joriy etish.',
      howToWork: 'Har kuni ertalab 09:30 da 15 daqiqalik kunlik reja (stand-up) yig‘ilishi bo‘ladi. Vazifalar Jira tizimidan olinadi, kod yozilib GitHub Pull Request orqali tekshiruvga yuboriladi va jamoa bilan tahlil qilinadi.',
      responsibilities: ['Yangi modullarni yozish va testlash', 'Kod sifatini nazorat qilish', 'API integratsiyalarini bajarish'],
      requirements: ['Kamida 2 yil amaliy tajriba', 'Jamoada ishlash ko‘nikmasi', 'Texnik hujjatlarni tushunish'],
    },
    {
      category: 'Qurilish va ta’mirlash',
      titles: ['Bosh Qurilish Muhandisi (Prorab)', 'Ichki Pardozlash Ustasi', 'Elektromontaj va Santexnika Ustasi', 'Monolit va Beton Ustasi', 'Smeta va Loyiha Muhandisi'],
      targetGender: 'male',
      salaryMinUzs: 8000000,
      salaryMaxUzs: 18000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Qurilish me’yorlari', 'Chizmalarni o‘qish', 'Mehnat xavfsizligi', 'AutoCAD'],
      description: 'Yangi qurilayotgan turar-joy va tijorat binolarida qurilish-montaj hamda ta’mirlash ishlarini sifatli bajarish.',
      howToWork: 'Ish kuni soat 08:00 da qurilish obyektida texnika xavfsizligi yo‘riqnomasidan boshlanadi. Kunlik chizma va reja asosida brigada bilan belgilangan qavat yoki uchastkada ish olib boriladi. Maxsus kiyim va asbob-uskunalar kompaniya tomonidan beriladi.',
      responsibilities: ['Qurilish ishlarini grafik asosida bajarish', 'Xavfsizlik qoidalariga rioya qilish', 'Materiallar sarfini nazorat qilish'],
      requirements: ['Qurilish sohasida tajriba', 'Mas’uliyatlilik va aniqlik'],
    },
    {
      category: 'Haydovchilik va logistika',
      titles: ['Xalqaro Yuk Mashinasi Haydovchisi (CE)', 'Shahar Ichida Yetkazib Berish Haydovchisi', 'Xalqaro Logistika va Ekspeditorlik Menejeri', 'Dispetcher-Koordinator', 'Maxsus Texnika Haydovchisi'],
      targetGender: 'male',
      salaryMinUzs: 7500000,
      salaryMaxUzs: 22000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['GPS Navigatsiya', 'Yuk hujjatlari (CMR/TIR)', 'Yo‘l harakati qoidalari', 'Logistika'],
      description: 'Mahalliy va xalqaro yo‘nalishlarda yuklarni xavfsiz, o‘z vaqtida manzilga yetkazish va transport oqimini muvofiqlashtirish.',
      howToWork: 'Haydovchi yoki logist ertalab marshrut varaqasi va yuk hujjatlarini qabul qilib oladi. Avtomobil texnik ko‘rikdan o‘tkaziladi, yuk ortish punkti orqali belgilangan manzilga GPS nazorati ostida yetkaziladi.',
      responsibilities: ['Yuklarni butun va xavfsiz yetkazish', 'Yo‘l varaqalarini yuritish', 'Dispetcher bilan doimiy aloqada bo‘lish'],
      requirements: ['Tegishli haydovchilik guvohnomasi (B/C/CE)', 'Yo‘nalishlarni yaxshi bilish'],
    },
    {
      category: 'Tibbiyot',
      titles: ['Katta Hamshira va Muolaja Mutaxassisi', 'Umumiy Amaliyot Shifokori (Terapevt)', 'Farmatsevt-Provizor (Dorixona)', 'Laborant-Diagnostika Mutaxassisi', 'Stomatolog Assistenti'],
      targetGender: 'female',
      salaryMinUzs: 6000000,
      salaryMaxUzs: 15000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'junior',
      skills: ['Tibbiy etika', 'Birinchi yordam', 'Farmakologiya', 'Sterillik nazorati'],
      description: 'Xususiy klinika va diagnostika markazlarida bemorlarga malakali tibbiy xizmat ko‘rsatish va muolajalarni bajarish.',
      howToWork: 'Smena boshida tibbiy xona va jihozlar sterilligi tekshiriladi. Ro‘yxatga olingan bemorlar elektron navbat asosida qabul qilinadi, shifokor ko‘rsatmasi bo‘yicha tahlillar yoki muolajalar bajarilib, elektron kartaga kiritiladi.',
      responsibilities: ['Bemorlarni qabul qilish va muolaja o‘tkazish', 'Sanitariya-gigiyena qoidalariga amal qilish', 'Tibbiy qaydnomalarni yuritish'],
      requirements: ['Tibbiy diplom yoki sertifikat', 'Xushmuomalalik va e’tiborlilik'],
    },
    {
      category: 'Restoran va mehmonxona',
      titles: ['Mehmonxona Administrator-Resepshn', 'Milliy va Yevropa TaomlariBosh Oshpazi', 'Professional Barista', 'Restoran Zal Menejeri', 'Xonalarni Tayyorlash Xodimasi (Housekeeping)'],
      targetGender: 'any',
      salaryMinUzs: 5000000,
      salaryMaxUzs: 12000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'junior',
      skills: ['Mijozlarga xizmat ko‘rsatish', 'Mehmondo‘stlik standartlari', 'Til bilish', 'Kassa R-Keeper'],
      description: 'Mehmonxona va restoran majmualarida mahalliy hamda xorijiy mehmonlarga yuqori darajada xizmat ko‘rsatish.',
      howToWork: 'Smena boshlanishidan 15 daqiqa oldin forma kiyilib ish joyi tayyorlanadi. Mehmonlarni kutib olish, buyurtmalarni qabul qilish yoki xonalarni standart bo‘yicha tayyorlash amalga oshiriladi. Tushlik kompaniya hisobidan.',
      responsibilities: ['Mehmonlarga xushmuomala xizmat ko‘rsatish', 'Tozalik va sifat standartlarini saqlash'],
      requirements: ['Ozodalik va muloqot madaniyati', 'Jamoada tez ishlash'],
    },
    {
      category: 'Zavod va ishlab chiqarish',
      titles: ['CNC Stanok Operatori', 'Ishlab Chiqarish Liniyasi Texnologi', 'Sifat Nazorati (OTK) Muhandisi', 'Qadoqlash Liniyasi Operatori', 'Sanoat Uskunalari Mexanigi'],
      targetGender: 'male',
      salaryMinUzs: 6500000,
      salaryMaxUzs: 16000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Ishlab chiqarish texnologiyasi', 'Stanok boshqaruvi', 'ISO sifat standarti', 'Texnika xavfsizligi'],
      description: 'Zamonaviy ishlab chiqarish zavodida avtomatlashtirilgan liniyalarni boshqarish va mahsulot sifatini nazorat qilish.',
      howToWork: 'Zavodga kirishda maxsus himoya kiyimi kiyiladi, smena boshlig‘idan kunlik ishlab chiqarish normasi olinadi. Uskuna sozlanib, xomashyo yuklanadi va chiqayotgan tayyor mahsulot har soatda sifat o‘lchovidan o‘tkaziladi.',
      responsibilities: ['Uskunani uzluksiz ishlashini ta’minlash', 'Yaroqsiz mahsulot chiqishini oldini olish'],
      requirements: ['Texnik tushuncha va intizom', 'Smenali grafikda ishlash imkoniyati'],
    },
    {
      category: 'Savdo va marketing',
      titles: ['B2B Korporativ Sotuvlar Menejeri', 'SMM va Targetolog Mutaxassisi', 'Savdo Vakili (Supervayzer)', 'Marketolog-Tahlilchi', 'Do‘kon Katta Sotuvchi-Konsultanti'],
      targetGender: 'any',
      salaryMinUzs: 6000000,
      salaryMaxUzs: 20000000,
      workMode: 'hybrid',
      empType: 'full-time',
      exp: 'junior',
      skills: ['B2B/B2C Sotuv', 'CRM (AmoCRM / Bitrix24)', 'Muzokara olib borish', 'Marketing tahlili'],
      description: 'Kompaniya mahsulot va xizmatlari savdosini oshirish, yangi mijozlarni jalb qilish hamda reklama kampaniyalarini yuritish.',
      howToWork: 'CRM tizimidagi yangi murojaatlar (lidlar) bilan bog‘lanish, mijozlarga mahsulot taqdimotini o‘tkazish, tijorat takliflarini yuborish va shartnoma tuzish. Oylik maosh ustiga har bir sotuvdan aniq foiz (bonus) to‘lanadi.',
      responsibilities: ['Mijozlar bazasini kengaytirish', 'Sotuv rejasini bajarish', 'CRM hisobotlarini yuritish'],
      requirements: ['Nutq ravonligi va ishontirish qobiliyati', 'Natijaga yo‘nalganlik'],
    },
    {
      category: 'Ofis va ma’muriy ishlar',
      titles: ['Ofis Menejeri va Yordamchi', 'Kadrlar Bo‘limi (HR) Inspektori', 'Call-Markaz Katta Operatori', 'Hujjatlar Bilan Ishlash Mutaxassisi', 'Resepshn va Mijozlar Maslahatchisi'],
      targetGender: 'female',
      salaryMinUzs: 5000000,
      salaryMaxUzs: 11000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'junior',
      skills: ['MS Office (Word, Excel)', 'Hujjat aylanishi', 'Telefon etikasi', 'Tashkilotchilik'],
      description: 'Kompaniya ofisining kunlik ish faoliyatini muvofiqlashtirish, hujjatlarni tartibga solish va qo‘ng‘iroqlarga javob berish.',
      howToWork: 'Soat 09:00 dan 18:00 gacha qulay ofisda ishlanadi. Kiruvchi xat va hujjatlarni ro‘yxatga olish, mijozlar qo‘ng‘iroqlariga javob berish, rahbariyat topshiriqlarini bo‘limlarga yetkazish va ofis ta’minotini nazorat qilish.',
      responsibilities: ['Ofis ichki tartibini saqlash', 'Xat-hujjatlarni rasmiylashtirish', 'Mehmonlarni kutib olish'],
      requirements: ['Kompyuterda tez va xatosiz ishlash', 'O‘zbek va rus tillarida ravon muloqot'],
    },
    {
      category: 'Ta’lim va o‘qituvchilik',
      titles: ['Ingliz Tili (IELTS 7.5+) O‘qituvchisi', 'Matematika va Mantiq Ustoz-Mentori', 'Maktabgacha Ta’lim Tarbiyachisi', 'Rus Tili va Adabiyoti O‘qituvchisi', 'Dasturlash va Robototexnika Mentori'],
      targetGender: 'female',
      salaryMinUzs: 6000000,
      salaryMaxUzs: 16000000,
      workMode: 'onsite',
      empType: 'part-time',
      exp: 'mid',
      skills: ['Pedagogika', 'IELTS / CEFR', 'O‘quv dasturi tuzish', 'Interaktiv dars o‘tish'],
      description: 'Xususiy maktab va o‘quv markazlarida o‘quvchilarga zamonaviy metodika asosida sifatli ta’lim berish.',
      howToWork: 'Tasdiqlangan dars jadvali asosida 10–15 nafar o‘quvchidan iborat guruhlarga 80 daqiqalik interaktiv dars o‘tiladi. Har hafta yakunida o‘quvchilar o‘zlashtirish ko‘rsatkichi elektron jurnalga kiritiladi.',
      responsibilities: ['Darslarni yuqori sifatda o‘tish', 'O‘quvchilar natijasini tahlil qilish'],
      requirements: ['Oliy pedagogik ma’lumot yoki xalqaro til sertifikati', 'Bolalar va yoshlar bilan ishlash mahorati'],
    },
    {
      category: 'Texnik xizmat va ustachilik',
      titles: ['Konditsioner va Sovutish Tizimlari Ustasi', 'Avtomobil Diagnostika va Motor Ustasi', 'Maishiy Texnika Ta’mirlash Muhandisi', 'Mebel Yig‘ish va O‘rnatish Ustasi', 'Kamera va Xavfsizlik Tizimlari Montajchisi'],
      targetGender: 'male',
      salaryMinUzs: 7000000,
      salaryMaxUzs: 17000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Texnik diagnostika', 'Elektr sxemalar', 'Montaj asboblari', 'Sifat kafolati'],
      description: 'Texnik jihozlar, avtomobillar va muhandislik tarmoqlarini diagnostika qilish, o‘rnatish hamda ta’mirlash.',
      howToWork: 'Buyurtmalar mobil ilova yoki dispetcher orqali qabul qilinadi. Usta kerakli ehtiyot qismlar va diagnostika uskunasi bilan mijoz manziliga yoki ustaxonaga borib nosozlikni aniqlaydi va ta’mirlab, kafolat talonini rasmiylashtiradi.',
      responsibilities: ['Nosozliklarni tez va sifatli bartaraf etish', 'Asbob-uskunalarni soz holatda saqlash'],
      requirements: ['Texnik ustachilik tajribasi', 'Halollik va mijozlar bilan xushmuomalalik'],
    },
    {
      category: 'Masofaviy va onlayn ishlar',
      titles: ['Onlayn Mijozlarni Qo‘llab-Quvvatlash Mutaxassisi', 'Masofaviy Kontent va Kopirayter Muharrir', 'Xalqaro Dispetcher (Remote)', 'Onlayn Sotuv Operatori (Uydan Ishlash)', 'Ma’lumotlarni Kiritish va Tahlil Mutaxassisi'],
      targetGender: 'any',
      salaryMinUzs: 5500000,
      salaryMaxUzs: 15000000,
      workMode: 'remote',
      empType: 'full-time',
      exp: 'no-experience',
      skills: ['Tez yozish', 'Masofaviy muloqot', 'Google Workspace', 'Zoom / Slack'],
      description: 'Uydan chiqmasdan kompyuter va internet orqali mijozlar murojaatlarini qayta ishlash hamda onlayn vazifalarni bajarish.',
      howToWork: 'Ish to‘liq uydan (masofaviy) bajariladi. Ish boshlanishidan oldin 3 kunlik bepul onlayn o‘quv kursi o‘tkaziladi. Kun davomida korporativ platformaga kirib, kelgan xabarlar, jadvallar yoki buyurtmalar qayta ishlanadi.',
      responsibilities: ['Onlayn murojaatlarga o‘z vaqtida javob berish', 'Kunlik vazifalarni tizimda yakunlash'],
      requirements: ['Shaxsiy kompyuter/noutbuk va barqaror internet', 'Mas’uliyat va intizom'],
    },
    {
      category: 'Ombor va yetkazib berish',
      titles: ['Ombor Mudiri va Hisobchi', 'Buyurtmalarni Yig‘uvchi va Qadoqlovchi (Komplektovshik)', 'Avtokara (Pogruzchik) Haydovchisi', 'Tezkor Kuryer-Yetkazib Beruvchi', 'Ombor Qabul Qilish Nazoratchisi'],
      targetGender: 'male',
      salaryMinUzs: 5500000,
      salaryMaxUzs: 12500000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'no-experience',
      skills: ['Ombor hisobi', 'Shtrix-kod skaneri (TSD)', 'Jismoniy chaqqonlik', 'Tartiblilik'],
      description: 'Logistika omborida tovarlarni qabul qilish, shtrix-kod orqali saralash, qadoqlash va buyurtmalarni jo‘natishga tayyorlash.',
      howToWork: 'Ombor xodimi maxsus terminal (skaner) yordamida kelgan yuklarni sanab qabul qiladi, stellajlarga joylashtiradi va onlayn buyurtmalar ro‘yxati bo‘yicha tovarlarni yig‘ib qadoqlash bo‘limiga topshiradi.',
      responsibilities: ['Tovarlarni aniq sanash va joylashtirish', 'Ombor tozaligi va tartibini saqlash'],
      requirements: ['Chaqqonlik va diqqatlilik', 'Jamoa bilan ishlash'],
    },
    {
      category: 'Tozalash va uy xizmatlari',
      titles: ['Ofis va Biznes Markaz Tozalik Xodimasi', 'Xonadon va Kotyejlarni Professional Tozalash Mutaxassisi', 'Bolalar Enagasi va Uy Yordamchisi', 'Kimyoviy Tozalash (Ximchistka) Mutaxassisi', 'Bog‘bon va Hudud Obodonlashtirish Xodimi'],
      targetGender: 'female',
      salaryMinUzs: 4500000,
      salaryMaxUzs: 9500000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'no-experience',
      skills: ['Professional klining vositalari', 'Ozodalik', 'Mas’uliyat', 'Tartiblilik'],
      description: 'Zamonaviy ofislar, tibbiyot markazlari va xonadonlarda tozalik hamda tartibni professional darajada ta’minlash.',
      howToWork: 'Barcha yuvish vositalari va zamonaviy tozalash jihozlari ish beruvchi tomonidan taqdim etiladi. Belgilangan grafik bo‘yicha xonalar, oynalar va jihozlar tozalanib, smena boshlig‘iga topshiriladi.',
      responsibilities: ['Biriktirilgan hududni toza saqlash', 'Jihozlardan ehtiyotkorona foydalanish'],
      requirements: ['Tozalik va tartibni sevish', 'Halollik va intizom'],
    },
    {
      category: 'Qishloq xo‘jaligi',
      titles: ['Bosh Agronom va O‘simliklarni Himoya Qilish Mutaxassisi', 'Zamonaviy Issiqxona (Gidroponika) Texnologi', 'Tomchilatib Sug‘orish Muhandisi', 'Veterinar Shifokor va Chorvachilik Mutaxassisi', 'Meva-Sabzavot Saralash va Eksport Nazoratchisi'],
      targetGender: 'any',
      salaryMinUzs: 6000000,
      salaryMaxUzs: 16000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Agronomiya', 'Issiqxona nazorati', 'Eksport standartlari', 'Agrotexnika'],
      description: 'Agroklaster, bog‘dorchilik va zamonaviy issiqxona majmualarida hosildorlikni oshirish hamda eksport sifatini ta’minlash.',
      howToWork: 'Kunlik ish issiqxona yoki dala maydonlarida namlik, harorat va o‘g‘itlash me’yorlarini tekshirishdan boshlanadi. Mavsumiy agrotexnik tadbirlar ishchilar guruhi bilan birgalikda tashkil etiladi.',
      responsibilities: ['Ekinlar rivojlanishini nazorat qilish', 'Hosildorlik va sifatni ta’minlash'],
      requirements: ['Qishloq xo‘jaligi bo‘yicha bilim yoki tajriba', 'Dala va issiqxona sharoitida ishlash'],
    },
    {
      category: 'Tajribasizlar uchun ishlar',
      titles: ['Boshlang‘ich Sotuvchi-Konsultant (O‘rgatamiz)', 'Call-Markaz Stajyor Operatori', 'Qadoqlash va Saralash Yordamchisi', 'Kafe va Fast-Fud Xizmat Ko‘rsatish Xodimi', 'Ofis Kichik Yordamchisi (Stajirovka)'],
      targetGender: 'any',
      salaryMinUzs: 4500000,
      salaryMaxUzs: 8500000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'no-experience',
      skills: ['Tez o‘rganuvchanlik', 'Xushmuomalalik', 'Intizom', 'Jamoada ishlash'],
      description: 'Avval ishlamagan yoshlar va talabalar uchun ish jarayonida bepul o‘rgatiladigan rasmiy vakansiyalar.',
      howToWork: 'Tajriba talab qilinmaydi! Ishga kirgan birinchi haftada tajribali ustoz (mentor) biriktiriladi va ishda nima qilish kerakligi qadamma-qadam o‘rgatiladi. O‘quv davrida ham oylik maosh hisoblanadi.',
      responsibilities: ['Ustoz ko‘rsatmalarini o‘zlashtirish', 'Mijozlar va jamoa bilan xushmuomala bo‘lish'],
      requirements: ['Ishlash va o‘rganishga kuchli ishtiyoq', 'Vaqtida ishga kelish'],
    },
    {
      category: 'Dizayn va ijod',
      titles: ['UI/UX Veb va Mobil Ilovalar Dizayneri', 'Grafik Dizayner va Brending Mutaxassisi', 'Video Montajchi (Reels / YouTube / Motion)', '3D Interyer Vizualizator (3ds Max)', 'SMM Vizual Kontent Kreatori'],
      targetGender: 'any',
      salaryMinUzs: 7000000,
      salaryMaxUzs: 19000000,
      workMode: 'hybrid',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Figma', 'Adobe Photoshop / Illustrator', 'Premiere Pro', 'Tipografika'],
      description: 'Raqamli mahsulotlar, reklama bannerlari, ijtimoiy tarmoq videolari va zamonaviy interfeys dizaynlarini yaratish.',
      howToWork: 'Art-direktor yoki marketologdan texnik topshiriq (TZ) olinadi. Figma yoki Adobe dasturlarida dastlabki maket tayyorlanib, tasdiqlangach yakuniy dizayn fayllari topshiriladi.',
      responsibilities: ['Zamonaviy va chiroyli dizaynlar yaratish', 'Muddatlarga amal qilish'],
      requirements: ['Portfolio mavjudligi', 'Dizayn dasturlarini mukammal bilish'],
    },
    {
      category: 'Buxgalteriya va moliya',
      titles: ['Bosh Buxgalter (1C 8.3 va Soliq)', 'Hisobchi-Kassir va E-Faktura Operatori', 'Moliyaviy Tahlilchi va Byudjet Mutaxassisi', 'Bank Kredit va Mijozlar Maslahatchisi', 'Ombor va Ishlab Chiqarish Buxgalteri'],
      targetGender: 'female',
      salaryMinUzs: 7000000,
      salaryMaxUzs: 21000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['1C Buxgalteriya 8.3', 'Didox / E-ijara', 'Soliq hisobotlari', 'Excel (Jadval tahlili)'],
      description: 'Korxona buxgalteriya hisobini yuritish, elektron hisobvaraq-fakturalarni jo‘natish, oylik maosh va soliq hisobotlarini topshirish.',
      howToWork: '1C 8.3 bazasida kunlik bank ko‘chirmalari, kirim-chiqim hujjatlari va Didox orqali shartnomalar kiritiladi. Har oy yakunida xodimlar ish haqi hisoblanib, my.soliq.uz orqali hisobotlar yuboriladi.',
      responsibilities: ['Birlamchi hujjatlarni yuritish', 'Soliq va moliya hisobotlarini o‘z vaqtida topshirish'],
      requirements: ['1C va soliq qonunchiligini bilish', 'Raqamlar bilan ishlashda yuqori aniqlik'],
    },
    {
      category: 'Go‘zallik va shaxsiy xizmatlar',
      titles: ['Ayollar Go‘zallik Saloni Stilist-Vizajisti', 'Malakali Kosmetolog-Estetist', 'Erkaklar Sartaroshi (Barber)', 'Tirnoq Servisi Ustasi (Manikyur/Pedikyur)', 'Fitnes va Sog‘lomlashtirish Murabbiyi'],
      targetGender: 'female',
      salaryMinUzs: 5500000,
      salaryMaxUzs: 14000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'junior',
      skills: ['Kosmetologiya', 'Gigiyena va sterillik', 'Mijozlar bilan ishlash', 'Zamonaviy uslublar'],
      description: 'Zamonaviy go‘zallik va sog‘lomlashtirish markazida mijozlarga yuqori sifatli shaxsiy parvarish xizmatlarini ko‘rsatish.',
      howToWork: 'Mijozlar oldindan belgilangan navbat (yozuv) asosida qabul qilinadi. Ish joyi va asboblar har bir mijozdan oldin sterilizatsiya qilinadi va mijoz xohishiga ko‘ra xizmat ko‘rsatiladi.',
      responsibilities: ['Sifatli xizmat ko‘rsatish', 'Tozalik va sterillik qoidalariga amal qilish'],
      requirements: ['Sertifikat va amaliy mahorat', 'Xushmuomalalik'],
    },
    {
      category: 'Huquq va yuridik xizmatlar',
      titles: ['Korporativ Huquqshunos (Yurist)', 'Shartnomalar va Xalqaro Savdo Yuristi', 'Kadrlar va Mehnat Huquqi Maslahatchisi', 'Notarius Yordamchisi va Hujjatshunos', 'Komplayens va Huquqiy Ekspertiza Mutaxassisi'],
      targetGender: 'any',
      salaryMinUzs: 8000000,
      salaryMaxUzs: 22000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'mid',
      skills: ['Fuqarolik va mehnat kodeksi', 'Shartnomalar ekspertizasi', 'Lex.uz', 'Huquqiy tahlil'],
      description: 'Kompaniya faoliyatini huquqiy jihatdan himoya qilish, shartnomalarni ekspertizadan o‘tkazish va davlat organlari bilan ishlash.',
      howToWork: 'Tuzilayotgan xo‘jalik va mehnat shartnomalarini qonunchilikka mosligini tekshirish, huquqiy xulosalar tayyorlash hamda korxona manfaatlarini himoya qilish.',
      responsibilities: ['Shartnomalarni huquqiy ko‘rikdan o‘tkazish', 'Ichki buyruq va nizomlarni ishlab chiqish'],
      requirements: ['Oliy yuridik ma’lumot', 'O‘zbekiston qonunchiligini chuqur bilish'],
    },
    {
      category: 'Boshqa kasblar',
      titles: ['Xavfsizlik Xizmati va Qo‘riqlash Xodimi', 'Tadbirlar va Ko‘rgazmalar Tashkilotchisi', 'Xalqaro Tarjimon (Ingliz / Rus / Xitoy)', 'Fotograf va Studiya Operatori', 'Xo‘jalik Ishlari Mudiri (Zavxoz)'],
      targetGender: 'any',
      salaryMinUzs: 5000000,
      salaryMaxUzs: 13000000,
      workMode: 'onsite',
      empType: 'full-time',
      exp: 'junior',
      skills: ['Mas’uliyatlilik', 'Tezkorlik', 'Tashkilotchilik', 'Muloqot'],
      description: 'Korxona va tashkilotlarning maxsus yo‘nalishlari bo‘yicha barqaror va rasmiy ish o‘rinlari.',
      howToWork: 'Ishga qabul qilingan kundan boshlab aniq lavozim yo‘riqnomasi beriladi. Kunlik vazifalar bo‘lim rahbari tomonidan taqsimlanadi va barcha zarur mehnat vositalari bilan ta’minlanadi.',
      responsibilities: ['Lavozim yo‘riqnomasidagi vazifalarni bajarish', 'Ichki tartib-qoidalarga rioya qilish'],
      requirements: ['Mas’uliyat va halollik', 'Jamoada ishlash qobiliyati'],
    },
  ];

  const jobsList: JobRecord[] = [];
  let jobCounter = 1001;

  const streetLandmarks = [
    'Amir Temur shoh ko‘chasi, 42-uy (Biznes markaz 3-qavat)',
    'Mustaqillik ko‘chasi, 18-uy (Metro yaqinida)',
    'Yunusobod tumani, 12-mavze, 7A-bino',
    'Chilonzor tumani, Qatortol ko‘chasi, 25-uy (Mo‘ljal: Savdo majmuasi)',
    'Mirobod tumani, Nukus ko‘chasi, 64-uy',
    'Shota Rustaveli ko‘chasi, 88-uy (Bosh ofis)',
    'Yakkasaroy tumani, Bobur ko‘chasi, 34-uy',
    'Sergeli sanoat zonasi, Yangi Hayot yo‘li, 11-sex',
  ];

  // Create 26 jobs per each of the 20 sectors = 520 total real structured jobs
  for (let sIdx = 0; sIdx < sectorTemplates.length; sIdx++) {
    const tpl = sectorTemplates[sIdx];
    for (let k = 0; k < 26; k++) {
      const comp = companiesList[(sIdx * 5 + k) % companiesList.length];
      const titleBase = tpl.titles[k % tpl.titles.length];
      const genderVariant: TargetGender =
        k % 4 === 0 ? 'male' : k % 4 === 1 ? 'female' : tpl.targetGender;

      const salaryPeriod: 'monthly' | 'daily' | 'hourly' =
        k % 3 === 1 ? 'daily' : k % 3 === 2 ? 'hourly' : 'monthly';

      const isForeign = comp.country !== 'O‘zbekiston';
      const currency = isForeign ? (comp.country === 'Germaniya' ? 'EUR' : 'USD') : 'UZS';

      let minSal = 0;
      let maxSal = 0;

      if (salaryPeriod === 'monthly') {
        minSal = isForeign
          ? 2200 + (k % 6) * 300
          : tpl.salaryMinUzs + (k % 5) * 1000000;
        maxSal = isForeign
          ? minSal + 1200
          : tpl.salaryMaxUzs + (k % 4) * 1500000;
      } else if (salaryPeriod === 'daily') {
        minSal = isForeign
          ? 110 + (k % 5) * 20
          : 180000 + (k % 6) * 40000;
        maxSal = isForeign
          ? minSal + 60
          : minSal + 120000;
      } else {
        // hourly
        minSal = isForeign
          ? 16 + (k % 5) * 4
          : 30000 + (k % 5) * 10000;
        maxSal = isForeign
          ? minSal + 12
          : minSal + 25000;
      }

      const exactAddress = `${comp.city} shahri, ${streetLandmarks[(sIdx + k) % streetLandmarks.length]}`;

      const isHazardous =
        tpl.category === 'Qurilish va ta’mirlash' ||
        tpl.category === 'Zavod va ishlab chiqarish' ||
        tpl.category === 'Haydovchilik va logistika';

      const minAge = isHazardous ? 18 : k % 6 === 0 ? 16 : 18;

      const isDisabilityFriendly =
        tpl.workMode === 'remote' ||
        tpl.category === 'IT va dasturlash' ||
        tpl.category === 'Masofaviy va onlayn ishlar' ||
        tpl.category === 'Ofis va ma’muriy ishlar' ||
        tpl.category === 'Dizayn va ijod' ||
        tpl.category === 'Buxgalteriya va moliya' ||
        tpl.category === 'Ta’lim va o‘qituvchilik' ||
        k % 3 === 0;

      const accommodations: DisabilityAccommodationKey[] = [];
      if (isDisabilityFriendly) {
        accommodations.push('disability-friendly');
        if (tpl.workMode === 'remote' || k % 6 === 0) accommodations.push('remote-home');
        if (k % 2 === 0) accommodations.push('flexible-schedule');
        if (k % 5 === 0) accommodations.push('part-time-option');
        if (k % 3 === 0) {
          accommodations.push('wheelchair-access', 'ramp-elevator', 'adapted-workstation');
        }
        if (k % 4 === 0) {
          accommodations.push('hearing-support', 'vision-assistive-tech', 'mobility-support');
        }
      }

      jobsList.push({
        id: `job_${jobCounter}`,
        companyId: comp.id,
        companyName: comp.name,
        companyVerified: comp.verified,
        contactPhone: comp.contactPhone,
        telegramHandle: comp.telegramHandle,
        title: `${titleBase} (${comp.city})`,
        category: tpl.category,
        country: comp.country,
        city: comp.city,
        exactAddress,
        salaryMin: k % 9 === 0 ? undefined : minSal,
        salaryMax: k % 9 === 0 ? undefined : maxSal,
        currency,
        salaryPeriod,
        isNegotiable: k % 9 === 0,
        employmentType: k % 5 === 0 ? 'part-time' : k % 11 === 0 ? 'internship' : tpl.empType,
        workMode: k % 6 === 0 ? 'remote' : tpl.workMode,
        experienceLevel: k % 4 === 0 ? 'no-experience' : tpl.exp,
        targetGender: genderVariant,
        minAge,
        isHazardousForMinors: isHazardous,
        disabilityFriendly: isDisabilityFriendly,
        accommodations,
        workSchedule: k % 5 === 0 ? 'Moslashuvchan grafik (Yarim stavka)' : 'Dushanba–Juma, 09:00–18:00',
        workLanguage: isForeign ? 'Ingliz, Rus, O‘zbek' : 'O‘zbek, Rus',
        timezone: isForeign ? 'UTC+1 / UTC+4' : 'UTC+5 (O‘zbekiston)',
        visaSupport: isForeign ? 'sponsored' : 'not-required',
        description: `${comp.name} korxonasi "${titleBase}" lavozimiga tanlov e’lon qiladi. ${tpl.description}`,
        howToWork: tpl.howToWork,
        responsibilities: tpl.responsibilities,
        requirements: tpl.requirements,
        skills: tpl.skills,
        featured: k < 2 && sIdx < 6,
        status: 'approved',
        viewsCount: 85 + ((jobCounter * 17) % 640),
        createdAt: `2026-10-${String(1 + (jobCounter % 9)).padStart(2, '0')}`,
        deadline: '2026-12-15',
        originalLang: 'uz',
        truthWindow: {
          monthlySalaryNetOrGross: k % 4 === 0 ? 'net' : k % 4 === 1 ? 'gross' : 'negotiable',
          salaryDetailsNote:
            k % 4 === 0
              ? 'Ko‘rsatilgan summa soliqlar (Daromad solig‘i va INPS) chegirilgandan keyin qo‘lga tegadigan toza summa.'
              : k % 4 === 1
              ? 'Soliqlar ushlab qolinishidan oldingi yalpi oylik maosh (brutto).'
              : 'Sinov muddati va nomzodning amaliy ko‘nikma darajasiga qarab o‘zaro kelishiladi.',
          salaryStatus: comp.verified
            ? k % 3 === 0
              ? 'third-party-verified'
              : 'employer-confirmed'
            : 'unverified',
          workScheduleNote: k % 5 === 0 ? 'Moslashuvchan grafik (Yarim stavka)' : 'Dushanba–Juma, 09:00–18:00',
          shiftsAndBreaks:
            k % 5 === 0
              ? 'Erkin smena, 4–6 soatlik kunlik bandlik, 30 daqiqa tanaffus'
              : '1 smena, 13:00 dan 14:00 gacha tushlik va dam olish tanaffusi',
          daysOff: k % 5 === 0 ? 'Haftasiga 2-3 kun (O‘zaro kelishilgan holda)' : 'Shanba va Yakshanba',
          scheduleStatus: comp.verified ? 'employer-confirmed' : 'unverified',
          mainDuties: tpl.responsibilities.slice(0, 3),
          requirements: tpl.requirements.slice(0, 3),
          tasksStatus: comp.verified ? 'employer-confirmed' : 'unverified',
          workplaceType: tpl.workMode === 'remote' ? 'remote' : tpl.workMode === 'hybrid' ? 'hybrid' : 'onsite',
          workplaceStatus: comp.verified ? 'employer-confirmed' : 'unverified',
          transportProvided: k % 3 === 0,
          mealsProvided: k % 2 === 0,
          housingProvided: isForeign || k % 5 === 0,
          otherPerks: [
            k % 3 === 0 ? 'Xizmat transporti' : '',
            k % 2 === 0 ? 'Issiq tushlik' : '',
            isForeign || k % 5 === 0 ? 'Turar joy va yotoqxona' : '',
            'Tibbiy sug‘urta va korporativ treninglar',
          ]
            .filter(Boolean)
            .join(', '),
          perksStatus: comp.verified ? (k % 2 === 0 ? 'employer-confirmed' : 'third-party-verified') : 'unverified',
          probationPeriod: k % 3 === 0 ? '1 oy (to‘liq maosh bilan)' : k % 3 === 1 ? '3 oy' : 'Sinov muddati yo‘q',
          overtimeTerms: 'Qo‘shimcha ish soatlari Mehnat kodeksiga binoan 1.5x tarifda to‘lanadi',
          disabilityAccessibility: isDisabilityFriendly,
          workplaceAmenities: [
            'Zamonaviy ofis/ish joyi',
            'Konditsioner va shamollatish',
            isDisabilityFriendly ? 'Pandus va qulay kirish yo‘li' : 'Lift',
            'Dam olish xonasi va oshxona',
          ],
          amenitiesStatus: comp.verified ? 'employer-confirmed' : 'unverified',
          lastEmployerConfirmationDate: `2026-10-0${1 + (k % 8)}`,
          lastCompanyAuditDate: comp.verified ? '2026-09-28' : 'Hali tekshirilmagan',
          isJobClosedOrExpired: false,
        },
      });

      jobCounter++;
    }
  }

  return jobsList;
}

export const initialJobs: JobRecord[] = buildJobsCatalog(initialCompanies);

export const initialApplications: ApplicationRecord[] = [
  {
    id: 'app_501',
    jobId: 'job_1001',
    jobTitle: initialJobs[0].title,
    companyId: initialJobs[0].companyId,
    companyName: initialJobs[0].companyName,
    seekerId: 'usr_seeker_1',
    seekerName: 'Jasur Karimov',
    seekerEmail: 'jasur.karimov@example.uz',
    seekerPhone: '+998 90 123 45 67',
    seekerTitle: 'Senior Full-Stack TypeScript Dasturchi',
    resumeSummary: '6 yildan ortiq React, TypeScript va yuqori yuklamali moliyaviy tizimlar tajribasi. TATU bitiruvchisi.',
    resumeFileName: 'Jasur_Karimov_CV_2026.pdf',
    coverMessage: 'Assalomu alaykum! Jamoangizda ishlash va tajribamni qo‘llashdan mamnun bo‘laman.',
    status: 'interview',
    interviewNote: 'Texnik suhbatga taklif etamiz: Payshanba soat 15:00 da.',
    createdAt: '2026-10-05T11:20:00Z',
    updatedAt: '2026-10-08T16:40:00Z',
  },
];

export const initialChatMessages: ChatMessageRecord[] = [
  {
    id: 'msg_1',
    jobId: 'job_1001',
    jobTitle: initialJobs[0].title,
    seekerId: 'usr_seeker_1',
    seekerName: 'Jasur Karimov',
    employerId: 'usr_employer_1',
    companyName: initialJobs[0].companyName,
    senderId: 'usr_employer_1',
    senderName: 'Dilnoza Rahimova (HR)',
    senderRole: 'employer',
    text: 'Assalomu alaykum Jasur! Rezyumengiz bizga ma’qul keldi. Ish tartibi va suhbat vaqti bo‘yicha shu yerda yozishishimiz mumkin.',
    createdAt: '2026-10-08T16:45:00Z',
  },
  {
    id: 'msg_2',
    jobId: 'job_1001',
    jobTitle: initialJobs[0].title,
    seekerId: 'usr_seeker_1',
    seekerName: 'Jasur Karimov',
    employerId: 'usr_employer_1',
    companyName: initialJobs[0].companyName,
    senderId: 'usr_seeker_1',
    senderName: 'Jasur Karimov',
    senderRole: 'seeker',
    text: 'Va alaykum assalom! Taklif uchun rahmat, Payshanba soat 15:00 menga juda qulay.',
    createdAt: '2026-10-08T16:50:00Z',
  },
];

export const initialNotifications: NotificationRecord[] = [
  {
    id: 'notif_1',
    userId: 'usr_seeker_1',
    title: 'Suhbatga taklifnoma va yangi xabar',
    message: 'SilkRoad FinTech & Cloud kompaniyasi sizga suhbat xabarini yubordi.',
    read: false,
    createdAt: '2026-10-08T16:40:00Z',
  },
];

export const initialReports: ReportRecord[] = [
  {
    id: 'rep_1',
    jobId: 'job_1004',
    jobTitle: initialJobs[3].title,
    companyId: initialJobs[3].companyId,
    companyName: initialJobs[3].companyName,
    reporterId: 'usr_seeker_1',
    reporterEmail: 'jasur.karimov@example.uz',
    reason: 'misleading-salary',
    details: 'E’lon shartlari va kompaniya guvohnomasini qayta tekshirish tavsiya etiladi.',
    evidenceNote: 'Suhbat vaqtida e’londagi oylik maosh smenaga qarab o‘zgarishi aytildi.',
    status: 'awaiting-company',
    createdAt: '2026-10-09T08:15:00Z',
  },
];

export const initialCompanyRatings: CompanyRatingRecord[] = [
  {
    id: 'rat_1',
    companyId: initialCompanies[0].id,
    userId: 'usr_seeker_1',
    userName: 'Jasur Karimov',
    stars: 8,
    comment: 'Suhbat jarayoni shaffof o‘tdi, mehnat shartnomasi va ofisda pandus/lift qulayliklari mavjud.',
    verifiedInteraction: true,
    createdAt: '2026-10-09T12:00:00Z',
    updatedAt: '2026-10-09T12:00:00Z',
  },
];

export const initialPlans: SubscriptionPlanConfig[] = [
  {
    id: 'free',
    nameUz: 'Free (Boshlang‘ich)',
    nameRu: 'Free (Базовый)',
    nameEn: 'Free Standard',
    targetAudienceUz: 'Oddiy vakansiya qidirish, profil va arizalar uchun',
    targetAudienceRu: 'Для базового поиска работы и резюме',
    targetAudienceEn: 'For standard job search and applications',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    priceMonthlyUzs: 0,
    jobPostLimit: 2,
    resumeDownloadLimit: 5,
    featuredIncluded: false,
  },
  {
    id: 'pro-seeker',
    nameUz: 'Pro Obunachi (Ish qidiruvchi)',
    nameRu: 'Pro Соискатель',
    nameEn: 'Pro Job Seeker',
    targetAudienceUz: 'Ish beruvchi telefon raqami va Telegramini ochish + ustuvor profil',
    targetAudienceRu: 'Открытие прямых номеров телефонов и Telegram работодателей',
    targetAudienceEn: 'Unlocks direct employer phone numbers & Telegram contacts',
    priceMonthlyUsd: 5,
    priceYearlyUsd: 55,
    priceMonthlyUzs: 64000,
    jobPostLimit: 0,
    resumeDownloadLimit: 150,
    featuredIncluded: false,
  },
  {
    id: 'employer-pro',
    nameUz: 'Employer Pro (Ish beruvchi)',
    nameRu: 'Employer Pro (Работодатель)',
    nameEn: 'Employer Pro',
    targetAudienceUz: 'Faol yollovchi kompaniyalar, kengaytirilgan statistika va suhbatlar',
    targetAudienceRu: 'Для компаний: больше вакансий, статистика и прямые чаты',
    targetAudienceEn: 'For scaling employers: priority listings, analytics & direct chat',
    priceMonthlyUsd: 44,
    priceYearlyUsd: 440,
    priceMonthlyUzs: 560000,
    jobPostLimit: 50,
    resumeDownloadLimit: 1000,
    featuredIncluded: true,
  },
  {
    id: 'featured-job',
    nameUz: 'Featured Job (Alohida e’lon)',
    nameRu: 'Featured Job (Премиум вакансия)',
    nameEn: 'Featured Job Slot',
    targetAudienceUz: 'Bitta muhim vakansiyani eng yuqoriga chiqarish uchun',
    targetAudienceRu: 'Для выделения одной срочной вакансии',
    targetAudienceEn: 'For highlighting a single priority role',
    priceMonthlyUsd: 15,
    priceYearlyUsd: 150,
    priceMonthlyUzs: 190000,
    jobPostLimit: 1,
    resumeDownloadLimit: 50,
    featuredIncluded: true,
  },
];

export const initialAuditLogs: AuditLogRecord[] = [
  {
    id: 'aud_1',
    actorId: 'usr_admin_1',
    actorEmail: 'davlatrakhmatov.2013@gmail.com',
    actorRole: 'admin',
    action: 'PLATFORM_INITIALIZED',
    targetId: 'system',
    details: '112 ta kompaniya va 520 ta tasdiqlangan vakansiya katalogi yuklandi.',
    createdAt: '2026-10-01T10:00:00Z',
  },
];

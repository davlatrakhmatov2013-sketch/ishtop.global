import { Language } from '../types';

export interface SectorItem {
  id: string;
  number: number;
  label: Record<Language, string>;
  keywords: string[];
}

export const JOB_SECTORS: SectorItem[] = [
  {
    id: 'sec_it',
    number: 1,
    label: {
      uz: 'IT va dasturlash',
      ru: 'IT и программирование',
      en: 'IT & Software Development',
    },
    keywords: ['it va dasturlash', 'frontend', 'backend', 'typescript', 'react', 'kiberxavfsizlik', 'appsec', 'dasturchi', 'qa'],
  },
  {
    id: 'sec_construction',
    number: 2,
    label: {
      uz: 'Qurilish va ta’mirlash',
      ru: 'Строительство и ремонт',
      en: 'Construction & Renovation',
    },
    keywords: ['qurilish', 'ta’mirlash', 'arxitektor', 'prorab', 'строительство'],
  },
  {
    id: 'sec_logistics',
    number: 3,
    label: {
      uz: 'Haydovchilik va logistika',
      ru: 'Вождение и логистика',
      en: 'Driving & Logistics',
    },
    keywords: ['logistika', 'logistika va tashqi savdo', 'supply chain', 'dispatch', 'haydovchi', 'transport', 'freight'],
  },
  {
    id: 'sec_medical',
    number: 4,
    label: {
      uz: 'Tibbiyot',
      ru: 'Медицина и фармацевтика',
      en: 'Healthcare & Medicine',
    },
    keywords: ['tibbiyot', 'shifokor', 'hamshira', 'farmatsevt', 'медицина'],
  },
  {
    id: 'sec_hospitality',
    number: 5,
    label: {
      uz: 'Restoran va mehmonxona',
      ru: 'Рестораны и гостиницы (HoReCa)',
      en: 'Restaurants & Hospitality',
    },
    keywords: ['restoran', 'mehmonxona', 'oshpaz', 'barista', 'horeca'],
  },
  {
    id: 'sec_manufacturing',
    number: 6,
    label: {
      uz: 'Zavod va ishlab chiqarish',
      ru: 'Заводы и производство',
      en: 'Factory & Manufacturing',
    },
    keywords: ['muhandislik va ishlab chiqarish', 'zavod', 'ishlab chiqarish', 'mechatronic', 'automation', 'plc'],
  },
  {
    id: 'sec_sales',
    number: 7,
    label: {
      uz: 'Savdo va marketing',
      ru: 'Продажи и маркетинг',
      en: 'Sales & Marketing',
    },
    keywords: ['sotuv va marketing', 'savdo', 'marketing', 'eksport sotuvlar', 'sales', 'b2b'],
  },
  {
    id: 'sec_office',
    number: 8,
    label: {
      uz: 'Ofis va ma’muriy ishlar',
      ru: 'Офис и административная работа',
      en: 'Office & Administration',
    },
    keywords: ['ofis', 'ma’muriy', 'kotibiyat', 'admin', 'office manager', 'hr'],
  },
  {
    id: 'sec_education',
    number: 9,
    label: {
      uz: 'Ta’lim va o‘qituvchilik',
      ru: 'Образование и преподавание',
      en: 'Education & Teaching',
    },
    keywords: ['ta’lim', 'o‘qituvchi', 'ustoz', 'mentor', 'ielts', 'образование'],
  },
  {
    id: 'sec_maintenance',
    number: 10,
    label: {
      uz: 'Texnik xizmat va ustachilik',
      ru: 'Техническое обслуживание и сервис',
      en: 'Technical Service & Maintenance',
    },
    keywords: ['texnik xizmat', 'ustachilik', 'technician', 'maintenance', 'elektrik', 'mexanik'],
  },
  {
    id: 'sec_remote',
    number: 11,
    label: {
      uz: 'Masofaviy va onlayn ishlar',
      ru: 'Удаленная и онлайн-работа',
      en: 'Remote & Online Work',
    },
    keywords: ['remote', 'masofaviy', 'onlayn'],
  },
  {
    id: 'sec_warehouse',
    number: 12,
    label: {
      uz: 'Ombor va yetkazib berish',
      ru: 'Склад и доставка',
      en: 'Warehouse & Delivery',
    },
    keywords: ['ombor', 'warehouse', 'yetkazib berish', 'kuryer', 'sklad'],
  },
  {
    id: 'sec_cleaning',
    number: 13,
    label: {
      uz: 'Tozalash va uy xizmatlari',
      ru: 'Клининг и домашний персонал',
      en: 'Cleaning & Home Services',
    },
    keywords: ['tozalash', 'uy xizmatlari', 'klining', 'cleaning'],
  },
  {
    id: 'sec_agriculture',
    number: 14,
    label: {
      uz: 'Qishloq xo‘jaligi',
      ru: 'Сельское хозяйство и агропром',
      en: 'Agriculture & Farming',
    },
    keywords: ['qishloq xo‘jaligi', 'agro', 'agronom', 'fermer'],
  },
  {
    id: 'sec_no_exp',
    number: 15,
    label: {
      uz: 'Tajribasizlar uchun ishlar',
      ru: 'Работа без опыта / Стажировка',
      en: 'Entry-Level & No Experience Jobs',
    },
    keywords: ['no-experience', 'tajribasiz', 'stajirovka', 'intern'],
  },
  {
    id: 'sec_design',
    number: 16,
    label: {
      uz: 'Dizayn va ijod',
      ru: 'Дизайн и творчество',
      en: 'Design & Creative Arts',
    },
    keywords: ['dizayn', 'ui/ux', 'grafik', 'video', 'ijod', 'design'],
  },
  {
    id: 'sec_finance',
    number: 17,
    label: {
      uz: 'Buxgalteriya va moliya',
      ru: 'Бухгалтерия и финансы',
      en: 'Accounting & Finance',
    },
    keywords: ['moliya va buxgalteriya', 'buxgalter', 'moliya', 'ifrs', 'mhxs', '1c', 'auditor'],
  },
  {
    id: 'sec_beauty',
    number: 18,
    label: {
      uz: 'Go‘zallik va shaxsiy xizmatlar',
      ru: 'Красота и личные услуги',
      en: 'Beauty & Personal Care',
    },
    keywords: ['go‘zallik', 'stilist', 'kosmetolog', 'salon', 'fitness'],
  },
  {
    id: 'sec_legal',
    number: 19,
    label: {
      uz: 'Huquq va yuridik xizmatlar',
      ru: 'Юриспруденция и право',
      en: 'Legal & Compliance Services',
    },
    keywords: ['huquq', 'yurist', 'advokat', 'legal', 'compliance', 'shartnoma'],
  },
  {
    id: 'sec_other',
    number: 20,
    label: {
      uz: 'Boshqa kasblar',
      ru: 'Другие профессии',
      en: 'Other Professions',
    },
    keywords: ['boshqa', 'other'],
  },
];

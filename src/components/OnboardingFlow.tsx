import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Compass,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CareerPreferences,
  Currency,
  EmploymentType,
  ExperienceLevel,
  Language,
  UserGender,
  WorkMode,
} from '../types';
import { translations } from '../i18n';
import { JOB_SECTORS } from '../data/sectors';

interface OnboardingFlowProps {
  lang: Language;
  initialPreferences?: CareerPreferences;
  availableCountries: string[];
  availableCities: string[];
  onChangeLang: (lang: Language) => void;
  onComplete: (prefs: CareerPreferences) => void;
  onSkipLater: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  lang,
  initialPreferences,
  availableCountries,
  availableCities,
  onChangeLang,
  onComplete,
  onSkipLater,
}) => {
  const t = translations[lang];

  const [step, setStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<UserGender | undefined>(
    initialPreferences?.gender || 'male'
  );
  const [age, setAge] = useState<string>(
    initialPreferences?.age ? String(initialPreferences.age) : '24'
  );
  const [disabilityFriendlyOnly, setDisabilityFriendlyOnly] = useState<boolean>(
    Boolean(initialPreferences?.disabilityFriendlyOnly)
  );
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    initialPreferences?.sectors || []
  );
  const [showUnselectedWarning, setShowUnselectedWarning] = useState(false);

  // Step 2 states
  const [country, setCountry] = useState<string>(initialPreferences?.country || 'all');
  const [city, setCity] = useState<string>(initialPreferences?.city || 'all');
  const [salaryMin, setSalaryMin] = useState<string>(
    initialPreferences?.salaryMin ? String(initialPreferences.salaryMin) : ''
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    initialPreferences?.salaryMax ? String(initialPreferences.salaryMax) : ''
  );
  const [currency, setCurrency] = useState<Currency>(initialPreferences?.currency || 'UZS');
  const [workMode, setWorkMode] = useState<'all' | WorkMode>(
    initialPreferences?.workMode || 'all'
  );
  const [employmentType, setEmploymentType] = useState<'all' | EmploymentType>(
    initialPreferences?.employmentType || 'all'
  );
  const [experienceLevel, setExperienceLevel] = useState<'all' | ExperienceLevel>(
    initialPreferences?.experienceLevel || 'all'
  );

  const toggleSector = (sectorId: string) => {
    setShowUnselectedWarning(false);
    setSelectedSectors((prev) =>
      prev.includes(sectorId) ? prev.filter((id) => id !== sectorId) : [...prev, sectorId]
    );
  };

  const handleSelectAllSectors = () => {
    setShowUnselectedWarning(false);
    if (selectedSectors.length === JOB_SECTORS.length) {
      setSelectedSectors([]);
    } else {
      setSelectedSectors(JOB_SECTORS.map((s) => s.id));
    }
  };

  const handleContinueStep1 = () => {
    if (selectedSectors.length === 0) {
      setShowUnselectedWarning(true);
      return;
    }
    setStep(2);
  };

  const handleViewAllWithoutSectorFilter = () => {
    const prefs: CareerPreferences = {
      gender,
      age: age ? Number(age) : undefined,
      disabilityFriendlyOnly,
      sectors: [],
      country: 'all',
      city: 'all',
      currency: 'UZS',
      workMode: 'all',
      employmentType: 'all',
      experienceLevel: 'all',
      completedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };
    onComplete(prefs);
  };

  const handleFinishStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: CareerPreferences = {
      gender,
      age: age ? Number(age) : undefined,
      disabilityFriendlyOnly,
      sectors: selectedSectors,
      country,
      city,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      currency,
      workMode,
      employmentType,
      experienceLevel,
      completedOnboarding: true,
      updatedAt: new Date().toISOString(),
    };
    onComplete(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">{t.onboardingKicker}</span>
            <span className="text-xs font-mono text-slate-500">
              ({step}/2)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher inside Onboarding */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
              {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onChangeLang(l)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase cursor-pointer transition-colors ${
                    lang === l
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onSkipLater}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              {t.btnChooseLater}
            </button>
          </div>
        </div>

        {/* STEP 1: 20 SECTORS SELECTION */}
        {step === 1 && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {t.onboardingTitle}
                </h1>
                <p className="text-sm text-slate-600">{t.onboardingSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllSectors}
                  className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {selectedSectors.length === JOB_SECTORS.length
                    ? t.btnClearSectors
                    : t.btnViewAllSectors}
                </button>
              </div>
            </div>

            {/* Gender, Age & Separate Optional Disability Inclusion Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {lang === 'uz'
                      ? 'Jinsingiz va yoshingiz:'
                      : lang === 'ru'
                      ? 'Ваш пол и возраст:'
                      : 'Your gender and age:'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'uz'
                      ? 'Mehnat qonunchiligi bo‘yicha yosh me’yori va mos ishlarni saralash uchun.'
                      : lang === 'ru'
                      ? 'Для учета возрастных норм трудового права и персонализации.'
                      : 'Used for legal minimum-age compliance and tailored matching.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                      gender === 'male'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'uz' ? 'Erkak' : lang === 'ru' ? 'Мужчина' : 'Male'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                      gender === 'female'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'uz' ? 'Ayol' : lang === 'ru' ? 'Женщина' : 'Female'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('prefer_not_to_say')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                      gender === 'prefer_not_to_say'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {lang === 'uz'
                      ? 'Ko‘rsatishni istamayman'
                      : lang === 'ru'
                      ? 'Не указывать'
                      : 'Prefer not to say'}
                  </button>
                  <div className="flex items-center gap-1.5 pl-1">
                    <label className="text-xs font-medium text-slate-700">Yosh:</label>
                    <input
                      type="number"
                      min={14}
                      max={85}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-16 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Separate Optional Disability Toggle (Never mixed with Gender, no medical diagnosis required) */}
              <div className="lg:col-span-5 p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={disabilityFriendlyOnly}
                    onChange={(e) => setDisabilityFriendlyOnly(e.target.checked)}
                    className="mt-0.5 rounded border-blue-400 text-blue-600"
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      ♿ Nogironligi bo‘lgan insonlar uchun mos ishlarni ko‘rsatish
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Ixtiyoriy tanlov (tibbiy hujjat talab qilinmaydi). Masofaviy, pandus/liftli va moslashtirilgan ishlarni saralaydi.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {showUnselectedWarning && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs font-medium text-amber-900">
                  {t.selectPromptWarning}
                </p>
                <button
                  type="button"
                  onClick={handleViewAllWithoutSectorFilter}
                  className="px-3.5 py-1.5 text-xs font-semibold text-amber-950 bg-amber-200/70 hover:bg-amber-200 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.btnSeeAllJobsWithoutSelection}
                </button>
              </div>
            )}

            {/* 20 Sector Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[54vh] overflow-y-auto pr-1">
              {JOB_SECTORS.map((sector) => {
                const isSelected = selectedSectors.includes(sector.id);
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => toggleSector(sector.id)}
                    className={`group flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span
                        className={`text-xs font-mono tabular-nums shrink-0 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {String(sector.number).padStart(2, '0')}.
                      </span>
                      <span className="text-xs sm:text-sm font-semibold truncate">
                        {sector.label[lang]}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white text-blue-600'
                          : 'border border-slate-300 bg-slate-50 group-hover:border-blue-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  {t.selectedSectorsCount}:{' '}
                  <strong className="font-mono text-slate-900 tabular-nums">
                    {selectedSectors.length}
                  </strong>{' '}
                  / 20
                </span>
                {selectedSectors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedSectors([])}
                    className="text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    {t.btnClearSectors}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleViewAllWithoutSectorFilter}
                  className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.btnSeeAllJobsWithoutSelection}
                </button>
                <button
                  type="button"
                  onClick={onSkipLater}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.btnChooseLater}
                </button>
                <button
                  type="button"
                  onClick={handleContinueStep1}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{t.btnContinue}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION, SALARY, WORK MODE, EMPLOYMENT TYPE & EXPERIENCE */}
        {step === 2 && (
          <form onSubmit={handleFinishStep2} className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                <SlidersHorizontal className="w-4 h-4" />
                <span>
                  {t.selectedSectorsCount}: {selectedSectors.length}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t.onboardingStep2Title}
              </h2>
              <p className="text-sm text-slate-600">{t.onboardingStep2Subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {lang === 'uz'
                    ? 'Qaysi mamlakatda ishlamoqchisiz?'
                    : lang === 'ru'
                    ? 'В какой стране хотите работать?'
                    : 'Preferred Country'}
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity('all');
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">{t.allCountries}</option>
                  {availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Janubiy Koreya">Janubiy Koreya</option>
                  <option value="Polsha">Polsha</option>
                  <option value="Turkiya">Turkiya</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {lang === 'uz'
                    ? 'Qaysi shaharni tanlaysiz?'
                    : lang === 'ru'
                    ? 'Какой город выбираете?'
                    : 'Preferred City'}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">{t.allCities}</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Buxoro">Buxoro</option>
                  <option value="Andijon">Andijon</option>
                  <option value="Namangan">Namangan</option>
                  <option value="Farg‘ona">Farg‘ona</option>
                </select>
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {lang === 'uz'
                    ? 'Ish shakli (Masofaviy / Ofis / Gibrid)'
                    : lang === 'ru'
                    ? 'Формат работы'
                    : 'Work Mode'}
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">{t.allModes}</option>
                  <option value="onsite">{t.modeOnsite}</option>
                  <option value="remote">{t.modeRemote}</option>
                  <option value="hybrid">{t.modeHybrid}</option>
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {lang === 'uz'
                    ? 'Bandlik turi (To‘liq / Yarim stavka)'
                    : lang === 'ru'
                    ? 'Тип занятости'
                    : 'Employment Type'}
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">{t.allTypes}</option>
                  <option value="full-time">{t.empFullTime}</option>
                  <option value="part-time">{t.empPartTime}</option>
                  <option value="contract">{t.empContract}</option>
                  <option value="temporary">{t.empTemporary}</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  {lang === 'uz'
                    ? 'Tajriba darajasi'
                    : lang === 'ru'
                    ? 'Уровень опыта'
                    : 'Experience Level'}
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">{t.allExperience}</option>
                  <option value="no-experience">{t.expNone}</option>
                  <option value="junior">{t.expJunior}</option>
                  <option value="mid">{t.expMid}</option>
                  <option value="senior">{t.expSenior}</option>
                </select>
              </div>

              {/* Currency & Salary Range */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.minSalary}
                  </label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.maxSalary}
                  </label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Max"
                    className="w-full px-2.5 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {t.currency}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-2 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
                  >
                    <option value="UZS">UZS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.btnBackToStep1}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onSkipLater}
                  className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg cursor-pointer"
                >
                  {t.btnChooseLater}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.btnFinishOnboarding}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

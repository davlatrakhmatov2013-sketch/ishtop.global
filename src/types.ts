export type Language = 'uz' | 'ru' | 'en';

export type UserRole = 'seeker' | 'employer' | 'admin';

export type UserGender = 'male' | 'female' | 'prefer_not_to_say';

export type TargetGender = 'any' | 'male' | 'female';

export type Currency = 'UZS' | 'USD' | 'EUR';

export type SalaryPeriod = 'monthly' | 'daily' | 'hourly';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';

export type WorkMode = 'onsite' | 'remote' | 'hybrid';

export type ExperienceLevel = 'no-experience' | 'junior' | 'mid' | 'senior';

export type VisaSupport = 'sponsored' | 'permit-required' | 'not-required' | 'remote-global';

export type ApplicationStatus = 'submitted' | 'reviewing' | 'interview' | 'accepted' | 'rejected';

export type PlanTier = 'free' | 'pro-seeker' | 'employer-pro' | 'featured-job';

export type DisabilityAccommodationKey =
  | 'disability-friendly'
  | 'remote-home'
  | 'flexible-schedule'
  | 'part-time-option'
  | 'wheelchair-access'
  | 'ramp-elevator'
  | 'adapted-workstation'
  | 'hearing-support'
  | 'vision-assistive-tech'
  | 'mobility-support';

export interface AccessibilitySettings {
  fontScale: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderHints: boolean;
  visualAlertsOnly: boolean;
  subtitlesEnabled: boolean;
  largeClickTargets: boolean;
}

export interface CompanyRatingRecord {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  stars: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  comment: string;
  verifiedInteraction: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface LanguageSkillItem {
  id: string;
  language: string;
  level: 'Boshlang‘ich (A1-A2)' | 'O‘rta (B1-B2)' | 'Yuqori (C1)' | 'Ona tili / Mukammal (C2)';
}

export type ResumeTemplateStyle = 'classic' | 'modern' | 'executive';

export interface ResumeDocument {
  id: string;
  userId: string;
  resumeTitle: string;
  template: ResumeTemplateStyle;
  isPrimary: boolean;
  fullName: string;
  professionalTitle: string;
  summary: string;
  email: string;
  phone: string;
  telegram?: string;
  country: string;
  city: string;
  desiredWorkMode: WorkMode;
  desiredEmploymentType: EmploymentType;
  skills: string[];
  languages: LanguageSkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certificates: CertificateItem[];
  projects: ProjectItem[];
  updatedAt: string;
}

export interface JobMatchRecommendation {
  jobId: string;
  score: number;
  reasons: string[];
  aiInsight?: string;
}

export interface FraudRiskAnalysis {
  riskScore: number; // 0 (safe) to 100 (high scam risk)
  riskLevel: 'safe' | 'caution' | 'high-risk';
  flags: string[];
  verifiedChecks: string[];
}

export interface CareerPreferences {
  gender?: UserGender;
  age?: number;
  disabilityFriendlyOnly?: boolean;
  accommodations?: DisabilityAccommodationKey[];
  customAccommodationNote?: string;
  sectors: string[];
  country: string;
  city: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: Currency;
  workMode: 'all' | WorkMode;
  employmentType: 'all' | EmploymentType;
  experienceLevel: 'all' | ExperienceLevel;
  completedOnboarding: boolean;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  role: UserRole;
  gender?: UserGender;
  age?: number;
  birthYear?: number;
  disabilityFilterEnabled?: boolean;
  accommodations?: DisabilityAccommodationKey[];
  customAccommodationNote?: string;
  phone: string;
  telegram?: string;
  title?: string;
  location: string;
  bio?: string;
  skills: string[];
  languages?: LanguageSkillItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certificates?: CertificateItem[];
  projects?: ProjectItem[];
  resumes?: ResumeDocument[];
  dismissedJobIds?: string[];
  resumeFileName?: string;
  resumeFileSize?: number;
  companyId?: string;
  plan: PlanTier;
  status: 'active' | 'blocked' | 'deletion-requested';
  privacyShowProfile: boolean;
  privacyShareAccommodationsWithEmployer?: boolean;
  careerPreferences?: CareerPreferences;
  createdAt: string;
}

export interface CompanyRecord {
  id: string;
  ownerId: string;
  name: string;
  logoUrl?: string;
  industry: string;
  country: string;
  city: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  telegramHandle: string;
  description: string;
  taxId?: string;
  licenseNumber?: string;
  verificationDocName?: string;
  trustScore?: number;
  verified: boolean;
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'rejected';
  verificationDate?: string;
  legalEntityName?: string;
  registrationNumber?: string;
  createdAt: string;
}

export type TruthVerificationStatus =
  | 'employer-confirmed'
  | 'third-party-verified'
  | 'unverified'
  | 'unavailable';

export interface TruthFieldStatus {
  status: TruthVerificationStatus;
  note?: string;
  verifiedDate?: string;
}

export interface JobTruthWindow {
  monthlySalaryNetOrGross: 'net' | 'gross' | 'negotiable';
  salaryDetailsNote?: string;
  salaryStatus: TruthVerificationStatus;
  workScheduleNote: string;
  shiftsAndBreaks: string;
  daysOff: string;
  scheduleStatus: TruthVerificationStatus;
  mainDuties: string[];
  requirements: string[];
  tasksStatus: TruthVerificationStatus;
  workplaceType: 'remote' | 'onsite' | 'hybrid';
  workplaceStatus: TruthVerificationStatus;
  transportProvided: boolean;
  mealsProvided: boolean;
  housingProvided: boolean;
  otherPerks?: string;
  perksStatus: TruthVerificationStatus;
  probationPeriod?: string;
  overtimeTerms?: string;
  disabilityAccessibility: boolean;
  workplaceAmenities: string[];
  amenitiesStatus: TruthVerificationStatus;
  lastEmployerConfirmationDate: string;
  lastCompanyAuditDate: string;
  isJobClosedOrExpired?: boolean;
}

export interface JobRecord {
  id: string;
  companyId: string;
  companyName: string;
  companyVerified: boolean;
  contactPhone: string;
  telegramHandle: string;
  title: string;
  category: string;
  country: string;
  city: string;
  exactAddress: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: Currency;
  salaryPeriod: SalaryPeriod;
  isNegotiable: boolean;
  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceLevel: ExperienceLevel;
  targetGender: TargetGender;
  minAge?: number;
  isHazardousForMinors?: boolean;
  disabilityFriendly?: boolean;
  accommodations?: DisabilityAccommodationKey[];
  accommodationContactNote?: string;
  workSchedule: string;
  workLanguage: string;
  timezone: string;
  visaSupport: VisaSupport;
  description: string;
  howToWork: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  featured: boolean;
  status: 'approved' | 'pending' | 'rejected' | 'closed';
  viewsCount: number;
  createdAt: string;
  deadline: string;
  originalLang: Language;
  truthWindow?: JobTruthWindow;
}

export interface ChatMessageRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  seekerId: string;
  seekerName: string;
  employerId: string;
  companyName: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerPhone: string;
  seekerTitle: string;
  resumeSummary: string;
  resumeFileName?: string;
  coverMessage: string;
  sharedAccommodationNote?: string;
  status: ApplicationStatus;
  interviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJobRecord {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type ReportReason =
  | 'unpaid-salary'
  | 'misleading-salary'
  | 'upfront-payment'
  | 'fake-job'
  | 'insult-harassment'
  | 'discrimination'
  | 'privacy-misuse'
  | 'disability-unfair'
  | 'spam'
  | 'other';

export type ReportStatus =
  | 'open'
  | 'reviewing'
  | 'awaiting-company'
  | 'resolved'
  | 'dismissed'
  | 'closed';

export interface CompanyOfficialResponse {
  responderId: string;
  companyName: string;
  actionType: 'explanation' | 'resolution-steps' | 'request-info' | 'request-review';
  message: string;
  respondedAt: string;
}

export interface ReportRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId?: string;
  companyName?: string;
  reporterId: string;
  reporterEmail: string;
  reason: ReportReason;
  details: string;
  evidenceNote?: string;
  status: ReportStatus;
  companyResponse?: CompanyOfficialResponse;
  createdAt: string;
}

export interface SubscriptionPlanConfig {
  id: PlanTier;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  targetAudienceUz: string;
  targetAudienceRu: string;
  targetAudienceEn: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  priceMonthlyUzs: number;
  jobPostLimit: number;
  resumeDownloadLimit: number;
  featuredIncluded: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId: PlanTier;
  amount: number;
  currency: Currency;
  mode: 'demo-sandbox';
  status: 'simulated-not-activated';
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetId: string;
  details: string;
  createdAt: string;
}

// Security validation, XSS sanitization, and Firebase/Firestore architectural blueprints

export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets to prevent HTML/script injection
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function isValidInternationalPhone(phone: string): boolean {
  const cleaned = phone.trim();
  return /^\+?[0-9\s\-()]{7,22}$/.test(cleaned);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function detectScamKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const triggers = [
    'oldindan to‘lov',
    'oldindan tolov',
    'prepayment',
    'upfront fee',
    'предоплата',
    'viza uchun pul',
    'hujjat uchun to‘lov',
    'hujjat uchun pul',
    'karta raqamingizni',
    'cvv',
    'telegram orqali pul',
    'suhbat uchun to‘lov',
    'garov puli',
    'depozit to‘lov',
  ];
  return triggers.filter((word) => lower.includes(word));
}

export function analyzeJobAndEmployerSafety(
  jobTitle: string,
  description: string,
  howToWork: string,
  companyVerified: boolean,
  companyWebsite?: string,
  contactEmail?: string,
  taxId?: string
): {
  riskScore: number;
  riskLevel: 'safe' | 'caution' | 'high-risk';
  flags: string[];
  verifiedChecks: string[];
} {
  let riskScore = 0;
  const flags: string[] = [];
  const verifiedChecks: string[] = [];

  const combined = `${jobTitle} ${description} ${howToWork}`;
  const scamWords = detectScamKeywords(combined);

  if (scamWords.length > 0) {
    riskScore += 75;
    flags.push(`Taqiqlangan oldindan to‘lov iboralari aniqlandi: ${scamWords.join(', ')}`);
  } else {
    verifiedChecks.push('Oldindan to‘lov (viza/hujjat/suhbat puli) talablari yo‘q');
  }

  if (companyVerified) {
    verifiedChecks.push('Kompaniya STIR/INN va rasmiy guvohnomasi moderator tomonidan tasdiqlangan');
  } else {
    riskScore += 25;
    flags.push('Kompaniya hali rasmiy verifikatsiyadan o‘tmagan (Moderator tekshiruvida)');
  }

  if (taxId && taxId.trim().length >= 9) {
    verifiedChecks.push(`STIR / Soliq identifikatsiya raqami mavjud (${taxId})`);
  }

  if (
    companyWebsite &&
    companyWebsite.startsWith('http') &&
    contactEmail &&
    !contactEmail.endsWith('@gmail.com') &&
    !contactEmail.endsWith('@mail.ru')
  ) {
    verifiedChecks.push('Korporativ veb-domen va rasmiy elektron pochta tasdiqlangan');
  } else if (contactEmail && (contactEmail.endsWith('@gmail.com') || contactEmail.endsWith('@mail.ru'))) {
    riskScore += 10;
    flags.push('Umumiy (bepul) pochta domenidan foydalanilgan');
  }

  if (howToWork && howToWork.trim().length >= 30) {
    verifiedChecks.push('Kunlik ish tartibi (“Qanday ishlash kerak”) aniq va shaffof yozilgan');
  } else {
    riskScore += 20;
    flags.push('Ish jarayoni va vazifalar yetarlicha ochiqlanmagan');
  }

  const clampedScore = Math.min(100, Math.max(0, riskScore));
  const riskLevel =
    clampedScore >= 50 ? 'high-risk' : clampedScore >= 20 ? 'caution' : 'safe';

  return {
    riskScore: clampedScore,
    riskLevel,
    flags,
    verifiedChecks,
  };
}

export const FIRESTORE_COLLECTIONS_SCHEMA = [
  {
    name: 'users',
    keys: 'id, email, emailVerified, fullName, role, phone, title, location, skills, experience, education, plan, status, createdAt',
    access: 'Owner read/write (non-RBAC fields); Admin read/update status; Employer read only when candidate applied to their job.',
  },
  {
    name: 'companies',
    keys: 'id, ownerId, name, industry, country, city, website, contactEmail, contactPhone, description, verified, verificationStatus, createdAt',
    access: 'Public read; Employer owner create/update (cannot self-verify); Admin full verification control.',
  },
  {
    name: 'jobs',
    keys: 'id, companyId, companyName, companyVerified, title, category, country, city, salaryMin, salaryMax, currency, isNegotiable, employmentType, workMode, experienceLevel, visaSupport, status, createdAt, deadline',
    access: 'Public read (status == approved); Employer owner create/update own company jobs; Admin approve/reject/delete.',
  },
  {
    name: 'applications',
    keys: 'id, jobId, companyId, seekerId, seekerName, seekerEmail, resumeSummary, coverMessage, status, interviewNote, createdAt, updatedAt',
    access: 'Seeker create (unique per jobId+seekerId) & read own; Employer read & update status for own companyId; Admin audit.',
  },
  {
    name: 'savedJobs',
    keys: 'id, userId, jobId, createdAt',
    access: 'Strict Owner-only read/create/delete (userId == request.auth.uid).',
  },
  {
    name: 'notifications',
    keys: 'id, userId, title, message, read, createdAt',
    access: 'Strict Recipient-only read/update (userId == request.auth.uid).',
  },
  {
    name: 'reports',
    keys: 'id, jobId, reporterId, reason, details, status, createdAt',
    access: 'Authenticated verified user create; Admin-only read/resolve.',
  },
  {
    name: 'subscriptions',
    keys: 'id, nameUz, nameRu, nameEn, priceMonthlyUsd, priceMonthlyUzs, jobPostLimit, resumeDownloadLimit, featuredIncluded',
    access: 'Public read; Admin-only write.',
  },
  {
    name: 'payments',
    keys: 'id, userId, planId, amount, currency, mode, status, createdAt',
    access: 'Owner read; Server-only webhook write (client write forbidden).',
  },
  {
    name: 'auditLogs',
    keys: 'id, actorId, actorEmail, actorRole, action, targetId, details, createdAt',
    access: 'Admin-only read; Append-only immutable audit trail.',
  },
];

export const FIRESTORE_RULES_REFERENCE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null && request.auth.token.email_verified == true;
    }

    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /users/{userId} {
      allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == userId
        && request.resource.data.role in ['seeker', 'employer']
        && request.resource.data.plan == 'free';
      allow update: if isSignedIn() && (
        (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'plan', 'status']))
        || isAdmin()
      );
    }

    match /companies/{companyId} {
      allow get, list: if true;
      allow create: if isSignedIn() && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.verified == false;
      allow update: if isSignedIn() && (
        (resource.data.ownerId == request.auth.uid && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['verified', 'verificationStatus']))
        || isAdmin()
      );
    }

    match /jobs/{jobId} {
      allow get, list: if resource.data.status == 'approved' || isAdmin()
        || (isSignedIn() && get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid);
      allow create: if isSignedIn()
        && get(/databases/$(database)/documents/companies/$(request.resource.data.companyId)).data.ownerId == request.auth.uid;
      allow update: if isSignedIn() && (
        get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid
        || isAdmin()
      );
      allow delete: if isAdmin();
    }

    match /applications/{appId} {
      allow get, list: if isSignedIn() && (
        resource.data.seekerId == request.auth.uid
        || get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid
        || isAdmin()
      );
      allow create: if isSignedIn() && request.resource.data.seekerId == request.auth.uid
        && request.resource.data.status == 'submitted';
      allow update: if isSignedIn()
        && get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.ownerId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'interviewNote', 'updatedAt']);
    }
  }
}`;

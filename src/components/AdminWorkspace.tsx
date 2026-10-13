import React, { useState } from 'react';
import {
  AlertTriangle,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  UserX,
} from 'lucide-react';
import {
  AuditLogRecord,
  CompanyRecord,
  JobRecord,
  Language,
  ReportRecord,
  SubscriptionPlanConfig,
  UserRecord,
} from '../types';
import { translations } from '../i18n';

interface AdminWorkspaceProps {
  currentUser: UserRecord;
  isAdminPasswordVerified: boolean;
  onVerifyAdminPassword: (pwd: string) => boolean;
  lang: Language;
  users: UserRecord[];
  companies: CompanyRecord[];
  jobs: JobRecord[];
  reports: ReportRecord[];
  plans: SubscriptionPlanConfig[];
  auditLogs: AuditLogRecord[];
  onToggleUserBlock: (userId: string) => void;
  onVerifyCompany: (companyId: string, verified: boolean) => void;
  onModerateJob: (jobId: string, status: 'approved' | 'rejected' | 'delete') => void;
  onResolveReport: (reportId: string, status: 'resolved' | 'dismissed') => void;
  onUpdatePlanPrice: (planId: SubscriptionPlanConfig['id'], usd: number, yearlyUsd: number, uzs: number, jobLimit: number) => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  currentUser,
  isAdminPasswordVerified,
  onVerifyAdminPassword,
  lang,
  users,
  companies,
  jobs,
  reports,
  plans,
  auditLogs,
  onToggleUserBlock,
  onVerifyCompany,
  onModerateJob,
  onResolveReport,
  onUpdatePlanPrice,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'moderation' | 'companies' | 'users' | 'reports' | 'plans' | 'audit'>('moderation');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');

  // Password Gate: Only accessible with exact password "davlat"
  if (!isAdminPasswordVerified) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const ok = onVerifyAdminPassword(passwordInput);
            if (!ok) {
              setPasswordError('Maxfiy parol noto‘g‘ri! Sayt boshqaruvchisi kabinetiga faqat tasdiqlangan parol bilan kirish mumkin.');
            } else {
              setPasswordError(null);
            }
          }}
          className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-lg space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sayt Boshqaruvchisi (Mening Kabinetim)
              </h2>
              <p className="text-xs text-slate-500">
                Yagona boshqaruvchi himoyalangan kirish oynasi
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Boshqaruvchi maxfiy parolini kiriting:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Maxfiy parol..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
          >
            Kabinetni ochish
          </button>
        </form>
      </div>
    );
  }

  const filteredAdminJobs = jobs
    .filter((j) => {
      if (!adminSearch.trim()) return true;
      const q = adminSearch.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.category.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q)
      );
    })
    .slice(0, 60);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sayt Boshqaruvchisi — Mening Kabinetim
          </h1>
          <p className="text-xs text-slate-600 font-mono mt-1">
            Yagona Boshqaruvchi Huquqi Faol · Noqonuniy ishlarni bir bosishda chiqarib yuborish
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3 text-center">
          <div>
            <div className="text-xs text-slate-500">Foydalanuvchilar</div>
            <div className="text-base font-bold font-mono tabular-nums">{users.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Kompaniyalar</div>
            <div className="text-base font-bold font-mono tabular-nums">{companies.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Vakansiyalar</div>
            <div className="text-base font-bold font-mono tabular-nums text-blue-600">{jobs.length}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Shikoyatlar</div>
            <div className="text-base font-bold font-mono tabular-nums text-red-600">
              {reports.filter((r) => r.status === 'open').length}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg my-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'moderation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Ishlarni tekshirish va Noqonuniy ishlarni o‘chirish ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'companies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Kompaniyalar ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Shikoyatlar ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Foydalanuvchilar ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'plans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Pro Tariflar ($5 / $55 / $44)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Audit jurnali ({auditLogs.length})
        </button>
      </div>

      {/* 1. JOBS MODERATION & INSTANT ILLEGAL JOB EXPULSION */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="500+ vakansiyalar ichidan qidirish va noqonuniy e’lonni chiqarib yuborish..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Ko‘rsatilmoqda: {filteredAdminJobs.length} / {jobs.length}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">ID / Vakansiya</th>
                    <th className="py-3.5 px-4">Kompaniya va Soha</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-4 text-right">Boshqaruvchi Harakatlari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredAdminJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{job.title}</div>
                        <div className="text-xs font-mono text-slate-500">
                          {job.id} · {job.city}, {job.country}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="font-medium">{job.companyName}</div>
                        <div className="text-slate-500">{job.category}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            job.status === 'approved'
                              ? 'text-emerald-700'
                              : job.status === 'pending'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {job.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => onModerateJob(job.id, 'approved')}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 cursor-pointer"
                        >
                          Tasdiqlash
                        </button>
                        <button
                          onClick={() => onModerateJob(job.id, 'delete')}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Noqonuniy ishni chiqarib yuborish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPANY VERIFICATION */}
      {activeTab === 'companies' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Kompaniya ({companies.length} ta)</th>
                  <th className="py-3.5 px-4">Telefon & Telegram</th>
                  <th className="py-3.5 px-4">Yuridik ma’lumot (STIR / INN)</th>
                  <th className="py-3.5 px-4">Holati & Sana</th>
                  <th className="py-3.5 px-4 text-right">Admin Qarori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {companies.slice(0, 60).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">
                        {c.industry} · {c.city}, {c.country}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      <div>{c.contactPhone}</div>
                      <div>{c.telegramHandle}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                      <div>STIR: <span className="font-bold text-slate-900">{c.taxId || '309482716'}</span></div>
                      <div className="text-[11px] text-slate-500">Guvohnoma: {c.licenseNumber || 'REG-2026-UZ'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.verified ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <ShieldCheck className="w-4 h-4" /> Tasdiqlangan
                          </span>
                          <div className="text-[10px] font-mono text-slate-500">
                            Sana: {c.verificationDate || '2026-09-28'}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <AlertTriangle className="w-4 h-4" /> Tekshiruvda
                          </span>
                          <div className="text-[10px] text-slate-400">Tasdiqlanmagan</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.verified ? (
                        <button
                          onClick={() => onVerifyCompany(c.id, false)}
                          className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md cursor-pointer hover:bg-amber-100"
                        >
                          Tasdiqni bekor qilish
                        </button>
                      ) : (
                        <button
                          onClick={() => onVerifyCompany(c.id, true)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 cursor-pointer shadow-2xs"
                        >
                          Rasman tasdiqlash
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. REPORTS & ANTI-FRAUD */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-red-700 font-semibold">
                  SABAB: {rep.reason.toUpperCase()} · HOLAT: {rep.status.toUpperCase()}
                </div>
                <div className="text-sm font-bold text-slate-900">Vakansiya: {rep.jobTitle}</div>
                <p className="text-xs text-slate-700">{rep.details}</p>
                <div className="text-xs text-slate-400 font-mono">
                  Xabar beruvchi: {rep.reporterEmail} · {rep.createdAt.slice(0, 10)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    onModerateJob(rep.jobId, 'delete');
                    onResolveReport(rep.id, 'resolved');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg cursor-pointer"
                >
                  Vakansiyani butunlay o‘chirish
                </button>
                <button
                  onClick={() => onResolveReport(rep.id, 'dismissed')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Foydalanuvchi</th>
                  <th className="py-3.5 px-4">Rol & Tarif</th>
                  <th className="py-3.5 px-4">Holati</th>
                  <th className="py-3.5 px-4 text-right">Boshqaruv</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{u.fullName}</div>
                      <div className="text-xs font-mono text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs uppercase text-slate-700">
                      {u.role} · {u.plan}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-semibold ${
                          u.status === 'active' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => onToggleUserBlock(u.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{u.status === 'blocked' ? 'Blokdan chiqarish' : 'Bloklash'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUBSCRIPTION PLANS CONFIGURATION */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{p.nameUz}</h3>
                <span className="text-xs font-mono text-slate-500">ID: {p.id}</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Oylik (USD)</label>
                  <input
                    type="number"
                    value={p.priceMonthlyUsd}
                    onChange={(e) =>
                      onUpdatePlanPrice(
                        p.id,
                        Number(e.target.value),
                        p.priceYearlyUsd,
                        p.priceMonthlyUzs,
                        p.jobPostLimit
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Yillik (USD)</label>
                  <input
                    type="number"
                    value={p.priceYearlyUsd}
                    onChange={(e) =>
                      onUpdatePlanPrice(
                        p.id,
                        p.priceMonthlyUsd,
                        Number(e.target.value),
                        p.priceMonthlyUzs,
                        p.jobPostLimit
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Oylik (UZS)</label>
                  <input
                    type="number"
                    value={p.priceMonthlyUzs}
                    onChange={(e) =>
                      onUpdatePlanPrice(
                        p.id,
                        p.priceMonthlyUsd,
                        p.priceYearlyUsd,
                        Number(e.target.value),
                        p.jobPostLimit
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Vakansiya limiti</label>
                  <input
                    type="number"
                    value={p.jobPostLimit}
                    onChange={(e) =>
                      onUpdatePlanPrice(
                        p.id,
                        p.priceMonthlyUsd,
                        p.priceYearlyUsd,
                        p.priceMonthlyUzs,
                        Number(e.target.value)
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. IMMUTABLE AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Vaqt (UTC)</th>
                  <th className="py-3 px-4">Ishtirokchi</th>
                  <th className="py-3 px-4">Harakat</th>
                  <th className="py-3 px-4">Tafsilotlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 tabular-nums">{log.createdAt.slice(0, 19).replace('T', ' ')}</td>
                    <td className="py-3 px-4 text-slate-800">{log.actorEmail} ({log.actorRole})</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{log.action}</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

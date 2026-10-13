import React, { useState } from 'react';
import { AlertCircle, KeyRound, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { Language, UserGender, UserRecord, UserRole } from '../types';
import { translations } from '../i18n';
import { isValidEmail, isValidInternationalPhone, sanitizeText } from '../utils/security';

interface AuthModalProps {
  lang: Language;
  users: UserRecord[];
  onClose: () => void;
  onSuccessLogin: (user: UserRecord) => void;
  onRegisterUser: (newUser: UserRecord) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  lang,
  users,
  onClose,
  onSuccessLogin,
  onRegisterUser,
}) => {
  const t = translations[lang];
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [gender, setGender] = useState<UserGender>('prefer_not_to_say');
  const [age, setAge] = useState('24');
  const [location, setLocation] = useState('Toshkent, O‘zbekiston');
  const [skillsText, setSkillsText] = useState('MS Office, Mas’uliyat');
  const [disabilityFilterEnabled, setDisabilityFilterEnabled] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      setMessage({
        type: 'error',
        text: 'Ko‘p marta noto‘g‘ri urinish aniqlandi (Rate Limit). Iltimos, keyinroq urinib ko‘ring.',
      });
      return;
    }

    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setFailedAttempts((prev) => prev + 1);
      setMessage({
        type: 'error',
        text:
          lang === 'uz'
            ? 'Bunday elektron pochta bilan foydalanuvchi topilmadi. Ro‘yxatdan o‘ting yoki demo hisoblardan birini tanlang.'
            : 'Account not found in local sandbox.',
      });
      return;
    }

    if (found.status === 'blocked') {
      setMessage({
        type: 'error',
        text: 'Ushbu hisob xavfsizlik qoidalarini buzganligi sababli administrator tomonidan vaqtincha bloklangan.',
      });
      return;
    }

    if (found.role === 'admin' && password.trim() !== 'davlat') {
      setFailedAttempts((prev) => prev + 1);
      setMessage({
        type: 'error',
        text: 'Sayt boshqaruvchisi (Admin) kabinetiga kirish uchun maxfiy parolni to‘g‘ri kiriting!',
      });
      return;
    }

    onSuccessLogin(found);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Elektron pochta formati noto‘g‘ri.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Parol kamida 8 ta belgidan iborat bo‘lishi shart.' });
      return;
    }
    if (!isValidInternationalPhone(phone)) {
      setMessage({ type: 'error', text: 'Xalqaro telefon raqami formati noto‘g‘ri.' });
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Ushbu elektron pochta allaqachon ro‘yxatdan o‘tgan.' });
      return;
    }

    // Security invariant: Users can NEVER self-assign 'admin' role during registration
    const safeRole: UserRole = role === 'employer' ? 'employer' : 'seeker';

    const parsedSkills = skillsText
      .split(',')
      .map((s) => sanitizeText(s, 40))
      .filter(Boolean);

    const newUser: UserRecord = {
      id: `usr_${Date.now()}`,
      email: email.trim().toLowerCase(),
      emailVerified: true,
      fullName: sanitizeText(fullName, 80),
      role: safeRole,
      gender,
      age: age ? Number(age) : 24,
      disabilityFilterEnabled,
      phone: sanitizeText(phone, 25),
      title: safeRole === 'seeker' ? 'Mutaxassis' : 'Kompaniya vakili',
      location: sanitizeText(location || 'Toshkent, O‘zbekiston', 80),
      skills: parsedSkills,
      experience: [],
      education: [],
      plan: 'free',
      status: 'active',
      privacyShowProfile: false,
      createdAt: new Date().toISOString(),
    };

    onRegisterUser(newUser);
    onClose();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setMessage({ type: 'error', text: 'Elektron pochta manzilini to‘g‘ri kiriting.' });
      return;
    }
    setMessage({
      type: 'success',
      text: 'Mahalliy (Sandbox) rejim eslatmasi: Firebase Auth ulanmaganligi sababli haqiqiy xat yuborilmadi. Firebase ulanganda sendPasswordResetEmail() chaqiriladi.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {mode === 'login'
                ? 'Tizimga kirish'
                : mode === 'register'
                ? 'Ro‘yxatdan o‘tish'
                : 'Parolni tiklash'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Honest Firebase Sandbox Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Mahalliy Sandbox Autentifikatsiyasi</span>
            </div>
            <p className="text-blue-900/80 leading-relaxed">
              Firebase Authentication o‘rnatilmaganligi sababli hisoblar joriy brauzer xotirasida boshqariladi. Administrator roli oddiy ro‘yxatdan o‘tishda berilmaydi.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setMessage(null);
              }}
              className={`py-1.5 rounded-md cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setMessage(null);
              }}
              className={`py-1.5 rounded-md cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setMessage(null);
              }}
              className={`py-1.5 rounded-md cursor-pointer ${
                mode === 'reset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Parolni tiklash
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Elektron pochta</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jasur.karimov@example.uz"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Parol</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Tizimga kirish
              </button>

              {/* Quick Demo Account Selector */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-xs text-slate-500 font-medium">Tayyor sinov hisoblariga bir bosishda kirish:</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {users
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <button
                        key={u.id}
                      type="button"
                      onClick={() => {
                        onSuccessLogin(u);
                        onClose();
                      }}
                      className="flex items-center justify-between px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer"
                    >
                      <span className="font-medium text-slate-900">{u.fullName}</span>
                      <span className="font-mono text-slate-500 uppercase">{u.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Hisob turi (Rol)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('seeker')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border cursor-pointer ${
                      role === 'seeker'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    {t.roleSeeker}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border cursor-pointer ${
                      role === 'employer'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    {t.roleEmployer}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">To‘liq ism-sharif *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Elektron pochta *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Xalqaro telefon *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jins (Ixtiyoriy)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as UserGender)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                    <option value="prefer_not_to_say">Ko‘rsatishni istamayman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Yosh (Mehnat me’yori uchun)
                  </label>
                  <input
                    type="number"
                    min={14}
                    max={85}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shahar va Davlat
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ko‘nikmalar
                  </label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {role === 'seeker' && (
                <label className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-200 rounded-lg cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={disabilityFilterEnabled}
                    onChange={(e) => setDisabilityFilterEnabled(e.target.checked)}
                    className="mt-0.5 rounded border-blue-400"
                  />
                  <div>
                    <div className="font-bold text-slate-900">
                      ♿ Nogironligi bo‘lgan insonlar uchun mos ishlarni ko‘rsatish
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Ixtiyoriy (tibbiy tashxis yoki hujjat talab qilinmaydi, roziligingizsiz ish beruvchiga oshkor etilmaydi).
                    </div>
                  </div>
                </label>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Parol (kamida 8 ta belgi) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Hisob yaratish
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Elektron pochta manzilingiz</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Tiklash yo‘riqnomasini olish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

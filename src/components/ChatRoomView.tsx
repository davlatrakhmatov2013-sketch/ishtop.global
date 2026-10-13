import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Briefcase,
  MapPin,
  Clock,
  Building,
  User,
  Search,
  ShieldCheck,
  CheckCheck,
  Sparkles,
  ArrowLeft,
  Phone,
  Send as SendIcon,
  HelpCircle,
  AlertCircle,
  Accessibility,
  ArrowRight,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import {
  ChatMessageRecord,
  JobRecord,
  CompanyRecord,
  UserRecord,
  ApplicationRecord,
  Language,
} from '../types';
import { sanitizeText } from '../utils/security';

interface ChatRoomViewProps {
  currentUser: UserRecord | null;
  users: UserRecord[];
  jobs: JobRecord[];
  companies: CompanyRecord[];
  applications: ApplicationRecord[];
  chatMessages: ChatMessageRecord[];
  onSendMessage: (
    jobId: string,
    jobTitle: string,
    companyName: string,
    text: string,
    employerId?: string,
    seekerId?: string,
    seekerName?: string
  ) => void;
  onDeleteMessage: (msgId: string) => void;
  onOpenJob: (job: JobRecord) => void;
  onSwitchUser?: (user: UserRecord) => void;
  initialJobId?: string | null;
  initialSeekerId?: string | null;
  lang: Language;
  onBackToJobs?: () => void;
}

interface ConversationThread {
  key: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  employerId: string;
  seekerId: string;
  seekerName: string;
  messages: ChatMessageRecord[];
  lastMessage?: ChatMessageRecord;
  lastTimestamp: string;
}

export const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  currentUser,
  users,
  jobs,
  companies,
  applications,
  chatMessages,
  onSendMessage,
  onDeleteMessage,
  onOpenJob,
  onSwitchUser,
  initialJobId,
  initialSeekerId,
  lang,
  onBackToJobs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'applications'>('all');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Derive conversation threads from chatMessages + applications
  const threads = useMemo(() => {
    const map = new Map<string, ConversationThread>();

    // 1. Group existing chat messages
    chatMessages.forEach((msg) => {
      const sId = msg.seekerId || 'usr_seeker_1';
      const key = `${msg.jobId}___${sId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          jobId: msg.jobId,
          jobTitle: msg.jobTitle,
          companyName: msg.companyName,
          employerId: msg.employerId || 'usr_employer_1',
          seekerId: sId,
          seekerName: msg.seekerName || 'Nomzod',
          messages: [],
          lastTimestamp: msg.createdAt,
        });
      }
      const thread = map.get(key)!;
      thread.messages.push(msg);
      if (
        !thread.lastTimestamp ||
        new Date(msg.createdAt).getTime() > new Date(thread.lastTimestamp).getTime()
      ) {
        thread.lastTimestamp = msg.createdAt;
        thread.lastMessage = msg;
      }
    });

    // 2. Also incorporate active applications if no chat started yet
    applications.forEach((app) => {
      const key = `${app.jobId}___${app.seekerId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          companyName: app.companyName,
          employerId: 'usr_employer_1',
          seekerId: app.seekerId,
          seekerName: app.seekerName,
          messages: [],
          lastTimestamp: app.createdAt,
        });
      }
    });

    // Sort messages within threads
    map.forEach((th) => {
      th.messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      if (th.messages.length > 0) {
        th.lastMessage = th.messages[th.messages.length - 1];
        th.lastTimestamp = th.lastMessage.createdAt;
      }
    });

    // Convert to array and sort by most recent activity
    const arr = Array.from(map.values());
    arr.sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
    return arr;
  }, [chatMessages, applications]);

  // Select initial thread on mount or when initialJobId / initialSeekerId changes
  useEffect(() => {
    if (initialJobId) {
      const found = threads.find(
        (t) =>
          t.jobId === initialJobId && (!initialSeekerId || t.seekerId === initialSeekerId)
      );
      if (found) {
        setSelectedKey(found.key);
        return;
      }
      // If none found but job exists, create a virtual key
      const job = jobs.find((j) => j.id === initialJobId);
      if (job) {
        const sId = currentUser?.role === 'seeker' ? currentUser.id : 'usr_seeker_1';
        setSelectedKey(`${job.id}___${sId}`);
        return;
      }
    }

    if (!selectedKey && threads.length > 0) {
      // Find one relevant to current user, or take first
      if (currentUser?.role === 'employer') {
        const empThread = threads.find((t) => t.employerId === currentUser.id);
        setSelectedKey(empThread ? empThread.key : threads[0].key);
      } else if (currentUser?.role === 'seeker') {
        const seekThread = threads.find((t) => t.seekerId === currentUser.id);
        setSelectedKey(seekThread ? seekThread.key : threads[0].key);
      } else {
        setSelectedKey(threads[0].key);
      }
    }
  }, [initialJobId, initialSeekerId, threads, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedKey]);

  // Current active thread
  const activeThread = useMemo(() => {
    if (!selectedKey) return threads[0] || null;
    const found = threads.find((t) => t.key === selectedKey);
    if (found) return found;

    // Could be a newly initiated thread
    const [jobId, seekerId] = selectedKey.split('___');
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      const seeker = users.find((u) => u.id === seekerId);
      return {
        key: selectedKey,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        employerId: 'usr_employer_1',
        seekerId: seekerId || 'usr_seeker_1',
        seekerName: seeker?.fullName || 'Nomzod',
        messages: [],
        lastTimestamp: new Date().toISOString(),
      } as ConversationThread;
    }
    return threads[0] || null;
  }, [selectedKey, threads, jobs, users]);

  // Corresponding job for active thread
  const activeJob = useMemo(() => {
    if (!activeThread) return null;
    return jobs.find((j) => j.id === activeThread.jobId) || null;
  }, [activeThread, jobs]);

  // Filtered threads by search
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (filterMode === 'applications') {
        const hasApp = applications.some(
          (a) => a.jobId === t.jobId && a.seekerId === t.seekerId
        );
        if (!hasApp) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.jobTitle.toLowerCase().includes(q) ||
        t.companyName.toLowerCase().includes(q) ||
        t.seekerName.toLowerCase().includes(q) ||
        t.messages.some((m) => m.text.toLowerCase().includes(q))
      );
    });
  }, [threads, searchQuery, filterMode, applications]);

  const handleSend = (customText?: string) => {
    const textToSend = sanitizeText(customText || inputText, 500);
    if (!textToSend.trim() || !activeThread) return;

    onSendMessage(
      activeThread.jobId,
      activeThread.jobTitle,
      activeThread.companyName,
      textToSend,
      activeThread.employerId,
      activeThread.seekerId,
      activeThread.seekerName
    );

    if (!customText) {
      setInputText('');
    }
  };

  // Quick suggestion chips depending on whether current user acts as Seeker or Employer
  const isEmployerPerspective = currentUser?.role === 'employer';

  const quickChips = isEmployerPerspective
    ? [
        '👋 Assalomu alaykum! Rezyumeingiz bizga ma’qul keldi, onlayn suhbatga taklif qilamiz.',
        '🏢 Ofisimizga kelib ish joyi va sharoitlar bilan tanishishingiz mumkin.',
        '🕒 Sizga haftaning qaysi kuni va vaqti suhbat uchun qulay?',
        'ℹ️ Oylik/kunlik to‘lov va ish vazifalari bo‘yicha to‘liq ma’lumot berishga tayyormiz.',
        '♿ Korxonamizda to‘siqsiz qulayliklar va moslashtirilgan ish stoli mavjud.',
      ]
    : [
        '📍 Ish joyining aniq manzili va yetib borish marshruti haqida ma’lumot bera olasizmi?',
        '⏰ Ish jadvali (oylik/kunlik/soatlik to‘lov tartibi) qanday tashkil etilgan?',
        '♿ Ish joyida to‘siqsiz kirish yo‘llari (pandus, lift) mavjudmi?',
        '📅 Onlayn yoki oflayn suhbat (intervyu) vaqtini belgilasak bo‘ladimi?',
        '💼 Rezyumeimni ko‘rib chiqayotganingiz uchun minnatdorchilik bildiraman.',
      ];

  const candidateAccount = users.find((u) => u.role === 'seeker') || users[0];
  const employerAccount =
    users.find((u) => u.role === 'employer') || users[1] || users[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header breadcrumb & role switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            {onBackToJobs && (
              <button
                onClick={onBackToJobs}
                className="inline-flex items-center gap-1 hover:text-blue-600 font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Vakansiyalarga qaytish</span>
              </button>
            )}
            <span>•</span>
            <span>Muloqot markazi</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Ish beruvchi va nomzod suhbatxonasi
              </h1>
              <p className="text-xs text-slate-600">
                Haqiqiy vakansiyalar, shart-sharoitlar, maosh va intervyu bo‘yicha bevosita xavfsiz muloqot
              </p>
            </div>
          </div>
        </div>

        {/* Demo Persona Switcher for Instant Interactive Testing */}
        {onSwitchUser && (
          <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-medium pl-1">Suhbatdosh roli:</span>
            <button
              onClick={() => onSwitchUser(candidateAccount)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentUser?.role === 'seeker'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Nomzod ({candidateAccount.fullName.split(' ')[0]})</span>
            </button>
            <button
              onClick={() => onSwitchUser(employerAccount)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentUser?.role === 'employer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ish beruvchi ({employerAccount.fullName.split(' ')[0]})</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Panel Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Conversations Sidebar (4 cols) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Sidebar Search and Filters */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suhbat, kompaniya yoki nomzod..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Barchasi ({threads.length})
              </button>
              <button
                onClick={() => setFilterMode('applications')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  filterMode === 'applications'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Arizalar bo‘yicha ({applications.length})
              </button>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Suhbatlar topilmadi
                </p>
                <p className="text-[11px] text-slate-500">
                  Istalgan vakansiya sahifasidan “Ish beruvchi bilan chat” tugmasi orqali yangi muloqot boshlashingiz mumkin.
                </p>
              </div>
            ) : (
              filteredThreads.map((th) => {
                const isSelected = th.key === activeThread?.key;
                const jobItem = jobs.find((j) => j.id === th.jobId);
                const isDisabilityFriendly = jobItem?.disabilityFriendly;

                return (
                  <button
                    key={th.key}
                    onClick={() => setSelectedKey(th.key)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-4 border-blue-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {isEmployerPerspective
                        ? th.seekerName.slice(0, 2).toUpperCase()
                        : th.companyName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {isEmployerPerspective ? th.seekerName : th.companyName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {th.lastTimestamp ? th.lastTimestamp.slice(11, 16) : ''}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-blue-700 truncate mb-1">
                        {th.jobTitle}
                      </div>

                      <p className="text-xs text-slate-600 truncate line-clamp-1">
                        {th.lastMessage ? th.lastMessage.text : 'Suhbat hali boshlanmadi'}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        {jobItem && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
                            {jobItem.salaryPeriod === 'daily'
                              ? 'Kunlik'
                              : jobItem.salaryPeriod === 'hourly'
                              ? 'Soatlik'
                              : 'Oylik'}
                          </span>
                        )}
                        {isDisabilityFriendly && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold flex items-center gap-0.5">
                            <Accessibility className="w-2.5 h-2.5" />
                            To‘siqsiz
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick starter box */}
          <div className="p-3 border-t border-slate-200 bg-white text-xs">
            <div className="text-slate-500 mb-1 font-medium">Boshqa vakansiya bo‘yicha chat:</div>
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                const sId = currentUser?.role === 'seeker' ? currentUser.id : 'usr_seeker_1';
                setSelectedKey(`${e.target.value}___${sId}`);
              }}
              value={activeThread?.jobId || ''}
              aria-label="Vakansiyani tanlash"
              className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} · {j.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Active Conversation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {isEmployerPerspective
                      ? activeThread.seekerName.slice(0, 2).toUpperCase()
                      : activeThread.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        {isEmployerPerspective
                          ? activeThread.seekerName
                          : activeThread.companyName}
                      </h2>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                        {isEmployerPerspective ? 'Nomzod' : 'Ish beruvchi'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Vakansiya: <strong className="text-slate-800">{activeThread.jobTitle}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeJob && (
                    <button
                      type="button"
                      onClick={() => onOpenJob(activeJob)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Vakansiyani ko‘rish</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Job Highlights Strip */}
              {activeJob && (
                <div className="px-4 py-2.5 bg-blue-50/40 border-b border-blue-100 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      {activeJob.city}, {activeJob.exactAddress}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      To‘lov: <strong className="text-slate-900 font-mono">
                        {activeJob.salaryPeriod === 'daily'
                          ? 'Kunlik'
                          : activeJob.salaryPeriod === 'hourly'
                          ? 'Soatlik'
                          : 'Oylik'}
                      </strong>
                    </span>
                    {activeJob.disabilityFriendly && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Accessibility className="w-3.5 h-3.5" />
                        Nogironligi bo‘lganlarga mos
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    ID: <code className="font-mono text-slate-700">{activeJob.id}</code>
                  </span>
                </div>
              )}

              {/* Safety notice banner */}
              <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Xavfsizlik eslatmasi:</strong> Qonuniy ish beruvchilar hech qachon suhbat yoki ro‘yxatdan o‘tish uchun pul talab qilmaydi. Barcha shartlar shaffof va ochiq bo‘lishi lozim.
                </span>
              </div>

              {/* Message History Stream */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-[340px] max-h-[480px]">
                {activeThread.messages.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h3 className="text-sm font-bold text-slate-900">
                        Muloqotni boshlang
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Ushbu vakansiya bo‘yicha ish beruvchiga yoki nomzodga ilk xabarni yozing. Pastdagi tayyor tezkor savollardan ham foydalanishingiz mumkin.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeThread.messages.map((msg) => {
                    const isMine =
                      currentUser &&
                      (currentUser.id === msg.senderId ||
                        (currentUser.role === 'seeker' && msg.senderRole === 'seeker') ||
                        (currentUser.role === 'employer' && msg.senderRole === 'employer'));
                    const canDelete =
                      currentUser &&
                      (currentUser.id === msg.senderId || currentUser.role === 'admin');

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 items-end ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isMine && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {msg.senderName.slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs shadow-2xs group relative ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <div
                            className={`flex items-center gap-1.5 mb-1 text-[10px] ${
                              isMine ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span className="font-bold">
                              {isMine ? 'Siz' : msg.senderName}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {msg.createdAt.slice(11, 16)}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed whitespace-pre-line select-text">
                            {msg.text}
                          </p>

                          {/* Delete Action */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onDeleteMessage(msg.id)}
                              className={`absolute -top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs ${
                                isMine
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-white text-red-600 hover:bg-red-50 border border-slate-200'
                              }`}
                              title="Xabarni o‘chirish"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {isMine && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {currentUser?.fullName.slice(0, 1).toUpperCase() || 'S'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tezkor xabarlar va savollar (1-klikda yuborish):</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {quickChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(chip)}
                      className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 rounded-lg transition-colors cursor-pointer text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isEmployerPerspective
                        ? 'Nomzodga javob yozing (masalan, intervyu vaqti yoki shartlar)...'
                        : 'Ish beruvchiga xabar yozing (savol, rezyume, sharoitlar)...'
                    }
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white transition-all cursor-pointer shadow-xs ${
                      inputText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <span>Yuborish</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Enter — xabarni tezkor yuborish</span>
                  <span>O‘z xabaringiz ustiga bosib uni o‘chirishingiz mumkin</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 my-auto space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Suhbatni tanlang
              </p>
              <p className="text-xs">
                Chap tomondagi ro‘yxatdan muloqotni tanlang yoki yangi vakansiya bo‘yicha chat boshlang.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

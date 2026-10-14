import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { SectorsGrid } from './components/SectorsGrid.tsx';
import { ApplicationWizard } from './components/ApplicationWizard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminDashboardModal } from './components/AdminDashboardModal.tsx';
import { DiscordServerStatus } from './components/DiscordServerStatus.tsx';
import { ChangelogModal } from './components/ChangelogModal.tsx';
import { Sector, Application, UserAccount, ServerSettings } from './types.ts';
import { DEFAULT_SECTORS, DEFAULT_SERVER_SETTINGS } from './data/defaultData.ts';
import { safeFetchJson } from './utils/api.ts';
import { MessageSquare, Shield, ExternalLink, X, UserPlus, CheckCircle2, Zap, Smartphone } from 'lucide-react';
import { 
  getSavedDeviceProfile, 
  performDeviceLogin, 
  clearDeviceProfile 
} from './utils/deviceAuth.ts';

function AppContent() {
  const { theme } = useTheme();
  const [sectors, setSectors] = useState<Sector[]>(() => {
    try {
      const saved = localStorage.getItem('prava_sectors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SECTORS;
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Active selected sector for recruitment wizard
  const [activeSector, setActiveSector] = useState<Sector | null>(null);

  // Server Settings (Logo, Discord link, default prefix)
  const [serverSettings, setServerSettings] = useState<ServerSettings>(() => {
    try {
      const saved = localStorage.getItem('prava_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_SERVER_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SERVER_SETTINGS;
  });

  // Current logged in user (Owner, Leader, Officer, or Applicant)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('prava_current_user');
      if (saved) return JSON.parse(saved);
      // Fallback: Check if device profile exists and autoLogin is on
      const profile = getSavedDeviceProfile();
      if (profile && profile.autoLogin && profile.user) {
        return profile.user as UserAccount;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Auth Modal State (Register / Login)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  // Staff Admin Dashboard Modal
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Leadership contact modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Updates & Changelog Modal
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isFetchingRef = React.useRef(false);

  // Fetch initial data (Sectors + Server Settings) safely with fallback caching
  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const [sectorsRes, settingsRes] = await Promise.all([
        safeFetchJson<Sector[]>('/api/sectors'),
        safeFetchJson<ServerSettings>('/api/settings'),
      ]);

      if (sectorsRes && Array.isArray(sectorsRes) && sectorsRes.length > 0) {
        setSectors((prev) => (JSON.stringify(prev) === JSON.stringify(sectorsRes) ? prev : sectorsRes));
        try {
          localStorage.setItem('prava_sectors', JSON.stringify(sectorsRes));
        } catch {}
      }

      if (settingsRes && typeof settingsRes === 'object') {
        setServerSettings((prev) => (JSON.stringify(prev) === JSON.stringify(settingsRes) ? prev : settingsRes));
        try {
          localStorage.setItem('prava_settings', JSON.stringify(settingsRes));
        } catch {}
      }
    } catch {
      // Silently fall back to cached / default state
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  };

  // Device Auto-Login verification on mount
  useEffect(() => {
    const verifyDeviceAuth = async () => {
      const profile = getSavedDeviceProfile();
      if (profile && profile.autoLogin && profile.user?.username) {
        try {
          const res = await performDeviceLogin(profile.user.username);
          if (res.success && res.user) {
            setCurrentUser(res.user);
            showToast(`⚡ تم التعرف على جهازك ودخولك تلقائياً كـ ${res.user.displayName}`);
          }
        } catch (e) {
          console.warn('Device auto-login check failed', e);
        }
      }
    };

    verifyDeviceAuth();
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-sync polling every 8 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 8000);

    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener('focus', handleFocus);

    // If user has never visited, isn't logged in, and no device is remembered, prompt registration modal
    const hasVisited = localStorage.getItem('prava_visited');
    const remembered = getSavedDeviceProfile();
    if (!hasVisited && !currentUser && !remembered) {
      localStorage.setItem('prava_visited', 'true');
      setIsAuthModalOpen(true);
      setAuthModalMode('register');
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle Auth Success (both register and login)
  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('prava_current_user', JSON.stringify(user));
    setIsAuthModalOpen(false);

    showToast(`مرحباً بك يا ${user.displayName}! تم تسجيل دخولك بنجاح (${user.roleTitle})`);

    // If staff/admin, also open dashboard if they came to manage
    if (user.role === 'owner' || user.role === 'leader') {
      setIsDashboardOpen(true);
    }
  };

  // Handle Logout (optionally forget device)
  const handleLogout = (forgetDevice: boolean = false) => {
    setCurrentUser(null);
    localStorage.removeItem('prava_current_user');
    setIsDashboardOpen(false);
    if (forgetDevice) {
      clearDeviceProfile();
      showToast('تم تسجيل الخروج ومسح بيانات هذا الجهاز');
    } else {
      showToast('تم تسجيل الخروج (جهازك ما زال محفوظاً للدخول السريع ⚡)');
    }
  };

  // Quick 1-click device login from Navbar or other triggers
  const handleQuickDeviceLogin = async () => {
    const profile = getSavedDeviceProfile();
    if (!profile?.user?.username) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    const res = await performDeviceLogin(profile.user.username);
    if (res.success && res.user) {
      handleAuthSuccess(res.user);
    } else {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  // Open Admin Dashboard
  const handleOpenAdmin = () => {
    if (currentUser && currentUser.role !== 'applicant') {
      setIsDashboardOpen(true);
    } else {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  // Update Sector from Admin Dashboard
  const handleUpdateSector = (updated: Sector) => {
    setSectors((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (activeSector?.id === updated.id) {
      setActiveSector(updated);
    }
  };

  // Update Server Settings
  const handleUpdateServerSettings = (updated: ServerSettings) => {
    setServerSettings(updated);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-xl bg-[#121622] border border-white/20 text-white text-xs font-bold shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenAdmin={handleOpenAdmin}
        currentUser={currentUser}
        onOpenAuth={(mode = 'register') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onQuickDeviceLogin={handleQuickDeviceLogin}
        onGoHome={() => setActiveSector(null)}
        serverSettings={serverSettings}
        onOpenChangelog={() => setIsChangelogOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
            <p className="text-xs text-slate-400 font-bold">جاري تحميل منظومة PRAVA الموحدة...</p>
          </div>
        ) : activeSector ? (
          /* Application Wizard View */
          <ApplicationWizard
            sector={activeSector}
            currentUser={currentUser}
            onBackToSectors={() => setActiveSector(null)}
            onSubmitSuccess={(app) => {
              showToast(`تم إرسال طلبك برقم ${app.id} واليونت ${app.currentUnit}`);
            }}
            onOpenAuth={(mode = 'login') => {
              setAuthModalMode(mode);
              setIsAuthModalOpen(true);
            }}
          />
        ) : (
          /* Home Portal View */
          <>
            {/* Quick Guest / Recognized Device Banner if not logged in */}
            {!currentUser && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                {getSavedDeviceProfile()?.user ? (
                  /* RECOGNIZED DEVICE BANNER */
                  <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                        <Smartphone className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">
                            تم التعرف على هذا الجهاز ({getSavedDeviceProfile()?.user.displayName})!
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            جهاز معتمد
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          جهازك محفوظ في المنظومة، يمكنك الدخول فوراً بضغطة زر واحدة دون كتابة كلمة المرور.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleQuickDeviceLogin}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-lg flex items-center gap-1.5 active:scale-95`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>دخول سريع (بضغطة واحدة)</span>
                      </button>

                      <button
                        onClick={() => {
                          setAuthModalMode('login');
                          setIsAuthModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                      >
                        تبديل الحساب
                      </button>
                    </div>
                  </div>
                ) : (
                  /* NEW VISITOR REGISTRATION BANNER */
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">تسجيل الدخول أو إنشاء حساب مطلوب للتقديم!</h4>
                        <p className="text-[11px] text-slate-400">
                          أنشئ حسابك بالآيدي والديسكورد لمتابعة طلبك والتقديم على قطاعات السيرفر الرسمية.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setIsAuthModalOpen(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass} shrink-0`}
                    >
                      إنشاء حساب للتقديم
                    </button>
                  </div>
                )}
              </div>
            )}

            <Hero sectors={sectors} serverSettings={serverSettings} />
            <SectorsGrid
              sectors={sectors}
              onSelectSector={(sec) => {
                if (!currentUser) {
                  showToast('يجب تسجيل الدخول أو إنشاء حسابك أولاً للتقديم على هذا القطاع');
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                  return;
                }
                setActiveSector(sec);
              }}
              onContactLeadership={() => setIsContactModalOpen(true)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 pt-8 pb-12 px-4 text-center text-xs text-slate-500 bg-[#07090d]/80 backdrop-blur-sm">
        {/* Discord Server Status with live pulsing indicator */}
        <DiscordServerStatus serverSettings={serverSettings} />

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-slate-300 font-['Plus_Jakarta_Sans',sans-serif]">PRAVA</span>
            <span>·</span>
            <span>منصة التوظيف الموحدة لقطاعات الدعم والعمليات</span>
            <button
              type="button"
              onClick={() => setIsChangelogOpen(true)}
              className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-[10px] border border-amber-500/30 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="عرض مكان وسجل التحديثات"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>مكان التحديثات: الإصدار V16.4</span>
            </button>
          </div>

          <div className="flex flex-col sm:items-end items-center gap-1.5">
            <div className="text-[11px] text-slate-500">
              جميع الحقوق محفوظة © {new Date().getFullYear()} {serverSettings.serverName || 'سيرفر PRAVA'}
            </div>
            
            {/* Attribution by ABU IBRAHIM in Arabic & English */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[10px] text-slate-400 font-medium">
              <span className="text-amber-400/90 font-semibold">
                تم إنشاء الموقع من قبل <span className="font-bold text-amber-300">ABU IBRAHIM</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="font-sans text-slate-400">
                Created by <span className="font-bold text-amber-300">ABU IBRAHIM</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Unified Auth Modal (Register / Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Staff Admin Dashboard Modal */}
      {currentUser && (
        <AdminDashboardModal
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          sectors={sectors}
          onUpdateSector={handleUpdateSector}
          serverSettings={serverSettings}
          onUpdateServerSettings={handleUpdateServerSettings}
        />
      )}

      {/* Contact Leadership Modal */}
      {isContactModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-[#0f141d] border border-white/10 rounded-2xl p-6 text-right shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <MessageSquare className="w-6 h-6" />
              <h3 className="font-extrabold text-white text-base">رئاسة قطاعات PRAVA</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              للاستفسارات الخاصة بالقبول العسكري أو التقديم على الرتب القيادية والتنسيق مع رئاسة القطاع، يرجى فتح تذكرة عبر ديسكورد السيرفر الرسمي.
            </p>

            <div className="space-y-3">
              <a
                href={serverSettings.discordUrl || "https://discord.gg"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>التوجه لديسكورد {serverSettings.serverName || 'PRAVA'}</span>
              </a>

              <button
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-300 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Updates & Changelog Modal (مكان التحديثات) */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

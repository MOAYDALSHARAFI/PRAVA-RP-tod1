import React, { useState, useEffect } from 'react';
import { 
  Lock, X, UserPlus, LogIn, Sparkles, AlertCircle, 
  Gamepad2, MessageSquare, User, KeyRound, CheckCircle2,
  Smartphone, Zap, ShieldCheck, RefreshCw, Trash2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { UserAccount } from '../types.ts';
import { 
  getSavedDeviceProfile, 
  saveDeviceProfile, 
  clearDeviceProfile, 
  performDeviceLogin,
  DeviceProfile 
} from '../utils/deviceAuth.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'register',
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Remember this device & auto-login preference
  const [rememberThisDevice, setRememberThisDevice] = useState(true);
  const [savedDevice, setSavedDevice] = useState<DeviceProfile | null>(null);
  const [showManualLogin, setShowManualLogin] = useState(false);

  // Register fields
  const [gameId, setGameId] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeviceLoggingIn, setIsDeviceLoggingIn] = useState(false);

  // Check saved device profile on open
  useEffect(() => {
    if (isOpen) {
      const profile = getSavedDeviceProfile();
      setSavedDevice(profile);
      // If a device is already recognized, start in login mode and prioritize device card
      if (profile && initialMode === 'login') {
        setShowManualLogin(false);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // 1-Click instant login for recognized device
  const handleQuickDeviceLogin = async () => {
    if (!savedDevice?.user?.username) return;
    setError('');
    setIsDeviceLoggingIn(true);

    try {
      const res = await performDeviceLogin(savedDevice.user.username);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'تعذر التعرف على الجهاز، يرجى تسجيل الدخول يدوياً');
        setShowManualLogin(true);
      }
    } catch {
      setError('خطأ في الاتصال، يرجى المحاولة لاحقاً');
      setShowManualLogin(true);
    } finally {
      setIsDeviceLoggingIn(false);
    }
  };

  // Remove saved device binding
  const handleForgetDevice = () => {
    clearDeviceProfile();
    setSavedDevice(null);
    setShowManualLogin(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          discordUsername,
          username: regUsername,
          password: regPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الحساب');
        setIsLoading(false);
        return;
      }

      // Save device profile if remembered
      if (rememberThisDevice) {
        saveDeviceProfile(data.user, true);
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        setIsLoading(false);
        return;
      }

      // Save device profile if remembered
      if (rememberThisDevice) {
        saveDeviceProfile(data.user, true);
      } else {
        clearDeviceProfile();
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-[#0f121a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            {mode === 'register' ? (
              <UserPlus className="w-6 h-6" />
            ) : savedDevice && !showManualLogin ? (
              <Smartphone className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {mode === 'register' 
                ? 'إنشاء حساب جديد' 
                : savedDevice && !showManualLogin
                ? 'التعرف على الجهاز والدخول السريع'
                : 'تسجيل الدخول'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'register' 
                ? 'أنشئ حسابك وسيتعرف عليك جهازك للدخول التلقائي لاحقاً' 
                : savedDevice && !showManualLogin
                ? 'تم التعرف على جهازك، ادخل بضغطة زر واحدة دون كتابة كلمة المرور'
                : 'ادخل باليوزر وكلمة السر للمتابعة'}
            </p>
          </div>
        </div>

        {/* Tab Toggle (Register vs Login) */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-5 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setShowManualLogin(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? `${theme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            إنشاء حساب
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? `${theme.buttonClass} shadow-md`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل الدخول {savedDevice && '⚡'}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                <span>الآيدي في اللعبة (Game ID)</span>
                <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="مثال: 7421"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
                <span>يوزرك في الديسكورد (Discord Username / ID)</span>
                <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                placeholder="مثال: username#0000 أو 123456789"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>اسم المستخدم (اليوزر)</span>
                <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="اسم المستخدم لتسجيل الدخول"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>كلمة المرور (الباسورد)</span>
                <span className="text-amber-400">*</span>
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Remember Device Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberThisDevice}
                  onChange={(e) => setRememberThisDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-black/40 border-white/20 accent-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-200 block">
                    تذكر هذا الجهاز وتفعيل الدخول التلقائي 📱
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    لن تحتاج لإدخال اليوزر والباسورد في كل مرة تزور فيها الموقع
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg`}
              >
                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب والدخول ديركت'}
              </button>
            </div>
          </form>
        ) : savedDevice && !showManualLogin ? (
          /* RECOGNIZED DEVICE QUICK LOGIN VIEW */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-[#161c28] to-[#0d1017] border border-amber-500/30 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>تم التعرف على جهازك تلقائياً</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  جهاز موثوق
                </span>
              </div>

              {/* User profile card */}
              <div className="flex items-center gap-3.5 my-2">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-lg shadow-md">
                  {savedDevice.user.displayName ? savedDevice.user.displayName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    {savedDevice.user.displayName}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                      {savedDevice.user.roleTitle}
                    </span>
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    @{savedDevice.user.username} {savedDevice.user.gameId ? `· ID: ${savedDevice.user.gameId}` : ''}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300/90 mt-3 pt-2.5 border-t border-white/5 leading-relaxed">
                هذا الجهاز مسجل ومعتمد مسبقاً في النظام. يمكنك الدخول فوراً بضغطة زر واحدة دون الحاجة لإعادة كتابة اسم المستخدم أو كلمة السر في كل زيارة.
              </p>
            </div>

            {/* Instant Login Button */}
            <button
              type="button"
              onClick={handleQuickDeviceLogin}
              disabled={isDeviceLoggingIn}
              className={`w-full py-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-xl flex items-center justify-center gap-2`}
            >
              {isDeviceLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري تسجيل الدخول السريع...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>دخول فوري لهذا الجهاز (بضغطة واحدة)</span>
                </>
              )}
            </button>

            {/* Switch Account or Forget Device Options */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowManualLogin(true)}
                className="text-amber-400 hover:text-amber-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>الدخول بحساب آخر يدوياً</span>
              </button>

              <button
                type="button"
                onClick={handleForgetDevice}
                className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title="إلغاء حفظ الحساب على هذا الجهاز"
              >
                <Trash2 className="w-3 h-3" />
                <span>إزالة هذا الجهاز</span>
              </button>
            </div>
          </div>
        ) : (
          /* MANUAL LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم (اليوزر)
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة السر (الباسورد)
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                dir="ltr"
              />
            </div>

            {/* Remember Device Checkbox */}
            <div>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberThisDevice}
                  onChange={(e) => setRememberThisDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-black/40 border-white/20 accent-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-200 block">
                    تذكر هذا الجهاز والدخول التلقائي دائماً 📱
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    سيتعرف الموقع على جهازك ويدخلك مباشرة بدون طلب الباسورد كل مرة
                  </span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95 shadow-lg mt-2`}
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            {savedDevice && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualLogin(false)}
                  className="text-xs text-amber-400 hover:underline cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>العودة للدخول السريع لجهاز ({savedDevice.user.displayName})</span>
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            المتابعة كزائر واستعراض القطاعات
          </button>
        </div>

      </div>
    </div>
  );
};

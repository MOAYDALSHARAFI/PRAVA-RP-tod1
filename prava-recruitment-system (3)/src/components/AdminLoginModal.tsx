import React, { useState } from 'react';
import { Lock, X, Sparkles, KeyRound, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userDisplayName: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('prava2026');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autofilledNotice, setAutofilledNotice] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.displayName || '12465');
      onClose();
    } catch (err) {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('prava2026');
    setAutofilledNotice(true);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-md bg-[#0f1219] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 text-right"
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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">دخول الإدارة</h3>
            <p className="text-xs text-slate-400">ادخل باليوزر وكلمة السر</p>
          </div>
        </div>

        {/* Quick autofill helper badge (matching screenshot 6) */}
        {autofilledNotice && (
          <div 
            onClick={handleQuickFill}
            className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-5 cursor-pointer hover:bg-emerald-500/15 transition-colors"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>تم إدخال بيانات المالك الافتراضية: admin / prava2026</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اليوزر
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              كلمة السر
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#080a0f] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} mt-4 active:scale-95`}
          >
            {isLoading ? 'جاري التحقق...' : 'دخول'}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <button
            onClick={handleQuickFill}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-semibold cursor-pointer"
          >
            أول مرة؟ إعداد حساب المالك
          </button>
        </div>

      </div>
    </div>
  );
};

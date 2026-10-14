import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Palette, ExternalLink, Check, ChevronDown, 
  UserCheck, User, LogOut, UserPlus, LogIn, Zap, Smartphone, Trash2,
  Layout, Sparkles
} from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext.tsx';
import { ThemeId, UserAccount, ServerSettings } from '../types.ts';
import { getSavedDeviceProfile, DeviceProfile } from '../utils/deviceAuth.ts';

interface NavbarProps {
  onOpenAdmin: () => void;
  currentUser: UserAccount | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: (forgetDevice?: boolean) => void;
  onQuickDeviceLogin?: () => void;
  onGoHome: () => void;
  serverSettings: ServerSettings;
  onOpenChangelog?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAdmin, 
  currentUser, 
  onOpenAuth, 
  onLogout, 
  onQuickDeviceLogin,
  onGoHome, 
  serverSettings,
  onOpenChangelog
}) => {
  const { theme, themeId, setThemeId, designStyle, setDesignStyle } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [savedDevice, setSavedDevice] = useState<DeviceProfile | null>(null);

  // Read saved device status
  useEffect(() => {
    setSavedDevice(getSavedDeviceProfile());
  }, [currentUser]);

  const isStaff = currentUser && currentUser.role !== 'applicant';
  const isOwner = currentUser && (currentUser.role === 'owner' || currentUser.username === 'admin');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#090b0e]/85 border-b border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Zone */}
        <button 
          onClick={onGoHome}
          className="flex items-center gap-3 group text-right transition-transform active:scale-95 text-inherit cursor-pointer"
        >
          <div className="relative">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${theme.borderClass} ${theme.glowClass} transition-all duration-300 bg-black`}>
              <img 
                src={serverSettings.serverLogo || "/src/assets/images/prava_main_emblem_1791840349389.jpg"} 
                alt="PRAVA Emblem" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#090b0e]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-white group-hover:text-amber-400 transition-colors font-['Plus_Jakarta_Sans',sans-serif]">
                PRAVA
              </span>
              {onOpenChangelog && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChangelog();
                  }}
                  title="مكان وسجل التحديثات: الإصدار V16.4"
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer group/ver"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>V16.4</span>
                  <span className="hidden sm:inline text-[9px] text-amber-400/80 font-normal group-hover/ver:underline">التحديثات</span>
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              منصة التوظيف الموحدة
            </span>
          </div>
        </button>

        {/* Action Controls & Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Server Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{serverSettings.serverName || 'سيرفر PRAVA'} متصل</span>
          </div>

          {/* Theme Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-all cursor-pointer"
              title="تغيير المظهر والألوان"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
              <span className="hidden sm:inline">{theme.nameAr}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showThemeMenu && (
              <div 
                className="absolute left-0 mt-2 w-80 sm:w-88 rounded-2xl bg-[#0d1017]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 space-y-3"
                onMouseLeave={() => setShowThemeMenu(false)}
              >
                {/* 1. Design Style Selector (3 Styles Side-by-Side: Modern, Classic, Apex) */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold px-1 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-amber-400" />
                      نمط التصميم:
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">
                      {designStyle === 'apex' ? 'التكتيكي الميداني' : designStyle === 'modern' ? 'الحديث الفاخر' : 'الكلاسيكي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {/* Modern */}
                    <button
                      type="button"
                      onClick={() => setDesignStyle('modern')}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        designStyle === 'modern'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>الحديث</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5">رادار تفاعلي</span>
                    </button>

                    {/* Classic */}
                    <button
                      type="button"
                      onClick={() => setDesignStyle('classic')}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        designStyle === 'classic'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-400" />
                        <span>الكلاسيكي</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5">هادئ وبسيط</span>
                    </button>

                    {/* Apex */}
                    <button
                      type="button"
                      onClick={() => setDesignStyle('apex')}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer relative overflow-hidden ${
                        designStyle === 'apex'
                          ? 'bg-gradient-to-b from-amber-500/25 to-emerald-500/20 text-amber-200 border border-amber-400/60 shadow-md shadow-amber-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span className="font-bold text-emerald-300">التكتيكي</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-normal mt-0.5">ميداني مصفح</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10" />

                {/* 2. Color Theme Selector */}
                <div>
                  <div className="text-[11px] text-slate-300 px-1 font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                      لون الهوية (السمة):
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">{theme.nameAr}</span>
                  </div>

                  <div className="space-y-1">
                    {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
                      const t = THEMES[tId];
                      const isSelected = themeId === tId;
                      return (
                        <button
                          key={tId}
                          type="button"
                          onClick={() => {
                            setThemeId(tId);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-right transition-colors cursor-pointer ${
                            isSelected ? 'bg-white/10 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0" 
                              style={{ backgroundColor: t.accentColor }}
                            />
                            <span>{t.nameAr}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" style={{ color: t.accentColor }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Discord Button */}
          <a
            href={serverSettings.discordUrl || "https://discord.gg/prava"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#8ea1e1] hover:text-white border border-[#5865F2]/40 text-xs font-semibold transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ديسكورد</span>
          </a>

          {/* User Profile / Auth Area */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs font-bold ${
                  isStaff
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.displayName}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({currentUser.roleTitle})</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute left-0 mt-2 w-60 rounded-xl bg-[#12161f] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="p-2 border-b border-white/5 mb-1 text-right">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{currentUser.displayName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5" />
                        جهاز معتمد
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono mt-0.5">@{currentUser.username} · {currentUser.roleTitle}</div>
                    {currentUser.gameId && (
                      <div className="text-[10px] text-slate-400 mt-1">آيدي اللعبة: {currentUser.gameId}</div>
                    )}
                  </div>

                  {isStaff && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenAdmin();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer text-right mb-1"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>فتح لوحة التحكم والإدارة</span>
                    </button>
                  )}

                  {/* Smart Logout Options */}
                  <div className="pt-1 border-t border-white/5">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-right"
                      title="تسجيل خروج مؤقت مع إبقاء الجهاز محفوظاً للدخول بضغطة واحدة"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-400" />
                      <div className="text-right">
                        <div>تسجيل الخروج</div>
                        <div className="text-[9px] text-slate-400 font-normal">مع إبقاء تذكر هذا الجهاز للدخول السريع</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-right mt-0.5"
                      title="مسح بيانات الحساب نهائياً من هذا المتصفح"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>إلغاء تذكر هذا الجهاز تماماً</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Visitor / Guest Auth Buttons */
            <div className="flex items-center gap-2">
              
              {/* If recognized device exists, show instant 1-click quick login */}
              {savedDevice?.user?.displayName && (
                <button
                  onClick={() => {
                    if (onQuickDeviceLogin) {
                      onQuickDeviceLogin();
                    } else {
                      onOpenAuth('login');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-amber-600/20 hover:from-amber-500/35 hover:to-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95"
                  title={`دخول فوري مباشر بضغطة زر كـ ${savedDevice.user.displayName}`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
                  <span className="hidden sm:inline">دخول سريع</span>
                  <span>({savedDevice.user.displayName})</span>
                </button>
              )}

              <button
                onClick={() => onOpenAuth('register')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${theme.buttonClass} shadow-md`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب</span>
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>دخول</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

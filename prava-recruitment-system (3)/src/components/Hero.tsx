import React from 'react';
import { Users, Shield, Sparkles, CheckCircle2, Zap, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sector, ServerSettings } from '../types.ts';

interface HeroProps {
  sectors: Sector[];
  serverSettings: ServerSettings;
}

export const Hero: React.FC<HeroProps> = ({ sectors, serverSettings }) => {
  const { theme, designStyle } = useTheme();
  const openCount = sectors.filter((s) => s.isOpen).length;

  return (
    <div className="relative pt-10 pb-14 overflow-hidden text-center">
      {/* Background ambient lighting */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: theme.accentColor }}
      />

      <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col items-center">
        
        {/* Emblem Showcase */}
        <div className="relative mb-7 group cursor-pointer">
          {designStyle === 'apex' ? (
            /* Apex V16.4 Emblem Chassis with Laser Scanner & Octagonal Chassis */
            <div className="relative">
              {/* Outer tech HUD brackets */}
              <div className="absolute -inset-8 border border-amber-500/30 rounded-3xl pointer-events-none flex items-center justify-between p-2">
                <span className="text-[9px] font-mono text-amber-400/70">HUD_SYS</span>
                <span className="text-[9px] font-mono text-emerald-400/70">SPEC_OPS</span>
              </div>
              <div className="absolute -inset-12 rounded-full border border-dashed border-emerald-500/20 spin-slow pointer-events-none" />
              <div className="absolute -inset-4 rounded-full blur-3xl opacity-60 bg-amber-500/30 pointer-events-none" />

              {/* Octagonal Frame Container */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 p-2 bg-gradient-to-b from-[#131926] via-[#090d14] to-black border-2 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] rounded-3xl transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                {/* Laser scanner line passing through */}
                <div className="laser-scanner-line" />
                
                {/* Tactical grid background inside */}
                <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-inner bg-black border border-white/10">
                  <img 
                    src={serverSettings.serverLogo || "/src/assets/images/prava_main_emblem_1791840349389.jpg"} 
                    alt="PRAVA Grand Emblem" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle crosshair watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                    <div className="w-16 h-16 border border-amber-400/40 rounded-full" />
                    <div className="absolute w-24 h-[1px] bg-amber-400/30" />
                    <div className="absolute h-24 w-[1px] bg-amber-400/30" />
                  </div>
                </div>

                {/* Tactical Status Badge */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#05070a] border border-amber-400 text-[10px] font-mono font-black text-amber-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap z-30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>APEX CORE · متصل</span>
                </div>
              </div>
            </div>
          ) : designStyle === 'modern' ? (
            <>
              {/* Outer dashed tech orbital ring */}
              <div className="absolute -inset-10 rounded-full border border-dashed border-amber-500/20 spin-slow pointer-events-none" />
              {/* Concentric radar rings */}
              <div className="absolute -inset-6 rounded-full border border-amber-500/25 radar-ring pointer-events-none" />
              <div className="absolute -inset-14 rounded-full border border-amber-500/10 reverse-spin-slow pointer-events-none" />
              
              {/* Radial ambient glow */}
              <div 
                className="absolute -inset-6 rounded-full blur-3xl opacity-50 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 pointer-events-none"
                style={{ backgroundColor: theme.accentColor }}
              />

              {/* Emblem Container with smooth tilt & scale on hover */}
              <div className={`relative w-40 h-40 sm:w-52 sm:h-52 rounded-full p-2.5 border-2 ${theme.borderClass} ${theme.glowClass} bg-[#07090e] shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-amber-500/30 ring-1 ring-white/10`}>
                <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-black">
                  <img 
                    src={serverSettings.serverLogo || "/src/assets/images/prava_main_emblem_1791840349389.jpg"} 
                    alt="PRAVA Grand Emblem" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {/* Live Tactical Status Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#090c12]/95 backdrop-blur-md border border-amber-500/50 text-[10px] font-mono font-bold text-amber-300 shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>المنظومة المركزية · متصل</span>
                </div>
              </div>
            </>
          ) : (
            /* Classic Clean Emblem */
            <div className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full p-2 border-2 ${theme.borderClass} bg-[#0a0d13] shadow-lg`}>
              <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-black">
                <img 
                  src={serverSettings.serverLogo || "/src/assets/images/prava_main_emblem_1791840349389.jpg"} 
                  alt="PRAVA Emblem" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Small Kicker Pill - Changed to بوابة التوظيف */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-slate-200 mb-4 transition-all duration-300 hover:border-amber-400/40 hover:scale-105 shadow-sm">
          <span className="w-2 h-2 rounded-full animate-ping bg-amber-400" />
          <span className="text-amber-400">بوابة التوظيف</span>
          <span className="text-slate-600">·</span>
          <span>{serverSettings.serverName || 'PRAVA'}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-3">
          {designStyle === 'apex' ? (
            <>
              منظومة عمليات{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400 font-['Plus_Jakarta_Sans',sans-serif] tracking-wider drop-shadow-lg">
                PRAVA
              </span>
            </>
          ) : (
            <>
              قطاعات{' '}
              <span 
                className="bg-clip-text text-transparent bg-gradient-to-r font-['Plus_Jakarta_Sans',sans-serif] tracking-wider drop-shadow-md"
                style={{ 
                  backgroundImage: `linear-gradient(to right, #ffffff, ${theme.accentColor}, #ffffff)` 
                }}
              >
                PRAVA
              </span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 font-medium max-w-2xl mb-7 leading-relaxed text-center">
          منصة التجنيد المعتمدة لتقديم طلبات الالتحاق بالخدمة العسكرية، وفرز نخبة الجنود لتعزيز الأمن وفرض النظام في الميدان.
        </p>

        {/* Metric Cards - Apex Chamfered Modules vs Modern HUD vs Classic Clean */}
        {designStyle === 'apex' ? (
          /* APEX CHAMFERED TELEMETRY MODULES */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mb-4">
            
            {/* Module 1 */}
            <div className="apex-chamfer-card p-4 flex flex-col justify-between text-right relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  RECRUIT // ACTIVE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">{openCount} قطاعات تستقبل الآن</div>
                  <div className="text-[11px] text-slate-400 font-medium">الفرز الفوري والآلي للطلبات</div>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full w-[85%]" />
              </div>
            </div>

            {/* Module 2 */}
            <div className="apex-chamfer-card p-4 flex flex-col justify-between text-right relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  CORE // ACTIVE
                </span>
                <Award className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">نظام التقديم الذكي الميداني</div>
                  <div className="text-[11px] text-slate-400 font-medium">اختبار تخصصي من 4 محاور</div>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-[100%]" />
              </div>
            </div>

            {/* Module 3 */}
            <div className="apex-chamfer-card p-4 flex flex-col justify-between text-right relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  COMMS // DISCORD
                </span>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-white">إشعار القيادة الفوري</div>
                  <div className="text-[11px] text-slate-400 font-medium">تكامل كامل مع ديسكورد PRAVA</div>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[95%]" />
              </div>
            </div>

          </div>
        ) : designStyle === 'modern' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-3xl mb-4">
            
            {/* Metric 1 */}
            <div className="hud-corner-card bg-gradient-to-b from-[#0d1017]/95 to-[#080b10]/95 hover:from-[#121620] hover:to-[#0d1017] border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 group text-right">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-all shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{openCount} قطاعات تستقبل</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">تقديم فوري ومباشر</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="hud-corner-card bg-gradient-to-b from-[#0d1017]/95 to-[#080b10]/95 hover:from-[#121620] hover:to-[#0d1017] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 group text-right">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">نظام التقديم الذكي</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">فحص واختبار بـ 4 مراحل</div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="hud-corner-card bg-gradient-to-b from-[#0d1017]/95 to-[#080b10]/95 hover:from-[#121620] hover:to-[#0d1017] border border-white/10 hover:border-blue-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 group text-right">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">إشعار القيادة الفوري</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">ربط ديسكورد ومسؤول القبول</div>
              </div>
            </div>

          </div>
        ) : (
          <div className="inline-flex items-center gap-3 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full mb-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {openCount} قطاعات متاحة للتقديم
            </span>
            <span className="text-white/20">·</span>
            <span>بوابة التوظيف المعتمدة</span>
          </div>
        )}

      </div>
    </div>
  );
};

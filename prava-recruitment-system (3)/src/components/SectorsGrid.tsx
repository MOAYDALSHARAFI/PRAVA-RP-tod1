import React, { useState } from 'react';
import { Lock, ArrowLeft, Shield, Eye, Compass, Fingerprint, Award, MessageSquare, Sparkles, ChevronLeft } from 'lucide-react';
import { Sector } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface SectorsGridProps {
  sectors: Sector[];
  onSelectSector: (sector: Sector) => void;
  onContactLeadership: () => void;
}

export const SectorsGrid: React.FC<SectorsGridProps> = ({
  sectors,
  onSelectSector,
  onContactLeadership,
}) => {
  const { theme, designStyle } = useTheme();
  const [filter, setFilter] = useState<'all' | 'open'>('all');

  const filteredSectors = filter === 'open' 
    ? sectors.filter((s) => s.isOpen) 
    : sectors;

  // Icon mapping helper
  const getSectorIcon = (id: string) => {
    switch (id) {
      case 'swat':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'public_security':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'cid':
        return <Fingerprint className="w-5 h-5 text-emerald-400" />;
      case 'gs':
        return <Eye className="w-5 h-5 text-purple-400" />;
      case 'border_guard':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      default:
        return <Shield className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header with Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-bold text-slate-400">
              قائمة القطاعات والتشكيلات
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            اختر قطاعك وانطلق في مسارك
          </h2>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            جميع القطاعات <span className="text-[10px] opacity-75 font-mono">({sectors.length})</span>
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'open'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            المتاحة للتقديم <span className="text-[10px] opacity-75 font-mono">({sectors.filter(s => s.isOpen).length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Banner Card - "P. خطوتك القادمة تصنع الفرق" */}
        <div className={`p-7 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 ${
          designStyle === 'apex'
            ? 'apex-chamfer-card border-amber-500/40 hover:border-amber-400 shadow-xl shadow-amber-500/5'
            : `bg-gradient-to-br from-[#121622] via-[#0c0f16] to-[#080a0e] border border-amber-500/25 hover:border-amber-500/50 rounded-2xl hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10 ${designStyle === 'modern' ? 'hud-corner-card' : ''}`
        }`}>
          {/* Subtle Golden Spotlight on Hover */}
          <div 
            className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundColor: theme.accentColor }}
          />

          {/* Tactical Crosshair Notch in Corner - Modern & Apex */}
          {(designStyle === 'modern' || designStyle === 'apex') && (
            <div className="absolute top-4 left-4 text-[10px] font-mono text-amber-500/70 flex items-center gap-1.5 pointer-events-none">
              <span>[+]</span>
              <span>{designStyle === 'apex' ? 'APEX_TERMINAL' : 'SEC_COMMAND'}</span>
            </div>
          )}

          <div>
            <div className="text-4xl font-black text-amber-500 font-['Plus_Jakarta_Sans',sans-serif] mb-4 group-hover:scale-105 transition-transform origin-right">
              P.
            </div>
            <h3 className="text-2xl font-black text-white leading-tight mb-2.5">
              خطوتك القادمة<br />تصنع الفرق.
            </h3>
            <p className="text-xs text-slate-300/90 leading-relaxed font-normal">
              انضم لنخبة الضباط والكوادر القيادية في سيرفر PRAVA وكن جزءاً من منظومة الأمن والعمليات الخاصة الميدانية.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <button
              onClick={onContactLeadership}
              className={`w-full py-3 px-4 rounded-xl inline-flex items-center justify-between text-xs font-bold transition-all duration-300 cursor-pointer ${
                designStyle === 'apex'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10'
              }`}
            >
              <span>تواصل مع رئاسة قطاعك</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Sectors mapping */}
        {filteredSectors.map((sector) => {
          return (
            <div
              key={sector.id}
              className={`p-6 flex flex-col justify-between transition-all duration-300 relative border group ${
                designStyle === 'apex'
                  ? 'apex-chamfer-card'
                  : `rounded-2xl ${designStyle === 'modern' ? 'hud-corner-card' : ''}`
              } ${
                sector.isOpen
                  ? (designStyle === 'apex'
                      ? 'border-amber-500/30 hover:border-amber-400/80 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20'
                      : designStyle === 'modern'
                        ? 'bg-gradient-to-b from-[#0e121a]/95 to-[#090c12]/95 hover:from-[#131824] hover:to-[#0c1017] border-white/10 hover:border-amber-500/50 hover:-translate-y-2 shadow-xl hover:shadow-2xl hover:shadow-amber-500/15'
                        : 'bg-[#0c0f16] hover:bg-[#10141d] border-white/10 hover:border-white/25 hover:-translate-y-0.5 shadow-md')
                  : 'bg-[#090b0e]/90 border-white/5 opacity-75 hover:opacity-90 hover:border-white/10'
              }`}
            >
              {/* Top Accent Glow Line on Hover for Apex and Modern Mode */}
              {sector.isOpen && (
                <div className={`absolute top-0 inset-x-0 h-[2px] transition-opacity duration-500 ${
                  designStyle === 'apex'
                    ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500 opacity-60 group-hover:opacity-100'
                    : designStyle === 'modern'
                      ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-0 group-hover:opacity-100'
                      : 'hidden'
                }`} />
              )}

              {/* Subtle ambient light gradient on card top */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white/[0.02] to-transparent rounded-t-2xl pointer-events-none group-hover:from-amber-500/[0.05] transition-colors duration-300" />

              {/* Card Header */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  {/* Status Indicator */}
                  {sector.isOpen ? (
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>متاح للتقديم الفوري</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-slate-400">
                      <Lock className="w-3 h-3 text-slate-500" />
                      <span>التقديم مغلق مؤقتاً</span>
                    </div>
                  )}

                  {/* Badge or Icon with Interactive Hover Micro-Animation */}
                  {sector.badge ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/15 bg-black/60 shadow-lg group-hover:scale-110 group-hover:rotate-3 group-hover:border-amber-400/60 transition-all duration-300">
                      <img 
                        src={sector.badge} 
                        alt={sector.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 group-hover:border-amber-400/60 group-hover:bg-amber-500/10 transition-all duration-300 shadow-md">
                      {getSectorIcon(sector.id)}
                    </div>
                  )}
                </div>

                {/* Tag & Sector Name */}
                <div className="text-[10px] font-mono text-amber-500/80 tracking-wider mb-1 flex items-center gap-1.5">
                  <span>PRAVA</span>
                  <span className="text-slate-600">/</span>
                  <span className="uppercase">{sector.id}</span>
                </div>

                <h3 className="text-2xl font-black text-white mb-1.5 group-hover:text-amber-300 transition-colors duration-200">
                  {sector.name}
                </h3>

                <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed mb-4">
                  {sector.subtitle}
                </p>

                {/* Tactical Sector Details Tags (Unit, Age, Roles) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-slate-400 flex items-center justify-between">
                    <span>بادئة اليونت:</span>
                    <span className="font-mono font-bold text-amber-400">{sector.unitPrefix || 'M-'}</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-slate-400 flex items-center justify-between">
                    <span>العمر الأدنى:</span>
                    <span className="font-mono font-bold text-white">{sector.minAge || 17}+</span>
                  </div>
                </div>
              </div>

              {/* Card Footer / Action */}
              <div className="pt-4 mt-4 border-t border-white/5 relative z-10">
                {sector.isOpen ? (
                  <button
                    onClick={() => onSelectSector(sector)}
                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all duration-300 cursor-pointer active:scale-[0.98] group/btn ${
                      designStyle === 'apex'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-mono font-black border border-amber-300/80 shadow-lg shadow-amber-500/25 shimmer-effect'
                        : `bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 hover:border-amber-500 shadow-md hover:shadow-lg hover:shadow-amber-500/20 ${designStyle === 'modern' ? 'shimmer-effect' : ''}`
                    }`}
                  >
                    <span>تقديم طلب الآن</span>
                    <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/btn:-translate-x-1.5 text-current" />
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-white/[0.02] border border-white/5 cursor-not-allowed">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>التقديم مغلق حالياً</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
};

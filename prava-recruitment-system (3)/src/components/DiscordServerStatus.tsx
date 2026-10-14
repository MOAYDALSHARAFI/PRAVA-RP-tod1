import React, { useState, useEffect } from 'react';
import { Radio, Users, Shield, ExternalLink, Activity, Wifi } from 'lucide-react';
import { ServerSettings } from '../types.ts';

interface DiscordServerStatusProps {
  serverSettings: ServerSettings;
}

export const DiscordServerStatus: React.FC<DiscordServerStatusProps> = ({ serverSettings }) => {
  // Dynamic online count that simulates active Discord operational members
  // Base count starts around 246 and fluctuates slightly to reflect real military comms traffic
  const [onlineCount, setOnlineCount] = useState<number>(() => {
    return 248 + Math.floor(Math.random() * 9) - 4;
  });
  const [isPinging, setIsPinging] = useState(false);

  useEffect(() => {
    // Subtle organic fluctuations every 12 seconds to reinforce active military comms feel
    const interval = setInterval(() => {
      setIsPinging(true);
      setTimeout(() => setIsPinging(false), 800);
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
        const next = prev + delta;
        return next < 210 ? 215 : next > 295 ? 285 : next;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const discordUrl = serverSettings.discordUrl || 'https://discord.gg/prava';
  const serverName = serverSettings.serverName || 'سيرفر PRAVA';

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0c1017] via-[#0f141f] to-[#0a0d14] border border-amber-500/20 hover:border-amber-500/40 p-5 sm:p-6 shadow-xl transition-all duration-300 group">
        
        {/* Subtle Ambient Laser Backlight */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tactical Header Line */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
          
          {/* Status Label with Tactical Radar Pulse */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              {/* Radar Pulse Rings */}
              <span className="absolute w-full h-full rounded-xl bg-emerald-400/20 animate-ping opacity-60 pointer-events-none" />
              <Radio className={`w-5 h-5 ${isPinging ? 'scale-110 text-emerald-300' : ''} transition-transform duration-300`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-400 tracking-wider">
                  SERVER STATUS // حالة السيرفر
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>نشط ومتاح 24/7</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                غرفة العمليات المركزية والاتصال المباشر عبر ديسكورد {serverName}
              </p>
            </div>
          </div>

          {/* Discord CTA Button */}
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2] border border-[#5865F2]/40 hover:border-[#5865F2] text-[#9ba5ff] hover:text-white text-xs font-bold transition-all duration-300 shadow-md group/btn active:scale-95"
          >
            <svg className="w-4 h-4 fill-current transition-transform group-hover/btn:scale-110" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>انضمام لديسكورد PRAVA</span>
            <ExternalLink className="w-3.5 h-3.5 text-current opacity-70" />
          </a>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Metric 1: Online Military Personnel */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                المتواجدين الآن
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {onlineCount}
              </span>
              <span className="text-[10px] text-slate-400">عضو نشط</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 font-mono mt-1">
              ● غرف العمليات والتنسيق
            </div>
          </div>

          {/* Metric 2: Comms Protocol Status */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Wifi className="w-3.5 h-3.5 text-amber-400" />
                الاتصال والشبكة
              </span>
              <span className="text-[9px] font-mono text-amber-400/80">LIVE</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                18ms
              </span>
              <span className="text-[10px] text-slate-400">زمن الاستجابة</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              خوادم الرياض / الشرق الأوسط
            </div>
          </div>

          {/* Metric 3: Security & Encryption */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                التأمين الميداني
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-cyan-300">
                الحالة ALPHA
              </span>
            </div>
            <div className="text-[10px] text-cyan-500/80 font-mono mt-1">
              نظام فرز وتشفير معتمد
            </div>
          </div>

          {/* Metric 4: Direct Voice Channels */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                قنوات التوجيه
              </span>
              <span className="text-[9px] font-mono text-emerald-400">جاهز</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-white">
                رومات التجنيد
              </span>
            </div>
            <div className="text-[10px] text-purple-400/80 font-mono mt-1">
              استقبال المقابلات الرسمية
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { X, Sparkles, Shield, CheckCircle2, History, Zap, Radio, Lock } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-[#0d1017] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden text-right"
        dir="rtl"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-96 h-28 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif]">
                مكان وسجل التحديثات
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                الإصدار الحالي V16.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              التحديثات والترقيات البرمجية المعتمدة لمنظومة PRAVA العسكرية
            </p>
          </div>
        </div>

        {/* Version V16.4 Card */}
        <div className="bg-[#121622]/90 border border-amber-500/30 rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">إصدار المنظومة التكتيكية</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/40">
                V16.4
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              أحدث ترقية معتمدة
            </span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">إضافة مؤشر Server Status التفاعلي:</span> عرض حي لحالة السيرفر وعدد المتواجدين في ديسكورد PRAVA في الفوتر بنبض راداري عسكري.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">النمط التكتيكي المتقدم (Apex Style):</span> تصميم عسكري بمؤثر مسح ليزري وإطارات مصفحة بجانب النمط الحديث والكلاسيكي.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">تنظيم عرض رقم الإصدار:</span> حصر ظهور رقم النسخة V16.4 في مكان التحديثات الرسمي وإزالته من العناوين والبطاقات الأخرى.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">تحديث مسمى وبوابة التوظيف المعتمدة:</span> منصة التجنيد المعتمدة لتقديم طلبات الالتحاق بالخدمة العسكرية وفرز نخبة الجنود.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">حماية وتشفير الصلاحيات:</span> تشفير المنظومة وفق بروتوكولات الأمان العسكري وتوثيق الحقوق الرسمية لـ ABU IBRAHIM.
              </div>
            </li>
          </ul>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5">
          <span>منظومة العمليات والتحكم المركزي © PRAVA</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};

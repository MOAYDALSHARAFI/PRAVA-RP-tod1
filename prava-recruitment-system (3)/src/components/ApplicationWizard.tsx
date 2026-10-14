import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Copy, Check, 
  ExternalLink, Upload, Image as ImageIcon, X, ShieldAlert, Award, 
  Lock, Unlock, Settings2, LogIn, UserPlus
} from 'lucide-react';
import { Sector, Application, UserAccount } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface ApplicationWizardProps {
  sector: Sector;
  currentUser: UserAccount | null;
  onBackToSectors: () => void;
  onSubmitSuccess: (newApp: Application) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  sector,
  currentUser,
  onBackToSectors,
  onSubmitSuccess,
  onOpenAuth,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedRole, setCopiedRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  // Unit Prefix: default from sector or 'M-'
  const [unitPrefix, setUnitPrefix] = useState<string>(sector.unitPrefix || 'M-');
  const canCustomizePrefix = currentUser?.permissions?.canEditUnitPrefix || currentUser?.role === 'owner';
  const [isUnitUnlocked, setIsUnitUnlocked] = useState<boolean>(false);

  // Form State: Applicant fields start empty for applicant to enter, ONLY acceptanceOfficer comes from account if officer
  const [formData, setFormData] = useState({
    discordId: '',
    playerName: '',
    fullName: '',
    gameId: '',
    militaryNo: '',
    age: '',
    gender: 'ذكر',
    acceptanceOfficer: (currentUser && (currentUser.role === 'officer' || currentUser.role === 'leader'))
      ? currentUser.displayName
      : '',
    currentUnit: '',
  });

  // When militaryNo changes and unit is not manually locked, auto-format currentUnit:
  // e.g. militaryNo = "15" -> currentUnit = "M-15"
  useEffect(() => {
    if (!isUnitUnlocked) {
      if (formData.militaryNo.trim()) {
        setFormData((prev) => ({
          ...prev,
          currentUnit: `${unitPrefix}${prev.militaryNo.trim()}`,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          currentUnit: `${unitPrefix}00`,
        }));
      }
    }
  }, [formData.militaryNo, unitPrefix, isUnitUnlocked]);

  // Quiz Answers (index per question)
  const [quizAnswers, setQuizAnswers] = useState<number[]>(
    new Array(sector.questions.length).fill(-1)
  );

  // Attachments (Base64 or image previews)
  const [rolesProofImg, setRolesProofImg] = useState<string>('');
  const [uniformImg, setUniformImg] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Image Upload
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (data: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation
  const ageNum = Number(formData.age);
  const isAgeValid = formData.age.trim().length > 0 && !isNaN(ageNum) && ageNum >= (sector.minAge || 17);
  const isStep1Valid = 
    formData.discordId.trim().length > 0 &&
    formData.playerName.trim().length > 0 &&
    formData.fullName.trim().length > 0 &&
    formData.gameId.trim().length > 0 &&
    formData.militaryNo.trim().length > 0 &&
    formData.gender.trim().length > 0 &&
    isAgeValid;

  const answeredCount = quizAnswers.filter((a) => a !== -1).length;
  const isStep2Valid = answeredCount === sector.questions.length;

  // Calculate Quiz Score
  const calculateScore = () => {
    let score = 0;
    sector.questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  // Generate Discord Role Request text
  const generateRoleText = () => {
    let template = sector.rolesTemplate || '';
    const unitCode = formData.currentUnit || `${unitPrefix}${formData.militaryNo || '00'}`;
    template = template
      .replace(/M-{militaryNo}/g, unitCode)
      .replace(/{militaryNo}/g, formData.militaryNo || '0000')
      .replace(/{currentUnit}/g, unitCode)
      .replace(/{unit}/g, unitCode)
      .replace(/{gameId}/g, formData.gameId || '000')
      .replace(/{playerName}/g, formData.playerName || 'اسم اللاعب')
      .replace(/{name}/g, formData.fullName || 'الاسم الكامل')
      .replace(/{discord}/g, formData.discordId || '000000000000000000');
    return template;
  };

  const copyRoleRequest = () => {
    navigator.clipboard.writeText(generateRoleText());
    setCopiedRole(true);
    setTimeout(() => setCopiedRole(false), 2500);
  };

  // Final Submit
  const handleSubmitApplication = async () => {
    if (!currentUser) {
      alert('يجب تسجيل الدخول أو إنشاء حساب لإرسال طلب التقديم');
      onOpenAuth('login');
      return;
    }

    setIsSubmitting(true);
    try {
      const score = calculateScore();
      const payload = {
        sectorId: sector.id,
        sectorName: sector.name,
        playerName: formData.playerName,
        fullName: formData.fullName,
        discordId: formData.discordId,
        gameId: formData.gameId,
        age: Number(formData.age),
        militaryNo: formData.militaryNo,
        gender: formData.gender,
        currentUnit: formData.currentUnit,
        acceptanceOfficer: formData.acceptanceOfficer,
        answers: quizAnswers,
        score,
        totalQuestions: sector.questions.length,
        rolesProofImg,
        uniformImg,
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('فشل إرسال الطلب');
      }

      const data: Application = await res.json();
      setSubmittedApp(data);
      onSubmitSuccess(data);
    } catch {
      setSubmitError('حدث خطأ أثناء إرسال الطلب، يرجى التحقق من اتصالك وإعادة المحاولة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: If not logged in, require login / register to apply!
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">
          تسجيل الدخول مطلوب للتقديم على قطاع {sector.name}
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          لضمان متابعة حالة طلبك واعتماده رسمياً، يجب تسجيل الدخول أو إنشاء حسابك أولاً قبل تعبئة الاستمارة.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass} flex items-center justify-center gap-2`}
          >
            <UserPlus className="w-4 h-4" />
            <span>إنشاء حساب جديد</span>
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            onClick={onBackToSectors}
            className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            العودة للقطاعات
          </button>
        </div>
      </div>
    );
  }

  // Success view
  if (submittedApp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2">
          تم إرسال طلبك بنجاح!
        </h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
          تم تسجيل طلبك في منظومة PRAVA للتوظيف الموحد وتم إدراجه للمراجعة والتدقيق لدى قيادة قطاع {sector.name}.
        </p>

        <div className="bg-[#10141d] border border-white/10 rounded-2xl p-6 text-right max-w-lg mx-auto mb-8 shadow-2xl">
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">رقم الطلب المرجعي:</span>
            <span className="font-mono font-bold text-amber-400">{submittedApp.id}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">القطاع المستهدف:</span>
            <span className="font-bold text-white">{sector.name} ({sector.arabicName})</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">اليونت المعتمد:</span>
            <span className="font-mono font-bold text-amber-400">{submittedApp.currentUnit}</span>
          </div>
          {submittedApp.acceptanceOfficer && (
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
              <span className="text-slate-400">مسؤول القبول:</span>
              <span className="font-bold text-white">{submittedApp.acceptanceOfficer}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3 text-xs">
            <span className="text-slate-400">نتيجة التقييم:</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {submittedApp.score} من {submittedApp.totalQuestions} إجابات صحيحة
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">حالة الطلب:</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {submittedApp.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onBackToSectors}
            className={`px-6 py-3 rounded-xl text-xs font-bold ${theme.buttonClass} transition-all cursor-pointer`}
          >
            العودة للقطاعات الرئيسية
          </button>
          {sector.discordRoomUrl && (
            <a
              href={sector.discordRoomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>التوجه لروم ديسكورد</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={onBackToSectors}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span>القطاعات</span>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-wider text-slate-400">
            {sector.name}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 pb-4 border-b border-white/5">
        
        {/* Step 1 */}
        <div 
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            currentStep === 1
              ? `bg-white/10 ${theme.borderClass} text-white`
              : isStep1Valid
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400 opacity-80'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 1 ? 'bg-amber-500 text-black' : isStep1Valid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {isStep1Valid && currentStep > 1 ? <Check className="w-4 h-4" /> : '01'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">الملف الشخصي</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 1 ? 'قيد التعبئة' : isStep1Valid ? 'مكتمل' : 'بانتظار الإكمال'}
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div 
          onClick={() => isStep1Valid && setCurrentStep(2)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 2
              ? `bg-white/10 ${theme.borderClass} text-white`
              : isStep2Valid
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 2 ? 'bg-amber-500 text-black' : isStep2Valid ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {isStep2Valid && currentStep > 2 ? <Check className="w-4 h-4" /> : '02'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">التقييم</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 2 ? 'قيد التعبئة' : isStep2Valid ? 'مكتمل' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div 
          onClick={() => isStep1Valid && isStep2Valid && setCurrentStep(3)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid && isStep2Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 3
              ? `bg-white/10 ${theme.borderClass} text-white`
              : rolesProofImg && uniformImg
              ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 3 ? 'bg-amber-500 text-black' : rolesProofImg && uniformImg ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {rolesProofImg && uniformImg && currentStep > 3 ? <Check className="w-4 h-4" /> : '03'}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">المرفقات والأدوار</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 3 ? 'قيد التعبئة' : rolesProofImg && uniformImg ? 'مكتمل' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div 
          onClick={() => isStep1Valid && isStep2Valid && setCurrentStep(4)}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            isStep1Valid && isStep2Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          } ${
            currentStep === 4
              ? `bg-white/10 ${theme.borderClass} text-white`
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
            currentStep === 4 ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            04
          </div>
          <div className="text-right">
            <div className="text-xs font-bold">مراجعة الطلب</div>
            <div className="text-[10px] text-slate-400">
              {currentStep === 4 ? 'قيد التعبئة' : 'بانتظار المرحلة السابقة'}
            </div>
          </div>
        </div>

      </div>

      {/* STEP 1: Personal Profile */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Requirements Card on Left */}
          <div className="lg:col-span-4 bg-[#0f141d] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4 pb-3 border-b border-white/5">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-extrabold text-white text-base">شروط التوظيف</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>أن لا يقل العمر عن {sector.minAge || 17} سنة</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>حسن السيرة والسلوك والانضباط الميداني</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>مايك جيد وواضح وتواصل مستمر</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>الأهلية التامة للانضمام إلى قطاع {sector.name}</span>
              </div>
            </div>

            {/* Validation Indicator */}
            <div className="mt-8 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`w-2 h-2 rounded-full ${isStep1Valid ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={isStep1Valid ? 'text-emerald-400' : 'text-amber-400'}>
                  {isStep1Valid ? 'بيانات المتقدم مكتملة وجاهزة' : 'بيانات المتقدم غير مكتملة'}
                </span>
              </div>
            </div>

            {/* Auto Unit Info Box */}
            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block mb-1">نظام توليد اليونت الآلي:</span>
              يتم إنشاء رمز اليونت تلقائياً بالبادئة المعتمدة للقطاع (<code className="text-amber-400 font-bold">{unitPrefix}</code>) متبوعة بالرقم العسكري مباشرة.
            </div>
          </div>

          {/* Form Fields on Right */}
          <div className="lg:col-span-8 bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  المرحلة 01 / 04
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  الملف الشخصي للمتقدم
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Discord ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Discord ID أو المنشن <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="discordId"
                  value={formData.discordId}
                  onChange={handleInputChange}
                  placeholder="123456789012345678"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono text-left"
                />
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اسم اللاعب <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleInputChange}
                  placeholder="اسمك داخل اللعبة"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اسم المتقدم <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="الاسم الكامل"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Game ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  هوية المتقدم داخل اللعبة (Game ID) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="gameId"
                  value={formData.gameId}
                  onChange={handleInputChange}
                  placeholder="الهوية الرقمية"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              {/* Age */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    العمر <span className="text-amber-400">*</span>
                  </label>
                  {formData.age && !isAgeValid && (
                    <span className="text-[10px] text-red-400 font-bold">
                      الحد الأدنى للعمر {sector.minAge || 17}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="17"
                  min="14"
                  max="70"
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#090b10] border text-white focus:outline-none text-xs font-mono ${
                    formData.age && !isAgeValid ? 'border-red-500' : 'border-white/10 focus:border-amber-400'
                  }`}
                />
              </div>

              {/* Military Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  الرقم العسكري <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  name="militaryNo"
                  value={formData.militaryNo}
                  onChange={handleInputChange}
                  placeholder="مثال: 15"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  الجنس <span className="text-amber-400">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white focus:outline-none focus:border-amber-400 text-xs cursor-pointer"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              {/* Acceptance Officer (The only field coming from account if officer, or filled by applicant) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  مسؤول القبول (اختياري)
                </label>
                <input
                  type="text"
                  name="acceptanceOfficer"
                  value={formData.acceptanceOfficer}
                  onChange={handleInputChange}
                  placeholder="اسم مسؤول القبول إن وجد"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              {/* Current Unit (Automatic Generation: M-15) */}
              <div className="sm:col-span-2 bg-[#090b10] border border-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <span>اليونت (يتولد تلقائياً: {unitPrefix} + الرقم العسكري)</span>
                    <span className="text-amber-400">*</span>
                  </label>

                  {/* Prefix Customizer for Authorized Leaders / Admins */}
                  {canCustomizePrefix && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">تعديل البادئة (صلاحية خاصة):</span>
                      <input
                        type="text"
                        value={unitPrefix}
                        onChange={(e) => setUnitPrefix(e.target.value)}
                        placeholder="M-"
                        className="w-16 px-2 py-0.5 rounded bg-black/60 border border-amber-500/40 text-amber-300 font-mono text-xs text-center focus:outline-none"
                        title="تغيير البادئة المعتمدة لليونت"
                      />
                      <button
                        type="button"
                        onClick={() => setIsUnitUnlocked(!isUnitUnlocked)}
                        className="p-1 rounded bg-white/5 text-slate-400 hover:text-white"
                        title={isUnitUnlocked ? "قفل التوليد الآلي" : "فتح التعديل اليدوي"}
                      >
                        {isUnitUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    name="currentUnit"
                    value={formData.currentUnit}
                    readOnly={!canCustomizePrefix && !isUnitUnlocked}
                    onChange={handleInputChange}
                    placeholder="M-15"
                    className={`w-full px-4 py-2.5 rounded-xl font-mono text-xs border text-white ${
                      !canCustomizePrefix && !isUnitUnlocked
                        ? 'bg-black/50 border-white/5 text-amber-300 font-bold cursor-not-allowed'
                        : 'bg-black border-amber-500/40 text-white focus:outline-none'
                    }`}
                  />
                  {!canCustomizePrefix && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[11px] text-slate-500 pointer-events-none">
                      <Lock className="w-3 h-3" />
                      <span>توليد آلي محمي</span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  مثال: بمجرد كتابة الرقم العسكري <span className="text-amber-400 font-mono">15</span> يظهر اليونت تلقائياً كـ <span className="text-amber-400 font-mono">{unitPrefix}15</span> (الصلاحية تقتصر على القادة لتعديل البادئة).
                </div>
              </div>

            </div>

            {/* Step 1 Actions */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                جميع الحقول مطلوبة ما عدا مسؤول القبول
              </span>
              <button
                disabled={!isStep1Valid}
                onClick={() => setCurrentStep(2)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isStep1Valid
                    ? theme.buttonClass
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* STEP 2: Acceptance Quiz Test */}
      {currentStep === 2 && (
        <div className="max-w-4xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-5 border-b border-white/5">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1">
                المرحلة 02 / 04
              </span>
              <h3 className="text-2xl font-black text-white">
                تقييم القبول
              </h3>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>تمت الإجابة عن {answeredCount} من {sector.questions.length} أسئلة</span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {sector.questions.map((q, idx) => {
              const selectedOption = quizAnswers[idx];
              return (
                <div 
                  key={q.id}
                  className="bg-[#090b10] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                    <span className="text-amber-400 font-mono">0{idx + 1}</span>
                    <span>{q.question}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[idx] = optIdx;
                            setQuizAnswers(newAnswers);
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all text-right cursor-pointer ${
                            isChosen
                              ? `bg-amber-500/10 ${theme.borderClass} text-white`
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChosen ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                          }`}>
                            {isChosen && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step 2 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              disabled={!isStep2Valid}
              onClick={() => setCurrentStep(3)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isStep2Valid
                  ? theme.buttonClass
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: Attachments & Discord Roles */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              المرحلة 03 / 04
            </span>
            <h3 className="text-2xl font-black text-white">
              المرفقات وطلب الرولات
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Image Uploads */}
            <div className="space-y-6">
              
              {/* Proof of Roles Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  إثبات إعطاء الرولات <span className="text-amber-400">*</span>
                </label>
                
                {rolesProofImg ? (
                  <div className="relative rounded-xl border border-white/15 overflow-hidden group">
                    <img 
                      src={rolesProofImg} 
                      alt="Proof" 
                      className="w-full h-40 object-cover" 
                    />
                    <button
                      onClick={() => setRolesProofImg('')}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#090b10] hover:bg-[#0c0f16] transition-all">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-200 mb-1">اختيار صورة</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WEBP - حتى 5 MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, setRolesProofImg)}
                    />
                  </label>
                )}
              </div>

              {/* Uniform Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  صورة الزي الرسمي <span className="text-amber-400">*</span>
                </label>
                
                {uniformImg ? (
                  <div className="relative rounded-xl border border-white/15 overflow-hidden group">
                    <img 
                      src={uniformImg} 
                      alt="Uniform" 
                      className="w-full h-40 object-cover" 
                    />
                    <button
                      onClick={() => setUniformImg('')}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 text-red-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#090b10] hover:bg-[#0c0f16] transition-all">
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-200 mb-1">اختيار صورة</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WEBP - حتى 5 MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, setUniformImg)}
                    />
                  </label>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                ملاحظة: يمكنك إكمال الطلب ورفعه حتى لو لم ترفق الصور الآن إذا لم تتوفر لديك مؤقتاً.
              </div>

            </div>

            {/* Right Column: Discord Roles Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">طلب الرولات المنسق</span>
                <span className="text-[10px] text-slate-400">جاهز للنسخ والإرسال</span>
              </div>

              <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed min-h-[190px] whitespace-pre-wrap select-all mb-4" dir="ltr">
                {generateRoleText()}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={copyRoleRequest}
                  className={`flex-1 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    copiedRole
                      ? 'bg-emerald-500 text-black'
                      : theme.buttonClass
                  }`}
                >
                  {copiedRole ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم نسخ الطلب!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الطلب</span>
                    </>
                  )}
                </button>

                <a
                  href={sector.discordRoomUrl || "https://discord.gg/prava"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white border border-[#5865F2]/40 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-[#5865F2]" />
                  <span>مكان إرسال الرسالة (روم الرولات)</span>
                </a>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                الإرسال يتم يدوياً في ديسكورد. إرفاق الصور هنا لا يرسلها إلى مسؤول القبول مباشرة ما لم تقم بنسخ نص الطلب وإرساله في الروم المخصص.
              </p>
            </div>

          </div>

          {/* Step 3 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              onClick={() => setCurrentStep(4)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
            >
              <span>التالي لمراجعة الطلب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {currentStep === 4 && (
        <div className="max-w-4xl mx-auto bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <div className="mb-6 pb-4 border-b border-white/5">
            <span className="text-[11px] font-mono text-slate-400 block mb-1">
              المرحلة 04 / 04
            </span>
            <h3 className="text-2xl font-black text-white">
              مراجعة وتأكيد إرسال الطلب
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-xs">
            
            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">القطاع:</span>
              <span className="font-bold text-white text-sm">{sector.name} ({sector.arabicName})</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">اسم اللاعب / الهوية الرقمية:</span>
              <span className="font-bold text-white text-sm">{formData.playerName} (ID: {formData.gameId})</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">الاسم الكامل / العمر:</span>
              <span className="font-bold text-white text-sm">{formData.fullName} - {formData.age} سنة</span>
            </div>

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
              <span className="text-slate-400 block mb-1">الرقم العسكري / اليونت الآلي:</span>
              <span className="font-bold text-amber-400 text-sm font-mono">{formData.militaryNo} | اليونت: {formData.currentUnit}</span>
            </div>

            {formData.acceptanceOfficer && (
              <div className="bg-[#090b10] p-4 rounded-xl border border-white/5 sm:col-span-2">
                <span className="text-slate-400 block mb-1">مسؤول القبول:</span>
                <span className="font-bold text-white text-sm">{formData.acceptanceOfficer}</span>
              </div>
            )}

            <div className="bg-[#090b10] p-4 rounded-xl border border-white/5 sm:col-span-2 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-1">نتيجة اختبار القبول التلقائي:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {calculateScore()} من {sector.questions.length} إجابات صحيحة
                </span>
              </div>
              <Award className="w-6 h-6 text-amber-400" />
            </div>

          </div>

          {submitError && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold text-center">
              {submitError}
            </div>
          )}

          {/* Step 4 Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <button
              disabled={isSubmitting}
              onClick={handleSubmitApplication}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} active:scale-95`}
            >
              {isSubmitting ? (
                <span>جاري إرسال الطلب...</span>
              ) : (
                <>
                  <span>إرسال الطلب نهائياً</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

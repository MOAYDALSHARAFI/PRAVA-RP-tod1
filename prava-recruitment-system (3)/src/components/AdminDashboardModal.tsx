import React, { useState, useEffect } from 'react';
import { 
  Lock, X, LogOut, CheckCircle2, XCircle, Search, Filter, 
  Download, Eye, Image as ImageIcon, Save, RefreshCw, Sliders, 
  Users, ShieldCheck, ChevronDown, Check, ExternalLink, UserPlus,
  Trash2, ShieldAlert, KeyRound, Upload, Sparkles, Edit3, Settings,
  FileCheck, Shield, Award, Terminal, MessageSquare, Send, Bot, Radio, EyeOff,
  HardDrive, Archive, Crown, FileCode, Copy, CheckCheck, FolderArchive, Layers
} from 'lucide-react';
import { Sector, Application, LoginLog, UserAccount, ServerSettings, UserPermissions, UserRole } from '../types.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { safeFetchJson } from '../utils/api.ts';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => void;
  sectors: Sector[];
  onUpdateSector: (updatedSector: Sector) => void;
  serverSettings: ServerSettings;
  onUpdateServerSettings: (updatedSettings: ServerSettings) => void;
}

// Initial full default permissions template
const defaultPermissions: UserPermissions = {
  canViewApps: true,
  canAcceptApps: true,
  canRejectApps: true,
  canDeleteApps: false,
  canExportApps: true,
  canAddNotes: true,
  canToggleSector: false,
  canEditSectorInfo: false,
  canEditRolesTemplate: false,
  canEditUnitPrefix: false,
  canEditQuestions: false,
  canChangeServerLogo: false,
  canChangeDiscordLinks: false,
  canConfigureWebhooks: false,
  canViewAuditLogs: true,
  canManageAccounts: false,
  canAssignPermissions: false,
  canCreateRecruitmentOfficers: false,
  allowedSectors: ['swat'],
};

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  sectors,
  onUpdateSector,
  serverSettings,
  onUpdateServerSettings,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'applications' | 'leaders' | 'settings' | 'logs' | 'owner'>('applications');

  // Owner Package Download & Sync State
  interface PackageInfo {
    exists: boolean;
    filename: string;
    sizeFormatted: string;
    sizeBytes: number;
    lastModified: string;
    downloadUrl: string;
    keyFiles: string[];
  }
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isRebuildingPackage, setIsRebuildingPackage] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);
  const [inspectingFile, setInspectingFile] = useState<string | null>(null);
  const [inspectingContent, setInspectingContent] = useState<string>('');
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [hasCopiedFile, setHasCopiedFile] = useState(false);
  
  // Data state
  const [applications, setApplications] = useState<Application[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search & filter for applications
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'قيد المراجعة' | 'مقبول' | 'مرفوض'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  
  // Detail preview modal for a single application
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Sector Settings Editable State
  const [editableSectors, setEditableSectors] = useState<Sector[]>(sectors);
  const [savingSectorId, setSavingSectorId] = useState<string | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Server Settings state
  const [editableSettings, setEditableSettings] = useState<ServerSettings>(serverSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  // Discord Webhook & Bot Test State
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordTestResult, setDiscordTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingSectorId, setTestingSectorId] = useState<string | null>(null);
  const [showBotToken, setShowBotToken] = useState(false);

  // Add / Edit User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: 'leader' as UserRole,
    roleTitle: 'قائد قطاع',
    gameId: '',
    discordUsername: '',
    permissions: { ...defaultPermissions } as UserPermissions,
  });

  // Initialize editable sectors and settings when the modal opens.
  // CRITICAL: We do NOT overwrite editableSettings or editableSectors on every background polling tick.
  // This prevents the text from disappearing while the user is actively typing in webhook URLs, channel IDs, or templates!
  useEffect(() => {
    if (isOpen) {
      setEditableSectors(sectors);
      setEditableSettings(serverSettings);
    }
  }, [isOpen]);

  // Fetch applications, logs, and users safely
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appsRes, logsRes, usersRes] = await Promise.all([
        safeFetchJson<Application[]>('/api/applications'),
        safeFetchJson<LoginLog[]>('/api/logs'),
        safeFetchJson<UserAccount[]>('/api/users'),
      ]);
      if (appsRes) setApplications(appsRes);
      if (logsRes) setLogs(logsRes);
      if (usersRes) setUsers(usersRes);
    } catch {
      // Silently keep current state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const isOwner = currentUser && (currentUser.role === 'owner' || currentUser.username === 'admin');

  // Fetch package info for Owner Tab
  const fetchPackageInfo = async () => {
    try {
      const res = await safeFetchJson<PackageInfo>('/api/owner/package-info');
      if (res) setPackageInfo(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'owner' || isOwner)) {
      fetchPackageInfo();
    }
  }, [isOpen, activeTab]);

  // Rebuild / refresh project package on demand
  const handleRebuildPackage = async () => {
    setIsRebuildingPackage(true);
    setRebuildMsg(null);
    try {
      const res = await fetch('/api/owner/rebuild-package', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.package) {
          setPackageInfo(data.package);
        }
        setRebuildMsg('تم تحديث حزمة المشروع وإعادة ضغط أحدث الملفات بنجاح!');
        setTimeout(() => setRebuildMsg(null), 4000);
      } else {
        setRebuildMsg('حدث خطأ أثناء إعادة ضغط المشروع.');
      }
    } catch {
      setRebuildMsg('تعذر الاتصال بالسيرفر لإعادة البناء.');
    } finally {
      setIsRebuildingPackage(false);
    }
  };

  // Inspect raw single file content
  const handleInspectFile = async (fileName: string) => {
    setInspectingFile(fileName);
    setIsLoadingFileContent(true);
    setHasCopiedFile(false);
    try {
      const res = await fetch(`/api/owner/file-content?file=${encodeURIComponent(fileName)}`);
      if (res.ok) {
        const data = await res.json();
        setInspectingContent(data.content);
      } else {
        setInspectingContent('تعذر قراءة محتوى هذا الملف.');
      }
    } catch {
      setInspectingContent('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  // Download raw single file
  const handleDownloadSingleFile = (fileName: string) => {
    window.location.href = `/api/owner/file-content?file=${encodeURIComponent(fileName)}&download=true`;
  };

  // Copy raw file content
  const handleCopyContent = () => {
    if (!inspectingContent) return;
    navigator.clipboard.writeText(inspectingContent);
    setHasCopiedFile(true);
    setTimeout(() => setHasCopiedFile(false), 2500);
  };

  if (!isOpen) return null;

  // Handle application status update (Accept / Reject)
  const handleUpdateAppStatus = async (
    appId: string, 
    newStatus: 'مقبول' | 'مرفوض' | 'قيد المراجعة',
    notes: string = ''
  ) => {
    try {
      const reviewerName = currentUser.displayName || currentUser.username || 'مسؤول التوظيف';
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          reviewerNotes: notes,
          acceptanceOfficer: newStatus === 'مقبول' ? reviewerName : undefined,
          officerGameId: currentUser.gameId || '000',
          officerName: reviewerName,
        }),
      });
      if (res.ok) {
        const updated: Application = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === appId ? updated : a)));
        if (selectedApp?.id === appId) {
          setSelectedApp(updated);
        }
        setSavedSuccessMsg(`تم تحديث حالة الطلب إلى (${newStatus}) وتوثيق مسؤول القبول: ${reviewerName}`);
        setTimeout(() => setSavedSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export applications to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) return;
    const headers = ['رقم الطلب', 'القطاع', 'اسم اللاعب', 'الاسم الكامل', 'الديسكورد', 'الهوية', 'العمر', 'الرقم العسكري', 'اليونت', 'الدرجة', 'الحالة', 'تاريخ التقديم'];
    const rows = applications.map((a) => [
      a.id,
      a.sectorName,
      `"${a.playerName}"`,
      `"${a.fullName}"`,
      a.discordId,
      a.gameId,
      a.age,
      a.militaryNo,
      a.currentUnit,
      `${a.score}/${a.totalQuestions}`,
      a.status,
      new Date(a.createdAt).toLocaleString('ar-SA'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `طلبات_توظيف_PRAVA_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Sector Settings
  const handleSaveSector = async (sec: Sector) => {
    setSavingSectorId(sec.id);
    setSavedSuccessMsg(null);
    try {
      const res = await fetch(`/api/sectors/${sec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sec),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateSector(updated);
        setSavedSuccessMsg(`تم حفظ إعدادات ${sec.name} وبادئة اليونت (${sec.unitPrefix || 'M-'}) بنجاح!`);
        setTimeout(() => setSavedSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('فشل حفظ إعدادات القطاع');
    } finally {
      setSavingSectorId(null);
    }
  };

  // Save Server Settings (Logo & Discord URL & Senior Officers)
  const handleSaveServerSettings = async (customSettingsToSave?: ServerSettings | unknown) => {
    const toSave = customSettingsToSave && typeof customSettingsToSave === 'object' && 'serverLogo' in customSettingsToSave
      ? (customSettingsToSave as ServerSettings)
      : editableSettings;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
      if (res.ok) {
        const updated = await res.json();
        setEditableSettings(updated);
        onUpdateServerSettings(updated);
        setSavedSuccessMsg('تم حفظ وتحديث إعدادات السيرفر والديسكورد وكبار الضباط بنجاح!');
        setTimeout(() => setSavedSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
      alert('فشل حفظ إعدادات السيرفر');
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Discord Webhook or Bot
  const handleTestDiscord = async (params: { 
    webhookUrl?: string; 
    botToken?: string; 
    channelId?: string; 
    sectorId?: string;
    customMessage?: string;
    isSenior?: boolean;
  }) => {
    setIsTestingDiscord(true);
    if (params.sectorId) setTestingSectorId(params.sectorId);
    setDiscordTestResult(null);

    try {
      const defaultMsg = params.sectorId 
        ? `🚨 تجربة إرسال إشعار قطاع (${params.sectorId}) من منصة PRAVA للتوظيف الموحد` 
        : `🔔 **تجربة اتصال ناجحة مع ديسكورد من منصة PRAVA للتوظيف الموحد!**\nتم ضبط وتفعيل الربط بنجاح.`;

      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: params.webhookUrl,
          botToken: params.botToken,
          channelId: params.channelId,
          message: params.customMessage || defaultMsg,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscordTestResult({ success: true, message: data.message || 'تم إرسال الرسالة التجريبية إلى ديسكورد بنجاح!' });
      } else {
        setDiscordTestResult({ success: false, message: data.error || 'فشل إرسال التجربة، يرجى التأكد من صحة الرابط أو التوكن.' });
      }
    } catch (err: any) {
      setDiscordTestResult({ success: false, message: 'تعذر الاتصال بالخادم لاختبار الديسكورد.' });
    } finally {
      setIsTestingDiscord(false);
      setTestingSectorId(null);
    }
  };

  // Quick Preset Handlers
  const applyPreset = (preset: 'all' | 'leader' | 'officer') => {
    if (preset === 'all') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'owner',
        roleTitle: 'مشرف عام / نائب مالك',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: true,
          canExportApps: true,
          canAddNotes: true,
          canToggleSector: true,
          canEditSectorInfo: true,
          canEditRolesTemplate: true,
          canEditUnitPrefix: true,
          canEditQuestions: true,
          canChangeServerLogo: true,
          canChangeDiscordLinks: true,
          canConfigureWebhooks: true,
          canViewAuditLogs: true,
          canManageAccounts: true,
          canAssignPermissions: true,
          canCreateRecruitmentOfficers: true,
          allowedSectors: ['*'],
        },
      }));
    } else if (preset === 'leader') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'leader',
        roleTitle: 'قائد قطاع',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: false,
          canExportApps: true,
          canAddNotes: true,
          canToggleSector: true,
          canEditSectorInfo: true,
          canEditRolesTemplate: true,
          canEditUnitPrefix: true,
          canEditQuestions: true,
          canChangeServerLogo: false,
          canChangeDiscordLinks: false,
          canConfigureWebhooks: true,
          canViewAuditLogs: true,
          canManageAccounts: false,
          canAssignPermissions: false,
          canCreateRecruitmentOfficers: true,
          allowedSectors: prev.permissions.allowedSectors || ['swat'],
        },
      }));
    } else if (preset === 'officer') {
      setUserFormData((prev) => ({
        ...prev,
        role: 'officer',
        roleTitle: 'ضابط قبول وتجنيد',
        permissions: {
          canViewApps: true,
          canAcceptApps: true,
          canRejectApps: true,
          canDeleteApps: false,
          canExportApps: false,
          canAddNotes: true,
          canToggleSector: false,
          canEditSectorInfo: false,
          canEditRolesTemplate: false,
          canEditUnitPrefix: false,
          canEditQuestions: false,
          canChangeServerLogo: false,
          canChangeDiscordLinks: false,
          canConfigureWebhooks: false,
          canViewAuditLogs: false,
          canManageAccounts: false,
          canAssignPermissions: false,
          canCreateRecruitmentOfficers: false,
          allowedSectors: prev.permissions.allowedSectors || ['*'],
        },
      }));
    }
  };

  // Open modal to Create new user
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserFormData({
      username: '',
      password: '',
      displayName: '',
      role: 'leader',
      roleTitle: 'قائد قطاع',
      gameId: '',
      discordUsername: '',
      permissions: { ...defaultPermissions },
    });
    setIsUserModalOpen(true);
  };

  // Open modal to Edit existing user
  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUserId(user.id);
    setUserFormData({
      username: user.username,
      password: '', // blank unless changing
      displayName: user.displayName,
      role: user.role,
      roleTitle: user.roleTitle,
      gameId: user.gameId || '',
      discordUsername: user.discordUsername || '',
      permissions: {
        ...defaultPermissions,
        ...(user.permissions || {}),
      },
    });
    setIsUserModalOpen(true);
  };

  // Save or Create user account
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // Edit existing user
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: userFormData.displayName,
            role: userFormData.role,
            roleTitle: userFormData.roleTitle,
            gameId: userFormData.gameId,
            discordUsername: userFormData.discordUsername,
            permissions: userFormData.permissions,
            ...(userFormData.password ? { password: userFormData.password } : {}),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'فشل تحديث الحساب');
          return;
        }
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === editingUserId ? updated : u)));
        setSavedSuccessMsg(`تم تحديث صلاحيات حساب ${updated.displayName} بنجاح!`);
      } else {
        // Create new user
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userFormData),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'فشل إنشاء الحساب');
          return;
        }
        const created = await res.json();
        setUsers((prev) => [...prev, created]);
        setSavedSuccessMsg(`تم إنشاء حساب ${created.displayName} وتعيين الصلاحيات بنجاح!`);
      }

      setIsUserModalOpen(false);
      setTimeout(() => setSavedSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الحساب');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const err = await res.json();
        alert(err.error || 'فشل حذف الحساب');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Logo handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditableSettings((prev) => ({
          ...prev,
          serverLogo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Sector in allowedSectors array
  const toggleAllowedSector = (secId: string) => {
    setUserFormData((prev) => {
      let current = [...(prev.permissions.allowedSectors || [])];
      if (secId === '*') {
        return {
          ...prev,
          permissions: { ...prev.permissions, allowedSectors: ['*'] },
        };
      }
      current = current.filter((s) => s !== '*');
      if (current.includes(secId)) {
        current = current.filter((s) => s !== secId);
      } else {
        current.push(secId);
      }
      if (current.length === 0) current = ['*'];
      return {
        ...prev,
        permissions: { ...prev.permissions, allowedSectors: current },
      };
    });
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch = 
      app.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.militaryNo.includes(searchQuery) ||
      app.discordId.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || app.sectorId === sectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-5xl h-[92vh] bg-[#0c0f16] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:px-8 border-b border-white/10 flex items-center justify-between bg-[#090b10]">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className="font-black text-lg text-white">لوحة الإدارة والتحكم المتقدمة</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                مسجل باسم {currentUser.displayName} ({currentUser.roleTitle})
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-8 border-b border-white/10 bg-[#0c0f16] flex items-center justify-start gap-2 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'applications'
                ? theme.buttonClass
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            الطلبات ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('leaders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaders'
                ? theme.buttonClass
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            إدارة الحسابات وتحديد الصلاحيات ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? theme.buttonClass
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            الإعدادات والهوية واليونت
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? theme.buttonClass
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            سجل الدخول
          </button>

          {/* TAB 5: خاص بالاونر (Owner Exclusive) */}
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'owner'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/25 font-black ring-1 ring-amber-300'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>خاص بالاونر</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">

          {/* Global Success Banner */}
          {savedSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* TAB 1: Applications */}
          {activeTab === 'applications' && (
            <div className="space-y-5">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090b10] p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم أو الرقم العسكري أو الديسكورد..."
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="مقبول">مقبول</option>
                    <option value="مرفوض">مرفوض</option>
                  </select>

                  <select
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="all">كل القطاعات</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير</span>
                  </button>
                </div>
              </div>

              {/* Retention Note */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>يتم حفظ آخر 30 طلباً خلال الأسبوع وتحديث اليونت تلقائياً.</span>
                <span className="font-mono text-amber-400">{filteredApps.length} طلبات</span>
              </div>

              {/* Applications List */}
              {filteredApps.length === 0 ? (
                <div className="p-12 text-center bg-[#090b10] rounded-xl border border-white/5 text-slate-400 text-xs">
                  لا توجد طلبات تطابق معايير البحث والفرز حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-[#090b10] border border-white/5 hover:border-white/15 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-amber-400 font-mono text-xs shrink-0">
                          <span className="font-bold">{app.currentUnit || 'M-00'}</span>
                          <span className="text-[9px] text-slate-400 font-normal">اليونت</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm">{app.fullName}</span>
                            <span className="text-xs text-slate-400">({app.playerName})</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono">
                              {app.sectorName}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span>الرقم العسكري: <span className="font-mono text-white">{app.militaryNo}</span></span>
                            <span>·</span>
                            <span>الديسكورد: <span className="font-mono text-slate-300">{app.discordId}</span></span>
                            <span>·</span>
                            <span>النتيجة: <span className="text-emerald-400 font-bold">{app.score}/{app.totalQuestions}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          app.status === 'مقبول'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : app.status === 'مرفوض'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {app.status}
                        </span>

                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="عرض التفاصيل والمرفقات"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {app.status !== 'مقبول' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'مقبول')}
                            className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
                            title="قبول الطلب"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {app.status !== 'مرفوض' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, 'مرفوض')}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                            title="رفض الطلب"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Leaders and Granular Permissions Management */}
          {activeTab === 'leaders' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h4 className="font-extrabold text-white text-base">إدارة الحسابات وتحديد الصلاحيات الدقيقة</h4>
                  <p className="text-xs text-slate-400">
                    تحكم بالصلاحيات التفصيلية لكل قائد أو مسؤول توظيف (قبول/رفض، تعديل قطاعات، تعديل يونت، تغيير شعار، إنشاء حسابات).
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass} shadow-md`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ إضافة حساب / مسؤول توظيف جديد</span>
                </button>
              </div>

              {/* Accounts Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u) => {
                  const p = u.permissions || {};
                  return (
                    <div 
                      key={u.id}
                      className="p-5 rounded-2xl bg-[#090b10] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all space-y-4 shadow"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-base">{u.displayName}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-slate-400">
                              @{u.username}
                            </span>
                          </div>

                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.role === 'owner' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : u.role === 'leader'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {u.roleTitle}
                          </span>
                        </div>

                        {/* Extra metadata */}
                        <div className="text-xs text-slate-400 space-y-1 font-mono mb-3">
                          {u.gameId && <div>الآيدي داخل اللعبة: <span className="text-white">{u.gameId}</span></div>}
                          {u.discordUsername && <div>الديسكورد: <span className="text-white">{u.discordUsername}</span></div>}
                          <div>
                            القطاعات المصرح بها: {' '}
                            <span className="text-amber-400 font-bold">
                              {p.allowedSectors?.includes('*') ? 'كافة القطاعات (*)' : (p.allowedSectors || []).join('، ')}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Permissions Badges */}
                        <div className="pt-3 border-t border-white/5">
                          <span className="text-[10px] text-slate-500 block mb-1.5 font-bold">الصلاحيات المفعّلة:</span>
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {p.canAcceptApps && <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ قبول الطلبات</span>}
                            {p.canRejectApps && <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">✓ رفض الطلبات</span>}
                            {p.canDeleteApps && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ حذف الطلبات</span>}
                            {p.canExportApps && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ تصدير البيانات</span>}
                            {p.canToggleSector && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ فتح/إغلاق التقديم</span>}
                            {p.canEditUnitPrefix && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">✓ تعديل بادئة اليونت (M-)</span>}
                            {p.canEditRolesTemplate && <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">✓ تعديل قوالب الرولات</span>}
                            {p.canChangeServerLogo && <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">✓ تغيير شعار السيرفر</span>}
                            {p.canManageAccounts && <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">✓ إدارة الحسابات</span>}
                            {p.canCreateRecruitmentOfficers && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">⭐ إنشاء مسؤولي التوظيف</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Edit Permissions & Delete) */}
                      <div className="pt-3 flex items-center justify-between border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل الصلاحيات</span>
                        </button>

                        {u.role !== 'owner' && u.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: Settings & Identity */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              
              {/* SERVER IDENTITY SECTION */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                    <h4 className="font-extrabold text-white text-base">تخصيص هوية وشعار السيرفر</h4>
                  </div>
                  <span className="text-xs text-slate-400">تحديث فوري على كامل الموقع</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Current Logo Preview & Upload */}
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500/40 shadow-xl shrink-0 bg-black">
                      <img 
                        src={editableSettings.serverLogo} 
                        alt="Current Logo" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block mb-1">شعار السيرفر والمنصة</span>
                      <p className="text-[11px] text-slate-400 mb-3">الصورة التي تظهر في الهيدر والواجهة الرئيسية.</p>
                      
                      <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-slate-200 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>رفع صورة جديدة</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Logo URL Input & Server Name */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        أو ضع رابط صورة الشعار مباشرة (URL)
                      </label>
                      <input
                        type="text"
                        value={editableSettings.serverLogo}
                        onChange={(e) => setEditableSettings({ ...editableSettings, serverLogo: e.target.value })}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم السيرفر المعروض
                      </label>
                      <input
                        type="text"
                        value={editableSettings.serverName || ''}
                        onChange={(e) => setEditableSettings({ ...editableSettings, serverName: e.target.value })}
                        placeholder="سيرفر PRAVA"
                        className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* DISCORD INTEGRATION: WEBHOOK, BOT TOKEN, AND CHANNEL ID */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 space-y-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                  <div className="flex items-center gap-2.5 text-[#5865F2]">
                    <Bot className="w-5 h-5" />
                    <h4 className="font-extrabold text-white text-base">
                      ربط ديسكورد وبوت التوظيف (الهوك، توكن البوت، ومكان إرسال الرسالة)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    إرسال الإشعارات والطلبات تلقائياً إلى قنوات الديسكورد المحددة
                  </span>
                </div>

                {/* Test Result Toast/Banner */}
                {discordTestResult && (
                  <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    discordTestResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {discordTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{discordTestResult.message}</span>
                    </div>
                    <button 
                      onClick={() => setDiscordTestResult(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* 1. Global Webhook URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#5865F2]" />
                      <span>رابط الويب هوك العام (Discord Webhook URL)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.webhookUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, webhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      يتم إرسال إشعار فوري بكافة طلبات التقديم الجديدة مع التفاصيل لهذا الرابط.
                    </span>
                  </div>

                  {/* 2. Bot Token */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
                        <span>توكن بوت الديسكورد (Discord Bot Token)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowBotToken(!showBotToken)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {showBotToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showBotToken ? 'إخفاء التوكن' : 'إظهار التوكن'}</span>
                      </button>
                    </div>
                    <input
                      type={showBotToken ? 'text' : 'password'}
                      value={editableSettings.botToken || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, botToken: e.target.value })}
                      placeholder="MTA2NT... أو اتركه ليقرأ من .env (DISCORD_BOT_TOKEN)"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>توكن البوت لإرسال رسائل التوظيف عبر حساب البوت الرسمي.</span>
                      {editableSettings.botToken?.startsWith('•') && (
                        <span className="text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>محمي عبر .env</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-400/80 block mt-1">
                      🔒 أمان عالٍ: لن يتم حفظ التوكن في ملف db.json لمنع أي تسريب على GitHub. التوكن يُحفظ بأمان في ملف <code>.env</code>.
                    </span>
                  </div>

                  {/* 3. Bot Channel ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>مكان إرسال الرسالة (آيدي روم / قناة البوت)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.discordChannelId || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, discordChannelId: e.target.value })}
                      placeholder="مثال: 124578963214587965"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الآيدي الرقمي للروم الذي يرسل فيه البوت طلبات المتقدمين في الديسكورد.
                    </span>
                  </div>

                  {/* 4. Roles Channel URL / Discord Server Link */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>مكان إرسال الرسالة (رابط روم طلب الرولات في السيرفر)</span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.discordRoomUrl || editableSettings.discordUrl || ''}
                      onChange={(e) => setEditableSettings({ 
                        ...editableSettings, 
                        discordRoomUrl: e.target.value,
                        discordUrl: e.target.value || editableSettings.discordUrl 
                      })}
                      placeholder="https://discord.com/channels/... أو رابط السيرفر"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الرابط الذي يُفتح للمتقدم عند الضغط على "روم الرولات" في المرحلة 3.
                    </span>
                  </div>

                </div>

                {/* Actions & Test Button */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleTestDiscord({
                      webhookUrl: editableSettings.webhookUrl,
                      botToken: editableSettings.botToken,
                      channelId: editableSettings.discordChannelId,
                    })}
                    disabled={isTestingDiscord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] hover:text-white border border-[#5865F2]/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingDiscord && !testingSectorId ? 'جاري إرسال التجربة...' : 'تجربة إرسال رسالة إلى ديسكورد'}</span>
                  </button>

                  <button
                    onClick={handleSaveServerSettings}
                    disabled={savingSettings}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات ديسكورد والشعار'}</span>
                  </button>
                </div>
              </div>

              {/* SENIOR OFFICERS INTEGRATION & CUSTOM MESSAGE (مكان إرسال الرسالة لكبار الضباط وتخصيص نص الرسالة) */}
              <div className="bg-[#090b10] border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Award className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-white text-base">
                        مكان إرسال الرسالة لكبار الضباط وتخصيص نص رسالة التوظيف
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        يتم إرسال هذا الإشعار تلقائياً إلى شات كبار الضباط المخصص فور اعتماد وقبول أي متقدم
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveServerSettings()}
                      disabled={savingSettings}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
                    </button>
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold w-fit">
                      إشعار التوظيف المعتمد
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Senior Officers Webhook URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>مكان إرسال الرسالة: رابط ويب هوك شات كبار الضباط (Webhook URL)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.seniorOfficersWebhookUrl || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersWebhookUrl: e.target.value })}
                      onBlur={() => handleSaveServerSettings()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveServerSettings(); }}
                      placeholder="https://discord.com/api/webhooks/... (شات كبار الضباط)"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      الرابط المباشر لشات كبار الضباط لاستقبال رسائل التوظيف الفورية (يحفظ تلقائياً).
                    </span>
                  </div>

                  {/* Senior Officers Bot Channel ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>مكان إرسال الرسالة: آيدي روم كبار الضباط للبوت (Channel ID)</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={editableSettings.seniorOfficersChannelId || ''}
                      onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersChannelId: e.target.value })}
                      onBlur={() => handleSaveServerSettings()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveServerSettings(); }}
                      placeholder="مثال: 1556637676902547466"
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left transition-colors"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      إذا تم وضع توكن البوت، سيرسل البوت في هذا الشات تلقائياً (يحفظ تلقائياً).
                    </span>
                  </div>
                </div>

                {/* Message Template Customization */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>تخصيص صيغة ونص الرسالة المرسلة لكبار الضباط</span>
                    </label>
                    <span className="text-[10px] text-amber-300">
                      اضغط على أي متغير بالأسفل لإضافته داخل نص الرسالة:
                    </span>
                  </div>

                  {/* Variable insertion buttons */}
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    {[
                      { tag: '{applicantGameId}', label: 'آيدي المتقدم' },
                      { tag: '{officerGameId}', label: 'آيدي مسؤول التوظيف' },
                      { tag: '{officerName}', label: 'اسم مسؤول التوظيف' },
                      { tag: '{applicantName}', label: 'اسم المتقدم' },
                      { tag: '{sectorName}', label: 'اسم القطاع' },
                      { tag: '{unit}', label: 'اليونت (M-15)' },
                      { tag: '{militaryNo}', label: 'الرقم العسكري' },
                      { tag: '{discordId}', label: 'منشن الديسكورد' },
                    ].map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => {
                          const current = editableSettings.seniorOfficersMessageTemplate || '';
                          setEditableSettings({
                            ...editableSettings,
                            seniorOfficersMessageTemplate: current ? `${current} ${item.tag}` : item.tag,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-[11px] font-mono border border-white/10 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="text-amber-400 font-bold">+</span>
                        <span>{item.label}</span>
                        <code className="text-[10px] text-slate-400">({item.tag})</code>
                      </button>
                    ))}
                  </div>

                  {/* Template Textarea */}
                  <textarea
                    rows={4}
                    value={editableSettings.seniorOfficersMessageTemplate !== undefined 
                      ? editableSettings.seniorOfficersMessageTemplate 
                      : '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}'}
                    onChange={(e) => setEditableSettings({ ...editableSettings, seniorOfficersMessageTemplate: e.target.value })}
                    onBlur={() => handleSaveServerSettings()}
                    placeholder="اكتب نص الرسالة هنا..."
                    dir="rtl"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed transition-colors"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>يمكنك استخدام التنسيق العريض `**نص عريض**` والأيقونات والأسطر الجديدة (يحفظ تلقائياً).</span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTpl = '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';
                        const updated = { ...editableSettings, seniorOfficersMessageTemplate: defaultTpl };
                        setEditableSettings(updated);
                        handleSaveServerSettings(updated);
                      }}
                      className="text-amber-400 hover:underline cursor-pointer text-[10px]"
                    >
                      استعادة القالب الافتراضي وحفظه
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>معاينة شكل الرسالة كما ستصل لشات كبار الضباط في ديسكورد:</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      محاكاة بيانات حية
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#2b2d31] border border-white/5 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed select-none">
                    {(editableSettings.seniorOfficersMessageTemplate || '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}')
                      .replace(/{applicantGameId}/g, '2584')
                      .replace(/{officerGameId}/g, currentUser.gameId || '15')
                      .replace(/{officerName}/g, currentUser.displayName || 'مسؤول التوظيف')
                      .replace(/{applicantName}/g, 'فهد العتيبي')
                      .replace(/{sectorName}/g, 'SWAT')
                      .replace(/{unit}/g, `${editableSettings.defaultUnitPrefix || 'M-'}15`)
                      .replace(/{militaryNo}/g, '15')
                      .replace(/{discordId}/g, '@fahad_user')}
                  </div>
                </div>

                {/* Senior Officers Actions */}
                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveServerSettings();
                      const testTemplate = editableSettings.seniorOfficersMessageTemplate || 
                        '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}';
                      
                      const simulatedMsg = testTemplate
                        .replace(/{applicantGameId}/g, '2584 (تجربة)')
                        .replace(/{officerGameId}/g, currentUser.gameId || '15')
                        .replace(/{officerName}/g, currentUser.displayName || 'مسؤول التوظيف')
                        .replace(/{applicantName}/g, 'فهد العتيبي (متقدم تجريبي)')
                        .replace(/{sectorName}/g, 'SWAT')
                        .replace(/{unit}/g, `${editableSettings.defaultUnitPrefix || 'M-'}15`)
                        .replace(/{militaryNo}/g, '15')
                        .replace(/{discordId}/g, '@fahad_test');

                      handleTestDiscord({
                        webhookUrl: editableSettings.seniorOfficersWebhookUrl,
                        botToken: editableSettings.botToken,
                        channelId: editableSettings.seniorOfficersChannelId,
                        customMessage: simulatedMsg,
                        isSenior: true,
                      });
                    }}
                    disabled={isTestingDiscord}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingDiscord ? 'جاري إرسال التجربة...' : 'تجربة إرسال رسالة كبار الضباط'}</span>
                  </button>

                  <button
                    onClick={handleSaveServerSettings}
                    disabled={savingSettings}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات كبار الضباط'}</span>
                  </button>
                </div>
              </div>

              {/* SECTORS SETTINGS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-white text-base">إعدادات القطاعات وبادئة اليونت المخصصة</h4>
                  <span className="text-xs text-slate-400">يمكنك تعديل بادئة اليونت (M-) إلى (I-) أو ما يناسبك لكل قطاع</span>
                </div>

                {editableSectors.map((sec, idx) => (
                  <div 
                    key={sec.id}
                    className="bg-[#090b10] border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-white font-mono">{sec.name}</span>
                        <span className="text-xs text-slate-400">({sec.arabicName})</span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-semibold text-slate-300">
                          {sec.isOpen ? 'متاح للتقديم' : 'التقديم مغلق'}
                        </span>
                        <div 
                          onClick={() => {
                            const updated = [...editableSectors];
                            updated[idx] = { ...sec, isOpen: !sec.isOpen };
                            setEditableSectors(updated);
                          }}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            sec.isOpen ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-black transition-transform absolute top-0.5 ${
                            sec.isOpen ? 'left-0.5' : 'right-0.5'
                          }`} />
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم القطاع</label>
                        <input
                          type="text"
                          value={sec.name}
                          onChange={(e) => {
                            const updated = [...editableSectors];
                            updated[idx] = { ...sec, name: e.target.value };
                            setEditableSectors(updated);
                          }}
                          className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف القطاع</label>
                        <input
                          type="text"
                          value={sec.subtitle}
                          onChange={(e) => {
                            const updated = [...editableSectors];
                            updated[idx] = { ...sec, subtitle: e.target.value };
                            setEditableSectors(updated);
                          }}
                          className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>بادئة اليونت (مثلاً M- أو I-)</span>
                        </label>
                        <input
                          type="text"
                          value={sec.unitPrefix || 'M-'}
                          onChange={(e) => {
                            const updated = [...editableSectors];
                            updated[idx] = { ...sec, unitPrefix: e.target.value };
                            setEditableSectors(updated);
                          }}
                          placeholder="M-"
                          className="w-full px-4 py-2 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400 font-bold"
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          سيظهر اليونت تلقائياً: {sec.unitPrefix || 'M-'}15
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">نص الرسالة وقالب الرولات</label>
                      <textarea
                        rows={3}
                        value={sec.rolesTemplate}
                        onChange={(e) => {
                          const updated = [...editableSectors];
                          updated[idx] = { ...sec, rolesTemplate: e.target.value };
                          setEditableSectors(updated);
                        }}
                        dir="ltr"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Sector-specific Discord Webhook & Room Configuration */}
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                      <span className="text-xs font-bold text-amber-400 block flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        <span>إعدادات ديسكورد ومكان إرسال الرسالة لقطاع {sec.name}</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            رابط الويب هوك الخاص بقطاع {sec.name}
                          </label>
                          <input
                            type="text"
                            value={sec.webhookUrl || ''}
                            onChange={(e) => {
                              const updated = [...editableSectors];
                              updated[idx] = { ...sec, webhookUrl: e.target.value };
                              setEditableSectors(updated);
                            }}
                            placeholder="https://discord.com/api/webhooks/..."
                            dir="ltr"
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                          />
                          <span className="text-[9px] text-slate-500 block mt-0.5">اتركه فارغاً لاستخدام الهوك العام.</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            مكان إرسال الرسالة (روم رولات قطاع {sec.name})
                          </label>
                          <input
                            type="text"
                            value={sec.discordRoomUrl || ''}
                            onChange={(e) => {
                              const updated = [...editableSectors];
                              updated[idx] = { ...sec, discordRoomUrl: e.target.value };
                              setEditableSectors(updated);
                            }}
                            placeholder="https://discord.com/channels/..."
                            dir="ltr"
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                          />
                          <span className="text-[9px] text-slate-500 block mt-0.5">الرابط المباشر للروم في الديسكورد.</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            مكان إرسال الرسالة (آيدي قناة البوت للقطاع)
                          </label>
                          <input
                            type="text"
                            value={sec.discordChannelId || ''}
                            onChange={(e) => {
                              const updated = [...editableSectors];
                              updated[idx] = { ...sec, discordChannelId: e.target.value };
                              setEditableSectors(updated);
                            }}
                            placeholder="مثال: 124578963214587965"
                            dir="ltr"
                            className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-[11px] font-mono focus:outline-none focus:border-amber-400 text-left"
                          />
                          <span className="text-[9px] text-slate-500 block mt-0.5">آيدي روم إرسال الإشعار بالبوت.</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleTestDiscord({
                          webhookUrl: sec.webhookUrl || editableSettings.webhookUrl,
                          botToken: editableSettings.botToken,
                          channelId: sec.discordChannelId || editableSettings.discordChannelId,
                          sectorId: sec.name,
                        })}
                        disabled={isTestingDiscord}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] hover:text-white border border-[#5865F2]/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isTestingDiscord && testingSectorId === sec.name ? 'جاري إرسال التجربة...' : `تجربة إرسال إشعار قطاع ${sec.name}`}
                        </span>
                      </button>

                      <button
                        onClick={() => handleSaveSector(sec)}
                        disabled={savingSectorId === sec.id}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.buttonClass}`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingSectorId === sec.id ? 'جاري الحفظ...' : 'حفظ تعديلات القطاع والبادئة'}</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* SECTION: Quick Admin Guide & Instructions (شرح مختصر للتعليمات) */}
              <div className="bg-gradient-to-b from-[#121622] to-[#0a0d14] border border-amber-500/30 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                      <span>دليل التعليمات والإرشادات السريعة</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-normal">
                        دليل القيادة والتوظيف
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      شرح عملي ومختصر لكيفية تعديل الرسائل وقوالب الرولات، خطوات التوظيف، وإسناد الصلاحيات.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: How to edit messages */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                        <Terminal className="w-4 h-4 shrink-0" />
                        <span>1. تعديل رسائل الرولات</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                        يمكنك تعديل نص طلب الرول لكل قطاع في بطاقات القطاعات أعلاه:
                      </p>
                      
                      <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-0.5 text-[10px] font-mono text-slate-300">
                        <div><code className="text-amber-300">{"{militaryNo}"}</code>: الرقم العسكري</div>
                        <div><code className="text-amber-300">{"{unit}"}</code>: رمز اليونت (M-15)</div>
                        <div><code className="text-amber-300">{"{playerName}"}</code>: اسم اللاعب</div>
                        <div><code className="text-amber-300">{"{gameId}"}</code>: آيدي اللعبة</div>
                        <div><code className="text-amber-300">{"{discord}"}</code>: منشن الديسكورد</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      💡 اضغط <b className="text-amber-300">"حفظ تعديلات القطاع"</b> بعد التعديل لتطبيقها فوراً.
                    </div>
                  </div>

                  {/* Card 2: Recruitment workflow */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                        <FileCheck className="w-4 h-4 shrink-0" />
                        <span>2. خطوات التوظيف والاعتماد</span>
                      </div>
                      <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                        <li>
                          <span className="text-white font-semibold">دخول المتقدم:</span> يسجل حسابه ويختار القطاع.
                        </li>
                        <li>
                          <span className="text-white font-semibold">توليد اليونت:</span> يدخل رقمه العسكري ويظهر اليونت آلياً.
                        </li>
                        <li>
                          <span className="text-white font-semibold">إرسال الرول:</span> ينسخ الرسالة لروم الديسكورد ويرفق الصور.
                        </li>
                        <li>
                          <span className="text-white font-semibold">الاعتماد:</span> يدخل المسؤول لتبويب <b className="text-white">"الطلبات"</b> ويضغط <b className="text-emerald-400">"قبول"</b>.
                        </li>
                      </ol>
                    </div>

                    <div className="text-[10px] text-emerald-400/90 pt-2 border-t border-white/5 font-semibold">
                      ✓ يوثق اسم مسؤول القبول بالطلب فوراً!
                    </div>
                  </div>

                  {/* Card 3: Creating Recruiter Accounts */}
                  <div className="bg-[#090b10] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>3. إنشاء حسابات المسؤولين</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        لإنشاء حساب مسؤول توظيف جديد:
                      </p>
                      
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div>• توجه لتبويب <b>"قادة القطاعات / مسؤولو التوظيف"</b>.</div>
                        <div>• اضغط <b>"+ إضافة حساب / مسؤول توظيف جديد"</b>.</div>
                        <div>• اختر قالب <b>"ضابط قبول"</b> أو حدد الصلاحيات.</div>
                        <div>• فعّل: <b>صلاحية إنشاء وتعيين حساب مسؤول التوظيف</b> إذا رغبت.</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-2 border-t border-white/5">
                      🔑 يدخل المسؤول بحسابه مباشرة ويبدأ باستقبال الطلبات.
                    </div>
                  </div>

                  {/* Card 4: Senior Officers Messaging & Real-Time Sync */}
                  <div className="bg-[#090b10] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>4. رسائل كبار الضباط والتزامن</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        مكان إرسال الرسالة لكبار الضباط وتحديث الموقع:
                      </p>
                      
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div>• <b>شات كبار الضباط:</b> يُرسل إليه إشعار التوظيف فور قبول الطلب بصيغة مخصصة.</div>
                        <div>• <b>التزامن المباشر:</b> أي تعديل (فتح/إغلاق قطاع، هوك، رسائل) يُحفظ في الخادم ويتغير عند <b>جميع المستخدمين فوراً</b>.</div>
                        <div>• <b>خصوصية الحسابات:</b> لا يظهر حسابك لأي زائر غريب، فكل زائر له جلسته الخاصة.</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-300 pt-2 border-t border-white/5 font-semibold">
                      ⚡ جميع التعديلات حية وفورية لكافة الأجهزة.
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 5: System Operational Backup Archive - Owner Only */}
              {isOwner && (
                <div className="bg-[#090b10] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                      <HardDrive className="w-5 h-5 text-amber-400" />
                      <span>النسخ الاحتياطي وأرشفة بيانات المنظومة (System Operational Archive)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                      مشفر وآمن 🔒
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    توليد وحفظ حزمة النسخة الاحتياطية المشفرة للنظام محلياً (<code className="text-amber-400">prava-system-backup.zip</code>) لحماية قاعدة البيانات الميدانية، إعدادات السيرفر، وسجلات العمليات، وضمان استمرارية التشغيل ومزامنة المنظومة في حالات الطوارئ.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="text-[11px] text-slate-400">
                      💡 يشمل حفظ الإعدادات وقواعد البيانات وملفات التشغيل الكاملة في حزمة محلية مضغوطة.
                    </div>

                    <a
                      href={`/api/system-backup?key=${encodeURIComponent(currentUser?.username || 'admin')}`}
                      download="prava-system-backup.zip"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 hover:border-amber-500/40 transition-all shadow-sm cursor-pointer"
                    >
                      <Archive className="w-4 h-4 text-amber-400" />
                      <span>تصدير حزمة الأرشيف الاحتياطي (System Archive)</span>
                    </a>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: Login Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/5">
                <span>سجل عمليات الدخول التدقيقي</span>
                <span className="font-mono text-amber-400">{logs.length} عمليات مسجلة</span>
              </div>

              <div className="space-y-2 font-mono">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#090b10] border border-white/5 text-xs text-slate-300 hover:border-white/10 transition-colors"
                  >
                    <span className="text-slate-400">{log.timestamp} —</span>
                    <span className="font-bold text-white">{log.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Owner Exclusive (خاص بالاونر) */}
          {activeTab === 'owner' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Rebuild success message */}
              {rebuildMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in shadow-lg shadow-emerald-500/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{rebuildMsg}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded text-emerald-300 font-mono">
                    تم التحديث بنجاح
                  </span>
                </div>
              )}

              {/* Owner Command Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black border border-amber-500/30 p-6 sm:p-7 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0">
                      <Crown className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-black text-white">بوابة القيادة العليا — خاص بالاونر</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 tracking-wider">
                          EXCLUSIVE OWNER ACCESS
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        هذه الشاشة مخصصة لمالك المشروع حصرياً. يمكنك من هنا تحميل كامل ملفات المشروع ومجلداته في حزمة مضغوطة جاهزة للرفع إلى Vercel أو الاستضافة، بالإضافة إلى إمكانية إعادة ضغط وتحديث الحزمة فورياً مع كل تعديل يطرأ على النظام.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto bg-black/60 border border-white/10 px-3.5 py-2 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-mono text-slate-300">
                      الحالة: <span className="text-emerald-400 font-bold">متصل ومزامن</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Status & Live Rebuild Actions Card */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <FolderArchive className="w-4 h-4 text-amber-400" />
                      <span>حزمة المشروع الجاهزة للنشر والتشغيل</span>
                    </h4>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      الملف يحتوي على كل الأكواد، الخادم (Express/Vite)، قاعدة البيانات (db.json)، الإعدادات (vercel.json)، والأصول والصور.
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono">
                      الحجم: <span className="text-amber-400 font-bold">{packageInfo?.sizeFormatted || '4.9 MB'}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                      جاهز 100%
                    </div>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Download Button */}
                  <a
                    href="/api/download"
                    download="prava-recruitment-system.zip"
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center group"
                  >
                    <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span>تحميل ملف المشروع بالكامل (ZIP)</span>
                  </a>

                  {/* Rebuild & Live Sync Button */}
                  <button
                    onClick={handleRebuildPackage}
                    disabled={isRebuildingPackage}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRebuildingPackage ? 'animate-spin text-amber-400' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>{isRebuildingPackage ? 'جاري تجميع الملفات وإعادة الضغط...' : 'تحديث الحزمة وإعادة الضغط الآن (Live Rebuild)'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>اسم الملف المصدّر: <code className="text-slate-200 font-mono">prava-recruitment-system.zip</code></span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    آخر تحديث: {packageInfo?.lastModified ? new Date(packageInfo.lastModified).toLocaleTimeString('ar-SA') : 'الآن'}
                  </span>
                </div>
              </div>

              {/* Troubleshooting / Single Files Viewer (حل مشكلة "ما أقدر أفكه") */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-black text-white">
                        حل بديل: تحميل أو استعراض ونسخ الملفات الفردية مباشرة (بدون فك ضغط)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      إذا واجهت أي صعوبة في فك ضغط ملف الـ ZIP على هاتفك أو حاسوبك، يمكنك تحميل كل ملف رئيسي منفصلاً أو نسخ كوده بنقرة واحدة:
                    </p>
                  </div>
                </div>

                {/* Key Files Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'vercel.json', desc: 'إعدادات النشر وتخطي أخطاء Vercel', badge: 'Vercel Config' },
                    { name: 'package.json', desc: 'إصدارات المكتبات والسكربتات الصحيحة', badge: 'Dependencies' },
                    { name: '.env.example', desc: 'نموذج المتغيرات البيئية وتوكن البوت الآمن', badge: 'Security Env' },
                    { name: '.gitignore', desc: 'قواعد منع رفع الأسرار وملف .env لـ GitHub', badge: 'Git Security' },
                    { name: 'data/db.json', desc: 'قاعدة البيانات (المستخدمين والإعدادات بدون أسرار)', badge: 'Database' },
                    { name: 'server.ts', desc: 'خادم Express والواجهات البرمجية الآمنة', badge: 'Backend' },
                    { name: 'index.html', desc: 'واجهة الدخول وملف HTML الرئيسي', badge: 'HTML Entry' },
                    { name: 'vite.config.ts', desc: 'إعدادات بيئة العمل وبناء Vite', badge: 'Build Config' },
                  ].map((file) => (
                    <div
                      key={file.name}
                      className="p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-amber-300">{file.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                            {file.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{file.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingleFile(file.name)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>تحميل الملف</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectFile(file.name)}
                          className="py-1.5 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-blue-500/20"
                        >
                          <Eye className="w-3 h-3" />
                          <span>استعراض</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inspecting File Drawer / Modal Box */}
                {inspectingFile && (
                  <div className="mt-4 p-4 rounded-xl bg-black/80 border border-blue-500/30 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span className="font-mono text-xs font-bold text-white">{inspectingFile}</span>
                        {isLoadingFileContent && (
                          <span className="text-[10px] text-slate-400 animate-pulse">جاري التحميل...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyContent}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold cursor-pointer transition-colors"
                        >
                          {hasCopiedFile ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">تم النسخ!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>نسخ الكود بالكامل</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setInspectingFile(null)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <pre className="p-3 bg-[#0c0f16] rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-60 border border-white/5 whitespace-pre">
                      {inspectingContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Extraction & Deployment Help Guide */}
              <div className="bg-[#090b10] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-4">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>دليل فك الضغط وتشغيل المشروع على Vercel أو الحاسوب</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="font-bold text-amber-300 block">💡 كيف تفتح وتفك ضغط الملف بسهولة؟</span>
                    <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px] leading-relaxed">
                      <li><strong>على الكمبيوتر (Windows/Mac):</strong> انقر بزر الفأرة الأيمن على الملف ثم اختر "Extract All" أو استعمل برنامج <span className="text-white">WinRAR / 7-Zip</span>.</li>
                      <li><strong>على الهاتف (iPhone):</strong> افتح تطبيق "الملفات" (Files) واضغط على الملف ضغطة واحدة ليتم فكه مباشرة في مجلد.</li>
                      <li><strong>على الهاتف (Android):</strong> استخدم تطبيق "ملفاتي" أو حمّل تطبيق <span className="text-white">ZArchiver</span> المجاني من متجر التطبيقات.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="font-bold text-emerald-300 block">🚀 خطوات الرفع والنشر على Vercel:</span>
                    <ol className="space-y-1.5 text-slate-400 list-decimal list-inside text-[11px] leading-relaxed">
                      <li>ارفع مجلد المشروع بعد فك الضغط إلى حسابك في <strong>GitHub</strong>.</li>
                      <li>توجه إلى موقع <strong>Vercel.com</strong> واضغط على "Add New Project".</li>
                      <li>اختر المستودع وسيقوم Vercel بالقراءة التلقائية من <code className="text-amber-300">vercel.json</code> وبناء الموقع بنجاح فوراً!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 sm:px-8 border-t border-white/10 bg-[#090b10] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            PRAVA Central Management · Granular Permissions Matrix
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

      </div>

      {/* CREATE / EDIT ACCOUNT & GRANULAR PERMISSIONS MODAL */}
      {isUserModalOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsUserModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[92vh] bg-[#0f141d] border border-white/10 rounded-2xl p-6 sm:p-7 overflow-y-auto text-right shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-black text-white">
                {editingUserId ? 'تعديل الحساب وتخصيص الصلاحيات الدقيقة' : 'إضافة حساب قيادي جديد وتعيين الصلاحيات'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                حدد بدقة ما يُسمح به لهذا العضو على المنصة مع إمكانية استخدام القوالب السريعة أو التخصيص اليدوي.
              </p>
            </div>

            {/* Quick Presets Bar */}
            <div className="bg-[#090b10] p-3 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">قوالب الصلاحيات السريعة:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="py-2 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>مشرف عام (كامل)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('leader')}
                  className="py-2 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>قائد قطاع</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('officer')}
                  className="py-2 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>ضابط قبول</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5">
              
              {/* Account Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المستخدم (اليوزر) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-left focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {editingUserId ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور (الباسورد) *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder={editingUserId ? 'اتركه فارغاً للإبقاء عليها' : ''}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono text-left focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الاسم المعروض</label>
                  <input
                    type="text"
                    value={userFormData.displayName}
                    onChange={(e) => setUserFormData({ ...userFormData, displayName: e.target.value })}
                    placeholder="مثال: النقيب فهد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المسمى / الرتبة</label>
                  <input
                    type="text"
                    value={userFormData.roleTitle}
                    onChange={(e) => setUserFormData({ ...userFormData, roleTitle: e.target.value })}
                    placeholder="مثال: قائد قطاع SWAT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Scoped Sectors Multi-Selection */}
              <div className="bg-[#090b10] p-4 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-white block mb-2">القطاعات المصرح بإدارتها:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllowedSector('*')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userFormData.permissions.allowedSectors?.includes('*')
                        ? 'bg-amber-500 text-black shadow'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    كافة القطاعات (*)
                  </button>

                  {sectors.map((s) => {
                    const isSelected = userFormData.permissions.allowedSectors?.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleAllowedSector(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {s.name} ({s.arabicName})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRANULAR PERMISSIONS CATEGORIES */}
              <div className="space-y-4">
                
                {/* 1. Applications Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pb-1.5 border-b border-white/5">
                    <FileCheck className="w-4 h-4" />
                    <span>صلاحيات طلبات التوظيف (Applications)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canViewApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canViewApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>مشاهدة واستعراض الطلبات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAcceptApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAcceptApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>قبول الطلبات رسمياً</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canRejectApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canRejectApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>رفض الطلبات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAddNotes}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAddNotes: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>كتابة ملاحظات التدقيق والتقييم</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canExportApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canExportApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تصدير بيانات المتقدمين (CSV)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canDeleteApps}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canDeleteApps: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>حذف وأرشفة الطلبات</span>
                    </label>
                  </div>
                </div>

                {/* 2. Sector & Unit Prefix Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pb-1.5 border-b border-white/5">
                    <Sliders className="w-4 h-4" />
                    <span>صلاحيات القطاعات واليونت (Sectors & Units)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canToggleSector}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canToggleSector: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>فتح وإغلاق التقديم (متاح / مغلق)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditUnitPrefix}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditUnitPrefix: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span className="text-amber-300 font-bold">تعديل بادئة اليونت (M- أو I-)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditSectorInfo}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditSectorInfo: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل اسم ووصف القطاع</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditRolesTemplate}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditRolesTemplate: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل قوالب ونصوص الرولات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canEditQuestions}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canEditQuestions: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل وإضافة أسئلة تقييم القبول</span>
                    </label>
                  </div>
                </div>

                {/* 3. Server Identity & Webhooks Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 pb-1.5 border-b border-white/5">
                    <Sparkles className="w-4 h-4" />
                    <span>صلاحيات الهوية والسيرفر (Server & Discord)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canChangeServerLogo}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canChangeServerLogo: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تغيير شعار السيرفر وصورة PRAVA</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canChangeDiscordLinks}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canChangeDiscordLinks: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل روابط رومات ودعوات الديسكورد</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canConfigureWebhooks}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canConfigureWebhooks: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>تعديل روابط ويب هوك الإشعارات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canViewAuditLogs}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canViewAuditLogs: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>مشاهدة سجلات الدخول التدقيقية</span>
                    </label>
                  </div>
                </div>

                {/* 4. Accounts & Staff Management Permissions */}
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pb-1.5 border-b border-white/5">
                    <Users className="w-4 h-4" />
                    <span>صلاحيات إدارة الحسابات والرتب (Staff Management)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canManageAccounts}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canManageAccounts: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>إنشاء وحذف حسابات القادة والضباط</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canAssignPermissions}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canAssignPermissions: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span>ترقية وتعديل مصفوفة الصلاحيات</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={!!userFormData.permissions.canCreateRecruitmentOfficers}
                        onChange={(e) => setUserFormData({
                          ...userFormData,
                          permissions: { ...userFormData.permissions, canCreateRecruitmentOfficers: e.target.checked }
                        })}
                        className="rounded text-amber-500"
                      />
                      <span className="text-amber-300 font-bold">صلاحية إنشاء وتعيين حساب مسؤول التوظيف والقبول</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-7 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${theme.buttonClass} shadow-lg`}
                >
                  {editingUserId ? 'حفظ التعديلات وتحديث الصلاحيات' : 'إنشاء الحساب وتفعيل الصلاحيات'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAIL APPLICATION MODAL */}
      {selectedApp && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedApp(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f141d] border border-white/10 rounded-2xl p-6 overflow-y-auto text-right shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              تفاصيل طلب التقديم: {selectedApp.fullName}
            </h3>
            <span className="text-xs text-amber-400 font-mono block mb-4">
              رقم الطلب: {selectedApp.id} · قطاع {selectedApp.sectorName}
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6 bg-[#090b10] p-4 rounded-xl border border-white/5">
              <div><span className="text-slate-400">الاسم داخل اللعبة:</span> <span className="font-bold text-white">{selectedApp.playerName}</span></div>
              <div><span className="text-slate-400">الديسكورد:</span> <span className="font-mono text-white">{selectedApp.discordId}</span></div>
              <div><span className="text-slate-400">الهوية الرقمية:</span> <span className="font-mono text-white">{selectedApp.gameId}</span></div>
              <div><span className="text-slate-400">الرقم العسكري:</span> <span className="font-mono text-white">{selectedApp.militaryNo}</span></div>
              <div><span className="text-slate-400">اليونت الآلي:</span> <span className="font-mono text-amber-400 font-bold">{selectedApp.currentUnit}</span></div>
              <div><span className="text-slate-400">العمر:</span> <span className="text-white">{selectedApp.age} سنة</span></div>
              <div><span className="text-slate-400">مسؤول القبول:</span> <span className="text-white">{selectedApp.acceptanceOfficer || 'لا يوجد'}</span></div>
              <div><span className="text-slate-400">درجة التقييم:</span> <span className="font-bold text-emerald-400">{selectedApp.score}/{selectedApp.totalQuestions}</span></div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">إثبات إعطاء الرولات</span>
                {selectedApp.rolesProofImg ? (
                  <img src={selectedApp.rolesProofImg} alt="Proof" className="w-full h-44 object-cover rounded-xl border border-white/10" />
                ) : (
                  <div className="h-44 rounded-xl bg-[#090b10] border border-white/5 flex items-center justify-center text-xs text-slate-500">
                    لم يتم إرفاق صورة
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">صورة الزي الرسمي</span>
                {selectedApp.uniformImg ? (
                  <img src={selectedApp.uniformImg} alt="Uniform" className="w-full h-44 object-cover rounded-xl border border-white/10" />
                ) : (
                  <div className="h-44 rounded-xl bg-[#090b10] border border-white/5 flex items-center justify-center text-xs text-slate-500">
                    لم يتم إرفاق صورة
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleUpdateAppStatus(selectedApp.id, 'مرفوض');
                  setSelectedApp(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer"
              >
                رفض الطلب
              </button>
              <button
                onClick={() => {
                  handleUpdateAppStatus(selectedApp.id, 'مقبول');
                  setSelectedApp(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 cursor-pointer"
              >
                قبول الطلب رسمياً
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

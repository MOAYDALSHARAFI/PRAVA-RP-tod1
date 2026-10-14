export type ThemeId = 'prava-gold' | 'tactical-emerald' | 'cyber-navy' | 'crimson-vanguard';
export type DesignStyle = 'modern' | 'classic' | 'apex';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameAr: string;
  accentColor: string;
  badgeBg: string;
  primaryClass: string;
  borderClass: string;
  glowClass: string;
  buttonClass: string;
}

export interface SectorQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Sector {
  id: string;
  name: string;
  arabicName: string;
  subtitle: string;
  isOpen: boolean;
  badge?: string;
  discordRoomUrl?: string;
  webhookUrl?: string;
  discordChannelId?: string;
  minAge: number;
  rolesTemplate: string;
  unitPrefix?: string; // Default: 'M-' or custom prefix (e.g. 'I-', 'SWAT-')
  questions: SectorQuestion[];
}

export interface Application {
  id: string;
  sectorId: string;
  sectorName: string;
  playerName: string;
  fullName: string;
  discordId: string;
  gameId: string;
  age: number;
  militaryNo: string;
  gender: string;
  currentUnit: string;
  acceptanceOfficer?: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  rolesProofImg?: string;
  uniformImg?: string;
  status: 'قيد المراجعة' | 'مقبول' | 'مرفوض';
  reviewerNotes?: string;
  createdAt: string;
}

export interface LoginLog {
  id: string;
  username: string;
  timestamp: string;
}

export type UserRole = 'owner' | 'leader' | 'officer' | 'applicant';

export interface UserPermissions {
  // Applications Management
  canViewApps?: boolean;
  canAcceptApps?: boolean;
  canRejectApps?: boolean;
  canDeleteApps?: boolean;
  canExportApps?: boolean;
  canAddNotes?: boolean;

  // Sector Settings & Unit Prefix
  canToggleSector?: boolean;
  canEditSectorInfo?: boolean;
  canEditRolesTemplate?: boolean;
  canEditUnitPrefix?: boolean;
  canEditQuestions?: boolean;

  // Server Identity & Webhooks
  canChangeServerLogo?: boolean;
  canChangeDiscordLinks?: boolean;
  canConfigureWebhooks?: boolean;
  canViewAuditLogs?: boolean;

  // Staff & Accounts
  canManageAccounts?: boolean;
  canAssignPermissions?: boolean;
  canCreateRecruitmentOfficers?: boolean; // Dedicated permission to create recruitment officer accounts

  // Scoped Sectors
  allowedSectors: string[]; // ['*'] for all, or ['swat', 'cid', etc.]
}

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  gameId?: string;
  discordUsername?: string;
  role: UserRole;
  roleTitle: string;
  permissions: UserPermissions;
  createdAt: string;
}

export interface ServerSettings {
  serverLogo: string;
  serverName: string;
  discordUrl: string;
  discordName: string;
  defaultUnitPrefix: string;
  webhookUrl?: string; // رابط الويب هوك للديسكورد
  botToken?: string; // توكن بوت الديسكورد
  discordChannelId?: string; // آيدي روم / قناة إرسال الرسائل
  discordRoomUrl?: string; // رابط روم إرسال الطلبات
  seniorOfficersWebhookUrl?: string; // رابط ويب هوك شات كبار الضباط
  seniorOfficersChannelId?: string; // آيدي روم كبار الضباط
  seniorOfficersMessageTemplate?: string; // صيغة رسالة التوظيف المرسلة لكبار الضباط
}

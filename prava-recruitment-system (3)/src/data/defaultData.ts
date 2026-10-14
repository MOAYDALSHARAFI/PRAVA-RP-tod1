import { Sector, ServerSettings } from '../types.ts';

export const DEFAULT_SERVER_SETTINGS: ServerSettings = {
  serverLogo: '/server_logo.png',
  serverName: 'سيرفر PRAVA',
  discordUrl: 'https://discord.gg/dkUjf2bpy',
  discordName: 'ديسكورد PRAVA',
  defaultUnitPrefix: 'M-',
  webhookUrl: '',
  botToken: '',
  discordChannelId: '1556637676902547466',
  seniorOfficersWebhookUrl: '',
  seniorOfficersChannelId: '',
  seniorOfficersMessageTemplate:
    '📋 **[إشعار توظيف معتمد - كبار الضباط]**\nتم توظيف صاحب الهوية ({applicantGameId}) عن طريق صاحب الهوية ({officerGameId}) / مسؤول التوظيف ({officerName})\n🏢 **القطاع:** {sectorName}\n🔰 **اليونت:** {unit}\n🎖️ **الرقم العسكري:** {militaryNo}\n👤 **اسم المتقدم:** {applicantName}\n💬 **منشن الديسكورد:** {discordId}',
};

export const DEFAULT_SECTORS: Sector[] = [
  {
    id: 'swat',
    name: 'SWAT',
    arabicName: 'سوات',
    subtitle: 'Special Weapons and Tactics',
    isOpen: true,
    badge: '/src/assets/images/swat_round_badge_1791840366509.jpg',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'M-',
    rolesTemplate:
      'PRAVA ⚔️ [M-{militaryNo}] | {gameId} | {playerName}\n<@{discord}>\n<@&1519090286670643250>\n<@&1519090327707979786>\n<@&1519090347529994240>\n<@&1519090401598902334> <—\n<@&1519090405986275518>',
    questions: [
      {
        id: 1,
        question: 'السوات تابع لأي وزارة؟',
        options: ['وزارة الداخلية', 'وزارة الدفاع'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'متى يُسمح لك باستخدام السلاح الناري؟',
        options: ['في أي تهديد', 'عند الخطر المباشر فقط'],
        correctIndex: 1,
      },
      {
        id: 3,
        question: 'ما أول إجراء عند دخول موقع عملية؟',
        options: ['الاقتحام فوراً', 'تأمين المحيط والتنسيق مع القائد'],
        correctIndex: 1,
      },
      {
        id: 4,
        question: 'هل يجوز مخالفة أوامر القائد الميداني؟',
        options: ['نعم إذا كانت خاطئة', 'لا، التنفيذ ثم الاعتراض لاحقاً'],
        correctIndex: 1,
      },
      {
        id: 5,
        question: 'ما واجبك تجاه المدنيين أثناء العمليات؟',
        options: ['حمايتهم أولاً', 'إبعادهم عن الطريق فقط'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'public_security',
    name: 'Public Security',
    arabicName: 'الأمن العام',
    subtitle: 'المديرية العامة للأمن العام',
    isOpen: true,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'M-',
    rolesTemplate:
      'PRAVA 🛡️ [PS-{militaryNo}] | {gameId} | {playerName}\n<@{discord}>\n<@&1519090286670643250>\n<@&1519090327707979786>',
    questions: [
      {
        id: 1,
        question: 'ما هي الأولوية القصوى لرجل الأمن العام؟',
        options: ['حفظ الأمن والنظام العام', 'المطاردة المباشرة دون إذن'],
        correctIndex: 0,
      },
      {
        id: 2,
        question: 'كيف يتم التعامل مع البلاغات الطارئة؟',
        options: ['إبلاغ العمليات فوراً والتوجه للموقع', 'الانتظار حتى انتهاء الدورية'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'cid',
    name: 'CID',
    arabicName: 'وكالة الاستخبارات المركزية',
    subtitle: 'وكالة الاستخبارات المركزية',
    isOpen: false,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 18,
    unitPrefix: 'CID-',
    rolesTemplate:
      'PRAVA 🔍 [CID-{militaryNo}] | {gameId} | {playerName}\n<@{discord}>\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'ما هو المبدأ الأساسي في جمع المعلومات الاستخباراتية؟',
        options: ['السرية التامة والدقة المتناهية', 'النشر الفوري على الأجهزة اللاسلكية'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'gs',
    name: 'GS',
    arabicName: 'المباحث العامة',
    subtitle: 'المباحث العامة',
    isOpen: false,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 18,
    unitPrefix: 'GS-',
    rolesTemplate:
      'PRAVA ⚔️ [GS-{militaryNo}] | {gameId} | {playerName}\n<@{discord}>\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'متى يتم الشروع في عملية المداهمة الاستقصائية؟',
        options: ['بعد صدور إذن قضائي وأمر قائد المباحث', 'بشكل عفوي عند الشك الشخصي'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 'border_guard',
    name: 'Border Guard',
    arabicName: 'مديرية حرس الحدود',
    subtitle: 'مديرية حرس الحدود',
    isOpen: true,
    badge: '',
    discordRoomUrl: 'https://discord.gg/prava',
    webhookUrl: '',
    minAge: 17,
    unitPrefix: 'BG-',
    rolesTemplate:
      'PRAVA 🧭 [BG-{militaryNo}] | {gameId} | {playerName}\n<@{discord}>\n<@&1519090286670643250>',
    questions: [
      {
        id: 1,
        question: 'ما هو الإجراء عند رصد اختراق للحدود الإقليمية؟',
        options: ['التعامل التكتيكي وفق قواعد الاشتباك المعتمدة', 'المغادرة دون بلاغ'],
        correctIndex: 0,
      },
    ],
  },
];

import type { ItemReport, Organization } from '../types';
import backpackImg from '../assets/images/item_backpack_sample_1794776684658.jpg';
import keysImg from '../assets/images/item_keys_sample_1794776684684.jpg';
import sunglassesImg from '../assets/images/item_sunglasses_sample_1794776684758.jpg';
import walletImg from '../assets/images/item_wallet_sample_1794776684938.jpg';

export const SEED_REPORTS: ItemReport[] = [
  {
    id: 'seed-backpack-nasr',
    ownerId: 'system-seed',
    ownerDisplayName: 'Karim M.',
    type: 'lost',
    status: 'open',
    visibility: 'public',
    title: 'Black Commuter Backpack',
    description:
      'Matte black commuter backpack containing university notebooks and charger cable, last seen near Abbas El Akkad crossing.',
    category: 'wallets-bags',
    color: 'black',
    brand: 'Samsonite',
    governorateId: 'cairo',
    cityId: 'nasr-city',
    districtId: 'abbas-el-akkad',
    areaNote: 'Near Abbas El Akkad & Genena Mall',
    publicLat: 30.0566,
    publicLng: 31.3396,
    locationPrivacy: 'approximate',
    dateOccurred: '2026-11-12',
    timeApprox: '14:30',
    isSensitiveDocument: false,
    photoUrls: [backpackImg],
    createdAtMs: 1794580200000,
    updatedAtMs: 1794580200000,
    isSeed: true,
  },
  {
    id: 'seed-keys-dokki',
    ownerId: 'system-seed',
    ownerDisplayName: 'Nadia H.',
    type: 'found',
    status: 'open',
    visibility: 'public',
    title: 'Car Key Fob & Two Brass Keys',
    description:
      'Found a black car key fob attached to two brass house keys on a silver ring near Dokki Metro exit.',
    category: 'keys',
    color: 'black',
    brand: 'Mercedes-Benz',
    governorateId: 'giza',
    cityId: 'dokki',
    districtId: 'dokki-sq',
    areaNote: 'Dokki Square / Metro Entrance',
    publicLat: 30.0386,
    publicLng: 31.2122,
    locationPrivacy: 'approximate',
    dateOccurred: '2026-11-13',
    timeApprox: '13:15',
    isSensitiveDocument: false,
    photoUrls: [keysImg],
    createdAtMs: 1794662100000,
    updatedAtMs: 1794662100000,
    isSeed: true,
  },
  {
    id: 'seed-sunglasses-smouha',
    ownerId: 'system-seed',
    ownerDisplayName: 'Omar A.',
    type: 'lost',
    status: 'open',
    visibility: 'public',
    title: 'Black Acetate Polarized Sunglasses',
    description:
      'Classic black frame sunglasses left at a cafe table near Smouha Sporting Club gate.',
    category: 'eyewear',
    color: 'black',
    brand: 'Ray-Ban',
    governorateId: 'alexandria',
    cityId: 'sidi-gaber',
    districtId: 'smouha',
    areaNote: 'Smouha Club Gate',
    publicLat: 31.2098,
    publicLng: 29.9498,
    locationPrivacy: 'approximate',
    dateOccurred: '2026-11-11',
    timeApprox: '18:20',
    isSensitiveDocument: false,
    photoUrls: [sunglassesImg],
    createdAtMs: 1794507600000,
    updatedAtMs: 1794507600000,
    isSeed: true,
  },
  {
    id: 'seed-wallet-zamalek',
    ownerId: 'system-seed',
    ownerDisplayName: 'Salma T.',
    type: 'found',
    status: 'open',
    visibility: 'public',
    title: 'Navy Leather Bifold Wallet',
    description:
      'Found a navy pebbled-leather bifold wallet near 26th of July Corridor walkway. Handed in safely; owner must verify contents.',
    category: 'wallets-bags',
    color: 'navy',
    brand: 'Leather Craft',
    governorateId: 'cairo',
    cityId: 'downtown-cairo',
    districtId: 'zamalek',
    areaNote: 'Zamalek — 26th of July St',
    publicLat: 30.0609,
    publicLng: 31.2197,
    locationPrivacy: 'approximate',
    dateOccurred: '2026-11-14',
    timeApprox: '11:00',
    isSensitiveDocument: false,
    photoUrls: [walletImg],
    createdAtMs: 1794740400000,
    updatedAtMs: 1794740400000,
    isSeed: true,
  },
];

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-cairo-metro-3',
    nameEn: 'Cairo Metro Line 3 Lost & Found Desk',
    nameAr: 'مكتب مفقودات مترو القاهرة - الخط الثالث',
    orgType: 'metro',
    governorateId: 'cairo',
    cityId: 'downtown-cairo',
    verificationStatus: 'verified',
    applicantUid: 'system-seed',
    contactDesk: 'Attaba & Adly Mansour Central Custody Desk',
    isSeed: true,
  },
  {
    id: 'org-cairo-university',
    nameEn: 'Cairo University Campus Security Desk',
    nameAr: 'مكتب أمن وحفظ المفقودات - جامعة القاهرة',
    orgType: 'university',
    governorateId: 'giza',
    cityId: 'dokki',
    verificationStatus: 'verified',
    applicantUid: 'system-seed',
    contactDesk: 'Main Gate Student Affairs & Security Office',
    isSeed: true,
  },
  {
    id: 'org-alex-rail',
    nameEn: 'Alexandria Misr Station Custody Office',
    nameAr: 'مكتب أمانات محطة مصر - الإسكندرية',
    orgType: 'train',
    governorateId: 'alexandria',
    cityId: 'central-alex',
    verificationStatus: 'verified',
    applicantUid: 'system-seed',
    contactDesk: 'Platform 1 Passenger Services Desk',
    isSeed: true,
  },
  {
    id: 'org-cairo-airport-t3',
    nameEn: 'Cairo International Airport T3 Lost Baggage',
    nameAr: 'مكتب المفقودات بمطار القاهرة الدولي - مبنى ٣',
    orgType: 'airport',
    governorateId: 'cairo',
    cityId: 'heliopolis',
    verificationStatus: 'verified',
    applicantUid: 'system-seed',
    contactDesk: 'Arrivals Hall Lost & Found Counter',
    isSeed: true,
  },
];

export interface HelpArticle {
  id: string;
  category: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'help-verify-ownership',
    category: 'recovery',
    titleEn: 'How ownership verification protects both finder and owner',
    titleAr: 'كيف تحمي إجراءات التحقق من الملكية كلاً من المالك والمعثور عليه',
    bodyEn:
      'Never rely solely on an AI match score or a public photo. Ask the claimant for non-public identifying marks, serial numbers (partially masked), lockscreen wallpaper details, or specific wallet contents before arranging a handover at a public station or verified organization desk.',
    bodyAr:
      'لا تعتمد أبداً على نسبة التشابه بالذكاء الاصطناعي وحدها كإثبات للملكية. اطلب من المدعي علامات مميزة غير منشورة أو تفاصيل داخلية قبل ترتيب التسليم في مكان عام أو مكتب مؤسسة موثق.',
  },
  {
    id: 'help-emergency-docs',
    category: 'privacy',
    titleEn: 'Lost National ID, Passport, or Bank Card in Egypt',
    titleAr: 'ماذا تفعل عند فقدان بطاقة الرقم القومي أو جواز السفر أو البطاقة البنكية',
    bodyEn:
      'Immediately freeze lost bank cards via your bank hotline (e.g., 19666, 19888, 19191 depending on your bank). Never upload full 14-digit National ID photos, full card numbers, or barcodes publicly. Use Emergency Document Mode so LA2EETOH automatically redacts sensitive numbers.',
    bodyAr:
      'بادر فوراً بإيقاف البطاقة البنكية عبر الخط الساخن لبنكك، وحرّر محضر فقدان رسمي للوثائق الحكومية. لا تنشر أبداً صورة كاملة لبطاقة الرقم القومي أو رقم البطاقة البنكية أو الباركود، واستخدم وضع المستندات الطارئ لإخفاء الأرقام الحساسة تلقائياً.',
  },
  {
    id: 'help-qr-tags',
    category: 'technical',
    titleEn: 'Using Smart QR Tags without exposing your phone number',
    titleAr: 'استخدام رموز QR الذكية دون كشف رقم هاتفك الشخصي',
    bodyEn:
      'Each Smart QR Tag carries a random non-guessable token. When a finder scans the tag, they see only your safe public note and can submit a protected relay message to your LA2EETOH inbox. You can deactivate or rotate the token at any time.',
    bodyAr:
      'يحمل كل رمز QR ذكي رمزاً عشوائياً آمناً. عند مسح الرمز يظهر للعاثر ملاحظة آمنة فقط ويمكنه إرسال رسالة عبر الوسيط المحمي دون كشف رقم هاتفك أو عنوانك، ويمكنك تعطيل الرمز أو تجديده في أي وقت.',
  },
  {
    id: 'help-location-privacy',
    category: 'privacy',
    titleEn: 'Exact Map Pin vs. Approximate Public Location',
    titleAr: 'الموقع الدقيق مقابل الموقع العام التقريبي على الخريطة',
    bodyEn:
      'When reporting an item lost near your home or finding a high-value item, choose Approximate Public Location. LA2EETOH stores your exact coordinates privately and displays a ~1.5 km public area marker to protect personal safety.',
    bodyAr:
      'عند الإبلاغ بالقرب من منزلك أو العثور على غرض ثمين، اختر الموقع العام التقريبي. يحتفظ لقيته بالإحداثيات الدقيقة بشكل خاص ويعرض نطاقاً عاماً تقريبياً لحماية خصوصيتك.',
  },
];

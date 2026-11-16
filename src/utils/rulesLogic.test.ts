import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EGYPT_GOVERNORATES,
  applyLocationPrivacy,
  calculateDistanceKm,
  findCity,
  findDistrict,
  findGovernorate,
} from './egyptLocations';
import {
  computeDuplicateSimilarity,
  detectSensitiveDocumentPatterns,
  sanitizeDocumentText,
  sanitizePrivateChatText,
  scoreReportMatch,
} from './sanitization';
import {
  canAccessRecoveryCase,
  formatFriendlyFirestoreError,
  generateSecureQrToken,
  validateCaseChatMessage,
  validateId,
  validateModerationReason,
  validateReportPayload,
  validateSmartTagPayload,
  validateSupportTicketPayload,
  validateTagRelayPayload,
  validateWatchlistPayload,
} from './validation';
import { computeAdminMetrics } from './adminAnalytics';
import {
  isValidEmailAddress,
  makeInviteDocId,
  maskPhone,
  normalizeEgyptPhone,
  normalizeSupervisorEmail,
} from './phoneVerification';
import { findAvatarPreset } from './avatars';

test('all 27 Egyptian governorates are present with Arabic & English names and valid coordinates', () => {
  assert.equal(EGYPT_GOVERNORATES.length, 27);
  for (const gov of EGYPT_GOVERNORATES) {
    assert.ok(gov.nameEn.length > 0);
    assert.ok(gov.nameAr.length > 0);
    assert.ok(gov.cities.length >= 1, `${gov.id} should have at least one city`);
    assert.ok(gov.lat >= 22 && gov.lat <= 32, `${gov.id} lat within Egypt`);
    assert.ok(gov.lng >= 25 && gov.lng <= 37, `${gov.id} lng within Egypt`);
  }
});

test('cascading lookup returns Cairo -> Nasr City -> Abbas El Akkad', () => {
  const gov = findGovernorate('cairo');
  const city = findCity('cairo', 'nasr-city');
  const dist = findDistrict('cairo', 'nasr-city', 'abbas-el-akkad');
  assert.equal(gov?.nameAr, 'القاهرة');
  assert.equal(city?.nameEn, 'Nasr City');
  assert.equal(dist?.nameEn, 'Abbas El Akkad');
});

test('Haversine distance between Cairo and Alexandria is ~170-190 km', () => {
  const dist = calculateDistanceKm(30.0444, 31.2357, 31.2001, 29.9187);
  assert.ok(dist > 160 && dist < 200, `Unexpected Cairo-Alex distance: ${dist}`);
});

test('location privacy obfuscation shifts exact coordinates for approximate public display', () => {
  const exact = applyLocationPrivacy(30.056612, 31.339644, 'exact');
  const approx = applyLocationPrivacy(30.056612, 31.339644, 'approximate');
  assert.equal(exact.isApproximate, false);
  assert.equal(approx.isApproximate, true);
  assert.notEqual(approx.lat, 30.0566);
});

test('sensitive document sanitizer detects and redacts Egyptian National ID, bank cards, and phone numbers', () => {
  const raw = 'Lost ID 29905120102345 and card 4532 1100 2233 4455 call 01012345678';
  const detected = detectSensitiveDocumentPatterns(raw);
  assert.equal(detected.hasSensitiveData, true);
  assert.ok(detected.reasons.includes('national_id'));
  assert.ok(detected.reasons.includes('bank_card'));
  assert.ok(detected.reasons.includes('phone'));

  const sanitized = sanitizeDocumentText(raw);
  assert.ok(!sanitized.includes('29905120102345'));
  assert.ok(!sanitized.includes('01012345678'));
  assert.ok(sanitized.includes('[REDACTED-ID]'));
  assert.ok(sanitized.includes('4455'));
});

test('duplicate detection catches near-identical reports', () => {
  const sim = computeDuplicateSimilarity(
    {
      type: 'lost',
      title: 'Black Samsonite Backpack',
      description: 'Lost near Citystars Mall',
      category: 'wallets-bags',
      color: 'black',
      brand: 'Samsonite',
      governorateId: 'cairo',
      dateOccurred: '2026-11-14',
    },
    {
      id: 'rep-1',
      type: 'lost',
      title: 'Black Samsonite Backpack',
      description: 'Left in Nasr City cafe',
      category: 'wallets-bags',
      color: 'black',
      brand: 'Samsonite',
      governorateId: 'cairo',
      dateOccurred: '2026-11-14',
    }
  );
  assert.ok(sim >= 0.85, `Expected high duplicate score, got ${sim}`);
});

test('match scoring ranks matching items higher than unrelated items', () => {
  const high = scoreReportMatch(
    {
      keywords: ['backpack', 'samsonite'],
      category: 'wallets-bags',
      color: 'black',
      governorateId: 'cairo',
      targetType: 'found',
    },
    {
      id: 'f1',
      type: 'found',
      title: 'Found Black Samsonite Backpack',
      description: 'Found in Nasr City near Abbas El Akkad',
      category: 'wallets-bags',
      color: 'black',
      brand: 'Samsonite',
      governorateId: 'cairo',
      dateOccurred: '2026-11-14',
    }
  );
  const low = scoreReportMatch(
    {
      keywords: ['backpack', 'samsonite'],
      category: 'wallets-bags',
      color: 'black',
      governorateId: 'cairo',
      targetType: 'found',
    },
    {
      id: 'f2',
      type: 'found',
      title: 'Silver Car Keys',
      description: 'Found in Alexandria',
      category: 'keys',
      color: 'silver',
      governorateId: 'alexandria',
      dateOccurred: '2026-11-10',
    }
  );
  assert.ok(high > 70 && low < 20, `high=${high}, low=${low}`);
});

test('validation rejects out-of-Egypt coordinates and invalid IDs', () => {
  assert.equal(validateId('valid_id-123'), true);
  assert.equal(validateId('bad/id with space'), false);

  const badReport = validateReportPayload({
    type: 'lost',
    title: 'Black Wallet',
    category: 'wallets-bags',
    color: 'black',
    description: 'Lost near Zamalek bridge yesterday evening',
    governorateId: 'cairo',
    cityId: 'downtown-cairo',
    dateOccurred: '2026-11-14',
    lat: 51.5, // London, out of Egypt
    lng: -0.12,
  });
  assert.equal(badReport.valid, false);

  const badTicket = validateSupportTicketPayload('Hi', 'Too short');
  assert.equal(badTicket.valid, false);

  const token = generateSecureQrToken();
  assert.ok(token.startsWith('L2T-') && validateId(token));
});

test('private recovery chat sanitizes National IDs/cards and restricts access to case participants', () => {
  const sanitized = sanitizePrivateChatText('Meet at Attaba Metro desk; ID 29905120102345 card 4532110022334455');
  assert.ok(!sanitized.includes('29905120102345'));
  assert.ok(sanitized.includes('[REDACTED-ID]'));
  assert.ok(sanitized.includes('Attaba Metro desk'));

  assert.equal(validateCaseChatMessage('   ').valid, false);
  assert.equal(validateCaseChatMessage('Meet at Sadat Metro Exit 2 at 4 PM').valid, true);

  const rec = { ownerId: 'uid-finder', counterpartyId: 'uid-owner' };
  assert.equal(canAccessRecoveryCase('uid-finder', false, rec), true);
  assert.equal(canAccessRecoveryCase('uid-owner', false, rec), true);
  assert.equal(canAccessRecoveryCase('uid-stranger', false, rec), false);
  assert.equal(canAccessRecoveryCase('uid-stranger', true, rec), true);
});

test('smart tag, tag relay, watchlist, and moderation validators enforce Firestore rule bounds', () => {
  assert.equal(validateSmartTagPayload('A', 'wallets-bags').valid, false);
  assert.equal(validateSmartTagPayload('My Bag', 'wallets-bags', 'Safe note').valid, true);
  assert.equal(validateSmartTagPayload('My Bag', 'wallets-bags', 'x'.repeat(301)).valid, false);

  assert.equal(validateTagRelayPayload('Hi').valid, false);
  assert.equal(validateTagRelayPayload('Found at Sadat Metro desk').valid, true);

  assert.equal(validateWatchlistPayload('B', 25).valid, false);
  assert.equal(validateWatchlistPayload('Black Bag', 0).valid, false);
  assert.equal(validateWatchlistPayload('Black Bag', 25).valid, true);

  assert.equal(validateModerationReason('bad').valid, false);
  assert.equal(validateModerationReason('Suspicious duplicate scam post').valid, true);

  const friendly = formatFriendlyFirestoreError(
    new Error(JSON.stringify({ error: 'Missing or insufficient permissions.' })),
    false
  );
  assert.ok(friendly.includes('verify your account'));
});

test('computeAdminMetrics aggregates users, chats, deduplicated recoveries, and rankings accurately', () => {
  const now = 1_760_000_000_000;
  const day = 24 * 60 * 60 * 1000;
  const summary = computeAdminMetrics({
    nowMs: now,
    users: [
      { uid: 'u1', email: 'a@test.eg', createdAtMs: now - 2 * day, updatedAtMs: now - 3600_000 },
      { uid: 'u2', email: 'b@test.eg', createdAtMs: now - 20 * day, updatedAtMs: now - 3 * day },
      { uid: 'u3', email: 'c@test.eg', createdAtMs: now - 30 * day, updatedAtMs: now - 15 * day },
    ],
    reports: [
      {
        id: 'r1',
        ownerId: 'u1',
        ownerDisplayName: 'A',
        type: 'lost',
        status: 'recovered',
        visibility: 'public',
        title: 'Lost Wallet',
        description: 'Black leather wallet lost in Nasr City',
        category: 'wallets-bags',
        color: 'black',
        governorateId: 'cairo',
        cityId: 'nasr-city',
        publicLat: 30.05,
        publicLng: 31.33,
        locationPrivacy: 'approximate',
        dateOccurred: '2026-11-10',
        isSensitiveDocument: false,
        photoUrls: [],
        createdAtMs: now - 2 * day,
        updatedAtMs: now - day,
      },
      {
        id: 'r2',
        ownerId: 'u2',
        ownerDisplayName: 'B',
        type: 'found',
        status: 'open',
        visibility: 'public',
        title: 'Found Keys',
        description: 'Found keys near Dokki Metro station',
        category: 'keys',
        color: 'silver',
        governorateId: 'giza',
        cityId: 'dokki',
        publicLat: 30.03,
        publicLng: 31.21,
        locationPrivacy: 'approximate',
        dateOccurred: '2026-11-12',
        isSensitiveDocument: false,
        photoUrls: [],
        createdAtMs: now - day,
        updatedAtMs: now - day,
      },
    ],
    recoveryCases: [
      {
        id: 'case1',
        reportId: 'r1',
        reportTitle: 'Lost Wallet',
        ownerId: 'u1',
        counterpartyId: 'u2',
        stage: 'item_returned',
        lastMessageText: 'Returned at Metro desk',
        lastMessageAtMs: now - day,
        createdAtMs: now - 2 * day,
        updatedAtMs: now - day,
      },
      {
        id: 'case2',
        reportId: 'r2',
        reportTitle: 'Found Keys',
        ownerId: 'u2',
        counterpartyId: 'u3',
        stage: 'ownership_verification',
        lastMessageText: 'Which keychain?',
        lastMessageAtMs: now - 3600_000,
        createdAtMs: now - day,
        updatedAtMs: now - 3600_000,
      },
    ],
    organizations: [],
    institutionalRecords: [],
    supportTickets: [],
    moderationCases: [],
    smartTagsCount: 5,
    tagScansCount: 2,
    watchlistsCount: 3,
  });

  assert.equal(summary.totalUsers, 3);
  assert.equal(summary.activeUsers24h, 1);
  assert.equal(summary.activeUsers7d, 2);
  assert.equal(summary.newUsers7d, 1);
  assert.equal(summary.chatsStarted, 2);
  assert.equal(summary.activeChats, 1);
  assert.equal(summary.chatParticipants, 3);
  // r1 + case1 share reportId 'r1' -> deduplicated to 1 recovered item
  assert.equal(summary.recoveredItems, 1);
  assert.equal(summary.recoveryRatePct, 50);
  assert.equal(summary.smartTagsCount, 5);
  assert.equal(summary.tagScansCount, 2);
  assert.equal(summary.watchlistsCount, 3);
});

test('phone normalization validates Egyptian & international numbers and formats E.164', () => {
  const local = normalizeEgyptPhone('01012345678');
  assert.equal(local.valid, true);
  assert.equal(local.e164, '+201012345678');
  assert.equal(local.waDigits, '201012345678');

  const arabicDigits = normalizeEgyptPhone('٠١١٢٣٤٥٦٧٨٩');
  assert.equal(arabicDigits.valid, true);
  assert.equal(arabicDigits.e164, '+201123456789');

  const intl = normalizeEgyptPhone('+20 12 3456 7890');
  assert.equal(intl.valid, true);
  assert.equal(intl.e164, '+201234567890');

  assert.equal(normalizeEgyptPhone('010123').valid, false);
  assert.equal(normalizeEgyptPhone('abc').valid, false);
  assert.ok(maskPhone('+201012345678').endsWith('78'));
});

test('supervisor email invite IDs are deterministic and strictly match Firestore ID regex', () => {
  const idA = makeInviteDocId(' Supervisor@Example.COM ');
  const idB = makeInviteDocId('supervisor@example.com');
  assert.equal(idA, idB);
  assert.equal(validateId(idA), true);
  assert.equal(normalizeSupervisorEmail('  Admin@Test.EG '), 'admin@test.eg');
  assert.equal(isValidEmailAddress('admin@test.eg'), true);
  assert.equal(isValidEmailAddress('bad-email'), false);
  assert.equal(findAvatarPreset('avatar:lotus')?.id, 'lotus');
});

test('all Egypt cities & neighborhoods (including Mokattam, El Khalifa, Sayeda Zeinab, Helwan, Imbaba) have valid bounds and unique IDs', () => {
  const govIds = new Set<string>();
  for (const gov of EGYPT_GOVERNORATES) {
    assert.ok(!govIds.has(gov.id), `Duplicate gov id ${gov.id}`);
    govIds.add(gov.id);
    const cityIds = new Set<string>();
    for (const city of gov.cities) {
      assert.ok(!cityIds.has(city.id), `Duplicate city id ${gov.id}/${city.id}`);
      cityIds.add(city.id);
      assert.ok(city.nameAr.length > 0 && city.nameEn.length > 0);
      assert.ok(city.lat >= 22 && city.lat <= 32, `lat out of bounds for ${city.id}`);
      assert.ok(city.lng >= 25 && city.lng <= 37, `lng out of bounds for ${city.id}`);
      assert.ok(city.districts.length >= 1, `${city.id} should have districts`);
      const distIds = new Set<string>();
      for (const dist of city.districts) {
        assert.ok(!distIds.has(dist.id), `Duplicate district id ${city.id}/${dist.id}`);
        distIds.add(dist.id);
        assert.ok(dist.nameAr.length > 0 && dist.nameEn.length > 0);
        assert.ok(dist.lat >= 22 && dist.lat <= 32, `lat out of bounds for ${dist.id}`);
        assert.ok(dist.lng >= 25 && dist.lng <= 37, `lng out of bounds for ${dist.id}`);
      }
    }
  }

  assert.equal(findCity('cairo', 'mokattam')?.nameAr, 'المقطم');
  assert.equal(findDistrict('cairo', 'mokattam', 'mokattam-upper')?.nameAr, 'الهضبة العليا - المقطم');
  assert.equal(findCity('cairo', 'el-khalifa')?.nameAr, 'الخليفة والقلعة');
  assert.equal(findDistrict('cairo', 'el-khalifa', 'sayeda-aisha')?.nameAr, 'ميدان السيدة عائشة');
  assert.equal(findCity('cairo', 'sayeda-zeinab')?.nameAr, 'السيدة زينب ومصر القديمة');
  assert.equal(findCity('cairo', 'helwan')?.nameAr, 'حلوان والمعصرة والتبين و15 مايو');
  assert.equal(findCity('giza', 'imbaba-warraq')?.nameAr, 'إمبابة والوراق وأوسيم وكرداسة');
  assert.equal(findCity('alexandria', 'west-alex-agami')?.nameAr, 'غرب الإسكندرية والعجمي والعامرية وبرج العرب');
});

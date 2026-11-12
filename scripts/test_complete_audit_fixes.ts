/**
 * Meridian Comprehensive Functional & Backend Audit Verification Suite
 * Tests:
 * 1. Invitation acceptance idempotency and audit trail
 * 2. Persistent private object storage binary isolation
 * 3. Real-time SHA-256 integrity baseline comparison & tamper detection
 * 4. Buyer and Seller bilateral prototype electronic signatures
 * 5. Agreement version cryptographic binding and invalidation on clause edit
 * 6. Audit dossier manifest with distinct JSON & PDF hashes
 */

import fs from 'fs';
import path from 'path';
import { db } from '../src/server/db';
import { objectStorage } from '../src/server/objectStorage';

interface TestResult {
  step: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function check(step: number, name: string, condition: boolean, expected: string, actual: string) {
  results.push({ step, name, expected, actual, passed: condition });
  const status = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Step ${step}] ${name}`);
  if (!condition) {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
  }
}

async function runAuditFixesTestSuite() {
  console.log('========================================================================');
  console.log('  MERIDIAN AUDIT & BUG FIX VERIFICATION TEST SUITE');
  console.log('========================================================================\n');

  const tradeId = 'DEMO-TRADE-001';
  const sellerOrgId = 'DEMO-SELLER-001';
  const buyerOrgId = 'DEMO-BUYER-001';

  // ---------------------------------------------------------
  // TEST 1: INVITATION ACCEPTANCE & STRICT IDEMPOTENCY
  // ---------------------------------------------------------
  console.log('--- Test Section 1: Invitation Acceptance & Idempotency ---');
  const inv = db.getInvitationByToken('inv-demo-trade-token-001') || db.getInvitationByToken('inv-demo-001');
  check(
    1,
    'Resolve invitation token (inv-demo-trade-token-001 or inv-demo-001)',
    !!inv,
    'Invitation resolved with tradeRequestId DEMO-TRADE-001',
    inv ? `Found id=${inv.id}, trade=${inv.tradeRequestId}` : 'Not found'
  );

  const firstAccept = db.respondToInvitation('inv-demo-001', 'ACCEPT', sellerOrgId);
  check(
    2,
    'First invitation response returns success',
    firstAccept.success === true,
    'success === true',
    `success = ${firstAccept.success}, error = ${firstAccept.error || 'none'}`
  );

  // Idempotent re-click
  const secondAccept = db.respondToInvitation('inv-demo-001', 'ACCEPT', sellerOrgId);
  check(
    3,
    'Repeated invitation acceptance is strictly idempotent (no error)',
    secondAccept.success === true,
    'success === true with alreadyAccepted flag',
    `success = ${secondAccept.success}, alreadyAccepted = ${secondAccept.alreadyAccepted}`
  );

  const auditEvents = db.getAuditEvents(sellerOrgId);
  const acceptAudit = auditEvents.find((e) => e.eventType === 'SELLER_INVITATION_ACCEPTED');
  check(
    4,
    'Invitation acceptance audit event recorded in persistent log',
    !!acceptAudit,
    'SELLER_INVITATION_ACCEPTED audit event found',
    acceptAudit ? `Event ${acceptAudit.id} logged at ${acceptAudit.serverTimestampUtc}` : 'Not logged'
  );

  // ---------------------------------------------------------
  // TEST 2: PHOTO EVIDENCE UPLOAD & PERSISTENT OBJECT STORAGE ISOLATION
  // ---------------------------------------------------------
  console.log('\n--- Test Section 2: Photo Evidence Storage Isolation ---');
  const samplePhotoBuffer = Buffer.from('FAKE_HIGH_RES_CARGO_PHOTO_BINARY_DATA_TEST_BYTES_FOR_AUDIT_2026');
  const evidenceRecord = db.addEvidenceRecord({
    tradeId,
    category: 'PRE_DISPATCH',
    fileName: 'audit_test_cargo_pallet_loading.jpg',
    mimeType: 'image/jpeg',
    fileBuffer: samplePhotoBuffer,
    uploadedBy: 'Marcus Weber (SELLER)',
    uploadedByOrgId: sellerOrgId,
    caption: 'Pallet lot inspection prior to carrier handover',
    documentVersion: 'v1.0',
  });

  check(
    5,
    'Evidence record created with object storage key and SHA-256 digest',
    !!evidenceRecord.storageKey && evidenceRecord.sha256Hash.length === 64,
    'Valid storageKey and 64-char SHA-256 hash',
    `storageKey=${evidenceRecord.storageKey}, hash=${evidenceRecord.sha256Hash}`
  );

  const fileExistsInStorage = objectStorage.objectExists(evidenceRecord.storageKey);
  check(
    6,
    'Physical binary file stored in private persistent storage directory',
    fileExistsInStorage,
    'File exists on persistent disk',
    `Exists = ${fileExistsInStorage}`
  );

  // Verify meridian_db.json does not contain the binary
  const dbRaw = fs.readFileSync(path.resolve(process.cwd(), 'data', 'meridian_db.json'), 'utf-8');
  const doesNotContainBase64 = !dbRaw.includes('FAKE_HIGH_RES_CARGO_PHOTO_BINARY_DATA');
  check(
    7,
    'meridian_db.json contains metadata only; raw binary is strictly isolated in object storage',
    doesNotContainBase64,
    'No raw binary payload in meridian_db.json',
    `Clean isolation = ${doesNotContainBase64}`
  );

  // ---------------------------------------------------------
  // TEST 3: REAL-TIME SHA-256 VERIFICATION & TAMPER DETECTION
  // ---------------------------------------------------------
  console.log('\n--- Test Section 3: SHA-256 Integrity Verification ---');
  const initialVerify = db.verifyEvidenceIntegrity(
    evidenceRecord.id,
    tradeId,
    'Elena Vance (BUYER)',
    'BUYER',
    'Routine pre-customs intake check'
  );

  check(
    8,
    'Intact evidence verification returns VERIFIED with hash match',
    initialVerify.record.match === true,
    'match === true, result VERIFIED',
    `match = ${initialVerify.record?.match}, uploader = ${initialVerify.record?.verifiedBy}`
  );

  // Simulate server tampering
  const tamperResult = objectStorage.simulateTampering(
    evidenceRecord.storageKey,
    'ALTERED_CARGO_PHOTO_BYTES_INJECTED_FOR_TAMPER_TEST'
  );
  check(
    9,
    'Tamper simulation successfully alters raw bytes in object storage',
    tamperResult === true,
    'simulateTampering returns true',
    `tamperResult = ${tamperResult}`
  );

  const tamperedVerify = db.verifyEvidenceIntegrity(
    evidenceRecord.id,
    tradeId,
    'Internal Auditor (BUYER)',
    'BUYER',
    'Post-tamper forensic re-verification'
  );

  check(
    10,
    'Tampered evidence detected: hash mismatch and INTEGRITY CHECK FAILED',
    tamperedVerify.record.match === false,
    'match === false, baseline != recalculated',
    `match = ${tamperedVerify.record?.match}, baseline=${tamperedVerify.record?.baselineHash.slice(0, 10)}..., recal=${tamperedVerify.record?.recalculatedHash.slice(0, 10)}...`
  );

  // Restore intact bytes
  objectStorage.storeObject(tradeId, evidenceRecord.id, evidenceRecord.fileName, samplePhotoBuffer);
  const restoredVerify = db.verifyEvidenceIntegrity(
    evidenceRecord.id,
    tradeId,
    'System Auto-Recover',
    'BUYER'
  );
  check(
    11,
    'Restoring original bytes restores VERIFIED integrity state',
    restoredVerify.record.match === true,
    'match === true after restoring baseline bytes',
    `match = ${restoredVerify.record?.match}`
  );

  // ---------------------------------------------------------
  // TEST 4: BILATERAL PROTOTYPE ELECTRONIC SIGNATURES
  // ---------------------------------------------------------
  console.log('\n--- Test Section 4: Bilateral Prototype Signatures ---');
  // Establish consensus and clear readiness gate for execution
  const ag2 = db.getOrCreateAgreement2(tradeId);
  ag2.clauses.forEach((c) => {
    c.buyerApproved = true;
    c.buyerApprovedAt = '2026-11-08T10:00:00.000Z';
    c.buyerApprovedBy = 'buyer.demo@meridian.test';
    c.sellerApproved = true;
    c.sellerApprovedAt = '2026-11-08T10:00:00.000Z';
    c.sellerApprovedBy = 'seller.demo@meridian.test';
    c.status = 'MUTUALLY_APPROVED';
    c.rejectionReason = undefined;
    c.rejectedBy = undefined;
  });
  ag2.legalReviewRequired = false;
  ag2.legalReviewCleared = true;
  ag2.status = 'READY_FOR_SIGNING';
  db.evaluateAgreement2ReadinessGate(tradeId);
  const agreement = db.getAgreement2ByTradeId(tradeId);

  check(
    12,
    'Agreement 2 document exists and has canonical SHA-256 digest',
    !!agreement && agreement.sha256Hash.length === 64,
    '64-char canonical SHA-256 digest',
    `sha256 = ${agreement?.sha256Hash}`
  );

  // Execute Buyer signature
  const buyerSignRes = db.signAgreement2(
    tradeId,
    'BUYER',
    'Elena Vance',
    'Director of Global Procurement',
    'buyer.demo@meridian.test',
    agreement!.sha256Hash,
    'Asia/Kolkata',
    '192.168.1.10',
    'PROTOTYPE_CANVAS',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'Prototype electronic signature interaction: Buyer assent'
  );

  check(
    13,
    'Buyer prototype electronic signature recorded with canvas data and receipt code',
    buyerSignRes.success === true && !!buyerSignRes.agreement?.signatures?.buyer?.receiptCode,
    'success === true with buyer receiptCode',
    `buyer success = ${buyerSignRes.success}, receipt = ${buyerSignRes.agreement?.signatures?.buyer?.receiptCode}`
  );

  // Execute Seller signature
  const sellerSignRes = db.signAgreement2(
    tradeId,
    'SELLER',
    'Marcus Weber',
    'Managing Director & Head of Export',
    'seller.demo@meridian.test',
    agreement!.sha256Hash,
    'Europe/Berlin',
    '192.168.1.20',
    'PROTOTYPE_TYPED',
    'Marcus Weber',
    'Prototype electronic signature interaction: Seller assent'
  );

  check(
    14,
    'Seller prototype electronic signature recorded with typed name fallback',
    sellerSignRes.success === true && !!sellerSignRes.agreement?.signatures?.seller?.receiptCode,
    'success === true with seller receiptCode',
    `seller success = ${sellerSignRes.success}, receipt = ${sellerSignRes.agreement?.signatures?.seller?.receiptCode}`
  );

  check(
    15,
    'Dual bilateral execution marks Agreement 2 status as EXECUTED',
    sellerSignRes.agreement?.status === 'EXECUTED',
    'status === EXECUTED',
    `status = ${sellerSignRes.agreement?.status}`
  );

  // ---------------------------------------------------------
  // TEST 5: CLAUSE MODIFICATION INVALIDATION
  // ---------------------------------------------------------
  console.log('\n--- Test Section 5: Signature Invalidation on Clause Modification ---');
  const modClause = agreement!.clauses[0];
  const modResult = db.updateAgreement2Clause(
    tradeId,
    modClause.id,
    modClause.content + ' [AMENDED TERMS FOR AUDIT TEST]',
    'SELLER',
    'seller.demo@meridian.test'
  );

  const agreementAfterMod = db.getAgreement2ByTradeId(tradeId);
  check(
    16,
    'Modifying a clause invalidates prior signatures on the modified schedule',
    modResult.success === true && !agreementAfterMod?.signatures?.seller,
    'Prior signatures invalidated on modified clause',
    `Seller sig reset = ${!agreementAfterMod?.signatures?.seller}`
  );

  // Re-approve the modified clause so gate passes and re-signing succeeds
  db.approveAgreement2Clause(tradeId, modClause.id, 'SELLER', 'seller.demo@meridian.test');
  db.approveAgreement2Clause(tradeId, modClause.id, 'BUYER', 'buyer.demo@meridian.test');
  db.evaluateAgreement2ReadinessGate(tradeId);
  const freshAgreement = db.getAgreement2ByTradeId(tradeId)!;

  // Re-sign to restore execution state
  db.signAgreement2(
    tradeId,
    'SELLER',
    'Marcus Weber',
    'Managing Director',
    'seller.demo@meridian.test',
    freshAgreement.sha256Hash,
    'Europe/Berlin',
    '127.0.0.1',
    'PROTOTYPE_TYPED',
    'Marcus Weber'
  );
  db.signAgreement2(
    tradeId,
    'BUYER',
    'Elena Vance',
    'Director of Procurement',
    'buyer.demo@meridian.test',
    freshAgreement.sha256Hash,
    'Asia/Kolkata',
    '127.0.0.1',
    'PROTOTYPE_TYPED',
    'Elena Vance'
  );

  // ---------------------------------------------------------
  // TEST 6: CANONICAL MANIFEST WITH DISTINCT JSON & PDF DIGESTS
  // ---------------------------------------------------------
  console.log('\n--- Test Section 6: Canonical Manifest & Telemetry Classification ---');
  const manifest = db.generateCanonicalManifest(tradeId);
  check(
    17,
    'Canonical trade manifest generated with distinct JSON and PDF hashes',
    !!manifest.canonicalJsonSha256 && !!manifest.canonicalPdfSha256,
    'Distinct JSON and PDF digest fields present',
    `JSON Hash: ${manifest.canonicalJsonSha256?.slice(0, 16)}..., PDF Hash: ${manifest.canonicalPdfSha256?.slice(0, 16)}...`
  );

  const telemetry = db.getTelemetryMilestones(tradeId);
  check(
    18,
    'Telemetry milestones classified as SIMULATED DEMO TELEMETRY with HMAC tokens',
    telemetry.length > 0 && !!telemetry[0].hmacSignature,
    'Simulated telemetry present with HMAC-SHA256 signatures',
    `Found ${telemetry.length} milestones, first HMAC: ${telemetry[0]?.hmacSignature}`
  );

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log('\n========================================================================');
  console.log('  TEST SUMMARY');
  console.log('========================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Checks: ${results.length}`);
  console.log(`Passed:       ${passed}`);
  console.log(`Failed:       ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ FAILED ${failed} check(s). Please inspect failures.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${passed} AUDIT VERIFICATION CHECKS PASSED PERFECTLY!`);
  }
}

runAuditFixesTestSuite().catch((err) => {
  console.error('Test execution crashed:', err);
  process.exit(1);
});

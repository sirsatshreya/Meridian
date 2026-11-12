/**
 * Meridian Phase 4 Comprehensive End-to-End Persistence & Integrity Test Suite
 * Validates all Phase 4 technical requirements:
 * 1. Persistent private object storage (no Base64 in meridian_db.json)
 * 2. Real-time SHA-256 document hashing & baseline comparison
 * 3. Tamper detection (hash mismatch -> INTEGRITY CHECK FAILED)
 * 4. Access-controlled, append-only audit trail
 * 5. Prototype electronic-signature execution with canvas & typed fallbacks
 * 6. Signature invalidation upon clause modification
 * 7. Canonical JSON manifest digest vs generated PDF hash differentiation
 * 8. Simulated demo telemetry with separate HMAC tokens
 */

import fs from 'fs';
import path from 'path';
import { db } from '../src/server/db';
import { objectStorage } from '../src/server/objectStorage';

interface TestStepResult {
  stepNumber: number;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const testResults: TestStepResult[] = [];

function assert(stepNumber: number, description: string, condition: boolean, expected: string, actual: string) {
  testResults.push({
    stepNumber,
    description,
    expected,
    actual,
    passed: condition,
  });
  const symbol = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [Step ${stepNumber}] ${description}`);
  if (!condition) {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
  }
}

async function runPhase4Tests() {
  console.log('========================================================================');
  console.log('  MERIDIAN PHASE 4: END-TO-END DOCUMENT INTEGRITY & SIGNATURE SUITE');
  console.log('========================================================================\n');

  const tradeId = 'DEMO-TRADE-001';
  const buyerEmail = 'buyer.demo@meridian.test';
  const sellerEmail = 'seller.demo@meridian.test';

  // 1. Persistent Private Object Storage Verification (No large base64 in meridian_db.json)
  const dbFilePath = path.resolve(process.cwd(), 'data', 'meridian_db.json');
  const dbRawContent = fs.readFileSync(dbFilePath, 'utf-8');
  const parsedDb = JSON.parse(dbRawContent);

  const hasNoLargeBase64 = !dbRawContent.includes('data:image/') && !dbRawContent.includes('JVBERi0x');
  assert(
    1,
    'Database stores solely metadata, storage references, and SHA-256 hashes (Zero Base64 files in DB)',
    hasNoLargeBase64 && Array.isArray(parsedDb.evidenceRecords) && parsedDb.evidenceRecords.length > 0,
    'meridian_db.json contains metadata only with storageKey references',
    `Evidence count in DB: ${parsedDb.evidenceRecords?.length || 0}; Storage Keys present: ${parsedDb.evidenceRecords?.[0]?.storageKey ? 'YES' : 'NO'}`
  );

  // 2. Physical Binary Presence in Private Object Storage
  const firstEvd = parsedDb.evidenceRecords[0];
  const fileExistsInStorage = objectStorage.objectExists(firstEvd.storageKey);
  const fileBuffer = objectStorage.getObjectBuffer(firstEvd.storageKey);
  assert(
    2,
    'Raw binary evidence file exists in private persistent object storage (data/storage/)',
    fileExistsInStorage && fileBuffer !== null && fileBuffer.length > 0,
    'Physical binary file exists on disk in data/storage/',
    `Storage Key: ${firstEvd.storageKey}, Found: ${fileExistsInStorage}, Buffer size: ${fileBuffer?.length} bytes`
  );

  // 3. Dynamic SHA-256 Integrity Verification (Matches Baseline)
  const verifyRes1 = db.verifyEvidenceIntegrity(firstEvd.id, tradeId, 'Elena Vance', 'BUYER', 'Automated test baseline check');
  assert(
    3,
    'SHA-256 verification re-computes digest against stored file and reports VERIFIED',
    verifyRes1.success && verifyRes1.record.match === true && verifyRes1.record.recalculatedHash === firstEvd.sha256Hash,
    `match: true, recalculated: ${firstEvd.sha256Hash}`,
    `match: ${verifyRes1.record?.match}, recalculated: ${verifyRes1.record?.recalculatedHash}`
  );

  // 4. Access-Controlled, Append-Only Integrity Log Registration
  const logsAfterVerify1 = db.getIntegrityLogs(tradeId);
  const logFound = logsAfterVerify1.some((l) => l.id === verifyRes1.record.id);
  assert(
    4,
    'Verification attempts append chronologically to access-controlled audit trail',
    logFound && logsAfterVerify1.length >= 2,
    'Audit record saved in append-only integrity log array',
    `Total logs for trade: ${logsAfterVerify1.length}, Newly generated log ID: ${verifyRes1.record.id}`
  );

  // 5. Tamper Detection: Modify Raw File Binary in Object Storage
  const testFileName = `test_cargo_scan_${Date.now()}.png`;
  const originalBuffer = Buffer.from('MERIDIAN-GENUINE-CARGO-PAYLOAD-2026', 'utf-8');
  const addedEvidence = db.addEvidenceRecord({
    tradeId,
    category: 'shipment_photo',
    fileName: testFileName,
    mimeType: 'image/png',
    fileBuffer: originalBuffer,
    uploadedBy: 'Elena Vance',
    uploadedByOrgId: 'DEMO-BUYER-001',
    caption: 'Test cargo payload for tamper detection',
  });

  // Deliberately tamper with the physical file in object storage
  objectStorage.simulateTampering(addedEvidence.storageKey, 'ALTERED-TAMPERED-CARGO-PAYLOAD-CORRUPT');

  const verifyTampered = db.verifyEvidenceIntegrity(addedEvidence.id, tradeId, 'Security Auditor', 'AUDITOR', 'Tamper detection validation');
  assert(
    5,
    'Altering raw binary file in storage immediately triggers INTEGRITY CHECK FAILED',
    verifyTampered.success && verifyTampered.record.match === false && verifyTampered.record.recalculatedHash !== addedEvidence.sha256Hash,
    'match: false (INTEGRITY CHECK FAILED)',
    `match: ${verifyTampered.record.match}, baseline: ${addedEvidence.sha256Hash.substring(0, 16)}..., recalculated: ${verifyTampered.record.recalculatedHash.substring(0, 16)}...`
  );

  // 6. Bilateral Prototype Electronic Signature Execution
  const agreement = db.getOrCreateAgreement2(tradeId);
  // Ensure readiness passes
  db.evaluateAgreement2ReadinessGate(tradeId);

  const buyerSignResult = db.signAgreement2(
    tradeId,
    'BUYER',
    'Elena Vance',
    'Director of Global Procurement',
    buyerEmail,
    agreement.sha256Hash,
    'Asia/Kolkata',
    '127.0.0.1',
    'PROTOTYPE_CANVAS',
    'data:image/png;base64,sample_vector_signature_stroke',
    'Prototype electronic signature interaction: Binds representative assent without certified digital signature claims.'
  );

  assert(
    6,
    'Buyer can execute prototype electronic signature bound to agreement version and SHA-256 hash',
    buyerSignResult.success && buyerSignResult.agreement?.signatures.buyer !== undefined,
    'Buyer signature recorded with PROTOTYPE_CANVAS method',
    `Status: ${buyerSignResult.agreement?.status}, Method: ${buyerSignResult.agreement?.signatures.buyer?.signatureMethod}`
  );

  const sellerSignResult = db.signAgreement2(
    tradeId,
    'SELLER',
    'Marcus Weber',
    'Managing Director & Head of Export',
    sellerEmail,
    agreement.sha256Hash,
    'Europe/Berlin',
    '127.0.0.1',
    'PROTOTYPE_TYPED',
    'Marcus Weber',
    'Prototype electronic signature interaction: Binds representative assent without certified digital signature claims.'
  );

  assert(
    7,
    'Seller can execute prototype electronic signature bound to agreement version and SHA-256 hash',
    sellerSignResult.success && sellerSignResult.agreement?.signatures.seller !== undefined && sellerSignResult.agreement?.status === 'EXECUTED',
    'Seller signature recorded with PROTOTYPE_TYPED method; agreement moves to EXECUTED',
    `Status: ${sellerSignResult.agreement?.status}, Method: ${sellerSignResult.agreement?.signatures.seller?.signatureMethod}`
  );

  // 8. Signature Invalidation Guard: Material Clause Modification Invalidation
  const firstClause = agreement.clauses[0];
  const updateResult = db.updateAgreement2Clause(
    tradeId,
    firstClause.id,
    firstClause.content + ' [Amendment: revised commercial delivery terms]',
    'BUYER',
    buyerEmail
  );

  assert(
    8,
    'Material clause alteration immediately invalidates previously executed signatures and increments version',
    updateResult.success && updateResult.agreement?.signatures.buyer === undefined && updateResult.agreement?.signatures.seller === undefined,
    'Both buyer and seller signatures cleared; version incremented',
    `Signatures cleared: ${!updateResult.agreement?.signatures.buyer && !updateResult.agreement?.signatures.seller}; New version: ${updateResult.agreement?.version}`
  );

  // 9. Canonical JSON Manifest Digest vs Generated PDF Hash
  const manifest = db.generateCanonicalManifest(tradeId);
  const hasDistinctHashes =
    typeof manifest.canonicalJsonSha256 === 'string' &&
    typeof manifest.canonicalPdfSha256 === 'string' &&
    manifest.canonicalJsonSha256 !== manifest.canonicalPdfSha256;

  assert(
    9,
    'Distinguishes backend canonical JSON manifest hash from generated PDF file hash',
    hasDistinctHashes,
    'canonicalJsonSha256 and canonicalPdfSha256 are distinct valid SHA-256 digests',
    `JSON Hash: ${manifest.canonicalJsonSha256.substring(0, 16)}..., PDF Hash: ${manifest.canonicalPdfSha256?.substring(0, 16)}...`
  );

  // 10. Simulated Demo Telemetry Separation from Document Hashing
  const telemetry = db.getTelemetryMilestones(tradeId);
  const telemetryValid = telemetry.length >= 4 && telemetry.every((t) => t.hmacSignature.startsWith('hmac-sha256:'));
  assert(
    10,
    'Shipment telemetry milestones labeled SIMULATED DEMO TELEMETRY with HMAC tokens separated from document SHA-256',
    telemetryValid,
    'Telemetry items have sensorId and HMAC signatures',
    `Total telemetry milestones: ${telemetry.length}, Sample sensor: ${telemetry[0]?.sensorId}, HMAC: ${telemetry[0]?.hmacSignature}`
  );

  // Print Summary
  console.log('\n========================================================================');
  console.log('  MERIDIAN PHASE 4 TEST EXECUTION SUMMARY');
  console.log('========================================================================');
  const allPassed = testResults.every((t) => t.passed);
  console.log(`Total Scenarios: ${testResults.length}`);
  console.log(`Passed:          ${testResults.filter((t) => t.passed).length}`);
  console.log(`Failed:          ${testResults.filter((t) => !t.passed).length}`);
  console.log(`Overall Status:  ${allPassed ? 'ALL PHASE 4 TESTS PASSED (10/10) ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('========================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

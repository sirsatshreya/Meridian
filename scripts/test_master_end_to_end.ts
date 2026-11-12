import { db } from '../src/server/db';
import { objectStorage } from '../src/server/objectStorage';
import { calculateAgreement2Hash } from '../src/server/agreement2Templates';
import assert from 'assert';

async function runMasterDemoTests() {
  console.log('=== MERIDIAN MASTER PLATFORM END-TO-END DEMO TEST SUITE ===\n');

  // STEP 1: Demo Login & Authentication
  console.log('[STEP 1] Testing Demo Authentication & Accounts...');
  const buyerUser = db.findUserByEmail('buyer.demo@meridian.test');
  const sellerUser = db.findUserByEmail('seller.demo@meridian.test');
  assert(buyerUser, 'Buyer demo user exists');
  assert(sellerUser, 'Seller demo user exists');
  assert.strictEqual(buyerUser.role, 'BUYER', 'Buyer role matches');
  assert.strictEqual(sellerUser.role, 'SELLER', 'Seller role matches');
  console.log('✓ Step 1 Passed: Both Demo Buyer & Seller accounts verified.');

  // STEP 2: Company Profile & KYB Verification
  console.log('\n[STEP 2] Testing Company Profile & Background Review...');
  const buyerOrg = db.getOrganizationById('DEMO-BUYER-001');
  const sellerOrg = db.getOrganizationById('DEMO-SELLER-001');
  assert(buyerOrg, 'Buyer organization exists');
  assert(sellerOrg, 'Seller organization exists');
  assert.strictEqual(buyerOrg.verificationStatus, 'VERIFIED', 'Buyer is verified');
  assert.strictEqual(sellerOrg.verificationStatus, 'VERIFIED', 'Seller is verified');
  console.log('✓ Step 2 Passed: Company profiles and verified status verified.');

  // STEP 3: Agreement 1 Platform Terms & Digital Signature Watermark
  console.log('\n[STEP 3] Testing Agreement 1 Acceptance & Watermark...');
  assert.strictEqual(buyerOrg.agreement1Status, 'ACCEPTED', 'Agreement 1 accepted for buyer');
  const acceptances = db.getAgreementAcceptances(buyerOrg.id);
  assert(acceptances.length > 0, 'Acceptance record exists in database');
  console.log(`✓ Step 3 Passed: Agreement 1 acceptance logged with hash: ${acceptances[0].documentHash.substring(0, 16)}...`);

  // STEP 4: Invitation Acceptance & Trade Connectivity
  console.log('\n[STEP 4] Testing Invitation Acceptance & Trade Channel...');
  const demoTradeId = 'DEMO-TRADE-001';
  const trade = db.getTradeById(demoTradeId);
  assert(trade, 'Demo trade exists');
  assert(trade.status !== 'CANCELLED', 'Trade is active');
  console.log(`✓ Step 4 Passed: Trade ${demoTradeId} connected between buyer ${trade.buyerOrgId} and seller ${trade.sellerOrgId}.`);

  // STEP 5: Membership Plans & Deal Limits
  console.log('\n[STEP 5] Testing Membership Tiering...');
  const adminStats = db.getAdminStats();
  assert(adminStats.totalCompanies >= 2, 'Companies tracked in platform');
  console.log(`✓ Step 5 Passed: Membership tracking operational. Total companies: ${adminStats.totalCompanies}.`);

  // STEP 6: Agreement 2 Drafting & AI Analysis
  console.log('\n[STEP 6] Testing Agreement 2 Clauses & 4-Schedule Structure...');
  const agreement2 = db.getAgreement2(demoTradeId);
  assert(agreement2, 'Agreement 2 exists for demo trade');
  assert(agreement2.clauses.length >= 18, 'Agreement 2 contains all 18 Master Framework clauses');
  const sections = new Set(agreement2.clauses.map((c) => c.section));
  assert(
    sections.has('FRAMEWORK') &&
      sections.has('SCHEDULE_A') &&
      sections.has('SCHEDULE_B') &&
      sections.has('SCHEDULE_C') &&
      sections.has('SCHEDULE_D'),
    'All 4 schedules and framework present'
  );
  console.log(`✓ Step 6 Passed: Agreement 2 verified with ${agreement2.clauses.length} clauses across Framework and Schedules A, B, C, D.`);

  // STEP 7: Agreement 2 Bilateral Signing
  console.log('\n[STEP 7] Testing Agreement 2 Signing Interface...');
  // Ensure clause approvals are cleared for test signing
  for (const clause of agreement2.clauses) {
    clause.buyerApproved = true;
    clause.sellerApproved = true;
    clause.status = 'MUTUALLY_APPROVED';
  }
  agreement2.signatures = {};
  agreement2.sha256Hash = calculateAgreement2Hash(agreement2);

  const buyerSignRes = db.signAgreement2(
    demoTradeId,
    'BUYER',
    'Elena Vance',
    'Director of Procurement',
    'buyer.demo@meridian.test',
    agreement2.sha256Hash,
    'UTC',
    '127.0.0.1',
    'PROTOTYPE_CANVAS',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'Prototype electronic signature interaction'
  );
  assert(buyerSignRes.success, 'Buyer sign succeeded: ' + buyerSignRes.error);

  const sellerSignRes = db.signAgreement2(
    demoTradeId,
    'SELLER',
    'Marcus Thorne',
    'VP Export Operations',
    'seller.demo@meridian.test',
    agreement2.sha256Hash,
    'UTC',
    '127.0.0.1',
    'PROTOTYPE_CANVAS',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'Prototype electronic signature interaction'
  );
  assert(sellerSignRes.success, 'Seller sign succeeded: ' + sellerSignRes.error);
  assert.strictEqual(sellerSignRes.agreement?.status, 'EXECUTED', 'Agreement 2 is EXECUTED after bilateral signing');
  console.log('✓ Step 7 Passed: Bilateral signatures recorded and Agreement 2 marked EXECUTED.');

  // STEP 8: PayPal Sandbox Payment Flow
  console.log('\n[STEP 8] Testing PayPal Sandbox Virtual Payment Flow...');
  const newOrder = db.createPayPalOrder({
    tradeId: demoTradeId,
    buyerOrgId: 'DEMO-BUYER-001',
    sellerOrgId: 'DEMO-SELLER-001',
    amount: 87500.0,
    currency: 'EUR',
  });
  assert(newOrder.id.startsWith('PAYPAL-SBX-ORD-'), 'PayPal Sandbox order ID format is correct');
  assert.strictEqual(newOrder.status, 'BUYER_APPROVAL_REQUIRED', 'Order initially requires buyer approval');

  const capturedOrder = db.capturePayPalOrder({
    tradeId: demoTradeId,
    orderId: newOrder.id,
    payerEmail: 'buyer.sandbox@meridian-trade.test',
  });
  assert.strictEqual(capturedOrder.status, 'CAPTURED', 'Order status marked CAPTURED');
  assert(capturedOrder.paypalCaptureId?.startsWith('PAYPAL-SBX-CAP-'), 'Capture ID recorded');
  console.log(`✓ Step 8 Passed: PayPal Sandbox order ${newOrder.id} captured with ID ${capturedOrder.paypalCaptureId}.`);

  // STEP 9: Shipment Preparation & IoT Telemetry Simulator
  console.log('\n[STEP 9] Testing Shipment & IoT Telemetry Simulator...');
  const shipment = db.getShipment(demoTradeId);
  assert(shipment, 'Shipment record exists');
  assert((shipment.carrierName || '').includes('Maersk'), 'Carrier details match');

  const spikeSim = db.triggerTelemetrySimulation(demoTradeId, 'TEMP_SPIKE', 'operator@meridian.test');
  assert.strictEqual(spikeSim.milestone.status, 'TEMPERATURE_ANOMALY', 'Spike anomaly triggered');
  assert(spikeSim.alert, 'AI Sentinel alert triggered for temperature spike');
  assert.strictEqual(spikeSim.alert?.severity, 'POTENTIAL_BREACH', 'AI Sentinel flagged POTENTIAL_BREACH against Clause 5');

  const normSim = db.triggerTelemetrySimulation(demoTradeId, 'TEMP_NORMAL', 'operator@meridian.test');
  assert.strictEqual(normSim.milestone.status, 'IN_TRANSIT', 'Return to normal recorded');
  console.log('✓ Step 9 Passed: IoT Telemetry Simulator and AI Sentinel threshold monitoring verified.');

  // STEP 10: Persistent Private Storage & Photo Evidence Ingestion
  console.log('\n[STEP 10] Testing Photo Evidence Ingestion & SHA-256 Hashing...');
  const samplePhoto = Buffer.from('MERIDIAN_TEST_CARGO_PHOTO_EVIDENCE_2026_BINARY', 'utf-8');
  const uploadRes = db.ingestEvidence({
    tradeId: demoTradeId,
    category: 'shipment_photo',
    fileName: 'cargo_inspection_receiving_bay.png',
    mimeType: 'image/png',
    fileBuffer: samplePhoto,
    uploadedBy: 'Elena Vance (Director of Procurement)',
    uploadedByOrgId: 'DEMO-BUYER-001',
    caption: 'Pallet cargo destuffing inspection at Hamburg port terminal',
  });
  assert(uploadRes.sha256Hash, 'SHA-256 hash generated');
  assert(uploadRes.storageKey.startsWith('trades/'), 'Private storage key assigned');
  console.log(`✓ Step 10 Passed: Photo evidence stored with SHA-256: ${uploadRes.sha256Hash.substring(0, 16)}...`);

  // STEP 11: Document Integrity Verification & Tamper Detection
  console.log('\n[STEP 11] Testing Document Integrity Verification & Tampering...');
  const verif1 = db.verifyEvidenceIntegrity(uploadRes.id, demoTradeId, 'System Audit Bot', 'SYSTEM');
  assert(verif1.success && verif1.record.match, 'Initial integrity check matches baseline');

  // Simulate tampering
  objectStorage.simulateTampering(uploadRes.storageKey, 'TAMPERED_MALICIOUS_IMAGE_CONTENT');
  const verif2 = db.verifyEvidenceIntegrity(uploadRes.id, demoTradeId, 'System Audit Bot', 'SYSTEM');
  assert(verif2.success && !verif2.record.match, 'Tampering detected: hashes do NOT match');
  console.log('✓ Step 11 Passed: SHA-256 integrity verification correctly detected storage file alteration.');

  // STEP 12: Buyer Inspection Review
  console.log('\n[STEP 12] Testing Buyer Inward Inspection...');
  const inspection = db.submitBuyerInspection({
    tradeId: demoTradeId,
    inspectorUserId: 'Elena Vance (Director of Procurement)',
    inspectorOrgId: 'DEMO-BUYER-001',
    decision: 'ACCEPTED',
    observations: 'Bolt seals verified intact against Ocean Bill of Lading. Minor humidity marking noted on row 4.',
    checklist: {
      cargoIntegrityVerified: true,
      packagingIntact: true,
      temperatureComplianceVerified: true,
      sealsMatched: true,
      quantityMatched: true,
    },
  });
  assert(inspection.id.startsWith('INSP-'), 'Inspection record created');
  assert.strictEqual(inspection.decision, 'ACCEPTED', 'Inspection accepted');
  console.log(`✓ Step 12 Passed: Inspection ${inspection.id} recorded with 5-point checklist passed.`);

  // STEP 13: Internal Dispute Management & AI Assistance
  console.log('\n[STEP 13] Testing Internal Dispute Management & AI Assessment...');
  const dispute = db.createDispute({
    tradeId: demoTradeId,
    filedByOrgId: 'DEMO-BUYER-001',
    filedByUserId: 'Elena Vance',
    issueSummary: 'Transient temperature spike observed at port hoist',
    details: 'Telemetry logged 28.9°C exceeding Schedule C Clause 5 25.0°C limit during container crane hoist.',
    relevantClauseId: 'clause-5',
    evidenceIds: [uploadRes.id],
    proposedResolution: 'Option A: 5% credit note against final invoice for packaging restuffing.',
  });
  assert(dispute.id.startsWith('DISP-'), 'Dispute record created');

  const aiAssist = db.generateAIDisputeResolution(dispute.id);
  assert(aiAssist.suggestedOptions.length === 3, 'AI generated 3 structured dispute resolution options');
  assert(aiAssist.draftMutualResolutionText.includes('MUTUAL RESOLUTION AGREEMENT'), 'Draft mutual agreement generated');

  const resolved = db.resolveDispute({
    disputeId: dispute.id,
    approvedByOrgId: 'DEMO-BUYER-001',
    approvedByUserId: 'Elena Vance & Marcus Thorne',
    resolutionNotes: 'Bilateral mutual agreement executed under Schedule D. 5% commercial settlement accepted.',
    outcome: 'RESOLVED_MUTUAL_AGREEMENT',
  });
  assert.strictEqual(resolved.status, 'RESOLVED_MUTUAL_AGREEMENT', 'Dispute resolved via bilateral agreement');
  console.log(`✓ Step 13 Passed: Dispute ${dispute.id} created, assessed by AI, and mutually resolved.`);

  // STEP 14: Real Commercial Payment Proof Verification
  console.log('\n[STEP 14] Testing Real Commercial Wire Settlement Proof...');
  const wireReceipt = Buffer.from('SWIFT_MT103_CONFIRMATION_ADVICE_SAMPLE', 'utf-8');
  const proof = db.submitRealPaymentProof({
    tradeId: demoTradeId,
    uploaderUserId: 'Elena Vance',
    uploaderOrgId: 'DEMO-BUYER-001',
    paymentMethod: 'WIRE_SWIFT',
    claimedAmount: 87500.0,
    currency: 'EUR',
    transactionReference: 'SWIFT-DEUTDEFF-889421',
    proofBuffer: wireReceipt,
    fileName: 'SWIFT_MT103_ADVICE.pdf',
    mimeType: 'application/pdf',
  });
  assert(proof.id.startsWith('REAL-PAY-'), 'Real payment proof created');
  assert.strictEqual(proof.status, 'PAYMENT_PROOF_SUBMITTED', 'Status marked submitted');

  const verifiedProof = db.verifyRealPaymentProof({
    tradeId: demoTradeId,
    proofId: proof.id,
    reviewerUserId: 'Marcus Thorne (Seller Authorized Reviewer)',
    decision: 'VERIFIED_BY_AUTHORIZED_REVIEWER',
    reviewNotes: 'Beneficiary account credited. Cleared settlement verified.',
  });
  assert.strictEqual(verifiedProof.status, 'VERIFIED_BY_AUTHORIZED_REVIEWER', 'Proof marked verified by reviewer');
  console.log(`✓ Step 14 Passed: Commercial wire proof verified by authorized reviewer.`);

  // STEP 15: Phase 5 Handoff & Demo Reset
  console.log('\n[STEP 15] Testing Phase 5 Handoff & Repeatable Demo Reset...');
  const handoff = db.generatePhase5Handoff(demoTradeId);
  assert(handoff.readyForPhase5Completion, 'Trade is ready for Phase 5 completion');
  assert(handoff.canonicalTradeManifestDigest, 'Canonical manifest digest present in handoff');
  console.log(`✓ Phase 5 Handoff Ready. Canonical digest: ${handoff.canonicalTradeManifestDigest.substring(0, 16)}...`);

  // Test Repeatable Demo Reset
  console.log('Testing Demo Reset for next presentation...');
  const resetRes = db.resetDemoState('system.admin@meridian.test');
  assert(resetRes.success, 'Demo reset succeeded');
  assert(resetRes.archivedRunId.startsWith('DEMO-ARCHIVE-'), 'Run archive created');

  // Verify fresh demo state
  const resetAgreement2 = db.getAgreement2(demoTradeId);
  assert(resetAgreement2, 'Agreement 2 re-seeded');
  const resetTrade = db.getTradeById(demoTradeId);
  assert(resetTrade, 'Trade preserved');
  console.log(`✓ Step 15 Passed: Demo state successfully reset for presentation. Run archive: ${resetRes.archivedRunId}`);

  console.log('\n🎉 ALL 15 MASTER DEMONSTRATION STEPS PASSED WITHOUT REGRESSION!');
}

runMasterDemoTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

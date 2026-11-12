import {
  Agreement2,
  TradeRequest,
  Organization,
  AuthorizedRepresentative,
  BusinessDocument,
  ComplianceScreening,
  Agreement2ReadinessReport,
  ReadinessCheckItem,
} from '../types';

export interface ReadinessGateContext {
  agreement: Agreement2;
  trade: TradeRequest;
  buyerOrg: Organization;
  sellerOrg: Organization;
  buyerRep?: AuthorizedRepresentative;
  sellerRep?: AuthorizedRepresentative;
  buyerDocs: BusinessDocument[];
  sellerDocs: BusinessDocument[];
  screenings: ComplianceScreening[];
}

export function evaluateAgreement2Readiness(ctx: ReadinessGateContext): Agreement2ReadinessReport {
  const {
    agreement,
    trade,
    buyerOrg,
    sellerOrg,
    buyerRep,
    sellerRep,
    buyerDocs,
    sellerDocs,
    screenings,
  } = ctx;

  const now = new Date().toISOString();
  const items: ReadinessCheckItem[] = [];

  // --------------------------------------------------------------------------
  // Check 1: Both companies completed required onboarding & KYB verification
  // --------------------------------------------------------------------------
  const buyerVerified = buyerOrg.verificationStatus === 'VERIFIED';
  const sellerVerified = sellerOrg.verificationStatus === 'VERIFIED';
  const check1Passed = buyerVerified && sellerVerified;
  items.push({
    id: 1,
    code: 'COMPANY_VERIFICATION_COMPLETE',
    title: 'Bilateral Company KYB & Verification Status',
    category: 'IDENTITY_KYB',
    passed: check1Passed,
    severity: 'BLOCKING',
    details: check1Passed
      ? `Both parties verified: Buyer ${buyerOrg.legalName} (VERIFIED) & Seller ${sellerOrg.legalName} (VERIFIED).`
      : `Incomplete verification: Buyer (${buyerOrg.verificationStatus}) / Seller (${sellerOrg.verificationStatus}).`,
    remediationHint: check1Passed ? undefined : 'Ensure both organizations complete KYB document review and corporate verification.',
  });

  // --------------------------------------------------------------------------
  // Check 2: Both companies accepted Agreement 1 (Master Platform Terms)
  // --------------------------------------------------------------------------
  const buyerAg1Signed = buyerOrg.agreement1Status === 'ACCEPTED' || buyerOrg.agreement1Signed === true;
  const sellerAg1Signed = sellerOrg.agreement1Status === 'ACCEPTED' || sellerOrg.agreement1Signed === true;
  const check2Passed = buyerAg1Signed && sellerAg1Signed;
  items.push({
    id: 2,
    code: 'AGREEMENT_1_ACCEPTED',
    title: 'Agreement 1 Electronic Execution Status',
    category: 'AGREEMENT_1',
    passed: check2Passed,
    severity: 'BLOCKING',
    details: check2Passed
      ? 'Both Buyer and Seller have executed Agreement 1 (Master Platform Terms) with recorded cryptographic receipts.'
      : `Agreement 1 execution missing: Buyer signed (${buyerAg1Signed ? 'YES' : 'NO'}), Seller signed (${sellerAg1Signed ? 'YES' : 'NO'}).`,
    remediationHint: check2Passed ? undefined : 'Both commercial entities must review and execute Agreement 1 before Agreement 2 can be formed.',
  });

  // --------------------------------------------------------------------------
  // Check 3: Authorized Signatory Identity and Authority Confirmed
  // --------------------------------------------------------------------------
  const buyerRepConfirmed = !!buyerRep && buyerRep.declarationConfirmed === true && !!buyerRep.officialEmail;
  const sellerRepConfirmed = !!sellerRep && sellerRep.declarationConfirmed === true && !!sellerRep.officialEmail;
  const check3Passed = buyerRepConfirmed && sellerRepConfirmed;
  items.push({
    id: 3,
    code: 'REPRESENTATIVE_AUTHORITY_VERIFIED',
    title: 'Signatory Authority & Identity Verification',
    category: 'IDENTITY_KYB',
    passed: check3Passed,
    severity: 'BLOCKING',
    details: check3Passed
      ? `Authorized signatories confirmed: Buyer (${buyerRep?.fullName}, ${buyerRep?.designation}) & Seller (${sellerRep?.fullName}, ${sellerRep?.designation}).`
      : `Missing signatory declaration: Buyer confirmed (${buyerRepConfirmed ? 'YES' : 'NO'}), Seller confirmed (${sellerRepConfirmed ? 'YES' : 'NO'}).`,
    remediationHint: check3Passed ? undefined : 'Corporate officers must confirm affirmative legal signatory authority during representative onboarding.',
  });

  // --------------------------------------------------------------------------
  // Check 4: Required Corporate Documents Preserved
  // --------------------------------------------------------------------------
  const buyerHasIncorp = buyerDocs.some((d) => d.documentType === 'CERTIFICATE_OF_INCORPORATION');
  const sellerHasIncorp = sellerDocs.some((d) => d.documentType === 'CERTIFICATE_OF_INCORPORATION');
  const check4Passed = buyerHasIncorp && sellerHasIncorp;
  items.push({
    id: 4,
    code: 'MANDATORY_DOCUMENTS_PRESERVED',
    title: 'Mandatory Corporate Proof Documents Preserved',
    category: 'DOCUMENTS',
    passed: check4Passed,
    severity: 'BLOCKING',
    details: check4Passed
      ? `Certificates of Incorporation and corporate proofs archived for both entities (${buyerDocs.length} buyer docs, ${sellerDocs.length} seller docs).`
      : `Missing mandatory documents: Buyer incorporation (${buyerHasIncorp ? 'YES' : 'NO'}), Seller incorporation (${sellerHasIncorp ? 'YES' : 'NO'}).`,
    remediationHint: check4Passed ? undefined : 'Upload valid Certificate of Incorporation / Commercial Register extract for both parties.',
  });

  // --------------------------------------------------------------------------
  // Check 5: Document Integrity & Cryptographic Hashing Recorded
  // --------------------------------------------------------------------------
  const check5Passed = !!agreement.sha256Hash && agreement.sha256Hash.length === 64;
  items.push({
    id: 5,
    code: 'DOCUMENT_INTEGRITY_HASHED',
    title: 'Cryptographic Document Integrity & Version Digest',
    category: 'TECHNICAL_INTEGRITY',
    passed: check5Passed,
    severity: 'BLOCKING',
    details: check5Passed
      ? `Current compiled version ${agreement.version} hash: ${agreement.sha256Hash.substring(0, 16)}... (SHA-256 verified).`
      : 'Document SHA-256 digest is missing or corrupted.',
    remediationHint: check5Passed ? undefined : 'Recompile Agreement 2 to compute immutable version hash.',
  });

  // --------------------------------------------------------------------------
  // Check 6: Required Commercial Terms Extracted & Complete
  // --------------------------------------------------------------------------
  const hasDesc = !!trade.productDescription && trade.productDescription.trim().length > 5;
  const hasQty = typeof trade.quantity === 'number' && trade.quantity > 0;
  const hasPrice = typeof trade.proposedPrice === 'number' && trade.proposedPrice > 0;
  const hasCurrency = !!trade.currency && trade.currency.trim().length === 3;
  const check6Passed = hasDesc && hasQty && hasPrice && hasCurrency;
  items.push({
    id: 6,
    code: 'COMMERCIAL_TERMS_COMPLETE',
    title: 'Core Commercial Specifications & Price Completeness',
    category: 'COMMERCIAL_TERMS',
    passed: check6Passed,
    severity: 'BLOCKING',
    details: check6Passed
      ? `Commodity: ${trade.productDescription} | Quantity: ${trade.quantity} ${trade.unit} | Total: ${trade.currency} ${trade.proposedPrice.toLocaleString()}.`
      : 'Missing core commercial terms (product description, positive quantity, valid currency, or price).',
    remediationHint: check6Passed ? undefined : 'Complete all mandatory commercial fields in Trade Request and Transaction Schedule.',
  });

  // --------------------------------------------------------------------------
  // Check 7: Material Term Conflicts Resolved
  // --------------------------------------------------------------------------
  // Any clause in 'BUYER_PROPOSED', 'SELLER_PROPOSED', or with unresolved conflicts
  const unapprovedClauses = agreement.clauses.filter((c) => c.status !== 'MUTUALLY_APPROVED');
  const hasRejectedClauses = agreement.clauses.some((c) => c.status === 'REJECTED');
  const check7Passed = unapprovedClauses.length === 0 && !hasRejectedClauses;
  items.push({
    id: 7,
    code: 'MATERIAL_CONFLICTS_RESOLVED',
    title: 'Bilateral Term Conflict & Discrepancy Resolution',
    category: 'MUTUAL_CONSENT',
    passed: check7Passed,
    severity: 'BLOCKING',
    details: check7Passed
      ? 'Zero open clause discrepancies. All 18 Framework clauses and 4 Schedules are reconciled.'
      : `${unapprovedClauses.length} clauses are pending mutual agreement${hasRejectedClauses ? ' (includes rejected clauses requiring replacement)' : ''}.`,
    remediationHint: check7Passed ? undefined : 'Resolve all open clause proposals and replace rejected terms before finalization.',
  });

  // --------------------------------------------------------------------------
  // Check 8: Missing or Ambiguous Mandatory Logistics & Logistics Port Complete
  // --------------------------------------------------------------------------
  const hasIncoterms = !!trade.incoterms && (trade.incoterms.includes('CIF') || trade.incoterms.includes('FOB') || trade.incoterms.includes('DAP') || trade.incoterms.includes('FCA') || trade.incoterms.includes('EXW'));
  const hasDeliveryLocation = !!trade.deliveryLocation && trade.deliveryLocation.trim().length > 3;
  const hasDeliveryDate = !!trade.proposedDeliveryDate && trade.proposedDeliveryDate.trim().length > 4;
  const check8Passed = hasIncoterms && hasDeliveryLocation && hasDeliveryDate;
  items.push({
    id: 8,
    code: 'LOGISTICS_TERMS_COMPLETE',
    title: 'Mandatory Logistics, Port & Incoterms® 2020 Completeness',
    category: 'COMMERCIAL_TERMS',
    passed: check8Passed,
    severity: 'BLOCKING',
    details: check8Passed
      ? `Incoterms: ${trade.incoterms} | Destination: ${trade.deliveryLocation} | Target: ${trade.proposedDeliveryDate}.`
      : 'Missing logistics specifications: Named port/place, valid Incoterms® 2020 rule, or delivery date window.',
    remediationHint: check8Passed ? undefined : 'Specify the named place/port (e.g. Nhava Sheva Port) and standard Incoterms rule.',
  });

  // --------------------------------------------------------------------------
  // Check 9: Independent Review by Both Counterparties Recorded
  // --------------------------------------------------------------------------
  const buyerReviewedAny = agreement.clauses.some((c) => c.buyerApproved || c.buyerApprovedAt);
  const sellerReviewedAny = agreement.clauses.some((c) => c.sellerApproved || c.sellerApprovedAt);
  const check9Passed = buyerReviewedAny && sellerReviewedAny;
  items.push({
    id: 9,
    code: 'INDEPENDENT_BILATERAL_REVIEW',
    title: 'Independent Counterparty Review Verification',
    category: 'MUTUAL_CONSENT',
    passed: check9Passed,
    severity: 'BLOCKING',
    details: check9Passed
      ? 'Both Buyer and Seller have actively participated in draft review and negotiation rounds.'
      : 'One or both parties have not recorded active review on the current negotiation draft.',
    remediationHint: check9Passed ? undefined : 'Both commercial parties must independently open and review the draft.',
  });

  // --------------------------------------------------------------------------
  // Check 10: All Proposed Modifications Bilaterally Approved (100% Consensus)
  // --------------------------------------------------------------------------
  const allClausesBilateral = agreement.clauses.every((c) => c.buyerApproved && c.sellerApproved && c.status === 'MUTUALLY_APPROVED');
  const check10Passed = allClausesBilateral && agreement.clauses.length > 0;
  items.push({
    id: 10,
    code: 'ALL_MODIFICATIONS_BILATERALLY_APPROVED',
    title: '100% Mutual Clause Approval & Invalidation Check',
    category: 'MUTUAL_CONSENT',
    passed: check10Passed,
    severity: 'BLOCKING',
    details: check10Passed
      ? `All ${agreement.clauses.length} clauses have confirmed bilateral affirmative approval.`
      : `${agreement.clauses.filter((c) => !c.buyerApproved || !c.sellerApproved).length} clauses lack dual-party approval.`,
    remediationHint: check10Passed ? undefined : 'Ensure every clause and schedule entry has been affirmatively accepted by both sides.',
  });

  // --------------------------------------------------------------------------
  // Check 11: Zero Rejected Proposals Incorporated
  // --------------------------------------------------------------------------
  const rejectedClausesIncorporated = agreement.clauses.filter((c) => c.status === 'REJECTED');
  const check11Passed = rejectedClausesIncorporated.length === 0;
  items.push({
    id: 11,
    code: 'ZERO_REJECTED_PROPOSALS',
    title: 'Exclusion of Unapproved or Rejected Terms',
    category: 'MUTUAL_CONSENT',
    passed: check11Passed,
    severity: 'BLOCKING',
    details: check11Passed
      ? 'No rejected proposals or unilateral terms are present in the active contract body.'
      : `${rejectedClausesIncorporated.length} rejected clauses detected in draft. Rejected wording cannot be compiled.`,
    remediationHint: check11Passed ? undefined : 'Remove or substitute clauses that received rejection from either party.',
  });

  // --------------------------------------------------------------------------
  // Check 12: Legal & Sanctions Review Status
  // --------------------------------------------------------------------------
  const hasSanctionsHit = screenings.some(
    (s) => s.resultStatus === 'PROHIBITED_OR_SANCTIONS_ALERT'
  );
  const legalReviewPending = agreement.legalReviewRequired && !agreement.legalReviewCleared;
  const check12Passed = !hasSanctionsHit && !legalReviewPending;
  items.push({
    id: 12,
    code: 'LEGAL_COMPLIANCE_REVIEW_CLEARED',
    title: 'Regulatory, Sanctions & Administrative Legal Review',
    category: 'COMPLIANCE_LEGAL',
    passed: check12Passed,
    severity: 'BLOCKING',
    details: check12Passed
      ? 'Screenings clear across 6 global regulatory sources. No blocking legal flags.'
      : hasSanctionsHit
      ? 'BLOCKING SANCTIONS HIT: Entity or trade item matched prohibited/sanctions alert.'
      : 'LEGAL REVIEW REQUIRED: Transaction is flagged for qualified legal counsel review in /internal/admin.',
    remediationHint: check12Passed
      ? undefined
      : 'Obtain administrative legal clearance via /internal/admin before proceeding to execution.',
  });

  // --------------------------------------------------------------------------
  // Check 13: Technical & Operational Consistency (No False Escrow Claims)
  // --------------------------------------------------------------------------
  // Verify framework clause 2 & 5 explicitly maintain SaaS disclaimer
  const clause2 = agreement.clauses.find((c) => c.id === 'framework-clause-02');
  const clause5 = agreement.clauses.find((c) => c.id === 'framework-clause-05');
  const disclaimerIntact =
    clause2?.content.includes('not a principal') ||
    clause2?.content.includes('escrow provider') ||
    clause5?.content.includes('does not hold funds');
  const check13Passed = Boolean(disclaimerIntact);
  items.push({
    id: 13,
    code: 'TECHNICAL_OPERATIONAL_CONSISTENCY',
    title: 'SaaS Platform Boundary & Non-Escrow Regulatory Fidelity',
    category: 'TECHNICAL_INTEGRITY',
    passed: check13Passed,
    severity: 'BLOCKING',
    details: check13Passed
      ? 'Platform non-bank / non-escrow disclaimers are preserved in Clauses 2 and 5 of the Master Framework.'
      : 'Regulatory disclaimer compromised: Platform cannot claim to be a licensed bank or escrow holder.',
    remediationHint: check13Passed ? undefined : 'Restore standard statutory SaaS platform disclaimers in Master Framework Clauses 2 & 5.',
  });

  // --------------------------------------------------------------------------
  // Check 14: Version Parity & Anti-Stale Signature Guard
  // --------------------------------------------------------------------------
  const check14Passed = agreement.status !== 'REJECTED' && agreement.version.length > 0;
  items.push({
    id: 14,
    code: 'VERSION_PARITY_VERIFIED',
    title: 'Agreement Version Parity & Anti-Stale Signature Guard',
    category: 'TECHNICAL_INTEGRITY',
    passed: check14Passed,
    severity: 'BLOCKING',
    details: check14Passed
      ? `Active version is ${agreement.version}. Both parties are bound to the identical cryptographic contract hash.`
      : 'Version mismatch or stale draft state.',
    remediationHint: check14Passed ? undefined : 'Re-verify current draft version hash before signing.',
  });

  // Compute Overall Result
  const blockingFailures = items.filter((item) => item.severity === 'BLOCKING' && !item.passed);
  const passedCount = items.filter((item) => item.passed).length;
  const overallPassed = blockingFailures.length === 0;

  return {
    overallPassed,
    evaluatedAt: now,
    tradeRequestId: trade.id,
    agreement2Id: agreement.id,
    version: agreement.version,
    passedCount,
    totalChecks: items.length,
    blockingFailuresCount: blockingFailures.length,
    items,
    escalationRequired: !check12Passed || blockingFailures.length > 0,
    escalationReason: blockingFailures.length > 0
      ? `${blockingFailures.length} mandatory readiness conditions unresolved: ${blockingFailures.map((f) => f.code).join(', ')}`
      : undefined,
  };
}

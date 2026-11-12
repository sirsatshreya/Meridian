export type UserRole = 'BUYER' | 'SELLER' | 'DEVELOPER';

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'EMAIL_VERIFICATION_PENDING'
  | 'KYB_PENDING'
  | 'UNDER_REVIEW'
  | 'NEEDS_MORE_INFORMATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type ComplianceStatus =
  | 'CLEAR_ON_CHECKED_SOURCES'
  | 'POTENTIAL_MATCH_REVIEW_REQUIRED'
  | 'RESTRICTED_LICENCE_REVIEW'
  | 'PROHIBITED_OR_SANCTIONS_ALERT'
  | 'INCONCLUSIVE'
  | 'SOURCE_UNAVAILABLE';

export type TradeRequestStatus =
  | 'DRAFT'
  | 'SCREENING_PENDING'
  | 'NEEDS_MORE_INFORMATION'
  | 'AWAITING_ADMIN_REVIEW'
  | 'READY_TO_INVITE'
  | 'INVITATION_SENT'
  | 'AWAITING_SELLER_RESPONSE'
  | 'SELLER_ACCEPTED_INVITATION'
  | 'CHANGES_REQUESTED'
  | 'INVITATION_DECLINED'
  | 'INVITATION_EXPIRED'
  | 'ON_HOLD'
  | 'READY_FOR_SHIPMENT'
  | 'ACTIVE_IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'CHANGES_REQUESTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
}

export interface Organization {
  id: string; // e.g. DEMO-BUYER-001 or ORG-xxxx
  legalName: string;
  tradingName: string;
  country: string;
  stateRegion: string;
  entityType: string;
  registrationNumber: string;
  taxId?: string; // GSTIN / CIN / VAT / EIN
  registeredAddress: string;
  officialEmail: string;
  officialWebsite?: string;
  businessPhone: string;
  industry: string;
  natureOfBusiness: string;
  mainProductsServices: string;
  countriesOfOperation: string[];
  role: 'BUYER' | 'SELLER';
  verificationStatus: VerificationStatus;
  agreement1Status: 'PENDING' | 'ACCEPTED';
  agreement1Signed?: boolean;
  agreement1AcceptedAt?: string;
  agreement1AcceptedBy?: string;
  membershipTier?: 'REGULAR' | 'PRO' | 'ULTRA';
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface AuthorizedRepresentative {
  id: string;
  organizationId: string;
  fullName: string;
  designation: string;
  title?: string;
  officialEmail: string;
  email?: string;
  contactNumber: string;
  roleInOrg: string;
  declarationConfirmed: boolean;
  confirmedAt: string;
}

export interface BusinessDocument {
  id: string;
  organizationId: string;
  documentType:
    | 'CERTIFICATE_OF_INCORPORATION'
    | 'TAX_REGISTRATION'
    | 'PROOF_OF_ADDRESS'
    | 'REPRESENTATIVE_AUTHORIZATION'
    | 'ADDITIONAL_KYB';
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'FLAGGED';
  verificationStatus?: string;
  downloadUrl?: string;
  notes?: string;
}

export interface LegalDocument {
  id: string;
  number: string;
  title: string;
  filename: string;
  roleCategory: 'PRIMARY_PLATFORM' | 'PRIVACY' | 'POLICY' | 'COMMERCIAL_TEMPLATE' | 'TECHNICAL_SCHEDULE';
  version: string;
  effectiveDate: string;
  status: 'DRAFT_FOR_REVIEW' | 'ACTIVE_APPROVED';
  sha256Hash: string;
  summary: string;
  content: string;
  clauses: { number: string; title: string; body: string }[];
}

export interface AgreementAcceptance {
  id: string;
  acceptanceId: string; // e.g. ACC-2026-XXXX
  organizationId: string;
  userId: string;
  companyLegalName: string;
  authorizedRepresentative: string;
  designation: string;
  officialEmail: string;
  agreementVersion: string;
  documentHash: string; // SHA-256
  acceptedAtUtc: string;
  timestamp?: string;
  displayTimezone: string;
  authenticationMethod: string;
  affirmativeConsentEvent: string;
  receiptCode: string;
  sha256Receipt?: string;
  signatureMethod?: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED' | string;
  signatureData?: string;
  watermark?: string;
  isDemo?: boolean;
}

export interface PrivacyAcknowledgement {
  id: string;
  organizationId: string;
  userId: string;
  documentVersion: string;
  acknowledgedAtUtc: string;
  displayTimezone: string;
}

export interface ComplianceSourceFinding {
  sourceName: string;
  authority: string;
  url: string;
  dateChecked: string;
  status: 'CLEAN' | 'POTENTIAL_MATCH' | 'RESTRICTED' | 'PROHIBITED';
  matchedEntry?: string;
  evidenceReference?: string;
  notes?: string;
}

export interface ComplianceScreening {
  id: string;
  organizationId: string;
  screeningType: 'COMPANY' | 'TRADE';
  subjectIdentifier: string; // Company Name or Trade Item
  entityName?: string;
  resultStatus: ComplianceStatus;
  status?: string;
  riskLevel?: string;
  score?: number;
  sourcesChecked: ComplianceSourceFinding[] | any[];
  aiSummary: string;
  reviewRequired: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  isSimulated: boolean;
  createdAt: string;
  performedAt?: string;
}

export interface TradeRequest {
  id: string; // e.g. DEMO-TRADE-001 or TRD-xxx
  buyerOrgId: string;
  buyerOrganizationId?: string;
  buyerUserId: string;
  buyerCompanyName: string;
  sellerOrgId?: string; // Linked when seller accepts
  sellerOrganizationId?: string;
  sellerCompanyName: string;
  sellerCountry: string;
  sellerBusinessEmail: string;
  sellerRegNumber?: string;
  productDescription: string;
  commodity?: string;
  productCategory: string;
  hsCode?: string;
  quantity: number;
  unit: string;
  proposedPrice: number;
  targetPrice?: number;
  unitPrice?: number;
  targetPricePerUnit?: number;
  currency: string;
  incoterms?: string;
  countryOfOrigin: string;
  destination: string;
  deliveryLocation: string;
  destinationPortAddress?: string;
  proposedDeliveryDate: string;
  deliveryWindow?: string;
  specifications: string;
  milestoneNotes?: string;
  tradeType?: string;
  qualityRequirements?: string;
  packagingRequirements?: string;
  inspectionConditions?: string;
  slaRequirements?: string;
  tempHumidityReqs?: string;
  status: TradeRequestStatus;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface SellerInvitation {
  id: string;
  tradeRequestId: string;
  buyerOrgId: string;
  buyerCompanyName: string;
  recipientEmail: string;
  recipientCompanyName: string;
  invitationToken: string;
  expiresAt: string;
  status: InvitationStatus;
  sentAt: string;
  redeemedAt?: string;
  redeemedByUserId?: string;
  responseNotes?: string;
}

export interface BuyerSellerConnection {
  id: string;
  buyerOrgId: string;
  buyerCompanyName: string;
  sellerOrgId: string;
  sellerCompanyName: string;
  tradeRequestId: string;
  connectedAt: string;
  status: 'CONNECTED' | 'TERMINATED';
}

export interface EmailOutboxItem {
  id: string;
  recipientEmail: string;
  subject: string;
  templateType:
    | 'ACCOUNT_REGISTRATION'
    | 'EMAIL_VERIFICATION'
    | 'AGREEMENT_ACCEPTANCE'
    | 'LOGIN_SUCCESS'
    | 'VERIFICATION_UPDATE'
    | 'SELLER_INVITATION'
    | 'SELLER_RESPONSE';
  payloadJson: Record<string, any>;
  status: 'SIMULATED_SENT' | 'QUEUED' | 'FAILED';
  sentAtUtc: string;
  provider: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'INFO' | 'ACTION_REQUIRED' | 'SUCCESS' | 'WARNING';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditEvent {
  id: string;
  organizationId?: string;
  userId?: string;
  eventType: string;
  action?: string;
  objectId?: string;
  entityType?: string;
  entityId?: string;
  serverTimestampUtc: string;
  timestamp?: string;
  previousStatus?: string;
  newStatus?: string;
  actor: string;
  performedBy?: string;
  performedByEmail?: string;
  evidenceReference?: string;
  details?: string;
}

// Landing Page UI Types
export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface WorkflowStage {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  whatHappens: string;
  whyImportant: string;
  meridianAssistance?: string;
  stageType?: string;
  aiRole?: string;
  keyOutputs?: string[];
}

// Agreement 2 Legal Governance Types
export type Agreement2Status =
  | 'DRAFT'
  | 'TERMS_NEGOTIATING'
  | 'READINESS_GATE_FAILED'
  | 'READY_FOR_SIGNING'
  | 'PARTIALLY_SIGNED'
  | 'EXECUTED'
  | 'LEGAL_REVIEW_REQUIRED'
  | 'REJECTED';

export interface Agreement2Clause {
  id: string; // e.g. "framework-clause-01" or "sched-a-goods"
  section: 'FRAMEWORK' | 'SCHEDULE_A' | 'SCHEDULE_B' | 'SCHEDULE_C' | 'SCHEDULE_D';
  number: string;
  title: string;
  content: string;
  buyerApproved: boolean;
  buyerApprovedAt?: string;
  buyerApprovedBy?: string;
  sellerApproved: boolean;
  sellerApprovedAt?: string;
  sellerApprovedBy?: string;
  status: 'PENDING' | 'MUTUALLY_APPROVED' | 'BUYER_PROPOSED' | 'SELLER_PROPOSED' | 'REJECTED';
  rejectionReason?: string;
  rejectedBy?: 'BUYER' | 'SELLER';
  isMandatory: boolean;
  lastModifiedAt: string;
  lastModifiedBy: string;
}

export interface Agreement2Signature {
  party: 'BUYER' | 'SELLER';
  organizationId: string;
  companyLegalName: string;
  authorizedSignerName: string;
  signerName?: string;
  signerTitle: string;
  signerEmail: string;
  signedAtUtc: string;
  displayTimezone: string;
  signatureHash: string;
  documentVersionHash: string;
  receiptCode: string;
  ipAddress?: string;
  signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
  signatureData?: string; // Vector stroke base64 or stylized typed font representation
  prototypeElectronicDisclaimer: string;
}

export interface ReadinessCheckItem {
  id: number;
  code: string;
  title: string;
  category:
    | 'IDENTITY_KYB'
    | 'AGREEMENT_1'
    | 'DOCUMENTS'
    | 'COMMERCIAL_TERMS'
    | 'MUTUAL_CONSENT'
    | 'COMPLIANCE_LEGAL'
    | 'TECHNICAL_INTEGRITY';
  passed: boolean;
  severity: 'BLOCKING' | 'WARNING';
  details: string;
  remediationHint?: string;
}

export interface Agreement2ReadinessReport {
  overallPassed: boolean;
  evaluatedAt: string;
  tradeRequestId: string;
  agreement2Id: string;
  version: string;
  passedCount: number;
  totalChecks: number;
  blockingFailuresCount: number;
  items: ReadinessCheckItem[];
  escalationRequired: boolean;
  escalationReason?: string;
}

export interface Agreement2 {
  id: string; // e.g. "AGR2-DEMO-TRADE-001"
  tradeRequestId: string;
  buyerOrgId: string;
  buyerCompanyName: string;
  sellerOrgId: string;
  sellerCompanyName: string;
  version: string; // e.g. "0.1", "0.2"
  sha256Hash: string;
  status: Agreement2Status;
  clauses: Agreement2Clause[];
  signatures: {
    buyer?: Agreement2Signature;
    seller?: Agreement2Signature;
  };
  readinessReport?: Agreement2ReadinessReport;
  legalReviewRequired: boolean;
  legalReviewCleared: boolean;
  legalReviewNotes?: string;
  legalReviewClearedAt?: string;
  legalReviewClearedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 4: Document Integrity & Evidence Types
export type EvidenceCategory =
  | 'agreement2_pdf'
  | 'shipment_photo'
  | 'inspection_certificate'
  | 'bill_of_lading'
  | 'packing_list'
  | 'customs_declaration'
  | 'audit_dossier'
  | 'pre_dispatch'
  | 'PRE_DISPATCH'
  | string;

export interface DocumentEvidenceRecord {
  id: string; // e.g. "EVD-001"
  tradeId: string;
  category: EvidenceCategory;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string; // reference in object storage
  storageUrl: string; // authenticated API stream URL
  sha256Hash: string; // computed baseline SHA-256 hash at upload
  uploadedBy: string;
  uploadedByOrgId: string;
  uploadedAt: string;
  documentVersion: string;
  caption?: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'FLAGGED';
}

export interface IntegrityVerificationRecord {
  id: string; // e.g. "VERIF-001"
  evidenceId: string;
  tradeId: string;
  verifiedBy: string;
  verifiedByRole: string;
  verifiedAt: string;
  recalculatedHash: string;
  baselineHash: string;
  match: boolean; // true = VERIFIED, false = INTEGRITY CHECK FAILED
  verificationScope: string;
  disclaimer: string;
  notes?: string;
}

export interface SimulatedTelemetryMilestone {
  id: string;
  timestamp: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  status:
    | 'IN_TRANSIT'
    | 'CUSTOMS_CLEARED'
    | 'AT_PORT'
    | 'LOADED'
    | 'DISCHARGED'
    | 'TEMPERATURE_ANOMALY'
    | 'HUMIDITY_ANOMALY'
    | 'TRANSIT_DELAY'
    | 'DELIVERED'
    | string;
  temperatureC?: number;
  humidityPercent?: number;
  hmacSignature: string; // HMAC-SHA256 sensor signature (explicitly separated from SHA-256 file hashing)
  sensorId: string;
}

export interface CanonicalTradeManifest {
  manifestVersion: '1.0';
  generatedAt: string;
  tradeId: string;
  canonicalJsonSha256: string; // Distinct digest of canonical trade data state
  canonicalPdfSha256?: string; // Digest of compiled canonical PDF file
  tradeSummary: {
    buyerCompanyName: string;
    sellerCompanyName: string;
    incoterms: string;
    productDescription: string;
    agreedValue: number;
    currency: string;
  };
  agreement1Summary: {
    buyerAcceptedAt: string;
    sellerAcceptedAt: string;
  };
  agreement2Summary: {
    agreementId: string;
    version: string;
    agreementSha256: string;
    buyerSignedAt?: string;
    sellerSignedAt?: string;
  };
  evidenceSummary: {
    totalItems: number;
    items: Array<{
      evidenceId: string;
      category: EvidenceCategory;
      fileName: string;
      sha256Hash: string;
    }>;
  };
  integrityRecordSummary: {
    totalVerificationAttempts: number;
    allMatch: boolean;
  };
  disclaimer: string;
}

// ==========================================
// Phase 4 & Master End-to-End Types
// ==========================================

export type PayPalPaymentStatus =
  | 'PAYMENT_PENDING'
  | 'BUYER_APPROVAL_REQUIRED'
  | 'AUTHORIZED'
  | 'CAPTURE_PENDING'
  | 'CAPTURED'
  | 'PAYMENT_FAILED'
  | 'AUTHORIZATION_EXPIRED'
  | 'PAYMENT_CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface PayPalOrderRecord {
  id: string; // e.g. "ORD-PAYPAL-xxx"
  tradeId: string;
  orderId?: string; // PayPal provider order ID
  paypalOrderId?: string;
  paypalCaptureId?: string;
  buyerOrgId?: string;
  sellerOrgId?: string;
  agreement2Id?: string;
  amount: number;
  currency: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  exchangeRate?: number;
  exchangeRateSource?: string;
  exchangeRateTimestamp?: string;
  status: PayPalPaymentStatus;
  approvalUrl: string;
  payerEmail?: string;
  authorizationId?: string;
  captureId?: string;
  createdAt: string;
  approvedAt?: string;
  capturedAt?: string;
  isSandbox?: boolean;
  webhookEvents?: string[];
  disclaimer?: string;
}

export interface RealPaymentProofRecord {
  id: string; // e.g. "REALPAY-xxx"
  tradeId: string;
  uploaderOrgId: string;
  uploaderName?: string;
  uploaderUserId?: string;
  claimedAmount: number;
  currency: string;
  paymentMethod: 'BANK_TRANSFER' | 'WIRE_TRANSFER' | 'WIRE_SWIFT' | 'UPI' | 'ESCROW_PARTNER' | string;
  transactionReference: string;
  fileName: string;
  storageKey: string;
  storageUrl: string;
  sha256Hash: string;
  status:
    | 'PAYMENT_PROOF_SUBMITTED'
    | 'PENDING_VERIFICATION'
    | 'VERIFIED_BY_REVIEWER'
    | 'VERIFIED_BY_AUTHORIZED_REVIEWER'
    | 'REJECTED'
    | 'REJECTED_INSUFFICIENT_EVIDENCE';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  notes?: string;
  disclaimer?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface ShipmentRecord {
  id: string; // e.g. "SHP-xxx"
  tradeId: string;
  sellerOrgId?: string;
  carrier?: string;
  carrierName?: string;
  trackingNumber: string;
  originPort?: string;
  destinationPort?: string;
  departureDate?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string | null;
  vesselName?: string;
  currentTemperatureC?: number;
  currentHumidityPercent?: number;
  lastLocationName?: string;
  lastPingAt?: string;
  etd?: string; // Expected time of dispatch
  eta?: string; // Expected time of arrival
  atd?: string; // Actual time of dispatch
  ata?: string; // Actual time of arrival
  vesselFlightNumber?: string;
  containerNumber?: string;
  sealNumber?: string;
  status:
    | 'PREPARING'
    | 'PREPARING_DISPATCH'
    | 'CONTAINER_SEALED'
    | 'DISPATCHED'
    | 'IN_TRANSIT'
    | 'CUSTOMS_PORT_ARRIVED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'TEMPERATURE_ANOMALY'
    | 'HUMIDITY_ANOMALY'
    | 'TRANSIT_DELAY'
    | 'ROUTE_DEVIATION'
    | 'AT_PORT'
    | 'CUSTOMS_CLEARED'
    | 'DISCHARGED'
    | 'LOADED'
    | string;
  notes?: string;
  updatedAt?: string;
}

export interface AISentinelAlert {
  id: string;
  tradeId: string;
  timestamp?: string;
  detectedAt?: string;
  eventType:
    | 'NORMAL'
    | 'TEMP_SPIKE'
    | 'TEMP_READING_ANOMALY'
    | 'TEMP_NORMALIZED'
    | 'HUMIDITY_ALERT'
    | 'HUMIDITY_ANOMALY'
    | 'TRANSIT_DELAY'
    | 'DELIVERY_DELAY'
    | 'SEAL_TAMPER'
    | 'GEO_DEVIATION'
    | 'ROUTE_DEVIATION';
  severity:
    | 'NORMAL'
    | 'WARNING'
    | 'INFO'
    | 'POTENTIAL_BREACH'
    | 'REQUIRES_INSPECTION'
    | 'DISPUTE_REVIEW_REQUIRED';
  actualReading?: string;
  contractThreshold?: string;
  contractClauseRef?: string;
  description?: string;
  thresholdValue?: string;
  actualValue?: string;
  relevantClauseId?: string;
  status?: string;
  reviewed?: boolean;
  recommendedAction: string;
}

export interface BuyerInspectionRecord {
  id: string; // e.g. "INSP-xxx"
  tradeId: string;
  buyerOrgId?: string;
  inspectorName?: string;
  inspectorUserId?: string;
  inspectorOrgId?: string;
  inspectedAt?: string;
  decision: 'ACCEPTED' | 'REJECTED' | 'ADDITIONAL_EVIDENCE_REQUESTED' | 'ADDITIONAL_EVIDENCE_REQUIRED';
  observations: string;
  checklist?: {
    cargoIntegrityVerified?: boolean;
    packagingIntact?: boolean;
    temperatureComplianceVerified?: boolean;
    sealsMatched?: boolean;
    quantityMatched?: boolean;
    [key: string]: any;
  };
  nonConformanceIdentified?: boolean;
  discrepancyDetails?: string;
  agreedClauseRef?: string;
  evidenceItemsReviewed?: string[];
  conditionPhotoIds?: string[];
  createdAt?: string;
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_BUYER_ACCEPTED'
  | 'RESOLVED_MUTUAL_AGREEMENT'
  | 'ADDITIONAL_EVIDENCE_REQUIRED'
  | 'ESCALATED'
  | 'UNRESOLVED';

export interface TradeDisputeRecord {
  id: string; // e.g. "DISP-xxx"
  tradeId: string;
  raisedByOrgId?: string;
  filedByOrgId?: string;
  filedByUserId?: string;
  raisedByRole?: 'BUYER' | 'SELLER';
  raisedByName?: string;
  raisedAt?: string;
  triggeringEvent?: string;
  issueSummary?: string;
  relevantClauseId?: string;
  relevantClauseNumber?: string; // e.g. "C.3" or "D.1"
  claimDescription?: string;
  details?: string;
  buyerProposedResolution?: string;
  proposedResolution?: string;
  sellerResponse?: any;
  counterpartyResponse?: any;
  sellerProposedAlternative?: string;
  aiAssistedProposal?: {
    summary: string;
    contractualBasis: string;
    suggestedResolution: string;
    penaltyClauseApplicable?: string;
    generatedAt: string;
  };
  aiResolutionSuggestion?: any;
  evidenceReferences?: string[];
  evidenceIds?: string[];
  status: DisputeStatus;
  resolutionText?: string;
  finalOutcomeNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionVersion?: string;
  history?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Phase5HandoffSummary {
  tradeId: string;
  generatedAtUtc?: string;
  parties?: {
    buyer: {
      id: string;
      legalName: string;
      representative: string;
    };
    seller: {
      id: string;
      legalName: string;
      representative: string;
    };
  };
  agreement2Execution?: {
    agreementId: string;
    version: string;
    canonicalSha256: string;
    buyerSignature: any;
    sellerSignature: any;
    isFullyExecuted: boolean;
  };
  paymentVerification?: {
    paypalSandbox: any;
    realCommercialPayment: any;
  };
  shipmentStatus?: any;
  evidenceRecordsCount?: number;
  inspectionCompleted?: boolean;
  inspectionOutcome?: string;
  disputeHistory?: any;
  canonicalTradeManifestDigest?: string;
  readyForPhase5Completion?: boolean;
  handoffInstructions?: string;

  // Alternate direct fields
  buyerOrgId?: string;
  buyerCompanyName?: string;
  sellerOrgId?: string;
  sellerCompanyName?: string;
  agreement2Id?: string;
  agreement2Version?: string;
  agreement2Sha256?: string;
  buyerSignedAt?: string;
  sellerSignedAt?: string;
  paymentVerified?: boolean;
  paymentMethodUsed?: 'PAYPAL_SANDBOX' | 'REAL_COMMERCIAL_PAYMENT';
  paymentReference?: string;
  disputeSummary?: {
    totalDisputes: number;
    openDisputes: number;
    resolvedDisputes: number;
  };
  phase4ReadinessGatePassed?: boolean;
  outstandingConditions?: string[];
  canonicalManifestDigest?: string;
  preparedAtUtc?: string;
}

// ==========================================
// Phase 5 Final Trade Completion & Dossier Types
// ==========================================

export type Phase5ReviewStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REVISIONS_REQUESTED'
  | 'BLOCKED';

export interface Phase5PartyReview {
  status: Phase5ReviewStatus;
  reviewedByUserId?: string;
  reviewerName?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  notes?: string;
  approved: boolean;
}

export interface Phase5CompletionSignature {
  party: 'BUYER' | 'SELLER';
  organizationId: string;
  companyName: string;
  userId: string;
  signerName: string;
  signerTitle: string;
  signatureMethod: 'PROTOTYPE_CANVAS' | 'DIGITAL_ACKNOWLEDGEMENT';
  signatureData?: string; // Base64 data URL
  receiptCode: string;
  signedAtUtc: string;
  acknowledgementTextVersion: string;
  consentConfirmed: boolean;
}

export interface Phase5ReadinessCheckItem {
  id: string;
  label: string;
  passed: boolean;
  details?: string;
  partyActionRequired?: 'BUYER' | 'SELLER' | 'BOTH' | 'NONE';
}

export interface Phase5CompletionRecord {
  id: string; // e.g. "CERT-DEMO-001"
  tradeId: string;
  version: string;
  status: 'IN_REVIEW' | 'AWAITING_SIGNATURES' | 'COMPLETED';
  buyerReview: Phase5PartyReview;
  sellerReview: Phase5PartyReview;
  buyerSignature?: Phase5CompletionSignature;
  sellerSignature?: Phase5CompletionSignature;
  readinessChecks: Phase5ReadinessCheckItem[];
  overallReadinessPassed: boolean;
  finalCertificatePdfStorageKey?: string;
  finalCertificatePdfSha256?: string;
  finalCertificatePdfGeneratedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}




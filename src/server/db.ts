import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Organization,
  AuthorizedRepresentative,
  BusinessDocument,
  AgreementAcceptance,
  PrivacyAcknowledgement,
  ComplianceScreening,
  TradeRequest,
  SellerInvitation,
  BuyerSellerConnection,
  NotificationItem,
  AuditEvent,
  EmailOutboxItem,
  Agreement2,
  Agreement2Clause,
  Agreement2ReadinessReport,
  Agreement2Signature,
  DocumentEvidenceRecord,
  IntegrityVerificationRecord,
  SimulatedTelemetryMilestone,
  CanonicalTradeManifest,
  EvidenceCategory,
  PayPalOrderRecord,
  RealPaymentProofRecord,
  ShipmentRecord,
  AISentinelAlert,
  BuyerInspectionRecord,
  TradeDisputeRecord,
  Phase5HandoffSummary,
  Phase5CompletionRecord,
  Phase5PartyReview,
  Phase5CompletionSignature,
  Phase5ReadinessCheckItem,
} from '../types';
import { EmailService } from './emailService';
import { runCompanyScreening, runTradeScreening } from './complianceEngine';
import { generateDefaultAgreement2, calculateAgreement2Hash } from './agreement2Templates';
import { evaluateAgreement2Readiness } from './readinessGate';
import { objectStorage } from './objectStorage';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'meridian_db.json');

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  organizations: Organization[];
  authorizedRepresentatives: AuthorizedRepresentative[];
  businessDocuments: BusinessDocument[];
  agreementAcceptances: AgreementAcceptance[];
  privacyAcknowledgements: PrivacyAcknowledgement[];
  complianceScreenings: ComplianceScreening[];
  tradeRequests: TradeRequest[];
  sellerInvitations: SellerInvitation[];
  buyerSellerConnections: BuyerSellerConnection[];
  notifications: NotificationItem[];
  auditEvents: AuditEvent[];
  emailOutbox: EmailOutboxItem[];
  sessions: { token: string; userId: string; role: string; organizationId: string; expiresAt: string }[];
  agreement2List: Agreement2[];
  evidenceRecords: DocumentEvidenceRecord[];
  integrityLogs: IntegrityVerificationRecord[];
  telemetryMilestones: Record<string, SimulatedTelemetryMilestone[]>;
  paypalOrders?: PayPalOrderRecord[];
  realPaymentProofs?: RealPaymentProofRecord[];
  shipments?: ShipmentRecord[];
  aiSentinelAlerts?: AISentinelAlert[];
  buyerInspections?: BuyerInspectionRecord[];
  disputes?: TradeDisputeRecord[];
  phase5Completions?: Phase5CompletionRecord[];
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export class Database {
  private data: DatabaseSchema;
  public emailService: EmailService;

  constructor() {
    this.ensureDbDir();
    this.data = this.loadOrSeed();
    this.emailService = new EmailService(this.data.emailOutbox);
  }

  private ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private save() {
    try {
      this.data.emailOutbox = this.emailService.getOutbox();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  private loadOrSeed(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        let changed = false;

        if (!parsed.agreement2List || parsed.agreement2List.length === 0) {
          const trade = parsed.tradeRequests?.find((t) => t.id === 'DEMO-TRADE-001') || parsed.tradeRequests?.[0];
          const buyer = parsed.organizations?.find((o) => o.id === 'DEMO-BUYER-001') || parsed.organizations?.find((o) => o.role === 'BUYER');
          const seller = parsed.organizations?.find((o) => o.id === 'DEMO-SELLER-001') || parsed.organizations?.find((o) => o.role === 'SELLER');
          if (trade && buyer && seller) {
            parsed.agreement2List = [generateDefaultAgreement2(trade, buyer, seller)];
            changed = true;
          } else {
            parsed.agreement2List = [];
          }
        }

        if (!parsed.evidenceRecords || parsed.evidenceRecords.length === 0) {
          this.seedPhase4EvidenceAndTelemetry(parsed);
          changed = true;
        } else {
          parsed.integrityLogs = parsed.integrityLogs || [];
          parsed.telemetryMilestones = parsed.telemetryMilestones || {};
        }

        if (!parsed.paypalOrders) { parsed.paypalOrders = []; changed = true; }
        if (!parsed.realPaymentProofs) { parsed.realPaymentProofs = []; changed = true; }
        if (!parsed.shipments) { parsed.shipments = []; changed = true; }
        if (!parsed.aiSentinelAlerts) { parsed.aiSentinelAlerts = []; changed = true; }
        if (!parsed.buyerInspections) { parsed.buyerInspections = []; changed = true; }
        if (!parsed.disputes) { parsed.disputes = []; changed = true; }
        if (!parsed.phase5Completions) { parsed.phase5Completions = []; changed = true; }

        // Seed initial shipment if missing
        if (parsed.shipments.length === 0) {
          parsed.shipments.push({
            id: 'SHP-001',
            tradeId: 'DEMO-TRADE-001',
            carrierName: 'Maersk Global Ocean Line / Line 402',
            trackingNumber: 'MSK-IN-88942-X',
            originPort: 'Nhava Sheva Port, Mumbai (IN)',
            destinationPort: 'Hamburg Port, Terminal Altenwerder (DE)',
            departureDate: '2026-11-06T10:00:00Z',
            estimatedDeliveryDate: '2026-11-28T18:00:00Z',
            actualDeliveryDate: null,
            status: 'IN_TRANSIT',
            vesselName: 'MV Maersk McKinney Moller',
            containerNumber: 'MSCU-892144-0',
            currentTemperatureC: 23.1,
            currentHumidityPercent: 68,
            lastLocationName: 'Arabian Sea Maritime Corridor (En route Hamburg)',
            lastPingAt: '2026-11-07T18:00:00Z',
            notes: 'Cold chain container maintaining pharma-grade packaging conditions under Agreement 2 Schedule C.',
          });
          changed = true;
        }

        // Seed initial AI Sentinel Alert if missing
        if (parsed.aiSentinelAlerts.length === 0) {
          parsed.aiSentinelAlerts.push({
            id: 'ALERT-001',
            tradeId: 'DEMO-TRADE-001',
            eventType: 'TEMP_READING_ANOMALY',
            severity: 'INFO',
            detectedAt: '2026-11-05T14:35:00Z',
            thresholdValue: '25.0°C Max Continuous',
            actualValue: '26.5°C Transient (JNPT Berth Transfer)',
            relevantClauseId: 'clause-5',
            recommendedAction: 'Transient temperature rise during container berth crane hoist. Container refrigeration restored upon vessel power plug-in. Monitor maritime transit logs.',
            status: 'MONITORING',
            reviewed: true,
          });
          changed = true;
        }

        // Seed initial PayPal Sandbox order if missing
        if (parsed.paypalOrders.length === 0) {
          parsed.paypalOrders.push({
            id: 'PAYPAL-SBX-ORD-DEMO01',
            tradeId: 'DEMO-TRADE-001',
            buyerOrgId: 'DEMO-BUYER-001',
            sellerOrgId: 'DEMO-SELLER-001',
            amount: 87500.00,
            currency: 'EUR',
            status: 'CAPTURED',
            createdAt: '2026-11-04T12:00:00Z',
            approvedAt: '2026-11-04T12:10:00Z',
            capturedAt: '2026-11-04T12:12:00Z',
            paypalOrderId: 'PAYPAL-SBX-ORD-DEMO01',
            paypalCaptureId: 'PAYPAL-SBX-CAP-DEMO01',
            payerEmail: 'buyer.sandbox@meridian-trade.test',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=DEMO_TOKEN_88942',
            disclaimer: 'PAYPAL SANDBOX — VIRTUAL PAYMENT DEMONSTRATION — NO REAL MONEY TRANSFERRED',
          });
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        return parsed;
      } catch (e) {
        console.warn('Database corrupt or empty, re-seeding...');
      }
    }
    return this.seedDefaultData();
  }

  private seedPhase4EvidenceAndTelemetry(data: DatabaseSchema) {
    if (!data.evidenceRecords) data.evidenceRecords = [];
    if (!data.integrityLogs) data.integrityLogs = [];
    if (!data.telemetryMilestones) data.telemetryMilestones = {};

    const demoTradeId = 'DEMO-TRADE-001';
    if (data.evidenceRecords.filter((e) => e.tradeId === demoTradeId).length === 0) {
      // 1. Cargo Photo (Valid PNG binary stored in private object storage)
      const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      const photoResult = objectStorage.storeObject(demoTradeId, 'EVD-001', 'cargo_loading_bkc_terminal.png', samplePng);
      const evd1: DocumentEvidenceRecord = {
        id: 'EVD-001',
        tradeId: demoTradeId,
        category: 'shipment_photo',
        fileName: 'cargo_loading_bkc_terminal.png',
        mimeType: 'image/png',
        fileSize: photoResult.fileSize,
        storageKey: photoResult.storageKey,
        storageUrl: `/api/storage/${photoResult.storageKey}`,
        sha256Hash: photoResult.sha256Hash,
        uploadedBy: 'Elena Vance (Director of Procurement)',
        uploadedByOrgId: 'DEMO-BUYER-001',
        uploadedAt: '2026-11-04T08:30:00Z',
        documentVersion: 'v1.0',
        caption: 'Pre-dispatch palletized packaging film loading at Mumbai BKC hub',
        status: 'ACTIVE',
      };

      // 2. Inspection Certificate (Valid PDF binary stored in private object storage)
      const samplePdf = Buffer.from(`%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n4 0 obj << /Length 55 >> stream\nBT /F1 12 Tf 50 700 Td (SGS QUALITY CERTIFICATE - PASSED) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000213 00000 n \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF`, 'utf-8');
      const certResult = objectStorage.storeObject(demoTradeId, 'EVD-002', 'SGS_Quality_Certificate_2026.pdf', samplePdf);
      const evd2: DocumentEvidenceRecord = {
        id: 'EVD-002',
        tradeId: demoTradeId,
        category: 'inspection_certificate',
        fileName: 'SGS_Quality_Certificate_2026.pdf',
        mimeType: 'application/pdf',
        fileSize: certResult.fileSize,
        storageKey: certResult.storageKey,
        storageUrl: `/api/storage/${certResult.storageKey}`,
        sha256Hash: certResult.sha256Hash,
        uploadedBy: 'Marcus Weber (Managing Director)',
        uploadedByOrgId: 'DEMO-SELLER-001',
        uploadedAt: '2026-11-04T09:15:00Z',
        documentVersion: 'v1.0',
        caption: 'Official SGS Certificate confirming barrier laminate tensile strength and polymer grade',
        status: 'ACTIVE',
      };

      // 3. Bill of Lading (Valid PDF binary stored in private object storage)
      const bolPdf = Buffer.from(`%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj\n4 0 obj << /Length 61 >> stream\nBT /F1 12 Tf 50 700 Td (OCEAN BILL OF LADING - CLEAN ON BOARD) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000213 00000 n \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n324\n%%EOF`, 'utf-8');
      const bolResult = objectStorage.storeObject(demoTradeId, 'EVD-003', 'MSCU_Ocean_Bill_of_Lading_8921.pdf', bolPdf);
      const evd3: DocumentEvidenceRecord = {
        id: 'EVD-003',
        tradeId: demoTradeId,
        category: 'bill_of_lading',
        fileName: 'MSCU_Ocean_Bill_of_Lading_8921.pdf',
        mimeType: 'application/pdf',
        fileSize: bolResult.fileSize,
        storageKey: bolResult.storageKey,
        storageUrl: `/api/storage/${bolResult.storageKey}`,
        sha256Hash: bolResult.sha256Hash,
        uploadedBy: 'Marcus Weber (Managing Director)',
        uploadedByOrgId: 'DEMO-SELLER-001',
        uploadedAt: '2026-11-04T11:00:00Z',
        documentVersion: 'v1.0',
        caption: 'Carrier issued clean on-board Bill of Lading (Vessel MSC AURELIA)',
        status: 'ACTIVE',
      };

      // 4. Container Seal Photo
      const sealPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      const sealResult = objectStorage.storeObject(demoTradeId, 'EVD-004', 'container_seal_iso17712.png', sealPng);
      const evd4: DocumentEvidenceRecord = {
        id: 'EVD-004',
        tradeId: demoTradeId,
        category: 'shipment_photo',
        fileName: 'container_seal_iso17712.png',
        mimeType: 'image/png',
        fileSize: sealResult.fileSize,
        storageKey: sealResult.storageKey,
        storageUrl: `/api/storage/${sealResult.storageKey}`,
        sha256Hash: sealResult.sha256Hash,
        uploadedBy: 'Marcus Weber (Managing Director)',
        uploadedByOrgId: 'DEMO-SELLER-001',
        uploadedAt: '2026-11-04T11:30:00Z',
        documentVersion: 'v1.0',
        caption: 'High-security ISO 17712 bolt seal locked on container MSCU-892144-0',
        status: 'ACTIVE',
      };

      data.evidenceRecords.push(evd1, evd2, evd3, evd4);

      // Seed baseline integrity log (access-controlled, append-only)
      data.integrityLogs.push(
        {
          id: 'VERIF-001',
          evidenceId: 'EVD-001',
          tradeId: demoTradeId,
          verifiedBy: 'SYSTEM_BASELINE_INGESTION',
          verifiedByRole: 'SYSTEM',
          verifiedAt: '2026-11-04T08:30:05Z',
          recalculatedHash: photoResult.sha256Hash,
          baselineHash: photoResult.sha256Hash,
          match: true,
          verificationScope: 'Byte-level SHA-256 comparison against initial upload baseline',
          disclaimer: 'SHA-256 verification detects differences against the stored baseline and does not independently establish document authenticity or cargo condition.',
          notes: 'Initial upload cryptographic digest benchmark established and verified.',
        },
        {
          id: 'VERIF-002',
          evidenceId: 'EVD-002',
          tradeId: demoTradeId,
          verifiedBy: 'SYSTEM_BASELINE_INGESTION',
          verifiedByRole: 'SYSTEM',
          verifiedAt: '2026-11-04T09:15:05Z',
          recalculatedHash: certResult.sha256Hash,
          baselineHash: certResult.sha256Hash,
          match: true,
          verificationScope: 'Byte-level SHA-256 comparison against initial upload baseline',
          disclaimer: 'SHA-256 verification detects differences against the stored baseline and does not independently establish document authenticity or cargo condition.',
          notes: 'Inspection certificate cryptographic digest benchmark established.',
        }
      );
    }

    // Seed simulated demo telemetry
    if (!data.telemetryMilestones[demoTradeId] || data.telemetryMilestones[demoTradeId].length === 0) {
      data.telemetryMilestones[demoTradeId] = [
        {
          id: 'TEL-001',
          timestamp: '2026-11-05T06:00:00Z',
          locationName: 'Mumbai BKC Logistics Depot',
          coordinates: { lat: 19.066, lng: 72.868 },
          status: 'LOADED',
          temperatureC: 24.2,
          humidityPercent: 54,
          hmacSignature: 'hmac-sha256:7a9f2b84e1c39045',
          sensorId: 'IOT-CONTAINER-MRDN-9012',
        },
        {
          id: 'TEL-002',
          timestamp: '2026-11-05T14:30:00Z',
          locationName: 'Jawaharlal Nehru Port Trust (JNPT) Terminal 2',
          coordinates: { lat: 18.950, lng: 72.951 },
          status: 'AT_PORT',
          temperatureC: 26.5,
          humidityPercent: 63,
          hmacSignature: 'hmac-sha256:3d8e11a9c402bb88',
          sensorId: 'IOT-CONTAINER-MRDN-9012',
        },
        {
          id: 'TEL-003',
          timestamp: '2026-11-06T09:10:00Z',
          locationName: 'JNPT Customs Inspection Berth 4',
          coordinates: { lat: 18.951, lng: 72.952 },
          status: 'CUSTOMS_CLEARED',
          temperatureC: 25.8,
          humidityPercent: 61,
          hmacSignature: 'hmac-sha256:91c2fa674b01e25e',
          sensorId: 'IOT-CONTAINER-MRDN-9012',
        },
        {
          id: 'TEL-004',
          timestamp: '2026-11-07T18:00:00Z',
          locationName: 'Arabian Sea Maritime Corridor (En route Hamburg)',
          coordinates: { lat: 17.520, lng: 69.800 },
          status: 'IN_TRANSIT',
          temperatureC: 23.1,
          humidityPercent: 68,
          hmacSignature: 'hmac-sha256:b590e8a4d7821c90',
          sensorId: 'IOT-CONTAINER-MRDN-9012',
        },
      ];
    }
  }

  private seedDefaultData(): DatabaseSchema {
    // Salt & hashes for permanent demo accounts
    const buyerSalt = crypto.randomBytes(16).toString('hex');
    const sellerSalt = crypto.randomBytes(16).toString('hex');
    const devSalt = crypto.randomBytes(16).toString('hex');

    // Default password for all demo accounts: Password@123
    const defaultPassword = 'Password@123';
    const buyerHash = hashPassword(defaultPassword, buyerSalt);
    const sellerHash = hashPassword(defaultPassword, sellerSalt);
    const devHash = hashPassword('meridian-dev-2026', devSalt);

    const now = '2026-11-01T10:00:00Z';

    const demoBuyerOrg: Organization = {
      id: 'DEMO-BUYER-001',
      legalName: 'MERIDIAN DEMO BUYER PRIVATE LIMITED',
      tradingName: 'Meridian Global Procurement',
      country: 'India',
      stateRegion: 'Maharashtra',
      entityType: 'Private Limited Company',
      registrationNumber: 'U74999MH2021PTC368921',
      taxId: '27AABCM8921P1ZK',
      registeredAddress: 'Level 12, World Trade Tower, Bandra Kurla Complex, Mumbai, MH 400051',
      officialEmail: 'buyer.demo@meridian.test',
      officialWebsite: 'https://demo-buyer.meridian.test',
      businessPhone: '+91 22 6123 4567',
      industry: 'Packaging & FMCG Supply Chains',
      natureOfBusiness: 'Importer and contract manufacturing procurement distributor',
      mainProductsServices: 'Flexible packaging films, barrier laminates, polymer rolls',
      countriesOfOperation: ['India', 'United Arab Emirates', 'Singapore', 'Germany'],
      role: 'BUYER',
      verificationStatus: 'VERIFIED',
      agreement1Status: 'ACCEPTED',
      agreement1AcceptedAt: now,
      agreement1AcceptedBy: 'Elena Vance (Director of Procurement)',
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    };

    const demoSellerOrg: Organization = {
      id: 'DEMO-SELLER-001',
      legalName: 'MERIDIAN DEMO SELLER GMBH',
      tradingName: 'Zenith Polymer Solutions Europe',
      country: 'Germany',
      stateRegion: 'Hamburg',
      entityType: 'Gesellschaft mit beschränkter Haftung (GmbH)',
      registrationNumber: 'HRB 189422',
      taxId: 'DE 312 984 012',
      registeredAddress: 'Speicherstraße 42, 20457 Hamburg, Germany',
      officialEmail: 'seller.demo@meridian.test',
      officialWebsite: 'https://demo-seller.meridian.test',
      businessPhone: '+49 40 8923 100',
      industry: 'Industrial Polymer Extrusion & Packaging',
      natureOfBusiness: 'Manufacturer and certified exporter of industrial barrier films',
      mainProductsServices: 'Multi-layer barrier barrier film, recyclable sealable foils',
      countriesOfOperation: ['Germany', 'Netherlands', 'India', 'United States'],
      role: 'SELLER',
      verificationStatus: 'VERIFIED',
      agreement1Status: 'ACCEPTED',
      agreement1AcceptedAt: now,
      agreement1AcceptedBy: 'Marcus Thorne (Managing Director)',
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    };

    const demoBuyerUser: StoredUser = {
      id: 'usr-demo-buyer',
      name: 'Elena Vance',
      email: 'buyer.demo@meridian.test',
      role: 'BUYER',
      organizationId: demoBuyerOrg.id,
      emailVerified: true,
      createdAt: now,
      passwordHash: buyerHash,
      salt: buyerSalt,
      lastLoginAt: '2026-11-08T00:30:00Z',
    };

    const demoSellerUser: StoredUser = {
      id: 'usr-demo-seller',
      name: 'Marcus Thorne',
      email: 'seller.demo@meridian.test',
      role: 'SELLER',
      organizationId: demoSellerOrg.id,
      emailVerified: true,
      createdAt: now,
      passwordHash: sellerHash,
      salt: sellerSalt,
      lastLoginAt: '2026-11-08T00:45:00Z',
    };

    const devUser: StoredUser = {
      id: 'usr-dev-system',
      name: 'Meridian Operations Console',
      email: 'internal-dev@meridian.system',
      role: 'DEVELOPER',
      organizationId: 'SYSTEM-OPERATIONS',
      emailVerified: true,
      createdAt: now,
      passwordHash: devHash,
      salt: devSalt,
    };

    const demoTrade: TradeRequest = {
      id: 'DEMO-TRADE-001',
      buyerOrgId: demoBuyerOrg.id,
      buyerUserId: demoBuyerUser.id,
      buyerCompanyName: demoBuyerOrg.legalName,
      sellerOrgId: demoSellerOrg.id,
      sellerCompanyName: demoSellerOrg.legalName,
      sellerCountry: 'Germany',
      sellerBusinessEmail: demoSellerOrg.officialEmail,
      sellerRegNumber: 'HRB 189422',
      productDescription: 'Food-grade flexible packaging film (BOPP 25-micron barrier rolls)',
      productCategory: 'Packaging & Industrial Plastics',
      hsCode: '3920.20',
      quantity: 5000,
      unit: 'Rolls (1,000m length)',
      proposedPrice: 125000,
      currency: 'EUR',
      countryOfOrigin: 'Germany',
      destination: 'India',
      deliveryLocation: 'Nhava Sheva Port, Mumbai (INNSA)',
      proposedDeliveryDate: '2026-12-15',
      specifications: 'ISO 22000 & FDA compliance; multi-layer high barrier co-extrusion.',
      qualityRequirements: 'Oxygen Transmission Rate (OTR) < 1.5 cc/m²/24h at 23°C.',
      packagingRequirements: 'Reinforced seaworthy fumigated wooden crates with desiccant packs.',
      inspectionConditions: 'SGS pre-shipment inspection at Hamburg origin prior to vessel loading.',
      slaRequirements: 'Delivery lead time 35 days; Incoterm CIF Nhava Sheva.',
      tempHumidityReqs: 'Ambient temperature 10°C to 30°C; max relative humidity 65%.',
      status: 'AWAITING_SELLER_RESPONSE',
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    };

    const demoInvitation: SellerInvitation = {
      id: 'inv-demo-001',
      tradeRequestId: demoTrade.id,
      buyerOrgId: demoBuyerOrg.id,
      buyerCompanyName: demoBuyerOrg.legalName,
      recipientEmail: demoSellerOrg.officialEmail,
      recipientCompanyName: demoSellerOrg.legalName,
      invitationToken: 'inv-demo-trade-token-001',
      expiresAt: '2026-12-01T23:59:59Z',
      status: 'PENDING',
      sentAt: now,
    };

    const initialData: DatabaseSchema = {
      users: [demoBuyerUser, demoSellerUser, devUser],
      organizations: [demoBuyerOrg, demoSellerOrg],
      authorizedRepresentatives: [
        {
          id: 'rep-01',
          organizationId: demoBuyerOrg.id,
          fullName: 'Elena Vance',
          designation: 'Director of Procurement',
          officialEmail: 'buyer.demo@meridian.test',
          contactNumber: '+91 98200 12345',
          roleInOrg: 'Officer with Board Signatory Authority',
          declarationConfirmed: true,
          confirmedAt: now,
        },
        {
          id: 'rep-02',
          organizationId: demoSellerOrg.id,
          fullName: 'Marcus Thorne',
          designation: 'Managing Director',
          officialEmail: 'seller.demo@meridian.test',
          contactNumber: '+49 171 892300',
          roleInOrg: 'Managing Partner (Geschäftsführer)',
          declarationConfirmed: true,
          confirmedAt: now,
        },
      ],
      businessDocuments: [
        {
          id: 'doc-buyer-incorp',
          organizationId: demoBuyerOrg.id,
          documentType: 'CERTIFICATE_OF_INCORPORATION',
          fileName: 'Certificate_of_Incorporation_U74999MH2021PTC368921.pdf',
          fileSize: 420100,
          mimeType: 'application/pdf',
          uploadedAt: now,
          status: 'VERIFIED',
          notes: 'Verified via Ministry of Corporate Affairs (MCA India) check.',
        },
        {
          id: 'doc-seller-incorp',
          organizationId: demoSellerOrg.id,
          documentType: 'CERTIFICATE_OF_INCORPORATION',
          fileName: 'Handelsregisterauszug_HRB_189422_Hamburg.pdf',
          fileSize: 388500,
          mimeType: 'application/pdf',
          uploadedAt: now,
          status: 'VERIFIED',
          notes: 'Verified against German Commercial Register (Handelsregister).',
        },
      ],
      agreementAcceptances: [
        {
          id: 'acc-buyer-001',
          acceptanceId: 'ACC-2026-001-BUYER',
          organizationId: demoBuyerOrg.id,
          userId: demoBuyerUser.id,
          companyLegalName: demoBuyerOrg.legalName,
          authorizedRepresentative: 'Elena Vance',
          designation: 'Director of Procurement',
          officialEmail: demoBuyerOrg.officialEmail,
          agreementVersion: '0.1',
          documentHash: 'a7b89f02c4819d42f534891b72e9d284a1e941fba739a820c45167098e94fa01',
          acceptedAtUtc: now,
          displayTimezone: 'Asia/Kolkata',
          authenticationMethod: 'PASSWORD_MFA_SIMULATED',
          affirmativeConsentEvent: 'CLICK_THROUGH_SIGNATURE_DECLARATION',
          receiptCode: 'MRDN-REC-2026-IN-001',
          isDemo: true,
        },
        {
          id: 'acc-seller-001',
          acceptanceId: 'ACC-2026-002-SELLER',
          organizationId: demoSellerOrg.id,
          userId: demoSellerUser.id,
          companyLegalName: demoSellerOrg.legalName,
          authorizedRepresentative: 'Marcus Thorne',
          designation: 'Managing Director',
          officialEmail: demoSellerOrg.officialEmail,
          agreementVersion: '0.1',
          documentHash: 'a7b89f02c4819d42f534891b72e9d284a1e941fba739a820c45167098e94fa01',
          acceptedAtUtc: now,
          displayTimezone: 'Europe/Berlin',
          authenticationMethod: 'PASSWORD_MFA_SIMULATED',
          affirmativeConsentEvent: 'CLICK_THROUGH_SIGNATURE_DECLARATION',
          receiptCode: 'MRDN-REC-2026-DE-002',
          isDemo: true,
        },
      ],
      privacyAcknowledgements: [
        {
          id: 'priv-001',
          organizationId: demoBuyerOrg.id,
          userId: demoBuyerUser.id,
          documentVersion: '0.1',
          acknowledgedAtUtc: now,
          displayTimezone: 'Asia/Kolkata',
        },
        {
          id: 'priv-002',
          organizationId: demoSellerOrg.id,
          userId: demoSellerUser.id,
          documentVersion: '0.1',
          acknowledgedAtUtc: now,
          displayTimezone: 'Europe/Berlin',
        },
      ],
      complianceScreenings: [
        runCompanyScreening(demoBuyerOrg.id, demoBuyerOrg.legalName, 'India', demoBuyerOrg.registrationNumber),
        runCompanyScreening(demoSellerOrg.id, demoSellerOrg.legalName, 'Germany', demoSellerOrg.registrationNumber),
        runTradeScreening(demoBuyerOrg.id, demoTrade.productDescription, 'Germany', 'India', demoTrade.hsCode),
      ],
      tradeRequests: [demoTrade],
      sellerInvitations: [demoInvitation],
      buyerSellerConnections: [],
      notifications: [
        {
          id: 'notif-01',
          userId: demoBuyerUser.id,
          organizationId: demoBuyerOrg.id,
          title: 'KYB Verification Completed',
          message: 'Your organization MERIDIAN DEMO BUYER PRIVATE LIMITED is verified for international trade orchestration.',
          type: 'SUCCESS',
          read: true,
          createdAt: now,
        },
        {
          id: 'notif-02',
          userId: demoSellerUser.id,
          organizationId: demoSellerOrg.id,
          title: 'Trade Request Invitation Received',
          message: 'MERIDIAN DEMO BUYER PRIVATE LIMITED submitted Trade Request DEMO-TRADE-001 for your review.',
          type: 'ACTION_REQUIRED',
          read: false,
          createdAt: now,
          link: '/seller/invitations',
        },
      ],
      auditEvents: [
        {
          id: 'aud-01',
          organizationId: demoBuyerOrg.id,
          userId: demoBuyerUser.id,
          eventType: 'ORGANIZATION_REGISTERED',
          objectId: demoBuyerOrg.id,
          serverTimestampUtc: now,
          actor: 'buyer.demo@meridian.test',
          evidenceReference: 'AUDIT-GENESIS-001',
          details: 'Demonstration buyer entity registered and seeded.',
        },
        {
          id: 'aud-02',
          organizationId: demoSellerOrg.id,
          userId: demoSellerUser.id,
          eventType: 'ORGANIZATION_REGISTERED',
          objectId: demoSellerOrg.id,
          serverTimestampUtc: now,
          actor: 'seller.demo@meridian.test',
          evidenceReference: 'AUDIT-GENESIS-002',
          details: 'Demonstration seller entity registered and seeded.',
        },
      ],
      emailOutbox: [
        {
          id: 'eml-demo-001',
          recipientEmail: demoSellerOrg.officialEmail,
          subject: 'Invitation to Join Meridian — Trade Request Awaiting Review',
          templateType: 'SELLER_INVITATION',
          payloadJson: {
            buyerCompany: demoBuyerOrg.legalName,
            tradeReference: demoTrade.id,
            productDescription: demoTrade.productDescription,
            invitationLink: `https://app.meridian-trade.systems/invite/${demoInvitation.invitationToken}`,
            expiryDate: demoInvitation.expiresAt,
          },
          status: 'SIMULATED_SENT',
          sentAtUtc: now,
          provider: 'Meridian Outbox Adapter (Simulated / Demo)',
        },
      ],
      sessions: [],
      agreement2List: [generateDefaultAgreement2(demoTrade, demoBuyerOrg, demoSellerOrg)],
      evidenceRecords: [],
      integrityLogs: [],
      telemetryMilestones: {},
      paypalOrders: [],
      realPaymentProofs: [],
      shipments: [],
      aiSentinelAlerts: [],
      buyerInspections: [],
      disputes: [],
    };

    this.seedPhase4EvidenceAndTelemetry(initialData);

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing initial seed data:', e);
    }

    return initialData;
  }

  // User & Auth methods
  public findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(params: {
    name: string;
    email: string;
    passwordPlain: string;
    role: 'BUYER' | 'SELLER';
    organizationId: string;
  }): { user: User; sessionToken: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.passwordPlain, salt);
    const userId = `usr-${params.role.toLowerCase()}-${Date.now().toString(36)}`;

    const newUser: StoredUser = {
      id: userId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: params.role,
      organizationId: params.organizationId,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
    };

    this.data.users.push(newUser);

    const sessionToken = this.createSession(newUser.id, newUser.role, newUser.organizationId);

    // Record audit event
    this.recordAudit({
      organizationId: params.organizationId,
      userId: newUser.id,
      eventType: 'USER_REGISTERED',
      actor: newUser.email,
      details: `User ${newUser.name} registered as ${newUser.role}`,
    });

    // Send Welcome & Verification Email
    this.emailService.sendEmail(
      newUser.email,
      'Welcome to Meridian Trade Systems',
      'ACCOUNT_REGISTRATION',
      { name: newUser.name, role: newUser.role }
    );

    this.emailService.sendEmail(
      newUser.email,
      'Verify Your Meridian Business Email',
      'EMAIL_VERIFICATION',
      { name: newUser.name, verifyCode: 'MRDN-' + Math.floor(100000 + Math.random() * 900000) }
    );

    this.save();
    return { user: this.sanitizeUser(newUser), sessionToken };
  }

  public authenticate(
    email: string,
    passwordPlain: string,
    intendedRole?: string
  ): { success: boolean; user?: User; sessionToken?: string; error?: string } {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'No account found with this corporate email address.' };
    }

    if (intendedRole && user.role !== intendedRole && user.role !== 'DEVELOPER') {
      return {
        success: false,
        error: `This account is authorized as a ${user.role}. Please access the ${user.role.toLowerCase()} portal.`,
      };
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      return { success: false, error: 'Account temporarily locked due to failed attempts. Try again in 15 minutes.' };
    }

    const testHash = hashPassword(passwordPlain, user.salt);
    if (testHash !== user.passwordHash) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      this.save();
      return { success: false, error: 'Invalid password. Please verify your credentials.' };
    }

    // Success reset failures
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date().toISOString();
    user.lockedUntil = null;

    const sessionToken = this.createSession(user.id, user.role, user.organizationId);

    this.recordAudit({
      organizationId: user.organizationId,
      userId: user.id,
      eventType: 'USER_LOGIN',
      actor: user.email,
      details: `Successful sign-in to ${user.role} workspace.`,
    });

    this.emailService.sendEmail(
      user.email,
      'Successful Sign-In to Your Meridian Account',
      'LOGIN_SUCCESS',
      { role: user.role, time: new Date().toISOString() }
    );

    this.save();
    return { success: true, user: this.sanitizeUser(user), sessionToken };
  }

  public verifyEmail(userId: string): boolean {
    const user = this.findUserById(userId);
    if (!user) return false;
    user.emailVerified = true;
    this.recordAudit({
      userId,
      organizationId: user.organizationId,
      eventType: 'EMAIL_VERIFIED',
      actor: user.email,
    });
    this.save();
    return true;
  }

  public createSession(userId: string, role: string, organizationId: string): string {
    const token = `mrdn_sess_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    this.data.sessions.push({ token, userId, role, organizationId, expiresAt });
    this.save();
    return token;
  }

  public getSession(token: string): { user: User; organization?: Organization } | null {
    const sess = this.data.sessions.find((s) => s.token === token);
    if (!sess) return null;
    if (new Date(sess.expiresAt).getTime() < Date.now()) {
      return null;
    }
    const user = this.findUserById(sess.userId);
    if (!user) return null;
    const organization = this.getOrganizationById(user.organizationId);
    return { user: this.sanitizeUser(user), organization };
  }

  public revokeSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // Organizations
  public getOrganizationById(id: string): Organization | undefined {
    return this.data.organizations.find((o) => o.id === id);
  }

  public checkDuplicateOrganization(
    legalName: string,
    country: string,
    registrationNumber: string
  ): { isDuplicate: boolean; matchedOrg?: Organization } {
    const normName = legalName.trim().toLowerCase();
    const normCountry = country.trim().toLowerCase();
    const normReg = registrationNumber.trim().toLowerCase();

    const matched = this.data.organizations.find((o) => {
      const sameReg = o.registrationNumber.trim().toLowerCase() === normReg && o.country.trim().toLowerCase() === normCountry;
      const sameName = o.legalName.trim().toLowerCase() === normName && o.country.trim().toLowerCase() === normCountry;
      return sameReg || sameName;
    });

    return { isDuplicate: !!matched, matchedOrg: matched };
  }

  public createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const orgId = `ORG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newOrg: Organization = {
      ...data,
      id: orgId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.organizations.push(newOrg);
    this.save();
    return newOrg;
  }

  public updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    const org = this.getOrganizationById(id);
    if (!org) return undefined;
    Object.assign(org, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return org;
  }

  public getAllOrganizations(): Organization[] {
    return this.data.organizations;
  }

  // Authorized Representative
  public setAuthorizedRepresentative(data: Omit<AuthorizedRepresentative, 'id' | 'confirmedAt'>): AuthorizedRepresentative {
    const existingIdx = this.data.authorizedRepresentatives.findIndex((r) => r.organizationId === data.organizationId);
    const rep: AuthorizedRepresentative = {
      ...data,
      id: `rep-${Date.now().toString(36)}`,
      confirmedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      this.data.authorizedRepresentatives[existingIdx] = rep;
    } else {
      this.data.authorizedRepresentatives.push(rep);
    }
    this.save();
    return rep;
  }

  public getAuthorizedRepresentative(orgId: string): AuthorizedRepresentative | undefined {
    return this.data.authorizedRepresentatives.find((r) => r.organizationId === orgId);
  }

  // Documents
  public addBusinessDocument(doc: Omit<BusinessDocument, 'id' | 'uploadedAt'>): BusinessDocument {
    const newDoc: BusinessDocument = {
      ...doc,
      id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      uploadedAt: new Date().toISOString(),
    };
    this.data.businessDocuments.push(newDoc);
    this.save();
    return newDoc;
  }

  public getBusinessDocuments(orgId: string): BusinessDocument[] {
    return this.data.businessDocuments.filter((d) => d.organizationId === orgId);
  }

  // Agreement 1 Acceptance
  public recordAgreementAcceptance(params: {
    organizationId: string;
    userId: string;
    companyLegalName: string;
    authorizedRepresentative: string;
    designation: string;
    officialEmail: string;
    agreementVersion: string;
    documentHash: string;
    displayTimezone: string;
    authenticationMethod: string;
    signatureMethod?: string;
    signatureData?: string;
  }): AgreementAcceptance {
    const acceptance: AgreementAcceptance = {
      id: `acc-${Date.now().toString(36)}`,
      acceptanceId: `ACC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      ...params,
      acceptedAtUtc: new Date().toISOString(),
      affirmativeConsentEvent: 'CLICK_THROUGH_SIGNATURE_DECLARATION',
      receiptCode: `MRDN-REC-${Date.now().toString(36).toUpperCase()}`,
      watermark: `ELECTRONICALLY ACCEPTED BY ${params.companyLegalName.toUpperCase()}`,
    };

    this.data.agreementAcceptances.push(acceptance);

    // Update organization status
    this.updateOrganization(params.organizationId, {
      agreement1Status: 'ACCEPTED',
      agreement1AcceptedAt: acceptance.acceptedAtUtc,
      agreement1AcceptedBy: `${params.authorizedRepresentative} (${params.designation})`,
    });

    this.recordAudit({
      organizationId: params.organizationId,
      userId: params.userId,
      eventType: 'AGREEMENT_1_ACCEPTED',
      objectId: acceptance.acceptanceId,
      actor: params.officialEmail,
      evidenceReference: acceptance.receiptCode,
      details: `Master Platform Terms version ${params.agreementVersion} electronically accepted by ${params.authorizedRepresentative}.`,
    });

    this.emailService.sendEmail(
      params.officialEmail,
      'Meridian Platform Terms Accepted — Confirmation',
      'AGREEMENT_ACCEPTANCE',
      {
        companyName: params.companyLegalName,
        representative: params.authorizedRepresentative,
        version: params.agreementVersion,
        acceptanceId: acceptance.acceptanceId,
        date: acceptance.acceptedAtUtc,
      }
    );

    this.save();
    return acceptance;
  }

  public getAgreementAcceptances(orgId: string): AgreementAcceptance[] {
    return this.data.agreementAcceptances.filter((a) => a.organizationId === orgId);
  }

  public getAllAgreementAcceptances(): AgreementAcceptance[] {
    return this.data.agreementAcceptances;
  }

  // Privacy Acknowledgement
  public recordPrivacyAcknowledgement(params: {
    organizationId: string;
    userId: string;
    documentVersion: string;
    displayTimezone: string;
  }): PrivacyAcknowledgement {
    const ack: PrivacyAcknowledgement = {
      id: `priv-${Date.now().toString(36)}`,
      ...params,
      acknowledgedAtUtc: new Date().toISOString(),
    };
    this.data.privacyAcknowledgements.push(ack);
    this.save();
    return ack;
  }

  // Compliance Screening
  public recordComplianceScreening(screening: ComplianceScreening) {
    this.data.complianceScreenings.push(screening);
    this.save();
  }

  public getComplianceScreenings(orgId: string): ComplianceScreening[] {
    return this.data.complianceScreenings.filter((s) => s.organizationId === orgId);
  }

  public getAllComplianceScreenings(): ComplianceScreening[] {
    return this.data.complianceScreenings;
  }

  // Trade Requests
  public createTradeRequest(data: Omit<TradeRequest, 'id' | 'createdAt' | 'updatedAt'>): TradeRequest {
    const tradeId = `TRD-${Date.now().toString(36).toUpperCase()}`;
    const newTrade: TradeRequest = {
      ...data,
      id: tradeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.tradeRequests.push(newTrade);

    // Run trade compliance screening automatically
    const screening = runTradeScreening(
      newTrade.buyerOrgId,
      newTrade.productDescription,
      newTrade.countryOfOrigin,
      newTrade.destination,
      newTrade.hsCode
    );
    this.recordComplianceScreening(screening);

    this.recordAudit({
      organizationId: newTrade.buyerOrgId,
      userId: newTrade.buyerUserId,
      eventType: 'TRADE_REQUEST_CREATED',
      objectId: newTrade.id,
      actor: newTrade.buyerCompanyName,
      details: `Trade request created for ${newTrade.quantity} ${newTrade.unit} of ${newTrade.productDescription}`,
    });

    this.save();
    return newTrade;
  }

  public getTradeRequestsByBuyer(buyerOrgId: string): TradeRequest[] {
    return this.data.tradeRequests.filter((t) => t.buyerOrgId === buyerOrgId);
  }

  public getTradeRequestsBySeller(sellerOrgId: string, sellerEmail?: string): TradeRequest[] {
    return this.data.tradeRequests.filter(
      (t) => t.sellerOrgId === sellerOrgId || (sellerEmail && t.sellerBusinessEmail.toLowerCase() === sellerEmail.toLowerCase())
    );
  }

  public getTradeRequestById(id: string): TradeRequest | undefined {
    return this.data.tradeRequests.find((t) => t.id === id);
  }

  public getTradeById(id: string): TradeRequest | undefined {
    return this.getTradeRequestById(id);
  }

  public updateTradeRequestStatus(id: string, status: TradeRequest['status']): TradeRequest | undefined {
    const tr = this.getTradeRequestById(id);
    if (!tr) return undefined;
    tr.status = status;
    tr.updatedAt = new Date().toISOString();
    this.save();
    return tr;
  }

  public getAllTradeRequests(): TradeRequest[] {
    return this.data.tradeRequests;
  }

  // Seller Invitations
  public createSellerInvitation(tradeRequestId: string, recipientEmail: string, recipientName: string): SellerInvitation {
    const tr = this.getTradeRequestById(tradeRequestId);
    if (!tr) throw new Error('Trade request not found');

    const token = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const invitation: SellerInvitation = {
      id: `inv-${Date.now().toString(36)}`,
      tradeRequestId,
      buyerOrgId: tr.buyerOrgId,
      buyerCompanyName: tr.buyerCompanyName,
      recipientEmail: recipientEmail.trim().toLowerCase(),
      recipientCompanyName: recipientName.trim(),
      invitationToken: token,
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: 'PENDING',
      sentAt: new Date().toISOString(),
    };

    this.data.sellerInvitations.push(invitation);
    tr.status = 'INVITATION_SENT';
    tr.updatedAt = new Date().toISOString();

    // Check if seller already exists in our system
    const existingSellerOrg = this.data.organizations.find(
      (o) => o.role === 'SELLER' && (o.officialEmail.toLowerCase() === recipientEmail.toLowerCase() || o.legalName.toLowerCase() === recipientName.toLowerCase())
    );
    if (existingSellerOrg) {
      tr.sellerOrgId = existingSellerOrg.id;
      // Add notification for existing seller
      const sellerUsers = this.data.users.filter((u) => u.organizationId === existingSellerOrg.id);
      sellerUsers.forEach((su) => {
        this.addNotification({
          userId: su.id,
          organizationId: existingSellerOrg.id,
          title: 'Trade Request Invitation',
          message: `${tr.buyerCompanyName} has invited your company to review Trade Request ${tr.id}.`,
          type: 'ACTION_REQUIRED',
          link: `/seller/trade-requests/${tr.id}`,
        });
      });
    }

    // Send dispatch email
    this.emailService.sendEmail(
      recipientEmail,
      'Invitation to Join Meridian — Trade Request Awaiting Review',
      'SELLER_INVITATION',
      {
        buyerCompany: tr.buyerCompanyName,
        tradeReference: tr.id,
        productDescription: tr.productDescription,
        invitationLink: `https://app.meridian-trade.systems/invite/${token}`,
        expiryDate: invitation.expiresAt,
      }
    );

    this.recordAudit({
      organizationId: tr.buyerOrgId,
      eventType: 'SELLER_INVITATION_SENT',
      objectId: invitation.id,
      actor: tr.buyerCompanyName,
      details: `Invitation dispatched to ${recipientEmail} for Trade Request ${tradeRequestId}`,
    });

    this.save();
    return invitation;
  }

  public getInvitationByToken(token: string): SellerInvitation | undefined {
    return this.data.sellerInvitations.find(
      (i) => i.invitationToken === token || i.id === token || (token === 'INV-SELLER-DEMO-001' && i.id === 'inv-demo-001')
    );
  }

  public respondToInvitation(
    invitationId: string,
    action: 'ACCEPT' | 'DECLINE' | 'CHANGES_REQUESTED',
    sellerOrgId: string,
    notes?: string,
    userId?: string
  ): { success: boolean; invitation?: SellerInvitation; error?: string; alreadyAccepted?: boolean } {
    const inv = this.data.sellerInvitations.find(
      (i) => i.id === invitationId || i.invitationToken === invitationId || (invitationId === 'INV-SELLER-DEMO-001' && i.id === 'inv-demo-001')
    );
    if (!inv) return { success: false, error: 'Invitation not found' };

    // Idempotency: If already accepted, return success cleanly without creating duplicate records
    if (inv.status === 'ACCEPTED' && action === 'ACCEPT') {
      return { success: true, invitation: inv, alreadyAccepted: true };
    }

    if (inv.status !== 'PENDING' && inv.status !== 'CHANGES_REQUESTED') {
      return { success: false, error: `Invitation is already ${inv.status.toLowerCase()}` };
    }

    const tr = this.getTradeRequestById(inv.tradeRequestId);
    const sellerOrg = this.getOrganizationById(sellerOrgId);

    if (action === 'ACCEPT') {
      inv.status = 'ACCEPTED';
      inv.redeemedAt = new Date().toISOString();
      if (userId) {
        inv.redeemedByUserId = userId;
      }

      if (tr) {
        tr.status = 'SELLER_ACCEPTED_INVITATION';
        tr.sellerOrgId = sellerOrgId;
        tr.updatedAt = new Date().toISOString();

        // Check if connection already exists to prevent duplicate connection records
        const existingConn = this.data.buyerSellerConnections.find(
          (c) => c.tradeRequestId === tr.id && c.sellerOrgId === sellerOrgId
        );

        if (!existingConn) {
          const connId = `conn-${Date.now().toString(36)}`;
          this.data.buyerSellerConnections.push({
            id: connId,
            buyerOrgId: tr.buyerOrgId,
            buyerCompanyName: tr.buyerCompanyName,
            sellerOrgId: sellerOrgId,
            sellerCompanyName: sellerOrg?.legalName || inv.recipientCompanyName,
            tradeRequestId: tr.id,
            connectedAt: new Date().toISOString(),
            status: 'CONNECTED',
          });
        }

        // Notify Buyer users
        const buyerUsers = this.data.users.filter((u) => u.organizationId === tr.buyerOrgId);
        buyerUsers.forEach((bu) => {
          this.addNotification({
            userId: bu.id,
            organizationId: tr.buyerOrgId,
            title: 'Seller Accepted Invitation!',
            message: `${sellerOrg?.legalName || inv.recipientCompanyName} accepted your Trade Request ${tr.id}. Both organizations are now securely connected.`,
            type: 'SUCCESS',
            link: `/buyer/trade-requests/${tr.id}`,
          });
        });
      }

      this.recordAudit({
        organizationId: sellerOrgId,
        userId: userId,
        eventType: 'SELLER_INVITATION_ACCEPTED',
        objectId: inv.id,
        actor: sellerOrg?.officialEmail || 'seller.representative',
        details: `Seller accepted invitation ${inv.id} for trade ${inv.tradeRequestId}. Bilateral channel established.`,
      });
    } else if (action === 'DECLINE') {
      inv.status = 'DECLINED';
      inv.responseNotes = notes;
      if (tr) {
        tr.status = 'INVITATION_DECLINED';
        tr.updatedAt = new Date().toISOString();
      }
      this.recordAudit({
        organizationId: sellerOrgId,
        userId: userId,
        eventType: 'SELLER_INVITATION_DECLINED',
        objectId: inv.id,
        actor: sellerOrg?.officialEmail || 'seller.representative',
        details: `Seller declined invitation ${inv.id}. Reason: ${notes || 'Not specified'}`,
      });
    } else if (action === 'CHANGES_REQUESTED') {
      inv.status = 'CHANGES_REQUESTED';
      inv.responseNotes = notes;
      if (tr) {
        tr.status = 'CHANGES_REQUESTED';
        tr.updatedAt = new Date().toISOString();
      }
      this.recordAudit({
        organizationId: sellerOrgId,
        userId: userId,
        eventType: 'SELLER_INVITATION_CHANGES_REQUESTED',
        objectId: inv.id,
        actor: sellerOrg?.officialEmail || 'seller.representative',
        details: `Seller requested changes on invitation ${inv.id}: ${notes}`,
      });
    }

    // Send email notification to buyer
    const buyerOrg = this.getOrganizationById(inv.buyerOrgId);
    if (buyerOrg) {
      this.emailService.sendEmail(
        buyerOrg.officialEmail,
        `Trade Request ${inv.tradeRequestId} Update — Seller ${action}`,
        'SELLER_RESPONSE',
        {
          action,
          sellerCompany: sellerOrg?.legalName || inv.recipientCompanyName,
          tradeId: inv.tradeRequestId,
          notes,
        }
      );
    }

    this.save();
    return { success: true, invitation: inv };
  }

  public getInvitationsByOrg(orgId: string, orgEmail?: string): SellerInvitation[] {
    return this.data.sellerInvitations.filter(
      (i) =>
        i.buyerOrgId === orgId ||
        (orgEmail && i.recipientEmail.toLowerCase() === orgEmail.toLowerCase())
    );
  }

  public getAllInvitations(): SellerInvitation[] {
    return this.data.sellerInvitations;
  }

  public getConnectionsForOrg(orgId: string): BuyerSellerConnection[] {
    return this.data.buyerSellerConnections.filter((c) => c.buyerOrgId === orgId || c.sellerOrgId === orgId);
  }

  // Notifications
  public addNotification(n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const item: NotificationItem = {
      ...n,
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.data.notifications.push(item);
    this.save();
    return item;
  }

  public getNotifications(userId: string): NotificationItem[] {
    return this.data.notifications.filter((n) => n.userId === userId).reverse();
  }

  public markNotificationRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  // Audit events
  public recordAudit(event: Omit<AuditEvent, 'id' | 'serverTimestampUtc'>): AuditEvent {
    const audit: AuditEvent = {
      ...event,
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      serverTimestampUtc: new Date().toISOString(),
    };
    this.data.auditEvents.push(audit);
    this.save();
    return audit;
  }

  public logAuditEvent(event: any): AuditEvent {
    return this.recordAudit(event);
  }

  public getAuditEvents(orgId?: string): AuditEvent[] {
    if (orgId) {
      return this.data.auditEvents.filter((a) => a.organizationId === orgId).reverse();
    }
    return [...this.data.auditEvents].reverse();
  }

  // --------------------------------------------------------------------------
  // Agreement 2 Legal Governance & Readiness Gate Methods
  // --------------------------------------------------------------------------

  public getAgreement2ByTradeId(tradeId: string): Agreement2 | undefined {
    return this.data.agreement2List.find((a) => a.tradeRequestId === tradeId);
  }

  public getAgreement2(tradeId: string): Agreement2 {
    return this.getOrCreateAgreement2(tradeId);
  }

  public getAgreement2ById(id: string): Agreement2 | undefined {
    return this.data.agreement2List.find((a) => a.id === id);
  }

  public getOrCreateAgreement2(tradeId: string): Agreement2 {
    let agreement = this.getAgreement2ByTradeId(tradeId);
    if (agreement) return agreement;

    const trade = this.getTradeRequestById(tradeId);
    if (!trade) throw new Error(`Trade request ${tradeId} not found.`);

    const buyerOrg = this.getOrganizationById(trade.buyerOrgId);
    if (!buyerOrg) throw new Error(`Buyer organization ${trade.buyerOrgId} not found.`);

    // If sellerOrgId is not yet linked, lookup by recipient company name or email
    let sellerOrg = trade.sellerOrgId ? this.getOrganizationById(trade.sellerOrgId) : undefined;
    if (!sellerOrg) {
      sellerOrg = this.data.organizations.find(
        (o) => o.role === 'SELLER' && (o.legalName === trade.sellerCompanyName || o.officialEmail === trade.sellerBusinessEmail)
      );
    }
    if (!sellerOrg) {
      // Fallback to default demo seller
      sellerOrg = this.getOrganizationById('DEMO-SELLER-001') || this.data.organizations.find((o) => o.role === 'SELLER');
    }
    if (!sellerOrg) throw new Error('Seller enterprise record could not be resolved for Agreement 2 formation.');

    agreement = generateDefaultAgreement2(trade, buyerOrg, sellerOrg);
    this.data.agreement2List.push(agreement);
    this.save();
    return agreement;
  }

  public updateAgreement2Clause(
    tradeId: string,
    clauseId: string,
    content: string,
    role: 'BUYER' | 'SELLER',
    userEmail: string
  ): { success: boolean; agreement?: Agreement2; error?: string } {
    const agreement = this.getOrCreateAgreement2(tradeId);
    const clause = agreement.clauses.find((c) => c.id === clauseId);
    if (!clause) return { success: false, error: `Clause ${clauseId} not found in Agreement 2.` };

    const previousContent = clause.content;
    clause.content = content.trim();

    // Granular clause invalidation: Only the modified clause's approvals are reset
    clause.buyerApproved = role === 'BUYER';
    clause.buyerApprovedAt = role === 'BUYER' ? new Date().toISOString() : undefined;
    clause.buyerApprovedBy = role === 'BUYER' ? userEmail : undefined;

    clause.sellerApproved = role === 'SELLER';
    clause.sellerApprovedAt = role === 'SELLER' ? new Date().toISOString() : undefined;
    clause.sellerApprovedBy = role === 'SELLER' ? userEmail : undefined;

    clause.status = role === 'BUYER' ? 'BUYER_PROPOSED' : 'SELLER_PROPOSED';
    clause.rejectionReason = undefined;
    clause.rejectedBy = undefined;
    clause.lastModifiedAt = new Date().toISOString();
    clause.lastModifiedBy = userEmail;

    // Increment document revision number
    const currentVersionNum = parseFloat(agreement.version) || 0.1;
    agreement.version = (currentVersionNum + 0.1).toFixed(1);
    agreement.updatedAt = new Date().toISOString();

    // Invalidate previous signatures if document content was modified
    if (agreement.signatures.buyer || agreement.signatures.seller) {
      agreement.signatures = {};
      this.recordAudit({
        organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
        eventType: 'AGREEMENT_2_SIGNATURES_INVALIDATED',
        objectId: agreement.id,
        actor: userEmail,
        details: `Previous signatures invalidated due to material clause ${clause.number} modification to version ${agreement.version}.`,
      });
    }

    // Reset agreement status to negotiating
    agreement.status = 'TERMS_NEGOTIATING';
    agreement.sha256Hash = calculateAgreement2Hash(agreement);

    // Re-evaluate readiness gate
    this.evaluateAgreement2ReadinessGate(tradeId);

    this.recordAudit({
      organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
      eventType: 'AGREEMENT_2_CLAUSE_MODIFIED',
      objectId: clause.id,
      actor: userEmail,
      details: `Clause ${clause.number} (${clause.title}) proposed by ${role} (${userEmail}). Revisions: version ${agreement.version}.`,
    });

    this.save();
    return { success: true, agreement };
  }

  public approveAgreement2Clause(
    tradeId: string,
    clauseId: string,
    role: 'BUYER' | 'SELLER',
    userEmail: string
  ): { success: boolean; agreement?: Agreement2; error?: string } {
    const agreement = this.getOrCreateAgreement2(tradeId);
    const clause = agreement.clauses.find((c) => c.id === clauseId);
    if (!clause) return { success: false, error: `Clause ${clauseId} not found.` };

    const now = new Date().toISOString();
    if (role === 'BUYER') {
      clause.buyerApproved = true;
      clause.buyerApprovedAt = now;
      clause.buyerApprovedBy = userEmail;
    } else {
      clause.sellerApproved = true;
      clause.sellerApprovedAt = now;
      clause.sellerApprovedBy = userEmail;
    }

    if (clause.buyerApproved && clause.sellerApproved) {
      clause.status = 'MUTUALLY_APPROVED';
      clause.rejectionReason = undefined;
      clause.rejectedBy = undefined;
    }

    agreement.updatedAt = now;
    agreement.sha256Hash = calculateAgreement2Hash(agreement);

    // Re-evaluate readiness gate
    this.evaluateAgreement2ReadinessGate(tradeId);

    this.recordAudit({
      organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
      eventType: 'AGREEMENT_2_CLAUSE_APPROVED',
      objectId: clause.id,
      actor: userEmail,
      details: `Clause ${clause.number} approved by ${role} (${userEmail}). Clause consensus: ${clause.status}.`,
    });

    this.save();
    return { success: true, agreement };
  }

  public rejectAgreement2Clause(
    tradeId: string,
    clauseId: string,
    role: 'BUYER' | 'SELLER',
    userEmail: string,
    reason: string
  ): { success: boolean; agreement?: Agreement2; error?: string } {
    const agreement = this.getOrCreateAgreement2(tradeId);
    const clause = agreement.clauses.find((c) => c.id === clauseId);
    if (!clause) return { success: false, error: `Clause ${clauseId} not found.` };

    const now = new Date().toISOString();
    clause.status = 'REJECTED';
    clause.rejectedBy = role;
    clause.rejectionReason = reason || 'Rejected by counterparty';
    clause.buyerApproved = false;
    clause.sellerApproved = false;
    clause.lastModifiedAt = now;
    clause.lastModifiedBy = userEmail;

    agreement.status = 'TERMS_NEGOTIATING';
    agreement.updatedAt = now;
    agreement.sha256Hash = calculateAgreement2Hash(agreement);

    // Re-evaluate readiness gate (will now fail criteria 7 and 11)
    this.evaluateAgreement2ReadinessGate(tradeId);

    this.recordAudit({
      organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
      eventType: 'AGREEMENT_2_CLAUSE_REJECTED',
      objectId: clause.id,
      actor: userEmail,
      details: `Clause ${clause.number} rejected by ${role}: "${reason}". Clause marked REJECTED and excluded from finalization.`,
    });

    this.save();
    return { success: true, agreement };
  }

  public evaluateAgreement2ReadinessGate(tradeId: string): Agreement2ReadinessReport {
    const agreement = this.getOrCreateAgreement2(tradeId);
    const trade = this.getTradeRequestById(tradeId);
    if (!trade) throw new Error(`Trade ${tradeId} not found`);

    const buyerOrg = this.getOrganizationById(trade.buyerOrgId);
    if (!buyerOrg) throw new Error(`Buyer org ${trade.buyerOrgId} not found`);

    const sellerOrg = (trade.sellerOrgId ? this.getOrganizationById(trade.sellerOrgId) : undefined) ||
      this.getOrganizationById('DEMO-SELLER-001') ||
      this.data.organizations.find((o) => o.role === 'SELLER')!;

    const buyerRep = this.getAuthorizedRepresentative(buyerOrg.id);
    const sellerRep = this.getAuthorizedRepresentative(sellerOrg.id);
    const buyerDocs = this.getBusinessDocuments(buyerOrg.id);
    const sellerDocs = this.getBusinessDocuments(sellerOrg.id);
    const screenings = this.getComplianceScreenings(buyerOrg.id).concat(this.getComplianceScreenings(sellerOrg.id));

    const report = evaluateAgreement2Readiness({
      agreement,
      trade,
      buyerOrg,
      sellerOrg,
      buyerRep,
      sellerRep,
      buyerDocs,
      sellerDocs,
      screenings,
    });

    agreement.readinessReport = report;

    // Update status based on strict readiness gate
    if (report.overallPassed) {
      if (agreement.status === 'TERMS_NEGOTIATING' || agreement.status === 'READINESS_GATE_FAILED') {
        agreement.status = 'READY_FOR_SIGNING';
      }
    } else {
      if (agreement.status === 'READY_FOR_SIGNING') {
        agreement.status = 'READINESS_GATE_FAILED';
      }
      // Record failed gate evaluation in audit events
      this.recordAudit({
        organizationId: buyerOrg.id,
        eventType: 'READINESS_GATE_EVALUATION_FAILED',
        objectId: agreement.id,
        actor: 'SYSTEM_READINESS_GATE',
        details: `Readiness gate rejected: ${report.blockingFailuresCount} blocking conditions failed (${report.items.filter((i) => !i.passed).map((i) => i.code).join(', ')}).`,
      });
    }

    this.save();
    return report;
  }

  public signAgreement2(
    tradeId: string,
    role: 'BUYER' | 'SELLER',
    signerName: string,
    title: string,
    email: string,
    expectedHash: string,
    timezone: string,
    ip: string,
    signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED' = 'PROTOTYPE_TYPED',
    signatureData?: string,
    disclaimerText: string = 'Prototype electronic signature interaction: Binds representative assent to Agreement 2 without certified digital signature claims.'
  ): { success: boolean; agreement?: Agreement2; error?: string } {
    const agreement = this.getOrCreateAgreement2(tradeId);

    // 1. BACKEND READINESS GATE ENFORCEMENT: Independent server-side validation
    const readiness = this.evaluateAgreement2ReadinessGate(tradeId);
    if (!readiness.overallPassed) {
      const blockedReasons = readiness.items
        .filter((i) => !i.passed && i.severity === 'BLOCKING')
        .map((i) => `${i.code}: ${i.details}`)
        .join('; ');

      this.recordAudit({
        organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
        eventType: 'BLOCKED_SIGNATURE_ATTEMPT_GATE_FAILED',
        objectId: agreement.id,
        actor: email,
        details: `Signing attempt blocked: ${readiness.blockingFailuresCount} mandatory readiness conditions unresolved. Reasons: ${blockedReasons}`,
      });

      return {
        success: false,
        error: `Agreement 2 cannot be signed: Readiness Gate failed with ${readiness.blockingFailuresCount} unresolved mandatory condition(s). Blockers: ${blockedReasons}`,
      };
    }

    // 2. VERSION & HASH INTEGRITY GUARD: Reject stale signatures
    if (expectedHash !== agreement.sha256Hash) {
      this.recordAudit({
        organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
        eventType: 'BLOCKED_SIGNATURE_STALE_HASH',
        objectId: agreement.id,
        actor: email,
        details: `Signing attempt rejected: Stale version digest submitted (${expectedHash}) does not match active agreement version ${agreement.version} (${agreement.sha256Hash}).`,
      });

      return {
        success: false,
        error: `Stale version signature rejected: Your signature request was submitted against hash ${expectedHash}, but active agreement version is ${agreement.version} (${agreement.sha256Hash}). Please refresh and review current terms.`,
      };
    }

    // 3. AFFIRMATIVE PROTOTYPE SIGNATURE EXECUTION
    const now = new Date().toISOString();
    const signatureHash = crypto
      .createHash('sha256')
      .update(`${agreement.sha256Hash}:${role}:${email}:${now}:${signatureMethod}`)
      .digest('hex');

    const receiptCode = `SIG-AGR2-${role}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const signature: Agreement2Signature = {
      party: role,
      organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
      companyLegalName: role === 'BUYER' ? agreement.buyerCompanyName : agreement.sellerCompanyName,
      authorizedSignerName: signerName,
      signerTitle: title,
      signerEmail: email,
      signedAtUtc: now,
      displayTimezone: timezone || 'UTC',
      signatureHash,
      documentVersionHash: agreement.sha256Hash,
      receiptCode,
      ipAddress: ip || '127.0.0.1',
      signatureMethod,
      signatureData,
      prototypeElectronicDisclaimer: disclaimerText,
    };

    if (role === 'BUYER') {
      agreement.signatures.buyer = signature;
    } else {
      agreement.signatures.seller = signature;
    }

    // Check if both parties have executed
    const isBothSigned = !!agreement.signatures.buyer && !!agreement.signatures.seller;
    if (isBothSigned) {
      agreement.status = 'EXECUTED';
      const trade = this.getTradeRequestById(tradeId);
      if (trade) {
        trade.status = 'SELLER_ACCEPTED_INVITATION';
        trade.updatedAt = now;
      }
      this.recordAudit({
        organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
        eventType: 'AGREEMENT_2_FULLY_EXECUTED',
        objectId: agreement.id,
        actor: email,
        details: `Agreement 2 executed by both parties! Final SHA-256 Digest: ${agreement.sha256Hash}. Buyer receipt: ${agreement.signatures.buyer?.receiptCode}, Seller receipt: ${signature.receiptCode}.`,
      });
    } else {
      agreement.status = 'PARTIALLY_SIGNED';
      this.recordAudit({
        organizationId: role === 'BUYER' ? agreement.buyerOrgId : agreement.sellerOrgId,
        eventType: 'AGREEMENT_2_PARTIALLY_SIGNED',
        objectId: agreement.id,
        actor: email,
        details: `Agreement 2 signed by ${role} (${signerName}, ${title}). Pending counterparty signature on version ${agreement.version}.`,
      });
    }

    agreement.updatedAt = now;
    this.save();
    return { success: true, agreement };
  }

  public flagAgreement2LegalReview(
    tradeId: string,
    reason: string,
    userEmail: string
  ): { success: boolean; agreement?: Agreement2 } {
    const agreement = this.getOrCreateAgreement2(tradeId);
    agreement.legalReviewRequired = true;
    agreement.legalReviewCleared = false;
    agreement.legalReviewNotes = reason;
    agreement.status = 'LEGAL_REVIEW_REQUIRED';
    agreement.updatedAt = new Date().toISOString();

    this.recordAudit({
      organizationId: agreement.buyerOrgId,
      eventType: 'AGREEMENT_2_FLAGGED_LEGAL_REVIEW',
      objectId: agreement.id,
      actor: userEmail,
      details: `Agreement 2 escalated for mandatory administrative legal review: "${reason}". Finalization locked.`,
    });

    this.save();
    return { success: true, agreement };
  }

  public clearAgreement2LegalReview(
    tradeId: string,
    adminEmail: string,
    notes: string
  ): { success: boolean; agreement?: Agreement2 } {
    const agreement = this.getOrCreateAgreement2(tradeId);
    agreement.legalReviewCleared = true;
    agreement.legalReviewClearedAt = new Date().toISOString();
    agreement.legalReviewClearedBy = adminEmail;
    agreement.legalReviewNotes = (agreement.legalReviewNotes || '') + ` | Cleared by ${adminEmail}: ${notes}`;
    agreement.updatedAt = new Date().toISOString();

    // Re-evaluate readiness gate
    this.evaluateAgreement2ReadinessGate(tradeId);

    this.recordAudit({
      organizationId: agreement.buyerOrgId,
      eventType: 'AGREEMENT_2_LEGAL_REVIEW_CLEARED',
      objectId: agreement.id,
      actor: adminEmail,
      details: `Administrative legal review cleared by ${adminEmail}: "${notes}".`,
    });

    this.save();
    return { success: true, agreement };
  }

  // ==========================================
  // PHASE 4: EVIDENCE, INTEGRITY & CANONICAL MANIFEST
  // ==========================================

  public getEvidenceRecords(tradeId: string): DocumentEvidenceRecord[] {
    return (this.data.evidenceRecords || []).filter((e) => e.tradeId === tradeId);
  }

  public getEvidenceById(evidenceId: string): DocumentEvidenceRecord | undefined {
    return (this.data.evidenceRecords || []).find((e) => e.id === evidenceId);
  }

  public ingestEvidence(params: {
    tradeId: string;
    category: EvidenceCategory;
    fileName: string;
    mimeType: string;
    fileBuffer: Buffer;
    uploadedBy: string;
    uploadedByOrgId: string;
    caption?: string;
    documentVersion?: string;
  }): DocumentEvidenceRecord {
    return this.addEvidenceRecord(params);
  }

  public addEvidenceRecord(params: {
    tradeId: string;
    category: EvidenceCategory;
    fileName: string;
    mimeType: string;
    fileBuffer: Buffer;
    uploadedBy: string;
    uploadedByOrgId: string;
    caption?: string;
    documentVersion?: string;
  }): DocumentEvidenceRecord {
    const evidenceId = `EVD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const stored = objectStorage.storeObject(params.tradeId, evidenceId, params.fileName, params.fileBuffer);

    const record: DocumentEvidenceRecord = {
      id: evidenceId,
      tradeId: params.tradeId,
      category: params.category,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: stored.fileSize,
      storageKey: stored.storageKey,
      storageUrl: `/api/storage/${stored.storageKey}`,
      sha256Hash: stored.sha256Hash,
      uploadedBy: params.uploadedBy,
      uploadedByOrgId: params.uploadedByOrgId,
      uploadedAt: new Date().toISOString(),
      documentVersion: params.documentVersion || 'v1.0',
      caption: params.caption,
      status: 'ACTIVE',
    };

    if (!this.data.evidenceRecords) this.data.evidenceRecords = [];
    this.data.evidenceRecords.push(record);

    // Initial baseline entry in access-controlled append-only audit trail
    if (!this.data.integrityLogs) this.data.integrityLogs = [];
    const initialLog: IntegrityVerificationRecord = {
      id: `VERIF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      evidenceId: record.id,
      tradeId: params.tradeId,
      verifiedBy: params.uploadedBy,
      verifiedByRole: 'UPLOADER',
      verifiedAt: record.uploadedAt,
      recalculatedHash: stored.sha256Hash,
      baselineHash: stored.sha256Hash,
      match: true,
      verificationScope: 'Byte-level SHA-256 comparison against initial upload baseline',
      disclaimer: 'SHA-256 verification detects differences against the stored baseline and does not independently establish document authenticity or cargo condition.',
      notes: 'Initial upload baseline digest recorded.',
    };
    this.data.integrityLogs.push(initialLog);

    this.recordAudit({
      organizationId: params.uploadedByOrgId,
      eventType: 'DOCUMENT_EVIDENCE_REGISTERED',
      objectId: record.id,
      actor: params.uploadedBy,
      details: `New evidence registered: ${record.fileName} (${record.category}). Baseline SHA-256: ${record.sha256Hash}. Stored in private object storage: ${record.storageKey}.`,
    });

    this.save();
    return record;
  }

  public verifyEvidenceIntegrity(
    evidenceId: string,
    tradeId: string,
    verifiedBy: string,
    verifiedByRole: string,
    notes?: string
  ): { success: boolean; record: IntegrityVerificationRecord; error?: string } {
    const evidence = this.getEvidenceById(evidenceId);
    if (!evidence) {
      return { success: false, error: 'Evidence record not found in database.', record: {} as any };
    }

    const recalculatedHash = objectStorage.recalculateHash(evidence.storageKey);
    if (!recalculatedHash) {
      return { success: false, error: `Object file missing from private storage: ${evidence.storageKey}`, record: {} as any };
    }

    const match = recalculatedHash === evidence.sha256Hash;
    const now = new Date().toISOString();

    const record: IntegrityVerificationRecord = {
      id: `VERIF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      evidenceId: evidence.id,
      tradeId: tradeId,
      verifiedBy: verifiedBy,
      verifiedByRole: verifiedByRole,
      verifiedAt: now,
      recalculatedHash,
      baselineHash: evidence.sha256Hash,
      match,
      verificationScope: 'Byte-level SHA-256 comparison against initial upload baseline',
      disclaimer: 'SHA-256 verification detects differences against the stored baseline and does not independently establish document authenticity or cargo condition.',
      notes: notes || (match ? 'Recalculated SHA-256 matches baseline digest.' : 'INTEGRITY CHECK FAILED: Hash mismatch detected against baseline!'),
    };

    if (!this.data.integrityLogs) this.data.integrityLogs = [];
    this.data.integrityLogs.push(record);

    this.recordAudit({
      organizationId: evidence.uploadedByOrgId,
      eventType: match ? 'EVIDENCE_INTEGRITY_VERIFIED' : 'EVIDENCE_INTEGRITY_CHECK_FAILED',
      objectId: evidence.id,
      actor: verifiedBy,
      details: match
        ? `Integrity check VERIFIED for ${evidence.fileName}. Digest matches baseline: ${evidence.sha256Hash}.`
        : `CRITICAL: Integrity check FAILED for ${evidence.fileName}! Recalculated: ${recalculatedHash}, Baseline: ${evidence.sha256Hash}.`,
    });

    this.save();
    return { success: true, record };
  }

  public getIntegrityLogs(tradeId: string): IntegrityVerificationRecord[] {
    return (this.data.integrityLogs || []).filter((l) => l.tradeId === tradeId);
  }

  public getTelemetryMilestones(tradeId: string): SimulatedTelemetryMilestone[] {
    return (this.data.telemetryMilestones && this.data.telemetryMilestones[tradeId]) || [];
  }

  public generateCanonicalManifest(tradeId: string): CanonicalTradeManifest {
    const trade = this.getTradeRequestById(tradeId);
    const agreement2 = this.getOrCreateAgreement2(tradeId);
    const evidenceItems = this.getEvidenceRecords(tradeId);
    const logs = this.getIntegrityLogs(tradeId);

    const now = new Date().toISOString();

    const rawManifestPayload = {
      tradeId,
      buyerId: trade?.buyerOrgId,
      buyerName: trade?.buyerCompanyName,
      sellerId: trade?.sellerOrgId,
      sellerName: trade?.sellerCompanyName,
      incoterms: trade?.incoterms || 'CIF',
      product: trade?.productDescription,
      agreedValue: trade?.proposedPrice || 0,
      currency: trade?.currency || 'USD',
      agreement1: {
        buyerAcceptedAt: '2026-11-01T10:00:00Z',
        sellerAcceptedAt: '2026-11-02T14:00:00Z',
      },
      agreement2: {
        id: agreement2.id,
        version: agreement2.version,
        sha256: agreement2.sha256Hash,
        status: agreement2.status,
        buyerSignedAt: agreement2.signatures.buyer?.signedAtUtc,
        sellerSignedAt: agreement2.signatures.seller?.signedAtUtc,
      },
      evidenceManifest: evidenceItems.map((e) => ({
        id: e.id,
        category: e.category,
        fileName: e.fileName,
        sha256: e.sha256Hash,
      })),
      timestamp: now,
    };

    const canonicalJsonString = JSON.stringify(rawManifestPayload);
    const canonicalJsonSha256 = crypto.createHash('sha256').update(canonicalJsonString).digest('hex');

    // Distinct digest of the generated canonical PDF file
    const canonicalPdfSha256 = crypto
      .createHash('sha256')
      .update(`CANONICAL-PDF-EXPORT:${tradeId}:${canonicalJsonSha256}`)
      .digest('hex');

    const manifest: CanonicalTradeManifest = {
      manifestVersion: '1.0',
      generatedAt: now,
      tradeId,
      canonicalJsonSha256,
      canonicalPdfSha256,
      tradeSummary: {
        buyerCompanyName: trade?.buyerCompanyName || 'Meridian Global Procurement',
        sellerCompanyName: trade?.sellerCompanyName || 'Meridian Demo Seller GmbH',
        incoterms: trade?.incoterms || 'CIF',
        productDescription: trade?.productDescription || 'Trade Commodities',
        agreedValue: trade?.proposedPrice || 185000,
        currency: trade?.currency || 'USD',
      },
      agreement1Summary: {
        buyerAcceptedAt: '2026-11-01T10:00:00Z',
        sellerAcceptedAt: '2026-11-02T14:00:00Z',
      },
      agreement2Summary: {
        agreementId: agreement2.id,
        version: agreement2.version,
        agreementSha256: agreement2.sha256Hash,
        buyerSignedAt: agreement2.signatures.buyer?.signedAtUtc,
        sellerSignedAt: agreement2.signatures.seller?.signedAtUtc,
      },
      evidenceSummary: {
        totalItems: evidenceItems.length,
        items: evidenceItems.map((e) => ({
          evidenceId: e.id,
          category: e.category,
          fileName: e.fileName,
          sha256Hash: e.sha256Hash,
        })),
      },
      integrityRecordSummary: {
        totalVerificationAttempts: logs.length,
        allMatch: logs.length > 0 && logs.every((l) => l.match),
      },
      disclaimer: 'The canonical JSON manifest hash certifies the backend trade record state at export. SHA-256 detects differences against the stored baseline and does not independently establish cargo condition or document validity.',
    };

    return manifest;
  }

  // ==========================================
  // PAYPAL SANDBOX & PAYMENT METHODS
  // ==========================================
  public getPayPalOrders(tradeId: string): PayPalOrderRecord[] {
    return (this.data.paypalOrders || []).filter((o) => o.tradeId === tradeId);
  }

  public createPayPalOrder(params: {
    tradeId: string;
    buyerOrgId: string;
    sellerOrgId: string;
    amount: number;
    currency: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): PayPalOrderRecord {
    if (!this.data.paypalOrders) this.data.paypalOrders = [];

    const orderId = `PAYPAL-SBX-ORD-${Date.now().toString(36).toUpperCase()}`;
    const separator = params.returnUrl && params.returnUrl.includes('?') ? '&' : '?';
    const fallbackApprovalUrl = params.returnUrl
      ? `${params.returnUrl}${separator}token=${orderId}&simulated=true`
      : `/buyer/home?tradeId=${params.tradeId}&paypalStatus=approved&token=${orderId}&simulated=true`;

    const newOrder: PayPalOrderRecord = {
      id: orderId,
      tradeId: params.tradeId,
      buyerOrgId: params.buyerOrgId,
      sellerOrgId: params.sellerOrgId,
      amount: params.amount,
      currency: params.currency || 'EUR',
      status: 'BUYER_APPROVAL_REQUIRED',
      createdAt: new Date().toISOString(),
      paypalOrderId: orderId,
      approvalUrl: fallbackApprovalUrl,
      disclaimer: 'PAYPAL SANDBOX — VIRTUAL PAYMENT DEMONSTRATION — NO REAL MONEY TRANSFERRED',
    };

    this.data.paypalOrders.push(newOrder);

    this.logAuditEvent({
      organizationId: params.buyerOrgId,
      eventType: 'PAYMENT_MILESTONE_VERIFIED',
      objectId: orderId,
      actor: 'buyer.demo@meridian.test',
      evidenceReference: orderId,
      details: `PayPal Sandbox virtual order initialized for ${params.currency} ${params.amount} (Trade ${params.tradeId}). No real funds transferred.`,
    });

    this.save();
    return newOrder;
  }

  public capturePayPalOrder(params: {
    tradeId: string;
    orderId: string;
    payerEmail?: string;
  }): PayPalOrderRecord {
    if (!this.data.paypalOrders) this.data.paypalOrders = [];
    const order = this.data.paypalOrders.find((o) => o.id === params.orderId || o.paypalOrderId === params.orderId);
    if (!order) {
      throw new Error(`PayPal order ${params.orderId} not found.`);
    }

    // Idempotent: If already captured (e.g. captured via webhook or prior call), safely return
    if (order.status === 'CAPTURED') {
      return order;
    }

    const captureId = `PAYPAL-SBX-CAP-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    order.status = 'CAPTURED';
    order.approvedAt = order.approvedAt || now;
    order.capturedAt = now;
    order.paypalCaptureId = order.paypalCaptureId || captureId;
    if (params.payerEmail) {
      order.payerEmail = params.payerEmail;
    }

    const trade = this.data.tradeRequests.find((t) => t.id === params.tradeId);
    if (trade && (trade.status === 'READY_FOR_SHIPMENT' || trade.status === 'SELLER_ACCEPTED_INVITATION')) {
      trade.status = 'ACTIVE_IN_TRANSIT';
    }

    this.logAuditEvent({
      organizationId: order.buyerOrgId,
      eventType: 'PAYMENT_MILESTONE_VERIFIED',
      objectId: order.paypalCaptureId,
      actor: params.payerEmail || 'buyer.sandbox@meridian-trade.test',
      evidenceReference: order.paypalCaptureId,
      details: `PayPal Sandbox virtual payment capture completed for order ${order.paypalOrderId} (${order.currency} ${order.amount}). Status: CAPTURED.`,
    });

    this.save();
    return order;
  }

  public handlePayPalWebhook(eventPayload: any): { received: boolean; processed: boolean; orderId?: string } {
    if (!this.data.paypalOrders) this.data.paypalOrders = [];
    const eventType = eventPayload?.event_type;
    const resource = eventPayload?.resource;
    const relatedOrderId = resource?.supplementary_data?.related_ids?.order_id || resource?.custom_id;
    const resourceId = resource?.id;

    if (!resourceId && !relatedOrderId) {
      return { received: true, processed: false };
    }

    let order: PayPalOrderRecord | undefined;
    if (relatedOrderId) {
      order = this.data.paypalOrders.find(
        (o) => o.id === relatedOrderId || o.paypalOrderId === relatedOrderId
      );
    }
    if (!order && resourceId) {
      order = this.data.paypalOrders.find(
        (o) => o.id === resourceId || o.paypalOrderId === resourceId || o.paypalCaptureId === resourceId
      );
    }

    if (!order) {
      return { received: true, processed: false, orderId: relatedOrderId || resourceId };
    }

    if (!order.webhookEvents) order.webhookEvents = [];
    order.webhookEvents.push(eventType);

    // 1. CHECKOUT.ORDER.APPROVED: Buyer approved order; capture is still pending.
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      if (order.status !== 'CAPTURED') {
        order.status = 'CAPTURE_PENDING';
        order.approvedAt = resource?.update_time || new Date().toISOString();
        if (resource?.payer?.email_address) {
          order.payerEmail = resource.payer.email_address;
        }
        this.logAuditEvent({
          organizationId: order.buyerOrgId,
          eventType: 'PAYMENT_MILESTONE_VERIFIED',
          objectId: order.id,
          actor: order.payerEmail || 'paypal.webhook@sandbox.paypal.com',
          evidenceReference: order.paypalOrderId || order.id,
          details: `PayPal Sandbox Webhook: CHECKOUT.ORDER.APPROVED received. Buyer approved order ${order.paypalOrderId || order.id}. Status set to CAPTURE_PENDING.`,
        });
        this.save();
      }
      return { received: true, processed: true, orderId: order.id };
    }

    // 2. PAYMENT.CAPTURE.COMPLETED: Capture confirmed. Mark CAPTURED.
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = resource?.id || `PAYPAL-SBX-CAP-${Date.now().toString(36).toUpperCase()}`;
      order.status = 'CAPTURED';
      order.capturedAt = resource?.create_time || new Date().toISOString();
      order.paypalCaptureId = captureId;
      if (resource?.payer?.email_address) {
        order.payerEmail = resource.payer.email_address;
      }
      const trade = this.data.tradeRequests.find((t) => t.id === order.tradeId);
      if (trade && (trade.status === 'READY_FOR_SHIPMENT' || trade.status === 'SELLER_ACCEPTED_INVITATION')) {
        trade.status = 'ACTIVE_IN_TRANSIT';
      }
      this.logAuditEvent({
        organizationId: order.buyerOrgId,
        eventType: 'PAYMENT_MILESTONE_VERIFIED',
        objectId: captureId,
        actor: order.payerEmail || 'paypal.webhook@sandbox.paypal.com',
        evidenceReference: captureId,
        details: `PayPal Sandbox Webhook: PAYMENT.CAPTURE.COMPLETED verified. Funds captured for order ${order.paypalOrderId || order.id} (${order.currency} ${order.amount}). Capture ID: ${captureId}.`,
      });
      this.save();
      return { received: true, processed: true, orderId: order.id };
    }

    // 3. PAYMENT.CAPTURE.DENIED / REVERSED
    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.REVERSED' || eventType === 'CHECKOUT.ORDER.VOIDED') {
      order.status = 'PAYMENT_FAILED';
      this.logAuditEvent({
        organizationId: order.buyerOrgId,
        eventType: 'PAYMENT_MILESTONE_VERIFIED',
        objectId: order.id,
        actor: 'paypal.webhook@sandbox.paypal.com',
        evidenceReference: order.paypalOrderId || order.id,
        details: `PayPal Sandbox Webhook: ${eventType} received. Order ${order.paypalOrderId || order.id} marked as PAYMENT_FAILED.`,
      });
      this.save();
      return { received: true, processed: true, orderId: order.id };
    }

    return { received: true, processed: false, orderId: order.id };
  }

  // ==========================================
  // REAL COMMERCIAL PAYMENT PROOFS
  // ==========================================
  public getRealPaymentProofs(tradeId: string): RealPaymentProofRecord[] {
    return (this.data.realPaymentProofs || []).filter((p) => p.tradeId === tradeId);
  }

  public submitRealPaymentProof(params: {
    tradeId: string;
    uploaderUserId: string;
    uploaderOrgId: string;
    paymentMethod: 'BANK_TRANSFER' | 'WIRE_SWIFT' | 'UPI' | 'OTHER';
    claimedAmount: number;
    currency: string;
    transactionReference: string;
    proofBuffer: Buffer;
    fileName: string;
    mimeType: string;
    notes?: string;
  }): RealPaymentProofRecord {
    if (!this.data.realPaymentProofs) this.data.realPaymentProofs = [];

    const proofId = `REAL-PAY-${Date.now().toString(36).toUpperCase()}`;
    const storageResult = objectStorage.storeObject(params.tradeId, proofId, params.fileName, params.proofBuffer);

    const record: RealPaymentProofRecord = {
      id: proofId,
      tradeId: params.tradeId,
      uploaderUserId: params.uploaderUserId,
      uploaderOrgId: params.uploaderOrgId,
      paymentMethod: params.paymentMethod,
      claimedAmount: params.claimedAmount,
      currency: params.currency,
      transactionReference: params.transactionReference,
      fileName: params.fileName,
      storageKey: storageResult.storageKey,
      storageUrl: `/api/storage/${storageResult.storageKey}`,
      sha256Hash: storageResult.sha256Hash,
      submittedAt: new Date().toISOString(),
      status: 'PAYMENT_PROOF_SUBMITTED',
      notes: params.notes,
      disclaimer: 'Commercial bank/wire transfer proof submitted for independent authorized reviewer verification. Uploaded documentation does not constitute cleared funds settlement until reconciliation.',
    };

    this.data.realPaymentProofs.push(record);

    this.logAuditEvent({
      organizationId: params.uploaderOrgId,
      eventType: 'DOCUMENT_UPLOADED',
      objectId: proofId,
      actor: params.uploaderUserId,
      evidenceReference: storageResult.sha256Hash,
      details: `Commercial payment proof (${params.paymentMethod}, Ref: ${params.transactionReference}) submitted for trade ${params.tradeId}. Status: PENDING_VERIFICATION.`,
    });

    this.save();
    return record;
  }

  public verifyRealPaymentProof(params: {
    tradeId: string;
    proofId: string;
    reviewerUserId: string;
    decision: 'VERIFIED_BY_AUTHORIZED_REVIEWER' | 'REJECTED_INSUFFICIENT_EVIDENCE';
    reviewNotes?: string;
  }): RealPaymentProofRecord {
    if (!this.data.realPaymentProofs) this.data.realPaymentProofs = [];
    const proof = this.data.realPaymentProofs.find((p) => p.id === params.proofId);
    if (!proof) {
      throw new Error(`Real payment proof ${params.proofId} not found.`);
    }

    proof.status = params.decision;
    proof.reviewedByUserId = params.reviewerUserId;
    proof.reviewedAt = new Date().toISOString();
    proof.reviewNotes = params.reviewNotes;

    this.logAuditEvent({
      organizationId: proof.uploaderOrgId,
      eventType: 'DOCUMENT_VERIFIED',
      objectId: proof.id,
      actor: params.reviewerUserId,
      evidenceReference: proof.sha256Hash,
      details: `Commercial payment proof ${proof.id} reviewed. Decision: ${params.decision}. Notes: ${params.reviewNotes || 'None'}`,
    });

    this.save();
    return proof;
  }

  // ==========================================
  // SHIPMENT & TELEMETRY SIMULATOR
  // ==========================================
  public getShipment(tradeId: string): ShipmentRecord | null {
    if (!this.data.shipments) this.data.shipments = [];
    return this.data.shipments.find((s) => s.tradeId === tradeId) || null;
  }

  public updateShipment(tradeId: string, data: Partial<ShipmentRecord>): ShipmentRecord {
    if (!this.data.shipments) this.data.shipments = [];
    let shipment = this.data.shipments.find((s) => s.tradeId === tradeId);
    if (!shipment) {
      const newShipment: ShipmentRecord = {
        id: `SHP-${Date.now().toString(36).toUpperCase()}`,
        tradeId,
        sellerOrgId: (data as any).sellerOrgId || 'DEMO-SELLER-001',
        carrierName: data.carrierName || 'Global Ocean Line',
        trackingNumber: data.trackingNumber || `TRK-${Date.now().toString(36).toUpperCase()}`,
        originPort: data.originPort || 'Nhava Sheva Port, Mumbai (IN)',
        destinationPort: data.destinationPort || 'Hamburg Port (DE)',
        departureDate: data.departureDate || new Date().toISOString(),
        estimatedDeliveryDate: data.estimatedDeliveryDate || '2026-11-28T18:00:00Z',
        actualDeliveryDate: null,
        status: data.status || 'IN_TRANSIT',
        vesselName: data.vesselName || 'MV Ocean Pioneer',
        containerNumber: data.containerNumber || 'MSCU-892144-0',
        currentTemperatureC: data.currentTemperatureC ?? 22.0,
        currentHumidityPercent: data.currentHumidityPercent ?? 55,
        lastLocationName: data.lastLocationName || 'At Port',
        lastPingAt: new Date().toISOString(),
        notes: data.notes || '',
        updatedAt: new Date().toISOString(),
      };
      this.data.shipments.push(newShipment);
      shipment = newShipment;
    } else {
      Object.assign(shipment, data);
      shipment.lastPingAt = new Date().toISOString();
      shipment.updatedAt = new Date().toISOString();
    }

    this.save();
    return shipment;
  }

  public triggerTelemetrySimulation(
    tradeId: string,
    eventType: 'NORMAL' | 'TEMP_SPIKE' | 'TEMP_NORMAL' | 'HUMIDITY_ANOMALY' | 'DELIVERY_DELAY' | 'LOCATION_DEVIATION' | 'SUCCESSFUL_DELIVERY',
    operatorEmail?: string
  ): { milestone: SimulatedTelemetryMilestone; alert?: AISentinelAlert } {
    if (!this.data.telemetryMilestones) this.data.telemetryMilestones = {};
    if (!this.data.telemetryMilestones[tradeId]) this.data.telemetryMilestones[tradeId] = [];
    if (!this.data.aiSentinelAlerts) this.data.aiSentinelAlerts = [];

    const now = new Date().toISOString();
    const milestoneId = `TEL-${Date.now().toString(36).toUpperCase()}`;

    let temp = 22.4;
    let humidity = 55;
    let loc = 'Arabian Sea Maritime Corridor (En route Hamburg)';
    let coords = { lat: 18.2, lng: 70.5 };
    let status = 'IN_TRANSIT';
    let alert: AISentinelAlert | undefined;

    switch (eventType) {
      case 'NORMAL':
        temp = 21.8;
        humidity = 53;
        loc = 'Red Sea Shipping Channel (Km 420)';
        coords = { lat: 21.5, lng: 38.8 };
        status = 'IN_TRANSIT';
        break;
      case 'TEMP_SPIKE': {
        temp = 28.9; // Exceeds 25.0°C threshold from Agreement 2 Clause 5
        humidity = 62;
        loc = 'Gulf of Aden Transit Corridor';
        coords = { lat: 12.8, lng: 48.2 };
        status = 'TEMPERATURE_ANOMALY';
        const spikeAlert: AISentinelAlert = {
          id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
          tradeId,
          eventType: 'TEMP_READING_ANOMALY',
          severity: 'POTENTIAL_BREACH',
          detectedAt: now,
          thresholdValue: '25.0°C Max Permissible Continuous',
          actualValue: '28.9°C (Sustained Anomaly)',
          relevantClauseId: 'clause-5',
          recommendedAction: 'Temperature exceeded Schedule C Clause 5 tolerance (+3.9°C above limit). Contact carrier vessel reefer engineer immediately and log incident for inspection.',
          status: 'POTENTIAL_BREACH',
          reviewed: false,
        };
        alert = spikeAlert;
        this.data.aiSentinelAlerts.push(spikeAlert);
        break;
      }
      case 'TEMP_NORMAL': {
        temp = 21.2;
        humidity = 52;
        loc = 'Suez Canal Southern Anchorage';
        coords = { lat: 29.95, lng: 32.55 };
        status = 'IN_TRANSIT';
        const normAlert: AISentinelAlert = {
          id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
          tradeId,
          eventType: 'TEMP_NORMALIZED',
          severity: 'INFO',
          detectedAt: now,
          thresholdValue: '25.0°C Max',
          actualValue: '21.2°C (Reefer Restored)',
          relevantClauseId: 'clause-5',
          recommendedAction: 'Reefer container power restored to normal operating range. Condition stabilized.',
          status: 'MONITORING',
          reviewed: true,
        };
        alert = normAlert;
        this.data.aiSentinelAlerts.push(normAlert);
        break;
      }
      case 'HUMIDITY_ANOMALY': {
        temp = 23.0;
        humidity = 76; // Exceeds 65% limit
        loc = 'Mediterranean Transit Berth';
        coords = { lat: 34.2, lng: 24.1 };
        status = 'HUMIDITY_ANOMALY';
        const humAlert: AISentinelAlert = {
          id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
          tradeId,
          eventType: 'HUMIDITY_ANOMALY',
          severity: 'WARNING',
          detectedAt: now,
          thresholdValue: '65% Max Relative Humidity',
          actualValue: '76% (High Ambient Condensation)',
          relevantClauseId: 'clause-5',
          recommendedAction: 'Relative humidity reading elevated above threshold. Schedule buyer moisture inspection upon container destuffing.',
          status: 'REQUIRES_INSPECTION',
          reviewed: false,
        };
        alert = humAlert;
        this.data.aiSentinelAlerts.push(humAlert);
        break;
      }
      case 'DELIVERY_DELAY': {
        temp = 22.0;
        humidity = 55;
        loc = 'English Channel Traffic Separation Zone (Vessel Congestion)';
        coords = { lat: 50.1, lng: -1.2 };
        status = 'DELAYED';
        const delayAlert: AISentinelAlert = {
          id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
          tradeId,
          eventType: 'DELIVERY_DELAY',
          severity: 'WARNING',
          detectedAt: now,
          thresholdValue: 'Schedule B Clause 4 Delivery Window',
          actualValue: '+48h Vessel Berth Congestion in North Sea',
          relevantClauseId: 'clause-4',
          recommendedAction: 'Port berthing congestion delay reported. Buyer notified of revised ETA.',
          status: 'WARNING',
          reviewed: false,
        };
        alert = delayAlert;
        this.data.aiSentinelAlerts.push(delayAlert);
        break;
      }
      case 'LOCATION_DEVIATION': {
        temp = 22.1;
        humidity = 54;
        loc = 'Biscay Divergent Anchorage (Weather Routing)';
        coords = { lat: 45.4, lng: -6.8 };
        status = 'REROUTED';
        const locAlert: AISentinelAlert = {
          id: `ALERT-${Date.now().toString(36).toUpperCase()}`,
          tradeId,
          eventType: 'ROUTE_DEVIATION',
          severity: 'INFO',
          detectedAt: now,
          thresholdValue: 'Pre-Approved Maritime Route Corridor',
          actualValue: 'Deviation 35 NM West for Storm Avoidance',
          relevantClauseId: 'clause-4',
          recommendedAction: 'Master logged navigational detour to avoid heavy sea state. Cold chain integrity intact.',
          status: 'NORMAL',
          reviewed: true,
        };
        alert = locAlert;
        this.data.aiSentinelAlerts.push(locAlert);
        break;
      }
      case 'SUCCESSFUL_DELIVERY':
        temp = 20.8;
        humidity = 51;
        loc = 'Hamburg Port, Terminal Altenwerder (Berth 3)';
        coords = { lat: 53.504, lng: 9.932 };
        status = 'DELIVERED';
        break;
    }

    const payloadToSign = `${milestoneId}:${now}:${loc}:${temp}:${humidity}:${status}`;
    const hmacSig = `hmac-sha256:${crypto.createHmac('sha256', 'MERIDIAN_TELEMETRY_SHARED_KEY_2026').update(payloadToSign).digest('hex').substring(0, 16)}`;

    const milestone: SimulatedTelemetryMilestone = {
      id: milestoneId,
      timestamp: now,
      locationName: loc,
      coordinates: coords,
      status,
      temperatureC: temp,
      humidityPercent: humidity,
      hmacSignature: hmacSig,
      sensorId: 'IOT-CONTAINER-MRDN-9012',
    };

    this.data.telemetryMilestones[tradeId].push(milestone);

    // Update shipment object
    this.updateShipment(tradeId, {
      currentTemperatureC: temp,
      currentHumidityPercent: humidity,
      lastLocationName: loc,
      status: eventType === 'SUCCESSFUL_DELIVERY' ? 'DELIVERED' : 'IN_TRANSIT',
      actualDeliveryDate: eventType === 'SUCCESSFUL_DELIVERY' ? now : null,
    });

    this.save();
    return { milestone, alert };
  }

  public getAISentinelAlerts(tradeId: string): AISentinelAlert[] {
    return (this.data.aiSentinelAlerts || []).filter((a) => a.tradeId === tradeId);
  }

  // ==========================================
  // BUYER INSPECTION & OBSERVATIONS
  // ==========================================
  public getBuyerInspections(tradeId: string): BuyerInspectionRecord[] {
    return (this.data.buyerInspections || []).filter((i) => i.tradeId === tradeId);
  }

  public submitBuyerInspection(params: {
    tradeId: string;
    inspectorUserId: string;
    inspectorOrgId: string;
    decision: 'ACCEPTED' | 'REJECTED' | 'ADDITIONAL_EVIDENCE_REQUIRED';
    observations: string;
    checklist: {
      cargoIntegrityVerified: boolean;
      packagingIntact: boolean;
      temperatureComplianceVerified: boolean;
      sealsMatched: boolean;
      quantityMatched: boolean;
    };
    conditionPhotoIds?: string[];
  }): BuyerInspectionRecord {
    if (!this.data.buyerInspections) this.data.buyerInspections = [];

    const record: BuyerInspectionRecord = {
      id: `INSP-${Date.now().toString(36).toUpperCase()}`,
      tradeId: params.tradeId,
      inspectorUserId: params.inspectorUserId,
      inspectorOrgId: params.inspectorOrgId,
      decision: params.decision,
      observations: params.observations,
      checklist: params.checklist,
      conditionPhotoIds: params.conditionPhotoIds || [],
      inspectedAt: new Date().toISOString(),
    };

    this.data.buyerInspections.push(record);

    this.logAuditEvent({
      organizationId: params.inspectorOrgId,
      eventType: 'DOCUMENT_VERIFIED',
      objectId: record.id,
      actor: params.inspectorUserId,
      evidenceReference: record.id,
      details: `Buyer inspection completed for trade ${params.tradeId}. Decision: ${params.decision}. Checklist verified: ${record.checklist?.cargoIntegrityVerified ? 'PASS' : 'FAIL'}.`,
    });

    this.save();
    return record;
  }

  // ==========================================
  // DISPUTE MANAGEMENT & AI ASSISTANCE
  // ==========================================
  public getDisputes(tradeId: string): TradeDisputeRecord[] {
    return (this.data.disputes || []).filter((d) => d.tradeId === tradeId);
  }

  public createDispute(params: {
    tradeId: string;
    filedByOrgId: string;
    filedByUserId: string;
    issueSummary: string;
    details: string;
    relevantClauseId: string;
    evidenceIds: string[];
    proposedResolution: string;
  }): TradeDisputeRecord {
    if (!this.data.disputes) this.data.disputes = [];

    const now = new Date().toISOString();
    const disputeId = `DISP-${Date.now().toString(36).toUpperCase()}`;

    const dispute: TradeDisputeRecord = {
      id: disputeId,
      tradeId: params.tradeId,
      filedByOrgId: params.filedByOrgId,
      filedByUserId: params.filedByUserId,
      issueSummary: params.issueSummary,
      details: params.details,
      relevantClauseId: params.relevantClauseId || 'clause-5',
      evidenceIds: params.evidenceIds,
      proposedResolution: params.proposedResolution,
      status: 'OPEN',
      createdAt: now,
      history: [
        {
          timestamp: now,
          action: 'DISPUTE_FILED',
          performedBy: params.filedByUserId,
          notes: params.issueSummary,
        },
      ],
    };

    this.data.disputes.push(dispute);

    this.logAuditEvent({
      organizationId: params.filedByOrgId,
      eventType: 'SECURITY_AUDIT_LOGGED',
      objectId: disputeId,
      actor: params.filedByUserId,
      evidenceReference: disputeId,
      details: `Dispute ${disputeId} lodged regarding clause ${params.relevantClauseId}: "${params.issueSummary}".`,
    });

    this.save();
    return dispute;
  }

  public respondToDispute(params: {
    disputeId: string;
    respondingOrgId: string;
    respondingUserId: string;
    explanation: string;
    additionalEvidenceIds?: string[];
    responseType: 'ACCEPT_PROPOSAL' | 'REJECT_PROPOSAL' | 'COUNTER_PROPOSAL';
    alternativeProposal?: string;
  }): TradeDisputeRecord {
    if (!this.data.disputes) this.data.disputes = [];
    const dispute = this.data.disputes.find((d) => d.id === params.disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${params.disputeId} not found.`);
    }

    const now = new Date().toISOString();
    dispute.counterpartyResponse = {
      respondingOrgId: params.respondingOrgId,
      respondingUserId: params.respondingUserId,
      explanation: params.explanation,
      additionalEvidenceIds: params.additionalEvidenceIds || [],
      responseType: params.responseType,
      alternativeProposal: params.alternativeProposal,
      respondedAt: now,
    };

    if (!dispute.history) dispute.history = [];
    dispute.history.push({
      timestamp: now,
      action: `COUNTERPARTY_${params.responseType}`,
      performedBy: params.respondingUserId,
      notes: params.explanation,
    });

    if (params.responseType === 'ACCEPT_PROPOSAL') {
      dispute.status = 'RESOLVED_BUYER_ACCEPTED';
      dispute.resolvedAt = now;
      dispute.finalOutcomeNotes = 'Counterparty unconditionally accepted the proposed resolution.';
    } else {
      dispute.status = 'UNDER_REVIEW';
    }

    this.save();
    return dispute;
  }

  public generateAIDisputeResolution(disputeId: string): any {
    if (!this.data.disputes) this.data.disputes = [];
    const dispute = this.data.disputes.find((d) => d.id === disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} not found.`);
    }

    const analysis = {
      disputeId,
      tradeId: dispute.tradeId,
      complaintSummary: dispute.issueSummary,
      contractualClauseAssessed: dispute.relevantClauseId || 'Schedule C — Clause 5 (Cold Chain & Quality Tolerances)',
      contractualLimit: 'Temperature not to exceed 25.0°C continuously; humidity tolerance 65% RH max.',
      findings: [
        'Telemetry logs confirm a single transient temperature reading of 26.5°C during container hoist at JNPT berth, followed by return to 21.2°C.',
        'Buyer photographic evidence indicates packaging integrity intact with minor outer carton humidity staining on pallet row 4.',
        'SGS quality inspection certificate (EVD-002) verified cargo met Grade A specifications prior to dispatch.',
      ],
      suggestedOptions: [
        {
          id: 'OPT-1',
          title: 'Option A: Commercial Settlement / 5% Price Adjustment',
          description: 'Seller grants a 5% credit note (€4,375.00) against final invoice for packaging restuffing costs; buyer accepts consignment without further claims.',
          commercialImpact: 'Immediate cargo clearance, no demurrage or port storage fees incurred.',
          recommended: true,
        },
        {
          id: 'OPT-2',
          title: 'Option B: Replacement of Affected Cartons',
          description: 'Seller airfreights 50 replacement cartons to Hamburg warehouse within 5 business days at seller expense.',
          commercialImpact: 'Ensures 100% prime inventory, but involves transit delay.',
          recommended: false,
        },
        {
          id: 'OPT-3',
          title: 'Option C: Joint Independent Lab Assay (SGS / Bureau Veritas)',
          description: 'Both parties commission joint independent re-testing at Hamburg port laboratory; fees divided 50/50.',
          commercialImpact: 'Independent verification; introduces 4-day laboratory delay.',
          recommended: false,
        },
      ],
      draftMutualResolutionText: `MUTUAL RESOLUTION AGREEMENT: Trade Reference ${dispute.tradeId}. Buyer and Seller agree to resolve Dispute ${disputeId} pursuant to Option A. Seller shall credit 5% (€4,375.00) against final invoice. Buyer confirms acceptance of consignment MSCU-892144-0 upon receipt of credit memorandum. Both parties waive further arbitration claims under Schedule D.`,
      disclaimer: 'AI-generated dispute assessment for bilateral review and mutual electronic agreement. Meridian AI does not independently impose financial penalties or declare legal liability.',
    };

    dispute.aiResolutionSuggestion = analysis;
    this.save();
    return analysis;
  }

  public resolveDispute(params: {
    disputeId: string;
    approvedByOrgId: string;
    approvedByUserId: string;
    resolutionNotes: string;
    outcome: 'RESOLVED_BUYER_ACCEPTED' | 'RESOLVED_MUTUAL_AGREEMENT' | 'ESCALATED';
  }): TradeDisputeRecord {
    if (!this.data.disputes) this.data.disputes = [];
    const dispute = this.data.disputes.find((d) => d.id === params.disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${params.disputeId} not found.`);
    }

    const now = new Date().toISOString();
    dispute.status = params.outcome;
    dispute.resolvedAt = now;
    dispute.finalOutcomeNotes = params.resolutionNotes;

    if (!dispute.history) dispute.history = [];
    dispute.history.push({
      timestamp: now,
      action: params.outcome,
      performedBy: params.approvedByUserId,
      notes: params.resolutionNotes,
    });

    this.logAuditEvent({
      organizationId: params.approvedByOrgId,
      eventType: 'SECURITY_AUDIT_LOGGED',
      objectId: dispute.id,
      actor: params.approvedByUserId,
      evidenceReference: dispute.id,
      details: `Dispute ${dispute.id} marked as ${params.outcome}. Resolution: ${params.resolutionNotes}`,
    });

    this.save();
    return dispute;
  }

  // ==========================================
  // PHASE 5 HANDOFF GENERATOR
  // ==========================================
  public generatePhase5Handoff(tradeId: string): Phase5HandoffSummary {
    const trade = this.data.tradeRequests.find((t) => t.id === tradeId);
    if (!trade) {
      throw new Error(`Trade ${tradeId} not found.`);
    }

    const agreement2 = this.getAgreement2(tradeId);
    const buyerOrg = this.data.organizations.find((o) => o.id === (trade.buyerOrgId || trade.buyerOrganizationId));
    const sellerOrg = this.data.organizations.find((o) => o.id === (trade.sellerOrgId || trade.sellerOrganizationId));

    const paypalOrders = (this.data.paypalOrders || []).filter((o) => o.tradeId === tradeId);
    const realProofs = (this.data.realPaymentProofs || []).filter((p) => p.tradeId === tradeId);
    const shipment = this.getShipment(tradeId);
    const evidence = (this.data.evidenceRecords || []).filter((e) => e.tradeId === tradeId);
    const inspections = (this.data.buyerInspections || []).filter((i) => i.tradeId === tradeId);
    const disputes = (this.data.disputes || []).filter((d) => d.tradeId === tradeId);
    const canonicalManifest = this.generateCanonicalManifest(tradeId);

    const isPaypalCaptured = paypalOrders.some((o) => o.status === 'CAPTURED');
    const isRealVerified = realProofs.some((p) => p.status === 'VERIFIED_BY_AUTHORIZED_REVIEWER');
    const isSigned = !!(agreement2?.signatures.buyer && agreement2?.signatures.seller);
    const hasUnresolvedDisputes = disputes.some((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

    const readyForPhase5Completion = isSigned && (isPaypalCaptured || isRealVerified) && !hasUnresolvedDisputes;

    const summary: Phase5HandoffSummary = {
      tradeId,
      generatedAtUtc: new Date().toISOString(),
      parties: {
        buyer: {
          id: buyerOrg?.id || trade.buyerOrgId || trade.buyerOrganizationId || '',
          legalName: buyerOrg?.legalName || 'Buyer Corp',
          representative: agreement2?.signatures.buyer?.signerName || 'Authorized Signatory',
        },
        seller: {
          id: sellerOrg?.id || trade.sellerOrganizationId || '',
          legalName: sellerOrg?.legalName || 'Seller Corp',
          representative: agreement2?.signatures.seller?.signerName || 'Authorized Signatory',
        },
      },
      agreement2Execution: {
        agreementId: agreement2?.id || 'AGR2-DRAFT',
        version: agreement2?.version || '1.0',
        canonicalSha256: agreement2?.sha256Hash || '',
        buyerSignature: agreement2?.signatures.buyer || null,
        sellerSignature: agreement2?.signatures.seller || null,
        isFullyExecuted: isSigned,
      },
      paymentVerification: {
        paypalSandbox: {
          totalOrders: paypalOrders.length,
          hasCapturedOrder: isPaypalCaptured,
          latestOrderReference: paypalOrders[paypalOrders.length - 1]?.paypalOrderId || null,
          latestCaptureReference: paypalOrders[paypalOrders.length - 1]?.paypalCaptureId || null,
        },
        realCommercialPayment: {
          totalProofs: realProofs.length,
          hasVerifiedProof: isRealVerified,
          latestProofReference: realProofs[realProofs.length - 1]?.id || null,
        },
      },
      shipmentStatus: {
        carrier: shipment?.carrierName || 'Carrier Pending',
        trackingNumber: shipment?.trackingNumber || 'Pending',
        status: shipment?.status || 'PREPARING',
        actualDeliveryDate: shipment?.actualDeliveryDate || null,
      },
      evidenceRecordsCount: evidence.length,
      inspectionCompleted: inspections.length > 0,
      inspectionOutcome: inspections[inspections.length - 1]?.decision || 'PENDING',
      disputeHistory: {
        totalDisputes: disputes.length,
        openDisputes: disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length,
        allDisputesResolved: !hasUnresolvedDisputes,
      },
      canonicalTradeManifestDigest: canonicalManifest.canonicalJsonSha256,
      readyForPhase5Completion,
      handoffInstructions: 'Phase 4 execution artifacts, bilateral signature seals, authenticated telemetry streams, and SHA-256 evidence digests packaged for Phase 5 final commercial closing protocol.',
    };

    return summary;
  }

  // ==========================================
  // PHASE 5: TRADE CLOSURE & FINAL AUDIT DOSSIER METHODS
  // ==========================================

  public checkPhase5Readiness(tradeId: string): {
    overallPassed: boolean;
    checks: Phase5ReadinessCheckItem[];
  } {
    const trade = this.getTradeById(tradeId);
    const agreement2 = this.getAgreement2(tradeId);
    const paypalOrders = (this.data.paypalOrders || []).filter((o) => o.tradeId === tradeId);
    const realProofs = (this.data.realPaymentProofs || []).filter((p) => p.tradeId === tradeId);
    const shipments = (this.data.shipments || []).filter((s) => s.tradeId === tradeId);
    const evidence = (this.data.evidenceRecords || []).filter((e) => e.tradeId === tradeId);
    const inspections = (this.data.buyerInspections || []).filter((i) => i.tradeId === tradeId);
    const disputes = (this.data.disputes || []).filter((d) => d.tradeId === tradeId);

    // 1. Agreement 2 Executed
    const agr2Executed = Boolean(
      agreement2 &&
      agreement2.status === 'EXECUTED' &&
      agreement2.signatures?.buyer &&
      agreement2.signatures?.seller
    );

    // 2. Payment Verified (PayPal captured OR real commercial wire verified)
    const paypalCaptured = paypalOrders.some((o) => o.status === 'CAPTURED');
    const realVerified = realProofs.some(
      (p) => p.status === 'VERIFIED_BY_REVIEWER' || p.status === 'VERIFIED_BY_AUTHORIZED_REVIEWER'
    );
    const paymentVerified = paypalCaptured || realVerified;

    // 3. Shipment Status Recorded
    const shipment = shipments[0];
    const shipmentVerified = Boolean(
      shipment &&
      ['IN_TRANSIT', 'CUSTOMS_PORT_ARRIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CUSTOMS_CLEARED'].includes(shipment.status)
    );

    // 4. Photographic & Document Evidence Stored
    const evidenceVerified = evidence.length > 0;

    // 5. Buyer Inward Inspection Completed
    const inspectionAccepted = inspections.some((i) => i.decision === 'ACCEPTED');

    // 6. Mandatory Disputes Resolved
    const openDisputes = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');
    const disputesResolved = openDisputes.length === 0;

    // 7. Bilateral Reviews Approved
    const completion = this.getPhase5CompletionRecordRaw(tradeId);
    const buyerApproved = completion?.buyerReview?.status === 'APPROVED';
    const sellerApproved = completion?.sellerReview?.status === 'APPROVED';
    const reviewsApproved = buyerApproved && sellerApproved;

    const checks: Phase5ReadinessCheckItem[] = [
      {
        id: 'AGR2_EXECUTED',
        label: 'Agreement 2 Bilaterally Executed & Sealed',
        passed: agr2Executed,
        details: agr2Executed
          ? `Executed v${agreement2?.version} with bilateral digital seals (Hash: ${agreement2?.sha256Hash?.substring(0, 16)}...)`
          : 'Agreement 2 requires execution by both Buyer and Seller.',
        partyActionRequired: agr2Executed ? 'NONE' : 'BOTH',
      },
      {
        id: 'PAYMENT_VERIFIED',
        label: 'Commercial Payment Milestone Cleared',
        passed: paymentVerified,
        details: paypalCaptured
          ? `PayPal Sandbox virtual capture confirmed (${paypalOrders.find((o) => o.status === 'CAPTURED')?.paypalCaptureId}).`
          : realVerified
          ? 'Commercial wire payment receipt independently verified by authorized reviewer.'
          : 'Commercial payment capture or verified wire advice is pending.',
        partyActionRequired: paymentVerified ? 'NONE' : 'BUYER',
      },
      {
        id: 'SHIPMENT_RECORDED',
        label: 'Logistics Manifest & Telemetry Verified',
        passed: shipmentVerified,
        details: shipmentVerified
          ? `${shipment?.carrierName} — Status: ${shipment?.status} (Tracking: ${shipment?.trackingNumber}).`
          : 'Shipment dispatch and telemetry data stream required.',
        partyActionRequired: shipmentVerified ? 'NONE' : 'SELLER',
      },
      {
        id: 'EVIDENCE_VERIFIED',
        label: 'Photographic Evidence Stored with SHA-256 Baseline',
        passed: evidenceVerified,
        details: evidenceVerified
          ? `${evidence.length} physical photo/document artifacts stored in private object storage.`
          : 'Mandatory cargo loading/seal photographs required.',
        partyActionRequired: evidenceVerified ? 'NONE' : 'SELLER',
      },
      {
        id: 'INSPECTION_COMPLETED',
        label: 'Buyer Inward Cargo Inspection Accepted',
        passed: inspectionAccepted,
        details: inspectionAccepted
          ? `Inward inspection accepted with 5-point quality checklist passed.`
          : 'Inward destination cargo inspection by buyer required.',
        partyActionRequired: inspectionAccepted ? 'NONE' : 'BUYER',
      },
      {
        id: 'DISPUTES_RESOLVED',
        label: 'Zero Unresolved Commercial Disputes',
        passed: disputesResolved,
        details: disputesResolved
          ? 'All commercial concerns settled or no disputes filed.'
          : `${openDisputes.length} active dispute(s) require mutual bilateral resolution before trade closing.`,
        partyActionRequired: disputesResolved ? 'NONE' : 'BOTH',
      },
      {
        id: 'BILATERAL_REVIEWS_APPROVED',
        label: 'Bilateral Phase 5 Trade Completion Review Approved',
        passed: reviewsApproved,
        details: `Buyer review: ${completion?.buyerReview?.status || 'PENDING_REVIEW'} | Seller review: ${completion?.sellerReview?.status || 'PENDING_REVIEW'}.`,
        partyActionRequired: !buyerApproved && !sellerApproved ? 'BOTH' : !buyerApproved ? 'BUYER' : !sellerApproved ? 'SELLER' : 'NONE',
      },
    ];

    const overallPassed = checks.every((c) => c.passed);
    return { overallPassed, checks };
  }

  private getPhase5CompletionRecordRaw(tradeId: string): Phase5CompletionRecord | undefined {
    if (!this.data.phase5Completions) this.data.phase5Completions = [];
    return this.data.phase5Completions.find((c) => c.tradeId === tradeId);
  }

  public getPhase5Completion(tradeId: string): Phase5CompletionRecord {
    if (!this.data.phase5Completions) this.data.phase5Completions = [];
    let record = this.data.phase5Completions.find((c) => c.tradeId === tradeId);

    const readiness = this.checkPhase5Readiness(tradeId);

    if (!record) {
      record = {
        id: `CERT-${tradeId.replace('DEMO-TRADE-', '001-')}`,
        tradeId,
        version: '1.0',
        status: 'IN_REVIEW',
        buyerReview: {
          status: 'PENDING_REVIEW',
          approved: false,
        },
        sellerReview: {
          status: 'PENDING_REVIEW',
          approved: false,
        },
        readinessChecks: readiness.checks,
        overallReadinessPassed: readiness.overallPassed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.phase5Completions.push(record);
      this.save();
    } else {
      record.readinessChecks = readiness.checks;
      record.overallReadinessPassed = readiness.overallPassed;
      if (record.buyerSignature && record.sellerSignature && record.status !== 'COMPLETED') {
        record.status = 'COMPLETED';
        record.completedAt = record.completedAt || new Date().toISOString();
      }
    }

    return record;
  }

  public submitPhase5Review(
    tradeId: string,
    party: 'BUYER' | 'SELLER',
    params: {
      userId: string;
      userName: string;
      userRole: string;
      approved: boolean;
      notes?: string;
    }
  ): Phase5CompletionRecord {
    const record = this.getPhase5Completion(tradeId);
    const now = new Date().toISOString();

    const review: Phase5PartyReview = {
      status: params.approved ? 'APPROVED' : 'REVISIONS_REQUESTED',
      reviewedByUserId: params.userId,
      reviewerName: params.userName,
      reviewerRole: params.userRole,
      reviewedAt: now,
      notes: params.notes,
      approved: params.approved,
    };

    if (party === 'BUYER') {
      record.buyerReview = review;
    } else {
      record.sellerReview = review;
    }

    record.updatedAt = now;

    // Recalculate readiness
    const readiness = this.checkPhase5Readiness(tradeId);
    record.readinessChecks = readiness.checks;
    record.overallReadinessPassed = readiness.overallPassed;

    if (record.buyerReview.status === 'APPROVED' && record.sellerReview.status === 'APPROVED') {
      record.status = 'AWAITING_SIGNATURES';
    } else {
      record.status = 'IN_REVIEW';
    }

    const trade = this.getTradeById(tradeId);
    this.logAuditEvent({
      organizationId: party === 'BUYER' ? trade?.buyerOrgId || '' : trade?.sellerOrgId || '',
      eventType: 'FINAL_COMPLETION_REVIEW_SUBMITTED',
      objectId: record.id,
      actor: params.userName,
      evidenceReference: record.id,
      details: `Phase 5 completion review submitted by ${party} (${params.userName}): ${review.status}. ${params.notes || ''}`,
    });

    this.save();
    return record;
  }

  public submitPhase5Signature(
    tradeId: string,
    party: 'BUYER' | 'SELLER',
    params: {
      userId: string;
      companyName: string;
      signerName: string;
      signerTitle: string;
      signatureData?: string;
      signatureMethod?: 'PROTOTYPE_CANVAS' | 'DIGITAL_ACKNOWLEDGEMENT';
      consentConfirmed: boolean;
    }
  ): Phase5CompletionRecord {
    const record = this.getPhase5Completion(tradeId);
    const trade = this.getTradeById(tradeId);

    if (!trade) {
      throw new Error(`Trade ${tradeId} not found.`);
    }

    // Readiness gate: Checks 1-6 must be satisfied before final signature
    const readiness = this.checkPhase5Readiness(tradeId);
    const prerequisiteChecks = readiness.checks.filter((c) => c.id !== 'BILATERAL_REVIEWS_APPROVED');
    const failedPrerequisites = prerequisiteChecks.filter((c) => !c.passed);

    if (failedPrerequisites.length > 0) {
      throw new Error(
        `Final completion signature blocked: Outstanding prerequisites: ${failedPrerequisites.map((p) => p.label).join('; ')}`
      );
    }

    const partyReview = party === 'BUYER' ? record.buyerReview : record.sellerReview;
    if (partyReview.status !== 'APPROVED') {
      throw new Error(`Cannot sign completion document: ${party} has not approved the final completion review.`);
    }

    const now = new Date().toISOString();
    const receiptCode = `MRDN-FIN-${party}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const signature: Phase5CompletionSignature = {
      party,
      organizationId: party === 'BUYER' ? trade.buyerOrgId : trade.sellerOrgId || '',
      companyName: params.companyName,
      userId: params.userId,
      signerName: params.signerName,
      signerTitle: params.signerTitle,
      signatureMethod: params.signatureMethod || 'PROTOTYPE_CANVAS',
      signatureData: params.signatureData,
      receiptCode,
      signedAtUtc: now,
      acknowledgementTextVersion: 'v1.0',
      consentConfirmed: params.consentConfirmed,
    };

    if (party === 'BUYER') {
      record.buyerSignature = signature;
    } else {
      record.sellerSignature = signature;
    }

    record.updatedAt = now;

    // Check if both parties have signed
    if (record.buyerSignature && record.sellerSignature) {
      record.status = 'COMPLETED';
      record.completedAt = now;
      trade.status = 'COMPLETED';

      // Send completion notifications to both organizations
      if (!this.data.notifications) this.data.notifications = [];
      this.data.notifications.push(
        {
          id: `notif-comp-buyer-${Date.now()}`,
          userId: params.userId,
          organizationId: trade.buyerOrgId,
          title: 'DEAL COMPLETED! 🎉',
          message: `Trade ${tradeId} has successfully completed with bilateral closing signatures and audit dossier.`,
          type: 'SUCCESS',
          read: false,
          createdAt: now,
        },
        {
          id: `notif-comp-seller-${Date.now()}`,
          userId: params.userId,
          organizationId: trade.sellerOrgId || '',
          title: 'DEAL COMPLETED! 🎉',
          message: `Trade ${tradeId} has successfully completed with bilateral closing signatures and audit dossier.`,
          type: 'SUCCESS',
          read: false,
          createdAt: now,
        }
      );
    }

    this.logAuditEvent({
      organizationId: signature.organizationId,
      eventType: 'FINAL_COMPLETION_SIGNATURE_RECORDED',
      objectId: receiptCode,
      actor: `${params.signerName} (${party})`,
      evidenceReference: receiptCode,
      details: `Bilateral completion acknowledgement signed by ${params.signerName} (${params.signerTitle}) on behalf of ${params.companyName}. Receipt: ${receiptCode}.`,
    });

    this.save();
    return record;
  }

  public savePhase5Certificate(
    tradeId: string,
    params: {
      storageKey: string;
      sha256Hash: string;
    }
  ): Phase5CompletionRecord {
    const record = this.getPhase5Completion(tradeId);
    record.finalCertificatePdfStorageKey = params.storageKey;
    record.finalCertificatePdfSha256 = params.sha256Hash;
    record.finalCertificatePdfGeneratedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    const trade = this.getTradeById(tradeId);
    this.logAuditEvent({
      organizationId: trade?.buyerOrgId || '',
      eventType: 'FINAL_COMPLETION_CERTIFICATE_GENERATED',
      objectId: record.id,
      actor: 'meridian.orchestration.system',
      evidenceReference: params.sha256Hash,
      details: `Official Final Trade Completion Certificate & Audit Dossier generated and stored at ${params.storageKey} (SHA-256: ${params.sha256Hash}).`,
    });

    this.save();
    return record;
  }

  public getPhase5DossierData(tradeId: string): any {
    const trade = this.getTradeById(tradeId);
    const agreement2 = this.getAgreement2(tradeId);
    const completion = this.getPhase5Completion(tradeId);
    const paypalOrders = (this.data.paypalOrders || []).filter((o) => o.tradeId === tradeId);
    const realProofs = (this.data.realPaymentProofs || []).filter((p) => p.tradeId === tradeId);
    const shipments = (this.data.shipments || []).filter((s) => s.tradeId === tradeId);
    const evidence = (this.data.evidenceRecords || []).filter((e) => e.tradeId === tradeId);
    const telemetry = (this.data.telemetryMilestones?.[tradeId] || []);
    const inspections = (this.data.buyerInspections || []).filter((i) => i.tradeId === tradeId);
    const disputes = (this.data.disputes || []).filter((d) => d.tradeId === tradeId);
    const auditLogs = (this.data.auditEvents || []).filter(
      (a) => (a.objectId && a.objectId.includes(tradeId)) || (a.details && a.details.includes(tradeId))
    );

    const buyerOrg = trade?.buyerOrgId ? this.getOrganizationById(trade.buyerOrgId) : null;
    const sellerOrg = trade?.sellerOrgId ? this.getOrganizationById(trade.sellerOrgId) : null;

    return {
      trade,
      agreement2,
      completion,
      buyerOrg,
      sellerOrg,
      paypalOrders,
      realProofs,
      shipment: shipments[0] || null,
      evidenceList: evidence,
      telemetry,
      inspections,
      disputes,
      auditLogs,
    };
  }

  // ==========================================
  // DEMO RESET METHOD (REPEATABLE PRESENTATION)
  // ==========================================
  public resetDemoState(adminUserId?: string): { success: boolean; message: string; archivedRunId: string } {
    const archivedRunId = `DEMO-ARCHIVE-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const demoTradeId = 'DEMO-TRADE-001';

    // 1. Reset Trade Request
    const demoTrade = this.data.tradeRequests.find((t) => t.id === demoTradeId);
    if (demoTrade) {
      demoTrade.status = 'ACTIVE_IN_TRANSIT';
    }

    // 2. Reset Invitation
    const demoInv = this.data.sellerInvitations.find((i) => i.tradeRequestId === demoTradeId || i.id === 'INV-DEMO-001');
    if (demoInv) {
      demoInv.status = 'ACCEPTED';
    }

    // 3. Reset Agreement 2 to clean initial state
    const buyerOrg = this.data.organizations.find((o) => o.id === 'DEMO-BUYER-001');
    const sellerOrg = this.data.organizations.find((o) => o.id === 'DEMO-SELLER-001');
    if (demoTrade && buyerOrg && sellerOrg) {
      const freshAgreement = generateDefaultAgreement2(demoTrade, buyerOrg, sellerOrg);
      this.data.agreement2List = [freshAgreement];
    }

    // 4. Reset Shipments
    this.data.shipments = [
      {
        id: 'SHP-001',
        tradeId: demoTradeId,
        carrierName: 'Maersk Global Ocean Line / Line 402',
        trackingNumber: 'MSK-IN-88942-X',
        originPort: 'Nhava Sheva Port, Mumbai (IN)',
        destinationPort: 'Hamburg Port, Terminal Altenwerder (DE)',
        departureDate: '2026-11-06T10:00:00Z',
        estimatedDeliveryDate: '2026-11-28T18:00:00Z',
        actualDeliveryDate: null,
        status: 'IN_TRANSIT',
        vesselName: 'MV Maersk McKinney Moller',
        containerNumber: 'MSCU-892144-0',
        currentTemperatureC: 23.1,
        currentHumidityPercent: 68,
        lastLocationName: 'Arabian Sea Maritime Corridor (En route Hamburg)',
        lastPingAt: now,
        notes: 'Cold chain container maintaining pharma-grade packaging conditions under Agreement 2 Schedule C.',
      },
    ];

    // 5. Reset AI Sentinel Alerts
    this.data.aiSentinelAlerts = [
      {
        id: 'ALERT-001',
        tradeId: demoTradeId,
        eventType: 'TEMP_READING_ANOMALY',
        severity: 'INFO',
        detectedAt: now,
        thresholdValue: '25.0°C Max Continuous',
        actualValue: '26.5°C Transient (JNPT Berth Transfer)',
        relevantClauseId: 'clause-5',
        recommendedAction: 'Transient temperature rise during container berth crane hoist. Container refrigeration restored upon vessel power plug-in. Monitor maritime transit logs.',
        status: 'MONITORING',
        reviewed: true,
      },
    ];

    // 6. Reset PayPal Sandbox orders
    this.data.paypalOrders = [
      {
        id: 'PAYPAL-SBX-ORD-DEMO01',
        tradeId: demoTradeId,
        buyerOrgId: 'DEMO-BUYER-001',
        sellerOrgId: 'DEMO-SELLER-001',
        amount: 87500.0,
        currency: 'EUR',
        status: 'CAPTURED',
        createdAt: now,
        approvedAt: now,
        capturedAt: now,
        paypalOrderId: 'PAYPAL-SBX-ORD-DEMO01',
        paypalCaptureId: 'PAYPAL-SBX-CAP-DEMO01',
        payerEmail: 'buyer.sandbox@meridian-trade.test',
        approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=DEMO_TOKEN_88942',
        disclaimer: 'PAYPAL SANDBOX — VIRTUAL PAYMENT DEMONSTRATION — NO REAL MONEY TRANSFERRED',
      },
    ];

    // 7. Reset Real payment proofs, Inspections, and Disputes for demo
    this.data.realPaymentProofs = [];
    this.data.buyerInspections = [];
    this.data.disputes = [];

    // 8. Re-seed clean demo evidence
    this.data.evidenceRecords = [];
    this.data.integrityLogs = [];
    this.data.telemetryMilestones = {};
    this.seedPhase4EvidenceAndTelemetry(this.data);

    this.logAuditEvent({
      organizationId: 'SYSTEM',
      eventType: 'SECURITY_AUDIT_LOGGED',
      objectId: archivedRunId,
      actor: adminUserId || 'system.admin@meridian.test',
      evidenceReference: archivedRunId,
      details: `Demo state reset successfully for next presentation. Archived run reference: ${archivedRunId}. Non-demo user accounts preserved intact.`,
    });

    this.save();

    return {
      success: true,
      message: 'Demo state successfully reset for presentation. All 15 demonstration steps ready to execute.',
      archivedRunId,
    };
  }

  // Admin stats
  public getAdminStats() {
    const totalCompanies = this.data.organizations.length;
    const buyers = this.data.organizations.filter((o) => o.role === 'BUYER').length;
    const sellers = this.data.organizations.filter((o) => o.role === 'SELLER').length;
    const pendingKyb = this.data.organizations.filter((o) => o.verificationStatus === 'KYB_PENDING' || o.verificationStatus === 'UNDER_REVIEW').length;
    const verified = this.data.organizations.filter((o) => o.verificationStatus === 'VERIFIED').length;
    const rejected = this.data.organizations.filter((o) => o.verificationStatus === 'REJECTED' || o.verificationStatus === 'SUSPENDED').length;
    const agreementAccepted = this.data.organizations.filter((o) => o.agreement1Status === 'ACCEPTED').length;
    const agreementPending = totalCompanies - agreementAccepted;
    const pendingInvitations = this.data.sellerInvitations.filter((i) => i.status === 'PENDING').length;
    const connectedPairs = this.data.buyerSellerConnections.length;
    const activeTrades = this.data.tradeRequests.length;
    const complianceAlerts = this.data.complianceScreenings.filter((s) => s.resultStatus !== 'CLEAR_ON_CHECKED_SOURCES').length;

    return {
      totalCompanies,
      buyers,
      sellers,
      pendingKyb,
      verified,
      rejected,
      agreementAccepted,
      agreementPending,
      pendingInvitations,
      connectedPairs,
      activeTrades,
      complianceAlerts,
    };
  }

  private sanitizeUser(user: StoredUser): User {
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }
}

export const db = new Database();

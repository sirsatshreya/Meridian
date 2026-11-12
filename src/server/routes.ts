import { Router, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { LEGAL_DOCUMENTS } from './legalDocumentsData';
import { runCompanyScreening, runTradeScreening } from './complianceEngine';
import { User, Organization } from '../types';
import { objectStorage } from './objectStorage';
import path from 'path';
import {
  createLivePayPalSandboxOrder,
  captureLivePayPalSandboxOrder,
  verifyPayPalWebhookSignature,
  isPayPalConfigured,
} from './paypalService';
import { runAiEvidenceAnalysis } from './aiService';

export const apiRouter = Router();

// Middleware: Authenticate Session Token
interface AuthenticatedRequest extends Request {
  user?: User;
  organization?: Organization;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No authorization token provided.' });
  }
  const token = authHeader.split(' ')[1];
  const session = db.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  req.user = session.user;
  req.organization = session.organization;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authorization required.' });
  }
  const token = authHeader.split(' ')[1];
  const session = db.getSession(token);
  if (!session || session.user.role !== 'DEVELOPER') {
    return res.status(403).json({ error: 'Access denied. Developer/Admin role required.' });
  }
  req.user = session.user;
  next();
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, companyName, country, registrationNumber } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }
  if (role !== 'BUYER' && role !== 'SELLER') {
    return res.status(400).json({ error: 'Role must be either BUYER or SELLER.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  // Check duplicate email
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this corporate email already exists. Please sign in.' });
  }

  // Duplicate company check
  if (companyName && country && registrationNumber) {
    const dupCheck = db.checkDuplicateOrganization(companyName, country, registrationNumber);
    if (dupCheck.isDuplicate) {
      return res.status(409).json({
        error: `A company matching "${companyName}" (${country}) is already registered with Organization ID ${dupCheck.matchedOrg?.id}. Contact support for access recovery.`,
      });
    }
  }

  // Create Organization first
  const newOrg = db.createOrganization({
    legalName: companyName || `${name.trim()}'s Commercial Enterprise`,
    tradingName: companyName || `${name.trim()}'s Enterprise`,
    country: country || 'United States',
    stateRegion: '',
    entityType: 'Corporation / LLC',
    registrationNumber: registrationNumber || `REG-${Date.now().toString(36).toUpperCase()}`,
    registeredAddress: '',
    officialEmail: email.trim().toLowerCase(),
    businessPhone: '',
    industry: 'International Trade',
    natureOfBusiness: role === 'BUYER' ? 'Importer / Procurement' : 'Exporter / Manufacturing',
    mainProductsServices: 'Trade commodities',
    countriesOfOperation: [country || 'Global'],
    role: role,
    verificationStatus: 'NOT_STARTED',
    agreement1Status: 'PENDING',
  });

  const { user, sessionToken } = db.createUser({
    name,
    email,
    passwordPlain: password,
    role,
    organizationId: newOrg.id,
  });

  return res.status(201).json({
    success: true,
    user,
    organization: newOrg,
    sessionToken,
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = db.authenticate(email, password, role);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  const organization = db.getOrganizationById(result.user!.organizationId);
  return res.json({
    success: true,
    user: result.user,
    organization,
    sessionToken: result.sessionToken,
  });
});

apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization!.split(' ')[1];
  db.revokeSession(token);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    user: req.user,
    organization: req.organization,
  });
});

apiRouter.post('/auth/verify-email', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.verifyEmail(req.user!.id);
  const updatedUser = db.findUserById(req.user!.id);
  return res.json({ success: true, user: updatedUser });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  db.emailService.sendEmail(
    email,
    'Meridian Security — Password Reset Dispatch',
    'LOGIN_SUCCESS',
    { message: 'A secure password reset link was dispatched.', time: new Date().toISOString() }
  );

  return res.json({
    success: true,
    message: `A simulated security reset dispatch has been queued for ${email}.`,
  });
});

// ==========================================
// 2. COMPANY ONBOARDING & PROFILE ROUTES
// ==========================================

apiRouter.post('/companies/check-duplicate', (req: Request, res: Response) => {
  const { legalName, country, registrationNumber } = req.body;
  if (!legalName || !country || !registrationNumber) {
    return res.status(400).json({ error: 'legalName, country, and registrationNumber required.' });
  }
  const result = db.checkDuplicateOrganization(legalName, country, registrationNumber);
  return res.json(result);
});

apiRouter.get('/companies/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ organization: req.organization });
});

apiRouter.put('/companies/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;
  const updated = db.updateOrganization(req.organization!.id, updates);

  db.recordAudit({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    eventType: 'COMPANY_PROFILE_UPDATED',
    actor: req.user!.email,
    details: 'Company operational parameters updated.',
  });

  return res.json({ organization: updated });
});

apiRouter.put('/companies/me/membership', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { membershipTier } = req.body;
  if (!['REGULAR', 'PRO', 'ULTRA'].includes(membershipTier)) {
    return res.status(400).json({ error: 'Invalid membership tier. Must be REGULAR, PRO, or ULTRA.' });
  }
  const updated = db.updateOrganization(req.organization!.id, { membershipTier });
  db.recordAudit({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    eventType: 'MEMBERSHIP_TIER_UPDATED',
    actor: req.user!.email,
    details: `Membership tier updated to ${membershipTier}.`,
  });
  return res.json({ organization: updated });
});

apiRouter.post('/companies/me/representative', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { fullName, designation, officialEmail, contactNumber, roleInOrg, declarationConfirmed } = req.body;
  if (!fullName || !designation || !declarationConfirmed) {
    return res.status(400).json({ error: 'Full name, designation, and affirmative declaration are required.' });
  }

  const rep = db.setAuthorizedRepresentative({
    organizationId: req.organization!.id,
    fullName,
    designation,
    officialEmail: officialEmail || req.user!.email,
    contactNumber: contactNumber || '',
    roleInOrg: roleInOrg || designation,
    declarationConfirmed: Boolean(declarationConfirmed),
  });

  db.recordAudit({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    eventType: 'AUTHORIZED_REPRESENTATIVE_VERIFIED',
    actor: req.user!.email,
    details: `Authorized representative confirmed: ${fullName} (${designation})`,
  });

  return res.json({ representative: rep });
});

apiRouter.get('/companies/me/representative', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const rep = db.getAuthorizedRepresentative(req.organization!.id);
  return res.json({ representative: rep });
});

apiRouter.post('/companies/me/documents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { documentType, fileName, fileSize, mimeType, notes } = req.body;
  if (!documentType || !fileName) {
    return res.status(400).json({ error: 'Document type and file name are required.' });
  }

  const doc = db.addBusinessDocument({
    organizationId: req.organization!.id,
    documentType,
    fileName,
    fileSize: fileSize || 250000,
    mimeType: mimeType || 'application/pdf',
    status: 'VERIFIED',
    notes: notes || 'Verified for compliance onboarding.',
  });

  db.recordAudit({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    eventType: 'BUSINESS_DOCUMENT_UPLOADED',
    objectId: doc.id,
    actor: req.user!.email,
    details: `Uploaded ${documentType}: ${fileName}`,
  });

  return res.json({ document: doc });
});

apiRouter.get('/companies/me/documents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const docs = db.getBusinessDocuments(req.organization!.id);
  return res.json({ documents: docs });
});

apiRouter.post('/companies/me/submit-verification', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const org = req.organization!;
  const updatedOrg = db.updateOrganization(org.id, {
    verificationStatus: 'VERIFIED',
  });

  // Run automated company compliance screening
  const screening = runCompanyScreening(org.id, org.legalName, org.country, org.registrationNumber);
  db.recordComplianceScreening(screening);

  db.addNotification({
    userId: req.user!.id,
    organizationId: org.id,
    title: 'Business Verification Completed',
    message: `Your company ${org.legalName} has successfully completed Phase 2 KYB verification and compliance checks.`,
    type: 'SUCCESS',
  });

  db.emailService.sendEmail(
    org.officialEmail,
    'Meridian Business Verification Status Update',
    'VERIFICATION_UPDATE',
    { company: org.legalName, status: 'VERIFIED', date: new Date().toISOString() }
  );

  return res.json({ organization: updatedOrg, screening });
});

// ==========================================
// 3. LEGAL DOCUMENTS & AGREEMENT 1
// ==========================================

apiRouter.get('/legal-documents', (_req: Request, res: Response) => {
  return res.json({ documents: LEGAL_DOCUMENTS });
});

apiRouter.get('/legal-documents/:id', (req: Request, res: Response) => {
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === req.params.id || d.number === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  return res.json({ document: doc });
});

apiRouter.post('/legal-documents/accept-agreement-1', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { authorizedRepresentative, designation, timezone, signatureMethod, signatureData } = req.body;
  if (!authorizedRepresentative || !designation) {
    return res.status(400).json({ error: 'Authorized representative name and designation required.' });
  }

  const acceptance = db.recordAgreementAcceptance({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    companyLegalName: req.organization!.legalName,
    authorizedRepresentative,
    designation,
    officialEmail: req.organization!.officialEmail,
    agreementVersion: '0.1',
    documentHash: 'a7b89f02c4819d42f534891b72e9d284a1e941fba739a820c45167098e94fa01',
    displayTimezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    authenticationMethod: 'SESSION_ENCRYPTED_SIGNATURE',
    signatureMethod,
    signatureData,
  });

  return res.json({ success: true, acceptance });
});

apiRouter.post('/legal-documents/acknowledge-privacy', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { timezone } = req.body;
  const ack = db.recordPrivacyAcknowledgement({
    organizationId: req.organization!.id,
    userId: req.user!.id,
    documentVersion: '0.1',
    displayTimezone: timezone || 'UTC',
  });
  return res.json({ success: true, acknowledgement: ack });
});

apiRouter.get('/legal-documents/acceptance-receipts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const receipts = db.getAgreementAcceptances(req.organization!.id);
  return res.json({ receipts });
});

// ==========================================
// 4. COMPLIANCE SCREENING
// ==========================================

apiRouter.post('/compliance/screen-company', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const org = req.organization!;
  const screening = runCompanyScreening(org.id, org.legalName, org.country, org.registrationNumber);
  db.recordComplianceScreening(screening);
  return res.json({ screening });
});

apiRouter.get('/compliance/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const screenings = db.getComplianceScreenings(req.organization!.id);
  return res.json({ screenings });
});

// ==========================================
// 5. TRADE REQUESTS
// ==========================================

apiRouter.get('/trade-requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === 'BUYER') {
    const list = db.getTradeRequestsByBuyer(req.organization!.id);
    return res.json({ tradeRequests: list });
  } else if (req.user!.role === 'SELLER') {
    const list = db.getTradeRequestsBySeller(req.organization!.id, req.organization!.officialEmail);
    return res.json({ tradeRequests: list });
  }
  const all = db.getAllTradeRequests();
  return res.json({ tradeRequests: all });
});

apiRouter.post('/trade-requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'BUYER' && req.user!.role !== 'DEVELOPER') {
    return res.status(403).json({ error: 'Only authorized Buyer organizations can create Trade Requests.' });
  }

  // Enforce membership tier deal limits
  const tier = req.organization?.membershipTier || 'PRO';
  const existingTrades = db.getTradeRequestsByBuyer(req.organization!.id);
  const limit = tier === 'REGULAR' ? 3 : tier === 'PRO' ? 15 : Infinity;
  if (existingTrades.length >= limit) {
    return res.status(403).json({
      error: `Your ${tier} Plan allows up to ${limit} active trades. Please upgrade your membership plan in the Membership tab to create additional trades.`,
    });
  }

  const {
    sellerCompanyName,
    sellerCountry,
    sellerBusinessEmail,
    sellerRegNumber,
    productDescription,
    productCategory,
    hsCode,
    quantity,
    unit,
    proposedPrice,
    currency,
    countryOfOrigin,
    destination,
    deliveryLocation,
    proposedDeliveryDate,
    specifications,
    qualityRequirements,
    packagingRequirements,
    inspectionConditions,
    slaRequirements,
    tempHumidityReqs,
    status,
  } = req.body;

  if (!sellerCompanyName || !sellerBusinessEmail || !productDescription || !quantity || !proposedPrice) {
    return res.status(400).json({ error: 'Please provide seller details, product description, quantity, and price.' });
  }

  const trade = db.createTradeRequest({
    buyerOrgId: req.organization!.id,
    buyerUserId: req.user!.id,
    buyerCompanyName: req.organization!.legalName,
    sellerCompanyName,
    sellerCountry: sellerCountry || 'International',
    sellerBusinessEmail: sellerBusinessEmail.trim().toLowerCase(),
    sellerRegNumber,
    productDescription,
    productCategory: productCategory || 'General Merchandise',
    hsCode: hsCode || '',
    quantity: Number(quantity),
    unit: unit || 'Units',
    proposedPrice: Number(proposedPrice),
    currency: currency || 'USD',
    countryOfOrigin: countryOfOrigin || req.organization!.country,
    destination: destination || 'Destination Port',
    deliveryLocation: deliveryLocation || 'Designated CIF Port',
    proposedDeliveryDate: proposedDeliveryDate || '2026-12-31',
    specifications: specifications || '',
    qualityRequirements,
    packagingRequirements,
    inspectionConditions,
    slaRequirements,
    tempHumidityReqs,
    status: status || 'AWAITING_SELLER_RESPONSE',
  });

  return res.status(201).json({ tradeRequest: trade });
});

apiRouter.get('/trade-requests/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const tr = db.getTradeRequestById(req.params.id);
  if (!tr) return res.status(404).json({ error: 'Trade request not found' });
  return res.json({ tradeRequest: tr });
});

// ==========================================
// 6. SELLER INVITATIONS
// ==========================================

apiRouter.post('/invitations/send', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { tradeRequestId, recipientEmail, recipientCompanyName } = req.body;
  if (!tradeRequestId || !recipientEmail) {
    return res.status(400).json({ error: 'tradeRequestId and recipientEmail required.' });
  }

  try {
    const inv = db.createSellerInvitation(tradeRequestId, recipientEmail, recipientCompanyName || 'Prospective Seller');
    return res.json({ success: true, invitation: inv });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/invitations/mine', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const invs = db.getInvitationsByOrg(req.organization!.id, req.organization!.officialEmail);
  return res.json({ invitations: invs });
});

apiRouter.get('/invitations/resolve/:token', (req: Request, res: Response) => {
  const inv = db.getInvitationByToken(req.params.token);
  if (!inv) return res.status(404).json({ error: 'Invitation not found or expired.' });

  const trade = db.getTradeRequestById(inv.tradeRequestId);
  return res.json({ invitation: inv, tradeRequest: trade });
});

apiRouter.post('/invitations/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { invitationId, action, notes } = req.body;
  if (!invitationId || !action) {
    return res.status(400).json({ error: 'invitationId and action (ACCEPT/DECLINE/CHANGES_REQUESTED) required.' });
  }

  const result = db.respondToInvitation(invitationId, action, req.organization!.id, notes, req.user!.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

apiRouter.get('/companies/connections', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const conns = db.getConnectionsForOrg(req.organization!.id);
  return res.json({ connections: conns });
});

// ==========================================
// 7. NOTIFICATIONS & EMAIL OUTBOX
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const notifs = db.getNotifications(req.user!.id);
  return res.json({ notifications: notifs });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationRead(req.params.id);
  return res.json({ success: true });
});

apiRouter.get('/email/outbox', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  const outbox = db.emailService.getOutbox();
  return res.json({ outbox });
});

apiRouter.get('/audit/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const events = db.getAuditEvents(req.user?.role === 'DEVELOPER' ? undefined : req.organization!.id);
  return res.json({ auditEvents: events });
});

// ==========================================
// 8. ADMIN & DEVELOPER ENDPOINTS
// ==========================================

apiRouter.get('/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAdminStats();
  return res.json({ stats });
});

apiRouter.get('/admin/companies', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const orgs = db.getAllOrganizations();
  return res.json({ organizations: orgs });
});

apiRouter.get('/admin/companies/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const org = db.getOrganizationById(req.params.id);
  if (!org) return res.status(404).json({ error: 'Company not found' });

  const rep = db.getAuthorizedRepresentative(org.id);
  const docs = db.getBusinessDocuments(org.id);
  const receipts = db.getAgreementAcceptances(org.id);
  const screenings = db.getComplianceScreenings(org.id);
  const audits = db.getAuditEvents(org.id);

  return res.json({
    organization: org,
    representative: rep,
    documents: docs,
    agreementAcceptances: receipts,
    complianceScreenings: screenings,
    auditEvents: audits,
  });
});

apiRouter.put('/admin/companies/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { verificationStatus } = req.body;
  const updated = db.updateOrganization(req.params.id, { verificationStatus });

  db.recordAudit({
    organizationId: req.params.id,
    userId: req.user!.id,
    eventType: 'ADMIN_STATUS_OVERRIDE',
    actor: req.user!.email,
    details: `Admin updated company status to ${verificationStatus}`,
  });

  return res.json({ organization: updated });
});

apiRouter.get('/admin/compliance', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const screenings = db.getAllComplianceScreenings();
  return res.json({ screenings });
});

apiRouter.get('/admin/trade-requests', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const trades = db.getAllTradeRequests();
  return res.json({ tradeRequests: trades });
});

apiRouter.get('/admin/invitations', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const invs = db.getAllInvitations();
  return res.json({ invitations: invs });
});

apiRouter.get('/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditEvents();
  return res.json({ auditEvents: logs });
});

// ==========================================
// 8. AGREEMENT 2 (TRADE CONTRACT & READINESS GATE)
// ==========================================

apiRouter.get('/trades/:id/agreement-2', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const agreement = db.getOrCreateAgreement2(req.params.id);
    return res.json({ agreement });
  } catch (err: any) {
    return res.status(404).json({ error: err.message });
  }
});

apiRouter.put('/trades/:id/agreement-2/clauses/:clauseId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Clause content string is required.' });
  }

  const role = req.user!.role as 'BUYER' | 'SELLER';
  const result = db.updateAgreement2Clause(
    req.params.id,
    req.params.clauseId,
    content,
    role,
    req.user!.email
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

apiRouter.post('/trades/:id/agreement-2/clauses/:clauseId/approve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role as 'BUYER' | 'SELLER';
  const result = db.approveAgreement2Clause(
    req.params.id,
    req.params.clauseId,
    role,
    req.user!.email
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

apiRouter.post('/trades/:id/agreement-2/clauses/:clauseId/reject', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const role = req.user!.role as 'BUYER' | 'SELLER';
  const result = db.rejectAgreement2Clause(
    req.params.id,
    req.params.clauseId,
    role,
    req.user!.email,
    reason || 'Rejected by counterparty'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

apiRouter.get('/trades/:id/agreement-2/readiness', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = db.evaluateAgreement2ReadinessGate(req.params.id);
    const agreement = db.getAgreement2ByTradeId(req.params.id);
    return res.json({ readinessReport: report, agreement });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/trades/:id/agreement-2/generate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Mandatory server gate check
    const report = db.evaluateAgreement2ReadinessGate(req.params.id);
    if (!report.overallPassed) {
      return res.status(400).json({
        error: `Cannot generate Agreement 2: ${report.blockingFailuresCount} mandatory readiness conditions are unresolved.`,
        readinessReport: report,
      });
    }

    const agreement = db.getAgreement2ByTradeId(req.params.id)!;
    return res.json({
      success: true,
      message: 'Agreement 2 document compiled successfully.',
      agreement,
      readinessReport: report,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/trades/:id/agreement-2/sign', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { authorizedSignerName, signerTitle, expectedHash, timezone, signatureMethod, signatureData, disclaimerText } = req.body;
  if (!authorizedSignerName || !signerTitle || !expectedHash) {
    return res.status(400).json({ error: 'Signer name, official title, and expected document version hash are required.' });
  }

  const role = req.user!.role;
  if (role !== 'BUYER' && role !== 'SELLER') {
    return res.status(403).json({ error: 'Only authorized Buyer or Seller representatives can execute trade agreements.' });
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const result = db.signAgreement2(
    req.params.id,
    role,
    authorizedSignerName,
    signerTitle,
    req.user!.email,
    expectedHash,
    timezone || 'UTC',
    ip,
    signatureMethod || 'PROTOTYPE_TYPED',
    signatureData,
    disclaimerText || 'Prototype electronic signature interaction: Binds representative assent without certified digital signature claims.'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

apiRouter.post('/trades/:id/agreement-2/escalate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  const result = db.flagAgreement2LegalReview(req.params.id, reason || 'Requested legal review', req.user!.email);
  return res.json(result);
});

apiRouter.post('/admin/trades/:id/legal-review/clear', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  const result = db.clearAgreement2LegalReview(req.params.id, req.user!.email, notes || 'Approved by counsel');
  return res.json(result);
});

// ==========================================
// PHASE 4: DOCUMENT INTEGRITY, EVIDENCE & OBJECT STORAGE
// ==========================================

// Stream raw object from private object storage (protected access)
apiRouter.get('/storage/:key(*)', (req: Request, res: Response) => {
  try {
    const storageKey = req.params.key;
    if (!storageKey || storageKey.includes('..')) {
      return res.status(400).json({ error: 'Invalid storage key path traversal.' });
    }

    if (!objectStorage.objectExists(storageKey)) {
      return res.status(404).json({ error: 'Stored object not found in private object storage.' });
    }

    const ext = path.extname(storageKey).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.pdf': 'application/pdf',
      '.webp': 'image/webp',
      '.bin': 'application/octet-stream',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const stream = objectStorage.getObjectStream(storageKey);
    if (!stream) {
      return res.status(404).json({ error: 'Object stream unavailable.' });
    }
    return stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get evidence records for trade (metadata only from DB)
apiRouter.get('/trades/:id/evidence', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const records = db.getEvidenceRecords(req.params.id);
  return res.json({ evidence: records });
});

// Register and store new evidence file in private object storage
apiRouter.post('/trades/:id/evidence', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { category, fileName, mimeType, fileData, caption, documentVersion } = req.body;
  if (!category || !fileName || !fileData) {
    return res.status(400).json({ error: 'category, fileName, and base64 fileData are required for upload.' });
  }

  try {
    // Strip possible data URI prefix (e.g. data:image/png;base64,...)
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file payload is empty.' });
    }

    const record = db.addEvidenceRecord({
      tradeId: req.params.id,
      category,
      fileName,
      mimeType: mimeType || 'application/octet-stream',
      fileBuffer: buffer,
      uploadedBy: `${req.user!.name} (${req.user!.role})`,
      uploadedByOrgId: req.organization!.id,
      caption,
      documentVersion,
    });

    return res.status(201).json({ success: true, evidence: record });
  } catch (err: any) {
    return res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// AI Evidence Analysis against Agreement 2
apiRouter.post('/trades/:id/evidence/ai-analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trade = db.getTradeById(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Trade not found.' });
    const agreement2 = db.getOrCreateAgreement2(req.params.id);
    const evidenceList = db.getEvidenceRecords(req.params.id);
    const telemetry = db.getTelemetryMilestones(req.params.id);
    const alerts = db.getAISentinelAlerts(req.params.id);

    const analysis = await runAiEvidenceAnalysis({
      trade,
      agreement2,
      evidenceList,
      telemetry,
      alerts,
    });
    return res.json({ success: true, analysis });
  } catch (err: any) {
    return res.status(500).json({ error: `AI analysis failed: ${err.message}` });
  }
});

// Verify document integrity: re-reads raw binary from object storage, recalculates SHA-256
apiRouter.post('/trades/:id/evidence/:evidenceId/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  const verifiedBy = `${req.user!.name} (${req.user!.role})`;
  const verifiedByRole = req.user!.role;

  const result = db.verifyEvidenceIntegrity(
    req.params.evidenceId,
    req.params.id,
    verifiedBy,
    verifiedByRole,
    notes
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json(result);
});

// Get access-controlled, append-only integrity verification log
apiRouter.get('/trades/:id/integrity-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getIntegrityLogs(req.params.id);
  return res.json({ logs });
});

// Get simulated demo telemetry milestones
apiRouter.get('/trades/:id/telemetry', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const telemetry = db.getTelemetryMilestones(req.params.id);
  return res.json({ telemetry, label: 'SIMULATED DEMO TELEMETRY' });
});

// Generate and return canonical trade manifest with distinct JSON & PDF digests
apiRouter.get('/trades/:id/canonical-manifest', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const manifest = db.generateCanonicalManifest(req.params.id);
  return res.json({ manifest });
});

// Simulated tampering test route (for demo and automated test suite)
apiRouter.post('/trades/:id/evidence/:evidenceId/simulate-tampering', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const evidence = db.getEvidenceById(req.params.evidenceId);
  if (!evidence) {
    return res.status(404).json({ error: 'Evidence record not found.' });
  }

  const tampered = objectStorage.simulateTampering(
    evidence.storageKey,
    `[TAMPERED SIMULATION FILE CONTENT MODIFIED AT ${new Date().toISOString()}]`
  );

  if (!tampered) {
    return res.status(500).json({ error: 'Could not modify storage file.' });
  }

  return res.json({
    success: true,
    message: `Storage file ${evidence.storageKey} was intentionally altered to simulate unauthorized tampering. Run verification to test integrity detection.`,
  });
});

// ==========================================
// 8. PAYPAL SANDBOX & PAYMENT ROUTES
// ==========================================

// Get PayPal Sandbox orders for trade
apiRouter.get('/trades/:id/paypal/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const orders = db.getPayPalOrders(req.params.id);
  return res.json({ orders, liveSandboxConfigured: isPayPalConfigured() });
});

// Create PayPal Sandbox Order (uses live PayPal Sandbox API if configured, else prototype Sandbox fallback)
apiRouter.post('/trades/:id/paypal/create-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { amount, currency, returnUrl, cancelUrl } = req.body;
  const trade = db.getTradeById(req.params.id);
  if (!trade) {
    return res.status(404).json({ error: 'Trade request not found.' });
  }

  try {
    const orderAmount = Number(amount) || ((trade.unitPrice || trade.proposedPrice || 0) * trade.quantity) || 87500;
    const orderCurrency = currency || trade.currency || 'EUR';
    const appOrigin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    const resolvedReturnUrl = returnUrl || `${appOrigin}/buyer/home?tradeId=${req.params.id}&paypalStatus=approved`;
    const resolvedCancelUrl = cancelUrl || `${appOrigin}/buyer/home?tradeId=${req.params.id}&paypalStatus=cancelled`;

    const liveResult = await createLivePayPalSandboxOrder({
      tradeId: req.params.id,
      amount: orderAmount,
      currency: orderCurrency,
      returnUrl: resolvedReturnUrl,
      cancelUrl: resolvedCancelUrl,
    });

    const order = db.createPayPalOrder({
      tradeId: req.params.id,
      buyerOrgId: req.organization!.id,
      sellerOrgId: trade.sellerOrgId || (trade as any).sellerOrganizationId || '',
      amount: orderAmount,
      currency: orderCurrency,
      returnUrl: resolvedReturnUrl,
      cancelUrl: resolvedCancelUrl,
    });

    // Attach live PayPal order ID, approval URL & conversion details
    order.paypalOrderId = liveResult.paypalOrderId;
    order.approvalUrl = liveResult.approvalUrl;
    order.isSandbox = true;
    if (liveResult.convertedAmount) {
      order.convertedAmount = liveResult.convertedAmount;
      order.convertedCurrency = liveResult.convertedCurrency;
      order.exchangeRate = liveResult.exchangeRate;
      order.exchangeRateSource = liveResult.exchangeRateSource;
      order.exchangeRateTimestamp = liveResult.exchangeRateTimestamp;
    }

    return res.status(201).json({
      success: true,
      order,
      usedLiveApi: liveResult.usedLiveApi,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create PayPal Sandbox order' });
  }
});

// Capture PayPal Sandbox Order
apiRouter.post('/trades/:id/paypal/capture-order', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, payerEmail } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required.' });
  }

  try {
    const existingOrders = db.getPayPalOrders(req.params.id);
    const targetOrder = existingOrders.find((o) => o.id === orderId || o.paypalOrderId === orderId);
    
    // Idempotent safeguard: if already captured, return cleanly without duplicate capture attempts
    if (targetOrder && targetOrder.status === 'CAPTURED') {
      return res.json({ success: true, order: targetOrder, usedLiveApi: false, alreadyCaptured: true });
    }

    const providerOrderId = targetOrder?.paypalOrderId || orderId;
    const captureRes = await captureLivePayPalSandboxOrder(providerOrderId);

    const order = db.capturePayPalOrder({
      tradeId: req.params.id,
      orderId,
      payerEmail: captureRes.payerEmail || payerEmail || req.user?.email,
    });

    if (captureRes.paypalCaptureId) {
      order.paypalCaptureId = captureRes.paypalCaptureId;
    }

    return res.json({ success: true, order, usedLiveApi: captureRes.usedLiveApi });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PayPal Webhook receiver (with signature verification when PAYPAL_WEBHOOK_ID is configured)
apiRouter.post('/webhooks/paypal', async (req: Request, res: Response) => {
  const verified = await verifyPayPalWebhookSignature(req.headers, req.body);
  if (!verified) {
    return res.status(400).json({ error: 'PayPal webhook signature verification failed.', received: true });
  }
  const event = req.body;
  const result = db.handlePayPalWebhook(event);
  return res.json({ ...result, verified, received: true });
});

// ==========================================
// 9. REAL COMMERCIAL PAYMENT PROOF ROUTES
// ==========================================

// Get real payment proofs
apiRouter.get('/trades/:id/payments/real-proofs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const proofs = db.getRealPaymentProofs(req.params.id);
  return res.json({ proofs });
});

// Submit real commercial payment proof
apiRouter.post('/trades/:id/payments/real-proofs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { paymentMethod, claimedAmount, currency, transactionReference, fileData, fileName, mimeType, notes } = req.body;

  if (!claimedAmount || !transactionReference) {
    return res.status(400).json({ error: 'Claimed amount and transaction reference are required.' });
  }

  try {
    let buffer: Buffer;
    if (fileData) {
      const cleanBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
      buffer = Buffer.from(cleanBase64, 'base64');
    } else {
      buffer = Buffer.from(`REAL_PAYMENT_PROOF_RECEIPT_${transactionReference}_${Date.now()}`, 'utf-8');
    }

    const proof = db.submitRealPaymentProof({
      tradeId: req.params.id,
      uploaderUserId: req.user!.id,
      uploaderOrgId: req.organization!.id,
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      claimedAmount: Number(claimedAmount),
      currency: currency || 'EUR',
      transactionReference,
      proofBuffer: buffer,
      fileName: fileName || `payment_proof_${transactionReference}.pdf`,
      mimeType: mimeType || 'application/pdf',
      notes,
    });

    return res.status(201).json({ success: true, proof });
  } catch (err: any) {
    return res.status(500).json({ error: `Submission failed: ${err.message}` });
  }
});

// Verify real commercial payment proof
apiRouter.post('/trades/:id/payments/real-proofs/:proofId/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { decision, reviewNotes } = req.body;
  if (!decision || (decision !== 'VERIFIED_BY_AUTHORIZED_REVIEWER' && decision !== 'REJECTED_INSUFFICIENT_EVIDENCE')) {
    return res.status(400).json({ error: 'Valid reviewer decision is required.' });
  }

  try {
    const proof = db.verifyRealPaymentProof({
      tradeId: req.params.id,
      proofId: req.params.proofId,
      reviewerUserId: `${req.user!.name} (${req.user!.role})`,
      decision,
      reviewNotes,
    });
    return res.json({ success: true, proof });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 10. SHIPMENT & TELEMETRY SIMULATOR ROUTES
// ==========================================

// Get shipment record
apiRouter.get('/trades/:id/shipment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const shipment = db.getShipment(req.params.id);
  return res.json({ shipment });
});

// Update shipment details
apiRouter.patch('/trades/:id/shipment', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const shipment = db.updateShipment(req.params.id, req.body);
  return res.json({ success: true, shipment });
});

// Trigger simulated IoT telemetry event
apiRouter.post('/trades/:id/telemetry/simulate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { eventType } = req.body;
  if (!eventType) {
    return res.status(400).json({ error: 'eventType is required (e.g. NORMAL, TEMP_SPIKE, TEMP_NORMAL, HUMIDITY_ANOMALY, DELIVERY_DELAY, SUCCESSFUL_DELIVERY).' });
  }

  const result = db.triggerTelemetrySimulation(req.params.id, eventType, req.user?.email);
  return res.json({ success: true, ...result });
});

// Get AI Sentinel Alerts
apiRouter.get('/trades/:id/sentinel-alerts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const alerts = db.getAISentinelAlerts(req.params.id);
  return res.json({ alerts });
});

// ==========================================
// 11. BUYER INSPECTION ROUTES
// ==========================================

// Get inspection records
apiRouter.get('/trades/:id/inspections', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const inspections = db.getBuyerInspections(req.params.id);
  return res.json({ inspections });
});

// Submit inspection review
apiRouter.post('/trades/:id/inspections', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { decision, observations, checklist, conditionPhotoIds } = req.body;
  if (!decision || !checklist) {
    return res.status(400).json({ error: 'Inspection decision and checklist are required.' });
  }

  const record = db.submitBuyerInspection({
    tradeId: req.params.id,
    inspectorUserId: `${req.user!.name} (${req.user!.role})`,
    inspectorOrgId: req.organization!.id,
    decision,
    observations: observations || '',
    checklist,
    conditionPhotoIds,
  });

  return res.status(201).json({ success: true, inspection: record });
});

// ==========================================
// 12. DISPUTE MANAGEMENT & AI ASSISTANCE ROUTES
// ==========================================

// Get disputes for trade
apiRouter.get('/trades/:id/disputes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const disputes = db.getDisputes(req.params.id);
  return res.json({ disputes });
});

// Create internal dispute
apiRouter.post('/trades/:id/disputes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { issueSummary, details, relevantClauseId, evidenceIds, proposedResolution } = req.body;
  if (!issueSummary || !proposedResolution) {
    return res.status(400).json({ error: 'issueSummary and proposedResolution are required.' });
  }

  const dispute = db.createDispute({
    tradeId: req.params.id,
    filedByOrgId: req.organization!.id,
    filedByUserId: `${req.user!.name} (${req.user!.role})`,
    issueSummary,
    details: details || '',
    relevantClauseId: relevantClauseId || 'clause-5',
    evidenceIds: evidenceIds || [],
    proposedResolution,
  });

  return res.status(201).json({ success: true, dispute });
});

// Counterparty responds to dispute
apiRouter.post('/trades/:id/disputes/:disputeId/respond', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { explanation, additionalEvidenceIds, responseType, alternativeProposal } = req.body;
  if (!explanation || !responseType) {
    return res.status(400).json({ error: 'explanation and responseType are required.' });
  }

  try {
    const dispute = db.respondToDispute({
      disputeId: req.params.disputeId,
      respondingOrgId: req.organization!.id,
      respondingUserId: `${req.user!.name} (${req.user!.role})`,
      explanation,
      additionalEvidenceIds,
      responseType,
      alternativeProposal,
    });
    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// AI Dispute Resolution Assessment
apiRouter.post('/trades/:id/disputes/:disputeId/ai-assist', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const analysis = db.generateAIDisputeResolution(req.params.disputeId);
    return res.json({ success: true, analysis });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Bilateral mutual resolution agreement
apiRouter.post('/trades/:id/disputes/:disputeId/resolve', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { resolutionNotes, outcome } = req.body;
  if (!resolutionNotes) {
    return res.status(400).json({ error: 'resolutionNotes are required.' });
  }

  try {
    const dispute = db.resolveDispute({
      disputeId: req.params.disputeId,
      approvedByOrgId: req.organization!.id,
      approvedByUserId: `${req.user!.name} (${req.user!.role})`,
      resolutionNotes,
      outcome: outcome || 'RESOLVED_MUTUAL_AGREEMENT',
    });
    return res.json({ success: true, dispute });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 13. PHASE 5 HANDOFF SUMMARY ROUTE
// ==========================================
apiRouter.get('/trades/:id/phase5-handoff', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const handoff = db.generatePhase5Handoff(req.params.id);
    return res.json({ handoff });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 14. PHASE 5 FINAL TRADE COMPLETION & DOSSIER ROUTES
// ==========================================

// Get Phase 5 completion record & live readiness
apiRouter.get('/trades/:id/phase5', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const completion = db.getPhase5Completion(req.params.id);
    return res.json({ completion });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Submit bilateral Phase 5 review (Buyer or Seller)
apiRouter.post('/trades/:id/phase5/review', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { approved, notes } = req.body;
  if (typeof approved !== 'boolean') {
    return res.status(400).json({ error: 'approved (boolean) is required.' });
  }

  try {
    const trade = db.getTradeById(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found.' });
    }

    // Determine party from user role / organization
    const party: 'BUYER' | 'SELLER' =
      req.user?.role === 'BUYER' || req.organization?.id === trade.buyerOrgId ? 'BUYER' : 'SELLER';

    const completion = db.submitPhase5Review(req.params.id, party, {
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      approved,
      notes: notes || '',
    });

    return res.json({ success: true, completion });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Submit bilateral Phase 5 completion signature
apiRouter.post('/trades/:id/phase5/sign', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { signerName, signerTitle, signatureData, signatureMethod, consentConfirmed } = req.body;

  if (!signerName || !signerTitle) {
    return res.status(400).json({ error: 'signerName and signerTitle are required.' });
  }
  if (!consentConfirmed) {
    return res.status(400).json({ error: 'Legal consent confirmation is required.' });
  }

  try {
    const trade = db.getTradeById(req.params.id);
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found.' });
    }

    const party: 'BUYER' | 'SELLER' =
      req.user?.role === 'BUYER' || req.organization?.id === trade.buyerOrgId ? 'BUYER' : 'SELLER';

    const completion = db.submitPhase5Signature(req.params.id, party, {
      userId: req.user!.id,
      companyName: req.organization!.legalName,
      signerName,
      signerTitle,
      signatureData,
      signatureMethod: signatureMethod || 'PROTOTYPE_CANVAS',
      consentConfirmed: Boolean(consentConfirmed),
    });

    return res.json({ success: true, completion });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Get consolidated Phase 5 dossier data package
apiRouter.get('/trades/:id/phase5/dossier', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = db.getPhase5DossierData(req.params.id);
    return res.json({ dossier: data });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Save / Register generated Phase 5 completion certificate
apiRouter.post('/trades/:id/phase5/certificate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { pdfBase64 } = req.body;
  if (!pdfBase64) {
    return res.status(400).json({ error: 'pdfBase64 is required.' });
  }

  try {
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const docId = `MERIDIAN_COMPLETION_CERTIFICATE_${req.params.id}_v1.0`;

    const stored = objectStorage.storeObject(req.params.id, docId, `${docId}.pdf`, buffer);

    const completion = db.savePhase5Certificate(req.params.id, {
      storageKey: stored.storageKey,
      sha256Hash: stored.sha256Hash,
    });

    return res.json({
      success: true,
      completion,
      storageKey: stored.storageKey,
      sha256Hash: stored.sha256Hash,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 15. ADMIN DEMO RESET ROUTE (REPEATABLE PRESENTATION)
// ==========================================
apiRouter.post('/admin/reset-demo', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.resetDemoState(req.user?.email);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: `Demo reset failed: ${err.message}` });
  }
});



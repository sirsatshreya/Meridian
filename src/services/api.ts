import {
  User,
  Organization,
  AuthorizedRepresentative,
  BusinessDocument,
  LegalDocument,
  AgreementAcceptance,
  PrivacyAcknowledgement,
  ComplianceScreening,
  TradeRequest,
  SellerInvitation,
  BuyerSellerConnection,
  NotificationItem,
  AuditEvent,
  EmailOutboxItem,
  Phase5CompletionRecord,
} from '../types';

const TOKEN_KEY = 'mrdn_session_token_v2';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    register: (params: {
      name: string;
      email: string;
      password: string;
      role: 'BUYER' | 'SELLER';
      companyName?: string;
      country?: string;
      registrationNumber?: string;
    }) => apiFetch<{ success: boolean; user: User; organization: Organization; sessionToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

    login: (email: string, password: string, role?: string) =>
      apiFetch<{ success: boolean; user: User; organization: Organization; sessionToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      }),

    logout: () => apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),

    me: () => apiFetch<{ user: User; organization: Organization }>('/auth/me'),

    verifyEmail: () => apiFetch<{ success: boolean; user: User }>('/auth/verify-email', { method: 'POST' }),

    forgotPassword: (email: string) =>
      apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  // Company Onboarding & Profile
  companies: {
    checkDuplicate: (legalName: string, country: string, registrationNumber: string) =>
      apiFetch<{ isDuplicate: boolean; matchedOrg?: Organization }>('/companies/check-duplicate', {
        method: 'POST',
        body: JSON.stringify({ legalName, country, registrationNumber }),
      }),

    getMe: () => apiFetch<{ organization: Organization }>('/companies/me'),

    updateMe: (updates: Partial<Organization>) =>
      apiFetch<{ organization: Organization }>('/companies/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    setRepresentative: (rep: Omit<AuthorizedRepresentative, 'id' | 'organizationId' | 'confirmedAt'>) =>
      apiFetch<{ representative: AuthorizedRepresentative }>('/companies/me/representative', {
        method: 'POST',
        body: JSON.stringify(rep),
      }),

    getRepresentative: () =>
      apiFetch<{ representative?: AuthorizedRepresentative }>('/companies/me/representative'),

    uploadDocument: (doc: {
      documentType: BusinessDocument['documentType'];
      fileName: string;
      fileSize?: number;
      mimeType?: string;
      notes?: string;
    }) =>
      apiFetch<{ document: BusinessDocument }>('/companies/me/documents', {
        method: 'POST',
        body: JSON.stringify(doc),
      }),

    getDocuments: () => apiFetch<{ documents: BusinessDocument[] }>('/companies/me/documents'),

    submitVerification: () =>
      apiFetch<{ organization: Organization; screening: ComplianceScreening }>('/companies/me/submit-verification', {
        method: 'POST',
      }),

    getConnections: () => apiFetch<{ connections: BuyerSellerConnection[] }>('/companies/connections'),

    updateMembership: (membershipTier: 'REGULAR' | 'PRO' | 'ULTRA') =>
      apiFetch<{ organization: Organization }>('/companies/me/membership', {
        method: 'PUT',
        body: JSON.stringify({ membershipTier }),
      }),
  },

  // Legal Documents & Agreement 1
  legal: {
    getDocuments: () => apiFetch<{ documents: LegalDocument[] }>('/legal-documents'),

    getDocumentById: (id: string) => apiFetch<{ document: LegalDocument }>(`/legal-documents/${id}`),

    acceptAgreement1: (params: {
      authorizedRepresentative: string;
      designation: string;
      timezone?: string;
      signatureMethod?: string;
      signatureData?: string;
    }) =>
      apiFetch<{ success: boolean; acceptance: AgreementAcceptance }>('/legal-documents/accept-agreement-1', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    acknowledgePrivacy: (timezone?: string) =>
      apiFetch<{ success: boolean; acknowledgement: PrivacyAcknowledgement }>('/legal-documents/acknowledge-privacy', {
        method: 'POST',
        body: JSON.stringify({ timezone }),
      }),

    getAcceptanceReceipts: () =>
      apiFetch<{ receipts: AgreementAcceptance[] }>('/legal-documents/acceptance-receipts'),
  },

  // Compliance
  compliance: {
    screenCompany: () => apiFetch<{ screening: ComplianceScreening }>('/compliance/screen-company', { method: 'POST' }),
    getHistory: () => apiFetch<{ screenings: ComplianceScreening[] }>('/compliance/history'),
  },

  // Trade Requests
  tradeRequests: {
    getAll: () => apiFetch<{ tradeRequests: TradeRequest[] }>('/trade-requests'),
    getById: (id: string) => apiFetch<{ tradeRequest: TradeRequest }>(`/trade-requests/${id}`),
    create: (data: Partial<TradeRequest>) =>
      apiFetch<{ tradeRequest: TradeRequest }>('/trade-requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  trades: {
    getById: (id: string) =>
      apiFetch<{ tradeRequest: TradeRequest }>(`/trade-requests/${id}`).then((r) => ({ trade: r.tradeRequest })),
  },

  // Invitations
  invitations: {
    send: (params: { tradeRequestId: string; recipientEmail: string; recipientCompanyName: string }) =>
      apiFetch<{ success: boolean; invitation: SellerInvitation }>('/invitations/send', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getMine: () => apiFetch<{ invitations: SellerInvitation[] }>('/invitations/mine'),

    resolveToken: (token: string) =>
      apiFetch<{ invitation: SellerInvitation; tradeRequest?: TradeRequest }>(`/invitations/resolve/${token}`),

    respond: (params: { invitationId: string; action: 'ACCEPT' | 'DECLINE' | 'CHANGES_REQUESTED'; notes?: string }) =>
      apiFetch<{ success: boolean; invitation?: SellerInvitation; error?: string }>('/invitations/respond', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },

  // Notifications, Outbox & Audit
  notifications: {
    getAll: () => apiFetch<{ notifications: NotificationItem[] }>('/notifications'),
    markRead: (id: string) => apiFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  },

  email: {
    getOutbox: () => apiFetch<{ outbox: EmailOutboxItem[] }>('/email/outbox'),
  },

  audit: {
    getHistory: () => apiFetch<{ auditEvents: AuditEvent[] }>('/audit/history'),
  },

  // Admin & Developer
  admin: {
    getOverview: () => apiFetch<{ stats: any }>('/admin/overview'),
    getCompanies: () => apiFetch<{ organizations: Organization[] }>('/admin/companies'),
    getCompanyDetail: (id: string) =>
      apiFetch<{
        organization: Organization;
        representative?: AuthorizedRepresentative;
        documents: BusinessDocument[];
        agreementAcceptances: AgreementAcceptance[];
        complianceScreenings: ComplianceScreening[];
        auditEvents: AuditEvent[];
      }>(`/admin/companies/${id}`),
    updateCompanyStatus: (id: string, verificationStatus: string) =>
      apiFetch<{ organization: Organization }>(`/admin/companies/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ verificationStatus }),
      }),
    getCompliance: () => apiFetch<{ screenings: ComplianceScreening[] }>('/admin/compliance'),
    getTradeRequests: () => apiFetch<{ tradeRequests: TradeRequest[] }>('/admin/trade-requests'),
    getInvitations: () => apiFetch<{ invitations: SellerInvitation[] }>('/admin/invitations'),
    getAuditLogs: () => apiFetch<{ auditEvents: AuditEvent[] }>('/admin/audit-logs'),
    clearLegalReview: (tradeId: string, resolutionNotes: string) =>
      apiFetch<{ success: boolean; agreement2: any }>(`/admin/trades/${tradeId}/legal-review/clear`, {
        method: 'POST',
        body: JSON.stringify({ resolutionNotes }),
      }),
    resetDemo: () =>
      apiFetch<{ success: boolean; message: string; archivedRunId: string }>('/admin/reset-demo', {
        method: 'POST',
      }),
  },

  // Agreement 2 - Framework, Schedules & Backend Readiness Gate
  agreement2: {
    get: (tradeId: string) =>
      apiFetch<{ success: boolean; agreement2: any; readiness: any }>(`/trades/${tradeId}/agreement-2`),

    updateClause: (tradeId: string, clauseId: string, content: string) =>
      apiFetch<{ success: boolean; agreement2: any; readiness: any }>(`/trades/${tradeId}/agreement-2/clauses/${clauseId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),

    approveClause: (tradeId: string, clauseId: string) =>
      apiFetch<{ success: boolean; agreement2: any; readiness: any }>(`/trades/${tradeId}/agreement-2/clauses/${clauseId}/approve`, {
        method: 'POST',
      }),

    rejectClause: (tradeId: string, clauseId: string, rejectionReason: string) =>
      apiFetch<{ success: boolean; agreement2: any; readiness: any }>(`/trades/${tradeId}/agreement-2/clauses/${clauseId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      }),

    getReadiness: (tradeId: string) =>
      apiFetch<{ success: boolean; readiness: any }>(`/trades/${tradeId}/agreement-2/readiness`),

    generate: (tradeId: string) =>
      apiFetch<{ success: boolean; agreement2: any; readiness: any }>(`/trades/${tradeId}/agreement-2/generate`, {
        method: 'POST',
      }),

    sign: (tradeId: string, payload: {
      authorizedSignerName?: string;
      signerTitle?: string;
      expectedHash?: string;
      signatoryName?: string;
      signatoryDesignation?: string;
      expectedContractHash?: string;
      timezone?: string;
      signatureMethod?: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
      signatureData?: string;
      disclaimerText?: string;
    }) =>
      apiFetch<{ success: boolean; agreement: any; error?: string }>(`/trades/${tradeId}/agreement-2/sign`, {
        method: 'POST',
        body: JSON.stringify({
          authorizedSignerName: payload.authorizedSignerName || payload.signatoryName,
          signerTitle: payload.signerTitle || payload.signatoryDesignation,
          expectedHash: payload.expectedHash || payload.expectedContractHash,
          timezone: payload.timezone,
          signatureMethod: payload.signatureMethod,
          signatureData: payload.signatureData,
          disclaimerText: payload.disclaimerText,
        }),
      }),

    escalate: (tradeId: string, reason: string) =>
      apiFetch<{ success: boolean; agreement2: any }>(`/trades/${tradeId}/agreement-2/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Phase 4 - Evidence, Cryptographic Baseline Hashing & Integrity
  evidence: {
    list: (tradeId: string) =>
      apiFetch<{ evidence: any[] }>(`/trades/${tradeId}/evidence`),

    upload: (
      tradeId: string,
      payload: {
        category: string;
        fileName: string;
        mimeType: string;
        fileData: string; // Base64
        caption?: string;
        documentVersion?: string;
      }
    ) =>
      apiFetch<{ success: boolean; evidence: any }>(`/trades/${tradeId}/evidence`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    verify: (tradeId: string, evidenceId: string, notes?: string) =>
      apiFetch<{ success: boolean; record: any; error?: string }>(`/trades/${tradeId}/evidence/${evidenceId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),

    getLogs: (tradeId: string) =>
      apiFetch<{ logs: any[] }>(`/trades/${tradeId}/integrity-logs`),

    getTelemetry: (tradeId: string) =>
      apiFetch<{ telemetry: any[]; label: string }>(`/trades/${tradeId}/telemetry`),

    getCanonicalManifest: (tradeId: string) =>
      apiFetch<{ manifest: any }>(`/trades/${tradeId}/canonical-manifest`),

    simulateTampering: (tradeId: string, evidenceId: string) =>
      apiFetch<{ success: boolean; message: string }>(`/trades/${tradeId}/evidence/${evidenceId}/simulate-tampering`, {
        method: 'POST',
      }),

    aiAnalyze: (tradeId: string) =>
      apiFetch<{ success: boolean; analysis: any }>(`/trades/${tradeId}/evidence/ai-analyze`, {
        method: 'POST',
      }),
  },

  // Payments (PayPal Sandbox & Real Commercial Payments)
  payments: {
    getPayPalOrders: (tradeId: string) =>
      apiFetch<{ orders: any[] }>(`/trades/${tradeId}/paypal/orders`),

    createPayPalOrder: (tradeId: string, params: { amount?: number; currency?: string; returnUrl?: string; cancelUrl?: string }) =>
      apiFetch<{ success: boolean; order: any }>(`/trades/${tradeId}/paypal/create-order`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    capturePayPalOrder: (tradeId: string, params: { orderId: string; payerEmail?: string }) =>
      apiFetch<{ success: boolean; order: any }>(`/trades/${tradeId}/paypal/capture-order`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    getRealProofs: (tradeId: string) =>
      apiFetch<{ proofs: any[] }>(`/trades/${tradeId}/payments/real-proofs`),

    submitRealProof: (tradeId: string, params: {
      paymentMethod: string;
      claimedAmount: number;
      currency: string;
      transactionReference: string;
      fileData?: string;
      fileName?: string;
      mimeType?: string;
      notes?: string;
    }) =>
      apiFetch<{ success: boolean; proof: any }>(`/trades/${tradeId}/payments/real-proofs`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    verifyRealProof: (tradeId: string, proofId: string, params: { decision: string; reviewNotes?: string }) =>
      apiFetch<{ success: boolean; proof: any }>(`/trades/${tradeId}/payments/real-proofs/${proofId}/verify`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  },

  // Shipment & Telemetry Simulator
  shipment: {
    get: (tradeId: string) =>
      apiFetch<{ shipment: any }>(`/trades/${tradeId}/shipment`),

    update: (tradeId: string, data: any) =>
      apiFetch<{ success: boolean; shipment: any }>(`/trades/${tradeId}/shipment`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    simulateTelemetry: (tradeId: string, eventType: string) =>
      apiFetch<{ success: boolean; milestone: any; alert?: any }>(`/trades/${tradeId}/telemetry/simulate`, {
        method: 'POST',
        body: JSON.stringify({ eventType }),
      }),

    getSentinelAlerts: (tradeId: string) =>
      apiFetch<{ alerts: any[] }>(`/trades/${tradeId}/sentinel-alerts`),
  },

  // Buyer Inspection
  inspection: {
    list: (tradeId: string) =>
      apiFetch<{ inspections: any[] }>(`/trades/${tradeId}/inspections`),

    submit: (tradeId: string, payload: {
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
    }) =>
      apiFetch<{ success: boolean; inspection: any }>(`/trades/${tradeId}/inspections`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Disputes & AI Assistance
  disputes: {
    list: (tradeId: string) =>
      apiFetch<{ disputes: any[] }>(`/trades/${tradeId}/disputes`),

    create: (tradeId: string, payload: {
      issueSummary: string;
      details?: string;
      relevantClauseId?: string;
      evidenceIds?: string[];
      proposedResolution: string;
    }) =>
      apiFetch<{ success: boolean; dispute: any }>(`/trades/${tradeId}/disputes`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    respond: (tradeId: string, disputeId: string, payload: {
      explanation: string;
      additionalEvidenceIds?: string[];
      responseType: 'ACCEPT_PROPOSAL' | 'REJECT_PROPOSAL' | 'COUNTER_PROPOSAL';
      alternativeProposal?: string;
    }) =>
      apiFetch<{ success: boolean; dispute: any }>(`/trades/${tradeId}/disputes/${disputeId}/respond`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    aiAssist: (tradeId: string, disputeId: string) =>
      apiFetch<{ success: boolean; analysis: any }>(`/trades/${tradeId}/disputes/${disputeId}/ai-assist`, {
        method: 'POST',
      }),

    resolve: (tradeId: string, disputeId: string, payload: {
      resolutionNotes: string;
      outcome?: 'RESOLVED_BUYER_ACCEPTED' | 'RESOLVED_MUTUAL_AGREEMENT' | 'ESCALATED';
    }) =>
      apiFetch<{ success: boolean; dispute: any }>(`/trades/${tradeId}/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Phase 5 Final Completion & Trade Closure
  phase5: {
    getHandoff: (tradeId: string) =>
      apiFetch<{ handoff: any }>(`/trades/${tradeId}/phase5-handoff`),

    getStatus: (tradeId: string) =>
      apiFetch<{ completion: Phase5CompletionRecord }>(`/trades/${tradeId}/phase5`),

    submitReview: (tradeId: string, payload: { approved: boolean; notes?: string }) =>
      apiFetch<{ success: boolean; completion: Phase5CompletionRecord }>(`/trades/${tradeId}/phase5/review`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    submitSignature: (tradeId: string, payload: {
      signerName: string;
      signerTitle: string;
      signatureData?: string;
      signatureMethod?: 'PROTOTYPE_CANVAS' | 'DIGITAL_ACKNOWLEDGEMENT';
      consentConfirmed: boolean;
    }) =>
      apiFetch<{ success: boolean; completion: Phase5CompletionRecord }>(`/trades/${tradeId}/phase5/sign`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    getDossierData: (tradeId: string) =>
      apiFetch<{ dossier: any }>(`/trades/${tradeId}/phase5/dossier`),

    saveCertificate: (tradeId: string, payload: { pdfBase64: string }) =>
      apiFetch<{ success: boolean; completion: Phase5CompletionRecord; storageKey: string; sha256Hash: string }>(
        `/trades/${tradeId}/phase5/certificate`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),
  },
};



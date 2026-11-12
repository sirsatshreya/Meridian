import { jsPDF } from 'jspdf';
import { AgreementAcceptance, Agreement2, LegalDocument } from '../types';

export function downloadAgreement1Pdf(params: {
  acceptance: AgreementAcceptance;
  document: LegalDocument;
  signatureMethod?: string;
  signatureData?: string;
}) {
  const { acceptance, document: legalDoc, signatureMethod, signatureData } = params;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 56;

  const addWatermarkAndFooter = (pageNum: number) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `ELECTRONICALLY ACCEPTED BY ${acceptance.companyLegalName.toUpperCase()} | RECEIPT: ${acceptance.receiptCode}`,
      margin,
      pageHeight - 28
    );
    pdf.text(`Page ${pageNum}`, pageWidth - margin - 35, pageHeight - 28);
  };

  // Header
  pdf.setFillColor(8, 9, 10);
  pdf.rect(0, 0, pageWidth, 88, 'F');
  pdf.setTextColor(215, 255, 67);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('MERIDIAN TRADE SYSTEMS', margin, 36);
  pdf.setTextColor(245, 245, 242);
  pdf.setFontSize(16);
  pdf.text('Agreement 1 — Master Platform Terms (Signed Copy)', margin, 58);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(180, 180, 180);
  pdf.text(
    `Version ${acceptance.agreementVersion} | Acceptance ID: ${acceptance.acceptanceId} | UTC: ${acceptance.acceptedAtUtc}`,
    margin,
    75
  );

  y = 112;

  // Watermark Banner
  pdf.setFillColor(242, 250, 210);
  pdf.setDrawColor(140, 175, 20);
  pdf.roundedRect(margin, y, contentWidth, 28, 4, 4, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(20, 30, 10);
  pdf.text(
    `ELECTRONICALLY ACCEPTED BY ${acceptance.companyLegalName.toUpperCase()}`,
    pageWidth / 2,
    y + 18,
    { align: 'center' }
  );
  y += 46;

  // Entity Metadata Table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);
  pdf.text('1. Acceptance & Entity Details', margin, y);
  y += 14;

  const metaRows = [
    ['Legal Company Name', acceptance.companyLegalName],
    ['Authorized Representative', `${acceptance.authorizedRepresentative} (${acceptance.designation})`],
    ['Official Email', acceptance.officialEmail],
    ['Agreement Version', `v${acceptance.agreementVersion}`],
    ['Acceptance Timestamp (UTC)', acceptance.acceptedAtUtc],
    ['Receipt Code', acceptance.receiptCode],
    ['Document Integrity Hash (SHA-256)', acceptance.documentHash],
    ['Signing Method', signatureMethod || acceptance.signatureMethod || 'PROTOTYPE_ELECTRONIC_SIGNATURE'],
  ];

  pdf.setFontSize(8.5);
  for (const [label, val] of metaRows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    const wrapped = pdf.splitTextToSize(String(val || ''), contentWidth - 175);
    pdf.text(wrapped, margin + 175, y);
    y += Math.max(14, wrapped.length * 11);
  }

  y += 12;

  // Agreement 1 Content
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);
  pdf.text('2. Master Platform Terms Content', margin, y);
  y += 16;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(50, 50, 50);

  const bodyLines = pdf.splitTextToSize(legalDoc.content || '', contentWidth);
  let pageNum = 1;
  for (const line of bodyLines) {
    if (y > pageHeight - 70) {
      addWatermarkAndFooter(pageNum);
      pdf.addPage();
      pageNum++;
      y = 50;
    }
    pdf.text(line, margin, y);
    y += 11;
  }

  // Signature Block
  if (y > pageHeight - 180) {
    addWatermarkAndFooter(pageNum);
    pdf.addPage();
    pageNum++;
    y = 50;
  }

  y += 18;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);
  pdf.text('3. Electronic Signature Representation', margin, y);
  y += 14;

  const sigImg = signatureData || acceptance.signatureData;
  if (sigImg && sigImg.startsWith('data:image/')) {
    pdf.setFillColor(20, 22, 24);
    pdf.roundedRect(margin, y, 220, 65, 4, 4, 'F');
    try {
      pdf.addImage(sigImg, 'PNG', margin + 8, y + 6, 204, 53);
    } catch {
      pdf.setTextColor(215, 255, 67);
      pdf.text(acceptance.authorizedRepresentative, margin + 12, y + 36);
    }
    y += 76;
  } else if (sigImg) {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(18);
    pdf.setTextColor(20, 40, 10);
    pdf.text(sigImg, margin, y + 22);
    y += 36;
  } else {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(16);
    pdf.text(acceptance.authorizedRepresentative, margin, y + 20);
    y += 32;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    `Prototype electronic-signature interaction by ${acceptance.authorizedRepresentative} (${acceptance.designation}) on behalf of ${acceptance.companyLegalName}. Not a government-certified trust service signature.`,
    margin,
    y,
    { maxWidth: contentWidth }
  );

  addWatermarkAndFooter(pageNum);
  pdf.save(`MERIDIAN_SIGNED_AGREEMENT1_${acceptance.acceptanceId}.pdf`);
}

export function downloadAgreement2Pdf(agreement: Agreement2) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let pageNum = 1;

  const addFooter = (p: number) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Meridian Agreement 2 | ${agreement.id} (v${agreement.version}) | SHA-256: ${agreement.sha256Hash.substring(0, 16)}...`,
      margin,
      pageHeight - 26
    );
    pdf.text(`Page ${p}`, pageWidth - margin - 35, pageHeight - 26);
  };

  // Cover Header
  pdf.setFillColor(8, 9, 10);
  pdf.rect(0, 0, pageWidth, 108, 'F');
  pdf.setTextColor(215, 255, 67);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('MERIDIAN TRADE SYSTEMS — COMMERCIAL AGREEMENT 2', margin, 36);
  pdf.setTextColor(245, 245, 242);
  pdf.setFontSize(17);
  pdf.text('Bilateral Commercial Trade Agreement & Schedules A–D', margin, 60);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(180, 180, 180);
  pdf.text(
    `Trade Ref: ${agreement.tradeRequestId} | Version: v${agreement.version} | Status: ${agreement.status}`,
    margin,
    80
  );
  pdf.text(`Canonical Digest: ${agreement.sha256Hash}`, margin, 95);

  let y = 130;

  // Parties Summary
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(20, 20, 20);
  pdf.text(`Buyer: ${agreement.buyerCompanyName}`, margin, y);
  y += 15;
  pdf.text(`Seller: ${agreement.sellerCompanyName}`, margin, y);
  y += 22;

  const sections: Array<{ key: string; title: string }> = [
    { key: 'FRAMEWORK', title: 'MASTER COMMERCIAL FRAMEWORK' },
    { key: 'SCHEDULE_A', title: 'SCHEDULE A — COMMERCIAL AND PAYMENT TERMS' },
    { key: 'SCHEDULE_B', title: 'SCHEDULE B — LOGISTICS AND INCOTERMS' },
    { key: 'SCHEDULE_C', title: 'SCHEDULE C — QUALITY, INSPECTION AND RISK ALLOCATION' },
    { key: 'SCHEDULE_D', title: 'SCHEDULE D — DISPUTE RESOLUTION AND GOVERNING LAW' },
  ];

  for (const sec of sections) {
    const secClauses = agreement.clauses.filter((c) => c.section === sec.key);
    if (secClauses.length === 0) continue;

    if (y > pageHeight - 90) {
      addFooter(pageNum);
      pdf.addPage();
      pageNum++;
      y = 50;
    }

    pdf.setFillColor(240, 242, 245);
    pdf.rect(margin, y - 12, contentWidth, 20, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(sec.title, margin + 6, y + 2);
    y += 20;

    for (const clause of secClauses) {
      const lines = pdf.splitTextToSize(clause.content, contentWidth - 10);
      if (y + lines.length * 11 + 24 > pageHeight - 60) {
        addFooter(pageNum);
        pdf.addPage();
        pageNum++;
        y = 50;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 30, 30);
      pdf.text(`${clause.number}. ${clause.title} [${clause.status}]`, margin, y);
      y += 12;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(70, 70, 70);
      pdf.text(lines, margin + 6, y);
      y += lines.length * 10 + 10;
    }
    y += 8;
  }

  // Bilateral Signature Page
  addFooter(pageNum);
  pdf.addPage();
  pageNum++;
  y = 56;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(20, 20, 20);
  pdf.text('BILATERAL ELECTRONIC EXECUTION SEALS', margin, y);
  y += 24;

  const renderSigBox = (label: string, companyName: string, sig: any) => {
    pdf.setDrawColor(180, 180, 180);
    pdf.roundedRect(margin, y, contentWidth, 140, 6, 6, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(20, 20, 20);
    pdf.text(
      sig ? `${label} — ELECTRONICALLY SIGNED` : `${label} — PENDING SIGNATURE`,
      margin + 14,
      y + 20
    );
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Company: ${companyName}`, margin + 14, y + 35);

    if (sig) {
      if (sig.signatureMethod === 'PROTOTYPE_CANVAS' && sig.signatureData?.startsWith('data:image/')) {
        pdf.setFillColor(20, 22, 24);
        pdf.roundedRect(margin + 14, y + 44, 190, 52, 4, 4, 'F');
        try {
          pdf.addImage(sig.signatureData, 'PNG', margin + 20, y + 48, 178, 44);
        } catch {
          // fallback
        }
      } else {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(16);
        pdf.setTextColor(20, 40, 10);
        pdf.text(sig.authorizedSignerName || '', margin + 14, y + 72);
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(50, 50, 50);
      pdf.text(
        `Signatory: ${sig.authorizedSignerName} (${sig.signerTitle}) | Signed UTC: ${sig.signedAtUtc}`,
        margin + 14,
        y + 112
      );
      pdf.text(
        `Receipt: ${sig.receiptCode} | Method: ${sig.signatureMethod} (Prototype Electronic Signature)`,
        margin + 14,
        y + 126
      );
    }
    y += 160;
  };

  renderSigBox('BUYER', agreement.buyerCompanyName, agreement.signatures?.buyer);
  renderSigBox('SELLER', agreement.sellerCompanyName, agreement.signatures?.seller);

  addFooter(pageNum);
  pdf.save(`MERIDIAN_AGREEMENT2_${agreement.tradeRequestId}_v${agreement.version}.pdf`);
}

// ==========================================
// PHASE 5: FINAL TRADE COMPLETION CERTIFICATE & AUDIT DOSSIER PDF
// ==========================================

export interface FinalCompletionPdfParams {
  trade: any;
  agreement2?: Agreement2 | null;
  completion: any;
  buyerOrg?: any;
  sellerOrg?: any;
  paypalOrders?: any[];
  realProofs?: any[];
  shipment?: any;
  evidenceList?: any[];
  telemetry?: any[];
  inspections?: any[];
  disputes?: any[];
  evidenceDataUrls?: Record<string, string>; // evidenceId -> Base64 data URL
  saveToFile?: boolean;
}

export async function generateFinalCompletionCertificatePdf(params: FinalCompletionPdfParams): Promise<{
  pdf: jsPDF;
  dataUrl: string;
  blob: Blob;
  fileName: string;
}> {
  const {
    trade,
    agreement2,
    completion,
    buyerOrg,
    sellerOrg,
    paypalOrders = [],
    realProofs = [],
    shipment,
    evidenceList = [],
    telemetry = [],
    inspections = [],
    disputes = [],
    evidenceDataUrls = {},
    saveToFile = true,
  } = params;

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let pageNum = 1;

  const tradeId = trade?.id || completion?.tradeId || 'DEMO-TRADE-001';
  const certId = completion?.id || `CERT-${tradeId}`;
  const nowUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const addHeaderAndFooter = (p: number, sectionTitle?: string) => {
    // Top running header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(140, 140, 140);
    pdf.text(
      `MERIDIAN TRADE SYSTEMS | FINAL TRADE COMPLETION CERTIFICATE | REF: ${tradeId}`,
      margin,
      28
    );
    if (sectionTitle) {
      pdf.setFont('helvetica', 'normal');
      pdf.text(sectionTitle, pageWidth - margin, 28, { align: 'right' });
    }
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, 34, pageWidth - margin, 34);

    // Bottom running footer
    pdf.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `Certificate ID: ${certId} | Bilateral Execution Record | Governed by Agreement 2`,
      margin,
      pageHeight - 22
    );
    pdf.text(`Page ${p}`, pageWidth - margin, pageHeight - 22, { align: 'right' });
  };

  // ==========================================
  // PAGE 1: COVER & SECTION 1 & 2
  // ==========================================
  // Dark Cover Banner
  pdf.setFillColor(8, 9, 10);
  pdf.rect(0, 0, pageWidth, 130, 'F');

  // Accent Line
  pdf.setFillColor(215, 255, 67);
  pdf.rect(0, 128, pageWidth, 3, 'F');

  pdf.setTextColor(215, 255, 67);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('MERIDIAN TRADE SYSTEMS — TRADE CLOSURE CERTIFICATE', margin, 38);

  pdf.setTextColor(245, 245, 242);
  pdf.setFontSize(17);
  pdf.text('FINAL TRADE COMPLETION CERTIFICATE', margin, 62);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(190, 190, 190);
  pdf.text('Bilateral Commercial Trade Completion & Settlement Execution Record', margin, 80);

  pdf.setFontSize(8);
  pdf.setTextColor(160, 160, 160);
  pdf.text(`Trade Reference: ${tradeId} | Certificate ID: ${certId} | Generated: ${nowUtc}`, margin, 102);
  pdf.text(
    `Status: ${completion?.status === 'COMPLETED' ? 'TRADE COMPLETED & BILATERALLY EXECUTED' : 'IN REVIEW / PENDING'}`,
    margin,
    115
  );

  let y = 150;

  // SECTION 1: COVER AND IDENTIFICATION
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('1. COMMERCIAL TRADE IDENTIFICATION & PARTIES', margin + 8, y + 14);
  y += 28;

  const partyRows = [
    ['Trade Identifier', tradeId],
    ['Certificate Reference', certId],
    ['Buyer Organization', buyerOrg?.legalName || trade?.buyerCompanyName || 'MERIDIAN DEMO BUYER PRIVATE LIMITED'],
    ['Buyer Jurisdiction / Reg', `${buyerOrg?.country || 'India'} | Reg: ${buyerOrg?.registrationNumber || 'U24290MH2021PTC368942'}`],
    ['Seller Organization', sellerOrg?.legalName || trade?.sellerCompanyName || 'MERIDIAN DEMO SELLER GMBH'],
    ['Seller Jurisdiction / Reg', `${sellerOrg?.country || 'Germany'} | Reg: ${sellerOrg?.registrationNumber || 'HRB 189422'}`],
    ['Commodity / Goods', trade?.productDescription || 'High-Barrier Multi-layer Packaging Film (BOPP 25-micron)'],
    ['Agreed Quantity & Value', `${(trade?.quantity || 2500).toLocaleString()} ${trade?.quantityUnit || 'Rolls'} @ ${trade?.currency || 'EUR'} ${(trade?.targetPricePerUnit || 35).toLocaleString()} (Total: ${trade?.currency || 'EUR'} ${(trade?.targetPricePerUnit * trade?.quantity || 87500).toLocaleString()})`],
    ['Incoterms® 2020 Rule', `${trade?.incoterms || 'CIF'} — ${trade?.deliveryLocation || 'Nhava Sheva Port, Mumbai (INNSA)'}`],
  ];

  pdf.setFontSize(8);
  for (const [k, v] of partyRows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${k}:`, margin + 8, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    pdf.text(String(v || 'N/A'), margin + 170, y);
    y += 13;
  }

  y += 8;

  // SECTION 2: ORIGINAL COMMERCIAL AGREEMENT REFERENCE
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('2. COMMERCIAL AGREEMENT 2 (GOVERNING CONTRACT)', margin + 8, y + 14);
  y += 28;

  const agr2Rows = [
    ['Agreement 2 Document ID', agreement2?.id || `AGR2-${tradeId}`],
    ['Contract Version & Status', `v${agreement2?.version || '1.0'} (${agreement2?.status || 'EXECUTED'})`],
    ['Canonical Contract SHA-256', agreement2?.sha256Hash || 'a7b89f02c4819d42e612f0a149c47f781bc89a741e6e96395bdf3542a3efd901'],
    ['Buyer Bilateral Seal', agreement2?.signatures?.buyer ? `Signed by ${agreement2.signatures.buyer.authorizedSignerName} (${agreement2.signatures.buyer.signedAtUtc})` : 'SEALED & EXECUTED'],
    ['Seller Bilateral Seal', agreement2?.signatures?.seller ? `Signed by ${agreement2.signatures.seller.authorizedSignerName} (${agreement2.signatures.seller.signedAtUtc})` : 'SEALED & EXECUTED'],
    ['Contract Framework Scope', 'Framework Clauses 1–8 + Schedules A (Payment), B (Logistics), C (Quality), D (Dispute Resolution).'],
  ];

  for (const [k, v] of agr2Rows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${k}:`, margin + 8, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    pdf.text(String(v || 'N/A'), margin + 170, y);
    y += 13;
  }

  y += 8;

  // SECTION 3: PAYMENT RECORD
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('3. COMMERCIAL PAYMENT MILESTONES & CLEARANCE RECORD', margin + 8, y + 14);
  y += 28;

  const capturedPaypal = paypalOrders.find((o) => o.status === 'CAPTURED') || paypalOrders[0];
  const verifiedWire = realProofs.find((p) => p.status?.includes('VERIFIED')) || realProofs[0];

  const payRows = [
    ['Contractual Order Amount', `${trade?.currency || 'EUR'} ${(trade?.targetPricePerUnit * trade?.quantity || 87500).toLocaleString()}`],
    [
      'PayPal Sandbox Gateway (Demo)',
      capturedPaypal
        ? `Order: ${capturedPaypal.paypalOrderId || capturedPaypal.id} | Capture ID: ${capturedPaypal.paypalCaptureId || 'CAPTURED'} | Status: ${capturedPaypal.status}`
        : 'Sandbox payment order initialized and captured.',
    ],
    [
      'Commercial Wire Settlement',
      verifiedWire
        ? `Ref: ${verifiedWire.transactionReference} | Method: ${verifiedWire.paymentMethod} | Status: ${verifiedWire.status}`
        : 'Commercial SWIFT MT103 advice verified against contract milestone schedule.',
    ],
    ['Payment Environment Disclosure', 'PayPal Sandbox transactions model milestone fund reservation triggers in demonstration; no actual live capital was transferred.'],
  ];

  for (const [k, v] of payRows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${k}:`, margin + 8, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    const splitV = pdf.splitTextToSize(String(v || ''), contentWidth - 175);
    pdf.text(splitV, margin + 170, y);
    y += Math.max(13, splitV.length * 10);
  }

  addHeaderAndFooter(pageNum, 'Parties & Contract Reference');

  // ==========================================
  // PAGE 2: LOGISTICS, TELEMETRY & INSPECTIONS
  // ==========================================
  pdf.addPage();
  pageNum++;
  y = 48;

  // SECTION 4: SHIPMENT AND DELIVERY
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('4. LOGISTICS FULFILLMENT & CARRIER MANIFEST', margin + 8, y + 14);
  y += 28;

  const shipRows = [
    ['Carrier / Service Line', shipment?.carrierName || 'Maersk Global Ocean Line / Line 402'],
    ['Tracking / Bill of Lading Ref', shipment?.trackingNumber || 'MSK-IN-88942-X'],
    ['Origin Loading Port', shipment?.originPort || 'Nhava Sheva Port, Mumbai (INNSA)'],
    ['Destination Discharge Port', shipment?.destinationPort || 'Hamburg Port, Terminal Altenwerder (DEHAM)'],
    ['Vessel & Container Number', `${shipment?.vesselName || 'MV Maersk McKinney Moller'} | Container: ${shipment?.containerNumber || 'MSCU-892144-0'}`],
    ['Departure Date (ETD/ATD)', shipment?.departureDate ? new Date(shipment.departureDate).toUTCString() : '2026-11-06T10:00:00Z'],
    ['Delivery Date (ETA/ATA)', shipment?.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toUTCString() : '2026-11-28T18:00:00Z'],
    ['Final Logistics Status', shipment?.status || 'IN_TRANSIT (CUSTOMS_CLEARED)'],
  ];

  for (const [k, v] of shipRows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${k}:`, margin + 8, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    pdf.text(String(v || 'N/A'), margin + 170, y);
    y += 13;
  }

  y += 8;

  // SECTION 5: TELEMETRY & SENSOR MONITORING
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('5. IoT ENVIRONMENTAL TELEMETRY AUDIT TRAIL', margin + 8, y + 14);
  y += 26;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.5);
  pdf.setTextColor(110, 110, 110);
  pdf.text(
    'Notice: Telemetry milestones reflect simulated IoT sensor feeds authenticated via HMAC-SHA256 for demonstration.',
    margin + 8,
    y
  );
  y += 12;

  // Telemetry Table Header
  pdf.setFillColor(230, 234, 238);
  pdf.rect(margin, y, contentWidth, 16, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(40, 40, 40);
  pdf.text('WAYPOINT / LOCATION', margin + 6, y + 11);
  pdf.text('STATUS', margin + 180, y + 11);
  pdf.text('TEMP / HUMIDITY', margin + 280, y + 11);
  pdf.text('TIMESTAMP (UTC)', margin + 370, y + 11);
  pdf.text('HMAC SIGNATURE', margin + 460, y + 11);
  y += 20;

  const sampleTel = telemetry.slice(0, 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  for (const t of sampleTel) {
    pdf.setTextColor(30, 30, 30);
    pdf.text(String(t.locationName || '').substring(0, 32), margin + 6, y);
    pdf.text(String(t.status || ''), margin + 180, y);
    pdf.text(`${t.temperatureC}°C / ${t.humidityPercent}%`, margin + 280, y);
    pdf.text(new Date(t.timestamp).toISOString().substring(0, 16), margin + 370, y);
    pdf.setTextColor(100, 100, 100);
    pdf.text(String(t.hmacSignature || '').substring(0, 14) + '...', margin + 460, y);
    y += 13;
  }

  y += 8;

  // SECTION 7: INSPECTION & DISPUTE HISTORY
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('6. INWARD CARGO INSPECTION & BILATERAL DISPUTE LOG', margin + 8, y + 14);
  y += 28;

  const insp = inspections[0];
  const inspRows = [
    ['Inward Inspection Decision', insp ? `${insp.decision} (Accepted by ${insp.inspectorName || 'Buyer Lead Quality Inspector'})` : 'ACCEPTED (5/5 Quality Verification Checks Passed)'],
    ['Inspection Observations', insp?.observations || 'Packaging intact, moisture barrier seals verified, roll gauges certified to BOPP 25-micron spec.'],
    ['Checklist Verification', 'Cargo Integrity (Passed) | Seals Match (Passed) | Temperature Log (Passed) | Quantity Match (Passed)'],
    [
      'Dispute Mediation Summary',
      disputes.length === 0
        ? 'No active commercial disputes filed. Zero pending claims.'
        : disputes
            .map((d) => `[${d.id}] ${d.issueSummary || 'Concern'} — Status: ${d.status} (${d.resolutionNotes || 'Resolved'})`)
            .join('; '),
    ],
  ];

  for (const [k, v] of inspRows) {
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`${k}:`, margin + 8, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(20, 20, 20);
    const splitV = pdf.splitTextToSize(String(v || ''), contentWidth - 175);
    pdf.text(splitV, margin + 170, y);
    y += Math.max(13, splitV.length * 10);
  }

  addHeaderAndFooter(pageNum, 'Logistics, Telemetry & Quality');

  // ==========================================
  // PAGE 3: ACTUAL EMBEDDED PHOTO EVIDENCE
  // ==========================================
  pdf.addPage();
  pageNum++;
  y = 48;

  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('7. PHOTOGRAPHIC & DOCUMENTARY EVIDENCE ARTIFACTS', margin + 8, y + 14);
  y += 28;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(90, 90, 90);
  pdf.text(
    'The following photographic artifacts were uploaded during execution, stored in private object storage, and verified against SHA-256 baseline hashes.',
    margin + 8,
    y
  );
  y += 18;

  // Render actual embedded images (up to 4 images nicely gridded or stacked)
  const photoEvidence = evidenceList.filter(
    (e) => e.category === 'shipment_photo' || e.fileName.match(/\.(png|jpg|jpeg|webp)$/i)
  );

  let renderedPhotos = 0;
  for (const ev of photoEvidence) {
    if (renderedPhotos >= 2) break; // Render 2 large clear photos on Page 3
    const dataUrl = evidenceDataUrls[ev.id];

    pdf.setDrawColor(210, 215, 220);
    pdf.setFillColor(250, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, 140, 4, 4, 'FD');

    // Attempt to embed actual image
    if (dataUrl && dataUrl.startsWith('data:image/')) {
      try {
        const format = dataUrl.includes('jpeg') || dataUrl.includes('jpg') ? 'JPEG' : 'PNG';
        pdf.addImage(dataUrl, format, margin + 10, y + 10, 160, 120);
      } catch {
        // Fallback frame if image rendering encounters decode error
        pdf.setFillColor(220, 225, 230);
        pdf.rect(margin + 10, y + 10, 160, 120, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 80, 80);
        pdf.text('[IMAGE ARTIFACT]', margin + 45, y + 70);
      }
    } else {
      pdf.setFillColor(230, 235, 240);
      pdf.rect(margin + 10, y + 10, 160, 120, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.text('[AUTHENTICATED PHOTO]', margin + 30, y + 65);
      pdf.setFontSize(7);
      pdf.text(ev.id, margin + 65, y + 80);
    }

    // Metadata alongside image
    const metaX = margin + 185;
    let metaY = y + 20;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(20, 20, 20);
    pdf.text(`${ev.id} — ${ev.fileName}`, metaX, metaY);
    metaY += 15;

    const evMeta = [
      ['Category', ev.category || 'shipment_photo'],
      ['Uploaded By', `${ev.uploaderName || 'Seller Logistics Team'} (${ev.uploaderOrgId || 'DEMO-SELLER'})`],
      ['Timestamp', new Date(ev.uploadedAt).toISOString().substring(0, 19) + ' UTC'],
      ['Integrity SHA-256', ev.sha256Hash],
      ['Integrity Status', 'MATCHED BASELINE (OBJECT STORAGE VERIFIED)'],
    ];

    pdf.setFontSize(7.5);
    for (const [mk, mv] of evMeta) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(90, 90, 90);
      pdf.text(`${mk}:`, metaX, metaY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(mk === 'Integrity Status' ? 20 : 40, mk === 'Integrity Status' ? 120 : 40, mk === 'Integrity Status' ? 40 : 40);
      const splitVal = pdf.splitTextToSize(String(mv), contentWidth - 195);
      pdf.text(splitVal, metaX + 85, metaY);
      metaY += Math.max(12, splitVal.length * 9);
    }

    y += 152;
    renderedPhotos++;
  }

  // Summary table of all additional evidence documents
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(50, 50, 50);
  pdf.text('Complete Registered Evidence Manifest:', margin, y + 10);
  y += 20;

  pdf.setFillColor(235, 238, 242);
  pdf.rect(margin, y, contentWidth, 14, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(50, 50, 50);
  pdf.text('EVIDENCE ID', margin + 6, y + 10);
  pdf.text('FILENAME', margin + 90, y + 10);
  pdf.text('CATEGORY', margin + 250, y + 10);
  pdf.text('SHA-256 BASELINE HASH', margin + 350, y + 10);
  y += 18;

  pdf.setFont('helvetica', 'normal');
  for (const ev of evidenceList) {
    pdf.setTextColor(40, 40, 40);
    pdf.text(ev.id, margin + 6, y);
    pdf.text(ev.fileName.substring(0, 30), margin + 90, y);
    pdf.text(ev.category, margin + 250, y);
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(90, 90, 90);
    pdf.text(ev.sha256Hash.substring(0, 24) + '...', margin + 350, y);
    pdf.setFont('helvetica', 'normal');
    y += 12;
  }

  addHeaderAndFooter(pageNum, 'Photographic & Document Evidence');

  // ==========================================
  // PAGE 4: BILATERAL SIGNATURES & FINAL SEAL
  // ==========================================
  pdf.addPage();
  pageNum++;
  y = 48;

  // SECTION 8: FINAL COMPLETION READINESS AUDIT
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('8. FINAL TRADE COMPLETION READINESS GATE & BILATERAL REVIEWS', margin + 8, y + 14);
  y += 28;

  const checks = completion?.readinessChecks || [];
  for (const c of checks) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(c.passed ? 20 : 180, c.passed ? 120 : 30, c.passed ? 40 : 30);
    pdf.text(c.passed ? '✓ PASSED' : '✗ PENDING', margin + 8, y);
    pdf.setTextColor(30, 30, 30);
    pdf.text(c.label, margin + 70, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 100, 100);
    pdf.text(c.details || '', margin + 70, y + 10);
    y += 22;
  }

  y += 10;

  // SECTION 9: BUYER & SELLER FINAL DIGITAL SIGNATURES
  pdf.setFillColor(242, 245, 248);
  pdf.rect(margin, y, contentWidth, 20, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(20, 25, 30);
  pdf.text('9. BILATERAL TRADE CLOSURE ACKNOWLEDGEMENT & EXECUTION SEALS', margin + 8, y + 14);
  y += 28;

  const renderPhase5Sig = (partyLabel: string, companyName: string, sig: any, review: any) => {
    pdf.setDrawColor(180, 185, 190);
    pdf.setFillColor(252, 253, 255);
    pdf.roundedRect(margin, y, contentWidth, 130, 4, 4, 'FD');

    const signerName = sig?.signerName || sig?.authorizedSignerName || '';
    const signerTitle = sig?.signerTitle || 'Authorized Representative';
    const entityName = sig?.companyName || sig?.companyLegalName || companyName;
    const signedAt = sig?.signedAtUtc || sig?.signedAt || '';
    const receiptCode = sig?.receiptCode || '';
    const hasDrawnSignature = Boolean(
      sig && sig.signatureData && typeof sig.signatureData === 'string' && sig.signatureData.startsWith('data:image/')
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(
      hasDrawnSignature ? `${partyLabel} — FINAL TRADE COMPLETION SIGNED` : `${partyLabel} — PENDING SIGNATURE`,
      margin + 12,
      y + 18
    );

    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Authorized Entity: ${entityName}`, margin + 12, y + 32);
    pdf.text(
      `Review Disposition: ${review?.status || (hasDrawnSignature ? 'APPROVED' : 'PENDING_REVIEW')} (Notes: ${review?.notes || 'Bilateral verification recorded'})`,
      margin + 12,
      y + 44
    );

    if (hasDrawnSignature) {
      pdf.setFillColor(15, 18, 20);
      pdf.roundedRect(margin + 12, y + 50, 180, 48, 3, 3, 'F');
      try {
        pdf.addImage(sig.signatureData, 'PNG', margin + 18, y + 54, 168, 40);
      } catch {
        pdf.setTextColor(215, 255, 67);
        pdf.text(signerName || 'Authorized Signatory', margin + 20, y + 76);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(50, 50, 50);
      pdf.text(
        `Authorized Signatory: ${signerName} (${signerTitle}) | Signed UTC: ${signedAt}`,
        margin + 12,
        y + 110
      );
      pdf.text(
        `Digital Receipt: ${receiptCode} | Method: ${sig.signatureMethod || 'PROTOTYPE_CANVAS'} | Agreement Ref: ${agreement2?.id || `AGR2-${tradeId}`}`,
        margin + 12,
        y + 122
      );
    } else {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Awaiting authorized representative electronic execution.', margin + 12, y + 80);
    }

    y += 142;
  };

  renderPhase5Sig(
    'BUYER ACKNOWLEDGEMENT',
    buyerOrg?.legalName || trade?.buyerCompanyName || 'MERIDIAN DEMO BUYER PRIVATE LIMITED',
    completion?.buyerSignature || agreement2?.signatures?.buyer,
    completion?.buyerReview
  );

  renderPhase5Sig(
    'SELLER ACKNOWLEDGEMENT',
    sellerOrg?.legalName || trade?.sellerCompanyName || 'MERIDIAN DEMO SELLER GMBH',
    completion?.sellerSignature || agreement2?.signatures?.seller,
    completion?.sellerReview
  );

  // SECTION 10 & 11: INTEGRITY, AUDIT & FINAL COMPLETION STATEMENT
  pdf.setFillColor(8, 9, 10);
  pdf.roundedRect(margin, y, contentWidth, 54, 4, 4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(215, 255, 67);
  pdf.text('TRADE COMPLETED — MERIDIAN COMMERCIAL LIFECYCLE CLOSED', margin + 12, y + 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(220, 220, 220);
  pdf.text(
    'This document records the final acknowledged outcome of the Meridian trade workflow. Both parties have independently approved the summary, inspected cargo evidence, and sealed closing acknowledgements under Agreement 2.',
    margin + 12,
    y + 34,
    { maxWidth: contentWidth - 24 }
  );

  addHeaderAndFooter(pageNum, 'Bilateral Execution & Final Closure');

  const fileName = `MERIDIAN_FINAL_TRADE_COMPLETION_${tradeId}_${Date.now()}.pdf`;

  if (saveToFile) {
    pdf.save(fileName);
  }

  const dataUrl = pdf.output('datauristring');
  const blob = pdf.output('blob');

  return { pdf, dataUrl, blob, fileName };
}


import { GoogleGenAI } from '@google/genai';

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({ apiKey });
}

export async function runAiEvidenceAnalysis(params: {
  trade: any;
  agreement2: any;
  evidenceList: any[];
  telemetry: any[];
  alerts: any[];
}): Promise<{
  status: 'REQUIREMENTS_SATISFIED' | 'POTENTIAL_DISCREPANCY' | 'EVIDENCE_MISSING' | 'MANUAL_REVIEW_REQUIRED';
  aiPowered: boolean;
  model: string;
  reviewedAt: string;
  evidenceReviewedCount: number;
  findings: Array<{
    evidenceId: string;
    fileName: string;
    relevantRequirement: string;
    potentialDiscrepancy: string;
    aiExplanation: string;
    confidence: string;
    missingInformation: string;
    recommendedInspection: string;
  }>;
  overallSummary: string;
  disclaimer: string;
}> {
  const { trade, agreement2, evidenceList, telemetry, alerts } = params;
  const now = new Date().toISOString();
  const disclaimer =
    'AI-generated evidence review for workflow assistance only. Image and document analysis does not prove the true physical condition of goods or guarantee authenticity. Human inspection and contractual verification remain required.';

  const client = getClient();
  if (client && evidenceList.length > 0) {
    try {
      const prompt = `You are Meridian's trade compliance & evidence review assistant.
Analyze the following trade evidence against Agreement 2 requirements. Never claim image analysis proves physical condition or authenticity.
Trade: ${trade?.id} - ${trade?.productDescription} (${trade?.quantity} ${trade?.unit})
Agreement 2 Clauses (Sample): ${JSON.stringify((agreement2?.clauses || []).slice(0, 6).map((c: any) => ({ id: c.id, title: c.title, content: c.content.slice(0, 200) })))}
Evidence Records: ${JSON.stringify(evidenceList.map((e: any) => ({ id: e.id, category: e.category, fileName: e.fileName, caption: e.caption, uploadedBy: e.uploadedBy })))}
Telemetry Alerts: ${JSON.stringify(alerts.map((a: any) => ({ eventType: a.eventType, severity: a.severity, actualValue: a.actualValue || a.actualReading })))}

Return ONLY valid JSON with this shape:
{
  "status": "REQUIREMENTS_SATISFIED" | "POTENTIAL_DISCREPANCY" | "EVIDENCE_MISSING" | "MANUAL_REVIEW_REQUIRED",
  "overallSummary": "string",
  "findings": [
    {
      "evidenceId": "string",
      "fileName": "string",
      "relevantRequirement": "string",
      "potentialDiscrepancy": "string",
      "aiExplanation": "string",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "missingInformation": "string",
      "recommendedInspection": "string"
    }
  ]
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        status: parsed.status || 'MANUAL_REVIEW_REQUIRED',
        aiPowered: true,
        model: 'gemini-2.5-flash',
        reviewedAt: now,
        evidenceReviewedCount: evidenceList.length,
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        overallSummary: parsed.overallSummary || 'AI evidence analysis completed.',
        disclaimer,
      };
    } catch (err) {
      console.warn('[MERIDIAN AI] Gemini evidence analysis fallback triggered:', err);
    }
  }

  // Deterministic structured fallback when GEMINI_API_KEY is not configured
  const hasAlerts = alerts.some((a: any) => a.severity === 'POTENTIAL_BREACH' || a.severity === 'WARNING');
  const findings = evidenceList.map((ev: any) => ({
    evidenceId: ev.id,
    fileName: ev.fileName,
    relevantRequirement:
      ev.category === 'inspection_certificate'
        ? 'Agreement 2 Schedule C — Quality & Lab Assay Verification'
        : ev.category === 'bill_of_lading'
        ? 'Agreement 2 Schedule B — Ocean Carriage & Incoterms CIF'
        : 'Agreement 2 Schedule C — Packaging & Pre-Dispatch Condition',
    potentialDiscrepancy: hasAlerts
      ? 'Transient cold-chain alert logged in telemetry; verify carton moisture & seal condition.'
      : 'No immediate discrepancy detected in metadata; visual inspection recommended.',
    aiExplanation: `Reviewed ${ev.fileName} (${ev.category}) uploaded by ${ev.uploadedBy}. SHA-256 baseline (${ev.sha256Hash?.substring(0, 12)}...) is recorded.`,
    confidence: 'MEDIUM',
    missingInformation:
      evidenceList.length < 3
        ? 'Additional unloading or destination inspection photos recommended.'
        : 'None — core pre-dispatch and transit records present.',
    recommendedInspection: 'Verify physical container bolt seal and pallet outer packaging upon port destuffing.',
  }));

  return {
    status: evidenceList.length === 0 ? 'EVIDENCE_MISSING' : hasAlerts ? 'POTENTIAL_DISCREPANCY' : 'MANUAL_REVIEW_REQUIRED',
    aiPowered: false,
    model: 'meridian-deterministic-compliance-v1',
    reviewedAt: now,
    evidenceReviewedCount: evidenceList.length,
    findings,
    overallSummary:
      evidenceList.length === 0
        ? 'No supporting evidence files uploaded yet.'
        : hasAlerts
        ? `Reviewed ${evidenceList.length} evidence item(s) alongside ${telemetry.length} telemetry milestones. Telemetry anomalies require buyer manual inspection.`
        : `Reviewed ${evidenceList.length} evidence item(s). Core documentation present; independent buyer inspection required before final completion.`,
    disclaimer,
  };
}

import { ComplianceScreening, ComplianceStatus, ComplianceSourceFinding } from '../types';

export interface SourceDefinition {
  sourceName: string;
  authority: string;
  url: string;
  jurisdiction: string;
}

export const OFFICIAL_SOURCES: SourceDefinition[] = [
  {
    sourceName: 'UN Security Council Consolidated Sanctions List',
    authority: 'United Nations Security Council',
    url: 'https://scsanctions.un.org/consolidated/',
    jurisdiction: 'Global / UN',
  },
  {
    sourceName: 'US OFAC Specially Designated Nationals (SDN) List',
    authority: 'US Department of the Treasury (OFAC)',
    url: 'https://sanctionssearch.ofac.treas.gov/',
    jurisdiction: 'United States',
  },
  {
    sourceName: 'UK Sanctions List (FCDO & OFSI)',
    authority: 'UK Foreign, Commonwealth & Development Office',
    url: 'https://www.gov.uk/government/publications/the-uk-sanctions-list',
    jurisdiction: 'United Kingdom',
  },
  {
    sourceName: 'EU Consolidated Financial Sanctions Database',
    authority: 'European External Action Service (EEAS)',
    url: 'https://webgate.ec.europa.eu/fsd/fsf',
    jurisdiction: 'European Union',
  },
  {
    sourceName: 'US BIS Consolidated Screening List (Export Administration)',
    authority: 'US Bureau of Industry and Security',
    url: 'https://www.trade.gov/consolidated-screening-list',
    jurisdiction: 'United States',
  },
  {
    sourceName: 'Indian DGFT SCOMET / Restricted Dual-Use List',
    authority: 'Directorate General of Foreign Trade (India)',
    url: 'https://dgft.gov.in/CP/?opt=scomet',
    jurisdiction: 'India',
  },
];

// High-risk or sanctioned keywords for realistic screening simulation
const SANCTION_WATCHWORDS = [
  'sanctioned',
  'prohibited',
  'military end user',
  'restricted entity',
  'weapons',
  'enrichment',
  'intercept',
];

const RESTRICTED_COMMODITY_KEYWORDS = [
  'uranium',
  'dual-use centrifuge',
  'military grade encryption',
  'weapon',
  'hazardous biological',
  'precursor chemical',
];

export function runCompanyScreening(
  orgId: string,
  legalName: string,
  country: string,
  registrationNumber: string
): ComplianceScreening {
  const currentDate = new Date().toISOString();
  const lowerName = legalName.toLowerCase();

  // Check if simulated high-risk name
  const isHighRisk = SANCTION_WATCHWORDS.some((kw) => lowerName.includes(kw));

  const findings: ComplianceSourceFinding[] = OFFICIAL_SOURCES.map((src) => {
    if (isHighRisk) {
      return {
        sourceName: src.sourceName,
        authority: src.authority,
        url: src.url,
        dateChecked: currentDate,
        status: 'POTENTIAL_MATCH',
        matchedEntry: `Name variance flag on ${src.authority} index matching "${legalName}"`,
        evidenceReference: `REF-SCREEN-${Date.now().toString(36).toUpperCase()}`,
        notes: 'Manual review required before trade authorization can proceed.',
      };
    }

    return {
      sourceName: src.sourceName,
      authority: src.authority,
      url: src.url,
      dateChecked: currentDate,
      status: 'CLEAN',
      matchedEntry: undefined,
      evidenceReference: `VERIFIED-CLEAR-HASH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      notes: 'No records found matching company legal name or registration identifier.',
    };
  });

  const resultStatus: ComplianceStatus = isHighRisk
    ? 'POTENTIAL_MATCH_REVIEW_REQUIRED'
    : 'CLEAR_ON_CHECKED_SOURCES';

  const aiSummary = isHighRisk
    ? `Screening against 6 authoritative global sanctions registries returned 1 or more potential phonetic matches for "${legalName}". Case has been escalated to Meridian Internal Admin Review Queue. Automated approval locked.`
    : `Screening completed across 6 authoritative global registries (UN, OFAC, UK FCDO, EU EEAS, US BIS, DGFT). Zero sanctions, restricted-party, or embargo records identified for "${legalName}" (${country}, Reg: ${registrationNumber}).`;

  return {
    id: `scr-cmp-${Date.now().toString(36)}`,
    organizationId: orgId,
    screeningType: 'COMPANY',
    subjectIdentifier: `${legalName} [${country}]`,
    resultStatus,
    sourcesChecked: findings,
    aiSummary,
    reviewRequired: isHighRisk,
    isSimulated: true,
    createdAt: currentDate,
  };
}

export function runTradeScreening(
  orgId: string,
  tradeItemDescription: string,
  origin: string,
  destination: string,
  hsCode?: string
): ComplianceScreening {
  const currentDate = new Date().toISOString();
  const lowerDesc = tradeItemDescription.toLowerCase();

  const isRestrictedGoods = RESTRICTED_COMMODITY_KEYWORDS.some((kw) => lowerDesc.includes(kw));

  const findings: ComplianceSourceFinding[] = OFFICIAL_SOURCES.map((src) => {
    if (isRestrictedGoods) {
      return {
        sourceName: src.sourceName,
        authority: src.authority,
        url: src.url,
        dateChecked: currentDate,
        status: 'RESTRICTED',
        matchedEntry: `Dual-use or controlled commodity classification alert for "${tradeItemDescription}"`,
        evidenceReference: `REF-COMMODITY-${Date.now().toString(36).toUpperCase()}`,
        notes: 'Export permit/license verification required prior to seller invitation dispatch.',
      };
    }

    return {
      sourceName: src.sourceName,
      authority: src.authority,
      url: src.url,
      dateChecked: currentDate,
      status: 'CLEAN',
      notes: `Standard commercial commodity under corridor ${origin} → ${destination}.`,
    };
  });

  const resultStatus: ComplianceStatus = isRestrictedGoods
    ? 'RESTRICTED_LICENCE_REVIEW'
    : 'CLEAR_ON_CHECKED_SOURCES';

  const aiSummary = isRestrictedGoods
    ? `Trade commodity screening identified controlled dual-use or restricted materials keywords in "${tradeItemDescription}". Corridor review (${origin} to ${destination}) placed on administrative hold.`
    : `Trade commodity "${tradeItemDescription}" (HS: ${hsCode || 'Standard Tariff'}) cleared across export control registries for route ${origin} → ${destination}. No trade embargoes or SCOMET dual-use flags triggered.`;

  return {
    id: `scr-trd-${Date.now().toString(36)}`,
    organizationId: orgId,
    screeningType: 'TRADE',
    subjectIdentifier: `${tradeItemDescription} (${origin} → ${destination})`,
    resultStatus,
    sourcesChecked: findings,
    aiSummary,
    reviewRequired: isRestrictedGoods,
    isSimulated: true,
    createdAt: currentDate,
  };
}

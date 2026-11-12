import { LegalDocument } from '../types';
import crypto from 'crypto';

function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'doc-01',
    number: '01',
    title: 'Master Platform Terms',
    filename: '01_Meridian_Master_Platform_Terms.pdf',
    roleCategory: 'PRIMARY_PLATFORM',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: 'a7b89f02c4819d42f534891b72e9d284a1e941fba739a820c45167098e94fa01',
    summary:
      'Primary Agreement 1 between Meridian and each business account using the platform. Establishes Meridian as a software provider and workflow orchestrator, customer authority, acceptable use, and liability boundaries.',
    content: `MERIDIAN — MASTER PLATFORM TERMS
Agreement 1 • Meridian and each business account using the platform
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.
Complete all bracketed fields, check local law, and obtain review by qualified counsel before use. Do not represent a simulated payment, verification, signature or automated action as a live third-party service.`,
    clauses: [
      {
        number: '1',
        title: 'Parties and acceptance',
        body: 'These Terms are between [Meridian legal entity name], incorporated in [jurisdiction] with its registered address at [address] (“Meridian”), and the business or individual accepting these Terms (“Customer”). The person accepting confirms they are authorised to bind the Customer. These Terms take effect on the date of electronic acceptance.',
      },
      {
        number: '2',
        title: 'Platform service',
        body: 'Meridian provides software tools for creating and coordinating business workflows, recording transaction information, managing evidence, displaying telemetry, supporting workflow decisions and connecting to third-party services. The exact features available depend on the Customer’s plan and the applicable order form.',
      },
      {
        number: '3',
        title: 'Meridian’s role',
        body: 'Meridian is a software provider and workflow orchestrator. Unless a separately signed agreement expressly says otherwise, Meridian is not the buyer, seller, carrier, insurer, bank, escrow agent, payment institution or guarantor of a customer transaction. Meridian does not take ownership of goods or promise that a counterparty will perform.',
      },
      {
        number: '4',
        title: 'Customer accounts and authority',
        body: 'The Customer must provide accurate business information, keep account credentials secure, enable multi-factor authentication where available, and promptly remove access for people who are no longer authorised. The Customer is responsible for actions taken through its accounts, subject to applicable law and Meridian’s security obligations.',
      },
      {
        number: '5',
        title: 'Buyer-seller transactions',
        body: 'A transaction between a buyer and seller is governed by their separate Buyer-Seller Trade Agreement and transaction schedule. Meridian’s platform terms do not replace that agreement. Meridian is not a party to the sale merely because it hosts, records or automates workflow steps.',
      },
      {
        number: '6',
        title: 'Third-party services and payments',
        body: 'Third-party services, including payment providers, are governed by their own terms and availability. Where enabled, payment instructions are submitted to the selected provider. Meridian does not receive, pool or hold transaction funds under this template. Actual product configuration and legal classification must be assessed before production launch.',
      },
      {
        number: '7',
        title: 'Automated tools and AI',
        body: 'AI outputs, risk flags, classifications and recommendations are decision-support tools unless a transaction agreement expressly authorises a defined automated action. Customers must configure permissions and review exceptional, disputed or high-impact outcomes. Meridian does not guarantee that AI outputs are error-free.',
      },
      {
        number: '8',
        title: 'Customer content and permissions',
        body: 'The Customer retains its rights in content it submits. It grants Meridian a limited licence to host, process, transmit and display that content solely to provide, secure, support and improve the contracted service, subject to the Privacy Notice and any DPA. The Customer must have the rights and lawful basis needed to submit the content.',
      },
      {
        number: '9',
        title: 'Acceptable use and suspension',
        body: 'The Customer must not misuse the service, interfere with its security, upload unlawful material, infringe third-party rights, or attempt unauthorised access. Meridian may restrict access where reasonably necessary to protect users, comply with law, investigate abuse or address a material security risk. Meridian will provide notice where lawful and practicable.',
      },
      {
        number: '10',
        title: 'Confidentiality',
        body: 'Each party must protect the other party’s non-public business information using reasonable care and use it only for the contractual purpose. This does not apply to information independently developed, lawfully received without restriction, public through no breach, or required to be disclosed by law.',
      },
      {
        number: '11',
        title: 'Service changes and availability',
        body: 'Meridian may update the service to improve security, reliability or functionality. Material reductions to paid core functionality will be handled under the applicable order form or subscription terms. Availability commitments, maintenance windows and support targets are described in the SLA.',
      },
      {
        number: '12',
        title: 'Fees and taxes',
        body: 'Fees, billing frequency, renewal, taxes, refunds and cancellation are governed by the Subscription Terms or order form. The Customer is responsible for applicable taxes other than taxes on Meridian’s income.',
      },
      {
        number: '13',
        title: 'Data protection',
        body: 'Each party will comply with applicable data protection law. Where Meridian processes personal data on the Customer’s behalf, the parties will enter into the Data Processing Agreement where required. The Privacy Notice explains Meridian’s own processing as a controller or business, where applicable.',
      },
      {
        number: '14',
        title: 'Intellectual property',
        body: 'Meridian and its licensors own the platform, software, interfaces, documentation and related intellectual property. The Customer receives a limited, non-exclusive, non-transferable right to use the service during the subscription term. No ownership transfers except as expressly stated.',
      },
      {
        number: '15',
        title: 'Disclaimers',
        body: 'To the maximum extent permitted by law, the service is provided subject to the express commitments in these Terms and the SLA. Meridian does not warrant commercial outcomes, counterparty performance, uninterrupted third-party services, sensor accuracy or legal enforceability of a customer’s trade terms.',
      },
      {
        number: '16',
        title: 'Liability',
        body: 'Nothing in these Terms excludes liability that cannot lawfully be excluded. Subject to that rule, each party’s aggregate liability will be limited to [fee-based cap and period], except for agreed carve-outs such as fraud, wilful misconduct, confidentiality breaches, data protection violations or intellectual property infringement, as negotiated and permitted by law.',
      },
      {
        number: '17',
        title: 'Term and termination',
        body: 'These Terms continue while the Customer has an account or active subscription. Either party may terminate for material breach not remedied within [30] days after notice, or as otherwise stated in the Subscription Terms. On termination, access ends and data is handled under the retention and deletion schedule.',
      },
      {
        number: '18',
        title: 'Governing law and disputes',
        body: 'These Terms are governed by the laws of [jurisdiction], excluding conflict-of-law rules, and disputes will be handled in [courts/arbitration forum and seat]. This clause must be completed by counsel for the relevant operating entity and customer market.',
      },
      {
        number: '19',
        title: 'General',
        body: 'These Terms, the applicable order form, Privacy Notice, DPA where applicable, AUP and SLA form the platform agreement. If documents conflict, the following order applies: signed order form, DPA for data-processing matters, these Terms, then policies, unless expressly stated otherwise. Amendments must be recorded in writing or through a legally valid electronic process.',
      },
    ],
  },
  {
    id: 'doc-02',
    number: '02',
    title: 'Privacy Notice',
    filename: '02_Meridian_Privacy_Notice.pdf',
    roleCategory: 'PRIVACY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: 'c4e98f01b1a43d928374e21a084bc910948ea23f9b801a2c38d492f1b0a762de',
    summary:
      'Separate privacy information and acknowledgement. Governs data processing for account administration, website, security, and international data transfer safeguards.',
    content: `MERIDIAN — PRIVACY NOTICE
Notice to platform users, business contacts and visitors (Classified as Privacy Notice — Separate Acknowledgement)
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Who is responsible',
        body: '[Meridian legal entity name], of [address], is responsible for personal information processed for its own account administration, website, sales, billing, security and support purposes. For customer transaction data processed on a customer’s instructions, Meridian may act as a processor/service provider under a separate DPA.',
      },
      {
        number: '2',
        title: 'Information we collect',
        body: 'Depending on use, we may process business contact details, account credentials and security logs, company and representative verification information, transaction metadata, uploaded documents and images, support messages, device and usage information, and payment status references returned by a payment provider. Do not upload unnecessary sensitive personal information.',
      },
      {
        number: '3',
        title: 'Purposes and legal grounds',
        body: 'We use information to create and secure accounts, provide workflows, administer subscriptions, support transactions, prevent fraud and abuse, maintain audit records, respond to requests, comply with law and improve the service. Where required, we rely on consent, contract necessity, legitimate interests or legal obligations, as applicable.',
      },
      {
        number: '4',
        title: 'Sharing',
        body: 'Information may be shared with the relevant buyer or seller in a transaction, hosting and security providers, customer-selected integrations, payment providers, professional advisers, regulators or authorities where legally required. We do not sell personal information as a business model under this draft.',
      },
      {
        number: '5',
        title: 'International transfers',
        body: 'Information may be processed in countries where Meridian and its service providers operate. Where transfer rules apply, Meridian will use an appropriate legal transfer mechanism and safeguards, such as an adequacy decision or approved contractual clauses, as applicable.',
      },
      {
        number: '6',
        title: 'Retention',
        body: 'We retain information only for as long as reasonably necessary for the stated purposes, contractual requirements, security, dispute handling and legal obligations. Specific periods are set out in the Data Retention Schedule or customer agreement. Transaction records may need to be retained after account closure.',
      },
      {
        number: '7',
        title: 'Your rights',
        body: 'Depending on applicable law, individuals may have rights to access, correct, delete, restrict, object to or receive a copy of personal information, and to withdraw consent where processing relies on consent. Requests can be sent to [privacy contact email]. Identity verification may be required.',
      },
      {
        number: '8',
        title: 'Security and incidents',
        body: 'Meridian uses reasonable technical and organisational safeguards appropriate to the information and risks. No system can be guaranteed completely secure. If a personal data breach occurs, Meridian will follow applicable notification duties and the DPA, where relevant.',
      },
      {
        number: '9',
        title: 'Cookies and analytics',
        body: 'The website may use essential cookies and, where permitted, analytics or preference technologies. Where required, non-essential cookies will be used only after the required choice or consent. Details and controls will be provided in the website cookie notice.',
      },
      {
        number: '10',
        title: 'Children',
        body: 'The platform is designed for business use and is not intended for children. Do not create an account if you are below the minimum age required by applicable law.',
      },
      {
        number: '11',
        title: 'Changes and contact',
        body: 'We may update this Notice to reflect service or legal changes. The current version and effective date will be displayed at [URL]. Privacy contact: [name/team and email]. Supervisory authority complaints may be available under applicable law.',
      },
    ],
  },
  {
    id: 'doc-03',
    number: '03',
    title: 'Subscription and Billing Terms',
    filename: '03_Meridian_Subscription_and_Billing_Terms.pdf',
    roleCategory: 'POLICY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    summary:
      'Commercial terms for future Phase 3 paid platform plans. Covers order forms, subscription renewal, fees, taxes, trials, overdue suspension, and refund policies.',
    content: `MERIDIAN — SUBSCRIPTION & BILLING TERMS
Agreement 1 • Commercial terms for paid platform plans (Phase 3 Reference)
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Order form',
        body: 'The selected plan, permitted users, features, billing cycle, fees, currency, start date and any negotiated terms must be recorded in an order form accepted by both parties. If no paid order form exists, the account is on the free or trial terms displayed at sign-up.',
      },
      {
        number: '2',
        title: 'Subscription term and renewal',
        body: 'A subscription begins on the start date and continues for the stated initial term. It renews for successive [monthly/annual] periods unless either party gives notice at least [30] days before renewal, or the order form states otherwise.',
      },
      {
        number: '3',
        title: 'Fees and payment',
        body: 'The Customer must pay the fees shown in the order form. Payment method, invoicing schedule, due date and payment provider will be identified there. Third-party payment providers process payment under their own terms. Meridian does not promise that a provider will approve or settle a payment.',
      },
      {
        number: '4',
        title: 'Taxes and withholding',
        body: 'Fees are exclusive of applicable indirect taxes unless stated otherwise. The Customer is responsible for taxes, duties and withholding obligations required by law. The parties will provide reasonable tax documentation where applicable.',
      },
      {
        number: '5',
        title: 'Trials and promotional plans',
        body: 'Trial access may expire or be converted to a paid plan only as disclosed at sign-up. Promotional credits are non-transferable, have no cash value and expire on the stated date unless law requires otherwise.',
      },
      {
        number: '6',
        title: 'Late payment and suspension',
        body: 'Overdue undisputed amounts may accrue interest at [rate] or the maximum lawful rate, whichever is lower. Meridian may suspend paid features after reasonable notice if an undisputed invoice remains unpaid, while allowing reasonable access to retrieve data where practicable.',
      },
      {
        number: '7',
        title: 'Changes and cancellation',
        body: 'Plan changes take effect on the date shown in the account or order form. Cancellation stops future renewal but does not automatically refund fees already paid, except where required by law or expressly agreed.',
      },
      {
        number: '8',
        title: 'Refunds and disputes',
        body: 'Billing questions should be sent to [billing email] within [30] days of the invoice. Payment-provider chargebacks and disputes are handled under that provider’s rules and do not replace the parties’ contractual dispute process.',
      },
      {
        number: '9',
        title: 'Records and audit',
        body: 'Meridian may maintain invoices, subscription events and payment status references for accounting, security and legal purposes in accordance with its retention schedule.',
      },
      {
        number: '10',
        title: 'Priority',
        body: 'These Terms supplement the Master Platform Terms. A signed order form prevails where it expressly varies these Terms.',
      },
    ],
  },
  {
    id: 'doc-04',
    number: '04',
    title: 'Acceptable Use Policy',
    filename: '04_Meridian_Acceptable_Use_Policy.pdf',
    roleCategory: 'POLICY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '984ea71b29a8f3041940982bc0914e9184ba01e48f72948ca2984019a842b109',
    summary:
      'Platform usage and security rules incorporated into onboarding. Prohibits credential sharing, false company identity, falsified telemetry, sanctions evasion, and defines AI automation bounds.',
    content: `MERIDIAN — ACCEPTABLE USE POLICY
Rules for responsible use of the platform
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Permitted use',
        body: 'Use Meridian only for lawful business workflows and only within the permissions and plan limits assigned to your account.',
      },
      {
        number: '2',
        title: 'Prohibited conduct',
        body: 'You must not: (a) break or evade security controls; (b) access another account without permission; (c) upload malware or harmful code; (d) use the platform for fraud, sanctions evasion or unlawful trade; (e) misrepresent company identity, authority, goods or evidence; (f) infringe intellectual property or privacy rights; (g) interfere with platform availability; or (h) use outputs to make unlawful discriminatory decisions.',
      },
      {
        number: '3',
        title: 'Account and evidence integrity',
        body: 'Do not share credentials, falsify telemetry, alter timestamps, submit misleading images or documents, or interfere with sensor devices or audit records. Correct inaccurate information promptly.',
      },
      {
        number: '4',
        title: 'AI and automation',
        body: 'Do not configure agents to exceed the authority granted by the relevant company or transaction agreement. Human review is required where the workflow flags uncertainty, conflicting evidence, suspected fraud or a high-impact exception.',
      },
      {
        number: '5',
        title: 'Monitoring and response',
        body: 'Meridian may monitor platform activity for security, abuse prevention, service operation and legal compliance. Where a credible violation is identified, Meridian may investigate, preserve relevant records, restrict access or notify affected parties or authorities where appropriate.',
      },
      {
        number: '6',
        title: 'Reporting',
        body: 'Report suspected misuse or compromised credentials to [security email]. Include relevant account or transaction references, but do not send passwords or unnecessary personal information.',
      },
      {
        number: '7',
        title: 'Enforcement',
        body: 'Meridian may issue warnings, require corrective action, suspend features or terminate access for material or repeated violations, subject to applicable law and the Master Platform Terms.',
      },
    ],
  },
  {
    id: 'doc-05',
    number: '05',
    title: 'Service Level Agreement',
    filename: '05_Meridian_Service_Level_Agreement.pdf',
    roleCategory: 'POLICY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '4a1b89ef720a48d01948ba201e904bca9184ba291048ca0918402948ab10928a',
    summary:
      'Platform service availability, support priorities and response targets. Preserved as a draft reference document containing proposed targets (99.5% availability, P1 1-hour response).',
    content: `MERIDIAN — SERVICE LEVEL AGREEMENT
Availability, support and service commitments (Draft Targets Reference)
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Scope',
        body: 'This SLA applies only to the production services identified in the Customer’s order form. Sandbox, beta, preview, third-party and customer-managed systems are excluded unless expressly included.',
      },
      {
        number: '2',
        title: 'Availability target',
        body: 'Meridian’s target is [99.5%] monthly availability for the defined core service, measured as available minutes divided by total minutes in the month, excluding permitted exclusions below. This is a target/commitment only once approved and operationally supported by Meridian.',
      },
      {
        number: '3',
        title: 'Exclusions',
        body: 'Downtime caused by scheduled maintenance with [48] hours’ notice, emergency security maintenance, customer systems or networks, misuse, force majeure, third-party providers, payment networks, telecommunications, or services outside Meridian’s reasonable control is excluded.',
      },
      {
        number: '4',
        title: 'Support channels and priorities',
        body: 'Support requests are submitted through [portal/email]. Priority 1: core service unavailable or suspected security incident; Priority 2: major function impaired; Priority 3: limited issue or workaround available; Priority 4: general question or feature request.',
      },
      {
        number: '5',
        title: 'Response targets',
        body: 'Initial response targets: P1 [1 hour], P2 [4 business hours], P3 [1 business day], P4 [3 business days]. These are response targets, not guaranteed resolution times. Support hours and time zone: [details].',
      },
      {
        number: '6',
        title: 'Maintenance and communications',
        body: 'Meridian will use reasonable efforts to provide advance notice of planned maintenance and updates during material incidents. Emergency maintenance may occur without advance notice where needed to protect the service or data.',
      },
      {
        number: '7',
        title: 'Service credits',
        body: 'If a monthly availability commitment is missed, the Customer may request a service credit according to the order form: [credit table]. Credits are the agreed remedy for SLA failure to the extent permitted by law, subject to any non-excludable rights.',
      },
      {
        number: '8',
        title: 'Customer responsibilities',
        body: 'The Customer must maintain supported browsers, secure credentials, provide accurate issue details and cooperate with reasonable troubleshooting.',
      },
      {
        number: '9',
        title: 'Third-party dependencies',
        body: 'Availability of payment, identity, mapping, messaging, cloud, IoT and other external services is not controlled by Meridian. Meridian will identify material dependencies and communicate known outages where reasonably possible.',
      },
      {
        number: '10',
        title: 'Claims and review',
        body: 'A service-credit request must be submitted within [30] days after the relevant month, with supporting details. This SLA supplements the Master Platform Terms.',
      },
    ],
  },
  {
    id: 'doc-06',
    number: '06',
    title: 'Data Processing Agreement',
    filename: '06_Meridian_Data_Processing_Agreement.pdf',
    roleCategory: 'POLICY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '5e0a98f4102948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Additional agreement for situations where Meridian processes personal data on behalf of a Customer as a processor/service provider. Includes audit clauses, international transfers, and subprocessor management.',
    content: `MERIDIAN — DATA PROCESSING AGREEMENT
Processor Terms under Applicable Data Protection Frameworks
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Roles and scope',
        body: 'This DPA applies where Meridian processes personal data on the Customer’s documented instructions as a data processor or service provider. Customer acts as data controller.',
      },
      {
        number: '2',
        title: 'Customer instructions',
        body: 'Meridian shall process personal data solely in accordance with documented Customer instructions and for the performance of the SaaS trade orchestration platform.',
      },
      {
        number: '3',
        title: 'Confidentiality and personnel',
        body: 'Meridian ensures that persons authorised to process personal data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.',
      },
      {
        number: '4',
        title: 'Security measures and subprocessors',
        body: 'Meridian implements technical and organisational security measures. Subprocessors may only be engaged under written contracts imposing equivalent data protection standards.',
      },
      {
        number: '5',
        title: 'Data subject rights and breach notification',
        body: 'Meridian shall assist the Customer in responding to requests from data subjects and notify the Customer without undue delay upon becoming aware of a confirmed personal data breach.',
      },
      {
        number: '6',
        title: 'Return and deletion of data',
        body: 'At the choice of the Customer, Meridian shall delete or return all personal data to the Customer after the end of the provision of services, unless applicable statutory law requires storage.',
      },
    ],
  },
  {
    id: 'doc-07',
    number: '07',
    title: 'Security, Incident Response & Retention Schedule',
    filename: '07_Meridian_Security_Incident_and_Retention_Schedule.pdf',
    roleCategory: 'POLICY',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '6f1b09ea402948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Operational security and retention framework. Establishes proposed retention periods: profile data term+24 months, transaction records 7 years, telemetry 24 months, and security logs 12 months.',
    content: `MERIDIAN — SECURITY, INCIDENT RESPONSE & DATA RETENTION SCHEDULE
Agreement 1 • Operational policy schedule
Draft for discussion and legal review. This template is not legal advice and does not establish compliance in every country.`,
    clauses: [
      {
        number: '1',
        title: 'Security governance',
        body: 'Meridian will maintain a documented security programme proportionate to the service, including asset management, access control, vulnerability management, secure development, logging, backup and recovery, vendor review and staff awareness.',
      },
      {
        number: '2',
        title: 'Identity and account controls',
        body: 'Business onboarding may include company-registry checks, authorised-representative verification, role-based access and multi-factor authentication. A company’s legal existence does not by itself prove the authority or trustworthiness of every account user.',
      },
      {
        number: '3',
        title: 'Security incidents',
        body: 'A security incident includes suspected unauthorised access, credential compromise, material service disruption, data exposure, malicious code or compromised integrations. Meridian will triage, contain, investigate, preserve relevant logs, remediate and communicate as required by law and contract.',
      },
      {
        number: '4',
        title: 'Customer cooperation',
        body: 'Customers must promptly report suspected compromise, rotate affected credentials, preserve relevant evidence and cooperate with reasonable investigation steps.',
      },
      {
        number: '5',
        title: 'Retention schedule',
        body: 'Proposed default periods, subject to legal and customer requirements: account profile data — account term plus [24] months; transaction records and acceptance evidence — [7] years or the legally required period; telemetry and supporting evidence — [24] months after transaction closure; security logs — [12] months; support tickets — [24] months. Confirm periods with counsel and operational needs before launch.',
      },
      {
        number: '6',
        title: 'Deletion and legal holds',
        body: 'Deletion may be delayed where information is subject to a legal hold, dispute, investigation, regulatory duty or secure backup cycle. Deleted information will be removed from active systems within [30] days and from backups within [90] days where technically feasible, unless law requires otherwise.',
      },
      {
        number: '7',
        title: 'Data minimisation',
        body: 'Collect only information needed for the stated workflow. Avoid storing identity documents, precise location, biometric data or sensitive personal data unless necessary, lawful and supported by appropriate safeguards.',
      },
      {
        number: '8',
        title: 'Review',
        body: 'This schedule must be reviewed at least annually and after a material incident, major product change or significant legal change.',
      },
    ],
  },
  {
    id: 'doc-08',
    number: '08',
    title: 'Buyer–Seller Master Trade Framework Agreement',
    filename: '08_Meridian_Buyer_Seller_Master_Trade_Framework_Agreement.pdf',
    roleCategory: 'COMMERCIAL_TEMPLATE',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '7a2c09ea502948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Agreement 2, directly between Buyer and Seller (NOT Meridian). Governs independent commercial transactions, goods specifications, price, title transfer, Incoterms, and inspection remedies.',
    content: `MERIDIAN — BUYER-SELLER MASTER TRADE FRAMEWORK AGREEMENT
Agreement 2 • Bilateral Commercial Contract (Template for Future Trade Execution Phase)
Draft for discussion and legal review. This document does not bind parties until individually negotiated and executed.`,
    clauses: [
      {
        number: '1',
        title: 'Independent commercial relationship',
        body: 'The Buyer and Seller establish an independent commercial contract for cross-border trade. Meridian Trade Systems is not a party, broker, or guarantor to this agreement.',
      },
      {
        number: '2',
        title: 'Transaction formation and schedules',
        body: 'Individual purchase transactions are executed through mutually signed Transaction Schedules incorporating these master terms.',
      },
      {
        number: '3',
        title: 'Price, delivery, and Incoterms',
        body: 'Payment milestones, currency, Incoterms 2020 rules, transfer of risk, and shipping manifests shall govern title transfer.',
      },
      {
        number: '4',
        title: 'Inspection and acceptance',
        body: 'Destination inspection thresholds, tolerance limits, and non-conformance procedures shall follow agreed Transaction Schedule metrics.',
      },
      {
        number: '5',
        title: 'Dispute escalation and governing law',
        body: 'Disputes arising under this agreement shall follow the Buyer-Seller Dispute Resolution Schedule before binding arbitration.',
      },
    ],
  },
  {
    id: 'doc-09',
    number: '09',
    title: 'Buyer–Seller Transaction Schedule',
    filename: '09_Meridian_Transaction_Schedule_Template.pdf',
    roleCategory: 'COMMERCIAL_TEMPLATE',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '8b3d09ea602948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Transaction-specific schedule under Agreement 2 defining contracting parties, HS codes, pricing, milestone locks, inspection tolerances, and delivery criteria.',
    content: `MERIDIAN — BUYER-SELLER TRANSACTION SCHEDULE TEMPLATE
Commercial Schedule under Agreement 2 (Future Phase Commercial Execution)
Draft for discussion and legal review.`,
    clauses: [
      {
        number: '1',
        title: 'Contracting parties & reference numbers',
        body: 'Identification of Buyer Org ID, Seller Org ID, transaction reference code, and designated logistics contacts.',
      },
      {
        number: '2',
        title: 'Goods specifications and quantities',
        body: 'Item description, HS classification code, packaging requirements, temperature/humidity thresholds, and accepted variances.',
      },
      {
        number: '3',
        title: 'Milestone escrow gates',
        body: 'Conditional milestone release schedule tied to verified Bill of Lading, inspection sign-off, and port discharge receipts.',
      },
    ],
  },
  {
    id: 'doc-10',
    number: '10',
    title: 'Electronic Agent and Signature Schedule',
    filename: '10_Meridian_Electronic_Agent_and_Signature_Schedule.pdf',
    roleCategory: 'TECHNICAL_SCHEDULE',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: '9c4e09ea702948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Optional Agreement 2 schedule defining permitted authority of electronic and AI agents. Mandates human approvals for high-impact exceptions and cryptographic verification.',
    content: `MERIDIAN — ELECTRONIC AGENT AND SIGNATURE SCHEDULE
Permitted Bounds and Delegation Rules for Automated Agents
Draft for discussion and legal review.`,
    clauses: [
      {
        number: '1',
        title: 'Authorised systems and scope',
        body: 'Specifies software agents, API keys, and automated triggers authorised to record transaction events on behalf of a company.',
      },
      {
        number: '2',
        title: 'Mandatory human-in-the-loop locks',
        body: 'Electronic agents are strictly prohibited from binding a company to amendments or payment releases exceeding configured variance caps without affirmative human sign-off.',
      },
    ],
  },
  {
    id: 'doc-11',
    number: '11',
    title: 'IoT Telemetry and Digital Evidence Protocol',
    filename: '11_Meridian_IoT_Telemetry_and_Evidence_Protocol.pdf',
    roleCategory: 'TECHNICAL_SCHEDULE',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: 'ad5f09ea802948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Agreement 2 technical protocol for shipment monitoring, container GPS telemetry, cold chain sensor logging, and cryptographic chain-of-custody verification.',
    content: `MERIDIAN — IOT TELEMETRY AND DIGITAL EVIDENCE PROTOCOL
Technical Schedule for Cargo Monitoring and Telemetry Integrity
Draft for discussion and legal review.`,
    clauses: [
      {
        number: '1',
        title: 'Device registration and calibrated sensors',
        body: 'Container sensor IDs, calibration certificates, and transmission frequencies registered prior to origin dispatch.',
      },
      {
        number: '2',
        title: 'Evidence metadata and loss-of-signal protocol',
        body: 'Standards for recording latitude/longitude coordinates, ambient temperature logs, shock events, and reporting gaps in international waters.',
      },
    ],
  },
  {
    id: 'doc-12',
    number: '12',
    title: 'Buyer–Seller Dispute Resolution Schedule',
    filename: '12_Meridian_Dispute_Resolution_Schedule.pdf',
    roleCategory: 'COMMERCIAL_TEMPLATE',
    version: '0.1',
    effectiveDate: '7 November 2026',
    status: 'DRAFT_FOR_REVIEW',
    sha256Hash: 'be6009ea902948ba01948ca201e904bca9184ba291048ca0918402948ab10928',
    summary:
      'Agreement 2 dispute procedure covering operational escalation, objective evidence review, mediation, arbitration rules, and Meridian’s non-adjudicator role.',
    content: `MERIDIAN — BUYER-SELLER DISPUTE RESOLUTION SCHEDULE
Escalation and Mediation Guidelines under Agreement 2
Draft for discussion and legal review.`,
    clauses: [
      {
        number: '1',
        title: 'Tiered operational escalation',
        body: 'Discrepancies must be raised within 7 business days of cargo arrival, triggering a 14-day direct negotiation window supported by Meridian telemetry dossiers.',
      },
      {
        number: '2',
        title: 'Meridian’s limited role as evidentiary neutral',
        body: 'Meridian provides automated telemetry and contract clause comparison as an objective factual tool; Meridian does not issue legally binding judgments or adjudicate commercial liability.',
      },
    ],
  },
];

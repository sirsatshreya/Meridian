import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Building2,
  UserCheck,
  FileUp,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Upload,
} from 'lucide-react';
import { Agreement1SigningModal } from '../legal/Agreement1SigningModal';
import { ComplianceScreening, BusinessDocument } from '../../types';

interface CompanyOnboardingPageProps {
  onNavigate: (route: string) => void;
}

export const CompanyOnboardingPage: React.FC<CompanyOnboardingPageProps> = ({ onNavigate }) => {
  const { user, organization, refreshProfile } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Company Details
  const [legalName, setLegalName] = useState(organization?.legalName || '');
  const [tradingName, setTradingName] = useState(organization?.tradingName || '');
  const [country, setCountry] = useState(organization?.country || 'India');
  const [stateRegion, setStateRegion] = useState(organization?.stateRegion || 'Maharashtra');
  const [entityType, setEntityType] = useState(organization?.entityType || 'Private Limited Company');
  const [registrationNumber, setRegistrationNumber] = useState(organization?.registrationNumber || '');
  const [taxId, setTaxId] = useState(organization?.taxId || '');
  const [registeredAddress, setRegisteredAddress] = useState(organization?.registeredAddress || '');
  const [officialEmail, setOfficialEmail] = useState(organization?.officialEmail || user?.email || '');
  const [officialWebsite, setOfficialWebsite] = useState(organization?.officialWebsite || '');
  const [businessPhone, setBusinessPhone] = useState(organization?.businessPhone || '');
  const [industry, setIndustry] = useState(organization?.industry || 'Supply Chain & Manufacturing');
  const [natureOfBusiness, setNatureOfBusiness] = useState(organization?.natureOfBusiness || 'International Importer / Procurement');
  const [mainProducts, setMainProducts] = useState(organization?.mainProductsServices || 'Industrial Goods & Commodities');

  // Step 2: Authorized Representative
  const [repName, setRepName] = useState(user?.name || '');
  const [repTitle, setRepTitle] = useState('Director of Procurement');
  const [repEmail, setRepEmail] = useState(user?.email || '');
  const [repPhone, setRepPhone] = useState('+91 98200 12345');
  const [repRole, setRepRole] = useState('Authorized Corporate Signatory');
  const [repDeclared, setRepDeclared] = useState(false);

  // Step 3: Documents
  const [uploadedDocs, setUploadedDocs] = useState<BusinessDocument[]>([]);
  const [docType, setDocType] = useState<BusinessDocument['documentType']>('CERTIFICATE_OF_INCORPORATION');
  const [selectedFileName, setSelectedFileName] = useState('');

  // Step 4: Agreement 1
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(organization?.agreement1Status === 'ACCEPTED');

  // Step 5: Compliance Screening & Verification
  const [screeningResult, setScreeningResult] = useState<ComplianceScreening | null>(null);

  useEffect(() => {
    if (organization) {
      setLegalName(organization.legalName);
      setCountry(organization.country);
      setRegistrationNumber(organization.registrationNumber);
      setAgreementAccepted(organization.agreement1Status === 'ACCEPTED');
    }
  }, [organization]);

  // Handle Step 1 Save
  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!legalName.trim() || !registrationNumber.trim() || !country.trim()) {
      setError('Legal company name, country, and registration number are required.');
      return;
    }

    setLoading(true);
    try {
      // Check duplicate
      const dup = await api.companies.checkDuplicate(legalName, country, registrationNumber);
      if (dup.isDuplicate && dup.matchedOrg?.id !== organization?.id) {
        setError(`An organization matching "${legalName}" (${country}) is already registered with Organization ID ${dup.matchedOrg?.id}.`);
        setLoading(false);
        return;
      }

      await api.companies.updateMe({
        legalName: legalName.trim(),
        tradingName: tradingName.trim() || legalName.trim(),
        country,
        stateRegion,
        entityType,
        registrationNumber: registrationNumber.trim(),
        taxId,
        registeredAddress,
        officialEmail,
        officialWebsite,
        businessPhone,
        industry,
        natureOfBusiness,
        mainProductsServices: mainProducts,
      });

      await refreshProfile();
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to update company information.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2 Save
  const handleSaveStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repName.trim() || !repTitle.trim()) {
      setError('Representative full name and designation are required.');
      return;
    }
    if (!repDeclared) {
      setError('Affirmative confirmation of signing authority is required.');
      return;
    }

    setLoading(true);
    try {
      await api.companies.setRepresentative({
        fullName: repName.trim(),
        designation: repTitle.trim(),
        officialEmail: repEmail.trim(),
        contactNumber: repPhone.trim(),
        roleInOrg: repRole.trim(),
        declarationConfirmed: true,
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to save authorized representative details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 3 Add Document
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileName.trim()) return;

    try {
      const res = await api.companies.uploadDocument({
        documentType: docType,
        fileName: selectedFileName.trim(),
      });
      setUploadedDocs((prev) => [...prev, res.document]);
      setSelectedFileName('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle Step 5 Trigger Verification & Screening
  const handleTriggerVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.companies.submitVerification();
      setScreeningResult(res.screening);
      await refreshProfile();
      setCurrentStep(6);
    } catch (err: any) {
      setError(err.message || 'Verification workflow encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Company Details', icon: Building2 },
    { num: 2, title: 'Representative', icon: UserCheck },
    { num: 3, title: 'Business Documents', icon: FileUp },
    { num: 4, title: 'Agreement 1', icon: FileText },
    { num: 5, title: 'Compliance & KYB', icon: ShieldCheck },
    { num: 6, title: 'Activation', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D7FF43] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
            <span>MERIDIAN ONBOARDING PROTOCOL · PHASE 2</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#F5F5F2]">
            Corporate Business Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-[#999D9B] max-w-xl mx-auto">
            Establish legal company identity, declare authorized signatories, review Agreement 1, and complete source-based KYB screening.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-6 gap-2 border-b border-white/10 pb-6">
          {steps.map((st) => {
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            const IconComp = st.icon;
            return (
              <div
                key={st.num}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#171A1C] border-[#D7FF43] text-[#F5F5F2]'
                    : isCompleted
                    ? 'bg-[#111315] border-white/10 text-[#D7FF43]'
                    : 'bg-[#111315]/40 border-transparent text-[#999D9B]/50'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <IconComp className={`w-4 h-4 ${isCurrent ? 'text-[#D7FF43]' : ''}`} />
                </div>
                <span className="font-mono text-[10px] hidden sm:block truncate">
                  0{st.num}. {st.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: COMPANY INFORMATION */}
        {currentStep === 1 && (
          <form onSubmit={handleSaveStep1} className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-[#F5F5F2]">Step 1: Legal Company Details</h2>
              <p className="text-xs text-[#999D9B]">
                Specify your corporate registration parameters. Meridian checks global business registries to prevent duplicate entities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Legal Corporate Entity Name *
                </label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. Apex Industrial Commodities Ltd"
                  required
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Commercial Trading / Brand Name
                </label>
                <input
                  type="text"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  placeholder="e.g. Apex Global Trade"
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Country of Incorporation *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                >
                  <option value="India">India</option>
                  <option value="Germany">Germany</option>
                  <option value="Singapore">Singapore</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Japan">Japan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  State / Region
                </label>
                <input
                  type="text"
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  placeholder="e.g. Maharashtra or Hamburg"
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Official Registration Number (CIN / HRB / Reg ID) *
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. U74999MH2021PTC368921"
                  required
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Tax Identification Number (GSTIN / VAT / EIN)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. 27AABCM8921P1ZK"
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Registered Corporate Address
                </label>
                <input
                  type="text"
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  placeholder="Street, City, Postal Code"
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Official Business Email
                </label>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Business Phone
                </label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+1 ... or +91 ..."
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{loading ? 'Checking...' : 'Save & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AUTHORIZED REPRESENTATIVE */}
        {currentStep === 2 && (
          <form onSubmit={handleSaveStep2} className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-[#F5F5F2]">Step 2: Authorized Representative</h2>
              <p className="text-xs text-[#999D9B]">
                Specify the designated legal officer authorized to represent and bind this corporate account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  required
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Official Designation / Title *
                </label>
                <input
                  type="text"
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  placeholder="e.g. Director, Managing Partner, VP Procurement"
                  required
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Signatory Work Email
                </label>
                <input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Direct Contact Number
                </label>
                <input
                  type="text"
                  value={repPhone}
                  onChange={(e) => setRepPhone(e.target.value)}
                  className="w-full bg-[#111315] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-[#F5F5F2] focus:outline-none focus:border-[#D7FF43]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#111315] border border-[#D7FF43]/20 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-[#F5F5F2]">
                <input
                  type="checkbox"
                  checked={repDeclared}
                  onChange={(e) => setRepDeclared(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#171A1C] text-[#D7FF43] focus:ring-0 cursor-pointer"
                />
                <span className="leading-relaxed">
                  "I confirm that I am authorized to register and represent the company identified in this account, and that an official email address alone is not treated as proof of legal authority."
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: BUSINESS DOCUMENTS */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-[#F5F5F2]">Step 3: Business Verification Documents</h2>
              <p className="text-xs text-[#999D9B]">
                Upload official corporate identity documents for KYB screening. Documents are stored in access-controlled private vaults.
              </p>
            </div>

            {/* Upload form */}
            <form onSubmit={handleUploadDoc} className="p-4 bg-[#111315] border border-white/10 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#999D9B] mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-[#171A1C] border border-white/10 rounded-lg p-2 text-xs text-[#F5F5F2]"
                  >
                    <option value="CERTIFICATE_OF_INCORPORATION">Certificate of Incorporation</option>
                    <option value="TAX_REGISTRATION">Tax Registration Certificate</option>
                    <option value="PROOF_OF_ADDRESS">Proof of Registered Address</option>
                    <option value="REPRESENTATIVE_AUTHORIZATION">Representative Board Resolution</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-[#999D9B] mb-1">
                    Document File Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={selectedFileName}
                      onChange={(e) => setSelectedFileName(e.target.value)}
                      placeholder="e.g. Cert_of_Incorporation_2026.pdf"
                      className="flex-1 bg-[#171A1C] border border-white/10 rounded-lg px-3 py-2 text-xs text-[#F5F5F2]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#D7FF43] text-[#08090A] text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Document list */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-[#999D9B]">
                Submitted Documents ({uploadedDocs.length})
              </span>
              {uploadedDocs.length === 0 ? (
                <div className="p-4 bg-[#111315]/40 rounded-xl border border-white/5 text-xs text-[#999D9B] text-center">
                  No documents attached yet. Add at least Certificate of Incorporation.
                </div>
              ) : (
                uploadedDocs.map((d) => (
                  <div key={d.id} className="p-3 bg-[#111315] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#D7FF43]" />
                      <span className="text-[#F5F5F2] font-semibold">{d.fileName}</span>
                      <span className="text-[10px] text-[#999D9B]">({d.documentType})</span>
                    </div>
                    <span className="text-[#D7FF43] font-mono text-[10px]">VERIFIED</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Continue to Agreement 1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MERIDIAN PLATFORM AGREEMENT */}
        {currentStep === 4 && (
          <div className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-[#F5F5F2]">Step 4: Meridian Platform Terms (Agreement 1)</h2>
              <p className="text-xs text-[#999D9B]">
                Review and electronically accept the Master Platform Terms governing software orchestration, non-escrow disclaimers, and data protection.
              </p>
            </div>

            <div className="p-6 bg-[#111315] border border-white/10 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#D7FF43]">
                  <FileText className="w-5 h-5" />
                  <span className="font-bold">01_Meridian_Master_Platform_Terms.pdf</span>
                </div>
                <span className="text-xs font-mono text-[#999D9B]">Version 0.1</span>
              </div>

              <p className="text-xs text-[#999D9B] leading-relaxed">
                Establishes Meridian as a software provider and workflow orchestrator. Meridian does not operate as a bank or licensed escrow agent.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-white/40">Status: </span>
                  <span className={agreementAccepted ? 'text-[#D7FF43]' : 'text-amber-400'}>
                    {agreementAccepted ? 'ELECTRONICALLY ACCEPTED' : 'PENDING REVIEW'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAgreementModalOpen(true)}
                  className="px-5 py-2.5 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl hover:bg-[#cbf436] transition-colors"
                >
                  {agreementAccepted ? 'View Acceptance Receipt' : 'Review & Sign Agreement 1'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-xs text-[#999D9B] hover:text-[#F5F5F2] flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!agreementAccepted}
                onClick={() => setCurrentStep(5)}
                className="px-6 py-2.5 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-40 text-[#08090A] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Proceed to KYB Screening</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLIANCE SCREENING & KYB */}
        {currentStep === 5 && (
          <div className="p-6 sm:p-8 bg-[#171A1C] border border-white/10 rounded-2xl space-y-6 shadow-2xl">
            <div className="space-y-1 pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-[#F5F5F2]">Step 5: Business Verification & Compliance Screening</h2>
              <p className="text-xs text-[#999D9B]">
                Meridian triggers source-based compliance checks against 6 authoritative global sanctions registries.
              </p>
            </div>

            <div className="p-6 bg-[#111315] border border-white/10 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#D7FF43]">SOURCE REGISTRIES MONITORED</span>
                <span className="text-[10px] text-[#999D9B]">UN · OFAC · UK · EU · US BIS · DGFT</span>
              </div>

              <div className="space-y-2 text-xs text-[#999D9B]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                  <span>United Nations Security Council Consolidated Sanctions List</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                  <span>US OFAC Specially Designated Nationals (SDN) Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                  <span>UK FCDO & OFSI Financial Sanctions Registry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                  <span>European External Action Service (EEAS) Sanctions</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleTriggerVerification}
                  disabled={loading}
                  className="w-full py-3 bg-[#D7FF43] hover:bg-[#cbf436] text-[#08090A] font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Executing Authoritative Screening...' : 'Run Automated Compliance Verification'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ACTIVATION & SUCCESS */}
        {currentStep === 6 && (
          <div className="p-8 bg-[#171A1C] border border-[#D7FF43]/40 rounded-2xl text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#D7FF43]/10 border border-[#D7FF43] flex items-center justify-center text-[#D7FF43]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2]">
                Onboarding & KYB Completed
              </h2>
              <p className="text-xs sm:text-sm text-[#999D9B] max-w-md mx-auto">
                {organization?.legalName} is verified and activated on Meridian Trade Systems under Organization ID <span className="text-[#D7FF43] font-mono">{organization?.id}</span>.
              </p>
            </div>

            {/* Screening Summary Box */}
            {screeningResult && (
              <div className="p-4 bg-[#111315] border border-white/5 rounded-xl max-w-lg mx-auto text-left text-xs font-mono space-y-2">
                <div className="text-[#D7FF43] font-bold">COMPLIANCE REPORT: {screeningResult.resultStatus}</div>
                <p className="text-[#999D9B] font-sans text-xs">{screeningResult.aiSummary}</p>
                <div className="text-[10px] text-white/40 pt-1 border-t border-white/5">
                  Screening ID: {screeningResult.id} · Simulated Hackathon Verification
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => onNavigate(user?.role === 'BUYER' ? '/buyer/home' : '/seller/home')}
                className="px-8 py-3.5 bg-[#D7FF43] text-[#08090A] font-bold text-xs rounded-xl hover:bg-[#cbf436] transition-colors shadow-lg shadow-[#D7FF43]/20"
              >
                Launch {user?.role} Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Agreement 1 Signing Modal */}
      <Agreement1SigningModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        defaultRepresentative={repName}
        defaultDesignation={repTitle}
        onSuccess={() => {
          setAgreementAccepted(true);
          refreshProfile();
        }}
      />
    </div>
  );
};

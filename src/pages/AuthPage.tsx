import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthPageProps {
  role: 'BUYER' | 'SELLER';
  initialTab?: 'signin' | 'signup';
  onNavigate: (route: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  role,
  initialTab = 'signin',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const { login, register, loginDemo } = useAuth();
  const isDemoMode = true;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialTab, role]);

  const handleQuickDemoFill = () => {
    if (role === 'BUYER') {
      setEmail('buyer.demo@meridian.test');
      setPassword('Password@123');
    } else {
      setEmail('seller.demo@meridian.test');
      setPassword('Password@123');
    }
    setErrorMessage(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your business email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password, role);
    setLoading(false);

    if (result.success) {
      setSuccessMessage('Authentication successful. Redirecting to your workspace...');
      setTimeout(() => {
        onNavigate(role === 'BUYER' ? '/buyer/home' : '/seller/home');
      }, 500);
    } else {
      setErrorMessage(result.error || 'Failed to authenticate. Please check your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid corporate email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage('You must review and accept the Meridian SaaS Terms & Conditions.');
      return;
    }

    setLoading(true);
    const result = await register({
      name,
      email,
      password,
      role,
      companyName: name + (role === 'BUYER' ? ' Procurement Ltd' : ' Exports GmbH'),
    });
    setLoading(false);

    if (result.success) {
      setSuccessMessage('Account registered successfully! Redirecting to company onboarding...');
      setTimeout(() => {
        onNavigate('/onboarding');
      }, 600);
    } else {
      setErrorMessage(result.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-[#D7FF43]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Role Badge and Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D7FF43]" />
            <span className="font-mono text-xs text-[#D7FF43] uppercase tracking-wider">
              {role} PORTAL
            </span>
          </div>

          <button
            onClick={() => onNavigate('/auth')}
            className="text-xs text-[#999D9B] hover:text-[#F5F5F2] transition-colors"
          >
            Change Role
          </button>
        </div>

        {/* Card Container */}
        <div className="bg-[#171A1C] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F2] tracking-tight mb-1.5">
              {role === 'BUYER' ? 'Buyer Workspace' : 'Seller Workspace'}
            </h1>
            <p className="text-xs text-[#999D9B]">
              {role === 'BUYER'
                ? 'Coordinate purchasing agreements, payment holds, and shipments.'
                : 'Coordinate sales terms, payment verifications, and delivery proofs.'}
            </p>
          </div>

          {/* Demonstration Mode Notice Banner */}
          {isDemoMode && (
            <div className="mb-6 p-3 bg-[#111315] border border-white/10 rounded-xl flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#D7FF43] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-mono font-medium text-[#F5F5F2] block">
                  DEMONSTRATION MODE
                </span>
                <p className="text-[11px] text-[#999D9B] leading-relaxed">
                  Phase 1 uses simulated secure local session authorization. No raw credentials are transmitted to external endpoints.
                </p>
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="mt-1 text-[11px] font-medium text-[#D7FF43] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill verified test {role.toLowerCase()} credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab Selection */}
          <div className="flex items-center p-1 bg-[#111315] rounded-xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-[#171A1C] text-[#F5F5F2] shadow-sm border border-white/5'
                  : 'text-[#999D9B] hover:text-[#F5F5F2]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#171A1C] text-[#F5F5F2] shadow-sm border border-white/5'
                  : 'text-[#999D9B] hover:text-[#F5F5F2]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alert messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-[#D7FF43]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#D7FF43]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trade-officer@enterprise.com"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-xs text-[#999D9B] hover:text-[#D7FF43] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999D9B] hover:text-[#F5F5F2] p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/10"
                >
                  <span>{loading ? 'Authenticating...' : `Sign In as ${role}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREATE ACCOUNT */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Vance"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Business Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@corp.example"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999D9B] hover:text-[#F5F5F2] p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#999D9B] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#999D9B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-[#111315] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#F5F5F2] placeholder-[#999D9B]/50 focus:outline-none focus:border-[#D7FF43] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#999D9B] hover:text-[#F5F5F2] p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#111315] text-[#D7FF43] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-[#999D9B] leading-snug cursor-pointer">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('/terms')}
                    className="text-[#D7FF43] hover:underline"
                  >
                    Meridian SaaS Terms & Conditions
                  </button>{' '}
                  and acknowledge non-escrow orchestration governance.
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#D7FF43] hover:bg-[#cbf436] disabled:opacity-50 text-[#08090A] font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D7FF43]/10"
                >
                  <span>{loading ? 'Creating Account...' : `Register as ${role}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center text-xs text-[#999D9B]">
          <button
            onClick={() => onNavigate('/')}
            className="hover:text-[#F5F5F2] transition-colors"
          >
            ← Back to Meridian Home
          </button>
        </div>
      </div>
    </div>
  );
};

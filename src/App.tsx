import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { AuthPage } from './pages/AuthPage';
import { BuyerDashboard } from './pages/dashboard/BuyerDashboard';
import { SellerDashboard } from './pages/dashboard/SellerDashboard';
import { CompanyOnboardingPage } from './pages/onboarding/CompanyOnboardingPage';
import { LegalDocumentsPage } from './pages/legal/LegalDocumentsPage';
import { AcceptInvitationPage } from './pages/invite/AcceptInvitationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { InternalAdminPage } from './pages/InternalAdminPage';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname + window.location.search || '/';
  });

  const { user } = useAuth();

  // Synchronize route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: string) => {
    if (route === '/about') {
      window.history.pushState({}, '', '/');
      setCurrentRoute('/');
      setTimeout(() => {
        document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    window.history.pushState({}, '', route);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRole = (role: 'BUYER' | 'SELLER') => {
    navigate(role === 'BUYER' ? '/login/buyer' : '/login/seller');
  };

  // Render appropriate view based on route
  const renderCurrentView = () => {
    const [path, search] = currentRoute.split('?');
    const searchParams = new URLSearchParams(search || '');
    const roleParam = searchParams.get('role');

    // 1. Landing Page & About
    if (path === '/' || path === '/about') {
      return <LandingPage onNavigate={navigate} />;
    }

    // 2. Role Selection
    if (path === '/auth') {
      if (roleParam === 'buyer') {
        return <AuthPage role="BUYER" initialTab="signup" onNavigate={navigate} />;
      }
      if (roleParam === 'seller') {
        return <AuthPage role="SELLER" initialTab="signup" onNavigate={navigate} />;
      }
      return (
        <RoleSelectionPage
          onSelectRole={handleSelectRole}
          onNavigate={navigate}
        />
      );
    }

    // 3. Buyer Auth routes
    if (path === '/login/buyer') {
      return <AuthPage role="BUYER" initialTab="signin" onNavigate={navigate} />;
    }
    if (path === '/signup/buyer') {
      return <AuthPage role="BUYER" initialTab="signup" onNavigate={navigate} />;
    }

    // 4. Seller Auth routes
    if (path === '/login/seller') {
      return <AuthPage role="SELLER" initialTab="signin" onNavigate={navigate} />;
    }
    if (path === '/signup/seller') {
      return <AuthPage role="SELLER" initialTab="signup" onNavigate={navigate} />;
    }

    // 5. Workspaces & Dashboards
    if (path === '/buyer/home' || path === '/buyer') {
      return <BuyerDashboard onNavigate={navigate} />;
    }
    if (path === '/seller/home' || path === '/seller') {
      return <SellerDashboard onNavigate={navigate} />;
    }

    // 6. Company Onboarding & KYB
    if (path === '/onboarding') {
      return <CompanyOnboardingPage onNavigate={navigate} />;
    }

    // 7. Legal Documents Repository (all 12 drafts)
    if (path === '/legal-documents' || path === '/legal') {
      return <LegalDocumentsPage onNavigate={navigate} />;
    }

    // 8. Invitation Accept & Token Resolution
    if (path.startsWith('/invite')) {
      const parts = path.split('/').filter(Boolean);
      const tokenFromPath = parts.length > 1 ? parts[1] : undefined;
      const tokenFromQuery = searchParams.get('token') || undefined;
      const resolvedToken = tokenFromPath || tokenFromQuery || 'inv-demo-trade-token-001';
      return <AcceptInvitationPage token={resolvedToken} onNavigate={navigate} />;
    }

    // 9. Shared Compliance & Informational Pages
    if (path === '/forgot-password') {
      return <ForgotPasswordPage onNavigate={navigate} />;
    }
    if (path === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }
    if (path === '/terms') {
      return <TermsPage onNavigate={navigate} />;
    }

    // 10. Internal Admin (Developer Passcode Protected)
    if (path === '/internal/admin') {
      return <InternalAdminPage onNavigate={navigate} />;
    }



    // Default fallback to Landing Page
    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F5F5F2] flex flex-col font-sans">
      <Navbar onNavigate={navigate} currentRoute={currentRoute} />
      <main className="flex-1">{renderCurrentView()}</main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

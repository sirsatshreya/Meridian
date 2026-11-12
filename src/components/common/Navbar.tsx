import React, { useState, useEffect } from 'react';
import { MeridianLogo } from './MeridianLogo';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentRoute }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/', sectionId: 'hero' },
    { label: 'Platform', href: '/#about', sectionId: 'about' },
    { label: 'How It Works', href: '/#workflow', sectionId: 'workflow' },
    { label: 'For Buyers', href: '/#buyers', sectionId: 'buyers' },
    { label: 'For Sellers', href: '/#sellers', sectionId: 'sellers' },
    { label: 'About', href: '/#why', sectionId: 'why' },
  ];

  const handleLinkClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (currentRoute !== '/') {
      onNavigate('/');
      // Allow DOM to render before scrolling to section
      setTimeout(() => {
        const el = document.getElementById(link.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(link.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08090A]/90 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark & geometric mark */}
          <button
            onClick={() => {
              onNavigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="cursor-pointer text-left focus:outline-none"
          >
            <MeridianLogo size="md" />
          </button>

          {/* Zone 2: 4-6 Clean single-line text nav links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#999D9B]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className="hover:text-[#F5F5F2] transition-colors whitespace-nowrap tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Zone 3: Actions (Sign In + Get Started) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onNavigate(user.role === 'BUYER' ? '/buyer/home' : user.role === 'SELLER' ? '/seller/home' : '/internal/admin')
                  }
                  className="px-3.5 py-1.5 text-xs font-mono text-[#D7FF43] border border-[#D7FF43]/30 rounded-lg hover:bg-[#D7FF43]/10 transition-colors"
                >
                  {user.role} WORKSPACE
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs text-[#999D9B] hover:text-[#F5F5F2] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/auth')}
                  className="px-4 py-2 text-xs font-medium text-[#999D9B] hover:text-[#F5F5F2] transition-colors whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('/auth')}
                  className="px-4 py-2 text-xs font-semibold text-[#08090A] bg-[#D7FF43] hover:bg-[#cbf436] rounded-lg transition-all duration-200 shadow-md whitespace-nowrap flex items-center gap-1.5 group cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#999D9B] hover:text-[#F5F5F2] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#08090A] border-b border-white/10 px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link)}
                className="text-sm font-medium text-[#999D9B] hover:text-[#F5F5F2] py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate(user.role === 'BUYER' ? '/buyer/home' : user.role === 'SELLER' ? '/seller/home' : '/internal/admin');
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-[#08090A] bg-[#D7FF43] rounded-lg"
                >
                  Open {user.role} Workspace
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-xs text-[#999D9B]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('/auth');
                  }}
                  className="w-full py-2.5 text-center text-xs font-medium text-[#F5F5F2] bg-[#171A1C] border border-white/10 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('/auth');
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-[#08090A] bg-[#D7FF43] rounded-lg"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

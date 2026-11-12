import React from 'react';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MeridianLogo: React.FC<LogoProps> = ({
  className = '',
  showWordmark = true,
  size = 'md',
}) => {
  const iconDimensions = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textSize = {
    sm: 'text-sm',
    md: 'text-base font-semibold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Original Geometric Meridian Coordinate Compass Icon */}
      <div className={`relative ${iconDimensions} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Subtle outer coordinate ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="#24282B"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />
          {/* Meridian primary orbital meridian ellipse */}
          <ellipse
            cx="20"
            cy="20"
            rx="18"
            ry="7.5"
            transform="rotate(-25 20 20)"
            stroke="#F5F5F2"
            strokeWidth="1.75"
            strokeOpacity="0.85"
          />
          {/* Vertical axis line representing coordination alignment */}
          <line
            x1="20"
            y1="4"
            x2="20"
            y2="36"
            stroke="#F5F5F2"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />
          {/* Central coordination waypoint node in neon lime */}
          <circle cx="20" cy="20" r="3.2" fill="#D7FF43" />
          {/* Secondary coordinate beacon node */}
          <circle cx="31" cy="14" r="1.8" fill="#D7FF43" />
          <circle cx="9" cy="26" r="1.8" fill="#F5F5F2" fillOpacity="0.6" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className={`font-sans text-[#F5F5F2] ${textSize}`}>
            Meridian
          </span>
          <span className="text-[10px] tracking-widest text-[#999D9B] uppercase hidden sm:inline-block font-mono">
            Systems
          </span>
        </div>
      )}
    </div>
  );
};

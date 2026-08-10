import React from 'react';
import logoImg from '../assets/images/publi_x_logo_cropped_1786377437382.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const heightClasses = {
    sm: 'h-10 sm:h-12',
    md: 'h-14 sm:h-20',
    lg: 'h-20 sm:h-28',
    xl: 'h-28 sm:h-36'
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* Official Tightly Cropped Image Logo */}
      <img
        src={logoImg}
        alt="PUBLI-X Cobertura Nacional | Impacto Total"
        className={`${heightClasses[size]} w-auto max-w-[280px] sm:max-w-[360px] object-cover object-center filter drop-shadow-xl rounded-xl cursor-pointer hover:scale-102 transition duration-300`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

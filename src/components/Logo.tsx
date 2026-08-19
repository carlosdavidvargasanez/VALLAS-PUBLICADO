import React, { useState } from 'react';
import logoImg from '../assets/images/publi_x_logo_1786377194733.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header';
  showSubtitle?: boolean;
  logoUrl?: string;
}

export default function Logo({ className = '', size = 'md', logoUrl }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-10 sm:h-12 max-w-[220px]',
    md: 'h-16 sm:h-20 max-w-[360px] sm:max-w-[440px]',
    lg: 'h-20 sm:h-28 max-w-[440px] sm:max-w-[560px]',
    xl: 'h-28 sm:h-36 max-w-[560px] sm:max-w-[700px]',
    header: 'h-14 sm:h-20 md:h-24 max-w-[340px] sm:max-w-[460px] md:max-w-[560px]'
  };

  const isInvalidLogo = logoUrl && (
    logoUrl.includes('photo-') || 
    logoUrl.includes('unsplash') || 
    logoUrl.includes('1542751371') || 
    logoUrl.includes('1533473359331')
  );
  const imageSrc = logoUrl && logoUrl.trim() !== '' && !isInvalidLogo && !imgError ? logoUrl : logoImg;

  return (
    <div className={`inline-flex items-center ${className}`}>
      {/* Official Image Logo */}
      <img
        src={imageSrc}
        alt="PUBLI-X Cobertura Nacional | Impacto Total"
        onError={() => setImgError(true)}
        className={`${heightClasses[size]} w-auto object-contain object-center filter drop-shadow-xl rounded-xl cursor-pointer hover:scale-102 transition duration-300`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}


import React, { useState } from 'react';
import logoImg from '../assets/images/publi_x_logo_1786377194733.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  logoUrl?: string;
}

export default function Logo({ className = '', size = 'md', logoUrl }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-10 sm:h-12 max-w-[220px]',
    md: 'h-16 sm:h-24 max-w-[380px] sm:max-w-[480px]',
    lg: 'h-24 sm:h-32 max-w-[480px] sm:max-w-[620px]',
    xl: 'h-32 sm:h-44 max-w-[600px] sm:max-w-[800px]'
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


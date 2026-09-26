import React from 'react';

const Logo = ({ size = 40, className = '' }) => {
  return (
    <div 
      className={`flex items-center justify-center rounded-xl shadow-lg shadow-teal-500/30 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0891b2 100%)',
      }}
    >
      <svg 
        viewBox="0 0 64 64" 
        width={size * 0.72} 
        height={size * 0.72}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Busur C tebal (badan G) */}
        <path 
          d="M 44 18 A 18 18 0 1 0 44 46" 
          fill="none" 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        
        {/* = kecil (aksen G) */}
        <line x1="30" y1="28" x2="46" y2="28" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <line x1="30" y1="36" x2="46" y2="36" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        
        {/* Titik kuning accent */}
        <circle cx="49" cy="32" r="3.5" fill="#fbbf24"/>
      </svg>
    </div>
  );
};

export default Logo;
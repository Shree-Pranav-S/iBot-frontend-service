import React from 'react';

export const IbotMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span
    aria-hidden="true"
    className={`relative grid shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#24211D] shadow-[0_8px_24px_-12px_rgba(36,33,29,0.65)] ${
      compact ? 'h-8 w-8' : 'h-10 w-10'
    }`}
  >
    <span className="absolute -right-2 -top-3 h-7 w-7 rounded-full bg-[#B9833F]/45 blur-md" />
    <svg
      viewBox="0 0 40 40"
      className={compact ? 'h-5 w-5' : 'h-6 w-6'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="6.5" y="9.5" width="27" height="21" rx="8" stroke="#E8C794" strokeWidth="1.7" />
      <path d="M13 20h3.2m7.6 0H27" stroke="#F7F3EA" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M20 15.5v9" stroke="#B9833F" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="20" cy="12" r="1.45" fill="#F7F3EA" />
    </svg>
  </span>
);

import React from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <svg className={className} viewBox="0 0 64 64" role="img" aria-label="TerpSchedule logo">
    <defs><linearGradient id="terpschedule-red" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#ff3038"/><stop offset="1" stopColor="#d90416"/></linearGradient></defs>
    <rect width="64" height="64" rx="18" fill="url(#terpschedule-red)"/>
    <rect x="13.5" y="15.5" width="37" height="36" rx="8" fill="none" stroke="white" strokeWidth="4"/>
    <path d="M15.5 25h33" stroke="white" strokeWidth="4"/>
    <path d="M23 11v9M41 11v9" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M21 33h10v10h12" fill="none" stroke="#ffd43b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="21" cy="33" r="3" fill="white"/><circle cx="31" cy="43" r="3" fill="white"/><circle cx="43" cy="43" r="3" fill="#ffd43b"/>
  </svg>
);

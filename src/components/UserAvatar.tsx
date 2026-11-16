import React from 'react';
import { findAvatarPreset } from '../utils/avatars';

interface UserAvatarProps {
  photoUrl?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-2xl',
} as const;

export const UserAvatar: React.FC<UserAvatarProps> = ({
  photoUrl,
  name,
  size = 'md',
  className = '',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const sizeCls = SIZE_MAP[size];
  const preset = findAvatarPreset(photoUrl);

  if (preset) {
    const gradId = `avGrad-${uid}`;
    return (
      <div
        className={`${sizeCls} rounded-full overflow-hidden shrink-0 shadow-md border border-white/20 flex items-center justify-center ${className}`}
        aria-label={name || preset.labelEn}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={gradId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={preset.bgFrom} />
              <stop offset="100%" stopColor={preset.bgTo} />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${gradId})`} />
          <circle cx="32" cy="32" r="27" stroke={preset.accent} strokeOpacity="0.28" strokeWidth="1.5" fill="none" />
          {preset.glyph === 'falcon' && (
            <path
              d="M18 42C21 31 28 21 36 17C38 22 44 26 47 32C41 32 37 35 35 42L29 38L24 44L18 42Z"
              fill={preset.accent}
            />
          )}
          {preset.glyph === 'nile' && (
            <>
              <circle cx="32" cy="24" r="7" fill={preset.accent} />
              <path
                d="M14 40C20 35 26 45 32 40C38 35 44 45 50 40"
                stroke={preset.accent}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {preset.glyph === 'lotus' && (
            <path
              d="M32 16C37 24 38 34 32 44C26 34 27 24 32 16ZM20 26C26 28 30 35 31 44C23 41 19 34 20 26ZM44 26C38 28 34 35 33 44C41 41 45 34 44 26Z"
              fill={preset.accent}
            />
          )}
          {preset.glyph === 'pyramid' && (
            <>
              <path d="M12 45L28 21L42 45H12Z" fill={preset.accent} />
              <path d="M32 45L42 29L52 45H32Z" fill={preset.accent} fillOpacity="0.72" />
            </>
          )}
          {preset.glyph === 'felucca' && (
            <>
              <path d="M31 15L45 37H31V15Z" fill={preset.accent} />
              <path d="M18 40H46L41 46H23L18 40Z" fill={preset.accent} fillOpacity="0.82" />
            </>
          )}
          {preset.glyph === 'star' && (
            <path
              d="M32 14L36.5 25.5L49 26.5L39.5 34.5L42.5 47L32 40L21.5 47L24.5 34.5L15 26.5L27.5 25.5L32 14Z"
              fill={preset.accent}
            />
          )}
        </svg>
      </div>
    );
  }

  if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:image/'))) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Member avatar'}
        referrerPolicy="no-referrer"
        className={`${sizeCls} rounded-full object-cover border border-white/25 shadow-md shrink-0 ${className}`}
      />
    );
  }

  const initial = (name || 'L').trim().slice(0, 1).toUpperCase();
  return (
    <div
      className={`${sizeCls} rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center font-extrabold text-white border border-white/20 shadow-md shrink-0 ${className}`}
      aria-label={name || 'Member avatar'}
    >
      {initial}
    </div>
  );
};

'use client';

export function TokenIcon({ className = "w-5 h-5", animate = false }: { 
  className?: string;
  animate?: boolean;
}) {
  return (
    <div className={`relative ${animate ? 'group' : ''}`}>
      <svg 
        className={`${className} ${animate ? 'group-hover:animate-spin-slow' : ''}`}
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          className="fill-background/20 stroke-primary" 
          strokeWidth="2"
        />
        <path 
          d="M12 6L12 18M18 12L6 12" 
          className="stroke-primary" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
        <circle 
          cx="12" 
          cy="12" 
          r="3" 
          className="fill-primary"
        />
      </svg>
    </div>
  );
} 
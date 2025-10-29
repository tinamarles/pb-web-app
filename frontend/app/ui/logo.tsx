interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'text-only' | 'app-icon';
  className?: string;
}

export function Logo({ size = 'md', variant = 'full', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl', 
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  const iconSize = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56
  };

  const HubIcon = ({ isAppIcon = false }: { isAppIcon?: boolean }) => (
    <svg 
      width={iconSize[size]} 
      height={iconSize[size]} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Abstract hub design with overlapping rounded shapes */}
      
      {/* Connecting nodes - creating a sense of community/network */}
      <circle 
        cx="8" 
        cy="8" 
        r="4" 
        fill={isAppIcon ? "white" : "currentColor"} 
        opacity={isAppIcon ? "0.6" : "0.7"}
      />
      
      <circle 
        cx="24" 
        cy="8" 
        r="4" 
        fill={isAppIcon ? "white" : "currentColor"} 
        opacity={isAppIcon ? "0.6" : "0.7"}
      />
      
      <circle 
        cx="8" 
        cy="24" 
        r="4" 
        fill={isAppIcon ? "white" : "currentColor"} 
        opacity={isAppIcon ? "0.6" : "0.7"}
      />
      
      <circle 
        cx="24" 
        cy="24" 
        r="4" 
        fill={isAppIcon ? "white" : "currentColor"} 
        opacity={isAppIcon ? "0.6" : "0.7"}
      />
      
      {/* Main central hub circle */}
      <circle 
        cx="16" 
        cy="16" 
        r="6" 
        fill={isAppIcon ? "white" : "currentColor"}
      />
    </svg>
  );

  if (variant === 'app-icon') {
    const containerSizeClasses = {
      sm: 'w-10 h-10',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20'
    };

    return (
      <div className={`${containerSizeClasses[size]} ${className} bg-primary rounded-xl flex items-center justify-center`}>
        <HubIcon isAppIcon={true} />
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div className={`${sizeClasses[size]} ${className} text-primary`}>
        <HubIcon />
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={`${className} flex items-center`}>
        <span className={`${textSizeClasses[size]} font-medium text-primary`}>
          Pickle <span className="text-muted-foreground">Hub</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center gap-3`}>
      <div className="text-primary">
        <HubIcon />
      </div>
      <span className={`${textSizeClasses[size]} font-medium text-primary`}>
        Pickle <span className="text-primary/80">Hub</span>
      </span>
    </div>
  );
}
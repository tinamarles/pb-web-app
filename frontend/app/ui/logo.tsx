import { memo } from 'react';


export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";                          // Logo size - OPTIONAL
  variant?: "full" | "icon-only" | "text-only" | "app-icon"; // Logo variant - OPTIONAL
  className?: string;                                        // Additional CSS classes - OPTIONAL
}
export const Logo = memo(function Logo({
  size = "md",
  variant = "full",
  className = "",
}: LogoProps) {
  const sizeClasses = {
    xs: "h-[var(--px-16)]",
    sm: "h-[var(--px-32)]",
    md: "h-[var(--px-40)]", 
    lg: "h-[var(--px-48)]",
    xl: "h-[var(--px-64)]",
    xxl: "h-[var(--px-72)],"
  };

  const textSizeClasses = {
    xs: "logo-text-xs",
    sm: "logo-text-sm",
    md: "logo-text-md", 
    lg: "logo-text-lg",
    xl: "logo-text-xl",
    xxl: "logo-text-xxl",
  };

  const iconSize = {
    xs: 16,
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
    xxl: 64,
  };
  const appIconSize = {
    xs: 24,
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
    xxl: 96,
  };
  const appRadiusSize = {
    xs: "rounded-sm",
    sm: "rounded-lg",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    xxl: "rounded-3xl",
  };

  const HubIcon = ({
    isAppIcon = false,
  }: {
    isAppIcon?: boolean;
  }) => (
    <svg
      width={isAppIcon ? appIconSize[size] : iconSize[size]}
      height={isAppIcon ? appIconSize[size] : iconSize[size]}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Connecting nodes - creating a sense of community/network */}
      <circle
        cx="8"
        cy="8"
        r="4"
        fill={isAppIcon ? "var(--color-on-primary)" : "currentColor"}
        opacity={isAppIcon ? "0.6" : "0.7"}
      />

      <circle
        cx="24"
        cy="8"
        r="4"
        fill={isAppIcon ? "var(--color-on-primary)" : "currentColor"}
        opacity={isAppIcon ? "0.6" : "0.7"}
      />

      <circle
        cx="8"
        cy="24"
        r="4"
        fill={isAppIcon ? "var(--color-on-primary)" : "currentColor"}
        opacity={isAppIcon ? "0.6" : "0.7"}
      />

      <circle
        cx="24"
        cy="24"
        r="4"
        fill={isAppIcon ? "var(--color-on-primary)" : "currentColor"}
        opacity={isAppIcon ? "0.6" : "0.7"}
      />

      {/* Main central hub circle */}
      <circle
        cx="16"
        cy="16"
        r="6"
        fill={isAppIcon ? "var(--color-on-primary)" : "currentColor"}
      />
    </svg>
  );

  if (variant === "app-icon") {
    const containerSizeClasses = {
      xs: "w-[var(--px-32)] h-[var(--px-32)]",
      sm: "w-[var(--px-36)] h-[var(--px-36)]",
      md: "w-[var(--px-48)] h-[var(--px-48)]",
      lg: "w-[var(--px-64)] h-[var(--px-64)]",
      xl: "w-[var(--px-80)] h-[var(--px-80)]",
      xxl: "w-[120px] h-[120px]",
    };

    return (
      <div
        className={`${containerSizeClasses[size]} ${className} bg-primary ${appRadiusSize[size]} flex items-center justify-center`}
      >
        <HubIcon isAppIcon={true} />
      </div>
    );
  }

  if (variant === "icon-only") {
    return (
      <div
        className={`${sizeClasses[size]} ${className} text-primary`}
      >
        <HubIcon />
      </div>
    );
  }

  if (variant === "text-only") {
    return (
      <div className={`${className} flex items-center`}>
        <span
          className={`${textSizeClasses[size]} text-primary`}
        >
          Pickle{" "}
          <span className="text-on-primary-container">Hub</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center gap-[var(--px-12)]`}>
      <div className="text-primary">
        <HubIcon />
      </div>
      <span
        className={`${textSizeClasses[size]} text-primary`}
      >
        Pickle{" "}
        <span className="text-primary/80">Hub</span>
      </span>
    </div>
  );
});
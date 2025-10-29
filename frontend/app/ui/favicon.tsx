interface FaviconProps {
  size: number;
  className?: string;
}

export function Favicon({ size, className = "" }: FaviconProps) {
  // Calculate appropriate padding and icon scaling based on size
  const padding = Math.max(2, Math.floor(size * 0.125)); // 12.5% padding, minimum 2px
  const iconSize = size - padding * 2;
  const cornerRadius = Math.max(2, Math.floor(size * 0.125)); // Proportional corner radius

  // For very small sizes (16px), simplify the design
  const isVerySmall = size <= 20;
  const centerRadius = isVerySmall ? iconSize * 0.25 : iconSize * 0.1875; // 25% for small, 18.75% for normal
  const outerRadius = isVerySmall ? iconSize * 0.15 : iconSize * 0.125; // 15% for small, 12.5% for normal
  const outerOpacity = isVerySmall ? "0.7" : "0.6";

  // Position outer circles
  const centerPos = iconSize / 2;
  const offset = isVerySmall ? iconSize * 0.3 : iconSize * 0.35;

  return (
    <div
      className={`${className} bg-primary flex items-center justify-center`}
      style={{
        width: size,
        height: size,
        borderRadius: cornerRadius,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Only show outer circles if there's enough space */}
        {!isVerySmall && (
          <>
            <circle
              cx={centerPos - offset}
              cy={centerPos - offset}
              r={outerRadius}
              fill="white"
              opacity={outerOpacity}
            />

            <circle
              cx={centerPos + offset}
              cy={centerPos - offset}
              r={outerRadius}
              fill="white"
              opacity={outerOpacity}
            />

            <circle
              cx={centerPos - offset}
              cy={centerPos + offset}
              r={outerRadius}
              fill="white"
              opacity={outerOpacity}
            />

            <circle
              cx={centerPos + offset}
              cy={centerPos + offset}
              r={outerRadius}
              fill="white"
              opacity={outerOpacity}
            />
          </>
        )}

        {/* Center circle - always visible */}
        <circle cx={centerPos} cy={centerPos} r={centerRadius} fill="white" />
      </svg>
    </div>
  );
}

import { Logo } from "./logo";

// Pre-sized favicon components for common use cases
export function Favicon16() {
  // Use standard icon without background for better visibility at small size
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <Logo variant="icon-only" size="sm" className="scale-50" />
    </div>
  );
}

export function Favicon32() {
  // Use standard icon without background for clean favicon look
  return (
    <div className="w-8 h-8 flex items-center justify-center">
      <Logo variant="icon-only" size="sm" />
    </div>
  );
}

export function AppleIcon() {
  // Use app-icon variant with background for Apple Touch Icon
  return <Favicon size={180} />;
}

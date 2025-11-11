// frontend/app/pages/Landing/PickleballVariants.tsx
// Figma Make: components/landing/PickleballVariants.tsx

import { memo } from "react";

// Base props for all pickleball variants
export interface PickleballVariantProps {
  variant: "blue" | "yellow" | "orange" | "green";
  size?: number;
  className?: string;
}

// Fibonacci grid distribution for authentic pickleball hole pattern
function generatePickleballHoles(N: number, radius: number) {
  const goldenRatio = (1 + Math.sqrt(5)) / 2; // φ ≈ 1.618
  const holes = [];

  for (let i = 1; i <= N; i++) {
    // Calculate spherical coordinates using Fibonacci grid
    const phi = (2 * Math.PI * i) / goldenRatio; // Azimuthal angle
    const theta = Math.acos(1 - (2 * i - 1) / N); // Polar angle

    // Convert to Cartesian coordinates
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta); // Depth (for perspective)

    // Only include holes on the visible hemisphere (z >= 0)
    if (z >= 0) {
      holes.push({
        x: x,
        y: -y, // Flip Y for SVG coordinate system
        z: z,
        distanceFromCenter: Math.sqrt(x * x + y * y) / radius,
      });
    }
  }

  return holes;
}

// Main pickleball component with Fibonacci hole distribution
export const BluePickleball = memo(function BluePickleball({
  size = 120,
  className = "",
}: Omit<PickleballVariantProps, "variant">) {
  const radius = size / 2;
  const holeRadius = size * 0.035;

  // Generate 26 holes total, but only show ~13 on visible hemisphere
  const holes = generatePickleballHoles(26, radius * 0.85); // Slightly smaller radius for realistic placement

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      className={className}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
    >
      <defs>
        <radialGradient
          id={`blueGradient-${size}`}
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#e0e0fc" />
          <stop offset="70%" stopColor="#c2c4e9" />
          <stop offset="100%" stopColor="#545a92" />
        </radialGradient>

        <radialGradient id="blueHoleGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#252b61" />
          <stop offset="100%" stopColor="#0f154b" />
        </radialGradient>
      </defs>

      {/* Main ball sphere */}
      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={`url(#blueGradient-${size})`}
        stroke="#3c4279"
        strokeWidth="0.5"
      />

      {/* Fibonacci distributed holes */}
      {holes.map((hole, index) => {
        // Calculate perspective effect based on z-depth
        const perspectiveFactor =
          (radius * 0.85 - hole.z) / (radius * 0.85); // 0 = front, 1 = edge
        const edgeThreshold = 0.7; // When holes start becoming elliptical

        if (perspectiveFactor > edgeThreshold) {
          // Edge holes become elliptical with LONG axis tangent to circumference
          const stretch =
            1.2 + (perspectiveFactor - edgeThreshold) * 0.3; // Subtle stretch

          // Calculate angle for tangent orientation (perpendicular to radius)
          const radialAngle = Math.atan2(hole.y, hole.x);
          const tangentAngle = radialAngle + Math.PI / 2; // 90° rotation for tangent
          const angleDegrees = tangentAngle * (180 / Math.PI);

          return (
            <ellipse
              key={index}
              cx={hole.x}
              cy={hole.y}
              rx={holeRadius * stretch} // Long axis (horizontal before rotation)
              ry={holeRadius} // Short axis (vertical before rotation)
              transform={`rotate(${angleDegrees} ${hole.x} ${hole.y})`}
              fill="url(#blueHoleGradient)"
              stroke="#252b61"
              strokeWidth="0.3"
            />
          );
        } else {
          // Center and middle holes stay circular
          return (
            <circle
              key={index}
              cx={hole.x}
              cy={hole.y}
              r={holeRadius}
              fill="url(#blueHoleGradient)"
              stroke="#252b61"
              strokeWidth="0.3"
            />
          );
        }
      })}
    </svg>
  );
});

// Tournament yellow pickleball with same Fibonacci distribution
export const YellowPickleball = memo(function YellowPickleball({
  size = 120,
  className = "",
}: Omit<PickleballVariantProps, "variant">) {
  const radius = size / 2;
  const holeRadius = size * 0.035;

  const holes = generatePickleballHoles(26, radius * 0.85);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      className={className}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
    >
      <defs>
        <radialGradient
          id={`yellowGradient-${size}`}
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="70%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#daa520" />
        </radialGradient>

        <radialGradient
          id="yellowHoleGradient"
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#8b6914" />
          <stop offset="100%" stopColor="#654321" />
        </radialGradient>
      </defs>

      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={`url(#yellowGradient-${size})`}
        stroke="#b8860b"
        strokeWidth="0.5"
      />

      {holes.map((hole, index) => {
        const perspectiveFactor =
          (radius * 0.85 - hole.z) / (radius * 0.85);
        const edgeThreshold = 0.7;

        if (perspectiveFactor > edgeThreshold) {
          const stretch =
            1.2 + (perspectiveFactor - edgeThreshold) * 0.3;
          const radialAngle = Math.atan2(hole.y, hole.x);
          const tangentAngle = radialAngle + Math.PI / 2;
          const angleDegrees = tangentAngle * (180 / Math.PI);

          return (
            <ellipse
              key={index}
              cx={hole.x}
              cy={hole.y}
              rx={holeRadius * stretch}
              ry={holeRadius}
              transform={`rotate(${angleDegrees} ${hole.x} ${hole.y})`}
              fill="url(#yellowHoleGradient)"
              stroke="#8b6914"
              strokeWidth="0.3"
            />
          );
        } else {
          return (
            <circle
              key={index}
              cx={hole.x}
              cy={hole.y}
              r={holeRadius}
              fill="url(#yellowHoleGradient)"
              stroke="#8b6914"
              strokeWidth="0.3"
            />
          );
        }
      })}
    </svg>
  );
});

// Orange outdoor pickleball
export const OrangePickleball = memo(function OrangePickleball({
  size = 120,
  className = "",
}: Omit<PickleballVariantProps, "variant">) {
  const radius = size / 2;
  const holeRadius = size * 0.035;

  const holes = generatePickleballHoles(26, radius * 0.85);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      className={className}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
    >
      <defs>
        <radialGradient
          id={`orangeGradient-${size}`}
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#ffe4b5" />
          <stop offset="70%" stopColor="#ff8c00" />
          <stop offset="100%" stopColor="#ff6347" />
        </radialGradient>

        <radialGradient
          id="orangeHoleGradient"
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#8b4513" />
          <stop offset="100%" stopColor="#654321" />
        </radialGradient>
      </defs>

      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={`url(#orangeGradient-${size})`}
        stroke="#d2691e"
        strokeWidth="0.5"
      />

      {holes.map((hole, index) => {
        const perspectiveFactor =
          (radius * 0.85 - hole.z) / (radius * 0.85);
        const edgeThreshold = 0.7;

        if (perspectiveFactor > edgeThreshold) {
          const stretch =
            1.2 + (perspectiveFactor - edgeThreshold) * 0.3;
          const radialAngle = Math.atan2(hole.y, hole.x);
          const tangentAngle = radialAngle + Math.PI / 2;
          const angleDegrees = tangentAngle * (180 / Math.PI);

          return (
            <ellipse
              key={index}
              cx={hole.x}
              cy={hole.y}
              rx={holeRadius * stretch}
              ry={holeRadius}
              transform={`rotate(${angleDegrees} ${hole.x} ${hole.y})`}
              fill="url(#orangeHoleGradient)"
              stroke="#8b4513"
              strokeWidth="0.3"
            />
          );
        } else {
          return (
            <circle
              key={index}
              cx={hole.x}
              cy={hole.y}
              r={holeRadius}
              fill="url(#orangeHoleGradient)"
              stroke="#8b4513"
              strokeWidth="0.3"
            />
          );
        }
      })}
    </svg>
  );
});

// Green pickleball
export const GreenPickleball = memo(function GreenPickleball({
  size = 120,
  className = "",
}: Omit<PickleballVariantProps, "variant">) {
  const radius = size / 2;
  const holeRadius = size * 0.035;

  const holes = generatePickleballHoles(26, radius * 0.85);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-radius} ${-radius} ${size} ${size}`}
      className={className}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
      }}
    >
      <defs>
        <radialGradient
          id={`greenGradient-${size}`}
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#f0fff0" />
          <stop offset="70%" stopColor="#32cd32" />
          <stop offset="100%" stopColor="#228b22" />
        </radialGradient>

        <radialGradient
          id="greenHoleGradient"
          cx="30%"
          cy="30%"
        >
          <stop offset="0%" stopColor="#2e8b57" />
          <stop offset="100%" stopColor="#1a5d3a" />
        </radialGradient>
      </defs>

      <circle
        cx="0"
        cy="0"
        r={radius}
        fill={`url(#greenGradient-${size})`}
        stroke="#2e8b57"
        strokeWidth="0.5"
      />

      {holes.map((hole, index) => {
        const perspectiveFactor =
          (radius * 0.85 - hole.z) / (radius * 0.85);
        const edgeThreshold = 0.7;

        if (perspectiveFactor > edgeThreshold) {
          const stretch =
            1.2 + (perspectiveFactor - edgeThreshold) * 0.3;
          const radialAngle = Math.atan2(hole.y, hole.x);
          const tangentAngle = radialAngle + Math.PI / 2;
          const angleDegrees = tangentAngle * (180 / Math.PI);

          return (
            <ellipse
              key={index}
              cx={hole.x}
              cy={hole.y}
              rx={holeRadius * stretch}
              ry={holeRadius}
              transform={`rotate(${angleDegrees} ${hole.x} ${hole.y})`}
              fill="url(#greenHoleGradient)"
              stroke="#2e8b57"
              strokeWidth="0.3"
            />
          );
        } else {
          return (
            <circle
              key={index}
              cx={hole.x}
              cy={hole.y}
              r={holeRadius}
              fill="url(#greenHoleGradient)"
              stroke="#2e8b57"
              strokeWidth="0.3"
            />
          );
        }
      })}
    </svg>
  );
});

// Unified pickleball component with variant prop
export const PickleballVariant = memo(
  function PickleballVariant({
    variant,
    size = 120,
    className = "",
  }: PickleballVariantProps) {
    switch (variant) {
      case "blue":
        return (
          <BluePickleball size={size} className={className} />
        );
      case "yellow":
        return (
          <YellowPickleball size={size} className={className} />
        );
      case "orange":
        return (
          <OrangePickleball size={size} className={className} />
        );
      case "green":
        return (
          <GreenPickleball size={size} className={className} />
        );
      default:
        return (
          <BluePickleball size={size} className={className} />
        );
    }
  },
);
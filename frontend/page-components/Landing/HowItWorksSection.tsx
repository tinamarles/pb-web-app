// === MODIFICATION LOG ===
// Date: 2025-11-11 UTC
// Modified by: Assistant
// Changes: Updated layout - numbers only in colored circles, icons in outlined circles next to titles
// Previous: Icons and numbers together in colored circles
// Purpose: Cleaner separation of step number and feature icon
// ========================

import { Icon } from "@/ui";

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up and set up your player or club profile in minutes. Add your preferences and connect with your clubs.",
    icon: "profile",
    colorScheme: "primary" as const,
  },
  {
    number: "02",
    title: "Join or Create Leagues",
    description:
      "Browse available leagues at your clubs and enroll, or create new leagues if you're a club administrator.",
    icon: "leagues",
    colorScheme: "secondary" as const,
  },
  {
    number: "03",
    title: "Track & Connect",
    description:
      "Monitor your progress, view statistics, and stay connected with your pickleball community.",
    icon: "performance",
    colorScheme: "tertiary" as const,
  },
];

// Color class mappings for each step
const getColorClasses = (scheme: "primary" | "secondary" | "tertiary") => {
  const colorMap = {
    primary: {
      circleBg: "bg-primary",
      circleText: "text-on-primary",
      connector: "border-primary",
    },
    secondary: {
      circleBg: "bg-secondary",
      circleText: "text-on-secondary",
      connector: "border-secondary",
    },
    tertiary: {
      circleBg: "bg-tertiary",
      circleText: "text-on-tertiary",
      connector: "border-tertiary",
    },
  };
  return colorMap[scheme];
};

export function HowItWorksSection() {
  return (
    <section className="bg-surface-container-highest py-section-mobile lg:py-section-desktop">
      <div
        className="max-w-7xl mx-auto p-card
                      sm:p-section-mobile  
                      lg:p-section-desktop"
      >
        <div className="flex flex-col gap-4xl">
          {/* Section Header */}
          <div className="flex flex-col gap-md text-center max-w-2xl mx-auto">
            <h2
              className="headline-lg text-primary
                           sm:headline-lg
                           lg:display-sm"
            >
              How It Works
            </h2>
            <p className="subheading-lg text-on-surface-variant">
              Get started in three simple steps
            </p>
          </div>

          {/* Steps with Connected Circles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3xl md:gap-xl">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.colorScheme);

              return (
                <div
                  key={index}
                  className="relative flex flex-col items-center gap-lg"
                >
                  {/* Connector Line - Desktop Only */}
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-12 left-[calc(50%+48px)] w-[calc(100%-48px)] h-0.5 border-t-2 border-dashed ${colors.connector} opacity-30`}
                      aria-hidden="true"
                    />
                  )}

                  {/* Circle with Number Only */}
                  <div
                    className={`relative z-10 w-24 h-24 rounded-full ${colors.circleBg} flex items-center justify-center shadow-elevation-md transition-transform duration-200 hover:scale-110`}
                  >
                    <span className={`display-sm ${colors.circleText}`}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Content */}
                  <div className="flex flex-col gap-sm items-center text-center max-w-xs">
                    {/* Icon Circle with Outline + Title */}
                    <div className="flex items-center gap-md">
                      <div
                        className={`w-12 h-12 rounded-full border-2 ${colors.circleBg} ${colors.connector} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon
                          name={step.icon}
                          className={`w-6 h-6 ${colors.circleText}`}
                        />
                      </div>
                      <h3 className="title-lg text-on-surface">{step.title}</h3>
                    </div>
                    <p className="text-on-surface-variant">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

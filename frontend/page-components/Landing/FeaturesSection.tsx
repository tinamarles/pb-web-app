// === MODIFICATION LOG ===
// Date: 2025-11-11 UTC
// Modified by: Assistant
// Changes: Created FeaturesSection component for landing page
// Purpose: Display key features for players and clubs
// ========================

import { memo } from "react";
import { Icon } from "@/ui";

interface Feature {
  icon: string;
  title: string;
  description: string;
  color?: "primary" | "secondary" | "tertiary";
}

const playerFeatures: Feature[] = [
  {
    icon: "achievements",
    title: "Track Your Progress",
    description:
      "View your league standings, match history, and personal statistics across all your competitions.",
    color: "primary",
  },
  {
    icon: "community",
    title: "Stay Connected",
    description:
      "Find and connect with club members, coaches, and other players in your community.",
    color: "secondary",
  },
  {
    icon: "calendar",
    title: "Manage Schedules",
    description:
      "Keep track of league dates, match times, and important events across all your clubs.",
    color: "tertiary",
  },
];

const clubFeatures: Feature[] = [
  {
    icon: "community",
    title: "Member Management",
    description:
      "Easily add, organize, and communicate with club members through a centralized platform.",
    color: "primary",
  },
  {
    icon: "leagues",
    title: "League Creation",
    description:
      "Set up and manage multiple leagues with custom formats, schedules, and registration.",
    color: "secondary",
  },
  {
    icon: "notifications",
    title: "Smart Notifications",
    description:
      "Send targeted updates to all members or specific groups with important announcements.",
    color: "tertiary",
  },
];

const getColorClasses = (color: Feature["color"]) => {
  switch (color) {
    case "primary":
      return {
        iconBg: "bg-primary",
        iconText: "text-on-primary",
        titleText: "text-primary",
      };
    case "secondary":
      return {
        iconBg: "bg-secondary",
        iconText: "text-on-secondary",
        titleText: "text-secondary",
      };
    case "tertiary":
      return {
        iconBg: "bg-tertiary",
        iconText: "text-on-tertiary",
        titleText: "text-on-Surface",
      };
  }
};

export const FeaturesSection = memo(function FeaturesSection() {
  return (
    <section className="bg-surface-container py-section-mobile lg:py-section-desktop">
      <div className="max-w-7xl mx-auto p-card">
        {/* Section Header Players*/}
        <div className="text-center mb-3xl lg:mb-4xl">
          {/* For Players */}
          <div className="flex flex-col gap-lg">
            <div className="flex flex-col gap-md text-center max-w-2xl mx-auto">
              <h2
                className="headline-lg text-on-surface
                             lg:display-sm"
              >
                For Players
              </h2>
              <p className="subtitle-lg md:title-md text-on-surface-variant">
                Everything you need to stay on top of your pickleball game
              </p>
            </div>

            {/* Player Features Grid */}
            <div
              className="grid gap-2xl
                            sm:grid-cols-2 sm:gap-xl
                            lg:grid-cols-3 lg:gap-2xl"
            >
              {playerFeatures.map((feature, index) => {
                const colorClassesPlayerFeatures = getColorClasses(
                  feature.color
                );
                return (
                  <div
                    key={index}
                    className="group flex flex-col gap-lg p-2xl 
                              bg-surface-container-lowest border border-outline-variant 
                              rounded-2xl transition-all duration-200
                              hover:shadow-md hover:border-primary/20 hover:-translate-y-1"
                  >
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 ${colorClassesPlayerFeatures?.iconBg} ${colorClassesPlayerFeatures?.iconText} 
                                       rounded-xl flex items-center justify-center
                                       group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon name={feature.icon} className="icon-2xl" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-md">
                      <h3
                        className={`title-lg ${colorClassesPlayerFeatures?.titleText} emphasized`}
                      >
                        {feature.title}
                      </h3>

                      <p className="body-md text-on-surface-variant leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Header Clubs */}
          <div className="mt-8 flex flex-col gap-lg">
            <div className="flex flex-col gap-md text-center max-w-2xl mx-auto">
              <h2
                className="headline-lg text-on-surface
                             lg:display-sm"
              >
                For Clubs
              </h2>
              <p className="subtitle-lg md:title-md text-on-surface-variant">
                Powerful tools to manage your club and engage your members
              </p>
            </div>

            {/* Club Features Grid */}
            <div
              className="grid gap-2xl
                            sm:grid-cols-2 sm:gap-xl
                            lg:grid-cols-3 lg:gap-2xl"
            >
              {clubFeatures.map((feature, index) => {
                const colorClassesClubFeatures = getColorClasses(feature.color);
                return (
                  <div
                    key={index}
                    className="group flex flex-col gap-lg p-2xl 
                              bg-surface-container-lowest border border-outline-variant 
                              rounded-2xl transition-all duration-200
                              hover:shadow-md hover:border-primary/20 hover:-translate-y-1"
                  >
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 ${colorClassesClubFeatures?.iconBg} ${colorClassesClubFeatures?.iconText} 
                                       rounded-xl flex items-center justify-center
                                       group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon name={feature.icon} className="icon-2xl" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-md">
                      <h3
                        className={`title-lg ${colorClassesClubFeatures?.titleText} emphasized`}
                      >
                        {feature.title}
                      </h3>

                      <p className="body-md text-on-surface-variant leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

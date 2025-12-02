import { Module } from "@/shared";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { CTASection } from "./CTASection";
import { ThemeToggle } from "@/ui";

export function LandingPage() {
  return (
    <Module type="landing">
      {/* Theme selector for testing */}
      <div className="fixed top-20 right-12 z-40">
        <ThemeToggle />
      </div>
      <div className="page__content gap-0">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
      </div>
    </Module>
  );
}

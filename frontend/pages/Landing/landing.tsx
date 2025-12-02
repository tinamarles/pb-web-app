'use client';
import { Module } from "@/app/shared";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { CTASection } from "./CTASection";
import { ThemeToggle } from "@/app/ui";

export function LandingPage() {
  return (
    <Module type='landing'>
      {/* Theme selector for testing */}
      <div className="fixed top-20 right-12 z-40">
        <ThemeToggle />
      </div>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </Module>
  );
}
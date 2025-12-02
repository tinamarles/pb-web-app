"use client";
import Link from "next/link";
import { Icon, Button } from "@/app/ui";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute top-1/2 right-0 w-48 h-48 bg-white rounded-full translate-x-24 -translate-y-24"></div>
        <div className="absolute bottom-0 left-1/2 w-56 h-56 bg-white rounded-full -translate-x-28 translate-y-28"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto py-section-mobile p-card
                      sm:py-section-mobile sm:p-section-mobile
                      lg:py-section-desktop lg:p-section-desktop">
        
        <div className="text-center">
          <div className="flex flex-col gap-2xl items-center">
            
            {/* Main CTA Content */}
            <div className="flex flex-col gap-lg max-w-4xl">
              <h2 className="headline-lg text-on-primary
                             sm:display-sm
                             lg:display-md">
                Ready to Find Your
                <br />
                <span className="slogan-sm lg:slogan-md">Perfect Pickleball Match?</span>
              </h2>
              
              <p className="body-lg text-on-primary/80 max-w-2xl mx-auto">
                Join the fastest-growing pickleball community. Sign Up with Pickle Hub today
                and discover amazing clubs, coaches, exciting leagues and so much more.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-md items-center w-full
                            sm:flex-row sm:justify-center sm:gap-xl sm:w-auto">
              <Button
                variant="tonal"
                size="cta"
                className="w-full sm:w-auto bg-on-primary text-primary hover:bg-on-primary/90"
                icon="arrowright"
                asChild
              >
                <Link href="/signup">
                  Sign Up for Free
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

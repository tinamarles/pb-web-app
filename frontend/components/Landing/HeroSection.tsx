"use client";
import { Icon, Button } from "@/ui";
import { AnimatedBackground } from "./AnimatedBackground";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <AnimatedBackground />
      <div
        className="relative z-10 p-card 
                      gap-2xl
                      sm:gap-3xl sm:p-section-mobile
                      lg:gap-4xl lg:p-section-desktop"
      >
        {/* Hero Content Grid */}
        <div
          className="flex flex-col gap-2xl
                        lg:flex-row lg:items-center lg:gap-4xl"
        >
          {/* Left Column - Content */}
          <div className="flex flex-col gap-2xl w-full lg:w-auto lg:flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="flex justify-center lg:justify-start">
              <div
                className="inline-flex items-center gap-sm p-md bg-primary text-on-primary 
                              rounded-full border border-primary/20"
              >
                <Icon name="star" className="icon-sm fill-current" />
                <span className="label-lg text-on-primary">
                  #1 Pickleball App
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="flex flex-col gap-lg">
              <h1
                className="display-lg text-on-background 
                             sm:display-lg 
                             lg:display-lg"
              >
                <span className="text-primary">Pickle Hub</span>
                <br />
                Where Players
                <br />
                <span className="slogan-sm text-secondary lg:slogan-md">
                  Connect & Compete
                </span>
              </h1>

              <p className="body-lg text-on-surface-variant max-w-2xl mx-auto lg:mx-0">
                Join thousands of pickleball enthusiasts finding games, tracking
                progress, and building community. From casual matches to
                competitive tournaments, your perfect game is just a tap away.
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col gap-md items-center
                            sm:flex-row sm:justify-center sm:gap-xl 
                            lg:justify-start"
            >
              <Button
                variant="filled"
                size="cta"
                className="w-full sm:w-auto"
                icon="arrowright"
                href="/signup"
                label="Start Playing Today"
              />

              <Button
                variant="outlined"
                size="cta"
                className="w-full bg-background hover:bg-primary/80 sm:w-auto"
                icon="signin"
                href="/login"
                label="Sign In"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex justify-between gap-2xl pt-xl">
              <div className="flex flex-col sm:flex-row items-center gap-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-primary border-2 border-background"
                    ></div>
                  ))}
                </div>
                <span className="body-sm sm:body-md text-on-surface-variant">
                  <span className="emphasized text-primary">500+</span> active
                  players
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-sm">
                <div className="flex -space-x-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-secondary border-2 border-background"
                    ></div>
                  ))}
                </div>
                <span className="body-sm sm:body-md text-on-surface-variant">
                  <span className="emphasized text-primary">20+</span> Partner
                  Clubs
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-tertiary border-2 border-background"
                    ></div>
                  ))}
                </div>
                <span className="body-sm sm:body-md text-on-surface-variant">
                  <span className="emphasized text-primary">100+</span> Active
                  Leagues
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Image Placeholder */}
          <div className="relative w-full aspect-2/3 max-w-md mx-auto lg:max-w-none lg:w-1/3">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://res.cloudinary.com/dvjri35p2/image/upload/v1762894233/jon-matthews-aUBZRcUdAYk-unsplash_qurslo.jpg"
                alt="Pickleball players in action"
                fill
                className="object-cover rounded-2xl"
                sizes="(max-width:768px) 100vw, 33vw"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-secondary rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthUserProvider";
import ThemeToggle from "@/app/ui/ThemeToggle";
//import { Footer } from "@/app/ui/Footer";
import { Footer } from '@/app/shared';
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Logo, Button } from "@/app/ui";
import {
  ShowLogin,
  ShowLogout,
  ShowDashboard,
  ShowSignUp,
} from "@/app/ui/MenuIcons";

function HeaderSectionSwitch() {
  const links = [
    { name: "Features", href: "#features" },
    { name: "Coaches", href: "#coaches" },
    { name: "Clubs", href: "#clubs" },
    { name: "Community", href: "#community" },
    { name: "Blog", href: "#blog" },
  ];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  // get the AuthUserContext
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full gap-4 flex flex-col justify-center bg-background border-b border-outline-variant h-16">
        <div className="flex items-center justify-between px-4 w-full">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center"
          >
            <Logo size="md" variant="full" />
          </Link>

          {/* Menu */}
          <div className="hidden lg:flex items-center gap-4 text-sm">
            {links.map((link, index) => (

              <Button key={index} asChild variant="subtle" size="md">  
                <Link key={index} href={link.href}>  
                  {link.name}  
                </Link>
              </Button> 
             
            ))}
          </div>
          {/* CTA Button */}
          <div className="flex lg:order-2 gap-4 items-center">
            <div className="hidden md:flex md:gap-4">
              {user ? (
                <>
                  <ShowDashboard />
                </>
              ) : (
                <>
                  <ShowLogin />
                  <ShowSignUp />
                </>
              )}
            </div>
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className=" lg:hidden p-2 rounded-full hover:bg-tertiary/80"
            >
              <Bars3Icon className="h-6 w-6 rounded-full text-on-surface hover:text-surface transition-colors" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-0 w-full z-50 lg:hidden bg-neutral-200 dark:bg-gray-800 p-2">
          <div className="rounded-lg bg-neutral-100 dark:bg-secondary-800 p-2 shadow-md dark:shadow-gray-700">
            <div className="flex justify-between items-center">
              <Logo size="md" />
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="h-6 w-6 rounded-full text-neutral-500 hover:text-green-600 transition-colors" />
              </button>
            </div>
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-neutral-800 dark:text-neutral-200 block p-2 hover:text-primary hover:bg-neutral-100 dark:hover:bg-gray-700 rounded"
              >
                {link.name}
              </a>
            ))}
            <div className="md:hidden w-full rounded-lg p-4 bg-neutral-200 dark:bg-secondary-600">
              <div className="flex flex-row content-center items-center justify-center gap-3">
                {user ? (
                  <>
                    <ShowDashboard />
                  </>
                ) : (
                  <>
                    <ShowLogin />
                    <ShowSignUp />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <section className="pt-8 lg:pt-24 pb-8 lg:pb-24 px-8 lg:px-30 bg-neutral-100 dark:bg-secondary-800 transition-colors">
      <div className="container mx-auto px-6 pt-20 pb-20 lg:pt-32 lg:pb-32 flex flex-col lg:flex-row items-center justify-between">
        <div className="lg:w-1/2 text-center text-neutral-900 dark:text-neutral-100 lg:text-left mb-10 lg:mb-0 flex-1">
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
            Your Ultimate Pickleball Companion
          </h1>
          <p className="mt-4 text-lg lg:text-xl">
            Connect with clubs, find expert coaches, book courts, and elevate
            your game with PicklePro. Everything you need to play, all in one
            place.
          </p>
          <div className="mt-8 flex justify-center lg:justify-start space-x-4">
            <button className="px-6 py-3 bg-primary text-white rounded-lg font-bold shadow-lg transform transition hover:scale-105">
              Get Started
            </button>
            <button className="px-6 py-3 border border-primary dark:border-white text-primary dark:text-white rounded-lg font-bold shadow-lg transform transition hover:scale-105 hover:bg-white hover:text-[#0D131F]">
              Learn More
            </button>
          </div>
        </div>
        <div className="lg:w-1/2 shrink-0">
          <Image
            src="https://placehold.co/536x383/10B981/ffffff?text=Pickleball+Players"
            alt="Pickleball Players"
            width={536}
            height={383}
            unoptimized
            className="rounded-3xl shadow-2xl w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

// Define a type for the features data
interface Feature {
  title: string;
  text: string;
  icon: React.JSX.Element;
}

// Section for showcasing features
function FeaturesSection() {
  const features: Feature[] = [
    {
      title: "Find a Club",
      text: "Connect with nearby pickleball clubs and join the community. Browse and find new local clubs.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2v-2a4 4 0 014-4h12c5.523 0 10-4.477 10-10V2a2 2 0 00-2-2H2a2 2 0 00-2 2v14a6 6 0 006 6h16zm-7-2a4 4 0 01-4-4v-2a4 4 0 014-4h4a4 4 0 014 4v2a4 4 0 01-4 4h-4z"
          />
        </svg>
      ),
    },
    {
      title: "Pickleball Training",
      text: "Improve your skills with structured training plans and certified coaches. Access on-demand training plans.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.5C12 5.12 10.88 4 9.5 4S7 5.12 7 6.5v8c0 1.38 1.12 2.5 2.5 2.5S12 15.88 12 14.5V6.5zM12 6.5V14.5M14 14.5h2.5c1.38 0 2.5-1.12 2.5-2.5V6.5c0-1.38-1.12-2.5-2.5-2.5H14"
          />
        </svg>
      ),
    },
    {
      title: "Find a Coach",
      text: "Discover certified pickleball coaches, read reviews, and book private or group lessons.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      title: "Courts Booking",
      text: "Easily find and book pickleball courts at your favorite local facilities. View availability and book instantly.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Events & Tournaments",
      text: "Stay updated on local tournaments, social events, and competitive leagues. Register and track your progress.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7v-1a2 2 0 012-2h4a2 2 0 012 2v1m0 0h-4m4 0h4a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2h4a2 2 0 012 2v1m0 0h4"
          />
        </svg>
      ),
    },
    {
      title: "Gear & Equipment",
      text: "Browse and buy the latest pickleball paddles, balls, and accessories. Get expert reviews and recommendations.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 lg:py-24 bg-white dark:bg-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Discover What PicklePro Offers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center shadow-lg transform transition-transform hover:scale-105 duration-300"
            >
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Section for Club Management
function ClubManagementSection() {
  const managementFeatures: Feature[] = [
    {
      title: "Member Management",
      text: "Manage members with powerful tools, track membership status, and handle new sign-ups with ease.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H2v-2a4 4 0 014-4h12c5.523 0 10-4.477 10-10V2a2 2 0 00-2-2H2a2 2 0 00-2 2v14a6 6 0 006 6h16zm-7-2a4 4 0 01-4-4v-2a4 4 0 014-4h4a4 4 0 014 4v2a4 4 0 01-4 4h-4z"
          />
        </svg>
      ),
    },
    {
      title: "League Management",
      text: "Set up and run leagues, create brackets, manage standings, and more.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM12 11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM19 19c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM19 21c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
          />
        </svg>
      ),
    },
    {
      title: "Event Organization",
      text: "Create, promote, and manage tournaments, social mixers, and other events.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 lg:py-24 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Comprehensive Club Management for Organizers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {managementFeatures.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Call to Action Section
function CallToActionSection() {
  return (
    <section className="py-12 lg:py-24 bg-gray-100 dark:bg-gray-700 transition-colors">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Create Your Own Club or League Today!
        </h2>
        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Currently, any user with an account can easily create and manage their
          own pickleball clubs and leagues for free.
        </p>
        <button className="px-6 py-3 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors">
          Start a Club or League
        </button>
      </div>
    </section>
  );
}

// Define a type for testimonials data
interface Testimonial {
  name: string;
  text: string;
  image: string;
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Chen",
      text: "PicklePro transformed my game! The training plans and access to certified coaches are fantastic. My coach has never been easier to find, and my partners are fantastic!",
      image: "https://placehold.co/80x80/285E61/FFFFFF?text=SC",
    },
    {
      name: "Michael Lee",
      text: "The comprehensive training modules are a game changer. My backhand is now my favorite shot! PicklePro helped improve my technique, and I also met great new partners for matches.",
      image: "https://placehold.co/80x80/3D405B/FFFFFF?text=ML",
    },
    {
      name: "Jessica Kim",
      text: "An incredibly well-designed app for finding new players, partners, and coaches. The club management tools are a lifesaver!",
      image: "https://placehold.co/80x80/6D9F71/FFFFFF?text=JK",
    },
  ];

  return (
    <section className="py-12 lg:py-24 bg-white dark:bg-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          What Our Players Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-lg text-center"
            >
              <Image
                src={testimonial.image}
                alt={testimonial.name}
                width={64}
                height={64}
                className="rounded-full w-20 h-20 mx-auto mb-4"
                unoptimized={true}
              />
              <p className="text-gray-600 dark:text-gray-400 italic mb-4">
                &quote{testimonial.text}&quote
              </p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                - {testimonial.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Final Call to Action Section
function JoinUsSection() {
  return (
    <section className="py-12 lg:py-24 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Join the PicklePro Community?
        </h2>
        <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Sign up today and unlock a world of pickleball opportunities!
        </p>
        <button className="px-6 py-3 text-white bg-green-600 rounded-lg font-semibold hover:bg-green-700 transition-colors">
          Sign Up Now
        </button>
      </div>
    </section>
  );
}

// The main App component that manages the light/dark theme
const Landing: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  // get the AuthUserContext
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="bg-background">
      <div className="flex flex-col min-h-screen transition-all ease-in-out duration-300">
        <HeaderSectionSwitch />

        <main className="flex-grow">
          <HeroSection />
          <FeaturesSection />
          <ClubManagementSection />
          <CallToActionSection />
          <TestimonialsSection />
          <JoinUsSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Export the main App component
export default Landing;

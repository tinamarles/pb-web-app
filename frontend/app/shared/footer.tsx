// frontend/app/layout/footer.tsx
//
// Component from figma-make ui-brand/layout/footer.tsx

import { memo } from "react";
import { Logo, Icon } from '@/app/ui';

const QUICK_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
] as const;

const SUPPORT_LINKS = [
  { label: "Help Center", href: "#help" },
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
] as const;

const MOBILE_LINKS = [
  { label: "Terms", href: "#terms" },
  { label: "Privacy", href: "#privacy" },
  { label: "Support", href: "#support" },
  { label: "Contact", href: "#contact" },
] as const;

const SOCIAL_LINKS = [
  { icon: "facebook", href: "#facebook", label: "Facebook" },
  { icon: "twitter", href: "#twitter", label: "Twitter" },
  { icon: "instagram", href: "#instagram", label: "Instagram" },
  { icon: "linkedin", href: "#linkedin", label: "LinkedIn" },
] as const;

const FOOTER_DESCRIPTION = "Your ultimate pickleball companion. Connect, play, and improve your game with our comprehensive platform." as const;
const COPYRIGHT_DESCRIPTION ="© 2025 Pickle Hub. All rights reserved." as const;

const SocialLinks = memo(function SocialLinks() {
  return (    
    <>
      {SOCIAL_LINKS.map(({ icon, href, label }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="footer__socialLinks"
        >
          <Icon name={icon} className="icon-xl" />
        </a>
      ))}  
    </>
  );
});

const NavigationSection = memo(function NavigationSection({
  links,
}: {
  links: readonly { label: string; href: string }[];
}) {
  return (
      <nav className="footer__main__ct__nav">
        {links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className=""
          >
            {label}
          </a>
        ))}
      </nav>
    
  );
});

export const Footer = memo(function Footer() {
  return (
   
    <footer className="footer">
        <div className="footer__main">
        {/* Left section - Logo + Description + Social */}
          <div className="footer__main__ct">       
              <Logo />
              <p className="body-md text-on-surface-variant">
              {FOOTER_DESCRIPTION}
              </p>
              <div className="flex gap-lg items-center">
              <SocialLinks />
              </div>
          </div>

          {/* Middle section - Quick Links */}
          <div className="footer__main__ct">
              <h3 className="title-lg">Quick Links</h3>
              <NavigationSection links={QUICK_LINKS} />
          </div>

          {/* Right section - Support */}
          <div className="footer__main__ct">
              <h3 className="title-lg">Support</h3>
              <NavigationSection links={SUPPORT_LINKS} />
          </div>
        </div>
        
        {/* Copyright section */}
        <div className="footer__copyright">
            <p>{COPYRIGHT_DESCRIPTION}</p>
        </div>
        {/* Mobile section only */} 
        <div className='footer__line-1'>
            <Logo variant='icon-only' size='sm' />
            <p>{COPYRIGHT_DESCRIPTION}</p>
        </div>
        <div className="footer__line-2" >
            {MOBILE_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className=""
              >
                {label}
              </a>
            ))}
        </div>        
    </footer>
  );
});
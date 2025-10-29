// Reusable Footer Component
import Link from "next/link";
import { Logo } from "@/app/ui/logo";

import { SiFacebook, SiInstagram } from "@icons-pack/react-simple-icons";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 py-8 text-center text-sm text-gray-600 dark:text-gray-400 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Logo size="sm" />
          <div className="flex space-x-4">
            <Link href="#" className="hover:text-primary transition-colors">
              Explore
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Company
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Community
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <p>&copy; 2025 PickleHub. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            {/* Social media icons can go here using SVGs or other icon libraries */}
            <Link href="#" className="hover:text-primary transition-colors">
              <SiFacebook size={24} />
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              <SiInstagram size={24} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

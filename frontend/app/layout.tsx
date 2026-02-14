import type { Metadata } from "next";
import { inter, outfit, shadowsIntoLightTwo } from "@/ui/fonts";
import "react-day-picker/style.css";
import "@/app/globals.css";
import { Providers } from "@/providers/Providers";
import { Toaster } from "sonner";
  
export const metadata: Metadata = {  
  title: {  
    default: 'PickleHub',  
    template: '%s | PickleHub' // This makes child pages work nicely  
  },  
  description: 'A comprehensive club and league management solution for pickleball communities and players.',  
  keywords: ['pickleball', 'club management', 'league management', 'sports management'],  
  authors: [{ name: 'Tina Marles' }],  
  creator: 'Tina Marles',  
  openGraph: {  
  type: 'website',  
  locale: 'en_US',  
  url: 'https://pb-web-app.vercel.app',  
  siteName: 'PickleHub',  
  title: 'PickleHub - Pickleball League & Club Management',  
  description: 'A comprehensive club and league management solution for pickleball communities and players.',  
  },  
}  

export default function RootLayout({
  children,
}: Readonly<{
    children: React.ReactNode;
  }>) {

  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${shadowsIntoLightTwo.variable} page-container`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster position="top-right" /> {/* ← REQUIRED for toast to show! */}
        </Providers>
      </body>
    </html>
  );
}
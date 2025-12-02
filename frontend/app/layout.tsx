import type { Metadata } from "next";
import { inter, outfit, shadowsIntoLightTwo } from "@/ui/fonts";
import "@/app/globals.css";
import { Providers } from "@/providers/Providers";
import { Toaster } from "sonner";
  
export const metadata: Metadata = {

  title: "Club Management",
  description: "A comprehensive club and league management solution.",

};

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
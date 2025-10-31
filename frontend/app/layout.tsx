import type { Metadata } from "next";
import { inter, outfit, shadowsIntoLightTwo } from "@/app/ui/fonts";
import "@/app/globals.css";
import { Providers } from "@/app/providers/Providers";

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
      className={`${inter.variable} ${outfit.variable} ${shadowsIntoLightTwo.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

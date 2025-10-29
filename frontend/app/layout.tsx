import type { Metadata } from "next";
import { inter } from "@/app/ui/fonts";
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

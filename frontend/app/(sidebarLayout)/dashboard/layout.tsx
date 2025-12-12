// app/(sidebarLayout)/dashboard/layout.tsx

import { DashboardHeader } from "@/components/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <>
        <DashboardHeader />
        {children}
      </>
  );
}

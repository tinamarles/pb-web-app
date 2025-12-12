// app/(sidebarLayout)/profile/layout.tsx

import { ProfileHeader } from "@/components/ProfileHeader";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <>
        <ProfileHeader />
        {children}
      </>
  );
}

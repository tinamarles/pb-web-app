// app/(sidebarLayout)/layout.tsx

import { Module } from "@/shared";
import { ProfileHeader } from "@/components/ProfileHeader";

export default function SidebarLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <Module type="profile">
      <>
        {sidebar}
        <div className="page__content">
          <ProfileHeader />
          {children}
        </div>
      </>
    </Module>
  );
}

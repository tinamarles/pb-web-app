// app/(sidebarLayout)/layout.tsx

import { Module } from "@/app/shared";
import { ProfileHeader } from "@/app/components/ProfileHeader";
import { ProfileSidebar } from "@/app/components/ProfileSidebar";

export default function SidebarLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <Module type='profile'>
      <main>
        <div className='page'>
          <ProfileSidebar />
          <div className='page__content'>
            <ProfileHeader />
            {children}
          </div>
        </div>
      </main>
    </Module>
  );
}

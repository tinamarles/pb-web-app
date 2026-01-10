// app/(sidebarLayout)/layout.tsx
// import { Module } from "@/shared";
import { ModuleClientOnly as Module } from "@/shared";

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
          {children}
        </div>
      </>
    </Module>
    
  );
}

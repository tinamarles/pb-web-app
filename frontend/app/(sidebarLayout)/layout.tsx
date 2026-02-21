// app/(sidebarLayout)/layout.tsx
// import { Module } from "@/shared";
import { ModuleClientOnly as Module } from "@/shared";
import { ErrorToastHandler } from "@/components/ErrorToastHandler";
export default function SidebarLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <>
      <ErrorToastHandler /> {/* Global error handler for API errors */}
      <Module type="profile">
        <>
          {sidebar}
          <div className="page__content sidebar-margin">
            {children}
          </div>
        </>
      </Module>
    </>
    
  );
}

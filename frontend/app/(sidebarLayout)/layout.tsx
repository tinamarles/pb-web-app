// app/(sidebarLayout)/layout.tsx
// import { Module } from "@/shared";
import { ModuleClientOnly as Module } from "@/shared";
import { ErrorToastHandler } from "@/components/ErrorToastHandler";
import { Suspense } from "react";
export default function SidebarLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ErrorToastHandler /> {/* Global error handler for API errors */}
      </Suspense>
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

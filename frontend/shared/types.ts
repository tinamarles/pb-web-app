//
import { ReactNode } from "react";
export interface ModuleProps {
  type: string; // Module type (matches JSON data)
  children: ReactNode; // Page content to render inside module
  title?: string; // Optional title override for dashboard modules
}
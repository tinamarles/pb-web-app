import { notFound } from "next/navigation";

export default function DefaultSidebar() {
  // Match the main default.tsx behavior - trigger not-found
  notFound();
  
  // TypeScript needs a return (though notFound() throws)
  return null;
}
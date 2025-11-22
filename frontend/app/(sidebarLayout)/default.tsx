import { notFound } from "next/navigation";

export default function DefaultPage() {
  // Trigger the not-found.tsx page
  notFound();
}

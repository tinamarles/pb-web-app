import { Icon, Button } from "@/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-lg text-center">
      <Icon
        name="star"
        className="icon-2xl text-on-surface-variant"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-sm">
        <h1 className="headline-lg text-on-surface">Coming Soon!</h1>
        <p className="body-md text-on-surface-variant max-w-md">
          This feature is currently under construction. Check back soon!
        </p>
      </div>

      <Button asChild variant="filled">
        <Link href="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}

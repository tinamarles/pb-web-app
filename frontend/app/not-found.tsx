// 404 Not Found Page

import Link from "next/link";
import { Button, Icon } from "@/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-container">
      <div className="flex max-w-2xl flex-col items-center gap-2xl text-center">
        {/* Pickleball Icon */}
        <div className="flex items-center justify-center rounded-full bg-primary/20 p-hero">
          <Icon name="default" size="5xl" className="text-primary" />
        </div>

        {/* Error Code */}
        <div className="display-lg text-secondary">404</div>

        {/* Heading */}
        <h1 className="headline-lg text-on-surface">
          Oops! That shot went out of bounds
        </h1>

        {/* Description */}
        <p className="body-lg text-on-surface-variant">
          The page you&apos;re looking for doesn&apos;t exist. It might have
          been moved, deleted, or you might have hit the ball a little too hard.
        </p>

        {/* Actions */}
        <div className="mt-lg flex flex-wrap items-center justify-center gap-md">
          <Link href="/dashboard/overview">
            <Button variant="filled" size="lg">
              <Icon name="home" size="md" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/profile/details">
            <Button variant="outlined" size="lg">
              <Icon name="profile" size="md" />
              Go to Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

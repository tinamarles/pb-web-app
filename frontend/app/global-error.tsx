"use client";

// Global Error Page - Backend Error

import { Icon, Button } from "@/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-container">
          <div className="flex max-w-2xl flex-col items-center gap-2xl text-center">
            {/* Warning Icon */}
            <div className="flex items-center justify-center rounded-full bg-error-container p-hero">
              <Icon name="error" className="text-error" size="5xl" />
            </div>

            {/* Error Code */}
            <div className="display-lg text-error">500</div>

            {/* Heading */}
            <h1 className="headline-lg text-on-surface">
              Hey stupid, you gotta start your backend!!
            </h1>

            {/* Description */}
            <div className="body-lg text-on-surface-variant space-y-md">
              <p>Something went wrong on our end. This usually means:</p>
              <ul className="list-inside list-disc text-left">
                <li>Your Django backend isn&apos;t running</li>
                <li>The API server is unreachable</li>
                <li>There&apos;s a server-side configuration issue</li>
              </ul>
              <p className="body-sm text-on-surface-variant/70">
                Error digest: {error.digest || "N/A"}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-lg flex flex-wrap items-center justify-center gap-md">
              <Button variant="filled" size="lg" onClick={reset}>
                <Icon name="reset" />
                Try Again
              </Button>
              <Button
                variant="outlined"
                size="lg"
                onClick={() => (window.location.href = "/")}
              >
                <Icon name="Home" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

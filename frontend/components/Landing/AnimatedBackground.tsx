import { memo } from "react";
import {
  BluePickleball,
  YellowPickleball,
  OrangePickleball,
  GreenPickleball,
} from "./PickleballVariants";

export const AnimatedBackground = memo(
  function AnimatedBackground() {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large blue pickleball - top left */}
        <div className="absolute top-10 left-10 animate-spotlight-1 opacity-50">
          <div className="animate-spin-slow">
            <BluePickleball size={128} />
          </div>
        </div>

        {/* Medium yellow tournament ball - top right */}
        <div className="absolute top-1/3 right-20 animate-spotlight-2 opacity-60">
          <YellowPickleball size={96} />
        </div>

        {/* Small orange outdoor ball - bottom left */}
        <div className="absolute bottom-20 left-1/4 animate-spotlight-3 opacity-55">
          <OrangePickleball size={80} />
        </div>

        {/* Large blue ball - bottom right */}
        <div className="absolute bottom-10 right-10 animate-spotlight-4 opacity-40">
          <BluePickleball size={112} />
        </div>

        {/* Additional floating pickleballs for authentic court feel */}
        <div
          className="absolute top-1/2 left-1/2 animate-float opacity-30"
          style={{ animationDelay: "2s" }}
        >
          <GreenPickleball size={64} />
        </div>

        <div
          className="absolute top-20 right-1/3 animate-spotlight-1 opacity-45"
          style={{ animationDelay: "5s" }}
        >
          <YellowPickleball size={72} />
        </div>

        {/* Extra small balls for depth */}
        <div
          className="absolute top-3/4 left-1/6 animate-spotlight-2 opacity-25"
          style={{ animationDelay: "8s" }}
        >
          <OrangePickleball size={56} />
        </div>

        <div
          className="absolute top-1/6 left-2/3 animate-float opacity-35"
          style={{ animationDelay: "3s" }}
        >
          <BluePickleball size={48} />
        </div>
      </div>
    );
  },
);
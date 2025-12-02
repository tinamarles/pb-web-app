import { Icon } from "@/ui";

export function PlaceholderPage() {
  return (
    <div className="container border-primary items-center max-w-md mx-auto">
      
      <Icon
        name="construction"
        size="5xl"
        className="text-on-tertiary fill-tertiary"
        aria-hidden="true"
      />
      
      <h1 className="slogan-lg text-on-surface">Coming Soon!</h1>
      <p className="body-md text-on-surface-variant">
        This feature is currently under construction. 
      </p>  
      <p className="body-md text-secondary">Check back soon!</p>
    </div>
  );
}
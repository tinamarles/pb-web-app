import { Icon, Button } from "@/ui";

export interface EmptyStateProps {
  icon?: string; // Icon name from lucide-react
  title?: string; // Main message
  description?: string; // Secondary message
  actionLabel?: string; // Button text (optional)
  onAction?: () => void; // Button click handler (optional)
  href?: string;
  actionIcon?: string;
  className?: string;
}

export function EmptyState({
  icon = "Inbox",
  title,
  description,
  actionLabel,
  onAction,
  href,
  actionIcon,
  className = "",
}: EmptyStateProps) {
  const itemClasses =`empty-state p-sm ${className}`

  return (
    <div className={itemClasses}>
      <div className="flex gap-sm items-center">
        {icon && <Icon name={icon} size="md" />}
        {title && <h3 className="title-lg emphasized">{title}</h3>}
      </div>

      {description && <p className="body-md">{description}</p>}

      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          variant="outlined" 
          size ='sm' 
          className='mt-md'
          label={actionLabel} />
      )}
      {actionLabel && href && (
        <Button 
          variant='outlined' 
          size='sm' 
          href={href}
          icon={actionIcon}
          className='mt-md'
          label={actionLabel} />
      )}
    </div>
  );
}

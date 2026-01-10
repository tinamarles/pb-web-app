
import * as C from '@/lib/constants';
import { Badge } from '@/ui';

interface MembershipStatusBadgeProps {
  status: C.MembershipStatusValue;
  className?: string;
}

export function MembershipStatusBadge({ status, className = 'w-fit label-sm' }: MembershipStatusBadgeProps) {
  // Get the label
  const label = C.MembershipStatusLabels[status];
  const variant = C.MembershipStatusBadgeVariant[status] || 'default';
  
  return (
    
      <Badge 
        variant={variant} 
        icon={variant} 
        label={label} 
        className={className}
      />
  );
}
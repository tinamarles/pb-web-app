import { Metadata } from 'next';
import { OverviewPage } from '@/components/dashboard/overviewPage';
import { MembershipsPage } from '@/components/profile/membershipsPage';

export const metadata: Metadata = {  
  title: 'Memberships Page | PickleHub',  
  description: 'View all your Memberships and Subscriptions.',  
}

export default function ProfileMembershipsPage() {

  return (
    
        <MembershipsPage/>
    
  );
}

import { Metadata } from 'next';
import { OverviewPage } from '@/components/dashboard/overviewPage';


export const metadata: Metadata = {  
  title: 'Member Dashboard | PickleHub',  
  description: 'View your leagues, matches, and club activities.',  
}

export default function DashboardOverviewPage() {

  return (
    
        <OverviewPage/>
    
  );
}

import { Metadata } from 'next';
import { LeaguesPage } from '@/components/dashboard/leaguesPage';


export const metadata: Metadata = {  
  title: 'Dashboard Club Leagues | PickleHub',  
  description: 'View all Leagues of the Club.',  
}

export default function DashboardLeaguesPage() {

  return (
        <LeaguesPage />
  );
}
